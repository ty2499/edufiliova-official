import { Router, Response } from "express";
import { db } from "../db";
import { freelancerServices, freelancerOrders, freelancerDeliverables, freelancerServiceReviews, profiles, transactions, userBalances } from "../../shared/schema";
import { eq, and, desc, lte, sql, avg, count } from "drizzle-orm";
import { requireAuth, requireRole, type AuthenticatedRequest } from "../middleware/auth";
import { z } from "zod";

const PLATFORM_USER_ID = "00000000-0000-0000-0000-000000000000";
const AUTO_RELEASE_DAYS = 3;

const router = Router();

const PLATFORM_FEE_PERCENT = 6;

const checkoutSchema = z.object({
  selectedPackage: z.enum(["basic", "standard", "premium"]),
  selectedAddOnTitles: z.array(z.string()).optional(),
  requirementsText: z.string().max(5000).optional(),
});

interface ServiceAddOn {
  title: string;
  description?: string;
  price: number;
  deliveryDaysExtra?: number;
}

router.post("/checkout/:serviceId", requireAuth, requireRole(['student', 'teacher', 'customer', 'admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { serviceId } = req.params;
    
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const validated = checkoutSchema.parse(req.body);

    const [service] = await db
      .select()
      .from(freelancerServices)
      .where(and(
        eq(freelancerServices.id, serviceId),
        eq(freelancerServices.status, "published")
      ));

    if (!service) {
      return res.status(404).json({ error: "Service not found or not available" });
    }

    if (service.freelancerId === userId) {
      return res.status(400).json({ error: "You cannot order your own service" });
    }

    const packages = service.packages as Record<string, any>;
    const selectedPkg = packages[validated.selectedPackage];

    if (!selectedPkg) {
      return res.status(400).json({ error: `Package '${validated.selectedPackage}' not available for this service` });
    }

    const packagePrice = Number(selectedPkg.price);
    if (!packagePrice || packagePrice < 1 || isNaN(packagePrice)) {
      return res.status(400).json({ error: "Invalid package price configuration" });
    }

    let subtotal = packagePrice;
    let extraDeliveryDays = 0;
    
    const serviceAddOns = (service.addOns || []) as ServiceAddOn[];
    const validatedAddOns: ServiceAddOn[] = [];
    
    if (validated.selectedAddOnTitles && validated.selectedAddOnTitles.length > 0) {
      for (const requestedTitle of validated.selectedAddOnTitles) {
        const catalogAddOn = serviceAddOns.find(a => a.title === requestedTitle);
        if (!catalogAddOn) {
          return res.status(400).json({ 
            error: `Add-on '${requestedTitle}' is not available for this service` 
          });
        }
        subtotal += Number(catalogAddOn.price);
        extraDeliveryDays += catalogAddOn.deliveryDaysExtra || 0;
        validatedAddOns.push(catalogAddOn);
      }
    }

    const platformFee = (subtotal * PLATFORM_FEE_PERCENT) / 100;
    const total = subtotal + platformFee;

    const baseDeliveryDays = selectedPkg.deliveryDays || 7;
    const totalDeliveryDays = baseDeliveryDays + extraDeliveryDays;
    const deliveryDueAt = new Date();
    deliveryDueAt.setDate(deliveryDueAt.getDate() + totalDeliveryDays);

    const [order] = await db.insert(freelancerOrders).values({
      serviceId: service.id,
      clientId: userId,
      freelancerId: service.freelancerId,
      selectedPackage: validated.selectedPackage,
      packageDetails: selectedPkg,
      addOns: validatedAddOns,
      amountSubtotal: subtotal.toFixed(2),
      platformFeeAmount: platformFee.toFixed(2),
      amountTotal: total.toFixed(2),
      currency: "USD",
      status: "pending_payment",
      requirementsText: validated.requirementsText || null,
      deliveryDueAt,
    }).returning();

    res.status(201).json({ 
      success: true, 
      order,
      breakdown: {
        packagePrice: Number(selectedPkg.price).toFixed(2),
        addOnsTotal: (subtotal - Number(selectedPkg.price)).toFixed(2),
        subtotal: subtotal.toFixed(2),
        platformFee: platformFee.toFixed(2),
        total: total.toFixed(2),
        baseDeliveryDays,
        extraDeliveryDays,
        totalDeliveryDays,
        deliveryDueAt,
      }
    });
  } catch (error) {
    console.error("Error creating order:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation failed", details: error.errors });
    }
    res.status(500).json({ error: "Failed to create order" });
  }
});

