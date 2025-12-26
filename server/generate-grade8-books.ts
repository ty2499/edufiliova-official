import { getOpenAIClient } from './openai';
import { generateAndSaveImage } from './utils/image-generator';
import * as fs from 'fs';
import * as path from 'path';

const DELAY_BETWEEN_LESSONS = 5000;
const DELAY_BETWEEN_IMAGES = 12000;
const DELAY_BETWEEN_CHAPTERS = 8000;

interface QuizQuestion {
  id: string;
  text: string;
  options: string[];
  correct: number;
}

interface Example {
  problem: string;
  solution: string[];
}

interface Lesson {
  id: string;
  lessonNumber: number;
  lessonOrder: number;
  locked: boolean;
  title: string;
  content: string;
  examples: Example[];
  mediaUrl: string;
  quiz: QuizQuestion[];
}

interface Chapter {
  id: string;
  title: string;
  lessons: Lesson[];
}

interface Book {
  title: string;
  grade: number;
  language: string;
  chapters: Chapter[];
}

const GRADE_8_SUBJECTS = {
  mathematics: {
    title: "Grade 8 Mathematics",
    chapters: [
      { id: "M01", title: "Algebraic Expressions", topics: ["Variables and constants", "Like and unlike terms", "Addition and subtraction of algebraic expressions", "Multiplication of algebraic expressions", "Factorization"] },
      { id: "M02", title: "Linear Equations", topics: ["Solving linear equations", "Word problems with equations", "Equations with fractions", "Simultaneous equations introduction", "Graphing linear equations"] },
      { id: "M03", title: "Geometry and Measurement", topics: ["Angles and parallel lines", "Properties of triangles", "Properties of quadrilaterals", "Circles and their properties", "Area and perimeter formulas"] },
      { id: "M04", title: "Data Handling and Statistics", topics: ["Collecting and organizing data", "Mean, median, and mode", "Range and data spread", "Bar graphs and histograms", "Pie charts and interpretation"] },
      { id: "M05", title: "Ratios, Proportions and Percentages", topics: ["Ratios and simplification", "Direct and inverse proportion", "Percentage calculations", "Profit and loss", "Simple interest"] }
    ]
  },
  english: {
    title: "Grade 8 English Language Arts",
    chapters: [
      { id: "E01", title: "Advanced Grammar", topics: ["Complex sentences", "Conditional sentences", "Reported speech", "Modal verbs", "Advanced punctuation"] },
      { id: "E02", title: "Reading Comprehension", topics: ["Finding main ideas", "Making inferences", "Analyzing author's purpose", "Comparing texts", "Critical reading skills"] },
      { id: "E03", title: "Writing Skills", topics: ["Essay structure", "Argumentative writing", "Narrative techniques", "Descriptive writing", "Editing and revision"] },
      { id: "E04", title: "Vocabulary and Word Study", topics: ["Context clues", "Prefixes and suffixes", "Word roots", "Synonyms and antonyms", "Academic vocabulary"] },
      { id: "E05", title: "Literature Analysis", topics: ["Elements of fiction", "Poetry analysis", "Drama elements", "Character development", "Theme and symbolism"] }
    ]
  },
  science: {
    title: "Grade 8 Science",
    chapters: [
      { id: "S01", title: "Cell Biology", topics: ["Cell structure", "Plant vs animal cells", "Cell division", "Microscopy", "Cell functions"] },
      { id: "S02", title: "Chemistry Basics", topics: ["Atoms and molecules", "Elements and compounds", "Chemical reactions", "Acids and bases", "Periodic table introduction"] },
      { id: "S03", title: "Physics Fundamentals", topics: ["Forces and motion", "Energy forms", "Simple machines", "Electricity basics", "Light and sound"] },
      { id: "S04", title: "Human Body Systems", topics: ["Digestive system", "Respiratory system", "Circulatory system", "Nervous system", "Skeletal and muscular systems"] },
      { id: "S05", title: "Earth and Environment", topics: ["Rock cycle", "Weather and climate", "Ecosystems", "Natural resources", "Environmental conservation"] }
    ]
  },
  social_studies: {
    title: "Grade 8 Social Studies",
    chapters: [
      { id: "SS01", title: "World History", topics: ["Ancient civilizations review", "Medieval period", "Age of exploration", "Industrial revolution", "Modern history beginnings"] },
      { id: "SS02", title: "Geography", topics: ["Map skills", "Continents and oceans", "Climate zones", "Population distribution", "Natural resources worldwide"] },
      { id: "SS03", title: "Government and Civics", topics: ["Types of government", "Democracy and rights", "Constitution basics", "Citizenship responsibilities", "Local government"] },
      { id: "SS04", title: "Economics", topics: ["Supply and demand", "Money and banking", "Trade and commerce", "Economic systems", "Personal finance basics"] },
      { id: "SS05", title: "Culture and Society", topics: ["Cultural diversity", "Religion and beliefs", "Art and expression", "Communication evolution", "Global connections"] }
    ]
  },
  life_skills: {
    title: "Grade 8 Life Skills",
    chapters: [
      { id: "L01", title: "Health and Wellness", topics: ["Nutrition basics", "Physical fitness", "Mental health awareness", "Hygiene and self-care", "First aid basics"] },
      { id: "L02", title: "Study Skills", topics: ["Time management", "Note-taking strategies", "Test preparation", "Research skills", "Goal setting"] },
      { id: "L03", title: "Digital Literacy", topics: ["Internet safety", "Digital citizenship", "Information evaluation", "Online communication", "Basic computer skills"] },
      { id: "L04", title: "Social Skills", topics: ["Communication skills", "Conflict resolution", "Teamwork", "Respect and empathy", "Leadership basics"] },
      { id: "L05", title: "Career Exploration", topics: ["Career awareness", "Skills assessment", "Work ethics", "Job application basics", "Future planning"] }
    ]
  }
};

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function generateLessonContent(
  subjectTitle: string,
  chapterTitle: string,
  lessonTopic: string,
  lessonNumber: number
): Promise<{ content: string; examples: Example[]; quiz: QuizQuestion[]; imagePrompt: string }> {
  const openai = await getOpenAIClient();
  if (!openai) {
    throw new Error('OpenAI not configured');
  }

  const prompt = `Generate comprehensive Grade 8 lesson content.

Subject: ${subjectTitle}
Chapter: ${chapterTitle}
Lesson Topic: ${lessonTopic}
Lesson Number: ${lessonNumber}

Create educational content for 13-14 year old students.

REQUIREMENTS:
1. Content: 800-1200 words explaining the topic clearly with real examples
2. Examples: 3 worked examples with step-by-step solutions
3. Quiz: 10 multiple choice questions with 4 options each
4. Image prompt: 1 simple clipart/vector description (NO TEXT IN IMAGE)

Respond in JSON:
{
  "content": "Full lesson content here...",
  "examples": [
    { "problem": "Problem statement", "solution": ["Step 1", "Step 2", "Step 3"] }
  ],
  "quiz": [
    { "text": "Question?", "options": ["A", "B", "C", "D"], "correct": 0 }
  ],
  "imagePrompt": "Simple flat vector illustration of [topic], educational clipart style, bright colors, clean design, NO TEXT IN IMAGE"
}

CRITICAL RULES:
- "correct" is 0-based index (0=first option)
- Keep language simple and clear
- Make examples practical and relatable
- Image prompt must say "NO TEXT IN IMAGE"`;

  console.log(`  📝 Generating content for: ${lessonTopic}`);

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    max_tokens: 6000
  });

  const result = JSON.parse(response.choices[0].message.content || '{}');
  
  const quiz = (result.quiz || []).map((q: any, idx: number) => ({
    id: `Q${String(lessonNumber).padStart(3, '0')}-${idx + 1}`,
    text: q.text || q.question || '',
    options: q.options || [],
    correct: typeof q.correct === 'number' ? q.correct : 0
  }));

  return {
    content: result.content || '',
    examples: result.examples || [],
    quiz,
    imagePrompt: result.imagePrompt || `Educational clipart for ${lessonTopic}, simple vector style, NO TEXT IN IMAGE`
  };
}

