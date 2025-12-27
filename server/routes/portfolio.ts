import { Router } from 'express';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { db } from '../db.js';
import { works, workMedia, workLikes, workComments, workViews, users, profiles, insertWorkSchema, selectWorkSchema, updateWorkSchema, notifications, showcaseProjectBoostComments } from '../../shared/schema.js';
import { eq, desc, and, inArray, or, ilike, sql, isNull, asc } from 'drizzle-orm';
import { z } from 'zod';
import { upload } from '../upload.js';
import { cloudinaryStorage } from '../cloudinary-storage.js';
import crypto from 'crypto';
import { pushNotifications } from '../services/push-notifications.js';

const router = Router();

// Helper function to create notifications for comments/replies/mentions
async function createCommentNotifications(params: {
  workId: string;
  workOwnerId: string;
  commentAuthorId: string;
  commentAuthorName: string;
  commentId: string;
  content: string;
  workTitle: string;
  parentCommentId?: string | null;
  parentCommentAuthorId?: string | null;
}) {
  const {
    workId,
    workOwnerId,
    commentAuthorId,
    commentAuthorName,
    commentId,
    content,
    workTitle,
    parentCommentId,
    parentCommentAuthorId
  } = params;

  const notificationsToCreate: Array<{
    userId: string;
    title: string;
    message: string;
    type: string;
    actionUrl: string;
    metadata: any;
  }> = [];

  // 1. Detect @mentions in the content
  const mentionRegex = /@(\w+)/g;
  const mentions: string[] = [];
  let match;
  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push(match[1]);
  }
  
  if (mentions.length > 0) {
    // Find mentioned users by displayName or name
    // Match at word boundaries to avoid false positives (e.g., @ann matching "Joanna")
    const mentionedUsers = await db
      .select({
        userId: profiles.userId,
        name: profiles.name,
        displayName: profiles.displayName,
      })
      .from(profiles)
      .where(
        or(
          ...mentions.map(mention => {
            // Match at start of string or after a space (word boundary)
            const startPattern = `${mention}%`; // Matches if name starts with mention
            const wordPattern = `% ${mention}%`; // Matches if mention starts a word after space
            return or(
              ilike(profiles.displayName, startPattern),
              ilike(profiles.name, startPattern),
              ilike(profiles.displayName, wordPattern),
              ilike(profiles.name, wordPattern)
            )!;
          })
        )!
      );

    // Filter to only include exact word matches to reduce false positives
    const exactMentionedUsers = mentionedUsers.filter(user => {
      const displayName = (user.displayName || '').toLowerCase();
      const name = (user.name || '').toLowerCase();
      
      return mentions.some(mention => {
        const lowerMention = mention.toLowerCase();
        const words = [...displayName.split(/\s+/), ...name.split(/\s+/)];
        // Check if mention exactly matches any complete word in the name
        return words.some(word => word === lowerMention);
      });
    });

    // Create mention notifications
    for (const mentionedUser of exactMentionedUsers) {
      if (mentionedUser.userId !== commentAuthorId) { // Don't notify self
        notificationsToCreate.push({
          userId: mentionedUser.userId,
          title: `${commentAuthorName} mentioned you`,
          message: `${commentAuthorName} mentioned you in a comment on "${workTitle}": ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}`,
          type: 'mention',
          actionUrl: `/portfolio/works/${workId}?comment=${commentId}`,
          metadata: {
            workId,
            commentId,
            authorId: commentAuthorId,
            type: 'mention'
          }
        });
      }
    }
  }

  // 2. If it's a reply, notify the parent comment author
  if (parentCommentId && parentCommentAuthorId && parentCommentAuthorId !== commentAuthorId) {
    notificationsToCreate.push({
      userId: parentCommentAuthorId,
      title: `${commentAuthorName} replied to your comment`,
      message: `${commentAuthorName} replied to your comment on "${workTitle}": ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}`,
      type: 'reply',
      actionUrl: `/portfolio/works/${workId}?comment=${parentCommentId}#${commentId}`,
      metadata: {
        workId,
        commentId,
        parentCommentId,
        authorId: commentAuthorId,
        type: 'reply'
      }
    });
  }

  // 3. If it's a new comment (not a reply), notify the work owner
  if (!parentCommentId && workOwnerId !== commentAuthorId) {
    notificationsToCreate.push({
      userId: workOwnerId,
      title: `${commentAuthorName} commented on your work`,
      message: `${commentAuthorName} commented on "${workTitle}": ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}`,
      type: 'comment',
      actionUrl: `/portfolio/works/${workId}?comment=${commentId}`,
      metadata: {
        workId,
        commentId,
        authorId: commentAuthorId,
        type: 'comment'
      }
    });
  }

  // Insert all notifications
  if (notificationsToCreate.length > 0) {
    await db.insert(notifications).values(notificationsToCreate);
  }
}

