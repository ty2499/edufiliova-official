import { Router } from "express";
import { db } from "../db";
import { products, orders, users, profiles, downloads, orderItems, cartItems, productDownloadStats, creatorEarningEvents } from "../../shared/schema";
import { eq, desc, and, like, or, sql, count, inArray, sum } from "drizzle-orm";
import { insertProductSchema } from "../../shared/schema";
import { requireAuth, requireRole } from "../middleware/auth";
import type { AuthenticatedRequest } from "../middleware/auth";
import { v4 as uuidv4 } from 'uuid';
import { upload } from "../upload";
import { storageManager } from "../storage-manager";
import { trackProductDownload } from "../services/earnings";
import { cacheMiddleware, invalidateCacheMiddleware, CacheTTL } from "../middleware/cache-middleware";

const router = Router();

// Upload product images
router.post("/upload/images", requireAuth, requireRole(['freelancer', 'teacher', 'admin']), upload.array('images', 10), async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.files || !Array.isArray(req.files)) {
      return res.status(400).json({ success: false, error: 'No files uploaded' });
    }

    const category = req.body.category || 'general';
    const uploadedImages = [];
    
    for (const file of req.files) {
      try {
        const result = await storageManager.uploadFile(
          file.buffer, 
          file.originalname, 
          file.mimetype, 
          'product-image',
          { category }
        );
        
        if (result.success && result.url) {
          uploadedImages.push({
            url: result.url,
            originalName: file.originalname,
            size: file.size,
            mimeType: file.mimetype,
            storage: result.storage
          });
        }
      } catch (uploadError) {
        console.error('Upload error:', uploadError);
      }
    }

    if (uploadedImages.length === 0) {
      return res.status(500).json({ success: false, error: 'Failed to upload any images' });
    }

    res.json({
      success: true,
      images: uploadedImages,
      message: `${uploadedImages.length} image(s) uploaded successfully`,
      storage: uploadedImages[0]?.storage || 'unknown'
    });
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Upload downloadable files for digital products (zips, PDFs, etc.)
router.post("/upload/files", requireAuth, requireRole(['freelancer', 'teacher', 'admin']), upload.array('files', 10), async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.files || !Array.isArray(req.files)) {
      return res.status(400).json({ success: false, error: 'No files uploaded' });
    }

    const fileTypes = req.body.fileTypes ? JSON.parse(req.body.fileTypes) : [];
    const category = req.body.category || 'general';
    const uploadedFiles = [];
    
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      try {
        const result = await storageManager.uploadFile(
          file.buffer,
          file.originalname,
          file.mimetype,
          'product-file',
          { category }
        );
        
        if (result.success && result.url) {
          uploadedFiles.push({
            id: uuidv4(),
            name: file.originalname,
            url: result.url,
            size: file.size,
            format: file.originalname.split('.').pop()?.toLowerCase() || 'unknown',
            type: fileTypes[i] || 'main',
            downloadCount: 0,
            storage: result.storage,
            key: result.key
          });
        }
      } catch (uploadError) {
        console.error('File upload error:', uploadError);
      }
    }

    if (uploadedFiles.length === 0) {
      return res.status(500).json({ success: false, error: 'Failed to upload any files' });
    }

    res.json({
      success: true,
      files: uploadedFiles,
      message: `${uploadedFiles.length} file(s) uploaded successfully`,
      storage: uploadedFiles[0]?.storage || 'unknown'
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get featured products for landing page - CACHED
router.get("/featured", cacheMiddleware({ ttl: CacheTTL.MEDIUM, keyPrefix: 'products:featured' }), async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 8;
    
    // Fetch only necessary columns to reduce egress
    const featuredProducts = await db.select({
      id: products.id,
      name: products.name,
      description: products.description,
      type: products.type,
      price: products.price,
      currency: products.currency,
      images: products.images,
      category: products.category,
      tags: products.tags,
      salesCount: products.salesCount,
      rating: products.rating,
      reviewCount: products.reviewCount,
      featuredAt: products.featuredAt,
    })
      .from(products)
      .where(and(eq(products.featured, true), eq(products.status, 'approved')))
      .orderBy(desc(products.featuredAt))
      .limit(limit);

    res.json({
      success: true,
      products: featuredProducts,
      total: featuredProducts.length
    });
  } catch (error) {
    console.error('Error fetching featured products:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch featured products' });
  }
});

