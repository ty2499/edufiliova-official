import { db } from './db';
import { courses, modules, lessons, lessonContentBlocks, courseCategories } from '../shared/schema';
import { eq } from 'drizzle-orm';
import { getOpenAIClient } from './openai';
import { generateAndSaveImage } from './utils/image-generator';
import { ensureAdminUser } from './ensure-admin-user';

const COURSE_TITLE = 'Cybersecurity Basics for Beginners';

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

const COURSE_STRUCTURE = {
  course_id: "cybersecurity_basics_for_beginners_v1",
  title: "Cybersecurity Basics for Beginners",
  tagline: "Learn how to stay safe in the digital world",
  level: "beginner",
  description: "A beginner-friendly course that teaches the fundamentals of cybersecurity, online safety, and basic security practices for individuals and organizations.",
  learning_outcomes: [
    "Understand basic cybersecurity concepts",
    "Recognize common cyber threats",
    "Protect personal and professional data",
    "Use safe online practices",
    "Develop a security-aware mindset"
  ],
  modules: [
    {
      module_id: "M1",
      title: "Introduction to Cybersecurity",
      summary: "Understand what cybersecurity is and why it matters.",
      lessons: [
        { lesson_id: "M1L1", title: "What Is Cybersecurity", goal: "Understand the meaning of cybersecurity." },
        { lesson_id: "M1L2", title: "Why Cybersecurity Matters", goal: "Learn why security is important." },
        { lesson_id: "M1L3", title: "Digital Threat Landscape", goal: "Understand common digital risks." },
        { lesson_id: "M1L4", title: "Cybersecurity in Daily Life", goal: "See how cybersecurity affects everyday activities." },
        { lesson_id: "M1L5", title: "Course Overview", goal: "Understand how the course is structured." }
      ]
    },
    {
      module_id: "M2",
      title: "Understanding Cyber Threats",
      summary: "Learn about common cyber attacks and threats.",
      lessons: [
        { lesson_id: "M2L1", title: "Malware Basics", goal: "Understand what malware is." },
        { lesson_id: "M2L2", title: "Viruses and Worms", goal: "Learn how viruses spread." },
        { lesson_id: "M2L3", title: "Ransomware Explained", goal: "Understand ransomware attacks." },
        { lesson_id: "M2L4", title: "Spyware and Adware", goal: "Recognize tracking threats." },
        { lesson_id: "M2L5", title: "Threat Examples", goal: "Review real-world threat examples." }
      ]
    },
    {
      module_id: "M3",
      title: "Social Engineering Attacks",
      summary: "Understand attacks that target human behavior.",
      lessons: [
        { lesson_id: "M3L1", title: "What Is Social Engineering", goal: "Understand manipulation-based attacks." },
        { lesson_id: "M3L2", title: "Phishing Attacks", goal: "Identify phishing attempts." },
        { lesson_id: "M3L3", title: "Email Scams", goal: "Recognize scam emails." },
        { lesson_id: "M3L4", title: "Impersonation Attacks", goal: "Understand identity-based attacks." },
        { lesson_id: "M3L5", title: "Avoiding Social Engineering", goal: "Learn how to stay safe." }
      ]
    },
    {
      module_id: "M4",
      title: "Passwords and Authentication",
      summary: "Learn how to protect accounts using authentication.",
      lessons: [
        { lesson_id: "M4L1", title: "Password Basics", goal: "Understand password security." },
        { lesson_id: "M4L2", title: "Strong Password Creation", goal: "Create strong passwords." },
        { lesson_id: "M4L3", title: "Password Managers", goal: "Learn how password managers work." },
        { lesson_id: "M4L4", title: "Multi-Factor Authentication", goal: "Understand MFA protection." },
        { lesson_id: "M4L5", title: "Authentication Best Practices", goal: "Apply safe login habits." }
      ]
    },
    {
      module_id: "M5",
      title: "Safe Internet Usage",
      summary: "Practice safe browsing and online behavior.",
      lessons: [
        { lesson_id: "M5L1", title: "Safe Browsing Basics", goal: "Browse the web safely." },
        { lesson_id: "M5L2", title: "Recognizing Unsafe Websites", goal: "Identify risky websites." },
        { lesson_id: "M5L3", title: "Downloads and Attachments", goal: "Avoid malicious downloads." },
        { lesson_id: "M5L4", title: "Public Wi-Fi Risks", goal: "Understand public network dangers." },
        { lesson_id: "M5L5", title: "Internet Safety Habits", goal: "Build safe online habits." }
      ]
    },
    {
      module_id: "M6",
      title: "Device Security",
      summary: "Protect computers and mobile devices.",
      lessons: [
        { lesson_id: "M6L1", title: "Securing Computers", goal: "Protect desktop and laptop devices." },
        { lesson_id: "M6L2", title: "Mobile Device Security", goal: "Secure smartphones and tablets." },
        { lesson_id: "M6L3", title: "Software Updates", goal: "Understand why updates matter." },
        { lesson_id: "M6L4", title: "Antivirus Tools", goal: "Learn about antivirus protection." },
        { lesson_id: "M6L5", title: "Device Security Checklist", goal: "Apply device security steps." }
      ]
    },
    {
      module_id: "M7",
      title: "Data Protection Basics",
      summary: "Learn how to protect sensitive data.",
      lessons: [
        { lesson_id: "M7L1", title: "What Is Sensitive Data", goal: "Identify sensitive information." },
        { lesson_id: "M7L2", title: "Data Storage Safety", goal: "Store data securely." },
        { lesson_id: "M7L3", title: "Backing Up Data", goal: "Understand backup importance." },
        { lesson_id: "M7L4", title: "Data Sharing Risks", goal: "Share data safely." },
        { lesson_id: "M7L5", title: "Protecting Personal Data", goal: "Apply data protection habits." }
      ]
    },
    {
      module_id: "M8",
      title: "Network Security Basics",
      summary: "Understand basic network protection concepts.",
      lessons: [
        { lesson_id: "M8L1", title: "What Is a Network", goal: "Understand network basics." },
        { lesson_id: "M8L2", title: "Home Network Security", goal: "Secure home networks." },
        { lesson_id: "M8L3", title: "Wi-Fi Protection", goal: "Protect wireless connections." },
        { lesson_id: "M8L4", title: "Firewalls Explained", goal: "Understand firewall purpose." },
        { lesson_id: "M8L5", title: "Network Safety Practices", goal: "Apply network security basics." }
      ]
    },
    {
      module_id: "M9",
      title: "Email and Communication Safety",
      summary: "Use email and messaging safely.",
      lessons: [
        { lesson_id: "M9L1", title: "Email Security Basics", goal: "Understand email threats." },
        { lesson_id: "M9L2", title: "Spam and Scam Messages", goal: "Recognize scam messages." },
        { lesson_id: "M9L3", title: "Secure Messaging Apps", goal: "Use messaging apps safely." },
        { lesson_id: "M9L4", title: "Attachments and Links", goal: "Avoid dangerous links." },
        { lesson_id: "M9L5", title: "Communication Safety Rules", goal: "Follow safe communication practices." }
      ]
    },
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
      ]
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
      ]
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
      ]
    }
  ]
};

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
    const sanitizedTitle = lessonTitle.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
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

