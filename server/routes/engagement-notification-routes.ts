import { Router, Request, Response } from 'express';
import { db } from '../db';
import { emailNotificationLogs, userActivityTracking } from '@shared/schema';
import { desc, eq, and, sql, gte, lte, count } from 'drizzle-orm';
import { notificationScheduler } from '../services/notification-scheduler';
import { activityTracker } from '../services/activity-tracker';

const router = Router();

router.get('/engagement-notifications/logs', async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '50', type, status, startDate, endDate } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    let conditions = [];
    
    if (type) {
      conditions.push(eq(emailNotificationLogs.notificationType, type as any));
    }
    if (status) {
      conditions.push(eq(emailNotificationLogs.status, status as any));
    }
    if (startDate) {
      conditions.push(gte(emailNotificationLogs.createdAt, new Date(startDate as string)));
    }
    if (endDate) {
      conditions.push(lte(emailNotificationLogs.createdAt, new Date(endDate as string)));
    }

    const [logs, totalResult] = await Promise.all([
      db.select()
        .from(emailNotificationLogs)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(emailNotificationLogs.createdAt))
        .limit(limitNum)
        .offset(offset),
      db.select({ count: count() })
        .from(emailNotificationLogs)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
    ]);

    res.json({
      success: true,
      data: logs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalResult[0]?.count || 0,
        totalPages: Math.ceil((totalResult[0]?.count || 0) / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching notification logs:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch notification logs' });
  }
});

router.get('/engagement-notifications/stats', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    
    let dateConditions = [];
    if (startDate) {
      dateConditions.push(gte(emailNotificationLogs.createdAt, new Date(startDate as string)));
    }
    if (endDate) {
      dateConditions.push(lte(emailNotificationLogs.createdAt, new Date(endDate as string)));
    }

    const statsQuery = db.select({
      notificationType: emailNotificationLogs.notificationType,
      status: emailNotificationLogs.status,
      count: count()
    })
      .from(emailNotificationLogs)
      .where(dateConditions.length > 0 ? and(...dateConditions) : undefined)
      .groupBy(emailNotificationLogs.notificationType, emailNotificationLogs.status);

    const stats = await statsQuery;

    const summary: Record<string, { sent: number; failed: number; skipped: number; queued: number }> = {};
    
    for (const stat of stats) {
      if (!summary[stat.notificationType]) {
        summary[stat.notificationType] = { sent: 0, failed: 0, skipped: 0, queued: 0 };
      }
      summary[stat.notificationType][stat.status as 'sent' | 'failed' | 'skipped' | 'queued'] = stat.count;
    }

    const totals = {
      sent: stats.filter(s => s.status === 'sent').reduce((sum, s) => sum + s.count, 0),
      failed: stats.filter(s => s.status === 'failed').reduce((sum, s) => sum + s.count, 0),
      skipped: stats.filter(s => s.status === 'skipped').reduce((sum, s) => sum + s.count, 0),
      queued: stats.filter(s => s.status === 'queued').reduce((sum, s) => sum + s.count, 0),
    };

    res.json({
      success: true,
      data: {
        byType: summary,
        totals
      }
    });
  } catch (error) {
    console.error('Error fetching notification stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch notification stats' });
  }
});

router.get('/engagement-notifications/scheduler-status', async (req: Request, res: Response) => {
  try {
    const status = notificationScheduler.getStatus();
    res.json({ success: true, data: status });
  } catch (error) {
    console.error('Error getting scheduler status:', error);
    res.status(500).json({ success: false, error: 'Failed to get scheduler status' });
  }
});

router.post('/engagement-notifications/run-now', async (req: Request, res: Response) => {
  try {
    const results = await notificationScheduler.runNow();
    res.json({ success: true, data: results });
  } catch (error) {
    console.error('Error running notifications:', error);
    res.status(500).json({ success: false, error: 'Failed to run notifications' });
  }
});

router.get('/engagement-notifications/user-activity/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const activity = await activityTracker.getUserActivity(userId);
    
    if (!activity) {
      return res.status(404).json({ success: false, error: 'User activity not found' });
    }

    res.json({ success: true, data: activity });
  } catch (error) {
    console.error('Error fetching user activity:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch user activity' });
  }
});

router.get('/engagement-notifications/activity-summary', async (req: Request, res: Response) => {
  try {
    const summary = await db.select({
      role: userActivityTracking.role,
      totalUsers: count(),
      avgLessonsCompleted: sql<number>`AVG(${userActivityTracking.lessonsCompletedCount})`,
      avgDownloads: sql<number>`AVG(${userActivityTracking.downloadsCount})`,
      avgContentCreated: sql<number>`AVG(${userActivityTracking.contentCreatedCount})`,
    })
      .from(userActivityTracking)
      .groupBy(userActivityTracking.role);

    res.json({ success: true, data: summary });
  } catch (error) {
    console.error('Error fetching activity summary:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch activity summary' });
  }
});

export default router;
