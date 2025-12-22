import { Router } from 'express';
import Stripe from 'stripe';
import { db } from './db.js';
import { certificatePurchases, certificates, users, courses, profiles } from '@shared/schema';
import { eq, and, sql } from 'drizzle-orm';
import { requireAuth } from './middleware/auth.js';
import { generateCertificateWithCertifier } from './utils/certifier-certificate-generator.js';

const router = Router();

// Initialize Stripe - using the same key as other payment routes
const getStripe = async () => {
  // Get Stripe key from environment or payment gateway settings
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  
  if (!stripeSecretKey) {
    throw new Error('Stripe is not configured');
  }
  
  return new Stripe(stripeSecretKey, {
    apiVersion: '2024-11-20.acacia' as any,
  });
};

// Create payment intent for certificate purchase
router.post('/api/certificates/create-payment-intent', requireAuth, async (req, res) => {
  try {
    const { courseId, certificateType, amount } = req.body;
    const user = (req as any).user;

    if (!courseId || !certificateType || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate certificate type and amount
    const validTypes = ['soft_copy', 'hard_copy'];
    const validPrices = { soft_copy: 7.99, hard_copy: 25.99 };

    if (!validTypes.includes(certificateType)) {
      return res.status(400).json({ error: 'Invalid certificate type' });
    }

    if (Math.abs(amount - validPrices[certificateType as keyof typeof validPrices]) > 0.01) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // Check if user has already purchased this certificate
    const existingPurchase = await db.query.certificatePurchases.findFirst({
      where: (certificatePurchases, { and, eq }) => and(
        eq(certificatePurchases.userId, user.id),
        eq(certificatePurchases.courseId, courseId),
        eq(certificatePurchases.paymentStatus, 'completed')
      ),
    });

    if (existingPurchase) {
      return res.status(400).json({ error: 'You have already purchased this certificate' });
    }

    // Get course info
    const course = await db.query.courses.findFirst({
      where: eq(courses.id, courseId),
    });

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const stripe = await getStripe();

    // Create or get Stripe customer
    let stripeCustomerId = user.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user.id,
        },
      });
      stripeCustomerId = customer.id;
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      customer: stripeCustomerId,
      metadata: {
        userId: user.id,
        courseId,
        certificateType,
        type: 'certificate_purchase',
      },
      description: `${certificateType === 'soft_copy' ? 'Digital' : 'Physical'} Certificate - ${course.title}`,
    });

    // Store purchase record with pending status
    await db.insert(certificatePurchases).values({
      userId: user.id,
      courseId,
      certificateType,
      amount: amount.toString(),
      paymentIntentId: paymentIntent.id,
      paymentStatus: 'pending',
      stripeCustomerId,
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error: any) {
    console.error('Create payment intent error:', error);
    res.status(500).json({ error: error.message || 'Failed to create payment intent' });
  }
});

