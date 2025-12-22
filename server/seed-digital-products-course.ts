import { db } from './db';
import { courses, modules, lessons, quizzes, courseCategories, lessonContentBlocks, lessonProgress, courseEnrollments } from '../shared/schema';
import { eq } from 'drizzle-orm';
import { ensureAdminUser } from './ensure-admin-user';
import { getOpenAIClient } from './openai';
import { generateAndSaveImage } from './utils/image-generator';
import { fileURLToPath } from 'url';

const COURSE_SKELETON = {
  course_id: "build_sell_digital_products_01",
  title: "Build and Sell Digital Products",
  tagline: "Create, launch, and sell your first digital product in 14 days",
  level: "beginner",
  description: "A step-by-step beginner course that teaches how to create, validate, price, launch, and sell a digital product from scratch. Perfect for anyone with no business, design, or tech background who wants to start earning online.",
  learning_outcomes: [
    "Identify profitable digital product ideas",
    "Validate demand before building",
    "Create a simple digital product",
    "Price products with confidence",
    "Launch and sell online",
    "Build customer trust and scale your business"
  ],
  modules: [
    {
      module_id: "M1",
      title: "Understand Digital Products",
      summary: "Learn what digital products are and choose the right type for beginners.",
      estimated_minutes: 90,
      lessons: [
        { lesson_id: "M1L1", title: "What Is a Digital Product", goal: "Understand digital products and why they are profitable." },
        { lesson_id: "M1L2", title: "Types of Digital Products", goal: "Explore common digital product formats for beginners." },
        { lesson_id: "M1L3", title: "Benefits and Challenges", goal: "Learn the pros and cons of selling digital products." },
        { lesson_id: "M1L4", title: "Choose Your First Format", goal: "Select a simple and realistic product format to start with." }
      ]
    },
    {
      module_id: "M2",
      title: "Find Profitable Ideas",
      summary: "Discover product ideas based on real problems people want solved.",
      estimated_minutes: 100,
      lessons: [
        { lesson_id: "M2L1", title: "Identify Real Problems", goal: "Learn how to find problems people are willing to pay to solve." },
        { lesson_id: "M2L2", title: "Research Your Audience", goal: "Understand your target audience and their needs." },
        { lesson_id: "M2L3", title: "Generate Product Ideas", goal: "Create multiple digital product ideas from problems." },
        { lesson_id: "M2L4", title: "Select One Strong Idea", goal: "Choose the best idea using simple validation rules." }
      ]
    },
    {
      module_id: "M3",
      title: "Validate Before Building",
      summary: "Confirm demand before spending time creating the product.",
      estimated_minutes: 90,
      lessons: [
        { lesson_id: "M3L1", title: "Why Validation Matters", goal: "Understand the importance of validating before building." },
        { lesson_id: "M3L2", title: "Simple Validation Methods", goal: "Learn quick and low-cost ways to validate ideas." },
        { lesson_id: "M3L3", title: "Test Interest Quickly", goal: "Measure interest using simple online tests." },
        { lesson_id: "M3L4", title: "Decide to Build or Drop", goal: "Make a clear decision based on validation results." }
      ]
    },
    {
      module_id: "M4",
      title: "Create the Product",
      summary: "Build a simple, valuable digital product efficiently.",
      estimated_minutes: 110,
      lessons: [
        { lesson_id: "M4L1", title: "Define Product Scope", goal: "Decide what to include and what to exclude." },
        { lesson_id: "M4L2", title: "Create Content Efficiently", goal: "Learn how to create product content quickly." },
        { lesson_id: "M4L3", title: "Ensure Quality and Clarity", goal: "Improve clarity and usefulness of the product." },
        { lesson_id: "M4L4", title: "Prepare for Delivery", goal: "Get the product ready for customers." }
      ]
    },
    {
      module_id: "M5",
      title: "Price and Package",
      summary: "Set the right price and package the product professionally.",
      estimated_minutes: 90,
      lessons: [
        { lesson_id: "M5L1", title: "Pricing Basics", goal: "Understand simple pricing strategies." },
        { lesson_id: "M5L2", title: "Choose Your Price", goal: "Select a price that fits beginners and the market." },
        { lesson_id: "M5L3", title: "Create a Simple Offer", goal: "Package the product into a clear offer." },
        { lesson_id: "M5L4", title: "Prepare Sales Assets", goal: "Create basic sales descriptions and materials." }
      ]
    },
    {
      module_id: "M6",
      title: "Launch and Sell",
      summary: "Launch your product and make your first sales.",
      estimated_minutes: 100,
      lessons: [
        { lesson_id: "M6L1", title: "Launch Planning", goal: "Prepare a simple and realistic launch plan." },
        { lesson_id: "M6L2", title: "First Sales Channels", goal: "Learn where to get your first customers." },
        { lesson_id: "M6L3", title: "Build Customer Trust", goal: "Increase trust and confidence in your product." },
        { lesson_id: "M6L4", title: "Improve and Scale", goal: "Learn how to improve and grow after launch." }
      ]
    },
    {
      module_id: "M7",
      title: "Grow Your Digital Business",
      summary: "Take your digital product business to the next level with advanced strategies.",
      estimated_minutes: 100,
      lessons: [
        { lesson_id: "M7L1", title: "Collect and Use Feedback", goal: "Learn how to gather customer feedback and improve your product." },
        { lesson_id: "M7L2", title: "Create Multiple Products", goal: "Expand your product line strategically." },
        { lesson_id: "M7L3", title: "Build an Email List", goal: "Create a list of interested buyers for future launches." },
        { lesson_id: "M7L4", title: "Automate Your Sales", goal: "Set up systems that sell while you sleep." }
      ]
    }
  ]
};

