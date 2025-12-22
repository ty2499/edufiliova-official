import { Router } from "express";
import { db } from "../db";
import { 
  transactions, 
  payoutAccounts, 
  users,
  profiles,
  orders,
  orderItems,
  products
} from "../../shared/schema";
import { eq, desc, and, or, like, sql, inArray } from "drizzle-orm";
import { requireAuth, requireRole, type AuthenticatedRequest } from "../middleware/auth";

const router = Router();

// Get admin transaction statistics
router.get("/admin/stats-test", requireAuth, requireRole(["admin"]), async (req: AuthenticatedRequest, res) => {
  try {
    // Get total transactions count
    const [totalTransactionsResult] = await db
      .select({
        count: sql<number>`count(*)::int`
      })
      .from(transactions);

    // Get pending payouts count
    const [pendingPayoutsResult] = await db
      .select({
        count: sql<number>`count(*)::int`
      })
      .from(transactions)
      .where(and(
        eq(transactions.status, 'pending'),
        eq(transactions.type, 'debit')
      ));

    // Get total transaction volume (completed only)
    const [totalVolumeResult] = await db
      .select({
        volume: sql<number>`COALESCE(SUM(CAST(${transactions.amount} AS DECIMAL)), 0)`
      })
      .from(transactions)
      .where(eq(transactions.status, 'completed'));

    // Get active users with transactions
    const [activeUsersResult] = await db
      .select({
        count: sql<number>`count(DISTINCT ${transactions.userId})::int`
      })
      .from(transactions);

    // Get total revenue from all completed orders
    const [totalRevenueResult] = await db
      .select({
        revenue: sql<number>`COALESCE(SUM(CAST(${orders.totalAmount} AS DECIMAL)), 0)`
      })
      .from(orders)
      .where(eq(orders.status, 'paid'));

    // Calculate platform commission (35% of total revenue)
    const totalRevenue = Number(totalRevenueResult.revenue || 0);
    const platformCommission = totalRevenue * 0.35;
    const freelancerEarnings = totalRevenue * 0.65;

    // Get top 10 paid freelancers
    const topFreelancers = await db
      .select({
        userId: transactions.userId,
        userName: profiles.name,
        userEmail: users.email,
        totalEarnings: sql<number>`COALESCE(SUM(CAST(${transactions.amount} AS DECIMAL)), 0)`,
        transactionCount: sql<number>`count(*)::int`
      })
      .from(transactions)
      .leftJoin(users, eq(transactions.userId, users.id))
      .leftJoin(profiles, eq(transactions.userId, profiles.userId))
      .where(and(
        eq(transactions.type, 'credit'),
        eq(transactions.status, 'completed')
      ))
      .groupBy(transactions.userId, profiles.name, users.email)
      .orderBy(desc(sql`COALESCE(SUM(CAST(${transactions.amount} AS DECIMAL)), 0)`))
      .limit(10);

    // Get recent transactions (last 20)
    const recentTransactions = await db
      .select({
        id: transactions.id,
        userId: transactions.userId,
        userName: profiles.name,
        userEmail: users.email,
        type: transactions.type,
        amount: transactions.amount,
        status: transactions.status,
        method: transactions.method,
        description: transactions.description,
        createdAt: transactions.createdAt,
      })
      .from(transactions)
      .leftJoin(users, eq(transactions.userId, users.id))
      .leftJoin(profiles, eq(transactions.userId, profiles.userId))
      .orderBy(desc(transactions.createdAt))
      .limit(20);

    const stats = {
      totalTransactions: totalTransactionsResult.count || 0,
      pendingPayouts: pendingPayoutsResult.count || 0,
      totalVolume: Number(totalVolumeResult.volume || 0),
      activeUsers: activeUsersResult.count || 0,
      totalRevenue,
      platformCommission,
      freelancerEarnings,
      topFreelancers: topFreelancers.map(f => ({
        userId: f.userId,
        name: f.userName || 'Unknown User',
        email: f.userEmail || '',
        totalEarnings: Number(f.totalEarnings || 0),
        transactionCount: f.transactionCount || 0,
      })),
      recentTransactions: recentTransactions.map(t => ({
        id: t.id,
        userId: t.userId,
        userName: t.userName || 'Unknown User',
        userEmail: t.userEmail || '',
        type: t.type,
        amount: t.amount,
        status: t.status,
        method: t.method,
        description: t.description,
        createdAt: t.createdAt,
      })),
    };

    res.json({ success: true, stats });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    res.status(500).json({ success: false, error: "Failed to fetch admin statistics" });
  }
});

