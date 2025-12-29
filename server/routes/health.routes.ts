import { Router } from "express";
import { db } from "../db.js";
import { users, countries, gradeSystems, verificationCodes } from "../../shared/schema";
import { count, lt } from "drizzle-orm";
import { seedCountries } from "../seed-countries.js";

const router = Router();

router.get("/api/health", async (_req, res) => {
  try {
    const startTime = Date.now();
    
    await db.select().from(users).limit(1);
    
    const countriesCount = await db.select({ count: count() }).from(countries);
    const isCountriesHealthy = countriesCount[0].count >= 190;
    
    const gradeSystemsCount = await db.select({ count: count() }).from(gradeSystems);
    const isGradeSystemsHealthy = gradeSystemsCount[0].count >= 2000;
    
    const expiredCodesCount = await db
      .select({ count: count() })
      .from(verificationCodes)
      .where(lt(verificationCodes.expiresAt, new Date()));
    
    const responseTime = Date.now() - startTime;
    
    const healthStatus = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      database: {
        connected: true,
        countries: {
          count: countriesCount[0].count,
          healthy: isCountriesHealthy
        },
        gradeSystems: {
          count: gradeSystemsCount[0].count,
          healthy: isGradeSystemsHealthy
        },
        verificationCodes: {
          expiredCount: expiredCodesCount[0].count,
          needsCleanup: expiredCodesCount[0].count > 100
        }
      },
      services: {
        emailService: "configured",
        smsService: process.env.VONAGE_API_KEY ? "configured" : "missing",
        stripeService: process.env.STRIPE_SECRET_KEY ? "configured" : "missing"
      },
      loginSystem: {
        status: isCountriesHealthy && isGradeSystemsHealthy ? "operational" : "degraded",
        countriesAvailable: isCountriesHealthy,
        gradeSystemsAvailable: isGradeSystemsHealthy
      }
    };
    
    const statusCode = (isCountriesHealthy && isGradeSystemsHealthy) ? 200 : 206;
    res.status(statusCode).json(healthStatus);
    
  } catch (error: any) {
    res.status(503).json({ 
      status: "unhealthy", 
      timestamp: new Date().toISOString(),
      database: "disconnected",
      error: error instanceof Error ? error.message : 'Unknown error',
      loginSystem: {
        status: "unavailable"
      }
    });
  }
});

export default router;
