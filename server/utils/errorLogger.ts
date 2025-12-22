import { db } from "../db";
import { systemErrors, USER_FRIENDLY_ERRORS } from "@shared/schema";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";

type ErrorSeverity = "critical" | "error" | "warning" | "info";
type ErrorCategory = "database" | "api" | "validation" | "auth" | "payment" | "file" | "network" | "unknown";

interface LogErrorOptions {
  severity?: ErrorSeverity;
  category?: ErrorCategory;
  source?: string;
  endpoint?: string;
  method?: string;
  userRoleContext?: string;
  userId?: string;
  message: string;
  stack?: string;
  metadata?: Record<string, any>;
}

interface AppError extends Error {
  statusCode?: number;
  errorCode?: string;
  category?: ErrorCategory;
  severity?: ErrorSeverity;
  isOperational?: boolean;
}

export function classifyError(error: Error | string): { category: ErrorCategory; severity: ErrorSeverity; friendlyMessage: string } {
  const errorMessage = typeof error === 'string' ? error : error.message;
  const errorName = typeof error === 'string' ? '' : error.name;
  const lowerMessage = errorMessage.toLowerCase();
  const lowerName = errorName.toLowerCase();

  if (lowerMessage.includes('database') || lowerMessage.includes('postgres') || 
      lowerMessage.includes('sql') || lowerMessage.includes('drizzle') ||
      lowerMessage.includes('connection refused') || lowerMessage.includes('econnrefused')) {
    return {
      category: 'database',
      severity: 'critical',
      friendlyMessage: USER_FRIENDLY_ERRORS.database_connection
    };
  }

  if (lowerMessage.includes('json') || lowerMessage.includes('parse') || 
      lowerMessage.includes('unexpected token') || lowerMessage.includes('syntax error')) {
    return {
      category: 'api',
      severity: 'error',
      friendlyMessage: USER_FRIENDLY_ERRORS.invalid_response
    };
  }

  if (lowerMessage.includes('validation') || lowerMessage.includes('invalid') ||
      lowerMessage.includes('required') || lowerMessage.includes('must be')) {
    return {
      category: 'validation',
      severity: 'warning',
      friendlyMessage: USER_FRIENDLY_ERRORS.validation_failed
    };
  }

  if (lowerMessage.includes('unauthorized') || lowerMessage.includes('authentication') ||
      lowerMessage.includes('not authenticated') || lowerMessage.includes('token') ||
      lowerMessage.includes('session') || lowerName.includes('auth')) {
    return {
      category: 'auth',
      severity: 'warning',
      friendlyMessage: USER_FRIENDLY_ERRORS.auth_required
    };
  }

  if (lowerMessage.includes('permission') || lowerMessage.includes('forbidden') ||
      lowerMessage.includes('access denied') || lowerMessage.includes('not allowed')) {
    return {
      category: 'auth',
      severity: 'warning',
      friendlyMessage: USER_FRIENDLY_ERRORS.permission_denied
    };
  }

  if (lowerMessage.includes('payment') || lowerMessage.includes('stripe') ||
      lowerMessage.includes('paypal') || lowerMessage.includes('transaction') ||
      lowerMessage.includes('charge') || lowerMessage.includes('card')) {
    return {
      category: 'payment',
      severity: 'error',
      friendlyMessage: USER_FRIENDLY_ERRORS.payment_failed
    };
  }

  if (lowerMessage.includes('file') || lowerMessage.includes('upload') ||
      lowerMessage.includes('multer') || lowerMessage.includes('cloudinary')) {
    return {
      category: 'file',
      severity: 'error',
      friendlyMessage: USER_FRIENDLY_ERRORS.file_upload_failed
    };
  }

  if (lowerMessage.includes('network') || lowerMessage.includes('timeout') ||
      lowerMessage.includes('econnreset') || lowerMessage.includes('socket') ||
      lowerMessage.includes('fetch failed')) {
    return {
      category: 'network',
      severity: 'error',
      friendlyMessage: USER_FRIENDLY_ERRORS.network_error
    };
  }

  return {
    category: 'unknown',
    severity: 'error',
    friendlyMessage: USER_FRIENDLY_ERRORS.unknown
  };
}

