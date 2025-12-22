import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { storage } from './storage.js';

const router = Router();

// Shared PaymentResult interface for consistency across gateways
export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  checkoutUrl?: string;
  redirectUrl?: string;
  sessionId?: string;
  status?: string;
  amount?: number;
  currency?: string;
  metadata?: Record<string, any>;
  error?: string;
}

/**
 * Resolve secret key - supports ENV: prefix for environment variables
 */
function resolveSecretKey(secretKey: string | null | undefined): string | null {
  if (!secretKey) return null;
  if (secretKey.startsWith('ENV:')) {
    const envVar = secretKey.substring(4);
    return process.env[envVar] || null;
  }
  return secretKey;
}

/**
 * Get VodaPay credentials from admin settings
 */
async function getVodaPayCredentials() {
  try {
    const vodapayGateway = await storage.getPaymentGateway('vodapay');
    
    if (vodapayGateway && vodapayGateway.isEnabled) {
      // Resolve secret key (supports ENV: prefix for environment variables)
      const apiKey = resolveSecretKey(vodapayGateway.secretKey);
      
      if (apiKey) {
        return {
          apiKey: apiKey,
          merchantId: vodapayGateway.publishableKey, // Using publishableKey field for merchant ID
          baseUrl: vodapayGateway.testMode 
            ? 'https://api.vodapaygatewayuat.vodacom.co.za/v2' 
            : 'https://api.vodapaygateway.vodacom.co.za/v2',
          testMode: vodapayGateway.testMode || false,
          webhookSecret: resolveSecretKey(vodapayGateway.webhookSecret)
        };
      }
    }

    return null;
  } catch (error) {
    console.error('Error getting VodaPay credentials:', error);
    return null;
  }
}

/**
 * Verify VodaPay webhook signature
 * VodaPay uses HMAC-SHA256 signature verification
 */
function verifyVodaPaySignature(payload: string, signature: string, secret: string): boolean {
  try {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload);
    const computedSignature = hmac.digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(computedSignature)
    );
  } catch (error) {
    console.error('VodaPay signature verification error:', error);
    return false;
  }
}

/**
 * Initialize VodaPay payment
 * POST /api/vodapay/initialize
 */
