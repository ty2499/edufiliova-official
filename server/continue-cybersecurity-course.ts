import { db } from './db';
import { courses, modules, lessons, lessonContentBlocks } from '../shared/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getOpenAIClient } from './openai';
import { generateAndSaveImage } from './utils/image-generator';

const COURSE_ID = '92f4d21e-63f6-4d39-8143-d2a937faa3ae';

const SYSTEM_PROMPT = `You are a professional e-learning content creator specialized in cybersecurity courses for absolute beginners.

STRICT RULES:
- Output ONLY valid JSON.
- No markdown, no explanations, no extra text.
- Simple, clear, beginner-friendly English.
- NO EMOJIS anywhere in the content.
- Content must be original and practical.
- Structure must exactly match the schema provided.
- Content should be comprehensive and educational.
- Use professional, educational tone throughout.`;

const REMAINING_MODULES = [
  {
    module_id: "M10",
    title: "Cybersecurity for Work",
    summary: "Apply cybersecurity principles in the workplace.",
    lessons: [
      { lesson_id: "M10L1", title: "Workplace Security Basics", goal: "Understand work security needs." },
      { lesson_id: "M10L2", title: "Remote Work Security", goal: "Protect remote work setups." },
      { lesson_id: "M10L3", title: "Handling Company Data", goal: "Safely handle work data." },
      { lesson_id: "M10L4", title: "Reporting Security Incidents", goal: "Know how to report issues." },
      { lesson_id: "M10L5", title: "Security Awareness at Work", goal: "Build a security mindset." }
    ],
    existingModuleId: 120,
    startOrder: 1
  },
  {
    module_id: "M11",
    title: "Common Cybersecurity Mistakes",
    summary: "Avoid common beginner security errors.",
    lessons: [
      { lesson_id: "M11L1", title: "Weak Password Habits", goal: "Avoid poor password practices." },
      { lesson_id: "M11L2", title: "Ignoring Updates", goal: "Understand update risks." },
      { lesson_id: "M11L3", title: "Trusting Unknown Sources", goal: "Avoid unsafe trust decisions." },
      { lesson_id: "M11L4", title: "Oversharing Online", goal: "Limit information exposure." },
      { lesson_id: "M11L5", title: "Fixing Security Mistakes", goal: "Correct common errors." }
    ],
    orderNum: 11
  },
  {
    module_id: "M12",
    title: "Building a Security Mindset",
    summary: "Develop long-term cybersecurity habits.",
    lessons: [
      { lesson_id: "M12L1", title: "Thinking Like a Defender", goal: "Adopt a security-first mindset." },
      { lesson_id: "M12L2", title: "Daily Security Habits", goal: "Build daily security routines." },
      { lesson_id: "M12L3", title: "Staying Informed", goal: "Keep learning about threats." },
      { lesson_id: "M12L4", title: "Personal Security Plan", goal: "Create a simple security plan." },
      { lesson_id: "M12L5", title: "Next Steps in Cybersecurity", goal: "Plan further learning paths." }
    ],
    orderNum: 12
  }
];

interface LessonContent {
  introduction: string;
  main_content: string;
  key_points: string[];
  practical_tips: string[];
  real_world_example: string;
  summary: string;
  image_prompt: string;
}

async function generateLessonContent(
  lessonTitle: string, 
  lessonGoal: string, 
  moduleName: string
): Promise<LessonContent> {
  const openai = await getOpenAIClient();
  if (!openai) {
    throw new Error('OpenAI not configured');
  }

  const userPrompt = `Create comprehensive educational content for a cybersecurity lesson.

Module: ${moduleName}
Lesson Title: ${lessonTitle}
Learning Goal: ${lessonGoal}

Create content that is:
- Beginner-friendly and easy to understand
- Practical with real-world applications
- Professional and educational
- NO EMOJIS anywhere

Return JSON in EXACTLY this structure:
{
  "introduction": "A 150-200 word introduction that hooks the reader and explains what they will learn",
  "main_content": "A 400-600 word detailed explanation of the topic with clear sections. Include examples and explanations that a complete beginner can understand.",
  "key_points": ["Key point 1", "Key point 2", "Key point 3", "Key point 4"],
  "practical_tips": ["Practical tip 1", "Practical tip 2", "Practical tip 3"],
  "real_world_example": "A 100-150 word real-world scenario or example that illustrates the concept",
  "summary": "A 50-100 word summary of the main takeaways",
  "image_prompt": "Professional HD clipart illustration of [specific cybersecurity concept]. Clean vector style, modern flat design, blue and teal color scheme, no text or words on the image, suitable for educational content."
}`;

  console.log(`Generating content for: ${lessonTitle}...`);

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

  const content = response.choices[0].message.content;
  if (!content) {
    throw new Error('No content returned from OpenAI');
  }

  console.log(`Content generated for: ${lessonTitle}`);
  return JSON.parse(content);
}

