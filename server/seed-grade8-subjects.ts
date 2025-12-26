import { db } from './db';
import { subjects, subjectChapters, subjectLessons, subjectExercises } from '@shared/schema';
import { eq } from 'drizzle-orm';
import OpenAI from 'openai';
import { getOpenAIClient } from './openai';

const GRADE_LEVEL = 8;

// Grade 8 curriculum structure - one chapter at a time to avoid limits
const GRADE_8_CURRICULUM = {
  'English Language Arts': [
    { title: 'Reading Comprehension', description: 'Analyzing fiction and non-fiction texts' },
    { title: 'Grammar and Sentence Structure', description: 'Advanced grammar rules and complex sentences' },
    { title: 'Writing Skills', description: 'Essay writing, paragraphs, and composition' },
    { title: 'Vocabulary Development', description: 'Word roots, prefixes, suffixes, and context clues' },
    { title: 'Literature Analysis', description: 'Poetry, short stories, and literary devices' },
    { title: 'Speaking and Listening', description: 'Presentations, debates, and active listening' },
  ],
  'Mathematics': [
    { title: 'Rational Numbers', description: 'Fractions, decimals, and operations with rational numbers' },
    { title: 'Algebraic Expressions', description: 'Variables, expressions, and simplification' },
    { title: 'Linear Equations', description: 'Solving one and two-step equations' },
    { title: 'Geometry Fundamentals', description: 'Angles, triangles, and geometric properties' },
    { title: 'Data and Statistics', description: 'Mean, median, mode, and data representation' },
    { title: 'Proportions and Percentages', description: 'Ratios, proportions, and percentage calculations' },
  ],
  'Science': [
    { title: 'Matter and Its Properties', description: 'States of matter, physical and chemical changes' },
    { title: 'Forces and Motion', description: 'Newtons laws, speed, velocity, and acceleration' },
    { title: 'Energy and Its Forms', description: 'Kinetic, potential, and energy transformations' },
    { title: 'Living Organisms', description: 'Cell structure, tissues, and organ systems' },
    { title: 'Ecosystems', description: 'Food chains, food webs, and environmental balance' },
    { title: 'Earth Science', description: 'Rocks, minerals, and the water cycle' },
  ],
  'Social Studies': [
    { title: 'Ancient Civilizations', description: 'Egypt, Mesopotamia, Greece, and Rome' },
    { title: 'World Geography', description: 'Continents, countries, and physical features' },
    { title: 'Government and Citizenship', description: 'Types of government and civic responsibilities' },
    { title: 'Economics Basics', description: 'Supply, demand, and economic systems' },
    { title: 'Cultural Studies', description: 'World cultures, traditions, and diversity' },
    { title: 'Historical Events', description: 'Major events that shaped the modern world' },
  ],
  'Life Skills': [
    { title: 'Personal Finance', description: 'Budgeting, saving, and money management' },
    { title: 'Health and Wellness', description: 'Nutrition, exercise, and mental health' },
    { title: 'Communication Skills', description: 'Effective communication and conflict resolution' },
    { title: 'Time Management', description: 'Planning, prioritizing, and goal setting' },
    { title: 'Digital Literacy', description: 'Online safety, digital citizenship, and technology use' },
    { title: 'Study Skills', description: 'Note-taking, test preparation, and learning strategies' },
  ],
};

async function generateChapterLessons(
  openai: OpenAI,
  subjectName: string,
  chapterTitle: string,
  chapterDescription: string
): Promise<Array<{
  title: string;
  notes: string;
  examples: string[];
}>> {
  console.log(`  Generating lessons for chapter: ${chapterTitle}`);

  const prompt = `You are a professional curriculum developer. Create 4 comprehensive lessons for Grade 8 students.

Subject: ${subjectName}
Chapter: ${chapterTitle}
Description: ${chapterDescription}

For EACH lesson, provide:
1. A clear, specific lesson title
2. Detailed teaching notes (800-1200 words) that:
   - Explain concepts clearly for 13-14 year old students
   - Include definitions and key terms
   - Provide step-by-step explanations
   - Give real-world applications
   - Use clear, simple language
3. 3-4 worked examples showing how to apply the concepts

RULES:
- Professional, educational tone
- No emojis or informal language
- Age-appropriate content
- Accurate information
- Progressive difficulty (lesson 1 easiest, lesson 4 most challenging)

Respond in JSON format:
{
  "lessons": [
    {
      "title": "Lesson title here",
      "notes": "Detailed teaching notes here (800-1200 words)...",
      "examples": ["Example 1 with full explanation", "Example 2 with full explanation", "Example 3 with full explanation"]
    }
  ]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: 8000,
      temperature: 0.7
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return result.lessons || [];
  } catch (error) {
    console.error(`  Error generating lessons for ${chapterTitle}:`, error);
    return [];
  }
}

async function generateLessonQuestions(
  openai: OpenAI,
  subjectName: string,
  chapterTitle: string,
  lessonTitle: string,
  lessonNotes: string
): Promise<Array<{
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}>> {
  console.log(`    Generating questions for: ${lessonTitle}`);

  const prompt = `Create 15 multiple choice questions for this Grade 8 lesson.

Subject: ${subjectName}
Chapter: ${chapterTitle}
Lesson: ${lessonTitle}

Lesson Content Summary:
${lessonNotes.substring(0, 2000)}

Generate 15 questions that:
- Test understanding of key concepts
- Range from easy (5), medium (5), to hard (5)
- Have 4 answer options each
- Have clear, unambiguous correct answers
- Include helpful explanations

RULES:
- Professional, educational tone
- No emojis
- Clear, simple language
- Accurate answers

Respond in JSON format:
{
  "questions": [
    {
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      "explanation": "Brief explanation of why this is correct"
    }
  ]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: 4000,
      temperature: 0.7
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return result.questions || [];
  } catch (error) {
    console.error(`    Error generating questions for ${lessonTitle}:`, error);
    return [];
  }
}