// Get user's own works (authenticated) - OPTIMIZED
router.get('/my/works', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    // Single optimized query to get works with COMBINED counts (real + boosted)
    const userWorks = await db
      .select({
        id: works.id,
        userId: works.userId,
        title: works.title,
        description: works.description,
        tags: works.tags,
        coverMediaId: works.coverMediaId,
        visibility: works.visibility,
        category: works.category,
        // COMBINED counts: Real from tracking tables + Boosted from works table
        likesCount: sql<number>`((SELECT COUNT(*) FROM work_likes WHERE work_id = ${works.id}) + COALESCE(${works.boostLikesCount}, 0))`.as('likes_count'),
        commentsCount: sql<number>`((SELECT COUNT(*) FROM work_comments WHERE work_id = ${works.id}) + (SELECT COUNT(*) FROM showcase_project_boost_comments WHERE showcase_project_id = ${works.id}))`.as('comments_count'),
        viewsCount: sql<number>`((SELECT COUNT(*) FROM work_views WHERE work_id = ${works.id}) + COALESCE(${works.boostViewsCount}, 0))`.as('views_count'),
        createdAt: works.createdAt,
        updatedAt: works.updatedAt,
      })
      .from(works)
      .where(eq(works.userId, req.user!.id))
      .orderBy(desc(works.createdAt));

    if (userWorks.length === 0) {
      return res.json({ success: true, data: [] });
    }

    // Get all media for user's works in one query - FIXED
    const workIds = userWorks.map(w => w.id);
    const allMedia = await db
      .select({
        id: workMedia.id,
        workId: workMedia.workId,
        type: workMedia.type,
        url: workMedia.url,
        thumbUrl: workMedia.thumbUrl,
        width: workMedia.width,
        height: workMedia.height,
        sortOrder: workMedia.sortOrder,
        createdAt: workMedia.createdAt,
        durationSec: workMedia.durationSec,
        provider: workMedia.provider,
        providerId: workMedia.providerId,
      })
      .from(workMedia)
      .where(inArray(workMedia.workId, workIds))
      .orderBy(workMedia.workId, workMedia.sortOrder);

    // Group media by workId for fast lookup
    const mediaByWorkId = new Map();
    allMedia.forEach(media => {
      if (!mediaByWorkId.has(media.workId)) {
        mediaByWorkId.set(media.workId, []);
      }
      mediaByWorkId.get(media.workId).push(media);
    });

    // Combine works with their media
    const worksWithMedia = userWorks.map(work => ({
      ...work,
      likesCount: work.likesCount ?? 0,
      commentsCount: work.commentsCount ?? 0,
      viewsCount: work.viewsCount ?? 0,
      media: mediaByWorkId.get(work.id) || []
    }));

    res.json({
      success: true,
      data: worksWithMedia
    });
  } catch (error) {
    console.error('User portfolio works fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user portfolio works'
    });
  }
});

// Get all works (public endpoint for browsing)
router.get('/works', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 12;
    const offset = (page - 1) * limit;
    
    // Extract filtering and sorting parameters
    const searchQuery = req.query.search as string;
    const tags = req.query.tags as string;
    const category = req.query.category as string;
    const sortBy = req.query.sort as string || 'recent';
    
    console.log('📂 Portfolio filter params:', { searchQuery, tags, category, sortBy });
    
    // Parse tags if provided
    const tagArray = tags ? tags.split(',').map(tag => tag.trim()).filter(Boolean) : [];

    // Build WHERE conditions
    const whereConditions = [
      eq(works.visibility, 'public'),
      eq(profiles.approvalStatus, 'approved') // Only show works from approved freelancers
    ];
    
    // Add search condition if provided
    if (searchQuery) {
      whereConditions.push(
        or(
          ilike(works.title, `%${searchQuery}%`),
          ilike(works.description, `%${searchQuery}%`),
          ilike(profiles.name, `%${searchQuery}%`),
          ilike(profiles.displayName, `%${searchQuery}%`)
        )!
      );
    }
    
    // Add tag filtering if provided
    if (tagArray.length > 0) {
      // Check if any of the requested tags overlap with work tags
      const tagConditions = tagArray.map(tag => 
        sql`${works.tags} @> ${JSON.stringify([tag])}`
      );
      whereConditions.push(or(...tagConditions)!);
    }
    
    // Add category filtering if provided
    if (category) {
      whereConditions.push(eq(works.category, category));
    }
    
    // Determine sort order
    let orderByClause;
    switch (sortBy) {
      case 'popular':
        orderByClause = [desc(works.likesCount), desc(works.viewsCount)];
        break;
      case 'trending':
        orderByClause = [desc(sql`(${works.likesCount} + ${works.viewsCount})`), desc(works.createdAt)];
        break;
      case 'rating':
        orderByClause = [desc(profiles.averageRating), desc(works.createdAt)];
        break;
      case 'recent':
      default:
        orderByClause = [desc(works.createdAt)];
        break;
    }
    
    // Get works with user profile information and COMBINED counts (real + boosted)
    const allWorks = await db
      .select({
        // Work fields
        id: works.id,
        userId: works.userId,
        title: works.title,
        description: works.description,
        tags: works.tags,
        coverMediaId: works.coverMediaId,
        visibility: works.visibility,
        // COMBINED counts: Real from tracking tables + Boosted from works table
        likesCount: sql<number>`((SELECT COUNT(*) FROM work_likes WHERE work_id = ${works.id}) + COALESCE(${works.boostLikesCount}, 0))`.as('likes_count'),
        commentsCount: sql<number>`((SELECT COUNT(*) FROM work_comments WHERE work_id = ${works.id}) + (SELECT COUNT(*) FROM showcase_project_boost_comments WHERE showcase_project_id = ${works.id}))`.as('comments_count'),
        viewsCount: sql<number>`((SELECT COUNT(*) FROM work_views WHERE work_id = ${works.id}) + COALESCE(${works.boostViewsCount}, 0))`.as('views_count'),
        createdAt: works.createdAt,
        updatedAt: works.updatedAt,
        // User profile fields
        user: {
          id: profiles.userId,
          name: profiles.name,
          displayName: profiles.displayName,
          avatarUrl: profiles.avatarUrl,
          bio: profiles.bio,
          professionalTitle: profiles.professionalTitle,
          location: profiles.location,
          rating: profiles.averageRating,
          reviewCount: profiles.clientReviews,
          hourlyRate: profiles.hourlyRate,
          verified: profiles.verified,
          verificationBadge: profiles.verificationBadge,
          coverImageUrl: profiles.coverImageUrl,
        }
      })
      .from(works)
      .leftJoin(profiles, eq(works.userId, profiles.userId))
      .where(and(...whereConditions))
      .orderBy(...orderByClause)
      .limit(limit)
      .offset(offset);

    // Get all media for works in one query (OPTIMIZED & FIXED)
    const workIds = allWorks.map(w => w.id);
    let allMedia: any[] = [];
    if (workIds.length > 0) {
      allMedia = await db
        .select({
          id: workMedia.id,
          workId: workMedia.workId,
          type: workMedia.type,
          url: workMedia.url,
          thumbUrl: workMedia.thumbUrl,
          width: workMedia.width,
          height: workMedia.height,
          sortOrder: workMedia.sortOrder,
          createdAt: workMedia.createdAt,
          durationSec: workMedia.durationSec,
        provider: workMedia.provider,
        providerId: workMedia.providerId,
        })
        .from(workMedia)
        .where(inArray(workMedia.workId, workIds))
        .orderBy(workMedia.workId, workMedia.sortOrder);
    }

    // Group media by workId
    const mediaByWorkId = new Map();
    allMedia.forEach(media => {
      if (!mediaByWorkId.has(media.workId)) {
        mediaByWorkId.set(media.workId, []);
      }
      mediaByWorkId.get(media.workId).push(media);
    });

    const worksWithMedia = allWorks.map((work) => {
      const media = mediaByWorkId.get(work.id) || [];
        
      return {
        ...work,
        likesCount: work.likesCount ?? 0,
        commentsCount: work.commentsCount ?? 0,
        viewsCount: work.viewsCount ?? 0,
        media
      };
    });

    res.json({
      success: true,
      data: worksWithMedia,
      pagination: {
        page,
        limit,
        hasMore: allWorks.length === limit
      }
    });
  } catch (error) {
    console.error('Portfolio works fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch portfolio works'
    });
  }
});

