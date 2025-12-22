import cron from 'node-cron';
import { engagementNotificationService } from './engagement-notifications';

class NotificationScheduler {
  private hourlyTask: cron.ScheduledTask | null = null;
  private dailyTask: cron.ScheduledTask | null = null;
  private isRunning = false;

  start(): void {
    if (this.isRunning) {
      console.log('📅 Notification scheduler already running');
      return;
    }

    this.hourlyTask = cron.schedule('0 * * * *', async () => {
      console.log('⏰ Running hourly engagement notifications...');
      try {
        const incompleteResults = await engagementNotificationService.processIncompleteRegistrations();
        console.log(`📧 Hourly - Incomplete registrations: sent=${incompleteResults.sent}, skipped=${incompleteResults.skipped}`);
      } catch (error) {
        console.error('Error in hourly notification task:', error);
      }
    }, {
      scheduled: true,
      timezone: 'UTC'
    });

    this.dailyTask = cron.schedule('0 9 * * *', async () => {
      console.log('⏰ Running daily engagement notifications...');
      try {
        const results = await engagementNotificationService.runAllRules();
        const totalSent = Object.values(results).reduce((sum, r) => sum + r.sent, 0);
        const totalSkipped = Object.values(results).reduce((sum, r) => sum + r.skipped, 0);
        console.log(`📧 Daily summary: sent=${totalSent}, skipped=${totalSkipped}`);
      } catch (error) {
        console.error('Error in daily notification task:', error);
      }
    }, {
      scheduled: true,
      timezone: 'UTC'
    });

    this.isRunning = true;
    console.log('📅 Notification scheduler started (hourly at :00, daily at 09:00 UTC)');
  }

  stop(): void {
    if (this.hourlyTask) {
      this.hourlyTask.stop();
      this.hourlyTask = null;
    }
    if (this.dailyTask) {
      this.dailyTask.stop();
      this.dailyTask = null;
    }
    this.isRunning = false;
    console.log('📅 Notification scheduler stopped');
  }

  async runNow(): Promise<Record<string, { sent: number; skipped: number }>> {
    console.log('🚀 Running all engagement notifications manually...');
    return engagementNotificationService.runAllRules();
  }

  getStatus(): { isRunning: boolean; nextHourlyRun: Date; nextDailyRun: Date } {
    const now = new Date();
    const nextHour = new Date(now);
    nextHour.setMinutes(0, 0, 0);
    nextHour.setHours(nextHour.getHours() + 1);

    const nextDaily = new Date(now);
    nextDaily.setUTCHours(9, 0, 0, 0);
    if (nextDaily <= now) {
      nextDaily.setDate(nextDaily.getDate() + 1);
    }

    return {
      isRunning: this.isRunning,
      nextHourlyRun: nextHour,
      nextDailyRun: nextDaily,
    };
  }
}

export const notificationScheduler = new NotificationScheduler();
