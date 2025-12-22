import { Router, Request, Response } from 'express';
import DodoPayments from 'dodopayments';
import { Webhook } from 'standardwebhooks';
import { storage } from './storage.js';
import { db } from './db.js';
import { userSubscriptions, profiles, pricingPlans, users } from '../shared/schema.js';
import { eq, and } from 'drizzle-orm';

const router = Router();

// Cache for DoDo Pay instance
let dodoPaymentsInstance: DodoPayments | null = null;
let lastDodoUpdate: Date | null = null;
const CACHE_TTL = 60000; // 1 minute cache

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
 * Get DoDo Pay instance with admin-configured credentials
 */
async function getDodoPayInstance(): Promise<DodoPayments | null> {
  try {
    // Check cache
    if (dodoPaymentsInstance && lastDodoUpdate) {
      const cacheAge = Date.now() - lastDodoUpdate.getTime();
      if (cacheAge < CACHE_TTL) {
        return dodoPaymentsInstance;
      }
    }

    // Get from admin settings
    const dodoGateway = await storage.getPaymentGateway('dodopay');
    
    if (dodoGateway && dodoGateway.isEnabled) {
      // Resolve secret key (supports ENV: prefix for environment variables)
      const secretKey = resolveSecretKey(dodoGateway.secretKey);
      
      if (secretKey) {
        console.log('✅ Using DoDo Pay with admin-configured credentials');
        
        dodoPaymentsInstance = new DodoPayments({
          bearerToken: secretKey,
          environment: dodoGateway.testMode ? 'test_mode' : 'live_mode',
        });
        
        lastDodoUpdate = new Date();
        return dodoPaymentsInstance;
      }
    }

    console.warn('⚠️ DoDo Pay not configured in admin settings');
    return null;
  } catch (error) {
    console.error('Error initializing DoDo Pay:', error);
    return null;
  }
}

/**
 * Check if DoDo Pay is in test mode
 */
async function isDodoPayTestMode(): Promise<boolean> {
  try {
    const dodoGateway = await storage.getPaymentGateway('dodopay');
    return dodoGateway?.testMode || false;
  } catch {
    return false;
  }
}

/**
 * Create DoDo Pay checkout session
 * Supports dynamic products - no need to pre-create products in Dodo dashboard
 * POST /api/dodopay/checkout-session
 */
