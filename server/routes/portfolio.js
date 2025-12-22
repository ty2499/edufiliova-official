import { Router } from 'express';
import { z } from 'zod';
import { storage } from '../storage.js';
import { requireAuth } from '../middleware/auth.js';
import multer from 'multer';
import { upload, validateFile } from '../upload.js';
import { 
  insertWorkSchema, 
  insertWorkMediaSchema, 
  insertWorkCommentSchema,
  insertWorkLikeSchema 
} from '../../shared/schema.js';

const router = Router();

// Validation schemas
const getWorksSchema = z.object({
  userId: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
  tags: z.string().optional().transform(val => val ? val.split(',').map(t => t.trim()) : undefined),
  search: z.string().optional(),
  visibility: z.enum(['public', 'unlisted', 'private']).optional(),
  category: z.string().optional()
});

const workIdSchema = z.object({
  id: z.string().uuid()
});

const toggleLikeSchema = z.object({
  workId: z.string().uuid()
});

const createCommentSchema = insertWorkCommentSchema;

const workUpdateSchema = insertWorkSchema.partial();

// Helper function to extract YouTube video ID from various URL formats
function extractYouTubeId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// Helper function to extract Vimeo video ID from various URL formats
function extractVimeoId(url) {
  const patterns = [
    /vimeo\.com\/(\d+)/,
    /vimeo\.com\/video\/(\d+)/,
    /player\.vimeo\.com\/video\/(\d+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// Helper function to detect video platform type
function getVideoPlatform(url) {
  if (extractYouTubeId(url)) return 'youtube';
  if (extractVimeoId(url)) return 'vimeo';
  return null;
}

// Helper function to validate YouTube URL
function isValidYouTubeUrl(url) {
  return extractYouTubeId(url) !== null;
}

// Helper function to validate Vimeo URL
function isValidVimeoUrl(url) {
  return extractVimeoId(url) !== null;
}

// Helper function to validate video URL (YouTube or Vimeo)
function isValidVideoUrl(url) {
  return isValidYouTubeUrl(url) || isValidVimeoUrl(url);
}

// GET /api/portfolio/works - Get works with filtering and pagination
router.get('/works', async (req, res) => {
  try {
    const query = getWorksSchema.parse(req.query);
    const result = await storage.getWorks(query);
    
    res.json({
      success: true,
      data: result.works,
      pagination: {
        page: query.page,
        limit: query.limit,
        total: result.total,
        pages: Math.ceil(result.total / query.limit)
      }
    });
  } catch (error) {
    console.error('Error fetching works:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid query parameters',
        details: error.errors
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to fetch works'
    });
  }
});

// GET /api/portfolio/works/:id - Get specific work with media and owner info
router.get('/works/:id', async (req, res) => {
  try {
    const { id } = workIdSchema.parse(req.params);
    
    const result = await storage.getWorkWithMedia(id);
    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Work not found'
      });
    }

    // Record view if not the owner
    if (req.user && req.user.id !== result.work.userId) {
      const sessionId = req.headers['x-session-id'] || req.sessionID;
      const ipHash = req.ip ? Buffer.from(req.ip).toString('base64') : undefined;
      
      await storage.recordWorkView(
        id, 
        req.user.id, 
        sessionId, 
        ipHash
      );
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching work:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid work ID',
        details: error.errors
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to fetch work'
    });
  }
});

// POST /api/portfolio/works - Create new work (requires auth)
router.post('/works', requireAuth, async (req, res) => {
  try {
    const workData = insertWorkSchema.omit({ 
      id: true, 
      createdAt: true, 
      updatedAt: true 
    }).parse({
      ...req.body,
      userId: req.user.id
    });

    const newWork = await storage.createWork(workData);
    
    res.status(201).json({
      success: true,
      data: newWork
    });
  } catch (error) {
    console.error('Error creating work:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid work data',
        details: error.errors
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to create work'
    });
  }
});

// PUT /api/portfolio/works/:id - Update work (requires auth and ownership)
router.put('/works/:id', requireAuth, async (req, res) => {
  try {
    const { id } = workIdSchema.parse(req.params);
    const updates = workUpdateSchema.parse(req.body);

    // Check ownership
    const existingWork = await storage.getWorkById(id);
    if (!existingWork) {
      return res.status(404).json({
        success: false,
        error: 'Work not found'
      });
    }

    if (existingWork.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this work'
      });
    }

    const updatedWork = await storage.updateWork(id, updates);
    
    res.json({
      success: true,
      data: updatedWork
    });
  } catch (error) {
    console.error('Error updating work:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid update data',
        details: error.errors
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to update work'
    });
  }
});

