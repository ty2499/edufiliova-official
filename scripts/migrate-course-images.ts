import { db } from '../server/db';
import { courses, lessonContentBlocks } from '../shared/schema';
import { eq, like, or, sql } from 'drizzle-orm';
import { storageManager } from '../server/storage-manager';
import * as fs from 'fs';
import * as path from 'path';
import fetch from 'node-fetch';

async function migrateImages() {
  console.log('🚀 Starting image migration to permanent storage...\n');

  // 1. Migrate course thumbnail images from local paths
  console.log('📚 Step 1: Migrating course thumbnail images...');
  
  const coursesWithLocalImages = await db
    .select({ id: courses.id, title: courses.title, thumbnailUrl: courses.thumbnailUrl })
    .from(courses)
    .where(like(courses.thumbnailUrl, '/attached_assets/%'));

  console.log(`Found ${coursesWithLocalImages.length} courses with local images`);

  for (const course of coursesWithLocalImages) {
    try {
      if (!course.thumbnailUrl) continue;
      
      const localPath = path.join(process.cwd(), course.thumbnailUrl);
      
      if (!fs.existsSync(localPath)) {
        console.log(`⚠️  File not found: ${localPath}`);
        continue;
      }

      const buffer = fs.readFileSync(localPath);
      const filename = path.basename(course.thumbnailUrl);
      const contentType = filename.endsWith('.png') ? 'image/png' : 'image/jpeg';

      console.log(`📤 Uploading: ${course.title} thumbnail...`);
      
      const result = await storageManager.uploadFile(
        buffer,
        filename,
        contentType,
        'course-image',
        { courseId: course.id }
      );

      if (result.success && result.url) {
        await db
          .update(courses)
          .set({ thumbnailUrl: result.url })
          .where(eq(courses.id, course.id));
        
        console.log(`✅ Migrated: ${course.title} -> ${result.storage}`);
      } else {
        console.log(`❌ Failed to upload ${course.title}: ${result.error}`);
      }
    } catch (error: any) {
      console.log(`❌ Error migrating ${course.title}: ${error.message}`);
    }
  }

  // 2. Migrate lesson content block images from temporary DALL-E URLs
  console.log('\n📖 Step 2: Migrating lesson content block images...');
  
  const blocksWithTempUrls = await db
    .select({ 
      id: lessonContentBlocks.id, 
      mediaUrl: lessonContentBlocks.mediaUrl,
      lessonId: lessonContentBlocks.lessonId
    })
    .from(lessonContentBlocks)
    .where(
      or(
        like(lessonContentBlocks.mediaUrl, '%oaidalleapiprodscus.blob.core.windows.net%'),
        like(lessonContentBlocks.mediaUrl, '/attached_assets/%')
      )
    );

  console.log(`Found ${blocksWithTempUrls.length} content blocks with temporary/local images`);

  let migratedCount = 0;
  let failedCount = 0;

  for (const block of blocksWithTempUrls) {
    try {
      if (!block.mediaUrl) continue;

      let buffer: Buffer;
      let filename: string;

      if (block.mediaUrl.startsWith('/attached_assets/')) {
        // Local file
        const localPath = path.join(process.cwd(), block.mediaUrl);
        if (!fs.existsSync(localPath)) {
          console.log(`⚠️  File not found: ${localPath}`);
          failedCount++;
          continue;
        }
        buffer = fs.readFileSync(localPath);
        filename = path.basename(block.mediaUrl);
      } else {
        // Remote URL (DALL-E)
        console.log(`📥 Downloading image for block ${block.id}...`);
        const response = await fetch(block.mediaUrl);
        
        if (!response.ok) {
          console.log(`⚠️  Failed to download image for block ${block.id}: ${response.status}`);
          failedCount++;
          continue;
        }

        const arrayBuffer = await response.arrayBuffer();
        buffer = Buffer.from(arrayBuffer);
        filename = `lesson-${block.lessonId}-block-${block.id}.png`;
      }

      const result = await storageManager.uploadFile(
        buffer,
        filename,
        'image/png',
        'course-image',
        { courseId: `lesson-${block.lessonId}` }
      );

      if (result.success && result.url) {
        await db
          .update(lessonContentBlocks)
          .set({ mediaUrl: result.url })
          .where(eq(lessonContentBlocks.id, block.id));
        
        migratedCount++;
        if (migratedCount % 10 === 0) {
          console.log(`✅ Migrated ${migratedCount} content block images...`);
        }
      } else {
        console.log(`❌ Failed to upload block ${block.id}: ${result.error}`);
        failedCount++;
      }
    } catch (error: any) {
      console.log(`❌ Error migrating block ${block.id}: ${error.message}`);
      failedCount++;
    }
  }

  console.log(`\n✅ Migration complete!`);
  console.log(`   - Course thumbnails: ${coursesWithLocalImages.length} processed`);
  console.log(`   - Content blocks: ${migratedCount} migrated, ${failedCount} failed`);
}

migrateImages()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
