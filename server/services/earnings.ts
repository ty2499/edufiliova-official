import { db } from "../db";
import { 
  creatorEarningEvents, 
  creatorBalances, 
  productDownloadStats, 
  productDownloadEvents,
  products,
  courses,
  profiles,
  settlementRuns
} from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";

// Constants
const PLATFORM_COMMISSION_RATE = 0.35; // 35%
const FREE_DOWNLOAD_MILESTONE = 50; // Every 50 downloads
const FREE_DOWNLOAD_REWARD_CENTS = 50; // $0.50 per milestone (50 cents)
const MINIMUM_PAYOUT_AMOUNT_CENTS = 5000; // $50 minimum withdrawal (5000 cents)

/**
 * Convert dollars to cents (integer) to avoid floating point errors
 */
function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/**
 * Convert cents to dollars (string with 2 decimals)
 */
function centsToDollars(cents: number): string {
  return (cents / 100).toFixed(2);
}

/**
 * Check if a product/course is system-created (revenue goes to platform)
 */
async function isSystemCreated(sourceId: string, sourceType: 'product' | 'course'): Promise<boolean> {
  try {
    if (sourceType === 'product') {
      const [product] = await db.select()
        .from(products)
        .where(eq(products.id, sourceId));
      
      // Check if seller role is admin (system content)
      return product?.sellerRole === 'admin';
    } else if (sourceType === 'course') {
      const [course] = await db.select()
        .from(courses)
        .where(eq(courses.id, sourceId));
      
      // Check if instructor is null or system-created
      return !course?.instructorId;
    }
  } catch (error) {
    console.error('Error checking if content is system-created:', error);
  }
  return false;
}

/**
 * Record earnings from a product sale
 */
export async function recordProductSaleEarning(params: {
  sellerId: string;
  sellerRole: 'freelancer' | 'teacher' | 'admin';
  productId: string;
  orderId: string;
  saleAmount: number;
  productName: string;
}) {
  const { sellerId, sellerRole, productId, orderId, saleAmount, productName } = params;

  // Check if this product is system-created
  const systemCreated = await isSystemCreated(productId, 'product');
  if (systemCreated) {
    console.log(`Product ${productName} is system-created. Revenue goes to platform.`);
    return null;
  }

  // Calculate commission split using integer cents (prevents rounding errors)
  const grossCents = dollarsToCents(saleAmount);
  const platformCommissionCents = Math.round(grossCents * PLATFORM_COMMISSION_RATE);
  const creatorAmountCents = grossCents - platformCommissionCents; // Ensure perfect reconciliation

  // Create earning event (status: pending until moved to available on 5th of month)
  const [earningEvent] = await db.insert(creatorEarningEvents).values({
    creatorId: sellerId,
    creatorRole: sellerRole,
    eventType: 'product_sale',
    sourceType: 'product',
    sourceId: productId,
    orderId: orderId,
    grossAmount: centsToDollars(grossCents),
    platformCommission: centsToDollars(platformCommissionCents),
    creatorAmount: centsToDollars(creatorAmountCents),
    status: 'pending', // Pending until processed on 5th of month
    metadata: {
      productName,
      salePrice: saleAmount
    }
  }).returning();

  // Update creator balance - add to PENDING balance (not available yet)
  await updateCreatorPendingBalance(sellerId, creatorAmountCents);

  console.log(`✅ Recorded earning: ${sellerRole} ${sellerId} earned $${centsToDollars(creatorAmountCents)} from product "${productName}" (pending)`);
  
  return earningEvent;
}

/**
 * Record earnings from a course sale
 */
