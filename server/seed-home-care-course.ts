import OpenAI from "openai";
import { v2 as cloudinary } from 'cloudinary';
import { db } from './db';
import { courses, modules, lessons, lessonContentBlocks, courseCategories } from '../shared/schema';
import { eq } from 'drizzle-orm';
import https from 'https';
import { ensureAdminUser } from './ensure-admin-user';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const COURSE_TITLE = 'Home Care and Elderly Support';

const COURSE_STRUCTURE = {
  course_id: "home_care_elderly_support_v1",
  title: "Home Care and Elderly Support",
  tagline: "Comprehensive training for compassionate elderly care",
  level: "beginner",
  description: "A comprehensive course that teaches the fundamentals of home care and elderly support, covering personal care, safety, nutrition, communication, and professional responsibilities for caregivers.",
  learning_outcomes: [
    "Understand the role and responsibilities of a home care assistant",
    "Provide safe and respectful personal care to elderly individuals",
    "Support nutrition, hydration, and daily living activities",
    "Communicate effectively and provide emotional support",
    "Maintain professional ethics and legal responsibilities",
    "Respond appropriately to emergencies and health changes"
  ]
};

const MODULES_DATA = [
  {
    module_id: "M1",
    title: "Introduction to Home Care and Elderly Support",
    lessons: [
      { lesson_id: "M1L1", title: "Understanding Home Care Assistance", body: "Home care assistance focuses on providing daily support to elderly individuals so they can live safely, comfortably, and with dignity in their own homes. This type of care is not medical in nature. Instead, it emphasizes personal care, daily activities, companionship, and basic safety.", summary: "Home care assistance supports elderly individuals with daily living, safety, and emotional well-being while respecting dignity and independence.", steps: ["Understand the purpose of home care", "Support independence and dignity", "Provide emotional and practical support", "Maintain professionalism in private homes", "Prioritize safety and communication"], images: [{ image_id: "M1L1_IMG1", prompt: "HD professional illustration of a home care assistant supporting an elderly person in a comfortable home setting, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M1L1_IMG2", prompt: "HD vector illustration showing respectful companionship between a caregiver and elderly person at home, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M1L2", title: "Role and Responsibilities of a Home Care Assistant", body: "The role of a home care assistant involves providing daily support while maintaining professionalism, respect, and reliability. Assistants help elderly individuals with non-medical needs that support safe and comfortable living at home.", summary: "Home care assistants have clear responsibilities focused on daily support, observation, reliability, and professionalism.", steps: ["Assist with daily living tasks", "Follow care plans and instructions", "Observe and report changes", "Respect professional boundaries", "Maintain reliability and trust"], images: [{ image_id: "M1L2_IMG1", prompt: "HD professional illustration of a home care assistant helping with daily activities in a home, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M1L2_IMG2", prompt: "HD vector illustration showing a caregiver responsibly assisting an elderly person indoors, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M1L3", title: "Understanding Aging and Elderly Needs", body: "Understanding aging helps home care assistants provide better support. Aging affects the body, mind, and emotions. These changes vary from person to person and should never be assumed or judged.", summary: "Understanding aging allows home care assistants to provide patient, empathetic, and appropriate support.", steps: ["Recognize physical changes of aging", "Understand cognitive challenges", "Support emotional well-being", "Encourage social interaction", "Adapt care to individual needs"], images: [{ image_id: "M1L3_IMG1", prompt: "HD professional illustration of an elderly person being supported calmly at home, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M1L3_IMG2", prompt: "HD vector illustration showing empathetic interaction between caregiver and elderly individual, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M1L4", title: "Professional Attitude and Ethics in Home Care", body: "Professional attitude and ethics are essential in home care because assistants work closely with vulnerable individuals. Trust, respect, and ethical behavior protect both the caregiver and the elderly person.", summary: "Professional attitude and ethics ensure trust, respect, and safety in home care assistance.", steps: ["Maintain confidentiality", "Respect autonomy and choices", "Follow ethical guidelines", "Maintain professional boundaries", "Act honestly and responsibly"], images: [{ image_id: "M1L4_IMG1", prompt: "HD professional illustration of a respectful home care interaction emphasizing trust and professionalism, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M1L4_IMG2", prompt: "HD vector illustration showing ethical caregiving behavior in a home environment, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M1L5", title: "Basic Daily Living Support", body: "Basic daily living support is a central part of home care assistance. Elderly individuals may face challenges performing routine activities that were once simple. Home care assistants help with these tasks while encouraging independence whenever possible.", summary: "Daily living support helps elderly individuals remain safe and comfortable while maintaining dignity and independence.", steps: ["Assist with hygiene respectfully", "Support dressing and grooming", "Help with safe mobility", "Support meal routines", "Encourage independence"], images: [{ image_id: "M1L5_IMG1", prompt: "HD professional illustration of a home care assistant supporting daily activities respectfully, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M1L5_IMG2", prompt: "HD vector illustration showing safe mobility support for an elderly person at home, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M1L6", title: "Personal Hygiene and Comfort", body: "Personal hygiene and comfort are essential for health, dignity, and emotional well-being. Home care assistants play an important role in supporting hygiene routines while respecting privacy and personal preferences.", summary: "Personal hygiene and comfort care promote health, dignity, and emotional well-being.", steps: ["Prepare hygiene supplies", "Maintain privacy and respect", "Support gentle hygiene routines", "Ensure physical comfort", "Observe skin condition"], images: [{ image_id: "M1L6_IMG1", prompt: "HD professional illustration of a caregiver assisting with personal hygiene in a respectful home setting, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M1L6_IMG2", prompt: "HD vector illustration showing a comfortable and clean elderly care environment, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M1L7", title: "Companionship and Emotional Support", body: "Companionship and emotional support are valuable aspects of home care assistance. Many elderly individuals experience loneliness or isolation, which can affect mental and physical health.", summary: "Companionship and emotional support reduce loneliness and improve well-being.", steps: ["Engage in friendly conversation", "Practice active listening", "Encourage social interaction", "Provide emotional reassurance", "Maintain professional boundaries"], images: [{ image_id: "M1L7_IMG1", prompt: "HD professional illustration of a caregiver providing companionship to an elderly person at home, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M1L7_IMG2", prompt: "HD vector illustration showing positive emotional interaction between caregiver and elderly individual, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M1L8", title: "Communication with Elderly Individuals", body: "Effective communication is essential in home care. Clear, respectful communication helps elderly individuals feel understood and supported.", summary: "Clear and respectful communication supports understanding, trust, and effective home care.", steps: ["Speak clearly and calmly", "Use simple language", "Practice active listening", "Observe non-verbal cues", "Show patience and respect"], images: [{ image_id: "M1L8_IMG1", prompt: "HD professional illustration of a caregiver communicating clearly with an elderly person, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M1L8_IMG2", prompt: "HD vector illustration showing respectful conversation in a home care setting, clean professional design, NO TEXT IN IMAGE" }] }
    ]
  },
  {
    module_id: "M2",
    title: "Health, Safety, and Hygiene in Elderly Care",
    lessons: [
      { lesson_id: "M2L1", title: "Basic Health and Safety Awareness", body: "Health and safety awareness is a foundational skill for home care assistants working with elderly individuals. Aging increases vulnerability to injury, illness, and accidents.", summary: "Health and safety awareness helps prevent accidents, illness, and injuries in elderly home care environments.", steps: ["Observe the home for safety risks", "Understand physical limitations of aging", "Maintain hygiene and infection prevention", "Prepare for emergencies", "Communicate safety concerns"], images: [{ image_id: "M2L1_IMG1", prompt: "HD professional illustration of a caregiver ensuring a safe home environment for an elderly person, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M2L1_IMG2", prompt: "HD vector illustration showing hazard awareness in a residential care setting, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M2L2", title: "Personal Hygiene Practices", body: "Personal hygiene practices are essential in elderly care to protect health, comfort, and dignity. Good hygiene reduces the risk of infection and supports emotional well-being.", summary: "Personal hygiene practices support health, comfort, and dignity in elderly home care.", steps: ["Practice proper hand hygiene", "Support bathing and grooming respectfully", "Assist with oral hygiene", "Maintain clean clothing and bedding", "Observe skin condition"], images: [{ image_id: "M2L2_IMG1", prompt: "HD professional illustration of a caregiver supporting personal hygiene with dignity, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M2L2_IMG2", prompt: "HD vector illustration showing clean and hygienic elderly care routines, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M2L3", title: "Preventing Falls and Injuries", body: "Preventing falls and injuries is one of the most important responsibilities in elderly care. Falls are a leading cause of injury among older adults and can have serious consequences.", summary: "Preventing falls protects elderly individuals from serious injury and supports safe independent living.", steps: ["Remove environmental hazards", "Support safe mobility", "Encourage proper footwear", "Observe changes in balance", "Report fall risks"], images: [{ image_id: "M2L3_IMG1", prompt: "HD professional illustration of a caregiver assisting safe walking for an elderly person at home, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M2L3_IMG2", prompt: "HD vector illustration showing fall prevention measures in a home setting, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M2L4", title: "Emergency Awareness and Response", body: "Emergency awareness and response are critical skills for home care assistants. Emergencies may include falls, sudden illness, fires, or household accidents.", summary: "Emergency awareness and response skills help protect elderly individuals and caregivers during unexpected situations.", steps: ["Recognize emergency situations", "Ensure personal and client safety", "Respond calmly and correctly", "Seek appropriate help", "Report incidents"], images: [{ image_id: "M2L4_IMG1", prompt: "HD professional illustration of a caregiver responding calmly to an emergency at home, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M2L4_IMG2", prompt: "HD vector illustration showing emergency response actions in elderly care, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M2L5", title: "Safe Mobility and Transfers", body: "Safe mobility and transfers are essential aspects of elderly care because many older adults experience reduced strength, balance issues, or joint stiffness.", summary: "Safe mobility and transfers protect both caregiver and elderly individual through correct techniques and respectful support.", steps: ["Assess mobility needs", "Prepare the environment", "Communicate clearly before movement", "Use correct body mechanics", "Encourage safe participation"], images: [{ image_id: "M2L5_IMG1", prompt: "HD professional illustration of a caregiver assisting safe transfer from chair to standing, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M2L5_IMG2", prompt: "HD vector illustration showing proper body positioning during elderly mobility support, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M2L6", title: "Infection Prevention in Home Care", body: "Infection prevention is critical in elderly home care because older adults often have weaker immune systems. Preventing the spread of infections protects health and reduces the risk of serious illness.", summary: "Infection prevention protects elderly individuals through hygiene, cleaning, and responsible caregiving practices.", steps: ["Practice proper hand hygiene", "Clean high-touch surfaces", "Use protective practices appropriately", "Avoid cross contamination", "Monitor health conditions"], images: [{ image_id: "M2L6_IMG1", prompt: "HD professional illustration of a caregiver washing hands before elderly care, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M2L6_IMG2", prompt: "HD vector illustration showing infection prevention practices in home care, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M2L7", title: "Medication Awareness (Non-Medical)", body: "Medication awareness is an important non-medical responsibility for home care assistants. While assistants do not administer medications unless authorized, they must understand basic medication safety.", summary: "Medication awareness supports safety through observation, reminders, and proper communication.", steps: ["Understand medication boundaries", "Support reminders responsibly", "Observe for side effects", "Ensure safe storage", "Communicate concerns"], images: [{ image_id: "M2L7_IMG1", prompt: "HD professional illustration of a caregiver reminding an elderly person about medication, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M2L7_IMG2", prompt: "HD vector illustration showing safe medication storage in a home, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M2L8", title: "Safety Practice and Daily Routines", body: "Safety practice and daily routines help turn safety knowledge into consistent habits. In elderly care, routine safety actions reduce risks and improve quality of care.", summary: "Daily safety routines ensure consistent protection and professional elderly care.", steps: ["Apply safety checks daily", "Maintain consistent routines", "Adjust based on needs", "Report hazards promptly", "Improve safety practices"], images: [{ image_id: "M2L8_IMG1", prompt: "HD professional illustration of a caregiver performing daily safety checks in a home, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M2L8_IMG2", prompt: "HD vector illustration showing safe and organized elderly care environment, clean professional design, NO TEXT IN IMAGE" }] }
    ]
  },
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
      { lesson_id: "M4L6", title: "Supporting Rest and Sleep", body: "Rest and sleep are essential for physical recovery, mental clarity, and emotional well-being. Many elderly individuals experience sleep changes due to aging.", summary: "Proper rest and sleep support physical and emotional health in elderly care.", steps: ["Prepare a comfortable sleep environment", "Support consistent sleep routines", "Reduce noise and light disturbances", "Encourage balanced daytime activity", "Observe sleep patterns"], images: [{ image_id: "M4L6_IMG1", prompt: "HD professional illustration of a caregiver preparing a calm sleeping environment for an elderly person, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M4L6_IMG2", prompt: "HD vector illustration showing a peaceful rest setting in elderly home care, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M4L7", title: "Maintaining Personal Comfort Throughout the Day", body: "Maintaining personal comfort throughout the day is an important part of quality home care. Comfort affects mood, cooperation, and overall well-being.", summary: "Maintaining comfort improves mood, cooperation, and quality of life for elderly individuals.", steps: ["Monitor physical comfort needs", "Adjust environment as needed", "Support emotional comfort", "Observe signs of discomfort", "Respond promptly"], images: [{ image_id: "M4L7_IMG1", prompt: "HD professional illustration of a caregiver ensuring personal comfort for an elderly person, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M4L7_IMG2", prompt: "HD vector illustration showing comfortable daily living support in elderly care, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M4L8", title: "Personal Care Practice and Daily Support", body: "Personal care practice and daily support bring together all personal care skills into consistent routines. Practicing these skills daily ensures safe, respectful, and professional elderly care.", summary: "Daily personal care practice ensures consistent, respectful, and professional elderly support.", steps: ["Apply personal care skills daily", "Maintain consistent routines", "Observe and reflect on care quality", "Communicate changes or concerns", "Improve care practices"], images: [{ image_id: "M4L8_IMG1", prompt: "HD professional illustration of a caregiver providing complete daily personal care support, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M4L8_IMG2", prompt: "HD vector illustration showing structured personal care routine in elderly home care, clean professional design, NO TEXT IN IMAGE" }] }
    ]
  },
  {
    module_id: "M5",
    title: "Communication, Behavior, and Emotional Well-Being",
    lessons: [
      { lesson_id: "M5L1", title: "Effective Communication with Elderly Individuals", body: "Effective communication is a core skill in elderly care. Clear, respectful communication helps elderly individuals feel understood, valued, and safe.", summary: "Effective communication builds trust, reduces confusion, and supports emotional well-being in elderly care.", steps: ["Listen actively and patiently", "Speak clearly and calmly", "Use supportive non-verbal communication", "Reduce environmental distractions", "Respond with empathy and respect"], images: [{ image_id: "M5L1_IMG1", prompt: "HD professional illustration of a caregiver communicating calmly with an elderly person at home, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M5L1_IMG2", prompt: "HD vector illustration showing attentive listening and respectful communication in elderly care, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M5L2", title: "Understanding Elderly Behavior Changes", body: "Behavior changes are common in elderly individuals and can result from aging, health conditions, emotional stress, or environmental factors.", summary: "Understanding behavior changes helps caregivers respond with empathy and reduce stress in elderly care.", steps: ["Observe behavior patterns", "Consider physical and emotional causes", "Maintain calm and patience", "Provide reassurance and support", "Report significant changes"], images: [{ image_id: "M5L2_IMG1", prompt: "HD professional illustration of a caregiver calmly supporting an elderly person experiencing behavior changes, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M5L2_IMG2", prompt: "HD vector illustration showing compassionate response to elderly behavior changes, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M5L3", title: "Emotional Well-Being and Mental Health Support", body: "Emotional well-being and mental health are essential components of overall health for elderly individuals. Aging can bring emotional challenges such as loneliness, anxiety, and sadness.", summary: "Supporting emotional well-being improves mental health, mood, and quality of life for elderly individuals.", steps: ["Provide companionship and conversation", "Support consistent routines", "Encourage meaningful activities", "Observe emotional changes", "Communicate concerns"], images: [{ image_id: "M5L3_IMG1", prompt: "HD professional illustration of a caregiver engaging in positive interaction with an elderly person, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M5L3_IMG2", prompt: "HD vector illustration showing emotional support and companionship in elderly care, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M5L4", title: "Managing Stressful Situations Calmly", body: "Stressful situations can arise in elderly care due to health changes, behavior challenges, or unexpected events. How caregivers respond affects safety and emotional well-being.", summary: "Managing stressful situations calmly protects safety and supports emotional well-being in elderly care.", steps: ["Remain calm and composed", "Use gentle communication", "Identify stress triggers", "Allow time to de-escalate", "Reflect and improve responses"], images: [{ image_id: "M5L4_IMG1", prompt: "HD professional illustration of a caregiver calmly de-escalating a stressful situation with an elderly person, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M5L4_IMG2", prompt: "HD vector illustration showing calm problem-solving in elderly care, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M5L5", title: "Respect, Dignity, and Personal Boundaries", body: "Respect, dignity, and personal boundaries are fundamental principles in elderly care. Home care assistants work closely with individuals in private settings.", summary: "Respect, dignity, and boundaries are essential for ethical, safe, and compassionate elderly care.", steps: ["Use respectful language and tone", "Protect privacy during care tasks", "Ask permission before assisting", "Respect personal choices", "Maintain professional boundaries"], images: [{ image_id: "M5L5_IMG1", prompt: "HD professional illustration of a caregiver showing respectful interaction with an elderly person, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M5L5_IMG2", prompt: "HD vector illustration showing dignity and respect in elderly home care, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M5L6", title: "Building Trust and Positive Relationships", body: "Building trust and positive relationships is central to successful elderly care. Trust allows elderly individuals to feel safe and comfortable receiving support.", summary: "Trust and positive relationships support cooperation, comfort, and emotional well-being in elderly care.", steps: ["Be reliable and punctual", "Communicate honestly", "Maintain consistent routines", "Show empathy and understanding", "Respect individual preferences"], images: [{ image_id: "M5L6_IMG1", prompt: "HD professional illustration of a caregiver building trust with an elderly person through calm interaction, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M5L6_IMG2", prompt: "HD vector illustration showing positive caregiver-elderly relationship, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M5L7", title: "Supporting Social Interaction", body: "Social interaction plays an important role in maintaining emotional and mental well-being for elderly individuals. Reduced social contact can lead to loneliness.", summary: "Social interaction supports emotional health, mental stimulation, and connection in elderly care.", steps: ["Encourage friendly conversation", "Support shared activities", "Facilitate social connections", "Respect social preferences", "Observe emotional responses"], images: [{ image_id: "M5L7_IMG1", prompt: "HD professional illustration of a caregiver engaging in a social activity with an elderly person, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M5L7_IMG2", prompt: "HD vector illustration showing positive social interaction in elderly care, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M5L8", title: "Communication and Emotional Care Practice", body: "Communication and emotional care practice bring together all communication and emotional support skills into daily routines.", summary: "Daily communication and emotional care practice ensures respectful, compassionate, and effective elderly support.", steps: ["Apply communication skills daily", "Support emotional well-being consistently", "Reflect on interactions", "Share observations with the care team", "Improve care approaches"], images: [{ image_id: "M5L8_IMG1", prompt: "HD professional illustration of a caregiver practicing compassionate communication in elderly care, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M5L8_IMG2", prompt: "HD vector illustration showing emotional care routines in elderly home care, clean professional design, NO TEXT IN IMAGE" }] }
    ]
  },
  {
    module_id: "M6",
    title: "Safety, Environment, and Home Organization",
    lessons: [
      { lesson_id: "M6L1", title: "Creating a Safe Home Environment", body: "Creating a safe home environment is one of the most important responsibilities in elderly care. Many accidents involving elderly individuals happen at home due to preventable hazards.", summary: "A safe home environment reduces accidents and supports independence for elderly individuals.", steps: ["Identify and remove home hazards", "Improve lighting in key areas", "Ensure safe flooring and walkways", "Organize furniture for easy movement", "Maintain emergency readiness"], images: [{ image_id: "M6L1_IMG1", prompt: "HD professional illustration of a safe and organized home environment for elderly care, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M6L1_IMG2", prompt: "HD vector illustration showing fall prevention features inside a home, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M6L2", title: "Home Organization for Daily Living", body: "Home organization supports safety, comfort, and independence in elderly care. An organized living space reduces confusion, prevents accidents, and makes daily activities easier.", summary: "Home organization supports safety, reduces stress, and improves independence for elderly individuals.", steps: ["Reduce clutter regularly", "Place essential items within reach", "Maintain consistent item placement", "Use safe storage solutions", "Review organization routines"], images: [{ image_id: "M6L2_IMG1", prompt: "HD professional illustration of an organized living space suitable for elderly care, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M6L2_IMG2", prompt: "HD vector illustration showing organized storage for daily living items, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M6L3", title: "Fire and Electrical Safety", body: "Fire and electrical safety are essential components of a safe home environment. Elderly individuals may have slower reaction times or limited mobility.", summary: "Fire and electrical safety practices reduce risks and support emergency preparedness.", steps: ["Inspect electrical cords and outlets", "Use appliances safely", "Reduce fire hazards", "Maintain smoke detectors", "Ensure clear emergency exits"], images: [{ image_id: "M6L3_IMG1", prompt: "HD professional illustration of safe electrical appliance use in an elderly home, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M6L3_IMG2", prompt: "HD vector illustration showing fire safety measures inside a home, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M6L4", title: "Bathroom and Kitchen Safety", body: "Bathrooms and kitchens are among the highest-risk areas in the home for elderly individuals. Slippery surfaces, heat sources, and tight spaces increase the chance of accidents.", summary: "Bathroom and kitchen safety reduce common household risks and support safe daily living.", steps: ["Use non-slip safety features", "Monitor water temperature", "Organize kitchen items safely", "Supervise cooking activities", "Maintain clean and dry surfaces"], images: [{ image_id: "M6L4_IMG1", prompt: "HD professional illustration of a safe bathroom setup for elderly care, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M6L4_IMG2", prompt: "HD vector illustration showing safe kitchen environment in elderly home care, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M6L5", title: "Preventing Slips, Trips, and Falls", body: "Preventing slips, trips, and falls is a top priority in elderly care because falls can lead to serious injuries and long recovery times.", summary: "Preventing slips, trips, and falls protects elderly individuals from injury and supports safe mobility.", steps: ["Keep floors clean and dry", "Remove tripping hazards", "Ensure safe footwear", "Encourage slow movement", "Observe fall risk changes"], images: [{ image_id: "M6L5_IMG1", prompt: "HD professional illustration of a caregiver ensuring clear walkways to prevent falls, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M6L5_IMG2", prompt: "HD vector illustration showing fall prevention measures in an elderly home, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M6L6", title: "Safe Use of Household Equipment", body: "Safe use of household equipment is important in elderly care because everyday tools and appliances can pose risks if used incorrectly.", summary: "Safe use of household equipment reduces accidents and supports a secure home environment.", steps: ["Inspect equipment regularly", "Supervise equipment use", "Store tools safely", "Maintain electrical safety", "Check mobility aid stability"], images: [{ image_id: "M6L6_IMG1", prompt: "HD professional illustration of a caregiver safely managing household equipment in elderly care, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M6L6_IMG2", prompt: "HD vector illustration showing safe appliance use in a home setting, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M6L7", title: "Maintaining Clean and Healthy Living Spaces", body: "Maintaining clean and healthy living spaces supports physical health, emotional comfort, and safety for elderly individuals.", summary: "Clean living spaces promote health, comfort, and safety in elderly home care.", steps: ["Maintain daily cleaning routines", "Ensure proper ventilation", "Support laundry hygiene", "Use safe cleaning methods", "Avoid creating hazards"], images: [{ image_id: "M6L7_IMG1", prompt: "HD professional illustration of a clean and healthy elderly living space, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M6L7_IMG2", prompt: "HD vector illustration showing hygienic home maintenance in elderly care, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M6L8", title: "Environmental Safety Practice and Daily Checks", body: "Environmental safety practice and daily checks help ensure that safety knowledge is applied consistently.", summary: "Daily environmental safety checks help maintain a secure and supportive elderly care environment.", steps: ["Perform daily safety checks", "Address hazards promptly", "Maintain consistent routines", "Communicate safety concerns", "Review safety practices"], images: [{ image_id: "M6L8_IMG1", prompt: "HD professional illustration of a caregiver performing daily home safety checks, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M6L8_IMG2", prompt: "HD vector illustration showing structured safety inspection in elderly care, clean professional design, NO TEXT IN IMAGE" }] }
    ]
  },
  {
    module_id: "M7",
    title: "Health Observation and Reporting",
    lessons: [
      { lesson_id: "M7L1", title: "Importance of Health Observation", body: "Health observation is a vital responsibility in elderly care. Home care assistants spend regular time with elderly individuals and are often the first to notice changes.", summary: "Health observation helps identify changes early and supports safe, responsive elderly care.", steps: ["Observe daily health patterns", "Notice physical and behavioral changes", "Compare changes over time", "Avoid making diagnoses", "Report concerns appropriately"], images: [{ image_id: "M7L1_IMG1", prompt: "HD professional illustration of a caregiver attentively observing an elderly person at home, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M7L1_IMG2", prompt: "HD vector illustration showing careful health observation in elderly care, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M7L2", title: "Observing Physical Health Changes", body: "Observing physical health changes is an essential part of daily elderly care. Physical changes can indicate discomfort, illness, or declining health.", summary: "Physical health observation helps identify discomfort or illness early in elderly care.", steps: ["Observe movement and posture", "Monitor skin condition", "Notice appetite or weight changes", "Watch for signs of pain", "Document observations"], images: [{ image_id: "M7L2_IMG1", prompt: "HD professional illustration of a caregiver observing physical condition of an elderly person, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M7L2_IMG2", prompt: "HD vector illustration showing physical health monitoring in home care, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M7L3", title: "Observing Mental and Emotional Health", body: "Mental and emotional health observation is as important as physical health in elderly care. Emotional changes can affect quality of life.", summary: "Mental and emotional health observation supports well-being and early support.", steps: ["Observe mood and behavior", "Notice memory or confusion changes", "Watch engagement levels", "Respond with empathy", "Report emotional concerns"], images: [{ image_id: "M7L3_IMG1", prompt: "HD professional illustration of a caregiver offering emotional support to an elderly person, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M7L3_IMG2", prompt: "HD vector illustration showing emotional health observation in elderly care, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M7L4", title: "Monitoring Appetite and Hydration", body: "Monitoring appetite and hydration helps ensure elderly individuals receive adequate nutrition and fluids. Changes in eating or drinking habits can indicate health issues.", summary: "Monitoring nutrition and hydration supports health and energy levels.", steps: ["Observe meal consumption", "Monitor fluid intake", "Notice swallowing difficulties", "Encourage regular intake", "Report concerns"], images: [{ image_id: "M7L4_IMG1", prompt: "HD professional illustration of a caregiver monitoring meal intake of an elderly person, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M7L4_IMG2", prompt: "HD vector illustration showing hydration monitoring in elderly care, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M7L5", title: "Observing Mobility and Balance Changes", body: "Mobility and balance observation helps prevent falls and injuries. Changes may occur gradually or suddenly and should be addressed promptly.", summary: "Mobility observation reduces fall risk and supports safe independence.", steps: ["Observe walking patterns", "Monitor balance changes", "Check mobility aid use", "Encourage safe movement", "Report risks"], images: [{ image_id: "M7L5_IMG1", prompt: "HD professional illustration of a caregiver observing elderly mobility at home, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M7L5_IMG2", prompt: "HD vector illustration showing balance monitoring in elderly care, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M7L6", title: "Pain and Discomfort Awareness", body: "Pain and discomfort awareness is essential because elderly individuals may not always express pain clearly. Observing signs of discomfort helps ensure timely support.", summary: "Pain awareness helps maintain comfort and dignity.", steps: ["Observe non-verbal pain signs", "Notice behavior changes", "Ask gentle questions", "Document discomfort", "Report concerns"], images: [{ image_id: "M7L6_IMG1", prompt: "HD professional illustration of a caregiver noticing discomfort in an elderly person, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M7L6_IMG2", prompt: "HD vector illustration showing pain awareness in elderly care, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M7L7", title: "Daily Health Check Routines", body: "Daily health check routines support consistent observation and reporting. Simple checks help identify changes early.", summary: "Daily health checks support early detection and reliable care.", steps: ["Follow daily observation routines", "Record consistent findings", "Compare changes over time", "Maintain accuracy", "Communicate concerns"], images: [{ image_id: "M7L7_IMG1", prompt: "HD professional illustration of a caregiver performing daily health checks, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M7L7_IMG2", prompt: "HD vector illustration showing routine health observation in elderly care, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M7L8", title: "Recording and Documenting Observations", body: "Recording observations accurately ensures clear communication and continuity of care. Documentation should be factual and objective.", summary: "Documentation ensures accurate communication and continuity of care.", steps: ["Record observations clearly", "Use objective language", "Maintain confidentiality", "Share information appropriately", "Review records regularly"], images: [{ image_id: "M7L8_IMG1", prompt: "HD professional illustration of a caregiver documenting observations, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M7L8_IMG2", prompt: "HD vector illustration showing documentation in elderly care, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M7L9", title: "Reporting Health Concerns Responsibly", body: "Reporting health concerns responsibly is the final step in health observation. Timely reporting helps ensure appropriate follow-up and support.", summary: "Responsible reporting ensures timely support and safe elderly care.", steps: ["Identify reportable concerns", "Communicate clearly", "Follow reporting procedures", "Avoid delays", "Support follow-up"], images: [{ image_id: "M7L9_IMG1", prompt: "HD professional illustration of a caregiver reporting health concerns responsibly, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M7L9_IMG2", prompt: "HD vector illustration showing professional reporting in elderly care, clean professional design, NO TEXT IN IMAGE" }] }
    ]
  },
  {
    module_id: "M8",
    title: "End-of-Life Care Basics and Compassionate Support",
    lessons: [
      { lesson_id: "M8L1", title: "Understanding End-of-Life Care", body: "End-of-life care focuses on comfort, dignity, and emotional support for elderly individuals approaching the final stage of life.", summary: "End-of-life care focuses on comfort, dignity, and compassionate support.", steps: ["Understand comfort-focused care goals", "Recognize changing physical needs", "Respect dignity and personal wishes", "Provide calm companionship", "Adapt daily support routines"], images: [{ image_id: "M8L1_IMG1", prompt: "HD professional illustration of a caregiver providing calm support to an elderly person in a peaceful home setting, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M8L1_IMG2", prompt: "HD vector illustration showing compassionate presence in elderly end-of-life care, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M8L2", title: "Comfort and Pain Awareness", body: "Comfort and pain awareness are essential in end-of-life care. Elderly individuals may experience discomfort that is not always verbally expressed.", summary: "Comfort and pain awareness improve quality of life during end-of-life care.", steps: ["Observe signs of discomfort", "Adjust positioning and environment", "Maintain calm surroundings", "Respond gently and patiently", "Report pain indicators"], images: [{ image_id: "M8L2_IMG1", prompt: "HD professional illustration of a caregiver ensuring physical comfort for an elderly person, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M8L2_IMG2", prompt: "HD vector illustration showing comfort-focused care in elderly support, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M8L3", title: "Emotional Support at End of Life", body: "Emotional support is a key part of end-of-life care. Elderly individuals may experience fear, sadness, or uncertainty.", summary: "Emotional support helps elderly individuals feel safe and understood.", steps: ["Listen with patience", "Offer calm reassurance", "Respect emotional expression", "Provide quiet companionship", "Maintain a supportive presence"], images: [{ image_id: "M8L3_IMG1", prompt: "HD professional illustration of a caregiver offering emotional comfort to an elderly person, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M8L3_IMG2", prompt: "HD vector illustration showing compassionate emotional support in elderly care, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M8L4", title: "Respecting Wishes and Personal Choices", body: "Respecting wishes and personal choices is fundamental in end-of-life care. Elderly individuals may have preferences related to routines and environment.", summary: "Respecting wishes preserves dignity and trust.", steps: ["Follow care preferences", "Respect personal routines", "Avoid assumptions", "Communicate clearly", "Maintain dignity"], images: [{ image_id: "M8L4_IMG1", prompt: "HD professional illustration of respectful caregiving honoring elderly wishes, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M8L4_IMG2", prompt: "HD vector illustration showing dignity and respect in end-of-life care, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M8L5", title: "Supporting Family Members", body: "Family members may experience emotional stress during end-of-life care. Home care assistants support families through respectful communication and professionalism.", summary: "Supporting families helps maintain trust and calm during end-of-life care.", steps: ["Communicate calmly with family", "Show empathy and respect", "Maintain professionalism", "Follow guidance carefully", "Support a calm environment"], images: [{ image_id: "M8L5_IMG1", prompt: "HD professional illustration of a caregiver supporting family members during elderly care, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M8L5_IMG2", prompt: "HD vector illustration showing family support in end-of-life care, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M8L6", title: "Creating a Peaceful Environment", body: "A peaceful environment supports comfort and emotional well-being during end-of-life care. Noise reduction, gentle lighting, and familiar surroundings help create calm.", summary: "A peaceful environment supports comfort and emotional calm.", steps: ["Reduce noise and disturbances", "Use gentle lighting", "Maintain familiar surroundings", "Ensure cleanliness", "Support calm routines"], images: [{ image_id: "M8L6_IMG1", prompt: "HD professional illustration of a calm and peaceful home environment for elderly care, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M8L6_IMG2", prompt: "HD vector illustration showing serene end-of-life care environment, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M8L7", title: "Professional Boundaries in End-of-Life Care", body: "Maintaining professional boundaries is important in end-of-life care. Emotional closeness should not compromise professionalism.", summary: "Professional boundaries ensure ethical and sustainable care.", steps: ["Maintain professional roles", "Avoid over-involvement", "Seek guidance when needed", "Respect privacy", "Follow care protocols"], images: [{ image_id: "M8L7_IMG1", prompt: "HD professional illustration of a caregiver maintaining professional boundaries respectfully, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M8L7_IMG2", prompt: "HD vector illustration showing ethical caregiving boundaries, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M8L8", title: "Self-Care for Caregivers", body: "Providing end-of-life care can be emotionally demanding. Caregivers must practice self-care to maintain well-being and effectiveness.", summary: "Self-care helps caregivers remain healthy and compassionate.", steps: ["Recognize emotional impact", "Take regular breaks", "Seek support", "Maintain healthy routines", "Reflect on experiences"], images: [{ image_id: "M8L8_IMG1", prompt: "HD professional illustration of a caregiver practicing self-care after work, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M8L8_IMG2", prompt: "HD vector illustration showing balance and well-being for caregivers, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M8L9", title: "End-of-Life Care Practice and Reflection", body: "End-of-life care practice and reflection help caregivers apply skills with compassion and professionalism.", summary: "Practice and reflection support compassionate and professional end-of-life care.", steps: ["Apply care skills consistently", "Reflect on experiences", "Maintain professionalism", "Seek feedback", "Continue learning"], images: [{ image_id: "M8L9_IMG1", prompt: "HD professional illustration of a caregiver reflecting calmly after providing care, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M8L9_IMG2", prompt: "HD vector illustration showing thoughtful reflection in caregiving, clean professional design, NO TEXT IN IMAGE" }] }
    ]
  },
  {
    module_id: "M9",
    title: "Legal, Ethical, and Professional Responsibilities",
    lessons: [
      { lesson_id: "M9L1", title: "Understanding Legal Responsibilities in Home Care", body: "Legal responsibilities guide how home care assistants provide safe, lawful, and accountable support.", summary: "Legal responsibilities ensure safe, authorized, and accountable home care.", steps: ["Understand assigned duties", "Obtain and respect consent", "Follow care plans and policies", "Document accurately", "Seek guidance when unsure"], images: [{ image_id: "M9L1_IMG1", prompt: "HD professional illustration of a caregiver following care guidelines responsibly, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M9L1_IMG2", prompt: "HD vector illustration showing lawful caregiving practices, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M9L2", title: "Ethical Principles in Elderly Care", body: "Ethical principles guide caregivers to act with integrity, fairness, and respect. Ethics go beyond rules to shape compassionate and trustworthy care.", summary: "Ethical principles guide compassionate and fair elderly care.", steps: ["Respect autonomy", "Act in the individual's best interest", "Avoid harm", "Treat individuals fairly", "Seek guidance for dilemmas"], images: [{ image_id: "M9L2_IMG1", prompt: "HD professional illustration of ethical caregiving with dignity and respect, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M9L2_IMG2", prompt: "HD vector illustration showing ethical decision-making in elderly care, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M9L3", title: "Confidentiality and Privacy", body: "Confidentiality and privacy protect personal information and build trust. Elderly individuals have the right to privacy in their homes and personal matters.", summary: "Confidentiality and privacy uphold dignity and trust in home care.", steps: ["Protect personal information", "Share information only when authorized", "Maintain discretion", "Respect physical privacy", "Store records securely"], images: [{ image_id: "M9L3_IMG1", prompt: "HD professional illustration of a caregiver respecting privacy during care, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M9L3_IMG2", prompt: "HD vector illustration showing confidential handling of care information, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M9L4", title: "Professional Conduct and Accountability", body: "Professional conduct reflects reliability, honesty, and responsibility. Accountability ensures caregivers take ownership of actions and outcomes.", summary: "Professional conduct and accountability ensure reliable, high-quality care.", steps: ["Maintain professional behavior", "Follow policies consistently", "Communicate respectfully", "Report issues promptly", "Take responsibility for actions"], images: [{ image_id: "M9L4_IMG1", prompt: "HD professional illustration of a caregiver demonstrating professional conduct, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M9L4_IMG2", prompt: "HD vector illustration showing accountability in caregiving, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M9L5", title: "Boundaries and Role Clarity", body: "Clear boundaries protect both caregivers and elderly individuals. Role clarity prevents misunderstandings and ethical risks.", summary: "Boundaries and role clarity protect care quality and ethics.", steps: ["Understand role limits", "Avoid conflicts of interest", "Maintain professional distance", "Follow assigned duties", "Seek guidance when uncertain"], images: [{ image_id: "M9L5_IMG1", prompt: "HD professional illustration of a caregiver maintaining clear boundaries, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M9L5_IMG2", prompt: "HD vector illustration showing role clarity in home care, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M9L6", title: "Consent and Decision Support", body: "Consent ensures that care respects individual rights. Caregivers should explain actions and confirm agreement before proceeding.", summary: "Consent-centered care respects rights and autonomy.", steps: ["Explain care activities", "Confirm consent", "Respect refusals", "Follow care plans", "Document consent concerns"], images: [{ image_id: "M9L6_IMG1", prompt: "HD professional illustration of a caregiver explaining care respectfully, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M9L6_IMG2", prompt: "HD vector illustration showing consent-focused caregiving, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M9L7", title: "Reporting Incidents and Concerns", body: "Incident reporting ensures safety and continuous improvement. Concerns should be reported promptly and accurately.", summary: "Incident reporting improves safety and care quality.", steps: ["Identify reportable incidents", "Report promptly", "Use objective language", "Follow procedures", "Support follow-up"], images: [{ image_id: "M9L7_IMG1", prompt: "HD professional illustration of a caregiver reporting an incident responsibly, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M9L7_IMG2", prompt: "HD vector illustration showing structured incident reporting, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M9L8", title: "Working Within Policies and Procedures", body: "Policies and procedures provide clear guidance for consistent care. Following them reduces risk and ensures quality.", summary: "Policies and procedures ensure consistency and safety.", steps: ["Follow established procedures", "Stay informed of updates", "Ask questions when unclear", "Apply policies consistently", "Document as required"], images: [{ image_id: "M9L8_IMG1", prompt: "HD professional illustration of a caregiver following workplace procedures, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M9L8_IMG2", prompt: "HD vector illustration showing policy compliance in elderly care, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M9L9", title: "Professional Responsibility Practice and Reflection", body: "Practice and reflection help caregivers apply legal and ethical responsibilities consistently.", summary: "Practice and reflection strengthen legal, ethical, and professional care.", steps: ["Apply responsibilities daily", "Reflect on decisions", "Seek feedback", "Improve practices", "Maintain professionalism"], images: [{ image_id: "M9L9_IMG1", prompt: "HD professional illustration of a caregiver reflecting on professional responsibilities, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M9L9_IMG2", prompt: "HD vector illustration showing professional reflection in caregiving, clean professional design, NO TEXT IN IMAGE" }] }
    ]
  },
  {
    module_id: "M10",
    title: "Community Resources, Independence, and Long-Term Support",
    lessons: [
      { lesson_id: "M10L1", title: "Understanding Community Support Resources", body: "Community support resources play an important role in helping elderly individuals maintain independence and quality of life.", summary: "Community resources support independence, access to services, and long-term well-being.", steps: ["Understand the role of community resources", "Recognize types of available support", "Support informed decision-making", "Respect personal choice", "Encourage appropriate use"], images: [{ image_id: "M10L1_IMG1", prompt: "HD professional illustration of elderly individuals engaging with community support activities, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M10L1_IMG2", prompt: "HD vector illustration showing community-based support for elderly people, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M10L2", title: "Supporting Independence Through Daily Choices", body: "Supporting independence through daily choices helps elderly individuals maintain control, confidence, and dignity.", summary: "Daily choices support independence, dignity, and confidence.", steps: ["Offer simple daily choices", "Encourage participation", "Respect preferences", "Balance support and independence", "Observe confidence levels"], images: [{ image_id: "M10L2_IMG1", prompt: "HD professional illustration of a caregiver supporting elderly independence through choice, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M10L2_IMG2", prompt: "HD vector illustration showing independent decision-making in elderly care, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M10L3", title: "Encouraging Community Engagement", body: "Community engagement helps elderly individuals remain socially connected and mentally active.", summary: "Community engagement reduces isolation and supports emotional well-being.", steps: ["Identify interests", "Encourage participation", "Support access when appropriate", "Respect comfort levels", "Observe engagement benefits"], images: [{ image_id: "M10L3_IMG1", prompt: "HD professional illustration of elderly people participating in a community activity, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M10L3_IMG2", prompt: "HD vector illustration showing social engagement for elderly individuals, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M10L4", title: "Transportation and Access to Services", body: "Transportation access affects independence and quality of life. Many elderly individuals rely on assistance to attend appointments or activities.", summary: "Transportation access enables independence and community involvement.", steps: ["Understand transportation needs", "Support planning", "Ensure safety during travel", "Respect independence", "Communicate schedules"], images: [{ image_id: "M10L4_IMG1", prompt: "HD professional illustration of an elderly person safely using community transportation, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M10L4_IMG2", prompt: "HD vector illustration showing assisted transportation for elderly care, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M10L5", title: "Long-Term Care Planning Awareness", body: "Long-term care planning helps elderly individuals and families prepare for future needs.", summary: "Long-term care awareness supports informed planning.", steps: ["Understand long-term care concepts", "Respect planning decisions", "Support continuity of care", "Avoid decision-making beyond role", "Communicate appropriately"], images: [{ image_id: "M10L5_IMG1", prompt: "HD professional illustration of a caregiver supporting long-term care awareness, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M10L5_IMG2", prompt: "HD vector illustration showing future care planning awareness, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M10L6", title: "Promoting Independence Safely", body: "Promoting independence safely balances encouragement with risk awareness. Caregivers should support abilities while preventing harm.", summary: "Safe independence supports confidence while reducing risk.", steps: ["Assess abilities", "Encourage safe independence", "Monitor risks", "Provide support when needed", "Adjust care approaches"], images: [{ image_id: "M10L6_IMG1", prompt: "HD professional illustration of a caregiver encouraging safe independence for an elderly person, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M10L6_IMG2", prompt: "HD vector illustration showing balanced independence and safety in elderly care, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M10L7", title: "Supporting Transitions in Care", body: "Transitions in care can include changes in routine, environment, or support level. These transitions can be stressful for elderly individuals.", summary: "Support during transitions helps maintain stability and comfort.", steps: ["Communicate changes clearly", "Maintain routines when possible", "Provide reassurance", "Observe adjustment", "Report concerns"], images: [{ image_id: "M10L7_IMG1", prompt: "HD professional illustration of a caregiver supporting an elderly person during a care transition, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M10L7_IMG2", prompt: "HD vector illustration showing smooth care transitions in elderly support, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M10L8", title: "Working with Community and Care Teams", body: "Elderly care often involves collaboration among multiple support providers. Caregivers should work cooperatively while respecting roles.", summary: "Collaboration ensures coordinated and effective elderly care.", steps: ["Communicate clearly with teams", "Respect professional roles", "Share relevant observations", "Support coordinated care", "Maintain professionalism"], images: [{ image_id: "M10L8_IMG1", prompt: "HD professional illustration of caregivers collaborating with community support teams, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M10L8_IMG2", prompt: "HD vector illustration showing teamwork in elderly care support, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M10L9", title: "Independence and Long-Term Support Practice", body: "Practice and reflection help caregivers apply independence and support principles consistently.", summary: "Practice and reflection support effective independence and long-term care.", steps: ["Apply independence principles daily", "Reflect on support strategies", "Adjust care approaches", "Seek feedback", "Maintain consistency"], images: [{ image_id: "M10L9_IMG1", prompt: "HD professional illustration of a caregiver reflecting on long-term support practices, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M10L9_IMG2", prompt: "HD vector illustration showing thoughtful caregiving practice, clean professional design, NO TEXT IN IMAGE" }] }
    ]
  },
  {
    module_id: "M11",
    title: "Emergency Awareness and Basic Response",
    lessons: [
      { lesson_id: "M11L1", title: "Understanding Emergencies in Elderly Care", body: "Emergencies in elderly care are situations that require immediate attention to protect health, safety, or life.", summary: "Understanding emergencies enables fast, calm, and effective response in elderly care.", steps: ["Understand what qualifies as an emergency", "Recognize sudden health or safety changes", "Remain calm and alert", "Act promptly", "Follow emergency procedures"], images: [{ image_id: "M11L1_IMG1", prompt: "HD professional illustration of a caregiver responding calmly to an emergency situation at home, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M11L1_IMG2", prompt: "HD vector illustration showing emergency awareness in elderly care, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M11L2", title: "Responding to Falls and Injuries", body: "Falls and injuries are among the most common emergencies in elderly care. A fall can result in pain, fractures, or fear of future movement.", summary: "Proper fall response reduces further injury and supports safety.", steps: ["Remain calm after a fall", "Assess for pain or injury", "Avoid rushing movement", "Provide reassurance", "Seek appropriate assistance"], images: [{ image_id: "M11L2_IMG1", prompt: "HD professional illustration of a caregiver assisting an elderly person after a fall, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M11L2_IMG2", prompt: "HD vector illustration showing safe response to falls in elderly care, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M11L3", title: "Recognizing Medical Emergencies", body: "Medical emergencies require immediate attention and clear response. Elderly individuals may experience sudden medical changes that become life-threatening.", summary: "Recognizing medical emergencies ensures rapid and appropriate response.", steps: ["Recognize serious medical symptoms", "Act without delay", "Follow emergency instructions", "Stay with the individual", "Provide reassurance"], images: [{ image_id: "M11L3_IMG1", prompt: "HD professional illustration of a caregiver recognizing medical distress in an elderly person, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M11L3_IMG2", prompt: "HD vector illustration showing emergency medical recognition in elderly care, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M11L4", title: "Emergency Communication and Contact Procedures", body: "Clear communication during emergencies is essential. Caregivers must know who to contact and how to share information effectively.", summary: "Emergency communication ensures timely assistance and coordination.", steps: ["Know emergency contact information", "Communicate clearly and calmly", "Share accurate details", "Follow reporting procedures", "Document incidents"], images: [{ image_id: "M11L4_IMG1", prompt: "HD professional illustration of a caregiver making an emergency call calmly, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M11L4_IMG2", prompt: "HD vector illustration showing emergency communication procedures, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M11L5", title: "Basic First Response Awareness", body: "Basic first response awareness helps caregivers take immediate, safe actions while waiting for professional help.", summary: "Basic first response actions support safety during emergencies.", steps: ["Stay within training limits", "Ensure safety of the individual", "Monitor condition", "Prevent further injury", "Wait for professional assistance"], images: [{ image_id: "M11L5_IMG1", prompt: "HD professional illustration of a caregiver providing basic emergency support, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M11L5_IMG2", prompt: "HD vector illustration showing basic first response awareness, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M11L6", title: "Handling Panic and Stress During Emergencies", body: "Emergencies can cause panic for both caregivers and elderly individuals. Managing stress effectively supports better outcomes.", summary: "Managing panic supports safer emergency response.", steps: ["Remain calm", "Use steady communication", "Avoid rushing", "Provide reassurance", "Focus on safety"], images: [{ image_id: "M11L6_IMG1", prompt: "HD professional illustration of a calm caregiver during an emergency, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M11L6_IMG2", prompt: "HD vector illustration showing stress management during emergencies, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M11L7", title: "Environmental Emergencies at Home", body: "Environmental emergencies include hazards such as fire, gas leaks, or unsafe conditions. Quick recognition and response protect lives.", summary: "Environmental emergency awareness supports safety and well-being.", steps: ["Recognize environmental hazards", "Follow emergency plans", "Ensure personal safety", "Assist evacuation if needed", "Report incidents"], images: [{ image_id: "M11L7_IMG1", prompt: "HD professional illustration of a caregiver responding to a home environmental emergency, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M11L7_IMG2", prompt: "HD vector illustration showing environmental hazard response in elderly care, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M11L8", title: "Post-Emergency Care and Observation", body: "After an emergency, continued care and observation are essential. Elderly individuals may feel shaken or experience delayed effects.", summary: "Post-emergency care supports recovery and well-being.", steps: ["Monitor after emergency", "Provide reassurance", "Observe for changes", "Follow care guidance", "Document observations"], images: [{ image_id: "M11L8_IMG1", prompt: "HD professional illustration of a caregiver providing post-emergency support, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M11L8_IMG2", prompt: "HD vector illustration showing recovery monitoring after emergencies, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M11L9", title: "Emergency Response Practice and Reflection", body: "Practicing emergency response and reflecting on experiences helps caregivers improve readiness and confidence.", summary: "Practice and reflection improve emergency response readiness.", steps: ["Practice emergency procedures", "Reflect on responses", "Identify improvements", "Seek guidance", "Maintain preparedness"], images: [{ image_id: "M11L9_IMG1", prompt: "HD professional illustration of a caregiver reflecting on emergency response practices, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M11L9_IMG2", prompt: "HD vector illustration showing preparedness reflection in caregiving, clean professional design, NO TEXT IN IMAGE" }] }
    ]
  },
  {
    module_id: "M12",
    title: "Career Readiness, Professional Growth, and Course Completion",
    lessons: [
      { lesson_id: "M12L1", title: "Understanding the Role of a Home Care Assistant", body: "Understanding the role of a home care assistant is essential for career readiness and long-term success.", summary: "Understanding the caregiver role supports professional and effective elderly care.", steps: ["Understand job responsibilities", "Follow care plans", "Maintain professionalism", "Respect boundaries", "Support dignity and independence"], images: [{ image_id: "M12L1_IMG1", prompt: "HD professional illustration of a home care assistant performing daily duties, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M12L1_IMG2", prompt: "HD vector illustration showing professional caregiving responsibilities, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M12L2", title: "Building Professional Confidence", body: "Professional confidence helps home care assistants perform their duties calmly and effectively.", summary: "Professional confidence supports effective and calm caregiving.", steps: ["Apply learned skills", "Practice daily tasks", "Reflect on experiences", "Seek feedback", "Build self-assurance"], images: [{ image_id: "M12L2_IMG1", prompt: "HD professional illustration of a confident caregiver supporting an elderly person, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M12L2_IMG2", prompt: "HD vector illustration showing professional confidence in caregiving, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M12L3", title: "Communication Skills for Career Success", body: "Strong communication skills are essential for career success in home care. Clear communication supports teamwork, safety, and trust.", summary: "Effective communication supports teamwork and career success.", steps: ["Communicate clearly", "Listen actively", "Share accurate information", "Maintain respectful tone", "Support teamwork"], images: [{ image_id: "M12L3_IMG1", prompt: "HD professional illustration of effective communication between caregiver and elderly person, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M12L3_IMG2", prompt: "HD vector illustration showing professional communication skills, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M12L4", title: "Workplace Ethics and Reliability", body: "Ethics and reliability are critical for long-term success in home care. Caregivers are trusted with personal responsibilities.", summary: "Ethics and reliability support trust and long-term employment.", steps: ["Act ethically", "Be reliable and punctual", "Follow commitments", "Maintain honesty", "Support trust"], images: [{ image_id: "M12L4_IMG1", prompt: "HD professional illustration of an ethical caregiver at work, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M12L4_IMG2", prompt: "HD vector illustration showing reliability and ethics in caregiving, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M12L5", title: "Managing Work Challenges Professionally", body: "Work challenges are part of caregiving. Managing them professionally supports job satisfaction and quality care.", summary: "Professional challenge management supports resilience and quality care.", steps: ["Identify challenges", "Stay calm", "Seek guidance", "Apply problem-solving skills", "Maintain professionalism"], images: [{ image_id: "M12L5_IMG1", prompt: "HD professional illustration of a caregiver calmly handling work challenges, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M12L5_IMG2", prompt: "HD vector illustration showing professional problem-solving in caregiving, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M12L6", title: "Continuing Learning and Skill Development", body: "Continuing learning supports professional growth and improved care quality. Skills and knowledge should be updated regularly.", summary: "Continuous learning strengthens professional growth.", steps: ["Seek learning opportunities", "Reflect on experiences", "Improve skills", "Stay informed", "Support growth"], images: [{ image_id: "M12L6_IMG1", prompt: "HD professional illustration of a caregiver learning new skills, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M12L6_IMG2", prompt: "HD vector illustration showing professional development in caregiving, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M12L7", title: "Preparing for Employment Opportunities", body: "Preparing for employment opportunities involves understanding expectations and presenting skills professionally.", summary: "Employment preparation supports career success.", steps: ["Understand job expectations", "Prepare professional information", "Highlight skills", "Demonstrate reliability", "Maintain confidence"], images: [{ image_id: "M12L7_IMG1", prompt: "HD professional illustration of a caregiver preparing for employment, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M12L7_IMG2", prompt: "HD vector illustration showing career readiness in caregiving, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M12L8", title: "Maintaining Professional Well-Being", body: "Professional well-being supports long-term success and job satisfaction. Caring for oneself allows caregivers to provide better care.", summary: "Well-being supports sustained professional caregiving.", steps: ["Maintain work-life balance", "Recognize stress", "Practice self-care", "Seek support", "Protect well-being"], images: [{ image_id: "M12L8_IMG1", prompt: "HD professional illustration of a caregiver maintaining well-being and balance, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M12L8_IMG2", prompt: "HD vector illustration showing healthy work-life balance for caregivers, clean professional design, NO TEXT IN IMAGE" }] },
      { lesson_id: "M12L9", title: "Course Completion and Professional Reflection", body: "Course completion marks an important milestone in professional development. Reflection helps caregivers recognize growth and prepare for continued practice.", summary: "Course completion and reflection prepare caregivers for confident professional practice.", steps: ["Review course learning", "Reflect on growth", "Identify strengths", "Plan future development", "Commit to professional care"], images: [{ image_id: "M12L9_IMG1", prompt: "HD professional illustration of a caregiver reflecting after completing training, modern flat style, NO TEXT IN IMAGE" }, { image_id: "M12L9_IMG2", prompt: "HD vector illustration showing course completion and reflection, clean professional design, NO TEXT IN IMAGE" }] }
    ]
  }
];

async function initCloudinary() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary credentials not configured");
  }
  
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });
  
  console.log(`Cloudinary configured for cloud: ${cloudName}`);
}

async function generateImage(prompt: string): Promise<string> {
  const fullPrompt = `${prompt}. Style: HD quality, clean modern illustration, professional design. Home care and elderly support theme. Warm, welcoming color palette. ABSOLUTELY NO TEXT, NO WORDS, NO LETTERS, NO NUMBERS visible anywhere in the image. Pure visual illustration only.`;
  
  const response = await openai.images.generate({
    model: "dall-e-3",
    prompt: fullPrompt,
    n: 1,
    size: "1024x1024",
    quality: "standard",
  });

  const imageUrl = response.data[0].url;
  if (!imageUrl) {
    throw new Error("No image URL returned from OpenAI");
  }
  
  return imageUrl;
}

async function downloadImage(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      const chunks: Buffer[] = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    }).on('error', reject);
  });
}

async function uploadToCloudinary(imageBuffer: Buffer, publicId: string): Promise<string> {
  const result = await new Promise<any>((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder: 'courses/home-care/lessons',
        public_id: publicId,
        resource_type: 'image',
        quality: 'auto:good',
        fetch_format: 'auto',
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    ).end(imageBuffer);
  });
  
  return result.secure_url;
}

async function generateAndUploadImage(prompt: string, imageId: string): Promise<string> {
  try {
    console.log(`  Generating image: ${imageId}...`);
    const openaiUrl = await generateImage(prompt);
    const imageBuffer = await downloadImage(openaiUrl);
    const cloudinaryUrl = await uploadToCloudinary(imageBuffer, imageId);
    console.log(`  Uploaded: ${imageId}`);
    return cloudinaryUrl;
  } catch (error) {
    console.error(`  Failed to generate/upload ${imageId}:`, error);
    return '/api/placeholder/800/400';
  }
}

async function createLessonContentBlocks(
  lessonId: number,
  body: string,
  summary: string,
  steps: string[],
  imageUrls: string[]
): Promise<void> {
  const blocks = [
    {
      lessonId,
      blockType: 'image',
      title: 'Lesson Illustration',
      mediaUrl: imageUrls[0] || '/api/placeholder/800/400',
      mediaType: 'image',
      isCollapsible: false,
      isExpandedByDefault: true,
      displayOrder: 0
    },
    {
      lessonId,
      blockType: 'text',
      title: 'Introduction',
      content: body,
      isCollapsible: true,
      isExpandedByDefault: true,
      displayOrder: 1
    },
    {
      lessonId,
      blockType: 'accordion',
      title: 'Learning Steps',
      content: steps.map((step, i) => `${i + 1}. ${step}`).join('\n\n'),
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

export async function seedHomeCareElderlySupportCourse() {
  console.log('Starting Home Care and Elderly Support Course Seeding...');
  console.log('============================================================');
  
  await initCloudinary();
  
  const adminUserId = await ensureAdminUser();
  console.log(`Using admin user ID: ${adminUserId}`);
  
  const existing = await db.select().from(courses).where(eq(courses.title, COURSE_TITLE));
  if (existing.length > 0) {
    console.log('Home Care and Elderly Support Course already exists. Skipping...');
    return existing[0].id;
  }

  let [healthCategory] = await db.select().from(courseCategories).where(eq(courseCategories.name, 'Health & Wellness'));
  if (!healthCategory) {
    [healthCategory] = await db.insert(courseCategories).values({
      name: 'Health & Wellness',
      displayName: 'Health & Wellness',
      description: 'Health, care, and wellness courses',
      color: 'green',
      isActive: true
    }).returning();
  }

  console.log('Generating course thumbnail...');
  const thumbnailUrl = await generateAndUploadImage(
    "HD professional illustration of compassionate home care for elderly, showing a caregiver supporting an elderly person in a warm home environment, modern flat style",
    "home-care-course-thumbnail"
  );

  const [course] = await db.insert(courses).values({
    title: COURSE_TITLE,
    description: COURSE_STRUCTURE.description,
    thumbnailUrl: thumbnailUrl,
    image: thumbnailUrl,
    categoryId: healthCategory.id,
    pricingType: 'fixed_price',
    price: '29.99',
    isActive: true,
    approvalStatus: 'approved',
    createdBy: adminUserId,
    publisherName: 'EduFiliova Care Academy',
    publisherBio: 'Expert educators in home care and elderly support training',
    tags: ['Home Care', 'Elderly Care', 'Caregiving', 'Health Support', 'Professional Care'],
    language: 'en',
    difficulty: 'beginner',
    duration: 20,
    learningObjectives: COURSE_STRUCTURE.learning_outcomes,
    certificationType: 'certificate',
    credits: 10
  }).returning();

  console.log(`Created course: ${course.title} (ID: ${course.id})`);
  return course.id;
}

export async function seedModulesAndLessons(courseId: string, startModule: number = 1, endModule: number = 2) {
  console.log(`\nSeeding Modules ${startModule} to ${endModule}...`);
  console.log('================================================');

  const modulesToSeed = MODULES_DATA.slice(startModule - 1, endModule);

  for (const moduleData of modulesToSeed) {
    const moduleIndex = MODULES_DATA.indexOf(moduleData) + 1;
    console.log(`\nCreating Module ${moduleIndex}: ${moduleData.title}`);
    
    const [newModule] = await db.insert(modules).values({
      courseId,
      title: moduleData.title,
      description: `Module ${moduleIndex} of Home Care and Elderly Support`,
      orderNum: moduleIndex
    }).returning();

    console.log(`Module created: ${newModule.title}`);

    for (let i = 0; i < moduleData.lessons.length; i++) {
      const lessonData = moduleData.lessons[i];
      console.log(`\n  Processing Lesson ${i + 1}: ${lessonData.title}`);

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
        orderNum: i + 1,
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
  }
}

export async function runFullCourseGeneration() {
  try {
    console.log('\n========================================');
    console.log('HOME CARE COURSE FULL GENERATION');
    console.log('========================================\n');

    const courseId = await seedHomeCareElderlySupportCourse();
    if (!courseId) {
      console.log('Failed to create or find course');
      return;
    }

    console.log(`Course ID: ${courseId}`);

    for (let batch = 1; batch <= 6; batch++) {
      const startMod = (batch - 1) * 2 + 1;
      const endMod = Math.min(batch * 2, 12);
      
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
