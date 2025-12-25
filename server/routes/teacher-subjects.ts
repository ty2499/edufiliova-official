import { Router } from 'express';
import { db } from '../db.js';
import { teacherSubjects, subjects, users, profiles } from '@shared/schema';
import { eq, and, inArray, sql } from 'drizzle-orm';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// Get teacher's subjects
router.get('/api/teacher/:teacherId/subjects', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { teacherId } = req.params;
    
    const result = await db
      .select({
        id: teacherSubjects.id,
        subjectId: teacherSubjects.subjectId,
        isPrimary: teacherSubjects.isPrimary,
        experienceYears: teacherSubjects.experienceYears,
        subjectName: subjects.name,
        gradeSystem: subjects.gradeSystem,
        gradeLevel: subjects.gradeLevel,
      })
      .from(teacherSubjects)
      .innerJoin(subjects, eq(teacherSubjects.subjectId, subjects.id))
      .where(eq(teacherSubjects.teacherId, teacherId));
    
    res.json({ success: true, subjects: result });
  } catch (error: any) {
    console.error('Error fetching teacher subjects:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch teacher subjects' });
  }
});

// Update teacher's subjects (add/remove)
router.post('/api/teacher/:teacherId/subjects', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { teacherId } = req.params;
    const { subjectIds } = req.body;
    
    if (!Array.isArray(subjectIds)) {
      return res.status(400).json({ success: false, error: 'subjectIds must be an array' });
    }
    
    // Delete existing subjects for this teacher
    await db.delete(teacherSubjects).where(eq(teacherSubjects.teacherId, teacherId));
    
    // Insert new subjects
    if (subjectIds.length > 0) {
      const insertData = subjectIds.map((subjectId: string, index: number) => ({
        teacherId,
        subjectId,
        isPrimary: index === 0, // First subject is primary
      }));
      
      await db.insert(teacherSubjects).values(insertData);
    }
    
    res.json({ success: true, message: 'Subjects updated successfully' });
  } catch (error: any) {
    console.error('Error updating teacher subjects:', error);
    res.status(500).json({ success: false, error: 'Failed to update teacher subjects' });
  }
});

// Get all available subjects for teacher selection
router.get('/api/subjects/available', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const result = await db
      .select({
        id: subjects.id,
        name: subjects.name,
        gradeSystem: subjects.gradeSystem,
        gradeLevel: subjects.gradeLevel,
        description: subjects.description,
      })
      .from(subjects)
      .where(eq(subjects.isActive, true));
    
    res.json({ success: true, subjects: result });
  } catch (error: any) {
    console.error('Error fetching available subjects:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch subjects' });
  }
});

// Get teachers by subject (for student discovery)
router.get('/api/teachers/by-subject/:subjectId', async (req, res) => {
  try {
    const { subjectId } = req.params;
    
    const result = await db
      .select({
        teacherId: teacherSubjects.teacherId,
        isPrimary: teacherSubjects.isPrimary,
        experienceYears: teacherSubjects.experienceYears,
        name: profiles.name,
        avatarUrl: profiles.avatarUrl,
        bio: profiles.bio,
        hourlyRate: profiles.hourlyRate,
        qualifications: profiles.qualifications,
        experience: profiles.experience,
      })
      .from(teacherSubjects)
      .innerJoin(profiles, eq(teacherSubjects.teacherId, profiles.userId))
      .where(eq(teacherSubjects.subjectId, subjectId));
    
    res.json({ success: true, teachers: result });
  } catch (error: any) {
    console.error('Error fetching teachers by subject:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch teachers' });
  }
});

// Get subjects that have teachers (for student discovery categories)
router.get('/api/subjects/with-teachers', async (req, res) => {
  try {
    const result = await db
      .select({
        id: subjects.id,
        name: subjects.name,
        gradeSystem: subjects.gradeSystem,
        gradeLevel: subjects.gradeLevel,
        description: subjects.description,
        teacherCount: sql<number>`COUNT(DISTINCT ${teacherSubjects.teacherId})::int`,
      })
      .from(subjects)
      .leftJoin(teacherSubjects, eq(subjects.id, teacherSubjects.subjectId))
      .where(eq(subjects.isActive, true))
      .groupBy(subjects.id)
      .having(sql`COUNT(DISTINCT ${teacherSubjects.teacherId}) > 0`);
    
    res.json({ success: true, subjects: result });
  } catch (error: any) {
    console.error('Error fetching subjects with teachers:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch subjects' });
  }
});

export default router;
