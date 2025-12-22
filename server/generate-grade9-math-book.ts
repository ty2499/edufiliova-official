import { getOpenAIClient } from './openai';
import { db } from './db';
import { subjects, subjectChapters, subjectLessons, subjectExercises } from '@shared/schema';
import { eq } from 'drizzle-orm';

const DELAY_BETWEEN_LESSONS = 3000;
const DELAY_BETWEEN_CHAPTERS = 5000;

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

const GRADE_9_MATH_CHAPTERS = [
  {
    id: "CH01",
    title: "Number Systems and Real Numbers",
    topics: [
      "Introduction to Real Numbers",
      "Rational and Irrational Numbers",
      "Representing Real Numbers on the Number Line",
      "Operations on Real Numbers",
      "Laws of Exponents for Real Numbers",
      "Rationalizing the Denominator"
    ]
  },
  {
    id: "CH02", 
    title: "Polynomials",
    topics: [
      "Polynomials in One Variable",
      "Zeros of a Polynomial",
      "Remainder Theorem",
      "Factor Theorem",
      "Factorization of Polynomials",
      "Algebraic Identities",
      "Factorization Using Identities"
    ]
  },
  {
    id: "CH03",
    title: "Coordinate Geometry",
    topics: [
      "The Cartesian Coordinate System",
      "Plotting Points on the Coordinate Plane",
      "Quadrants and Signs of Coordinates",
      "Distance Formula",
      "Section Formula",
      "Midpoint Formula",
      "Area of Triangle Using Coordinates"
    ]
  },
  {
    id: "CH04",
    title: "Linear Equations in Two Variables",
    topics: [
      "Linear Equations in Two Variables",
      "Solutions of Linear Equations",
      "Graphing Linear Equations",
      "Equations of Lines Parallel to Axes",
      "Standard Forms of Linear Equations",
      "Solving Systems by Graphing",
      "Word Problems with Linear Equations"
    ]
  },
  {
    id: "CH05",
    title: "Introduction to Euclid's Geometry",
    topics: [
      "Euclid's Definitions",
      "Euclid's Axioms and Postulates",
      "Equivalent Versions of Euclid's Fifth Postulate",
      "Introduction to Non-Euclidean Geometry"
    ]
  },
  {
    id: "CH06",
    title: "Lines and Angles",
    topics: [
      "Basic Terms and Definitions",
      "Pairs of Angles",
      "Parallel Lines and Transversals",
      "Corresponding Angles and Alternate Angles",
      "Interior Angles on the Same Side",
      "Lines Parallel to the Same Line",
      "Angle Sum Property of Triangles"
    ]
  },
  {
    id: "CH07",
    title: "Triangles",
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
    id: "CH08",
    title: "Quadrilaterals",
    topics: [
      "Angle Sum Property of Quadrilaterals",
      "Types of Quadrilaterals",
      "Properties of Parallelograms",
      "Conditions for Parallelograms",
      "The Mid-Point Theorem",
      "Converse of Mid-Point Theorem",
      "Properties of Rectangles, Rhombus, and Square"
    ]
  },
  {
    id: "CH09",
    title: "Areas of Parallelograms and Triangles",
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
    id: "CH10",
    title: "Circles",
    topics: [
      "Circles and Their Properties",
      "Chords and Their Properties",
      "Arc and Chord",
      "Equal Chords and Their Distances from Centre",
      "Angle Subtended by an Arc",
      "Cyclic Quadrilaterals",
      "Tangent to a Circle"
    ]
  },
  {
    id: "CH11",
    title: "Constructions",
    topics: [
      "Basic Constructions Review",
      "Constructing Bisectors of Line Segments",
      "Constructing Angle Bisectors",
      "Constructing Triangles Given Base and Angles",
      "Constructing Triangles Given Perimeter",
      "Special Triangle Constructions"
    ]
  },
  {
    id: "CH12",
    title: "Heron's Formula",
    topics: [
      "Area of Triangle - Review",
      "Introduction to Heron's Formula",
      "Application of Heron's Formula",
      "Area of Quadrilaterals Using Heron's Formula",
      "Problem Solving with Heron's Formula"
    ]
  },
  {
    id: "CH13",
    title: "Surface Areas and Volumes",
    topics: [
      "Surface Area of Cuboid and Cube",
      "Surface Area of Cylinder",
      "Surface Area of Cone",
      "Surface Area of Sphere",
      "Volume of Cuboid and Cube",
      "Volume of Cylinder",
      "Volume of Cone",
      "Volume of Sphere",
      "Combined Solids and Applications"
    ]
  },
  {
    id: "CH14",
    title: "Statistics",
    topics: [
      "Collection and Presentation of Data",
      "Graphical Representation of Data",
      "Measures of Central Tendency",
      "Mean of Grouped Data",
      "Median of Grouped Data",
      "Mode of Grouped Data",
      "Choosing Appropriate Measures"
    ]
  },
  {
    id: "CH15",
    title: "Probability",
    topics: [
      "Introduction to Probability",
      "Probability - An Experimental Approach",
      "Theoretical Probability",
      "Probability of Simple Events",
      "Complementary Events",
      "Applications of Probability"
    ]
  }
];

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function generateLessonContent(
  chapterTitle: string,
  lessonTopic: string,
  lessonNumber: number,
  totalLessons: number
): Promise<{ notes: string; examples: Example[]; quiz: QuizQuestion[] }> {
  const openai = await getOpenAIClient();
  if (!openai) {
    throw new Error('OpenAI not configured');
  }

  const prompt = `Generate comprehensive Grade 9 Mathematics lesson content.

Subject: Mathematics
Chapter: ${chapterTitle}
Lesson Topic: ${lessonTopic}
Lesson ${lessonNumber} of ${totalLessons}

Create detailed educational content for 14-15 year old students following international mathematics curriculum standards.

REQUIREMENTS:
1. Notes: 1500-2500 words explaining the topic thoroughly with:
   - Clear introduction and learning objectives
   - Detailed concept explanations with mathematical notation
   - Step-by-step procedures and formulas
   - Real-world applications
   - Common mistakes to avoid
   - Key points summary
   - Practice tips

2. Examples: 5 detailed worked examples with:
   - Progressive difficulty (easy to challenging)
   - Complete step-by-step solutions
   - Each step explained clearly

3. Quiz: 15 multiple choice questions covering:
   - Basic understanding (5 questions)
   - Application (5 questions)
   - Problem-solving (5 questions)
   - Each with 4 options and detailed explanation

Format response as JSON:
{
  "notes": "Complete lesson content with markdown formatting...",
  "examples": [
    { "problem": "Problem statement with any given values", "solution": ["Step 1: explanation", "Step 2: calculation", "Step 3: result", "Final Answer: ..."] }
  ],
  "quiz": [
    { "question": "Question text?", "options": ["A) First option", "B) Second option", "C) Third option", "D) Fourth option"], "correctAnswer": "A) First option", "explanation": "Detailed explanation of why this is correct and why others are wrong" }
  ]
}

IMPORTANT GUIDELINES:
- Use proper mathematical terminology
- Include formulas using text notation (e.g., "x² + 2x + 1" for quadratics)
- Make content engaging and accessible
- Connect concepts to real-life applications where possible
- Ensure quiz covers all key concepts from the lesson`;

  console.log(`    📝 Generating content for: ${lessonTopic}`);

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

export async function generateGrade9MathBook(): Promise<{ subjectId: string; chaptersCreated: number; lessonsCreated: number }> {
  console.log('\n📚 Starting Grade 9 Mathematics Book Generation');
  console.log('=' .repeat(60));
  
  const existingSubject = await db.select().from(subjects)
    .where(eq(subjects.name, 'Mathematics'))
    .then(rows => rows.find(r => r.gradeLevel === 9 && r.gradeSystem === 'all'));

  let subjectId: string;

  if (existingSubject) {
    console.log('📖 Found existing Grade 9 Mathematics subject, updating content...');
    subjectId = existingSubject.id;
    
    const existingChapters = await db.select().from(subjectChapters)
      .where(eq(subjectChapters.subjectId, subjectId));
    
    for (const chapter of existingChapters) {
      const lessons = await db.select().from(subjectLessons)
        .where(eq(subjectLessons.chapterId, chapter.id));
      
      for (const lesson of lessons) {
        await db.delete(subjectExercises).where(eq(subjectExercises.lessonId, lesson.id));
      }
      await db.delete(subjectLessons).where(eq(subjectLessons.chapterId, chapter.id));
    }
    await db.delete(subjectChapters).where(eq(subjectChapters.subjectId, subjectId));
  } else {
    console.log('📖 Creating new Grade 9 Mathematics subject...');
    const [newSubject] = await db.insert(subjects).values({
      name: 'Mathematics',
      gradeSystem: 'all',
      gradeLevel: 9,
      description: 'Comprehensive Grade 9 Mathematics curriculum covering Number Systems, Polynomials, Coordinate Geometry, Linear Equations, Euclidean Geometry, Triangles, Quadrilaterals, Circles, Surface Areas and Volumes, Statistics, and Probability. This complete course includes detailed lessons, worked examples, and practice quizzes for each topic.',
      isActive: true,
      approvalStatus: 'approved'
    }).returning();
    subjectId = newSubject.id;
  }

  let totalLessons = 0;
  GRADE_9_MATH_CHAPTERS.forEach(ch => totalLessons += ch.topics.length);
  
  console.log(`\n📊 Total: ${GRADE_9_MATH_CHAPTERS.length} chapters, ${totalLessons} lessons to generate\n`);

  let chaptersCreated = 0;
  let lessonsCreated = 0;
  let globalLessonNumber = 0;

  for (let ci = 0; ci < GRADE_9_MATH_CHAPTERS.length; ci++) {
    const chapterDef = GRADE_9_MATH_CHAPTERS[ci];
    
    console.log(`\n📖 Chapter ${ci + 1}/${GRADE_9_MATH_CHAPTERS.length}: ${chapterDef.title}`);
    console.log('─'.repeat(50));

    const [chapter] = await db.insert(subjectChapters).values({
      subjectId: subjectId,
      title: chapterDef.title,
      description: `Grade 9 Mathematics - ${chapterDef.title}`,
      order: ci + 1,
      isActive: true
    }).returning();

    chaptersCreated++;

    for (let li = 0; li < chapterDef.topics.length; li++) {
      const topic = chapterDef.topics[li];
      globalLessonNumber++;

      console.log(`\n  📝 Lesson ${li + 1}/${chapterDef.topics.length}: ${topic}`);

      try {
        const content = await generateLessonContent(
          chapterDef.title,
          topic,
          globalLessonNumber,
          totalLessons
        );

        const examplesArray = content.examples.map(ex => 
          `**Problem:** ${ex.problem}\n\n**Solution:**\n${ex.solution.map((s, i) => `${i + 1}. ${s}`).join('\n')}`
        );

        const [lesson] = await db.insert(subjectLessons).values({
          chapterId: chapter.id,
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

        lessonsCreated++;
        console.log(`    ✅ Created with ${content.examples.length} examples and ${content.quiz.length} questions`);

        await delay(DELAY_BETWEEN_LESSONS);

      } catch (error: any) {
        console.error(`    ❌ Error generating lesson: ${error.message}`);
        const [lesson] = await db.insert(subjectLessons).values({
          chapterId: chapter.id,
          title: topic,
          notes: `# ${topic}\n\nContent generation pending. Please regenerate this lesson.`,
          examples: [],
          cloudinaryImages: [],
          order: li + 1,
          durationMinutes: 45,
          isActive: true
        }).returning();
        lessonsCreated++;
      }
    }

    console.log(`\n  ✅ Chapter ${ci + 1} complete: ${chapterDef.topics.length} lessons`);
    await delay(DELAY_BETWEEN_CHAPTERS);
  }

  console.log('\n' + '='.repeat(60));
  console.log('🎉 Grade 9 Mathematics Book Generation Complete!');
  console.log(`   📚 Subject ID: ${subjectId}`);
  console.log(`   📖 Chapters: ${chaptersCreated}`);
  console.log(`   📝 Lessons: ${lessonsCreated}`);
  console.log('='.repeat(60) + '\n');

  return { subjectId, chaptersCreated, lessonsCreated };
}