async function generateLessonImage(prompt: string, folder: string): Promise<string> {
  try {
    console.log(`  🎨 Generating image...`);
    const result = await generateAndSaveImage({
      prompt: prompt,
      size: '1024x1024',
      quality: 'standard',
      style: 'natural',
      folder: folder
    });
    console.log(`  ✅ Image saved: ${result.url}`);
    return result.url;
  } catch (error: any) {
    console.error(`  ⚠️ Image generation failed: ${error.message}`);
    return '';
  }
}

async function generateSubjectBook(subjectKey: string): Promise<Book> {
  const subject = GRADE_8_SUBJECTS[subjectKey as keyof typeof GRADE_8_SUBJECTS];
  if (!subject) {
    throw new Error(`Unknown subject: ${subjectKey}`);
  }

  const progressFile = `grade8_${subjectKey}_progress.json`;
  let book: Book;
  let startChapter = 0;
  let startLesson = 0;

  if (fs.existsSync(progressFile)) {
    console.log(`📂 Resuming from saved progress...`);
    const progress = JSON.parse(fs.readFileSync(progressFile, 'utf-8'));
    book = progress.book;
    startChapter = progress.chapterIndex || 0;
    startLesson = progress.lessonIndex || 0;
  } else {
    book = {
      title: subject.title,
      grade: 8,
      language: "en",
      chapters: []
    };
  }

  console.log(`\n📚 Generating: ${subject.title}`);
  console.log(`   ${subject.chapters.length} chapters, ${subject.chapters.reduce((a, c) => a + c.topics.length, 0)} lessons total\n`);

  let globalLessonNumber = 1;

  for (let ci = 0; ci < subject.chapters.length; ci++) {
    const chapterDef = subject.chapters[ci];
    
    if (ci < startChapter) {
      globalLessonNumber += chapterDef.topics.length;
      continue;
    }

    console.log(`\n📖 Chapter ${ci + 1}/${subject.chapters.length}: ${chapterDef.title}`);

    let chapter: Chapter;
    if (book.chapters[ci]) {
      chapter = book.chapters[ci];
    } else {
      chapter = {
        id: chapterDef.id,
        title: chapterDef.title,
        lessons: []
      };
      book.chapters[ci] = chapter;
    }

    const startLessonIdx = ci === startChapter ? startLesson : 0;

    for (let li = startLessonIdx; li < chapterDef.topics.length; li++) {
      const topic = chapterDef.topics[li];
      const lessonId = `${subjectKey.toUpperCase().substring(0, 3)}-8-${String(globalLessonNumber).padStart(3, '0')}`;

      console.log(`\n  Lesson ${li + 1}/${chapterDef.topics.length}: ${topic}`);

      try {
        const content = await generateLessonContent(
          subject.title,
          chapterDef.title,
          topic,
          globalLessonNumber
        );

        await delay(DELAY_BETWEEN_LESSONS);

        let imageUrl = '';
        if (content.imagePrompt) {
          imageUrl = await generateLessonImage(
            content.imagePrompt,
            `grade8/${subjectKey}/images`
          );
          await delay(DELAY_BETWEEN_IMAGES);
        }

        const lesson: Lesson = {
          id: lessonId,
          lessonNumber: globalLessonNumber,
          lessonOrder: li + 1,
          locked: globalLessonNumber > 1,
          title: topic,
          content: content.content,
          examples: content.examples,
          mediaUrl: imageUrl,
          quiz: content.quiz
        };

        chapter.lessons[li] = lesson;

        fs.writeFileSync(progressFile, JSON.stringify({
          book,
          chapterIndex: ci,
          lessonIndex: li + 1,
          lastUpdated: new Date().toISOString()
        }, null, 2));

        console.log(`  ✅ Lesson saved (${content.quiz.length} questions)`);

      } catch (error: any) {
        console.error(`  ❌ Error: ${error.message}`);
        fs.writeFileSync(progressFile, JSON.stringify({
          book,
          chapterIndex: ci,
          lessonIndex: li,
          lastUpdated: new Date().toISOString(),
          error: error.message
        }, null, 2));
        throw error;
      }

      globalLessonNumber++;
    }

    console.log(`\n  ✅ Chapter complete!`);
    await delay(DELAY_BETWEEN_CHAPTERS);
  }

  const finalFile = `grade8_${subjectKey}_book.json`;
  fs.writeFileSync(finalFile, JSON.stringify({ book }, null, 2));
  console.log(`\n🎉 Book saved: ${finalFile}`);

  if (fs.existsSync(progressFile)) {
    fs.unlinkSync(progressFile);
  }

  return book;
}

