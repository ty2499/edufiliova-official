import { Request, Response } from 'express';
import { db } from '../db.js';
import { adsBanners, users, profiles, adPricingConfig } from '../../shared/schema.js';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';
import { isLocationTargetMatched } from '../middleware/location.js';
import { z } from 'zod';
import type { AuthenticatedRequest } from '../middleware/auth.js';

// Validation schemas - Updated to match requirements
const createBannerAdSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  imageUrl: z.string().url(),
  placement: z.enum(['student_dashboard', 'teacher_dashboard', 'freelancer_dashboard', 'customer_dashboard', 'advertise_page', 'talent_page']),
  size: z.string().min(1), // e.g. 728x90, 300x250, responsive
  durationDays: z.number().min(7).max(90), // Duration in days (7, 14, 30, 90)
  startDate: z.string().transform(str => new Date(str)),
  endDate: z.string().transform(str => new Date(str)),
  targetLocations: z.array(z.string()).optional().nullable(),
  targetGrades: z.array(z.number()).optional().nullable(), // Grade targeting (1-13, where 13=College/University)
  minAge: z.number().min(5).max(99).optional().nullable(), // Minimum age for ad display
  maxAge: z.number().min(5).max(99).optional().nullable(), // Maximum age for ad display
  linkUrl: z.string().optional().nullable().transform(val => val === '' ? null : val), // Click-through URL
});

const updateBannerAdSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  imageUrl: z.string().url().optional(),
  placement: z.enum(['student_dashboard', 'teacher_dashboard', 'freelancer_dashboard', 'customer_dashboard', 'advertise_page', 'talent_page']).optional(),
  size: z.string().min(1).optional(),
  durationDays: z.number().min(7).max(90).optional(),
  startDate: z.string().transform(str => new Date(str)).optional(),
  endDate: z.string().transform(str => new Date(str)).optional(),
  targetLocations: z.array(z.string()).optional().nullable(),
  targetGrades: z.array(z.number()).optional().nullable(), // Grade targeting (1-13, where 13=College/University)
  minAge: z.number().min(5).max(99).optional().nullable(),
  maxAge: z.number().min(5).max(99).optional().nullable(),
  linkUrl: z.string().optional().nullable().transform(val => val === '' ? null : val),
  status: z.enum(['pending', 'approved', 'rejected', 'expired', 'paused']).optional(),
});

const updateAdStatusSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected', 'expired', 'paused']),
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

/**
 * GET /api/ads/manage - Get all ads for admin management or user's own ads
 */
export const getManageAds = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userRole = req.user?.role;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    
    let whereConditions = [];
    
    // Non-admin users can only see their own ads
    if (userRole !== 'admin') {
      whereConditions.push(eq(adsBanners.userId, userId));
    }
    
    if (status && typeof status === 'string') {
      whereConditions.push(eq(adsBanners.status, status as any));
    }
    
    const query = db
      .select({
        id: adsBanners.id,
        userId: adsBanners.userId,
        title: adsBanners.title,
        imageUrl: adsBanners.imageUrl,
        placement: adsBanners.placement,
        size: adsBanners.size,
        status: adsBanners.status,
        startDate: adsBanners.startDate,
        endDate: adsBanners.endDate,
        targetLocations: adsBanners.targetLocations,
        targetGrades: adsBanners.targetGrades,
        impressions: adsBanners.impressions,
        clicks: adsBanners.clicks,
        createdAt: adsBanners.createdAt,
        updatedAt: adsBanners.updatedAt,
        userEmail: profiles.email,
        userName: profiles.name,
      })
      .from(adsBanners)
      .leftJoin(profiles, eq(adsBanners.userId, profiles.userId))
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);
    
    const ads = await query
      .orderBy(desc(adsBanners.createdAt))
      .limit(Number(limit))
      .offset(offset);
    
    // Get total count
    const [{ count }] = await db
      .select({ count: sql`count(*)`.mapWith(Number) })
      .from(adsBanners);
    
    res.json({ 
      success: true, 
      data: ads, 
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count,
        totalPages: Math.ceil(count / Number(limit))
      }
    });
    
  } catch (error) {
    console.error('Get manage ads error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch ads' });
  }
};

