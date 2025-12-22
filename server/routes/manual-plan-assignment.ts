import { Router } from "express";
import { db } from "../db.js";
import { users, profiles, manualPlanAssignments, notifications, freelancerPricingPlans } from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";
import { requireAdmin, type AuthenticatedRequest } from "../middleware/auth.js";

const router = Router();

// Create manual plan assignment
router.post("/", requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const {
      userId,
      subscriptionTier,
      freelancerPlanId,
      reason,
      notes,
      duration,
      startDate,
      endDate
    } = req.body;

    const adminUser = req.user;
    if (!adminUser) {
      return res.status(401).json({ success: false, error: "Admin user not found" });
    }

    // Validate required fields
    if (!userId || (!subscriptionTier && !freelancerPlanId) || !reason || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: userId, subscriptionTier or freelancerPlanId, reason, startDate, endDate"
      });
    }

    // Validate that only one plan type is provided
    if (subscriptionTier && freelancerPlanId) {
      return res.status(400).json({
        success: false,
        error: "Provide either subscriptionTier or freelancerPlanId, not both"
      });
    }

    // Validate subscription tier if provided
    if (subscriptionTier) {
      const allowedStudentTiers = ['elementary', 'high_school', 'college_university'];
      const allowedShopTiers = ['free', 'creator', 'pro', 'business'];
      const allAllowedTiers = [...allowedStudentTiers, ...allowedShopTiers];
      
      if (!allAllowedTiers.includes(subscriptionTier)) {
        return res.status(400).json({
          success: false,
          error: "Invalid subscription tier"
        });
      }
    }

    // Validate reason
    const allowedReasons = ['cash_payment', 'error_compensation', 'promotional', 'trial_extension', 'other'];
    if (!allowedReasons.includes(reason)) {
      return res.status(400).json({
        success: false,
        error: "Invalid reason"
      });
    }

    // Get the target user - userId can be either UUID (users.id) or string (users.userId)
    let targetUserId: string;
    
    // First try to find by users.userId (string like "OZJGWKOGE9")
    const userByUserId = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.userId, userId))
      .limit(1);
    
    if (userByUserId.length > 0) {
      targetUserId = userByUserId[0].id;
    } else {
      // If not found, try by users.id (UUID)
      const userById = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      
      if (userById.length === 0) {
        return res.status(404).json({ success: false, error: "User not found" });
      }
      targetUserId = userById[0].id;
    }

    // Get current plan details
    const currentProfile = await db
      .select({
        subscriptionTier: profiles.subscriptionTier,
        planExpiry: profiles.planExpiry,
        legacyPlan: profiles.legacyPlan
      })
      .from(profiles)
      .where(eq(profiles.userId, targetUserId))
      .limit(1);

    const previousPlan = currentProfile[0]?.subscriptionTier || null;
    const previousExpiry = currentProfile[0]?.planExpiry || null;
    const previousFreelancerPlan = currentProfile[0]?.legacyPlan || null;

    // Create manual plan assignment record
    const assignmentValues: any = {
      userId: targetUserId,
      assignedByAdminId: adminUser.id,
      reason,
      notes: notes || null,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      duration: duration || null,
      previousExpiry,
      isActive: true
    };

    if (subscriptionTier) {
      assignmentValues.subscriptionTier = subscriptionTier;
      assignmentValues.previousPlan = previousPlan;
    }

    if (freelancerPlanId) {
      assignmentValues.freelancerPlanId = freelancerPlanId;
      assignmentValues.previousFreelancerPlan = previousFreelancerPlan;
    }

    const [assignment] = await db
      .insert(manualPlanAssignments)
      .values(assignmentValues)
      .returning();

    // Determine plan name for notification
    let planName = subscriptionTier || freelancerPlanId || 'Unknown';
    const planLabels: Record<string, string> = {
      'elementary': 'Elementary Plan',
      'high_school': 'High School Plan',
      'college_university': 'College & University Plan',
      'free': 'Free Plan',
      'creator': 'Creator Plan',
      'pro': 'Pro Plan',
      'business': 'Business Plan'
    };
    if (subscriptionTier && planLabels[subscriptionTier]) {
      planName = planLabels[subscriptionTier];
    }

    // Determine verification badge based on plan type
    // Only two badges: 'blue' (verified/basic) and 'green' (premium/black badge)
    let verificationBadge: 'none' | 'green' | 'blue' = 'none';
    
    // For subscription tiers (student/shop plans)
    if (subscriptionTier) {
      const isPaidPlan = subscriptionTier !== 'free';
      if (isPaidPlan) {
        verificationBadge = 'blue';
      }
    }
    
    // For freelancer plans, get badge color from plan details
    if (freelancerPlanId) {
      const [planDetails] = await db
        .select({ badgeColor: freelancerPricingPlans.badgeColor, name: freelancerPricingPlans.name })
        .from(freelancerPricingPlans)
        .where(eq(freelancerPricingPlans.planId, freelancerPlanId))
        .limit(1);
      
      if (planDetails) {
        // Map badge color to verification badge:
        // - Blue badge color → blue verification badge (verified)
        // - Black/Green/Orange badge color → green verification badge (displays as black/premium)
        if (planDetails.badgeColor === 'blue') {
          verificationBadge = 'blue';
        } else if (planDetails.badgeColor === 'black' || planDetails.badgeColor === 'green' || planDetails.badgeColor === 'orange') {
          verificationBadge = 'green'; // Green verification badge displays as black/premium in UI
        }
        planName = planDetails.name; // Use the actual plan name
      }
    }
    
    // Update user profile with new subscription
    const updateValues: any = {
      planExpiry: new Date(endDate),
      updatedAt: new Date()
    };

    if (subscriptionTier) {
      updateValues.subscriptionTier = subscriptionTier;
    }

    if (freelancerPlanId) {
      updateValues.legacyPlan = freelancerPlanId;
    }

    // Apply verification badge if it's not 'none'
    if (verificationBadge !== 'none') {
      updateValues.verificationBadge = verificationBadge;
    }

    await db
      .update(profiles)
      .set(updateValues)
      .where(eq(profiles.userId, targetUserId));

    // Create notification for the user
    const reasonLabels: Record<string, string> = {
      'cash_payment': 'Cash Payment',
      'error_compensation': 'Error Compensation',
      'promotional': 'Promotional',
      'trial_extension': 'Trial Extension',
      'other': 'Other'
    };
    const reasonText = reasonLabels[reason] || reason;
    
    await db
      .insert(notifications)
      .values({
        userId: targetUserId,
        title: 'Plan Activated',
        message: `Your ${planName} has been activated by admin. Reason: ${reasonText}. Valid until ${new Date(endDate).toLocaleDateString()}.`,
        type: 'success',
        isRead: false,
        metadata: {
          planType: subscriptionTier || freelancerPlanId,
          reason: reason,
          duration: duration,
          assignedBy: adminUser.id,
          endDate: endDate
        }
      });

    // Generate and send PDF receipt for cash payments
    if (reason === 'cash_payment') {
      try {
        const { ReceiptService } = await import('../services/receipts.js');
        
        // Get user email
        const [userProfile] = await db
          .select({ email: profiles.email, name: profiles.name })
          .from(profiles)
          .where(eq(profiles.userId, targetUserId))
          .limit(1);

        if (userProfile?.email) {
          // Get plan pricing
          let planAmount = 0;
          let planDisplayName = planName;
          let receiptType: 'subscription' | 'freelancer_plan' = 'subscription';
          
          if (subscriptionTier) {
            // For student subscriptions, use default pricing
            const tierPricing: Record<string, number> = {
              'elementary': 9.99,
              'high_school': 14.99,
              'college_university': 19.99,
              'free': 0,
              'creator': 9.99,
              'pro': 19.99,
              'business': 49.99
            };
            planAmount = tierPricing[subscriptionTier] || 0;
            planDisplayName = planName;
            receiptType = 'subscription';
          } else if (freelancerPlanId) {
            // Get freelancer plan pricing
            const [planDetails] = await db
              .select({ price: freelancerPricingPlans.price, name: freelancerPricingPlans.name })
              .from(freelancerPricingPlans)
              .where(eq(freelancerPricingPlans.planId, freelancerPlanId))
              .limit(1);
            
            if (planDetails) {
              planAmount = parseFloat(planDetails.price || '0');
              planDisplayName = `Freelancer ${planDetails.name}`;
            }
            receiptType = 'freelancer_plan';
          }

          if (planAmount > 0) {
            if (receiptType === 'freelancer_plan') {
              await ReceiptService.generateAndSendFreelancerPlanReceipt({
                planId: assignment.id,
                userId: targetUserId,
                userEmail: userProfile.email,
                userName: userProfile.name || undefined,
                planName: planDisplayName,
                amount: planAmount,
                currency: 'USD',
                billingCycle: duration || 'monthly',
                planExpiry: new Date(endDate)
              });
            } else {
              await ReceiptService.generateAndSendSubscriptionReceipt({
                subscriptionId: assignment.id,
                userId: targetUserId,
                userEmail: userProfile.email,
                userName: userProfile.name || undefined,
                planName: planDisplayName,
                planType: subscriptionTier || 'subscription',
                amount: planAmount,
                currency: 'USD',
                billingCycle: duration || 'monthly',
                planExpiry: new Date(endDate)
              });
            }
            console.log('📄 Manual plan assignment receipt sent to:', userProfile.email);
          }
        }
      } catch (receiptError) {
        console.error('Failed to send manual plan assignment receipt:', receiptError);
      }
    }

    res.json({
      success: true,
      message: "Plan assigned successfully",
      assignment
    });

  } catch (error) {
    console.error('Create manual plan assignment error:', error);
    res.status(500).json({ success: false, error: "Failed to create manual plan assignment" });
  }
});