async function generateAllGrade8Books() {
  const subjects = Object.keys(GRADE_8_SUBJECTS);
  
  console.log('🚀 Starting Grade 8 Book Generation');
  console.log(`   Subjects: ${subjects.join(', ')}\n`);

  for (const subject of subjects) {
    try {
      await generateSubjectBook(subject);
      console.log(`\n✅ ${subject} complete!\n`);
      await delay(10000);
    } catch (error: any) {
      console.error(`\n❌ Failed on ${subject}: ${error.message}`);
      console.log('   Run again to resume from where it stopped.\n');
      break;
    }
  }

  console.log('\n🏁 Generation complete!');
}

const args = process.argv.slice(2);
if (args[0] === '--subject') {
  const subject = args[1];
  if (subject && GRADE_8_SUBJECTS[subject as keyof typeof GRADE_8_SUBJECTS]) {
    generateSubjectBook(subject).catch(console.error);
  } else {
    console.log('Available subjects:', Object.keys(GRADE_8_SUBJECTS).join(', '));
  }
} else if (args[0] === '--all') {
  generateAllGrade8Books().catch(console.error);
} else {
  console.log('Grade 8 Book Generator');
  console.log('Usage:');
  console.log('  npx tsx server/generate-grade8-books.ts --subject mathematics');
  console.log('  npx tsx server/generate-grade8-books.ts --all');
  console.log('\nAvailable subjects:', Object.keys(GRADE_8_SUBJECTS).join(', '));
}

export { generateSubjectBook, generateAllGrade8Books, GRADE_8_SUBJECTS };