/**
 * POST /api/ads/create - Create new ad (admin only - free creation)
 */
export const createAd = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userRole = req.user?.role;
    if (userRole !== 'admin') {
      return res.status(403).json({ success: false, error: 'Admin access required. Use /api/ads/banner/create-with-payment for paid ad creation.' });
    }

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    console.log('Received req.body for create ad:', req.body);
    const validatedData = createBannerAdSchema.parse(req.body);
    console.log('Validated data:', validatedData);

    // Calculate end date based on duration
    const endDate = new Date(validatedData.startDate);
    endDate.setDate(endDate.getDate() + validatedData.durationDays);

    // Calculate price based on targeting and duration
    const calculatedPrice = await calculateAdPrice(validatedData.targetLocations || null, validatedData.durationDays);

    const [newAd] = await db
      .insert(adsBanners)
      .values({
        userId,
        title: validatedData.title,
        imageUrl: validatedData.imageUrl,
        placement: validatedData.placement,
        size: validatedData.size,
        price: calculatedPrice.toString(), // Calculated based on targeting and duration
        startDate: validatedData.startDate,
        endDate: endDate,
        targetLocations: validatedData.targetLocations,
        targetGrades: validatedData.targetGrades,
        linkUrl: validatedData.linkUrl,
        status: 'approved', // Admin ads are auto-approved
      })
      .returning();

    res.json({ 
      success: true, 
      data: newAd,
      message: 'Ad created successfully.' 
    });
    
  } catch (error) {
    console.error('Create ad error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors[0].message });
    }
    res.status(500).json({ success: false, error: 'Failed to create ad' });
  }
};

/**
 * PUT /api/ads/:id - Edit ad (admin or ad owner)
 */
export const updateAd = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userRole = req.user?.role;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    
    const { id } = req.params;
    
    // Check if user owns this ad or is admin
    if (userRole !== 'admin') {
      const [existingAd] = await db
        .select()
        .from(adsBanners)
        .where(eq(adsBanners.id, id));
      
      if (!existingAd || existingAd.userId !== userId) {
        return res.status(403).json({ success: false, error: 'You can only edit your own ads' });
      }
    }
    
    const validatedData = updateBannerAdSchema.parse(req.body);
    
    // Remove undefined values
    const updateData = Object.fromEntries(
      Object.entries(validatedData).filter(([_, value]) => value !== undefined)
    );
    
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ success: false, error: 'No valid fields to update' });
    }

    updateData.updatedAt = new Date();
    
    const [updatedAd] = await db
      .update(adsBanners)
      .set(updateData)
      .where(eq(adsBanners.id, id))
      .returning();
    
    if (!updatedAd) {
      return res.status(404).json({ success: false, error: 'Ad not found' });
    }
    
    res.json({ 
      success: true, 
      data: updatedAd,
      message: 'Ad updated successfully' 
    });
    
  } catch (error) {
    console.error('Update ad error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors[0].message });
    }
    res.status(500).json({ success: false, error: 'Failed to update ad' });
  }
};

/**
 * DELETE /api/ads/:id - Delete ad (admin or ad owner)
 */
export const deleteAd = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userRole = req.user?.role;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    
    const { id } = req.params;
    
    // Check if user owns this ad or is admin
    if (userRole !== 'admin') {
      const [existingAd] = await db
        .select()
        .from(adsBanners)
        .where(eq(adsBanners.id, id));
      
      if (!existingAd || existingAd.userId !== userId) {
        return res.status(403).json({ success: false, error: 'You can only delete your own ads' });
      }
    }
    
    const [deletedAd] = await db
      .delete(adsBanners)
      .where(eq(adsBanners.id, id))
      .returning();
    
    if (!deletedAd) {
      return res.status(404).json({ success: false, error: 'Ad not found' });
    }
    
    res.json({ 
      success: true, 
      message: 'Ad deleted successfully' 
    });
    
  } catch (error) {
    console.error('Delete ad error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete ad' });
  }
};

