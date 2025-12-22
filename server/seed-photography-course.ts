import { db } from './db';
import { courses, modules, lessons, quizzes, courseCategories, lessonContentBlocks, lessonProgress, courseEnrollments } from '../shared/schema';
import { eq } from 'drizzle-orm';
import { ensureAdminUser } from './ensure-admin-user';
import { getOpenAIClient } from './openai';
import { generateAndSaveImage } from './utils/image-generator';
import { fileURLToPath } from 'url';

const COURSE_SKELETON = {
  course_id: "photography_fundamentals_v1",
  title: "Photography Fundamentals",
  tagline: "Master the art of capturing stunning images from beginner to confident photographer",
  level: "beginner",
  description: "A comprehensive photography course that teaches you everything from camera basics to advanced composition techniques. Learn to take professional-quality photos with any camera, understand light, master editing, and build your photography portfolio.",
  learning_outcomes: [
    "Understand your camera settings and controls",
    "Master composition and framing techniques",
    "Work effectively with natural and artificial light",
    "Capture stunning portraits, landscapes, and action shots",
    "Edit photos professionally using popular software",
    "Build a photography portfolio that showcases your skills",
    "Develop your unique photographic style"
  ],
  modules: [
    {
      module_id: "M1",
      title: "Understanding Your Camera",
      summary: "Learn the essential camera components, settings, and how they work together to create images.",
      estimated_minutes: 120,
      lessons: [
        { lesson_id: "M1L1", title: "Camera Types and Choosing the Right One", goal: "Understand different camera types and their advantages." },
        { lesson_id: "M1L2", title: "Understanding the Exposure Triangle", goal: "Master aperture, shutter speed, and ISO relationships." },
        { lesson_id: "M1L3", title: "Aperture and Depth of Field", goal: "Control background blur and image sharpness." },
        { lesson_id: "M1L4", title: "Shutter Speed and Motion", goal: "Freeze or blur motion intentionally." },
        { lesson_id: "M1L5", title: "ISO and Image Quality", goal: "Balance light sensitivity with image noise." },
        { lesson_id: "M1L6", title: "Focus Modes and Techniques", goal: "Achieve sharp focus in any situation." },
        { lesson_id: "M1L7", title: "Camera Metering and White Balance", goal: "Get accurate exposure and natural colors." }
      ]
    },
    {
      module_id: "M2",
      title: "Composition Essentials",
      summary: "Master the art of arranging elements within your frame for visually compelling images.",
      estimated_minutes: 120,
      lessons: [
        { lesson_id: "M2L1", title: "The Rule of Thirds", goal: "Position subjects for maximum visual impact." },
        { lesson_id: "M2L2", title: "Leading Lines and Visual Flow", goal: "Guide viewers through your images." },
        { lesson_id: "M2L3", title: "Framing and Layering", goal: "Add depth and context to your photos." },
        { lesson_id: "M2L4", title: "Symmetry and Patterns", goal: "Create striking images using repetition." },
        { lesson_id: "M2L5", title: "Negative Space and Minimalism", goal: "Use emptiness to emphasize your subject." },
        { lesson_id: "M2L6", title: "Color Theory in Photography", goal: "Use color relationships for emotional impact." },
        { lesson_id: "M2L7", title: "Breaking the Rules Creatively", goal: "Know when to break composition rules effectively." }
      ]
    },
    {
      module_id: "M3",
      title: "Mastering Light",
      summary: "Understand and control natural and artificial light to enhance your photographs.",
      estimated_minutes: 120,
      lessons: [
        { lesson_id: "M3L1", title: "Quality of Light", goal: "Distinguish between hard and soft light." },
        { lesson_id: "M3L2", title: "Direction of Light", goal: "Use light direction for mood and dimension." },
        { lesson_id: "M3L3", title: "Golden Hour and Blue Hour", goal: "Capture magical light at optimal times." },
        { lesson_id: "M3L4", title: "Working with Harsh Sunlight", goal: "Handle challenging midday lighting conditions." },
        { lesson_id: "M3L5", title: "Indoor and Low Light Photography", goal: "Take great photos in limited light." },
        { lesson_id: "M3L6", title: "Introduction to Flash Photography", goal: "Use flash effectively for better results." },
        { lesson_id: "M3L7", title: "Reflectors and Light Modifiers", goal: "Shape and control light with simple tools." }
      ]
    },
    {
      module_id: "M4",
      title: "Portrait Photography",
      summary: "Capture compelling portraits that reveal personality and emotion.",
      estimated_minutes: 120,
      lessons: [
        { lesson_id: "M4L1", title: "Portrait Lens Selection", goal: "Choose the right lens for flattering portraits." },
        { lesson_id: "M4L2", title: "Posing Fundamentals", goal: "Guide subjects into natural, flattering poses." },
        { lesson_id: "M4L3", title: "Lighting Patterns for Portraits", goal: "Master Rembrandt, loop, and butterfly lighting." },
        { lesson_id: "M4L4", title: "Working with Natural Light Portraits", goal: "Find and use beautiful natural light." },
        { lesson_id: "M4L5", title: "Connecting with Your Subject", goal: "Build rapport for authentic expressions." },
        { lesson_id: "M4L6", title: "Environmental Portraits", goal: "Tell stories through context and setting." },
        { lesson_id: "M4L7", title: "Group and Family Portraits", goal: "Arrange and photograph multiple people." }
      ]
    },
    {
      module_id: "M5",
      title: "Landscape and Nature Photography",
      summary: "Capture breathtaking landscapes, wildlife, and natural scenes.",
      estimated_minutes: 120,
      lessons: [
        { lesson_id: "M5L1", title: "Landscape Composition Techniques", goal: "Create depth and interest in scenic photos." },
        { lesson_id: "M5L2", title: "Using Tripods and Filters", goal: "Stabilize and enhance landscape shots." },
        { lesson_id: "M5L3", title: "Weather and Atmospheric Conditions", goal: "Capture dramatic weather and moods." },
        { lesson_id: "M5L4", title: "Long Exposure Photography", goal: "Create silky water and light trails." },
        { lesson_id: "M5L5", title: "Wildlife Photography Basics", goal: "Approach and photograph animals ethically." },
        { lesson_id: "M5L6", title: "Macro and Close-Up Photography", goal: "Reveal tiny details in nature." },
        { lesson_id: "M5L7", title: "Night Sky and Astrophotography", goal: "Capture stars, moon, and celestial events." }
      ]
    },
    {
      module_id: "M6",
      title: "Photo Editing Fundamentals",
      summary: "Transform your raw captures into polished, professional images.",
      estimated_minutes: 120,
      lessons: [
        { lesson_id: "M6L1", title: "Introduction to Photo Editing Software", goal: "Choose and navigate editing applications." },
        { lesson_id: "M6L2", title: "Basic Adjustments: Exposure and Color", goal: "Correct and enhance tonal values." },
        { lesson_id: "M6L3", title: "Cropping and Straightening", goal: "Improve composition in post-processing." },
        { lesson_id: "M6L4", title: "Working with RAW Files", goal: "Maximize image quality and flexibility." },
        { lesson_id: "M6L5", title: "Selective Editing and Masking", goal: "Edit specific areas of your photos." },
        { lesson_id: "M6L6", title: "Retouching and Cleanup", goal: "Remove distractions and blemishes." },
        { lesson_id: "M6L7", title: "Creating Your Editing Style", goal: "Develop consistent, signature looks." }
      ]
    },
    {
      module_id: "M7",
      title: "Building Your Photography Career",
      summary: "Turn your passion into a profession with portfolio, branding, and business skills.",
      estimated_minutes: 120,
      lessons: [
        { lesson_id: "M7L1", title: "Curating Your Portfolio", goal: "Select and organize your best work." },
        { lesson_id: "M7L2", title: "Creating an Online Presence", goal: "Build a website and social media strategy." },
        { lesson_id: "M7L3", title: "Photography Niches and Specialization", goal: "Find your unique market position." },
        { lesson_id: "M7L4", title: "Pricing Your Photography Services", goal: "Set competitive and profitable rates." },
        { lesson_id: "M7L5", title: "Working with Clients", goal: "Communicate and deliver professionally." },
        { lesson_id: "M7L6", title: "Legal and Copyright Basics", goal: "Protect your work and understand usage rights." },
        { lesson_id: "M7L7", title: "Continuous Learning and Growth", goal: "Develop a mindset for ongoing improvement." }
      ]
    }
  ]
};

