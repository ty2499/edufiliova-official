import { db } from './db';
import { subjectLessons, subjectChapters, subjects } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { getOpenAIClient } from './openai';
import { cloudflareR2Storage } from './cloudflare-r2-storage';
import https from 'https';
import crypto from 'crypto';

const SUBJECT_FOLDERS: Record<string, string> = {
  'English Language Arts': 'grade8/english/images',
  'Mathematics': 'grade8/mathematics/images',
  'Science': 'grade8/science/images',
  'Social Studies': 'grade8/social_studies/images',
  'Life Skills': 'grade8/life_skills/images'
};

const SUBJECT_THEMES: Record<string, string> = {
  'English Language Arts': 'English Language Arts education with books, writing, reading, and communication themes',
  'Mathematics': 'Mathematics education with numbers, equations, geometric shapes, graphs, and calculations',
  'Science': 'Science education with laboratory equipment, cells, atoms, experiments, and nature elements',
  'Social Studies': 'Social Studies education with maps, historical artifacts, geography, and cultural symbols',
  'Life Skills': 'Life Skills education with health, wellness, personal development, finance, and practical skills'
};

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

function createNoTextPrompt(lessonTitle: string, subjectName: string): string {
  const theme = SUBJECT_THEMES[subjectName] || 'educational themes';
  return `Create a professional educational illustration for a Grade 8 lesson about "${lessonTitle}". 
Theme: ${theme}. 
Style: Clean, modern, colorful illustration with visual elements representing the topic. 
Use vibrant colors, clear imagery, and educational visual elements.
IMPORTANT REQUIREMENTS:
- DO NOT include ANY text, words, letters, numbers, labels, or written content in the image
- NO captions, NO titles, NO annotations
- Only visual elements and illustrations
- Suitable for 13-14 year old students
- Professional quality, high resolution
- Educational and engaging visual design`;
}

async function generateAndUploadImage(
  openai: any,
  prompt: string,
  filename: string,
  folder: string
): Promise<string | null> {
  try {
    console.log(`🎨 Generating image: ${prompt.substring(0, 60)}...`);
    
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: prompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
      style: 'vivid'
    });

    const tempUrl = response.data?.[0]?.url;
    if (!tempUrl) {
      console.log('❌ No image URL returned from OpenAI');
      return null;
    }

    console.log(`📥 Downloading generated image...`);
    const imageBuffer = await downloadImage(tempUrl);
    if (!imageBuffer) {
      console.log('❌ Failed to download image');
      return null;
    }

    console.log(`📤 Uploading to R2: ${folder}/${filename} (${(imageBuffer.length / 1024).toFixed(1)} KB)...`);
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

async function generateGrade8DatabaseImages() {
  console.log('\n🚀 Starting Grade 8 Database Image Generation');
  console.log('='.repeat(60));

  if (!cloudflareR2Storage.isConfigured()) {
    throw new Error('Cloudflare R2 is not configured. Please set up R2 credentials.');
  }

  const openai = await getOpenAIClient();
  if (!openai) {
    throw new Error('OpenAI is not configured. Please set OPENAI_API_KEY.');
  }

  const grade8Lessons = await db.select({
    lessonId: subjectLessons.id,
    lessonTitle: subjectLessons.title,
    cloudinaryImages: subjectLessons.cloudinaryImages,
    chapterTitle: subjectChapters.title,
    subjectName: subjects.name
  })
  .from(subjectLessons)
  .innerJoin(subjectChapters, eq(subjectLessons.chapterId, subjectChapters.id))
  .innerJoin(subjects, eq(subjectChapters.subjectId, subjects.id))
  .where(eq(subjects.gradeLevel, 8))
  .orderBy(subjects.name, subjectChapters.id, subjectLessons.id);

  console.log(`\n📚 Found ${grade8Lessons.length} Grade 8 lessons in database\n`);

  let generated = 0;
  let skipped = 0;
  let failed = 0;

  for (const lesson of grade8Lessons) {
    const existingImages = lesson.cloudinaryImages || [];
    if (existingImages.length > 0 && existingImages[0] && existingImages[0].includes('r2.dev')) {
      console.log(`⏭️ Skipping (has image): ${lesson.lessonTitle}`);
      skipped++;
      continue;
    }

    console.log(`\n📝 Processing: ${lesson.lessonTitle}`);
    console.log(`   Subject: ${lesson.subjectName} | Chapter: ${lesson.chapterTitle}`);

    const folder = SUBJECT_FOLDERS[lesson.subjectName] || 'grade8/general/images';
    const prompt = createNoTextPrompt(lesson.lessonTitle, lesson.subjectName);
    const hash = crypto.randomBytes(4).toString('hex');
    const filename = `${hash}.png`;

    const imageUrl = await generateAndUploadImage(openai, prompt, filename, folder);

    if (imageUrl) {
      await db.update(subjectLessons)
        .set({ cloudinaryImages: [imageUrl] })
        .where(eq(subjectLessons.id, lesson.lessonId));
      
      console.log(`   ✅ Updated database with image URL`);
      generated++;
    } else {
      console.log(`   ❌ Failed to generate image`);
      failed++;
    }

    await new Promise(r => setTimeout(r, 2000));
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 GENERATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Lessons: ${grade8Lessons.length}`);
  console.log(`Images Generated: ${generated}`);
  console.log(`Skipped (already has image): ${skipped}`);
  console.log(`Failed: ${failed}`);
  console.log('='.repeat(60) + '\n');

  return { total: grade8Lessons.length, generated, skipped, failed };
}

generateGrade8DatabaseImages()
  .then(result => {
    console.log('✅ Complete!', result);
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });
