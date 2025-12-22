import { Response } from "express";
import { ZodError } from "zod";
import { db } from "../db.js";
import { type AuthenticatedRequest, requireRole } from "../middleware/auth.js";
import { 
  projects, 
  projectMilestones,
  insertProjectSchema,
  insertProjectMilestoneSchema 
} from "../../shared/schema.js";
import { eq, desc, and, or, sql, count, like, inArray } from "drizzle-orm";

// CRITICAL SECURITY: Middleware to ensure only freelancers and admins can access these routes
export const requireFreelancerRole = requireRole(['freelancer', 'admin']);

// Enhanced validation schemas using shared schemas with additional rules
const createProjectSchema = insertProjectSchema.extend({
  clientId: insertProjectSchema.shape.clientId,
  budget: insertProjectSchema.shape.budget.optional(), // Handle as string (numeric type)
  deadline: insertProjectSchema.shape.deadline.optional(),
  startDate: insertProjectSchema.shape.startDate.optional(),
}).omit({ freelancerId: true }); // freelancerId will be set from auth

const updateProjectSchema = createProjectSchema.partial().omit({ clientId: true });

const createMilestoneSchema = insertProjectMilestoneSchema.omit({ 
  projectId: true  // projectId will be set from URL params
});

/**
 * GET /api/freelancer/projects/my - Get freelancer's projects
 */
export const getMyProjects = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const { status, limit = 20, offset = 0 } = req.query;
    
    let whereConditions = [eq(projects.freelancerId, userId)];
    
    if (status && typeof status === 'string') {
      whereConditions.push(eq(projects.status, status as any));
    }

    const userProjects = await db
      .select()
      .from(projects)
      .where(and(...whereConditions))
      .orderBy(desc(projects.createdAt))
      .limit(Number(limit))
      .offset(Number(offset));

    res.json({ 
      success: true, 
      data: userProjects,
      total: userProjects.length 
    });
  } catch (error) {
    console.error('Error fetching freelancer projects:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch projects' });
  }
};

/**
 * GET /api/freelancer/projects/:id - Get specific project details
 */
export const getProject = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const project = await db
      .select()
      .from(projects)
      .where(and(
        eq(projects.id, id),
        or(
          eq(projects.freelancerId, userId),
          eq(projects.clientId, userId)
        )
      ))
      .limit(1);

    if (project.length === 0) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    // Also get milestones for this project
    const milestones = await db
      .select()
      .from(projectMilestones)
      .where(eq(projectMilestones.projectId, id))
      .orderBy(projectMilestones.order);

    res.json({ 
      success: true, 
      data: {
        ...project[0],
        milestones
      }
    });
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch project' });
  }
};

/**
 * POST /api/freelancer/projects - Create new project
 */
export const createProject = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const validatedData = createProjectSchema.parse(req.body);
    
    const newProject = await db
      .insert(projects)
      .values({
        ...validatedData,
        freelancerId: userId,
      })
      .returning();

    res.status(201).json({ 
      success: true, 
      data: newProject[0] 
    });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return res.status(400).json({ 
        success: false, 
        error: 'Validation failed',
        details: error.errors 
      });
    }
    
    console.error('Error creating project:', error);
    res.status(500).json({ success: false, error: 'Failed to create project' });
  }
};

/**
 * PUT /api/freelancer/projects/:id - Update project
 */
export const updateProject = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const validatedData = updateProjectSchema.parse(req.body);

    // Verify ownership
    const existingProject = await db
      .select()
      .from(projects)
      .where(and(
        eq(projects.id, id),
        eq(projects.freelancerId, userId)
      ))
      .limit(1);

    if (existingProject.length === 0) {
      return res.status(404).json({ success: false, error: 'Project not found or not owned by user' });
    }

    const updatedProject = await db
      .update(projects)
      .set({
        ...validatedData,
        updatedAt: new Date()
      })
      .where(eq(projects.id, id))
      .returning();

    res.json({ 
      success: true, 
      data: updatedProject[0] 
    });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return res.status(400).json({ 
        success: false, 
        error: 'Validation failed',
        details: error.errors 
      });
    }
    
    console.error('Error updating project:', error);
    res.status(500).json({ success: false, error: 'Failed to update project' });
  }
};

/**
 * DELETE /api/freelancer/projects/:id - Delete project
 */
export const deleteProject = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    // Verify ownership
    const existingProject = await db
      .select()
      .from(projects)
      .where(and(
        eq(projects.id, id),
        eq(projects.freelancerId, userId)
      ))
      .limit(1);

    if (existingProject.length === 0) {
      return res.status(404).json({ success: false, error: 'Project not found or not owned by user' });
    }

    // Delete project milestones first (foreign key constraint)
    await db
      .delete(projectMilestones)
      .where(eq(projectMilestones.projectId, id));

    // Delete project
    await db
      .delete(projects)
      .where(eq(projects.id, id));

    res.json({ success: true, message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ success: false, error: 'Failed to delete project' });
  }
};

/**
 * POST /api/freelancer/projects/:id/milestones - Add milestone to project
 */
export const addMilestone = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const validatedData = createMilestoneSchema.parse(req.body);

    // Verify project ownership
    const project = await db
      .select()
      .from(projects)
      .where(and(
        eq(projects.id, id),
        eq(projects.freelancerId, userId)
      ))
      .limit(1);

    if (project.length === 0) {
      return res.status(404).json({ success: false, error: 'Project not found or not owned by user' });
    }

    const newMilestone = await db
      .insert(projectMilestones)
      .values({
        ...validatedData,
        projectId: id,
      })
      .returning();

    res.status(201).json({ 
      success: true, 
      data: newMilestone[0] 
    });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return res.status(400).json({ 
        success: false, 
        error: 'Validation failed',
        details: error.errors 
      });
    }
    
    console.error('Error adding milestone:', error);
    res.status(500).json({ success: false, error: 'Failed to add milestone' });
  }
};