// Create new work (authenticated)
router.post('/works', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    // Debug the incoming request
    console.log('🔍 Portfolio creation request body:', {
      bodyKeys: Object.keys(req.body),
      mediaExists: !!req.body.media,
      mediaType: typeof req.body.media,
      mediaIsArray: Array.isArray(req.body.media),
      mediaLength: req.body.media?.length,
      mediaFirstItem: req.body.media?.[0],
      fullMediaArray: req.body.media
    });
    
    // Separate media data from work data for validation
    const { media, coverImage, ...workData } = req.body;
    
    // Validate work data (without media)
    const validatedWorkData = insertWorkSchema.parse(workData);
    
    // Validate media data separately if provided
    let validatedMedia: any[] = [];
    if (media && Array.isArray(media)) {
      const mediaSchema = z.array(z.object({
        type: z.enum(["image", "video", "youtube", "vimeo"]),
        url: z.string().min(1),
        thumbUrl: z.string().optional(),
        width: z.number().optional(),
        height: z.number().optional(),
        durationSec: z.number().optional(),
        provider: z.string().optional(),
        providerId: z.string().optional(),
        order: z.number().default(0),
      }));
      
      validatedMedia = mediaSchema.parse(media);
    }
    
    // Create the work first (without coverMediaId for now)
    const [newWork] = await db
      .insert(works)
      .values({
        ...validatedWorkData,
        userId: req.user!.id
      })
      .returning();

    let coverMediaId = null;

    // Handle cover image if provided
    if (coverImage && coverImage.url) {
      const [coverMediaRecord] = await db
        .insert(workMedia)
        .values({
          workId: newWork.id,
          type: 'image',
          url: coverImage.url,
          thumbUrl: coverImage.thumbUrl || null,
          sortOrder: -1, // Cover image has special sort order
        })
        .returning();
      
      coverMediaId = coverMediaRecord.id;

      // Update work with coverMediaId
      await db
        .update(works)
        .set({ coverMediaId })
        .where(eq(works.id, newWork.id));
    }

    // Create media records if provided
    if (validatedMedia && validatedMedia.length > 0) {
      const mediaRecords = validatedMedia.map((mediaItem: any, index: number) => ({
        workId: newWork.id,
        type: mediaItem.type,
        url: mediaItem.url,
        thumbUrl: mediaItem.thumbUrl || null,
        width: mediaItem.width || null,
        height: mediaItem.height || null,
        durationSec: mediaItem.durationSec || null,
        provider: mediaItem.provider || null,
        providerId: mediaItem.providerId || null,
        sortOrder: mediaItem.order || index
      }));

      await db.insert(workMedia).values(mediaRecords);
    }

    // Fetch the complete work with media
    const completeWork = await db
      .select()
      .from(works)
      .where(eq(works.id, newWork.id))
      .limit(1);

    const workMediaRecords = await db
      .select({
        id: workMedia.id,
        workId: workMedia.workId,
        type: workMedia.type,
        url: workMedia.url,
        thumbUrl: workMedia.thumbUrl,
        width: workMedia.width,
        height: workMedia.height,
        sortOrder: workMedia.sortOrder,
        createdAt: workMedia.createdAt,
        durationSec: workMedia.durationSec,
        provider: workMedia.provider,
        providerId: workMedia.providerId,
      })
      .from(workMedia)
      .where(eq(workMedia.workId, newWork.id))
      .orderBy(workMedia.workId, workMedia.sortOrder);

    // Get cover image if exists
    let coverImageData = null;
    if (completeWork[0].coverMediaId) {
      const coverMediaRecord = await db
        .select({
          type: workMedia.type,
          url: workMedia.url,
          thumbUrl: workMedia.thumbUrl,
        })
        .from(workMedia)
        .where(eq(workMedia.id, completeWork[0].coverMediaId))
        .limit(1);
      
      if (coverMediaRecord.length > 0) {
        coverImageData = coverMediaRecord[0];
      }
    }

    res.json({
      success: true,
      data: {
        ...completeWork[0],
        media: workMediaRecords,
        coverImage: coverImageData
      }
    });
  } catch (error) {
    console.error('Portfolio work creation error:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Invalid work data',
        details: error.errors
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to create portfolio work'
      });
    }
  }
});

