import { getOpenAIClient } from './openai';
import { cloudflareR2Storage } from './cloudflare-r2-storage';
import fs from 'fs';
import path from 'path';
import https from 'https';
import crypto from 'crypto';

const GRADE8_BOOKS = [
  'grade8_english_book.json',
  'grade8_mathematics_book.json',
  'grade8_science_book.json',
  'grade8_social_studies_book.json',
  'grade8_life_skills_book.json'
];

const SUBJECT_FOLDERS: Record<string, string> = {
  'grade8_english_book.json': 'grade8/english/images',
  'grade8_mathematics_book.json': 'grade8/mathematics/images',
  'grade8_science_book.json': 'grade8/science/images',
  'grade8_social_studies_book.json': 'grade8/social_studies/images',
  'grade8_life_skills_book.json': 'grade8/life_skills/images'
};

const SUBJECT_THEMES: Record<string, string> = {
  'grade8_english_book.json': 'English Language Arts education with books, writing, and communication themes',
  'grade8_mathematics_book.json': 'Mathematics education with numbers, equations, geometric shapes, and graphs',
  'grade8_science_book.json': 'Science education with laboratory equipment, cells, atoms, and nature elements',
  'grade8_social_studies_book.json': 'Social Studies education with maps, historical artifacts, and cultural symbols',
  'grade8_life_skills_book.json': 'Life Skills education with health, wellness, personal development, and practical skills'
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

function createNoTextPrompt(lessonTitle: string, subject: string, theme: string): string {
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
    console.log(`🎨 Generating image (no text): ${prompt.substring(0, 60)}...`);
    
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

    if (!cloudflareR2Storage.isConfigured()) {
      console.log('❌ Cloudflare R2 not configured');
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

async function regenerateGrade8BookImages(bookFile: string): Promise<{
  lessonsProcessed: number;
  imagesGenerated: number;
  failed: number;
}> {
  const bookPath = path.join(process.cwd(), bookFile);
  
  if (!fs.existsSync(bookPath)) {
    console.log(`⚠️ Book file not found: ${bookFile}`);
    return { lessonsProcessed: 0, imagesGenerated: 0, failed: 0 };
  }

  console.log(`\n📚 Processing: ${bookFile}`);
  
  const bookData = JSON.parse(fs.readFileSync(bookPath, 'utf-8'));
  const folder = SUBJECT_FOLDERS[bookFile];
  const theme = SUBJECT_THEMES[bookFile];
  
  const openai = await getOpenAIClient();
  if (!openai) {
    throw new Error('OpenAI not configured');
  }

  const stats = { lessonsProcessed: 0, imagesGenerated: 0, failed: 0 };

  for (const chapter of bookData.book.chapters) {
    console.log(`\n📖 Chapter: ${chapter.title}`);
    
    for (const lesson of chapter.lessons) {
      stats.lessonsProcessed++;
      
      console.log(`\n  📝 Lesson: ${lesson.title} (${lesson.id})`);
      
      const prompt = createNoTextPrompt(lesson.title, bookData.book.title, theme);
      const hash = crypto.randomBytes(4).toString('hex');
      const filename = `${hash}.png`;
      
      const newUrl = await generateAndUploadImage(openai, prompt, filename, folder);
      
      if (newUrl) {
        lesson.mediaUrl = newUrl;
        stats.imagesGenerated++;
        console.log(`  ✅ Updated mediaUrl: ${newUrl}`);
      } else {
        stats.failed++;
        console.log(`  ❌ Failed to generate image for: ${lesson.title}`);
      }
      
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  fs.writeFileSync(bookPath, JSON.stringify(bookData, null, 2));
  console.log(`\n💾 Saved updated book: ${bookFile}`);
  
  return stats;
}

export async function regenerateAllGrade8Images(): Promise<{
  totalProcessed: number;
  totalGenerated: number;
  totalFailed: number;
  byBook: Record<string, { processed: number; generated: number; failed: number }>;
}> {
  console.log('\n🚀 Starting Grade 8 Image Regeneration (NO TEXT in images)');
  console.log('='.repeat(60));
  
  if (!cloudflareR2Storage.isConfigured()) {
    throw new Error('Cloudflare R2 is not configured. Please set up R2 credentials.');
  }

  const openai = await getOpenAIClient();
  if (!openai) {
    throw new Error('OpenAI is not configured. Please set OPENAI_API_KEY.');
  }

  const results: Record<string, { processed: number; generated: number; failed: number }> = {};
  let totalProcessed = 0;
  let totalGenerated = 0;
  let totalFailed = 0;

  for (const bookFile of GRADE8_BOOKS) {
    try {
      const stats = await regenerateGrade8BookImages(bookFile);
      results[bookFile] = {
        processed: stats.lessonsProcessed,
        generated: stats.imagesGenerated,
        failed: stats.failed
      };
      totalProcessed += stats.lessonsProcessed;
      totalGenerated += stats.imagesGenerated;
      totalFailed += stats.failed;
    } catch (error: any) {
      console.error(`❌ Error processing ${bookFile}: ${error.message}`);
      results[bookFile] = { processed: 0, generated: 0, failed: 1 };
      totalFailed++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 GRADE 8 IMAGE REGENERATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Lessons Processed: ${totalProcessed}`);
  console.log(`Total Images Generated: ${totalGenerated}`);
  console.log(`Total Failed: ${totalFailed}`);
  console.log('\nBy Book:');
  for (const [book, stats] of Object.entries(results)) {
    console.log(`  ${book}: ${stats.generated}/${stats.processed} images (${stats.failed} failed)`);
  }
  console.log('='.repeat(60) + '\n');

  return { totalProcessed, totalGenerated, totalFailed, byBook: results };
}

export async function regenerateSingleBook(bookName: string): Promise<{
  processed: number;
  generated: number;
  failed: number;
}> {
  console.log(`\n🎯 Regenerating images for: ${bookName}`);
  
  if (!cloudflareR2Storage.isConfigured()) {
    throw new Error('Cloudflare R2 is not configured');
  }

  const bookFile = GRADE8_BOOKS.find(f => f.includes(bookName.toLowerCase().replace(/\s+/g, '_')));
  if (!bookFile) {
    throw new Error(`Book not found: ${bookName}. Available: ${GRADE8_BOOKS.join(', ')}`);
  }

  const result = await regenerateGrade8BookImages(bookFile);
  return {
    processed: result.lessonsProcessed,
    generated: result.imagesGenerated,
    failed: result.failed
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  
  if (args[0] === '--book' && args[1]) {
    regenerateSingleBook(args[1])
      .then(result => {
        console.log('Done:', result);
        process.exit(0);
      })
      .catch(err => {
        console.error('Error:', err.message);
        process.exit(1);
      });
  } else {
    regenerateAllGrade8Images()
      .then(result => {
        console.log('Complete!');
        process.exit(0);
      })
      .catch(err => {
        console.error('Error:', err.message);
        process.exit(1);
      });
  }
}