// Get all transactions for admin (with pagination and filters)
router.get("/admin/transactions-test", requireAuth, requireRole(["admin"]), async (req: AuthenticatedRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    const statusFilter = req.query.status as string;
    const methodFilter = req.query.method as string;
    const userIdFilter = req.query.userId as string;

    // Build where conditions
    const conditions = [];
    if (statusFilter && statusFilter !== 'all') {
      conditions.push(eq(transactions.status, statusFilter as any));
    }
    if (methodFilter && methodFilter !== 'all') {
      conditions.push(eq(transactions.method, methodFilter as any));
    }
    if (userIdFilter) {
      conditions.push(eq(transactions.userId, userIdFilter));
    }

    // Fetch transactions with user details
    const transactionsList = await db
      .select({
        id: transactions.id,
        userId: transactions.userId,
        type: transactions.type,
        amount: transactions.amount,
        status: transactions.status,
        method: transactions.method,
        description: transactions.description,
        createdAt: transactions.createdAt,
        processedAt: transactions.processedAt,
        adminNotes: transactions.adminNotes,
        userName: profiles.name,
        userEmail: users.email,
      })
      .from(transactions)
      .leftJoin(users, eq(transactions.userId, users.id))
      .leftJoin(profiles, eq(transactions.userId, profiles.userId))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(transactions.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const [countResult] = await db
      .select({
        count: sql<number>`count(*)::int`
      })
      .from(transactions)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const totalCount = countResult.count || 0;
    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      success: true,
      transactions: transactionsList,
      pagination: {
        page,
        limit,
        totalPages,
        totalCount,
      },
    });
  } catch (error) {
    console.error("Error fetching admin transactions:", error);
    res.status(500).json({ success: false, error: "Failed to fetch transactions" });
  }
});

// Get all payout accounts for admin
router.get("/admin/payout-accounts", requireAuth, requireRole(["admin"]), async (req: AuthenticatedRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    const statusFilter = req.query.status as string;

    // Build where conditions
    const conditions = [];
    if (statusFilter === 'pending') {
      conditions.push(eq(payoutAccounts.isVerified, false));
    } else if (statusFilter === 'verified') {
      conditions.push(eq(payoutAccounts.isVerified, true));
    }

    // Fetch payout accounts with user details
    const accountsList = await db
      .select({
        id: payoutAccounts.id,
        userId: payoutAccounts.userId,
        type: payoutAccounts.type,
        accountName: payoutAccounts.accountName,
        isVerified: payoutAccounts.isVerified,
        isDefault: payoutAccounts.isDefault,
        createdAt: payoutAccounts.createdAt,
        verifiedAt: payoutAccounts.verifiedAt,
        details: payoutAccounts.details,
        userName: profiles.name,
        userEmail: users.email,
      })
      .from(payoutAccounts)
      .leftJoin(users, eq(payoutAccounts.userId, users.id))
      .leftJoin(profiles, eq(payoutAccounts.userId, profiles.userId))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(payoutAccounts.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const [countResult] = await db
      .select({
        count: sql<number>`count(*)::int`
      })
      .from(payoutAccounts)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const totalCount = countResult.count || 0;
    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      success: true,
      accounts: accountsList,
      pagination: {
        page,
        limit,
        totalPages,
        totalCount,
      },
    });
  } catch (error) {
    console.error("Error fetching admin payout accounts:", error);
    res.status(500).json({ success: false, error: "Failed to fetch payout accounts" });
  }
});

// Approve/decline transaction
router.patch("/admin/transactions/:id/approve", requireAuth, requireRole(["admin"]), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { action, adminNotes } = req.body;

    if (!action || !['approve', 'decline'].includes(action)) {
      return res.status(400).json({ success: false, error: "Invalid action" });
    }

    const status = action === 'approve' ? 'completed' : 'cancelled';

    await db
      .update(transactions)
      .set({
        status: status as any,
        adminNotes,
        processedBy: req.user!.id,
        processedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(transactions.id, id));

    res.json({ success: true, message: `Transaction ${action}d successfully` });
  } catch (error) {
    console.error("Error processing transaction:", error);
    res.status(500).json({ success: false, error: "Failed to process transaction" });
  }
});

// Verify/decline payout account
router.patch("/admin/payout-accounts/:id/verify", requireAuth, requireRole(["admin"]), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body;

    if (!action || !['approve', 'decline'].includes(action)) {
      return res.status(400).json({ success: false, error: "Invalid action" });
    }

    if (action === 'approve') {
      await db
        .update(payoutAccounts)
        .set({
          isVerified: true,
          verifiedAt: new Date(),
          verifiedBy: req.user!.id,
          updatedAt: new Date(),
        })
        .where(eq(payoutAccounts.id, id));

      res.json({ success: true, message: "Payout account verified successfully" });
    } else {
      // Delete the account if declined
      await db
        .delete(payoutAccounts)
        .where(eq(payoutAccounts.id, id));

      res.json({ success: true, message: "Payout account declined and removed" });
    }
  } catch (error) {
    console.error("Error verifying payout account:", error);
    res.status(500).json({ success: false, error: "Failed to verify payout account" });
  }
});

export default router;
