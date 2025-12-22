import { Response } from "express";
import Stripe from "stripe";
import { AuthenticatedRequest } from "../middleware/auth.js";
import { db } from "../db.js";
import { adsBanners, adPricingConfig, shopPurchases, shopCustomers, shopMemberships, shopMembershipPlans, profiles, orders, orderItems } from "../../shared/schema.js";
import { eq, and, sql } from "drizzle-orm";
import { z } from "zod";
import { emailService } from "../utils/email.js";
import { getPrimaryPaymentClient } from "../utils/payment-gateways.js";

// Note: Payment client will be fetched dynamically based on primary gateway
// See createBannerWithPayment for usage

const createBannerWithPaymentSchema = z.object({
  title: z.string().min(1).max(100),
  imageUrl: z.string().url(),
  targetDashboards: z.array(z.enum(['learner', 'teacher', 'freelancer', 'customer', 'advertise_page'])).min(1),
  size: z.string().min(1),
  durationDays: z.number().min(1).max(90),
  targetLocations: z.array(z.string()).optional().nullable(),
  // Guest checkout fields
  guestEmail: z.string().email().optional(),
  guestName: z.string().min(1).max(100).optional(),
});

/**
 * Calculate ad price based on targeting type and duration
 */
async function calculateAdPrice(targetLocations: string[] | null, durationDays: number): Promise<number> {
  try {
    // Determine targeting type
    const targetingType = targetLocations && targetLocations.length > 0 ? 'local' : 'global';
    
    // Query pricing configuration
    const [pricingConfig] = await db
      .select({ price: adPricingConfig.price })
      .from(adPricingConfig)
      .where(and(
        eq(adPricingConfig.targetingType, targetingType),
        eq(adPricingConfig.durationDays, durationDays),
        eq(adPricingConfig.isActive, true)
      ));

    if (!pricingConfig) {
      throw new Error(`No pricing found for ${targetingType} targeting with ${durationDays} days duration`);
    }

    return Number(pricingConfig.price);
  } catch (error) {
    console.error('Error calculating ad price:', error);
    throw error;
  }
}