router.post('/checkout-session', async (req: Request, res: Response) => {
  try {
    const { 
      amount, 
      currency = 'USD', 
      courseId, 
      courseName, 
      userEmail, 
      userName, 
      returnUrl,
      // Additional fields for dynamic products
      productName,
      productDescription,
      productType = 'course', // course, product, membership, etc.
    } = req.body;

    if (!amount) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required field: amount' 
      } as PaymentResult);
    }
    
    // Generate a unique item ID if not provided
    const itemId = courseId || `item_${Date.now()}`;
    const itemName = productName || courseName || `Purchase ${itemId}`;

    // Check if we're in test mode
    const testMode = await isDodoPayTestMode();
    
    // In test mode, return a simulated checkout URL for development
    if (testMode) {
      const merchantReference = `dodopay_${courseId}_${Date.now()}`;
      console.log('🧪 DodoPay test mode - simulating checkout session');
      
      // Use BASE_URL from env, or construct from request headers
      let baseUrl = process.env.BASE_URL;
      if (!baseUrl) {
        const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
        const host = req.headers['x-forwarded-host'] || req.headers.host;
        baseUrl = `${protocol}://${host}`;
      }
      const testCheckoutUrl = `${baseUrl}/payment-success?gateway=dodopay&session_id=${merchantReference}&test=true`;
      
      const result: PaymentResult = {
        success: true,
        paymentId: merchantReference,
        checkoutUrl: testCheckoutUrl,
        redirectUrl: testCheckoutUrl,
        sessionId: merchantReference,
        amount: amount,
        currency: currency,
        metadata: {
          courseId,
          userName,
          userEmail,
          testMode: true,
        },
      };

      console.log('✅ DodoPay test checkout created:', merchantReference);
      return res.json(result);
    }

    const dodo = await getDodoPayInstance();
    if (!dodo) {
      return res.status(503).json({ 
        success: false,
        error: 'DoDo Pay not configured. Please contact support.' 
      } as PaymentResult);
    }

    // Construct return URL for after payment
    let baseUrl = process.env.BASE_URL;
    if (!baseUrl) {
      const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
      const host = req.headers['x-forwarded-host'] || req.headers.host;
      baseUrl = `${protocol}://${host}`;
    }
    const successReturnUrl = `${baseUrl}/payment-success?gateway=dodopay`;

    // DodoPay checkout with automatic product creation 
    // Note: Product creation must include all required fields per DodoPay API v2.x
    console.log(`🛒 Creating checkout session in DodoPay for ${itemName}...`);
    
    // Build request with product_cart (DodoPay requires product_id to already exist or be auto-created)
    // Since product creation has issues with the API, we'll let DodoPay handle inline product logic
    const checkoutRequest: any = {
      product_cart: [
        {
          product_id: itemId,
          quantity: 1,
        }
      ],
      customer_email: userEmail || 'customer@example.com',
      customer_name: userName || 'Customer',
      billing_address: {
        city: 'Unknown',
        country: 'US',
        state: 'Unknown',
        street: 'Unknown',
        postal_code: '00000',
      },
      metadata: {
        itemId: itemId,
        itemName: itemName,
        productType: productType,
        userId: userEmail,
        amount: String(amount),
        currency: currency,
        source: 'edufiliova_checkout',
      },
      return_url: successReturnUrl,
    };

    // Try to create checkout session
    let checkoutSession: any;
    try {
      checkoutSession = await dodo.checkoutSessions.create(checkoutRequest);
    } catch (error: any) {
      // If product doesn't exist, pre-create it with all required fields
      if (error?.message?.includes('does not exist')) {
        console.log(`⚠️ Product ${itemId} not found, attempting to create...`);
        try {
          // Create product with ALL required fields including price
          await dodo.products.create({
            product_id: itemId,
            name: itemName,
            description: `${productType} - ${itemName}`,
            type: 'digital',
            tax_category: 'digital_products',
            price: Math.round(amount * 100), // Convert to cents (DodoPay expects integer in smallest currency unit)
            currency: currency,
          } as any);
          // Retry checkout session
          checkoutSession = await dodo.checkoutSessions.create(checkoutRequest);
        } catch (createError: any) {
          console.error(`Failed to create product: ${createError?.message}`);
          throw error; // Throw original error
        }
      } else {
        throw error;
      }
    }

    // Handle different response formats from DodoPay SDK (session ID and URL)
    const sessionId = checkoutSession?.checkout_session_id || checkoutSession?.id;
    const checkoutUrl = checkoutSession?.checkout_url || checkoutSession?.url || (sessionId ? `https://checkout.dodopayments.com/${sessionId}` : null);

    if (!sessionId || !checkoutUrl) {
      console.error('❌ DodoPay response missing fields:', checkoutSession);
      throw new Error('Failed to retrieve session ID or checkout URL from DodoPay response');
    }

    console.log('✅ DoDo Pay checkout session created:', sessionId);

    const result: PaymentResult = {
      success: true,
      paymentId: sessionId,
      checkoutUrl: checkoutUrl,
      redirectUrl: checkoutUrl,
      sessionId: sessionId,
      amount: amount,
      currency: currency,
      metadata: {
        itemId,
        itemName,
        productType,
        userName,
        userEmail,
      },
    };

    return res.json(result);
  } catch (error: any) {
    console.error('❌ DoDo Pay session creation error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Failed to create DodoPay payment session. Please try again or use another payment method.',
      metadata: { details: error.message }
    } as PaymentResult);
  }
});

