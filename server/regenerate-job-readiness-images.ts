import { getOpenAIClient } from './openai';
import { cloudflareR2Storage } from './cloudflare-r2-storage';
import { db } from './db';
import { lessons, courses, lessonContentBlocks, modules } from '@shared/schema';
import { eq, and, isNotNull } from 'drizzle-orm';
import https from 'https';
import crypto from 'crypto';

const JOB_READINESS_COURSE_TITLE = 'Job Readiness and Career Success';

async function downloadImageToBuffer(url: string): Promise<Buffer | null> {
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
  if (!url) return true;
  const r2Url = process.env.CLOUDFLARE_R2_PUBLIC_URL || '';
  if (r2Url && url.startsWith(r2Url)) return false;
  return url.includes('blob.core.windows.net') || 
         url.includes('oaidalleapiprodscus') ||
         url.includes('sig=') || url.includes('st=') || url.includes('se=') ||
         url.startsWith('/attached_assets');
}

async function generateAndUploadImage(prompt: string, filename: string, folder: string): Promise<string | null> {
  try {
    const openai = await getOpenAIClient();
    if (!openai) {
      console.log('❌ OpenAI not configured');
      return null;
    }

    console.log(`🎨 Generating: ${prompt.substring(0, 60)}...`);
    
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: prompt,
      n: 1,
      size: '1024x1024',
      quality: 'hd',
      style: 'natural'
    });

    const tempUrl = response.data?.[0]?.url;
    if (!tempUrl) {
      console.log('❌ No image URL returned');
      return null;
    }

    console.log(`📥 Downloading generated image...`);
    const imageBuffer = await downloadImageToBuffer(tempUrl);
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