// Add media to work
router.post('/works/:workId/media', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { workId } = req.params;
    
    // Verify work belongs to user
    const work = await db
      .select()
      .from(works)
      .where(and(
        eq(works.id, workId),
        eq(works.userId, req.user!.id)
      ))
      .limit(1);

    if (!work.length) {
      return res.status(404).json({
        success: false,
        error: 'Work not found or not authorized'
      });
    }

    // Handle file uploads (this would integrate with your existing upload system)
    // For now, just return success - you'll need to integrate with your upload middleware
    
    res.json({
      success: true,
      message: 'Media upload endpoint ready - integrate with your upload system'
    });
  } catch (error) {
    console.error('Portfolio media upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload media'
    });
  }
});

// Get work by ID
router.get('/works/:workId', async (req, res) => {
  try {
    const { workId } = req.params;

    // Get work with user profile data using LEFT JOIN and COMBINED counts
    const workWithUser = await db
      .select({
        // Work fields
        id: works.id,
        userId: works.userId,
        title: works.title,
        description: works.description,
        tags: works.tags,
        coverMediaId: works.coverMediaId,
        visibility: works.visibility,
        // COMBINED counts: Real from tracking tables + Boosted from works table
        likesCount: sql<number>`((SELECT COUNT(*) FROM work_likes WHERE work_id = ${works.id}) + COALESCE(${works.boostLikesCount}, 0))`.as('likes_count'),
        commentsCount: sql<number>`((SELECT COUNT(*) FROM work_comments WHERE work_id = ${works.id}) + (SELECT COUNT(*) FROM showcase_project_boost_comments WHERE showcase_project_id = ${works.id}))`.as('comments_count'),
        viewsCount: sql<number>`((SELECT COUNT(*) FROM work_views WHERE work_id = ${works.id}) + COALESCE(${works.boostViewsCount}, 0))`.as('views_count'),
        createdAt: works.createdAt,
        updatedAt: works.updatedAt,
        // User fields from profile
        user: {
          id: profiles.userId,
          displayName: profiles.displayName,
          name: profiles.name,
          avatarUrl: profiles.avatarUrl,
          bio: profiles.bio,
          verificationBadge: profiles.verificationBadge,
        }
      })
      .from(works)
      .leftJoin(profiles, eq(works.userId, profiles.userId))
      .where(eq(works.id, workId))
      .limit(1);

    if (!workWithUser.length) {
      return res.status(404).json({
        success: false,
        error: 'Work not found'
      });
    }

    // Get media for the work
    const media = await db
      .select()
      .from(workMedia)
      .where(eq(workMedia.workId, workId))
      .orderBy(workMedia.workId, workMedia.sortOrder);

    const work = workWithUser[0];

    // Get cover image if exists
    let coverImageData = null;
    if (work.coverMediaId) {
      const coverMediaRecord = await db
        .select({
          type: workMedia.type,
          url: workMedia.url,
          thumbUrl: workMedia.thumbUrl,
        })
        .from(workMedia)
        .where(eq(workMedia.id, work.coverMediaId))
        .limit(1);
      
      if (coverMediaRecord.length > 0) {
        coverImageData = coverMediaRecord[0];
      }
    }
    
    res.json({
      success: true,
      data: {
        ...work,
        media,
        coverImage: coverImageData
      }
    });
  } catch (error) {
    console.error('Portfolio work fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch portfolio work'
    });
  }
});

