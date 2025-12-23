import { Router } from "express";
import { db } from "../db";
import { orders, orderItems, products, users, profiles, carts, cartItems, shopPurchases, shopCustomers, coupons, couponUsages } from "../../shared/schema";
import { eq, desc, and, or, sql, sum, count } from "drizzle-orm";
import { insertOrderSchema, insertOrderItemSchema } from "../../shared/schema";
import { requireAuth, requireRole, type AuthenticatedRequest } from "../middleware/auth";
import crypto from "crypto";
import { z } from "zod";
import PDFDocument from "pdfkit";
import type { Response } from "express";
import path from "path";
import fs from "fs";

// Validation schemas
const checkoutRequestSchema = z.object({
  shippingAddress: z.string().optional(),
  paymentMethod: z.enum(["stripe", "paypal", "bank_transfer"]).default("stripe"),
  customerNotes: z.string().optional(),
  couponId: z.string().optional(), // Optional coupon ID
});

const guestCheckoutRequestSchema = z.object({
  guestEmail: z.string().email(),
  guestCartItems: z.array(z.object({
    productId: z.string(),
    quantity: z.number().min(1),
    priceAtAdd: z.string(),
  })),
  shippingAddress: z.string().optional(),
  paymentMethod: z.enum(["stripe", "paypal", "bank_transfer"]).default("stripe"),
  customerNotes: z.string().optional(),
});

const updateOrderStatusSchema = z.object({
  status: z.enum(["pending", "paid", "processing", "shipped", "delivered", "cancelled", "refunded"]),
});

const router = Router();

// Helper function to check if a string is a valid UUID
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

