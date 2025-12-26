import { cloudflareR2Storage } from './cloudflare-r2-storage';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const GRADE8_BOOKS = [
  { file: 'grade8_english_book.json', folder: 'grade8/english/images', subject: 'english' },
  { file: 'grade8_mathematics_book.json', folder: 'grade8/mathematics/images', subject: 'mathematics' },
  { file: 'grade8_science_book.json', folder: 'grade8/science/images', subject: 'science' },
  { file: 'grade8_social_studies_book.json', folder: 'grade8/social_studies/images', subject: 'social_studies' },
  { file: 'grade8_life_skills_book.json', folder: 'grade8/life_skills/images', subject: 'life_skills' }
];

const GENERATED_IMAGES_DIR = 'attached_assets/generated_images';

const SUBJECT_IMAGE_MAP: Record<string, string[]> = {
  english: ['english_grammar_complex_sentences.png'],
  mathematics: ['math_algebraic_expressions.png'],
  science: ['science_cell_biology.png'],
  social_studies: ['social_studies_ancient_civilizations.png'],
  life_skills: ['life_skills_nutrition_basics.png']
};

async function uploadImageToR2(imagePath: string, folder: string): Promise<string | null> {
  try {
    if (!fs.existsSync(imagePath)) {
      console.log(`❌ Image not found: ${imagePath}`);
      return null;
    }

    const imageBuffer = fs.readFileSync(imagePath);
    const hash = crypto.randomBytes(4).toString('hex');
    const filename = `${hash}.png`;

    console.log(`📤 Uploading to R2: ${folder}/${filename} (${(imageBuffer.length / 1024).toFixed(1)} KB)`);
    
    const result = await cloudflareR2Storage.uploadFile(
      imageBuffer,
      filename,
      'image/png',
      folder
    );

    if (result.success && result.url) {
      console.log(`✅ Uploaded: ${result.url}`);
      return result.url;
    }

    console.log(`❌ Upload failed: ${result.error}`);
    return null;
  } catch (error: any) {
    console.log(`❌ Error: ${error.message}`);
    return null;
  }
}

async function uploadSampleImagesToR2(): Promise<void> {
  console.log('\n🚀 Uploading Generated Grade 8 Sample Images to R2\n');

  if (!cloudflareR2Storage.isConfigured()) {
    throw new Error('Cloudflare R2 is not configured');
  }

  for (const book of GRADE8_BOOKS) {
    const images = SUBJECT_IMAGE_MAP[book.subject];
    if (!images || images.length === 0) continue;

    console.log(`\n📚 Processing: ${book.file}`);
    
    const bookPath = path.join(process.cwd(), book.file);
    if (!fs.existsSync(bookPath)) {
      console.log(`⚠️ Book not found: ${book.file}`);
      continue;
    }

    const bookData = JSON.parse(fs.readFileSync(bookPath, 'utf-8'));
    let updated = false;

    for (const imageName of images) {
      const imagePath = path.join(process.cwd(), GENERATED_IMAGES_DIR, imageName);
      const r2Url = await uploadImageToR2(imagePath, book.folder);

      if (r2Url) {
        const firstLesson = bookData.book.chapters[0]?.lessons[0];
        if (firstLesson) {
          firstLesson.mediaUrl = r2Url;
          updated = true;
          console.log(`  ✅ Updated lesson: ${firstLesson.title}`);
        }
      }
    }

    if (updated) {
      fs.writeFileSync(bookPath, JSON.stringify(bookData, null, 2));
      console.log(`💾 Saved: ${book.file}`);
    }
  }

  console.log('\n✅ Sample images uploaded successfully!\n');
}

export async function uploadAllGeneratedImagesToR2(): Promise<{
  uploaded: number;
  failed: number;
  updated: number;
}> {
  console.log('\n🚀 Uploading All Generated Images to R2\n');

  if (!cloudflareR2Storage.isConfigured()) {
    throw new Error('Cloudflare R2 is not configured');
  }

  const stats = { uploaded: 0, failed: 0, updated: 0 };

  for (const book of GRADE8_BOOKS) {
    console.log(`\n📚 Processing: ${book.file}`);
    
    const bookPath = path.join(process.cwd(), book.file);
    if (!fs.existsSync(bookPath)) {
      console.log(`⚠️ Book not found: ${book.file}`);
      continue;
    }

    const bookData = JSON.parse(fs.readFileSync(bookPath, 'utf-8'));
    let bookUpdated = false;

    const images = SUBJECT_IMAGE_MAP[book.subject] || [];
    
    for (let i = 0; i < images.length && i < bookData.book.chapters.length; i++) {
      const chapter = bookData.book.chapters[i];
      for (let j = 0; j < chapter.lessons.length && j < images.length; j++) {
        const lesson = chapter.lessons[j];
        const imageName = images[Math.min(j, images.length - 1)];
        const imagePath = path.join(process.cwd(), GENERATED_IMAGES_DIR, imageName);
        
        if (!fs.existsSync(imagePath)) continue;

        const r2Url = await uploadImageToR2(imagePath, book.folder);
        if (r2Url) {
          lesson.mediaUrl = r2Url;
          stats.uploaded++;
          stats.updated++;
          bookUpdated = true;
        } else {
          stats.failed++;
        }
      }
    }

    if (bookUpdated) {
      fs.writeFileSync(bookPath, JSON.stringify(bookData, null, 2));
      console.log(`💾 Saved: ${book.file}`);
    }
  }

  console.log('\n📊 Summary:');
  console.log(`  Uploaded: ${stats.uploaded}`);
  console.log(`  Failed: ${stats.failed}`);
  console.log(`  Updated: ${stats.updated}`);

  return stats;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  uploadSampleImagesToR2()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Error:', err.message);
      process.exit(1);
    });
}
