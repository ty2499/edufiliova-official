import { cloudflareR2Storage } from './cloudflare-r2-storage';
import { db } from './db';
import { lessons, courses } from '@shared/schema';
import { eq, isNotNull, sql } from 'drizzle-orm';
import https from 'https';
import http from 'http';

interface MigrationResult {
  lessonId: number;
  lessonTitle: string;
  oldUrls: string[];
  newUrls: string[];
  success: boolean;
  error?: string;
}

async function downloadImage(url: string): Promise<Buffer | null> {
  return new Promise((resolve) => {
    try {
      const protocol = url.startsWith('https') ? https : http;
      
      const request = protocol.get(url, { timeout: 30000 }, (response) => {
        if (response.statusCode === 301 || response.statusCode === 302) {
          const redirectUrl = response.headers.location;
          if (redirectUrl) {
            downloadImage(redirectUrl).then(resolve);
            return;
          }
        }
        
        if (response.statusCode !== 200) {
          console.log(`❌ Failed to download (status ${response.statusCode}): ${url.substring(0, 100)}...`);
          resolve(null);
          return;
        }

        const chunks: Buffer[] = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => resolve(Buffer.concat(chunks)));
        response.on('error', () => resolve(null));
      });

      request.on('error', (err) => {
        console.log(`❌ Download error: ${err.message}`);
        resolve(null);
      });

      request.on('timeout', () => {
        request.destroy();
        console.log(`❌ Download timeout for: ${url.substring(0, 100)}...`);
        resolve(null);
      });
    } catch (error) {
      console.log(`❌ Exception downloading image: ${error}`);
      resolve(null);
    }
  });
}

function isTemporaryUrl(url: string): boolean {
  return url.includes('blob.core.windows.net') || 
         url.includes('oaidalleapiprodscus') ||
         url.includes('sig=') ||
         url.includes('st=') ||
         url.includes('se=');
}

function isR2Url(url: string): boolean {
  const publicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL || '';
  return publicUrl ? url.startsWith(publicUrl) : false;
}

