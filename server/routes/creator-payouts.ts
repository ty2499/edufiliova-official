import { Router } from "express";
import { db } from "../db";
import { 
  creatorPayoutRequests, 
  creatorBalances,
  creatorEarningEvents,
  payoutAccounts,
  users,
  profiles,
  adminNotifications
} from "../../shared/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { requireAuth, requireRole, type AuthenticatedRequest } from "../middleware/auth";
import { z } from "zod";
import { 
  getCreatorBalance, 
  canRequestPayout, 
  getCreatorEarnings,
  processMonthlySettlementForAll 
} from "../services/earnings";

const router = Router();

// Validation schemas
const requestPayoutSchema = z.object({
  amount: z.number().min(50, "Minimum payout amount is $50"),
  payoutMethod: z.enum(["bank", "paypal", "crypto"]),
  payoutAccountId: z.string().uuid("Invalid payout account ID"),
  notes: z.string().optional(),
});

const approvePayoutSchema = z.object({
  amountApproved: z.number().positive("Amount must be positive"),
  paymentReference: z.string().optional(),
  adminNotes: z.string().optional(),
});

const rejectPayoutSchema = z.object({
  rejectionReason: z.string().min(1, "Rejection reason is required"),
  adminNotes: z.string().optional(),
});

/**
 * Get creator balance and earnings
 */
router.get("/balance", requireAuth, requireRole(['freelancer', 'teacher']), async (req: AuthenticatedRequest, res) => {
  try {
    const creatorId = req.user!.id;
    
    // Get balance
    const balance = await getCreatorBalance(creatorId);
    
    // Get recent earnings
    const earnings = await getCreatorEarnings(creatorId, 20);
    
    // Get pending payout requests
    const pendingPayouts = await db.select()
      .from(creatorPayoutRequests)
      .where(and(
        eq(creatorPayoutRequests.creatorId, creatorId),
        eq(creatorPayoutRequests.status, 'awaiting_admin')
      ))
      .orderBy(desc(creatorPayoutRequests.requestedAt));
    
    res.json({
      success: true,
      data: {
        balance,
        recentEarnings: earnings,
        pendingPayouts,
        canWithdraw: canRequestPayout(balance.availableBalance)
      }
    });
  } catch (error) {
    console.error("Error fetching creator balance:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

/**
 * Request a payout
 */
router.post("/request", requireAuth, requireRole(['freelancer', 'teacher']), async (req: AuthenticatedRequest, res) => {
  try {
    const creatorId = req.user!.id;
    
    // Validate request body
    const validationResult = requestPayoutSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: "Invalid request data",
        details: validationResult.error.errors
      });
    }
    
    const { amount, payoutMethod, payoutAccountId, notes } = validationResult.data;
    
    // Get creator balance
    const balance = await getCreatorBalance(creatorId);
    
    // Check if creator has enough available balance
    const availableAmount = parseFloat(balance.availableBalance);
    if (availableAmount < amount) {
      return res.status(400).json({
        success: false,
        error: `Insufficient balance. Available: $${availableAmount.toFixed(2)}`
      });
    }
    
    // Check minimum payout amount
    if (!canRequestPayout(amount.toString())) {
      return res.status(400).json({
        success: false,
        error: "Minimum payout amount is $50.00"
      });
    }
    
    // Verify payout account exists and belongs to user
    const [payoutAccount] = await db.select()
      .from(payoutAccounts)
      .where(and(
        eq(payoutAccounts.id, payoutAccountId),
        eq(payoutAccounts.userId, creatorId),
        eq(payoutAccounts.type, payoutMethod)
      ));
    
    if (!payoutAccount) {
      return res.status(404).json({
        success: false,
        error: "Payout account not found or method mismatch"
      });
    }
    
    // Create payout request
    const [payoutRequest] = await db.insert(creatorPayoutRequests).values({
      creatorId,
      amountRequested: amount.toString(),
      payoutMethod,
      payoutAccountId,
      status: 'awaiting_admin',
      payoutDate: getNextPayoutDate(), // Scheduled for 5th of next month
      adminNotes: notes || null
    }).returning();
    
    // Update creator balance (deduct from available, add to pending payouts)
    await db.execute(sql`
      UPDATE creator_balances 
      SET 
        available_balance = available_balance::numeric - ${amount.toString()}::numeric,
        updated_at = NOW()
      WHERE creator_id = ${creatorId}
    `);
    
    console.log(`💸 Payout request created: ${creatorId} requested $${amount} via ${payoutMethod}`);
    
    res.status(201).json({
      success: true,
      data: payoutRequest,
      message: `Payout request for $${amount.toFixed(2)} submitted successfully. Payment will be processed on the 5th of next month.`
    });
  } catch (error) {
    console.error("Error creating payout request:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

/**
 * Get payout requests for creator
 */
router.get("/requests", requireAuth, requireRole(['freelancer', 'teacher']), async (req: AuthenticatedRequest, res) => {
  try {
    const creatorId = req.user!.id;
    
    const requests = await db.select({
      request: creatorPayoutRequests,
      payoutAccount: payoutAccounts
    })
      .from(creatorPayoutRequests)
      .leftJoin(payoutAccounts, eq(creatorPayoutRequests.payoutAccountId, payoutAccounts.id))
      .where(eq(creatorPayoutRequests.creatorId, creatorId))
      .orderBy(desc(creatorPayoutRequests.requestedAt));
    
    res.json({ success: true, data: requests });
  } catch (error) {
    console.error("Error fetching payout requests:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

/**
 * Get all payout requests (admin only)
 */
router.get("/admin/requests", requireAuth, requireRole(['admin', 'accountant', 'customer_service']), async (req: AuthenticatedRequest, res) => {
  try {
    const { status } = req.query;
    
    const baseQuery = db.select({
      request: creatorPayoutRequests,
      creator: {
        id: users.id,
        name: profiles.name,
        email: users.email,
        role: profiles.role
      },
      payoutAccount: payoutAccounts
    })
      .from(creatorPayoutRequests)
      .leftJoin(users, eq(creatorPayoutRequests.creatorId, users.id))
      .leftJoin(profiles, eq(users.id, profiles.userId))
      .leftJoin(payoutAccounts, eq(creatorPayoutRequests.payoutAccountId, payoutAccounts.id));
    
    const requests = await (status && typeof status === 'string'
      ? baseQuery.where(eq(creatorPayoutRequests.status, status)).orderBy(desc(creatorPayoutRequests.requestedAt))
      : baseQuery.orderBy(desc(creatorPayoutRequests.requestedAt)));
    
    console.log(`📊 Admin payout requests - Status: ${status || 'ALL'}, Count: ${requests.length}`);
    if (requests.length > 0) {
      console.log('📊 First request sample:', JSON.stringify(requests[0], null, 2).substring(0, 500));
    }
    
    res.json({ success: true, data: requests });
  } catch (error) {
    console.error("Error fetching admin payout requests:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

/**
 * Approve payout request (admin only)
 */
router.put("/:requestId/approve", requireAuth, requireRole(['admin', 'accountant', 'customer_service']), async (req: AuthenticatedRequest, res) => {
  try {
    const { requestId } = req.params;
    
    // Validate request body
    const validationResult = approvePayoutSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: "Invalid request data",
        details: validationResult.error.errors
      });
    }
    
    const { amountApproved, paymentReference, adminNotes } = validationResult.data;
    
    // Update payout request
    const [updated] = await db.update(creatorPayoutRequests)
      .set({
        status: 'approved',
        amountApproved: amountApproved.toString(),
        paymentReference: paymentReference || null,
        adminNotes: adminNotes || null,
        processedBy: req.user!.id,
        processedAt: new Date()
      })
      .where(and(
        eq(creatorPayoutRequests.id, requestId),
        eq(creatorPayoutRequests.status, 'awaiting_admin')
      ))
      .returning();
    
    if (!updated) {
      return res.status(404).json({
        success: false,
        error: "Payout request not found or already processed"
      });
    }
    
    console.log(`✅ Payout request ${requestId} approved by admin ${req.user!.id}`);
    
    res.json({
      success: true,
      data: updated,
      message: `Payout request approved for $${amountApproved.toFixed(2)}`
    });
  } catch (error) {
    console.error("Error approving payout request:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

/**
 * Reject payout request (admin only)
 */
router.put("/:requestId/reject", requireAuth, requireRole(['admin', 'accountant', 'customer_service']), async (req: AuthenticatedRequest, res) => {
  try {
    const { requestId } = req.params;
    
    // Validate request body
    const validationResult = rejectPayoutSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: "Invalid request data",
        details: validationResult.error.errors
      });
    }
    
    const { rejectionReason, adminNotes } = validationResult.data;
    
    // Get payout request
    const [payoutRequest] = await db.select()
      .from(creatorPayoutRequests)
      .where(and(
        eq(creatorPayoutRequests.id, requestId),
        eq(creatorPayoutRequests.status, 'awaiting_admin')
      ));
    
    if (!payoutRequest) {
      return res.status(404).json({
        success: false,
        error: "Payout request not found or already processed"
      });
    }
    
    // Update payout request
    const [updated] = await db.update(creatorPayoutRequests)
      .set({
        status: 'rejected',
        rejectionReason,
        adminNotes: adminNotes || null,
        processedBy: req.user!.id,
        processedAt: new Date()
      })
      .where(eq(creatorPayoutRequests.id, requestId))
      .returning();
    
    // Return funds to creator's available balance
    await db.execute(sql`
      UPDATE creator_balances 
      SET 
        available_balance = available_balance::numeric + ${payoutRequest.amountRequested}::numeric,
        updated_at = NOW()
      WHERE creator_id = ${payoutRequest.creatorId}
    `);
    
    console.log(`❌ Payout request ${requestId} rejected by admin ${req.user!.id}`);
    
    res.json({
      success: true,
      data: updated,
      message: "Payout request rejected. Funds returned to creator balance."
    });
  } catch (error) {
    console.error("Error rejecting payout request:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

/**
 * Get next payout date (5th of next month)
 */
function getNextPayoutDate(): Date {
  const now = new Date();
  let nextMonth = now.getMonth() + 1;
  let year = now.getFullYear();
  
  if (nextMonth > 11) {
    nextMonth = 0;
    year += 1;
  }
  
  return new Date(year, nextMonth, 5, 0, 0, 0);
}

/**
 * ADMIN ENDPOINT: Manually trigger monthly settlement for all creators
 * This moves pending balances to available and auto-processes payouts > $50
 */
router.post("/admin/process-monthly-settlement", requireAuth, requireRole(['admin']), async (req: AuthenticatedRequest, res) => {
  try {
    console.log(`🔧 Admin ${req.user!.id} manually triggered monthly settlement`);
    
    const result = await processMonthlySettlementForAll();
    
    res.json(result);
  } catch (error) {
    console.error("Error processing monthly settlement:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to process monthly settlement",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * ADMIN ENDPOINT: Get settlement status and preview
 * Shows how many creators would be processed and how many would get auto-payouts
 */
router.get("/admin/settlement-preview", requireAuth, requireRole(['admin']), async (req: AuthenticatedRequest, res) => {
  try {
    // Get all creators with pending balances > 0
    const creatorsWithPending = await db.select()
      .from(creatorBalances)
      .where(sql`pending_balance::numeric > 0`);
    
    // Calculate how many would get auto-payouts
    let autoPayoutCount = 0;
    let totalPendingAmount = 0;
    let totalAutoPayoutAmount = 0;
    
    const creatorDetails = creatorsWithPending.map(creator => {
      const pendingAmount = parseFloat(creator.pendingBalance);
      const currentAvailable = parseFloat(creator.availableBalance);
      const newAvailableBalance = currentAvailable + pendingAmount;
      const willGetAutoPayout = newAvailableBalance >= 50;
      
      totalPendingAmount += pendingAmount;
      
      if (willGetAutoPayout) {
        autoPayoutCount++;
        totalAutoPayoutAmount += newAvailableBalance;
      }
      
      return {
        creatorId: creator.creatorId,
        currentPending: pendingAmount.toFixed(2),
        currentAvailable: currentAvailable.toFixed(2),
        newAvailable: newAvailableBalance.toFixed(2),
        willGetAutoPayout
      };
    });
    
    res.json({
      success: true,
      preview: {
        totalCreators: creatorsWithPending.length,
        autoPayoutCount,
        totalPendingAmount: totalPendingAmount.toFixed(2),
        totalAutoPayoutAmount: totalAutoPayoutAmount.toFixed(2),
        creators: creatorDetails
      }
    });
  } catch (error) {
    console.error("Error fetching settlement preview:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to fetch settlement preview"
    });
  }
});

/**
 * ADMIN ENDPOINT: Get admin notifications for payouts
 */
router.get("/admin/notifications", requireAuth, requireRole(['admin', 'accountant', 'customer_service']), async (req: AuthenticatedRequest, res) => {
  try {
    const { unreadOnly } = req.query;
    
    const conditions = [eq(adminNotifications.type, 'payout_due')];
    
    if (unreadOnly === 'true') {
      conditions.push(eq(adminNotifications.isRead, false));
    }
    
    const notifications = await db.select()
      .from(adminNotifications)
      .where(and(...conditions))
      .orderBy(desc(adminNotifications.createdAt));
    
    res.json({ 
      success: true, 
      data: notifications 
    });
  } catch (error) {
    console.error("Error fetching admin notifications:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to fetch notifications" 
    });
  }
});

/**
 * ADMIN ENDPOINT: Mark notification as read
 */
router.put("/admin/notifications/:id/mark-read", requireAuth, requireRole(['admin', 'accountant', 'customer_service']), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    
    const [updated] = await db.update(adminNotifications)
      .set({
        isRead: true,
        readBy: req.user!.id,
        readAt: new Date(),
      })
      .where(eq(adminNotifications.id, id))
      .returning();
    
    if (!updated) {
      return res.status(404).json({
        success: false,
        error: "Notification not found"
      });
    }
    
    res.json({ 
      success: true, 
      data: updated 
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to mark notification as read" 
    });
  }
});

/**
 * ADMIN ENDPOINT: Mark single payout as paid
 * Moves payout from 'approved' to 'payment_processing' status
 */
router.post("/:requestId/mark-paid", requireAuth, requireRole(['admin', 'accountant', 'customer_service']), async (req: AuthenticatedRequest, res) => {
  try {
    const { requestId } = req.params;
    const { paymentReference } = req.body;
    
    // Update payout request to payment_processing
    const [updated] = await db.update(creatorPayoutRequests)
      .set({
        status: 'payment_processing',
        paymentReference: paymentReference || null,
        processedBy: req.user!.id,
        processedAt: new Date(),
      })
      .where(and(
        eq(creatorPayoutRequests.id, requestId),
        eq(creatorPayoutRequests.status, 'approved')
      ))
      .returning();
    
    if (!updated) {
      return res.status(404).json({
        success: false,
        error: "Payout request not found or not in approved status"
      });
    }
    
    console.log(`💳 Payout ${requestId} marked as paid by admin ${req.user!.id}`);
    
    res.json({
      success: true,
      data: updated,
      message: "Payout marked as paid and will be finalized on the 5th of the month"
    });
  } catch (error) {
    console.error("Error marking payout as paid:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to mark payout as paid" 
    });
  }
});

/**
 * ADMIN ENDPOINT: Bulk mark payouts as paid
 */
router.post("/admin/bulk-mark-paid", requireAuth, requireRole(['admin', 'accountant', 'customer_service']), async (req: AuthenticatedRequest, res) => {
  try {
    const { requestIds, paymentReference } = req.body;
    
    if (!Array.isArray(requestIds) || requestIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: "requestIds must be a non-empty array"
      });
    }
    
    let successCount = 0;
    const results: any[] = [];
    
    for (const requestId of requestIds) {
      try {
        const [updated] = await db.update(creatorPayoutRequests)
          .set({
            status: 'payment_processing',
            paymentReference: paymentReference || null,
            processedBy: req.user!.id,
            processedAt: new Date(),
          })
          .where(and(
            eq(creatorPayoutRequests.id, requestId),
            eq(creatorPayoutRequests.status, 'approved')
          ))
          .returning();
        
        if (updated) {
          successCount++;
          results.push({ requestId, success: true });
        } else {
          results.push({ requestId, success: false, reason: 'Not found or not approved' });
        }
      } catch (error) {
        results.push({ requestId, success: false, reason: 'Processing error' });
      }
    }
    
    console.log(`💳 Bulk marked ${successCount}/${requestIds.length} payouts as paid by admin ${req.user!.id}`);
    
    res.json({
      success: true,
      successCount,
      totalRequests: requestIds.length,
      results,
      message: `${successCount} payouts marked as paid`
    });
  } catch (error) {
    console.error("Error in bulk mark paid:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to process bulk operation" 
    });
  }
});

export default router;