/**
 * POST /api/ads/approve/:id - Approve ad
 */
export const approveAd = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userRole = req.user?.role;
    if (userRole !== 'admin') {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }
    
    const { id } = req.params;
    
    const [updatedAd] = await db
      .update(adsBanners)
      .set({ 
        status: 'approved',
        updatedAt: new Date()
      })
      .where(eq(adsBanners.id, id))
      .returning();
    
    if (!updatedAd) {
      return res.status(404).json({ success: false, error: 'Ad not found' });
    }
    
    res.json({ 
      success: true, 
      data: updatedAd,
      message: 'Ad approved successfully' 
    });
    
  } catch (error) {
    console.error('Approve ad error:', error);
    res.status(500).json({ success: false, error: 'Failed to approve ad' });
  }
};

/**
 * POST /api/ads/reject/:id - Reject ad
 */
export const rejectAd = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userRole = req.user?.role;
    if (userRole !== 'admin') {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }
    
    const { id } = req.params;
    
    const [updatedAd] = await db
      .update(adsBanners)
      .set({ 
        status: 'rejected',
        updatedAt: new Date()
      })
      .where(eq(adsBanners.id, id))
      .returning();
    
    if (!updatedAd) {
      return res.status(404).json({ success: false, error: 'Ad not found' });
    }
    
    res.json({ 
      success: true, 
      data: updatedAd,
      message: 'Ad rejected successfully' 
    });
    
  } catch (error) {
    console.error('Reject ad error:', error);
    res.status(500).json({ success: false, error: 'Failed to reject ad' });
  }
};

/**
 * GET /api/ads/active?placement=student_dashboard&country=US - Get active ads for dashboard placement
 * Now includes age-based filtering for child safety and multi-dashboard targeting
 */
export const getActiveAds = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { placement, country } = req.query;
    const userLocation = req.userLocation;
    const userId = req.user?.id;
    
    const currentDate = new Date();
    
    // Fetch all ads - no status or date filtering
    // Show all ads regardless of approval status or date range
    const query = db
      .select()
      .from(adsBanners);
    
    const allAds = await query.orderBy(desc(adsBanners.createdAt));
    
    // Get user's age and grade for age-based and grade-based filtering
    let userAge = null;
    let userGrade = null;
    if (userId) {
      try {
        const [userProfile] = await db
          .select({ age: profiles.age, grade: profiles.grade })
          .from(profiles)
          .where(eq(profiles.userId, userId))
          .limit(1);
        
        if (userProfile) {
          userAge = userProfile.age;
          userGrade = userProfile.grade;
        }
      } catch (error) {
        console.error('Failed to fetch user profile for ad filtering:', error);
        // Continue without age/grade filtering if profile fetch fails
      }
    }
    
    // Filter ads by placement, location targeting, age restrictions, and grade targeting
    const filteredAds = allAds.filter(ad => {
      // Placement filter - check both singular placement and placements array
      let placementMatch = true;
      if (placement && typeof placement === 'string') {
        // Check if the ad targets this specific dashboard
        const singularMatch = ad.placement === placement;
        const placementsArray = ad.placements as string[] | null;
        const arrayMatch = placementsArray && Array.isArray(placementsArray) && placementsArray.includes(placement);
        placementMatch = singularMatch || !!arrayMatch;
      }
      
      // Location targeting filter
      const locationMatch = isLocationTargetMatched(userLocation, ad.targetLocations as string[] | null);
      
      // Age restriction filter - only apply if user age is available and ad has age restrictions
      let ageMatch = true;
      if (userAge !== null) {
        // Check minimum age restriction
        if (ad.minAge !== null && userAge < ad.minAge) {
          ageMatch = false;
        }
        // Check maximum age restriction  
        if (ad.maxAge !== null && userAge > ad.maxAge) {
          ageMatch = false;
        }
      }
      
      // Grade targeting filter - only apply if user grade is available and ad has grade targeting
      let gradeMatch = true;
      if (userGrade !== null && ad.targetGrades && (ad.targetGrades as number[]).length > 0) {
        gradeMatch = (ad.targetGrades as number[]).includes(userGrade);
      }
      
      return placementMatch && locationMatch && ageMatch && gradeMatch;
    });
    
    res.json({ success: true, data: filteredAds });
    
  } catch (error) {
    console.error('Get active ads error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch active ads' });
  }
};