/**
 * DoDo Pay webhook handler with signature verification
 * POST /api/dodopay/webhook
 */
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    // Get webhook secret from admin settings
    const dodoGateway = await storage.getPaymentGateway('dodopay');
    const webhookSecret = resolveSecretKey(dodoGateway?.webhookSecret);
    
    if (!webhookSecret) {
      console.error('❌ DoDo Pay webhook secret not configured');
      return res.status(500).json({ error: 'Webhook not configured' });
    }

    // Verify webhook signature using standardwebhooks library (DoDo Pay's recommended method)
    const webhook = new Webhook(webhookSecret);
    const rawBody = (req as any).rawBody || JSON.stringify(req.body);
    
    const webhookHeaders = {
      'webhook-id': req.headers['webhook-id'] as string || '',
      'webhook-signature': req.headers['webhook-signature'] as string || '',
      'webhook-timestamp': req.headers['webhook-timestamp'] as string || '',
    };

    // Verify signature
    try {
      await webhook.verify(rawBody, webhookHeaders);
      console.log('✅ DoDo Pay webhook signature verified');
    } catch (verifyError) {
      console.error('❌ DoDo Pay webhook signature verification failed:', verifyError);
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const payload = req.body;
    console.log('📥 DoDo Pay webhook received:', payload.event_type);

    switch (payload.event_type) {
      case 'payment.succeeded':
        const paymentData = payload.data;
        console.log('✅ Payment succeeded:', paymentData.payment_id);
        
        // Complete course purchase
        if (paymentData.metadata?.courseId && paymentData.metadata?.userId) {
          console.log('📝 Completing course purchase:', paymentData.metadata.courseId);
          try {
            // Find user by email
            const users = await storage.getAllAuthUsers();
            const user = users.find(u => u.email === paymentData.metadata.userId);
            
            if (user) {
              // Record purchase
              await storage.recordPurchase({
                userId: user.id,
                courseId: paymentData.metadata.courseId,
                paymentIntentId: paymentData.payment_id,
                amount: paymentData.total_amount / 100, // Convert from cents
                paymentMethod: 'dodopay',
              });
              console.log('✅ Course purchase recorded successfully');
            } else {
              console.error('❌ User not found:', paymentData.metadata.userId);
            }
          } catch (error) {
            console.error('❌ Failed to record purchase:', error);
          }
        }
        break;

      case 'payment.failed':
        console.log('❌ Payment failed:', payload.data.payment_id);
        // Payment failed, no action needed
        break;

      case 'subscription.created': {
        const subscriptionData = payload.data;
        console.log('📥 DoDo Pay subscription created:', subscriptionData.subscription_id);
        
        try {
          const userEmail = subscriptionData.metadata?.userEmail || subscriptionData.customer_email;
          const planTier = subscriptionData.metadata?.planType || subscriptionData.plan_id;
          
          if (!userEmail) {
            console.error('❌ Subscription webhook missing user email');
            break;
          }

          // Find user by email
          const [user] = await db.select()
            .from(users)
            .where(eq(users.email, userEmail))
            .limit(1);

          if (!user) {
            console.error('❌ User not found for email:', userEmail);
            break;
          }

          // Get or create default pricing plan for this subscription
          const [plan] = await db.select()
            .from(pricingPlans)
            .where(eq(pricingPlans.gradeTier, planTier as any))
            .limit(1);

          // Calculate subscription dates
          const startDate = new Date(subscriptionData.start_date || Date.now());
          const endDate = new Date(startDate);
          if (subscriptionData.billing_period === 'yearly') {
            endDate.setFullYear(endDate.getFullYear() + 1);
          } else {
            endDate.setMonth(endDate.getMonth() + 1);
          }

          // Save subscription to database
          await db.insert(userSubscriptions).values({
            userId: user.id,
            planId: plan?.id || '00000000-0000-0000-0000-000000000000', // Fallback UUID
            subscriptionStatus: 'approved' as any,
            paymentMethod: 'dodopay',
            startDate: startDate,
            endDate: endDate,
            stripeSubscriptionId: subscriptionData.subscription_id // Store DodoPay subscription ID here
          });

          // Update user profile with subscription tier
          await db.update(profiles)
            .set({
              subscriptionTier: planTier,
              planExpiry: endDate,
              legacyPlan: planTier
            })
            .where(eq(profiles.userId, user.id));

          console.log('✅ DoDo Pay subscription saved for user:', user.id);
        } catch (error) {
          console.error('❌ Failed to save DoDo Pay subscription:', error);
        }
        break;
      }

      case 'subscription.renew': {
        const renewalData = payload.data;
        console.log('✅ DoDo Pay subscription renewed:', renewalData.subscription_id);
        
        try {
          // Find subscription by DodoPay subscription ID and update end date
          const [subscription] = await db.select()
            .from(userSubscriptions)
            .where(eq(userSubscriptions.stripeSubscriptionId, renewalData.subscription_id))
            .limit(1);

          if (subscription) {
            const newEndDate = new Date(renewalData.next_billing_date || Date.now());
            
            await db.update(userSubscriptions)
              .set({ endDate: newEndDate })
              .where(eq(userSubscriptions.id, subscription.id));

            // Also update user profile expiry
            await db.update(profiles)
              .set({ planExpiry: newEndDate })
              .where(eq(profiles.userId, subscription.userId));

            console.log('✅ DoDo Pay subscription renewed for user:', subscription.userId);
          }
        } catch (error) {
          console.error('❌ Failed to renew DoDo Pay subscription:', error);
        }
        break;
      }

      case 'subscription.cancelled': {
        const cancellationData = payload.data;
        console.log('⚠️ DoDo Pay subscription cancelled:', cancellationData.subscription_id);
        
        try {
          // Find and deactivate subscription
          const [subscription] = await db.select()
            .from(userSubscriptions)
            .where(eq(userSubscriptions.stripeSubscriptionId, cancellationData.subscription_id))
            .limit(1);

          if (subscription) {
            const now = new Date();
            await db.update(userSubscriptions)
              .set({ 
                subscriptionStatus: 'rejected' as any,
                endDate: now
              })
              .where(eq(userSubscriptions.id, subscription.id));

            // Update user profile - set expiry to now
            await db.update(profiles)
              .set({ 
                planExpiry: now,
                subscriptionTier: null // Clear subscription tier
              })
              .where(eq(profiles.userId, subscription.userId));

            console.log('✅ DoDo Pay subscription cancelled for user:', subscription.userId);
          }
        } catch (error) {
          console.error('❌ Failed to cancel DoDo Pay subscription:', error);
        }
        break;
      }

      default:
        console.log('ℹ️ Unhandled event type:', payload.event_type);
    }

    return res.json({ received: true });
  } catch (error: any) {
    console.error('❌ DoDo Pay webhook error:', error);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * Verify DoDo Pay payment status
 * GET /api/dodopay/verify/:paymentId
 */
router.get('/verify/:paymentId', async (req: Request, res: Response) => {
  try {
    const { paymentId } = req.params;

    const dodo = await getDodoPayInstance();
    if (!dodo) {
      return res.status(503).json({ 
        success: false,
        error: 'DoDo Pay not configured' 
      } as PaymentResult);
    }

    // Retrieve payment details from DoDo Pay
    const payment = await dodo.payments.retrieve(paymentId);

    const result: PaymentResult = {
      success: true,
      paymentId: payment.payment_id,
      status: payment.status || undefined,
      amount: payment.total_amount / 100, // Convert from cents
      currency: payment.currency,
      metadata: payment.metadata,
    };

    return res.json(result);
  } catch (error: any) {
    console.error('❌ DoDo Pay verification error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Payment verification failed',
      metadata: { details: error.message }
    } as PaymentResult);
  }
});

/**
 * Invalidate DoDo Pay cache (call after updating settings)
 */
export function invalidateDodoPayCache() {
  dodoPaymentsInstance = null;
  lastDodoUpdate = null;
  console.log('✅ DoDo Pay cache invalidated');
}

export default router;
