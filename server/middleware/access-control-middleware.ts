import { Request, Response, NextFunction } from 'express';
import { AccessControlService } from '../services/access-control';

/**
 * Middleware to check if user can access lessons
 * Enforces "1 lesson per subject" rule for unpaid users
 */
export async function checkLessonAccess(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { lessonId, subjectId, courseId } = req.params;
    
    if (!lessonId || !subjectId) {
      return res.status(400).json({ error: 'Lesson ID and Subject ID are required' });
    }

    const accessCheck = await AccessControlService.canAccessLesson(
      userId,
      subjectId,
      parseInt(lessonId),
      courseId
    );

    if (!accessCheck.canAccess) {
      return res.status(403).json({
        error: accessCheck.reason || 'Access denied',
        alreadyAccessedLesson: accessCheck.alreadyAccessedLesson,
      });
    }

    next();
  } catch (error) {
    console.error('Lesson access check error:', error);
    return res.status(500).json({ error: 'Failed to check lesson access' });
  }
}

/**
 * Middleware to check if user can join meetings
 */
export async function checkMeetingAccess(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const accessCheck = await AccessControlService.canJoinMeeting(userId);

    if (!accessCheck.canJoin) {
      return res.status(403).json({
        error: accessCheck.reason || 'Meeting access denied',
        requiresSubscription: true,
      });
    }

    next();
  } catch (error) {
    console.error('Meeting access check error:', error);
    return res.status(500).json({ error: 'Failed to check meeting access' });
  }
}

/**
 * Middleware to check if user can access community features
 */
export async function checkCommunityAccess(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const accessCheck = await AccessControlService.canAccessCommunity(userId);

    if (!accessCheck.canAccess) {
      return res.status(403).json({
        error: accessCheck.reason || 'Community access denied',
        requiresGrade12Plus: true,
        requiresSubscription: true,
      });
    }

    next();
  } catch (error) {
    console.error('Community access check error:', error);
    return res.status(500).json({ error: 'Failed to check community access' });
  }
}

/**
 * Middleware to check if user can send friend requests
 */
export async function checkFriendRequestAccess(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const accessCheck = await AccessControlService.canSendFriendRequest(userId);

    if (!accessCheck.canSend) {
      return res.status(403).json({
        error: accessCheck.reason || 'Friend request access denied',
        requiresGrade12Plus: true,
        requiresSubscription: true,
      });
    }

    next();
  } catch (error) {
    console.error('Friend request access check error:', error);
    return res.status(500).json({ error: 'Failed to check friend request access' });
  }
}

/**
 * Middleware to check if user can download products (free quota check)
 */
export async function checkProductDownloadAccess(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const accessCheck = await AccessControlService.canDownloadProduct(userId);

    if (!accessCheck.canDownload) {
      return res.status(403).json({
        error: accessCheck.reason || 'Download limit reached',
        downloadsRemaining: 0,
        requiresSubscription: true,
      });
    }

    // Attach downloads remaining to request for use in route handler
    (req as any).downloadsRemaining = accessCheck.downloadsRemaining;

    next();
  } catch (error) {
    console.error('Product download access check error:', error);
    return res.status(500).json({ error: 'Failed to check download access' });
  }
}

/**
 * Middleware to check if user can access daily challenges
 */
export async function checkDailyChallengeAccess(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const accessCheck = await AccessControlService.canAccessDailyChallenge(userId);

    if (!accessCheck.canAccess) {
      return res.status(403).json({
        error: accessCheck.reason || 'Daily challenge access denied',
        requiresSubscription: true,
      });
    }

    next();
  } catch (error) {
    console.error('Daily challenge access check error:', error);
    return res.status(500).json({ error: 'Failed to check daily challenge access' });
  }
}

/**
 * Middleware to check messaging permissions based on grade and subscription
 */
export async function checkMessagingAccess(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get allowed contacts for this user
    const allowedContacts = await AccessControlService.getAllowedMessageContacts(userId);

    // Attach allowed contacts to request for use in route handler
    (req as any).allowedMessageContacts = allowedContacts;

    next();
  } catch (error) {
    console.error('Messaging access check error:', error);
    return res.status(500).json({ error: 'Failed to check messaging access' });
  }
}

/**
 * Helper function to get feature access for the current user
 * Returns feature access object that can be sent to client
 */
export async function getFeatureAccessForUser(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const featureAccess = await AccessControlService.getUserFeatureAccess(userId);

    return res.json({
      success: true,
      featureAccess,
    });
  } catch (error) {
    console.error('Error getting feature access:', error);
    return res.status(500).json({ error: 'Failed to get feature access' });
  }
}
