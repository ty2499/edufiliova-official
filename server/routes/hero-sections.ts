import { Request, Response } from 'express';
import { heroSections, insertHeroSectionSchema } from "../../shared/schema.js";

// Extend Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}
import { eq, desc, and, or, sql, count, asc, isNull, isNotNull, ne, gte, lte } from "drizzle-orm";
import { db } from "../db.js";

// Get all hero sections for management (admin only)
export const getManageHeroSections = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    
    // Only admins can access all hero sections
    if (user?.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        error: 'Admin access required' 
      });
    }

    const allHeroSections = await db.select().from(heroSections).orderBy(desc(heroSections.createdAt));

    res.json({
      success: true,
      data: allHeroSections
    });
  } catch (error) {
    console.error('Error fetching hero sections for management:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch hero sections' 
    });
  }
};

// Get current user's hero sections
export const getMyHeroSections = async (req: Request, res: Response) => {
  try {
    const { user } = req;
    
    if (!user?.id) {
      return res.status(401).json({ 
        success: false, 
        error: 'Authentication required' 
      });
    }

    const userHeroSections = await db.select()
      .from(heroSections)
      .where(eq(heroSections.userId, user.id))
      .orderBy(desc(heroSections.createdAt));

    res.json({
      success: true,
      data: userHeroSections
    });
  } catch (error) {
    console.error('Error fetching user hero sections:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch hero sections' 
    });
  }
};

// Create hero section (admin only)
export const createHeroSection = async (req: Request, res: Response) => {
  try {
    // Authentication guard
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }
    
    const user = req.user;
    
    // Only admins can create hero sections directly
    if (user?.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        error: 'Admin access required' 
      });
    }

    // Validate request body
    console.log('🔍 Hero section creation request body:', JSON.stringify(req.body, null, 2));
    
    const validationResult = insertHeroSectionSchema.safeParse(req.body);
    if (!validationResult.success) {
      console.error('❌ Hero section validation failed:', JSON.stringify(validationResult.error.issues, null, 2));
      return res.status(400).json({
        success: false,
        error: 'Invalid data',
        details: validationResult.error.issues
      });
    }

    const heroData = validationResult.data;

    // Add user ID and default status
    const heroSectionData = {
      ...heroData,
      userId: user.id,
      status: 'active' as const,
      impressions: 0,
      clicks: 0
    };

    // Insert hero section
    const [newHeroSection] = await db.insert(heroSections)
      .values(heroSectionData)
      .returning();

    res.status(201).json({
      success: true,
      data: newHeroSection,
      message: 'Hero section created successfully'
    });
  } catch (error) {
    console.error('Error creating hero section:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create hero section' 
    });
  }
};

// Update hero section
export const updateHeroSection = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user;
    
    if (!user?.id) {
      return res.status(401).json({ 
        success: false, 
        error: 'Authentication required' 
      });
    }

    // Get existing hero section
    const existingHero = await db.select().from(heroSections).where(eq(heroSections.id, id)).limit(1);
    
    if (!existingHero.length) {
      return res.status(404).json({ 
        success: false, 
        error: 'Hero section not found' 
      });
    }

    // Check permissions - admin can edit any, users can edit their own
    const heroSection = existingHero[0];
    if (user?.role !== 'admin' && heroSection.userId !== user.id) {
      return res.status(403).json({ 
        success: false, 
        error: 'Permission denied' 
      });
    }

    // Validate update data
    const updateData = req.body;
    const allowedUpdates = [
      'title', 'subtitle', 'placement', 'desktopImageUrl', 'tabletImageUrl', 'mobileImageUrl',
      'linkUrl', 'buttonText', 'status', 'priority', 'startDate', 'endDate',
      'textColor', 'backgroundColor', 'overlayOpacity', 'isFullHeight', 
      'customHeight', 'contentAlignment'
    ];

    const filteredData: any = {};
    for (const key in updateData) {
      if (allowedUpdates.includes(key)) {
        filteredData[key] = updateData[key];
      }
    }

    // Update hero section
    const [updatedHero] = await db.update(heroSections)
      .set({
        ...filteredData,
        updatedAt: new Date()
      })
      .where(eq(heroSections.id, id))
      .returning();

    res.json({
      success: true,
      data: updatedHero,
      message: 'Hero section updated successfully'
    });
  } catch (error) {
    console.error('Error updating hero section:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update hero section' 
    });
  }
};

