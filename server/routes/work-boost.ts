import { Router } from 'express';
import { z } from 'zod';
import { storage } from '../storage';

const router = Router();

const addLikesSchema = z.object({
  workId: z.string().min(1, 'Work ID is required'),
  count: z.number().int().positive('Count must be a positive integer')
});

router.post('/add-likes', async (req, res) => {
  try {
    const validationResult = addLikesSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Invalid request data',
        details: validationResult.error.issues 
      });
    }

    const { workId, count } = validationResult.data;
    const result = await storage.addWorkBoostLikes(workId, count);
    res.json(result);
  } catch (error: any) {
    console.error('Error adding work boost likes:', error);
    res.status(500).json({ error: error.message });
  }
});

const statsParamsSchema = z.object({
  workId: z.string().min(1, 'Work ID is required')
});

router.get('/stats/:workId', async (req, res) => {
  try {
    const validationResult = statsParamsSchema.safeParse(req.params);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Invalid work ID',
        details: validationResult.error.issues 
      });
    }

    const { workId } = validationResult.data;
    const stats = await storage.getWorkBoostStats(workId);

    res.json(stats);
  } catch (error: any) {
    console.error('Error getting work boost stats:', error);
    res.status(500).json({ error: error.message });
  }
});

const projectsParamsSchema = z.object({
  freelancerId: z.string().min(1, 'Freelancer ID is required')
});

router.get('/projects/:freelancerId', async (req, res) => {
  try {
    const validationResult = projectsParamsSchema.safeParse(req.params);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Invalid freelancer ID',
        details: validationResult.error.issues 
      });
    }

    const { freelancerId } = validationResult.data;
    const projects = await storage.getShowcaseProjects(freelancerId);

    res.json(projects);
  } catch (error: any) {
    console.error('Error getting showcase projects:', error);
    res.status(500).json({ error: error.message });
  }
});

const addCommentsSchema = z.object({
  showcaseProjectId: z.string().min(1, 'Showcase project ID is required'),
  count: z.number().int().positive('Count must be a positive integer').max(100, 'Maximum 100 comments per request')
});

router.post('/add-comments', async (req, res) => {
  try {
    const validationResult = addCommentsSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Invalid request data',
        details: validationResult.error.issues 
      });
    }

    const { showcaseProjectId, count } = validationResult.data;
    const result = await storage.addShowcaseProjectBoostComments(showcaseProjectId, count);
    res.json(result);
  } catch (error: any) {
    console.error('Error adding work boost comments:', error);
    res.status(500).json({ error: error.message });
  }
});

const commentStatsParamsSchema = z.object({
  showcaseProjectId: z.string().min(1, 'Showcase project ID is required')
});

router.get('/comment-stats/:showcaseProjectId', async (req, res) => {
  try {
    const validationResult = commentStatsParamsSchema.safeParse(req.params);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Invalid showcase project ID',
        details: validationResult.error.issues 
      });
    }

    const { showcaseProjectId } = validationResult.data;
    const boostComments = await storage.getShowcaseProjectBoostCommentsCount(showcaseProjectId);

    res.json({
      boostComments
    });
  } catch (error: any) {
    console.error('Error getting work boost comment stats:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
