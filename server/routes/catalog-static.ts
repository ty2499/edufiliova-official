// Static Catalog Routes
// These routes are DEPRECATED and should be replaced with static JSON file loading on the frontend
// Using static JSON files eliminates ALL database egress costs for catalog browsing

import { Router } from 'express';

const router = Router();

// DEPRECATED: Use /catalog/courses-listing.json instead
// This route is kept for backward compatibility but should be removed after frontend migration
router.get('/api/courses', async (req, res) => {
  res.status(410).json({
    success: false,
    error: 'This endpoint is deprecated. Use /catalog/courses-listing.json instead',
    migration: {
      message: 'Load catalog data from static JSON files to eliminate database egress',
      staticFile: '/catalog/courses-listing.json',
      usage: 'import { loadCoursesListing } from "@/lib/catalog-loader"'
    }
  });
});

// DEPRECATED: Use /catalog/subjects-listing.json instead
router.get('/api/subjects', async (req, res) => {
  res.status(410).json({
    success: false,
    error: 'This endpoint is deprecated. Use /catalog/subjects-listing.json instead',
    migration: {
      message: 'Load catalog data from static JSON files to eliminate database egress',
      staticFile: '/catalog/subjects-listing.json',
      usage: 'import { loadSubjectsListing, filterSubjects } from "@/lib/catalog-loader"'
    }
  });
});

// DEPRECATED: Use /catalog/categories.json instead
router.get('/api/categories', async (req, res) => {
  res.status(410).json({
    success: false,
    error: 'This endpoint is deprecated. Use /catalog/categories.json instead',
    migration: {
      message: 'Load catalog data from static JSON files to eliminate database egress',
      staticFile: '/catalog/categories.json',
      usage: 'import { loadCategories } from "@/lib/catalog-loader"'
    }
  });
});

export default router;
