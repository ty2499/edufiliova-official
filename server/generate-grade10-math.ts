import { getOpenAIClient } from './openai';
import { sql } from './db';
import { v4 as uuidv4 } from 'uuid';

const SUBJECT_DATA = {
  grade: 10,
  subject: "Mathematics",
  description: "Grade 10 Mathematics develops strong numerical, algebraic, geometric, and analytical skills. Learners explore mathematical concepts through problem-solving, reasoning, and real-life applications, preparing them for advanced studies and practical decision-making.",
  chapters: [
    { chapter: 1, title: "Number Systems and Real Numbers" },
    { chapter: 2, title: "Algebraic Expressions and Simplification" },
    { chapter: 3, title: "Linear Equations and Inequalities" },
    { chapter: 4, title: "Quadratic Expressions and Equations" },
    { chapter: 5, title: "Ratio, Rate and Proportion" },
    { chapter: 6, title: "Functions and Graphs" },
    { chapter: 7, title: "Geometry: Angles and Lines" },
    { chapter: 8, title: "Geometry: Triangles and Polygons" },
    { chapter: 9, title: "Measurement, Mensuration and Scale" },
    { chapter: 10, title: "Introduction to Trigonometry" },
    { chapter: 11, title: "Statistics and Data Handling" },
    { chapter: 12, title: "Probability and Revision" }
  ]
};

const LESSONS_PER_CHAPTER: Record<number, string[]> = {
  1: [
    "Understanding Natural, Whole, and Integer Numbers",
    "Rational and Irrational Numbers",
    "Real Number Line and Operations",
    "Scientific Notation and Significant Figures"
  ],
  2: [
    "Terms, Coefficients, and Variables",
    "Adding and Subtracting Algebraic Expressions",
    "Multiplying Algebraic Expressions",
    "Factorization Techniques"
  ],
  3: [
    "Solving Linear Equations in One Variable",
    "Word Problems with Linear Equations",
    "Solving Linear Inequalities",
    "Graphing Inequalities on a Number Line"
  ],
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

async function generateLessonContent(chapterTitle: string, lessonTitle: string, grade: number): Promise<{
  notes: string;
  examples: string[];
}> {
  const openai = await getOpenAIClient();
  if (!openai) {
    throw new Error('OpenAI API key not configured');
  }

  const prompt = `Create comprehensive Grade ${grade} Mathematics lesson content for:
Chapter: ${chapterTitle}
Lesson: ${lessonTitle}

Generate content that includes:
1. Detailed notes (1500-2500 words) explaining the topic in student-friendly language with:
   - Clear definitions and explanations
   - Step-by-step procedures where applicable
   - Real-world applications and connections
   - Key formulas or theorems highlighted with **bold**
   - Common mistakes to avoid

2. 4-6 worked examples showing:
   - Step-by-step solutions
   - Different difficulty levels
   - Practical application problems

FORMAT RULES:
- Use Markdown formatting: **bold** for key terms, headers with ##
- Use proper mathematical notation where possible
- Keep language clear and accessible for Grade ${grade} students
- Include diagrams described in text where helpful
- NO emojis, NO hype language

Respond in JSON format:
{
  "notes": "Full lesson content here with Markdown formatting...",
  "examples": [
    "**Example 1:** Problem statement\\n\\n**Solution:**\\nStep 1: ...\\nStep 2: ...\\nAnswer: ...",
    "**Example 2:** ..."
  ]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: 6000
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return {
      notes: result.notes || '',
      examples: result.examples || []
    };
  } catch (error) {
    console.error(`Error generating content for ${lessonTitle}:`, error);
    throw error;
  }
}

async function createGrade10Math() {
  console.log('🚀 Starting Grade 10 Mathematics generation...\n');

  const subjectId = uuidv4();
  
  await sql`
    INSERT INTO subjects (id, name, grade_system, grade_level, description, is_active, approval_status, created_at, updated_at)
    VALUES (${subjectId}, ${SUBJECT_DATA.subject}, 'zimbabwe', ${SUBJECT_DATA.grade}, ${SUBJECT_DATA.description}, true, 'approved', NOW(), NOW())
  `;
  
  console.log(`✅ Created subject: ${SUBJECT_DATA.subject} (Grade ${SUBJECT_DATA.grade})`);
  console.log(`   Subject ID: ${subjectId}\n`);

  for (const chapter of SUBJECT_DATA.chapters) {
    const chapterId = uuidv4();
    const chapterDesc = `Chapter ${chapter.chapter}: ${chapter.title}`;
    
    await sql`
      INSERT INTO subject_chapters (id, subject_id, title, description, "order", is_active, created_at, updated_at)
      VALUES (${chapterId}, ${subjectId}, ${chapter.title}, ${chapterDesc}, ${chapter.chapter}, true, NOW(), NOW())
    `;
    
    console.log(`📚 Created Chapter ${chapter.chapter}: ${chapter.title}`);

    const lessons = LESSONS_PER_CHAPTER[chapter.chapter];
    for (let i = 0; i < lessons.length; i++) {
      const lessonTitle = lessons[i];
      console.log(`   ⏳ Generating lesson ${i + 1}/${lessons.length}: ${lessonTitle}`);

      try {
        const content = await generateLessonContent(chapter.title, lessonTitle, SUBJECT_DATA.grade);
        const lessonId = uuidv4();

        await sql`
          INSERT INTO subject_lessons (id, chapter_id, title, notes, examples, "order", duration_minutes, is_active, created_at, updated_at)
          VALUES (${lessonId}, ${chapterId}, ${lessonTitle}, ${content.notes}, ${content.examples}, ${i + 1}, 45, true, NOW(), NOW())
        `;

        console.log(`   ✅ Created lesson: ${lessonTitle}`);
      } catch (error) {
        console.error(`   ❌ Failed to generate: ${lessonTitle}`, error);
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    console.log('');
  }

  console.log('🎉 Grade 10 Mathematics subject creation complete!');
}

createGrade10Math()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
