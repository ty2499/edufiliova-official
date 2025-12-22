import { Router } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth";
import { getSystemErrors, getErrorStats, resolveError, bulkResolveErrors, logError } from "../utils/errorLogger";

const router = Router();

router.get("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { severity, category, resolved, startDate, endDate, limit, offset } = req.query;

    const filters: any = {};
    if (severity) filters.severity = severity as string;
    if (category) filters.category = category as string;
    if (resolved !== undefined) filters.resolved = resolved === 'true';
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);
    if (limit) filters.limit = parseInt(limit as string, 10);
    if (offset) filters.offset = parseInt(offset as string, 10);

    const result = await getSystemErrors(filters);

    res.json({
      success: true,
      data: result.errors,
      total: result.total,
      limit: filters.limit || 50,
      offset: filters.offset || 0
    });
  } catch (error: any) {
    console.error('[SystemErrors] Failed to fetch errors:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch system errors"
    });
  }
});

router.get("/stats", requireAuth, requireAdmin, async (req, res) => {
  try {
    const stats = await getErrorStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    console.error('[SystemErrors] Failed to fetch stats:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch error statistics"
    });
  }
});

router.put("/:id/resolve", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const userId = (req as any).user?.id || 'admin';

    const success = await resolveError(id, userId, notes);

    if (success) {
      res.json({
        success: true,
        message: "Error marked as resolved"
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Failed to resolve error"
      });
    }
  } catch (error: any) {
    console.error('[SystemErrors] Failed to resolve error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to resolve error"
    });
  }
});

router.put("/bulk-resolve", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { errorIds, notes } = req.body;
    const userId = (req as any).user?.id || 'admin';

    if (!Array.isArray(errorIds) || errorIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No error IDs provided"
      });
    }

    const success = await bulkResolveErrors(errorIds, userId, notes);

    if (success) {
      res.json({
        success: true,
        message: `${errorIds.length} errors marked as resolved`
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Failed to bulk resolve errors"
      });
    }
  } catch (error: any) {
    console.error('[SystemErrors] Failed to bulk resolve:', error);
    res.status(500).json({
      success: false,
      message: "Failed to bulk resolve errors"
    });
  }
});

router.post("/log", async (req, res) => {
  try {
    const { severity, category, source, endpoint, method, userRoleContext, userId, message, stack, metadata } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Error message is required"
      });
    }

    const errorId = await logError({
      severity,
      category,
      source: source || 'client',
      endpoint,
      method,
      userRoleContext,
      userId,
      message,
      stack,
      metadata
    });

    res.json({
      success: true,
      errorId
    });
  } catch (error: any) {
    console.error('[SystemErrors] Failed to log error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to log error"
    });
  }
});

export default router;
