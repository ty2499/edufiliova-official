import { db } from './db';
import { lessons, modules } from '../shared/schema';
import { eq, inArray } from 'drizzle-orm';
import { getOpenAIClient } from './openai';
import { generateAndSaveImage } from './utils/image-generator';
import { fileURLToPath } from 'url';

const REMAINING_LESSON_IDS = [358, 359, 360, 361, 362, 363, 364, 365, 366, 367];

const SYSTEM_PROMPT = `You are a professional e-learning content creator specialized in engineering courses for absolute beginners.

STRICT RULES:
- Output ONLY valid JSON.
- No markdown, no explanations, no extra text.
- Simple, clear, beginner-friendly English.
- Content must be original and practical.`;

async function generateEnhancedContent(lesson: any, moduleName: string): Promise<any> {
  const openai = await getOpenAIClient();
  if (!openai) {
    throw new Error('OpenAI not configured');
  }

  const userPrompt = `Enhance the following engineering lesson content to be more comprehensive.

Module: ${moduleName}
Lesson Title: ${lesson.title}
Original Content:
${lesson.content}

Return JSON:
{
  "explanation": "Detailed explanation (600-900 words)",
  "key_concepts": [
    { "title": "Concept 1", "description": "Description" },
    { "title": "Concept 2", "description": "Description" },
    { "title": "Concept 3", "description": "Description" }
  ],
  "real_world_examples": ["Example 1", "Example 2", "Example 3"],
  "step_by_step": ["Step 1", "Step 2", "Step 3", "Step 4"],
  "common_mistakes": ["Mistake 1", "Mistake 2"],
  "pro_tips": ["Tip 1", "Tip 2"],
  "exercise": {
    "task": "Task description",
    "expected_outcome": "Outcome"
  },
  "summary": "Summary paragraph",
  "image_prompt": "A clean educational illustration of [engineering concept from this lesson]. Modern flat design, no text."
}`;

  console.log(`📚 Generating content for: ${lesson.title}...`);

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt }
    ],
    response_format: { type: "json_object" },
    max_tokens: 3000,
    temperature: 0.7
  });

  return JSON.parse(response.choices[0].message.content || '{}');
}

async function generateLessonImage(prompt: string): Promise<string> {
  try {
    const fullPrompt = `${prompt} Style: clean, modern, flat illustration. Engineering education. NO TEXT in image.`;
    const result = await generateAndSaveImage({
      prompt: fullPrompt,
      size: '1024x1024',
      quality: 'standard',
      style: 'natural'
    });
    return result.publicUrl;
  } catch (error) {
    console.error(`❌ Image failed:`, error);
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
  ${content.key_concepts.map((c: any) => `
  <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); padding: 15px 20px; border-radius: 10px; border-left: 4px solid #2563eb;">
    <strong style="color: #1e40af;">${c.title}</strong>
    <p style="margin: 8px 0 0 0; color: #475569;">${c.description}</p>
  </div>
  `).join('')}
</div>

<h3 style="margin-top: 30px; color: #059669;">Real-World Applications</h3>
<ul style="background: #f0fdf4; padding: 20px 40px; border-radius: 10px; list-style-type: disc;">
  ${content.real_world_examples.map((ex: string) => `<li style="margin: 10px 0; color: #166534;">${ex}</li>`).join('')}
</ul>

<h3 style="margin-top: 30px; color: #7c3aed;">Step-by-Step Guide</h3>
<ol style="background: #faf5ff; padding: 20px 40px; border-radius: 10px;">
  ${content.step_by_step.map((s: string) => `<li style="margin: 12px 0; color: #5b21b6;">${s}</li>`).join('')}
</ol>

<h3 style="margin-top: 30px; color: #dc2626;">Common Mistakes to Avoid</h3>
<div style="background: #fef2f2; padding: 20px; border-radius: 10px; border-left: 4px solid #dc2626;">
  <ul style="margin: 0; padding-left: 20px;">
    ${content.common_mistakes.map((m: string) => `<li style="margin: 8px 0; color: #991b1b;">${m}</li>`).join('')}
  </ul>
</div>

<h3 style="margin-top: 30px; color: #ea580c;">Pro Tips</h3>
<div style="background: #fff7ed; padding: 20px; border-radius: 10px;">
  ${content.pro_tips.map((t: string) => `
  <div style="display: flex; align-items: flex-start; margin: 10px 0;">
    <span style="color: #ea580c; margin-right: 10px;">💡</span>
    <span style="color: #9a3412;">${t}</span>
  </div>
  `).join('')}
</div>

<h3 style="margin-top: 30px; color: #0891b2;">Practice Exercise</h3>
<div style="background: linear-gradient(135deg, #ecfeff 0%, #cffafe 100%); padding: 25px; border-radius: 12px; border: 2px solid #06b6d4;">
  <p style="margin: 0 0 15px 0;"><strong style="color: #0e7490;">Task:</strong> ${content.exercise.task}</p>
  <p style="margin: 0;"><strong style="color: #0e7490;">Expected Outcome:</strong> ${content.exercise.expected_outcome}</p>
</div>

<h3 style="margin-top: 30px; color: #4f46e5;">Summary</h3>
<div style="background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%); padding: 20px; border-radius: 10px; font-style: italic; color: #3730a3; line-height: 1.8;">
  ${content.summary}
</div>
`.trim();
}

async function enhanceRemainingLessons() {
  console.log('🔧 Enhancing remaining 10 lessons...');
  
  const lessonList = await db.select({
    lesson: lessons,
    moduleName: modules.title
  })
    .from(lessons)
    .innerJoin(modules, eq(lessons.moduleId, modules.id))
    .where(inArray(lessons.id, REMAINING_LESSON_IDS));

  for (const { lesson, moduleName } of lessonList) {
    console.log(`\n📝 Processing: ${lesson.title}`);

    try {
      const content = await generateEnhancedContent(lesson, moduleName);
      const imageUrl = await generateLessonImage(content.image_prompt || `Engineering concept: ${lesson.title}`);
      const htmlContent = formatHtmlContent(content, imageUrl, lesson.title);

      await db.update(lessons)
        .set({ content: htmlContent, images: [imageUrl] })
        .where(eq(lessons.id, lesson.id));

      console.log(`✅ Done: ${lesson.title}`);
      await new Promise(r => setTimeout(r, 1500));
    } catch (error) {
      console.error(`❌ Failed: ${lesson.title}`, error);
    }
  }

  console.log('\n🎉 All remaining lessons enhanced!');
}

const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);
if (isMainModule) {
  enhanceRemainingLessons()
    .then(() => process.exit(0))
    .catch((e) => { console.error(e); process.exit(1); });
}
