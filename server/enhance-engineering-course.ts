import { db } from './db';
import { courses, modules, lessons, quizzes } from '../shared/schema';
import { eq } from 'drizzle-orm';
import { getOpenAIClient } from './openai';
import { generateAndSaveImage } from './utils/image-generator';
import { fileURLToPath } from 'url';

const ENGINEERING_COURSE_ID = 'e2a9e72b-c86c-4104-a829-57bfb91d3bcd';

const SYSTEM_PROMPT = `You are a professional e-learning content creator specialized in engineering courses for absolute beginners.

STRICT RULES:
- Output ONLY valid JSON.
- No markdown, no explanations, no extra text.
- Simple, clear, beginner-friendly English.
- No emojis, no slang.
- Content must be original and practical.
- Structure must exactly match the schema provided.
- Content should be comprehensive and educational.`;

async function generateEnhancedContent(lesson: any, moduleName: string): Promise<any> {
  const openai = await getOpenAIClient();
  if (!openai) {
    throw new Error('OpenAI not configured');
  }

  const userPrompt = `Enhance the following engineering lesson content to be more comprehensive and engaging.

Module: ${moduleName}
Lesson Title: ${lesson.title}
Original Content:
${lesson.content}

Create enhanced content with:
1. A detailed explanation (800-1200 words) that expands on the original
2. 3-4 key concepts with descriptions
3. Real-world examples and applications
4. Step-by-step understanding guide
5. Common misconceptions to avoid
6. Pro tips for beginners
7. A practical exercise
8. A comprehensive summary

Return JSON in EXACTLY this structure:
{
  "explanation": "Detailed explanation text (800-1200 words)",
  "key_concepts": [
    { "title": "Concept 1", "description": "Description" },
    { "title": "Concept 2", "description": "Description" },
    { "title": "Concept 3", "description": "Description" }
  ],
  "real_world_examples": ["Example 1", "Example 2", "Example 3"],
  "step_by_step": ["Step 1", "Step 2", "Step 3", "Step 4", "Step 5"],
  "common_mistakes": ["Mistake 1", "Mistake 2", "Mistake 3"],
  "pro_tips": ["Tip 1", "Tip 2", "Tip 3"],
  "exercise": {
    "task": "Practical task description",
    "expected_outcome": "What they should achieve"
  },
  "summary": "Comprehensive summary paragraph",
  "image_prompt": "A clean, professional educational illustration showing [specific engineering concept from this lesson]. Modern flat design, no text, suitable for e-learning."
}`;

  console.log(`📚 Generating enhanced content for: ${lesson.title}...`);

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt }
    ],
    response_format: { type: "json_object" },
    max_tokens: 4000,
    temperature: 0.7
  });

  const content = response.choices[0].message.content;
  if (!content) {
    throw new Error('No content returned from OpenAI');
  }

  console.log(`✅ Generated enhanced content for: ${lesson.title}`);
  return JSON.parse(content);
}

async function generateLessonImage(prompt: string, lessonTitle: string): Promise<string> {
  try {
    const sanitizedTitle = lessonTitle.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
    const fullPrompt = `${prompt} Style: clean, modern, flat illustration. Professional e-learning. Engineering education theme. ABSOLUTELY NO TEXT, NO WORDS, NO LETTERS in the image.`;
    
    console.log(`🎨 Generating image for: ${lessonTitle}...`);
    const result = await generateAndSaveImage({
      prompt: fullPrompt,
      size: '1024x1024',
      quality: 'standard',
      style: 'natural'
    });
    
    console.log(`✅ Image saved: ${result.publicUrl}`);
    return result.publicUrl;
  } catch (error) {
    console.error(`❌ Image generation failed for ${lessonTitle}:`, error);
    return '/api/placeholder/800/400';
  }
}

