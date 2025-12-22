import { eq, and, sql } from "drizzle-orm";
import { db } from "../db";
import { 
  profiles, 
  lessonAccessPermissions, 
  downloadQuotaUsage,
  getFeatureAccess,
  getNumericGrade,
  users
} from "@shared/schema";

/**
 * AccessControlService - Centralized service for subscription-based access control
 * Enforces grade and subscription-based feature restrictions
 */
export class AccessControlService {
  /**
   * Get comprehensive feature access for a user based on grade and subscription
   */
  static async getUserFeatureAccess(userId: string) {
    try {
      // Get user profile with subscription info
      const userProfile = await db
        .select({
          grade: profiles.grade,
          gradeLevel: profiles.gradeLevel,
          subscriptionTier: profiles.subscriptionTier,
          planExpiry: profiles.planExpiry,
          role: profiles.role,
        })
        .from(profiles)
        .where(eq(profiles.userId, userId))
        .limit(1);

      // Defensive handling: if profile doesn't exist or has missing data, return safe defaults
      if (!userProfile || userProfile.length === 0) {
        console.warn(`User profile not found for userId: ${userId}, returning default restricted access`);
        const featureAccess = getFeatureAccess(null, false);
        return {
          ...featureAccess,
          userId,
          grade: null,
          gradeLevel: null,
          subscriptionTier: null,
          hasActiveSubscription: false,
          role: 'student',
        };
      }

      const profile = userProfile[0];
      
      // Check if user has active subscription
      const hasActiveSubscription = this.checkActiveSubscription(
        profile.subscriptionTier,
        profile.planExpiry
      );

      // Get feature access based on grade and subscription
      const gradeLevel = profile.gradeLevel || profile.grade;
      const featureAccess = getFeatureAccess(gradeLevel, hasActiveSubscription);

      return {
        ...featureAccess,
        userId,
        grade: profile.grade,
        gradeLevel: profile.gradeLevel,
        subscriptionTier: profile.subscriptionTier,
        hasActiveSubscription,
        role: profile.role || 'student',
      };
    } catch (error) {
      console.error('Error getting user feature access:', error);
      // Return safe default instead of throwing to prevent blocking users
      const featureAccess = getFeatureAccess(null, false);
      return {
        ...featureAccess,
        userId,
        grade: null,
        gradeLevel: null,
        subscriptionTier: null,
        hasActiveSubscription: false,
        role: 'student',
      };
    }
  }

  /**
   * Check if user has an active subscription
   */
  static checkActiveSubscription(
    subscriptionTier: string | null | undefined,
    planExpiry: Date | null | undefined
  ): boolean {
    if (!subscriptionTier || subscriptionTier === 'free' || subscriptionTier === '') {
      return false;
    }

    // If there's a subscription tier but no expiry, it's not properly activated
    if (!planExpiry) {
      return false;
    }

    // Check if subscription has expired
    const now = new Date();
    return planExpiry > now;
  }

