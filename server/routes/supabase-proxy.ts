import { Router } from 'express';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { z } from 'zod';
import { db } from '../db.js';
import { usersProgress, userSubjects, userChats } from '@shared/schema.js';
import { eq, and } from 'drizzle-orm';

const router = Router();

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<any>>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

function getCacheKey(prefix: string, userId: string, extra?: string): string {
  return extra ? `${prefix}:${userId}:${extra}` : `${prefix}:${userId}`;
}

function getFromCache<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  
  const now = Date.now();
  if (now - entry.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  
  return entry.data as T;
}

function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

function invalidateUserCache(userId: string): void {
  const keys = Array.from(cache.keys());
  
  for (const key of keys) {
    // Split key by ':' and check if userId is an exact segment match
    const segments = key.split(':');
    if (segments.includes(userId)) {
      cache.delete(key);
    }
  }
}

function verifyUserAccess(req: AuthenticatedRequest, targetUserId: string): boolean {
  if (!req.user) {
    return false;
  }
  return req.user.id === targetUserId || req.user.userId === targetUserId;
}

const updateProgressSchema = z.object({
  level: z.number().int().min(1).max(100)
});

const updateSubjectSchema = z.object({
  subject: z.string().min(1).max(100)
});

const updateChatsSchema = z.object({
  messages: z.array(z.any())
});

const saveQuizResultSchema = z.object({
  lessonId: z.string().min(1),
  score: z.number().min(0),
  totalQuestions: z.number().int().min(1),
  answers: z.array(z.number())
});

router.get('/user-progress/:userId', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { userId } = req.params;
    
    if (!verifyUserAccess(req, userId)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const cacheKey = getCacheKey('progress', userId);
    
    const cached = getFromCache(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('Cache-Control', 'private, max-age=300');
      res.setHeader('Vary', 'Authorization');
      return res.json(cached);
    }

    const progressRecords = await db
      .select()
      .from(usersProgress)
      .where(eq(usersProgress.userId, userId))
      .limit(1);

    const result = progressRecords[0] 
      ? { user_id: progressRecords[0].userId, level: progressRecords[0].level, updated_at: progressRecords[0].updatedAt.toISOString() }
      : { user_id: userId, level: 1, updated_at: new Date().toISOString() };
    
    setCache(cacheKey, result);
    
    res.setHeader('X-Cache', 'MISS');
    res.setHeader('Cache-Control', 'private, max-age=300');
    res.setHeader('Vary', 'Authorization');
    res.json(result);
  } catch (error) {
    console.error('Error fetching user progress:', error);
    res.status(500).json({ error: 'Failed to fetch user progress' });
  }
});

router.post('/user-progress/:userId', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { userId } = req.params;
    
    if (!verifyUserAccess(req, userId)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const validation = updateProgressSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: 'Invalid request body', details: validation.error });
    }
    
    const { level } = validation.data;

    const result = await db
      .insert(usersProgress)
      .values({
        userId,
        level,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: usersProgress.userId,
        set: {
          level,
          updatedAt: new Date(),
        },
      })
      .returning();

    invalidateUserCache(userId);
    res.json({ 
      user_id: result[0].userId, 
      level: result[0].level, 
      updated_at: result[0].updatedAt.toISOString() 
    });
  } catch (error) {
    console.error('Error updating user progress:', error);
    res.status(500).json({ error: 'Failed to update user progress' });
  }
});

router.get('/user-subjects/:userId', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { userId } = req.params;
    
    if (!verifyUserAccess(req, userId)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const cacheKey = getCacheKey('subjects', userId);
    
    const cached = getFromCache(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('Cache-Control', 'private, max-age=300');
      res.setHeader('Vary', 'Authorization');
      return res.json(cached);
    }

    const subjects = await db
      .select()
      .from(userSubjects)
      .where(eq(userSubjects.userId, userId));

    const result = subjects.map(s => ({
      user_id: s.userId,
      subject: s.subject,
      updated_at: s.updatedAt.toISOString()
    }));
    
    setCache(cacheKey, result);
    
    res.setHeader('X-Cache', 'MISS');
    res.setHeader('Cache-Control', 'private, max-age=300');
    res.setHeader('Vary', 'Authorization');
    res.json(result);
  } catch (error) {
    console.error('Error fetching user subjects:', error);
    res.status(500).json({ error: 'Failed to fetch user subjects' });
  }
});

router.post('/user-subjects/:userId', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { userId } = req.params;
    
    if (!verifyUserAccess(req, userId)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const validation = updateSubjectSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: 'Invalid request body', details: validation.error });
    }
    
    const { subject } = validation.data;

    const result = await db
      .insert(userSubjects)
      .values({
        userId,
        subject,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [userSubjects.userId, userSubjects.subject],
        set: {
          updatedAt: new Date(),
        },
      })
      .returning();

    invalidateUserCache(userId);
    res.json({
      user_id: result[0].userId,
      subject: result[0].subject,
      updated_at: result[0].updatedAt.toISOString()
    });
  } catch (error) {
    console.error('Error updating user subject:', error);
    res.status(500).json({ error: 'Failed to update user subject' });
  }
});