export const createBannerWithPayment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    const validatedData = createBannerWithPaymentSchema.parse(req.body);
    
    // Map frontend dashboard values to backend placement values
    const placementMapping: Record<string, string> = {
      'learner': 'student_dashboard',
      'teacher': 'teacher_dashboard',
      'freelancer': 'freelancer_dashboard',
      'customer': 'customer_dashboard',
      'advertise_page': 'advertise_page'
    };
    
    const placements = validatedData.targetDashboards.map(d => placementMapping[d] || d);
    const primaryPlacement = placements[0] as any; // Use first as primary
    
    // Check ad credits for authenticated users
    let useCredits = false;
    if (userId) {
      const [customer] = await db
        .select()
        .from(shopCustomers)
        .where(eq(shopCustomers.userId, userId))
        .limit(1);

      if (customer) {
        const [membership] = await db
          .select()
          .from(shopMemberships)
          .where(eq(shopMemberships.customerId, customer.id))
          .limit(1);

        if (membership && membership.billingCycle === 'yearly') {
          // Get plan details
          const [plan] = await db
            .select()
            .from(shopMembershipPlans)
            .where(eq(shopMembershipPlans.planId, membership.plan))
            .limit(1);

          if (plan && plan.annualAdLimit) {
            // Check monthly reset
            const now = new Date();
            const lastReset = membership.lastMonthlyResetDate ? new Date(membership.lastMonthlyResetDate) : new Date(0);
            const monthsSinceReset = (now.getFullYear() - lastReset.getFullYear()) * 12 + (now.getMonth() - lastReset.getMonth());

            let adsUsed = membership.adsCreatedThisMonth || 0;
            
            if (monthsSinceReset >= 1) {
              // Reset counter
              await db
                .update(shopMemberships)
                .set({
                  adsCreatedThisMonth: 0,
                  lastMonthlyResetDate: now
                })
                .where(eq(shopMemberships.id, membership.id));
              adsUsed = 0;
            }

            // Check if user has credits remaining
            if (plan.annualAdLimit === null || adsUsed < plan.annualAdLimit) {
              // Check if duration is allowed
              const allowedDurations = plan.adDurations as number[] || [];
              if (allowedDurations.includes(validatedData.durationDays)) {
                useCredits = true;
                
                // Increment ad counter
                await db
                  .update(shopMemberships)
                  .set({
                    adsCreatedThisMonth: adsUsed + 1
                  })
                  .where(eq(shopMemberships.id, membership.id));
              }
            }
          }
        }
        // Monthly members and members without ad credits fall through to payment
      }
    }
    
    // Calculate base price
    const basePrice = await calculateAdPrice(validatedData.targetLocations || null, validatedData.durationDays);
    // Multiply by number of dashboards
    const totalPrice = basePrice * placements.length;
    
    // Create pending banner ad first
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + validatedData.durationDays);

    const [newAd] = await db
      .insert(adsBanners)
      .values({
        userId: userId || null, // Allow null for guest users
        title: validatedData.title,
        imageUrl: validatedData.imageUrl,
        targetDashboard: 'all', // Deprecated field
        placement: primaryPlacement, // Primary placement for backwards compatibility
        placements: placements, // Store all selected placements
        size: validatedData.size,
        price: useCredits ? '0.00' : totalPrice.toString(),
        startDate,
        endDate,
        targetLocations: validatedData.targetLocations,
        guestEmail: validatedData.guestEmail || null,
        guestName: validatedData.guestName || null,
        status: 'pending', // Always pending for admin approval (both paid and credit-based)
      })
      .returning();

    // If using credits, skip payment and return success
    if (useCredits) {
      console.log('Ad created using membership credits:', newAd.id);
      return res.json({ 
        success: true, 
        usedCredits: true,
        bannerId: newAd.id,
        amount: 0,
        message: 'Ad created successfully using your membership credits'
      });
    }

    // Create Payment Intent for paid ads
    console.log('Creating Payment Intent for banner ad:', newAd.id);
    
    // Get the primary payment gateway client
    const stripe = await getPrimaryPaymentClient();
    if (!stripe) {
      return res.status(500).json({ success: false, error: 'Payment gateway not configured' });
    }
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalPrice * 100), // Convert to cents
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        banner_id: newAd.id.toString(),
        user_id: userId || 'guest',
        type: 'banner_ad',
        guest_email: validatedData.guestEmail || '',
        guest_name: validatedData.guestName || '',
      },
      description: `Banner Ad: ${validatedData.title} - ${primaryPlacement} placement for ${validatedData.durationDays} days`,
    });

    console.log('Payment Intent created successfully:', { 
      paymentIntentId: paymentIntent.id, 
      clientSecret: paymentIntent.client_secret,
      status: paymentIntent.status,
      amount: paymentIntent.amount
    });

    res.json({ 
      success: true, 
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      bannerId: newAd.id,
      amount: totalPrice
    });
    
  } catch (error) {
    console.error('Create banner with payment error:', error);
    console.error('Request body received:', req.body);
    
    if (error instanceof z.ZodError) {
      console.error('Validation errors:', error.errors);
      return res.status(400).json({ 
        success: false, 
        error: `Validation error: ${error.errors[0].message}`,
        field: error.errors[0].path?.join('.') || 'unknown',
        details: error.errors
      });
    }
    
    // Log different types of errors for better debugging
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      // Check if it's a pricing error
      if (error.message.includes('No pricing found')) {
        return res.status(400).json({ 
          success: false, 
          error: `Pricing configuration error: ${error.message}` 
        });
      }
      
      // Check if it's a payment processing error
      if (error.message.includes('stripe') || error.message.includes('payment')) {
        return res.status(500).json({ 
          success: false, 
          error: `Payment processing error: ${error.message}` 
        });
      }
    }
    
    res.status(500).json({ success: false, error: 'Failed to create banner ad with payment' });
  }
};