// DELETE /api/portfolio/works/:id - Delete work (requires auth and ownership)
router.delete('/works/:id', requireAuth, async (req, res) => {
  try {
    const { id } = workIdSchema.parse(req.params);

    // Check ownership
    const existingWork = await storage.getWorkById(id);
    if (!existingWork) {
      return res.status(404).json({
        success: false,
        error: 'Work not found'
      });
    }

    if (existingWork.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this work'
      });
    }

    const deleted = await storage.deleteWork(id);
    if (!deleted) {
      return res.status(500).json({
        success: false,
        error: 'Failed to delete work'
      });
    }
    
    res.json({
      success: true,
      message: 'Work deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting work:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid work ID',
        details: error.errors
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to delete work'
    });
  }
});

// POST /api/portfolio/works/:id/media - Add media to work (requires auth and ownership)
router.post('/works/:id/media', requireAuth, upload.array('files', 10), async (req, res) => {
  try {
    const { id } = workIdSchema.parse(req.params);
    
    // Check ownership
    const existingWork = await storage.getWorkById(id);
    if (!existingWork) {
      return res.status(404).json({
        success: false,
        error: 'Work not found'
      });
    }

    if (existingWork.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to add media to this work'
      });
    }

    const mediaItems = [];
    const files = req.files || [];
    const youtubeUrls = req.body.youtubeUrls ? JSON.parse(req.body.youtubeUrls) : [];
    const vimeoUrls = req.body.vimeoUrls ? JSON.parse(req.body.vimeoUrls) : [];
    const videoUrls = req.body.videoUrls ? JSON.parse(req.body.videoUrls) : [];

    // Process uploaded files (images, videos, GIFs)
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      let fileType = 'image';
      
      // Determine file type including GIF support
      if (file.mimetype.startsWith('video/')) {
        fileType = 'video';
      } else if (file.mimetype === 'image/gif') {
        fileType = 'image'; // GIFs are treated as images but with special handling
      } else if (file.mimetype.startsWith('image/')) {
        fileType = 'image';
      }
      
      mediaItems.push({
        workId: id,
        type: fileType,
        url: file.cloudinaryUrl,
        order: mediaItems.length
      });
    }

    // Process YouTube URLs
    for (let i = 0; i < youtubeUrls.length; i++) {
      const url = youtubeUrls[i];
      if (!isValidYouTubeUrl(url)) {
        return res.status(400).json({
          success: false,
          error: `Invalid YouTube URL: ${url}`
        });
      }

      const videoId = extractYouTubeId(url);
      mediaItems.push({
        workId: id,
        type: 'youtube',
        url: url,
        provider: 'youtube',
        providerId: videoId,
        order: mediaItems.length
      });
    }

    // Process Vimeo URLs
    for (let i = 0; i < vimeoUrls.length; i++) {
      const url = vimeoUrls[i];
      if (!isValidVimeoUrl(url)) {
        return res.status(400).json({
          success: false,
          error: `Invalid Vimeo URL: ${url}`
        });
      }

      const videoId = extractVimeoId(url);
      mediaItems.push({
        workId: id,
        type: 'vimeo',
        url: url,
        provider: 'vimeo',
        providerId: videoId,
        order: mediaItems.length
      });
    }

    // Process general video URLs (auto-detect platform)
    for (let i = 0; i < videoUrls.length; i++) {
      const url = videoUrls[i];
      const platform = getVideoPlatform(url);
      
      if (!platform) {
        return res.status(400).json({
          success: false,
          error: `Unsupported video URL: ${url}. Only YouTube and Vimeo are supported.`
        });
      }

      const videoId = platform === 'youtube' ? extractYouTubeId(url) : extractVimeoId(url);
      mediaItems.push({
        workId: id,
        type: platform,
        url: url,
        provider: platform,
        providerId: videoId,
        order: mediaItems.length
      });
    }

    if (mediaItems.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No media files or YouTube URLs provided'
      });
    }

    const createdMedia = await storage.createWorkMedia(mediaItems);
    
    res.status(201).json({
      success: true,
      data: createdMedia
    });
  } catch (error) {
    console.error('Error adding media:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.errors
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to add media'
    });
  }
});

// GET /api/portfolio/works/:id/media - Get work media
router.get('/works/:id/media', async (req, res) => {
  try {
    const { id } = workIdSchema.parse(req.params);
    
    const media = await storage.getWorkMedia(id);
    
    res.json({
      success: true,
      data: media
    });
  } catch (error) {
    console.error('Error fetching media:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid work ID',
        details: error.errors
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to fetch media'
    });
  }
});

// DELETE /api/portfolio/media/:id - Delete specific media (requires auth and ownership)
router.delete('/media/:id', requireAuth, async (req, res) => {
  try {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    
    // TODO: Add ownership check through work relationship
    const deleted = await storage.deleteWorkMedia(id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Media not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Media deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting media:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid media ID',
        details: error.errors
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to delete media'
    });
  }
});

