import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth";
import type { AuthenticatedRequest } from "../middleware/auth";
import { cloudinaryStorage } from "../cloudinary-storage";
import { cloudflareR2Storage } from "../cloudflare-r2-storage";
import { storageManager } from "../storage-manager";
import { migrateLessonImagesToR2, migrateCourseThumbailsToR2 } from "../migrate-lesson-images-to-r2";
import { regenerateAllImages } from "../regenerate-lesson-images";

const router = Router();

router.get("/status", requireAuth, requireRole(['admin']), async (req: AuthenticatedRequest, res) => {
  try {
    const cloudinaryConfigured = cloudinaryStorage.isConfigured();
    const r2Configured = cloudflareR2Storage.isConfigured();

    let cloudinaryTest: { success: boolean; details?: any; error?: string } = { success: false, error: 'Not configured' };
    let r2Test: { success: boolean; details?: any; error?: string } = { success: false, error: 'Not configured' };

    if (cloudinaryConfigured) {
      cloudinaryTest = await cloudinaryStorage.testConnection();
    }

    if (r2Configured) {
      r2Test = await cloudflareR2Storage.testConnection();
    }

    const status = storageManager.getStorageStatus();

    res.json({
      success: true,
      storage: {
        cloudinary: {
          configured: cloudinaryConfigured,
          connected: cloudinaryTest.success,
          details: cloudinaryTest.details,
          error: cloudinaryTest.error,
          usedFor: cloudinaryConfigured ? ['courses', 'portfolio', 'blog', 'profiles', 'fallback'] : []
        },
        cloudflareR2: {
          configured: r2Configured,
          connected: r2Test.success,
          details: r2Test.details,
          error: r2Test.error,
          usedFor: r2Configured ? ['products-primary'] : [],
          benefits: r2Configured ? ['Zero egress fees', 'Lower storage costs', 'Unlimited bandwidth'] : []
        },
        recommendation: status.recommendation,
        activeStrategy: r2Configured 
          ? 'R2 for products with Cloudinary failover, Cloudinary for content'
          : cloudinaryConfigured
          ? 'Cloudinary for all uploads'
          : 'No storage configured - uploads disabled'
      }
    });
  } catch (error) {
    console.error('Error checking storage status:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to check storage status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get("/metrics", requireAuth, requireRole(['admin']), async (req: AuthenticatedRequest, res) => {
  try {
    res.json({
      success: true,
      message: 'Storage metrics endpoint - implement if needed for detailed usage tracking',
      suggestion: 'Consider adding upload counts, storage usage, and error rates per service'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.post("/migrate-images-to-r2", requireAuth, requireRole(['admin']), async (req: AuthenticatedRequest, res) => {
  try {
    console.log('🚀 Admin triggered image migration to R2');
    
    const lessonResults = await migrateLessonImagesToR2();
    const courseResults = await migrateCourseThumbailsToR2();

    res.json({
      success: true,
      message: 'Migration completed',
      lessons: {
        total: lessonResults.total,
        migrated: lessonResults.migrated,
        skipped: lessonResults.skipped,
        failed: lessonResults.failed
      },
      courses: {
        total: courseResults.total,
        migrated: courseResults.migrated,
        skipped: courseResults.skipped,
        failed: courseResults.failed
      }
    });
  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Migration failed'
    });
  }
});

router.post("/regenerate-images", requireAuth, requireRole(['admin']), async (req: AuthenticatedRequest, res) => {
  try {
    console.log('🎨 Admin triggered image regeneration with OpenAI + R2');
    
    res.json({
      success: true,
      message: 'Image regeneration started. This will run in the background.',
      note: 'Check server logs for progress. This may take several minutes.'
    });

    regenerateAllImages()
      .then(results => {
        console.log('✅ Image regeneration completed:', results);
      })
      .catch(error => {
        console.error('❌ Image regeneration failed:', error);
      });

  } catch (error) {
    console.error('Regeneration error:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Regeneration failed'
    });
  }
});

export default router;