router.get("/my", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const orders = await db
      .select()
      .from(freelancerOrders)
      .where(eq(freelancerOrders.clientId, userId))
      .orderBy(desc(freelancerOrders.createdAt));

    const ordersWithDetails = await Promise.all(
      orders.map(async (order) => {
        const [service] = await db
          .select({
            id: freelancerServices.id,
            title: freelancerServices.title,
            images: freelancerServices.images,
          })
          .from(freelancerServices)
          .where(eq(freelancerServices.id, order.serviceId))
          .limit(1);

        const [freelancer] = await db
          .select({
            fullName: profiles.fullName,
            profilePicture: profiles.profilePicture,
          })
          .from(profiles)
          .where(eq(profiles.userId, order.freelancerId))
          .limit(1);

        return {
          ...order,
          service: service || null,
          freelancer: freelancer || null,
        };
      })
    );

    res.json({ success: true, orders: ordersWithDetails });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

router.get("/selling", requireAuth, requireRole(['freelancer']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const orders = await db
      .select()
      .from(freelancerOrders)
      .where(eq(freelancerOrders.freelancerId, userId))
      .orderBy(desc(freelancerOrders.createdAt));

    const ordersWithDetails = await Promise.all(
      orders.map(async (order) => {
        const [service] = await db
          .select({
            id: freelancerServices.id,
            title: freelancerServices.title,
            images: freelancerServices.images,
          })
          .from(freelancerServices)
          .where(eq(freelancerServices.id, order.serviceId))
          .limit(1);

        const [client] = await db
          .select({
            fullName: profiles.fullName,
            profilePicture: profiles.profilePicture,
          })
          .from(profiles)
          .where(eq(profiles.userId, order.clientId))
          .limit(1);

        return {
          ...order,
          service: service || null,
          client: client || null,
        };
      })
    );

    res.json({ success: true, orders: ordersWithDetails });
  } catch (error) {
    console.error("Error fetching selling orders:", error);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

router.get("/payment-gateways", async (_req, res: Response) => {
  try {
    const { getEnabledPaymentGateways, getStripePublishableKey } = await import("../utils/payment-gateways");
    
    const gateways = await getEnabledPaymentGateways();
    const stripePublishableKey = await getStripePublishableKey();
    
    const alwaysShowGateways = ['paypal'];
    const cardGateways = ['stripe', 'dodo', 'dodopay', 'dodopayments', 'flutterwave', 'paynow', 'vodapay'];
    
    const filteredGateways: any[] = [];
    let primaryCardGateway: any = null;
    
    for (const g of gateways) {
      const gatewayId = g.gatewayId?.toLowerCase();
      
      if (alwaysShowGateways.includes(gatewayId)) {
        filteredGateways.push({
          id: g.gatewayId,
          name: g.gatewayName || g.gatewayId,
          displayName: g.gatewayName || g.gatewayId,
          isPrimary: g.isPrimary,
          logoUrl: null,
        });
      } else if (cardGateways.includes(gatewayId)) {
        if (g.isPrimary || !primaryCardGateway) {
          primaryCardGateway = {
            id: g.gatewayId,
            name: g.gatewayName || g.gatewayId,
            displayName: g.gatewayName || g.gatewayId,
            isPrimary: g.isPrimary,
            logoUrl: null,
          };
        }
      }
    }
    
    if (primaryCardGateway) {
      filteredGateways.unshift(primaryCardGateway);
    }

    filteredGateways.push({
      id: 'wallet',
      name: 'Wallet',
      displayName: 'Wallet Balance',
      isPrimary: false,
      logoUrl: null,
    });

    res.json({
      success: true,
      gateways: filteredGateways,
      stripePublishableKey,
    });
  } catch (error) {
    console.error("Error fetching payment gateways:", error);
    res.status(500).json({ error: "Failed to fetch payment gateways" });
  }
});

router.get("/wallet/balance", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const [userBalance] = await db
      .select()
      .from(userBalances)
      .where(eq(userBalances.userId, userId));

    const balance = userBalance?.availableBalance || "0.00";

    res.json({
      success: true,
      balance,
      currency: "USD",
    });
  } catch (error) {
    console.error("Error fetching wallet balance:", error);
    res.status(500).json({ error: "Failed to fetch wallet balance" });
  }
});

// Dodo Payments session creation for freelancer orders
router.post("/dodopay/create-session", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { orderId, successUrl, cancelUrl } = req.body;
    
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!orderId) {
      return res.status(400).json({ error: "Order ID is required" });
    }

    const [order] = await db
      .select()
      .from(freelancerOrders)
      .where(eq(freelancerOrders.id, orderId));

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (order.clientId !== userId) {
      return res.status(403).json({ error: "Only the client can pay for this order" });
    }

    if (order.status !== "pending_payment") {
      return res.status(400).json({ error: "Order is not in pending payment status" });
    }

    const [service] = await db
      .select()
      .from(freelancerServices)
      .where(eq(freelancerServices.id, order.serviceId));

    // Import DodoPayments dynamically
    const DodoPayments = (await import('dodopayments')).default;
    const { storage } = await import('../storage.js');
    
    const dodoGateway = await storage.getPaymentGateway('dodopay');
    
    if (!dodoGateway || !dodoGateway.isEnabled) {
      return res.status(400).json({ error: "Dodo Payments is not enabled" });
    }

    let secretKey = dodoGateway.secretKey;
    if (secretKey?.startsWith('ENV:')) {
      secretKey = process.env[secretKey.substring(4)] || null;
    }

    if (!secretKey) {
      return res.status(500).json({ error: "Dodo Payments not properly configured" });
    }

    const dodo = new DodoPayments({
      bearerToken: secretKey,
      environment: dodoGateway.testMode ? 'test_mode' : 'live_mode',
    });

    const amountCents = Math.round(parseFloat(order.amountTotal) * 100);
    const serviceName = service?.title || 'Freelancer Service';
    const serviceDescription = `${order.selectedPackage} Package - ${serviceName}`;
    
    // Step 1: Create a one-time product first (DodoPay requires this)
    console.log(`🛒 Creating DodoPay product for freelancer order ${orderId}...`);
    
    let product: any;
    try {
      const productPayload = {
        name: serviceName,
        description: serviceDescription,
        price: {
          currency: (order.currency || 'USD').toUpperCase() as any,
          discount: 0,
          price: amountCents,
          purchasing_power_parity: false,
          type: 'one_time_price' as const,
        },
        tax_category: 'edtech' as any,
      };
      
      product = await dodo.products.create(productPayload as any);
      
      if (!product?.product_id) {
        throw new Error(`DodoPay did not return a product_id`);
      }
      console.log('✅ DodoPay product created:', product.product_id);
    } catch (productError: any) {
      console.error('❌ DodoPay product creation error:', productError?.message);
      throw new Error(`Failed to create product: ${productError?.message || 'Unknown error'}`);
    }

    // Step 2: Create checkout session with the product
    const baseUrl = process.env.DOMAIN || 'https://edufiliova.com';
    const returnUrl = successUrl || `${baseUrl}/orders/${orderId}?payment=success`;
    
    console.log(`🛒 Creating checkout session for product ${product.product_id}...`);
    
    let checkoutSession: any;
    try {
      const checkoutParams: any = {
        product_cart: [
          {
            product_id: product.product_id,
            quantity: 1,
          }
        ],
        return_url: returnUrl,
        metadata: {
          orderId: orderId,
          orderType: 'freelancer_service',
          serviceId: order.serviceId,
          clientId: userId,
          freelancerId: order.freelancerId,
        },
      };
      
      if (req.user?.email) {
        checkoutParams.customer = {
          email: req.user.email,
          name: req.user?.profile?.fullName || req.user.email.split('@')[0],
        };
      }
      
      checkoutSession = await dodo.checkoutSessions.create(checkoutParams);
      
      if (!checkoutSession) {
        throw new Error('DodoPay returned empty checkout session response');
      }
    } catch (sessionError: any) {
      console.error('❌ DodoPay checkout session error:', sessionError?.message);
      throw new Error(`Failed to create checkout session: ${sessionError?.message || 'Unknown error'}`);
    }

    const sessionId = checkoutSession?.session_id || checkoutSession?.checkout_session_id || checkoutSession?.id;
    const checkoutUrl = checkoutSession?.url || checkoutSession?.checkout_url || 
      (sessionId ? `https://checkout.dodopayments.com/session/${sessionId}` : null);

    if (!checkoutUrl) {
      throw new Error('Failed to get checkout URL from DodoPay');
    }

    console.log('✅ DodoPay checkout session created:', sessionId);

    res.json({ 
      success: true, 
      url: checkoutUrl,
      sessionId: sessionId,
    });
  } catch (error: any) {
    console.error("Error creating Dodo payment session:", error);
    res.status(500).json({ error: error.message || "Failed to create payment session" });
  }
});

