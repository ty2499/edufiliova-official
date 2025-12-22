import { db } from '../db';
import { userActivityTracking, users, profiles } from '@shared/schema';
import { eq, sql } from 'drizzle-orm';

export type ActivityType = 
  | 'login'
  | 'lesson_activity'
  | 'course_enrollment'
  | 'course_start'
  | 'content_creation'
  | 'download'
  | 'purchase'
  | 'sale'
  | 'page_view';

export interface TrackActivityParams {
  userId: string;
  activityType: ActivityType;
  metadata?: Record<string, unknown>;
}

export class ActivityTrackerService {
  async ensureUserActivityRecord(userId: string): Promise<void> {
    const existing = await db.select({ id: userActivityTracking.id })
      .from(userActivityTracking)
      .where(eq(userActivityTracking.userId, userId as any))
      .limit(1);

    if (existing.length > 0) return;

    const userInfo = await db.select({
      user: users,
      profile: profiles,
    })
      .from(users)
      .leftJoin(profiles, eq(profiles.userId, users.id))
      .where(eq(users.id, userId as any))
      .limit(1);

    if (userInfo.length === 0) return;

    const { user, profile } = userInfo[0];
    const role = profile?.role || 'student';

    try {
      await db.insert(userActivityTracking).values({
        userId: userId as any,
        role,
        email: user.email,
        displayName: profile?.displayName || profile?.fullName || user.email.split('@')[0],
        lastSeenAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } catch (error: any) {
      if (!error.message?.includes('duplicate key')) {
        console.error('Error creating activity record:', error);
      }
    }
  }

  async trackActivity({ userId, activityType, metadata }: TrackActivityParams): Promise<void> {
    await this.ensureUserActivityRecord(userId);

    const now = new Date();
    const updates: Record<string, unknown> = {
      lastSeenAt: now,
      updatedAt: now,
    };

    switch (activityType) {
      case 'login':
        updates.lastLoginAt = now;
        break;
      case 'lesson_activity':
        updates.lastLessonActivityAt = now;
        updates.lessonsCompletedCount = sql`lessons_completed_count + 1`;
        break;
      case 'course_enrollment':
        updates.lastCourseEnrollmentAt = now;
        updates.courseEnrollmentCount = sql`course_enrollment_count + 1`;
        break;
      case 'course_start':
        updates.lastCourseStartAt = now;
        updates.coursesStartedCount = sql`courses_started_count + 1`;
        break;
      case 'content_creation':
        updates.lastContentCreationAt = now;
        updates.contentCreatedCount = sql`content_created_count + 1`;
        break;
      case 'download':
        updates.lastDownloadAt = now;
        updates.downloadsCount = sql`downloads_count + 1`;
        break;
      case 'purchase':
        updates.lastPurchaseAt = now;
        break;
      case 'sale':
        updates.lastSaleAt = now;
        updates.salesCount = sql`sales_count + 1`;
        if (metadata?.amount && typeof metadata.amount === 'number') {
          updates.totalEarnings = sql`total_earnings + ${metadata.amount}`;
        }
        break;
      case 'page_view':
        break;
    }

    try {
      await db.update(userActivityTracking)
        .set(updates)
        .where(eq(userActivityTracking.userId, userId as any));
    } catch (error) {
      console.error('Error tracking activity:', error);
    }
  }

  async trackLogin(userId: string): Promise<void> {
    await this.trackActivity({ userId, activityType: 'login' });
  }

  async trackLessonActivity(userId: string): Promise<void> {
    await this.trackActivity({ userId, activityType: 'lesson_activity' });
  }

  async trackCourseEnrollment(userId: string): Promise<void> {
    await this.trackActivity({ userId, activityType: 'course_enrollment' });
  }

  async trackCourseStart(userId: string): Promise<void> {
    await this.trackActivity({ userId, activityType: 'course_start' });
  }

  async trackContentCreation(userId: string): Promise<void> {
    await this.trackActivity({ userId, activityType: 'content_creation' });
  }

  async trackDownload(userId: string): Promise<void> {
    await this.trackActivity({ userId, activityType: 'download' });
  }

  async trackPurchase(userId: string): Promise<void> {
    await this.trackActivity({ userId, activityType: 'purchase' });
  }

  async trackSale(userId: string, amount: number): Promise<void> {
    await this.trackActivity({ userId, activityType: 'sale', metadata: { amount } });
  }

  async trackPageView(userId: string): Promise<void> {
    await this.trackActivity({ userId, activityType: 'page_view' });
  }

  async getUserActivity(userId: string) {
    const result = await db.select()
      .from(userActivityTracking)
      .where(eq(userActivityTracking.userId, userId as any))
      .limit(1);
    return result[0] || null;
  }
}

export const activityTracker = new ActivityTrackerService();
