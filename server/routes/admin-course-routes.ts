import express, { Request, Response } from 'express';
import { db } from '../db';
import { courses } from '@shared/schema';
import { eq } from 'drizzle-orm';

const router = express.Router();

// Admin: Update course details (including cover images, metadata, etc.)
router.put('/:courseId', async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;
    const userRole = (req as any).user?.role;

    // Check if user is admin
    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { 
      title,
      description,
      thumbnailUrl,
      image,
      pricingType,
      price,
      publisherName,
      publisherBio,
      publisherAvatar,
      certificationType,
      tags,
      language,
      difficulty,
      prerequisites,
      learningObjectives,
      isFeatured
    } = req.body;

    const updates: any = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (thumbnailUrl !== undefined) updates.thumbnailUrl = thumbnailUrl;
    if (image !== undefined) updates.image = image;
    if (pricingType !== undefined) updates.pricingType = pricingType;
    if (price !== undefined) updates.price = price;
    if (publisherName !== undefined) updates.publisherName = publisherName;
    if (publisherBio !== undefined) updates.publisherBio = publisherBio;
    if (publisherAvatar !== undefined) updates.publisherAvatar = publisherAvatar;
    if (certificationType !== undefined) updates.certificationType = certificationType;
    if (tags !== undefined) updates.tags = tags;
    if (language !== undefined) updates.language = language;
    if (difficulty !== undefined) updates.difficulty = difficulty;
    if (prerequisites !== undefined) updates.prerequisites = prerequisites;
    if (learningObjectives !== undefined) updates.learningObjectives = learningObjectives;
    if (isFeatured !== undefined) updates.isFeatured = isFeatured;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.updatedAt = new Date();

    const [updatedCourse] = await db
      .update(courses)
      .set(updates)
      .where(eq(courses.id, courseId))
      .returning();

    if (!updatedCourse) {
      return res.status(404).json({ error: 'Course not found' });
    }

    console.log(`✅ Admin updated course ${courseId}: ${updatedCourse.title}`);
    res.json(updatedCourse);
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(500).json({ error: 'Failed to update course' });
  }
});

// Admin: Update course cover/thumbnail image
router.put('/:courseId/cover', async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;
    const userRole = (req as any).user?.role;

    // Check if user is admin
    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { thumbnailUrl, image } = req.body;

    if (!thumbnailUrl && !image) {
      return res.status(400).json({ error: 'Cover image URL required' });
    }

    const updates: any = {
      updatedAt: new Date()
    };

    if (thumbnailUrl) updates.thumbnailUrl = thumbnailUrl;
    if (image) updates.image = image;

    const [updatedCourse] = await db
      .update(courses)
      .set(updates)
      .where(eq(courses.id, courseId))
      .returning();

    if (!updatedCourse) {
      return res.status(404).json({ error: 'Course not found' });
    }

    console.log(`✅ Admin updated course cover for ${courseId}`);
    res.json({ 
      success: true, 
      thumbnailUrl: updatedCourse.thumbnailUrl,
      image: updatedCourse.image 
    });
  } catch (error) {
    console.error('Error updating course cover:', error);
    res.status(500).json({ error: 'Failed to update course cover' });
  }
});

export default router;