// PayPal order creation for freelancer orders
router.post("/paypal/create-order", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { orderId, returnUrl, cancelUrl } = req.body;
    
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!orderId) {
      return res.status(400).json({ error: "Order ID is required" });
    }

    const [order] = await db
      .select()
      .from(freelancerOrders)
      .where(eq(freelancerOrders.id, orderId));

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (order.clientId !== userId) {
      return res.status(403).json({ error: "Only the client can pay for this order" });
    }

    if (order.status !== "pending_payment") {
      return res.status(400).json({ error: "Order is not in pending payment status" });
    }

    const [service] = await db
      .select()
      .from(freelancerServices)
      .where(eq(freelancerServices.id, order.serviceId));

    const { isPayPalConfigured } = await import('../paypal.js');
    
    if (!isPayPalConfigured) {
      return res.status(400).json({ error: "PayPal is not configured" });
    }

    // Forward to the main PayPal order creation with the order details
    req.body = {
      amount: order.amountTotal,
      currency: order.currency || 'USD',
      intent: 'CAPTURE',
      freelancerOrderId: orderId,
    };

    const { createPaypalOrder } = await import('../paypal.js');
    return createPaypalOrder(req, res);
  } catch (error: any) {
    console.error("Error creating PayPal order:", error);
    res.status(500).json({ error: error.message || "Failed to create PayPal order" });
  }
});