// Confirm payment and generate certificate
router.post('/api/certificates/confirm-payment', requireAuth, async (req, res) => {
  try {
    const { paymentIntentId, shippingAddress } = req.body;
    const user = (req as any).user;

    if (!paymentIntentId) {
      return res.status(400).json({ error: 'Missing payment intent ID' });
    }

    // Verify payment intent belongs to current user and get purchase details
    const purchaseRecord = await db.query.certificatePurchases.findFirst({
      where: (certificatePurchases, { and, eq }) => and(
        eq(certificatePurchases.paymentIntentId, paymentIntentId),
        eq(certificatePurchases.userId, user.id)
      ),
    });

    if (!purchaseRecord) {
      return res.status(403).json({ error: 'Unauthorized: Purchase record not found or does not belong to you' });
    }

    // Prevent double completion
    if (purchaseRecord.paymentStatus === 'completed') {
      return res.status(400).json({ error: 'This purchase has already been completed' });
    }

    // Verify payment with Stripe
    const stripe = await getStripe();
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ error: 'Payment not completed' });
    }

    // Additional security check: verify metadata matches
    if (paymentIntent.metadata?.userId && paymentIntent.metadata.userId !== user.id) {
      return res.status(403).json({ error: 'Unauthorized: Payment intent user mismatch' });
    }

    // Use courseId and certificateType from the stored purchase record, not client input
    const courseId = purchaseRecord.courseId;
    const certificateType = purchaseRecord.certificateType;

    // Update purchase record
    await db.update(certificatePurchases)
      .set({
        paymentStatus: 'completed',
        shippingAddress: shippingAddress || null,
        updatedAt: new Date(),
      })
      .where(eq(certificatePurchases.paymentIntentId, paymentIntentId));

    // Check if certificate already exists
    const existingCertificate = await db.query.certificates.findFirst({
      where: (certificates, { and, eq }) => and(
        eq(certificates.userId, user.id),
        eq(certificates.courseId, courseId),
        eq(certificates.isRevoked, false)
      ),
    });

    if (existingCertificate) {
      // Link existing certificate to purchase
      await db.update(certificatePurchases)
        .set({ certificateId: existingCertificate.id })
        .where(eq(certificatePurchases.paymentIntentId, paymentIntentId));

      return res.json({
        success: true,
        certificate: existingCertificate,
      });
    }

    // Generate certificate
    const course = await db.query.courses.findFirst({
      where: eq(courses.id, courseId),
    });

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Get user profile for student name
    const profile = await db.query.profiles.findFirst({
      where: (profiles, { eq }) => eq(profiles.userId, user.id),
    });

    const studentName = profile?.name || user.email;
    const certificateTypeName = (course.certificationType as 'certificate' | 'diploma') || 'certificate';
    const verificationCode = Math.random().toString(36).substring(2, 15).toUpperCase();

    // Generate certificate using Certifier API
    const { certificateUrl, certifierId, certifierGroupId } = await generateCertificateWithCertifier({
      studentName,
      studentEmail: user.email,
      courseTitle: course.title,
      courseDescription: course.description || '',
      completionDate: new Date(),
      certificateType: certificateTypeName,
      verificationCode,
    });

    // Create certificate in database
    const [newCertificate] = await db.insert(certificates).values({
      userId: user.id,
      courseId: course.id,
      studentName,
      studentEmail: user.email,
      courseTitle: course.title,
      courseDescription: course.description,
      verificationCode,
      completionDate: new Date(),
      certificateUrl,
      certifierId,
      certifierGroupId,
      certificateType: certificateTypeName,
    }).returning();

    // Link certificate to purchase
    await db.update(certificatePurchases)
      .set({ certificateId: newCertificate.id })
      .where(eq(certificatePurchases.paymentIntentId, paymentIntentId));

    console.log(`✅ Certificate generated after payment for user ${user.email}`);

    // Generate and send PDF receipt
    try {
      const { ReceiptService } = await import('./services/receipts.js');
      const profile = await db.query.profiles.findFirst({
        where: (profiles, { eq }) => eq(profiles.userId, user.id),
      });
      
      await ReceiptService.generateAndSendCertificateReceipt({
        purchaseId: purchaseRecord.id,
        userId: user.id,
        userEmail: user.email,
        userName: profile?.name || undefined,
        courseTitle: course.title,
        certificateType: certificateType as 'soft_copy' | 'hard_copy',
        amount: parseFloat(purchaseRecord.amount),
        currency: 'USD',
        paymentMethod: 'Card',
      });
      console.log('📄 Certificate receipt (card) sent to:', user.email);
    } catch (receiptError) {
      console.error('Failed to send certificate receipt:', receiptError);
    }

    res.json({
      success: true,
      certificate: newCertificate,
    });
  } catch (error: any) {
    console.error('Confirm payment error:', error);
    res.status(500).json({ error: error.message || 'Failed to confirm payment' });
  }
});

