import { db } from './db';
import { subjects, subjectChapters, subjectLessons, subjectExercises } from '../shared/schema';
import { generateScienceLessonsForChapter } from './content-generator';
import { eq, and } from 'drizzle-orm';

export async function seedScienceLessons() {
  try {
    console.log('🧬 Starting Science lessons generation...');

    // Get Science subject and chapters
    const scienceSubject = await db
      .select()
      .from(subjects)
      .where(and(eq(subjects.name, 'Science'), eq(subjects.gradeLevel, 7)))
      .limit(1);

    if (scienceSubject.length === 0) {
      console.error('❌ Science subject not found');
      return;
    }

    const chapters = await db
      .select()
      .from(subjectChapters)
      .where(eq(subjectChapters.subjectId, scienceSubject[0].id))
      .orderBy(subjectChapters.order);

    console.log(`📚 Found ${chapters.length} Science chapters`);

    for (const chapter of chapters) {
      console.log(`📖 Generating lessons for: ${chapter.title}`);

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
        const lessons = await generateScienceLessonsForChapter(chapter.title, chapter.description || '');
        
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
              cloudinaryImages: [], // Will be populated later
              order: i + 1,
              durationMinutes: 35,
              isActive: true
            })
            .returning();

          console.log(`✅ Created lesson: ${lesson.title}`);

          // Insert quiz questions
          if (lesson.questions && lesson.questions.length > 0) {
            for (let j = 0; j < lesson.questions.length; j++) {
              const question = lesson.questions[j];
              
              await db
                .insert(subjectExercises)
                .values({
                  lessonId: insertedLesson[0].id,
                  question: question.question,
                  options: question.options,
                  correctAnswer: question.correctAnswer,
                  explanation: question.explanation,
                  order: j + 1,
                  isActive: true
                });
            }
            console.log(`✅ Added ${lesson.questions.length} quiz questions for ${lesson.title}`);
          }
        }

        // Add a small delay between chapters to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        console.error(`❌ Error generating lessons for ${chapter.title}:`, error);
        continue; // Continue with next chapter
      }
    }

    console.log('🎉 Science lessons generation completed!');

  } catch (error) {
    console.error('❌ Error seeding Science lessons:', error);
    throw error;
  }
}