/**
 * Track ad impression
 * POST /api/ads/impression
 */
export const trackImpression = async (req: Request, res: Response) => {
  try {
    const { adId } = req.body;
    
    await db
      .update(adsBanners)
      .set({ 
        impressions: sql`${adsBanners.impressions} + 1`,
        updatedAt: new Date()
      })
      .where(eq(adsBanners.id, adId));
    
    res.json({ success: true, message: 'Impression tracked' });
    
  } catch (error) {
    console.error('Track impression error:', error);
    res.status(500).json({ success: false, error: 'Failed to track impression' });
  }
};

/**
 * Track ad click
 * POST /api/ads/click
 */
export const trackClick = async (req: Request, res: Response) => {
  try {
    const { adId } = req.body;
    
    await db
      .update(adsBanners)
      .set({ 
        clicks: sql`${adsBanners.clicks} + 1`,
        updatedAt: new Date()
      })
      .where(eq(adsBanners.id, adId));
    
    res.json({ success: true, message: 'Click tracked' });
    
  } catch (error) {
    console.error('Track click error:', error);
    res.status(500).json({ success: false, error: 'Failed to track click' });
  }
};

/**
 * GET /api/ads/pricing-config - Get all pricing configurations (admin only)
 */
export const getPricingConfig = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userRole = req.user?.role;
    if (userRole !== 'admin') {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }

    const pricingConfigs = await db
      .select()
      .from(adPricingConfig)
      .orderBy(adPricingConfig.targetingType, adPricingConfig.durationDays);

    res.json({ success: true, data: pricingConfigs });
  } catch (error) {
    console.error('Get pricing config error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch pricing configuration' });
  }
};

/**
 * PUT /api/ads/pricing-config/:id - Update pricing configuration (admin only)
 */
export const updatePricingConfig = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userRole = req.user?.role;
    if (userRole !== 'admin') {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }

    const { id } = req.params;
    const { price } = req.body;

    if (!price || price < 0) {
      return res.status(400).json({ success: false, error: 'Valid price is required' });
    }

    const [updatedConfig] = await db
      .update(adPricingConfig)
      .set({ 
        price: price.toString(),
        updatedAt: new Date()
      })
      .where(eq(adPricingConfig.id, id))
      .returning();

    if (!updatedConfig) {
      return res.status(404).json({ success: false, error: 'Pricing configuration not found' });
    }

    res.json({ 
      success: true, 
      data: updatedConfig,
      message: 'Pricing configuration updated successfully' 
    });
  } catch (error) {
    console.error('Update pricing config error:', error);
    res.status(500).json({ success: false, error: 'Failed to update pricing configuration' });
  }
};

/**
 * DELETE /api/ads/pricing-config/:id - Delete pricing configuration (admin only)
 */