// Update work (authenticated)
router.put('/works/:workId', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { workId } = req.params;
    
    // Separate media data from work data for validation
    const { media, coverImage, ...workData } = req.body;
    
    // Validate work data (without media)
    const validatedUpdateData = updateWorkSchema.parse(workData);

    // Verify work belongs to user
    const work = await db
      .select()
      .from(works)
      .where(and(
        eq(works.id, workId),
        eq(works.userId, req.user!.id)
      ))
      .limit(1);

    if (!work.length) {
      return res.status(404).json({
        success: false,
        error: 'Work not found or not authorized'
      });
    }

    // Handle cover image update
    let coverMediaId = work[0].coverMediaId;

    if (coverImage !== undefined) {
      // Delete old cover media if it exists
      if (coverMediaId) {
        await db.delete(workMedia).where(eq(workMedia.id, coverMediaId));
        coverMediaId = null;
      }

      // Create new cover media if provided
      if (coverImage && coverImage.url) {
        const [coverMediaRecord] = await db
          .insert(workMedia)
          .values({
            workId: workId,
            type: 'image',
            url: coverImage.url,
            thumbUrl: coverImage.thumbUrl || null,
            sortOrder: -1, // Cover image has special sort order
          })
          .returning();
        
        coverMediaId = coverMediaRecord.id;
      }
    }

    // Update the work metadata
    const [updatedWork] = await db
      .update(works)
      .set({
        ...validatedUpdateData,
        coverMediaId,
        updatedAt: new Date()
      })
      .where(eq(works.id, workId))
      .returning();

    // Handle media updates if provided
    if (media && Array.isArray(media)) {
      // Validate media data
      const mediaSchema = z.array(z.object({
        type: z.enum(["image", "video", "youtube", "vimeo"]),
        url: z.string().min(1),
        thumbUrl: z.string().optional(),
        width: z.number().optional(),
        height: z.number().optional(),
        durationSec: z.number().optional(),
        provider: z.string().optional(),
        providerId: z.string().optional(),
        order: z.number().default(0),
      }));
      
      const validatedMedia = mediaSchema.parse(media);
      
      // Delete existing media first (but NOT the cover media - it has sortOrder -1)
      await db
        .delete(workMedia)
        .where(and(
          eq(workMedia.workId, workId),
          sql`${workMedia.sortOrder} >= 0`
        ));
      
      // Insert new media records
      if (validatedMedia.length > 0) {
        const mediaRecords = validatedMedia.map((mediaItem: any, index: number) => ({
          workId: workId,
          type: mediaItem.type,
          url: mediaItem.url,
          thumbUrl: mediaItem.thumbUrl || null,
          width: mediaItem.width || null,
          height: mediaItem.height || null,
          durationSec: mediaItem.durationSec || null,
          provider: mediaItem.provider || null,
          providerId: mediaItem.providerId || null,
          sortOrder: mediaItem.order || index
        }));

        await db.insert(workMedia).values(mediaRecords);
      }
    }

    // Fetch the complete updated work with media
    const completeWork = await db
      .select()
      .from(works)
      .where(eq(works.id, workId))
      .limit(1);

    const workMediaRecords = await db
      .select({
        id: workMedia.id,
        workId: workMedia.workId,
        type: workMedia.type,
        url: workMedia.url,
        thumbUrl: workMedia.thumbUrl,
        width: workMedia.width,
        height: workMedia.height,
        sortOrder: workMedia.sortOrder,
        createdAt: workMedia.createdAt,
        durationSec: workMedia.durationSec,
        provider: workMedia.provider,
        providerId: workMedia.providerId,
      })
      .from(workMedia)
      .where(eq(workMedia.workId, workId))
      .orderBy(workMedia.workId, workMedia.sortOrder);

    // Get cover image if exists
    let coverImageData = null;
    if (completeWork[0].coverMediaId) {
      const coverMediaRecord = await db
        .select({
          type: workMedia.type,
          url: workMedia.url,
          thumbUrl: workMedia.thumbUrl,
        })
        .from(workMedia)
        .where(eq(workMedia.id, completeWork[0].coverMediaId))
        .limit(1);
      
      if (coverMediaRecord.length > 0) {
        coverImageData = coverMediaRecord[0];
      }
    }

    res.json({
      success: true,
      data: {
        ...completeWork[0],
        media: workMediaRecords,
        coverImage: coverImageData
      }
    });
  } catch (error) {
    console.error('Portfolio work update error:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Invalid update data',
        details: error.errors
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to update portfolio work'
      });
    }
  }
});

// Delete work (authenticated)
router.delete('/works/:workId', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { workId } = req.params;

    // Verify work belongs to user
    const work = await db
      .select()
      .from(works)
      .where(and(
        eq(works.id, workId),
        eq(works.userId, req.user!.id)
      ))
      .limit(1);

    if (!work.length) {
      return res.status(404).json({
        success: false,
        error: 'Work not found or not authorized'
      });
    }

    // Delete work (media will be deleted by cascade)
    await db
      .delete(works)
      .where(eq(works.id, workId));

    res.json({
      success: true,
      message: 'Work deleted successfully'
    });
  } catch (error) {
    console.error('Portfolio work deletion error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete portfolio work'
    });
  }
});

// Set cover image for a portfolio work (authenticated)
router.patch('/works/:workId/cover', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { workId } = req.params;

    // Validate request body with Zod
    const coverSchema = z.object({
      coverMediaId: z.string().uuid('coverMediaId must be a valid UUID')
    });

    const { coverMediaId } = coverSchema.parse(req.body);

    // Verify work belongs to user
    const work = await db
      .select()
      .from(works)
      .where(and(
        eq(works.id, workId),
        eq(works.userId, req.user!.id)
      ))
      .limit(1);

    if (!work.length) {
      return res.status(404).json({
        success: false,
        error: 'Work not found or not authorized'
      });
    }

    // Verify the media exists and belongs to this work
    const media = await db
      .select()
      .from(workMedia)
      .where(and(
        eq(workMedia.id, coverMediaId),
        eq(workMedia.workId, workId)
      ))
      .limit(1);

    if (!media.length) {
      return res.status(404).json({
        success: false,
        error: 'Media not found or does not belong to this work'
      });
    }

    // Update the work's cover media ID
    const [updatedWork] = await db
      .update(works)
      .set({
        coverMediaId: coverMediaId,
        updatedAt: new Date()
      })
      .where(eq(works.id, workId))
      .returning();

    res.json({
      success: true,
      message: 'Cover image set successfully',
      data: {
        workId: updatedWork.id,
        coverMediaId: updatedWork.coverMediaId
      }
    });
  } catch (error) {
    console.error('Set cover image error:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.errors
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to set cover image'
      });
    }
  }
});

