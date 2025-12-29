import { Router, Request, Response } from "express";
import { db } from "../db";
import { freelancerServices, profiles } from "../../shared/schema";
import { eq, desc, and, ilike, or, sql } from "drizzle-orm";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const { 
      category, 
      search, 
      page = "1",
      limit = "20"
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string) || 20));
    const offset = (pageNum - 1) * limitNum;

    const conditions = [eq(freelancerServices.status, "published")];

    if (category) {
      conditions.push(eq(freelancerServices.category, category as string));
    }

    if (search) {
      conditions.push(
        or(
          ilike(freelancerServices.title, `%${search}%`),
          ilike(freelancerServices.description, `%${search}%`)
        )!
      );
    }

    const services = await db
      .select()
      .from(freelancerServices)
      .where(and(...conditions))
      .orderBy(desc(freelancerServices.createdAt))
      .limit(limitNum)
      .offset(offset);

    const servicesWithFreelancer = await Promise.all(
      services.map(async (service) => {
        const [profile] = await db
          .select({
            id: profiles.id,
            userId: profiles.userId,
            name: profiles.name,
            profilePicture: profiles.profilePicture,
          })
          .from(profiles)
          .where(eq(profiles.userId, service.freelancerId))
          .limit(1);
        
        return {
          ...service,
          freelancer: profile || null,
        };
      })
    );

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(freelancerServices)
      .where(and(...conditions));

    res.json({
      success: true,
      services: servicesWithFreelancer,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count,
        totalPages: Math.ceil(count / limitNum),
      }
    });
  } catch (error) {
    console.error("Error fetching marketplace services:", error);
    res.status(500).json({ error: "Failed to fetch services" });
  }
});

router.get("/categories", async (req: Request, res: Response) => {
  try {
    const categories = await db
      .selectDistinct({ category: freelancerServices.category })
      .from(freelancerServices)
      .where(eq(freelancerServices.status, "published"));

    res.json({ 
      success: true, 
      categories: categories.map(c => c.category).filter(Boolean) 
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const [service] = await db
      .select()
      .from(freelancerServices)
      .where(eq(freelancerServices.id, id));

    if (!service) {
      return res.status(404).json({ error: "Service not found" });
    }

    if (service.status !== "published") {
      return res.status(404).json({ error: "Service not found" });
    }

    const [profile] = await db
      .select({
        id: profiles.id,
        userId: profiles.userId,
        name: profiles.name,
        profilePicture: profiles.profilePicture,
        bio: profiles.bio,
      })
      .from(profiles)
      .where(eq(profiles.userId, service.freelancerId))
      .limit(1);

    await db
      .update(freelancerServices)
      .set({ viewCount: (service.viewCount || 0) + 1 })
      .where(eq(freelancerServices.id, id));

    res.json({ 
      success: true, 
      service: {
        ...service,
        freelancer: profile || null,
      }
    });
  } catch (error) {
    console.error("Error fetching service:", error);
    res.status(500).json({ error: "Failed to fetch service" });
  }
});

export default router;