export const deletePricingConfig = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userRole = req.user?.role;
    if (userRole !== 'admin') {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }

    const { id } = req.params;

    const [deletedConfig] = await db
      .delete(adPricingConfig)
      .where(eq(adPricingConfig.id, id))
      .returning();

    if (!deletedConfig) {
      return res.status(404).json({ success: false, error: 'Pricing configuration not found' });
    }

    res.json({ 
      success: true, 
      data: deletedConfig,
      message: 'Pricing configuration deleted successfully' 
    });
  } catch (error) {
    console.error('Delete pricing config error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete pricing configuration' });
  }
};

/**
 * GET /api/ads/my-ads - Get current user's ads
 */
export const getMyAds = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    
    let whereConditions = [eq(adsBanners.userId, userId)];
    
    if (status && typeof status === 'string') {
      whereConditions.push(eq(adsBanners.status, status as any));
    }
    
    const query = db
      .select({
        id: adsBanners.id,
        userId: adsBanners.userId,
        title: adsBanners.title,
        imageUrl: adsBanners.imageUrl,
        placement: adsBanners.placement,
        placements: adsBanners.placements,
        size: adsBanners.size,
        status: adsBanners.status,
        startDate: adsBanners.startDate,
        endDate: adsBanners.endDate,
        targetLocations: adsBanners.targetLocations,
        targetGrades: adsBanners.targetGrades,
        impressions: adsBanners.impressions,
        clicks: adsBanners.clicks,
        createdAt: adsBanners.createdAt,
        updatedAt: adsBanners.updatedAt,
        price: adsBanners.price,
      })
      .from(adsBanners)
      .where(and(...whereConditions));
    
    const adsData = await query
      .orderBy(desc(adsBanners.createdAt))
      .limit(Number(limit))
      .offset(offset);
    
    // Transform ads to include computed fields and match frontend expectations
    const ads = adsData.map(ad => {
      // Calculate duration days from start and end date
      const durationDays = ad.startDate && ad.endDate
        ? Math.ceil((new Date(ad.endDate).getTime() - new Date(ad.startDate).getTime()) / (1000 * 60 * 60 * 24))
        : 0;
      
      // Map placements or use placement as single item array for backward compatibility
      const targetDashboards = ad.placements 
        ? (ad.placements as string[])
        : (ad.placement ? [ad.placement] : []);
      
      return {
        ...ad,
        durationDays,
        targetDashboards,
        approvalStatus: ad.status, // status serves as approval status for now
      };
    });
    
    // Get total count for user's ads
    const [{ count }] = await db
      .select({ count: sql`count(*)`.mapWith(Number) })
      .from(adsBanners)
      .where(eq(adsBanners.userId, userId));
    
    console.log('🎯 Get my ads - returning', ads.length, 'ads for user', userId);
    console.log('🎯 First ad sample:', ads[0]);
    
    res.json({ 
      success: true, 
      data: ads, 
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count,
        totalPages: Math.ceil(count / Number(limit))
      }
    });
    
  } catch (error) {
    console.error('Get my ads error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch your ads' });
  }
};

/**
 * POST /api/ads/calculate-price - Calculate ad price for given parameters
 */
export const calculatePrice = async (req: Request, res: Response) => {
  try {
    const { targetLocations, durationDays, dashboardCount = 1 } = req.body;

    if (!durationDays || ![7, 14, 30, 90].includes(durationDays)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Duration must be 7, 14, 30, or 90 days' 
      });
    }

    // Get base price from pricing config
    const basePrice = await calculateAdPrice(targetLocations || null, durationDays);
    
    // Multiply price by number of dashboards selected
    // Each additional dashboard costs the full base price
    const totalPrice = basePrice * Math.max(1, dashboardCount);
    
    res.json({ 
      success: true, 
      data: { 
        price: totalPrice,
        basePrice,
        dashboardCount,
        targetingType: targetLocations && targetLocations.length > 0 ? 'local' : 'global',
        durationDays 
      }
    });
  } catch (error) {
    console.error('Calculate price error:', error);
    res.status(500).json({ success: false, error: 'Failed to calculate price' });
  }
};