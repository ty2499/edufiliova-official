import { Router, Request, Response } from "express";
import { db } from "../db";
import { courses, courseEnrollments, coursePurchases, profiles, studentProgress, lessons } from "../../shared/schema";
import { eq, and, desc, gt, lt, sql, count } from "drizzle-orm";
import { requireAuth, requireAdmin, type AuthenticatedRequest } from "../middleware/auth";
import { storage } from "../storage";

const router = Router();

router.get("/api/courses", async (req, res) => {
  try {
    const { difficulty, category } = req.query;
    
    let conditions = [eq(courses.isActive, true), eq(courses.approvalStatus, "approved")];
    
    if (difficulty) {
      conditions.push(eq(courses.difficulty, difficulty as string));
    }
    
    if (category) {
      conditions.push(eq(courses.categoryId, category as string));
    }
    
    const coursesData = await db
      .select()
      .from(courses)
      .where(and(...conditions))
      .orderBy(courses.title);
    
    res.json({ success: true, data: coursesData, totalCount: coursesData.length });
  } catch (error: any) {
    console.error('Courses fetch error:', error);
    res.status(500).json({ success: false, error: "Failed to fetch courses" });
  }
});

router.get("/api/courses/featured", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 8;
    const featuredCourses = await storage.getFeaturedCourses(limit);
    
    res.json({ success: true, data: featuredCourses });
  } catch (error: any) {
    console.error('Featured courses fetch error:', error);
    res.status(500).json({ success: false, error: "Failed to fetch featured courses" });
  }
});

router.patch("/api/courses/:id/feature", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { isFeatured } = req.body;

    if (typeof isFeatured !== 'boolean') {
      return res.status(400).json({ success: false, error: "isFeatured must be a boolean" });
    }

    const updatedCourse = await storage.setCourseFeatured(id, isFeatured);

    if (!updatedCourse) {
      return res.status(404).json({ success: false, error: "Course not found" });
    }

    res.json({ success: true, data: updatedCourse });
  } catch (error: any) {
    console.error('Course feature update error:', error);
    res.status(500).json({ success: false, error: "Failed to update course featured status" });
  }
});

router.get("/api/courses/:courseId/lessons", async (req, res) => {
  try {
    const { courseId } = req.params;
    
    const { Client } = await import('pg');
    const client = new Client({
      connectionString: process.env.DATABASE_URL
    });
    
    await client.connect();
    
    const result = await client.query(`
      SELECT id, title, description, course_id, level as "chapterNumber", level as "lessonNumber", 
             content, duration_minutes as duration, 'text' as "contentType", "order" as "orderIndex",
             free_preview_flag as "isPublished"
      FROM lessons 
      WHERE course_id = $1 AND free_preview_flag = true
      ORDER BY "order"
    `, [courseId]);
    
    await client.end();
    
    res.json({ success: true, data: result.rows, totalCount: result.rows.length });
  } catch (error: any) {
    console.error('Course lessons fetch error:', error);
    res.status(500).json({ success: false, error: "Failed to fetch course lessons" });
  }
});

router.get("/api/courses/enrolled/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const enrolledCourses = await db
      .select({
        id: courses.id,
        title: courses.title,
        description: courses.description,
        courseCode: courses.courseCode,
        credits: courses.credits,
        duration: courses.duration,
        thumbnailUrl: courses.thumbnailUrl,
        progress: courseEnrollments.progress,
        instructor: sql`'Dr. Smith'`.as('instructor')
      })
      .from(courseEnrollments)
      .innerJoin(courses, eq(courseEnrollments.courseId, courses.id))
      .where(
        and(
          eq(courseEnrollments.userId, userId),
          eq(courseEnrollments.isActive, true)
        )
      )
      .orderBy(desc(courseEnrollments.enrolledAt));

    res.json({ success: true, data: enrolledCourses });
  } catch (error: any) {
    console.error('Enrolled courses fetch error:', error);
    res.status(500).json({ success: false, error: "Failed to fetch enrolled courses" });
  }
});

router.post("/api/courses/purchase-with-wallet", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { courseId, amount, couponCode } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: "Authentication required" });
    }

    if (!courseId) {
      return res.status(400).json({ success: false, error: "Course ID is required" });
    }
    
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(courseId)) {
      return res.status(400).json({ 
        success: false, 
        error: `Invalid course ID format. Please select a valid course to purchase.`
      });
    }
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, error: "Invalid amount" });
    }

    const customer = await storage.getShopCustomerByUserId(userId);
    if (!customer) {
      return res.status(400).json({ success: false, error: "Customer account not found" });
    }

    const walletBalance = parseFloat(customer.walletBalance || '0');
    if (walletBalance < amount) {
      return res.status(400).json({ 
        success: false,
        error: "Insufficient wallet balance",
        required: amount,
        available: walletBalance
      });
    }

    const existingEnrollment = await db
      .select()
      .from(courseEnrollments)
      .where(and(
        eq(courseEnrollments.userId, userId),
        eq(courseEnrollments.courseId, courseId)
      ))
      .limit(1);

    if (existingEnrollment.length > 0) {
      return res.status(400).json({ 
        success: false, 
        error: "You are already enrolled in this course" 
      });
    }

    const [course] = await db
      .select()
      .from(courses)
      .where(eq(courses.id, courseId))
      .limit(1);

    if (!course) {
      return res.status(404).json({ success: false, error: "Course not found" });
    }

    await storage.updateWalletBalance(customer.id, -amount);

    const [enrollment] = await db
      .insert(courseEnrollments)
      .values({
        userId,
        courseId,
        progress: 0,
        isActive: true
      })
      .returning();

    const transactionId = `wallet-${courseId.substring(0, 8)}-${Date.now()}`;
    await db
      .insert(coursePurchases)
      .values({
        userId,
        courseId,
        amount: amount.toString(),
        currency: 'USD',
        paymentMethod: 'wallet',
        paymentStatus: 'completed',
        transactionId
      });

    console.log(`✅ Course ${courseId} purchased with wallet by user ${userId}`);

    try {
      const userProfile = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
      const courseCreatorId = (course as any).creatorId || (course as any).userId;
      const teacherProfile = courseCreatorId ? await db.select().from(profiles).where(eq(profiles.userId, courseCreatorId)).limit(1) : [];
      
      if (userProfile.length > 0 && userProfile[0].email) {
        const { sendCoursePurchaseEmail } = await import('../utils/email-templates.js') as any;
        await sendCoursePurchaseEmail(
          userProfile[0].email,
          userProfile[0].name || 'Student',
          {
            courseName: course.title,
            teacherName: teacherProfile.length > 0 ? teacherProfile[0].name : 'EduFiliova Instructor',
            orderId: transactionId,
            price: amount.toFixed(2),
            accessType: 'Lifetime Access',
            purchaseDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
          }
        );
      }
    } catch (emailError) {
      console.error('Failed to send course purchase email:', emailError);
    }

    res.json({
      success: true,
      message: "Course purchased successfully",
      enrollment,
      transactionId,
      newBalance: walletBalance - amount
    });

  } catch (error: any) {
    console.error('Course purchase with wallet error:', error);
    res.status(500).json({ success: false, error: "Failed to purchase course" });
  }
});

export default router;
