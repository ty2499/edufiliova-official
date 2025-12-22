import { getOpenAIClient } from './openai';
import { sql } from './db';
import { v4 as uuidv4 } from 'uuid';

async function addLastLesson() {
  const openai = await getOpenAIClient();
  if (!openai) throw new Error('OpenAI not configured');
  
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: `Create Grade 10 Mathematics lesson for:
Chapter: Statistics and Data Handling
Lesson: Interpreting Statistical Data

Include: 1. Detailed notes (1500-2500 words), 2. 4-6 worked examples
Use Markdown. NO emojis. JSON format: {"notes": "...", "examples": ["..."]}` }],
    response_format: { type: "json_object" },
    max_tokens: 6000
  });
  
  const result = JSON.parse(response.choices[0].message.content || '{}');
  const notes = (result.notes || '').replace(/\0/g, '');
  const examples = (result.examples || []).map((e: string) => e.replace(/\0/g, ''));
  
  await sql`INSERT INTO subject_lessons (id, chapter_id, title, notes, examples, "order", duration_minutes, is_active, created_at, updated_at)
    VALUES (${uuidv4()}, '5ec4509d-34fe-42c4-b5a4-0c85d7a00aad', 'Interpreting Statistical Data', ${notes}, ${examples}, 4, 45, true, NOW(), NOW())`;
  
  console.log('✅ Added final lesson: Interpreting Statistical Data');
  process.exit(0);
}

addLastLesson().catch(e => { console.error(e); process.exit(1); });