export const confirmBannerPayment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { paymentIntentId, bannerId } = req.body;

    if (!paymentIntentId || !bannerId) {
      return res.status(400).json({ success: false, error: 'Missing payment intent ID or banner ID' });
    }

    // Verify the payment intent
    const stripe2 = await getPrimaryPaymentClient(); if (!stripe2) return res.status(500).json({ error: "Payment gateway not configured" }); const paymentIntent = await stripe2.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ 
        success: false, 
        error: `Payment not completed. Status: ${paymentIntent.status}` 
      });
    }

    // Verify payment intent metadata matches the banner ID
    if (paymentIntent.metadata?.banner_id !== bannerId) {
      return res.status(403).json({ 
        success: false, 
        error: 'Payment intent does not match banner ID' 
      });
    }

    // Check for idempotency - if order with this payment intent already exists, return success
    const [existingOrder] = await db
      .select()
      .from(orders)
      .where(eq(orders.paymentIntentId, paymentIntentId))
      .limit(1);

    if (existingOrder) {
      return res.json({ 
        success: true, 
        message: 'Payment already confirmed. Your banner ad is pending admin approval.' 
      });
    }

    // Get banner details
    const [banner] = await db
      .select()
      .from(adsBanners)
      .where(eq(adsBanners.id, bannerId));

    if (!banner) {
      return res.status(404).json({ success: false, error: 'Banner ad not found' });
    }

    // Verify ownership - the requesting user must own the banner
    if (req.user?.id && banner.userId !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        error: 'Unauthorized: You do not own this banner ad' 
      });
    }

    // Use banner owner's ID for the purchase record (can be null for guest banners)
    const ownerId = banner.userId;

    console.log('🔍 Processing payment confirmation:', {
      paymentIntentId,
      bannerId,
      ownerId,
      bannerTitle: banner.title,
      bannerPrice: banner.price
    });

    // Wrap banner update and purchase creation in a transaction
    await db.transaction(async (tx) => {
      console.log('📝 Updating banner status to pending...');
      // Update banner status to pending - requires admin approval
      await tx
        .update(adsBanners)
        .set({ 
          status: 'pending',
          updatedAt: new Date()
        })
        .where(eq(adsBanners.id, bannerId));

      // Only create purchase record for authenticated users (skip for guests)
      if (ownerId) {
        console.log('👤 Getting or creating shop customer for userId:', ownerId);
        // Get or create shop customer for the banner owner
        let [customer] = await tx
          .select()
          .from(shopCustomers)
          .where(eq(shopCustomers.userId, ownerId))
          .limit(1);

        if (!customer) {
          console.log('📦 Customer not found, creating new customer...');
          const [userProfile] = await tx
            .select()
            .from(profiles)
            .where(eq(profiles.userId, ownerId))
            .limit(1);

          console.log('📋 User profile:', { name: userProfile?.name, email: userProfile?.email });

          [customer] = await tx
            .insert(shopCustomers)
            .values({
              userId: ownerId,
              fullName: userProfile?.name || 'Customer',
              email: userProfile?.email || ''
            })
            .returning();
          
          console.log('✅ Customer created:', customer.id);
        } else {
          console.log('✅ Customer found:', customer.id);
        }

        console.log('📦 Creating order record...');
        // Create order record (no order items needed for banner ads)
        const [createdOrder] = await tx.execute(sql`
          INSERT INTO orders (
            user_id, total_amount, currency, 
            payment_method, payment_intent_id, status
          ) VALUES (
            ${ownerId}, ${banner.price?.toString() || '0'}, ${'USD'},
            ${'stripe'}, ${paymentIntentId}, ${'paid'}
          ) RETURNING *
        `);

        console.log('💳 Creating purchase record...');
        // Create purchase record with order ID
        const [newPurchase] = await tx.insert(shopPurchases).values({
          customerId: customer.id,
          itemName: banner.title || 'Banner Advertisement',
          itemType: 'banner_ad',
          downloadUrl: 'N/A',
          thumbnailUrl: banner.imageUrl || null,
          price: banner.price?.toString() || '0',
          orderId: (createdOrder as any).id,
          status: 'completed'
        }).returning();
        
        console.log('✅ Order and purchase records created:', { orderId: (createdOrder as any).id, purchaseId: newPurchase.id });
      } else {
        console.log('⚠️ Skipping purchase record creation - no ownerId (guest user)');
      }
    });

    console.log('✅ Transaction completed successfully');

    // Send confirmation email with receipt
    try {
      const { ReceiptService } = await import('../services/receipts.js');
      const recipientEmail = banner.guestEmail || paymentIntent.metadata?.guest_email;
      const customerName = banner.guestName || paymentIntent.metadata?.guest_name;
      
      if (recipientEmail) {
        const durationDays = Math.ceil((new Date(banner.endDate).getTime() - new Date(banner.startDate).getTime()) / (1000 * 60 * 60 * 24));
        
        // Generate and send receipt for banner payment
        await ReceiptService.generateAndSendBannerPaymentReceipt({
          bannerId: bannerId,
          userId: ownerId || null,
          userEmail: recipientEmail,
          userName: customerName || 'Customer',
          bannerTitle: banner.title || 'Banner Advertisement',
          placement: banner.placement || 'multiple dashboards',
          durationDays: durationDays,
          amount: parseFloat(banner.price?.toString() || '0'),
          currency: 'USD',
          paymentMethod: gateway
        });
        console.log('📧 Confirmation email with receipt sent to:', recipientEmail);
      }
    } catch (emailError) {
      console.error('Failed to send confirmation email with receipt:', emailError);
    }

    res.json({ 
      success: true, 
      message: 'Payment successful! Your banner ad is pending admin approval.' 
    });
    
  } catch (error) {
    console.error('Confirm banner payment error:', error);
    res.status(500).json({ success: false, error: 'Failed to process payment confirmation' });
  }
};

