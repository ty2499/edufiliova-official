import { Request, Response, NextFunction } from 'express';
import { sql as postgresClient } from '../db.js';
import { AuthenticatedRequest } from './auth.js';

/**
 * Middleware to set RLS context for database queries
 * This sets the current user ID and role in the database session
 * so that Row Level Security policies can access them
 */
export const setRLSContext = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // If user is authenticated, set the context
    if (req.user) {
      // Set current user ID and role for RLS policies
      await postgresClient`
        SELECT 
          set_config('app.current_user_id', ${req.user.id}, true),
          set_config('app.current_user_role', ${req.user.role}, true)
      `;
    } else {
      // For unauthenticated requests, set empty context
      await postgresClient`
        SELECT 
          set_config('app.current_user_id', '', true),
          set_config('app.current_user_role', 'anonymous', true)
      `;
    }

    next();
  } catch (error) {
    console.error('RLS context setting error:', error);
    // Continue even if RLS context fails - application-level security will handle it
    next();
  }
};

/**
 * Utility function to execute a query with specific user context
 * Useful for system operations that need to bypass RLS temporarily
 */
export const withUserContext = async <T>(
  userId: string, 
  userRole: string, 
  queryFn: () => Promise<T>
): Promise<T> => {
  // Save current context
  const currentUserId = await postgresClient`SELECT current_setting('app.current_user_id', true) as user_id`;
  const currentUserRole = await postgresClient`SELECT current_setting('app.current_user_role', true) as user_role`;

  try {
    // Set new context
    await postgresClient`
      SELECT 
        set_config('app.current_user_id', ${userId}, true),
        set_config('app.current_user_role', ${userRole}, true)
    `;

    // Execute query
    const result = await queryFn();

    return result;
  } finally {
    // Restore previous context
    const prevUserId = currentUserId[0]?.user_id || '';
    const prevUserRole = currentUserRole[0]?.user_role || 'anonymous';
    
    await postgresClient`
      SELECT 
        set_config('app.current_user_id', ${prevUserId}, true),
        set_config('app.current_user_role', ${prevUserRole}, true)
    `;
  }
};

/**
 * Utility function for system-level operations that bypass RLS
 */
export const withSystemContext = async <T>(queryFn: () => Promise<T>): Promise<T> => {
  return withUserContext('system', 'admin', queryFn);
};