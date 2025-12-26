import { Router, type Request, type Response } from 'express';
import { db } from '../db.js';
import { profiles, users, shopCustomers } from '../../shared/schema.js';
import { eq, sql } from 'drizzle-orm';
import { GRADE_SUBSCRIPTION_PLANS } from '../../shared/schema.js';
import { getPrimaryPaymentClient, getStripeInstance } from '../utils/payment-gateways.js';
import { requireAuth } from '../middleware/auth.js';

interface AuthenticatedRequest extends Request {
  user?: { id: string };
}

const router = Router();

// Apply requireAuth to all subscription routes
router.use(requireAuth);

// Helper to get subscription plan details
function getPlanDetails(planType: string, billingCycle: 'monthly' | 'yearly') {
  const plans = GRADE_SUBSCRIPTION_PLANS as any;
  const plan = plans[planType];
  
  if (!plan) {
    throw new Error('Invalid subscription tier');
  }
  
  return {
    name: plan.name,
    amount: plan.pricing[billingCycle],
    tier: planType,
    billingCycle,
    features: plan.features
  };
}

// Gateway-agnostic subscription creation
router.post('/subscriptions/create', async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Default to primary gateway if not specified
    const { planType, billingCycle = 'monthly', gateway } = req.body;
    const primaryGateway = await (await import('../utils/payment-gateways.js')).getPrimaryPaymentGateway();
    const selectedGateway = gateway || primaryGateway?.gatewayId || 'stripe';
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Validate inputs
    if (!['monthly', 'yearly'].includes(billingCycle)) {
      return res.status(400).json({ error: 'Invalid billing cycle' });
    }

    // Get plan details
    const planDetails = getPlanDetails(planType, billingCycle);

    // Get user profile
    const [profile] = await db.select()
      .from(profiles)
      .where(eq(profiles.userId, userId))
      .limit(1);

    if (!profile) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    const [user] = await db.select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    // Route to gateway-specific logic
    switch (selectedGateway) {
      case 'stripe': {
        const stripe = await getStripeInstance();
        if (!stripe) {
          return res.status(500).json({ error: 'Stripe not configured' });
        }

        // Get or create customer
        let customerId = profile.stripeCustomerId;
        
        if (!customerId) {
          const customer = await stripe.customers.create({
            email: user.email,
            name: profile.name || undefined,
          });
          customerId = customer.id;
          
          await db.update(profiles)
            .set({ stripeCustomerId: customerId })
            .where(eq(profiles.userId, userId));
        }

        // Create payment intent (simple approach, not Stripe subscriptions)
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(planDetails.amount * 100),
          currency: 'usd',
          customer: customerId,
          metadata: {
            plan_type: planType,
            billing_cycle: billingCycle,
            user_id: userId,
            subscription: 'true'
          },
          description: `${planDetails.name} - ${billingCycle}`
        });

        return res.json({
          success: true,
          clientSecret: paymentIntent.client_secret,
          gateway: selectedGateway,
          amount: planDetails.amount,
          planName: planDetails.name
        });
      }

      case 'paypal': {
        // PayPal flow - return approval URL
        return res.json({
          success: true,
          message: 'PayPal subscription not yet implemented. Use Stripe or contact support.',
          gateway: 'paypal'
        });
      }

      case 'paystack': {
        // Paystack flow - return reference for frontend to handle
        return res.json({
          success: true,
          gateway: 'paystack',
          amount: planDetails.amount,
          planName: planDetails.name,
          reference: `sub_${Date.now()}_${userId.slice(0, 8)}`
        });
      }

      case 'wallet': {
        // Wallet payment - check shop wallet balance
        const [shopCustomer] = await db.select()
          .from(shopCustomers)
          .where(eq(shopCustomers.userId, userId))
          .limit(1);
        const shopWalletBalance = parseFloat(shopCustomer?.walletBalance?.toString() || '0');
        
        if (shopWalletBalance < planDetails.amount) {
          return res.status(400).json({ 
            error: 'Insufficient wallet balance',
            required: planDetails.amount,
            available: shopWalletBalance,
            gateway: 'wallet'
          });
        }

        // Deduct from shop wallet
        const planExpiry = new Date();
        if (billingCycle === 'yearly') {
          planExpiry.setFullYear(planExpiry.getFullYear() + 1);
        } else {
          planExpiry.setMonth(planExpiry.getMonth() + 1);
        }
        
        const newShopBalance = shopWalletBalance - planDetails.amount;
        await db.update(shopCustomers)
          .set({ walletBalance: newShopBalance.toFixed(2) })
          .where(eq(shopCustomers.userId, userId));
        
        // Update subscription status
        await db.update(profiles)
          .set({
            legacyPlan: planType,
            subscriptionTier: planType,
            planExpiry: planExpiry
          })
          .where(eq(profiles.userId, userId));

        // Send plan upgrade email
        try {
          const { sendPlanUpgradeEmail } = await import('../utils/email-templates.js');
          const userEmail = profile.email || user.email;
          const userName = profile.name || 'Student';
          
          if (userEmail) {
            await sendPlanUpgradeEmail(userEmail, userName, {
              planName: planDetails.name,
              previousPlan: profile.subscriptionTier || 'Free',
              price: planDetails.amount.toFixed(2),
              billingCycle: billingCycle === 'monthly' ? 'Monthly' : 'Yearly',
              expiryDate: planExpiry.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
              upgradeDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
            });
            console.log(`✅ Plan upgrade email sent to ${userEmail}`);
          }
        } catch (emailErr) {
          console.error('Failed to send plan upgrade email:', emailErr);
        }

        return res.json({
          success: true,
          gateway: 'wallet',
          message: 'Subscription activated via wallet',
          planExpiry,
          newWalletBalance: newShopBalance,
          amount: planDetails.amount,
          planName: planDetails.name
        });
      }

      default:
        return res.status(400).json({ error: `Gateway ${gateway} not supported` });
    }
  } catch (error: any) {
    console.error('Subscription creation error:', error);
    return res.status(500).json({ error: error.message || 'Failed to create subscription' });
  }
});

