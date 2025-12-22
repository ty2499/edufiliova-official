import type { Express } from "express";
import { db } from "../db";
import { lessonContentBlocks } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";

const contentBlockSchema = z.object({
  blockType: z.enum(['text', 'image', 'video', 'file', 'accordion']),
  title: z.string().optional(),
  content: z.string().optional(),
  mediaUrl: z.string().optional(),
  mediaType: z.enum(['image', 'video', 'pdf', 'document']).optional(),
  isCollapsible: z.boolean().optional(),
  isExpandedByDefault: z.boolean().optional(),
  displayOrder: z.number().int(),
});

export function registerLessonContentBlockRoutes(app: Express, requireAuth: any) {
  
  // Get all content blocks for a lesson
  app.get('/api/lessons/:lessonId/content-blocks', async (req, res) => {
    try {
      const lessonId = parseInt(req.params.lessonId);
      if (isNaN(lessonId)) {
        return res.status(400).json({ error: 'Invalid lesson ID' });
      }

      const blocks = await db
        .select()
        .from(lessonContentBlocks)
        .where(eq(lessonContentBlocks.lessonId, lessonId))
        .orderBy(lessonContentBlocks.displayOrder);

      res.json({ blocks });
    } catch (error: any) {
      console.error('Error fetching content blocks:', error);
      res.status(500).json({ error: 'Failed to fetch content blocks' });
    }
  });

  // Create content blocks for a lesson (bulk create)
  app.post('/api/lessons/:lessonId/content-blocks', requireAuth, async (req, res) => {
    try {
      const lessonId = parseInt(req.params.lessonId);
      if (isNaN(lessonId)) {
        return res.status(400).json({ error: 'Invalid lesson ID' });
      }

      const blocksData = z.array(contentBlockSchema).parse(req.body.blocks);

      // Delete existing blocks for this lesson first (replace all)
      await db
        .delete(lessonContentBlocks)
        .where(eq(lessonContentBlocks.lessonId, lessonId));

      // Insert new blocks
      if (blocksData.length > 0) {
        const newBlocks = await db
          .insert(lessonContentBlocks)
          .values(blocksData.map(block => ({
            lessonId,
            blockType: block.blockType,
            title: block.title || null,
            content: block.content || null,
            mediaUrl: block.mediaUrl || null,
            mediaType: block.mediaType || null,
            isCollapsible: block.isCollapsible ?? false,
            isExpandedByDefault: block.isExpandedByDefault ?? true,
            displayOrder: block.displayOrder,
          })))
          .returning();

        res.json({ blocks: newBlocks });
      } else {
        res.json({ blocks: [] });
      }
    } catch (error: any) {
      console.error('Error creating content blocks:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid content blocks data', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to create content blocks' });
    }
  });

  // Update a single content block
  app.put('/api/content-blocks/:blockId', requireAuth, async (req, res) => {
    try {
      const blockId = parseInt(req.params.blockId);
      if (isNaN(blockId)) {
        return res.status(400).json({ error: 'Invalid block ID' });
      }

      const blockData = contentBlockSchema.partial().parse(req.body);

      const [updatedBlock] = await db
        .update(lessonContentBlocks)
        .set({
          ...blockData,
          updatedAt: new Date(),
        })
        .where(eq(lessonContentBlocks.id, blockId))
        .returning();

      if (!updatedBlock) {
        return res.status(404).json({ error: 'Content block not found' });
      }

      res.json({ block: updatedBlock });
    } catch (error: any) {
      console.error('Error updating content block:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid content block data', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to update content block' });
    }
  });

  // Delete a content block
  app.delete('/api/content-blocks/:blockId', requireAuth, async (req, res) => {
    try {
      const blockId = parseInt(req.params.blockId);
      if (isNaN(blockId)) {
        return res.status(400).json({ error: 'Invalid block ID' });
      }

      const [deletedBlock] = await db
        .delete(lessonContentBlocks)
        .where(eq(lessonContentBlocks.id, blockId))
        .returning();

      if (!deletedBlock) {
        return res.status(404).json({ error: 'Content block not found' });
      }

      res.json({ success: true, block: deletedBlock });
    } catch (error: any) {
      console.error('Error deleting content block:', error);
      res.status(500).json({ error: 'Failed to delete content block' });
    }
  });

  // Reorder content blocks
  app.post('/api/lessons/:lessonId/content-blocks/reorder', requireAuth, async (req, res) => {
    try {
      const lessonId = parseInt(req.params.lessonId);
      if (isNaN(lessonId)) {
        return res.status(400).json({ error: 'Invalid lesson ID' });
      }

      const { blockIds } = req.body; // Array of block IDs in new order
      if (!Array.isArray(blockIds)) {
        return res.status(400).json({ error: 'Invalid block IDs array' });
      }

      // Update display order for each block
      for (let i = 0; i < blockIds.length; i++) {
        await db
          .update(lessonContentBlocks)
          .set({ displayOrder: i })
          .where(
            and(
              eq(lessonContentBlocks.id, blockIds[i]),
              eq(lessonContentBlocks.lessonId, lessonId)
            )
          );
      }

      // Fetch and return updated blocks
      const blocks = await db
        .select()
        .from(lessonContentBlocks)
        .where(eq(lessonContentBlocks.lessonId, lessonId))
        .orderBy(lessonContentBlocks.displayOrder);

      res.json({ blocks });
    } catch (error: any) {
      console.error('Error reordering content blocks:', error);
      res.status(500).json({ error: 'Failed to reorder content blocks' });
    }
  });
}