// Checkout - Create order from cart
router.post("/checkout", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    // Validate request body
    const validationResult = checkoutRequestSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        success: false, 
        error: "Invalid request data",
        details: validationResult.error.errors
      });
    }
    
    const { shippingAddress, paymentMethod, customerNotes, couponId } = validationResult.data;

    // Use transaction to ensure atomicity
    const result = await db.transaction(async (tx) => {
      // Get user's cart with items
      const userCart = await tx
        .select()
        .from(carts)
        .where(eq(carts.userId, req.user!.id))
        .limit(1);

      if (!userCart[0]) {
        throw new Error("Cart is empty");
      }

      // Get cart items with product details
      const cartItemsList = await tx
        .select({
          cartItem: cartItems,
          product: products,
          seller: {
            id: users.id,
            name: profiles.name,
          }
        })
        .from(cartItems)
        .leftJoin(products, eq(cartItems.productId, products.id))
        .leftJoin(users, eq(products.sellerId, users.id))
        .leftJoin(profiles, eq(users.id, profiles.userId))
        .where(eq(cartItems.cartId, userCart[0].id));

      if (cartItemsList.length === 0) {
        throw new Error("Cart is empty");
      }

      // Validate all products are still available and calculate total
      let totalAmount = 0;
      const currencies = new Set<string>();
      
      for (const item of cartItemsList) {
        if (!item.product || item.product.status !== "approved") {
          throw new Error(`Product ${item.product?.name || 'unknown'} is no longer available`);
        }

        // Check stock for physical products with atomic check
        if (item.product.type === "physical" && item.product.stock !== null) {
          const [stockCheck] = await tx
            .select({ stock: products.stock })
            .from(products)
            .where(eq(products.id, item.product.id))
            .limit(1);
            
          if (!stockCheck || stockCheck.stock === null || stockCheck.stock < item.cartItem.quantity) {
            throw new Error(`Insufficient stock for ${item.product.name}`);
          }
        }

        // Collect currencies for consistency check
        if (item.product.currency) {
          currencies.add(item.product.currency);
        }

        totalAmount += parseFloat(item.cartItem.priceAtAdd) * item.cartItem.quantity;
      }

      // Ensure single currency per order
      if (currencies.size > 1) {
        throw new Error("All items in an order must use the same currency");
      }
      
      const orderCurrency = currencies.size === 1 ? Array.from(currencies)[0] : "USD";

      // Handle coupon validation and discount calculation
      let discountAmount = 0;
      let validatedCoupon = null;
      
      if (couponId) {
        const [coupon] = await tx
          .select()
          .from(coupons)
          .where(eq(coupons.id, couponId))
          .limit(1);

        if (!coupon) {
          throw new Error("Invalid coupon");
        }

        // Validate coupon
        const now = new Date();
        if (!coupon.isActive) throw new Error("Coupon is not active");
        if (coupon.startDate && new Date(coupon.startDate) > now) throw new Error("Coupon is not yet valid");
        if (coupon.endDate && new Date(coupon.endDate) < now) throw new Error("Coupon has expired");
        if (coupon.minOrderAmount && totalAmount < parseFloat(coupon.minOrderAmount)) {
          throw new Error(`Minimum order amount of $${coupon.minOrderAmount} required`);
        }
        if (coupon.totalUsageLimit && (coupon.usageCount ?? 0) >= coupon.totalUsageLimit) {
          throw new Error("Coupon usage limit reached");
        }

        // Check per-user limit
        const [userUsageResult] = await tx
          .select({ count: count() })
          .from(couponUsages)
          .where(and(
            eq(couponUsages.couponId, coupon.id),
            eq(couponUsages.userId, req.user!.id)
          ));

        if (coupon.perUserLimit && (userUsageResult?.count ?? 0) >= coupon.perUserLimit) {
          throw new Error("You have reached the usage limit for this coupon");
        }

        // Calculate discount
        if (coupon.discountType === 'percentage') {
          discountAmount = (totalAmount * parseFloat(coupon.discountValue)) / 100;
          if (coupon.maxDiscount && discountAmount > parseFloat(coupon.maxDiscount)) {
            discountAmount = parseFloat(coupon.maxDiscount);
          }
        } else {
          discountAmount = parseFloat(coupon.discountValue);
        }

        discountAmount = Math.min(discountAmount, totalAmount);
        validatedCoupon = coupon;
      }

      const finalAmount = totalAmount - discountAmount;

      // Create order
      const [order] = await tx
        .insert(orders)
        .values({
          userId: req.user!.id,
          totalAmount: finalAmount.toString(),
          currency: orderCurrency,
          paymentMethod,
          shippingAddress: shippingAddress || null,
          customerNotes: customerNotes || null,
          couponId: validatedCoupon?.id || null,
          discountAmount: discountAmount.toString(),
          status: "pending"
        })
        .returning();

      // Create order items
      const orderItemsData = cartItemsList.map(item => {
        const unitPrice = item.cartItem.priceAtAdd;
        const totalPrice = (parseFloat(unitPrice) * item.cartItem.quantity).toFixed(2);
        return {
          orderId: order.id,
          productId: item.product!.id,
          quantity: item.cartItem.quantity,
          unitPrice: unitPrice,
          totalPrice: totalPrice,
          price: unitPrice, // Keep for backward compatibility
        };
      });

      const createdOrderItems = await tx
        .insert(orderItems)
        .values(orderItemsData)
        .returning();

      // Update stock for physical products with race condition protection
      for (const item of cartItemsList) {
        if (item.product && item.product.type === "physical" && item.product.stock !== null) {
          const updateResult = await tx
            .update(products)
            .set({ 
              stock: sql`${products.stock} - ${item.cartItem.quantity}`,
              updatedAt: new Date()
            })
            .where(and(
              eq(products.id, item.product.id),
              sql`${products.stock} >= ${item.cartItem.quantity}` // Prevent negative stock
            ))
            .returning({ id: products.id });

          if (updateResult.length === 0) {
            throw new Error(`Failed to update stock for ${item.product.name} - insufficient stock available`);
          }
        }
      }

      // Record coupon usage if coupon was applied
      if (validatedCoupon) {
        await tx.insert(couponUsages).values({
          couponId: validatedCoupon.id,
          userId: req.user!.id,
          orderId: order.id,
          cartId: userCart[0].id,
          discountApplied: discountAmount.toString(),
          orderTotal: totalAmount.toString(),
        });

        // Increment coupon usage count
        await tx
          .update(coupons)
          .set({ 
            usageCount: sql`${coupons.usageCount} + 1`,
            updatedAt: new Date()
          })
          .where(eq(coupons.id, validatedCoupon.id));
      }

      // Clear cart after successful checkout
      await tx
        .delete(cartItems)
        .where(eq(cartItems.cartId, userCart[0].id));

      // Store item names for email
      const itemsForEmail = cartItemsList.map(item => ({
        name: item.product?.name || 'Product',
        quantity: item.cartItem.quantity,
        price: parseFloat(item.cartItem.priceAtAdd)
      }));

      return {
        order,
        items: createdOrderItems,
        userProfile: await tx.select().from(profiles).where(eq(profiles.userId, req.user!.id)).limit(1).then(p => p[0]),
        itemsForEmail
      };
    });

    // Send confirmation email and generate receipt
    try {
      const { emailService } = await import('../utils/email.js');
      const { ReceiptService } = await import('../services/receipts.js');
      const userEmail = result.userProfile?.email || req.user!.email;
      
      if (userEmail) {
        // Generate and send receipt with PDF attachment
        await ReceiptService.generateAndSendOrderReceipt({
          orderId: result.order.id,
          userId: req.user!.id,
          userEmail: userEmail,
          userName: result.userProfile?.name,
          items: result.itemsForEmail.map(item => ({
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.price,
            totalPrice: item.price * item.quantity
          })),
          totalAmount: parseFloat(result.order.totalAmount),
          currency: result.order.currency,
          paymentMethod: result.order.paymentMethod
        });
        console.log('📧 Order confirmation email with receipt sent to:', userEmail);
      }
    } catch (emailError) {
      console.error('Failed to send order confirmation email with receipt:', emailError);
    }

    res.status(201).json({ 
      success: true, 
      data: { 
        order: result.order,
        items: result.items,
        message: "Order created successfully"
      }
    });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// Guest Checkout - Create order from guest cart data (no authentication required)
