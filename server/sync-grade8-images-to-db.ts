import { db } from './db';
import { subjectLessons, subjectChapters, subjects } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

interface Lesson {
  id: string;
  title: string;
  mediaUrl?: string;
}

interface Chapter {
  id: string;
  title: string;
  lessons: Lesson[];
}

interface Book {
  book: {
    title: string;
    chapters: Chapter[];
  };
}

const GRADE8_BOOKS = [
  { file: 'grade8_english_book.json', subjectName: 'English Language Arts' },
  { file: 'grade8_mathematics_book.json', subjectName: 'Mathematics' },
  { file: 'grade8_science_book.json', subjectName: 'Science' },
  { file: 'grade8_social_studies_book.json', subjectName: 'Social Studies' },
  { file: 'grade8_life_skills_book.json', subjectName: 'Life Skills' }
];

async function syncGrade8ImagesToDatabase() {
  console.log('🖼️ Syncing Grade 8 images from JSON files to database...\n');
  
  let totalUpdated = 0;
  let totalFailed = 0;

  for (const bookInfo of GRADE8_BOOKS) {
    const bookPath = path.join(process.cwd(), bookInfo.file);
    
    if (!fs.existsSync(bookPath)) {
      console.log(`⚠️ Book file not found: ${bookInfo.file}`);
      continue;
    }

    console.log(`\n📚 Processing: ${bookInfo.subjectName}`);
    
    const bookData: Book = JSON.parse(fs.readFileSync(bookPath, 'utf-8'));
    
    for (const chapter of bookData.book.chapters) {
      console.log(`  📖 Chapter: ${chapter.title}`);
      
      for (const lesson of chapter.lessons) {
        if (!lesson.mediaUrl || !lesson.mediaUrl.includes('r2.dev')) {
          continue;
        }

        try {
          const dbLessons = await db.select()
            .from(subjectLessons)
            .innerJoin(subjectChapters, eq(subjectLessons.chapterId, subjectChapters.id))
            .innerJoin(subjects, eq(subjectChapters.subjectId, subjects.id))
            .where(
              and(
                eq(subjectLessons.title, lesson.title),
                eq(subjects.gradeLevel, 8)
              )
            )
            .limit(1);

          if (dbLessons.length > 0) {
            const dbLesson = dbLessons[0].subject_lessons;
            
            await db.update(subjectLessons)
              .set({ 
                cloudinaryImages: [lesson.mediaUrl]
              })
              .where(eq(subjectLessons.id, dbLesson.id));
            
            console.log(`    ✅ Updated: ${lesson.title}`);
            totalUpdated++;
          } else {
            console.log(`    ⚠️ Not found in DB: ${lesson.title}`);
            totalFailed++;
          }
        } catch (error: any) {
          console.log(`    ❌ Error updating ${lesson.title}: ${error.message}`);
          totalFailed++;
        }
      }
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 SYNC SUMMARY');
  console.log('='.repeat(50));
  console.log(`Total Updated: ${totalUpdated}`);
  console.log(`Total Failed: ${totalFailed}`);
  console.log('='.repeat(50) + '\n');
}

syncGrade8ImagesToDatabase()
  .then(() => {
    console.log('✅ Sync complete!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Sync failed:', err);
    process.exit(1);
  });
