/**
 * Push Notification API Routes
 * Handles device registration and notification management
 */

import { Router, Request, Response } from 'express';
import { db } from '../db';
import { deviceTokens, users } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { pushNotifications } from '../services/push-notifications';

const router = Router();

/**
 * Register device for push notifications
 * POST /api/notifications/register-device
 */
router.post('/register-device', async (req: Request, res: Response) => {
  try {
    const { token, platform, deviceInfo } = req.body;
    const userId = (req as any).userId;

    if (!token || !platform) {
      return res.status(400).json({ error: 'Token and platform are required' });
    }

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!['android', 'ios', 'web'].includes(platform)) {
      return res.status(400).json({ error: 'Invalid platform. Must be android, ios, or web' });
    }

    // Check if token already exists
    const existing = await db.select()
      .from(deviceTokens)
      .where(eq(deviceTokens.token, token))
      .limit(1);

    if (existing.length > 0) {
      // Update existing token
      await db.update(deviceTokens)
        .set({ 
          userId, 
          lastUsed: new Date(),
          deviceInfo: deviceInfo || {}
        })
        .where(eq(deviceTokens.token, token));
    } else {
      // Insert new token
      await db.insert(deviceTokens).values({
        userId,
        token,
        platform,
        deviceInfo: deviceInfo || {},
        createdAt: new Date(),
        lastUsed: new Date()
      });
    }

    console.log(`📱 Device registered for user ${userId} (${platform})`);
    res.json({ success: true, message: 'Device registered successfully' });
  } catch (error) {
    console.error('Device registration error:', error);
    res.status(500).json({ error: 'Failed to register device' });
  }
});

/**
 * Unregister device
 * DELETE /api/notifications/unregister-device
 */
router.delete('/unregister-device', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    const userId = (req as any).userId;

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    await db.delete(deviceTokens)
      .where(and(
        eq(deviceTokens.token, token),
        userId ? eq(deviceTokens.userId, userId) : undefined
      ));

    res.json({ success: true, message: 'Device unregistered successfully' });
  } catch (error) {
    console.error('Device unregistration error:', error);
    res.status(500).json({ error: 'Failed to unregister device' });
  }
});

/**
 * Get user's registered devices
 * GET /api/notifications/devices
 */
router.get('/devices', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const devices = await db.select({
      id: deviceTokens.id,
      platform: deviceTokens.platform,
      lastUsed: deviceTokens.lastUsed,
      createdAt: deviceTokens.createdAt
    })
    .from(deviceTokens)
    .where(eq(deviceTokens.userId, userId));

    res.json({ devices });
  } catch (error) {
    console.error('Get devices error:', error);
    res.status(500).json({ error: 'Failed to get devices' });
  }
});

/**
 * Send test notification (for debugging)
 * POST /api/notifications/test
 */
router.post('/test', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Send a test notification
    const success = await pushNotifications.sendToUser(userId, {
      title: 'Test Notification',
      message: 'This is a test notification from EduFiliova!',
      type: 'message',
      data: { test: true }
    });

    res.json({ success, message: success ? 'Test notification sent' : 'No device registered or FCM not configured' });
  } catch (error) {
    console.error('Test notification error:', error);
    res.status(500).json({ error: 'Failed to send test notification' });
  }
});

export default router;