function formatHtmlContent(content: any, imageUrl: string, lessonTitle: string): string {
  return `
<h2>${lessonTitle}</h2>

<div class="lesson-image" style="text-align: center; margin: 20px 0;">
  <img src="${imageUrl}" alt="${lessonTitle}" style="width: 100%; max-width: 700px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);" />
</div>

<div class="lesson-explanation" style="line-height: 1.8; font-size: 16px;">
  ${content.explanation}
</div>

<h3 style="margin-top: 30px; color: #2563eb;">Key Concepts</h3>
<div class="key-concepts" style="display: grid; gap: 15px; margin: 20px 0;">
  ${content.key_concepts.map((concept: any) => `
  <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); padding: 15px 20px; border-radius: 10px; border-left: 4px solid #2563eb;">
    <strong style="color: #1e40af;">${concept.title}</strong>
    <p style="margin: 8px 0 0 0; color: #475569;">${concept.description}</p>
  </div>
  `).join('')}
</div>

<h3 style="margin-top: 30px; color: #059669;">Real-World Applications</h3>
<ul style="background: #f0fdf4; padding: 20px 40px; border-radius: 10px; list-style-type: disc;">
  ${content.real_world_examples.map((ex: string) => `<li style="margin: 10px 0; color: #166534;">${ex}</li>`).join('')}
</ul>

<h3 style="margin-top: 30px; color: #7c3aed;">Step-by-Step Understanding</h3>
<ol style="background: #faf5ff; padding: 20px 40px; border-radius: 10px;">
  ${content.step_by_step.map((step: string) => `<li style="margin: 12px 0; color: #5b21b6;">${step}</li>`).join('')}
</ol>

<h3 style="margin-top: 30px; color: #dc2626;">Common Mistakes to Avoid</h3>
<div style="background: #fef2f2; padding: 20px; border-radius: 10px; border-left: 4px solid #dc2626;">
  <ul style="margin: 0; padding-left: 20px;">
    ${content.common_mistakes.map((m: string) => `<li style="margin: 8px 0; color: #991b1b;">${m}</li>`).join('')}
  </ul>
</div>

<h3 style="margin-top: 30px; color: #ea580c;">Pro Tips</h3>
<div style="background: #fff7ed; padding: 20px; border-radius: 10px;">
  ${content.pro_tips.map((tip: string) => `
  <div style="display: flex; align-items: flex-start; margin: 10px 0;">
    <span style="color: #ea580c; font-size: 18px; margin-right: 10px;">💡</span>
    <span style="color: #9a3412;">${tip}</span>
  </div>
  `).join('')}
</div>

<h3 style="margin-top: 30px; color: #0891b2;">Practice Exercise</h3>
<div style="background: linear-gradient(135deg, #ecfeff 0%, #cffafe 100%); padding: 25px; border-radius: 12px; border: 2px solid #06b6d4;">
  <p style="margin: 0 0 15px 0;"><strong style="color: #0e7490;">Your Task:</strong></p>
  <p style="margin: 0 0 15px 0; color: #164e63;">${content.exercise.task}</p>
  <p style="margin: 0;"><strong style="color: #0e7490;">Expected Outcome:</strong> ${content.exercise.expected_outcome}</p>
</div>

<h3 style="margin-top: 30px; color: #4f46e5;">Summary</h3>
<div style="background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%); padding: 20px; border-radius: 10px; font-style: italic; color: #3730a3; line-height: 1.8;">
  ${content.summary}
</div>
`.trim();
}

export async function enhanceEngineeringCourse() {
  console.log('🔧 Starting Engineering for Beginners Course Enhancement...');
  console.log('===========================================================');
  
  const [course] = await db.select().from(courses).where(eq(courses.id, ENGINEERING_COURSE_ID));
  if (!course) {
    console.log('❌ Engineering for Beginners course not found');
    return;
  }

  console.log(`✅ Found course: ${course.title} (ID: ${course.id})`);

  const courseModules = await db.select().from(modules)
    .where(eq(modules.courseId, course.id))
    .orderBy(modules.orderNum);

  console.log(`📦 Found ${courseModules.length} modules`);

  for (const module of courseModules) {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`📚 Processing Module: ${module.title}`);
    console.log(`${'='.repeat(50)}`);

    const moduleLessons = await db.select().from(lessons)
      .where(eq(lessons.moduleId, module.id))
      .orderBy(lessons.orderNum);

    for (const lesson of moduleLessons) {
      console.log(`\n📝 Processing Lesson: ${lesson.title}`);

      try {
        const enhancedContent = await generateEnhancedContent(lesson, module.title);
        
        const imageUrl = await generateLessonImage(
          enhancedContent.image_prompt || `Engineering education concept for ${lesson.title}`,
          lesson.title
        );

        const htmlContent = formatHtmlContent(enhancedContent, imageUrl, lesson.title);

        await db.update(lessons)
          .set({
            content: htmlContent,
            images: [imageUrl]
          })
          .where(eq(lessons.id, lesson.id));

        console.log(`✅ Updated lesson: ${lesson.title}`);

        console.log('⏳ Waiting 2 seconds before next lesson...');
        await new Promise(r => setTimeout(r, 2000));
      } catch (error) {
        console.error(`❌ Failed to enhance lesson ${lesson.title}:`, error);
      }
    }
  }

  const existingQuizzes = await db.select().from(quizzes)
    .innerJoin(lessons, eq(quizzes.lessonId, lessons.id))
    .where(eq(lessons.courseId, course.id));

  console.log(`\n📊 Course has ${existingQuizzes.length} quizzes`);

  console.log('\n===========================================================');
  console.log('🎉 ENGINEERING COURSE ENHANCEMENT COMPLETE!');
  console.log(`📚 Course: ${course.title}`);
  console.log(`📖 Modules: ${courseModules.length}`);
  console.log('===========================================================\n');

  return course;
}

const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);

if (isMainModule) {
  enhanceEngineeringCourse()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}
