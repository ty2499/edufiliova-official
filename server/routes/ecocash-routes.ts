import { Router, Request, Response } from 'express';
import { chargeSubscriber, checkTransactionStatus, refundTransaction, isEcoCashEnabled } from '../services/ecocash.js';
import { storage } from '../storage.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

interface EcoCashPaymentRequest {
  phoneNumber: string;
  amount: number;
  description?: string;
  orderId?: string;
  userId?: string;
  itemType?: 'course' | 'product' | 'subscription' | 'voucher';
  itemId?: string;
  metadata?: Record<string, any>;
}

router.get('/ecocash/status', async (req: Request, res: Response) => {
  try {
    const isEnabled = await isEcoCashEnabled();
    const isZimbabwe = req.userLocation?.country === 'ZW';
    
    res.json({
      enabled: isEnabled,
      available: isEnabled && isZimbabwe,
      country: req.userLocation?.country,
      message: isEnabled 
        ? (isZimbabwe ? 'EcoCash is available for payments' : 'EcoCash is only available in Zimbabwe')
        : 'EcoCash is not configured'
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to check EcoCash status' });
  }
});

router.post('/ecocash/initiate', async (req: Request, res: Response) => {
  try {
    const { phoneNumber, amount, description, orderId, userId, itemType, itemId, metadata } = req.body as EcoCashPaymentRequest;

    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    const isEnabled = await isEcoCashEnabled();
    if (!isEnabled) {
      return res.status(400).json({ error: 'EcoCash payments are not available' });
    }

    const paymentOrderId = orderId || `ECO-${uuidv4().substring(0, 8).toUpperCase()}`;

    console.log(`📱 EcoCash: Initiating payment for ${phoneNumber}, $${amount}, Order: ${paymentOrderId}`);

    const result = await chargeSubscriber(
      phoneNumber,
      amount,
      paymentOrderId,
      description || 'EduFiliova Purchase'
    );

    if (!result.success) {
      return res.status(400).json({ 
        success: false, 
        error: result.error || 'Payment initiation failed' 
      });
    }

    try {
      await storage.createEcoCashTransaction({
        id: uuidv4(),
        orderId: paymentOrderId,
        clientCorrelator: result.clientCorrelator!,
        transactionId: result.transactionId,
        phoneNumber: phoneNumber,
        amount: amount.toString(),
        status: 'pending',
        userId: userId,
        itemType: itemType,
        itemId: itemId,
        metadata: metadata,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    } catch (dbError) {
      console.log('Note: EcoCash transaction table may not exist yet, continuing...');
    }

    res.json({
      success: true,
      orderId: paymentOrderId,
      clientCorrelator: result.clientCorrelator,
      transactionId: result.transactionId,
      status: result.status,
      message: result.message || 'Please check your phone for the EcoCash payment prompt',
      instructions: [
        'A payment prompt will appear on your phone',
        'Enter your EcoCash PIN to confirm the payment',
        'Wait for confirmation before closing this page'
      ]
    });
  } catch (error: any) {
    console.error('❌ EcoCash initiate error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to initiate payment' 
    });
  }
});

router.post('/ecocash/check-status', async (req: Request, res: Response) => {
  try {
    const { phoneNumber, clientCorrelator, orderId } = req.body;

    if (!phoneNumber || !clientCorrelator) {
      return res.status(400).json({ error: 'Phone number and client correlator are required' });
    }

    const result = await checkTransactionStatus(phoneNumber, clientCorrelator);

    if (result.success) {
      try {
        await storage.updateEcoCashTransaction(orderId || clientCorrelator, {
          status: 'completed',
          transactionId: result.transactionId,
          updatedAt: new Date()
        });
      } catch (dbError) {
        console.log('Note: Could not update transaction record');
      }
    }

    res.json({
      success: result.success,
      status: result.status,
      transactionId: result.transactionId,
      amount: result.amount,
      message: result.message
    });
  } catch (error: any) {
    console.error('❌ EcoCash status check error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to check payment status' 
    });
  }
});

router.post('/ecocash/webhook', async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    
    console.log('📱 EcoCash Webhook received:', JSON.stringify(payload, null, 2));

    const {
      clientCorrelator,
      serverReferenceCode,
      paymentStatus,
      status,
      amount,
      subscriberMsisdn,
      referenceCode
    } = payload;

    const transactionStatus = paymentStatus || status;
    const isSuccess = ['COMPLETED', 'SUCCESSFUL', 'SUCCESS'].includes(transactionStatus?.toUpperCase());

    try {
      const transaction = await storage.getEcoCashTransactionByCorrelator(clientCorrelator);
      
      if (transaction) {
        await storage.updateEcoCashTransaction(transaction.orderId, {
          status: isSuccess ? 'completed' : 'failed',
          transactionId: serverReferenceCode,
          updatedAt: new Date()
        });

        if (isSuccess && transaction.itemType && transaction.itemId && transaction.userId) {
          console.log(`✅ EcoCash: Processing ${transaction.itemType} purchase for user ${transaction.userId}`);
          
          switch (transaction.itemType) {
            case 'course':
              await storage.createEnrollment({
                id: uuidv4(),
                courseId: transaction.itemId,
                userId: transaction.userId,
                paymentStatus: 'paid',
                paymentMethod: 'ecocash',
                amountPaid: transaction.amount,
                enrolledAt: new Date()
              });
              break;
            case 'product':
              break;
            case 'subscription':
              break;
          }
        }
      }
    } catch (dbError) {
      console.error('Error processing webhook:', dbError);
    }

    res.status(200).json({ received: true, status: transactionStatus });
  } catch (error: any) {
    console.error('❌ EcoCash webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

router.post('/ecocash/refund', async (req: Request, res: Response) => {
  try {
    const { phoneNumber, transactionId, amount, reason } = req.body;

    if (!phoneNumber || !transactionId || !amount) {
      return res.status(400).json({ error: 'Phone number, transaction ID, and amount are required' });
    }

    const result = await refundTransaction(phoneNumber, transactionId, amount, reason);

    res.json({
      success: result.success,
      transactionId: result.transactionId,
      status: result.status,
      message: result.message || result.error
    });
  } catch (error: any) {
    console.error('❌ EcoCash refund error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to process refund' 
    });
  }
});

router.post('/ecocash/purchase-course', async (req: Request, res: Response) => {
  try {
    const { phoneNumber, courseId, couponCode } = req.body;
    const userId = (req as any).userId;

    if (!phoneNumber || !courseId) {
      return res.status(400).json({ error: 'Phone number and course ID are required' });
    }

    const course = await storage.getCourse(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    let finalPrice = parseFloat(course.price?.toString() || '0');

    if (couponCode) {
      const coupon = await storage.getCouponByCode(couponCode);
      if (coupon && coupon.isActive) {
        if (coupon.discountType === 'percentage') {
          const discount = (finalPrice * coupon.discountValue) / 100;
          finalPrice = Math.max(finalPrice - (coupon.maxDiscount ? Math.min(discount, coupon.maxDiscount) : discount), 0);
        } else {
          finalPrice = Math.max(finalPrice - coupon.discountValue, 0);
        }
      }
    }

    const orderId = `ECO-COURSE-${Date.now().toString(36).toUpperCase()}`;

    const result = await chargeSubscriber(
      phoneNumber,
      finalPrice,
      orderId,
      `Course: ${course.title}`
    );

    if (!result.success) {
      return res.status(400).json({ 
        success: false, 
        error: result.error || 'Payment initiation failed' 
      });
    }

    try {
      await storage.createEcoCashTransaction({
        id: uuidv4(),
        orderId: orderId,
        clientCorrelator: result.clientCorrelator!,
        transactionId: result.transactionId,
        phoneNumber: phoneNumber,
        amount: finalPrice.toString(),
        status: 'pending',
        userId: userId,
        itemType: 'course',
        itemId: courseId,
        metadata: { courseTitle: course.title, couponCode },
        createdAt: new Date(),
        updatedAt: new Date()
      });
    } catch (dbError) {
      console.log('Note: Could not save transaction record');
    }

    res.json({
      success: true,
      orderId: orderId,
      clientCorrelator: result.clientCorrelator,
      amount: finalPrice,
      course: {
        id: course.id,
        title: course.title
      },
      message: result.message || 'Please check your phone for the EcoCash payment prompt'
    });
  } catch (error: any) {
    console.error('❌ EcoCash course purchase error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to process course purchase' 
    });
  }
});

export default router;
