import { db } from './db';
import { courses, modules, lessons, quizzes, courseCategories, lessonContentBlocks, lessonProgress, courseEnrollments } from '../shared/schema';
import { eq } from 'drizzle-orm';
import { ensureAdminUser } from './ensure-admin-user';
import { getOpenAIClient } from './openai';
import { generateAndSaveImage } from './utils/image-generator';
import { fileURLToPath } from 'url';

const COURSE_SKELETON = {
  course_id: "python_for_beginners_v2",
  title: "Python for Beginners",
  tagline: "A complete beginner guide to Python programming",
  level: "beginner",
  description: "A comprehensive beginner-friendly Python course that teaches programming from the ground up using clear explanations and practical examples.",
  learning_outcomes: [
    "Understand programming fundamentals",
    "Write clean Python code",
    "Work with data types and logic",
    "Use loops and functions effectively",
    "Build beginner-friendly Python projects"
  ],
  modules: [
    {
      module_id: "M1",
      title: "Introduction to Python",
      summary: "Learn what Python is and why it is widely used.",
      estimated_minutes: 90,
      lessons: [
        { lesson_id: "M1L1", title: "What Is Python", goal: "Understand Python and its purpose." },
        { lesson_id: "M1L2", title: "Where Python Is Used", goal: "Explore real-world Python use cases." },
        { lesson_id: "M1L3", title: "Why Learn Python", goal: "Understand the benefits of Python." },
        { lesson_id: "M1L4", title: "How Python Programs Run", goal: "Learn how Python executes code." },
        { lesson_id: "M1L5", title: "Course Structure Overview", goal: "Understand how this course is organized." }
      ]
    },
    {
      module_id: "M2",
      title: "Setting Up Python",
      summary: "Prepare your environment for Python development.",
      estimated_minutes: 90,
      lessons: [
        { lesson_id: "M2L1", title: "Installing Python", goal: "Install Python on your system." },
        { lesson_id: "M2L2", title: "Running Python Programs", goal: "Run Python code in different ways." },
        { lesson_id: "M2L3", title: "Using the Python Interpreter", goal: "Work with the interactive interpreter." },
        { lesson_id: "M2L4", title: "Code Editors Overview", goal: "Learn about Python code editors." },
        { lesson_id: "M2L5", title: "Writing Your First Script", goal: "Create and run a basic Python script." }
      ]
    },
    {
      module_id: "M3",
      title: "Variables and Data Types",
      summary: "Learn how Python stores and manages data.",
      estimated_minutes: 100,
      lessons: [
        { lesson_id: "M3L1", title: "Understanding Variables", goal: "Learn how variables work." },
        { lesson_id: "M3L2", title: "Numbers in Python", goal: "Work with integers and floats." },
        { lesson_id: "M3L3", title: "Strings and Text Data", goal: "Handle text using strings." },
        { lesson_id: "M3L4", title: "Type Conversion", goal: "Convert between data types." },
        { lesson_id: "M3L5", title: "Checking Data Types", goal: "Use tools to inspect data types." }
      ]
    },
    {
      module_id: "M4",
      title: "User Input and Output",
      summary: "Interact with users through input and output.",
      estimated_minutes: 90,
      lessons: [
        { lesson_id: "M4L1", title: "Displaying Output", goal: "Show information using print." },
        { lesson_id: "M4L2", title: "Getting User Input", goal: "Collect input from users." },
        { lesson_id: "M4L3", title: "Formatting Output", goal: "Format text and numbers." },
        { lesson_id: "M4L4", title: "Common Input Mistakes", goal: "Avoid beginner input errors." },
        { lesson_id: "M4L5", title: "Practice Input Programs", goal: "Build simple input-based programs." }
      ]
    },
    {
      module_id: "M5",
      title: "Conditions and Logic",
      summary: "Make decisions in Python programs.",
      estimated_minutes: 100,
      lessons: [
        { lesson_id: "M5L1", title: "Boolean Values", goal: "Understand true and false." },
        { lesson_id: "M5L2", title: "If Statements", goal: "Control flow with conditions." },
        { lesson_id: "M5L3", title: "Else and Elif", goal: "Handle multiple conditions." },
        { lesson_id: "M5L4", title: "Logical Operators", goal: "Combine conditions logically." },
        { lesson_id: "M5L5", title: "Condition Practice", goal: "Practice decision-making programs." }
      ]
    },
    {
      module_id: "M6",
      title: "Loops in Python",
      summary: "Repeat actions efficiently using loops.",
      estimated_minutes: 100,
      lessons: [
        { lesson_id: "M6L1", title: "Understanding Loops", goal: "Learn why loops are useful." },
        { lesson_id: "M6L2", title: "While Loops", goal: "Repeat tasks with while loops." },
        { lesson_id: "M6L3", title: "For Loops", goal: "Iterate through sequences." },
        { lesson_id: "M6L4", title: "Loop Control Keywords", goal: "Control loops using break and continue." },
        { lesson_id: "M6L5", title: "Loop Practice", goal: "Solve problems using loops." }
      ]
    },
    {
      module_id: "M7",
      title: "Lists and Tuples",
      summary: "Store and manage collections of data.",
      estimated_minutes: 100,
      lessons: [
        { lesson_id: "M7L1", title: "Introduction to Lists", goal: "Understand list basics." },
        { lesson_id: "M7L2", title: "Accessing List Items", goal: "Read and modify list values." },
        { lesson_id: "M7L3", title: "List Methods", goal: "Use common list functions." },
        { lesson_id: "M7L4", title: "Tuples Explained", goal: "Learn about immutable sequences." },
        { lesson_id: "M7L5", title: "List Practice Programs", goal: "Practice list-based problems." }
      ]
    },
    {
      module_id: "M8",
      title: "Dictionaries and Sets",
      summary: "Work with key-value data and unique items.",
      estimated_minutes: 100,
      lessons: [
        { lesson_id: "M8L1", title: "Understanding Dictionaries", goal: "Learn dictionary basics." },
        { lesson_id: "M8L2", title: "Accessing Dictionary Data", goal: "Read and update dictionary values." },
        { lesson_id: "M8L3", title: "Dictionary Methods", goal: "Use common dictionary functions." },
        { lesson_id: "M8L4", title: "Introduction to Sets", goal: "Understand set behavior." },
        { lesson_id: "M8L5", title: "Dictionary Practice", goal: "Build programs using dictionaries." }
      ]
    },
    {
      module_id: "M9",
      title: "Functions in Python",
      summary: "Organize and reuse code using functions.",
      estimated_minutes: 100,
      lessons: [
        { lesson_id: "M9L1", title: "Why Functions Matter", goal: "Understand function purpose." },
        { lesson_id: "M9L2", title: "Creating Functions", goal: "Define custom functions." },
        { lesson_id: "M9L3", title: "Function Parameters", goal: "Pass data into functions." },
        { lesson_id: "M9L4", title: "Return Values", goal: "Receive data from functions." },
        { lesson_id: "M9L5", title: "Function Practice", goal: "Write function-based programs." }
      ]
    },
    {
      module_id: "M10",
      title: "Working with Files",
      summary: "Read from and write to files.",
      estimated_minutes: 100,
      lessons: [
        { lesson_id: "M10L1", title: "What Are Files", goal: "Understand file handling basics." },
        { lesson_id: "M10L2", title: "Reading Files", goal: "Read data from files." },
        { lesson_id: "M10L3", title: "Writing Files", goal: "Save data to files." },
        { lesson_id: "M10L4", title: "File Modes", goal: "Learn file open modes." },
        { lesson_id: "M10L5", title: "File Practice", goal: "Build file-based programs." }
      ]
    },
    {
      module_id: "M11",
      title: "Handling Errors",
      summary: "Manage errors and prevent crashes.",
      estimated_minutes: 90,
      lessons: [
        { lesson_id: "M11L1", title: "Common Python Errors", goal: "Identify common mistakes." },
        { lesson_id: "M11L2", title: "Understanding Exceptions", goal: "Learn what exceptions are." },
        { lesson_id: "M11L3", title: "Try and Except", goal: "Handle errors safely." },
        { lesson_id: "M11L4", title: "Finally Block", goal: "Use cleanup code properly." },
        { lesson_id: "M11L5", title: "Error Handling Practice", goal: "Practice handling errors." }
      ]
    },
    {
      module_id: "M12",
      title: "Beginner Python Projects",
      summary: "Apply all concepts with practical projects.",
      estimated_minutes: 120,
      lessons: [
        { lesson_id: "M12L1", title: "Calculator Project", goal: "Build a calculator program." },
        { lesson_id: "M12L2", title: "Guessing Game Project", goal: "Create a number guessing game." },
        { lesson_id: "M12L3", title: "To-Do List Program", goal: "Build a simple task manager." },
        { lesson_id: "M12L4", title: "Mini Menu Application", goal: "Create a menu-based program." },
        { lesson_id: "M12L5", title: "Next Steps in Python", goal: "Plan continued learning." }
      ]
    }
  ]
};