router.post("/guest-checkout", async (req, res) => {
  try {
    // Validate request body
    const validationResult = guestCheckoutRequestSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        success: false, 
        error: "Invalid request data",
        details: validationResult.error.errors
      });
    }
    
    const { guestEmail, guestCartItems, shippingAddress, paymentMethod, customerNotes } = validationResult.data;

    // Use transaction to ensure atomicity
    const result = await db.transaction(async (tx) => {
      // Validate all products are still available and calculate total
      let totalAmount = 0;
      const currencies = new Set<string>();
      const validatedItems = [];
      
      for (const cartItem of guestCartItems) {
        // Get product details and validate
        const [product] = await tx
          .select()
          .from(products)
          .where(and(
            eq(products.id, cartItem.productId),
            eq(products.status, "approved")
          ))
          .limit(1);

        if (!product) {
          throw new Error(`Product ${cartItem.productId} is not available`);
        }

        // Check stock for physical products
        if (product.type === "physical" && product.stock !== null) {
          if (product.stock < cartItem.quantity) {
            throw new Error(`Insufficient stock for ${product.name}`);
          }
        }

        // Collect currencies for consistency check
        if (product.currency) {
          currencies.add(product.currency);
        }

        totalAmount += parseFloat(cartItem.priceAtAdd) * cartItem.quantity;
        validatedItems.push({ cartItem, product });
      }

      // Ensure single currency per order
      if (currencies.size > 1) {
        throw new Error("All items in an order must use the same currency");
      }
      
      const orderCurrency = currencies.size === 1 ? Array.from(currencies)[0] : "USD";

      // Create order with guest email (userId is null)
      // Use raw SQL to avoid schema column mismatches
      const [order] = await tx.execute(sql`
        INSERT INTO orders (
          user_id, guest_email, total_amount, currency, 
          payment_method, shipping_address, customer_notes, status
        ) VALUES (
          ${null}, ${guestEmail}, ${totalAmount.toString()}, ${orderCurrency},
          ${paymentMethod}, ${shippingAddress || null}, ${customerNotes || null}, ${"pending"}
        ) RETURNING *
      `);

      // Create order items using raw SQL to avoid schema mismatches
      const createdOrderItems = [];
      for (const { cartItem, product } of validatedItems) {
        const [item] = await tx.execute(sql`
          INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
          VALUES (
            ${order.id}, ${product.id}, ${cartItem.quantity}, 
            ${cartItem.priceAtAdd}, ${(parseFloat(cartItem.priceAtAdd) * cartItem.quantity).toFixed(2)}
          ) RETURNING *
        `);
        createdOrderItems.push(item);
      }

      // Update stock for physical products with race condition protection
      for (const { cartItem, product } of validatedItems) {
        if (product.type === "physical" && product.stock !== null) {
          const updateResult = await tx
            .update(products)
            .set({ 
              stock: sql`${products.stock} - ${cartItem.quantity}`,
              updatedAt: new Date()
            })
            .where(and(
              eq(products.id, product.id),
              sql`${products.stock} >= ${cartItem.quantity}` // Prevent negative stock
            ))
            .returning({ id: products.id });

          if (updateResult.length === 0) {
            throw new Error(`Failed to update stock for ${product.name} - insufficient stock available`);
          }
        }
      }

      // Store item names for email
      const itemsForEmail = validatedItems.map(({ cartItem, product }) => ({
        name: product.name,
        quantity: cartItem.quantity,
        price: parseFloat(cartItem.priceAtAdd)
      }));

      return {
        order,
        items: createdOrderItems,
        itemsForEmail
      };
    });

    // Send confirmation email with receipt for guest checkout
    try {
      const { ReceiptService } = await import('../services/receipts.js');
      
      // Generate and send receipt to guest email
      await ReceiptService.generateAndSendOrderReceipt({
        orderId: result.order.id,
        userId: null,
        userEmail: guestEmail,
        userName: 'Guest Customer',
        items: result.itemsForEmail.map(item => ({
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.price,
          totalPrice: item.price * item.quantity
        })),
        totalAmount: parseFloat(result.order.total_amount),
        currency: result.order.currency,
        paymentMethod: result.order.payment_method
      });
      console.log('📧 Guest order confirmation email with receipt sent to:', guestEmail);
    } catch (emailError) {
      console.error('Failed to send guest order confirmation email with receipt:', emailError);
    }

    res.status(201).json({ 
      success: true, 
      data: { 
        order: result.order,
        items: result.items,
        message: "Guest order created successfully"
      }
    });
  } catch (error) {
    console.error("Error creating guest order:", error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Internal server error" });
  }
});