router.post('/initialize', async (req: Request, res: Response) => {
  try {
    const { amount, currency = 'ZAR', courseId, courseName, userEmail, returnUrl, cancelUrl } = req.body;

    if (!amount || !courseId) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required fields: amount and courseId' 
      } as PaymentResult);
    }

    const credentials = await getVodaPayCredentials();
    if (!credentials) {
      return res.status(503).json({ 
        success: false,
        error: 'VodaPay not configured. Please contact support.' 
      } as PaymentResult);
    }

    // Convert to ZAR if needed (VodaPay only supports ZAR)
    let zarAmount = amount;
    if (currency !== 'ZAR') {
      // Approximate exchange rate: 1 USD = 18 ZAR
      // In production, this should use a real exchange rate API
      const exchangeRate = 18;
      zarAmount = amount * exchangeRate;
      console.log(`💱 Converting ${amount} ${currency} to ${zarAmount} ZAR (rate: ${exchangeRate})`);
    }

    // Generate unique merchant reference
    const merchantReference = `vodapay_${courseId}_${Date.now()}`;

    // In test mode, return a simulated checkout URL for development
    if (credentials.testMode) {
      console.log('🧪 VodaPay test mode - simulating checkout session');
      
      const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
      const testCheckoutUrl = `${baseUrl}/payment-success?gateway=vodapay&session_id=${merchantReference}&test=true`;
      
      const result: PaymentResult = {
        success: true,
        paymentId: merchantReference,
        checkoutUrl: testCheckoutUrl,
        redirectUrl: testCheckoutUrl,
        sessionId: merchantReference,
        amount: zarAmount,
        currency: 'ZAR',
        metadata: {
          merchantReference,
          courseId,
          userEmail,
          originalAmount: amount,
          originalCurrency: currency,
          testMode: true,
        },
      };

      console.log('✅ VodaPay test checkout created:', merchantReference);
      return res.json(result);
    }

    // VodaPay API call to initialize payment
    // Using VodaPay Gateway v2 API
    const callbackUrl = returnUrl || `${process.env.BASE_URL || 'http://localhost:5000'}/payment-success?gateway=vodapay&courseId=${courseId}`;
    
    const requestBody = {
      amount: Math.round(zarAmount * 100), // Amount in cents (ZAR)
      currencyCode: '710', // ISO 4217 currency code for ZAR
      merchantId: credentials.merchantId || '',
      echoData: JSON.stringify({ courseId, userEmail, originalAmount: amount, originalCurrency: currency }),
      callbackUrl: callbackUrl,
      notificationUrl: `${process.env.BASE_URL || 'http://localhost:5000'}/api/vodapay/webhook`,
    };
    
    console.log('🔄 VodaPay API request:', { url: `${credentials.baseUrl}/payment/initiate`, body: { ...requestBody, merchantId: '***' } });
    
    const response = await fetch(`${credentials.baseUrl}/payment/initiate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': credentials.apiKey,
        'x-api-key': credentials.apiKey,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'API error' }));
      console.error('❌ VodaPay API error:', response.status, errorData);
      throw new Error(errorData.message || `VodaPay API error (${response.status})`);
    }

    const data = await response.json();

    console.log('✅ VodaPay payment initialized:', merchantReference);

    const result: PaymentResult = {
      success: true,
      paymentId: data.paymentId || merchantReference,
      checkoutUrl: data.checkoutUrl || data.paymentUrl,
      redirectUrl: data.checkoutUrl || data.paymentUrl,
      sessionId: merchantReference,
      amount: zarAmount,
      currency: 'ZAR',
      metadata: {
        merchantReference,
        courseId,
        userEmail,
        originalAmount: amount,
        originalCurrency: currency,
      },
    };

    return res.json(result);
  } catch (error: any) {
    console.error('❌ VodaPay initialization error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Failed to initialize VodaPay payment. Please try again or use another payment method.',
      metadata: { details: error.message }
    } as PaymentResult);
  }
});

/**
 * VodaPay webhook/callback handler with signature verification
 * POST /api/vodapay/webhook
 */
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const credentials = await getVodaPayCredentials();
    if (!credentials || !credentials.webhookSecret) {
      console.error('❌ VodaPay webhook secret not configured');
      return res.status(500).json({ error: 'Webhook not configured' });
    }

    // Verify webhook signature
    const signature = req.headers['x-vodapay-signature'] as string || '';
    const rawBody = (req as any).rawBody || JSON.stringify(req.body);

    if (!signature) {
      console.error('❌ VodaPay webhook missing signature');
      return res.status(401).json({ error: 'Missing signature' });
    }

    const isValid = verifyVodaPaySignature(rawBody, signature, credentials.webhookSecret);
    if (!isValid) {
      console.error('❌ VodaPay webhook signature verification failed');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    console.log('✅ VodaPay webhook signature verified');
    const payload = req.body;

    console.log('📥 VodaPay webhook received:', payload);

    const { status, merchantReference, paymentId, amount } = payload;

    switch (status) {
      case 'completed':
      case 'success':
        console.log('✅ VodaPay payment succeeded:', paymentId);
        // Complete course purchase
        if (payload.metadata?.courseId && payload.metadata?.userEmail) {
          try {
            // Find user by email
            const users = await storage.getAllAuthUsers();
            const user = users.find(u => u.email === payload.metadata.userEmail);
            
            if (user) {
              // Record purchase (amount is in ZAR cents, need to convert)
              await storage.recordPurchase({
                userId: user.id,
                courseId: payload.metadata.courseId,
                paymentIntentId: paymentId,
                amount: amount / 100 / 18, // Convert ZAR cents to USD (approximate)
                paymentMethod: 'vodapay',
              });
              console.log('✅ Course purchase recorded successfully');
            } else {
              console.error('❌ User not found:', payload.metadata.userEmail);
            }
          } catch (error) {
            console.error('❌ Failed to record purchase:', error);
          }
        }
        break;

      case 'failed':
      case 'cancelled':
        console.log('❌ VodaPay payment failed/cancelled:', paymentId);
        // Payment failed/cancelled, no action needed
        break;

      case 'pending':
        console.log('⏳ VodaPay payment pending:', paymentId);
        break;

      default:
        console.log('ℹ️ VodaPay status:', status);
    }

    return res.json({ received: true });
  } catch (error: any) {
    console.error('❌ VodaPay webhook error:', error);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * Verify VodaPay payment status
 * GET /api/vodapay/verify/:paymentId
 */
router.get('/verify/:paymentId', async (req: Request, res: Response) => {
  try {
    const { paymentId } = req.params;

    const credentials = await getVodaPayCredentials();
    if (!credentials) {
      return res.status(503).json({ 
        success: false,
        error: 'VodaPay not configured' 
      } as PaymentResult);
    }

    // Query VodaPay API for payment status
    const response = await fetch(`${credentials.baseUrl}/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${credentials.apiKey}`,
        'X-Merchant-Id': credentials.merchantId || '',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to verify payment');
    }

    const data = await response.json();

    const result: PaymentResult = {
      success: true,
      paymentId: data.paymentId || paymentId,
      status: data.status,
      amount: data.amount / 100, // Convert from cents
      currency: data.currency || 'ZAR',
      metadata: {
        merchantReference: data.merchantReference,
      },
    };

    return res.json(result);
  } catch (error: any) {
    console.error('❌ VodaPay verification error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Payment verification failed',
      metadata: { details: error.message }
    } as PaymentResult);
  }
});

export default router;