const SYSTEM_PROMPT = `You are a professional e-learning content creator specialized in Python programming courses for absolute beginners.

STRICT RULES:
- Output ONLY valid JSON.
- No markdown, no explanations, no extra text.
- Simple, clear, beginner-friendly English.
- No emojis, no slang.
- Content must be original and practical.
- Do NOT mention OpenAI, AI, or automation.
- Structure must exactly match the schema provided.
- Lessons must be VERY detailed and comprehensive (1500-2000 words minimum per lesson).
- Include real Python code examples that beginners can understand and run.
- Explain concepts step-by-step with practical applications.`;

async function generateModuleContent(moduleData: typeof COURSE_SKELETON.modules[0]): Promise<any> {
  const openai = await getOpenAIClient();
  if (!openai) {
    throw new Error('OpenAI not configured');
  }

  const userPrompt = `Generate FULL comprehensive content for the following Python programming module.

Course title: Python for Beginners
Audience: Absolute beginners with no coding experience
Module details:
${JSON.stringify(moduleData, null, 2)}

IMPORTANT CONTENT REQUIREMENTS:
- Each lesson explanation MUST be 1500-2000 words minimum
- Include detailed background information, context, and theory
- Provide 3-4 real-world code examples per lesson
- Make content practical with runnable Python code
- Include common mistakes beginners make
- Add pro tips and best practices
- Use clear, simple language appropriate for beginners

Return JSON in EXACTLY this structure:

{
  "module": {
    "module_id": "string",
    "title": "string",
    "lessons": [
      {
        "lesson_id": "string",
        "title": "string",
        "content": {
          "explanation": "VERY detailed explanation (1500-2000 words) covering theory, background, practical applications, and deep insights",
          "key_concepts": ["Concept 1 with detailed description", "Concept 2 with detailed description", "Concept 3 with detailed description"],
          "code_examples": [
            {
              "title": "Example title",
              "code": "Python code here",
              "explanation": "What this code does"
            }
          ],
          "step_by_step": ["Detailed Step 1 (50-100 words)...", "Detailed Step 2...", "Detailed Step 3...", "Detailed Step 4...", "Detailed Step 5...", "Detailed Step 6..."],
          "common_mistakes": ["Mistake 1 and how to avoid it", "Mistake 2 and how to avoid it", "Mistake 3 and how to avoid it"],
          "pro_tips": ["Expert tip 1", "Expert tip 2", "Expert tip 3"],
          "exercise": {
            "task": "Detailed practical exercise the student should complete",
            "expected_output": "Specific deliverable they should produce",
            "bonus_challenge": "Optional advanced task for motivated students"
          },
          "summary": "5-6 sentence comprehensive summary of all key points"
        },
        "image_prompt": "Professional clean illustration for this Python programming lesson. NO TEXT IN IMAGE. Flat modern style. Programming concept visualization."
      }
    ],
    "quiz": [
      {
        "text": "Question text here",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctIndex": 0,
        "explanation": "Detailed explanation of why this is correct"
      }
    ]
  }
}

QUIZ RULES (CRITICAL - use exact field names):
- Use "text" for question text (NOT "question")
- Use "correctIndex" for correct answer (NOT "correct_index" or "correct_answer")
- correctIndex is 0-based (0 = first option, 1 = second, 2 = third, 3 = fourth)
- Exactly 5 questions per module
- Each question needs exactly 4 options
- Include detailed explanations for each answer`;

  console.log(`📚 Generating content for module: ${moduleData.title}...`);

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt }
    ],
    response_format: { type: "json_object" },
    max_tokens: 16000,
    temperature: 0.7
  });

  const content = response.choices[0].message.content;
  if (!content) {
    throw new Error('No content returned from OpenAI');
  }

  const parsed = JSON.parse(content);
  console.log(`✅ Generated content for module: ${moduleData.title}`);
  return parsed.module;
}