export async function recordCourseSaleEarning(params: {
  teacherId: string;
  courseId: string;
  orderId: string;
  saleAmount: number;
  courseName: string;
}) {
  const { teacherId, courseId, orderId, saleAmount, courseName } = params;

  // Check if this course is system-created
  const systemCreated = await isSystemCreated(courseId, 'course');
  if (systemCreated) {
    console.log(`Course ${courseName} is system-created. Revenue goes to platform.`);
    return null;
  }

  // Calculate commission split using integer cents
  const grossCents = dollarsToCents(saleAmount);
  const platformCommissionCents = Math.round(grossCents * PLATFORM_COMMISSION_RATE);
  const creatorAmountCents = grossCents - platformCommissionCents;

  // Create earning event
  const [earningEvent] = await db.insert(creatorEarningEvents).values({
    creatorId: teacherId,
    creatorRole: 'teacher',
    eventType: 'course_sale',
    sourceType: 'course',
    sourceId: courseId,
    orderId: orderId,
    grossAmount: centsToDollars(grossCents),
    platformCommission: centsToDollars(platformCommissionCents),
    creatorAmount: centsToDollars(creatorAmountCents),
    status: 'pending', // Pending until processed on 5th of month
    metadata: {
      courseName,
      salePrice: saleAmount
    }
  }).returning();

  // Update creator balance - add to pending balance
  await updateCreatorPendingBalance(teacherId, creatorAmountCents);

  console.log(`✅ Recorded earning: Teacher ${teacherId} earned $${centsToDollars(creatorAmountCents)} from course "${courseName}" (pending)`);
  
  return earningEvent;
}

/**
 * Track a product download with transaction safety
 */