// Portfolio Media Upload Routes - Behance Style

// Upload single image for portfolio
router.post('/upload/image', requireAuth, upload.single('image'), async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided'
      });
    }

    // Upload to Cloudinary with portfolio folder structure
    const uploadResult = await cloudinaryStorage.uploadFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      'portfolio/images'
    );

    if (!uploadResult.success) {
      return res.status(500).json({
        success: false,
        error: uploadResult.error || 'Upload failed'
      });
    }

    // Get image dimensions from Cloudinary result
    const imageInfo = {
      url: uploadResult.url!,
      thumbUrl: uploadResult.url!.replace('/upload/', '/upload/c_thumb,w_300,h_200/'),
      width: null, // Cloudinary provides this but let's keep it simple for now
      height: null,
      size: req.file.size,
      format: req.file.mimetype.split('/')[1],
      originalName: req.file.originalname
    };

    res.json({
      success: true,
      data: imageInfo
    });
  } catch (error) {
    console.error('Portfolio image upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload image'
    });
  }
});

// Upload multiple images for portfolio (Behance-style batch upload)
router.post('/upload/images', requireAuth, upload.array('images', 10), async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No image files provided'
      });
    }

    // Upload all images to Cloudinary in parallel
    const uploadPromises = req.files.map(async (file, index) => {
      const uploadResult = await cloudinaryStorage.uploadFile(
        file.buffer,
        file.originalname,
        file.mimetype,
        'portfolio/images'
      );

      if (!uploadResult.success) {
        throw new Error(`Failed to upload ${file.originalname}: ${uploadResult.error}`);
      }

      return {
        url: uploadResult.url!,
        thumbUrl: uploadResult.url!.replace('/upload/', '/upload/c_thumb,w_300,h_200/'),
        width: null,
        height: null,
        size: file.size,
        format: file.mimetype.split('/')[1],
        originalName: file.originalname,
        sortOrder: index
      };
    });

    const uploadedImages = await Promise.all(uploadPromises);

    res.json({
      success: true,
      data: uploadedImages
    });
  } catch (error) {
    console.error('Portfolio batch upload error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload images'
    });
  }
});

// Delete uploaded image before saving work
router.delete('/upload/image', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'Image URL is required'
      });
    }

    // Extract public ID from Cloudinary URL
    const urlParts = url.split('/');
    const versionIndex = urlParts.findIndex((part: string) => part.startsWith('v'));
    if (versionIndex === -1) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Cloudinary URL format'
      });
    }

    const publicIdWithExtension = urlParts.slice(versionIndex + 1).join('/');
    const publicId = publicIdWithExtension.replace(/\.[^/.]+$/, ''); // Remove file extension

    const deleteResult = await cloudinaryStorage.deleteFile(publicId);

    if (!deleteResult.success) {
      return res.status(500).json({
        success: false,
        error: deleteResult.error || 'Failed to delete image'
      });
    }

    res.json({
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (error) {
    console.error('Portfolio image delete error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete image'
    });
  }
});

// Like/Unlike work (authenticated)
router.post('/works/:workId/like', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { workId } = req.params;
    const userId = req.user!.id;

    // Check if work exists and is public
    const work = await db
      .select()
      .from(works)
      .where(eq(works.id, workId))
      .limit(1);

    if (!work.length) {
      return res.status(404).json({
        success: false,
        error: 'Work not found'
      });
    }

    // Check if user already liked this work
    const existingLike = await db
      .select()
      .from(workLikes)
      .where(and(
        eq(workLikes.workId, workId),
        eq(workLikes.userId, userId)
      ))
      .limit(1);

    if (existingLike.length > 0) {
      // Unlike - remove the like
      await db
        .delete(workLikes)
        .where(and(
          eq(workLikes.workId, workId),
          eq(workLikes.userId, userId)
        ));

      // Decrement likes count
      await db
        .update(works)
        .set({
          likesCount: sql`${works.likesCount} - 1`
        })
        .where(eq(works.id, workId));

      res.json({
        success: true,
        liked: false,
        message: 'Work unliked successfully'
      });
    } else {
      // Like - add the like
      await db
        .insert(workLikes)
        .values({
          workId: workId,
          userId: userId
        });

      // Increment likes count
      await db
        .update(works)
        .set({
          likesCount: sql`${works.likesCount} + 1`
        })
        .where(eq(works.id, workId));

      // Create notification for work owner (don't notify yourself)
      if (work[0].userId !== userId) {
        try {
          const userProfile = await db
            .select({
              name: profiles.name,
              displayName: profiles.displayName,
            })
            .from(profiles)
            .where(eq(profiles.userId, userId))
            .limit(1);

          const likerName = userProfile[0]?.displayName || userProfile[0]?.name || 'Someone';

          await db.insert(notifications).values({
            userId: work[0].userId,
            title: `${likerName} liked your work`,
            message: `${likerName} liked your work "${work[0].title}"`,
            type: 'like',
            actionUrl: `/portfolio/works/${workId}`,
            metadata: {
              workId,
              likerId: userId,
              type: 'like'
            }
          });

          // Send push notification to mobile app
          pushNotifications.notifyPortfolioLike(
            work[0].userId,
            likerName,
            work[0].title,
            workId
          ).catch(err => console.log('Push notification failed:', err));
        } catch (notificationError) {
          console.error('Failed to create like notification:', notificationError);
          // Don't fail the like operation if notification fails
        }
      }

      res.json({
        success: true,
        liked: true,
        message: 'Work liked successfully'
      });
    }
  } catch (error) {
    console.error('Work like/unlike error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle like status'
    });
  }
});