const SYSTEM_PROMPT = `You are a professional e-learning content creator specialized in comprehensive, detailed courses.

STRICT RULES:
- Output ONLY valid JSON.
- No markdown, no explanations, no extra text.
- Simple, clear, beginner-friendly English.
- No emojis, no slang.
- Content must be original and practical.
- Do NOT mention OpenAI or AI.
- Structure must exactly match the schema provided.
- Lessons must be VERY detailed and comprehensive (1500-2000 words minimum per lesson).
- Include multiple real-world examples, case studies, and practical applications.`;

async function generateModuleContent(moduleData: typeof COURSE_SKELETON.modules[0]): Promise<any> {
  const openai = await getOpenAIClient();
  if (!openai) {
    throw new Error('OpenAI not configured');
  }

  const userPrompt = `Generate FULL comprehensive content for the following module.

Course title: Build and Sell Digital Products
Audience: Beginners (no business, design, or tech background)
Module details:
${JSON.stringify(moduleData, null, 2)}

IMPORTANT CONTENT REQUIREMENTS:
- Each lesson explanation MUST be 1500-2000 words minimum
- Include detailed background information, context, and theory
- Provide 3-4 real-world case studies or examples per lesson
- Make content practical with actionable advice
- Include common mistakes to avoid
- Add pro tips and insider knowledge

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
          "step_by_step": ["Detailed Step 1 (50-100 words)...", "Detailed Step 2...", "Detailed Step 3...", "Detailed Step 4...", "Detailed Step 5...", "Detailed Step 6..."],
          "case_studies": ["Real case study 1 (100-150 words)", "Real case study 2 (100-150 words)"],
          "example": "A detailed real-world example with specific numbers and outcomes (200-300 words)",
          "common_mistakes": ["Mistake 1 and how to avoid it", "Mistake 2 and how to avoid it", "Mistake 3 and how to avoid it"],
          "pro_tips": ["Expert tip 1", "Expert tip 2", "Expert tip 3"],
          "exercise": {
            "task": "Detailed practical exercise the student should complete",
            "expected_output": "Specific deliverable they should produce",
            "bonus_challenge": "Optional advanced task for motivated students"
          },
          "summary": "5-6 sentence comprehensive summary of all key points"
        },
        "image_prompt": "Professional clean illustration for this lesson. NO TEXT IN IMAGE. Flat modern style."
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
    const size = type === 'cover' ? '1024x1024' : '1024x1024';
    const fullPrompt = `${prompt} Style: clean, modern, flat illustration. Professional e-learning. ABSOLUTELY NO TEXT, NO WORDS, NO LETTERS, NO NUMBERS in the image.`;
    
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

export async function seedDigitalProductsCourse() {
  console.log('📦 Starting Digital Products Course Generation...');
  console.log('================================================');
  
  const adminUserId = await ensureAdminUser();
  console.log(`✅ Using admin user ID: ${adminUserId}`);

  const existing = await db.select().from(courses).where(eq(courses.title, COURSE_SKELETON.title));
  if (existing.length > 0) {
    console.log('⚠️ Course already exists. Deleting and recreating...');
    const courseId = existing[0].id;
    
    // Delete course enrollments first
    await db.delete(courseEnrollments).where(eq(courseEnrollments.courseId, courseId));
    console.log('  ✅ Deleted course enrollments');
    
    // Get all modules for this course
    const existingModules = await db.select().from(modules).where(eq(modules.courseId, courseId));
    
    // Delete related records in order (respecting foreign key constraints)
    for (const mod of existingModules) {
      // Get lessons for this module
      const existingLessons = await db.select().from(lessons).where(eq(lessons.moduleId, mod.id));
      
      for (const lesson of existingLessons) {
        // Delete lesson progress first (references lessons)
        await db.delete(lessonProgress).where(eq(lessonProgress.lessonId, lesson.id));
        
        // Delete quizzes for this lesson
        await db.delete(quizzes).where(eq(quizzes.lessonId, lesson.id));
        
        // Delete content blocks
        await db.delete(lessonContentBlocks).where(eq(lessonContentBlocks.lessonId, lesson.id));
      }
      
      // Delete lessons
      await db.delete(lessons).where(eq(lessons.moduleId, mod.id));
    }
    
    // Delete modules
    await db.delete(modules).where(eq(modules.courseId, courseId));
    
    // Now delete the course
    await db.delete(courses).where(eq(courses.id, courseId));
    console.log('✅ Cleaned up existing course data');
  }

  let [businessCategory] = await db.select().from(courseCategories).where(eq(courseCategories.name, 'Business'));
  if (!businessCategory) {
    [businessCategory] = await db.insert(courseCategories).values({
      name: 'Business',
      displayName: 'Business & Entrepreneurship',
      description: 'Courses about business, entrepreneurship, and making money online',
      color: 'green',
      isActive: true
    }).returning();
    console.log('✅ Created Business category');
  }

  console.log('\n🎨 Generating course cover image...');
  const coverImageUrl = await generateImage(
    'Digital products business concept. Person at laptop with floating digital items like ebooks, courses, templates. Modern flat illustration.',
    'cover'
  );

  console.log('\n📝 Creating course in database...');
  const [course] = await db.insert(courses).values({
    title: COURSE_SKELETON.title,
    description: COURSE_SKELETON.description,
    thumbnailUrl: coverImageUrl,
    image: coverImageUrl,
    categoryId: businessCategory.id,
    pricingType: 'free',
    price: "0",
    isActive: true,
    approvalStatus: 'approved',
    createdBy: adminUserId,
    publisherName: 'EduFiliova Academy',
    publisherBio: 'Expert educators helping you build successful digital businesses',
    tags: ['Digital Products', 'Business', 'Entrepreneurship', 'Online Business', 'Passive Income', 'Beginner'],
    language: 'en',
    difficulty: 'beginner',
    duration: 14,
    learningObjectives: COURSE_SKELETON.learning_outcomes,
    certificationType: 'certificate',
    isFeatured: true
  }).returning();

  console.log(`✅ Created course: ${course.title} (ID: ${course.id})`);

  for (let i = 0; i < COURSE_SKELETON.modules.length; i++) {
    const moduleSkeleton = COURSE_SKELETON.modules[i];
    console.log(`\n${'='.repeat(50)}`);
    console.log(`📚 Processing Module ${i + 1}/${COURSE_SKELETON.modules.length}: ${moduleSkeleton.title}`);
    console.log(`${'='.repeat(50)}`);

    let moduleContent;
    let retries = 0;
    const maxRetries = 2;

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
        await new Promise(r => setTimeout(r, 2000));
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

      const htmlContent = `
<h2>${lessonData.title}</h2>

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

<h3>Step-by-Step Guide</h3>
<ol>
${content.step_by_step.map((step: string) => `<li>${step}</li>`).join('\n')}
</ol>

${content.case_studies && content.case_studies.length > 0 ? `
<h3>Case Studies</h3>
<div class="lesson-case-studies">
${content.case_studies.map((cs: string, i: number) => `<div class="case-study"><strong>Case Study ${i + 1}:</strong> ${cs}</div>`).join('\n')}
</div>
` : ''}

<h3>Real-World Example</h3>
<div class="lesson-example">
${content.example}
</div>

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

      // Only generate images for first lesson of each module to save time
      let lessonImageUrl = '/api/placeholder/400/300';
      if (lessonData.image_prompt && j === 0) {
        try {
          lessonImageUrl = await generateImage(lessonData.image_prompt, 'lesson');
        } catch (error) {
          console.error(`❌ Failed to generate lesson image, using placeholder`);
        }
      }

      const [dbLesson] = await db.insert(lessons).values({
        moduleId: dbModule.id,
        courseId: course.id,
        title: lessonData.title,
        content: htmlContent,
        orderNum: j + 1,
        durationMinutes: Math.floor(moduleSkeleton.estimated_minutes / 4),
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
        // Format questions for the legacy jsonb column
        // Handle both old format (question, correct_index) and new format (text, correctIndex)
        const questionsJsonb = moduleContent.quiz.map((q: any, idx: number) => ({
          id: idx + 1,
          text: q.text || q.question, // Support both formats
          options: q.options,
          correctIndex: q.correctIndex ?? q.correct_index ?? 0, // Support both formats
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
  console.log('🎉 COURSE GENERATION COMPLETE!');
  console.log(`📚 Course: ${course.title}`);
  console.log(`🆔 Course ID: ${course.id}`);
  console.log(`💰 Price: FREE`);
  console.log('================================================\n');

  return course;
}

const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);

if (isMainModule) {
  seedDigitalProductsCourse()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}
