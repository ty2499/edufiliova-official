import { Router } from "express";
import { db } from "../db";
import { courses, modules, lessons, quizzes, lessonMedia, courseEnrollments, userLoginSessions } from "../../shared/schema";
import { eq, and, gt, asc } from "drizzle-orm";

const router = Router();

// Get course detail by ID with optional authentication
router.get('/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;

    // Optional authentication check - get user if authenticated
    let user = null;
    let isEnrolled = false;
    
    const authHeader = req.headers.authorization;
    const sessionId = authHeader?.replace('Bearer ', '') || 
                     req.headers['x-session-id'] as string ||
                     req.cookies?.sessionId ||
                     req.cookies?.session ||
                     req.cookies?.auth_session;

    if (sessionId) {
      try {
        const session = await db
          .select({ userId: userLoginSessions.userId })
          .from(userLoginSessions)
          .where(and(
            eq(userLoginSessions.sessionId, sessionId),
            gt(userLoginSessions.expiresAt, new Date())
          ))
          .limit(1);

        if (session.length > 0) {
          user = { id: session[0].userId };
          
          // Check if user is enrolled in this course
          const enrollment = await db
            .select()
            .from(courseEnrollments)
            .where(and(
              eq(courseEnrollments.courseId, courseId),
              eq(courseEnrollments.userId, session[0].userId)
            ))
            .limit(1);
          
          isEnrolled = enrollment.length > 0;
        }
      } catch (authError) {
        console.log('Auth check failed, continuing as public:', authError);
        // Continue as unauthenticated user
      }
    }

    const course = await db
      .select()
      .from(courses)
      .where(eq(courses.id, courseId))
      .limit(1);

    if (course.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }

    // Always get basic modules for course structure (titles only for non-enrolled)
    const courseModules = await db
      .select()
      .from(modules)
      .where(eq(modules.courseId, courseId))
      .orderBy(asc(modules.orderNum));

    // Get lessons for each module - limit content based on enrollment
    const modulesWithLessons = await Promise.all(
      courseModules.map(async (module) => {
        const moduleLessons = await db
          .select()
          .from(lessons)
          .where(eq(lessons.moduleId, module.id))
          .orderBy(asc(lessons.orderNum));

        let lessonsWithContent;
        
        if (isEnrolled) {
          // Full access for enrolled users - include quizzes and media
          lessonsWithContent = await Promise.all(
            moduleLessons.map(async (lesson) => {
              const lessonQuizzes = await db
                .select()
                .from(quizzes)
                .where(eq(quizzes.lessonId, lesson.id))
                .orderBy(asc(quizzes.order));

              const lessonFiles = await db
                .select()
                .from(lessonMedia)
                .where(eq(lessonMedia.lessonId, lesson.id));

              return {
                ...lesson,
                quizzes: lessonQuizzes,
                media: lessonFiles
              };
            })
          );
        } else {
          // Limited access for non-enrolled users - only basic lesson info
          lessonsWithContent = moduleLessons.map(lesson => ({
            id: lesson.id,
            title: lesson.title,
            orderNum: lesson.orderNum,
            durationMinutes: lesson.durationMinutes,
            freePreviewFlag: lesson.freePreviewFlag,
            // Don't include content, videoUrl, quizzes, or media for non-enrolled users
            quizzes: [],
            media: []
          }));
        }

        return {
          ...module,
          lessons: lessonsWithContent
        };
      })
    );

    return res.json({
      success: true,
      course: course[0],
      modules: modulesWithLessons,
      isEnrolled,
      message: 'Course fetched successfully'
    });

  } catch (error) {
    console.error('Course fetch error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch course'
    });
  }
});

// Get course modules with lessons
router.get('/:courseId/modules', async (req, res) => {
  try {
    const { courseId } = req.params;
    
    // Optional authentication check - get user if authenticated
    let isEnrolled = false;
    
    const authHeader = req.headers.authorization;
    const sessionId = authHeader?.replace('Bearer ', '') || 
                     req.headers['x-session-id'] as string ||
                     req.cookies?.sessionId ||
                     req.cookies?.session ||
                     req.cookies?.auth_session;

    if (sessionId) {
      try {
        const session = await db
          .select({ userId: userLoginSessions.userId })
          .from(userLoginSessions)
          .where(and(
            eq(userLoginSessions.sessionId, sessionId),
            gt(userLoginSessions.expiresAt, new Date())
          ))
          .limit(1);

        if (session.length > 0) {
          // Check if user is enrolled in this course
          const enrollment = await db
            .select()
            .from(courseEnrollments)
            .where(and(
              eq(courseEnrollments.courseId, courseId),
              eq(courseEnrollments.userId, session[0].userId)
            ))
            .limit(1);
          
          isEnrolled = enrollment.length > 0;
        }
      } catch (authError) {
        console.log('Auth check failed, continuing as public:', authError);
        // Continue as unauthenticated user
      }
    }
    
    // Get modules and their lessons with proper ordering
    const moduleList = await db
      .select({
        moduleId: modules.id,
        moduleTitle: modules.title,
        moduleDescription: modules.description,
        moduleOrderIndex: modules.orderNum,
        lessonId: lessons.id,
        lessonTitle: lessons.title,
        lessonContent: lessons.content,
        lessonVideoUrl: lessons.videoUrl,
        lessonOrderIndex: lessons.orderNum,
        lessonDurationMinutes: lessons.durationMinutes,
        lessonFreePreviewFlag: lessons.freePreviewFlag
      })
      .from(modules)
      .leftJoin(lessons, eq(modules.id, lessons.moduleId))
      .where(eq(modules.courseId, courseId))
      .orderBy(modules.orderNum, lessons.orderNum);

    // Group lessons by module with access control
    const groupedModules = moduleList.reduce((acc, item) => {
      const moduleId = item.moduleId;
      if (!acc[moduleId]) {
        acc[moduleId] = {
          id: item.moduleId,
          title: item.moduleTitle,
          description: item.moduleDescription,
          orderNum: item.moduleOrderIndex,
          lessons: []
        };
      }
      if (item.lessonId) {
        if (isEnrolled) {
          // Full access for enrolled users
          acc[moduleId].lessons.push({
            id: item.lessonId,
            title: item.lessonTitle,
            content: item.lessonContent,
            videoUrl: item.lessonVideoUrl,
            orderNum: item.lessonOrderIndex,
            durationMinutes: item.lessonDurationMinutes,
            freePreviewFlag: item.lessonFreePreviewFlag || false
          });
        } else if (item.lessonFreePreviewFlag) {
          // Only show preview lessons to non-enrolled users with full content
          acc[moduleId].lessons.push({
            title: item.lessonTitle,
            id: item.lessonId,
            content: item.lessonContent,
            videoUrl: item.lessonVideoUrl,
            orderNum: item.lessonOrderIndex,
            durationMinutes: item.lessonDurationMinutes,
            freePreviewFlag: item.lessonFreePreviewFlag || false
          });
        }
      }
      return acc;
    }, {} as any);

    const modules_result = Object.values(groupedModules);
    return res.json({ modules: modules_result });
  } catch (error) {
    console.error('Error fetching course modules:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch course modules' });
  }
});

export default router;