  /**
   * Check if user can access a specific lesson
   * Enforces "1 full subject" for elementary/high school or "1 full course" for university
   */
  static async canAccessLesson(
    userId: string,
    subjectId: string,
    lessonId: number,
    courseId?: string
  ): Promise<{ canAccess: boolean; reason?: string; unlockedSubjectId?: string; unlockedCourseId?: string }> {
    try {
      const featureAccess = await this.getUserFeatureAccess(userId);

      // Paid users get unlimited access
      if (featureAccess.hasActiveSubscription && featureAccess.canAccessAllLessons) {
        return { canAccess: true };
      }

      // For free users with subject limits (elementary/high school)
      if (featureAccess.freeSubjectLimit !== null && featureAccess.freeSubjectLimit !== undefined) {
        // Use a transaction with SELECT FOR UPDATE to prevent race conditions
        return await db.transaction(async (tx) => {
          // Lock all user's access records for update to prevent concurrent modifications
          const existingAccessRecords = await tx
            .select({
              subjectId: lessonAccessPermissions.subjectId,
            })
            .from(lessonAccessPermissions)
            .where(eq(lessonAccessPermissions.userId, userId))
            .for('update'); // Lock these rows

          // Get unique subject IDs (filter out nulls)
          const uniqueSubjects = Array.from(
            new Set(existingAccessRecords.map(r => r.subjectId).filter(id => id !== null))
          );

          // Check if user is trying to access an already unlocked subject
          if (uniqueSubjects.includes(subjectId)) {
            return { canAccess: true };
          }

          // Check if user has reached their subject limit
          if (uniqueSubjects.length >= featureAccess.freeSubjectLimit) {
            return {
              canAccess: false,
              reason: `You have already unlocked ${uniqueSubjects.length} subject(s). Subscribe to access all subjects.`,
              unlockedSubjectId: uniqueSubjects[0] || undefined,
            };
          }

          // Grant access to new subject and record it
          await tx.insert(lessonAccessPermissions).values({
            userId,
            subjectId,
            courseId: courseId || null,
            lessonId,
            subscriptionSnapshot: featureAccess.subscriptionTier || 'free',
          });

          return { canAccess: true };
        });
      }

      // For free users with course limits (university/college)
      if (featureAccess.freeCourseLimit !== null && featureAccess.freeCourseLimit !== undefined) {
        if (!courseId) {
          return {
            canAccess: false,
            reason: 'Course ID is required for university students.',
          };
        }

        // Use a transaction with SELECT FOR UPDATE to prevent race conditions
        return await db.transaction(async (tx) => {
          // Lock all user's access records for update to prevent concurrent modifications
          const existingAccessRecords = await tx
            .select({
              courseId: lessonAccessPermissions.courseId,
            })
            .from(lessonAccessPermissions)
            .where(eq(lessonAccessPermissions.userId, userId))
            .for('update'); // Lock these rows

          // Get unique course IDs (filter out nulls)
          const uniqueCourses = Array.from(
            new Set(existingAccessRecords.map(r => r.courseId).filter(id => id !== null))
          );

          // Check if user is trying to access an already unlocked course
          if (uniqueCourses.includes(courseId)) {
            return { canAccess: true };
          }

          // Check if user has reached their course limit
          if (uniqueCourses.length >= featureAccess.freeCourseLimit) {
            return {
              canAccess: false,
              reason: `You have already unlocked ${uniqueCourses.length} course(s). Subscribe to access all courses.`,
              unlockedCourseId: uniqueCourses[0] || undefined,
            };
          }

          // Grant access to new course and record it
          await tx.insert(lessonAccessPermissions).values({
            userId,
            subjectId,
            courseId,
            lessonId,
            subscriptionSnapshot: featureAccess.subscriptionTier || 'free',
          });

          return { canAccess: true };
        });
      }

      // Fallback: no access
      return {
        canAccess: false,
        reason: 'Upgrade to premium to access this content.',
      };
    } catch (error) {
      console.error('Error checking lesson access:', error);
      throw error;
    }
  }

