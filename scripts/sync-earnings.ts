import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../shared/schema';
import { eq, desc, and, sql, or } from 'drizzle-orm';

const { orders, orderItems, products, transactions, creatorEarningEvents, profiles, users } = schema;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is required");
}

const client = postgres(connectionString);
const db = drizzle(client, { schema });

async function reconcileCreatorBalances(
  tx: any,
  sellerId: string
) {
  const totals = await tx.execute(sql`
    SELECT 
      COALESCE(SUM(CASE WHEN type = 'credit' AND status = 'completed' THEN amount::numeric ELSE 0 END), 0) as total_credits,
      COALESCE(SUM(CASE WHEN type = 'debit' AND status = 'completed' THEN amount::numeric ELSE 0 END), 0) as total_debits,
      COALESCE(SUM(CASE WHEN type = 'debit' AND status = 'pending' THEN amount::numeric ELSE 0 END), 0) as pending_debits
    FROM transactions
    WHERE user_id = ${sellerId}
  `);

  const result = Array.isArray(totals) ? totals[0] : (totals.rows ? totals.rows[0] : totals[0]);
  const totalCredits = result?.total_credits || '0';
  const totalDebits = result?.total_debits || '0';
  const pendingDebits = result?.pending_debits || '0';

  const available = (parseFloat(totalCredits) - parseFloat(totalDebits) - parseFloat(pendingDebits)).toFixed(2);
  const lifetimeEarnings = totalCredits;
  const totalWithdrawn = totalDebits;
  const pendingPayouts = pendingDebits;

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

async function applyCreatorCredit(
  tx: any,
  sellerId: string,
  creatorAmount: string,
  productName: string,
  productId: string,
  orderId: string,
  orderTimestamp: Date
) {
  const uniqueReference = `${orderId}:${productId}`;
  
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

  await reconcileCreatorBalances(tx, sellerId);
  
  return created;
}

async function syncEarnings() {
  try {
    console.log('🔄 Starting earnings sync...');
    
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
          eq(orders.status, 'delivered'),
          eq(orders.status, 'processing'),
          eq(orders.status, 'shipped')
        )
      );

    console.log(`📦 Found ${completedOrders.length} completed orders to process`);

    let itemsProcessed = 0;
    let itemsCreated = 0;
    let itemsRebalanced = 0;
    let itemsSkippedAdmin = 0;
    let itemsSkippedDuplicate = 0;
    const errors: string[] = [];

    for (const order of completedOrders) {
      try {
        await db.transaction(async (tx) => {
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

          for (const { item, product, sellerProfile } of itemsWithProducts) {
            if (!product || !product.sellerId) continue;
            
            const creatorRole = (sellerProfile?.role ?? product.sellerRole ?? 'freelancer') as 'freelancer' | 'teacher' | 'admin';
            
            if (creatorRole === 'admin') {
              itemsSkippedAdmin++;
              continue;
            }

            const saleAmount = parseFloat(item.totalPrice);
            const PLATFORM_COMMISSION_RATE = 0.35;
            
            const grossCents = Math.round(saleAmount * 100);
            const platformCommissionCents = Math.round(grossCents * PLATFORM_COMMISSION_RATE);
            const creatorAmountCents = grossCents - platformCommissionCents;
            const creatorAmount = (creatorAmountCents / 100).toFixed(2);
            const platformCommission = (platformCommissionCents / 100).toFixed(2);

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

            if (existingEvent.length > 0) {
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

              await applyCreatorCredit(
                tx,
                product.sellerId,
                creatorAmount,
                product.name,
                product.id,
                order.id,
                order.createdAt || new Date()
              );

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
        console.error(`❌ Error processing order ${order.id}:`, txError);
      }
    }

    console.log('\n✅ Sync Complete!');
    console.log(`📊 Processed ${itemsProcessed} items`);
    console.log(`✨ Created: ${itemsCreated}`);
    console.log(`🔄 Rebalanced: ${itemsRebalanced}`);
    console.log(`⏭️  Skipped (admin): ${itemsSkippedAdmin}`);
    console.log(`⏭️  Skipped (duplicate): ${itemsSkippedDuplicate}`);
    
    if (errors.length > 0) {
      console.log('\n⚠️  Errors encountered:');
      errors.forEach(err => console.log(`  - ${err}`));
    }

    await client.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error syncing earnings:', error);
    await client.end();
    process.exit(1);
  }
}

syncEarnings();
