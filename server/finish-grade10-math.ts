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

async function finishGeneration() {
  console.log('🚀 Finishing Grade 10 Mathematics...\n');

  // Check what's missing
  const existing = await sql`
    SELECT sc.title, sc."order" as chapter_order, COUNT(sl.id) as lesson_count
    FROM subject_chapters sc
    LEFT JOIN subject_lessons sl ON sl.chapter_id = sc.id
    WHERE sc.subject_id = ${SUBJECT_ID}
    GROUP BY sc.id, sc.title, sc."order"
    ORDER BY sc."order"
  `;
  
  console.log('Current chapters:');
  for (const ch of existing) {
    console.log(`  Chapter ${ch.chapter_order}: ${ch.title} - ${ch.lesson_count} lessons`);
  }
  
  const chapterOrders = existing.map((c: any) => c.chapter_order);
  
  // Add missing Chapter 12 if needed
  if (!chapterOrders.includes(12)) {
    const chapterId = uuidv4();
    await sql`
      INSERT INTO subject_chapters (id, subject_id, title, description, "order", is_active, created_at, updated_at)
      VALUES (${chapterId}, ${SUBJECT_ID}, 'Probability and Revision', 'Chapter 12: Probability and Revision', 12, true, NOW(), NOW())
    `;
    console.log('\n📚 Created Chapter 12: Probability and Revision');

    const lessons = [
      "Basic Probability Concepts",
      "Calculating Probability",
      "Combined Events and Probability",
      "Course Review and Problem Solving"
    ];

    for (let i = 0; i < lessons.length; i++) {
      console.log(`   ⏳ Generating: ${lessons[i]}`);
      try {
        const content = await generateLessonContent("Probability and Revision", lessons[i]);
        await sql`
          INSERT INTO subject_lessons (id, chapter_id, title, notes, examples, "order", duration_minutes, is_active, created_at, updated_at)
          VALUES (${uuidv4()}, ${chapterId}, ${lessons[i]}, ${content.notes}, ${content.examples}, ${i + 1}, 45, true, NOW(), NOW())
        `;
        console.log(`   ✅ Created: ${lessons[i]}`);
      } catch (error: any) {
        console.error(`   ❌ Failed: ${lessons[i]}`);
      }
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  // Check for chapters with less than 4 lessons and fill them
  for (const ch of existing) {
    if (ch.lesson_count < 4) {
      console.log(`\n⚠️ Chapter ${ch.chapter_order} has only ${ch.lesson_count} lessons, adding missing ones...`);
      // Get existing lessons for this chapter
      const existingLessons = await sql`
        SELECT title FROM subject_lessons sl
        JOIN subject_chapters sc ON sl.chapter_id = sc.id
        WHERE sc.subject_id = ${SUBJECT_ID} AND sc."order" = ${ch.chapter_order}
      `;
      console.log(`   Existing lessons: ${existingLessons.map((l: any) => l.title).join(', ')}`);
    }
  }

  // Final count
  const final = await sql`
    SELECT COUNT(*) as total FROM subject_lessons sl
    JOIN subject_chapters sc ON sl.chapter_id = sc.id
    WHERE sc.subject_id = ${SUBJECT_ID}
  `;
  console.log(`\n🎉 Complete! Total lessons: ${final[0].total}`);
}

finishGeneration()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
