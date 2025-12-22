import { Router } from "express";
import { db } from "../db";
import { showcaseProjects, users, profiles } from "../../shared/schema";
import { eq, desc, and, like, or, sql } from "drizzle-orm";
import { insertShowcaseProjectSchema } from "../../shared/schema";
import { requireAuth, requireRole } from "../middleware/auth";
import type { AuthenticatedRequest } from "../middleware/auth";

const router = Router();

// Get all approved showcase projects (NEW ENDPOINT for frontend compatibility)
router.get("/approved", async (req, res) => {
  try {
    const { search, tags, freelancer, sort = 'recent', limit = "20", offset = "0" } = req.query;
    
    // Build conditions array - always include approved status
    const conditions = [eq(showcaseProjects.status, "approved")];

    // Apply filters
    if (search && typeof search === 'string') {
      conditions.push(
        or(
          like(showcaseProjects.title, `%${search}%`),
          like(showcaseProjects.description, `%${search}%`),
          like(profiles.name, `%${search}%`),
          like(profiles.displayName, `%${search}%`),
          like(profiles.bio, `%${search}%`)
        )!
      );
    }

    if (freelancer) {
      conditions.push(eq(showcaseProjects.freelancerId, freelancer as string));
    }

    // Handle tags filtering  
    if (tags && typeof tags === 'string') {
      const tagList = tags.split(',').map(t => t.trim()).filter(Boolean);
      if (tagList.length > 0) {
        conditions.push(sql`${showcaseProjects.tags} && ${tagList}`);
      }
    }

    const query = db
      .select({
        id: showcaseProjects.id,
        title: showcaseProjects.title,
        description: showcaseProjects.description,
        media: showcaseProjects.media,
        tags: showcaseProjects.tags,
        viewCount: showcaseProjects.viewCount,
        likeCount: showcaseProjects.likeCount,
        createdAt: showcaseProjects.createdAt,
        freelancer: {
          id: users.id,
          name: profiles.name,
          displayName: profiles.displayName, // Frontend expects displayName
          avatarUrl: profiles.avatarUrl, // Frontend expects avatarUrl not avatar
          bio: profiles.bio,
          rating: sql<number>`COALESCE(${profiles.hourlyRate}, 0)`, // Placeholder for rating
          reviewCount: sql<number>`0`, // Placeholder for review count
        }
      })
      .from(showcaseProjects)
      .leftJoin(users, eq(showcaseProjects.freelancerId, users.id))
      .leftJoin(profiles, eq(users.id, profiles.userId))
      .where(and(...conditions));

    // Apply sorting based on sort parameter
    let sortedQuery;
    switch (sort) {
      case 'popular':
        sortedQuery = query.orderBy(desc(showcaseProjects.viewCount));
        break;
      case 'trending':
        sortedQuery = query.orderBy(desc(showcaseProjects.likeCount));
        break;
      case 'recent':
      default:
        sortedQuery = query.orderBy(desc(showcaseProjects.createdAt));
        break;
    }

    const projects = await sortedQuery
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string));

    res.json({ 
      success: true, 
      data: projects,
      pagination: {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        total: projects.length
      }
    });
  } catch (error) {
    console.error("Error fetching approved showcase projects:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// Get all approved showcase projects (EXISTING ENDPOINT - kept for backward compatibility)
router.get("/", async (req, res) => {
  try {
    const { search, tags, freelancer, sort = 'recent', limit = "20", offset = "0" } = req.query;
    
    // Build conditions array - always include approved status
    const conditions = [eq(showcaseProjects.status, "approved")];

    // Apply filters
    if (search && typeof search === 'string') {
      conditions.push(
        or(
          like(showcaseProjects.title, `%${search}%`),
          like(showcaseProjects.description, `%${search}%`),
          like(profiles.name, `%${search}%`),
          like(profiles.displayName, `%${search}%`),
          like(profiles.bio, `%${search}%`)
        )!
      );
    }

    if (freelancer) {
      conditions.push(eq(showcaseProjects.freelancerId, freelancer as string));
    }

    // Handle tags filtering  
    if (tags && typeof tags === 'string') {
      const tagList = tags.split(',').map(t => t.trim()).filter(Boolean);
      if (tagList.length > 0) {
        conditions.push(sql`${showcaseProjects.tags} && ${tagList}`);
      }
    }

    const query = db
      .select({
        id: showcaseProjects.id,
        title: showcaseProjects.title,
        description: showcaseProjects.description,
        media: showcaseProjects.media,
        tags: showcaseProjects.tags,
        viewCount: showcaseProjects.viewCount,
        likeCount: showcaseProjects.likeCount,
        createdAt: showcaseProjects.createdAt,
        freelancer: {
          id: users.id,
          name: profiles.name,
          displayName: profiles.displayName, // Frontend expects displayName
          avatarUrl: profiles.avatarUrl, // Frontend expects avatarUrl not avatar
          bio: profiles.bio,
          rating: sql<number>`COALESCE(${profiles.hourlyRate}, 0)`, // Placeholder for rating
          reviewCount: sql<number>`0`, // Placeholder for review count
        }
      })
      .from(showcaseProjects)
      .leftJoin(users, eq(showcaseProjects.freelancerId, users.id))
      .leftJoin(profiles, eq(users.id, profiles.userId))
      .where(and(...conditions));

    // Apply sorting based on sort parameter
    let sortedQuery;
    switch (sort) {
      case 'popular':
        sortedQuery = query.orderBy(desc(showcaseProjects.viewCount));
        break;
      case 'trending':
        sortedQuery = query.orderBy(desc(showcaseProjects.likeCount));
        break;
      case 'recent':
      default:
        sortedQuery = query.orderBy(desc(showcaseProjects.createdAt));
        break;
    }

    const projects = await sortedQuery
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string));

    res.json({ 
      success: true, 
      data: projects,
      pagination: {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        total: projects.length
      }
    });
  } catch (error) {
    console.error("Error fetching showcase projects:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// Get single showcase project with view count increment
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const project = await db
      .select({
        id: showcaseProjects.id,
        title: showcaseProjects.title,
        description: showcaseProjects.description,
        media: showcaseProjects.media,
        tags: showcaseProjects.tags,
        viewCount: showcaseProjects.viewCount,
        likeCount: showcaseProjects.likeCount,
        createdAt: showcaseProjects.createdAt,
        freelancer: {
          id: users.id,
          name: profiles.name,
          avatar: profiles.avatarUrl,
          bio: profiles.bio,
        }
      })
      .from(showcaseProjects)
      .leftJoin(users, eq(showcaseProjects.freelancerId, users.id))
      .leftJoin(profiles, eq(users.id, profiles.userId))
      .where(and(
        eq(showcaseProjects.id, id),
        eq(showcaseProjects.status, "approved")
      ))
      .limit(1);

    if (!project[0]) {
      return res.status(404).json({ success: false, error: "Project not found" });
    }

    // Increment view count
    await db
      .update(showcaseProjects)
      .set({ viewCount: sql`${showcaseProjects.viewCount} + 1` })
      .where(eq(showcaseProjects.id, id));

    res.json({ success: true, data: project[0] });
  } catch (error) {
    console.error("Error fetching showcase project:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// Create new showcase project (freelancers only)
router.post("/", requireAuth, requireRole(['freelancer']), async (req: AuthenticatedRequest, res) => {
  try {
    const validation = insertShowcaseProjectSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        success: false, 
        error: "Validation failed", 
        details: validation.error.issues 
      });
    }

    const [project] = await db
      .insert(showcaseProjects)
      .values({
        ...validation.data,
        freelancerId: req.user!.id,
        status: "approved", // Auto-approve like Behance - portfolios go live immediately
        approvedAt: new Date() // Track when auto-approval happened
      })
      .returning();

    res.status(201).json({ success: true, data: project });
  } catch (error) {
    console.error("Error creating showcase project:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// Get freelancer's own projects - allow both freelancers and admins to test
router.get("/my/projects", requireAuth, requireRole(['freelancer', 'admin']), async (req: AuthenticatedRequest, res) => {
  try {
    const projects = await db
      .select()
      .from(showcaseProjects)
      .where(eq(showcaseProjects.freelancerId, req.user!.id))
      .orderBy(desc(showcaseProjects.createdAt));

    res.json({ success: true, data: projects });
  } catch (error) {
    console.error("Error fetching user projects:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// Update showcase project (freelancer only, own projects)
router.put("/:id", requireAuth, requireRole(['freelancer']), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const validation = insertShowcaseProjectSchema.partial().safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        success: false, 
        error: "Validation failed", 
        details: validation.error.issues 
      });
    }

    // First, get the current project to preserve its status
    const [currentProject] = await db
      .select({ status: showcaseProjects.status })
      .from(showcaseProjects)
      .where(and(
        eq(showcaseProjects.id, id),
        eq(showcaseProjects.freelancerId, req.user!.id)
      ))
      .limit(1);

    if (!currentProject) {
      return res.status(404).json({ success: false, error: "Project not found" });
    }

    // Preserve existing status to prevent bypassing admin rejections
    const [updatedProject] = await db
      .update(showcaseProjects)
      .set({
        ...validation.data,
        // Preserve existing status - never override rejected/suspended projects
        status: currentProject.status,
        updatedAt: new Date()
      })
      .where(and(
        eq(showcaseProjects.id, id),
        eq(showcaseProjects.freelancerId, req.user!.id)
      ))
      .returning();

    if (!updatedProject) {
      return res.status(404).json({ success: false, error: "Project not found or unauthorized" });
    }

    res.json({ success: true, data: updatedProject });
  } catch (error) {
    console.error("Error updating showcase project:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// Delete showcase project (freelancer for own projects, admin for any project)
router.delete("/:id", requireAuth, requireRole(['freelancer', 'admin']), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const isAdmin = req.user!.profile?.role === 'admin';

    // Build condition based on role
    const condition = isAdmin 
      ? eq(showcaseProjects.id, id) // Admin can delete any project
      : and(
          eq(showcaseProjects.id, id),
          eq(showcaseProjects.freelancerId, req.user!.id) // Freelancer can only delete own
        );

    const [deletedProject] = await db
      .delete(showcaseProjects)
      .where(condition)
      .returning();

    if (!deletedProject) {
      return res.status(404).json({ success: false, error: "Project not found or unauthorized" });
    }

    res.json({ success: true, message: "Project deleted successfully" });
  } catch (error) {
    console.error("Error deleting showcase project:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// Admin routes for project approval
router.get("/admin/pending", requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const projects = await db
      .select({
        id: showcaseProjects.id,
        title: showcaseProjects.title,
        description: showcaseProjects.description,
        media: showcaseProjects.media,
        tags: showcaseProjects.tags,
        status: showcaseProjects.status,
        createdAt: showcaseProjects.createdAt,
        freelancer: {
          id: users.id,
          name: profiles.name,
          email: users.email,
        }
      })
      .from(showcaseProjects)
      .leftJoin(users, eq(showcaseProjects.freelancerId, users.id))
      .leftJoin(profiles, eq(users.id, profiles.userId))
      .where(eq(showcaseProjects.status, "pending"))
      .orderBy(desc(showcaseProjects.createdAt));

    res.json({ success: true, data: projects });
  } catch (error) {
    console.error("Error fetching pending projects:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// Get all showcase projects for admin monitoring (live portfolios)
router.get("/admin/all", requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const { search, status = 'approved', sort = 'recent', limit = "50", offset = "0" } = req.query;
    
    // Build conditions array - ensure status is properly typed
    const statusFilter = status as 'pending' | 'approved' | 'rejected';
    const conditions = [eq(showcaseProjects.status, statusFilter)];

    // Apply search filter
    if (search && typeof search === 'string') {
      conditions.push(
        or(
          like(showcaseProjects.title, `%${search}%`),
          like(showcaseProjects.description, `%${search}%`)
        )!
      );
    }

    const query = db
      .select({
        id: showcaseProjects.id,
        title: showcaseProjects.title,
        description: showcaseProjects.description,
        media: showcaseProjects.media,
        tags: showcaseProjects.tags,
        status: showcaseProjects.status,
        viewCount: showcaseProjects.viewCount,
        likeCount: showcaseProjects.likeCount,
        createdAt: showcaseProjects.createdAt,
        approvedAt: showcaseProjects.approvedAt,
        freelancer: {
          id: users.id,
          name: profiles.name,
          displayName: profiles.displayName,
          avatarUrl: profiles.avatarUrl,
          bio: profiles.bio,
        }
      })
      .from(showcaseProjects)
      .leftJoin(users, eq(showcaseProjects.freelancerId, users.id))
      .leftJoin(profiles, eq(users.id, profiles.userId))
      .where(and(...conditions));

    // Apply sorting
    let sortedQuery;
    switch (sort) {
      case 'popular':
        sortedQuery = query.orderBy(desc(showcaseProjects.likeCount));
        break;
      case 'views':
        sortedQuery = query.orderBy(desc(showcaseProjects.viewCount));
        break;
      case 'recent':
      default:
        sortedQuery = query.orderBy(desc(showcaseProjects.createdAt));
        break;
    }

    const projects = await sortedQuery
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string));

    res.json({ success: true, data: projects });
  } catch (error) {
    console.error("Error fetching admin projects:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// Approve/Reject showcase project (admin only) - for suspending live portfolios
router.patch("/:id/status", requireAuth, requireRole(['admin']), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, error: "Invalid status" });
    }

    if (status === 'rejected' && !rejectionReason) {
      return res.status(400).json({ success: false, error: "Rejection reason required" });
    }

    const [updatedProject] = await db
      .update(showcaseProjects)
      .set({
        status,
        rejectionReason: status === 'rejected' ? rejectionReason : null,
        approvedBy: status === 'approved' ? req.user!.id : null,
        approvedAt: status === 'approved' ? new Date() : null,
        updatedAt: new Date()
      })
      .where(eq(showcaseProjects.id, id))
      .returning();

    if (!updatedProject) {
      return res.status(404).json({ success: false, error: "Project not found" });
    }

    res.json({ success: true, data: updatedProject });
  } catch (error) {
    console.error("Error updating project status:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

export default router;