// Track work view (authenticated or guest)
router.post('/works/:workId/view', async (req, res) => {
  try {
    const { workId } = req.params;
    const { sessionId } = req.body;
    
    // Check if work exists
    const [work] = await db
      .select()
      .from(works)
      .where(eq(works.id, workId))
      .limit(1);

    if (!work) {
      return res.status(404).json({
        success: false,
        error: 'Work not found'
      });
    }

    // Get today's date in YYYY-MM-DD format for deduplication
    const viewDate = new Date().toISOString().split('T')[0];
    
    // Get IP address from request (with proxy support)
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() 
      || req.headers['x-real-ip'] as string
      || req.socket.remoteAddress 
      || 'unknown';
    
    // Hash the IP for privacy
    const ipHash = crypto.createHash('sha256').update(ip).digest('hex').substring(0, 64);
    
    // Get user ID if authenticated (from session or auth header)
    const userId = (req as any).user?.id || null;
    
    // Ensure we have a valid identifier for deduplication
    // Use sessionId if provided, otherwise use ipHash as fallback
    const effectiveSessionId = sessionId || ipHash;
    
    // Check if this view was already recorded today
    const existingView = await db
      .select()
      .from(workViews)
      .where(
        and(
          eq(workViews.workId, workId),
          eq(workViews.viewDate, viewDate),
          userId 
            ? eq(workViews.userId, userId)
            : eq(workViews.sessionId, effectiveSessionId)
        )
      )
      .limit(1);
    
    if (existingView.length > 0) {
      return res.json({
        success: true,
        message: 'View already recorded for today'
      });
    }
    
    // Insert new view record
    try {
      await db.insert(workViews).values({
        workId,
        userId,
        sessionId: effectiveSessionId,
        ipHash,
        viewDate
      });
      
      // Successfully tracked new view
      res.json({
        success: true,
        message: 'View recorded successfully'
      });
    } catch (insertError: any) {
      // If error is due to unique constraint violation, it's okay (race condition)
      if (insertError.code === '23505') { // PostgreSQL unique violation error code
        res.json({
          success: true,
          message: 'View already recorded for today'
        });
      } else {
        // Re-throw unexpected errors
        throw insertError;
      }
    }
  } catch (error) {
    console.error('Work view tracking error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record view'
    });
  }
});

// Get like status for multiple works (authenticated)
router.post('/works/like-status', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { workIds } = req.body;
    const userId = req.user!.id;

    if (!Array.isArray(workIds) || workIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'workIds must be a non-empty array'
      });
    }

    // Get liked status for all works
    const likedWorks = await db
      .select({
        workId: workLikes.workId
      })
      .from(workLikes)
      .where(and(
        inArray(workLikes.workId, workIds),
        eq(workLikes.userId, userId)
      ));

    const likedWorkIds = new Set(likedWorks.map(like => like.workId));
    const likeStatus = workIds.reduce((acc, workId) => {
      acc[workId] = likedWorkIds.has(workId);
      return acc;
    }, {} as Record<string, boolean>);

    res.json({
      success: true,
      data: likeStatus
    });
  } catch (error) {
    console.error('Work like status fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch like status'
    });
  }
});

// ============================================
// COMMENT ROUTES
// ============================================

// Get comments for a work (public - no auth required)
router.get('/works/:workId/comments', async (req, res) => {
  try {
    const { workId } = req.params;

    // Get all top-level comments (no parent) with user info
    const topLevelComments = await db
      .select({
        id: workComments.id,
        workId: workComments.workId,
        userId: workComments.userId,
        content: workComments.content,
        parentId: workComments.parentId,
        createdAt: workComments.createdAt,
        updatedAt: workComments.updatedAt,
        user: {
          id: profiles.userId,
          name: profiles.name,
          displayName: profiles.displayName,
          avatarUrl: profiles.avatarUrl,
          verificationBadge: profiles.verificationBadge,
        }
      })
      .from(workComments)
      .leftJoin(profiles, eq(workComments.userId, profiles.userId))
      .where(and(
        eq(workComments.workId, workId),
        isNull(workComments.parentId)
      ))
      .orderBy(asc(workComments.createdAt));

    // Get all replies for this work
    const allReplies = await db
      .select({
        id: workComments.id,
        workId: workComments.workId,
        userId: workComments.userId,
        content: workComments.content,
        parentId: workComments.parentId,
        createdAt: workComments.createdAt,
        updatedAt: workComments.updatedAt,
        user: {
          id: profiles.userId,
          name: profiles.name,
          displayName: profiles.displayName,
          avatarUrl: profiles.avatarUrl,
          verificationBadge: profiles.verificationBadge,
        }
      })
      .from(workComments)
      .leftJoin(profiles, eq(workComments.userId, profiles.userId))
      .where(and(
        eq(workComments.workId, workId),
        sql`${workComments.parentId} IS NOT NULL`
      ))
      .orderBy(asc(workComments.createdAt));

    // Get boost comments for this work
    const boostComments = await db
      .select({
        id: showcaseProjectBoostComments.id,
        displayName: showcaseProjectBoostComments.displayName,
        avatarUrl: showcaseProjectBoostComments.avatarUrl,
        content: showcaseProjectBoostComments.content,
        createdAt: showcaseProjectBoostComments.createdAt,
      })
      .from(showcaseProjectBoostComments)
      .where(eq(showcaseProjectBoostComments.showcaseProjectId, workId))
      .orderBy(asc(showcaseProjectBoostComments.createdAt));

    // Normalize boost comments to match the regular comment structure
    const normalizedBoostComments = boostComments.map(boost => ({
      id: boost.id,
      workId: workId,
      userId: null, // Boost comments have no real user
      content: boost.content,
      parentId: null, // Boost comments are always top-level
      createdAt: boost.createdAt,
      updatedAt: boost.createdAt,
      user: {
        id: null,
        name: boost.displayName,
        displayName: boost.displayName,
        avatarUrl: boost.avatarUrl,
        verificationBadge: 'none' as const,
      },
      replies: [] // Boost comments don't have replies
    }));

    // Group replies by parent ID
    const repliesByParent = new Map<string, any[]>();
    allReplies.forEach(reply => {
      if (reply.parentId) {
        if (!repliesByParent.has(reply.parentId)) {
          repliesByParent.set(reply.parentId, []);
        }
        repliesByParent.get(reply.parentId)!.push(reply);
      }
    });

    // Attach replies to top-level regular comments
    const regularCommentsWithReplies = topLevelComments.map(comment => ({
      ...comment,
      replies: repliesByParent.get(comment.id) || []
    }));

    // Merge regular comments and boost comments, then sort by createdAt (newest first)
    const allComments = [...regularCommentsWithReplies, ...normalizedBoostComments]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({
      success: true,
      data: allComments
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch comments'
    });
  }
});