export const handlePaymentSuccess = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { session_id, banner_id } = req.query;

    if (!session_id || !banner_id) {
      return res.status(400).json({ success: false, error: 'Missing session or banner ID' });
    }

    // Verify the payment - check if it's a PaymentIntent ID (starts with 'pi_') or Checkout Session ID (starts with 'cs_')
    const sessionIdStr = session_id as string;
    
    let isPaymentComplete = false;
    
    if (sessionIdStr.startsWith('pi_')) {
      // It's a PaymentIntent ID (used for banner payments)
      const stripe2 = await getPrimaryPaymentClient(); if (!stripe2) return res.status(500).json({ error: "Payment gateway not configured" }); const paymentIntent = await stripe2.paymentIntents.retrieve(sessionIdStr);
      isPaymentComplete = paymentIntent.status === 'succeeded';
    } else {
      // It's a Checkout Session ID (used for other payments)
      const session = await stripe.checkout.sessions.retrieve(sessionIdStr);
      isPaymentComplete = session.payment_status === 'paid';
    }
    
    if (isPaymentComplete) {
      // Get banner details to return
      const [banner] = await db
        .select()
        .from(adsBanners)
        .where(eq(adsBanners.id, banner_id as string));

      res.json({ 
        success: true, 
        message: 'Payment successful! Your banner ad is now pending admin approval.',
        banner: banner || null
      });
    } else {
      res.status(400).json({ 
        success: false, 
        error: 'Payment not completed' 
      });
    }
    
  } catch (error) {
    console.error('Handle payment success error:', error);
    res.status(500).json({ success: false, error: 'Failed to process payment confirmation' });
  }
};

/**
 * Delete user's own banner ad
 */
export const deleteBannerAd = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { bannerId } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    if (!bannerId) {
      return res.status(400).json({ success: false, error: 'Banner ID is required' });
    }

    // Check if banner exists and belongs to user
    const [banner] = await db
      .select()
      .from(adsBanners)
      .where(eq(adsBanners.id, bannerId));

    if (!banner) {
      return res.status(404).json({ success: false, error: 'Banner ad not found' });
    }

    if (banner.userId !== userId) {
      return res.status(403).json({ success: false, error: 'You can only delete your own ads' });
    }

    // Delete the banner
    await db
      .delete(adsBanners)
      .where(eq(adsBanners.id, bannerId));

    res.json({ success: true, message: 'Banner ad deleted successfully' });
  } catch (error) {
    console.error('Delete banner ad error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete banner ad' });
  }
};

const updateBannerSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  imageUrl: z.string().url().optional(),
  targetDashboards: z.array(z.enum(['learner', 'teacher', 'freelancer', 'customer', 'advertise_page'])).min(1).optional(),
  size: z.string().min(1).optional(),
  durationDays: z.number().min(1).max(90).optional(),
  targetLocations: z.array(z.string()).optional().nullable(),
});

/**
 * Update user's own banner ad - resets status to 'pending' for admin re-approval
 */
export const updateBannerAd = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { bannerId } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    if (!bannerId) {
      return res.status(400).json({ success: false, error: 'Banner ID is required' });
    }

    const validatedData = updateBannerSchema.parse(req.body);

    // Check if banner exists and belongs to user
    const [banner] = await db
      .select()
      .from(adsBanners)
      .where(eq(adsBanners.id, bannerId));

    if (!banner) {
      return res.status(404).json({ success: false, error: 'Banner ad not found' });
    }

    if (banner.userId !== userId) {
      return res.status(403).json({ success: false, error: 'You can only edit your own ads' });
    }

    // Build update object
    const updateData: any = {
      updatedAt: new Date(),
      status: 'pending', // Reset to pending for admin re-approval
    };

    if (validatedData.title) updateData.title = validatedData.title;
    if (validatedData.imageUrl) updateData.imageUrl = validatedData.imageUrl;
    if (validatedData.size) updateData.size = validatedData.size;
    
    // Handle targetDashboards mapping
    if (validatedData.targetDashboards) {
      const placementMapping: Record<string, string> = {
        'learner': 'student_dashboard',
        'teacher': 'teacher_dashboard',
        'freelancer': 'freelancer_dashboard',
        'customer': 'customer_dashboard',
        'advertise_page': 'advertise_page'
      };
      const placements = validatedData.targetDashboards.map(d => placementMapping[d] || d);
      updateData.placements = placements;
      updateData.placement = placements[0]; // Set primary placement
    }

    // Handle duration update
    if (validatedData.durationDays) {
      const newEndDate = new Date(banner.startDate);
      newEndDate.setDate(newEndDate.getDate() + validatedData.durationDays);
      updateData.endDate = newEndDate;
    }

    if (validatedData.targetLocations !== undefined) {
      updateData.targetLocations = validatedData.targetLocations;
    }

    // Update banner
    const [updatedBanner] = await db
      .update(adsBanners)
      .set(updateData)
      .where(eq(adsBanners.id, bannerId))
      .returning();

    res.json({ 
      success: true, 
      message: 'Banner ad updated successfully. It will need admin approval again.',
      banner: updatedBanner
    });
  } catch (error) {
    console.error('Update banner ad error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        success: false, 
        error: `Validation error: ${error.errors[0].message}` 
      });
    }
    
    res.status(500).json({ success: false, error: 'Failed to update banner ad' });
  }
};

/**
 * Confirm PayPal payment for banner ad
 */
