/**
 * Push Notification Service for EduFiliova Mobile App
 * Sends notifications via Firebase Cloud Messaging (FCM) and WebSocket
 */

import { db } from '../db';
import { users, profiles, deviceTokens } from '@shared/schema';
import { eq } from 'drizzle-orm';

interface PushNotificationPayload {
  title: string;
  message: string;
  type: 'message' | 'community' | 'community_reply' | 'portfolio_like' | 'portfolio_message' | 'lesson' | 'achievement' | 'payment' | 'reminder';
  data?: Record<string, any>;
  sound?: string;
  badge?: number;
}

interface FCMMessage {
  to?: string;
  registration_ids?: string[];
  notification: {
    title: string;
    body: string;
    sound?: string;
    icon?: string;
    color?: string;
    click_action?: string;
  };
  data?: Record<string, any>;
  priority: string;
}

class PushNotificationService {
  private fcmServerKey: string | null = null;
  private fcmEndpoint = 'https://fcm.googleapis.com/fcm/send';

  constructor() {
    this.fcmServerKey = process.env.FCM_SERVER_KEY || null;
    if (!this.fcmServerKey) {
      console.warn('⚠️ FCM_SERVER_KEY not set - push notifications disabled');
    } else {
      console.log('📱 Push notification service initialized');
    }
  }

  /**
   * Register a device token for push notifications
   */
  async registerDevice(userId: string, token: string, platform: 'android' | 'ios' | 'web'): Promise<boolean> {
    try {
      // Check if device_tokens table exists, if not use a simple map
      const existingToken = await db.select()
        .from(deviceTokens)
        .where(eq(deviceTokens.token, token))
        .limit(1);

      if (existingToken.length === 0) {
        await db.insert(deviceTokens).values({
          userId,
          token,
          platform,
          createdAt: new Date(),
          lastUsed: new Date()
        });
        console.log(`📱 Device registered for user ${userId}`);
      } else {
        await db.update(deviceTokens)
          .set({ lastUsed: new Date(), userId })
          .where(eq(deviceTokens.token, token));
      }
      return true;
    } catch (error) {
      console.error('Failed to register device:', error);
      return false;
    }
  }

  /**
   * Send push notification to a specific user
   */
  async sendToUser(userId: string, payload: PushNotificationPayload): Promise<boolean> {
    try {
      const tokens = await db.select({ token: deviceTokens.token })
        .from(deviceTokens)
        .where(eq(deviceTokens.userId, userId));

      if (tokens.length === 0) {
        console.log(`No device tokens for user ${userId}`);
        return false;
      }

      const tokenList = tokens.map(t => t.token);
      return await this.sendToTokens(tokenList, payload);
    } catch (error) {
      console.error('Failed to send push to user:', error);
      return false;
    }
  }

  /**
   * Send push notification to multiple device tokens
   */
  async sendToTokens(tokens: string[], payload: PushNotificationPayload): Promise<boolean> {
    if (!this.fcmServerKey) {
      console.log('📱 Push notification (FCM disabled):', payload.title);
      return false;
    }

    try {
      const soundMap: Record<string, string> = {
        message: 'notification_sound',
        community: 'notification_sound',
        community_reply: 'notification_sound',
        portfolio_like: 'achievement_sound',
        portfolio_message: 'notification_sound',
        lesson: 'lesson_sound',
        achievement: 'achievement_sound',
        payment: 'notification_sound',
        reminder: 'reminder_sound'
      };

      const fcmMessage: FCMMessage = {
        registration_ids: tokens,
        notification: {
          title: payload.title,
          body: payload.message,
          sound: payload.sound || soundMap[payload.type] || 'default',
          icon: 'notification_icon',
          color: '#d44472',
          click_action: 'FCM_PLUGIN_ACTIVITY'
        },
        data: {
          type: payload.type,
          ...payload.data
        },
        priority: 'high'
      };

      const response = await fetch(this.fcmEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `key=${this.fcmServerKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(fcmMessage)
      });

      const result = await response.json();
      console.log('📱 FCM response:', result);
      return result.success > 0;
    } catch (error) {
      console.error('FCM send error:', error);
      return false;
    }
  }

  // ============= Notification Helpers =============

  /**
   * New chat message notification
   */
  async notifyNewMessage(recipientUserId: string, senderName: string, messagePreview: string, chatId?: string) {
    await this.sendToUser(recipientUserId, {
      title: `New message from ${senderName}`,
      message: messagePreview.substring(0, 100) + (messagePreview.length > 100 ? '...' : ''),
      type: 'message',
      data: { chatId, senderName }
    });
  }

  /**
   * New community post notification
   */
  async notifyCommunityPost(recipientUserIds: string[], posterName: string, postTitle: string, postId: string) {
    for (const userId of recipientUserIds) {
      await this.sendToUser(userId, {
        title: 'New Community Post',
        message: `${posterName}: ${postTitle.substring(0, 80)}`,
        type: 'community',
        data: { postId, posterName }
      });
    }
  }

  /**
   * Community reply notification
   */
  async notifyCommunityReply(postOwnerId: string, replierName: string, replyPreview: string, postId: string) {
    await this.sendToUser(postOwnerId, {
      title: `${replierName} replied to your post`,
      message: replyPreview.substring(0, 100) + (replyPreview.length > 100 ? '...' : ''),
      type: 'community_reply',
      data: { postId, replierName }
    });
  }

  /**
   * Portfolio like notification
   */
  async notifyPortfolioLike(portfolioOwnerId: string, likerName: string, portfolioTitle: string, portfolioId: string) {
    await this.sendToUser(portfolioOwnerId, {
      title: `${likerName} liked your portfolio`,
      message: `Your portfolio "${portfolioTitle}" received a new like!`,
      type: 'portfolio_like',
      data: { portfolioId, likerName }
    });
  }

  /**
   * Portfolio message/comment notification
   */
  async notifyPortfolioMessage(portfolioOwnerId: string, senderName: string, messagePreview: string, portfolioId: string) {
    await this.sendToUser(portfolioOwnerId, {
      title: `${senderName} commented on your portfolio`,
      message: messagePreview.substring(0, 100) + (messagePreview.length > 100 ? '...' : ''),
      type: 'portfolio_message',
      data: { portfolioId, senderName }
    });
  }

  /**
   * Lesson reminder notification
   */
  async notifyLessonReminder(userId: string, lessonTitle: string, startTime: string) {
    await this.sendToUser(userId, {
      title: 'Lesson Starting Soon',
      message: `Your lesson "${lessonTitle}" starts at ${startTime}`,
      type: 'lesson',
      data: { lessonTitle }
    });
  }

  /**
   * Achievement unlocked notification
   */
  async notifyAchievement(userId: string, achievementTitle: string, achievementDescription: string) {
    await this.sendToUser(userId, {
      title: 'Achievement Unlocked! 🎉',
      message: `${achievementTitle}: ${achievementDescription}`,
      type: 'achievement',
      data: { achievementTitle }
    });
  }

  /**
   * Payment notification
   */
  async notifyPayment(userId: string, message: string, amount?: string) {
    await this.sendToUser(userId, {
      title: 'Payment Update',
      message: message,
      type: 'payment',
      data: { amount }
    });
  }
}

// Export singleton instance
export const pushNotifications = new PushNotificationService();