const SYSTEM_PROMPT = `You are a professional photography instructor and e-learning content creator.

STRICT RULES:
- Output ONLY valid JSON.
- No markdown, no explanations, no extra text.
- Simple, clear, beginner-friendly English.
- No emojis, no slang.
- Content must be original and practical.
- Do NOT mention OpenAI or AI.
- Structure must exactly match the schema provided.
- Lessons must be VERY detailed and comprehensive (900-1200 words minimum per lesson).
- Include multiple real-world photography examples and practical tips.
- Use photography terminology but always explain technical terms.`;

async function generateLessonContent(lessonData: { lesson_id: string; title: string; goal: string }, moduleTitle: string): Promise<any> {
  const openai = await getOpenAIClient();
  if (!openai) {
    throw new Error('OpenAI not configured');
  }

  const userPrompt = `Generate comprehensive content for this photography lesson.

Module: ${moduleTitle}
Lesson Title: ${lessonData.title}
Learning Goal: ${lessonData.goal}

CONTENT REQUIREMENTS:
- Explanation MUST be 900-1200 words minimum
- Include 2-3 real-world photography examples
- Include common mistakes and pro tips
- Reference specific camera settings when applicable

Return JSON in EXACTLY this structure:
{
  "lesson": {
    "lesson_id": "${lessonData.lesson_id}",
    "title": "${lessonData.title}",
    "content": {
      "explanation": "VERY detailed explanation (900-1200 words) covering theory, techniques, practical applications",
      "key_concepts": ["Concept 1 with description", "Concept 2 with description", "Concept 3 with description"],
      "step_by_step": ["Step 1...", "Step 2...", "Step 3...", "Step 4...", "Step 5...", "Step 6..."],
      "real_world_examples": ["Example 1 (100-150 words)", "Example 2 (100-150 words)"],
      "example": "A detailed photography scenario with camera settings (200-300 words)",
      "common_mistakes": ["Mistake 1 and how to avoid it", "Mistake 2 and how to avoid it", "Mistake 3 and how to avoid it"],
      "pro_tips": ["Expert tip 1", "Expert tip 2", "Expert tip 3"],
      "exercise": {
        "task": "Practical photography exercise",
        "expected_output": "Specific photos to produce",
        "bonus_challenge": "Optional advanced task"
      },
      "summary": "5-6 sentence summary"
    },
    "image_prompts": [
      "First educational photography illustration for ${lessonData.title}. NO TEXT. Clean modern style.",
      "Second illustration showing ${lessonData.title} technique. NO TEXT. Professional style.",
      "Third illustration with camera/composition example for ${lessonData.title}. NO TEXT."
    ],
    "quiz_question": {
      "text": "A question about ${lessonData.title}",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Why this is correct"
    }
  }
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt }
    ],
    response_format: { type: "json_object" },
    max_tokens: 8000,
    temperature: 0.7
  });

  const content = response.choices[0].message.content;
  if (!content) {
    throw new Error('No content returned from OpenAI');
  }

  const parsed = JSON.parse(content);
  return parsed.lesson;
}

async function generateImage(prompt: string, type: 'cover' | 'lesson'): Promise<string> {
  try {
    const size = type === 'cover' ? '1024x1024' : '1024x1024';
    const fullPrompt = `${prompt} Style: clean, modern, professional photography education illustration. High quality. ABSOLUTELY NO TEXT, NO WORDS, NO LETTERS, NO NUMBERS in the image.`;
    
    console.log(`🎨 Generating ${type} image...`);
    const result = await generateAndSaveImage({
      prompt: fullPrompt,
      size,
      quality: 'hd',
      style: 'natural'
    });
    
    console.log(`✅ Image saved: ${result.publicUrl}`);
    return result.publicUrl;
  } catch (error) {
    console.error(`❌ Image generation failed:`, error);
    return '/api/placeholder/400/300';
  }
}

async function generateLessonImages(imagePrompts: string[]): Promise<string[]> {
  const images: string[] = [];
  
  for (let i = 0; i < Math.min(imagePrompts.length, 3); i++) {
    try {
      const imageUrl = await generateImage(imagePrompts[i], 'lesson');
      images.push(imageUrl);
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Failed to generate image ${i + 1}:`, error);
      images.push('/api/placeholder/400/300');
    }
  }
  
  return images;
}