// Delete hero section
export const deleteHeroSection = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user;
    
    if (!user?.id) {
      return res.status(401).json({ 
        success: false, 
        error: 'Authentication required' 
      });
    }

    // Get existing hero section
    const existingHero = await db.select().from(heroSections).where(eq(heroSections.id, id)).limit(1);
    
    if (!existingHero.length) {
      return res.status(404).json({ 
        success: false, 
        error: 'Hero section not found' 
      });
    }

    // Check permissions - admin can delete any, users can delete their own
    const heroSection = existingHero[0];
    if (user?.role !== 'admin' && heroSection.userId !== user.id) {
      return res.status(403).json({ 
        success: false, 
        error: 'Permission denied' 
      });
    }

    // Delete hero section
    await db.delete(heroSections).where(eq(heroSections.id, id));

    res.json({
      success: true,
      message: 'Hero section deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting hero section:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete hero section' 
    });
  }
};

// Update hero section status
export const updateHeroSectionStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const user = req.user;
    
    // Only admins can change status
    if (user?.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        error: 'Admin access required' 
      });
    }

    if (!['active', 'inactive', 'scheduled'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid status' 
      });
    }

    // Update status
    const [updatedHero] = await db.update(heroSections)
      .set({
        status,
        updatedAt: new Date()
      })
      .where(eq(heroSections.id, id))
      .returning();

    if (!updatedHero) {
      return res.status(404).json({ 
        success: false, 
        error: 'Hero section not found' 
      });
    }

    res.json({
      success: true,
      data: updatedHero,
      message: 'Hero section status updated successfully'
    });
  } catch (error) {
    console.error('Error updating hero section status:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update status' 
    });
  }
};

// Get active hero sections for display
export const getActiveHeroSections = async (req: Request, res: Response) => {
  try {
    const { placement } = req.query;
    
    // Build conditions array
    const conditions = [
      eq(heroSections.status, 'active'),
      // Check if hero section is within date range (if dates are set)
      or(
        isNull(heroSections.startDate),
        lte(heroSections.startDate, new Date())
      ),
      or(
        isNull(heroSections.endDate),
        gte(heroSections.endDate, new Date())
      )
    ];

    // Add placement filter if specified
    if (placement) {
      conditions.push(eq(heroSections.placement, placement as string));
    }

    // Execute query with all conditions
    const activeHeros = await db.select()
      .from(heroSections)
      .where(and(...conditions))
      .orderBy(asc(heroSections.priority), desc(heroSections.createdAt));

    res.json({
      success: true,
      data: activeHeros
    });
  } catch (error) {
    console.error('Error fetching active hero sections:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch active hero sections',
      data: [] 
    });
  }
};

// Track hero section impression
export const trackImpression = async (req: Request, res: Response) => {
  try {
    const { heroId } = req.body;
    
    if (!heroId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Hero section ID required' 
      });
    }

    // Increment impression count
    await db.update(heroSections)
      .set({
        impressions: sql`${heroSections.impressions} + 1`,
        updatedAt: new Date()
      })
      .where(eq(heroSections.id, heroId));

    res.json({
      success: true,
      message: 'Impression tracked'
    });
  } catch (error) {
    console.error('Error tracking impression:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to track impression' 
    });
  }
};

// Track hero section click
export const trackClick = async (req: Request, res: Response) => {
  try {
    const { heroId } = req.body;
    
    if (!heroId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Hero section ID required' 
      });
    }

    // Increment click count
    await db.update(heroSections)
      .set({
        clicks: sql`${heroSections.clicks} + 1`,
        updatedAt: new Date()
      })
      .where(eq(heroSections.id, heroId));

    res.json({
      success: true,
      message: 'Click tracked'
    });
  } catch (error) {
    console.error('Error tracking click:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to track click' 
    });
  }
};