export async function regenerateJobReadinessImages(): Promise<{
  lessonsProcessed: number;
  imagesGenerated: number;
  blocksUpdated: number;
  failed: number;
}> {
  console.log('\n🚀 Starting Job Readiness Course image regeneration...\n');

  if (!cloudflareR2Storage.isConfigured()) {
    throw new Error('Cloudflare R2 is not configured. Please add R2 credentials.');
  }

  const openai = await getOpenAIClient();
  if (!openai) {
    throw new Error('OpenAI is not configured. Please add OPENAI_API_KEY.');
  }

  const course = await db.select().from(courses)
    .where(eq(courses.title, JOB_READINESS_COURSE_TITLE))
    .limit(1);

  if (course.length === 0) {
    throw new Error(`Course "${JOB_READINESS_COURSE_TITLE}" not found`);
  }

  const courseId = course[0].id;
  console.log(`📚 Found course: ${course[0].title} (ID: ${courseId})`);

  if (needsRegeneration(course[0].thumbnailUrl)) {
    console.log('\n🖼️ Regenerating course thumbnail...');
    const thumbnailPrompt = "HD professional illustration of diverse professionals in business attire showing career success, job interviews, resume preparation and workplace achievement, modern flat design style, corporate blue and green colors, inspiring and professional atmosphere, NO TEXT IN IMAGE";
    
    const thumbnailUrl = await generateAndUploadImage(
      thumbnailPrompt,
      `job-readiness-course-thumbnail-${crypto.randomBytes(4).toString('hex')}.png`,
      'courses/thumbnails'
    );

    if (thumbnailUrl) {
      await db.update(courses)
        .set({ thumbnailUrl })
        .where(eq(courses.id, courseId));
      console.log('✅ Course thumbnail updated');
    }
  } else {
    console.log('✅ Course thumbnail already on R2');
  }

  const courseModules = await db.select().from(modules)
    .where(eq(modules.courseId, courseId));

  const stats = { lessonsProcessed: 0, imagesGenerated: 0, blocksUpdated: 0, failed: 0 };

  for (const mod of courseModules) {
    console.log(`\n📦 Processing Module: ${mod.title}`);

    const moduleLessons = await db.select().from(lessons)
      .where(eq(lessons.moduleId, mod.id));

    for (const lesson of moduleLessons) {
      stats.lessonsProcessed++;
      console.log(`\n  📖 Lesson: ${lesson.title}`);

      const blocks = await db.select().from(lessonContentBlocks)
        .where(eq(lessonContentBlocks.lessonId, lesson.id));

      const imageBlocks = blocks.filter(b => b.blockType === 'image');

      for (const block of imageBlocks) {
        if (needsRegeneration(block.content)) {
          console.log(`    🔄 Regenerating image block...`);
          
          const imagePrompt = `HD professional educational illustration for a lesson about "${lesson.title}". Clean, modern flat design style suitable for an online learning platform. Professional, engaging, and visually educational. Bright, clean colors with a professional look. NO TEXT IN IMAGE.`;

          const newUrl = await generateAndUploadImage(
            imagePrompt,
            `lesson-${lesson.id}-block-${block.id}-${crypto.randomBytes(4).toString('hex')}.png`,
            `courses/${courseId}/lesson-images`
          );

          if (newUrl) {
            await db.update(lessonContentBlocks)
              .set({ content: newUrl })
              .where(eq(lessonContentBlocks.id, block.id));
            
            stats.imagesGenerated++;
            stats.blocksUpdated++;
            console.log(`    ✅ Block updated`);
          } else {
            stats.failed++;
          }

          await new Promise(r => setTimeout(r, 2000));
        } else {
          console.log(`    ✅ Image already on R2`);
        }
      }

      if (imageBlocks.length === 0) {
        console.log(`    📷 No image blocks, adding one...`);
        
        const imagePrompt = `HD professional educational illustration for a career readiness lesson about "${lesson.title}". Clean, modern flat design with professional workers in business settings. Suitable for online learning. NO TEXT IN IMAGE.`;

        const newUrl = await generateAndUploadImage(
          imagePrompt,
          `lesson-${lesson.id}-main-${crypto.randomBytes(4).toString('hex')}.png`,
          `courses/${courseId}/lesson-images`
        );

        if (newUrl) {
          await db.insert(lessonContentBlocks).values({
            lessonId: lesson.id,
            blockType: 'image',
            content: newUrl,
            mediaUrl: newUrl,
            mediaType: 'image',
            displayOrder: 0
          });
          
          stats.imagesGenerated++;
          stats.blocksUpdated++;
          console.log(`    ✅ New image block added`);
        } else {
          stats.failed++;
        }

        await new Promise(r => setTimeout(r, 2000));
      }

      if (lesson.images && lesson.images.length > 0) {
        const hasExpiredImages = lesson.images.some(url => needsRegeneration(url));
        if (hasExpiredImages) {
          console.log(`    🔄 Updating lesson images array...`);
          
          const newImages: string[] = [];
          for (let i = 0; i < Math.min(lesson.images.length, 2); i++) {
            const imagePrompt = `HD professional illustration for "${lesson.title}" - image ${i + 1}. Modern flat design, professional workplace setting, educational content for career development. NO TEXT IN IMAGE.`;
            
            const newUrl = await generateAndUploadImage(
              imagePrompt,
              `lesson-${lesson.id}-img${i + 1}-${crypto.randomBytes(4).toString('hex')}.png`,
              `courses/${courseId}/lesson-images`
            );

            if (newUrl) {
              newImages.push(newUrl);
              stats.imagesGenerated++;
            }

            await new Promise(r => setTimeout(r, 2000));
          }

          if (newImages.length > 0) {
            await db.update(lessons)
              .set({ images: newImages })
              .where(eq(lessons.id, lesson.id));
            console.log(`    ✅ Lesson images updated (${newImages.length})`);
          }
        }
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 Job Readiness Course Image Regeneration Summary:');
  console.log(`   Lessons Processed: ${stats.lessonsProcessed}`);
  console.log(`   Images Generated: ${stats.imagesGenerated}`);
  console.log(`   Content Blocks Updated: ${stats.blocksUpdated}`);
  console.log(`   Failed: ${stats.failed}`);
  console.log('='.repeat(60) + '\n');

  return stats;
}

// Note: To run this script standalone, use: npx tsx server/regenerate-job-readiness-images.ts
// The self-executing code was removed to prevent process.exit() in production builds