function formatLessonContent(lessonContent: any, imageUrls: string[]): string {
  const imagesHtml = imageUrls.map((url, index) => 
    `<img src="${url}" alt="Lesson illustration ${index + 1}" style="width: 100%; max-width: 600px; border-radius: 12px; margin: 20px auto; display: block;" />`
  ).join('\n');

  return `
<div class="lesson-content" style="font-family: system-ui, -apple-system, sans-serif; line-height: 1.8; color: #1a1a2e;">
  
  <div class="hero-image" style="margin-bottom: 30px;">
    ${imageUrls[0] ? `<img src="${imageUrls[0]}" alt="Lesson hero" style="width: 100%; max-width: 800px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);" />` : ''}
  </div>

  <section class="explanation" style="margin-bottom: 40px;">
    <h2 style="color: #2d3748; font-size: 1.5rem; margin-bottom: 20px; border-bottom: 3px solid #6366f1; padding-bottom: 10px;">Overview</h2>
    <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); padding: 25px; border-radius: 12px; border-left: 4px solid #6366f1;">
      ${lessonContent.explanation}
    </div>
  </section>

  ${imageUrls[1] ? `
  <div class="mid-lesson-image" style="margin: 30px 0; text-align: center;">
    <img src="${imageUrls[1]}" alt="Technique illustration" style="width: 100%; max-width: 600px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);" />
  </div>
  ` : ''}

  <section class="key-concepts" style="margin-bottom: 40px;">
    <h2 style="color: #2d3748; font-size: 1.5rem; margin-bottom: 20px; border-bottom: 3px solid #10b981; padding-bottom: 10px;">Key Concepts</h2>
    <div style="display: grid; gap: 15px;">
      ${lessonContent.key_concepts?.map((concept: string, i: number) => `
        <div style="background: white; padding: 20px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); border-left: 4px solid #10b981;">
          <strong style="color: #10b981;">Concept ${i + 1}:</strong> ${concept}
        </div>
      `).join('') || ''}
    </div>
  </section>

  <section class="step-by-step" style="margin-bottom: 40px;">
    <h2 style="color: #2d3748; font-size: 1.5rem; margin-bottom: 20px; border-bottom: 3px solid #f59e0b; padding-bottom: 10px;">Step-by-Step Guide</h2>
    <div style="background: #fffbeb; padding: 25px; border-radius: 12px;">
      <ol style="margin: 0; padding-left: 20px;">
        ${lessonContent.step_by_step?.map((step: string) => `
          <li style="margin-bottom: 15px; padding: 10px; background: white; border-radius: 8px; box-shadow: 0 1px 5px rgba(0,0,0,0.05);">${step}</li>
        `).join('') || ''}
      </ol>
    </div>
  </section>

  ${imageUrls[2] ? `
  <div class="example-image" style="margin: 30px 0; text-align: center;">
    <img src="${imageUrls[2]}" alt="Example illustration" style="width: 100%; max-width: 600px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);" />
  </div>
  ` : ''}

  <section class="real-world-examples" style="margin-bottom: 40px;">
    <h2 style="color: #2d3748; font-size: 1.5rem; margin-bottom: 20px; border-bottom: 3px solid #8b5cf6; padding-bottom: 10px;">Real-World Examples</h2>
    ${lessonContent.real_world_examples?.map((example: string, i: number) => `
      <div style="background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%); padding: 20px; border-radius: 12px; margin-bottom: 15px; border-left: 4px solid #8b5cf6;">
        <strong style="color: #8b5cf6;">Example ${i + 1}:</strong> ${example}
      </div>
    `).join('') || ''}
  </section>

  <section class="detailed-example" style="margin-bottom: 40px;">
    <h2 style="color: #2d3748; font-size: 1.5rem; margin-bottom: 20px; border-bottom: 3px solid #06b6d4; padding-bottom: 10px;">Detailed Scenario</h2>
    <div style="background: linear-gradient(135deg, #ecfeff 0%, #cffafe 100%); padding: 25px; border-radius: 12px; border: 1px solid #06b6d4;">
      ${lessonContent.example}
    </div>
  </section>

  <section class="common-mistakes" style="margin-bottom: 40px;">
    <h2 style="color: #2d3748; font-size: 1.5rem; margin-bottom: 20px; border-bottom: 3px solid #ef4444; padding-bottom: 10px;">Common Mistakes to Avoid</h2>
    <div style="background: #fef2f2; padding: 25px; border-radius: 12px;">
      ${lessonContent.common_mistakes?.map((mistake: string) => `
        <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 10px; border-left: 4px solid #ef4444;">
          ${mistake}
        </div>
      `).join('') || ''}
    </div>
  </section>

  <section class="pro-tips" style="margin-bottom: 40px;">
    <h2 style="color: #2d3748; font-size: 1.5rem; margin-bottom: 20px; border-bottom: 3px solid #eab308; padding-bottom: 10px;">Pro Tips</h2>
    <div style="background: linear-gradient(135deg, #fefce8 0%, #fef9c3 100%); padding: 25px; border-radius: 12px;">
      ${lessonContent.pro_tips?.map((tip: string) => `
        <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 10px; border-left: 4px solid #eab308;">
          ${tip}
        </div>
      `).join('') || ''}
    </div>
  </section>

  <section class="exercise" style="margin-bottom: 40px;">
    <h2 style="color: #2d3748; font-size: 1.5rem; margin-bottom: 20px; border-bottom: 3px solid #22c55e; padding-bottom: 10px;">Practice Exercise</h2>
    <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); padding: 25px; border-radius: 12px; border: 2px solid #22c55e;">
      <div style="margin-bottom: 20px;">
        <strong style="color: #16a34a; font-size: 1.1rem;">Your Task:</strong>
        <p style="margin-top: 10px;">${lessonContent.exercise?.task || ''}</p>
      </div>
      <div style="margin-bottom: 20px;">
        <strong style="color: #16a34a; font-size: 1.1rem;">Expected Result:</strong>
        <p style="margin-top: 10px;">${lessonContent.exercise?.expected_output || ''}</p>
      </div>
      ${lessonContent.exercise?.bonus_challenge ? `
        <div style="background: #dcfce7; padding: 15px; border-radius: 8px;">
          <strong style="color: #15803d;">Bonus Challenge:</strong>
          <p style="margin-top: 5px;">${lessonContent.exercise.bonus_challenge}</p>
        </div>
      ` : ''}
    </div>
  </section>

  <section class="summary" style="margin-bottom: 20px;">
    <h2 style="color: #2d3748; font-size: 1.5rem; margin-bottom: 20px; border-bottom: 3px solid #6366f1; padding-bottom: 10px;">Summary</h2>
    <div style="background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%); padding: 25px; border-radius: 12px; border: 2px solid #6366f1;">
      ${lessonContent.summary}
    </div>
  </section>

</div>`;
}

