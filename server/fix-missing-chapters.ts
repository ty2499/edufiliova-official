import { getOpenAIClient } from './openai';
import { db } from './db';
import { subjects, subjectChapters, subjectLessons, subjectExercises } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

const DELAY_BETWEEN_LESSONS = 2000;

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

interface Example {
  problem: string;
  solution: string[];
}

const MISSING_CHAPTERS = [
  {
    title: "Triangles",
    order: 7,
    topics: [
      "Congruence of Triangles",
      "SSS Congruence Criterion",
      "SAS Congruence Criterion",
      "ASA and AAS Congruence Criteria",
      "RHS Congruence Criterion",
      "Properties of Isosceles Triangles",
      "Inequalities in Triangles"
    ]
  },
  {
    title: "Areas of Parallelograms and Triangles",
    order: 9,
    topics: [
      "Figures on the Same Base and Between Same Parallels",
      "Parallelograms on the Same Base",
      "Triangles on the Same Base",
      "Area of Parallelogram",
      "Area of Triangle",
      "Median of a Triangle and Areas"
    ]
  },
  {
    title: "Heron's Formula",
    order: 12,
    topics: [
      "Area of Triangle - Review",
      "Introduction to Heron's Formula",
      "Application of Heron's Formula",
      "Area of Quadrilaterals Using Heron's Formula",
      "Problem Solving with Heron's Formula"
    ]
  },
  {
    title: "Statistics",
    order: 14,
    topics: [
      "Collection and Presentation of Data",
      "Graphical Representation of Data",
      "Measures of Central Tendency",
      "Mean of Grouped Data",
      "Median of Grouped Data",
      "Mode of Grouped Data",
      "Choosing Appropriate Measures"
    ]
  }
];

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function generateLessonContent(
  chapterTitle: string,
  lessonTopic: string
): Promise<{ notes: string; examples: Example[]; quiz: QuizQuestion[] }> {
  const openai = await getOpenAIClient();
  if (!openai) {
    throw new Error('OpenAI not configured');
  }

  const prompt = `Generate comprehensive Grade 9 Mathematics lesson content.

Subject: Mathematics
Chapter: ${chapterTitle}
Lesson Topic: ${lessonTopic}

Create detailed educational content for 14-15 year old students.

REQUIREMENTS:
1. Notes: 1500-2500 words with clear explanations, formulas, and real-world applications
2. Examples: 5 worked examples with step-by-step solutions
3. Quiz: 15 multiple choice questions with explanations

Format response as JSON:
{
  "notes": "Complete lesson content with markdown formatting...",
  "examples": [
    { "problem": "Problem statement", "solution": ["Step 1", "Step 2", "Final Answer"] }
  ],
  "quiz": [
    { "question": "Question?", "options": ["A)", "B)", "C)", "D)"], "correctAnswer": "A)", "explanation": "Why correct" }
  ]
}`;

  console.log(`    📝 Generating: ${lessonTopic}`);

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    max_tokens: 8000,
    temperature: 0.7
  });

  const result = JSON.parse(response.choices[0].message.content || '{}');
  
  return {
    notes: result.notes || '',
    examples: result.examples || [],
    quiz: result.quiz || []
  };
}

async function fixMissingChapters(): Promise<void> {
  console.log('\n📚 Fixing Missing Chapter Content');
  console.log('=' .repeat(60));
  
  const subjectId = 'ddadca0a-e336-4f74-a6ae-2591dff71c69';

  for (const chapterDef of MISSING_CHAPTERS) {
    console.log(`\n📖 Fixing: ${chapterDef.title}`);
    console.log('─'.repeat(50));

    const [existingChapter] = await db.select().from(subjectChapters)
      .where(and(
        eq(subjectChapters.subjectId, subjectId),
        eq(subjectChapters.title, chapterDef.title)
      ));

    let chapterId: string;

    if (existingChapter) {
      chapterId = existingChapter.id;
      const existingLessons = await db.select().from(subjectLessons)
        .where(eq(subjectLessons.chapterId, chapterId));
      
      if (existingLessons.length >= chapterDef.topics.length) {
        console.log(`  ⏩ Chapter already complete (${existingLessons.length} lessons)`);
        continue;
      }
      
      for (const lesson of existingLessons) {
        await db.delete(subjectExercises).where(eq(subjectExercises.lessonId, lesson.id));
      }
      await db.delete(subjectLessons).where(eq(subjectLessons.chapterId, chapterId));
    } else {
      const [newChapter] = await db.insert(subjectChapters).values({
        subjectId: subjectId,
        title: chapterDef.title,
        description: `Grade 9 Mathematics - ${chapterDef.title}`,
        order: chapterDef.order,
        isActive: true
      }).returning();
      chapterId = newChapter.id;
    }

    for (let li = 0; li < chapterDef.topics.length; li++) {
      const topic = chapterDef.topics[li];
      console.log(`  📝 Lesson ${li + 1}/${chapterDef.topics.length}: ${topic}`);

      try {
        const content = await generateLessonContent(chapterDef.title, topic);

        const examplesArray = content.examples.map(ex => 
          `**Problem:** ${ex.problem}\n\n**Solution:**\n${ex.solution.map((s, i) => `${i + 1}. ${s}`).join('\n')}`
        );

        const [lesson] = await db.insert(subjectLessons).values({
          chapterId: chapterId,
          title: topic,
          notes: content.notes,
          examples: examplesArray,
          cloudinaryImages: [],
          order: li + 1,
          durationMinutes: 45,
          isActive: true
        }).returning();

        for (let qi = 0; qi < content.quiz.length; qi++) {
          const q = content.quiz[qi];
          await db.insert(subjectExercises).values({
            lessonId: lesson.id,
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            order: qi + 1,
            isActive: true
          });
        }

        console.log(`    ✅ ${content.examples.length} examples, ${content.quiz.length} questions`);
        await delay(DELAY_BETWEEN_LESSONS);

      } catch (error: any) {
        console.error(`    ❌ Error: ${error.message}`);
      }
    }

    console.log(`  ✅ Chapter fixed`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('🎉 Missing chapters fixed!');
  console.log('='.repeat(60) + '\n');
}

fixMissingChapters()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Failed:', error);
    process.exit(1);
  });