async function generateImage(prompt: string, type: 'cover' | 'lesson'): Promise<string> {
  try {
    const size = '1024x1024';
    const fullPrompt = `${prompt} Style: clean, modern, flat illustration. Professional e-learning. Python programming theme. ABSOLUTELY NO TEXT, NO WORDS, NO LETTERS, NO NUMBERS in the image.`;
    
    console.log(`🎨 Generating ${type} image...`);
    const result = await generateAndSaveImage({
      prompt: fullPrompt,
      size,
      quality: 'standard',
      style: 'natural'
    });
    
    console.log(`✅ Image saved: ${result.publicUrl}`);
    return result.publicUrl;
  } catch (error) {
    console.error(`❌ Image generation failed:`, error);
    return '/api/placeholder/400/300';
  }
}

export async function seedPythonCourse() {
  console.log('🐍 Starting Python for Beginners Course Generation...');
  console.log('================================================');
  
  const adminUserId = await ensureAdminUser();
  console.log(`✅ Using admin user ID: ${adminUserId}`);

  let course: any;
  let existingModuleCount = 0;
  
  const existing = await db.select().from(courses).where(eq(courses.title, COURSE_SKELETON.title));
  if (existing.length > 0) {
    course = existing[0];
    const existingModules = await db.select().from(modules).where(eq(modules.courseId, course.id));
    existingModuleCount = existingModules.length;
    
    if (existingModuleCount >= COURSE_SKELETON.modules.length) {
      console.log(`✅ Course already complete with ${existingModuleCount} modules!`);
      return course;
    }
    
    console.log(`📦 Found existing course with ${existingModuleCount}/${COURSE_SKELETON.modules.length} modules. Continuing...`);
  }

  let [techCategory] = await db.select().from(courseCategories).where(eq(courseCategories.name, 'Technology'));
  if (!techCategory) {
    [techCategory] = await db.insert(courseCategories).values({
      name: 'Technology',
      displayName: 'Technology & Programming',
      description: 'Courses about programming, software development, and technology',
      color: 'blue',
      isActive: true
    }).returning();
    console.log('✅ Created Technology category');
  }

  if (!course) {
    console.log('\n🎨 Generating course cover image...');
    const coverImageUrl = await generateImage(
      'Python programming concept. Friendly snake mascot with laptop and code elements. Modern flat illustration for beginners learning to code.',
      'cover'
    );

    console.log('\n📝 Creating course in database...');
    [course] = await db.insert(courses).values({
      title: COURSE_SKELETON.title,
      description: COURSE_SKELETON.description,
      thumbnailUrl: coverImageUrl,
      image: coverImageUrl,
      categoryId: techCategory.id,
      pricingType: 'free',
      price: "0",
      isActive: true,
      approvalStatus: 'approved',
      createdBy: adminUserId,
      publisherName: 'EduFiliova Academy',
      publisherBio: 'Expert educators helping you master programming from scratch',
      tags: ['Python', 'Programming', 'Coding', 'Beginner', 'Development', 'Technology'],
      language: 'en',
      difficulty: 'beginner',
      duration: 20,
      learningObjectives: COURSE_SKELETON.learning_outcomes,
      certificationType: 'certificate',
      isFeatured: true
    }).returning();

    console.log(`✅ Created course: ${course.title} (ID: ${course.id})`);
  }

  for (let i = 0; i < COURSE_SKELETON.modules.length; i++) {
    if (i < existingModuleCount) {
      console.log(`\n⏭️ Skipping Module ${i + 1}/${COURSE_SKELETON.modules.length}: ${COURSE_SKELETON.modules[i].title} (already exists)`);
      continue;
    }
    
    const moduleSkeleton = COURSE_SKELETON.modules[i];
    console.log(`\n${'='.repeat(50)}`);
    console.log(`📚 Processing Module ${i + 1}/${COURSE_SKELETON.modules.length}: ${moduleSkeleton.title}`);
    console.log(`${'='.repeat(50)}`);

    let moduleContent;
    let retries = 0;
    const maxRetries = 3;

    while (retries < maxRetries) {
      try {
        moduleContent = await generateModuleContent(moduleSkeleton);
        break;
      } catch (error) {
        retries++;
        console.error(`❌ Attempt ${retries} failed for module ${moduleSkeleton.module_id}:`, error);
        if (retries >= maxRetries) {
          console.error(`❌ Skipping module ${moduleSkeleton.module_id} after ${maxRetries} failures`);
          continue;
        }
        await new Promise(r => setTimeout(r, 3000));
      }
    }

    if (!moduleContent) continue;

    const [dbModule] = await db.insert(modules).values({
      courseId: course.id,
      title: moduleSkeleton.title,
      description: moduleSkeleton.summary,
      orderNum: i + 1
    }).returning();

    console.log(`✅ Created module: ${dbModule.title} (ID: ${dbModule.id})`);

    for (let j = 0; j < moduleContent.lessons.length; j++) {
      const lessonData = moduleContent.lessons[j];
      const content = lessonData.content;

      let lessonImageUrl = '/api/placeholder/400/300';
      if (lessonData.image_prompt && j === 0) {
        try {
          lessonImageUrl = await generateImage(lessonData.image_prompt, 'lesson');
        } catch (error) {
          console.error(`❌ Failed to generate lesson image, using placeholder`);
        }
      }

      const codeExamplesHtml = content.code_examples && content.code_examples.length > 0 
        ? `
<h3>Code Examples</h3>
${content.code_examples.map((ex: any) => `
<div class="code-example">
<h4>${ex.title}</h4>
<pre style="background: #1e1e1e; color: #d4d4d4; padding: 15px; border-radius: 8px; overflow-x: auto;"><code>${ex.code}</code></pre>
<p>${ex.explanation}</p>
</div>
`).join('\n')}`
        : '';

      const htmlContent = `
<h2>${lessonData.title}</h2>

<div class="lesson-image" style="text-align: center; margin: 20px 0;">
<img src="${lessonImageUrl}" alt="${lessonData.title}" style="width: 100%; max-width: 600px; border-radius: 12px;" />
</div>

<div class="lesson-explanation">
${content.explanation}
</div>

${content.key_concepts && content.key_concepts.length > 0 ? `
<h3>Key Concepts</h3>
<div class="lesson-key-concepts">
<ul>
${content.key_concepts.map((concept: string) => `<li>${concept}</li>`).join('\n')}
</ul>
</div>
` : ''}

${codeExamplesHtml}

<h3>Step-by-Step Guide</h3>
<ol>
${content.step_by_step.map((step: string) => `<li>${step}</li>`).join('\n')}
</ol>

${content.common_mistakes && content.common_mistakes.length > 0 ? `
<h3>Common Mistakes to Avoid</h3>
<div class="lesson-mistakes">
<ul>
${content.common_mistakes.map((mistake: string) => `<li>${mistake}</li>`).join('\n')}
</ul>
</div>
` : ''}

${content.pro_tips && content.pro_tips.length > 0 ? `
<h3>Pro Tips</h3>
<div class="lesson-pro-tips">
<ul>
${content.pro_tips.map((tip: string) => `<li>${tip}</li>`).join('\n')}
</ul>
</div>
` : ''}

<h3>Your Exercise</h3>
<div class="lesson-exercise">
<p><strong>Task:</strong> ${content.exercise.task}</p>
<p><strong>Expected Output:</strong> ${content.exercise.expected_output}</p>
${content.exercise.bonus_challenge ? `<p><strong>Bonus Challenge:</strong> ${content.exercise.bonus_challenge}</p>` : ''}
</div>

<h3>Summary</h3>
<div class="lesson-summary">
${content.summary}
</div>
      `.trim();

      const [dbLesson] = await db.insert(lessons).values({
        moduleId: dbModule.id,
        courseId: course.id,
        title: lessonData.title,
        content: htmlContent,
        orderNum: j + 1,
        durationMinutes: Math.floor(moduleSkeleton.estimated_minutes / 5),
        images: [lessonImageUrl],
        freePreviewFlag: i === 0 && j === 0
      }).returning();

      console.log(`  ✅ Created lesson: ${dbLesson.title}`);

      await db.insert(lessonContentBlocks).values({
        lessonId: dbLesson.id,
        blockType: 'text',
        title: 'Lesson Content',
        content: htmlContent,
        displayOrder: 1,
        isExpandedByDefault: true
      });
    }

    if (moduleContent.quiz && moduleContent.quiz.length > 0) {
      const lastLesson = await db.select().from(lessons)
        .where(eq(lessons.moduleId, dbModule.id))
        .orderBy(lessons.orderNum)
        .limit(1);

      if (lastLesson.length > 0) {
        const questionsJsonb = moduleContent.quiz.map((q: any, idx: number) => ({
          id: idx + 1,
          text: q.text || q.question,
          options: q.options,
          correctIndex: q.correctIndex ?? q.correct_index ?? 0,
          explanation: q.explanation
        }));
        
        await db.insert(quizzes).values({
          lessonId: lastLesson[0].id,
          title: `${moduleSkeleton.title} Quiz`,
          description: `Test your understanding of ${moduleSkeleton.title}`,
          questions: questionsJsonb,
          passingScore: 70,
          isActive: true
        });

        console.log(`  ✅ Created quiz with ${moduleContent.quiz.length} questions`);
      }
    }

    console.log(`\n⏳ Waiting 3 seconds before next module...`);
    await new Promise(r => setTimeout(r, 3000));
  }

  console.log('\n================================================');
  console.log('🎉 PYTHON COURSE GENERATION COMPLETE!');
  console.log(`📚 Course: ${course.title}`);
  console.log(`🆔 Course ID: ${course.id}`);
  console.log(`📖 Modules: ${COURSE_SKELETON.modules.length}`);
  console.log(`📝 Total Lessons: ${COURSE_SKELETON.modules.reduce((acc, m) => acc + m.lessons.length, 0)}`);
  console.log('================================================\n');

  return course;
}

const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);

if (isMainModule) {
  seedPythonCourse()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}
