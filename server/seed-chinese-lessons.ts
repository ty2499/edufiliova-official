import { db } from './db';
import { subjects, subjectChapters, subjectLessons, subjectExercises } from '../shared/schema';
import { generateChineseLessonsForChapter } from './content-generator';
import { eq, and } from 'drizzle-orm';
import { ensureAdminUser } from './ensure-admin-user';

export async function seedChineseLessons() {
  try {
    console.log('🈶 Starting Chinese language lessons generation...');

    // Ensure admin user exists and get their ID
    const adminUserId = await ensureAdminUser();
    console.log(`✅ Using admin user ID: ${adminUserId}`);

    // First, create the Chinese subject if it doesn't exist
    let chineseSubject = await db
      .select()
      .from(subjects)
      .where(and(eq(subjects.name, 'Chinese Language'), eq(subjects.gradeLevel, 7)))
      .limit(1);

    if (chineseSubject.length === 0) {
      console.log('📚 Creating Chinese Language subject for Grade 7...');
      chineseSubject = await db
        .insert(subjects)
        .values({
          name: 'Chinese Language',
          gradeSystem: 'all',
          gradeLevel: 7,
          description: 'Comprehensive Chinese language learning covering characters, pronunciation, grammar, reading, and cultural understanding',
          iconUrl: '🈶',
          createdBy: adminUserId,
          isActive: true
        })
        .returning();
    } else if (!chineseSubject[0].createdBy) {
      // Update existing subject to have admin as creator
      await db
        .update(subjects)
        .set({ createdBy: adminUserId })
        .where(eq(subjects.id, chineseSubject[0].id));
      console.log('✅ Updated existing Chinese subject with admin creator');
    }

    const subjectId = chineseSubject[0].id;

    // Define Chinese Language chapters for Grade 7
    const chineseChapters = [
      {
        title: 'Chinese Characters and Radicals',
        description: 'Learn basic Chinese characters, stroke order, radicals, and their meanings',
        order: 1
      },
      {
        title: 'Pinyin and Pronunciation',
        description: 'Master Chinese pronunciation system, tones, and phonetic structure',
        order: 2
      },
      {
        title: 'Basic Grammar Structure',
        description: 'Understand fundamental Chinese grammar patterns and sentence structure',
        order: 3
      },
      {
        title: 'Daily Conversation',
        description: 'Essential phrases and conversations for everyday situations',
        order: 4
      },
      {
        title: 'Chinese Culture and Festivals',
        description: 'Explore Chinese traditions, festivals, and cultural customs',
        order: 5
      },
      {
        title: 'Reading Comprehension',
        description: 'Develop skills in reading Chinese texts and understanding context',
        order: 6
      },
      {
        title: 'Writing Practice',
        description: 'Learn proper character formation, calligraphy basics, and composition',
        order: 7
      },
      {
        title: 'Numbers and Time',
        description: 'Master Chinese numbers, dates, time expressions, and measurements',
        order: 8
      }
    ];

    // Create chapters
    for (const chapterData of chineseChapters) {
      let existingChapter = await db
        .select()
        .from(subjectChapters)
        .where(
          and(
            eq(subjectChapters.subjectId, subjectId),
            eq(subjectChapters.title, chapterData.title)
          )
        )
        .limit(1);

      if (existingChapter.length === 0) {
        console.log(`📖 Creating chapter: ${chapterData.title}`);
        existingChapter = await db
          .insert(subjectChapters)
          .values({
            subjectId: subjectId,
            title: chapterData.title,
            description: chapterData.description,
            order: chapterData.order,
            isActive: true
          })
          .returning();
      }

      const chapter = existingChapter[0];

      // Generate lessons for this chapter
      console.log(`📝 Generating lessons for: ${chapter.title}`);

      try {
        // Check if lessons already exist for this chapter
        const existingLessons = await db
          .select()
          .from(subjectLessons)
          .where(eq(subjectLessons.chapterId, chapter.id));

        if (existingLessons.length > 0) {
          console.log(`⏭️  Lessons already exist for ${chapter.title}, skipping...`);
          continue;
        }

        // Generate lesson content using OpenAI
        const lessons = await generateChineseLessonsForChapter(chapter.title, chapter.description || '');
        
        console.log(`📝 Generated ${lessons.length} lessons for ${chapter.title}`);

        // Insert lessons and exercises
        for (let i = 0; i < lessons.length; i++) {
          const lesson = lessons[i];

          // Insert lesson
          const insertedLesson = await db
            .insert(subjectLessons)
            .values({
              chapterId: chapter.id,
              title: lesson.title,
              notes: lesson.notes,
              examples: lesson.examples,
              cloudinaryImages: [], // Will be populated later if needed
              order: i + 1,
              durationMinutes: 40, // Chinese lessons need a bit more time for character practice
              isActive: true
            })
            .returning();

          console.log(`✅ Created lesson: ${lesson.title}`);

          // Insert quiz questions
          if (lesson.questions && lesson.questions.length > 0) {
            for (let j = 0; j < lesson.questions.length; j++) {
              const question = lesson.questions[j];
              
              await db.insert(subjectExercises).values({
                lessonId: insertedLesson[0].id,
                question: question.question,
                options: question.options,
                correctAnswer: question.correctAnswer,
                explanation: question.explanation,
                order: j + 1,
                isActive: true
              });
            }
            console.log(`📋 Created ${lesson.questions.length} quiz questions for ${lesson.title}`);
          }
        }

      } catch (error) {
        console.error(`❌ Error generating lessons for ${chapter.title}:`, error);
        continue; // Skip this chapter and continue with others
      }
    }

    console.log('🎉 Chinese Language lessons seeded successfully!');

  } catch (error) {
    console.error('❌ Error seeding Chinese lessons:', error);
    throw error;
  }
}