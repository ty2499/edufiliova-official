import { getOpenAIClient } from './openai';
import { cloudflareR2Storage } from './cloudflare-r2-storage';
import { db } from './db';
import { lessons, courses } from '@shared/schema';
import { eq, isNotNull, or, like, sql } from 'drizzle-orm';
import https from 'https';

async function downloadImage(url: string): Promise<Buffer | null> {
  return new Promise((resolve) => {
    try {
      const request = https.get(url, { timeout: 60000 }, (response) => {
        if (response.statusCode !== 200) {
          resolve(null);
          return;
        }
        const chunks: Buffer[] = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => resolve(Buffer.concat(chunks)));
        response.on('error', () => resolve(null));
      });
      request.on('error', () => resolve(null));
      request.on('timeout', () => { request.destroy(); resolve(null); });
    } catch {
      resolve(null);
    }
  });
}

function needsRegeneration(url: string | null): boolean {
  if (!url) return false;
  const r2Url = process.env.CLOUDFLARE_R2_PUBLIC_URL || '';
  if (r2Url && url.startsWith(r2Url)) return false;
  return url.includes('blob.core.windows.net') || 
         url.includes('oaidalleapiprodscus') ||
         url.includes('sig=') || url.includes('st=') || url.includes('se=');
}

async function generateAndUploadImage(prompt: string, filename: string, folder: string): Promise<string | null> {
  try {
    const openai = await getOpenAIClient();
    if (!openai) {
      console.log('❌ OpenAI not configured');
      return null;
    }

    console.log(`🎨 Generating image: ${prompt.substring(0, 50)}...`);
    
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: prompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard'
    });

    const tempUrl = response.data[0]?.url;
    if (!tempUrl) {
      console.log('❌ No image URL returned');
      return null;
    }

    console.log(`📥 Downloading generated image...`);
    const imageBuffer = await downloadImage(tempUrl);
    if (!imageBuffer) {
      console.log('❌ Failed to download image');
      return null;
    }

    console.log(`📤 Uploading to R2 (${(imageBuffer.length / 1024).toFixed(1)} KB)...`);
    const uploadResult = await cloudflareR2Storage.uploadFile(
      imageBuffer,
      filename,
      'image/png',
      folder
    );

    if (uploadResult.success && uploadResult.url) {
      console.log(`✅ Uploaded: ${uploadResult.url}`);
      return uploadResult.url;
    }
    
    console.log(`❌ Upload failed: ${uploadResult.error}`);
    return null;
  } catch (error: any) {
    console.log(`❌ Error: ${error.message}`);
    return null;
  }
}

export async function regenerateAllLessonImages(): Promise<{
  lessonsProcessed: number;
  imagesGenerated: number;
  failed: number;
}> {
  console.log('\n🚀 Starting lesson image regeneration with OpenAI + R2...\n');

  if (!cloudflareR2Storage.isConfigured()) {
    throw new Error('Cloudflare R2 is not configured');
  }

  const openai = await getOpenAIClient();
  if (!openai) {
    throw new Error('OpenAI is not configured');
  }

  const allLessons = await db
    .select({
      id: lessons.id,
      title: lessons.title,
      content: lessons.content,
      images: lessons.images,
      courseId: lessons.courseId
    })
    .from(lessons)
    .where(isNotNull(lessons.courseId));

  const stats = { lessonsProcessed: 0, imagesGenerated: 0, failed: 0 };

  for (const lesson of allLessons) {
    const hasExpiredImages = lesson.images?.some(url => needsRegeneration(url));
    
    if (!hasExpiredImages && lesson.images?.length) {
      continue;
    }

    stats.lessonsProcessed++;
    console.log(`\n📚 Processing: ${lesson.title}`);

    const imagePrompt = `Professional educational illustration for a lesson titled "${lesson.title}". Clean, modern design suitable for an online learning platform. High quality, detailed, visually engaging educational content. No text in the image.`;

    const newUrl = await generateAndUploadImage(
      imagePrompt,
      `lesson-${lesson.id}-main.png`,
      'courses/lesson-images'
    );

    if (newUrl) {
      await db
        .update(lessons)
        .set({ images: [newUrl] })
        .where(eq(lessons.id, lesson.id));
      
      stats.imagesGenerated++;
      console.log(`💾 Updated lesson ${lesson.id}`);
    } else {
      stats.failed++;
    }

    await new Promise(r => setTimeout(r, 1000));
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 Lesson Images Summary:');
  console.log(`   Processed: ${stats.lessonsProcessed}`);
  console.log(`   Generated: ${stats.imagesGenerated}`);
  console.log(`   Failed: ${stats.failed}`);
  console.log('='.repeat(50) + '\n');

  return stats;
}

export async function regenerateCourseThumbnails(): Promise<{
  coursesProcessed: number;
  thumbnailsGenerated: number;
  failed: number;
}> {
  console.log('\n🎓 Starting course thumbnail regeneration...\n');

  if (!cloudflareR2Storage.isConfigured()) {
    throw new Error('Cloudflare R2 is not configured');
  }

  const allCourses = await db
    .select({
      id: courses.id,
      title: courses.title,
      description: courses.description,
      category: courses.category,
      thumbnailUrl: courses.thumbnailUrl
    })
    .from(courses);

  const stats = { coursesProcessed: 0, thumbnailsGenerated: 0, failed: 0 };

  for (const course of allCourses) {
    if (!needsRegeneration(course.thumbnailUrl) && course.thumbnailUrl) {
      const r2Url = process.env.CLOUDFLARE_R2_PUBLIC_URL || '';
      if (r2Url && course.thumbnailUrl.startsWith(r2Url)) {
        continue;
      }
    }

    stats.coursesProcessed++;
    console.log(`\n🎓 Processing: ${course.title}`);

    const prompt = `Professional course thumbnail for "${course.title}" - ${course.category || 'education'} category. Modern, clean design with vibrant colors. Suitable for online learning platform. Eye-catching educational imagery. No text.`;

    const newUrl = await generateAndUploadImage(
      prompt,
      `course-${course.id}-thumbnail.png`,
      'courses/thumbnails'
    );

    if (newUrl) {
      await db
        .update(courses)
        .set({ thumbnailUrl: newUrl })
        .where(eq(courses.id, course.id));
      
      stats.thumbnailsGenerated++;
      console.log(`💾 Updated course ${course.id}`);
    } else {
      stats.failed++;
    }

    await new Promise(r => setTimeout(r, 1000));
  }

  console.log('\n📊 Course Thumbnails Summary:');
  console.log(`   Processed: ${stats.coursesProcessed}`);
  console.log(`   Generated: ${stats.thumbnailsGenerated}`);
  console.log(`   Failed: ${stats.failed}\n`);

  return stats;
}

export async function regenerateAllImages(): Promise<{
  lessons: { processed: number; generated: number; failed: number };
  courses: { processed: number; generated: number; failed: number };
}> {
  const lessonStats = await regenerateAllLessonImages();
  const courseStats = await regenerateCourseThumbnails();

  return {
    lessons: {
      processed: lessonStats.lessonsProcessed,
      generated: lessonStats.imagesGenerated,
      failed: lessonStats.failed
    },
    courses: {
      processed: courseStats.coursesProcessed,
      generated: courseStats.thumbnailsGenerated,
      failed: courseStats.failed
    }
  };
}