export async function migrateLessonImagesToR2(): Promise<{
  total: number;
  migrated: number;
  skipped: number;
  failed: number;
  results: MigrationResult[];
}> {
  console.log('\n🚀 Starting lesson images migration to Cloudflare R2...\n');

  if (!cloudflareR2Storage.isConfigured()) {
    throw new Error('Cloudflare R2 is not configured. Please set up your R2 credentials.');
  }

  const testResult = await cloudflareR2Storage.testConnection();
  if (!testResult.success) {
    throw new Error(`R2 connection failed: ${testResult.error}`);
  }
  console.log('✅ R2 connection verified\n');

  const lessonsWithImages = await db
    .select({
      id: lessons.id,
      title: lessons.title,
      images: lessons.images,
      courseId: lessons.courseId
    })
    .from(lessons)
    .where(isNotNull(lessons.images));

  const stats = {
    total: 0,
    migrated: 0,
    skipped: 0,
    failed: 0,
    results: [] as MigrationResult[]
  };

  for (const lesson of lessonsWithImages) {
    if (!lesson.images || !Array.isArray(lesson.images) || lesson.images.length === 0) {
      continue;
    }

    stats.total++;
    const result: MigrationResult = {
      lessonId: lesson.id,
      lessonTitle: lesson.title || `Lesson ${lesson.id}`,
      oldUrls: [...lesson.images],
      newUrls: [],
      success: false
    };

    console.log(`\n📚 Processing: ${result.lessonTitle} (${lesson.images.length} images)`);

    const newUrls: string[] = [];
    let hasChanges = false;

    for (let i = 0; i < lesson.images.length; i++) {
      const imageUrl = lesson.images[i];
      
      if (!imageUrl || typeof imageUrl !== 'string') {
        newUrls.push('');
        continue;
      }

      if (isR2Url(imageUrl)) {
        console.log(`  ✅ Image ${i + 1}: Already on R2, skipping`);
        newUrls.push(imageUrl);
        continue;
      }

      if (!isTemporaryUrl(imageUrl)) {
        console.log(`  ℹ️ Image ${i + 1}: Not a temporary URL, keeping as is`);
        newUrls.push(imageUrl);
        continue;
      }

      console.log(`  📥 Image ${i + 1}: Downloading from temporary URL...`);
      
      const imageBuffer = await downloadImage(imageUrl);
      
      if (!imageBuffer) {
        console.log(`  ⚠️ Image ${i + 1}: Could not download (likely expired)`);
        newUrls.push('');
        hasChanges = true;
        continue;
      }

      console.log(`  📤 Image ${i + 1}: Uploading to R2 (${(imageBuffer.length / 1024).toFixed(1)} KB)...`);

      const uploadResult = await cloudflareR2Storage.uploadFile(
        imageBuffer,
        `lesson-${lesson.id}-image-${i + 1}.png`,
        'image/png',
        'courses/lesson-images'
      );

      if (uploadResult.success && uploadResult.url) {
        console.log(`  ✅ Image ${i + 1}: Uploaded successfully`);
        newUrls.push(uploadResult.url);
        hasChanges = true;
      } else {
        console.log(`  ❌ Image ${i + 1}: Upload failed - ${uploadResult.error}`);
        newUrls.push('');
        hasChanges = true;
      }
    }

    if (hasChanges) {
      const validNewUrls = newUrls.filter(url => url && url.length > 0);
      
      try {
        await db
          .update(lessons)
          .set({ images: validNewUrls.length > 0 ? validNewUrls : null })
          .where(eq(lessons.id, lesson.id));

        result.newUrls = validNewUrls;
        result.success = true;
        stats.migrated++;
        console.log(`  💾 Database updated with ${validNewUrls.length} images`);
      } catch (dbError) {
        result.error = `Database update failed: ${dbError}`;
        stats.failed++;
        console.log(`  ❌ Database update failed: ${dbError}`);
      }
    } else {
      result.newUrls = newUrls;
      result.success = true;
      stats.skipped++;
      console.log(`  ℹ️ No changes needed`);
    }

    stats.results.push(result);
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 Migration Summary:');
  console.log(`   Total lessons with images: ${stats.total}`);
  console.log(`   Successfully migrated: ${stats.migrated}`);
  console.log(`   Skipped (already on R2): ${stats.skipped}`);
  console.log(`   Failed: ${stats.failed}`);
  console.log('='.repeat(50) + '\n');

  return stats;
}

export async function migrateCourseThumbailsToR2(): Promise<{
  total: number;
  migrated: number;
  skipped: number;
  failed: number;
}> {
  console.log('\n🎓 Starting course thumbnails migration to Cloudflare R2...\n');

  if (!cloudflareR2Storage.isConfigured()) {
    throw new Error('Cloudflare R2 is not configured.');
  }

  const coursesWithThumbnails = await db
    .select({
      id: courses.id,
      title: courses.title,
      thumbnailUrl: courses.thumbnailUrl
    })
    .from(courses)
    .where(isNotNull(courses.thumbnailUrl));

  const stats = { total: 0, migrated: 0, skipped: 0, failed: 0 };

  for (const course of coursesWithThumbnails) {
    if (!course.thumbnailUrl) continue;

    stats.total++;

    if (isR2Url(course.thumbnailUrl)) {
      console.log(`✅ ${course.title}: Already on R2`);
      stats.skipped++;
      continue;
    }

    if (!isTemporaryUrl(course.thumbnailUrl)) {
      console.log(`ℹ️ ${course.title}: Not a temporary URL, skipping`);
      stats.skipped++;
      continue;
    }

    console.log(`📥 ${course.title}: Downloading thumbnail...`);

    const imageBuffer = await downloadImage(course.thumbnailUrl);

    if (!imageBuffer) {
      console.log(`⚠️ ${course.title}: Could not download (likely expired)`);
      stats.failed++;
      continue;
    }

    const uploadResult = await cloudflareR2Storage.uploadFile(
      imageBuffer,
      `course-${course.id}-thumbnail.png`,
      'image/png',
      'courses/thumbnails'
    );

    if (uploadResult.success && uploadResult.url) {
      await db
        .update(courses)
        .set({ thumbnailUrl: uploadResult.url })
        .where(eq(courses.id, course.id));

      console.log(`✅ ${course.title}: Migrated successfully`);
      stats.migrated++;
    } else {
      console.log(`❌ ${course.title}: Upload failed`);
      stats.failed++;
    }
  }

  console.log('\n📊 Course Thumbnails Summary:');
  console.log(`   Total: ${stats.total}, Migrated: ${stats.migrated}, Skipped: ${stats.skipped}, Failed: ${stats.failed}\n`);

  return stats;
}