// Stripe session creation for freelancer orders
router.post("/stripe/create-session", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { orderId, successUrl, cancelUrl } = req.body;
    
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!orderId) {
      return res.status(400).json({ error: "Order ID is required" });
    }

    const [order] = await db
      .select()
      .from(freelancerOrders)
      .where(eq(freelancerOrders.id, orderId));

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (order.clientId !== userId) {
      return res.status(403).json({ error: "Only the client can pay for this order" });
    }

    if (order.status !== "pending_payment") {
      return res.status(400).json({ error: "Order is not in pending payment status" });
    }

    const [service] = await db
      .select()
      .from(freelancerServices)
      .where(eq(freelancerServices.id, order.serviceId));

    const Stripe = (await import('stripe')).default;
    const { storage } = await import('../storage.js');
    
    const stripeGateway = await storage.getPaymentGateway('stripe');
    
    if (!stripeGateway || !stripeGateway.isEnabled) {
      return res.status(400).json({ error: "Stripe is not enabled" });
    }

    let secretKey = stripeGateway.secretKey;
    if (secretKey?.startsWith('ENV:')) {
      secretKey = process.env[secretKey.substring(4)] || null;
    }

    if (!secretKey) {
      return res.status(500).json({ error: "Stripe not properly configured" });
    }

    const stripe = new Stripe(secretKey);

    const amountCents = Math.round(parseFloat(order.amountTotal) * 100);
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: order.currency?.toLowerCase() || 'usd',
            product_data: {
              name: service?.title || 'Freelancer Service',
              description: `${order.selectedPackage} Package`,
            },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl || `${process.env.DOMAIN || 'https://edufiliova.com'}/orders/${orderId}?payment=success`,
      cancel_url: cancelUrl || `${process.env.DOMAIN || 'https://edufiliova.com'}/checkout/service/${order.serviceId}`,
      metadata: {
        orderId: orderId,
        orderType: 'freelancer_service',
        serviceId: order.serviceId,
        clientId: userId,
        freelancerId: order.freelancerId,
      },
    });

    res.json({ 
      success: true, 
      url: session.url,
      sessionId: session.id,
    });
  } catch (error: any) {
    console.error("Error creating Stripe session:", error);
    res.status(500).json({ error: error.message || "Failed to create Stripe session" });
  }
});