async function generateLessonImage(prompt: string, lessonTitle: string): Promise<string> {
  try {
    const fullPrompt = `${prompt} Style: HD quality, clean modern clipart, professional vector illustration. Cybersecurity education theme. Blue, teal, and gray color palette. ABSOLUTELY NO TEXT, NO WORDS, NO LETTERS, NO NUMBERS visible anywhere in the image. Pure visual illustration only.`;
    
    console.log(`Generating image for: ${lessonTitle}...`);
    const result = await generateAndSaveImage({
      prompt: fullPrompt,
      size: '1024x1024',
      quality: 'hd',
      style: 'natural'
    });
    
    console.log(`Image saved: ${result.publicUrl}`);
    return result.publicUrl;
  } catch (error) {
    console.error(`Image generation failed for ${lessonTitle}:`, error);
    return '/api/placeholder/800/400';
  }
}

async function createContentBlocks(
  lessonId: number, 
  content: LessonContent, 
  imageUrl: string
): Promise<void> {
  const blocks = [
    {
      lessonId,
      blockType: 'image',
      title: 'Lesson Illustration',
      mediaUrl: imageUrl,
      mediaType: 'image',
      isCollapsible: false,
      isExpandedByDefault: true,
      displayOrder: 0
    },
    {
      lessonId,
      blockType: 'text',
      title: 'Introduction',
      content: content.introduction,
      isCollapsible: true,
      isExpandedByDefault: true,
      displayOrder: 1
    },
    {
      lessonId,
      blockType: 'accordion',
      title: 'Understanding the Concept',
      content: content.main_content,
      isCollapsible: true,
      isExpandedByDefault: true,
      displayOrder: 2
    },
    {
      lessonId,
      blockType: 'accordion',
      title: 'Key Points to Remember',
      content: content.key_points.map((point, i) => `${i + 1}. ${point}`).join('\n\n'),
      isCollapsible: true,
      isExpandedByDefault: true,
      displayOrder: 3
    },
    {
      lessonId,
      blockType: 'accordion',
      title: 'Practical Tips',
      content: content.practical_tips.map((tip, i) => `Tip ${i + 1}: ${tip}`).join('\n\n'),
      isCollapsible: true,
      isExpandedByDefault: false,
      displayOrder: 4
    },
    {
      lessonId,
      blockType: 'accordion',
      title: 'Real-World Example',
      content: content.real_world_example,
      isCollapsible: true,
      isExpandedByDefault: false,
      displayOrder: 5
    },
    {
      lessonId,
      blockType: 'text',
      title: 'Summary',
      content: content.summary,
      isCollapsible: true,
      isExpandedByDefault: true,
      displayOrder: 6
    }
  ];

  for (const block of blocks) {
    await db.insert(lessonContentBlocks).values(block);
  }
}

async function processLesson(
  lessonInfo: any,
  moduleName: string,
  moduleId: number,
  orderNum: number
): Promise<void> {
  try {
    console.log(`\n--- Processing: ${lessonInfo.title} ---`);
    
    const content = await generateLessonContent(
      lessonInfo.title,
      lessonInfo.goal,
      moduleName
    );

    const imageUrl = await generateLessonImage(
      content.image_prompt,
      lessonInfo.title
    );

    const [newLesson] = await db.insert(lessons).values({
      moduleId,
      courseId: COURSE_ID,
      title: lessonInfo.title,
      orderNum,
      durationMinutes: 20,
      description: lessonInfo.goal,
      content: content.main_content,
      images: [imageUrl]
    }).returning();

    await createContentBlocks(newLesson.id, content, imageUrl);

    console.log(`Completed: ${lessonInfo.title}`);
    await new Promise(r => setTimeout(r, 2000));
  } catch (error) {
    console.error(`Failed to create lesson ${lessonInfo.title}:`, error);
  }
}

async function continueGeneration() {
  console.log('\n========================================');
  console.log('CONTINUING CYBERSECURITY COURSE GENERATION');
  console.log('========================================\n');

  for (const moduleData of REMAINING_MODULES) {
    let moduleId: number;
    
    if (moduleData.existingModuleId) {
      moduleId = moduleData.existingModuleId;
      console.log(`\nContinuing existing Module: ${moduleData.title} (ID: ${moduleId})`);
    } else {
      console.log(`\nCreating new Module: ${moduleData.title}`);
      const [newModule] = await db.insert(modules).values({
        courseId: COURSE_ID,
        title: moduleData.title,
        description: moduleData.summary,
        orderNum: moduleData.orderNum!
      }).returning();
      moduleId = newModule.id;
      console.log(`Module created with ID: ${moduleId}`);
    }

    const startOrder = moduleData.startOrder || 1;
    
    for (let i = 0; i < moduleData.lessons.length; i++) {
      const lesson = moduleData.lessons[i];
      const orderNum = startOrder + i;
      
      await processLesson(lesson, moduleData.title, moduleId, orderNum);
    }

    console.log(`Completed Module: ${moduleData.title}`);
    console.log('Waiting before next module...');
    await new Promise(r => setTimeout(r, 3000));
  }

  console.log('\n========================================');
  console.log('COURSE GENERATION COMPLETE');
  console.log('========================================');
}

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const isMainModule = process.argv[1] && __filename.includes(process.argv[1].replace(/\.[^/.]+$/, ''));

if (isMainModule) {
  continueGeneration()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { continueGeneration };