  /**
   * Check if user can download a product (free download quota check)
   * Enforces "5 downloads per month" for unpaid users
   */
  static async canDownloadProduct(userId: string): Promise<{
    canDownload: boolean;
    downloadsRemaining?: number;
    reason?: string;
  }> {
    try {
      const featureAccess = await this.getUserFeatureAccess(userId);

      // Paid users get unlimited downloads
      if (featureAccess.hasActiveSubscription && featureAccess.canAccessUnlimitedDownloads) {
        return { canDownload: true };
      }

      // Get current month's period start (truncated to first day of month)
      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);

      // Check current month's download count
      const quotaRecord = await db
        .select({
          downloadCount: downloadQuotaUsage.downloadCount,
        })
        .from(downloadQuotaUsage)
        .where(
          and(
            eq(downloadQuotaUsage.userId, userId),
            eq(downloadQuotaUsage.periodStart, periodStart)
          )
        )
        .limit(1);

      const currentCount = quotaRecord.length > 0 ? quotaRecord[0].downloadCount : 0;
      const limit = featureAccess.freeDownloadsPerMonth || 5;

      if (currentCount >= limit) {
        return {
          canDownload: false,
          downloadsRemaining: 0,
          reason: `You've reached your free download limit of ${limit} downloads this month. Subscribe for unlimited downloads.`,
        };
      }

      return {
        canDownload: true,
        downloadsRemaining: limit - currentCount,
      };
    } catch (error) {
      console.error('Error checking download quota:', error);
      throw error;
    }
  }

  /**
   * Increment download count for a user
   * Should be called after successful download
   */
  static async incrementDownloadCount(userId: string): Promise<void> {
    try {
      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);

      // Try to increment existing record
      const existing = await db
        .select({ id: downloadQuotaUsage.id })
        .from(downloadQuotaUsage)
        .where(
          and(
            eq(downloadQuotaUsage.userId, userId),
            eq(downloadQuotaUsage.periodStart, periodStart)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        // Update existing record
        await db
          .update(downloadQuotaUsage)
          .set({
            downloadCount: sql`${downloadQuotaUsage.downloadCount} + 1`,
            lastDownloadAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(downloadQuotaUsage.id, existing[0].id));
      } else {
        // Create new record for this month
        await db.insert(downloadQuotaUsage).values({
          userId,
          periodStart,
          downloadCount: 1,
          lastDownloadAt: new Date(),
        });
      }
    } catch (error) {
      console.error('Error incrementing download count:', error);
      throw error;
    }
  }

  /**
   * Check if user can access community features
   * Only Grade 12+ with paid subscription can access
   */
  static async canAccessCommunity(userId: string): Promise<{
    canAccess: boolean;
    reason?: string;
  }> {
    try {
      const featureAccess = await this.getUserFeatureAccess(userId);

      if (!featureAccess.canAccessCommunity) {
        const numericGrade = getNumericGrade(featureAccess.gradeLevel || featureAccess.grade);
        
        if (numericGrade && numericGrade < 12) {
          return {
            canAccess: false,
            reason: 'Community access is only available for college/university students (Grade 12+) with an active subscription.',
          };
        }

        if (!featureAccess.hasActiveSubscription) {
          return {
            canAccess: false,
            reason: 'Community access requires an active subscription.',
          };
        }

        return {
          canAccess: false,
          reason: 'You do not have access to community features.',
        };
      }

      return { canAccess: true };
    } catch (error) {
      console.error('Error checking community access:', error);
      throw error;
    }
  }

  /**
   * Check if user can send friend requests
   * Only Grade 12+ with paid subscription can send friend requests
   */
  static async canSendFriendRequest(userId: string): Promise<{
    canSend: boolean;
    reason?: string;
  }> {
    try {
      const featureAccess = await this.getUserFeatureAccess(userId);

      if (!featureAccess.canSendFriendRequests) {
        const numericGrade = getNumericGrade(featureAccess.gradeLevel || featureAccess.grade);
        
        if (numericGrade && numericGrade < 12) {
          return {
            canSend: false,
            reason: 'Friend requests are only available for college/university students (Grade 12+) for child safety.',
          };
        }

        if (!featureAccess.hasActiveSubscription) {
          return {
            canSend: false,
            reason: 'Sending friend requests requires an active subscription.',
          };
        }

        return {
          canSend: false,
          reason: 'You do not have permission to send friend requests.',
        };
      }

      return { canSend: true };
    } catch (error) {
      console.error('Error checking friend request permission:', error);
      throw error;
    }
  }

  /**
   * Check if user can join meetings
   * Requires active subscription
   */
  static async canJoinMeeting(userId: string): Promise<{
    canJoin: boolean;
    reason?: string;
  }> {
    try {
      const featureAccess = await this.getUserFeatureAccess(userId);

      if (!featureAccess.canAccessMeetings) {
        if (!featureAccess.hasActiveSubscription) {
          return {
            canJoin: false,
            reason: 'Joining meetings requires an active subscription.',
          };
        }

        return {
          canJoin: false,
          reason: 'You do not have permission to join meetings.',
        };
      }

      return { canJoin: true };
    } catch (error) {
      console.error('Error checking meeting access:', error);
      throw error;
    }
  }

  /**
   * Check if user can access daily challenges/quizzes
   * Requires active subscription
   */
  static async canAccessDailyChallenge(userId: string): Promise<{
    canAccess: boolean;
    reason?: string;
  }> {
    try {
      const featureAccess = await this.getUserFeatureAccess(userId);

      if (!featureAccess.canAccessDailyChallenge) {
        if (!featureAccess.hasActiveSubscription) {
          return {
            canAccess: false,
            reason: 'Daily challenges require an active subscription.',
          };
        }

        return {
          canAccess: false,
          reason: 'You do not have access to daily challenges.',
        };
      }

      return { canAccess: true };
    } catch (error) {
      console.error('Error checking daily challenge access:', error);
      throw error;
    }
  }

  /**
   * Get allowed message contacts for a user based on grade and subscription
   */
  static async getAllowedMessageContacts(userId: string): Promise<string[]> {
    try {
      const featureAccess = await this.getUserFeatureAccess(userId);
      return featureAccess.allowedMessageContacts;
    } catch (error) {
      console.error('Error getting allowed message contacts:', error);
      return ['admin']; // Default to admin only on error
    }
  }
}
