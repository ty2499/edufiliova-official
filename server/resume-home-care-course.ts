import OpenAI from "openai";
import { v2 as cloudinary } from 'cloudinary';
import { db } from './db';
import { courses, modules, lessons, lessonContentBlocks } from '../shared/schema';
import { eq, and } from 'drizzle-orm';
import https from 'https';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const COURSE_TITLE = 'Home Care and Elderly Support';

function initCloudinary() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  console.log(`Cloudinary configured for cloud: ${process.env.CLOUDINARY_CLOUD_NAME}`);
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
        imgRes.on('end', () => {
          const buffer = Buffer.concat(chunks);
          const base64 = buffer.toString('base64');
          const dataUri = `data:image/png;base64,${base64}`;
          
          cloudinary.uploader.upload(dataUri, {
            folder: 'courses/home-care/lessons',
            public_id: imageId,
            resource_type: 'image'
          }, (error, result) => {
            if (error) reject(error);
            else {
              console.log(`  Uploaded: ${imageId}`);
              resolve(result!.secure_url);
            }
          });
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
  lessonId: string,
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

const M2L8 = {
  lesson_id: "M2L8",
  title: "Safety Practice and Daily Routines",
  body: "Safety practice and daily routines help turn safety knowledge into consistent habits. In elderly care, routine safety actions reduce risks and improve quality of care.",
  summary: "Daily safety routines ensure consistent protection and professional elderly care.",
  steps: ["Apply safety checks daily", "Maintain consistent routines", "Adjust based on needs", "Report hazards promptly", "Improve safety practices"],
  images: [
    { image_id: "M2L8_IMG1", prompt: "HD professional illustration of a caregiver performing daily safety checks in a home, modern flat style, NO TEXT IN IMAGE" },
    { image_id: "M2L8_IMG2", prompt: "HD vector illustration showing safe and organized elderly care environment, clean professional design, NO TEXT IN IMAGE" }
  ]
};

const REMAINING_MODULES = [
  {
    module_id: "M3",
    title: "Nutrition, Meals, and Hydration in Elderly Care",
    lessons: [
      { lesson_id: "M3L1", title: "Understanding Elderly Nutrition Needs", body: "Proper nutrition is essential for maintaining health, energy, and quality of life in elderly individuals. As people age, their nutritional needs change due to slower metabolism, reduced appetite, and changes in digestion.", summary: "Understanding nutrition needs helps caregivers support healthy aging through balanced, appropriate meals.", steps: ["Understand age-related nutrition changes", "Focus on nutrient-dense foods", "Support protein and bone health", "Address digestion and appetite changes", "Respect food preferences"], images: [{ image_id: "M3L1_IMG1", prompt: "HD professional illustration of balanced nutritious meals prepared for an elderly person, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M3L1_IMG2", prompt: "HD vector illustration showing healthy food options suitable for elderly nutrition, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M3L2", title: "Meal Planning and Preparation", body: "Meal planning and preparation are important responsibilities in home care. Proper planning ensures meals are nutritious, safe, and suited to the elderly individual's needs.", summary: "Meal planning and preparation ensure nutritious, safe, and consistent meals for elderly individuals.", steps: ["Review dietary needs", "Plan balanced meals", "Follow food safety practices", "Prepare meals carefully", "Encourage participation"], images: [{ image_id: "M3L2_IMG1", prompt: "HD professional illustration of a caregiver preparing a meal in a clean home kitchen, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M3L2_IMG2", prompt: "HD vector illustration showing organized meal planning for elderly care, clean professional design, NO TEXT IN IMAGE" }] },
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
  },
  {
    module_id: "M7",
    title: "Health Observation and Reporting",
    lessons: [
      { lesson_id: "M7L1", title: "Understanding Health Observation", body: "Health observation helps caregivers notice changes in an elderly individual's condition that may require attention or medical care.", summary: "Health observation enables early detection of changes and appropriate reporting.", steps: ["Observe daily changes", "Notice physical symptoms", "Monitor behavior changes", "Track patterns", "Document observations"], images: [{ image_id: "M7L1_IMG1", prompt: "HD professional illustration of a caregiver observing elderly health conditions, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M7L1_IMG2", prompt: "HD vector illustration showing health monitoring in elderly care, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M7L2", title: "Recognizing Common Health Changes", body: "Recognizing common health changes helps caregivers respond appropriately to symptoms that may indicate illness or declining health.", summary: "Recognition of health changes enables timely intervention and care.", steps: ["Know common symptoms", "Recognize changes in function", "Identify pain indicators", "Notice appetite changes", "Observe skin changes"], images: [{ image_id: "M7L2_IMG1", prompt: "HD professional illustration of health assessment in elderly care, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M7L2_IMG2", prompt: "HD vector illustration showing symptom recognition, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M7L3", title: "Vital Signs Awareness", body: "Vital signs awareness helps caregivers understand basic health indicators even though they may not measure them directly.", summary: "Vital signs awareness supports health monitoring and appropriate reporting.", steps: ["Understand temperature indications", "Recognize breathing changes", "Notice pulse awareness", "Observe blood pressure effects", "Know normal ranges"], images: [{ image_id: "M7L3_IMG1", prompt: "HD professional illustration of health monitoring concepts, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M7L3_IMG2", prompt: "HD vector illustration showing vital signs awareness, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M7L4", title: "Pain Recognition and Response", body: "Pain recognition helps caregivers identify when elderly individuals are uncomfortable and need intervention or reporting.", summary: "Pain recognition enables compassionate response and appropriate care.", steps: ["Observe pain indicators", "Ask about discomfort", "Note non-verbal signs", "Respond appropriately", "Report significant pain"], images: [{ image_id: "M7L4_IMG1", prompt: "HD professional illustration of a caregiver assessing comfort levels, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M7L4_IMG2", prompt: "HD vector illustration showing pain assessment in elderly care, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M7L5", title: "Reporting to Healthcare Professionals", body: "Reporting to healthcare professionals ensures important observations reach those who can provide medical intervention.", summary: "Effective reporting ensures continuity of care and appropriate medical response.", steps: ["Document observations clearly", "Report significant changes", "Use proper communication channels", "Provide specific details", "Follow up as needed"], images: [{ image_id: "M7L5_IMG1", prompt: "HD professional illustration of a caregiver reporting to healthcare professionals, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M7L5_IMG2", prompt: "HD vector illustration showing professional healthcare communication, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M7L6", title: "Documentation and Record Keeping", body: "Documentation and record keeping support quality care by maintaining accurate information about the elderly individual's condition and care.", summary: "Proper documentation ensures continuity and quality of elderly care.", steps: ["Record observations accurately", "Use appropriate formats", "Maintain confidentiality", "Update regularly", "Ensure accessibility"], images: [{ image_id: "M7L6_IMG1", prompt: "HD professional illustration of a caregiver maintaining care records, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M7L6_IMG2", prompt: "HD vector illustration showing documentation in elderly care, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M7L7", title: "Working with Care Teams", body: "Working with care teams ensures coordinated care and shared information among all those supporting the elderly individual.", summary: "Team coordination ensures comprehensive and consistent elderly care.", steps: ["Communicate with team members", "Share relevant information", "Respect roles and responsibilities", "Attend care meetings", "Support coordinated care"], images: [{ image_id: "M7L7_IMG1", prompt: "HD professional illustration of care team coordination, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M7L7_IMG2", prompt: "HD vector illustration showing collaborative elderly care, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M7L8", title: "Health Monitoring Best Practices", body: "Health monitoring best practices ensure consistent, accurate observation and reporting that supports quality elderly care.", summary: "Best practices in health monitoring improve care quality and outcomes.", steps: ["Establish monitoring routines", "Use consistent methods", "Stay objective", "Prioritize significant changes", "Continuously improve skills"], images: [{ image_id: "M7L8_IMG1", prompt: "HD professional illustration of health monitoring best practices, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M7L8_IMG2", prompt: "HD vector illustration showing professional health observation, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M7L9", title: "Health Observation Practice", body: "Health observation practice reinforces skills through regular application and reflection on observation and reporting techniques.", summary: "Regular practice improves observation accuracy and reporting effectiveness.", steps: ["Practice daily observation", "Reflect on accuracy", "Seek feedback", "Improve documentation", "Develop pattern recognition"], images: [{ image_id: "M7L9_IMG1", prompt: "HD professional illustration of a caregiver developing observation skills, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M7L9_IMG2", prompt: "HD vector illustration showing skill development in elderly care, clean professional design, NO TEXT IN IMAGE" }] }
    ]
  },
  {
    module_id: "M8",
    title: "End-of-Life Care Basics and Compassionate Support",
    lessons: [
      { lesson_id: "M8L1", title: "Understanding End-of-Life Care", body: "Understanding end-of-life care helps caregivers provide compassionate support during a difficult and sensitive time.", summary: "End-of-life care focuses on comfort, dignity, and compassionate support.", steps: ["Understand palliative focus", "Recognize care goals", "Support comfort measures", "Respect wishes", "Work with care team"], images: [{ image_id: "M8L1_IMG1", prompt: "HD professional illustration of compassionate end-of-life care, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M8L1_IMG2", prompt: "HD vector illustration showing peaceful elderly care environment, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M8L2", title: "Comfort Care Basics", body: "Comfort care basics focus on maintaining physical comfort and quality of life for elderly individuals in their final stages.", summary: "Comfort care prioritizes pain relief, dignity, and peaceful support.", steps: ["Support pain management", "Maintain hygiene gently", "Ensure comfortable positioning", "Manage symptoms", "Create peaceful environment"], images: [{ image_id: "M8L2_IMG1", prompt: "HD professional illustration of comfort care for elderly, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M8L2_IMG2", prompt: "HD vector illustration showing gentle comfort measures, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M8L3", title: "Emotional Support at End of Life", body: "Emotional support at end of life helps both the elderly individual and their loved ones cope with this difficult transition.", summary: "Emotional support provides comfort and connection during end-of-life care.", steps: ["Be present and calm", "Listen without judgment", "Offer gentle reassurance", "Respect grief expressions", "Support family members"], images: [{ image_id: "M8L3_IMG1", prompt: "HD professional illustration of emotional support in end-of-life care, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M8L3_IMG2", prompt: "HD vector illustration showing compassionate presence, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M8L4", title: "Communication During End of Life", body: "Communication during end of life requires sensitivity, patience, and awareness of the elderly individual's changing needs.", summary: "Sensitive communication supports dignity and connection at end of life.", steps: ["Speak gently and calmly", "Listen actively", "Respect silence", "Use touch appropriately", "Include family communication"], images: [{ image_id: "M8L4_IMG1", prompt: "HD professional illustration of gentle communication in end-of-life care, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M8L4_IMG2", prompt: "HD vector illustration showing sensitive caregiver communication, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M8L5", title: "Supporting Families", body: "Supporting families during end-of-life care helps them cope with grief and participate meaningfully in their loved one's care.", summary: "Family support ensures comprehensive care during difficult times.", steps: ["Provide information sensitively", "Respect family wishes", "Offer emotional support", "Facilitate involvement", "Communicate regularly"], images: [{ image_id: "M8L5_IMG1", prompt: "HD professional illustration of a caregiver supporting family members, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M8L5_IMG2", prompt: "HD vector illustration showing family support in elderly care, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M8L6", title: "Cultural and Spiritual Considerations", body: "Cultural and spiritual considerations help caregivers respect beliefs and practices that are important to the elderly individual and their family.", summary: "Respecting cultural and spiritual needs supports meaningful end-of-life care.", steps: ["Learn about cultural practices", "Respect spiritual beliefs", "Accommodate traditions", "Involve spiritual support", "Show sensitivity"], images: [{ image_id: "M8L6_IMG1", prompt: "HD professional illustration of culturally sensitive elderly care, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M8L6_IMG2", prompt: "HD vector illustration showing spiritual support in care, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M8L7", title: "Self-Care for Caregivers", body: "Self-care for caregivers is essential because providing end-of-life care can be emotionally demanding.", summary: "Caregiver self-care ensures sustainable, compassionate care delivery.", steps: ["Recognize emotional impact", "Practice stress management", "Seek support", "Maintain boundaries", "Take breaks"], images: [{ image_id: "M8L7_IMG1", prompt: "HD professional illustration of caregiver self-care and wellness, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M8L7_IMG2", prompt: "HD vector illustration showing caregiver wellbeing, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M8L8", title: "Working with Hospice Teams", body: "Working with hospice teams ensures coordinated care and access to specialized end-of-life support services.", summary: "Hospice collaboration provides comprehensive end-of-life care support.", steps: ["Understand hospice role", "Communicate effectively", "Follow care plans", "Support team decisions", "Contribute observations"], images: [{ image_id: "M8L8_IMG1", prompt: "HD professional illustration of hospice team collaboration, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M8L8_IMG2", prompt: "HD vector illustration showing coordinated end-of-life care, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M8L9", title: "End-of-Life Care Practice", body: "End-of-life care practice helps caregivers develop the sensitivity and skills needed for this important aspect of elderly care.", summary: "Practice and reflection improve end-of-life care quality and caregiver resilience.", steps: ["Reflect on experiences", "Develop emotional skills", "Practice compassion", "Seek guidance", "Continue learning"], images: [{ image_id: "M8L9_IMG1", prompt: "HD professional illustration of caregiver reflection and growth, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M8L9_IMG2", prompt: "HD vector illustration showing professional development in care, clean professional design, NO TEXT IN IMAGE" }] }
    ]
  },
  {
    module_id: "M9",
    title: "Legal, Ethical, and Professional Responsibilities",
    lessons: [
      { lesson_id: "M9L1", title: "Understanding Legal Responsibilities", body: "Understanding legal responsibilities helps caregivers operate within appropriate boundaries and protect both themselves and elderly individuals.", summary: "Legal awareness protects caregivers and elderly individuals through proper practice.", steps: ["Know relevant laws", "Understand scope of practice", "Respect client rights", "Follow employer policies", "Document appropriately"], images: [{ image_id: "M9L1_IMG1", prompt: "HD professional illustration of legal compliance in elderly care, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M9L1_IMG2", prompt: "HD vector illustration showing professional responsibilities, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M9L2", title: "Ethical Principles in Care", body: "Ethical principles guide caregivers in making decisions that respect the dignity, autonomy, and well-being of elderly individuals.", summary: "Ethical practice ensures dignified and respectful elderly care.", steps: ["Respect autonomy", "Maintain beneficence", "Avoid harm", "Practice fairness", "Uphold honesty"], images: [{ image_id: "M9L2_IMG1", prompt: "HD professional illustration of ethical caregiving, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M9L2_IMG2", prompt: "HD vector illustration showing professional ethics in care, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M9L3", title: "Confidentiality and Privacy", body: "Confidentiality and privacy protect the personal information and dignity of elderly individuals in care.", summary: "Maintaining confidentiality builds trust and protects elderly individuals.", steps: ["Protect personal information", "Share only as appropriate", "Secure records", "Respect privacy", "Follow policies"], images: [{ image_id: "M9L3_IMG1", prompt: "HD professional illustration of maintaining confidentiality in care, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M9L3_IMG2", prompt: "HD vector illustration showing privacy protection, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M9L4", title: "Rights of Elderly Individuals", body: "Understanding the rights of elderly individuals helps caregivers provide care that respects dignity, choice, and autonomy.", summary: "Respecting rights ensures dignified and person-centered care.", steps: ["Know fundamental rights", "Support informed consent", "Respect choices", "Advocate appropriately", "Report violations"], images: [{ image_id: "M9L4_IMG1", prompt: "HD professional illustration of respecting elderly rights, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M9L4_IMG2", prompt: "HD vector illustration showing dignity in elderly care, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M9L5", title: "Recognizing and Reporting Abuse", body: "Recognizing and reporting abuse is a critical responsibility for caregivers who must protect vulnerable elderly individuals.", summary: "Abuse recognition and reporting protects elderly individuals from harm.", steps: ["Know abuse signs", "Recognize neglect", "Understand reporting duties", "Follow procedures", "Support investigations"], images: [{ image_id: "M9L5_IMG1", prompt: "HD professional illustration of elder protection and advocacy, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M9L5_IMG2", prompt: "HD vector illustration showing protective care practices, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M9L6", title: "Professional Boundaries", body: "Professional boundaries help caregivers maintain appropriate relationships that protect both themselves and elderly individuals.", summary: "Professional boundaries ensure safe and effective care relationships.", steps: ["Understand appropriate limits", "Maintain objectivity", "Avoid dual relationships", "Manage expectations", "Seek guidance"], images: [{ image_id: "M9L6_IMG1", prompt: "HD professional illustration of professional caregiver boundaries, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M9L6_IMG2", prompt: "HD vector illustration showing appropriate care relationships, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M9L7", title: "Workplace Policies and Procedures", body: "Following workplace policies and procedures ensures consistent, quality care and protects all involved parties.", summary: "Policy compliance ensures quality care and professional accountability.", steps: ["Know employer policies", "Follow procedures", "Understand chain of command", "Report concerns properly", "Participate in training"], images: [{ image_id: "M9L7_IMG1", prompt: "HD professional illustration of workplace policy compliance, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M9L7_IMG2", prompt: "HD vector illustration showing professional procedures, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M9L8", title: "Handling Ethical Dilemmas", body: "Handling ethical dilemmas requires careful consideration of principles, policies, and the best interests of elderly individuals.", summary: "Ethical decision-making skills support appropriate responses to complex situations.", steps: ["Identify the dilemma", "Consider all perspectives", "Apply ethical principles", "Consult when needed", "Document decisions"], images: [{ image_id: "M9L8_IMG1", prompt: "HD professional illustration of thoughtful decision-making in care, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M9L8_IMG2", prompt: "HD vector illustration showing ethical reasoning, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M9L9", title: "Professional Practice Review", body: "Professional practice review helps caregivers maintain high standards and continue developing their skills and knowledge.", summary: "Regular review ensures continued professional development and quality care.", steps: ["Reflect on practice", "Identify improvements", "Seek feedback", "Update knowledge", "Maintain standards"], images: [{ image_id: "M9L9_IMG1", prompt: "HD professional illustration of professional self-assessment, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M9L9_IMG2", prompt: "HD vector illustration showing continuous improvement, clean professional design, NO TEXT IN IMAGE" }] }
    ]
  },
  {
    module_id: "M10",
    title: "Community Resources, Independence, and Long-Term Support",
    lessons: [
      { lesson_id: "M10L1", title: "Understanding Community Resources", body: "Understanding community resources helps caregivers connect elderly individuals with services that support their well-being and independence.", summary: "Knowledge of community resources expands support options for elderly individuals.", steps: ["Identify local resources", "Understand available services", "Know eligibility requirements", "Make appropriate referrals", "Follow up on connections"], images: [{ image_id: "M10L1_IMG1", prompt: "HD professional illustration of community resource connection, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M10L1_IMG2", prompt: "HD vector illustration showing community support network, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M10L2", title: "Supporting Independence", body: "Supporting independence helps elderly individuals maintain control over their lives and continue doing things they value.", summary: "Independence support promotes dignity, well-being, and quality of life.", steps: ["Encourage self-direction", "Adapt support to needs", "Provide appropriate assistance", "Respect choices", "Promote ability maintenance"], images: [{ image_id: "M10L2_IMG1", prompt: "HD professional illustration of supporting elderly independence, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M10L2_IMG2", prompt: "HD vector illustration showing empowering elderly care, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M10L3", title: "Transportation and Mobility Support", body: "Transportation and mobility support helps elderly individuals access services, maintain social connections, and continue activities they value.", summary: "Mobility support maintains social connection and access to needed services.", steps: ["Identify transportation needs", "Know available options", "Support safe travel", "Assist with accessibility", "Encourage appropriate outings"], images: [{ image_id: "M10L3_IMG1", prompt: "HD professional illustration of elderly transportation support, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M10L3_IMG2", prompt: "HD vector illustration showing mobility assistance, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M10L4", title: "Social Activities and Engagement", body: "Social activities and engagement support mental health, emotional well-being, and quality of life for elderly individuals.", summary: "Social engagement reduces isolation and promotes overall well-being.", steps: ["Encourage social participation", "Identify appropriate activities", "Support hobby continuation", "Facilitate connections", "Respect preferences"], images: [{ image_id: "M10L4_IMG1", prompt: "HD professional illustration of elderly social engagement, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M10L4_IMG2", prompt: "HD vector illustration showing active elderly lifestyle, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M10L5", title: "Technology for Independence", body: "Technology can support independence by helping elderly individuals stay connected, safe, and engaged.", summary: "Appropriate technology supports safety, connection, and independence.", steps: ["Identify helpful technologies", "Support basic technology use", "Address safety features", "Encourage communication tools", "Respect comfort levels"], images: [{ image_id: "M10L5_IMG1", prompt: "HD professional illustration of elderly using technology safely, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M10L5_IMG2", prompt: "HD vector illustration showing technology assistance for elderly, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M10L6", title: "Financial Awareness and Protection", body: "Financial awareness helps caregivers support elderly individuals while protecting them from exploitation.", summary: "Financial protection supports security and prevents exploitation.", steps: ["Recognize financial needs", "Identify vulnerability signs", "Protect against exploitation", "Support appropriate resources", "Report concerns"], images: [{ image_id: "M10L6_IMG1", prompt: "HD professional illustration of financial protection for elderly, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M10L6_IMG2", prompt: "HD vector illustration showing security awareness, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M10L7", title: "Long-Term Care Planning", body: "Long-term care planning helps elderly individuals and families prepare for changing needs over time.", summary: "Care planning supports informed decisions about future needs.", steps: ["Understand care options", "Support family discussions", "Recognize changing needs", "Provide appropriate information", "Respect decisions"], images: [{ image_id: "M10L7_IMG1", prompt: "HD professional illustration of care planning discussion, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M10L7_IMG2", prompt: "HD vector illustration showing future care consideration, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M10L8", title: "Transitioning Care Levels", body: "Transitioning care levels involves supporting elderly individuals as their needs change and different care arrangements become necessary.", summary: "Smooth transitions support well-being during care level changes.", steps: ["Recognize changing needs", "Support transition planning", "Ensure continuity", "Provide emotional support", "Communicate appropriately"], images: [{ image_id: "M10L8_IMG1", prompt: "HD professional illustration of care transition support, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M10L8_IMG2", prompt: "HD vector illustration showing supportive care changes, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M10L9", title: "Community Support Practice", body: "Community support practice helps caregivers develop skills in connecting elderly individuals with appropriate resources and services.", summary: "Practice improves ability to support independence and community connection.", steps: ["Research local resources", "Practice making connections", "Follow up on referrals", "Evaluate effectiveness", "Expand knowledge"], images: [{ image_id: "M10L9_IMG1", prompt: "HD professional illustration of community resource coordination, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M10L9_IMG2", prompt: "HD vector illustration showing resource connection skills, clean professional design, NO TEXT IN IMAGE" }] }
    ]
  },
  {
    module_id: "M11",
    title: "Emergency Awareness and Basic Response",
    lessons: [
      { lesson_id: "M11L1", title: "Emergency Preparedness Overview", body: "Emergency preparedness helps caregivers respond effectively when unexpected situations occur in elderly care.", summary: "Preparedness enables effective emergency response and protection.", steps: ["Understand common emergencies", "Know emergency contacts", "Review emergency plans", "Prepare supplies", "Practice responses"], images: [{ image_id: "M11L1_IMG1", prompt: "HD professional illustration of emergency preparedness in home care, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M11L1_IMG2", prompt: "HD vector illustration showing emergency planning, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M11L2", title: "Recognizing Medical Emergencies", body: "Recognizing medical emergencies enables caregivers to respond quickly and appropriately to protect elderly individuals.", summary: "Early recognition of emergencies enables timely response and intervention.", steps: ["Know warning signs", "Recognize sudden changes", "Identify serious symptoms", "Assess urgency", "Act appropriately"], images: [{ image_id: "M11L2_IMG1", prompt: "HD professional illustration of recognizing medical emergency signs, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M11L2_IMG2", prompt: "HD vector illustration showing emergency recognition, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M11L3", title: "Calling for Help", body: "Calling for help effectively ensures emergency services can respond quickly and appropriately to elderly care situations.", summary: "Effective communication with emergency services enables rapid response.", steps: ["Know when to call", "Provide clear information", "Stay calm", "Follow instructions", "Remain available"], images: [{ image_id: "M11L3_IMG1", prompt: "HD professional illustration of calling emergency services, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M11L3_IMG2", prompt: "HD vector illustration showing emergency communication, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M11L4", title: "Basic First Aid Awareness", body: "Basic first aid awareness helps caregivers provide initial assistance while waiting for professional medical help.", summary: "First aid awareness enables appropriate initial response to injuries and illness.", steps: ["Know basic techniques", "Understand limitations", "Maintain first aid supplies", "Stay current with training", "Know when to act"], images: [{ image_id: "M11L4_IMG1", prompt: "HD professional illustration of basic first aid in elderly care, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M11L4_IMG2", prompt: "HD vector illustration showing first aid awareness, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M11L5", title: "Fall Response", body: "Fall response helps caregivers respond safely and appropriately when elderly individuals experience falls.", summary: "Proper fall response protects elderly individuals and prevents further injury.", steps: ["Stay calm", "Assess before moving", "Provide reassurance", "Seek appropriate help", "Document and report"], images: [{ image_id: "M11L5_IMG1", prompt: "HD professional illustration of safe fall response, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M11L5_IMG2", prompt: "HD vector illustration showing proper fall assessment, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M11L6", title: "Choking Response", body: "Choking response skills help caregivers respond appropriately when elderly individuals experience airway obstruction.", summary: "Choking awareness enables appropriate response to protect airway.", steps: ["Recognize choking signs", "Encourage coughing if possible", "Know when to intervene", "Call for help", "Stay with person"], images: [{ image_id: "M11L6_IMG1", prompt: "HD professional illustration of choking emergency awareness, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M11L6_IMG2", prompt: "HD vector illustration showing choking response, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M11L7", title: "Fire and Evacuation Response", body: "Fire and evacuation response prepares caregivers to protect elderly individuals during fire emergencies.", summary: "Fire response skills protect lives during fire emergencies.", steps: ["Know evacuation routes", "Assist safe evacuation", "Close doors behind", "Call emergency services", "Account for everyone"], images: [{ image_id: "M11L7_IMG1", prompt: "HD professional illustration of safe evacuation assistance, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M11L7_IMG2", prompt: "HD vector illustration showing fire emergency response, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M11L8", title: "Natural Disaster Awareness", body: "Natural disaster awareness helps caregivers prepare for and respond to weather and environmental emergencies.", summary: "Disaster awareness ensures protection during environmental emergencies.", steps: ["Know local risks", "Prepare emergency supplies", "Follow official guidance", "Protect elderly individuals", "Plan for extended situations"], images: [{ image_id: "M11L8_IMG1", prompt: "HD professional illustration of disaster preparedness, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M11L8_IMG2", prompt: "HD vector illustration showing emergency supplies preparation, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M11L9", title: "Emergency Response Practice", body: "Emergency response practice helps caregivers develop confidence and skill in responding to various emergency situations.", summary: "Regular practice builds confidence and competence in emergency response.", steps: ["Review emergency procedures", "Practice response scenarios", "Test communication methods", "Update emergency information", "Evaluate and improve"], images: [{ image_id: "M11L9_IMG1", prompt: "HD professional illustration of emergency drill practice, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M11L9_IMG2", prompt: "HD vector illustration showing emergency preparedness training, clean professional design, NO TEXT IN IMAGE" }] }
    ]
  },
  {
    module_id: "M12",
    title: "Career Readiness, Professional Growth, and Course Completion",
    lessons: [
      { lesson_id: "M12L1", title: "Preparing for Employment", body: "Preparing for employment helps new caregivers enter the workforce with confidence and professionalism.", summary: "Employment preparation builds foundation for successful caregiving career.", steps: ["Update resume", "Prepare for interviews", "Understand job requirements", "Gather references", "Present professionally"], images: [{ image_id: "M12L1_IMG1", prompt: "HD professional illustration of job preparation for caregiving, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M12L1_IMG2", prompt: "HD vector illustration showing career readiness, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M12L2", title: "Building a Professional Portfolio", body: "Building a professional portfolio demonstrates skills, training, and experience to potential employers.", summary: "A strong portfolio showcases qualifications and commitment to quality care.", steps: ["Compile certifications", "Document training", "Gather testimonials", "Organize materials", "Present professionally"], images: [{ image_id: "M12L2_IMG1", prompt: "HD professional illustration of portfolio development, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M12L2_IMG2", prompt: "HD vector illustration showing professional documentation, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M12L3", title: "Continuing Education", body: "Continuing education helps caregivers stay current with best practices and advance their skills throughout their career.", summary: "Ongoing learning supports career growth and quality care delivery.", steps: ["Identify learning needs", "Pursue relevant training", "Stay current", "Apply new knowledge", "Track development"], images: [{ image_id: "M12L3_IMG1", prompt: "HD professional illustration of continuing education for caregivers, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M12L3_IMG2", prompt: "HD vector illustration showing professional learning, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M12L4", title: "Career Advancement Opportunities", body: "Career advancement opportunities help caregivers plan for professional growth and expanded responsibilities.", summary: "Understanding career paths supports long-term professional development.", steps: ["Explore career options", "Identify advancement paths", "Set career goals", "Pursue relevant qualifications", "Seek mentorship"], images: [{ image_id: "M12L4_IMG1", prompt: "HD professional illustration of career advancement in caregiving, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M12L4_IMG2", prompt: "HD vector illustration showing professional growth path, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M12L5", title: "Networking and Professional Connections", body: "Networking and professional connections support career development and access to opportunities in elderly care.", summary: "Professional connections enhance career opportunities and support.", steps: ["Join professional organizations", "Attend industry events", "Connect with colleagues", "Maintain relationships", "Share knowledge"], images: [{ image_id: "M12L5_IMG1", prompt: "HD professional illustration of professional networking, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M12L5_IMG2", prompt: "HD vector illustration showing caregiver community connection, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M12L6", title: "Self-Care and Burnout Prevention", body: "Self-care and burnout prevention help caregivers maintain their own well-being while providing quality care to others.", summary: "Self-care ensures sustainable, quality care delivery and personal well-being.", steps: ["Recognize stress signs", "Practice self-care regularly", "Set healthy boundaries", "Seek support when needed", "Maintain work-life balance"], images: [{ image_id: "M12L6_IMG1", prompt: "HD professional illustration of caregiver wellness and self-care, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M12L6_IMG2", prompt: "HD vector illustration showing work-life balance, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M12L7", title: "Course Review and Reflection", body: "Course review and reflection helps learners consolidate knowledge and identify areas for continued development.", summary: "Reflection reinforces learning and identifies areas for growth.", steps: ["Review key concepts", "Reflect on learning", "Identify strengths", "Plan for improvement", "Celebrate progress"], images: [{ image_id: "M12L7_IMG1", prompt: "HD professional illustration of learning reflection, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M12L7_IMG2", prompt: "HD vector illustration showing knowledge consolidation, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M12L8", title: "Final Skills Assessment", body: "Final skills assessment provides an opportunity to demonstrate mastery of home care and elderly support competencies.", summary: "Skills assessment validates readiness for professional caregiving roles.", steps: ["Review all modules", "Demonstrate competencies", "Identify any gaps", "Address remaining questions", "Prepare for practice"], images: [{ image_id: "M12L8_IMG1", prompt: "HD professional illustration of skills demonstration, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M12L8_IMG2", prompt: "HD vector illustration showing competency assessment, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M12L9", title: "Course Completion and Next Steps", body: "Course completion marks the beginning of a caregiving career, with clear next steps for putting knowledge into practice.", summary: "Course completion prepares graduates for successful caregiving careers.", steps: ["Complete final requirements", "Receive certification", "Plan immediate next steps", "Begin job search", "Continue learning"], images: [{ image_id: "M12L9_IMG1", prompt: "HD professional illustration of course graduation celebration, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M12L9_IMG2", prompt: "HD vector illustration showing career beginning, clean professional design, NO TEXT IN IMAGE" }] }
    ]
  }
];

async function addMissingM2Lesson(courseId: string, moduleId: string) {
  console.log('\n========================================');
  console.log('ADDING MISSING LESSON: Module 2, Lesson 8');
  console.log('========================================\n');
  
  const lessonData = M2L8;
  console.log(`Processing Lesson 8: ${lessonData.title}`);
  
  const imageUrls: string[] = [];
  for (const imageInfo of lessonData.images) {
    const imageUrl = await generateAndUploadImage(imageInfo.prompt, imageInfo.image_id);
    imageUrls.push(imageUrl);
    await new Promise(r => setTimeout(r, 1500));
  }
  
  const [newLesson] = await db.insert(lessons).values({
    moduleId,
    courseId,
    title: lessonData.title,
    orderNum: 8,
    durationMinutes: 15,
    description: lessonData.summary,
    content: lessonData.body,
    images: imageUrls
  }).returning();
  
  await createLessonContentBlocks(
    newLesson.id,
    lessonData.body,
    lessonData.summary,
    lessonData.steps,
    imageUrls
  );
  
  console.log(`Completed: ${lessonData.title}`);
}

async function seedModulesFromIndex(courseId: string, startModuleIndex: number) {
  console.log(`\nSeeding Modules ${startModuleIndex + 1} to 12...`);
  console.log('================================================');
  
  const modulesToSeed = REMAINING_MODULES.slice(startModuleIndex);
  
  for (let i = 0; i < modulesToSeed.length; i++) {
    const moduleData = modulesToSeed[i];
    const moduleNum = startModuleIndex + i + 3; // +3 because we already have M1, M2
    
    console.log(`\n========================================`);
    console.log(`CREATING MODULE ${moduleNum}: ${moduleData.title}`);
    console.log(`========================================`);
    
    const [newModule] = await db.insert(modules).values({
      courseId,
      title: moduleData.title,
      description: `Module ${moduleNum} of Home Care and Elderly Support`,
      orderNum: moduleNum
    }).returning();
    
    console.log(`Module created: ${newModule.title}`);
    
    for (let j = 0; j < moduleData.lessons.length; j++) {
      const lessonData = moduleData.lessons[j];
      console.log(`\n  Processing Lesson ${j + 1}: ${lessonData.title}`);
      
      const imageUrls: string[] = [];
      for (const imageInfo of lessonData.images) {
        const imageUrl = await generateAndUploadImage(imageInfo.prompt, imageInfo.image_id);
        imageUrls.push(imageUrl);
        await new Promise(r => setTimeout(r, 1500));
      }
      
      const [newLesson] = await db.insert(lessons).values({
        moduleId: newModule.id,
        courseId,
        title: lessonData.title,
        orderNum: j + 1,
        durationMinutes: 15,
        description: lessonData.summary,
        content: lessonData.body,
        images: imageUrls
      }).returning();
      
      await createLessonContentBlocks(
        newLesson.id,
        lessonData.body,
        lessonData.summary,
        lessonData.steps,
        imageUrls
      );
      
      console.log(`  Completed: ${lessonData.title}`);
      await new Promise(r => setTimeout(r, 2000));
    }
    
    console.log(`\nCompleted Module: ${moduleData.title}`);
    console.log(`Waiting before next module...`);
    await new Promise(r => setTimeout(r, 5000));
  }
}

async function runResume() {
  try {
    console.log('\n========================================');
    console.log('RESUMING HOME CARE COURSE GENERATION');
    console.log('========================================\n');
    
    initCloudinary();
    
    // Find existing course
    const [course] = await db.select().from(courses).where(eq(courses.title, COURSE_TITLE));
    if (!course) {
      console.error('Course not found! Run the original seed script first.');
      return;
    }
    console.log(`Found course: ${course.title} (ID: ${course.id})`);
    
    // Find Module 2 to add missing lesson
    const existingModules = await db.select().from(modules).where(eq(modules.courseId, course.id));
    const module2 = existingModules.find(m => m.orderNum === 2);
    
    if (module2) {
      // Check if lesson 8 exists
      const m2Lessons = await db.select().from(lessons).where(eq(lessons.moduleId, module2.id));
      if (m2Lessons.length < 8) {
        await addMissingM2Lesson(course.id, module2.id);
      } else {
        console.log('Module 2 already has all 8 lessons');
      }
    }
    
    // Create modules 3-12
    await seedModulesFromIndex(course.id, 0);
    
    console.log('\n========================================');
    console.log('RESUME COMPLETE');
    console.log('========================================');
    
  } catch (error) {
    console.error('Resume failed:', error);
  }
}

runResume()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