// Confirm subscription payment
router.post('/subscriptions/confirm', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { paymentIntentId, planType, amount, gateway = '' } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    switch (gateway) {
      case 'stripe': {
        const stripe = await getStripeInstance();
        if (!stripe) {
          return res.status(500).json({ error: 'Stripe not configured' });
        }

        // Verify payment intent
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        
        if (paymentIntent.status !== 'succeeded') {
          return res.status(400).json({ error: 'Payment not successful' });
        }

        // Update user profile with subscription
        const planExpiry = new Date();
        planExpiry.setMonth(planExpiry.getMonth() + 1); // 1 month from now (simplified)

        await db.update(profiles)
          .set({ 
            subscriptionTier: planType,
            planExpiry: planExpiry,
            legacyPlan: planType
          })
          .where(eq(profiles.userId, userId));

        // Generate and send subscription receipt
        try {
          const { ReceiptService } = await import('../services/receipts.js');
          const [profile] = await db.select()
            .from(profiles)
            .where(eq(profiles.userId, userId))
            .limit(1);
          
          const [user] = await db.select()
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);

          if (profile && user) {
            await ReceiptService.generateAndSendSubscriptionReceipt({
              subscriptionId: paymentIntentId,
              userId: userId,
              userEmail: user.email,
              userName: profile.name || undefined,
              planName: planType,
              planType: planType,
              amount: amount || (paymentIntent.amount / 100),
              currency: 'USD',
              billingCycle: 'monthly',
              planExpiry: planExpiry
            });
            console.log('📧 Subscription receipt sent to:', user.email);
          }
        } catch (receiptError) {
          console.error('Failed to send subscription receipt:', receiptError);
        }

        return res.json({
          success: true,
          message: 'Subscription activated successfully',
          planExpiry
        });
      }

      case 'dodopay': {
        // DodoPay payments are confirmed via overlay callback - trust the frontend
        // The webhook will also trigger but we want immediate UI update
        
        // Update user profile with subscription
        const planExpiry = new Date();
        const billingCycle = req.body.billingCycle || 'monthly';
        
        if (billingCycle === 'yearly') {
          planExpiry.setFullYear(planExpiry.getFullYear() + 1);
        } else {
          planExpiry.setMonth(planExpiry.getMonth() + 1);
        }

        await db.update(profiles)
          .set({ 
            subscriptionTier: planType,
            planExpiry: planExpiry,
            legacyPlan: planType
          })
          .where(eq(profiles.userId, userId));

        console.log(`✅ DodoPay subscription confirmed for user ${userId}: ${planType}`);

        // Generate and send subscription receipt
        try {
          const { ReceiptService } = await import('../services/receipts.js');
          const [profile] = await db.select()
            .from(profiles)
            .where(eq(profiles.userId, userId))
            .limit(1);
          
          const [user] = await db.select()
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);

          if (profile && user) {
            await ReceiptService.generateAndSendSubscriptionReceipt({
              subscriptionId: paymentIntentId || `dodo_${Date.now()}`,
              userId: userId,
              userEmail: user.email,
              userName: profile.name || undefined,
              planName: planType,
              planType: planType,
              amount: amount || 0,
              currency: 'USD',
              billingCycle: billingCycle === 'yearly' ? 'Yearly' : 'Monthly',
              planExpiry: planExpiry,
              paymentMethod: 'dodopay',
            });
            console.log('📧 DodoPay subscription receipt sent to:', user.email);
          }
        } catch (receiptError) {
          console.error('Failed to send DodoPay subscription receipt:', receiptError);
        }

        return res.json({
          success: true,
          message: 'DodoPay subscription activated successfully',
          planExpiry
        });
      }

      default:
        return res.status(400).json({ error: `Gateway ${gateway} not supported for confirmation` });
    }
  } catch (error: any) {
    console.error('Subscription confirmation error:', error);
    return res.status(500).json({ error: error.message || 'Failed to confirm subscription' });
  }
});

export default router;
