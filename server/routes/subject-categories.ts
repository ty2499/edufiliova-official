import { Router } from 'express';
import { db } from '../db.js';
import { subjectCategories } from '@shared/schema';
import { eq } from 'drizzle-orm';

const router = Router();

// PUBLIC endpoint - no auth needed
router.get('/api/subject-categories', async (req, res) => {
  try {
    const cats = await db
      .select()
      .from(subjectCategories)
      .where(eq(subjectCategories.isActive, true))
      .orderBy(subjectCategories.name);
    
    res.json({ success: true, categories: cats });
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch categories' });
  }
});

export default router;
