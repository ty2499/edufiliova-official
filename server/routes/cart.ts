import { Router } from "express";
import { db } from "../db";
import { carts, cartItems, products, users, profiles, coupons, couponUsages } from "../../shared/schema";
import { eq, desc, and, sql, sum, count } from "drizzle-orm";
import { requireAuth } from "../middleware/auth";
import type { AuthenticatedRequest } from "../middleware/auth";

const router = Router();

// Get user's cart
router.get("/", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    // First, ensure user has a cart
    let userCart = await db
      .select()
      .from(carts)
      .where(eq(carts.userId, req.user!.id))
      .limit(1);

    if (!userCart[0]) {
      // Create cart if it doesn't exist
      userCart = await db
        .insert(carts)
        .values({ userId: req.user!.id })
        .returning();
    }

    // Get cart items with product details
    const cartItemsList = await db
      .select({
        id: cartItems.id,
        quantity: cartItems.quantity,
        priceAtAdd: cartItems.priceAtAdd,
        createdAt: cartItems.createdAt,
        product: {
          id: products.id,
          name: products.name,
          description: products.description,
          type: products.type,
          price: products.price,
          currency: products.currency,
          images: products.images,
          stock: products.stock,
          category: products.category,
          status: products.status,
        },
        seller: {
          id: users.id,
          name: profiles.name,
          displayName: profiles.displayName,
          avatarUrl: profiles.avatarUrl,
        }
      })
      .from(cartItems)
      .leftJoin(products, eq(cartItems.productId, products.id))
      .leftJoin(users, eq(products.sellerId, users.id))
      .leftJoin(profiles, eq(users.id, profiles.userId))
      .where(eq(cartItems.cartId, userCart[0].id))
      .orderBy(desc(cartItems.createdAt));

    // Calculate totals
    const totals = await db
      .select({
        totalItems: sql<number>`sum(${cartItems.quantity})`,
        totalAmount: sql<string>`sum(${cartItems.quantity} * ${cartItems.priceAtAdd})`,
      })
      .from(cartItems)
      .where(eq(cartItems.cartId, userCart[0].id));

    res.json({ 
      success: true, 
      data: {
        cart: userCart[0],
        items: cartItemsList,
        totals: {
          totalItems: totals[0]?.totalItems || 0,
          totalAmount: totals[0]?.totalAmount || "0.00",
        }
      }
    });
  } catch (error) {
    console.error("Error fetching cart:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// Add item to cart
router.post("/add", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({ success: false, error: "Product ID is required" });
    }

    // Validate product exists and is approved
    const [product] = await db
      .select()
      .from(products)
      .where(and(
        eq(products.id, productId),
        eq(products.status, "approved")
      ))
      .limit(1);

    if (!product) {
      return res.status(404).json({ success: false, error: "Product not found or not available" });
    }

    // Check stock for physical products
    if (product.type === "physical" && product.stock !== null) {
      if (product.stock < quantity) {
        return res.status(400).json({ 
          success: false, 
          error: "Insufficient stock available" 
        });
      }
    }

    // Get or create user cart
    let userCart = await db
      .select()
      .from(carts)
      .where(eq(carts.userId, req.user!.id))
      .limit(1);

    if (!userCart[0]) {
      userCart = await db
        .insert(carts)
        .values({ userId: req.user!.id })
        .returning();
    }

    // Check if item already exists in cart
    const existingItem = await db
      .select()
      .from(cartItems)
      .where(and(
        eq(cartItems.cartId, userCart[0].id),
        eq(cartItems.productId, productId)
      ))
      .limit(1);

    if (existingItem[0]) {
      // Update quantity
      const newQuantity = existingItem[0].quantity + quantity;
      
      // Check stock again for the new total quantity
      if (product.type === "physical" && product.stock !== null && product.stock < newQuantity) {
        return res.status(400).json({ 
          success: false, 
          error: "Not enough stock available for requested quantity" 
        });
      }

      const [updatedItem] = await db
        .update(cartItems)
        .set({ 
          quantity: newQuantity,
          updatedAt: new Date()
        })
        .where(eq(cartItems.id, existingItem[0].id))
        .returning();

      res.json({ success: true, data: updatedItem });
    } else {
      // Add new item to cart
      const [cartItem] = await db
        .insert(cartItems)
        .values({
          cartId: userCart[0].id,
          productId,
          quantity,
          priceAtAdd: product.price,
        })
        .returning();

      res.status(201).json({ success: true, data: cartItem });
    }
  } catch (error) {
    console.error("Error adding item to cart:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// Update cart item quantity
router.put("/items/:itemId", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({ success: false, error: "Valid quantity is required" });
    }

    // Get user's cart
    const userCart = await db
      .select()
      .from(carts)
      .where(eq(carts.userId, req.user!.id))
      .limit(1);

    if (!userCart[0]) {
      return res.status(404).json({ success: false, error: "Cart not found" });
    }

    // Get cart item with product details for stock check
    const cartItemWithProduct = await db
      .select({
        cartItem: cartItems,
        product: products,
      })
      .from(cartItems)
      .leftJoin(products, eq(cartItems.productId, products.id))
      .where(and(
        eq(cartItems.id, itemId),
        eq(cartItems.cartId, userCart[0].id)
      ))
      .limit(1);

    if (!cartItemWithProduct[0]) {
      return res.status(404).json({ success: false, error: "Cart item not found" });
    }

    const { cartItem, product } = cartItemWithProduct[0];

    // Check stock for physical products
    if (product && product.type === "physical" && product.stock !== null) {
      if (product.stock < quantity) {
        return res.status(400).json({ 
          success: false, 
          error: "Insufficient stock available" 
        });
      }
    }

    // Update quantity
    const [updatedItem] = await db
      .update(cartItems)
      .set({ 
        quantity,
        updatedAt: new Date()
      })
      .where(eq(cartItems.id, itemId))
      .returning();

    res.json({ success: true, data: updatedItem });
  } catch (error) {
    console.error("Error updating cart item:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// Remove item from cart
router.delete("/items/:itemId", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { itemId } = req.params;

    // Get user's cart
    const userCart = await db
      .select()
      .from(carts)
      .where(eq(carts.userId, req.user!.id))
      .limit(1);

    if (!userCart[0]) {
      return res.status(404).json({ success: false, error: "Cart not found" });
    }

    // Delete cart item
    const [deletedItem] = await db
      .delete(cartItems)
      .where(and(
        eq(cartItems.id, itemId),
        eq(cartItems.cartId, userCart[0].id)
      ))
      .returning();

    if (!deletedItem) {
      return res.status(404).json({ success: false, error: "Cart item not found" });
    }

    res.json({ success: true, message: "Item removed from cart" });
  } catch (error) {
    console.error("Error removing cart item:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// Clear entire cart
router.delete("/clear", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    // Get user's cart
    const userCart = await db
      .select()
      .from(carts)
      .where(eq(carts.userId, req.user!.id))
      .limit(1);

    if (!userCart[0]) {
      return res.status(404).json({ success: false, error: "Cart not found" });
    }

    // Delete all cart items
    await db
      .delete(cartItems)
      .where(eq(cartItems.cartId, userCart[0].id));

    res.json({ success: true, message: "Cart cleared successfully" });
  } catch (error) {
    console.error("Error clearing cart:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// Get cart item count (for navigation display)
router.get("/count", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    // Get user's cart
    const userCart = await db
      .select()
      .from(carts)
      .where(eq(carts.userId, req.user!.id))
      .limit(1);

    if (!userCart[0]) {
      return res.json({ success: true, data: { count: 0 } });
    }

    // Get total item count
    const totals = await db
      .select({
        totalItems: sql<number>`sum(${cartItems.quantity})`,
      })
      .from(cartItems)
      .where(eq(cartItems.cartId, userCart[0].id));

    res.json({ 
      success: true, 
      data: { count: totals[0]?.totalItems || 0 }
    });
  } catch (error) {
    console.error("Error getting cart count:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// Apply coupon to cart
router.post("/apply-coupon", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { code } = req.body;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ success: false, error: "Coupon code is required" });
    }

    // Get user's cart
    const userCart = await db
      .select()
      .from(carts)
      .where(eq(carts.userId, req.user!.id))
      .limit(1);

    if (!userCart[0]) {
      return res.status(400).json({ success: false, error: "Cart is empty" });
    }

    // Calculate cart total
    const totals = await db
      .select({
        totalAmount: sql<string>`COALESCE(sum(${cartItems.quantity} * ${cartItems.priceAtAdd}), 0)`,
      })
      .from(cartItems)
      .where(eq(cartItems.cartId, userCart[0].id));

    const cartTotal = parseFloat(totals[0]?.totalAmount || "0");

    if (cartTotal === 0) {
      return res.status(400).json({ success: false, error: "Cart is empty" });
    }

    // Find coupon
    const [coupon] = await db
      .select()
      .from(coupons)
      .where(eq(coupons.code, code.toUpperCase()))
      .limit(1);

    if (!coupon) {
      return res.status(404).json({ success: false, error: "Invalid coupon code" });
    }

    // Validate coupon
    const now = new Date();

    if (!coupon.isActive) {
      return res.status(400).json({ success: false, error: "This coupon is no longer active" });
    }

    if (coupon.startDate && new Date(coupon.startDate) > now) {
      return res.status(400).json({ success: false, error: "This coupon is not yet valid" });
    }

    if (coupon.endDate && new Date(coupon.endDate) < now) {
      return res.status(400).json({ success: false, error: "This coupon has expired" });
    }

    if (coupon.minOrderAmount && cartTotal < parseFloat(coupon.minOrderAmount)) {
      return res.status(400).json({ 
        success: false, 
        error: `Minimum order amount of $${coupon.minOrderAmount} required` 
      });
    }

    if (coupon.totalUsageLimit && (coupon.usageCount ?? 0) >= coupon.totalUsageLimit) {
      return res.status(400).json({ success: false, error: "This coupon has reached its usage limit" });
    }

    // Check per-user limit
    const [userUsageResult] = await db
      .select({ count: count() })
      .from(couponUsages)
      .where(
        and(
          eq(couponUsages.couponId, coupon.id),
          eq(couponUsages.userId, req.user!.id)
        )
      );

    const userUsageCount = userUsageResult?.count || 0;
    if (coupon.perUserLimit && userUsageCount >= coupon.perUserLimit) {
      return res.status(400).json({ 
        success: false, 
        error: "You have already used this coupon the maximum number of times" 
      });
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      discountAmount = (cartTotal * parseFloat(coupon.discountValue)) / 100;
      if (coupon.maxDiscount && discountAmount > parseFloat(coupon.maxDiscount)) {
        discountAmount = parseFloat(coupon.maxDiscount);
      }
    } else {
      discountAmount = parseFloat(coupon.discountValue);
    }

    // Ensure discount doesn't exceed cart total
    discountAmount = Math.min(discountAmount, cartTotal);

    res.json({ 
      success: true, 
      data: {
        coupon: {
          id: coupon.id,
          code: coupon.code,
          description: coupon.description,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
        },
        discountAmount: discountAmount.toFixed(2),
        cartTotal: cartTotal.toFixed(2),
        finalTotal: (cartTotal - discountAmount).toFixed(2),
      }
    });
  } catch (error) {
    console.error("Error applying coupon:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

export default router;