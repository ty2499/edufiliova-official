import { Router } from "express";
import { db } from "../db";
import { categories, products } from "../../shared/schema";
import { eq, desc, sql, count } from "drizzle-orm";
import { insertCategorySchema } from "../../shared/schema";
import { requireAuth, requireAdmin, type AuthenticatedRequest } from "../middleware/auth";
import { z } from "zod";
import { cacheMiddleware, invalidateCacheMiddleware, CacheTTL } from "../middleware/cache-middleware";
import { cachedQuery, CacheKeys } from "../cache";

const router = Router();

// Validation schemas
const createCategorySchema = insertCategorySchema.extend({
  name: z.string().min(1, "Category name is required").max(100, "Category name too long"),
  description: z.string().max(500, "Description too long").optional()
});

const updateCategorySchema = createCategorySchema.partial();

// Get all categories (public endpoint) - CACHED
router.get("/", cacheMiddleware({ ttl: CacheTTL.LONG, keyPrefix: 'categories' }), async (req, res) => {
  try {
    const { includeStats = "false" } = req.query;

    let categoriesQuery;
    
    if (includeStats === "true") {
      // Include product count for each category
      categoriesQuery = await db
        .select({
          id: categories.id,
          name: categories.name,
          description: categories.description,
          createdAt: categories.createdAt,
          updatedAt: categories.updatedAt,
          productCount: sql<number>`count(${products.id})`,
        })
        .from(categories)
        .leftJoin(products, eq(categories.id, products.categoryId))
        .groupBy(categories.id)
        .orderBy(categories.name);
    } else {
      // Simple category list
      categoriesQuery = await db
        .select({
          id: categories.id,
          name: categories.name,
          description: categories.description,
          createdAt: categories.createdAt,
          updatedAt: categories.updatedAt,
        })
        .from(categories)
        .orderBy(categories.name);
    }

    res.json({ success: true, data: categoriesQuery });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// Get single category with products (public endpoint)
router.get("/:categoryId", async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { includeProducts = "false" } = req.query;

    // Get category
    const [category] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, categoryId))
      .limit(1);

    if (!category) {
      return res.status(404).json({ success: false, error: "Category not found" });
    }

    let result: any = { category };

    if (includeProducts === "true") {
      // Get products in this category
      const categoryProducts = await db
        .select({
          id: products.id,
          name: products.name,
          description: products.description,
          type: products.type,
          price: products.price,
          currency: products.currency,
          images: products.images,
          stock: products.stock,
          status: products.status,
          createdAt: products.createdAt,
        })
        .from(products)
        .where(eq(products.categoryId, categoryId))
        .orderBy(desc(products.createdAt));

      result.products = categoryProducts;
    }

    res.json({ success: true, data: result });
  } catch (error) {
    console.error("Error fetching category:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// Create new category (admin only) - INVALIDATES CACHE
router.post("/", requireAuth, requireAdmin, invalidateCacheMiddleware(['categories:']), async (req: AuthenticatedRequest, res) => {
  try {
    const validation = createCategorySchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        success: false, 
        error: "Validation failed", 
        details: validation.error.issues 
      });
    }

    // Check if category name already exists
    const existingCategory = await db
      .select()
      .from(categories)
      .where(eq(categories.name, validation.data.name))
      .limit(1);

    if (existingCategory[0]) {
      return res.status(409).json({ 
        success: false, 
        error: "Category with this name already exists" 
      });
    }

    // Create category
    const [newCategory] = await db
      .insert(categories)
      .values(validation.data)
      .returning();

    res.status(201).json({ 
      success: true, 
      data: newCategory,
      message: "Category created successfully"
    });
  } catch (error) {
    console.error("Error creating category:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// Update category (admin only) - INVALIDATES CACHE
router.put("/:categoryId", requireAuth, requireAdmin, invalidateCacheMiddleware(['categories:']), async (req: AuthenticatedRequest, res) => {
  try {
    const { categoryId } = req.params;
    const validation = updateCategorySchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ 
        success: false, 
        error: "Validation failed", 
        details: validation.error.issues 
      });
    }

    // Check if category exists
    const [existingCategory] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, categoryId))
      .limit(1);

    if (!existingCategory) {
      return res.status(404).json({ success: false, error: "Category not found" });
    }

    // If updating name, check for conflicts
    if (validation.data.name) {
      const conflictingCategory = await db
        .select()
        .from(categories)
        .where(eq(categories.name, validation.data.name))
        .limit(1);

      if (conflictingCategory[0] && conflictingCategory[0].id !== categoryId) {
        return res.status(409).json({ 
          success: false, 
          error: "Category with this name already exists" 
        });
      }
    }

    // Update category
    const [updatedCategory] = await db
      .update(categories)
      .set({
        ...validation.data,
        updatedAt: new Date()
      })
      .where(eq(categories.id, categoryId))
      .returning();

    res.json({ 
      success: true, 
      data: updatedCategory,
      message: "Category updated successfully"
    });
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// Delete category (admin only) - INVALIDATES CACHE
router.delete("/:categoryId", requireAuth, requireAdmin, invalidateCacheMiddleware(['categories:']), async (req: AuthenticatedRequest, res) => {
  try {
    const { categoryId } = req.params;

    // Check if category exists
    const [existingCategory] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, categoryId))
      .limit(1);

    if (!existingCategory) {
      return res.status(404).json({ success: false, error: "Category not found" });
    }

    // Check if category has products
    const [productCount] = await db
      .select({ count: count() })
      .from(products)
      .where(eq(products.categoryId, categoryId));

    if (productCount.count > 0) {
      return res.status(409).json({ 
        success: false, 
        error: `Cannot delete category. It has ${productCount.count} product(s) assigned to it. Please reassign or remove products first.`
      });
    }

    // Delete category
    await db
      .delete(categories)
      .where(eq(categories.id, categoryId));

    res.json({ 
      success: true, 
      message: "Category deleted successfully" 
    });
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// Get category statistics (admin only)
router.get("/admin/stats", requireAuth, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const stats = await db
      .select({
        categoryId: categories.id,
        categoryName: categories.name,
        totalProducts: count(products.id),
        approvedProducts: sql<number>`count(case when ${products.status} = 'approved' then 1 end)`,
        pendingProducts: sql<number>`count(case when ${products.status} = 'pending' then 1 end)`,
        rejectedProducts: sql<number>`count(case when ${products.status} = 'rejected' then 1 end)`,
      })
      .from(categories)
      .leftJoin(products, eq(categories.id, products.categoryId))
      .groupBy(categories.id)
      .orderBy(desc(sql<number>`count(${products.id})`));

    // Get overall statistics
    const [overallStats] = await db
      .select({
        totalCategories: count(categories.id),
      })
      .from(categories);

    res.json({ 
      success: true, 
      data: {
        overall: overallStats,
        byCategory: stats
      }
    });
  } catch (error) {
    console.error("Error fetching category statistics:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// Move products to different category (admin only)
router.post("/:categoryId/move-products", requireAuth, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const { categoryId } = req.params;
    const { targetCategoryId, productIds } = req.body;

    // Validate input
    if (!targetCategoryId) {
      return res.status(400).json({ 
        success: false, 
        error: "Target category ID is required" 
      });
    }

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: "Product IDs array is required" 
      });
    }

    // Check if both categories exist
    const [sourceCategory, targetCategory] = await Promise.all([
      db.select().from(categories).where(eq(categories.id, categoryId)).limit(1),
      db.select().from(categories).where(eq(categories.id, targetCategoryId)).limit(1)
    ]);

    if (!sourceCategory[0]) {
      return res.status(404).json({ success: false, error: "Source category not found" });
    }

    if (!targetCategory[0]) {
      return res.status(404).json({ success: false, error: "Target category not found" });
    }

    // Update products
    const result = await db
      .update(products)
      .set({ 
        categoryId: targetCategoryId,
        updatedAt: new Date()
      })
      .where(eq(products.categoryId, categoryId))
      .returning({ id: products.id });

    res.json({ 
      success: true, 
      data: {
        movedProducts: result.length,
        fromCategory: sourceCategory[0].name,
        toCategory: targetCategory[0].name
      },
      message: `Successfully moved ${result.length} products to ${targetCategory[0].name}`
    });
  } catch (error) {
    console.error("Error moving products:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

export default router;