// Toggle product featured status (admin only) - INVALIDATES CACHE
router.post("/:productId/toggle-featured", requireAuth, requireRole(['admin']), invalidateCacheMiddleware(['products:featured:']), async (req: AuthenticatedRequest, res) => {
  try {
    const { productId } = req.params;
    const { isFeatured } = req.body;

    if (typeof isFeatured !== 'boolean') {
      return res.status(400).json({ success: false, error: 'isFeatured must be a boolean' });
    }

    // Get the product first to check if it exists
    const [product] = await db.select().from(products).where(eq(products.id, productId)).limit(1);
    
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    // Update the featured status
    const updateData: any = {
      featured: isFeatured,
      updatedAt: new Date(),
    };

    if (isFeatured) {
      updateData.featuredAt = new Date();
    } else {
      updateData.featuredAt = null;
    }

    const [updatedProduct] = await db.update(products)
      .set(updateData)
      .where(eq(products.id, productId))
      .returning();

    res.json({
      success: true,
      product: updatedProduct,
      message: isFeatured ? 'Product marked as featured' : 'Product removed from featured'
    });
  } catch (error) {
    console.error('Error toggling product featured status:', error);
    res.status(500).json({ success: false, error: 'Failed to update product featured status' });
  }
});

// Get all approved products (NEW ENDPOINT for frontend compatibility)
router.get("/approved", async (req, res) => {
  try {
    const { search, category, type, minPrice, maxPrice, tags, seller, subcategories, styles, formats, sort = 'recent', limit = "20", offset = "0" } = req.query;
    
    // Apply filters - always include approved status
    const conditions = [eq(products.status, "approved")];

    if (search && typeof search === 'string') {
      conditions.push(
        or(
          like(products.name, `%${search}%`),
          like(products.description, `%${search}%`)
        )!
      );
    }

    if (category) {
      conditions.push(eq(products.category, category as string));
    }

    if (type) {
      conditions.push(eq(products.type, type as any));
    }

    if (minPrice) {
      conditions.push(sql`${products.price} >= ${minPrice}`);
    }

    if (maxPrice) {
      conditions.push(sql`${products.price} <= ${maxPrice}`);
    }

    if (seller) {
      // Check if seller is a UUID (contains hyphens) or a text userId
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(seller as string);
      
      if (isUUID) {
        // If it's a UUID, use it directly
        conditions.push(eq(products.sellerId, seller as string));
      } else {
        // If it's a text userId, look up the user's UUID
        const [user] = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.userId, seller as string))
          .limit(1);
        
        if (user) {
          conditions.push(eq(products.sellerId, user.id));
        } else {
          // If user not found, add an impossible condition to return no results
          conditions.push(sql`false`);
        }
      }
    }

    // Handle tags filtering
    if (tags && typeof tags === 'string') {
      const tagList = tags.split(',').map(t => t.trim()).filter(Boolean);
      if (tagList.length > 0) {
        conditions.push(sql`${products.tags} && ${tagList}`);
      }
    }

    // Handle subcategory filtering
    if (subcategories && typeof subcategories === 'string') {
      const subcategoryList = subcategories.split(',').map(s => s.trim()).filter(Boolean);
      if (subcategoryList.length > 0) {
        // Use OR conditions to match any of the subcategories
        const subcategoryConditions = subcategoryList.map(sub => eq(products.subcategory, sub));
        conditions.push(or(...subcategoryConditions) as any);
      }
    }

    // Handle style filtering (keeping for backward compatibility but not used in new filter)
    if (styles && typeof styles === 'string') {
      const styleList = styles.split(',').map(s => s.trim()).filter(Boolean);
      if (styleList.length > 0) {
        const styleConditions = styleList.map(style => eq(products.style, style));
        conditions.push(or(...styleConditions) as any);
      }
    }

    // Handle file format filtering (keeping for backward compatibility but not used in new filter)
    if (formats && typeof formats === 'string') {
      const formatList = formats.split(',').map(f => f.trim()).filter(Boolean);
      if (formatList.length > 0) {
        conditions.push(sql`${products.fileFormat} && ${formatList}`);
      }
    }

    const query = db
      .select({
        id: products.id,
        name: products.name,
        description: products.description,
        type: products.type,
        price: products.price,
        currency: products.currency,
        images: products.images,
        stock: products.stock,
        category: products.category,
        tags: products.tags,
        salesCount: products.salesCount,
        rating: products.rating,
        reviewCount: products.reviewCount,
        createdAt: products.createdAt,
        freelancer: {
          id: users.id,
          name: profiles.name,
          displayName: profiles.displayName,
          avatarUrl: profiles.avatarUrl,
          bio: profiles.bio,
          rating: sql<number>`0`,
          reviewCount: sql<number>`0`,
          verificationBadge: profiles.verificationBadge,
        }
      })
      .from(products)
      .leftJoin(users, eq(products.sellerId, users.id))
      .leftJoin(profiles, eq(users.id, profiles.userId))
      .where(and(...conditions));

    // Apply sorting based on sort parameter
    let sortedQuery;
    switch (sort) {
      case 'price_low_high':
        sortedQuery = query.orderBy(products.price);
        break;
      case 'price_high_low':
        sortedQuery = query.orderBy(desc(products.price));
        break;
      case 'popular':
        sortedQuery = query.orderBy(desc(products.salesCount));
        break;
      case 'rating':
        sortedQuery = query.orderBy(desc(products.rating));
        break;
      case 'recent':
      default:
        sortedQuery = query.orderBy(desc(products.createdAt));
        break;
    }

    const productList = await sortedQuery
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string));

    res.json({ 
      success: true, 
      data: productList,
      pagination: {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        total: productList.length
      }
    });
  } catch (error) {
    console.error("Error fetching approved products:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// Get all approved products (EXISTING ENDPOINT - kept for backward compatibility)
router.get("/", async (req, res) => {
  try {
    const { search, category, type, minPrice, maxPrice, tags, seller, sort = 'recent', limit = "20", offset = "0" } = req.query;
    
    // Apply filters - always include approved status
    const conditions = [eq(products.status, "approved")];

    if (search && typeof search === 'string') {
      conditions.push(
        or(
          like(products.name, `%${search}%`),
          like(products.description, `%${search}%`)
        )!
      );
    }

    if (category) {
      conditions.push(eq(products.category, category as string));
    }

    if (type) {
      conditions.push(eq(products.type, type as any));
    }

    if (minPrice) {
      conditions.push(sql`${products.price} >= ${minPrice}`);
    }

    if (maxPrice) {
      conditions.push(sql`${products.price} <= ${maxPrice}`);
    }

    if (seller) {
      // Check if seller is a UUID (contains hyphens) or a text userId
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(seller as string);
      
      if (isUUID) {
        // If it's a UUID, use it directly
        conditions.push(eq(products.sellerId, seller as string));
      } else {
        // If it's a text userId, look up the user's UUID
        const [user] = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.userId, seller as string))
          .limit(1);
        
        if (user) {
          conditions.push(eq(products.sellerId, user.id));
        } else {
          // If user not found, add an impossible condition to return no results
          conditions.push(sql`false`);
        }
      }
    }

    // Handle tags filtering
    if (tags && typeof tags === 'string') {
      const tagList = tags.split(',').map(t => t.trim()).filter(Boolean);
      if (tagList.length > 0) {
        conditions.push(sql`${products.tags} && ${tagList}`);
      }
    }

    const query = db
      .select({
        id: products.id,
        name: products.name,
        description: products.description,
        type: products.type,
        price: products.price,
        currency: products.currency,
        images: products.images,
        stock: products.stock,
        category: products.category,
        tags: products.tags,
        salesCount: products.salesCount,
        rating: products.rating,
        reviewCount: products.reviewCount,
        createdAt: products.createdAt,
        freelancer: {
          id: users.id,
          name: profiles.name,
          displayName: profiles.displayName,
          avatarUrl: profiles.avatarUrl,
          bio: profiles.bio,
          rating: sql<number>`0`,
          reviewCount: sql<number>`0`,
          verificationBadge: profiles.verificationBadge,
        }
      })
      .from(products)
      .leftJoin(users, eq(products.sellerId, users.id))
      .leftJoin(profiles, eq(users.id, profiles.userId))
      .where(and(...conditions));

    // Apply sorting based on sort parameter
    let sortedQuery;
    switch (sort) {
      case 'price_low_high':
        sortedQuery = query.orderBy(products.price);
        break;
      case 'price_high_low':
        sortedQuery = query.orderBy(desc(products.price));
        break;
      case 'popular':
        sortedQuery = query.orderBy(desc(products.salesCount));
        break;
      case 'rating':
        sortedQuery = query.orderBy(desc(products.rating));
        break;
      case 'recent':
      default:
        sortedQuery = query.orderBy(desc(products.createdAt));
        break;
    }

    const productList = await sortedQuery
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string));

    res.json({ 
      success: true, 
      data: productList,
      pagination: {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        total: productList.length
      }
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// Get single product details
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const product = await db
      .select({
        id: products.id,
        name: products.name,
        description: products.description,
        type: products.type,
        price: products.price,
        currency: products.currency,
        downloadLimit: products.downloadLimit,
        images: products.images,
        stock: products.stock,
        category: products.category,
        tags: products.tags,
        salesCount: products.salesCount,
        rating: products.rating,
        reviewCount: products.reviewCount,
        createdAt: products.createdAt,
        freelancer: {
          id: users.id,
          name: profiles.name,
          displayName: profiles.displayName,
          avatarUrl: profiles.avatarUrl,
          bio: profiles.bio,
          rating: sql<number>`0`,
          reviewCount: sql<number>`0`,
          verificationBadge: profiles.verificationBadge,
        }
      })
      .from(products)
      .leftJoin(users, eq(products.sellerId, users.id))
      .leftJoin(profiles, eq(users.id, profiles.userId))
      .where(and(
        eq(products.id, id),
        eq(products.status, "approved")
      ))
      .limit(1);

    if (!product[0]) {
      return res.status(404).json({ success: false, error: "Product not found" });
    }

    res.json({ success: true, data: product[0] });
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// Create new product (freelancers, teachers, and admin) - INVALIDATES CACHE
router.post("/", requireAuth, requireRole(['freelancer', 'teacher', 'admin']), invalidateCacheMiddleware(['products:']), async (req: AuthenticatedRequest, res) => {
  try {
    console.log('🔍 Product creation - Request body:', JSON.stringify(req.body, null, 2));
    const validation = insertProductSchema.safeParse(req.body);
    if (!validation.success) {
      console.log('❌ Product validation failed:', validation.error.issues);
      return res.status(400).json({ 
        success: false, 
        error: "Validation failed", 
        details: validation.error.issues 
      });
    }
    
    console.log('✅ Product validation success - validated data:', JSON.stringify(validation.data, null, 2));
    console.log('🔍 downloadableFiles in request:', req.body.downloadableFiles);
    console.log('🔍 downloadableFiles after validation:', validation.data.downloadableFiles);

    // Moderation check on product description and images
    const { moderationService } = await import('../utils/moderation.js');
    if (validation.data.description) {
      const modResult = await moderationService.checkContent({
        text: validation.data.description,
        userType: 'freelancer',
        contentType: 'product',
      });
      if (!modResult.passed) {
        // Handle violation (invalidate sessions, notify admin)
        await moderationService.handleViolation({
          userId: req.user!.id,
          violations: modResult.violations,
          userName: (req.user as any)?.name || 'Unknown',
          userEmail: (req.user as any)?.email || 'Unknown',
          contentType: 'product',
          action: 'notify',
          contentPreview: validation.data.description
        });

        return res.status(403).json({
          success: false,
          error: 'Product rejected',
          details: 'Product description contains prohibited content: ' + modResult.violations.join(', ')
        });
      }
      // Use cleaned text if personal info was removed
      if (modResult.cleanedText) {
        validation.data.description = modResult.cleanedText;
      }
    }

    if (validation.data.imageUrl) {
      const modResult = await moderationService.checkContent({
        imageUrl: validation.data.imageUrl,
        userType: 'freelancer',
        contentType: 'product',
      });
      if (!modResult.passed) {
        // Handle violation
        await moderationService.handleViolation({
          userId: req.user!.id,
          violations: modResult.violations,
          userName: (req.user as any)?.name || 'Unknown',
          userEmail: (req.user as any)?.email || 'Unknown',
          contentType: 'product',
          action: 'notify',
          contentPreview: validation.data.imageUrl
        });

        return res.status(403).json({
          success: false,
          error: 'Product image rejected',
          details: 'Product image contains prohibited content: ' + modResult.violations.join(', ')
        });
      }
    }

    // Get user profile to determine role
    const userProfile = await db
      .select({ role: profiles.role })
      .from(profiles)
      .where(eq(profiles.userId, req.user!.id))
      .limit(1);

    if (!userProfile[0]) {
      return res.status(400).json({ success: false, error: "User profile not found" });
    }

    const productStatus = userProfile[0].role === 'admin' ? 'approved' : 'pending';
    
    const [product] = await db
      .insert(products)
      .values({
        ...validation.data,
        sellerId: req.user!.id,
        sellerRole: userProfile[0].role as any,
        status: productStatus,
        approvedBy: userProfile[0].role === 'admin' ? req.user!.id : null,
        approvedAt: userProfile[0].role === 'admin' ? new Date() : null
      })
      .returning();

    res.status(201).json({ success: true, data: product });
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// Get seller's own products
router.get("/my/products", requireAuth, requireRole(['freelancer', 'teacher', 'admin']), async (req: AuthenticatedRequest, res) => {
  try {
    const productList = await db
      .select()
      .from(products)
      .where(eq(products.sellerId, req.user!.id))
      .orderBy(desc(products.createdAt));

    res.json({ success: true, data: productList });
  } catch (error) {
    console.error("Error fetching user products:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// Get download statistics for seller's products
router.get("/my/download-stats", requireAuth, requireRole(['freelancer', 'teacher', 'admin']), async (req: AuthenticatedRequest, res) => {
  try {
    // Get all products by this seller
    const userProducts = await db
      .select({
        id: products.id,
        name: products.name
      })
      .from(products)
      .where(eq(products.sellerId, req.user!.id));

    if (userProducts.length === 0) {
      return res.json({ success: true, data: [] });
    }

    // Get download stats for each product
    const downloadStats = [];
    for (const product of userProducts) {
      const [stats] = await db
        .select()
        .from(productDownloadStats)
        .where(eq(productDownloadStats.productId, product.id));

      if (stats) {
        downloadStats.push({
          productId: product.id,
          productName: product.name,
          totalDownloads: stats.totalDownloads,
          freeDownloads: stats.freeDownloads,
          paidDownloads: stats.paidDownloads,
          subscriptionDownloads: stats.subscriptionDownloads,
          lastMilestoneCount: stats.lastMilestoneCount
        });
      } else {
        // Product exists but has no stats yet
        downloadStats.push({
          productId: product.id,
          productName: product.name,
          totalDownloads: 0,
          freeDownloads: 0,
          paidDownloads: 0,
          subscriptionDownloads: 0,
          lastMilestoneCount: 0
        });
      }
    }

    res.json({ success: true, data: downloadStats });
  } catch (error) {
    console.error("Error fetching download stats:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// Get seller's performance stats (downloads, revenue, ratings)
router.get("/my/performance-stats", requireAuth, requireRole(['freelancer', 'teacher', 'admin']), async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;

    // Get all products by this seller
    const userProducts = await db
      .select({
        id: products.id,
        salesCount: products.salesCount,
        rating: products.rating,
        reviewCount: products.reviewCount
      })
      .from(products)
      .where(eq(products.sellerId, userId));

    // If no products, return zeros
    if (userProducts.length === 0) {
      return res.json({
        success: true,
        data: {
          totalDownloads: 0,
          totalRevenue: 0,
          avgRating: 0,
          totalSales: 0,
          totalProducts: 0,
          approvedProducts: 0
        }
      });
    }

    const productIds = userProducts.map(p => p.id);

    // Get total downloads from productDownloadStats
    const downloadStatsResult = await db
      .select({
        totalDownloads: sql<number>`COALESCE(SUM(${productDownloadStats.totalDownloads}), 0)`
      })
      .from(productDownloadStats)
      .where(inArray(productDownloadStats.productId, productIds));

    const totalDownloads = downloadStatsResult[0]?.totalDownloads || 0;

    // Get total revenue from creatorEarningEvents (available status only)
    const revenueResult = await db
      .select({
        totalRevenue: sql<number>`COALESCE(SUM(CAST(${creatorEarningEvents.creatorAmount} AS DECIMAL)), 0)`
      })
      .from(creatorEarningEvents)
      .where(
        and(
          eq(creatorEarningEvents.creatorId, userId),
          eq(creatorEarningEvents.sourceType, 'product'),
          eq(creatorEarningEvents.status, 'available')
        )
      );

    const totalRevenue = Number(revenueResult[0]?.totalRevenue || 0);

    // Calculate weighted average rating
    let avgRating = 0;
    let totalWeightedRating = 0;
    let totalReviews = 0;

    for (const product of userProducts) {
      if (product.rating && product.reviewCount && product.reviewCount > 0) {
        totalWeightedRating += Number(product.rating) * product.reviewCount;
        totalReviews += product.reviewCount;
      }
    }

    if (totalReviews > 0) {
      avgRating = totalWeightedRating / totalReviews;
    }

    // Calculate total sales
    const totalSales = userProducts.reduce((sum, p) => sum + (p.salesCount || 0), 0);

    // Get product count stats using aggregates
    const [totalProductsResult] = await db
      .select({
        total: count()
      })
      .from(products)
      .where(eq(products.sellerId, userId));

    const [approvedProductsResult] = await db
      .select({
        approved: count()
      })
      .from(products)
      .where(
        and(
          eq(products.sellerId, userId),
          eq(products.status, 'approved')
        )
      );

    const totalProducts = totalProductsResult?.total || 0;
    const approvedProducts = approvedProductsResult?.approved || 0;

    res.json({
      success: true,
      data: {
        totalDownloads,
        totalRevenue,
        avgRating: Number(avgRating.toFixed(1)),
        totalSales,
        totalProducts,
        approvedProducts
      }
    });
  } catch (error) {
    console.error("Error fetching performance stats:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// Update product (seller only, own products)
router.put("/:id", requireAuth, requireRole(['freelancer', 'teacher', 'admin']), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const validation = insertProductSchema.partial().safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        success: false, 
        error: "Validation failed", 
        details: validation.error.issues 
      });
    }

    const [updatedProduct] = await db
      .update(products)
      .set({
        ...validation.data,
        status: "pending", // Re-submit for approval
        updatedAt: new Date()
      })
      .where(and(
        eq(products.id, id),
        eq(products.sellerId, req.user!.id)
      ))
      .returning();

    if (!updatedProduct) {
      return res.status(404).json({ success: false, error: "Product not found or unauthorized" });
    }

    res.json({ success: true, data: updatedProduct });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// Delete product (seller only, own products)
router.delete("/:id", requireAuth, requireRole(['freelancer', 'teacher', 'admin']), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    // Check if product has orders
    const existingOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.productId, id))
      .limit(1);

    if (existingOrders.length > 0) {
      return res.status(400).json({ 
        success: false, 
        error: "Cannot delete product with existing orders" 
      });
    }

    const [deletedProduct] = await db
      .delete(products)
      .where(and(
        eq(products.id, id),
        eq(products.sellerId, req.user!.id)
      ))
      .returning();

    if (!deletedProduct) {
      return res.status(404).json({ success: false, error: "Product not found or unauthorized" });
    }

    res.json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// Get product categories (for filters)
router.get("/meta/categories", async (req, res) => {
  try {
    const categories = await db
      .selectDistinct({ category: products.category })
      .from(products)
      .where(and(
        eq(products.status, "approved"),
        sql`${products.category} IS NOT NULL`
      ));

    res.json({ 
      success: true, 
      data: categories.map(c => c.category).filter(Boolean) 
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// Admin route to view all products (approved, pending, rejected)
router.get("/admin/all", requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const { status, limit = "50", offset = "0" } = req.query;
    
    // Apply filters
    const conditions = [];
    if (status && typeof status === 'string') {
      conditions.push(eq(products.status, status as any));
    }

    const query = db
      .select({
        id: products.id,
        name: products.name,
        description: products.description,
        type: products.type,
        price: products.price,
        currency: products.currency,
        images: products.images,
        stock: products.stock,
        category: products.category,
        tags: products.tags,
        status: products.status,
        salesCount: products.salesCount,
        rating: products.rating,
        reviewCount: products.reviewCount,
        createdAt: products.createdAt,
        seller: {
          id: users.id,
          name: profiles.name,
          displayName: profiles.displayName,
          email: users.email,
          role: products.sellerRole,
        }
      })
      .from(products)
      .leftJoin(users, eq(products.sellerId, users.id))
      .leftJoin(profiles, eq(users.id, profiles.userId));

    const finalQuery = conditions.length > 0 
      ? query.where(and(...conditions))
      : query;

    const productList = await finalQuery
      .orderBy(desc(products.createdAt))
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string));

    res.json({ success: true, data: productList });
  } catch (error) {
    console.error("Error fetching all products for admin:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// Admin routes for product approval
router.get("/admin/pending", requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const productList = await db
      .select({
        id: products.id,
        name: products.name,
        description: products.description,
        type: products.type,
        price: products.price,
        currency: products.currency,
        images: products.images,
        category: products.category,
        status: products.status,
        createdAt: products.createdAt,
        seller: {
          id: users.id,
          name: profiles.name,
          email: users.email,
          role: products.sellerRole,
        }
      })
      .from(products)
      .leftJoin(users, eq(products.sellerId, users.id))
      .leftJoin(profiles, eq(users.id, profiles.userId))
      .where(eq(products.status, "pending"))
      .orderBy(desc(products.createdAt));

    res.json({ success: true, data: productList });
  } catch (error) {
    console.error("Error fetching pending products:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// Approve/Reject product (admin only)
router.patch("/:id/status", requireAuth, requireRole(['admin']), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, error: "Invalid status" });
    }

    if (status === 'rejected' && !rejectionReason) {
      return res.status(400).json({ success: false, error: "Rejection reason required" });
    }

    const [updatedProduct] = await db
      .update(products)
      .set({
        status,
        rejectionReason: status === 'rejected' ? rejectionReason : null,
        approvedBy: status === 'approved' ? req.user!.id : null,
        approvedAt: status === 'approved' ? new Date() : null,
        updatedAt: new Date()
      })
      .where(eq(products.id, id))
      .returning();

    if (!updatedProduct) {
      return res.status(404).json({ success: false, error: "Product not found" });
    }

    res.json({ success: true, data: updatedProduct });
  } catch (error) {
    console.error("Error updating product status:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// Generate secure download token for purchased digital products
router.post("/download/:productId/:fileId?", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { productId, fileId } = req.params;
    const userId = req.user!.id;

    // Check if user has purchased this product
    const purchaseCheck = await db
      .select({
        orderId: orders.id,
        orderStatus: orders.status,
        product: {
          id: products.id,
          name: products.name,
          type: products.type,
          fileUrl: products.fileUrl, // Legacy support
          downloadableFiles: products.downloadableFiles,
          downloadLimit: products.downloadLimit
        }
      })
      .from(orders)
      .leftJoin(orderItems, eq(orders.id, orderItems.orderId))
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(and(
        eq(orders.userId, userId),
        eq(products.id, productId),
        eq(orders.status, "delivered"),
        eq(products.type, "digital")
      ))
      .limit(1);

    if (!purchaseCheck[0]) {
      return res.status(403).json({ 
        success: false, 
        error: "Product not purchased or not a digital product" 
      });
    }

    const product = purchaseCheck[0]?.product;
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        error: "Product not found" 
      });
    }
    const orderId = purchaseCheck[0].orderId;

    // Parse downloadable files from JSONB
    const downloadableFiles = product?.downloadableFiles as any[] || [];
    
    // If no files in downloadableFiles, fallback to legacy fileUrl
    if (downloadableFiles.length === 0 && product?.fileUrl) {
      downloadableFiles.push({
        id: 'legacy',
        name: `${product?.name}_file`,
        url: product?.fileUrl,
        size: 0,
        type: 'main',
        format: 'unknown'
      });
    }

    if (downloadableFiles.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: "No downloadable files found for this product" 
      });
    }

    // Find specific file or return all files info
    let targetFile = null;
    if (fileId) {
      targetFile = downloadableFiles.find((f: any) => f.id === fileId);
      if (!targetFile) {
        return res.status(404).json({ 
          success: false, 
          error: "File not found" 
        });
      }
    }

    // Check download limit if set (per product, not per file)
    if (product?.downloadLimit) {
      const downloadCount = await db
        .select({ count: count() })
        .from(downloads)
        .where(and(
          eq(downloads.userId, userId),
          eq(downloads.productId, productId),
          eq(downloads.orderId, orderId)
        ));

      if (downloadCount[0]?.count && product?.downloadLimit && downloadCount[0].count >= product.downloadLimit) {
        return res.status(429).json({ 
          success: false, 
          error: `Download limit exceeded (${product.downloadLimit} downloads maximum)` 
        });
      }
    }

    // If no specific file requested, return available files
    if (!fileId) {
      return res.json({ 
        success: true, 
        data: {
          productName: product?.name,
          files: downloadableFiles.map((file: any) => ({
            id: file.id,
            name: file.name,
            size: file.size,
            format: file.format,
            type: file.type,
            downloadUrl: `/api/products/download/${productId}/${file.id}`
          }))
        }
      });
    }

    // Generate secure download token for specific file
    const downloadToken = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Record download attempt
    await db.insert(downloads).values({
      userId: userId,
      productId: productId,
      orderId: orderId,
      downloadToken,
      expiresAt,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({ 
      success: true, 
      data: {
        downloadToken,
        productName: product.name,
        fileName: targetFile.name,
        fileSize: targetFile.size,
        format: targetFile.format,
        expiresAt,
        downloadUrl: `/api/products/secure-download/${downloadToken}`
      }
    });
  } catch (error) {
    console.error("Error generating download token:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// Secure download endpoint with token verification
router.get("/secure-download/:token", async (req, res) => {
  try {
    const { token } = req.params;

    // Find download record by token
    const downloadRecord = await db
      .select({
        id: downloads.id,
        userId: downloads.userId,
        productId: downloads.productId,
        orderId: downloads.orderId,
        downloadToken: downloads.downloadToken,
        expiresAt: downloads.expiresAt,
        isExpired: downloads.isExpired,
        product: {
          name: products.name,
          fileUrl: products.fileUrl, // Legacy support
          downloadableFiles: products.downloadableFiles
        }
      })
      .from(downloads)
      .leftJoin(products, eq(downloads.productId, products.id))
      .where(eq(downloads.downloadToken, token))
      .limit(1);

    if (!downloadRecord[0]) {
      return res.status(404).json({ success: false, error: "Invalid download token" });
    }

    const download = downloadRecord[0];

    // Check if token has expired
    if (download.isExpired || (download.expiresAt && new Date() > download.expiresAt)) {
      // Mark as expired
      await db
        .update(downloads)
        .set({ isExpired: true })
        .where(eq(downloads.id, download.id));

      return res.status(410).json({ success: false, error: "Download link has expired" });
    }

    if (!download.product) {
      return res.status(404).json({ success: false, error: "Product not found" });
    }
    
    // Get file URL from product
    let fileUrl = null;
    let fileName = `${download.product.name}_file`;
    
    // Try legacy fileUrl first
    if (download.product.fileUrl) {
      fileUrl = download.product.fileUrl;
    }
    
    // Try to find file in downloadableFiles array
    else if (download.product.downloadableFiles) {
      const downloadableFiles = download.product.downloadableFiles as any[] || [];
      const mainFile = downloadableFiles.find((f: any) => f.type === 'main') || downloadableFiles[0];
      if (mainFile) {
        fileUrl = mainFile.url;
        fileName = mainFile.name;
      }
    }

    // Check if file exists
    if (!fileUrl) {
      return res.status(404).json({ success: false, error: "File not found" });
    }

    // Update downloadedAt timestamp
    await db
      .update(downloads)
      .set({ downloadedAt: new Date() })
      .where(eq(downloads.id, download.id));

    // Track download for stats - determine download type
    let downloadType: 'free' | 'paid' | 'subscription' = 'free';
    
    if (download.orderId) {
      // Has an order - check if it was paid or subscription (free order)
      const [order] = await db
        .select({ totalAmount: orders.totalAmount })
        .from(orders)
        .where(eq(orders.id, download.orderId))
        .limit(1);
      
      if (order) {
        const amount = parseFloat(order.totalAmount || '0');
        downloadType = amount > 0 ? 'paid' : 'subscription';
      }
    }
    // else: No orderId means it's a free claim (downloadType remains 'free')
    
    // Track the download in stats
    await trackProductDownload({
      productId: download.productId,
      userId: download.userId,
      downloadType,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    console.log(`📥 Download tracked: ${downloadType} download of product ${download.productId} by user ${download.userId}`);

    // Set appropriate headers for download
    res.set({
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    // Redirect to the actual file URL (Cloudinary or file storage)
    res.redirect(fileUrl);
  } catch (error) {
    console.error("Error processing secure download:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// Get download history for user's purchased products
router.get("/my/downloads", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;

    const downloadHistory = await db
      .select({
        id: downloads.id,
        downloadedAt: downloads.downloadedAt,
        expiresAt: downloads.expiresAt,
        isExpired: downloads.isExpired,
        product: {
          id: products.id,
          name: products.name,
          images: products.images
        }
      })
      .from(downloads)
      .leftJoin(products, eq(downloads.productId, products.id))
      .where(eq(downloads.userId, userId))
      .orderBy(desc(downloads.downloadedAt));

    res.json({ success: true, data: downloadHistory });
  } catch (error) {
    console.error("Error fetching download history:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// Admin endpoint to change product status
router.patch("/:id/admin-status", requireAuth, requireRole(['admin']), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Validate status
    if (!['approved', 'pending', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be: approved, pending, or rejected'
      });
    }

    // Check if product exists
    const existingProduct = await db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);

    if (existingProduct.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    // Update product status
    await db
      .update(products)
      .set({ 
        status: status as 'approved' | 'pending' | 'rejected',
        updatedAt: new Date()
      })
      .where(eq(products.id, id));

    res.json({
      success: true,
      message: `Product status updated to ${status}`,
      data: { id, status }
    });
  } catch (error) {
    console.error('Error updating product status:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Admin endpoint to delete product
router.delete("/:id/admin-delete", requireAuth, requireRole(['admin']), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    // Check if product exists
    const existingProduct = await db
      .select({
        id: products.id,
        name: products.name,
        sellerId: products.sellerId
      })
      .from(products)
      .where(eq(products.id, id))
      .limit(1);

    if (existingProduct.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    const product = existingProduct[0];

    // Check for existing orders with this product (both legacy orders and order_items)
    const existingLegacyOrders = await db
      .select({ id: orders.id })
      .from(orders)
      .where(eq(orders.productId, id))
      .limit(1);

    const existingOrderItems = await db
      .select({ id: orderItems.id })
      .from(orderItems)
      .where(eq(orderItems.productId, id))
      .limit(1);

    if (existingLegacyOrders.length > 0 || existingOrderItems.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete product with existing orders. Consider setting status to rejected instead.'
      });
    }

    // Clean up related data before deleting the product
    console.log(`🗑️ Admin deleting product: ${product.name} (${product.id})`);
    
    // Remove from any carts first
    const cartItemsDeleted = await db
      .delete(cartItems)
      .where(eq(cartItems.productId, id))
      .returning({ id: cartItems.id });
    
    if (cartItemsDeleted.length > 0) {
      console.log(`🛒 Removed ${cartItemsDeleted.length} cart item(s) for product ${product.id}`);
    }

    // Delete the product
    await db
      .delete(products)
      .where(eq(products.id, id));

    console.log(`✅ Successfully deleted product: ${product.name}`);
    
    res.json({
      success: true,
      message: `Product "${product.name}" has been permanently deleted`,
      data: { 
        id: product.id,
        name: product.name,
        cartItemsRemoved: cartItemsDeleted.length,
        deletedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;