export async function logError(options: LogErrorOptions): Promise<string | null> {
  try {
    const classification = classifyError(options.message);
    
    const [inserted] = await db.insert(systemErrors).values({
      severity: options.severity || classification.severity,
      category: options.category || classification.category,
      source: options.source || 'server',
      endpoint: options.endpoint,
      method: options.method,
      userRoleContext: options.userRoleContext,
      userId: options.userId,
      message: options.message,
      userFriendlyMessage: classification.friendlyMessage,
      stack: options.stack,
      metadata: options.metadata || {},
    }).returning({ id: systemErrors.id });

    return inserted?.id || null;
  } catch (err) {
    console.error('[ErrorLogger] Failed to log error to database:', err);
    return null;
  }
}

export async function getSystemErrors(filters?: {
  severity?: ErrorSeverity;
  category?: ErrorCategory;
  resolved?: boolean;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}) {
  try {
    const conditions = [];

    if (filters?.severity) {
      conditions.push(eq(systemErrors.severity, filters.severity));
    }
    if (filters?.category) {
      conditions.push(eq(systemErrors.category, filters.category));
    }
    if (filters?.resolved !== undefined) {
      conditions.push(eq(systemErrors.resolved, filters.resolved));
    }
    if (filters?.startDate) {
      conditions.push(gte(systemErrors.occurredAt, filters.startDate));
    }
    if (filters?.endDate) {
      conditions.push(lte(systemErrors.occurredAt, filters.endDate));
    }

    const query = db.select().from(systemErrors)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(systemErrors.occurredAt))
      .limit(filters?.limit || 50)
      .offset(filters?.offset || 0);

    const errors = await query;

    const countResult = await db.select({ count: sql<number>`count(*)` })
      .from(systemErrors)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    return {
      errors,
      total: Number(countResult[0]?.count || 0)
    };
  } catch (err) {
    console.error('[ErrorLogger] Failed to fetch errors:', err);
    return { errors: [], total: 0 };
  }
}

export async function getErrorStats() {
  try {
    const [unresolvedCount] = await db.select({ count: sql<number>`count(*)` })
      .from(systemErrors)
      .where(eq(systemErrors.resolved, false));

    const [criticalCount] = await db.select({ count: sql<number>`count(*)` })
      .from(systemErrors)
      .where(and(
        eq(systemErrors.resolved, false),
        eq(systemErrors.severity, 'critical')
      ));

    const [todayCount] = await db.select({ count: sql<number>`count(*)` })
      .from(systemErrors)
      .where(gte(systemErrors.occurredAt, sql`NOW() - INTERVAL '24 hours'`));

    const categoryCounts = await db.select({
      category: systemErrors.category,
      count: sql<number>`count(*)`
    })
      .from(systemErrors)
      .where(eq(systemErrors.resolved, false))
      .groupBy(systemErrors.category);

    return {
      unresolved: Number(unresolvedCount?.count || 0),
      critical: Number(criticalCount?.count || 0),
      today: Number(todayCount?.count || 0),
      byCategory: categoryCounts.reduce((acc, item) => {
        acc[item.category] = Number(item.count);
        return acc;
      }, {} as Record<string, number>)
    };
  } catch (err) {
    console.error('[ErrorLogger] Failed to fetch error stats:', err);
    return { unresolved: 0, critical: 0, today: 0, byCategory: {} };
  }
}

export async function resolveError(errorId: string, resolvedBy: string, notes?: string) {
  try {
    await db.update(systemErrors)
      .set({
        resolved: true,
        resolvedAt: new Date(),
        resolvedBy,
        resolvedNotes: notes
      })
      .where(eq(systemErrors.id, errorId));
    return true;
  } catch (err) {
    console.error('[ErrorLogger] Failed to resolve error:', err);
    return false;
  }
}

export async function bulkResolveErrors(errorIds: string[], resolvedBy: string, notes?: string) {
  try {
    for (const id of errorIds) {
      await resolveError(id, resolvedBy, notes);
    }
    return true;
  } catch (err) {
    console.error('[ErrorLogger] Failed to bulk resolve errors:', err);
    return false;
  }
}

export function createAppError(
  message: string,
  statusCode: number = 500,
  errorCode: string = 'unknown',
  category: ErrorCategory = 'unknown',
  severity: ErrorSeverity = 'error'
): AppError {
  const error = new Error(message) as AppError;
  error.statusCode = statusCode;
  error.errorCode = errorCode;
  error.category = category;
  error.severity = severity;
  error.isOperational = true;
  return error;
}

export function getFriendlyMessage(errorCode: string): string {
  return USER_FRIENDLY_ERRORS[errorCode] || USER_FRIENDLY_ERRORS.unknown;
}

export function isAdminRole(role?: string): boolean {
  return role === 'admin' || role === 'moderator' || role === 'customer_service';
}
