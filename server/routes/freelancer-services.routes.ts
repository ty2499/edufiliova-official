import { Router, Response } from "express";
import { db } from "../db";
import { freelancerServices, profiles } from "../../shared/schema";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth, requireRole, type AuthenticatedRequest } from "../middleware/auth";
import { z } from "zod";

const router = Router();

const packageSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  price: z.number().min(1),
  deliveryDays: z.number().int().min(1).max(365),
  revisions: z.number().int().min(0).max(99).optional(),
  features: z.array(z.string()).optional(),
});

const addOnSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(300).optional(),
  price: z.number().min(0),
  deliveryDaysExtra: z.number().int().min(0).optional(),
});

const createServiceSchema = z.object({
  title: z.string().min(5).max(100),
  description: z.string().min(20).max(5000),
  category: z.string().min(1).max(100),
  tags: z.array(z.string().max(50)).max(10).optional(),
  images: z.array(z.string().url()).max(10).optional(),
  packages: z.object({
    basic: packageSchema,
    standard: packageSchema.optional(),
    premium: packageSchema.optional(),
  }),
  addOns: z.array(addOnSchema).max(10).optional(),
});

const updateServiceSchema = createServiceSchema.partial();

router.post("/", requireAuth, requireRole(['freelancer']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const validated = createServiceSchema.parse(req.body);

    const [service] = await db.insert(freelancerServices).values({
      freelancerId: userId,
      title: validated.title,
      description: validated.description,
      category: validated.category,
      tags: validated.tags || [],
      images: validated.images || [],
      packages: validated.packages,
      addOns: validated.addOns || [],
      status: "draft",
    }).returning();

    res.status(201).json({ success: true, service });
  } catch (error) {
    console.error("Error creating service:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation failed", details: error.errors });
    }
    res.status(500).json({ error: "Failed to create service" });
  }
});

router.get("/my", requireAuth, requireRole(['freelancer']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const services = await db
      .select()
      .from(freelancerServices)
      .where(eq(freelancerServices.freelancerId, userId))
      .orderBy(desc(freelancerServices.createdAt));

    res.json({ success: true, services });
  } catch (error) {
    console.error("Error fetching services:", error);
    res.status(500).json({ error: "Failed to fetch services" });
  }
});

router.get("/:id", requireAuth, requireRole(['freelancer']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const [service] = await db
      .select()
      .from(freelancerServices)
      .where(and(
        eq(freelancerServices.id, id),
        eq(freelancerServices.freelancerId, userId)
      ));

    if (!service) {
      return res.status(404).json({ error: "Service not found" });
    }

    res.json({ success: true, service });
  } catch (error) {
    console.error("Error fetching service:", error);
    res.status(500).json({ error: "Failed to fetch service" });
  }
});

router.put("/:id", requireAuth, requireRole(['freelancer']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const [existing] = await db
      .select()
      .from(freelancerServices)
      .where(and(
        eq(freelancerServices.id, id),
        eq(freelancerServices.freelancerId, userId)
      ));

    if (!existing) {
      return res.status(404).json({ error: "Service not found" });
    }

    const validated = updateServiceSchema.parse(req.body);

    const [updated] = await db
      .update(freelancerServices)
      .set({
        ...validated,
        updatedAt: new Date(),
      })
      .where(eq(freelancerServices.id, id))
      .returning();

    res.json({ success: true, service: updated });
  } catch (error) {
    console.error("Error updating service:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation failed", details: error.errors });
    }
    res.status(500).json({ error: "Failed to update service" });
  }
});

router.post("/:id/publish", requireAuth, requireRole(['freelancer']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const [existing] = await db
      .select()
      .from(freelancerServices)
      .where(and(
        eq(freelancerServices.id, id),
        eq(freelancerServices.freelancerId, userId)
      ));

    if (!existing) {
      return res.status(404).json({ error: "Service not found" });
    }

    const packages = existing.packages as any;
    if (!packages?.basic?.price) {
      return res.status(400).json({ error: "Service must have at least a basic package with price to publish" });
    }

    const [updated] = await db
      .update(freelancerServices)
      .set({ status: "published", updatedAt: new Date() })
      .where(eq(freelancerServices.id, id))
      .returning();

    res.json({ success: true, service: updated });
  } catch (error) {
    console.error("Error publishing service:", error);
    res.status(500).json({ error: "Failed to publish service" });
  }
});

router.post("/:id/pause", requireAuth, requireRole(['freelancer']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const [existing] = await db
      .select()
      .from(freelancerServices)
      .where(and(
        eq(freelancerServices.id, id),
        eq(freelancerServices.freelancerId, userId)
      ));

    if (!existing) {
      return res.status(404).json({ error: "Service not found" });
    }

    const [updated] = await db
      .update(freelancerServices)
      .set({ status: "paused", updatedAt: new Date() })
      .where(eq(freelancerServices.id, id))
      .returning();

    res.json({ success: true, service: updated });
  } catch (error) {
    console.error("Error pausing service:", error);
    res.status(500).json({ error: "Failed to pause service" });
  }
});

router.delete("/:id", requireAuth, requireRole(['freelancer']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const [existing] = await db
      .select()
      .from(freelancerServices)
      .where(and(
        eq(freelancerServices.id, id),
        eq(freelancerServices.freelancerId, userId)
      ));

    if (!existing) {
      return res.status(404).json({ error: "Service not found" });
    }

    await db.delete(freelancerServices).where(eq(freelancerServices.id, id));

    res.json({ success: true, message: "Service deleted" });
  } catch (error) {
    console.error("Error deleting service:", error);
    res.status(500).json({ error: "Failed to delete service" });
  }
});

export default router;