router.get("/:id", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const [order] = await db
      .select()
      .from(freelancerOrders)
      .where(eq(freelancerOrders.id, id));

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (order.clientId !== userId && order.freelancerId !== userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    const [service] = await db
      .select()
      .from(freelancerServices)
      .where(eq(freelancerServices.id, order.serviceId));

    res.json({ success: true, order, service: service || null });
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({ error: "Failed to fetch order" });
  }
});

router.post("/:orderId/pay", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { orderId } = req.params;
    
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const [order] = await db
      .select()
      .from(freelancerOrders)
      .where(eq(freelancerOrders.id, orderId));

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (order.clientId !== userId) {
      return res.status(403).json({ error: "Only the client can pay for this order" });
    }

    if (order.status !== "pending_payment") {
      return res.status(400).json({ 
        error: `Order is not awaiting payment. Current status: ${order.status}` 
      });
    }

    const orderTotal = parseFloat(order.amountTotal);
    if (isNaN(orderTotal) || orderTotal <= 0) {
      return res.status(400).json({ error: "Invalid order amount" });
    }

    const [balance] = await db
      .select()
      .from(userBalances)
      .where(eq(userBalances.userId, userId));

    const availableBalance = balance ? parseFloat(balance.availableBalance) : 0;

    if (availableBalance < orderTotal) {
      return res.status(400).json({ 
        error: "Insufficient wallet balance",
        required: orderTotal.toFixed(2),
        available: availableBalance.toFixed(2),
        shortfall: (orderTotal - availableBalance).toFixed(2)
      });
    }

    const [service] = await db
      .select({ title: freelancerServices.title })
      .from(freelancerServices)
      .where(eq(freelancerServices.id, order.serviceId));

    const serviceName = service?.title || "Freelancer Service";

    await db.transaction(async (tx) => {
      const newBalance = (availableBalance - orderTotal).toFixed(2);
      
      await tx
        .update(userBalances)
        .set({ 
          availableBalance: newBalance,
          lastUpdated: new Date()
        })
        .where(eq(userBalances.userId, userId));

      await tx.insert(transactions).values({
        userId: userId,
        type: "debit",
        amount: orderTotal.toFixed(2),
        status: "completed",
        description: `Freelancer order payment: ${serviceName} (${order.selectedPackage} package) - Funds held in escrow`,
        reference: orderId,
      });

      await tx
        .update(freelancerOrders)
        .set({ 
          status: "active",
          escrowHeldAmount: orderTotal.toFixed(2),
          paidAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(freelancerOrders.id, orderId));
    });

    const [updatedOrder] = await db
      .select()
      .from(freelancerOrders)
      .where(eq(freelancerOrders.id, orderId));

    const [updatedBalance] = await db
      .select()
      .from(userBalances)
      .where(eq(userBalances.userId, userId));

    res.json({ 
      success: true, 
      message: "Payment successful. Order is now active.",
      order: updatedOrder,
      walletBalance: updatedBalance?.availableBalance || "0.00",
      payment: {
        method: "wallet",
        amount: orderTotal.toFixed(2),
        escrowHeld: orderTotal.toFixed(2),
        platformFee: order.platformFeeAmount,
      }
    });
  } catch (error) {
    console.error("Error processing payment:", error);
    res.status(500).json({ error: "Failed to process payment" });
  }
});

