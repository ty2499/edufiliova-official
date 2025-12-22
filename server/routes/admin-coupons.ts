import { Router } from "express";
import { db } from "../db";
import { coupons, couponUsages, orders } from "../../shared/schema";
import { eq, desc, and, sql, count } from "drizzle-orm";
import { requireAuth, requireRole, type AuthenticatedRequest } from "../middleware/auth";
import { insertCouponSchema } from "../../shared/schema";
import { z } from "zod";

const router = Router();

// Get all coupons (admin only)
router.get("/", requireAuth, requireRole(["admin"]), async (req: AuthenticatedRequest, res) => {
  try {
    const couponsList = await db
      .select({
        id: coupons.id,
        code: coupons.code,
        description: coupons.description,
        discountType: coupons.discountType,
        discountValue: coupons.discountValue,
        minOrderAmount: coupons.minOrderAmount,
        maxDiscount: coupons.maxDiscount,
        startDate: coupons.startDate,
        endDate: coupons.endDate,
        totalUsageLimit: coupons.totalUsageLimit,
        perUserLimit: coupons.perUserLimit,
        usageCount: coupons.usageCount,
        isActive: coupons.isActive,
        createdAt: coupons.createdAt,
        updatedAt: coupons.updatedAt,
      })
      .from(coupons)
      .orderBy(desc(coupons.createdAt));

    // Calculate stats
    const activeCoupons = couponsList.filter(c => c.isActive).length;
    const totalUsages = couponsList.reduce((sum, c) => sum + (c.usageCount || 0), 0);

    // Calculate total discounts given
    const [totalDiscountsResult] = await db
      .select({
        totalDiscounts: sql<string>`COALESCE(SUM(${couponUsages.discountApplied}), 0)`,
      })
      .from(couponUsages);

    const stats = {
      totalCoupons: couponsList.length,
      activeCoupons,
      totalUsages,
      totalDiscounts: parseFloat(totalDiscountsResult?.totalDiscounts || '0').toFixed(2),
    };

    res.json({ 
      success: true, 
      data: {
        coupons: couponsList,
        stats
      }
    });
  } catch (error) {
    console.error("Error fetching coupons:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// Get single coupon with usage stats (admin only)
router.get("/:id", requireAuth, requireRole(["admin"]), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    const [coupon] = await db
      .select()
      .from(coupons)
      .where(eq(coupons.id, id))
      .limit(1);

    if (!coupon) {
      return res.status(404).json({ success: false, error: "Coupon not found" });
    }

    // Get usage stats
    const [usageStats] = await db
      .select({
        totalUses: count(),
        totalDiscount: sql<string>`COALESCE(SUM(${couponUsages.discountApplied}), 0)`,
      })
      .from(couponUsages)
      .where(eq(couponUsages.couponId, id));

    res.json({ 
      success: true, 
      data: {
        ...coupon,
        stats: {
          totalUses: usageStats?.totalUses || 0,
          totalDiscountGiven: usageStats?.totalDiscount || "0",
        }
      }
    });
  } catch (error) {
    console.error("Error fetching coupon:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// Create coupon (admin only)
router.post("/", requireAuth, requireRole(["admin"]), async (req: AuthenticatedRequest, res) => {
  try {
    console.log("📝 Received coupon data:", JSON.stringify(req.body, null, 2));
    
    // Validate request body
    const validationResult = insertCouponSchema.safeParse(req.body);
    if (!validationResult.success) {
      console.error("❌ Coupon validation failed:", JSON.stringify(validationResult.error.issues, null, 2));
      return res.status(400).json({ 
        success: false, 
        error: "Invalid coupon data",
        details: validationResult.error.issues
      });
    }
    
    console.log("✅ Validation passed, coupon data:", JSON.stringify(validationResult.data, null, 2));

    const couponData = validationResult.data;

    // Ensure code is uppercase for consistency
    const code = couponData.code.toUpperCase();

    // Check if code already exists
    const [existing] = await db
      .select()
      .from(coupons)
      .where(eq(coupons.code, code))
      .limit(1);

    if (existing) {
      return res.status(400).json({ success: false, error: "Coupon code already exists" });
    }

    // Create coupon
    const [newCoupon] = await db
      .insert(coupons)
      .values({
        ...couponData,
        code,
      })
      .returning();

    res.status(201).json({ success: true, data: newCoupon });
  } catch (error) {
    console.error("Error creating coupon:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// Update coupon (admin only)
router.put("/:id", requireAuth, requireRole(["admin"]), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    // Validate request body
    const validationResult = insertCouponSchema.partial().safeParse(req.body);
    if (!validationResult.success) {
      console.error("Coupon update validation failed:", validationResult.error.issues);
      return res.status(400).json({ 
        success: false, 
        error: "Invalid coupon data",
        details: validationResult.error.issues
      });
    }

    const updateData = validationResult.data;

    // If updating code, ensure it's uppercase and unique
    if (updateData.code) {
      updateData.code = updateData.code.toUpperCase();
      
      const [existing] = await db
        .select()
        .from(coupons)
        .where(and(
          eq(coupons.code, updateData.code),
          sql`${coupons.id} != ${id}`
        ))
        .limit(1);

      if (existing) {
        return res.status(400).json({ success: false, error: "Coupon code already exists" });
      }
    }

    // Update coupon
    const [updatedCoupon] = await db
      .update(coupons)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(coupons.id, id))
      .returning();

    if (!updatedCoupon) {
      return res.status(404).json({ success: false, error: "Coupon not found" });
    }

    res.json({ success: true, data: updatedCoupon });
  } catch (error) {
    console.error("Error updating coupon:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// Delete coupon (admin only)
router.delete("/:id", requireAuth, requireRole(["admin"]), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    // Check if coupon has been used
    const [usageCheck] = await db
      .select({ count: count() })
      .from(couponUsages)
      .where(eq(couponUsages.couponId, id));

    if (usageCheck && usageCheck.count > 0) {
      // If coupon has been used, deactivate instead of delete
      const [deactivated] = await db
        .update(coupons)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(coupons.id, id))
        .returning();

      return res.json({ 
        success: true, 
        message: "Coupon has been used and was deactivated instead of deleted",
        data: deactivated
      });
    }

    // Delete coupon if never used
    const [deleted] = await db
      .delete(coupons)
      .where(eq(coupons.id, id))
      .returning();

    if (!deleted) {
      return res.status(404).json({ success: false, error: "Coupon not found" });
    }

    res.json({ success: true, message: "Coupon deleted successfully" });
  } catch (error) {
    console.error("Error deleting coupon:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// Get coupon usage history (admin only)
router.get("/:id/usage", requireAuth, requireRole(["admin"]), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    const usageList = await db
      .select({
        id: couponUsages.id,
        userId: couponUsages.userId,
        guestEmail: couponUsages.guestEmail,
        orderId: couponUsages.orderId,
        discountApplied: couponUsages.discountApplied,
        orderTotal: couponUsages.orderTotal,
        createdAt: couponUsages.createdAt,
        orderStatus: orders.status,
      })
      .from(couponUsages)
      .leftJoin(orders, eq(couponUsages.orderId, orders.id))
      .where(eq(couponUsages.couponId, id))
      .orderBy(desc(couponUsages.createdAt));

    res.json({ success: true, data: usageList });
  } catch (error) {
    console.error("Error fetching coupon usage:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

export default router;