export async function trackProductDownload(params: {
  productId: string;
  userId: string;
  downloadType: 'free' | 'paid' | 'subscription';
  orderId?: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  const { productId, userId, downloadType, orderId, ipAddress, userAgent } = params;

  // Use database transaction to prevent race conditions
  await db.transaction(async (tx) => {
    // Record download event
    await tx.insert(productDownloadEvents).values({
      productId,
      userId,
      downloadType,
      orderId: orderId || null,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null
    });

    // Update stats atomically using SQL
    const [updatedStats] = await tx.execute(sql`
      INSERT INTO product_download_stats (
        product_id, total_downloads, free_downloads, paid_downloads, subscription_downloads,
        downloads_this_week, downloads_this_month, last_download_at, updated_at
      ) VALUES (
        ${productId}, 1, 
        ${downloadType === 'free' ? 1 : 0},
        ${downloadType === 'paid' ? 1 : 0},
        ${downloadType === 'subscription' ? 1 : 0},
        1, 1, NOW(), NOW()
      )
      ON CONFLICT (product_id) DO UPDATE SET
        total_downloads = product_download_stats.total_downloads + 1,
        free_downloads = product_download_stats.free_downloads + ${downloadType === 'free' ? 1 : 0},
        paid_downloads = product_download_stats.paid_downloads + ${downloadType === 'paid' ? 1 : 0},
        subscription_downloads = product_download_stats.subscription_downloads + ${downloadType === 'subscription' ? 1 : 0},
        downloads_this_week = product_download_stats.downloads_this_week + 1,
        downloads_this_month = product_download_stats.downloads_this_month + 1,
        last_download_at = NOW(),
        updated_at = NOW()
      RETURNING *
    `);

    // Check for free download milestone (only for free downloads)
    if (downloadType === 'free' && updatedStats) {
      const newFreeDownloads = Number(updatedStats.free_downloads || 0);
      const lastMilestone = Number(updatedStats.last_milestone_count || 0);
      const nextMilestone = lastMilestone + FREE_DOWNLOAD_MILESTONE;

      // Check if we've hit a new milestone
      if (newFreeDownloads >= nextMilestone) {
        console.log(`🎉 Free download milestone reached! ${newFreeDownloads} downloads for product ${productId}`);
        
        // Get product and seller info
        const [product] = await tx.select()
          .from(products)
          .where(eq(products.id, productId));

        if (product && product.sellerId && product.price === "0.00") {
          // Record milestone earning (no commission on free downloads)
          await tx.insert(creatorEarningEvents).values({
            creatorId: product.sellerId,
            creatorRole: product.sellerRole as 'freelancer' | 'teacher',
            eventType: 'free_download_milestone',
            sourceType: 'product',
            sourceId: productId,
            grossAmount: centsToDollars(FREE_DOWNLOAD_REWARD_CENTS),
            platformCommission: '0.00',
            creatorAmount: centsToDollars(FREE_DOWNLOAD_REWARD_CENTS),
            status: 'pending', // Pending until 5th of month
            metadata: {
              productName: product.name,
              downloadCount: newFreeDownloads,
              milestone: FREE_DOWNLOAD_MILESTONE
            }
          });

          // Update creator balance - add to pending
          await updateCreatorPendingBalance(product.sellerId, FREE_DOWNLOAD_REWARD_CENTS, tx);

          // Update last milestone count atomically
          await tx.execute(sql`
            UPDATE product_download_stats 
            SET last_milestone_count = ${nextMilestone}
            WHERE product_id = ${productId}
          `);

          console.log(`🎉 Milestone earning: ${product.sellerRole} ${product.sellerId} earned $${centsToDollars(FREE_DOWNLOAD_REWARD_CENTS)} for ${newFreeDownloads} free downloads`);
        }
      }
    }
  });

  console.log(`📥 Tracked ${downloadType} download for product ${productId} by user ${userId}`);
}

/**
 * Update creator pending balance (earnings await 5th of month processing)
 * This ensures creator_balances row is always created when first earning is recorded
 */
async function updateCreatorPendingBalance(creatorId: string, amountCents: number, transaction?: any) {
  const tx = transaction || db;
  
  // Use upsert to handle first-time creators
  // On first insert: pending gets the amount, lifetime gets the amount
  // On update: both pending and lifetime increase by the amount
  await tx.execute(sql`
    INSERT INTO creator_balances (
      creator_id, available_balance, pending_balance, lifetime_earnings, total_withdrawn, next_payout_date, created_at, updated_at
    ) VALUES (
      ${creatorId}, 0.00, ${centsToDollars(amountCents)}, ${centsToDollars(amountCents)}, 0.00, ${getNextPayoutDate()}, NOW(), NOW()
    )
    ON CONFLICT (creator_id) DO UPDATE SET
      pending_balance = creator_balances.pending_balance::numeric + ${centsToDollars(amountCents)}::numeric,
      lifetime_earnings = creator_balances.lifetime_earnings::numeric + ${centsToDollars(amountCents)}::numeric,
      updated_at = NOW()
  `);
  
  console.log(`💰 Updated pending balance for creator ${creatorId}: +$${centsToDollars(amountCents)} (now pending processing on 5th)`);
}

/**
 * Get the next payout date (5th of next month)
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
 * Get creator balance
 */
export async function getCreatorBalance(creatorId: string) {
  const [balance] = await db.select()
    .from(creatorBalances)
    .where(eq(creatorBalances.creatorId, creatorId));

  if (!balance) {
    // Return default balance
    return {
      creatorId,
      availableBalance: '0.00',
      pendingBalance: '0.00',
      lifetimeEarnings: '0.00',
      totalWithdrawn: '0.00',
      nextPayoutDate: getNextPayoutDate()
    };
  }

  return balance;
}

/**
 * Get creator earning events
 */
export async function getCreatorEarnings(creatorId: string, limit: number = 50) {
  const earnings = await db.select()
    .from(creatorEarningEvents)
    .where(eq(creatorEarningEvents.creatorId, creatorId))
    .orderBy(sql`${creatorEarningEvents.eventDate} DESC`)
    .limit(limit);

  return earnings;
}

/**
 * Check if creator can withdraw (minimum $50)
 */
export function canRequestPayout(availableBalance: string): boolean {
  const balanceCents = dollarsToCents(parseFloat(availableBalance));
  return balanceCents >= MINIMUM_PAYOUT_AMOUNT_CENTS;
}

/**
 * Move pending earnings to available balance (called on 5th of month)
 */
export async function processMonthlyEarnings(creatorId: string) {
  await db.transaction(async (tx) => {
    // Get pending earnings
    const [balance] = await tx.select()
      .from(creatorBalances)
      .where(eq(creatorBalances.creatorId, creatorId));

    if (!balance || parseFloat(balance.pendingBalance) === 0) {
      return;
    }

    // Move pending to available
    await tx.execute(sql`
      UPDATE creator_balances 
      SET 
        available_balance = available_balance::numeric + pending_balance::numeric,
        pending_balance = 0.00,
        last_payout_date = NOW(),
        next_payout_date = ${getNextPayoutDate()},
        updated_at = NOW()
      WHERE creator_id = ${creatorId}
    `);

    // Update earning events status from pending to available
    await tx.execute(sql`
      UPDATE creator_earning_events 
      SET status = 'available'
      WHERE creator_id = ${creatorId} AND status = 'pending'
    `);

    console.log(`💰 Processed monthly earnings for creator ${creatorId}: $${balance.pendingBalance} moved to available`);
  });
}

/**
 * Process monthly settlement for ALL creators (called on 5th of month)
 * Moves pending balances to available and automatically creates payout requests for balances > $50
 */
export async function processMonthlySettlementForAll() {
  const startTime = Date.now();
  
  try {
    // Get today's date in YYYY-MM-DD format (UTC)
    const now = new Date();
    const settlementDate = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;
    
    console.log(`🔄 Starting monthly settlement process for ${settlementDate}...`);
    
    // Check if settlement already completed today
    const [existingRun] = await db.select()
      .from(settlementRuns)
      .where(eq(settlementRuns.settlementDate, settlementDate))
      .limit(1);
    
    if (existingRun?.status === 'completed') {
      console.log(`✅ Settlement already completed for ${settlementDate} - skipping`);
      return {
        success: true,
        alreadyRan: true,
        message: 'Settlement already completed today',
        data: existingRun
      };
    }
    
    // Create or update settlement run record
    let settlementRunId: string;
    
    if (existingRun && existingRun.status === 'failed') {
      // Retry failed run
      console.log(`🔄 Retrying failed settlement run from ${existingRun.runAt}`);
      await db.update(settlementRuns)
        .set({ 
          status: 'running', 
          runAt: new Date(),
          errorMessage: null,
          completedAt: null,
          durationMs: null
        })
        .where(eq(settlementRuns.id, existingRun.id));
      settlementRunId = existingRun.id;
    } else if (!existingRun) {
      // Create new run
      const [newRun] = await db.insert(settlementRuns).values({
        settlementDate,
        status: 'running'
      }).returning();
      settlementRunId = newRun.id;
    } else {
      // Another instance is currently running
      console.log(`⏳ Settlement already running for ${settlementDate} - skipping`);
      return {
        success: true,
        alreadyRan: true,
        message: 'Settlement already in progress',
        data: existingRun
      };
    }
    
    // Get all creators with pending balances > 0
    const creatorsWithPending = await db.select()
      .from(creatorBalances)
      .where(sql`pending_balance::numeric > 0`);
    
    console.log(`📊 Found ${creatorsWithPending.length} creators with pending balances`);
    
    let processedCount = 0;
    let autoPayoutCount = 0;
    let totalPendingMoved = 0;
    
    for (const creator of creatorsWithPending) {
      await db.transaction(async (tx) => {
        const pendingAmount = parseFloat(creator.pendingBalance);
        const currentAvailable = parseFloat(creator.availableBalance);
        
        // Move pending to available
        await tx.execute(sql`
          UPDATE creator_balances 
          SET 
            available_balance = available_balance::numeric + pending_balance::numeric,
            pending_balance = 0.00,
            last_payout_date = NOW(),
            next_payout_date = ${getNextPayoutDate()},
            updated_at = NOW()
          WHERE creator_id = ${creator.creatorId}
        `);
        
        // Update earning events status from pending to available
        await tx.execute(sql`
          UPDATE creator_earning_events 
          SET status = 'available'
          WHERE creator_id = ${creator.creatorId} AND status = 'pending'
        `);
        
        const newAvailableBalance = currentAvailable + pendingAmount;
        totalPendingMoved += pendingAmount;
        
        console.log(`✅ Creator ${creator.creatorId}: Moved $${pendingAmount.toFixed(2)} to available (total available: $${newAvailableBalance.toFixed(2)})`);
        processedCount++;
        
        // Auto-create payout if available balance >= $50
        if (newAvailableBalance >= 50) {
          console.log(`💸 Auto-processing payout for creator ${creator.creatorId} (balance: $${newAvailableBalance.toFixed(2)})`);
          
          // Import here to avoid circular dependency
          const { creatorPayoutRequests, payoutAccounts } = await import('@shared/schema');
          
          // Check for existing auto-generated payout today (idempotency)
          const [existingPayout] = await tx.select()
            .from(creatorPayoutRequests)
            .where(and(
              eq(creatorPayoutRequests.creatorId, creator.creatorId),
              eq(creatorPayoutRequests.isAutoGenerated, true),
              sql`DATE(requested_at) = CURRENT_DATE`
            ))
            .limit(1);
          
          if (existingPayout) {
            console.log(`⚠️  Creator ${creator.creatorId} already has an auto-payout today - skipping duplicate`);
            return;
          }
          
          // Get creator's default payout account
          const [defaultAccount] = await tx.select()
            .from(payoutAccounts)
            .where(and(
              eq(payoutAccounts.userId, creator.creatorId),
              eq(payoutAccounts.isDefault, true)
            ))
            .limit(1);
          
          if (defaultAccount) {
            // Create automatic payout request
            await tx.insert(creatorPayoutRequests).values({
              creatorId: creator.creatorId,
              amountRequested: newAvailableBalance.toFixed(2),
              amountApproved: newAvailableBalance.toFixed(2),
              payoutMethod: defaultAccount.type as 'bank' | 'paypal',
              payoutAccountId: defaultAccount.id,
              status: 'completed', // Auto-approve and mark as completed
              paymentReference: `AUTO-PAYOUT-${new Date().getTime()}`,
              requestedAt: new Date(),
              processedAt: new Date(),
              payoutDate: new Date(),
              adminNotes: 'Automatic monthly payout (balance >= $50)',
              isAutoGenerated: true
            });
            
            // Deduct from available balance and add to total withdrawn
            await tx.execute(sql`
              UPDATE creator_balances 
              SET 
                available_balance = 0.00,
                total_withdrawn = total_withdrawn::numeric + ${newAvailableBalance.toFixed(2)}::numeric,
                updated_at = NOW()
              WHERE creator_id = ${creator.creatorId}
            `);
            
            // Update earning events status to paid
            await tx.execute(sql`
              UPDATE creator_earning_events 
              SET status = 'paid'
              WHERE creator_id = ${creator.creatorId} AND status = 'available'
            `);
            
            console.log(`✅ Auto-payout completed for creator ${creator.creatorId}: $${newAvailableBalance.toFixed(2)} marked as paid`);
            autoPayoutCount++;
          } else {
            console.log(`⚠️  Creator ${creator.creatorId} has no default payout account - skipping auto-payout`);
          }
        }
      });
    }
    
    const durationMs = Date.now() - startTime;
    
    // Update settlement run record with completion metrics
    await db.update(settlementRuns)
      .set({
        status: 'completed',
        creatorsProcessed: processedCount,
        autoPayoutsCreated: autoPayoutCount,
        totalPendingMoved: totalPendingMoved.toFixed(2),
        completedAt: new Date(),
        durationMs
      })
      .where(eq(settlementRuns.id, settlementRunId));
    
    console.log(`🎉 Monthly settlement completed! Processed ${processedCount} creators, ${autoPayoutCount} automatic payouts (${durationMs}ms)`);
    
    return {
      success: true,
      processedCount,
      autoPayoutCount,
      totalPendingMoved: totalPendingMoved.toFixed(2),
      durationMs,
      message: `Settlement completed for ${processedCount} creators with ${autoPayoutCount} automatic payouts`
    };
  } catch (error) {
    console.error('❌ Error processing monthly settlement:', error);
    
    // Try to mark settlement as failed if we have the runId
    try {
      const now = new Date();
      const settlementDate = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;
      
      await db.update(settlementRuns)
        .set({
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          durationMs: Date.now() - startTime
        })
        .where(eq(settlementRuns.settlementDate, settlementDate));
    } catch (updateError) {
      console.error('Failed to update settlement run status:', updateError);
    }
    
    throw error;
  }
}
