import { db } from './db';
import { courses, modules, lessons } from '../shared/schema';
import { eq } from 'drizzle-orm';
import { getOpenAIClient } from './openai';

const JOB_READINESS_COURSE_TITLE = 'Job Readiness and Career Success';

async function generateLongLessonContent(
  moduleTitle: string,
  lessonTitle: string,
  lessonNumber: number
): Promise<{ content: string; keyPoints: string[] }> {
  const openai = await getOpenAIClient();
  if (!openai) {
    throw new Error('OpenAI client not configured');
  }

  const prompt = `You are a professional e-learning course writer. Generate COMPREHENSIVE and DETAILED lesson content for a Job Readiness course.

Module: ${moduleTitle}
Lesson: ${lessonTitle}
Lesson Number: ${lessonNumber}

CRITICAL REQUIREMENTS:
- Content must be MINIMUM 2000 words (aim for 2000-2500 words)
- Be thorough and comprehensive
- Use simple, clear language
- Include detailed explanations, examples, and practical tips
- Cover multiple aspects of the topic in depth
- Use bullet points and numbered lists where appropriate
- Format with HTML tags (h2, h3, p, ul, li, ol, strong)
- Include real-world scenarios and case studies
- Add actionable advice and step-by-step guidance

STRUCTURE (follow this):
1. Introduction (explain why this topic matters)
2. Main concepts (detailed explanations with examples)
3. Practical applications (real-world scenarios)
4. Common mistakes to avoid
5. Tips for success
6. Summary and key takeaways

Respond in JSON format:
{
  "content": "<h2>Title</h2><p>Detailed intro...</p><h3>Section 1</h3><p>Comprehensive content...</p>...",
  "keyPoints": ["Key point 1", "Key point 2", "Key point 3", "Key point 4", "Key point 5"]
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    max_tokens: 8000
  });

  const result = JSON.parse(response.choices[0].message.content || '{}');
  return {
    content: result.content || '',
    keyPoints: result.keyPoints || []
  };
}

async function regenerateFirstModules() {
  console.log('🔄 Regenerating Job Readiness modules 1-3 with 2000+ words...');

  const course = await db
    .select()
    .from(courses)
    .where(eq(courses.title, JOB_READINESS_COURSE_TITLE))
    .limit(1);

  if (!course.length) {
    console.log('❌ Course not found');
    return;
  }

  const courseModules = await db
    .select()
    .from(modules)
    .where(eq(modules.courseId, course[0].id))
    .orderBy(modules.orderNum);

  // Only first 3 modules
  const firstModules = courseModules.slice(0, 3);
  console.log(`📚 Processing ${firstModules.length} modules`);

  let totalUpdated = 0;

  for (const mod of firstModules) {
    console.log(`\n📖 ${mod.title}`);

    const moduleLessons = await db
      .select()
      .from(lessons)
      .where(eq(lessons.moduleId, mod.id))
      .orderBy(lessons.orderNum);

    for (let i = 0; i < moduleLessons.length; i++) {
      const lesson = moduleLessons[i];
      console.log(`  📝 ${lesson.title}`);

      try {
        const generated = await generateLongLessonContent(mod.title, lesson.title, i + 1);
        await db.update(lessons).set({
          content: generated.content,
          notes: generated.keyPoints.join('\n• ')
        }).where(eq(lessons.id, lesson.id));
        console.log(`    ✅ Done`);
        totalUpdated++;
        await new Promise(r => setTimeout(r, 300));
      } catch (err) {
        console.error(`    ❌ Error:`, err);
      }
    }
  }

  console.log(`\n🎉 Updated ${totalUpdated} lessons with 2000+ words!`);
}

regenerateFirstModules()
  .then(() => process.exit(0))
  .catch(err => { console.error(err); process.exit(1); });
