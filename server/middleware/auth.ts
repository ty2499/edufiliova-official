import { Request, Response, NextFunction } from 'express';
import { db } from '../db.js';
import { users, profiles, userLoginSessions } from '../../shared/schema.js';
import { eq, and, gt } from 'drizzle-orm';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    userId: string;
    email: string;
    role: string;
    profile: any;
  };
}

// Authentication middleware - verifies user session
export const requireAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // Bypass auth for test-emails routes (for testing purposes)
    if (req.path.includes('/test-emails/')) {
      console.log('🔐 [BYPASS] Test-emails route - skipping auth check');
      (req as any).user = { id: 'test-user', userId: 'test-user', role: 'admin' };
      return next();
    }

    const authHeader = req.headers.authorization;
    const sessionId = authHeader?.replace('Bearer ', '') || 
                     req.headers['x-session-id'] as string ||
                     req.cookies?.sessionId ||
                     req.cookies?.session ||
                     req.cookies?.auth_session;

    console.log('🔐 Auth middleware - sessionId:', sessionId);
    console.log('🔐 Auth middleware - path:', req.path, 'method:', req.method);
    console.log('🔐 Auth middleware - cookies:', Object.keys(req.cookies || {}));
    
    // DEBUG: For upload endpoints, log all headers
    if (req.path.includes('/upload/')) {
      console.log('🔐 DEBUG Upload headers - Authorization:', req.headers.authorization);
      console.log('🔐 DEBUG Upload headers - x-session-id:', req.headers['x-session-id']);
      console.log('🔐 DEBUG Upload headers - content-type:', req.headers['content-type']);
      console.log('🔐 DEBUG Upload headers - all headers keys:', Object.keys(req.headers));
    }

    if (!sessionId) {
      console.log('🔐 No session ID provided for path:', req.path);
      return res.status(401).json({ 
        success: false, 
        error: 'Authentication required' 
      });
    }

    // Verify session
    const session = await db.select()
      .from(userLoginSessions)
      .where(and(
        eq(userLoginSessions.sessionId, sessionId),
        eq(userLoginSessions.isActive, true),
        gt(userLoginSessions.expiresAt, new Date())
      ))
      .limit(1);

    if (session.length === 0) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid or expired session' 
      });
    }

    // Get user and profile data with safety checks and error handling
    const userProfile = await db.select({
      userId: users.id,
      userTextId: users.userId,
      email: users.email,
      profileId: profiles.id,
      name: profiles.name,
      role: profiles.role,
      status: profiles.status,
      educationLevel: profiles.educationLevel,
      subscriptionTier: profiles.subscriptionTier,
      legacyPlan: profiles.legacyPlan,
      planExpiry: profiles.planExpiry
    })
    .from(users)
    .innerJoin(profiles, eq(users.id, profiles.userId))
    .where(eq(users.id, session[0].userId))
    .limit(1);

    if (userProfile.length === 0) {
      return res.status(401).json({ 
        success: false, 
        error: 'User profile not found' 
      });
    }

    const user = userProfile[0];

    // Check if user is banned or suspended
    if (user.status === 'banned') {
      return res.status(403).json({ 
        success: false, 
        error: 'Account has been banned. Please contact support if you believe this is an error.' 
      });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ 
        success: false, 
        error: 'Account has been temporarily suspended. Please contact support for more information.' 
      });
    }

    req.user = {
      id: user.userId,
      userId: user.userTextId,
      email: user.email,
      role: user.role || 'user',
      profile: {
        ...user,
        id: user.profileId
      }
    };

    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Authentication failed' 
    });
  }
};

// Role-based authorization middleware
export const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Authentication required' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        error: 'Insufficient permissions' 
      });
    }

    next();
  };
};

// Admin authorization middleware
export const requireAdmin = requireRole(['admin']);

// Admin or Moderator authorization middleware - for chat management
export const requireAdminOrModerator = requireRole(['admin', 'moderator']);

// Admin, Moderator, or Customer Service authorization middleware - for support tools
export const requireSupportStaff = requireRole(['admin', 'moderator', 'customer_service']);

// Teacher authorization middleware  
export const requireTeacher = requireRole(['admin', 'teacher']);

// Student authorization middleware
export const requireStudent = requireRole(['admin', 'teacher', 'student', 'user']);

// Optional authentication middleware - does not require auth but sets user if present
export const optionalAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const sessionId = authHeader?.replace('Bearer ', '') || 
                     req.headers['x-session-id'] as string ||
                     req.cookies?.sessionId ||
                     req.cookies?.session ||
                     req.cookies?.auth_session;

    if (!sessionId) {
      // No session provided, continue without user
      req.user = undefined;
      return next();
    }

    // Verify session
    const session = await db.select()
      .from(userLoginSessions)
      .where(and(
        eq(userLoginSessions.sessionId, sessionId),
        eq(userLoginSessions.isActive, true),
        gt(userLoginSessions.expiresAt, new Date())
      ))
      .limit(1);

    if (session.length === 0) {
      // Invalid session, continue without user
      req.user = undefined;
      return next();
    }

    // Get user and profile data
    const userProfile = await db.select({
      userId: users.id,
      userTextId: users.userId,
      email: users.email,
      profileId: profiles.id,
      name: profiles.name,
      role: profiles.role,
      status: profiles.status,
      educationLevel: profiles.educationLevel,
      subscriptionTier: profiles.subscriptionTier,
      legacyPlan: profiles.legacyPlan,
      planExpiry: profiles.planExpiry
    })
    .from(users)
    .innerJoin(profiles, eq(users.id, profiles.userId))
    .where(eq(users.id, session[0].userId))
    .limit(1);

    if (userProfile.length === 0) {
      req.user = undefined;
      return next();
    }

    const user = userProfile[0];

    // Skip banned/suspended checks for optional auth - just don't set user
    if (user.status === 'banned' || user.status === 'suspended') {
      req.user = undefined;
      return next();
    }

    req.user = {
      id: user.userId,
      userId: user.userTextId,
      email: user.email,
      role: user.role || 'user',
      profile: {
        ...user,
        id: user.profileId
      }
    };

    next();
  } catch (error) {
    console.error('Optional authentication middleware error:', error);
    req.user = undefined;
    next();
  }
};

// Resource ownership verification
export const requireOwnership = (resourceUserIdField = 'userId') => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const resourceUserId = req.body[resourceUserIdField] || req.params[resourceUserIdField];
    
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Authentication required' 
      });
    }

    // Admins can access any resource
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if user owns the resource
    if (req.user.id !== resourceUserId) {
      return res.status(403).json({ 
        success: false, 
        error: 'Access denied - resource not owned by user' 
      });
    }

    next();
  };
};