import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { db } from './db';
import { lessonContentBlocks, lessons, modules, courses } from '../shared/schema';
import { eq, and, like } from 'drizzle-orm';
import https from 'https';

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'edufiliova-products';
const PUBLIC_URL = process.env.CLOUDFLARE_R2_PUBLIC_URL || '';

async function downloadImage(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : require('http');
    protocol.get(url, (res: any) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        downloadImage(res.headers.location).then(resolve).catch(reject);
        return;
      }
      const chunks: Buffer[] = [];
      res.on('data', (chunk: Buffer) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function uploadToR2(buffer: Buffer, key: string, contentType: string): Promise<string> {
  await s3Client.send(new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  }));
  
  return `${PUBLIC_URL}/${key}`;
}

async function main() {
  console.log('🔄 Migrating Home Care course images from Cloudinary to Cloudflare R2');
  console.log('='.repeat(60));

  const [course] = await db.select().from(courses).where(eq(courses.title, 'Home Care and Elderly Support'));
  if (!course) {
    console.error('Course not found!');
    return;
  }

  const moduleIds = await db.select({ id: modules.id })
    .from(modules)
    .where(eq(modules.courseId, course.id));

  const lessonIds = await db.select({ id: lessons.id })
    .from(lessons)
    .where(
      eq(lessons.moduleId, moduleIds[0]?.id)
    );

  const allLessonIds: number[] = [];
  for (const mod of moduleIds) {
    const modLessons = await db.select({ id: lessons.id }).from(lessons).where(eq(lessons.moduleId, mod.id));
    allLessonIds.push(...modLessons.map(l => l.id));
  }

  const imageBlocks = await db.select()
    .from(lessonContentBlocks)
    .where(
      and(
        eq(lessonContentBlocks.blockType, 'image'),
        like(lessonContentBlocks.mediaUrl, '%cloudinary%')
      )
    );

  const homeCareBlocks = imageBlocks.filter(block => allLessonIds.includes(block.lessonId));

  console.log(`Found ${homeCareBlocks.length} Cloudinary images to migrate\n`);

  let migrated = 0;
  for (const block of homeCareBlocks) {
    const oldUrl = block.mediaUrl;
    if (!oldUrl) continue;

    const filename = oldUrl.split('/').pop() || `image_${block.id}.png`;
    const key = `courses/home-care/lessons/${filename}`;
    
    console.log(`Migrating: ${filename}`);
    
    try {
      const buffer = await downloadImage(oldUrl);
      const contentType = filename.endsWith('.jpg') ? 'image/jpeg' : 'image/png';
      const newUrl = await uploadToR2(buffer, key, contentType);
      
      await db.update(lessonContentBlocks)
        .set({ mediaUrl: newUrl })
        .where(eq(lessonContentBlocks.id, block.id));
      
      console.log(`  ✅ Migrated to: ${newUrl}`);
      migrated++;
    } catch (error) {
      console.error(`  ❌ Failed to migrate ${filename}:`, error);
    }
    
    await new Promise(r => setTimeout(r, 200));
  }

  console.log('\n' + '='.repeat(60));
  console.log(`✅ Migration complete! Migrated ${migrated}/${homeCareBlocks.length} images`);
}

main().catch(console.error);