// Purchase certificate with wallet
router.post('/api/certificates/purchase-with-wallet', requireAuth, async (req, res) => {
  try {
    const { courseId, certificateType, shippingAddress } = req.body;
    const user = (req as any).user;

    if (!courseId || !certificateType || req.body.amount === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Parse and validate amount as a number
    const amount = parseFloat(req.body.amount);
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // Validate certificate type and amount
    const validTypes = ['soft_copy', 'hard_copy'];
    const validPrices = { soft_copy: 7.99, hard_copy: 25.99 };

    if (!validTypes.includes(certificateType)) {
      return res.status(400).json({ error: 'Invalid certificate type' });
    }

    if (Math.abs(amount - validPrices[certificateType as keyof typeof validPrices]) > 0.01) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // Get course info first
    const course = await db.query.courses.findFirst({
      where: eq(courses.id, courseId),
    });

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Check if certificate already exists (outside transaction)
    const existingCertificate = await db.query.certificates.findFirst({
      where: (certificates, { and, eq }) => and(
        eq(certificates.userId, user.id),
        eq(certificates.courseId, courseId),
        eq(certificates.isRevoked, false)
      ),
    });

    const transactionId = `wallet-cert-${Date.now()}`;
    const certificateFormatDescription = certificateType === 'soft_copy' ? 'Digital' : 'Physical';
    const { shopCustomers, shopTransactions } = await import('@shared/schema');
    
    // Perform wallet deduction and record keeping in a transaction (without external API calls)
    let shopCustomerId: string;
    await db.transaction(async (tx) => {
      // Check for duplicate purchase inside transaction to prevent concurrent double-charge
      const existingPurchase = await tx.query.certificatePurchases.findFirst({
        where: (certificatePurchases, { and, eq, inArray }) => and(
          eq(certificatePurchases.userId, user.id),
          eq(certificatePurchases.courseId, courseId),
          inArray(certificatePurchases.paymentStatus, ['completed', 'processing'])
        ),
      });

      if (existingPurchase) {
        throw new Error('You have already purchased or are currently purchasing this certificate');
      }

      // Read wallet balance inside transaction to prevent race conditions
      const shopCustomer = await tx.query.shopCustomers.findFirst({
        where: (shopCustomers, { eq }) => eq(shopCustomers.userId, user.id),
      });

      if (!shopCustomer) {
        throw new Error('Wallet not found. Please set up your shop account first.');
      }

      shopCustomerId = shopCustomer.id;
      const currentBalance = parseFloat(shopCustomer.walletBalance || '0');

      if (currentBalance < amount) {
        throw new Error(`Insufficient wallet balance. You have $${currentBalance.toFixed(2)}, but need $${amount.toFixed(2)}.`);
      }

      // Deduct from wallet atomically using SQL expression to prevent race conditions
      const updateResult = await tx.update(shopCustomers)
        .set({
          walletBalance: sql`${shopCustomers.walletBalance} - ${amount}`,
          updatedAt: new Date(),
        })
        .where(and(
          eq(shopCustomers.userId, user.id),
          sql`${shopCustomers.walletBalance} >= ${amount}`
        ))
        .returning();

      // Verify the update succeeded (balance was sufficient)
      if (updateResult.length === 0) {
        throw new Error('Insufficient wallet balance or concurrent update conflict. Please try again.');
      }

      // Create purchase record with 'processing' status (will be updated to 'completed' after certificate is ready)
      await tx.insert(certificatePurchases).values({
        userId: user.id,
        courseId,
        certificateType,
        amount: amount.toString(),
        paymentIntentId: transactionId,
        paymentStatus: existingCertificate ? 'completed' : 'processing',
        shippingAddress: shippingAddress || null,
        certificateId: existingCertificate?.id || null,
      });

      // Record wallet transaction for bookkeeping
      await tx.insert(shopTransactions).values({
        customerId: shopCustomer.id,
        amount: (-amount).toFixed(2), // Negative amount for deduction
        type: 'purchase',
        description: `Certificate purchase: ${certificateFormatDescription} - ${course.title}`,
        status: 'completed',
        referenceId: transactionId,
      });
    });

    let certificateToReturn = existingCertificate;

    // Generate certificate outside transaction if needed (to avoid long-running transactions)
    if (!existingCertificate) {
      try {
        // Get user profile for student name
        const profile = await db.query.profiles.findFirst({
          where: (profiles, { eq }) => eq(profiles.userId, user.id),
        });

        const studentName = profile?.name || user.email;
        const certificateTypeName = (course.certificationType as 'certificate' | 'diploma') || 'certificate';
        const verificationCode = Math.random().toString(36).substring(2, 15).toUpperCase();

        // Generate certificate using Certifier API (external call outside transaction)
        const { certificateUrl, certifierId, certifierGroupId } = await generateCertificateWithCertifier({
          studentName,
          studentEmail: user.email,
          courseTitle: course.title,
          courseDescription: course.description || '',
          completionDate: new Date(),
          certificateType: certificateTypeName,
          verificationCode,
        });

        // Create certificate in database
        const [newCertificate] = await db.insert(certificates).values({
          userId: user.id,
          courseId: course.id,
          studentName,
          studentEmail: user.email,
          courseTitle: course.title,
          courseDescription: course.description,
          verificationCode,
          completionDate: new Date(),
          certificateUrl,
          certifierId,
          certifierGroupId,
          certificateType: certificateTypeName,
        }).returning();

        // Update purchase with certificate ID and mark as completed
        await db.update(certificatePurchases)
          .set({ 
            certificateId: newCertificate.id,
            paymentStatus: 'completed'
          })
          .where(and(
            eq(certificatePurchases.userId, user.id),
            eq(certificatePurchases.paymentIntentId, transactionId)
          ));

        certificateToReturn = newCertificate;
      } catch (certError: any) {
        // Certificate generation failed after wallet deduction
        // Refund the wallet and mark purchase as failed
        console.error('Certificate generation failed after wallet deduction:', certError);
        
        try {
          // Refund wallet in a transaction
          await db.transaction(async (tx) => {
            // Refund the wallet atomically
            await tx.update(shopCustomers)
              .set({
                walletBalance: sql`${shopCustomers.walletBalance} + ${amount}`,
                updatedAt: new Date(),
              })
              .where(eq(shopCustomers.userId, user.id));

            // Record refund transaction
            await tx.insert(shopTransactions).values({
              customerId: shopCustomerId,
              amount: amount.toFixed(2), // Positive amount for refund
              type: 'refund',
              description: `Refund for failed certificate generation - ${course.title} (Ref: ${transactionId})`,
              status: 'completed',
              referenceId: `refund-${transactionId}`,
            });

            // Mark purchase as failed
            await tx.update(certificatePurchases)
              .set({ paymentStatus: 'failed' })
              .where(and(
                eq(certificatePurchases.userId, user.id),
                eq(certificatePurchases.paymentIntentId, transactionId)
              ));
          });

          return res.status(500).json({ 
            error: 'Certificate generation failed. Your wallet has been refunded automatically.',
            refunded: true
          });
        } catch (refundError: any) {
          // Refund failed - critical issue
          console.error('Critical: Refund failed after certificate generation failure:', refundError);
          return res.status(500).json({ 
            error: 'Payment processed but certificate generation failed. Refund attempt also failed. Please contact support immediately with reference: ' + transactionId,
            transactionId,
            refunded: false
          });
        }
      }
    }

    console.log(`✅ Certificate purchased with wallet for user ${user.email}`);

    // Generate and send PDF receipt
    try {
      const { ReceiptService } = await import('./services/receipts.js');
      const profile = await db.query.profiles.findFirst({
        where: (profiles, { eq }) => eq(profiles.userId, user.id),
      });
      
      await ReceiptService.generateAndSendCertificateReceipt({
        purchaseId: transactionId,
        userId: user.id,
        userEmail: user.email,
        userName: profile?.name || undefined,
        courseTitle: course.title,
        certificateType: certificateType as 'soft_copy' | 'hard_copy',
        amount: amount,
        currency: 'USD',
        paymentMethod: 'Wallet',
      });
      console.log('📄 Certificate receipt (wallet) sent to:', user.email);
    } catch (receiptError) {
      console.error('Failed to send certificate receipt:', receiptError);
    }

    res.json({
      success: true,
      certificate: certificateToReturn,
      transactionId,
    });
  } catch (error: any) {
    console.error('Wallet purchase error:', error);
    res.status(500).json({ error: error.message || 'Failed to process wallet payment' });
  }
});

// Get certificate purchase status
router.get('/api/certificates/purchase-status/:courseId', requireAuth, async (req, res) => {
  try {
    const { courseId } = req.params;
    const user = (req as any).user;

    const purchase = await db.query.certificatePurchases.findFirst({
      where: (certificatePurchases, { and, eq }) => and(
        eq(certificatePurchases.userId, user.id),
        eq(certificatePurchases.courseId, courseId)
      ),
    });

    if (!purchase) {
      return res.json({ purchased: false });
    }

    res.json({
      purchased: purchase.paymentStatus === 'completed',
      certificateType: purchase.certificateType,
      certificateId: purchase.certificateId,
    });
  } catch (error: any) {
    console.error('Get purchase status error:', error);
    res.status(500).json({ error: 'Failed to get purchase status' });
  }
});

export default router;
