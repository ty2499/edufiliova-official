import OpenAI from "openai";
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { db } from './db';
import { courses, modules, lessons, lessonContentBlocks } from '../shared/schema';
import { eq, and } from 'drizzle-orm';
import https from 'https';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const COURSE_TITLE = 'Home Care and Elderly Support';

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'edufiliova-products';
const PUBLIC_URL = process.env.CLOUDFLARE_R2_PUBLIC_URL || '';

async function uploadToR2(buffer: Buffer, key: string, contentType: string): Promise<string> {
  await s3Client.send(new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  }));
  
  return `${PUBLIC_URL}/${key}`;
}

async function generateAndUploadImage(prompt: string, imageId: string): Promise<string> {
  console.log(`  Generating image: ${imageId}...`);
  
  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard"
    });

    const imageUrl = response.data[0].url;
    if (!imageUrl) throw new Error('No image URL returned');

    return new Promise((resolve, reject) => {
      https.get(imageUrl, (imgRes) => {
        const chunks: Buffer[] = [];
        imgRes.on('data', (chunk) => chunks.push(chunk));
        imgRes.on('end', async () => {
          try {
            const buffer = Buffer.concat(chunks);
            const key = `courses/home-care/lessons/${imageId}.png`;
            const url = await uploadToR2(buffer, key, 'image/png');
            console.log(`  Uploaded to R2: ${imageId}`);
            resolve(url);
          } catch (err) {
            reject(err);
          }
        });
        imgRes.on('error', reject);
      });
    });
  } catch (error) {
    console.error(`Failed to generate/upload ${imageId}:`, error);
    return '';
  }
}

async function createLessonContentBlocks(
  lessonId: number,
  body: string,
  summary: string,
  steps: string[],
  imageUrls: string[]
) {
  const blocks = [
    {
      lessonId,
      blockType: 'image',
      title: 'Lesson Illustration',
      mediaUrl: imageUrls[0] || '',
      mediaType: 'image',
      isCollapsible: false,
      isExpandedByDefault: true,
      displayOrder: 1
    },
    {
      lessonId,
      blockType: 'text',
      title: 'Main Content',
      content: body,
      isCollapsible: true,
      isExpandedByDefault: true,
      displayOrder: 2
    },
    {
      lessonId,
      blockType: 'text',
      title: 'Summary',
      content: summary,
      isCollapsible: true,
      isExpandedByDefault: true,
      displayOrder: 3
    }
  ];

  if (imageUrls[1]) {
    blocks.push({
      lessonId,
      blockType: 'image',
      title: 'Additional Illustration',
      mediaUrl: imageUrls[1],
      mediaType: 'image',
      isCollapsible: false,
      isExpandedByDefault: true,
      displayOrder: 4
    });
  }

  for (const block of blocks) {
    await db.insert(lessonContentBlocks).values(block);
  }
}