async function seedGrade8Subject(subjectName: string): Promise<void> {
  console.log(`\nProcessing subject: ${subjectName}`);

  const openai = await getOpenAIClient();
  if (!openai) {
    throw new Error('OpenAI API key not configured');
  }

  // Get the Grade 8 subject from database (filter by both name AND grade level)
  const allSubjects = await db
    .select()
    .from(subjects)
    .where(eq(subjects.gradeLevel, GRADE_LEVEL));
  
  const subject = allSubjects.find(s => s.name === subjectName);

  if (!subject) {
    console.log(`Subject ${subjectName} not found in database`);
    return;
  }

  const chapters = GRADE_8_CURRICULUM[subjectName as keyof typeof GRADE_8_CURRICULUM];
  if (!chapters) {
    console.log(`No curriculum defined for ${subjectName}`);
    return;
  }

  // Process one chapter at a time
  for (let chapterIndex = 0; chapterIndex < chapters.length; chapterIndex++) {
    const chapterDef = chapters[chapterIndex];
    console.log(`\n  Chapter ${chapterIndex + 1}/${chapters.length}: ${chapterDef.title}`);

    // Check if chapter already exists
    const existingChapters = await db
      .select()
      .from(subjectChapters)
      .where(eq(subjectChapters.subjectId, subject.id));

    const chapterExists = existingChapters.some(c => c.title === chapterDef.title);
    if (chapterExists) {
      console.log(`  Chapter "${chapterDef.title}" already exists, skipping...`);
      continue;
    }

    // Create chapter
    const [chapter] = await db.insert(subjectChapters).values({
      subjectId: subject.id,
      title: chapterDef.title,
      description: chapterDef.description,
      order: chapterIndex + 1,
      isActive: true
    }).returning();

    // Generate lessons for this chapter (one API call)
    const lessons = await generateChapterLessons(
      openai,
      subjectName,
      chapterDef.title,
      chapterDef.description
    );

    // Insert each lesson and generate questions separately
    for (let lessonIndex = 0; lessonIndex < lessons.length; lessonIndex++) {
      const lessonData = lessons[lessonIndex];
      console.log(`    Lesson ${lessonIndex + 1}/${lessons.length}: ${lessonData.title}`);

      // Insert lesson
      const [lesson] = await db.insert(subjectLessons).values({
        chapterId: chapter.id,
        title: lessonData.title,
        notes: lessonData.notes,
        examples: lessonData.examples,
        order: lessonIndex + 1,
        durationMinutes: 30,
        isActive: true
      }).returning();

      // Generate questions for this lesson (separate API call to avoid limits)
      const questions = await generateLessonQuestions(
        openai,
        subjectName,
        chapterDef.title,
        lessonData.title,
        lessonData.notes
      );

      // Insert questions
      for (let qIndex = 0; qIndex < questions.length; qIndex++) {
        const q = questions[qIndex];
        await db.insert(subjectExercises).values({
          lessonId: lesson.id,
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          order: qIndex + 1,
          isActive: true
        });
      }

      console.log(`      Added ${questions.length} questions`);

      // Small delay between lessons to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`  Completed chapter: ${chapterDef.title}`);

    // Delay between chapters
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log(`Completed subject: ${subjectName}`);
}

export async function seedAllGrade8Subjects(): Promise<void> {
  console.log('Starting Grade 8 curriculum seeding...');
  console.log('Processing one chapter at a time to ensure quality...\n');

  const subjectNames = Object.keys(GRADE_8_CURRICULUM);

  for (const subjectName of subjectNames) {
    try {
      await seedGrade8Subject(subjectName);
    } catch (error) {
      console.error(`Error seeding ${subjectName}:`, error);
    }
  }

  console.log('\nGrade 8 curriculum seeding complete!');
}

// Run if called directly
const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  seedAllGrade8Subjects()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}