// Get user's orders
router.get("/", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userOrders = await db
      .select({
        order: orders,
      })
      .from(orders)
      .where(eq(orders.userId, req.user!.id))
      .orderBy(desc(orders.createdAt));

    // Fetch order items separately to avoid complex SQL
    const ordersWithItems = await Promise.all(
      userOrders.map(async (orderData) => {
        const items = await db
          .select({
            id: orderItems.id,
            quantity: orderItems.quantity,
            price: orderItems.price,
            product: {
              id: products.id,
              name: products.name,
              type: products.type,
              images: products.images,
            },
            seller: {
              id: users.id,
              name: profiles.name,
            }
          })
          .from(orderItems)
          .leftJoin(products, eq(orderItems.productId, products.id))
          .leftJoin(users, eq(products.sellerId, users.id))
          .leftJoin(profiles, eq(users.id, profiles.userId))
          .where(eq(orderItems.orderId, orderData.order.id));

        return {
          order: orderData.order,
          items: items
        };
      })
    );

    res.json({ success: true, data: ordersWithItems });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// Get specific order details
router.get("/:orderId", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { orderId } = req.params;

    let order: any = null;

    // Only try to get order from orders table if orderId is a valid UUID
    if (isValidUUID(orderId)) {
      const result = await db
        .select()
        .from(orders)
        .where(and(
          eq(orders.id, orderId),
          eq(orders.userId, req.user!.id)
        ))
        .limit(1);
      
      order = result[0];
    }

    if (order) {
      // Get order items with product and seller details
      const items = await db
        .select({
          id: orderItems.id,
          quantity: orderItems.quantity,
          price: orderItems.price,
          product: {
            id: products.id,
            name: products.name,
            description: products.description,
            type: products.type,
            images: products.images,
          },
          seller: {
            id: users.id,
            name: profiles.name,
            displayName: profiles.displayName,
          }
        })
        .from(orderItems)
        .leftJoin(products, eq(orderItems.productId, products.id))
        .leftJoin(users, eq(products.sellerId, users.id))
        .leftJoin(profiles, eq(users.id, profiles.userId))
        .where(eq(orderItems.orderId, orderId));

      const orderWithItems = {
        order,
        items: items
      };

      return res.json({ success: true, data: orderWithItems });
    }

    // If not found in orders table, check shopPurchases table
    const [shopCustomer] = await db
      .select()
      .from(shopCustomers)
      .where(eq(shopCustomers.userId, req.user!.id))
      .limit(1);

    if (!shopCustomer) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    const [purchase] = await db
      .select()
      .from(shopPurchases)
      .where(and(
        eq(shopPurchases.orderId, orderId),
        eq(shopPurchases.customerId, shopCustomer.id)
      ))
      .limit(1);

    if (!purchase) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    // Transform shopPurchase to match order format
    // Ensure price is properly handled as a string (numeric type from DB)
    if (!purchase.price || purchase.price === null || purchase.price === undefined) {
      return res.status(500).json({ success: false, error: "Purchase data is incomplete" });
    }
    const priceStr = typeof purchase.price === 'string' ? purchase.price : String(purchase.price);
    
    const orderFromPurchase = {
      id: purchase.orderId,
      userId: req.user!.id,
      totalAmount: priceStr,
      currency: "USD",
      paymentMethod: "stripe",
      status: purchase.status || "paid",
      createdAt: purchase.createdAt,
      shippingAddress: null,
      customerNotes: null,
      guestEmail: null,
      completedAt: null,
      updatedAt: purchase.createdAt,
    };

    const items = [{
      id: purchase.id,
      quantity: 1,
      price: priceStr,
      product: {
        id: purchase.id,
        name: purchase.itemName || 'Unknown Item',
        description: null,
        type: purchase.itemType || 'digital',
        images: purchase.thumbnailUrl ? [purchase.thumbnailUrl] : [],
      },
      seller: {
        id: null,
        name: "Platform",
        displayName: null,
      }
    }];

    res.json({ 
      success: true, 
      data: {
        order: orderFromPurchase,
        items: items
      }
    });
  } catch (error) {
    console.error("Error fetching order details:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// Update order status (admin/seller only)
router.put("/:orderId/status", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { orderId } = req.params;
    
    // Validate request body
    const validationResult = updateOrderStatusSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        success: false, 
        error: "Invalid request data",
        details: validationResult.error.errors
      });
    }
    
    const { status } = validationResult.data;

    // Get order first
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    // Check if user has permission to update this order
    const isAdmin = req.user!.role === "admin";
    let isSeller = false;

    if (!isAdmin) {
      // Check if user is a seller of any product in this order
      const orderItemsWithProducts = await db
        .select({
          sellerId: products.sellerId
        })
        .from(orderItems)
        .leftJoin(products, eq(orderItems.productId, products.id))
        .where(eq(orderItems.orderId, orderId));

      isSeller = orderItemsWithProducts.some(item => item.sellerId === req.user!.id);
    }

    if (!isAdmin && !isSeller) {
      return res.status(403).json({ success: false, error: "Not authorized to update this order" });
    }

    // Update order
    const [updatedOrder] = await db
      .update(orders)
      .set({ 
        status,
        completedAt: status === "delivered" ? new Date() : null,
        updatedAt: new Date()
      })
      .where(eq(orders.id, orderId))
      .returning();

    // Trigger earning events and increment sales count when order is marked as paid or delivered
    // Use transaction to ensure atomicity and prevent double-counting
    if (status === "paid" || status === "delivered") {
      try {
        // Import required schemas
        const { creatorEarningEvents, creatorBalances, transactions, userBalances } = await import('../../shared/schema.js');
        
        // Use transaction to ensure atomicity
        await db.transaction(async (tx) => {
          // Lock the order row to prevent concurrent processing (FOR UPDATE)
          await tx.execute(sql`SELECT id FROM orders WHERE id = ${orderId} FOR UPDATE`);
          
          // Check if earning events already exist for this order (within transaction, after lock)
          const existingEarnings = await tx
            .select()
            .from(creatorEarningEvents)
            .where(eq(creatorEarningEvents.orderId, orderId))
            .limit(1);

          // Only process if no earnings have been recorded yet
          if (existingEarnings.length === 0) {
            // Get all order items with product details
            const itemsWithProducts = await tx
              .select({
                item: orderItems,
                product: products
              })
              .from(orderItems)
              .leftJoin(products, eq(orderItems.productId, products.id))
              .where(eq(orderItems.orderId, orderId));

            // Record earning and increment sales count for each product
            for (const { item, product } of itemsWithProducts) {
              if (product && product.sellerId) {
                // Skip admin-owned (system-created) products
                if (product.sellerRole === 'admin') {
                  console.log(`Skipping system-created product: ${product.name}`);
                  continue;
                }
                
                const saleAmount = parseFloat(item.totalPrice);
                const PLATFORM_COMMISSION_RATE = 0.25;
                
                // Calculate commission split
                const grossCents = Math.round(saleAmount * 100);
                const platformCommissionCents = Math.round(grossCents * PLATFORM_COMMISSION_RATE);
                const creatorAmountCents = grossCents - platformCommissionCents;
                const creatorAmount = (creatorAmountCents / 100).toFixed(2);
                const platformCommission = (platformCommissionCents / 100).toFixed(2);

                // Create earning event within transaction
                await tx.insert(creatorEarningEvents).values({
                  creatorId: product.sellerId,
                  creatorRole: product.sellerRole as 'freelancer' | 'teacher' | 'admin',
                  eventType: 'product_sale',
                  sourceType: 'product',
                  sourceId: product.id,
                  orderId: orderId,
                  grossAmount: saleAmount.toFixed(2),
                  platformCommission: platformCommission,
                  creatorAmount: creatorAmount,
                  status: 'available',
                  metadata: {
                    productName: product.name,
                    salePrice: saleAmount
                  }
                });

                // Create transaction record for creator's credit
                await tx.insert(transactions).values({
                  userId: product.sellerId,
                  type: 'credit',
                  amount: creatorAmount,
                  status: 'completed',
                  description: `Earnings from ${product.name} (Order #${orderId.substring(0, 8)})`,
                  reference: orderId,
                });

                // Reconcile balances from transaction ledger (deterministic approach)
                const totals = await tx.execute(sql`
                  SELECT 
                    COALESCE(SUM(CASE WHEN type = 'credit' AND status = 'completed' THEN amount::numeric ELSE 0 END), 0) as total_credits,
                    COALESCE(SUM(CASE WHEN type = 'debit' AND status = 'completed' THEN amount::numeric ELSE 0 END), 0) as total_debits,
                    COALESCE(SUM(CASE WHEN type = 'debit' AND status = 'pending' THEN amount::numeric ELSE 0 END), 0) as pending_debits
                  FROM transactions
                  WHERE user_id = ${product.sellerId}
                `);

                const totalCredits = totals.rows[0]?.total_credits || '0';
                const totalDebits = totals.rows[0]?.total_debits || '0';
                const pendingDebits = totals.rows[0]?.pending_debits || '0';
                const available = (parseFloat(totalCredits) - parseFloat(totalDebits) - parseFloat(pendingDebits)).toFixed(2);

                // Set userBalances to absolute values (derived from transaction ledger)
                await tx.execute(sql`
                  INSERT INTO user_balances (
                    user_id, available_balance, total_earnings, total_withdrawn, pending_payouts, last_updated, created_at
                  ) VALUES (
                    ${product.sellerId}, ${available}, ${totalCredits}, ${totalDebits}, ${pendingDebits}, NOW(), NOW()
                  )
                  ON CONFLICT (user_id) DO UPDATE SET
                    available_balance = ${available},
                    total_earnings = ${totalCredits},
                    total_withdrawn = ${totalDebits},
                    pending_payouts = ${pendingDebits},
                    last_updated = NOW()
                `);

                // Set creatorBalances to absolute values (derived from transaction ledger)
                await tx.execute(sql`
                  INSERT INTO creator_balances (
                    creator_id, available_balance, pending_balance, lifetime_earnings, total_withdrawn, created_at, updated_at
                  ) VALUES (
                    ${product.sellerId}, ${available}, ${pendingDebits}, ${totalCredits}, ${totalDebits}, NOW(), NOW()
                  )
                  ON CONFLICT (creator_id) DO UPDATE SET
                    available_balance = ${available},
                    pending_balance = ${pendingDebits},
                    lifetime_earnings = ${totalCredits},
                    total_withdrawn = ${totalDebits},
                    updated_at = NOW()
                `);

                // Increment sales count by the quantity purchased within transaction
                await tx
                  .update(products)
                  .set({ 
                    salesCount: sql`${products.salesCount} + ${item.quantity}` 
                  })
                  .where(eq(products.id, product.id));
              }
            }

            console.log(`💰 Earning events, transactions, and balances recorded for order ${orderId}`);
          } else {
            console.log(`⏭️  Order ${orderId} already has earning events, skipping duplicate processing`);
          }
        });
      } catch (earningError) {
        console.error('Failed to record earnings for order:', earningError);
        // Transaction will auto-rollback on error, ensuring consistency
      }
    }

    res.json({ success: true, data: updatedOrder });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// Get orders for sellers/admin
router.get("/seller/orders", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    // Only allow sellers and admins
    if (!["admin", "teacher", "freelancer"].includes(req.user!.role)) {
      return res.status(403).json({ success: false, error: "Access denied" });
    }

    let ordersQuery;
    
    if (req.user!.role === "admin") {
      // Admin can see all orders
      ordersQuery = db
        .select({
          order: orders,
          buyer: {
            id: users.id,
            name: profiles.name,
            email: users.email
          }
        })
        .from(orders)
        .leftJoin(users, eq(orders.userId, users.id))
        .leftJoin(profiles, eq(users.id, profiles.userId))
        .orderBy(desc(orders.createdAt));
    } else {
      // Sellers can only see orders for their products
      ordersQuery = db
        .select({
          order: orders,
          buyer: {
            id: users.id,
            name: profiles.name,
            email: users.email
          }
        })
        .from(orders)
        .leftJoin(orderItems, eq(orders.id, orderItems.orderId))
        .leftJoin(products, eq(orderItems.productId, products.id))
        .leftJoin(users, eq(orders.userId, users.id))
        .leftJoin(profiles, eq(users.id, profiles.userId))
        .where(eq(products.sellerId, req.user!.id))
        .groupBy(orders.id, users.id, profiles.id)
        .orderBy(desc(orders.createdAt));
    }

    const sellerOrdersData = await ordersQuery;

    // Fetch items for each order separately to avoid complex SQL
    const sellerOrders = await Promise.all(
      sellerOrdersData.map(async (orderData) => {
        const items = await db
          .select({
            id: orderItems.id,
            quantity: orderItems.quantity,
            price: orderItems.price,
            product: {
              id: products.id,
              name: products.name,
              type: products.type,
              images: products.images,
            }
          })
          .from(orderItems)
          .leftJoin(products, eq(orderItems.productId, products.id))
          .where(eq(orderItems.orderId, orderData.order.id));

        return {
          order: orderData.order,
          buyer: orderData.buyer,
          items: items
        };
      })
    );

    res.json({ success: true, data: sellerOrders });
  } catch (error) {
    console.error("Error fetching seller orders:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// Download digital product (for completed orders)
router.get("/:orderId/download/:itemId", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { orderId, itemId } = req.params;

    // Get order item with product details
    const orderItem = await db
      .select({
        orderItem: orderItems,
        order: orders,
        product: products
      })
      .from(orderItems)
      .leftJoin(orders, eq(orderItems.orderId, orders.id))
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(and(
        eq(orderItems.id, itemId),
        eq(orders.id, orderId),
        eq(orders.userId, req.user!.id),
        eq(orders.status, "delivered")
      ))
      .limit(1);

    if (!orderItem[0]) {
      return res.status(404).json({ 
        success: false, 
        error: "Order item not found or not available for download" 
      });
    }

    const { product } = orderItem[0];

    if (!product || product.type !== "digital" || !product.fileUrl) {
      return res.status(400).json({ 
        success: false, 
        error: "Product is not a downloadable digital item" 
      });
    }

    // TODO: Implement download tracking and limits
    // For now, return the download URL
    res.json({ 
      success: true, 
      data: { 
        downloadUrl: product.fileUrl,
        fileName: `${product.name}.zip`
      }
    });
  } catch (error) {
    console.error("Error processing download:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// Download order slip/receipt as PDF
router.get("/:orderId/slip", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { orderId } = req.params;

    let order: any;
    let buyer: any;
    let enrichedItems: any[] = [];
    let orderData: any = null;

    // Only try to get order from orders table if orderId is a valid UUID
    if (isValidUUID(orderId)) {
      const result = await db
        .select({
          order: orders,
          buyer: {
            name: profiles.name,
            email: users.email,
          }
        })
        .from(orders)
        .leftJoin(users, eq(orders.userId, users.id))
        .leftJoin(profiles, eq(users.id, profiles.userId))
        .where(and(
          eq(orders.id, orderId),
          eq(orders.userId, req.user!.id)
        ))
        .limit(1);
      
      orderData = result[0];
    }

    if (orderData) {
      // Get order items with product details
      const items = await db
        .select({
          id: orderItems.id,
          quantity: orderItems.quantity,
          price: orderItems.price,
          product: {
            id: products.id,
            name: products.name,
            type: products.type,
          },
          seller: {
            name: profiles.name,
          }
        })
        .from(orderItems)
        .leftJoin(products, eq(orderItems.productId, products.id))
        .leftJoin(users, eq(products.sellerId, users.id))
        .leftJoin(profiles, eq(users.id, profiles.userId))
        .where(eq(orderItems.orderId, orderId));

      order = orderData.order;
      buyer = orderData.buyer;
      enrichedItems = items;
    } else {
      // If not found in orders table, check shopPurchases table
      const [shopCustomer] = await db
        .select()
        .from(shopCustomers)
        .where(eq(shopCustomers.userId, req.user!.id))
        .limit(1);

      if (!shopCustomer) {
        return res.status(404).json({ success: false, error: "Order not found" });
      }

      const [purchase] = await db
        .select()
        .from(shopPurchases)
        .where(and(
          eq(shopPurchases.orderId, orderId),
          eq(shopPurchases.customerId, shopCustomer.id)
        ))
        .limit(1);

      if (!purchase) {
        return res.status(404).json({ success: false, error: "Order not found" });
      }

      // Transform shopPurchase to match order format
      // Ensure price is properly handled as a string (numeric type from DB)
      if (!purchase.price || purchase.price === null || purchase.price === undefined) {
        if (!res.headersSent) {
          return res.status(500).json({ success: false, error: "Purchase data is incomplete" });
        }
        return;
      }
      const priceStr = typeof purchase.price === 'string' ? purchase.price : String(purchase.price);
      
      order = {
        id: purchase.orderId,
        userId: req.user!.id,
        totalAmount: priceStr,
        currency: "USD",
        paymentMethod: "stripe",
        status: purchase.status || "paid",
        createdAt: purchase.createdAt,
        shippingAddress: null,
        customerNotes: null,
        guestEmail: null,
      };

      buyer = {
        name: shopCustomer.fullName || 'N/A',
        email: shopCustomer.email || 'N/A',
      };

      enrichedItems = [{
        id: purchase.id,
        quantity: 1,
        price: priceStr,
        product: {
          id: purchase.id,
          name: purchase.itemName || 'Unknown Item',
          type: purchase.itemType || 'digital',
        },
        seller: {
          name: "Platform",
        }
      }];
    }

    // Create PDF document with professional design
    const doc = new PDFDocument({ margin: 0, size: 'A4' });

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=order-slip-${orderId.substring(0, 8)}.pdf`);

    // Pipe PDF to response
    doc.pipe(res);

    // Professional Header with border
    doc.rect(0, 0, 612, 120).fillAndStroke('#FFFFFF', '#E5E7EB');
    
    // Add Logo Image
    const logoPath = path.join(process.cwd(), 'attached_assets', 'Edufiliova_Logo_Optimized.png');
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 50, 25, { width: 150, height: 50, fit: [150, 50] });
    } else {
      // Fallback to text if logo not found
      doc.fontSize(24).fillColor('#4169E1').font('Helvetica-Bold');
      doc.text('edufiliova', 50, 35);
    }
    
    // Tagline
    doc.fontSize(9).fillColor('#6B7280').font('Helvetica');
    doc.text('Edufiliova — Creativity, Learning, and Growth in One Place.', 50, 82);

    // INVOICE text on right
    doc.fontSize(32).fillColor('#111827').font('Helvetica-Bold');
    doc.text('INVOICE', 400, 35, { align: 'right', width: 150 });
    doc.fontSize(9).fillColor('#6B7280').font('Helvetica');
    doc.text('Order Receipt', 400, 75, { align: 'right', width: 150 });

    // Invoice Details Section
    doc.fillColor('#111827').fontSize(8).font('Helvetica-Bold');
    doc.text('INVOICE DETAILS', 50, 150);
    doc.font('Helvetica').fontSize(7).fillColor('#6B7280');
    doc.text('Invoice Number', 50, 170);
    doc.fillColor('#111827').fontSize(9).font('Helvetica-Bold');
    doc.text(`#${orderId.substring(0, 12).toUpperCase()}`, 50, 182);

    doc.font('Helvetica').fontSize(7).fillColor('#6B7280');
    doc.text('Date Issued', 50, 200);
    doc.fillColor('#111827').fontSize(9).font('Helvetica');
    doc.text(new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), 50, 212);

    doc.font('Helvetica').fontSize(7).fillColor('#6B7280');
    doc.text('Status', 50, 230);
    doc.fillColor('#111827').fontSize(9).font('Helvetica-Bold');
    doc.text(order.status.toUpperCase(), 50, 242);

    // Payment Information Section
    doc.fillColor('#111827').fontSize(8).font('Helvetica-Bold');
    doc.text('PAYMENT INFORMATION', 320, 150);
    doc.font('Helvetica').fontSize(7).fillColor('#6B7280');
    doc.text('Payment Method', 320, 170);
    doc.fillColor('#111827').fontSize(9).font('Helvetica');
    doc.text(order.paymentMethod || 'Stripe', 320, 182);

    doc.font('Helvetica').fontSize(7).fillColor('#6B7280');
    doc.text('Currency', 320, 200);
    doc.fillColor('#111827').fontSize(9).font('Helvetica');
    doc.text('USD ($)', 320, 212);

    // Order Items Section
    doc.fillColor('#111827').fontSize(8).font('Helvetica-Bold');
    doc.text('ORDER ITEMS', 50, 280);

    // Table with border
    const tableTop = 300;
    doc.rect(50, tableTop, 512, 25).fillAndStroke('#F9FAFB', '#E5E7EB');
    
    // Table headers
    doc.fontSize(7).fillColor('#374151').font('Helvetica-Bold');
    doc.text('DESCRIPTION', 60, tableTop + 10);
    doc.text('QTY', 300, tableTop + 10, { align: 'center', width: 50 });
    doc.text('UNIT PRICE', 370, tableTop + 10, { align: 'right', width: 80 });
    doc.text('AMOUNT', 470, tableTop + 10, { align: 'right', width: 80 });

    // Table rows
    let currentY = tableTop + 35;
    enrichedItems.forEach((item, index) => {
      const itemTotal = parseFloat(item.price) * item.quantity;
      
      doc.fontSize(9).fillColor('#111827').font('Helvetica');
      doc.text(item.product?.name || 'Unknown Item', 60, currentY, { width: 220 });
      doc.text(item.quantity.toString(), 300, currentY, { align: 'center', width: 50 });
      doc.text(`$${parseFloat(item.price).toFixed(2)}`, 370, currentY, { align: 'right', width: 80 });
      doc.fillColor('#111827').font('Helvetica-Bold');
      doc.text(`$${itemTotal.toFixed(2)}`, 470, currentY, { align: 'right', width: 80 });
      
      currentY += 25;
    });

    // Totals Section
    currentY += 20;
    doc.fontSize(9).fillColor('#6B7280').font('Helvetica');
    doc.text('Subtotal', 370, currentY, { align: 'right', width: 80 });
    doc.fillColor('#111827').font('Helvetica-Bold');
    doc.text(`$${parseFloat(order.totalAmount).toFixed(2)}`, 470, currentY, { align: 'right', width: 80 });

    currentY += 20;
    doc.fontSize(9).fillColor('#6B7280').font('Helvetica');
    doc.text('Tax (0%)', 370, currentY, { align: 'right', width: 80 });
    doc.fillColor('#111827').font('Helvetica-Bold');
    doc.text('$0.00', 470, currentY, { align: 'right', width: 80 });

    currentY += 30;
    doc.rect(370, currentY - 10, 192, 2).fill('#111827');
    doc.fontSize(12).fillColor('#111827').font('Helvetica-Bold');
    doc.text('Total Amount', 370, currentY, { align: 'right', width: 80 });
    doc.fontSize(16).fillColor('#0C332C');
    doc.text(`$${parseFloat(order.totalAmount).toFixed(2)}`, 470, currentY - 2, { align: 'right', width: 80 });

    // Professional Blue Footer
    const footerY = 720;
    doc.rect(0, footerY, 612, 122).fill('#4169E1');
    
    doc.fontSize(8).fillColor('#FFFFFF').font('Helvetica-Bold');
    doc.text('Contact Us', 50, footerY + 20);
    doc.fontSize(7).font('Helvetica');
    doc.text('Support: support@edufiliova.com', 50, footerY + 38);
    doc.text('Payments: payments@edufiliova.com', 50, footerY + 52);

    doc.fontSize(8).fillColor('#FFFFFF').font('Helvetica-Bold');
    doc.text('Website', 250, footerY + 20);
    doc.fontSize(7).font('Helvetica');
    doc.text('edufiliova.com', 250, footerY + 38);

    doc.fontSize(8).fillColor('#FFFFFF').font('Helvetica-Bold');
    doc.text('Thank You!', 430, footerY + 20);
    doc.fontSize(7).font('Helvetica');
    doc.text('We appreciate your business and', 430, footerY + 38);
    doc.text('look forward to serving you again.', 430, footerY + 52);

    // Footer bottom text
    doc.fontSize(6).fillColor('#FFFFFF').font('Helvetica');
    doc.text('This is an automated invoice. For questions or concerns, please contact support@edufiliova.com', 50, footerY + 90, { 
      align: 'center', 
      width: 512 
    });

    // Finalize PDF
    doc.end();
  } catch (error) {
    console.error("Error generating order slip:", error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  }
});

// Admin endpoint: Backfill salesCount for existing paid/delivered orders
router.post("/admin/backfill-sales-count", requireAuth, requireRole(['admin']), async (req: AuthenticatedRequest, res) => {
  try {
    // Get all paid or delivered orders with their items
    const paidOrders = await db
      .select({
        orderId: orders.id,
        status: orders.status
      })
      .from(orders)
      .where(or(eq(orders.status, 'paid'), eq(orders.status, 'delivered')));

    if (paidOrders.length === 0) {
      return res.json({ 
        success: true, 
        message: 'No paid or delivered orders found',
        updatedProducts: 0
      });
    }

    const orderIds = paidOrders.map(o => o.orderId);
    
    // Get all order items for these orders
    const allOrderItems = await db
      .select({
        productId: orderItems.productId,
        quantity: orderItems.quantity
      })
      .from(orderItems)
      .where(sql`${orderItems.orderId} IN (${sql.join(orderIds.map(id => sql`${id}`), sql`, `)})`);

    // Aggregate sales count by product
    const salesByProduct = new Map<string, number>();
    for (const item of allOrderItems) {
      const currentCount = salesByProduct.get(item.productId) || 0;
      salesByProduct.set(item.productId, currentCount + item.quantity);
    }

    // Update each product's sales count
    let updatedCount = 0;
    for (const [productId, totalSales] of Array.from(salesByProduct.entries())) {
      await db
        .update(products)
        .set({ salesCount: totalSales })
        .where(eq(products.id, productId));
      updatedCount++;
    }

    console.log(`✅ Backfilled sales count for ${updatedCount} products from ${paidOrders.length} paid/delivered orders`);

    res.json({ 
      success: true, 
      message: `Successfully backfilled sales count for ${updatedCount} products`,
      processedOrders: paidOrders.length,
      updatedProducts: updatedCount
    });
  } catch (error) {
    console.error("Error backfilling sales count:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

export default router;