// Create a comment or reply (authenticated)
router.post('/works/:workId/comments', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { workId } = req.params;
    const { content, parentId } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Comment content is required'
      });
    }

    // Verify work exists
    const work = await db
      .select()
      .from(works)
      .where(eq(works.id, workId))
      .limit(1);

    if (!work.length) {
      return res.status(404).json({
        success: false,
        error: 'Work not found'
      });
    }

    // If parentId is provided, verify parent comment exists
    if (parentId) {
      const parentComment = await db
        .select()
        .from(workComments)
        .where(and(
          eq(workComments.id, parentId),
          eq(workComments.workId, workId)
        ))
        .limit(1);

      if (!parentComment.length) {
        return res.status(404).json({
          success: false,
          error: 'Parent comment not found'
        });
      }
    }

    // Create the comment
    const [newComment] = await db
      .insert(workComments)
      .values({
        workId,
        userId: req.user!.id,
        content: content.trim(),
        parentId: parentId || null
      })
      .returning();

    // Increment comments count on the work
    await db
      .update(works)
      .set({
        commentsCount: sql`${works.commentsCount} + 1`
      })
      .where(eq(works.id, workId));

    // Get user info for the response
    const userProfile = await db
      .select({
        id: profiles.userId,
        name: profiles.name,
        displayName: profiles.displayName,
        avatarUrl: profiles.avatarUrl,
        verificationBadge: profiles.verificationBadge,
      })
      .from(profiles)
      .where(eq(profiles.userId, req.user!.id))
      .limit(1);

    // Create notifications for comment/reply/mentions
    try {
      let parentCommentAuthorId = null;
      if (parentId) {
        const parentComment = await db
          .select({ userId: workComments.userId })
          .from(workComments)
          .where(eq(workComments.id, parentId))
          .limit(1);
        
        if (parentComment.length > 0) {
          parentCommentAuthorId = parentComment[0].userId;
        }
      }

      const commentAuthorName = userProfile[0]?.displayName || userProfile[0]?.name || 'Someone';

      await createCommentNotifications({
        workId,
        workOwnerId: work[0].userId,
        commentAuthorId: req.user!.id,
        commentAuthorName,
        commentId: newComment.id,
        content: content.trim(),
        workTitle: work[0].title,
        parentCommentId: parentId || null,
        parentCommentAuthorId
      });
    } catch (notificationError) {
      console.error('Failed to create notifications:', notificationError);
      // Don't fail the comment creation if notifications fail
    }

    res.json({
      success: true,
      data: {
        ...newComment,
        user: userProfile[0] || null,
        replies: []
      }
    });
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create comment'
    });
  }
});

// Delete a comment (authenticated, owner only)
router.delete('/works/:workId/comments/:commentId', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { workId, commentId } = req.params;

    // Find the comment
    const comment = await db
      .select()
      .from(workComments)
      .where(and(
        eq(workComments.id, commentId),
        eq(workComments.workId, workId)
      ))
      .limit(1);

    if (!comment.length) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found'
      });
    }

    // Check if user owns the comment
    if (comment[0].userId !== req.user!.id) {
      return res.status(403).json({
        success: false,
        error: 'You can only delete your own comments'
      });
    }

    // Count replies to determine total comments to delete
    const replies = await db
      .select()
      .from(workComments)
      .where(eq(workComments.parentId, commentId));

    const totalToDelete = 1 + replies.length;

    // Delete the comment (replies will cascade delete)
    await db
      .delete(workComments)
      .where(eq(workComments.id, commentId));

    // Decrement comments count
    await db
      .update(works)
      .set({
        commentsCount: sql`GREATEST(0, ${works.commentsCount} - ${totalToDelete})`
      })
      .where(eq(works.id, workId));

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete comment'
    });
  }
});

export default router;