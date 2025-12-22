import { db } from '../server/db';
import { lessons, modules, quizzes } from '../shared/schema';
import { eq, sql } from 'drizzle-orm';
import { generatePythonLessonContent } from '../server/content-generator';

const PYTHON_COURSE_ID = '663f9127-368d-4e91-b725-896bfc2ea70a';

async function generateAllPythonLessons() {
  console.log('Starting Python course content generation...\n');

  const allLessons = await db.select({
    lessonId: lessons.id,
    lessonTitle: lessons.title,
    lessonDescription: lessons.description,
    moduleId: lessons.moduleId,
    moduleTitle: modules.title,
    orderNum: lessons.orderNum,
    content: lessons.content
  })
  .from(lessons)
  .innerJoin(modules, eq(lessons.moduleId, modules.id))
  .where(eq(modules.courseId, PYTHON_COURSE_ID))
  .orderBy(modules.orderNum, lessons.orderNum);

  const emptyLessons = allLessons.filter(l => !l.content || l.content.trim() === '');
  
  console.log(`Found ${emptyLessons.length} lessons needing content out of ${allLessons.length} total\n`);

  for (let i = 0; i < emptyLessons.length; i++) {
    const lesson = emptyLessons[i];
    console.log(`\n[${i + 1}/${emptyLessons.length}] Generating: ${lesson.moduleTitle} > ${lesson.lessonTitle}`);
    
    try {
      const lessonsInModule = allLessons.filter(l => l.moduleId === lesson.moduleId).length;

      const content = await generatePythonLessonContent(
        lesson.moduleTitle || '',
        lesson.lessonTitle || '',
        lesson.lessonDescription || '',
        lesson.orderNum || 1,
        lessonsInModule
      );

      await db.update(lessons)
        .set({ 
          content: content.content,
          images: content.imagePrompts
        })
        .where(eq(lessons.id, lesson.lessonId));

      if (content.questions && content.questions.length > 0) {
        await db.insert(quizzes).values({
          lessonId: lesson.lessonId,
          title: `${lesson.lessonTitle} Quiz`,
          description: `Test your understanding of ${lesson.lessonTitle}`,
          questions: content.questions,
          passingScore: 70
        });
      }

      console.log(`   Content: ${content.content?.length || 0} chars`);
      console.log(`   Questions: ${content.questions?.length || 0}`);
      console.log(`   Image prompts: ${content.imagePrompts?.length || 0}`);
      
      if (i < emptyLessons.length - 1) {
        console.log('   Waiting 2 seconds before next lesson...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.error(`   Error generating lesson ${lesson.lessonId}:`, error);
    }
  }

  console.log('\n\nPython course content generation complete!');
}

generateAllPythonLessons()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