router.post("/:orderId/confirm-paypal", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { orderId } = req.params;
    const { paypalOrderId, paypalCaptureId } = req.body;
    
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const [order] = await db
      .select()
      .from(freelancerOrders)
      .where(eq(freelancerOrders.id, orderId));

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (order.clientId !== userId) {
      return res.status(403).json({ error: "Only the client can confirm this payment" });
    }

    if (order.status !== "pending_payment") {
      return res.status(400).json({ 
        error: `Order is not awaiting payment. Current status: ${order.status}` 
      });
    }

    const orderTotal = parseFloat(order.amountTotal);
    
    const [service] = await db
      .select({ title: freelancerServices.title })
      .from(freelancerServices)
      .where(eq(freelancerServices.id, order.serviceId));

    const serviceName = service?.title || "Freelancer Service";

    await db.transaction(async (tx) => {
      await tx.insert(transactions).values({
        userId: userId,
        type: "debit",
        amount: orderTotal.toFixed(2),
        status: "completed",
        description: `PayPal payment for: ${serviceName} (${order.selectedPackage} package) - Funds held in escrow`,
        reference: orderId,
        metadata: { paypalOrderId, paypalCaptureId },
      });

      await tx
        .update(freelancerOrders)
        .set({ 
          status: "active",
          escrowHeldAmount: orderTotal.toFixed(2),
          paidAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(freelancerOrders.id, orderId));
    });

    const [updatedOrder] = await db
      .select()
      .from(freelancerOrders)
      .where(eq(freelancerOrders.id, orderId));

    res.json({ 
      success: true, 
      message: "PayPal payment confirmed. Order is now active.",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Error confirming PayPal payment:", error);
    res.status(500).json({ error: "Failed to confirm PayPal payment" });
  }
});

const deliverSchema = z.object({
  message: z.string().max(5000).optional(),
  files: z.array(z.object({
    url: z.string(),
    name: z.string(),
    size: z.number().optional(),
    type: z.string().optional(),
  })).optional(),
});

router.post("/:orderId/deliver", requireAuth, requireRole(['freelancer']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { orderId } = req.params;
    
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const validated = deliverSchema.parse(req.body);

    const [order] = await db
      .select()
      .from(freelancerOrders)
      .where(eq(freelancerOrders.id, orderId));

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (order.freelancerId !== userId) {
      return res.status(403).json({ error: "Only the freelancer can deliver this order" });
    }

    if (order.status !== "active" && order.status !== "revision_requested") {
      return res.status(400).json({ 
        error: `Cannot deliver order with status: ${order.status}` 
      });
    }

    const deliveredAt = new Date();
    const autoReleaseAt = new Date(deliveredAt);
    autoReleaseAt.setDate(autoReleaseAt.getDate() + AUTO_RELEASE_DAYS);

    await db.transaction(async (tx) => {
      await tx.insert(freelancerDeliverables).values({
        orderId: orderId,
        message: validated.message || null,
        files: validated.files || [],
        isRevision: order.status === "revision_requested",
      });

      await tx
        .update(freelancerOrders)
        .set({ 
          status: "delivered",
          deliveredAt,
          autoReleaseAt,
          updatedAt: new Date()
        })
        .where(eq(freelancerOrders.id, orderId));
    });

    const [updatedOrder] = await db
      .select()
      .from(freelancerOrders)
      .where(eq(freelancerOrders.id, orderId));

    res.json({ 
      success: true, 
      message: "Order delivered successfully. Client has 3 days to review.",
      order: updatedOrder,
      autoReleaseAt: autoReleaseAt.toISOString(),
    });
  } catch (error) {
    console.error("Error delivering order:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation failed", details: error.errors });
    }
    res.status(500).json({ error: "Failed to deliver order" });
  }
});

