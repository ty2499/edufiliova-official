    }
  });

  // Clean up expired verification codes periodically
  const cleanupExpiredCodes = async () => {
    try {
      const now = new Date();
      const deleted = await db.delete(verificationCodes).where(
        or(
          lt(verificationCodes.expiresAt, now),
          eq(verificationCodes.isUsed, true)
        )
      );
      console.log('🧹 Cleaned up expired verification codes');
    } catch (error: any) {
      console.error('❌ Failed to cleanup verification codes:', error);
    }
  };

  // Run cleanup every 30 minutes
  setInterval(cleanupExpiredCodes, 30 * 60 * 1000);
  
  // Run initial cleanup
  cleanupExpiredCodes();

  // Mount community routes
  app.use('/api/community', communityRouter);
  // Mount certificate payment routes
  app.use(certificatePaymentRoutes);

  // Mount showcase portfolio routes
  app.use('/api/showcase', showcaseRoutes);
  
  // Mount portfolio routes (Behance-like works system)
  app.use('/api/portfolio', portfolioRoutes);

  // Mount products shop routes
  app.use('/api/products', productsRoutes);

  // Mount cart management routes
  app.use('/api/cart', cartRoutes);

  // Mount orders management routes  
  app.use('/api/orders', ordersRoutes);

  // Mount admin coupon management routes
  app.use('/api/certificates', certificateRoutes);
  app.use('/api/admin/courses', requireAuth, requireAdmin, adminCourseRoutes);
  app.use('/api/admin/coupons', adminCouponsRoutes);
  app.use('/api/admin/api-keys', requireAuth, requireAdmin, adminApiKeysRoutes);
  app.use('/api/admin/manual-plan-assignments', requireAuth, manualPlanAssignmentRoutes);
  app.use('/api', contactSubmissionsRoutes);
  app.use('/api/admin/profile-boost', requireAuth, requireAdmin, profileBoostRoutes);
  // Mount creator payouts routes
  app.use('/api/creator-payouts', creatorPayoutsRouter);
  registerFinancialStatsRoutes(app);
  registerLessonContentBlockRoutes(app, requireAuth);
  app.use('/api', adminTransactionsRoutes);
  app.use('/api/admin/storage', storageStatusRoutes);
  app.use('/api/admin/work-boost', requireAuth, requireAdmin, workBoostRoutes);

  // PayPal routes - Referenced from PayPal integration blueprint
  app.get("/api/paypal/setup", async (req, res) => {
    await loadPaypalDefault(req, res);
  });

  app.post("/api/paypal/order", async (req, res) => {
    // Request body should contain: { intent, amount, currency }
    await createPaypalOrder(req, res);
  });

  app.post("/api/paypal/order/:orderID/capture", async (req, res) => {
  
    await capturePaypalOrder(req, res);
  });

  // DoDo Pay routes
  app.use("/api/dodopay", dodopayRoutes);

  // VodaPay routes
  app.use("/api/vodapay", vodapayRoutes);

  // EcoCash routes (Zimbabwe only)
  app.use("/api", ecocashRoutes);

  // Advertisement routes - Full CRUD Management System
  app.get('/api/ads/manage', requireAuth, adsRoutes.getManageAds);           // Get all ads (admin) or user's own ads
  app.get('/api/ads/my-ads', requireAuth, adsRoutes.getMyAds);               // Get current user's ads
  app.post('/api/ads/create', requireAuth, adsRoutes.createAd);              // Create ad (admin only - free)
  app.put('/api/ads/:id', requireAuth, adsRoutes.updateAd);                  // Edit ad (admin or owner)
  app.delete('/api/ads/:id', requireAuth, adsRoutes.deleteAd);               // Delete ad (admin or owner)
  app.post('/api/ads/approve/:id', requireAuth, adsRoutes.approveAd);        // Approve ad (admin only)
  app.post('/api/ads/reject/:id', requireAuth, adsRoutes.rejectAd);          // Reject ad (admin only)
  app.get('/api/ads/active', adsRoutes.getActiveAds);                        // Get active ads for dashboard
  app.post('/api/ads/impression', adsRoutes.trackImpression);                // Track impressions
  app.post('/api/ads/click', adsRoutes.trackClick);                          // Track clicks
  app.get('/api/ads/pricing-config', requireAuth, adsRoutes.getPricingConfig);    // Get pricing config (admin)
  app.put('/api/ads/pricing-config/:id', requireAuth, adsRoutes.updatePricingConfig); // Update pricing (admin)
  app.delete('/api/ads/pricing-config/:id', requireAuth, adsRoutes.deletePricingConfig); // Delete pricing (admin)
  app.post('/api/ads/calculate-price', adsRoutes.calculatePrice);            // Calculate ad price

  // Banner Payment Routes
  app.post('/api/ads/banner/create-with-payment', requireAuth, bannerPaymentRoutes.createBannerWithPayment);
  app.post('/api/ads/banner/confirm-payment', requireAuth, bannerPaymentRoutes.confirmBannerPayment);
  app.post('/api/ads/banner/confirm-paypal-payment', bannerPaymentRoutes.confirmPayPalBannerPayment);
  app.get('/api/ads/banner/payment-success', bannerPaymentRoutes.handlePaymentSuccess);
  app.delete('/api/ads/banner/:bannerId', requireAuth, bannerPaymentRoutes.deleteBannerAd);
  app.put('/api/ads/banner/:bannerId', requireAuth, bannerPaymentRoutes.updateBannerAd);

  // Hero Sections Routes - Admin management and public display
  app.get('/api/hero-sections/manage', requireAuth, heroSectionRoutes.getManageHeroSections);   // Get all hero sections (admin only)
  app.get('/api/hero-sections/my-hero-sections', requireAuth, heroSectionRoutes.getMyHeroSections);  // Get current user's hero sections
  app.post('/api/hero-sections/create', requireAuth, heroSectionRoutes.createHeroSection);     // Create hero section (admin only)
  app.put('/api/hero-sections/:id', requireAuth, heroSectionRoutes.updateHeroSection);        // Update hero section
  app.delete('/api/hero-sections/:id', requireAuth, heroSectionRoutes.deleteHeroSection);     // Delete hero section
  app.put('/api/hero-sections/:id/status', requireAuth, heroSectionRoutes.updateHeroSectionStatus); // Update hero section status (admin only)
  app.get('/api/hero-sections/active', heroSectionRoutes.getActiveHeroSections);              // Get active hero sections for display
  app.post('/api/hero-sections/impression', heroSectionRoutes.trackImpression);               // Track hero section impressions
  app.post('/api/hero-sections/click', heroSectionRoutes.trackClick);                         // Track hero section clicks

  // Freelancer Projects Routes - Secured with role-based authorization
  app.get('/api/freelancer/projects/my', requireFreelancerRole, freelancerProjectRoutes.getMyProjects);         // Get freelancer's projects
  app.get('/api/freelancer/projects/:id', requireFreelancerRole, freelancerProjectRoutes.getProject);           // Get specific project details
  app.post('/api/freelancer/projects', requireFreelancerRole, freelancerProjectRoutes.createProject);           // Create new project
  app.put('/api/freelancer/projects/:id', requireFreelancerRole, freelancerProjectRoutes.updateProject);        // Update project
  app.delete('/api/freelancer/projects/:id', requireFreelancerRole, freelancerProjectRoutes.deleteProject);     // Delete project
  app.post('/api/freelancer/projects/:id/milestones', requireFreelancerRole, freelancerProjectRoutes.addMilestone); // Add milestone to project
  
  // Freelancer stats endpoint
  app.get('/api/freelancer/stats', requireAuth, requireFreelancerRole, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
      }

      // Calculate freelancer stats
      const userProjects = await db
        .select()
        .from(projects)
        .where(eq(projects.freelancerId, userId));

      const completedProjects = userProjects.filter(p => p.status === 'completed');
      const averageRating = completedProjects.length > 0 
        ? completedProjects.reduce((sum, p) => sum + (p.feedbackRating ?? 0), 0) / completedProjects.length 
        : 0;

      const stats = {
        averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
        totalReviews: completedProjects.filter(p => (p.feedbackRating ?? 0) > 0).length
      };

      res.json(stats);
    } catch (error: any) {
      console.error('Error fetching freelancer stats:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch stats' });
    }
  });

  // Profile Statistics Endpoints - views, likes, follows
  
  // Get all freelancers - supports filtering, sorting, and pagination
  app.get('/api/freelancers', async (req: Request, res: Response) => {
    try {
      const { sort = 'rating', page = 1, limit = 12 } = req.query;

      const freelancers = await db
        .select()
        .from(profiles)
        .where(eq(profiles.role, 'freelancer'))
        .orderBy(desc(profiles.createdAt))
        .limit(Number(limit))
        .offset((Number(page) - 1) * Number(limit));

      // Get portfolio stats for each freelancer
      const portfolioStats = await db
        .select({
          userId: works.userId,
          worksCount: count(works.id),
          totalLikes: sum(works.likesCount),
        })
        .from(works)
        .where(inArray(works.userId, freelancers.map(f => f.userId)))
        .groupBy(works.userId);

      const portfolioStatsMap = portfolioStats.reduce((acc, stat) => {
        acc[stat.userId] = {
          worksCount: Number(stat.worksCount) || 0,
          totalLikes: Number(stat.totalLikes) || 0,
        };
        return acc;
      }, {} as Record<string, { worksCount: number; totalLikes: number }>);

      const transformedFreelancers = freelancers.map(f => ({
        id: f.userId,
        name: f.name || '',
        displayName: f.displayName || f.name || '',
        avatarUrl: f.avatarUrl,
        coverImageUrl: f.coverImageUrl,
        bio: f.bio,
        title: f.professionalTitle,
        skills: f.skills || [],
        hourlyRate: f.hourlyRate ? Number(f.hourlyRate) : null,
        location: f.location,
        rating: f.averageRating ? Number(f.averageRating) : 0,
        reviewCount: f.clientReviews || 0,
        completedProjects: f.completedProjects || 0,
        isOnline: f.isOnline || false,
        profileViews: f.profileViews || 0,
        joinedAt: f.createdAt?.toISOString() || new Date().toISOString(),
        verificationBadge: f.verificationBadge,
        responseTime: f.responseTime,
        workAvailability: f.workAvailability,
        likesCount: (portfolioStatsMap[f.userId]?.totalLikes || 0) + (f.likesCount || 0),
        worksShared: portfolioStatsMap[f.userId]?.worksCount || 0,
      }));

      res.json({ success: true,
        success: true,
        data: transformedFreelancers,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          hasMore: freelancers.length === Number(limit)
        }
      });
    } catch (error: any) {
      console.error('Error fetching freelancers:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch freelancers' });
    }
  });
  app.get('/api/freelancers/:id/stats', async (req: Request, res: Response) => {
    try {
      const freelancerId = req.params.id; // This is the user ID
      const viewerUserId = (req as any).user?.id;
      
      // Look up the profile ID from the user ID
      const profile = await db.select({ id: profiles.id })
        .from(profiles)
        .where(eq(profiles.userId, freelancerId))
        .limit(1);
      
      if (profile.length === 0) {
        return res.status(404).json({ success: false, error: 'Profile not found' });
      }
      
      const profileId = profile[0].id;
      const stats = await storage.getProfileStats(profileId, viewerUserId);
      res.json(stats);
    } catch (error: any) {
      console.error('Error fetching profile stats:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch profile stats' });
    }
  });

  // Get freelancer profile
  app.get('/api/freelancers/:id/profile', async (req: Request, res: Response) => {
    try {
      const freelancerId = req.params.id; // This is the user ID
      
      // Fetch the complete profile data
      const profileData = await db
        .select()
        .from(profiles)
        .where(eq(profiles.userId, freelancerId))
        .limit(1);
      
      if (profileData.length === 0) {
        return res.status(404).json({ success: false, error: 'Freelancer profile not found' });
      }
      
      const profile = profileData[0];
      
      // Return the profile data in the format expected by the frontend
      res.json({ success: true,
        success: true,
        data: {
          id: profile.id,
          userId: profile.userId,
          name: profile.name || '',
          displayName: profile.displayName || profile.name || '',
          professionalTitle: profile.professionalTitle || '',
          tagline: profile.tagline || '',
          email: profile.email || '',
          contactEmail: profile.contactEmail || profile.email || '',
          avatarUrl: profile.avatarUrl,
          coverImageUrl: profile.coverImageUrl,
          bio: profile.bio,
          professionalStatement: profile.professionalStatement,
          location: profile.location,
          country: profile.country,
          hourlyRate: profile.hourlyRate,
          experienceYears: profile.experienceYears,
          skills: profile.skills,
          languages: profile.languages,
          education: profile.education,
          certifications: profile.certifications,
          portfolioUrl: profile.portfolioUrl,
          websiteUrl: profile.websiteUrl,
          linkedinUrl: profile.linkedinUrl,
          twitterUrl: profile.twitterUrl,
          instagramUrl: profile.instagramUrl,
          behanceUrl: profile.behanceUrl,
          dribbbleUrl: profile.dribbbleUrl,
          githubUrl: profile.githubUrl,
          availability: profile.availability,
          role: profile.role,
          approvalStatus: profile.approvalStatus,
          qualifications: profile.qualifications,
          experience: profile.experience,
          availableHours: profile.availableHours,
          verificationBadge: profile.verificationBadge,
          verified: profile.verified,
          verificationBadges: profile.verificationBadges,
          profileViews: profile.profileViews,
          likesCount: profile.likesCount,
          followersCount: profile.followersCount,
          completedProjects: profile.completedProjects,
          reviewCount: profile.reviewCount || profile.clientReviews,
          rating: profile.rating || profile.averageRating,
          responseTime: profile.responseTime,
          workAvailability: profile.workAvailability,
          yearsOfExperience: profile.yearsOfExperience || profile.experienceYears,
          phoneNumber: profile.phoneNumber,
          socialLinks: profile.socialLinks,
          joinedAt: profile.createdAt
        }
      });
    } catch (error: any) {
      console.error('Error fetching freelancer profile:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch freelancer profile' });
    }
  });

  // Get freelancer portfolio works
  app.get('/api/freelancers/:id/portfolio', async (req: Request, res: Response) => {
    try {
      const freelancerId = req.params.id; // This is the user ID
      
      // First get the profile to verify the freelancer exists
      const profileData = await db
        .select({ id: profiles.id })
        .from(profiles)
        .where(eq(profiles.userId, freelancerId))
        .limit(1);
      
      if (profileData.length === 0) {
        return res.status(404).json({ success: false, error: 'Freelancer not found' });
      }
      
      // Fetch portfolio works for this freelancer
      const portfolioWorks = await db
        .select()
        .from(works)
        .where(eq(works.userId, freelancerId))
        .orderBy(desc(works.createdAt));
      
      // Fetch media for each work
      const worksWithMedia = await Promise.all(
        portfolioWorks.map(async (work) => {
          const media = await db
            .select()
            .from(workMedia)
            .where(eq(workMedia.workId, work.id))
            .orderBy(asc(workMedia.sortOrder));
          
          return {
            ...work,
            media
          };
        })
      );
      
      res.json({ success: true,
        success: true,
        data: worksWithMedia
      });
    } catch (error: any) {
      console.error('Error fetching freelancer portfolio:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch portfolio' });
    }
  });

  app.post('/api/freelancers/:id/views', async (req: Request, res: Response) => {
    try {
      const freelancerId = req.params.id; // This is the user ID
      const viewerUserId = (req as any).user?.id;
      const { visitorId, sessionId, ipHash, uaHash, referer } = req.body;
      
      // Look up the profile ID from the user ID
      const profile = await db.select({ id: profiles.id })
        .from(profiles)
        .where(eq(profiles.userId, freelancerId))
        .limit(1);
      
      if (profile.length === 0) {
        return res.status(404).json({ success: false, error: 'Profile not found' });
      }
      
      const profileId = profile[0].id;
      
      const recorded = await storage.recordProfileView(profileId, {
        viewerUserId,
        visitorId,
        sessionId,
        ipHash,
        uaHash,
        referer
      });
      
      res.json({ success: true, recorded });
    } catch (error: any) {
      console.error('Error recording profile view:', error);
      res.status(500).json({ success: false, error: 'Failed to record view' });
    }
  });

  app.post('/api/freelancers/:id/likes', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const freelancerId = req.params.id; // This is the user ID
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Authentication required to like profiles' });
      }
      
      // Look up the profile ID from the user ID
      const profile = await db.select({ id: profiles.id })
        .from(profiles)
        .where(eq(profiles.userId, freelancerId))
        .limit(1);
      
      if (profile.length === 0) {
        return res.status(404).json({ success: false, error: 'Profile not found' });
      }
      
      const profileId = profile[0].id;
      const result = await storage.toggleProfileLike(profileId, userId);
      res.json({ success: true, ...result });
    } catch (error: any) {
      console.error('Error toggling profile like:', error);
      res.status(500).json({ success: false, error: 'Failed to toggle like' });
    }
  });

  app.post('/api/freelancers/:id/follows', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const freelancerId = req.params.id; // This is the user ID
      const followerUserId = req.user?.id;
      
      if (!followerUserId) {
        return res.status(401).json({ success: false, error: 'Authentication required to follow profiles' });
      }
      
      // Look up the profile ID from the user ID
      const profile = await db.select({ id: profiles.id })
        .from(profiles)
        .where(eq(profiles.userId, freelancerId))
        .limit(1);
      
      if (profile.length === 0) {
        return res.status(404).json({ success: false, error: 'Profile not found' });
      }
      
      const profileId = profile[0].id;
      const result = await storage.toggleProfileFollow(profileId, followerUserId);
      res.json({ success: true, isFollowing: result.following, followersCount: result.followersCount });
    } catch (error: any) {
      console.error('Error toggling profile follow:', error);
      res.status(500).json({ success: false, error: 'Failed to toggle follow' });
    }
  });

  // Comprehensive health check endpoint
  app.get("/api/health", async (_req, res) => {
    try {
      const startTime = Date.now();
      
      // Database connectivity check
      await db.select().from(users).limit(1);
      
      // Check if countries are properly seeded
      const countriesCount = await db.select({ count: count() }).from(countries);
      const isCountriesHealthy = countriesCount[0].count >= 190; // Should have ~199 countries
      
      // Check if grade systems are properly seeded
      const gradeSystemsCount = await db.select({ count: count() }).from(gradeSystems);
      const isGradeSystemsHealthy = gradeSystemsCount[0].count >= 2000; // Should have ~2987 grade systems
      
      // Check verification codes cleanup
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

  // Countries API with auto-recovery
  app.get("/api/countries", async (_req, res) => {
    try {
      const countriesData = await db.select().from(countries).orderBy(countries.name);
      
      // Auto-recovery: If countries data is missing or corrupted, re-seed
      if (countriesData.length < 190) {
        // Countries data incomplete - triggering auto-recovery
        await seedCountries();
        const reseededCountries = await db.select().from(countries).orderBy(countries.name);
        return res.json({ success: true, data: reseededCountries, recovered: true });
      }
      
      res.json({ success: true, data: countriesData });
    } catch (error: any) {
      console.error('Countries fetch error:', error);
      
      // Try to recover by reseeding
      try {
        // Attempting database recovery
        await seedCountries();
        const recoveredCountries = await db.select().from(countries).orderBy(countries.name);
        return res.json({ success: true, data: recoveredCountries, recovered: true });
      } catch (recoveryError) {
        // Database recovery failed
        // Fallback to static countries data when database fails
        console.log('🔄 Using fallback countries data due to database connectivity issues');
        const fallbackCountries = WORLD_COUNTRIES.map((country, index) => ({
          id: index + 1,
          code: country.code,
          name: country.name,
          gradeSystemType: country.gradeSystemType,
          createdAt: new Date()
        }));
        res.json({ success: true, data: fallbackCountries, fallback: true });
      }
    }
  });

  // Location detection API - returns user's detected location
  app.get("/api/location/detect", (req, res) => {
    try {
      const location = req.userLocation;
      
      if (!location) {
        return res.json({ success: true,
          country: 'Unknown',
          city: 'Unknown',
          region: 'Unknown'
        });
      }

      res.json({ success: true,
        country: location.country || 'Unknown',
        city: location.city || 'Unknown',
        region: location.region || 'Unknown',
        timezone: location.timezone,
        latitude: location.latitude,
        longitude: location.longitude
      });
    } catch (error: any) {
      console.error('Location detection error:', error);
      res.json({ success: true,
        country: 'Unknown',
        city: 'Unknown',
        region: 'Unknown'
      });
    }
  });

  // Cities API by country
  app.get("/api/cities/:countryCode", async (req, res) => {
    try {
      const { countryCode } = req.params;
      
      // Handle country code mapping for cities
      // Some countries have different codes in the countries table vs cities table
      const countryCodeMapping: { [key: string]: string } = {
        'UK': 'GB',  // United Kingdom maps to Great Britain in cities
        // Add more mappings as needed
      };
      
      const actualCountryCode = countryCodeMapping[countryCode] || countryCode;
      
      const citiesData = await db
        .select({
          id: sql`cities.id`,
          name: sql`cities.name`,
          countryCode: sql`cities.country_code`,
          isMajor: sql`cities.is_major`
        })
        .from(sql`cities`)
        .where(sql`cities.country_code = ${actualCountryCode}`)
        .orderBy(sql`cities.name`);
      
      res.json({ success: true, data: citiesData });
    } catch (error: any) {
      console.error('Cities fetch error:', error);
      // Return empty array if no cities found for this country
      res.json({ success: true, data: [] });
    }
  });

  // Grade systems API with auto-recovery
  app.get("/api/grade-systems/:countryId", async (req, res) => {
    try {
      const countryId = parseInt(req.params.countryId);
      const gradeSystemsData = await db
        .select()
        .from(gradeSystems)
        .where(eq(gradeSystems.countryId, countryId))
        .orderBy(gradeSystems.gradeNumber);
      
      // Auto-recovery: If grade systems data is missing for this country, re-seed
      if (gradeSystemsData.length === 0) {
        console.log(`⚠️ Grade systems data missing for country ${countryId}, triggering auto-recovery...`);
        await seedGradeSystems();
        const reseededGrades = await db
          .select()
          .from(gradeSystems)
          .where(eq(gradeSystems.countryId, countryId))
          .orderBy(gradeSystems.gradeNumber);
        console.log('✅ Grade systems auto-recovery completed');
        return res.json({ success: true, data: reseededGrades, recovered: true });
      }
      
      res.json({ success: true, data: gradeSystemsData });
    } catch (error: any) {
      console.error('Grade systems fetch error:', error);
      
      // Try to recover by reseeding
      try {
        console.log('🔄 Attempting grade systems recovery...');
        await seedGradeSystems();
        const recoveredGrades = await db
          .select()
          .from(gradeSystems)
          .where(eq(gradeSystems.countryId, parseInt(req.params.countryId)))
          .orderBy(gradeSystems.gradeNumber);
        console.log('✅ Grade systems recovery successful');
        return res.json({ success: true, data: recoveredGrades, recovered: true });
      } catch (recoveryError) {
        console.error('❌ Grade systems recovery failed:', recoveryError);
        // Fallback to default grade system when database fails
        console.log('🔄 Using fallback grade systems data due to database connectivity issues');
        const fallbackGrades = [
          { id: 1, countryId: parseInt(req.params.countryId), gradeNumber: 1, displayName: "Grade 1", educationLevel: "Primary", ageRange: "6-7", createdAt: new Date() },
          { id: 2, countryId: parseInt(req.params.countryId), gradeNumber: 2, displayName: "Grade 2", educationLevel: "Primary", ageRange: "7-8", createdAt: new Date() },
          { id: 3, countryId: parseInt(req.params.countryId), gradeNumber: 3, displayName: "Grade 3", educationLevel: "Primary", ageRange: "8-9", createdAt: new Date() },
          { id: 4, countryId: parseInt(req.params.countryId), gradeNumber: 4, displayName: "Grade 4", educationLevel: "Primary", ageRange: "9-10", createdAt: new Date() },
          { id: 5, countryId: parseInt(req.params.countryId), gradeNumber: 5, displayName: "Grade 5", educationLevel: "Primary", ageRange: "10-11", createdAt: new Date() },
          { id: 6, countryId: parseInt(req.params.countryId), gradeNumber: 6, displayName: "Grade 6", educationLevel: "Primary", ageRange: "11-12", createdAt: new Date() },
          { id: 7, countryId: parseInt(req.params.countryId), gradeNumber: 7, displayName: "Grade 7", educationLevel: "Secondary", ageRange: "12-13", createdAt: new Date() },
          { id: 8, countryId: parseInt(req.params.countryId), gradeNumber: 8, displayName: "Grade 8", educationLevel: "Secondary", ageRange: "13-14", createdAt: new Date() },
          { id: 9, countryId: parseInt(req.params.countryId), gradeNumber: 9, displayName: "Grade 9", educationLevel: "Secondary", ageRange: "14-15", createdAt: new Date() },
          { id: 10, countryId: parseInt(req.params.countryId), gradeNumber: 10, displayName: "Grade 10", educationLevel: "Secondary", ageRange: "15-16", createdAt: new Date() },
          { id: 11, countryId: parseInt(req.params.countryId), gradeNumber: 11, displayName: "Grade 11", educationLevel: "Secondary", ageRange: "16-17", createdAt: new Date() },
          { id: 12, countryId: parseInt(req.params.countryId), gradeNumber: 12, displayName: "Grade 12", educationLevel: "Secondary", ageRange: "17-18", createdAt: new Date() },
          { id: 13, countryId: parseInt(req.params.countryId), gradeNumber: 13, displayName: "College", educationLevel: "College", ageRange: "18+", createdAt: new Date() },
          { id: 14, countryId: parseInt(req.params.countryId), gradeNumber: 14, displayName: "University", educationLevel: "University", ageRange: "18+", createdAt: new Date() },
          { id: 15, countryId: parseInt(req.params.countryId), gradeNumber: 15, displayName: "Other", educationLevel: "Other", ageRange: "Any", createdAt: new Date() }
        ];
        res.json({ success: true, data: fallbackGrades, fallback: true });
      }
    }
  });

  // Get current user profile (for refreshing auth state)
  app.get("/api/auth/profile", async (req, res) => {
    try {
      const authHeader = req.headers.authorization as string;
      const user = await getUserFromSession(authHeader);
      
      if (!user) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
      }

      // Get fresh profile data from database
      const profile = await db.select()
        .from(profiles)
        .where(eq(profiles.userId, user.id))
        .limit(1);

      if (profile.length === 0) {
        return res.status(404).json({ success: false, error: 'Profile not found' });
      }

      // Fetch application status for teachers and freelancers
      let teacherApplicationStatus = null;
      let freelancerApplicationStatus = null;
      
      if (profile[0].role === 'teacher') {
        const teacherApp = await db.select({
          id: teacherApplications.id,
          status: teacherApplications.status,
          submittedAt: teacherApplications.createdAt
        })
          .from(teacherApplications)
          .where(eq(teacherApplications.userId, user.id))
          .limit(1);
        
        if (teacherApp.length > 0) {
          teacherApplicationStatus = {
            id: teacherApp[0].id,
            status: teacherApp[0].status,
            submittedAt: teacherApp[0].submittedAt
          };
        }
      } else if (profile[0].role === 'freelancer') {
        const freelancerApp = await db.select({
          id: freelancerApplications.id,
          status: freelancerApplications.status,
          createdAt: freelancerApplications.createdAt,
          approvedAt: freelancerApplications.approvedAt
        })
          .from(freelancerApplications)
          .where(eq(freelancerApplications.userId, user.id))
          .limit(1);
        
        if (freelancerApp.length > 0) {
          freelancerApplicationStatus = {
            id: freelancerApp[0].id,
            status: freelancerApp[0].status,
            createdAt: freelancerApp[0].createdAt,
            approvedAt: freelancerApp[0].approvedAt
          };
        }
      }

      res.json({ success: true,
        success: true,
        user: {
          id: user.id,
          userId: user.userId,
          email: user.email
        },
        profile: profile[0],
        teacherApplicationStatus,
        freelancerApplicationStatus
      });

    } catch (error: any) {
      console.error('Get profile error:', error);
      res.status(500).json({ success: false, error: 'Failed to get profile' });
    }
  });

  // Get Teacher Profile with Application Data
  app.get("/api/teacher/profile", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      if (req.user?.role !== 'teacher') {
        return res.status(403).json({ success: false, error: 'Access denied. Teacher access required.' });
      }

      const userUuid = req.user.id; // This is the UUID from the auth middleware
      const userTextId = req.user.userId; // This is the text ID like "T2509P002"

      console.log('🔍 Teacher profile request - userUuid:', userUuid, 'userTextId:', userTextId);

      // Get basic profile data using UUID
      const profile = await db.select()
        .from(profiles)
        .where(eq(profiles.userId, userUuid))
        .limit(1);

      if (profile.length === 0) {
        console.log('❌ Profile not found for UUID:', userUuid);
        return res.status(404).json({ success: false, error: 'Profile not found' });
      }

      // Get user email using UUID
      const user = await db.select()
        .from(users)
        .where(eq(users.id, userUuid))
        .limit(1);

      console.log('✅ Found basic data - profile:', !!profile[0], 'user:', !!user[0]);

      // Create a basic teacher profile with essential data
      const teacherProfile = {
        // Basic profile data
        id: profile[0].id,
        userId: profile[0].userId,
        name: profile[0].name || 'Teacher Name',
        email: user[0]?.email || profile[0].email || 'teacher@example.com',
        bio: profile[0].bio || '',
        avatarUrl: profile[0].avatarUrl || null,
        country: profile[0].country || '',
        role: profile[0].role,
        
        // Teacher application data from profile
        phoneNumber: profile[0].phoneNumber || null,
        qualifications: profile[0].qualifications || '',
        experience: profile[0].experience || '',
        portfolioLinks: [],
        certifications: [],
        availableHours: profile[0].availableHours || '',
        hourlyRate: profile[0].hourlyRate || '25.00',
        applicationStatus: 'approved'
      };

      console.log('📋 Returning teacher profile:', {
        name: teacherProfile.name,
        email: teacherProfile.email,
        phoneNumber: teacherProfile.phoneNumber,
        hourlyRate: teacherProfile.hourlyRate,
        qualifications: teacherProfile.qualifications,
        experience: teacherProfile.experience,
        availableHours: teacherProfile.availableHours
      });

      res.json({ success: true,
        success: true,
        profile: teacherProfile
      });

    } catch (error: any) {
      console.error('Get teacher profile error:', error);
      res.status(500).json({ success: false, error: 'Failed to get teacher profile' });
    }
  });

  // Update Teacher Profile
  app.put("/api/teacher/profile", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      if (req.user?.role !== 'teacher') {
        return res.status(403).json({ success: false, error: 'Access denied. Teacher access required.' });
      }

      const userUuid = req.user.id;
      const { 
        name, 
        bio, 
        phoneNumber, 
        hourlyRate, 
        availableHours,
        qualifications,
        experience,
        portfolioLinks,
        certifications,
        avatarUrl 
      } = req.body;

      console.log('🔄 Updating teacher profile for:', userUuid, 'with data:', {
        name, bio, phoneNumber, hourlyRate, availableHours
      });

      // Update profile table (this should always work)
      const profileUpdates: any = { updatedAt: new Date() };
      if (name !== undefined && name.trim()) profileUpdates.name = name.trim();
      if (bio !== undefined) profileUpdates.bio = bio;
      if (avatarUrl !== undefined) profileUpdates.avatarUrl = avatarUrl;
      if (qualifications !== undefined) profileUpdates.qualifications = qualifications;
      if (experience !== undefined) profileUpdates.experience = experience;
      if (availableHours !== undefined) profileUpdates.availableHours = availableHours;
      if (hourlyRate !== undefined) profileUpdates.hourlyRate = hourlyRate;
      if (phoneNumber !== undefined) profileUpdates.phoneNumber = phoneNumber;

      if (Object.keys(profileUpdates).length > 1) { // More than just updatedAt
        await db
          .update(profiles)
          .set(profileUpdates)
          .where(eq(profiles.userId, userUuid));
        console.log('✅ Profile table updated successfully');
      }

      // Try to update teacher application table with only safe columns
      try {
        const teacherApp = await db.select({ id: teacherApplications.id })
          .from(teacherApplications)
          .where(eq(teacherApplications.userId, userUuid))
          .limit(1);

        if (teacherApp.length > 0) {
          const safeAppUpdates: any = { updatedAt: new Date() };
          
          // Only update fields that we know exist
          if (phoneNumber !== undefined) safeAppUpdates.phoneNumber = phoneNumber;
          if (hourlyRate !== undefined) safeAppUpdates.hourlyRate = hourlyRate;
          if (qualifications !== undefined) safeAppUpdates.qualifications = qualifications;
          if (experience !== undefined) safeAppUpdates.experience = experience;
          if (bio !== undefined) safeAppUpdates.bio = bio;

          if (Object.keys(safeAppUpdates).length > 1) {
            await db
              .update(teacherApplications)
              .set(safeAppUpdates)
              .where(eq(teacherApplications.userId, userUuid));
            console.log('✅ Teacher application table updated successfully');
          }
        } else {
          console.log('ℹ️ No teacher application record found, skipping app table update');
        }
      } catch (appError) {
        console.log('⚠️ Could not update teacher application table:', appError.message);
        // Don't fail the entire request if teacher app table update fails
      }

      res.json({ success: true,
        success: true,
        message: 'Teacher profile updated successfully'
      });

    } catch (error: any) {
      console.error('Update teacher profile error:', error);
      res.status(500).json({ success: false, error: 'Failed to update teacher profile' });
    }
  });

  // Freelancer Registration Endpoint
  app.post("/api/freelancer-register", async (req, res) => {
    try {
      const {
        fullName,
        email,
        password,
        phoneNumber,
        skills,
        experience,
        hourlyRate,
        portfolio,
        specializations,
        bio,
        contactType,
        verificationMethod
      } = req.body;

      // Check for existing verification request (don't check users table before verification)
      const existingVerification = await db
        .select()
        .from(verificationCodes)
        .where(eq(verificationCodes.contactInfo, email))
        .limit(1);

      if (existingVerification.length > 0 && !existingVerification[0].isUsed) {
        return res.status(400).json({
          success: false,
          error: "A verification request is already pending for this email. Please check your email or wait a few minutes."
        });
      }

      // Clean up any expired verification codes
      await db.delete(verificationCodes).where(eq(verificationCodes.contactInfo, email));

      // Prepare user data but DON'T create user yet - wait for verification
      const hashedPassword = await bcrypt.hash(password, 12);
      const verificationCode = generateVerificationCode();
      const userIdString = generateUserId();

      // Store ALL registration data in verification codes table temporarily
      await db
        .insert(verificationCodes)
        .values({
          contactInfo: email,
          type: 'email',
          code: verificationCode,