// Get all manual plan assignments (with optional filters)
router.get("/", requireAdmin, async (req, res) => {
  try {
    const { userId, isActive, limit = '50' } = req.query;

    // Build conditions array
    const conditions = [];
    if (userId) {
      conditions.push(eq(manualPlanAssignments.userId, userId as string));
    }
    if (isActive !== undefined) {
      conditions.push(eq(manualPlanAssignments.isActive, isActive === 'true'));
    }

    // Build query
    const queryBuilder = db
      .select({
        id: manualPlanAssignments.id,
        userId: manualPlanAssignments.userId,
        assignedByAdminId: manualPlanAssignments.assignedByAdminId,
        subscriptionTier: manualPlanAssignments.subscriptionTier,
        freelancerPlanId: manualPlanAssignments.freelancerPlanId,
        reason: manualPlanAssignments.reason,
        notes: manualPlanAssignments.notes,
        startDate: manualPlanAssignments.startDate,
        endDate: manualPlanAssignments.endDate,
        duration: manualPlanAssignments.duration,
        previousPlan: manualPlanAssignments.previousPlan,
        previousFreelancerPlan: manualPlanAssignments.previousFreelancerPlan,
        previousExpiry: manualPlanAssignments.previousExpiry,
        isActive: manualPlanAssignments.isActive,
        createdAt: manualPlanAssignments.createdAt,
        // User info
        userName: profiles.name,
        userEmail: profiles.email,
        userRole: profiles.role
      })
      .from(manualPlanAssignments)
      .leftJoin(profiles, eq(manualPlanAssignments.userId, profiles.userId))
      .orderBy(desc(manualPlanAssignments.createdAt))
      .limit(parseInt(limit as string));

    // Apply filters if any
    const assignments = conditions.length > 0
      ? await queryBuilder.where(and(...conditions))
      : await queryBuilder;

    // Fetch admin names separately (simpler approach)
    const assignmentsWithAdminNames = await Promise.all(
      assignments.map(async (assignment) => {
        const adminProfile = await db
          .select({ name: profiles.name })
          .from(profiles)
          .where(eq(profiles.userId, assignment.assignedByAdminId))
          .limit(1);

        return {
          ...assignment,
          adminName: adminProfile[0]?.name || 'Unknown Admin'
        };
      })
    );

    res.json({
      success: true,
      assignments: assignmentsWithAdminNames
    });

  } catch (error) {
    console.error('Get manual plan assignments error:', error);
    res.status(500).json({ success: false, error: "Failed to get manual plan assignments" });
  }
});