router.delete('/user-subjects/:userId/:subject', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { userId, subject } = req.params;
    
    if (!verifyUserAccess(req, userId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await db
      .delete(userSubjects)
      .where(
        and(
          eq(userSubjects.userId, userId),
          eq(userSubjects.subject, subject)
        )
      );

    invalidateUserCache(userId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error removing user subject:', error);
    res.status(500).json({ error: 'Failed to remove user subject' });
  }
});

router.get('/user-chats/:userId', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { userId } = req.params;
    
    if (!verifyUserAccess(req, userId)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const cacheKey = getCacheKey('chats', userId);
    
    const cached = getFromCache(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('Cache-Control', 'private, max-age=180');
      res.setHeader('Vary', 'Authorization');
      return res.json(cached);
    }

    const chatRecords = await db
      .select()
      .from(userChats)
      .where(eq(userChats.userId, userId))
      .limit(1);

    const result = chatRecords[0]
      ? { user_id: chatRecords[0].userId, messages: chatRecords[0].messages, updated_at: chatRecords[0].updatedAt.toISOString() }
      : { user_id: userId, messages: [], updated_at: new Date().toISOString() };
    
    setCache(cacheKey, result);
    
    res.setHeader('X-Cache', 'MISS');
    res.setHeader('Cache-Control', 'private, max-age=180');
    res.setHeader('Vary', 'Authorization');
    res.json(result);
  } catch (error) {
    console.error('Error fetching user chats:', error);
    res.status(500).json({ error: 'Failed to fetch user chats' });
  }
});

router.post('/user-chats/:userId', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { userId } = req.params;
    
    if (!verifyUserAccess(req, userId)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const validation = updateChatsSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: 'Invalid request body', details: validation.error });
    }
    
    const { messages } = validation.data;

    const result = await db
      .insert(userChats)
      .values({
        userId,
        messages,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: userChats.userId,
        set: {
          messages,
          updatedAt: new Date(),
        },
      })
      .returning();

    invalidateUserCache(userId);
    res.json({
      user_id: result[0].userId,
      messages: result[0].messages,
      updated_at: result[0].updatedAt.toISOString()
    });
  } catch (error) {
    console.error('Error updating user chats:', error);
    res.status(500).json({ error: 'Failed to update user chats' });
  }
});

router.get('/quiz-results/:userId/:subject', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { userId, subject } = req.params;
    
    if (!verifyUserAccess(req, userId)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const cacheKey = getCacheKey('quiz', userId, subject);
    
    const cached = getFromCache(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('Cache-Control', 'private, max-age=300');
      res.setHeader('Vary', 'Authorization');
      return res.json(cached);
    }

    const chatRecords = await db
      .select()
      .from(userChats)
      .where(eq(userChats.userId, userId))
      .limit(1);

    let results: any[] = [];
    if (chatRecords[0] && Array.isArray(chatRecords[0].messages)) {
      const quizMessage = (chatRecords[0].messages as any[]).find(
        (msg: any) => msg.type === 'quiz_results' && msg.subject === subject
      );
      if (quizMessage && Array.isArray(quizMessage.data)) {
        results = quizMessage.data;
      }
    }

    setCache(cacheKey, results);
    
    res.setHeader('X-Cache', 'MISS');
    res.setHeader('Cache-Control', 'private, max-age=300');
    res.setHeader('Vary', 'Authorization');
    res.json(results);
  } catch (error) {
    console.error('Error fetching quiz results:', error);
    res.status(500).json({ error: 'Failed to fetch quiz results' });
  }
});

router.post('/quiz-results/:userId/:subject', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { userId, subject } = req.params;
    
    if (!verifyUserAccess(req, userId)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const validation = saveQuizResultSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: 'Invalid request body', details: validation.error });
    }
    
    const { lessonId, score, totalQuestions, answers } = validation.data;

    const existingRecords = await db
      .select()
      .from(userChats)
      .where(eq(userChats.userId, userId))
      .limit(1);

    let existingMessages: any[] = [];
    let currentQuizResults: any[] = [];

    if (existingRecords[0] && Array.isArray(existingRecords[0].messages)) {
      existingMessages = (existingRecords[0].messages as any[]).filter(
        (msg: any) => !(msg.type === 'quiz_results' && msg.subject === subject)
      );
      
      const quizMessage = (existingRecords[0].messages as any[]).find(
        (msg: any) => msg.type === 'quiz_results' && msg.subject === subject
      );
      if (quizMessage && Array.isArray(quizMessage.data)) {
        currentQuizResults = quizMessage.data;
      }
    }

    const newResult = {
      studentId: userId,
      lessonId,
      score,
      totalQuestions,
      completedAt: new Date().toISOString(),
      answers
    };

    const updatedResults = [
      ...currentQuizResults.filter((r: any) => r.lessonId !== lessonId),
      newResult
    ];

    const newMessages = [
      ...existingMessages,
      { type: 'quiz_results', subject, data: updatedResults }
    ];

    await db
      .insert(userChats)
      .values({
        userId,
        messages: newMessages,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: userChats.userId,
        set: {
          messages: newMessages,
          updatedAt: new Date(),
        },
      });

    invalidateUserCache(userId);
    res.json({ success: true, result: newResult });
  } catch (error) {
    console.error('Error saving quiz result:', error);
    res.status(500).json({ error: 'Failed to save quiz result' });
  }
});

export default router;