export const confirmPayPalBannerPayment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { paypalOrderId, bannerId } = req.body;

    if (!paypalOrderId || !bannerId) {
      return res.status(400).json({ success: false, error: 'Missing PayPal order ID or banner ID' });
    }

    // Get banner details
    const [banner] = await db
      .select()
      .from(adsBanners)
      .where(eq(adsBanners.id, bannerId));

    if (!banner) {
      return res.status(404).json({ success: false, error: 'Banner ad not found' });
    }

    // Verify ownership if user is authenticated
    if (req.user?.id && banner.userId !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        error: 'Unauthorized: You do not own this banner ad' 
      });
    }

    // Check for idempotency - if order with this PayPal order ID already exists, return success
    const [existingOrder] = await db
      .select()
      .from(orders)
      .where(eq(orders.paymentIntentId, paypalOrderId))
      .limit(1);

    if (existingOrder) {
      return res.json({ 
        success: true, 
        message: 'Payment already confirmed. Your banner ad is pending admin approval.' 
      });
    }

    const ownerId = banner.userId;

    console.log('🔍 Processing PayPal payment confirmation:', {
      paypalOrderId,
      bannerId,
      ownerId,
      bannerTitle: banner.title,
      bannerPrice: banner.price
    });

    // Wrap banner update and purchase creation in a transaction
    await db.transaction(async (tx) => {
      console.log('📝 Updating banner status to pending...');
      // Update banner status to pending - requires admin approval
      await tx
        .update(adsBanners)
        .set({ 
          status: 'pending',
          updatedAt: new Date()
        })
        .where(eq(adsBanners.id, bannerId));

      // Only create purchase record for authenticated users (skip for guests)
      if (ownerId) {
        console.log('👤 Getting or creating shop customer for userId:', ownerId);
        // Get or create shop customer for the banner owner
        let [customer] = await tx
          .select()
          .from(shopCustomers)
          .where(eq(shopCustomers.userId, ownerId))
          .limit(1);

        if (!customer) {
          console.log('📦 Customer not found, creating new customer...');
          const [userProfile] = await tx
            .select()
            .from(profiles)
            .where(eq(profiles.userId, ownerId))
            .limit(1);

          [customer] = await tx
            .insert(shopCustomers)
            .values({
              userId: ownerId,
              fullName: userProfile?.name || 'Customer',
              email: userProfile?.email || ''
            })
            .returning();
          
          console.log('✅ Customer created:', customer.id);
        } else {
          console.log('✅ Customer found:', customer.id);
        }

        console.log('📦 Creating order record...');
        // Create order record (no order items needed for banner ads)
        const [createdOrder] = await tx
          .insert(orders)
          .values({
            userId: ownerId,
            totalAmount: banner.price?.toString() || '0',
            currency: 'USD',
            paymentMethod: 'paypal',
            paymentIntentId: paypalOrderId,
            status: 'paid'
          })
          .returning();

        console.log('💳 Creating purchase record...');
        // Create purchase record with order ID
        const [newPurchase] = await tx.insert(shopPurchases).values({
          customerId: customer.id,
          itemName: banner.title || 'Banner Advertisement',
          itemType: 'banner_ad',
          downloadUrl: 'N/A',
          thumbnailUrl: banner.imageUrl || null,
          price: banner.price?.toString() || '0',
          orderId: createdOrder.id,
          status: 'completed'
        }).returning();
        
        console.log('✅ Order and purchase records created:', { orderId: createdOrder.id, purchaseId: newPurchase.id });
      } else {
        console.log('⚠️ Skipping purchase record creation - no ownerId (guest user)');
      }
    });

    console.log('✅ Transaction completed successfully');

    // Send confirmation email
    try {
      const recipientEmail = banner.guestEmail;
      const customerName = banner.guestName;
      
      if (recipientEmail) {
        await emailService.sendAdPurchaseEmail(recipientEmail, {
          adTitle: banner.title || 'Banner Advertisement',
          placement: banner.placement || 'multiple dashboards',
          duration: Math.ceil((new Date(banner.endDate).getTime() - new Date(banner.startDate).getTime()) / (1000 * 60 * 60 * 24)),
          price: parseFloat(banner.price?.toString() || '0'),
          orderId: paypalOrderId,
          customerName: customerName || undefined,
        });
        console.log('📧 Confirmation email sent to:', recipientEmail);
      }
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
    }

    res.json({ 
      success: true, 
      message: 'PayPal payment successful! Your banner ad is pending admin approval.' 
    });
    
  } catch (error) {
    console.error('Confirm PayPal banner payment error:', error);
    res.status(500).json({ success: false, error: 'Failed to process PayPal payment confirmation' });
  }
};