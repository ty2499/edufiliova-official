import { Express } from 'express';
import { db } from '../db';
import { 
  orders, 
  orderItems,
  products,
  transactions, 
  creatorEarningEvents, 
  creatorBalances,
  userBalances,
  profiles,
  users,
  shopCustomers,
  userSubscriptions,
  pricingPlans,
  payments,
  shopMemberships,
  manualPlanAssignments
} from '@shared/schema';
import { eq, desc, and, sql, or } from 'drizzle-orm';
import { requireAuth, requireAdmin, type AuthenticatedRequest } from '../middleware/auth.js';

export function registerFinancialStatsRoutes(app: Express) {
  
  // Get comprehensive financial statistics for admin dashboard
  app.get('/api/admin/financial-stats', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      // Get all completed orders (paid, delivered, processing, shipped)
      const completedOrders = await db
        .select({
          id: orders.id,
          totalAmount: orders.totalAmount,
          status: orders.status,
          userId: orders.userId,
          sellerId: orders.sellerId,
          createdAt: orders.createdAt,
        })
        .from(orders)
        .where(
          or(
            eq(orders.status, 'paid'),
            eq(orders.status, 'delivered'),
            eq(orders.status, 'processing'),
            eq(orders.status, 'shipped')
          )
        );

      // Calculate total revenue
      const totalRevenue = completedOrders.reduce((sum, order) => {
        return sum + parseFloat(order.totalAmount || '0');
      }, 0);

      // Calculate platform commission (35%) and creator earnings (65%)
      const platformCommission = totalRevenue * 0.35;
      const totalCreatorEarnings = totalRevenue * 0.65;
      
      // Get wallet balances from userBalances table (creator earnings system)
      const userBalancesTotal = await db
        .select({
          total: sql<string>`COALESCE(SUM(CAST(available_balance AS NUMERIC)), 0)`,
        })
        .from(userBalances);
      
      // Get wallet balances from shopCustomers table (shop wallet system)
      const shopWalletsTotal = await db
        .select({
          total: sql<string>`COALESCE(SUM(CAST(wallet_balance AS NUMERIC)), 0)`,
        })
        .from(shopCustomers);
      
      // Combine both wallet systems - all money in wallets is platform's money
      const userBalancesAmount = parseFloat(userBalancesTotal[0]?.total || '0');
      const shopWalletsAmount = parseFloat(shopWalletsTotal[0]?.total || '0');
      const totalWalletBalance = userBalancesAmount + shopWalletsAmount;
      const totalPlatformRevenue = platformCommission + totalWalletBalance;

      // Get detailed wallet balances from userBalances (creator earnings system)
      const userBalancesWallets = await db
        .select({
          userId: userBalances.userId,
          userName: profiles.name,
          userEmail: profiles.email,
          userRole: profiles.role,
          availableBalance: userBalances.availableBalance,
          totalEarnings: userBalances.totalEarnings,
          walletType: sql<string>`'earnings'`,
        })
        .from(userBalances)
        .innerJoin(profiles, eq(userBalances.userId, profiles.userId))
        .where(sql`CAST(${userBalances.availableBalance} AS NUMERIC) > 0`)
        .orderBy(desc(userBalances.availableBalance));

      // Get detailed wallet balances from shopCustomers (shop wallet system)
      const shopWallets = await db
        .select({
          userId: shopCustomers.userId,
          userName: shopCustomers.fullName,
          userEmail: shopCustomers.email,
          userRole: profiles.role,
          availableBalance: shopCustomers.walletBalance,
          totalEarnings: sql<string>`'0.00'`,
          walletType: sql<string>`'shop'`,
        })
        .from(shopCustomers)
        .leftJoin(profiles, eq(shopCustomers.userId, profiles.userId))
        .where(sql`CAST(${shopCustomers.walletBalance} AS NUMERIC) > 0`)
        .orderBy(desc(shopCustomers.walletBalance));

      // Combine both wallet systems and sort by balance
      const userWallets = [...userBalancesWallets, ...shopWallets]
        .sort((a, b) => parseFloat(b.availableBalance || '0') - parseFloat(a.availableBalance || '0'))
        .slice(0, 100);

      // Group wallet balances by role (includes both earnings and shop wallets)
      const walletsByRole = {
        student: 0,
        freelancer: 0,
        teacher: 0,
        admin: 0,
        general: 0,
        other: 0,
      };
      
      // Add userBalances wallets
      userBalancesWallets.forEach(wallet => {
        const balance = parseFloat(wallet.availableBalance || '0');
        const role = wallet.userRole || 'other';
        if (role in walletsByRole) {
          walletsByRole[role as keyof typeof walletsByRole] += balance;
        } else {
          walletsByRole.other += balance;
        }
      });
      
      // Add shop wallets
      shopWallets.forEach(wallet => {
        const balance = parseFloat(wallet.availableBalance || '0');
        const role = wallet.userRole || 'other';
        if (role in walletsByRole) {
          walletsByRole[role as keyof typeof walletsByRole] += balance;
        } else {
          walletsByRole.other += balance;
        }
      });

      // Get all transactions count
      const transactionCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(transactions);

      // Get pending payouts (pending debit transactions)
      const pendingPayouts = await db
        .select({
          count: sql<number>`count(*)`,
          total: sql<string>`COALESCE(sum(CAST(amount AS NUMERIC)), 0)`,
        })
        .from(transactions)
        .where(
          and(
            eq(transactions.type, 'debit'),
            eq(transactions.status, 'pending')
          )
        );

      // Get active users (users with balances > 0)
      const activeUsers = await db
        .select({ count: sql<number>`count(*)` })
        .from(userBalances)
        .where(sql`CAST(available_balance AS NUMERIC) > 0`);

      // Get top earners by joining through users table properly
      // userBalances.userId is UUID, profiles.userId is also UUID
      const topEarnersRaw = await db
        .select({
          userId: userBalances.userId,
          totalEarnings: userBalances.totalEarnings,
          availableBalance: userBalances.availableBalance,
          profileId: profiles.id,
          userName: profiles.name,
          userEmail: profiles.email,
          userRole: profiles.role,
          avatarUrl: profiles.avatarUrl,
        })
        .from(userBalances)
        .innerJoin(profiles, eq(userBalances.userId, profiles.userId))
        .where(sql`CAST(${userBalances.totalEarnings} AS NUMERIC) > 0`)
        .orderBy(desc(userBalances.totalEarnings))
        .limit(50); // Get top 50 to calculate totals

      // Count transactions per user
      const transactionCounts = await db
        .select({
          userId: transactions.userId,
          count: sql<number>`count(*)`,
        })
        .from(transactions)
        .groupBy(transactions.userId);

      const transactionCountMap = new Map(
        transactionCounts.map(tc => [tc.userId, parseInt(tc.count as any)])
      );

      // Calculate freelancer and teacher earnings from ALL earners (not just top 10)
      const freelancerEarnings = topEarnersRaw
        .filter(e => e.userRole === 'freelancer')
        .reduce((sum, e) => sum + parseFloat(e.totalEarnings || '0'), 0);

      const teacherEarnings = topEarnersRaw
        .filter(e => e.userRole === 'teacher')
        .reduce((sum, e) => sum + parseFloat(e.totalEarnings || '0'), 0);

      // Format top freelancers for the dashboard (top 10 only)
      const topFreelancers = topEarnersRaw.slice(0, 10).map(earner => ({
        userId: earner.userId,
        name: earner.userName || 'Unknown',
        email: earner.userEmail || '',
        totalEarnings: parseFloat(earner.totalEarnings || '0'),
        transactionCount: transactionCountMap.get(earner.userId) || 0,
      }));

      // Get recent transactions
      const recentTransactions = await db
        .select({
          id: transactions.id,
          userId: transactions.userId,
          type: transactions.type,
          amount: transactions.amount,
          status: transactions.status,
          description: transactions.description,
          createdAt: transactions.createdAt,
          method: transactions.method,
          profileUserId: profiles.userId,
          userName: profiles.name,
          userEmail: profiles.email,
          userRole: profiles.role,
        })
        .from(transactions)
        .innerJoin(profiles, eq(transactions.userId, profiles.userId))
        .orderBy(desc(transactions.createdAt))
        .limit(20);

      // Return data in the exact shape the dashboard expects
      res.json({
        success: true,
        stats: {
          totalTransactions: parseInt(transactionCount[0]?.count as any || '0'),
          totalVolume: totalRevenue,
          totalRevenue: totalRevenue,
          platformCommission: platformCommission,
          totalWalletBalance: totalWalletBalance,
          totalPlatformRevenue: totalPlatformRevenue,
          walletsByRole: walletsByRole,
          userWallets: userWallets.map(w => ({
            userId: w.userId,
            userName: w.userName || 'Unknown',
            userEmail: w.userEmail || '',
            userRole: w.userRole || 'unknown',
            availableBalance: parseFloat(w.availableBalance || '0'),
            totalEarnings: parseFloat(w.totalEarnings || '0'),
            walletType: w.walletType || 'earnings',
          })),
          freelancerEarnings: freelancerEarnings,
          teacherEarnings: teacherEarnings,
          pendingPayouts: parseInt(pendingPayouts[0]?.count as any || '0'),
          activeUsers: parseInt(activeUsers[0]?.count as any || '0'),
          completedOrders: completedOrders.length,
          topFreelancers: topFreelancers,
          recentTransactions: recentTransactions.map(tx => ({
            id: tx.id,
            userId: tx.userId,
            userName: tx.userName || 'Unknown',
            userEmail: tx.userEmail || '',
            userRole: tx.userRole || '',
            type: tx.type,
            amount: tx.amount,
            status: tx.status,
            method: tx.method,
            description: tx.description,
            createdAt: tx.createdAt,
          })),
        },
      });
    } catch (error) {
      console.error('Error fetching financial stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch financial statistics',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Helper function to recalculate and set creator balances from transactions (deterministic)
  async function reconcileCreatorBalances(
    tx: any,
    sellerId: string
  ) {
    // Calculate ledger totals from ALL transactions
    const totals = await tx.execute(sql`
      SELECT 
        COALESCE(SUM(CASE WHEN type = 'credit' AND status = 'completed' THEN amount::numeric ELSE 0 END), 0) as total_credits,
        COALESCE(SUM(CASE WHEN type = 'debit' AND status = 'completed' THEN amount::numeric ELSE 0 END), 0) as total_debits,
        COALESCE(SUM(CASE WHEN type = 'debit' AND status = 'pending' THEN amount::numeric ELSE 0 END), 0) as pending_debits
      FROM transactions
      WHERE user_id = ${sellerId}
    `);

    const totalCredits = totals.rows[0]?.total_credits || '0';
    const totalDebits = totals.rows[0]?.total_debits || '0';
    const pendingDebits = totals.rows[0]?.pending_debits || '0';

    // Calculate derived balances
    const available = (parseFloat(totalCredits) - parseFloat(totalDebits) - parseFloat(pendingDebits)).toFixed(2);
    const lifetimeEarnings = totalCredits;
    const totalWithdrawn = totalDebits;
    const pendingPayouts = pendingDebits;

    // Set userBalances to absolute expected values
    await tx.execute(sql`
      INSERT INTO user_balances (
        user_id, available_balance, total_earnings, total_withdrawn, pending_payouts, last_updated, created_at
      ) VALUES (
        ${sellerId}, ${available}, ${lifetimeEarnings}, ${totalWithdrawn}, ${pendingPayouts}, NOW(), NOW()
      )
      ON CONFLICT (user_id) DO UPDATE SET
        available_balance = ${available},
        total_earnings = ${lifetimeEarnings},
        total_withdrawn = ${totalWithdrawn},
        pending_payouts = ${pendingPayouts},
        last_updated = NOW()
    `);

    // Set creatorBalances to absolute expected values
    await tx.execute(sql`
      INSERT INTO creator_balances (
        creator_id, available_balance, pending_balance, lifetime_earnings, total_withdrawn, created_at, updated_at
      ) VALUES (
        ${sellerId}, ${available}, ${pendingPayouts}, ${lifetimeEarnings}, ${totalWithdrawn}, NOW(), NOW()
      )
      ON CONFLICT (creator_id) DO UPDATE SET
        available_balance = ${available},
        pending_balance = ${pendingPayouts},
        lifetime_earnings = ${lifetimeEarnings},
        total_withdrawn = ${totalWithdrawn},
        updated_at = NOW()
    `);
  }

  // Helper function to apply full creator credit (transaction + balance reconciliation)
  async function applyCreatorCredit(
    tx: any,
    sellerId: string,
    creatorAmount: string,
    productName: string,
    productId: string,
    orderId: string,
    orderTimestamp: Date
  ) {
    // Create unique reference by combining orderId and productId to handle multiple items
    const uniqueReference = `${orderId}:${productId}`;
    
    // Check if transaction already exists
    const existing = await tx
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, sellerId),
          eq(transactions.reference, uniqueReference)
        )
      )
      .limit(1);

    let created = false;
    // Only create transaction if it doesn't exist
    if (existing.length === 0) {
      await tx.insert(transactions).values({
        userId: sellerId,
        type: 'credit',
        amount: creatorAmount,
        status: 'completed',
        description: `Earnings from ${productName} (Order #${orderId.substring(0, 8)})`,
        reference: uniqueReference,
        createdAt: orderTimestamp,
      });
      created = true;
    }

    // Always reconcile balances from transaction ledger (deterministic)
    await reconcileCreatorBalances(tx, sellerId);
    
    // Return whether we created a new transaction
    return created;
  }

  // Auto-generate earning events and balances from existing orders
  app.post('/api/admin/sync-earnings', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      // Get all completed orders
      const completedOrders = await db
        .select({
          id: orders.id,
          status: orders.status,
          createdAt: orders.createdAt,
        })
        .from(orders)
        .where(
          or(
            eq(orders.status, 'paid'),
            eq(orders.status, 'delivered')
          )
        );

      // Item-level metrics
      let itemsProcessed = 0;
      let itemsCreated = 0;
      let itemsRebalanced = 0;
      let itemsSkippedAdmin = 0;
      let itemsSkippedDuplicate = 0;
      const errors: string[] = [];

      // Process each order
      for (const order of completedOrders) {
        try {
          await db.transaction(async (tx) => {
            // Get all order items with product and seller details
            const itemsWithProducts = await tx
              .select({
                item: orderItems,
                product: products,
                sellerProfile: profiles
              })
              .from(orderItems)
              .leftJoin(products, eq(orderItems.productId, products.id))
              .leftJoin(users, eq(products.sellerId, users.id))
              .leftJoin(profiles, eq(users.id, profiles.userId))
              .where(eq(orderItems.orderId, order.id));

            if (itemsWithProducts.length === 0) {
              return;
            }

            // Process each product in the order
            for (const { item, product, sellerProfile } of itemsWithProducts) {
              if (!product || !product.sellerId) continue;
              
              // Determine creator role with complete fallback hierarchy
              const creatorRole = (sellerProfile?.role ?? product.sellerRole ?? 'freelancer') as 'freelancer' | 'teacher' | 'admin';
              
              // Skip admin-owned products
              if (creatorRole === 'admin') {
                itemsSkippedAdmin++;
                continue;
              }

              const saleAmount = parseFloat(item.totalPrice);
              const PLATFORM_COMMISSION_RATE = 0.25;
              
              // Calculate commission split
              const grossCents = Math.round(saleAmount * 100);
              const platformCommissionCents = Math.round(grossCents * PLATFORM_COMMISSION_RATE);
              const creatorAmountCents = grossCents - platformCommissionCents;
              const creatorAmount = (creatorAmountCents / 100).toFixed(2);
              const platformCommission = (platformCommissionCents / 100).toFixed(2);

              // Check if earning event already exists for this specific item
              const existingEvent = await tx
                .select()
                .from(creatorEarningEvents)
                .where(
                  and(
                    eq(creatorEarningEvents.orderId, order.id),
                    eq(creatorEarningEvents.sourceId, product.id)
                  )
                )
                .limit(1);

              // If earning event exists, ensure transaction and balances are correct
              if (existingEvent.length > 0) {
                // Apply creator credit (idempotent - includes product ID for uniqueness)
                // Always reconciles balances from transaction ledger
                const created = await applyCreatorCredit(
                  tx,
                  product.sellerId,
                  creatorAmount,
                  product.name,
                  product.id,
                  order.id,
                  order.createdAt || new Date()
                );

                if (created) {
                  itemsRebalanced++;
                  itemsProcessed++;
                } else {
                  itemsSkippedDuplicate++;
                }
              } else {
                // Create new earning event
                await tx.insert(creatorEarningEvents).values({
                  creatorId: product.sellerId,
                  creatorRole: creatorRole,
                  eventType: 'product_sale',
                  sourceType: 'product',
                  sourceId: product.id,
                  orderId: order.id,
                  grossAmount: saleAmount.toFixed(2),
                  platformCommission: platformCommission,
                  creatorAmount: creatorAmount,
                  status: 'available',
                  metadata: {
                    productName: product.name,
                    salePrice: saleAmount
                  },
                  eventDate: order.createdAt || new Date(),
                });

                // Apply creator credit (transaction + balances)
                await applyCreatorCredit(
                  tx,
                  product.sellerId,
                  creatorAmount,
                  product.name,
                  product.id,
                  order.id,
                  order.createdAt || new Date()
                );

                // Increment sales count
                await tx
                  .update(products)
                  .set({ 
                    salesCount: sql`${products.salesCount} + ${item.quantity}` 
                  })
                  .where(eq(products.id, product.id));

                itemsCreated++;
                itemsProcessed++;
              }
            }
          });
        } catch (txError) {
          errors.push(`Error processing order ${order.id}: ${txError instanceof Error ? txError.message : 'Unknown'}`);
          console.error(`Error processing order ${order.id}:`, txError);
        }
      }

      res.json({
        success: true,
        message: `Processed ${itemsProcessed} items: ${itemsCreated} created, ${itemsRebalanced} rebalanced, ${itemsSkippedAdmin} admin, ${itemsSkippedDuplicate} duplicate`,
        itemsProcessed,
        itemsCreated,
        itemsRebalanced,
        itemsSkippedAdmin,
        itemsSkippedDuplicate,
        errors: errors.length > 0 ? errors : undefined,
      });
    } catch (error) {
      console.error('Error syncing earnings:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to sync earnings',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

}