// POST /api/portfolio/works/:id/like - Toggle like (requires auth)
router.post('/works/:id/like', requireAuth, async (req, res) => {
  try {
    const { id } = workIdSchema.parse(req.params);
    
    const result = await storage.toggleWorkLike(id, req.user.id);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error toggling like:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid work ID',
        details: error.errors
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to toggle like'
    });
  }
});

// GET /api/portfolio/works/:id/likes - Get work likes
router.get('/works/:id/likes', async (req, res) => {
  try {
    const { id } = workIdSchema.parse(req.params);
    const { limit = 50, offset = 0 } = req.query;
    
    const likes = await storage.getWorkLikes(id, { 
      limit: parseInt(limit), 
      offset: parseInt(offset) 
    });
    
    res.json({
      success: true,
      data: likes
    });
  } catch (error) {
    console.error('Error fetching likes:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid work ID',
        details: error.errors
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to fetch likes'
    });
  }
});

// GET /api/portfolio/users/:userId/liked-works - Get user's liked works
router.get('/users/:userId/liked-works', async (req, res) => {
  try {
    const { userId } = z.object({ userId: z.string() }).parse(req.params);
    const { limit = 20, offset = 0 } = req.query;
    
    const works = await storage.getUserLikedWorks(userId, { 
      limit: parseInt(limit), 
      offset: parseInt(offset) 
    });
    
    res.json({
      success: true,
      data: works
    });
  } catch (error) {
    console.error('Error fetching liked works:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID',
        details: error.errors
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to fetch liked works'
    });
  }
});

// POST /api/portfolio/works/:id/comments - Add comment (requires auth)
router.post('/works/:id/comments', requireAuth, async (req, res) => {
  try {
    const { id } = workIdSchema.parse(req.params);
    const commentData = createCommentSchema.parse({
      ...req.body,
      workId: id,
      userId: req.user.id
    });

    const newComment = await storage.createWorkComment(commentData);
    
    res.status(201).json({
      success: true,
      data: newComment
    });
  } catch (error) {
    console.error('Error creating comment:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid comment data',
        details: error.errors
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to create comment'
    });
  }
});

// GET /api/portfolio/works/:id/comments - Get work comments
router.get('/works/:id/comments', async (req, res) => {
  try {
    const { id } = workIdSchema.parse(req.params);
    const { limit = 50, offset = 0, parentId } = req.query;
    
    const comments = await storage.getWorkComments(id, { 
      limit: parseInt(limit), 
      offset: parseInt(offset),
      parentId: parentId || undefined
    });
    
    res.json({
      success: true,
      data: comments
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid work ID',
        details: error.errors
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to fetch comments'
    });
  }
});

// PUT /api/portfolio/comments/:id - Update comment (requires auth and ownership)
router.put('/comments/:id', requireAuth, async (req, res) => {
  try {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const { content } = z.object({ content: z.string().min(1) }).parse(req.body);
    
    // TODO: Add ownership check
    const updatedComment = await storage.updateWorkComment(id, { content });
    if (!updatedComment) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found'
      });
    }
    
    res.json({
      success: true,
      data: updatedComment
    });
  } catch (error) {
    console.error('Error updating comment:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.errors
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to update comment'
    });
  }
});

// DELETE /api/portfolio/comments/:id - Delete comment (requires auth and ownership)
router.delete('/comments/:id', requireAuth, async (req, res) => {
  try {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    
    // TODO: Add ownership check
    const deleted = await storage.deleteWorkComment(id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid comment ID',
        details: error.errors
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to delete comment'
    });
  }
});

// GET /api/portfolio/works/:id/views - Get work view count
router.get('/works/:id/views', async (req, res) => {
  try {
    const { id } = workIdSchema.parse(req.params);
    
    const viewCount = await storage.getWorkViews(id);
    
    res.json({
      success: true,
      data: { views: viewCount }
    });
  } catch (error) {
    console.error('Error fetching view count:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid work ID',
        details: error.errors
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to fetch view count'
    });
  }
});

// GET /api/portfolio/works/:id/analytics - Get work analytics (requires auth and ownership)
router.get('/works/:id/analytics', requireAuth, async (req, res) => {
  try {
    const { id } = workIdSchema.parse(req.params);
    const { period = 'week' } = req.query;
    
    // Check ownership
    const existingWork = await storage.getWorkById(id);
    if (!existingWork) {
      return res.status(404).json({
        success: false,
        error: 'Work not found'
      });
    }

    if (existingWork.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to view analytics for this work'
      });
    }

    const analytics = await storage.getWorkViewsAnalytics(id, period);
    
    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request parameters',
        details: error.errors
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics'
    });
  }
});

export default router;