const REMAINING_MODULES = [
  {
    module_id: "M3",
    title: "Nutrition, Meals, and Hydration in Elderly Care",
    start_from_lesson: "M3L3",
    lessons: [
      { lesson_id: "M3L3", title: "Supporting Safe Eating", body: "Supporting safe eating is essential for elderly individuals who may experience difficulty chewing, swallowing, or handling utensils. Unsafe eating can lead to choking, discomfort, or poor nutrition.", summary: "Safe eating support reduces choking risks and promotes comfort during meals.", steps: ["Observe eating abilities", "Adjust food textures", "Ensure proper posture", "Encourage slow eating", "Monitor safety"], images: [{ image_id: "M3L3_IMG1", prompt: "HD professional illustration of a caregiver assisting safe eating for an elderly person, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M3L3_IMG2", prompt: "HD vector illustration showing proper eating posture in elderly care, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M3L4", title: "Hydration and Fluid Intake", body: "Hydration is vital for elderly health, yet many older adults do not drink enough fluids. Dehydration can cause confusion, weakness, and serious health problems.", summary: "Hydration support prevents dehydration and promotes health and comfort.", steps: ["Encourage regular fluid intake", "Offer preferred beverages", "Monitor hydration signs", "Support routines", "Prevent dehydration"], images: [{ image_id: "M3L4_IMG1", prompt: "HD professional illustration of a caregiver offering water to an elderly person at home, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M3L4_IMG2", prompt: "HD vector illustration showing hydration support in elderly care, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M3L5", title: "Managing Special Dietary Needs", body: "Managing special dietary needs is an important responsibility in elderly care because many older adults have medical conditions or sensitivities that affect what they can eat.", summary: "Managing special dietary needs protects elderly health through careful preparation and strict guideline adherence.", steps: ["Understand dietary restrictions", "Follow provided guidelines carefully", "Adjust meal preparation as needed", "Prevent cross contamination", "Report concerns or changes"], images: [{ image_id: "M3L5_IMG1", prompt: "HD professional illustration of a caregiver preparing a special diet meal for an elderly person, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M3L5_IMG2", prompt: "HD vector illustration showing careful food preparation for dietary needs, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M3L6", title: "Food Safety in Home Care", body: "Food safety is critical in elderly care because older adults are more vulnerable to foodborne illness. Proper food handling, storage, and preparation reduce health risks.", summary: "Food safety prevents illness and ensures meals are safe and healthy for elderly individuals.", steps: ["Maintain clean food preparation areas", "Cook food thoroughly", "Store food safely", "Check expiration dates", "Dispose of unsafe food"], images: [{ image_id: "M3L6_IMG1", prompt: "HD professional illustration of a caregiver practicing food safety in a home kitchen, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M3L6_IMG2", prompt: "HD vector illustration showing safe food storage practices in elderly care, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M3L7", title: "Encouraging Healthy Eating Habits", body: "Encouraging healthy eating habits supports long-term well-being in elderly individuals. Eating habits can be influenced by routine, mood, and physical comfort.", summary: "Healthy eating habits improve nutrition, mood, and overall well-being in elderly care.", steps: ["Maintain consistent meal times", "Improve meal presentation", "Encourage without pressure", "Monitor appetite changes", "Support balanced nutrition"], images: [{ image_id: "M3L7_IMG1", prompt: "HD professional illustration of a caregiver encouraging healthy eating habits, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M3L7_IMG2", prompt: "HD vector illustration showing positive mealtime environment in elderly care, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M3L8", title: "Nutrition Practice and Daily Routines", body: "Nutrition practice and daily routines help transform nutrition knowledge into consistent care. Establishing routines ensures elderly individuals receive regular, balanced meals.", summary: "Daily nutrition routines ensure consistent, safe, and supportive elderly care.", steps: ["Establish daily nutrition routines", "Support hydration consistently", "Observe eating habits", "Adjust routines as needed", "Maintain consistency"], images: [{ image_id: "M3L8_IMG1", prompt: "HD professional illustration of a caregiver following a daily nutrition routine with an elderly person, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M3L8_IMG2", prompt: "HD vector illustration showing organized meal and hydration routine in elderly care, clean professional design, NO TEXT IN IMAGE" }] }
    ]
  },
  {
    module_id: "M4",
    title: "Personal Care and Daily Assistance",
    lessons: [
      { lesson_id: "M4L1", title: "Assisting with Personal Grooming", body: "Personal grooming is an important part of daily care for elderly individuals. Grooming supports hygiene, comfort, self-esteem, and dignity.", summary: "Personal grooming assistance promotes hygiene, comfort, and dignity through respectful and gentle care.", steps: ["Prepare grooming supplies and environment", "Communicate clearly and respectfully", "Assist gently with grooming tasks", "Encourage participation where possible", "Observe skin and comfort"], images: [{ image_id: "M4L1_IMG1", prompt: "HD professional illustration of a caregiver assisting an elderly person with personal grooming at home, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M4L1_IMG2", prompt: "HD vector illustration showing gentle grooming support in elderly care, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M4L2", title: "Bathing and Toileting Support", body: "Bathing and toileting support are sensitive but essential aspects of elderly care. These activities affect hygiene, comfort, and dignity.", summary: "Bathing and toileting support maintain hygiene and dignity through safe and respectful care practices.", steps: ["Ensure safety before bathing or toileting", "Maintain privacy and dignity", "Assist gently and patiently", "Support hygiene after toileting", "Observe and report changes"], images: [{ image_id: "M4L2_IMG1", prompt: "HD professional illustration of a caregiver assisting safe bathing for an elderly person, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M4L2_IMG2", prompt: "HD vector illustration showing respectful toileting support in home care, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M4L3", title: "Dressing and Clothing Assistance", body: "Dressing and clothing assistance help elderly individuals remain comfortable, safe, and confident. Physical limitations may make dressing difficult.", summary: "Dressing assistance promotes comfort, safety, and independence through patient and respectful care.", steps: ["Choose comfortable and safe clothing", "Prepare a private environment", "Assist patiently with dressing", "Encourage independence", "Ensure proper footwear"], images: [{ image_id: "M4L3_IMG1", prompt: "HD professional illustration of a caregiver helping an elderly person dress comfortably, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M4L3_IMG2", prompt: "HD vector illustration showing supportive dressing assistance in elderly care, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M4L4", title: "Daily Routines and Independence", body: "Daily routines provide structure, comfort, and stability for elderly individuals. Consistent routines support physical health, emotional well-being, and independence.", summary: "Daily routines support independence, comfort, and stability in elderly care.", steps: ["Establish consistent daily routines", "Encourage independence within tasks", "Maintain flexibility", "Observe routine effectiveness", "Adjust support as needed"], images: [{ image_id: "M4L4_IMG1", prompt: "HD professional illustration of a caregiver supporting daily routines for an elderly person at home, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M4L4_IMG2", prompt: "HD vector illustration showing structured daily routine in elderly care, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M4L5", title: "Assisting with Mobility Inside the Home", body: "Assisting with mobility inside the home is a critical responsibility for home care assistants. Many elderly individuals experience reduced balance, muscle weakness, or joint stiffness.", summary: "Mobility assistance inside the home helps prevent falls and supports safe independence.", steps: ["Assess the home environment", "Communicate clearly before movement", "Support steady and safe movement", "Use correct body positioning", "Encourage independence"], images: [{ image_id: "M4L5_IMG1", prompt: "HD professional illustration of a caregiver assisting an elderly person walking safely inside the home, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M4L5_IMG2", prompt: "HD vector illustration showing safe indoor mobility assistance in elderly care, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M4L6", title: "Supporting Rest and Sleep", body: "Rest and sleep are essential for physical recovery, mental clarity, and emotional well-being. Many elderly individuals experience sleep changes due to aging.", summary: "Proper rest and sleep support physical and emotional well-being.", steps: ["Create a restful environment", "Establish bedtime routines", "Promote comfort", "Monitor sleep patterns", "Report sleep concerns"], images: [{ image_id: "M4L6_IMG1", prompt: "HD professional illustration of a comfortable bedroom prepared for elderly rest, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M4L6_IMG2", prompt: "HD vector illustration showing restful sleep environment in elderly care, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M4L7", title: "Supporting Continence and Dignity", body: "Supporting continence is an important and sensitive part of elderly care. Many older adults experience changes in bladder or bowel control.", summary: "Continence support maintains dignity and health through respectful and observant care.", steps: ["Understand continence needs", "Support routines respectfully", "Manage incontinence with dignity", "Maintain hygiene", "Observe and report changes"], images: [{ image_id: "M4L7_IMG1", prompt: "HD professional illustration of a caregiver providing respectful continence support, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M4L7_IMG2", prompt: "HD vector illustration showing dignified elderly care practices, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M4L8", title: "Personal Care Practice and Daily Review", body: "Personal care practice and daily review ensure care remains consistent, respectful, and effective. Reflecting on care practices helps identify improvements.", summary: "Daily review of personal care ensures quality, dignity, and continuous improvement.", steps: ["Review care practices regularly", "Identify areas for improvement", "Maintain dignity in all care", "Adjust based on feedback", "Ensure consistency"], images: [{ image_id: "M4L8_IMG1", prompt: "HD professional illustration of a caregiver reviewing care notes, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M4L8_IMG2", prompt: "HD vector illustration showing professional care planning in elderly care, clean professional design, NO TEXT IN IMAGE" }] }
    ]
  },
  {
    module_id: "M5",
    title: "Communication, Behavior, and Emotional Well-Being",
    lessons: [
      { lesson_id: "M5L1", title: "Effective Communication with Elderly Individuals", body: "Effective communication is fundamental to quality elderly care. Clear, patient, and respectful communication helps build trust and ensures needs are understood.", summary: "Effective communication builds trust and ensures elderly individuals feel heard and respected.", steps: ["Use clear and simple language", "Practice active listening", "Be patient with responses", "Observe non-verbal communication", "Confirm understanding"], images: [{ image_id: "M5L1_IMG1", prompt: "HD professional illustration of a caregiver communicating effectively with an elderly person, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M5L1_IMG2", prompt: "HD vector illustration showing active listening in elderly care, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M5L2", title: "Understanding Emotional Needs", body: "Understanding emotional needs helps caregivers provide holistic support. Elderly individuals may experience loneliness, grief, anxiety, or frustration.", summary: "Understanding emotional needs enables compassionate and effective elderly care.", steps: ["Recognize emotional expressions", "Provide empathetic responses", "Offer reassurance", "Support social connections", "Respect emotional boundaries"], images: [{ image_id: "M5L2_IMG1", prompt: "HD professional illustration of a caregiver providing emotional support to an elderly person, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M5L2_IMG2", prompt: "HD vector illustration showing compassionate elderly care interaction, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M5L3", title: "Dealing with Challenging Behaviors", body: "Challenging behaviors may occur in elderly care due to confusion, frustration, pain, or cognitive decline. Understanding and responding appropriately is essential.", summary: "Managing challenging behaviors requires patience, understanding, and appropriate responses.", steps: ["Identify possible causes", "Remain calm and patient", "Use de-escalation techniques", "Avoid confrontation", "Report significant changes"], images: [{ image_id: "M5L3_IMG1", prompt: "HD professional illustration of a calm caregiver managing difficult situations, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M5L3_IMG2", prompt: "HD vector illustration showing patient elderly care interaction, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M5L4", title: "Supporting Mental Well-Being", body: "Supporting mental well-being is an important aspect of elderly care. Mental health affects physical health, quality of life, and independence.", summary: "Mental well-being support promotes overall health and quality of life.", steps: ["Encourage social interaction", "Support meaningful activities", "Monitor mood changes", "Provide emotional support", "Report concerns"], images: [{ image_id: "M5L4_IMG1", prompt: "HD professional illustration of an elderly person engaged in meaningful activity with caregiver support, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M5L4_IMG2", prompt: "HD vector illustration showing mental wellness support in elderly care, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M5L5", title: "Communicating with Families", body: "Communicating with families is an important responsibility in home care. Families want to stay informed about their loved one's care and well-being.", summary: "Professional family communication builds trust and supports coordinated care.", steps: ["Maintain professionalism", "Share relevant updates", "Listen to family concerns", "Respect confidentiality", "Set communication expectations"], images: [{ image_id: "M5L5_IMG1", prompt: "HD professional illustration of a caregiver speaking with family members, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M5L5_IMG2", prompt: "HD vector illustration showing professional family communication in elderly care, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M5L6", title: "Understanding Dementia and Cognitive Changes", body: "Understanding dementia and cognitive changes helps caregivers provide appropriate, patient, and compassionate care. Cognitive decline affects memory, reasoning, and behavior.", summary: "Understanding cognitive changes enables patient and effective dementia care.", steps: ["Recognize cognitive decline signs", "Communicate appropriately", "Create supportive routines", "Manage confusion calmly", "Report significant changes"], images: [{ image_id: "M5L6_IMG1", prompt: "HD professional illustration of a caregiver patiently supporting an elderly person with cognitive challenges, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M5L6_IMG2", prompt: "HD vector illustration showing compassionate dementia care, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M5L7", title: "Building Trust and Rapport", body: "Building trust and rapport is essential for effective elderly care. A positive relationship makes care easier and more meaningful for both caregiver and elderly individual.", summary: "Trust and rapport create the foundation for effective and compassionate care.", steps: ["Be consistent and reliable", "Show genuine interest", "Respect preferences", "Maintain confidentiality", "Communicate openly"], images: [{ image_id: "M5L7_IMG1", prompt: "HD professional illustration of a trusting relationship between caregiver and elderly person, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M5L7_IMG2", prompt: "HD vector illustration showing positive caregiver rapport, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M5L8", title: "Emotional Support Practice", body: "Emotional support practice helps transform communication and behavioral knowledge into consistent, compassionate care actions.", summary: "Regular emotional support practice improves care quality and caregiver effectiveness.", steps: ["Practice active listening daily", "Reflect on interactions", "Develop patience", "Seek feedback", "Continue learning"], images: [{ image_id: "M5L8_IMG1", prompt: "HD professional illustration of a caregiver practicing emotional support skills, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M5L8_IMG2", prompt: "HD vector illustration showing professional development in elderly care, clean professional design, NO TEXT IN IMAGE" }] }
    ]
  },
  {
    module_id: "M6",
    title: "Safety, Environment, and Home Organization",
    lessons: [
      { lesson_id: "M6L1", title: "Home Safety Assessment", body: "Home safety assessment identifies hazards and ensures the living environment supports safe, comfortable elderly care.", summary: "Home safety assessment prevents accidents and promotes a secure living environment.", steps: ["Walk through all areas", "Identify potential hazards", "Check lighting and accessibility", "Assess bathroom safety", "Document concerns"], images: [{ image_id: "M6L1_IMG1", prompt: "HD professional illustration of a caregiver assessing home safety, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M6L1_IMG2", prompt: "HD vector illustration showing home hazard identification, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M6L2", title: "Creating a Safe Living Space", body: "Creating a safe living space involves modifying the home environment to prevent falls, injuries, and accidents while promoting independence.", summary: "Safe living spaces support independence and prevent accidents in elderly care.", steps: ["Remove trip hazards", "Improve lighting", "Secure furniture", "Organize for accessibility", "Install safety equipment"], images: [{ image_id: "M6L2_IMG1", prompt: "HD professional illustration of a safe and organized elderly living space, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M6L2_IMG2", prompt: "HD vector illustration showing elderly-friendly home modifications, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M6L3", title: "Fire Safety and Prevention", body: "Fire safety is critical in elderly care. Older adults may have reduced mobility or awareness that increases fire risk.", summary: "Fire safety awareness and prevention protect elderly individuals and caregivers.", steps: ["Check smoke detectors", "Identify fire hazards", "Plan escape routes", "Practice fire prevention", "Know emergency procedures"], images: [{ image_id: "M6L3_IMG1", prompt: "HD professional illustration of fire safety equipment in a home, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M6L3_IMG2", prompt: "HD vector illustration showing fire safety awareness in elderly care, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M6L4", title: "Bathroom Safety", body: "Bathroom safety is especially important because bathrooms present significant fall and injury risks for elderly individuals.", summary: "Bathroom safety modifications prevent falls and support dignified personal care.", steps: ["Install grab bars", "Use non-slip surfaces", "Ensure adequate lighting", "Organize for accessibility", "Monitor temperature"], images: [{ image_id: "M6L4_IMG1", prompt: "HD professional illustration of a safe bathroom setup for elderly care, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M6L4_IMG2", prompt: "HD vector illustration showing bathroom safety features, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M6L5", title: "Bedroom Safety and Comfort", body: "Bedroom safety and comfort support restful sleep and safe movement for elderly individuals.", summary: "Bedroom safety ensures restful sleep and prevents nighttime accidents.", steps: ["Arrange furniture safely", "Ensure bed accessibility", "Provide adequate lighting", "Remove floor hazards", "Maintain comfortable temperature"], images: [{ image_id: "M6L5_IMG1", prompt: "HD professional illustration of a safe elderly bedroom setup, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M6L5_IMG2", prompt: "HD vector illustration showing bedroom safety in elderly care, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M6L6", title: "Kitchen Safety", body: "Kitchen safety is important because kitchens contain multiple hazards including sharp objects, hot surfaces, and slippery floors.", summary: "Kitchen safety prevents burns, cuts, and falls in elderly care environments.", steps: ["Organize for accessibility", "Prevent burns and scalds", "Ensure food safety", "Monitor appliance use", "Maintain cleanliness"], images: [{ image_id: "M6L6_IMG1", prompt: "HD professional illustration of a safe kitchen setup for elderly care, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M6L6_IMG2", prompt: "HD vector illustration showing kitchen safety practices, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M6L7", title: "Outdoor Safety", body: "Outdoor safety helps elderly individuals enjoy outdoor spaces while minimizing fall and injury risks.", summary: "Outdoor safety supports safe mobility and enjoyment of outside areas.", steps: ["Assess outdoor hazards", "Ensure stable walkways", "Provide seating options", "Plan for weather", "Supervise appropriately"], images: [{ image_id: "M6L7_IMG1", prompt: "HD professional illustration of an elderly person safely enjoying outdoor space with caregiver, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M6L7_IMG2", prompt: "HD vector illustration showing safe outdoor environment for elderly, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M6L8", title: "Environmental Safety Review", body: "Environmental safety review ensures all areas of the home remain safe and accessible as needs change.", summary: "Regular safety reviews maintain a secure and accessible living environment.", steps: ["Conduct regular assessments", "Update safety measures", "Address new hazards", "Involve elderly individual", "Document improvements"], images: [{ image_id: "M6L8_IMG1", prompt: "HD professional illustration of a caregiver documenting home safety review, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M6L8_IMG2", prompt: "HD vector illustration showing comprehensive home safety evaluation, clean professional design, NO TEXT IN IMAGE" }] }
    ]
  }
];

async function main() {
  console.log('🏥 Completing Home Care and Elderly Support Course with R2 Images');
  console.log('='.repeat(60));

  const [course] = await db.select().from(courses).where(eq(courses.title, COURSE_TITLE));
  if (!course) {
    console.error('Course not found!');
    return;
  }
  console.log(`Found course: ${course.title} (${course.id})`);

  for (const moduleData of REMAINING_MODULES) {
    console.log(`\n📚 Processing Module: ${moduleData.title}`);
    
    let [existingModule] = await db.select().from(modules).where(
      and(eq(modules.courseId, course.id), eq(modules.title, moduleData.title))
    );
    
    if (!existingModule) {
      console.log(`  Creating new module: ${moduleData.title}`);
      const [newModule] = await db.insert(modules).values({
        courseId: course.id,
        title: moduleData.title,
        description: `Module on ${moduleData.title}`,
      }).returning();
      existingModule = newModule;
    }
    
    for (const lessonData of moduleData.lessons) {
      if (moduleData.start_from_lesson) {
        const lessonNum = parseInt(lessonData.lesson_id.replace(/M\d+L/, ''));
        const startNum = parseInt(moduleData.start_from_lesson.replace(/M\d+L/, ''));
        if (lessonNum < startNum) {
          console.log(`  Skipping lesson ${lessonData.lesson_id} (already exists)`);
          continue;
        }
      }
      
      const [existingLesson] = await db.select().from(lessons).where(
        and(eq(lessons.moduleId, existingModule.id), eq(lessons.title, lessonData.title))
      );
      
      if (existingLesson) {
        console.log(`  Lesson already exists: ${lessonData.title}`);
        continue;
      }
      
      console.log(`  📖 Creating lesson: ${lessonData.title}`);
      
      const imageUrls: string[] = [];
      for (const img of lessonData.images) {
        const url = await generateAndUploadImage(img.prompt, img.image_id);
        imageUrls.push(url);
        await new Promise(r => setTimeout(r, 1000));
      }
      
      const lessonOrder = parseInt(lessonData.lesson_id.replace(/M\d+L/, ''));
      const [newLesson] = await db.insert(lessons).values({
        moduleId: existingModule.id,
        title: lessonData.title,
        content: lessonData.body,
        orderNum: lessonOrder,
      }).returning();
      
      await createLessonContentBlocks(
        newLesson.id,
        lessonData.body,
        lessonData.summary,
        lessonData.steps,
        imageUrls
      );
      
      console.log(`  ✅ Created lesson with ${imageUrls.length} images on R2`);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ Course completion finished!');
}

main().catch(console.error);
