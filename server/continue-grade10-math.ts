import { getOpenAIClient } from './openai';
import { sql } from './db';
import { v4 as uuidv4 } from 'uuid';

const SUBJECT_ID = '97830f9a-db9c-45bb-80d6-9e2fddc1876c';

const REMAINING_CHAPTERS = [
  { chapter: 4, title: "Quadratic Expressions and Equations" },
  { chapter: 5, title: "Ratio, Rate and Proportion" },
  { chapter: 6, title: "Functions and Graphs" },
  { chapter: 7, title: "Geometry: Angles and Lines" },
  { chapter: 8, title: "Geometry: Triangles and Polygons" },
  { chapter: 9, title: "Measurement, Mensuration and Scale" },
  { chapter: 10, title: "Introduction to Trigonometry" },
  { chapter: 11, title: "Statistics and Data Handling" },
  { chapter: 12, title: "Probability and Revision" }
];

const LESSONS_PER_CHAPTER: Record<number, string[]> = {
  4: [
    "Expanding Quadratic Expressions",
    "Factorizing Quadratic Expressions",
    "Solving Quadratic Equations by Factoring",
    "The Quadratic Formula"
  ],
  5: [
    "Understanding Ratios",
    "Rates and Unit Rates",
    "Direct and Inverse Proportion",
    "Applications of Proportion in Real Life"
  ],
  6: [
    "Introduction to Functions",
    "Linear Functions and Their Graphs",
    "Interpreting Graphs",
    "Quadratic Functions and Parabolas"
  ],
  7: [
    "Types of Angles and Angle Relationships",
    "Parallel Lines and Transversals",
    "Angle Properties of Triangles",
    "Angles in Polygons"
  ],
  8: [
    "Properties of Triangles",
    "Congruence and Similarity",
    "Properties of Quadrilaterals",
    "Regular and Irregular Polygons"
  ],
  9: [
    "Perimeter and Area of 2D Shapes",
    "Surface Area of 3D Solids",
    "Volume of Prisms and Cylinders",
    "Scale Drawings and Maps"
  ],
  10: [
    "Understanding Trigonometric Ratios",
    "Calculating with Sine, Cosine, and Tangent",
    "Solving Right-Angled Triangles",
    "Applications of Trigonometry"
  ],
  11: [
    "Collecting and Organizing Data",
    "Measures of Central Tendency",
    "Data Representation: Graphs and Charts",
    "Interpreting Statistical Data"
  ],
  12: [
    "Basic Probability Concepts",
    "Calculating Probability",
    "Combined Events and Probability",
    "Course Review and Problem Solving"
  ]
};

function sanitizeString(str: string): string {
  return str.replace(/\0/g, '').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

async function generateLessonContent(chapterTitle: string, lessonTitle: string): Promise<{
  notes: string;
  examples: string[];
}> {
  const openai = await getOpenAIClient();
  if (!openai) {
    throw new Error('OpenAI API key not configured');
  }

  const prompt = `Create comprehensive Grade 10 Mathematics lesson content for:
Chapter: ${chapterTitle}
Lesson: ${lessonTitle}

Generate content that includes:
1. Detailed notes (1500-2500 words) explaining the topic with:
   - Clear definitions and explanations
   - Step-by-step procedures where applicable
   - Real-world applications
   - Key formulas highlighted with **bold**

2. 4-6 worked examples with step-by-step solutions

FORMAT: Use Markdown, **bold** for key terms, ## for headers
NO emojis, NO special unicode characters

Respond in JSON:
{
  "notes": "Full lesson content...",
  "examples": ["**Example 1:** ...", "**Example 2:** ..."]
}`;

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

async function continueGeneration() {
  console.log('🚀 Continuing Grade 10 Mathematics generation...\n');

  for (const chapter of REMAINING_CHAPTERS) {
    const chapterId = uuidv4();
    const chapterDesc = `Chapter ${chapter.chapter}: ${chapter.title}`;
    
    await sql`
      INSERT INTO subject_chapters (id, subject_id, title, description, "order", is_active, created_at, updated_at)
      VALUES (${chapterId}, ${SUBJECT_ID}, ${chapter.title}, ${chapterDesc}, ${chapter.chapter}, true, NOW(), NOW())
    `;
    
    console.log(`📚 Created Chapter ${chapter.chapter}: ${chapter.title}`);

    const lessons = LESSONS_PER_CHAPTER[chapter.chapter];
    for (let i = 0; i < lessons.length; i++) {
      const lessonTitle = lessons[i];
      console.log(`   ⏳ Generating lesson ${i + 1}/${lessons.length}: ${lessonTitle}`);

      try {
        const content = await generateLessonContent(chapter.title, lessonTitle);
        const lessonId = uuidv4();

        await sql`
          INSERT INTO subject_lessons (id, chapter_id, title, notes, examples, "order", duration_minutes, is_active, created_at, updated_at)
          VALUES (${lessonId}, ${chapterId}, ${lessonTitle}, ${content.notes}, ${content.examples}, ${i + 1}, 45, true, NOW(), NOW())
        `;

        console.log(`   ✅ Created lesson: ${lessonTitle}`);
      } catch (error: any) {
        console.error(`   ❌ Failed: ${lessonTitle} - ${error.message}`);
      }

      await new Promise(resolve => setTimeout(resolve, 500));
    }
    console.log('');
  }

  console.log('🎉 Grade 10 Mathematics generation complete!');
}

continueGeneration()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
