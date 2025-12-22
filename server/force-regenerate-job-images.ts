import { getOpenAIClient } from './openai';
import { cloudflareR2Storage } from './cloudflare-r2-storage';
import { db } from './db';
import { lessons, courses, lessonContentBlocks, modules } from '@shared/schema';
import { eq } from 'drizzle-orm';
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

async function generateAndUploadImage(prompt: string, filename: string, folder: string): Promise<string | null> {
  try {
    const openai = await getOpenAIClient();
    if (!openai) {
      console.log('❌ OpenAI not configured');
      return null;
    }

    console.log(`🎨 Generating: ${prompt.substring(0, 50)}...`);
    
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

    const imageBuffer = await downloadImageToBuffer(tempUrl);
    if (!imageBuffer) {
      console.log('❌ Failed to download image');
      return null;
    }

    console.log(`📤 Uploading to R2...`);
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
    
    return null;
  } catch (error: any) {
    console.log(`❌ Error: ${error.message}`);
    return null;
  }
}

export async function forceRegenerateJobImages(): Promise<void> {
  console.log('\n🚀 Force regenerating Job Readiness images (NO TEXT)...\n');

  if (!cloudflareR2Storage.isConfigured()) {
    throw new Error('Cloudflare R2 is not configured');
  }

  const course = await db.select().from(courses)
    .where(eq(courses.title, JOB_READINESS_COURSE_TITLE))
    .limit(1);

  if (course.length === 0) {
    throw new Error(`Course not found`);
  }

  const courseId = course[0].id;
  console.log(`📚 Found course: ${course[0].title}`);

  const courseModules = await db.select().from(modules)
    .where(eq(modules.courseId, courseId));

  let processed = 0;
  let regenerated = 0;

  for (const mod of courseModules) {
    console.log(`\n📦 Module: ${mod.title}`);

    const moduleLessons = await db.select().from(lessons)
      .where(eq(lessons.moduleId, mod.id));

    for (const lesson of moduleLessons) {
      processed++;
      console.log(`  📖 ${lesson.title}`);

      const blocks = await db.select().from(lessonContentBlocks)
        .where(eq(lessonContentBlocks.lessonId, lesson.id));

      const imageBlocks = blocks.filter(b => b.blockType === 'image');

      for (const block of imageBlocks) {
        const imagePrompt = `Professional flat-style illustration showing diverse workers in a modern office environment related to "${lesson.title}". Clean vector art style, bright corporate colors (blue, teal, orange accents), people in business casual attire, minimalist background. ABSOLUTELY NO TEXT, NO WORDS, NO LETTERS, NO NUMBERS, NO LABELS, NO CAPTIONS anywhere in the image. Pure illustration only.`;

        const newUrl = await generateAndUploadImage(
          imagePrompt,
          `lesson-${lesson.id}-block-${block.id}-${crypto.randomBytes(4).toString('hex')}.png`,
          `courses/${courseId}/lesson-images`
        );

        if (newUrl) {
          await db.update(lessonContentBlocks)
            .set({ content: newUrl, mediaUrl: newUrl })
            .where(eq(lessonContentBlocks.id, block.id));
          regenerated++;
        }

        await new Promise(r => setTimeout(r, 3000));
      }
    }
  }

  console.log(`\n✅ Done! Processed: ${processed} lessons, Regenerated: ${regenerated} images`);
}

import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);

if (process.argv[1] === __filename) {
  forceRegenerateJobImages()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Failed:', error);
      process.exit(1);
    });
}