export async function seedPhotographyCourse() {
  console.log('📷 Starting Photography Fundamentals Course Generation...');
  console.log('============================================================');
  console.log(`📖 Modules: ${COURSE_SKELETON.modules.length}`);
  console.log(`📝 Total Lessons: ${COURSE_SKELETON.modules.reduce((acc, m) => acc + m.lessons.length, 0)}`);
  console.log(`🖼️ Images per Lesson: 2-3`);
  console.log(`📄 Words per Lesson: 900+ minimum`);
  console.log('============================================================\n');
  
  const adminUserId = await ensureAdminUser();
  console.log(`✅ Using admin user ID: ${adminUserId}`);

  const existing = await db.select().from(courses).where(eq(courses.title, COURSE_SKELETON.title));
  
  let existingModuleCount = 0;
  let courseId: string;
  
  if (existing.length > 0) {
    courseId = existing[0].id;
    const existingModules = await db.select().from(modules).where(eq(modules.courseId, courseId));
    
    // Check if all modules have all 7 lessons
    let totalLessons = 0;
    for (const mod of existingModules) {
      const lessonCount = await db.select().from(lessons).where(eq(lessons.moduleId, mod.id));
      totalLessons += lessonCount.length;
    }
    
    const expectedLessons = COURSE_SKELETON.modules.reduce((acc, m) => acc + m.lessons.length, 0);
    
    if (totalLessons >= expectedLessons) {
      console.log(`✅ Course already fully generated with ${totalLessons} lessons. Exiting.`);
      return;
    }
    
    // Find incomplete modules and delete them for regeneration
    for (const mod of existingModules) {
      const modLessons = await db.select().from(lessons).where(eq(lessons.moduleId, mod.id));
      const expectedModLessons = COURSE_SKELETON.modules.find(m => m.title === mod.title)?.lessons.length || 7;
      
      if (modLessons.length < expectedModLessons) {
        console.log(`🔄 Module "${mod.title}" is incomplete (${modLessons.length}/${expectedModLessons} lessons). Deleting for regeneration...`);
        
        // Delete incomplete module content
        for (const lesson of modLessons) {
          await db.delete(lessonContentBlocks).where(eq(lessonContentBlocks.lessonId, lesson.id));
          await db.delete(quizzes).where(eq(quizzes.lessonId, lesson.id));
        }
        await db.delete(lessons).where(eq(lessons.moduleId, mod.id));
        await db.delete(modules).where(eq(modules.id, mod.id));
      }
    }
    
    // Recalculate existing module count after cleanup
    const remainingModules = await db.select().from(modules).where(eq(modules.courseId, courseId));
    existingModuleCount = remainingModules.length;
    
    console.log(`📦 Found course with ${existingModuleCount}/${COURSE_SKELETON.modules.length} complete modules. Continuing...`);
  } else {
    let [photographyCategory] = await db.select().from(courseCategories).where(eq(courseCategories.name, 'Photography'));
    if (!photographyCategory) {
      [photographyCategory] = await db.insert(courseCategories).values({
        name: 'Photography',
        displayName: 'Photography & Visual Arts',
        description: 'Courses about photography, videography, and visual storytelling',
        color: 'purple',
        isActive: true
      }).returning();
      console.log('✅ Created Photography category');
    }

    console.log('\n🎨 Generating course cover image...');
    const coverImageUrl = await generateImage(
      'Professional photography concept. Modern camera with beautiful lens, surrounded by stunning photographs floating in the air. Sunset light rays. Clean modern flat illustration style.',
      'cover'
    );

    console.log('\n📝 Creating course in database...');
    const [course] = await db.insert(courses).values({
      title: COURSE_SKELETON.title,
      description: COURSE_SKELETON.description,
      thumbnailUrl: coverImageUrl,
      image: coverImageUrl,
      categoryId: photographyCategory.id,
      pricingType: 'free',
      price: "0",
      isActive: true,
      approvalStatus: 'approved',
      createdBy: adminUserId,
      publisherName: 'EduFiliova Academy',
      publisherBio: 'Expert educators helping you master the art of photography',
      tags: ['Photography', 'Camera', 'Composition', 'Lighting', 'Portrait', 'Landscape', 'Editing', 'Beginner'],
      language: 'en',
      difficulty: 'beginner',
      duration: 30,
      learningObjectives: COURSE_SKELETON.learning_outcomes,
      certificationType: 'certificate',
      isFeatured: true
    }).returning();

    courseId = course.id;
    console.log(`✅ Created course: ${course.title} (ID: ${course.id})`);
  }

  for (let i = 0; i < COURSE_SKELETON.modules.length; i++) {
    if (i < existingModuleCount) {
      console.log(`\n⏭️ Skipping Module ${i + 1}/${COURSE_SKELETON.modules.length}: ${COURSE_SKELETON.modules[i].title} (already exists)`);
      continue;
    }

    const moduleSkeleton = COURSE_SKELETON.modules[i];
    console.log(`\n📚 Processing Module ${i + 1}/${COURSE_SKELETON.modules.length}: ${moduleSkeleton.title}`);

    const [dbModule] = await db.insert(modules).values({
      courseId: courseId,
      title: moduleSkeleton.title,
      description: moduleSkeleton.summary,
      orderNum: i + 1
    }).returning();

    console.log(`✅ Created module: ${dbModule.title}`);

    const quizQuestions: any[] = [];

    for (let j = 0; j < moduleSkeleton.lessons.length; j++) {
      const lessonSkeleton = moduleSkeleton.lessons[j];
      console.log(`  📖 Generating Lesson ${j + 1}/${moduleSkeleton.lessons.length}: ${lessonSkeleton.title}`);

      const lesson = await generateLessonContent(lessonSkeleton, moduleSkeleton.title);

      const imagePrompts = lesson.image_prompts || [
        `Photography education illustration about ${lessonSkeleton.title}. Camera and photography equipment. Clean modern style.`,
        `Photography technique demonstration for ${lessonSkeleton.title}. Professional photography scene. Modern illustration.`,
        `Photography example showing ${lessonSkeleton.title} concept. Beautiful composition example. Clean illustration style.`
      ];
      
      console.log(`    🎨 Generating ${imagePrompts.length} images for lesson...`);
      const lessonImages = await generateLessonImages(imagePrompts);
      
      const formattedContent = formatLessonContent(lesson.content, lessonImages);

      const [dbLesson] = await db.insert(lessons).values({
        moduleId: dbModule.id,
        title: lessonSkeleton.title,
        content: formattedContent,
        orderNum: j + 1,
        durationMinutes: 15
      }).returning();

      await db.insert(lessonContentBlocks).values({
        lessonId: dbLesson.id,
        blockType: 'text',
        content: formattedContent,
        orderIndex: 0
      });

      if (lesson.quiz_question) {
        quizQuestions.push({
          id: j + 1,
          text: lesson.quiz_question.text,
          options: lesson.quiz_question.options,
          correctIndex: lesson.quiz_question.correctIndex,
          explanation: lesson.quiz_question.explanation
        });
      }

      console.log(`    ✅ Created lesson: ${lessonSkeleton.title} with ${lessonImages.length} images`);
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    if (quizQuestions.length > 0) {
      const lastLesson = await db.select().from(lessons).where(eq(lessons.moduleId, dbModule.id)).limit(1);
      
      if (lastLesson.length > 0) {
        await db.insert(quizzes).values({
          lessonId: lastLesson[0].id,
          title: `${moduleSkeleton.title} Quiz`,
          description: `Test your knowledge of ${moduleSkeleton.title}`,
          questions: quizQuestions,
          passingScore: 70
        });
        console.log(`  ✅ Added quiz with ${quizQuestions.length} questions`);
      }
    }

    console.log(`✅ Completed Module ${i + 1}: ${moduleSkeleton.title}`);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log('\n============================================================');
  console.log('🎉 Photography Fundamentals Course Generation Complete!');
  console.log('============================================================');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seedPhotographyCourse()
    .then(() => {
      console.log('✅ Seed completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seed failed:', error);
      process.exit(1);
    });
}
