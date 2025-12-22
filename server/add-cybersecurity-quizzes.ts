import { db } from './db';
import { lessons, quizzes, modules } from '../shared/schema';
import { eq } from 'drizzle-orm';
import { getOpenAIClient } from './openai';

const COURSE_ID = '92f4d21e-63f6-4d39-8143-d2a937faa3ae';

const SYSTEM_PROMPT = `You are a professional quiz creator for cybersecurity education.

STRICT RULES:
- Output ONLY valid JSON.
- No markdown, no explanations, no extra text.
- Simple, clear, beginner-friendly English.
- NO EMOJIS anywhere.
- Questions should test understanding, not memorization.`;

interface QuizQuestion {
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

async function generateQuizForLesson(lessonTitle: string, lessonContent: string | null): Promise<QuizQuestion[]> {
  const openai = await getOpenAIClient();
  if (!openai) {
    throw new Error('OpenAI not configured');
  }

  const userPrompt = `Create a quiz for this cybersecurity lesson.

Lesson Title: ${lessonTitle}
${lessonContent ? `Lesson Summary: ${lessonContent.substring(0, 500)}...` : ''}

Generate exactly 5 multiple-choice questions that test understanding of the lesson topic.

Return JSON in EXACTLY this structure:
{
  "questions": [
    {
      "text": "Question text here",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Brief explanation of why this answer is correct"
    }
  ]
}

RULES:
- Exactly 5 questions
- 4 options per question
- correctIndex is 0-based (0=first option, 1=second, etc.)
- Questions should be beginner-friendly
- Focus on practical understanding`;

  console.log(`Generating quiz for: ${lessonTitle}...`);

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt }
    ],
    response_format: { type: "json_object" },
    max_tokens: 2000,
    temperature: 0.7
  });

  const content = response.choices[0].message.content;
  if (!content) {
    throw new Error('No content returned from OpenAI');
  }

  const parsed = JSON.parse(content);
  console.log(`Quiz generated for: ${lessonTitle}`);
  return parsed.questions;
}

async function addQuizzesToCybersecurityCourse() {
  console.log('\n========================================');
  console.log('ADDING QUIZZES TO CYBERSECURITY COURSE');
  console.log('========================================\n');

  const courseModules = await db.select().from(modules)
    .where(eq(modules.courseId, COURSE_ID))
    .orderBy(modules.orderNum);

  console.log(`Found ${courseModules.length} modules`);

  for (const mod of courseModules) {
    console.log(`\nProcessing Module: ${mod.title}`);
    
    const moduleLessons = await db.select().from(lessons)
      .where(eq(lessons.moduleId, mod.id))
      .orderBy(lessons.orderNum);

    console.log(`Found ${moduleLessons.length} lessons in module`);

    const lastLesson = moduleLessons[moduleLessons.length - 1];
    if (!lastLesson) {
      console.log(`No lessons found for module ${mod.title}, skipping`);
      continue;
    }

    const existingQuiz = await db.select().from(quizzes)
      .where(eq(quizzes.lessonId, lastLesson.id));

    if (existingQuiz.length > 0) {
      console.log(`Quiz already exists for lesson "${lastLesson.title}", skipping`);
      continue;
    }

    try {
      const quizQuestions = await generateQuizForLesson(
        lastLesson.title,
        lastLesson.content
      );

      const questionsJsonb = quizQuestions.map((q, idx) => ({
        id: idx + 1,
        text: q.text,
        options: q.options,
        correctIndex: q.correctIndex,
        explanation: q.explanation
      }));

      await db.insert(quizzes).values({
        lessonId: lastLesson.id,
        title: `${mod.title} Quiz`,
        description: `Test your understanding of ${mod.title}`,
        questions: questionsJsonb,
        passingScore: 70,
        isActive: true
      });

      console.log(`Created quiz with ${quizQuestions.length} questions for lesson: ${lastLesson.title}`);
      
      await new Promise(r => setTimeout(r, 2000));
    } catch (error) {
      console.error(`Failed to create quiz for ${lastLesson.title}:`, error);
    }
  }

  console.log('\n========================================');
  console.log('QUIZ GENERATION COMPLETE');
  console.log('========================================');
}

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const isMainModule = process.argv[1] && __filename.includes(process.argv[1].replace(/\.[^/.]+$/, ''));

if (isMainModule) {
  addQuizzesToCybersecurityCourse()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { addQuizzesToCybersecurityCourse };