async function releaseEscrow(orderId: string, isAutoRelease: boolean = false): Promise<{ success: boolean; error?: string }> {
  try {
    const [order] = await db
      .select()
      .from(freelancerOrders)
      .where(eq(freelancerOrders.id, orderId));

    if (!order) {
      return { success: false, error: "Order not found" };
    }

    if (order.status !== "delivered") {
      return { success: false, error: `Cannot release escrow for order with status: ${order.status}` };
    }

    const escrowAmount = parseFloat(order.escrowHeldAmount || order.amountTotal);
    const platformFee = parseFloat(order.platformFeeAmount);
    const freelancerEarnings = escrowAmount - platformFee;

    const [service] = await db
      .select({ title: freelancerServices.title })
      .from(freelancerServices)
      .where(eq(freelancerServices.id, order.serviceId));

    const serviceName = service?.title || "Freelancer Service";
    const releaseType = isAutoRelease ? "Auto-released" : "Approved by client";

    await db.transaction(async (tx) => {
      const [freelancerBalance] = await tx
        .select()
        .from(userBalances)
        .where(eq(userBalances.userId, order.freelancerId));

      const currentFreelancerBalance = freelancerBalance ? parseFloat(freelancerBalance.availableBalance) : 0;
      const newFreelancerBalance = (currentFreelancerBalance + freelancerEarnings).toFixed(2);

      if (freelancerBalance) {
        await tx
          .update(userBalances)
          .set({ 
            availableBalance: newFreelancerBalance,
            totalEarnings: sql`COALESCE(total_earnings, 0) + ${freelancerEarnings.toFixed(2)}::numeric`,
            lastUpdated: new Date()
          })
          .where(eq(userBalances.userId, order.freelancerId));
      } else {
        await tx.insert(userBalances).values({
          userId: order.freelancerId,
          availableBalance: freelancerEarnings.toFixed(2),
          totalEarnings: freelancerEarnings.toFixed(2),
        });
      }

      await tx.insert(transactions).values({
        userId: order.freelancerId,
        type: "credit",
        amount: freelancerEarnings.toFixed(2),
        status: "completed",
        description: `Freelancer earnings: ${serviceName} (${order.selectedPackage}) - ${releaseType}`,
        reference: orderId,
      });

      const [platformBalance] = await tx
        .select()
        .from(userBalances)
        .where(eq(userBalances.userId, PLATFORM_USER_ID));

      const currentPlatformBalance = platformBalance ? parseFloat(platformBalance.availableBalance) : 0;
      const newPlatformBalance = (currentPlatformBalance + platformFee).toFixed(2);

      if (platformBalance) {
        await tx
          .update(userBalances)
          .set({ 
            availableBalance: newPlatformBalance,
            totalEarnings: sql`COALESCE(total_earnings, 0) + ${platformFee.toFixed(2)}::numeric`,
            lastUpdated: new Date()
          })
          .where(eq(userBalances.userId, PLATFORM_USER_ID));
      } else {
        await tx.insert(userBalances).values({
          userId: PLATFORM_USER_ID,
          availableBalance: platformFee.toFixed(2),
          totalEarnings: platformFee.toFixed(2),
        });
      }

      await tx.insert(transactions).values({
        userId: PLATFORM_USER_ID,
        type: "credit",
        amount: platformFee.toFixed(2),
        status: "completed",
        description: `Platform fee: ${serviceName} (${order.selectedPackage}) - Order #${orderId.slice(0, 8)}`,
        reference: orderId,
      });

      await tx
        .update(freelancerOrders)
        .set({ 
          status: "completed",
          completedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(freelancerOrders.id, orderId));
    });

    return { success: true };
  } catch (error) {
    console.error("Error releasing escrow:", error);
    return { success: false, error: "Failed to release escrow" };
  }
}

router.post("/:orderId/approve", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { orderId } = req.params;
    
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const [order] = await db
      .select()
      .from(freelancerOrders)
      .where(eq(freelancerOrders.id, orderId));

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (order.clientId !== userId) {
      return res.status(403).json({ error: "Only the client can approve this order" });
    }

    if (order.status !== "delivered") {
      return res.status(400).json({ 
        error: `Cannot approve order with status: ${order.status}` 
      });
    }

    const result = await releaseEscrow(orderId, false);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    const [updatedOrder] = await db
      .select()
      .from(freelancerOrders)
      .where(eq(freelancerOrders.id, orderId));

    const escrowAmount = parseFloat(order.escrowHeldAmount || order.amountTotal);
    const platformFee = parseFloat(order.platformFeeAmount);
    const freelancerEarnings = escrowAmount - platformFee;

    res.json({ 
      success: true, 
      message: "Order approved. Payment released to freelancer.",
      order: updatedOrder,
      escrowRelease: {
        totalReleased: escrowAmount.toFixed(2),
        freelancerEarnings: freelancerEarnings.toFixed(2),
        platformFee: platformFee.toFixed(2),
      }
    });
  } catch (error) {
    console.error("Error approving order:", error);
    res.status(500).json({ error: "Failed to approve order" });
  }
});

// Submit a review for a completed order
const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().max(2000).optional(),
});

