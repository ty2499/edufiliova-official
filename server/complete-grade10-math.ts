import { getOpenAIClient } from './openai';
import { sql } from './db';
import { v4 as uuidv4 } from 'uuid';

const SUBJECT_ID = '97830f9a-db9c-45bb-80d6-9e2fddc1876c';

function sanitizeString(str: string): string {
  return str.replace(/\0/g, '').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

async function generateLessonContent(chapterTitle: string, lessonTitle: string): Promise<{
  notes: string;
  examples: string[];
}> {
  const openai = await getOpenAIClient();
  if (!openai) throw new Error('OpenAI API key not configured');

  const prompt = `Create Grade 10 Mathematics lesson for:
Chapter: ${chapterTitle}
Lesson: ${lessonTitle}

Include:
1. Detailed notes (1500-2500 words) with definitions, procedures, real-world applications, **bold** for key formulas
2. 4-6 worked examples with step-by-step solutions

Use Markdown. NO emojis.

JSON format:
{"notes": "...", "examples": ["**Example 1:** ...", "**Example 2:** ..."]}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    max_tokens: 6000
  });

  const result = JSON.parse(response.choices[0].message.content || '{}');
  return {
    notes: sanitizeString(result.notes || ''),
    examples: (result.examples || []).map((e: string) => sanitizeString(e))
  };
}

async function addLesson(chapterId: string, chapterTitle: string, lessonTitle: string, order: number) {
  console.log(`   ⏳ Generating: ${lessonTitle}`);
  try {
    const content = await generateLessonContent(chapterTitle, lessonTitle);
    await sql`
      INSERT INTO subject_lessons (id, chapter_id, title, notes, examples, "order", duration_minutes, is_active, created_at, updated_at)
      VALUES (${uuidv4()}, ${chapterId}, ${lessonTitle}, ${content.notes}, ${content.examples}, ${order}, 45, true, NOW(), NOW())
    `;
    console.log(`   ✅ Created: ${lessonTitle}`);
  } catch (error: any) {
    console.error(`   ❌ Failed: ${lessonTitle} - ${error.message}`);
  }
  await new Promise(resolve => setTimeout(resolve, 500));
}

async function completeGeneration() {
  console.log('🚀 Completing Grade 10 Mathematics...\n');

  // Get all chapters
  const chapters = await sql`
    SELECT id, title, "order" FROM subject_chapters
    WHERE subject_id = ${SUBJECT_ID}
    ORDER BY "order"
  `;

  // Missing lessons per chapter
  const missingLessons: Record<number, string[]> = {
    2: ["Factorization Techniques"],
    5: ["Applications of Proportion in Real Life"],
    6: ["Interpreting Graphs", "Quadratic Functions and Parabolas"],
    10: ["Solving Right-Angled Triangles", "Applications of Trigonometry"]
  };

  // Add missing lessons to existing chapters
  for (const ch of chapters) {
    const missing = missingLessons[ch.order];
    if (missing) {
      console.log(`📚 Completing Chapter ${ch.order}: ${ch.title}`);
      const existingCount = await sql`SELECT COUNT(*) as cnt FROM subject_lessons WHERE chapter_id = ${ch.id}`;
      let order = Number(existingCount[0].cnt) + 1;
      for (const lesson of missing) {
        await addLesson(ch.id, ch.title, lesson, order++);
      }
      console.log('');
    }
  }

  // Add Chapter 11: Statistics
  const hasChapter11 = chapters.some((c: any) => c.order === 11);
  if (!hasChapter11) {
    const chapterId = uuidv4();
    await sql`
      INSERT INTO subject_chapters (id, subject_id, title, description, "order", is_active, created_at, updated_at)
      VALUES (${chapterId}, ${SUBJECT_ID}, 'Statistics and Data Handling', 'Chapter 11: Statistics and Data Handling', 11, true, NOW(), NOW())
    `;
    console.log('📚 Created Chapter 11: Statistics and Data Handling');

    const lessons = [
      "Collecting and Organizing Data",
      "Measures of Central Tendency",
      "Data Representation: Graphs and Charts",
      "Interpreting Statistical Data"
    ];
    for (let i = 0; i < lessons.length; i++) {
      await addLesson(chapterId, "Statistics and Data Handling", lessons[i], i + 1);
    }
    console.log('');
  }

  // Final count
  const final = await sql`
    SELECT 
      (SELECT COUNT(*) FROM subject_chapters WHERE subject_id = ${SUBJECT_ID}) as chapters,
      (SELECT COUNT(*) FROM subject_lessons sl JOIN subject_chapters sc ON sl.chapter_id = sc.id WHERE sc.subject_id = ${SUBJECT_ID}) as lessons
  `;
  console.log(`\n🎉 Complete! ${final[0].chapters} chapters, ${final[0].lessons} lessons`);
}

completeGeneration()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
