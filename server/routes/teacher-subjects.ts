import { Router } from 'express';
import { db } from '../db.js';
import { teacherSubjects, subjects, users, profiles, teacherAvailability, subjectCategories } from '@shared/schema';
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
    
    // Authorization check: only allow the teacher themselves or admins
    const requestUserId = req.user?.id;
    const userRole = req.user?.role;
    
    if (requestUserId !== teacherId && userRole !== 'admin') {
      return res.status(403).json({ success: false, error: 'You can only update your own subjects' });
    }
    
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

// Get teachers by subject (for student discovery) - only teachers with availability in that subject
router.get('/api/teachers/by-subject/:subjectId', async (req, res) => {
  try {
    const { subjectId } = req.params;
    
    // Get teachers who teach this subject and have availability for it
    const teachersForSubject = await db
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
      .innerJoin(teacherAvailability, and(
        eq(teacherAvailability.teacherId, teacherSubjects.teacherId),
        eq(teacherAvailability.subjectId, subjectId),
        eq(teacherAvailability.isActive, true)
      ))
      .where(eq(teacherSubjects.subjectId, subjectId));
    
    // For each teacher, get ALL subjects they teach (their specializations)
    const teacherIds = teachersForSubject.map(t => t.teacherId);
    
    let allTeacherSubjects: any[] = [];
    if (teacherIds.length > 0) {
      allTeacherSubjects = await db
        .select({
          teacherId: teacherSubjects.teacherId,
          subjectName: subjects.name,
          gradeSystem: subjects.gradeSystem,
          gradeLevel: subjects.gradeLevel,
          isPrimary: teacherSubjects.isPrimary,
        })
        .from(teacherSubjects)
        .innerJoin(subjects, eq(teacherSubjects.subjectId, subjects.id))
        .where(inArray(teacherSubjects.teacherId, teacherIds));
    }
    
    // Group subjects by teacher
    const subjectsByTeacher = allTeacherSubjects.reduce((acc: any, curr) => {
      if (!acc[curr.teacherId]) acc[curr.teacherId] = [];
      acc[curr.teacherId].push({
        name: curr.subjectName,
        gradeSystem: curr.gradeSystem,
        gradeLevel: curr.gradeLevel,
        isPrimary: curr.isPrimary,
      });
      return acc;
    }, {});
    
    // Add subjects array to each teacher
    const result = teachersForSubject.map(teacher => ({
      ...teacher,
      specializations: subjectsByTeacher[teacher.teacherId] || [],
    }));
    
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

// Get teacher's categories
router.get('/api/teacher/:teacherId/categories', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { teacherId } = req.params;
    
    // Get distinct categories for this teacher from availability
    const teacherCats = await db
      .select({
        id: subjectCategories.id,
        name: subjectCategories.name,
      })
      .from(teacherAvailability)
      .innerJoin(subjectCategories, eq(teacherAvailability.categoryId, subjectCategories.id))
      .where(eq(teacherAvailability.teacherId, teacherId));
    
    // Get specialization from profile
    const profile = await db
      .select({ specialization: profiles.experience })
      .from(profiles)
      .where(eq(profiles.userId, teacherId));
    
    res.json({ 
      success: true, 
      categories: teacherCats,
      specialization: profile[0]?.specialization || ''
    });
  } catch (error: any) {
    console.error('Error fetching teacher categories:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch teacher categories' });
  }
});

// Update teacher's categories
router.post('/api/teacher/:teacherId/categories', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { teacherId } = req.params;
    const { categoryIds, specialization } = req.body;
    
    // Authorization check
    if (req.user?.id !== teacherId && req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }
    
    // Delete existing categories
    await db.delete(teacherAvailability).where(eq(teacherAvailability.teacherId, teacherId));
    
    // Insert new categories with default availability
    if (Array.isArray(categoryIds) && categoryIds.length > 0) {
      const values = categoryIds.map(categoryId => ({
        teacherId,
        categoryId,
        dayOfWeek: 0, // Default value
        startTime: '09:00',
        endTime: '17:00',
        isActive: true,
      }));
      
      await db.insert(teacherAvailability).values(values);
    }
    
    // Update specialization in profile
    if (specialization) {
      await db.update(profiles)
        .set({ experience: specialization })
        .where(eq(profiles.userId, teacherId));
    }
    
    res.json({ success: true, message: 'Categories updated successfully' });
  } catch (error: any) {
    console.error('Error updating teacher categories:', error);
    res.status(500).json({ success: false, error: 'Failed to update categories' });
  }
});

// Get teaching categories (31 core categories)
router.get('/api/categories/teaching', async (req, res) => {
  try {
    const categories = await db
      .select({
        id: subjectCategories.id,
        name: subjectCategories.name,
      })
      .from(subjectCategories)
      .where(eq(subjectCategories.isActive, true))
      .orderBy(subjectCategories.name);
    
    res.json({ success: true, categories });
  } catch (error: any) {
    console.error('Error fetching teaching categories:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch categories' });
  }
});

// Get core subjects (main list for dropdowns - ~15 subjects)
// PUBLIC
router.get('/api/subjects/core', async (req, res) => {
  try {
    const coreSubjects = await db
      .select({
        id: subjects.id,
        name: subjects.name,
        gradeSystem: subjects.gradeSystem,
        gradeLevel: subjects.gradeLevel,
      })
      .from(subjects)
      .where(and(
        eq(subjects.isActive, true),
        // Filter out messy/incomplete subjects
      ))
      .orderBy(subjects.name)
      .limit(15);
    
    res.json({ success: true, subjects: coreSubjects });
  } catch (error: any) {
    console.error('Error fetching core subjects:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch subjects' });
  }
});

// Get teachers by category
router.get('/api/teachers/by-category/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;
    
    const teachers = await db
      .select({
        id: profiles.userId,
        name: profiles.name,
        avatarUrl: profiles.avatarUrl,
        bio: profiles.bio,
        hourlyRate: profiles.hourlyRate,
      })
      .from(teacherAvailability)
      .innerJoin(profiles, eq(teacherAvailability.teacherId, profiles.userId))
      .where(and(
        eq(teacherAvailability.categoryId, categoryId),
        eq(teacherAvailability.isActive, true)
      ))
      .groupBy(profiles.userId, profiles.name, profiles.avatarUrl, profiles.bio, profiles.hourlyRate);
    
    res.json({ success: true, teachers });
  } catch (error: any) {
    console.error('Error fetching teachers by category:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch teachers' });
  }
});

export default router;