// Get manual plan assignments for a specific user
router.get("/user/:userId", requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    const assignments = await db
      .select({
        id: manualPlanAssignments.id,
        userId: manualPlanAssignments.userId,
        assignedByAdminId: manualPlanAssignments.assignedByAdminId,
        subscriptionTier: manualPlanAssignments.subscriptionTier,
        freelancerPlanId: manualPlanAssignments.freelancerPlanId,
        reason: manualPlanAssignments.reason,
        notes: manualPlanAssignments.notes,
        startDate: manualPlanAssignments.startDate,
        endDate: manualPlanAssignments.endDate,
        duration: manualPlanAssignments.duration,
        previousPlan: manualPlanAssignments.previousPlan,
        previousFreelancerPlan: manualPlanAssignments.previousFreelancerPlan,
        previousExpiry: manualPlanAssignments.previousExpiry,
        isActive: manualPlanAssignments.isActive,
        createdAt: manualPlanAssignments.createdAt
      })
      .from(manualPlanAssignments)
      .where(eq(manualPlanAssignments.userId, userId))
      .orderBy(desc(manualPlanAssignments.createdAt));

    // Fetch admin names for each assignment
    const assignmentsWithAdminNames = await Promise.all(
      assignments.map(async (assignment) => {
        const adminProfile = await db
          .select({ name: profiles.name })
          .from(profiles)
          .where(eq(profiles.userId, assignment.assignedByAdminId))
          .limit(1);

        return {
          ...assignment,
          adminName: adminProfile[0]?.name || 'Unknown Admin'
        };
      })
    );

    res.json({
      success: true,
      assignments: assignmentsWithAdminNames
    });

  } catch (error) {
    console.error('Get user manual plan assignments error:', error);
    res.status(500).json({ success: false, error: "Failed to get user manual plan assignments" });
  }
});

export default router;