async function generateTwoLessons(
  lessonData1: any,
  lessonData2: any | null,
  moduleName: string,
  moduleId: number,
  courseId: string,
  orderStart: number
): Promise<void> {
  const lessonsToProcess = [lessonData1];
  if (lessonData2) {
    lessonsToProcess.push(lessonData2);
  }

  for (let i = 0; i < lessonsToProcess.length; i++) {
    const lessonInfo = lessonsToProcess[i];
    const orderNum = orderStart + i;

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
        courseId,
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
}

export async function seedCybersecurityCourse() {
  console.log('Starting Cybersecurity Basics for Beginners Course Seeding...');
  console.log('==============================================================');
  
  const adminUserId = await ensureAdminUser();
  console.log(`Using admin user ID: ${adminUserId}`);
  
  const existing = await db.select().from(courses).where(eq(courses.title, COURSE_TITLE));
  if (existing.length > 0) {
    console.log('Cybersecurity Course already exists. Skipping...');
    return existing[0].id;
  }

  let [techCategory] = await db.select().from(courseCategories).where(eq(courseCategories.name, 'Technology'));
  if (!techCategory) {
    [techCategory] = await db.insert(courseCategories).values({
      name: 'Technology',
      displayName: 'Technology',
      description: 'Technology and digital skills courses',
      color: 'blue',
      isActive: true
    }).returning();
  }

  const [course] = await db.insert(courses).values({
    title: COURSE_TITLE,
    description: COURSE_STRUCTURE.description,
    thumbnailUrl: '/api/placeholder/400/300',
    image: '/api/placeholder/400/300',
    categoryId: techCategory.id,
    pricingType: 'fixed_price',
    price: '24.99',
    isActive: true,
    approvalStatus: 'approved',
    createdBy: adminUserId,
    publisherName: 'EduFiliova Security Academy',
    publisherBio: 'Expert educators in cybersecurity fundamentals and digital safety',
    tags: ['Cybersecurity', 'Online Safety', 'Security', 'Digital Protection', 'Privacy'],
    language: 'en',
    difficulty: 'beginner',
    duration: 12,
    learningObjectives: COURSE_STRUCTURE.learning_outcomes,
    certificationType: 'certificate',
    credits: 6
  }).returning();

  console.log(`Created course: ${course.title} (ID: ${course.id})`);

  return course.id;
}

export async function seedModulesAndLessons(courseId: string, startModule: number = 1, endModule: number = 2) {
  console.log(`\nSeeding Modules ${startModule} to ${endModule}...`);
  console.log('================================================');

  const modulesToSeed = COURSE_STRUCTURE.modules.slice(startModule - 1, endModule);

  for (const moduleData of modulesToSeed) {
    const moduleIndex = COURSE_STRUCTURE.modules.indexOf(moduleData) + 1;
    console.log(`\nCreating Module ${moduleIndex}: ${moduleData.title}`);
    
    const [newModule] = await db.insert(modules).values({
      courseId,
      title: moduleData.title,
      description: moduleData.summary,
      orderNum: moduleIndex
    }).returning();

    console.log(`Module created: ${newModule.title}`);

    for (let i = 0; i < moduleData.lessons.length; i += 2) {
      const lesson1 = moduleData.lessons[i];
      const lesson2 = moduleData.lessons[i + 1] || null;
      
      console.log(`\nGenerating lessons ${i + 1} and ${lesson2 ? i + 2 : 'only'}...`);
      
      await generateTwoLessons(
        lesson1,
        lesson2,
        moduleData.title,
        newModule.id,
        courseId,
        i + 1
      );
    }

    console.log(`Completed Module: ${moduleData.title}`);
  }
}

export async function runFullCourseGeneration() {
  try {
    console.log('\n========================================');
    console.log('CYBERSECURITY COURSE FULL GENERATION');
    console.log('========================================\n');

    const courseId = await seedCybersecurityCourse();
    if (!courseId) {
      console.log('Failed to create or find course');
      return;
    }

    console.log(`Course ID: ${courseId}`);

    for (let batch = 1; batch <= 6; batch++) {
      const startMod = (batch - 1) * 2 + 1;
      const endMod = batch * 2;
      
      console.log(`\n========================================`);
      console.log(`BATCH ${batch}: Modules ${startMod}-${endMod}`);
      console.log(`========================================`);
      
      await seedModulesAndLessons(courseId, startMod, endMod);
      
      console.log(`\nBatch ${batch} complete. Waiting before next batch...`);
      await new Promise(r => setTimeout(r, 5000));
    }

    console.log('\n========================================');
    console.log('COURSE GENERATION COMPLETE');
    console.log('========================================');

  } catch (error) {
    console.error('Course generation failed:', error);
  }
}

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const isMainModule = process.argv[1] && __filename.includes(process.argv[1].replace(/\.[^/.]+$/, ''));

if (isMainModule) {
  runFullCourseGeneration()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}