router.post("/:orderId/review", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { orderId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const validated = reviewSchema.parse(req.body);

    // Get the order
    const [order] = await db
      .select()
      .from(freelancerOrders)
      .where(eq(freelancerOrders.id, orderId));

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Only the client can review
    if (order.clientId !== userId) {
      return res.status(403).json({ error: "Only the buyer can leave a review" });
    }

    // Order must be completed
    if (order.status !== "completed") {
      return res.status(400).json({ error: "You can only review completed orders" });
    }

    // Check if already reviewed
    const [existingReview] = await db
      .select()
      .from(freelancerServiceReviews)
      .where(eq(freelancerServiceReviews.orderId, orderId));

    if (existingReview) {
      return res.status(400).json({ error: "You have already reviewed this order" });
    }

    // Create the review
    const [review] = await db.insert(freelancerServiceReviews).values({
      serviceId: order.serviceId,
      orderId: order.id,
      reviewerId: userId,
      freelancerId: order.freelancerId,
      rating: validated.rating,
      comment: validated.comment || null,
    }).returning();

    // Update service average rating
    const ratingResult = await db
      .select({
        avgRating: avg(freelancerServiceReviews.rating),
        totalReviews: count(freelancerServiceReviews.id),
      })
      .from(freelancerServiceReviews)
      .where(eq(freelancerServiceReviews.serviceId, order.serviceId));

    if (ratingResult[0]) {
      await db
        .update(freelancerServices)
        .set({
          averageRating: ratingResult[0].avgRating ? parseFloat(String(ratingResult[0].avgRating)).toFixed(1) : null,
          totalReviews: Number(ratingResult[0].totalReviews),
        })
        .where(eq(freelancerServices.id, order.serviceId));
    }

    res.json({ success: true, review });
  } catch (error) {
    console.error("Error submitting review:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    res.status(500).json({ error: "Failed to submit review" });
  }
});

// Get reviews for a service (public endpoint)
router.get("/services/:serviceId/reviews", async (req, res: Response) => {
  try {
    const { serviceId } = req.params;

    const reviews = await db
      .select({
        id: freelancerServiceReviews.id,
        rating: freelancerServiceReviews.rating,
        comment: freelancerServiceReviews.comment,
        sellerResponse: freelancerServiceReviews.sellerResponse,
        createdAt: freelancerServiceReviews.createdAt,
        reviewerName: profiles.fullName,
        reviewerAvatar: profiles.profilePicture,
      })
      .from(freelancerServiceReviews)
      .leftJoin(profiles, eq(freelancerServiceReviews.reviewerId, profiles.userId))
      .where(and(
        eq(freelancerServiceReviews.serviceId, serviceId),
        eq(freelancerServiceReviews.isPublic, true)
      ))
      .orderBy(desc(freelancerServiceReviews.createdAt));

    res.json({ reviews });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

// Freelancer responds to a review
router.post("/reviews/:reviewId/respond", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { reviewId } = req.params;
    const { response } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!response || typeof response !== "string" || response.length > 1000) {
      return res.status(400).json({ error: "Response must be between 1-1000 characters" });
    }

    const [review] = await db
      .select()
      .from(freelancerServiceReviews)
      .where(eq(freelancerServiceReviews.id, reviewId));

    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    if (review.freelancerId !== userId) {
      return res.status(403).json({ error: "Only the seller can respond to this review" });
    }

    if (review.sellerResponse) {
      return res.status(400).json({ error: "You have already responded to this review" });
    }

    const [updated] = await db
      .update(freelancerServiceReviews)
      .set({
        sellerResponse: response,
        sellerRespondedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(freelancerServiceReviews.id, reviewId))
      .returning();

    res.json({ success: true, review: updated });
  } catch (error) {
    console.error("Error responding to review:", error);
    res.status(500).json({ error: "Failed to respond to review" });
  }
});

export async function processAutoReleaseOrders(): Promise<{ processed: number; errors: number }> {
  const now = new Date();
  let processed = 0;
  let errors = 0;

  try {
    const ordersToRelease = await db
      .select()
      .from(freelancerOrders)
      .where(and(
        eq(freelancerOrders.status, "delivered"),
        lte(freelancerOrders.autoReleaseAt, now)
      ));

    console.log(`[Auto-Release] Found ${ordersToRelease.length} orders to auto-release`);

    for (const order of ordersToRelease) {
      const result = await releaseEscrow(order.id, true);
      if (result.success) {
        processed++;
        console.log(`[Auto-Release] Successfully released order ${order.id}`);
      } else {
        errors++;
        console.error(`[Auto-Release] Failed to release order ${order.id}: ${result.error}`);
      }
    }
  } catch (error) {
    console.error("[Auto-Release] Error processing auto-release orders:", error);
  }

  return { processed, errors };
}

export default router;
