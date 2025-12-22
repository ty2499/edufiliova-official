import { db } from "../server/db";
import { courses, modules, lessons, quizzes, lessonContentBlocks } from "../shared/schema";
import { eq } from "drizzle-orm";
import OpenAI from "openai";

const openai = new OpenAI();

interface LessonData {
  lesson_id: string;
  title: string;
  content: {
    body?: string;
    explanation?: string;
    steps: string[];
    images?: Array<{ image_id: string; prompt: string; purpose?: string; }>;
    exercise?: { task: string; expected_result?: string; expected_output?: string; };
    summary: string;
    example?: string;
  };
}

interface ModuleData {
  module_id: string;
  title: string;
  lessons: LessonData[];
}

// All modules from the attached JSON files
const courseModules: ModuleData[] = [
  // Module 1: Introduction to Professional Cleaning
  {
    module_id: "M1",
    title: "Introduction to Professional Cleaning",
    lessons: [
      {
        lesson_id: "M1L1",
        title: "What Is Professional Cleaning",
        content: {
          body: "Professional cleaning is a structured and organized service focused on maintaining cleanliness, hygiene, and safety in residential, commercial, and public spaces. Unlike casual or informal cleaning, professional cleaning follows defined standards, uses proper tools and products, and applies proven methods to achieve consistent and reliable results. The goal is not only to make a space look clean but also to ensure it is healthy, safe, and suitable for regular use.\n\nProfessional cleaners work in many environments including homes, offices, hospitals, schools, hotels, and industrial facilities. Each setting has unique requirements, and cleaners must adapt their methods accordingly. Trust, reliability, and attention to detail are essential qualities for anyone in this profession.\n\nThis lesson introduces the foundation of professional cleaning as a career and service. Understanding these principles will guide your learning throughout the course.",
          steps: [
            "Understand that professional cleaning follows structured standards",
            "Recognize the importance of hygiene and safety",
            "Learn the responsibilities involved in professional cleaning",
            "Understand correct product and tool usage",
            "View cleaning as a professional service and career"
          ],
          images: [
            { image_id: "M1L1_IMG1", prompt: "HD flat professional illustration of a cleaner working in a clean indoor environment using proper tools and protective equipment, modern style, NO TEXT IN IMAGE" },
            { image_id: "M1L1_IMG2", prompt: "HD vector illustration showing an organized cleaning process in a professional setting, clean modern style, NO TEXT IN IMAGE" }
          ],
          exercise: { task: "Describe two ways professional cleaning is different from casual home cleaning.", expected_result: "Explanation focusing on structure, safety, or responsibility." },
          summary: "Professional cleaning is a structured service that focuses on hygiene, safety, efficiency, and responsibility. It requires proper tools, correct methods, and professional behavior to maintain healthy environments."
        }
      },
      {
        lesson_id: "M1L2",
        title: "Types of Cleaning Services",
        content: {
          body: "Professional cleaning services are divided into several types based on the environment, purpose, and level of hygiene required. Understanding these categories helps cleaners choose appropriate methods, tools, and work routines. Each type of cleaning service has unique expectations and challenges, and professional cleaners must adapt their approach accordingly.\n\nResidential cleaning focuses on private living spaces such as houses and apartments. Tasks usually include cleaning bedrooms, kitchens, bathrooms, and living areas. Commercial cleaning covers offices, retail stores, and business premises. Healthcare cleaning requires strict hygiene protocols to prevent infection. Industrial cleaning addresses factories and warehouses with specialized equipment needs.\n\nUnderstanding these distinctions helps you prepare for different work environments and client expectations.",
          steps: [
            "Identify the type of environment being cleaned",
            "Understand service-specific requirements",
            "Select appropriate tools and products",
            "Follow safety and hygiene standards",
            "Complete tasks based on service type"
          ],
          images: [
            { image_id: "M1L2_IMG1", prompt: "HD professional illustration showing different cleaning environments such as home, office, and healthcare facility in a clean flat style, NO TEXT IN IMAGE" },
            { image_id: "M1L2_IMG2", prompt: "HD vector illustration of a cleaner adapting tools for different spaces, modern clean design, NO TEXT IN IMAGE" }
          ],
          exercise: { task: "List two types of cleaning services and explain one difference between them.", expected_result: "Clear comparison based on environment or requirements." },
          summary: "Professional cleaning services include residential, commercial, healthcare, and specialized cleaning. Each type has unique requirements, tools, and safety practices that cleaners must understand."
        }
      },
      {
        lesson_id: "M1L3",
        title: "Cleaning as a Career",
        content: {
          body: "Professional cleaning is not only a practical skill but also a real and respected career path. Many people begin cleaning work as an entry-level job, but with experience, reliability, and training, it can develop into long-term employment or even a business opportunity.\n\nCleaning services are needed everywhere - homes, offices, schools, hospitals, hotels, shopping centers, and more. This consistent demand means job security for skilled professionals. Career growth opportunities include supervisory roles, specialized cleaning services, training positions, and starting your own cleaning business.\n\nReliability, attention to detail, and professional behavior are highly valued in this industry. Building a reputation for quality work leads to better opportunities and higher earnings over time.",
          steps: [
            "Understand cleaning as a long-term job option",
            "Recognize areas of employment and specialization",
            "Learn the importance of reliability and professionalism",
            "Identify opportunities for career growth",
            "Value the social importance of cleaning work"
          ],
          images: [
            { image_id: "M1L3_IMG1", prompt: "HD professional illustration of a cleaner confidently working in a modern environment, clean flat style, NO TEXT IN IMAGE" },
            { image_id: "M1L3_IMG2", prompt: "HD vector illustration showing career progression in cleaning services through visual stages, modern professional style, NO TEXT IN IMAGE" }
          ],
          exercise: { task: "Write one reason why professional cleaning can be a stable career.", expected_result: "A clear explanation related to demand, flexibility, or growth." },
          summary: "Professional cleaning is a real career with steady demand, flexibility, and growth opportunities. With professionalism and commitment, cleaners can build long-term and meaningful work."
        }
      },
      {
        lesson_id: "M1L4",
        title: "Professional Cleaning Standards",
        content: {
          body: "Professional cleaning standards are guidelines that define how cleaning work should be performed to achieve consistent, safe, and high-quality results. These standards help ensure that cleaning tasks are completed correctly, efficiently, and responsibly.\n\nCleaning standards cover many areas including hygiene, safety, product use, and work quality. They guide cleaners on what to clean, how to clean it, and what results to expect. Following checklists and routines helps maintain consistency across different jobs and team members.\n\nProfessional behavior is also part of cleaning standards. This includes punctuality, appropriate dress, respectful communication, and responsible handling of client property. Meeting these standards builds trust and demonstrates professionalism.",
          steps: [
            "Understand the purpose of cleaning standards",
            "Follow routines and checklists",
            "Apply safety and hygiene rules",
            "Maintain consistent quality",
            "Demonstrate professional behavior"
          ],
          images: [
            { image_id: "M1L4_IMG1", prompt: "HD clean illustration showing a professional cleaner following a structured routine in a modern environment, flat style, NO TEXT IN IMAGE" },
            { image_id: "M1L4_IMG2", prompt: "HD vector illustration representing hygiene and safety practices in cleaning using symbols and shapes only, NO TEXT IN IMAGE" }
          ],
          exercise: { task: "Explain why consistency is important in professional cleaning.", expected_result: "An explanation focusing on trust, quality, or safety." },
          summary: "Professional cleaning standards guide quality, safety, hygiene, and behavior. Following these standards ensures reliable results and builds trust with clients and employers."
        }
      },
      {
        lesson_id: "M1L5",
        title: "Course Overview",
        content: {
          body: "This course overview lesson helps you understand what this Professional Cleaning Services course covers, how it is structured, and how to approach your learning journey.\n\nThe course begins with foundational knowledge about what professional cleaning is and why it matters. You'll learn about different types of cleaning services and career opportunities. Subsequent modules cover tools and equipment, cleaning products and chemicals, residential cleaning, commercial cleaning, health and safety, hygiene and infection control, time management, customer service, and surface cleaning techniques.\n\nEach lesson includes explanations, step-by-step guidance, practical exercises, and visual aids. Quizzes help you test your understanding. By completing this course, you'll be prepared for real-world professional cleaning work.",
          steps: [
            "Understand the full structure of the course",
            "Follow the course modules in order",
            "Apply safety and hygiene principles throughout",
            "Practice professional behavior and time management",
            "Prepare for real-world cleaning work"
          ],
          images: [
            { image_id: "M1L5_IMG1", prompt: "HD professional illustration showing an organized course learning journey with cleaning-related visuals in a clean modern flat style, NO TEXT IN IMAGE" },
            { image_id: "M1L5_IMG2", prompt: "HD vector illustration representing progression through training and readiness for professional cleaning work, modern professional style, NO TEXT IN IMAGE" }
          ],
          exercise: { task: "Write one personal goal you want to achieve by completing this course.", expected_result: "A clear and realistic learning or career goal." },
          summary: "This course overview explains the structure, goals, and learning path of the Professional Cleaning Services course. It prepares learners to study effectively and apply skills confidently in real cleaning environments."
        }
      }
    ]
  },
  // Module 2: Cleaning Tools and Equipment
  {
    module_id: "M2",
    title: "Cleaning Tools and Equipment",
    lessons: [
      {
        lesson_id: "M2L1",
        title: "Basic Cleaning Tools",
        content: {
          body: "Basic cleaning tools are the foundation of all professional cleaning work. Before using machines or advanced equipment, every cleaner must understand simple hand tools and their correct purpose. Using the right tool for the right task improves efficiency, protects surfaces, and reduces physical strain.\n\nCommon basic tools include brooms (for sweeping loose dirt), mops (for wet floor cleaning), microfiber cloths (for dusting and wiping), buckets (for water and solutions), brushes (for scrubbing), squeegees (for windows and glass), dustpans, and spray bottles.\n\nEach tool has specific uses. Microfiber cloths trap dust effectively without scratching. Different mop heads suit different floor types. Proper tool selection and maintenance ensure professional results.",
          steps: [
            "Identify common basic cleaning tools",
            "Understand the purpose of each tool",
            "Choose the correct tool for each task",
            "Use tools safely and efficiently",
            "Clean and store tools properly"
          ],
          images: [
            { image_id: "M2L1_IMG1", prompt: "HD flat professional illustration showing basic cleaning tools such as broom, mop, bucket, and cloth arranged neatly, modern style, NO TEXT IN IMAGE" },
            { image_id: "M2L1_IMG2", prompt: "HD vector illustration of a cleaner using simple hand tools correctly on indoor surfaces, clean professional style, NO TEXT IN IMAGE" }
          ],
          exercise: { task: "Name three basic cleaning tools and explain one task for each.", expected_result: "Three tools with correct usage explained." },
          summary: "Basic cleaning tools such as brooms, mops, cloths, and brushes are essential for professional cleaning. Using the right tool correctly improves efficiency, safety, and cleaning quality."
        }
      },
      {
        lesson_id: "M2L2",
        title: "Cleaning Machines Overview",
        content: {
          body: "Cleaning machines are used in professional cleaning to improve efficiency, reduce physical effort, and achieve deeper cleaning results. While basic tools handle many tasks, machines are essential for large areas, high-traffic spaces, and specialized cleaning needs.\n\nCommon cleaning machines include vacuum cleaners (for removing dust and debris), floor scrubbers (for deep cleaning hard floors), carpet extractors (for deep carpet cleaning), pressure washers (for outdoor surfaces), and steam cleaners (for sanitizing without chemicals).\n\nProper machine operation requires training. Understanding controls, safety features, and maintenance requirements ensures effective use and prevents damage or injury.",
          steps: [
            "Understand the purpose of cleaning machines",
            "Identify common types of cleaning machines",
            "Learn safe operation practices",
            "Use machines correctly for each task",
            "Maintain machines regularly"
          ],
          images: [
            { image_id: "M2L2_IMG1", prompt: "HD professional illustration showing common cleaning machines such as vacuum and floor scrubber in use, modern flat style, NO TEXT IN IMAGE" },
            { image_id: "M2L2_IMG2", prompt: "HD vector illustration of a cleaner operating a cleaning machine safely in a commercial space, clean professional design, NO TEXT IN IMAGE" }
          ],
          exercise: { task: "Explain one advantage of using cleaning machines in professional cleaning.", expected_result: "An explanation focusing on efficiency, consistency, or safety." },
          summary: "Cleaning machines such as vacuums and floor scrubbers improve efficiency and results in professional cleaning. Proper use and maintenance are essential for safety and quality."
        }
      },
      {
        lesson_id: "M2L3",
        title: "Using Equipment Safely",
        content: {
          body: "Using cleaning equipment safely is one of the most important responsibilities of a professional cleaner. Cleaning tools and machines are designed to make work easier and faster, but if used incorrectly, they can cause injuries, damage property, or create unsafe environments.\n\nBefore using any equipment, inspect it carefully for damage, wear, or malfunction. Check electrical cords, wheels, handles, and moving parts. Wear appropriate protective gear including gloves, non-slip footwear, and eye protection when needed.\n\nFollow proper lifting techniques to prevent back strain. Keep work areas clear to avoid trips and falls. Store equipment properly after use to maintain it and prevent accidents.",
          steps: [
            "Inspect equipment before use",
            "Wear appropriate protective gear",
            "Use correct lifting and handling techniques",
            "Follow electrical safety rules",
            "Store equipment properly after use"
          ],
          images: [
            { image_id: "M2L3_IMG1", prompt: "HD professional illustration of a cleaner using equipment safely with protective gear in a clean environment, modern flat style, NO TEXT IN IMAGE" },
            { image_id: "M2L3_IMG2", prompt: "HD vector illustration showing safe handling and positioning of cleaning equipment, clean professional design, NO TEXT IN IMAGE" }
          ],
          exercise: { task: "Describe one safety step you should take before using cleaning equipment.", expected_result: "A clear explanation related to inspection, protection, or handling." },
          summary: "Safe equipment use protects cleaners and others from injury. Inspection, protective gear, correct handling, and proper storage are essential safety practices in professional cleaning."
        }
      },
      {
        lesson_id: "M2L4",
        title: "Maintaining Cleaning Tools",
        content: {
          body: "Maintaining cleaning tools is essential for ensuring effective cleaning, safety, and long-term cost savings. Well-maintained tools perform better, last longer, and reduce the risk of spreading dirt or germs.\n\nRegular cleaning of tools is the first step. After each use, clean mops, cloths, brushes, and buckets to remove dirt and residue. Allow tools to dry completely before storage to prevent mold and odor. Inspect tools regularly for wear, damage, or deterioration.\n\nReplace worn or damaged tools promptly. A damaged mop head or frayed brush cannot clean effectively and may damage surfaces. Proper storage in clean, dry areas protects tools and keeps them organized.",
          steps: [
            "Clean tools after each use",
            "Inspect tools for damage regularly",
            "Store tools in clean, dry areas",
            "Maintain machines according to guidelines",
            "Replace or repair worn tools promptly"
          ],
          images: [
            { image_id: "M2L4_IMG1", prompt: "HD professional illustration showing cleaning tools being washed and prepared for storage, modern flat style, NO TEXT IN IMAGE" },
            { image_id: "M2L4_IMG2", prompt: "HD vector illustration of neatly stored cleaning tools in an organized area, clean professional design, NO TEXT IN IMAGE" }
          ],
          exercise: { task: "Explain why maintaining cleaning tools is important for professional cleaning.", expected_result: "An explanation focusing on hygiene, safety, or efficiency." },
          summary: "Proper maintenance of cleaning tools ensures effective results, safety, and professionalism. Regular cleaning, inspection, and correct storage are key maintenance practices."
        }
      },
      {
        lesson_id: "M2L5",
        title: "Tool Handling Practice",
        content: {
          body: "Tool handling practice focuses on applying correct techniques when using cleaning tools and equipment in real working situations. Knowing how to use tools is important, but practicing proper handling ensures that cleaners work efficiently, safely, and consistently.\n\nProfessional cleaning requires coordination, control, and awareness when handling tools. Poor handling leads to fatigue, injury, and poor results. Good posture while sweeping, mopping, or vacuuming reduces strain and improves effectiveness.\n\nOrganize tools before starting work so everything is within easy reach. Follow a systematic cleaning order to avoid backtracking. Handle machines smoothly and carefully, avoiding sudden movements that could cause accidents or damage.",
          steps: [
            "Maintain correct posture while using tools",
            "Organize tools before starting work",
            "Follow a systematic cleaning order",
            "Handle machines smoothly and carefully",
            "Store tools properly after use"
          ],
          images: [
            { image_id: "M2L5_IMG1", prompt: "HD professional illustration of a cleaner practicing correct posture while using hand tools in a clean indoor environment, modern flat style, NO TEXT IN IMAGE" },
            { image_id: "M2L5_IMG2", prompt: "HD vector illustration showing organized tool handling and efficient workflow in professional cleaning, clean professional design, NO TEXT IN IMAGE" }
          ],
          exercise: { task: "Describe one tool handling habit that improves safety or efficiency.", expected_result: "A clear explanation related to posture, organization, or movement." },
          summary: "Tool handling practice helps cleaners apply correct techniques in real work situations. Proper posture, organization, systematic movement, and awareness improve safety, efficiency, and professional quality."
        }
      }
    ]
  },
  // Module 3: Cleaning Products and Chemicals
  {
    module_id: "M3",
    title: "Cleaning Products and Chemicals",
    lessons: [
      {
        lesson_id: "M3L1",
        title: "Types of Cleaning Products",
        content: {
          body: "Cleaning products are substances used to remove dirt, stains, germs, and unwanted materials from surfaces. In professional cleaning, understanding different types of cleaning products is essential for achieving effective results while protecting health, surfaces, and the environment.\n\nMajor categories include: Detergents (for general cleaning and grease removal), Disinfectants (for killing germs and bacteria), Degreasers (for heavy grease in kitchens), Glass cleaners (for streak-free windows), Floor cleaners (formulated for different floor types), and Specialty products (for specific surfaces or stains).\n\nUsing the wrong product can reduce cleaning quality or cause damage. Always match products to surfaces and tasks, and follow manufacturer instructions.",
          steps: [
            "Identify different categories of cleaning products",
            "Understand the purpose of each product type",
            "Match products to surfaces and tasks",
            "Use products according to instructions",
            "Avoid misuse or overuse of chemicals"
          ],
          images: [
            { image_id: "M3L1_IMG1", prompt: "HD professional illustration showing different types of cleaning product containers arranged neatly, modern flat style, NO TEXT IN IMAGE" },
            { image_id: "M3L1_IMG2", prompt: "HD vector illustration of a cleaner selecting appropriate cleaning products for different surfaces, clean professional design, NO TEXT IN IMAGE" }
          ],
          exercise: { task: "Name two types of cleaning products and explain their main use.", expected_result: "Two product types with correct purposes explained." },
          summary: "Professional cleaning uses different types of products, each designed for specific tasks. Understanding product categories helps cleaners work safely and achieve effective results."
        }
      },
      {
        lesson_id: "M3L2",
        title: "Reading Product Labels",
        content: {
          body: "Reading product labels is a critical skill in professional cleaning. Labels provide essential information about how a product should be used, what it contains, and what safety precautions are required. Ignoring label instructions can lead to ineffective cleaning, damaged surfaces, or serious health risks.\n\nProduct labels include: Product purpose (what it's designed to clean), Directions for use (how to apply, dilute, or rinse), Contact time (how long to leave on surface), Safety warnings (hazards, required protection), Storage instructions, and Disposal guidelines.\n\nAlways read labels before using any product, especially new ones. Follow dilution ratios exactly - using too much or too little affects both safety and effectiveness.",
          steps: [
            "Check the product purpose on the label",
            "Follow dilution and usage instructions",
            "Observe required contact time",
            "Read and follow safety warnings",
            "Store and dispose of products correctly"
          ],
          images: [
            { image_id: "M3L2_IMG1", prompt: "HD professional illustration of a cleaner carefully examining a cleaning product label, modern flat style, NO TEXT IN IMAGE" },
            { image_id: "M3L2_IMG2", prompt: "HD vector illustration showing safe product usage preparation with protective gear and tools, clean professional design, NO TEXT IN IMAGE" }
          ],
          exercise: { task: "Explain why following dilution instructions on a product label is important.", expected_result: "An explanation related to safety or effectiveness." },
          summary: "Product labels provide essential information about usage, safety, and storage. Reading and following labels is a key professional cleaning responsibility."
        }
      },
      {
        lesson_id: "M3L3",
        title: "Safe Chemical Handling",
        content: {
          body: "Safe chemical handling is a critical responsibility in professional cleaning. Cleaning products often contain chemicals that can be harmful if used incorrectly. Understanding how to handle these products safely protects cleaners, clients, and the environment.\n\nKey safety practices include: Reading and understanding product labels before use, wearing appropriate protective equipment (gloves, masks, eye protection), diluting chemicals correctly according to instructions, never mixing different chemical products (which can create toxic gases), ensuring adequate ventilation when using strong chemicals, and storing chemicals safely away from heat and incompatible materials.\n\nIn case of accidental exposure, know the correct response - whether to rinse with water, seek medical attention, or ventilate the area.",
          steps: [
            "Read and understand product labels",
            "Wear appropriate protective equipment",
            "Dilute chemicals correctly",
            "Avoid mixing chemical products",
            "Store chemicals safely"
          ],
          images: [
            { image_id: "M3L3_IMG1", prompt: "HD professional illustration showing a cleaner wearing protective gear while handling cleaning chemicals, modern flat style, NO TEXT IN IMAGE" },
            { image_id: "M3L3_IMG2", prompt: "HD vector illustration of safe chemical storage and handling practices in a cleaning area, clean professional design, NO TEXT IN IMAGE" }
          ],
          exercise: { task: "Name one safety rule that should always be followed when handling cleaning chemicals.", expected_result: "A clear safety rule related to protection, dilution, or storage." },
          summary: "Safe chemical handling protects cleaners and others from harm. Proper understanding, protective equipment, correct dilution, and safe storage are essential practices."
        }
      },
      {
        lesson_id: "M3L4",
        title: "Eco-Friendly Products",
        content: {
          body: "Eco-friendly cleaning products are designed to reduce environmental impact while maintaining effective cleaning performance. As awareness of health and environmental issues grows, many professional cleaning services are adopting eco-friendly products as part of responsible practices.\n\nEco-friendly products often contain fewer harsh chemicals, produce fewer harmful fumes, are biodegradable, and come in recyclable packaging. They are gentler on surfaces, safer for people with sensitivities, and reduce water and air pollution.\n\nHowever, eco-friendly products must still be used correctly. They may require different application methods or longer contact times. Understanding their proper use ensures you get effective results while supporting sustainability.",
          steps: [
            "Understand what eco-friendly products are",
            "Identify appropriate eco-friendly cleaning tasks",
            "Follow usage instructions carefully",
            "Maintain safety practices",
            "Support sustainable cleaning habits"
          ],
          images: [
            { image_id: "M3L4_IMG1", prompt: "HD professional illustration showing eco-friendly cleaning products in use in a clean indoor environment, modern flat style, NO TEXT IN IMAGE" },
            { image_id: "M3L4_IMG2", prompt: "HD vector illustration representing sustainable cleaning practices with natural elements and tools, clean professional design, NO TEXT IN IMAGE" }
          ],
          exercise: { task: "Explain one benefit of using eco-friendly cleaning products.", expected_result: "An explanation related to health, environment, or air quality." },
          summary: "Eco-friendly products reduce environmental impact and improve health conditions. When used correctly, they support professional cleaning standards and sustainable practices."
        }
      },
      {
        lesson_id: "M3L5",
        title: "Product Safety Practice",
        content: {
          body: "Product safety practice focuses on applying safe habits consistently when working with cleaning products and chemicals. Knowing safety rules is important, but practicing them daily is what truly protects cleaners, clients, and environments.\n\nProfessional cleaners work with multiple products during a single shift. Each product may have different instructions, risks, and handling requirements. Developing consistent safety habits ensures protection regardless of which product is being used.\n\nKey habits include: Always preparing products and protective equipment before starting, using products exactly as instructed, monitoring for signs of irritation or adverse reactions, keeping products labeled and organized, and cleaning up and storing products properly after use.",
          steps: [
            "Prepare products and protective equipment before work",
            "Use products exactly as instructed",
            "Monitor personal and environmental safety",
            "Keep products labeled and organized",
            "Clean up and store products properly"
          ],
          images: [
            { image_id: "M3L5_IMG1", prompt: "HD professional illustration showing a cleaner carefully preparing cleaning products and safety equipment before use, modern flat style, NO TEXT IN IMAGE" },
            { image_id: "M3L5_IMG2", prompt: "HD vector illustration of proper product storage and safe handling practices in a cleaning area, clean professional design, NO TEXT IN IMAGE" }
          ],
          exercise: { task: "Describe one safety habit you should practice every time you use cleaning products.", expected_result: "A clear habit related to preparation, usage, or cleanup." },
          summary: "Product safety practice turns safety knowledge into daily habits. Consistent preparation, correct use, monitoring, and cleanup protect health and maintain professional cleaning standards."
        }
      }
    ]
  },
  // Module 4: Residential Cleaning
  {
    module_id: "M4",
    title: "Residential Cleaning",
    lessons: [
      {
        lesson_id: "M4L1",
        title: "Living Room Cleaning",
        content: {
          body: "Living room cleaning is an essential part of residential cleaning because living rooms are high-use spaces where families relax, guests gather, and daily activities take place. Professional cleaning of living rooms focuses on cleanliness, comfort, and hygiene while protecting furniture, electronics, and personal items.\n\nStart with preparation: gather appropriate tools, identify surface types, and note any fragile or valuable items. Dust surfaces from top to bottom - start with ceiling fans, light fixtures, and shelves, then work down to furniture and floors. This prevents dust from falling onto already-cleaned surfaces.\n\nClean furniture according to material type (leather, fabric, wood), vacuum or mop floors as appropriate, and finish with a final inspection to ensure nothing was missed and the room is tidy.",
          steps: [
            "Prepare tools and inspect the room",
            "Dust surfaces from top to bottom",
            "Clean furniture according to material",
            "Vacuum or mop floors correctly",
            "Perform final inspection and tidying"
          ],
          images: [
            { image_id: "M4L1_IMG1", prompt: "HD professional illustration of a cleaner dusting and organizing a modern living room, clean flat style, NO TEXT IN IMAGE" },
            { image_id: "M4L1_IMG2", prompt: "HD vector illustration showing systematic living room cleaning steps in a residential space, modern professional design, NO TEXT IN IMAGE" }
          ],
          exercise: { task: "List two living room surfaces that require different cleaning methods.", expected_result: "Correct identification of surfaces with appropriate care." },
          summary: "Professional living room cleaning focuses on dusting, furniture care, floor cleaning, and organization. Systematic methods ensure comfort, hygiene, and surface protection."
        }
      },
      {
        lesson_id: "M4L2",
        title: "Kitchen Cleaning",
        content: {
          body: "Kitchen cleaning is one of the most important areas of residential cleaning because kitchens are closely linked to food safety and hygiene. Professional kitchen cleaning focuses on removing grease, food residue, and bacteria while maintaining safety and organization.\n\nPreparation is essential: gather degreasers, disinfectants, cloths, and appropriate tools. Declutter surfaces before cleaning. Clean and disinfect food preparation areas thoroughly - these surfaces contact food directly and must be sanitary.\n\nDegrease appliances (stovetop, oven, microwave, range hood) and fixtures (faucets, handles). Clean the inside of the refrigerator if needed. Finish with floor cleaning and proper waste disposal. Pay special attention to high-touch areas like handles and switches.",
          steps: [
            "Prepare cleaning tools and products",
            "Declutter and organize surfaces",
            "Clean and disinfect food preparation areas",
            "Degrease appliances and fixtures",
            "Clean floors and manage waste"
          ],
          images: [
            { image_id: "M4L2_IMG1", prompt: "HD professional illustration of a cleaner cleaning kitchen countertops and appliances in a modern home, flat style, NO TEXT IN IMAGE" },
            { image_id: "M4L2_IMG2", prompt: "HD vector illustration showing safe and systematic kitchen cleaning steps in a residential environment, modern professional design, NO TEXT IN IMAGE" }
          ],
          exercise: { task: "Explain why disinfecting kitchen surfaces is important.", expected_result: "Explanation related to hygiene or food safety." },
          summary: "Kitchen cleaning focuses on hygiene, grease removal, and safety. Systematic cleaning methods help maintain food-safe and healthy kitchen environments."
        }
      },
      {
        lesson_id: "M4L3",
        title: "Bathroom Cleaning",
        content: {
          body: "Bathroom cleaning is one of the most sensitive and important tasks in residential cleaning because bathrooms contain moisture, bacteria, and high-contact surfaces. Professional bathroom cleaning focuses on hygiene, disinfection, odor control, and safety.\n\nStart with preparation: gather disinfectants, brushes, cloths, gloves, and protective equipment. Ensure ventilation by opening windows or turning on fans. Work from top to bottom and from clean to dirty areas.\n\nClean mirrors and high surfaces first, then disinfect toilets, sinks, and bathtubs thoroughly. Pay attention to grout, drains, and hidden areas where mold can develop. Clean floors last, ensuring no water pooling. Empty waste bins and replace liners.",
          steps: [
            "Prepare tools and ventilate the bathroom",
            "Clean high surfaces and mirrors",
            "Disinfect toilets and sinks",
            "Clean showers and bathtubs",
            "Clean floors and manage waste"
          ],
          images: [
            { image_id: "M4L3_IMG1", prompt: "HD professional illustration of a cleaner disinfecting a bathroom sink and toilet, modern flat style, NO TEXT IN IMAGE" },
            { image_id: "M4L3_IMG2", prompt: "HD vector illustration showing systematic bathroom cleaning steps in a residential space, clean professional design, NO TEXT IN IMAGE" }
          ],
          exercise: { task: "Explain why bathrooms require stronger hygiene practices than other rooms.", expected_result: "Explanation related to germs, moisture, or health." },
          summary: "Bathroom cleaning focuses on hygiene, disinfection, and safety. Proper methods help prevent bacteria spread and maintain sanitary living spaces."
        }
      },
      {
        lesson_id: "M4L4",
        title: "Bedroom Cleaning",
        content: {
          body: "Bedroom cleaning focuses on comfort, cleanliness, and organization. Bedrooms are personal spaces, so professional cleaners must work carefully, respect privacy, and follow instructions closely. Clean bedrooms support better rest, air quality, and overall well-being.\n\nPreparation includes gathering appropriate tools and identifying surfaces such as furniture, floors, and fabrics. Avoid handling personal items unless instructed. Communication and respect are essential.\n\nDust surfaces from top to bottom: light fixtures, shelves, headboards, nightstands, dressers. Clean mirrors and glass. Vacuum carpets or mop hard floors, including under furniture where possible. Change or straighten bedding if requested. Finish with a tidy, organized appearance.",
          steps: [
            "Prepare tools and respect privacy",
            "Dust surfaces from top to bottom",
            "Clean furniture and fabrics carefully",
            "Vacuum or mop floors",
            "Perform final inspection and organization"
          ],
          images: [
            { image_id: "M4L4_IMG1", prompt: "HD professional illustration of a cleaner dusting and organizing a modern bedroom, clean flat style, NO TEXT IN IMAGE" },
            { image_id: "M4L4_IMG2", prompt: "HD vector illustration showing systematic bedroom cleaning steps in a residential space, modern professional design, NO TEXT IN IMAGE" }
          ],
          exercise: { task: "List two bedroom items that require gentle cleaning methods.", expected_result: "Correct identification of delicate surfaces or items." },
          summary: "Bedroom cleaning emphasizes comfort, organization, and respect for personal space. Proper methods help maintain healthy and restful environments."
        }
      },
      {
        lesson_id: "M4L5",
        title: "Home Cleaning Checklist",
        content: {
          body: "A home cleaning checklist is a structured guide that helps professional cleaners complete residential cleaning tasks consistently and efficiently. Checklists reduce missed tasks, improve time management, and support quality standards.\n\nChecklists typically include room-by-room tasks such as dusting, surface cleaning, floor care, and waste removal. They help cleaners follow a logical order and maintain consistency across different jobs. Each room has its specific requirements that the checklist addresses.\n\nCustomize checklists based on client needs and preferences. Some clients may request additional services or have specific priorities. Review the completed checklist before finishing to ensure all tasks are done. Checklists also serve as documentation of work completed.",
          steps: [
            "Follow room-by-room cleaning tasks",
            "Use checklists to maintain consistency",
            "Manage time effectively",
            "Customize based on client needs",
            "Review tasks before completion"
          ],
          images: [
            { image_id: "M4L5_IMG1", prompt: "HD professional illustration showing a cleaner following a home cleaning routine in a residential space, modern flat style, NO TEXT IN IMAGE" },
            { image_id: "M4L5_IMG2", prompt: "HD vector illustration representing organized residential cleaning workflow using visual elements only, clean professional design, NO TEXT IN IMAGE" }
          ],
          exercise: { task: "Explain one benefit of using a home cleaning checklist.", expected_result: "Explanation related to consistency, time, or quality." },
          summary: "Home cleaning checklists help ensure consistent, efficient, and professional residential cleaning. They support quality control and organized work routines."
        }
      }
    ]
  },
  // Module 5: Commercial Cleaning
  {
    module_id: "M5",
    title: "Commercial Cleaning",
    lessons: [
      {
        lesson_id: "M5L1",
        title: "Office Cleaning Basics",
        content: {
          body: "Office cleaning is a core part of commercial cleaning. Offices are shared work environments where cleanliness directly affects productivity, health, and professional image. Professional office cleaning focuses on maintaining hygiene, organization, and minimal disruption to daily operations.\n\nPreparation is essential: understand the office layout, identify different work areas, and gather appropriate tools. Office cleaning often occurs after business hours to avoid disruption. Respect personal workspaces and avoid disturbing documents, equipment, or personal items on desks.\n\nClean desks and workstations carefully, dust surfaces from top to bottom, clean common areas and break rooms thoroughly, empty all waste bins, and finish with floor care. Pay special attention to high-touch surfaces like door handles, light switches, and shared equipment.",
          steps: [
            "Prepare tools and review office layout",
            "Clean desks and workstations carefully",
            "Dust surfaces from top to bottom",
            "Clean common areas and break rooms",
            "Perform final inspection and floor care"
          ],
          images: [
            { image_id: "M5L1_IMG1", prompt: "HD professional illustration of a cleaner cleaning desks and workstations in a modern office, flat style, NO TEXT IN IMAGE" },
            { image_id: "M5L1_IMG2", prompt: "HD vector illustration showing systematic office cleaning workflow in a commercial space, clean professional design, NO TEXT IN IMAGE" }
          ],
          exercise: { task: "Explain why office cleaning must avoid disturbing personal items.", expected_result: "Explanation related to professionalism or trust." },
          summary: "Office cleaning focuses on hygiene, organization, and care for shared workspaces. Professional methods help maintain healthy and productive office environments."
        }
      },
      {
        lesson_id: "M5L2",
        title: "Restroom Cleaning",
        content: {
          body: "Restroom cleaning in commercial spaces is one of the most critical cleaning tasks because restrooms are high-use areas with high hygiene risks. Professional restroom cleaning focuses on sanitation, odor control, and safety. Clean restrooms support health, comfort, and positive impressions.\n\nPreparation is especially important: wear protective equipment, gather disinfectants and brushes, and place 'Cleaning in Progress' signage. Disinfect all high-touch surfaces including door handles, faucets, flush handles, and dispensers.\n\nClean toilets and urinals carefully and thoroughly. Clean sinks, counters, and mirrors. Mop floors with appropriate disinfectant. Restock supplies (paper towels, toilet paper, soap). Empty waste bins and perform final checks to ensure everything is clean and stocked.",
          steps: [
            "Prepare protective equipment and signage",
            "Disinfect high-touch surfaces",
            "Clean toilets and urinals carefully",
            "Clean sinks, mirrors, and floors",
            "Manage waste and perform final checks"
          ],
          images: [
            { image_id: "M5L2_IMG1", prompt: "HD professional illustration of a cleaner disinfecting a commercial restroom sink and fixtures, modern flat style, NO TEXT IN IMAGE" },
            { image_id: "M5L2_IMG2", prompt: "HD vector illustration showing systematic restroom cleaning steps in a commercial building, clean professional design, NO TEXT IN IMAGE" }
          ],
          exercise: { task: "Describe one reason why restroom cleaning requires strict hygiene practices.", expected_result: "Explanation related to health or germ prevention." },
          summary: "Commercial restroom cleaning focuses on sanitation, safety, and odor control. Strict hygiene practices help maintain clean and healthy public facilities."
        }
      },
      {
        lesson_id: "M5L3",
        title: "Floor Cleaning Methods",
        content: {
          body: "Floor cleaning in commercial environments requires careful planning, correct product selection, and consistent techniques. Commercial floors experience heavy foot traffic and must be cleaned regularly to maintain safety, appearance, and durability.\n\nThe first step is identifying the floor type: tile, vinyl, laminate, concrete, carpet, or hardwood. Each requires different products and methods. Using wrong products can cause damage, discoloration, or safety hazards.\n\nRemove loose dirt first by sweeping or dust mopping. Then apply the appropriate cleaning method: wet mopping, machine scrubbing, or extraction. Control moisture carefully - excess water can damage floors and create slip hazards. Place wet floor signs as needed. Inspect floors after cleaning for missed spots or damage.",
          steps: [
            "Identify floor type",
            "Remove loose dirt",
            "Apply correct cleaning method",
            "Control moisture and safety",
            "Inspect and maintain floors"
          ],
          images: [
            { image_id: "M5L3_IMG1", prompt: "HD professional illustration of a cleaner mopping a commercial floor using proper technique, modern flat style, NO TEXT IN IMAGE" },
            { image_id: "M5L3_IMG2", prompt: "HD vector illustration showing different commercial floor surfaces being cleaned, clean professional design, NO TEXT IN IMAGE" }
          ],
          exercise: { task: "Explain why floor type identification is important before cleaning.", expected_result: "Explanation related to safety or surface protection." },
          summary: "Commercial floor cleaning requires correct methods, surface awareness, and safety practices to maintain clean and durable floors."
        }
      },
      {
        lesson_id: "M5L4",
        title: "High-Traffic Areas",
        content: {
          body: "High-traffic areas in commercial spaces require special attention because they collect dirt quickly and experience constant use. These areas include entrances, hallways, staircases, elevators, and shared walkways. Professional cleaning of high-traffic zones focuses on frequent maintenance, safety, and appearance.\n\nPreparation includes identifying high-use zones and scheduling cleaning at suitable times. Cleaning during low-traffic periods reduces disruption and improves results. Use floor mats at entrances to reduce dirt tracking.\n\nRemove dirt frequently - high-traffic areas may need cleaning multiple times daily. Apply safety measures including wet floor signs. Maintain consistent routines to prevent dirt buildup. Pay attention to corners and edges where dirt accumulates. Regular maintenance prevents permanent staining and surface damage.",
          steps: [
            "Identify high-traffic zones",
            "Schedule cleaning appropriately",
            "Remove dirt frequently",
            "Apply safety measures",
            "Maintain consistent routines"
          ],
          images: [
            { image_id: "M5L4_IMG1", prompt: "HD professional illustration of a cleaner maintaining a busy commercial hallway, modern flat style, NO TEXT IN IMAGE" },
            { image_id: "M5L4_IMG2", prompt: "HD vector illustration showing safe cleaning practices in high-traffic areas, clean professional design, NO TEXT IN IMAGE" }
          ],
          exercise: { task: "List one reason high-traffic areas need frequent cleaning.", expected_result: "Explanation related to safety or cleanliness." },
          summary: "High-traffic area cleaning requires frequent attention, safety awareness, and consistent routines to maintain commercial standards."
        }
      },
      {
        lesson_id: "M5L5",
        title: "Commercial Cleaning Checklist",
        content: {
          body: "A commercial cleaning checklist is a structured tool that helps cleaners perform tasks consistently and efficiently. Checklists are especially important in commercial environments where multiple rooms, surfaces, and responsibilities must be managed.\n\nChecklists provide clear task guidance: what needs to be cleaned, how often, and in what order. This reduces confusion and improves efficiency. Using checklists supports quality control - cleaners can confirm completed tasks, and supervisors can verify work.\n\nCommercial checklists often include daily, weekly, and monthly tasks. They help coordinate team responsibilities when multiple cleaners work together. Customize checklists based on specific facility needs. Always review before completing the shift.",
          steps: [
            "Follow checklist tasks",
            "Use checklists for consistency",
            "Coordinate team responsibilities",
            "Customize as needed",
            "Review before completion"
          ],
          images: [
            { image_id: "M5L5_IMG1", prompt: "HD professional illustration of a cleaner following a structured cleaning routine in a commercial space, modern flat style, NO TEXT IN IMAGE" },
            { image_id: "M5L5_IMG2", prompt: "HD vector illustration representing organized commercial cleaning workflow, clean professional design, NO TEXT IN IMAGE" }
          ],
          exercise: { task: "Explain one benefit of using a commercial cleaning checklist.", expected_result: "Explanation related to quality or organization." },
          summary: "Commercial cleaning checklists help maintain consistent quality, efficiency, and teamwork in professional cleaning environments."
        }
      },
      {
        lesson_id: "M5L6",
        title: "Quality Control in Commercial Cleaning",
        content: {
          body: "Quality control in commercial cleaning ensures that cleaning services meet expected standards consistently. It focuses on inspection, feedback, and continuous improvement.\n\nQuality control begins with clear standards. Cleaners must understand expectations for cleanliness, safety, and presentation. Inspections help identify missed tasks or issues. Regular checks support accountability and improvement.\n\nFeedback allows cleaners to learn and adjust methods. Documentation of performance helps track trends and identify training needs. Continuous improvement means always looking for better ways to deliver quality service. Quality control builds trust with clients and maintains professional reputation.",
          steps: [
            "Understand cleaning standards",
            "Perform regular inspections",
            "Receive and apply feedback",
            "Document performance",
            "Improve continuously"
          ],
          images: [
            { image_id: "M5L6_IMG1", prompt: "HD professional illustration of a supervisor inspecting a clean commercial space, modern flat style, NO TEXT IN IMAGE" },
            { image_id: "M5L6_IMG2", prompt: "HD vector illustration showing quality control and inspection process in commercial cleaning, clean professional design, NO TEXT IN IMAGE" }
          ],
          exercise: { task: "Explain why quality control is important in commercial cleaning.", expected_result: "Explanation related to consistency or trust." },
          summary: "Quality control ensures commercial cleaning meets professional standards through inspection, feedback, and continuous improvement."
        }
      }
    ]
  },
  // Module 6: Health and Safety Practices
  {
    module_id: "M6",
    title: "Health and Safety Practices",
    lessons: [
      {
        lesson_id: "M6L1",
        title: "Personal Protective Equipment",
        content: {
          body: "Personal protective equipment (PPE) is essential in professional cleaning because it protects cleaners from physical, chemical, and biological hazards. Cleaning work often involves contact with chemicals, waste, sharp edges, wet surfaces, and contaminated areas.\n\nCommon PPE includes: Gloves (protect hands from chemicals, germs, and rough surfaces), Masks or respirators (protect from fumes and airborne particles), Eye protection (shields eyes from splashes), Non-slip footwear (prevents falls on wet surfaces), Aprons or protective clothing (protects body and regular clothing).\n\nSelect PPE appropriate for each task. Inspect equipment before use and replace damaged items. Proper use of PPE significantly reduces risk of injury and illness.",
          steps: [
            "Identify required protective equipment",
            "Wear protection before starting tasks",
            "Use equipment correctly",
            "Replace damaged items",
            "Clean or dispose of equipment properly"
          ],
          images: [
            { image_id: "M6L1_IMG1", prompt: "HD professional illustration of a cleaner wearing gloves, mask, and protective clothing while working, modern flat style, NO TEXT IN IMAGE" },
            { image_id: "M6L1_IMG2", prompt: "HD vector illustration showing different protective equipment used in cleaning, clean professional design, NO TEXT IN IMAGE" }
          ],
          exercise: { task: "Name two types of personal protective equipment and explain why they are used.", expected_result: "Correct identification with safety explanation." },
          summary: "Personal protective equipment helps prevent injuries and health risks. Proper selection and use are essential for safe professional cleaning."
        }
      },
      {
        lesson_id: "M6L2",
        title: "Preventing Injuries",
        content: {
          body: "Preventing injuries is a key responsibility in professional cleaning. Cleaning work involves physical movement, lifting, repetitive tasks, and exposure to hazards. Understanding how injuries occur and how to prevent them helps cleaners stay healthy and productive.\n\nCommon cleaning injuries include slips, trips, and falls (from wet floors, clutter, poor lighting), muscle strains (from improper lifting or repetitive motions), cuts and scrapes (from sharp edges or broken items), and chemical exposure (from improper handling).\n\nPrevention strategies include: using warning signs for wet floors, keeping walkways clear, wearing non-slip footwear, using correct lifting techniques (bend knees, keep back straight), taking breaks to prevent fatigue, and always wearing appropriate PPE.",
          steps: [
            "Identify potential hazards",
            "Use correct lifting techniques",
            "Wear protective equipment",
            "Maintain awareness of surroundings",
            "Follow safe work practices"
          ],
          images: [
            { image_id: "M6L2_IMG1", prompt: "HD professional illustration of a cleaner lifting equipment safely using proper posture, modern flat style, NO TEXT IN IMAGE" },
            { image_id: "M6L2_IMG2", prompt: "HD vector illustration showing injury prevention practices in cleaning work, clean professional design, NO TEXT IN IMAGE" }
          ],
          exercise: { task: "Explain one way to prevent muscle strain during cleaning work.", expected_result: "Explanation related to posture or task variation." },
          summary: "Preventing injuries involves safe movement, hazard awareness, and correct work habits. Injury prevention supports long-term health and safety."
        }
      },
      {
        lesson_id: "M6L3",
        title: "Handling Spills Safely",
        content: {
          body: "Handling spills safely is an essential skill because spills can create immediate hazards. Spills may involve water, chemicals, food, waste, or other substances. If not handled correctly, they can lead to slips, chemical exposure, contamination, or surface damage.\n\nThe first step is identifying what was spilled. Water requires different handling than chemical spills. For chemical spills, check the product label for specific cleanup instructions. Wear appropriate protective equipment before starting cleanup.\n\nPlace warning signs to alert others and control the area. Contain the spill to prevent spreading. Clean using correct methods - absorb liquids, dispose of waste properly, and clean/disinfect the area as needed. Inspect afterward and report significant spills.",
          steps: [
            "Identify the type of spill",
            "Wear appropriate protective equipment",
            "Place warning signs and control the area",
            "Clean the spill using correct methods",
            "Inspect and report if necessary"
          ],
          images: [
            { image_id: "M6L3_IMG1", prompt: "HD professional illustration of a cleaner safely cleaning a liquid spill with warning signs in place, modern flat style, NO TEXT IN IMAGE" },
            { image_id: "M6L3_IMG2", prompt: "HD vector illustration showing proper spill containment and cleanup process in a professional environment, clean professional design, NO TEXT IN IMAGE" }
          ],
          exercise: { task: "Explain one reason why warning signs are important during spill cleanup.", expected_result: "Explanation related to safety or accident prevention." },
          summary: "Handling spills safely requires quick identification, protective equipment, area control, and correct cleaning methods. Proper spill response prevents accidents and health risks."
        }
      },
      {
        lesson_id: "M6L4",
        title: "Emergency Procedures",
        content: {
          body: "Emergency procedures are essential knowledge because unexpected situations can occur at any time. Emergencies may include injuries, chemical exposure, fires, equipment failure, or medical incidents. Knowing how to respond calmly and correctly reduces harm.\n\nThe first step is recognizing emergency situations: strong chemical odors, smoke, electrical sparks, injuries, or someone becoming ill. Protect your personal safety first - don't put yourself in danger.\n\nRespond according to procedures: evacuate if necessary, call for help, administer first aid if trained, and report the incident. Know the location of emergency exits, fire extinguishers, first aid kits, and emergency contact numbers. Regular practice and review keeps emergency knowledge fresh.",
          steps: [
            "Recognize emergency situations",
            "Protect personal safety first",
            "Respond according to procedures",
            "Seek help and report incidents",
            "Review and practice emergency steps"
          ],
          images: [
            { image_id: "M6L4_IMG1", prompt: "HD professional illustration of a cleaner calmly responding to an emergency situation in a workplace, modern flat style, NO TEXT IN IMAGE" },
            { image_id: "M6L4_IMG2", prompt: "HD vector illustration showing emergency response and evacuation practices in a commercial environment, clean professional design, NO TEXT IN IMAGE" }
          ],
          exercise: { task: "Describe one action you should take during an emergency at work.", expected_result: "A clear action related to safety or reporting." },
          summary: "Emergency procedures help cleaners respond safely to unexpected situations. Awareness, preparation, and correct actions reduce harm and support professional safety standards."
        }
      },
      {
        lesson_id: "M6L5",
        title: "Safety Practice",
        content: {
          body: "Safety practice brings together all health and safety knowledge into daily work habits. Professional cleaners must apply safety rules consistently, not only when problems occur. Practicing safety every day reduces accidents, protects health, and supports professional reputation.\n\nSafety practice begins before work starts: review tasks, identify possible hazards, and prepare appropriate tools and protective equipment. During work, maintain awareness of your surroundings, follow correct techniques, and communicate hazards to others.\n\nLearn from incidents - whether your own or others'. Understanding what went wrong helps prevent future accidents. Take care of your personal health through proper rest, hydration, and reporting any concerns.",
          steps: [
            "Prepare and identify hazards before work",
            "Apply safety rules consistently",
            "Communicate hazards and issues",
            "Learn from incidents",
            "Care for personal health"
          ],
          images: [
            { image_id: "M6L5_IMG1", prompt: "HD professional illustration of a cleaner working safely with proper posture and equipment in a clean environment, modern flat style, NO TEXT IN IMAGE" },
            { image_id: "M6L5_IMG2", prompt: "HD vector illustration showing daily safety practices in professional cleaning work, clean professional design, NO TEXT IN IMAGE" }
          ],
          exercise: { task: "Explain one daily safety habit that helps prevent accidents.", expected_result: "A clear habit related to awareness, preparation, or communication." },
          summary: "Safety practice turns rules into daily habits. Consistent preparation, awareness, and communication support safe and professional cleaning work."
        }
      }
    ]
  },
  // Module 7: Hygiene and Infection Control
  {
    module_id: "M7",
    title: "Hygiene and Infection Control",
    lessons: [
      {
        lesson_id: "M7L1",
        title: "Understanding Hygiene",
        content: {
          body: "Hygiene is a core principle of professional cleaning. It refers to practices that help maintain cleanliness, prevent illness, and protect health. In cleaning work, hygiene goes beyond making spaces look clean - it focuses on reducing germs, preventing contamination, and supporting safe environments.\n\nProfessional cleaners play an important role because many environments depend on proper cleaning to stay healthy. Homes, offices, hospitals, schools, and public spaces all require effective hygiene practices.\n\nKey hygiene concepts include: understanding how germs spread (through contact, air, and contaminated surfaces), practicing personal hygiene (handwashing, clean clothing), and maintaining environmental cleanliness (regular cleaning and disinfection of surfaces, especially high-risk areas).",
          steps: [
            "Understand the purpose of hygiene",
            "Recognize how germs spread",
            "Practice personal hygiene",
            "Maintain environmental cleanliness",
            "Focus on high-risk areas"
          ],
          images: [
            { image_id: "M7L1_IMG1", prompt: "HD professional illustration of a cleaner practicing good hygiene while cleaning shared surfaces, modern flat style, NO TEXT IN IMAGE" },
            { image_id: "M7L1_IMG2", prompt: "HD vector illustration representing hygiene practices in a clean indoor environment, clean professional design, NO TEXT IN IMAGE" }
          ],
          exercise: { task: "Explain why hygiene is important in professional cleaning.", expected_result: "Explanation related to health or infection prevention." },
          summary: "Hygiene focuses on preventing illness and maintaining healthy environments. Understanding hygiene principles helps professional cleaners reduce contamination and protect health."
        }
      },
      {
        lesson_id: "M7L2",
        title: "Preventing Cross Contamination",
        content: {
          body: "Preventing cross contamination is critical for hygiene and infection control. Cross contamination occurs when germs are transferred from one surface, area, or item to another. In professional cleaning, improper practices can spread contamination instead of removing it.\n\nCommon causes include: using the same cleaning tools in different areas (bathroom cloth used in kitchen), incorrect cleaning order (dirty to clean instead of clean to dirty), and failure to change gloves between tasks.\n\nPrevention strategies include: separating tools by area, using color-coded systems (different color cloths for different rooms), cleaning from clean areas to dirty areas, handling waste carefully with proper protection, and maintaining strict personal hygiene including frequent handwashing.",
          steps: [
            "Separate tools by area",
            "Use color-coded systems",
            "Clean from clean to dirty areas",
            "Handle waste carefully",
            "Maintain personal hygiene"
          ],
          images: [
            { image_id: "M7L2_IMG1", prompt: "HD professional illustration showing separate cleaning tools used in different areas to prevent contamination, modern flat style, NO TEXT IN IMAGE" },
            { image_id: "M7L2_IMG2", prompt: "HD vector illustration of a cleaner changing gloves and tools between tasks, clean professional design, NO TEXT IN IMAGE" }
          ],
          exercise: { task: "Describe one method used to prevent cross contamination.", expected_result: "A clear method related to tools, order, or hygiene." },
          summary: "Preventing cross contamination protects health and hygiene. Tool separation, correct order, and personal hygiene help stop the spread of germs."
        }
      },
      {
        lesson_id: "M7L3",
        title: "Disinfection Practices",
        content: {
          body: "Disinfection practices are critical in professional cleaning, especially in environments where people share spaces and surfaces. While regular cleaning removes visible dirt, disinfection focuses on reducing germs that can cause illness.\n\nImportant principles: Disinfection should always be performed after cleaning (dirt reduces disinfectant effectiveness). Identify high-touch areas that need frequent disinfection: door handles, light switches, handrails, shared equipment.\n\nApply disinfectant correctly according to product instructions. Allow proper contact time - the surface must stay wet with disinfectant for the specified time to kill germs effectively. Follow safety precautions including ventilation and protective equipment.",
          steps: [
            "Clean surfaces before disinfecting",
            "Identify high-touch areas",
            "Apply disinfectant correctly",
            "Allow proper contact time",
            "Follow safety precautions"
          ],
          images: [
            { image_id: "M7L3_IMG1", prompt: "HD professional illustration of a cleaner disinfecting high-touch surfaces in a shared space, modern flat style, NO TEXT IN IMAGE" },
            { image_id: "M7L3_IMG2", prompt: "HD vector illustration showing proper disinfection process on surfaces, clean professional design, NO TEXT IN IMAGE" }
          ],
          exercise: { task: "Explain why cleaning is required before disinfection.", expected_result: "Explanation related to effectiveness of disinfectants." },
          summary: "Disinfection practices reduce germs and protect health. Proper sequencing, product use, and safety are essential for effective infection control."
        }
      },
      {
        lesson_id: "M7L4",
        title: "Waste Handling",
        content: {
          body: "Waste handling is an important part of hygiene and infection control. Improper waste management can spread germs, create odors, and pose health risks. Professional cleaners must handle waste carefully and responsibly.\n\nWaste should be separated based on type: general waste, recyclable materials, and hygiene/biohazard waste require different handling. Mixing waste can increase contamination risks.\n\nProtective equipment should always be worn when handling waste. Empty bins regularly before they overflow. Seal waste bags properly before disposal. Clean and sanitize bins after emptying. Wash hands thoroughly after handling waste. Report any unusual or hazardous waste to supervisors.",
          steps: [
            "Wear protective equipment",
            "Separate waste types",
            "Empty and clean bins regularly",
            "Seal waste properly",
            "Wash hands after handling"
          ],
          images: [
            { image_id: "M7L4_IMG1", prompt: "HD professional illustration of a cleaner safely handling waste bags with protective gloves, modern flat style, NO TEXT IN IMAGE" },
            { image_id: "M7L4_IMG2", prompt: "HD vector illustration showing proper waste disposal process in a professional environment, clean professional design, NO TEXT IN IMAGE" }
          ],
          exercise: { task: "State one reason why waste should be handled carefully.", expected_result: "Explanation related to hygiene or safety." },
          summary: "Proper waste handling prevents contamination and supports hygiene. Protective equipment and correct disposal are essential."
        }
      },
      {
        lesson_id: "M7L5",
        title: "Hygiene Checklist",
        content: {
          body: "A hygiene checklist helps professional cleaners apply infection control practices consistently. Checklists reduce missed tasks and support high hygiene standards across different environments.\n\nChecklists identify critical hygiene tasks: disinfecting high-touch surfaces, handling waste properly, cleaning and sanitizing tools. They help cleaners follow routines and maintain consistency.\n\nUsing a checklist supports quality control. Cleaners can confirm completed tasks, and supervisors can verify standards are met. Customize checklists based on environment - healthcare settings require more stringent protocols than offices. Review tasks before completion.",
          steps: [
            "Follow hygiene tasks systematically",
            "Focus on high-risk areas",
            "Use checklists for consistency",
            "Review tasks before completion",
            "Adjust based on environment"
          ],
          images: [
            { image_id: "M7L5_IMG1", prompt: "HD professional illustration of a cleaner following a hygiene routine in a clean environment, modern flat style, NO TEXT IN IMAGE" },
            { image_id: "M7L5_IMG2", prompt: "HD vector illustration representing organized hygiene practices visually, clean professional design, NO TEXT IN IMAGE" }
          ],
          exercise: { task: "Explain one benefit of using a hygiene checklist.", expected_result: "Explanation related to consistency or quality." },
          summary: "Hygiene checklists help ensure infection control tasks are completed consistently and professionally."
        }
      },
      {
        lesson_id: "M7L6",
        title: "Hygiene Practice",
        content: {
          body: "Hygiene practice focuses on applying hygiene and infection control knowledge in daily cleaning work. Knowing hygiene rules is important, but consistent practice is what prevents illness and contamination.\n\nDaily hygiene practice includes: hand washing (before starting work, after handling waste, before eating), tool separation (keeping bathroom tools separate from kitchen tools), surface disinfection (especially high-touch areas), and waste handling (with proper protection).\n\nRemain aware of contamination risks and adjust practices as needed. Fatigue can lead to shortcuts - maintain discipline. Correct mistakes promptly. Continuous improvement means always looking for better hygiene practices.",
          steps: [
            "Apply hygiene rules daily",
            "Maintain awareness of risks",
            "Follow routines consistently",
            "Correct mistakes promptly",
            "Support continuous improvement"
          ],
          images: [
            { image_id: "M7L6_IMG1", prompt: "HD professional illustration of a cleaner practicing consistent hygiene during daily cleaning tasks, modern flat style, NO TEXT IN IMAGE" },
            { image_id: "M7L6_IMG2", prompt: "HD vector illustration showing daily hygiene habits in professional cleaning, clean professional design, NO TEXT IN IMAGE" }
          ],
          exercise: { task: "Describe one daily hygiene habit that prevents infection spread.", expected_result: "A clear practical hygiene habit." },
          summary: "Hygiene practice ensures infection control through consistent daily habits. Discipline and awareness protect health."
        }
      }
    ]
  },
  // Module 8: Time Management and Work Flow
  {
    module_id: "M8",
    title: "Time Management and Work Flow",
    lessons: [
      {
        lesson_id: "M8L1",
        title: "Planning Cleaning Tasks",
        content: {
          body: "Planning cleaning tasks is essential for working efficiently and delivering consistent results. Professional cleaners often work within time limits and must complete multiple tasks without missing important details.\n\nPlanning begins before any cleaning starts: review the space, understand the scope of work, and identify priority areas. Note room sizes, surface types, and any special requirements. Estimate how long each task will take.\n\nPlan task order logically: start with tasks that need dwell time (like disinfectants), work from top to bottom and clean to dirty areas, save floors for last. Prepare all tools and supplies before starting to avoid interruptions.",
          steps: [
            "Review the cleaning area and requirements",
            "Identify priority tasks",
            "Plan task order logically",
            "Estimate time for each task",
            "Prepare tools and supplies"
          ],
          images: [
            { image_id: "M8L1_IMG1", prompt: "HD professional illustration of a cleaner reviewing a cleaning plan before starting work, modern flat style, NO TEXT IN IMAGE" },
            { image_id: "M8L1_IMG2", prompt: "HD vector illustration showing organized cleaning preparation and task planning, clean professional design, NO TEXT IN IMAGE" }
          ],
          exercise: { task: "Explain why planning tasks before cleaning is important.", expected_result: "Explanation related to efficiency or quality." },
          summary: "Planning cleaning tasks helps cleaners work efficiently, avoid mistakes, and deliver consistent professional results."
        }
      },
      {
        lesson_id: "M8L2",
        title: "Working Efficiently",
        content: {
          body: "Working efficiently means completing cleaning tasks using time, energy, and resources wisely while maintaining quality standards. Efficiency does not mean rushing - it means working smartly and consistently.\n\nEfficiency starts with good organization: keep tools nearby, use carts, and arrange supplies logically. This reduces unnecessary movement and saves time and physical effort.\n\nUsing correct techniques improves efficiency: proper posture and smooth movements prevent fatigue. Staying focused on tasks and avoiding distractions maintains momentum. Following consistent routines means you don't have to think about what comes next - the workflow becomes automatic.",
          steps: [
            "Organize tools and supplies",
            "Use correct cleaning techniques",
            "Minimize unnecessary movement",
            "Stay focused on tasks",
            "Follow consistent routines"
          ],
          images: [
            { image_id: "M8L2_IMG1", prompt: "HD professional illustration of a cleaner working efficiently with organized tools, modern flat style, NO TEXT IN IMAGE" },
            { image_id: "M8L2_IMG2", prompt: "HD vector illustration showing efficient cleaning workflow in a professional environment, clean professional design, NO TEXT IN IMAGE" }
          ],
          exercise: { task: "Describe one habit that improves cleaning efficiency.", expected_result: "A clear efficiency habit." },
          summary: "Efficiency in cleaning comes from organization, correct techniques, and focused routines."
        }
      },
      {
        lesson_id: "M8L3",
        title: "Team Coordination",
        content: {
          body: "Team coordination is important when multiple cleaners work together. Good coordination prevents duplicated work, missed tasks, and confusion. Professional teams rely on communication and clear roles.\n\nCoordination begins with task assignment: each team member should know their responsibilities. Clear roles reduce overlap and wasted time. Communication supports coordination - team members should share updates, report issues, and confirm completed tasks.\n\nSupport team members when needed and avoid duplicating work that's already been done. Regular team reviews help identify what's working and what needs improvement.",
          steps: [
            "Assign clear responsibilities",
            "Communicate task progress",
            "Support team members",
            "Avoid duplicated work",
            "Review team performance"
          ],
          images: [
            { image_id: "M8L3_IMG1", prompt: "HD professional illustration of a cleaning team coordinating tasks together, modern flat style, NO TEXT IN IMAGE" },
            { image_id: "M8L3_IMG2", prompt: "HD vector illustration showing teamwork and cooperation in professional cleaning, clean professional design, NO TEXT IN IMAGE" }
          ],
          exercise: { task: "Explain one benefit of good team coordination.", expected_result: "Explanation related to efficiency or quality." },
          summary: "Team coordination helps cleaners work together efficiently and maintain consistent standards."
        }
      },
      {
        lesson_id: "M8L4",
        title: "Meeting Client Expectations",
        content: {
          body: "Meeting client expectations is essential for professional cleaning success. Clients expect reliable, high-quality service delivered as agreed. Understanding expectations helps cleaners build trust and long-term relationships.\n\nExpectations should be clarified before work begins: understand the tasks required, frequency of cleaning, and any special requests. Clear understanding prevents dissatisfaction.\n\nConsistency is key: delivering the same quality each time builds confidence. Communicate clearly about any issues or changes. Address problems promptly when they arise. Maintain professional behavior at all times.",
          steps: [
            "Understand client requirements",
            "Deliver consistent quality",
            "Communicate clearly",
            "Address issues promptly",
            "Maintain professional behavior"
          ],
          images: [
            { image_id: "M8L4_IMG1", prompt: "HD professional illustration of a cleaner ensuring a clean and organized space for a client, modern flat style, NO TEXT IN IMAGE" },
            { image_id: "M8L4_IMG2", prompt: "HD vector illustration representing professional service delivery in cleaning, clean professional design, NO TEXT IN IMAGE" }
          ],
          exercise: { task: "Explain why consistency is important for meeting client expectations.", expected_result: "Explanation related to trust or quality." },
          summary: "Meeting client expectations depends on clarity, consistency, and communication."
        }
      },
      {
        lesson_id: "M8L5",
        title: "Workflow Practice",
        content: {
          body: "Workflow practice focuses on applying time management and coordination skills in daily cleaning work. A clear workflow helps cleaners move smoothly from task to task without confusion or wasted effort.\n\nA good workflow follows logical task order and minimizes backtracking. This saves time and reduces fatigue. Practicing workflows regularly builds speed and confidence - over time, cleaners develop efficient habits.\n\nReviewing workflows helps identify improvements. Ask yourself: what could I do better? What slowed me down? Continuous improvement leads to better performance and client satisfaction.",
          steps: [
            "Follow a logical task order",
            "Apply time management skills",
            "Practice routines regularly",
            "Review and improve workflows",
            "Maintain consistency"
          ],
          images: [
            { image_id: "M8L5_IMG1", prompt: "HD professional illustration of a cleaner following a smooth cleaning workflow, modern flat style, NO TEXT IN IMAGE" },
            { image_id: "M8L5_IMG2", prompt: "HD vector illustration showing structured workflow in professional cleaning, clean professional design, NO TEXT IN IMAGE" }
          ],
          exercise: { task: "Describe one way workflow practice improves cleaning work.", expected_result: "Explanation related to efficiency or organization." },
          summary: "Workflow practice helps cleaners apply planning and efficiency skills consistently for professional results."
        }
      }
    ]
  },
  // Module 9: Customer Service Skills
  {
    module_id: "M9",
    title: "Customer Service Skills",
    lessons: [
      {
        lesson_id: "M9L1",
        title: "Professional Behavior",
        content: {
          body: "Professional behavior is a core requirement in customer service for cleaning professionals. Cleaners often work in private homes, offices, and shared spaces where trust, respect, and reliability are essential.\n\nProfessional behavior begins with punctuality - arriving on time shows respect for the client's schedule. Appropriate appearance including clean, neat clothing creates a positive impression. Respectful communication using polite language demonstrates professionalism.\n\nHandle property responsibly - treat client belongings with care. Deliver consistent service quality every time. These behaviors build trust and lead to long-term client relationships.",
          steps: [
            "Arrive on time and prepared",
            "Maintain clean and appropriate appearance",
            "Communicate respectfully",
            "Handle property responsibly",
            "Deliver consistent service quality"
          ],
          images: [
            { image_id: "M9L1_IMG1", prompt: "HD professional illustration of a cleaner presenting professional behavior in a client environment, modern flat style, NO TEXT IN IMAGE" },
            { image_id: "M9L1_IMG2", prompt: "HD vector illustration showing respectful interaction between cleaner and client, clean professional design, NO TEXT IN IMAGE" }
          ],
          exercise: { task: "Explain one example of professional behavior in cleaning work.", expected_result: "A clear example related to respect, punctuality, or responsibility." },
          summary: "Professional behavior builds trust and satisfaction. Punctuality, respect, appearance, and responsibility are essential customer service skills."
        }
      },
      {
        lesson_id: "M9L2",
        title: "Communication Basics",
        content: {
          body: "Clear communication is essential in customer service for professional cleaning. Cleaners must understand client expectations, provide updates, and respond to questions politely. Effective communication reduces misunderstandings and improves service quality.\n\nListening is the first step: listen carefully to instructions and clarify details if needed. Asking simple questions prevents mistakes. Speak clearly and politely, using positive language.\n\nBody language matters too: maintain appropriate eye contact, stand or sit professionally, and show you're paying attention. Share accurate information and be honest if you don't know something.",
          steps: [
            "Listen carefully to instructions",
            "Ask questions for clarity",
            "Speak clearly and politely",
            "Use positive body language",
            "Share accurate information"
          ],
          images: [
            { image_id: "M9L2_IMG1", prompt: "HD professional illustration of a cleaner listening attentively to a client, modern flat style, NO TEXT IN IMAGE" },
            { image_id: "M9L2_IMG2", prompt: "HD vector illustration representing clear communication in a professional cleaning setting, clean professional design, NO TEXT IN IMAGE" }
          ],
          exercise: { task: "Describe one communication habit that improves customer service.", expected_result: "A clear communication habit." },
          summary: "Clear communication improves understanding and trust. Listening and polite speaking are essential customer service skills."
        }
      },
      {
        lesson_id: "M9L3",
        title: "Handling Client Requests",
        content: {
          body: "Handling client requests professionally is an important customer service skill. Clients may request specific tasks, changes, or preferences. Responding correctly helps maintain satisfaction and trust.\n\nUnderstanding the request is the first step: listen carefully and confirm details before acting. Misunderstanding requests can lead to dissatisfaction.\n\nAssess feasibility - some requests may require additional time, tools, or approval. Respond professionally: agree if possible, explain limitations if not, and suggest alternatives. Record special requests for future reference.",
          steps: [
            "Listen to the request carefully",
            "Confirm details",
            "Assess feasibility",
            "Respond professionally",
            "Record special requests"
          ],
          images: [
            { image_id: "M9L3_IMG1", prompt: "HD professional illustration of a cleaner responding to a client request politely, modern flat style, NO TEXT IN IMAGE" },
            { image_id: "M9L3_IMG2", prompt: "HD vector illustration showing professional service adjustment in cleaning work, clean professional design, NO TEXT IN IMAGE" }
          ],
          exercise: { task: "Explain why confirming client requests is important.", expected_result: "Explanation related to accuracy or satisfaction." },
          summary: "Professional handling of client requests builds trust and satisfaction. Listening and clear responses are essential."
        }
      },
      {
        lesson_id: "M9L4",
        title: "Handling Complaints",
        content: {
          body: "Handling complaints professionally is an important customer service skill. Complaints provide opportunities to improve service and restore trust when handled correctly.\n\nThe first step is staying calm and respectful. Listen without interrupting and acknowledge the client's concern. Don't become defensive or argue.\n\nUnderstand the issue by asking clarifying questions. Respond professionally: apologize when appropriate, explain what went wrong if known, and offer solutions. Report complaints to supervisors and learn from them to prevent future issues.",
          steps: [
            "Listen calmly to the complaint",
            "Acknowledge the concern",
            "Clarify the issue",
            "Respond professionally",
            "Report and learn from complaints"
          ],
          images: [
            { image_id: "M9L4_IMG1", prompt: "HD professional illustration of a cleaner calmly listening to a client concern, modern flat style, NO TEXT IN IMAGE" },
            { image_id: "M9L4_IMG2", prompt: "HD vector illustration showing professional complaint resolution in cleaning service, clean professional design, NO TEXT IN IMAGE" }
          ],
          exercise: { task: "Describe one important behavior when handling a complaint.", expected_result: "A behavior related to calmness or listening." },
          summary: "Handling complaints professionally helps maintain trust. Calm listening and clear responses support positive outcomes."
        }
      },
      {
        lesson_id: "M9L5",
        title: "Customer Service Practice",
        content: {
          body: "Customer service practice focuses on applying service skills consistently during daily cleaning work. Good service habits improve satisfaction and support long-term client relationships.\n\nPracticing customer service includes: greeting clients politely, communicating clearly about the work, respecting their preferences and property. Small actions can have a strong impact on how clients perceive your service.\n\nConsistency is essential - delivering the same level of service each visit builds trust. Reflect on feedback and use it to improve. Continuous improvement means always looking for ways to serve clients better.",
          steps: [
            "Apply service skills daily",
            "Maintain polite communication",
            "Deliver consistent service",
            "Learn from feedback",
            "Improve continuously"
          ],
          images: [
            { image_id: "M9L5_IMG1", prompt: "HD professional illustration of a cleaner providing friendly and professional service to a client, modern flat style, NO TEXT IN IMAGE" },
            { image_id: "M9L5_IMG2", prompt: "HD vector illustration representing positive customer service interactions in cleaning work, clean professional design, NO TEXT IN IMAGE" }
          ],
          exercise: { task: "Name one daily habit that improves customer service.", expected_result: "A clear service habit." },
          summary: "Customer service practice builds strong client relationships. Consistent professionalism and communication support success."
        }
      }
    ]
  },
  // Module 10: Cleaning Different Surfaces
  {
    module_id: "M10",
    title: "Cleaning Different Surfaces",
    lessons: [
      {
        lesson_id: "M10L1",
        title: "Understanding Surface Types",
        content: {
          body: "Understanding surface types is essential because different materials react differently to cleaning products and techniques. Using the wrong method can cause damage, reduce surface lifespan, or create safety hazards.\n\nCommon surface types include: Hard surfaces (tiles, stone, metal, glass) - generally durable but require appropriate products. Soft surfaces (carpets, rugs, upholstery) - absorb dirt and moisture. Porous materials - absorb liquids and stains. Non-porous materials - resist absorption but can be scratched.\n\nAlways identify the surface material before selecting products and methods. When unsure, test products on hidden areas first.",
          steps: [
            "Identify the surface material",
            "Determine if the surface is porous or non-porous",
            "Select appropriate tools and products",
            "Test products on hidden areas",
            "Follow surface-specific guidelines"
          ],
          images: [
            { image_id: "M10L1_IMG1", prompt: "HD professional illustration showing different surface materials in an indoor environment, modern flat style, NO TEXT IN IMAGE" },
            { image_id: "M10L1_IMG2", prompt: "HD vector illustration representing identification of various cleaning surfaces, clean professional design, NO TEXT IN IMAGE" }
          ],
          exercise: { task: "Explain why identifying surface type is important before cleaning.", expected_result: "Explanation related to damage prevention or effectiveness." },
          summary: "Understanding surface types helps cleaners choose safe and effective cleaning methods and protect materials."
        }
      },
      {
        lesson_id: "M10L2",
        title: "Cleaning Hard Surfaces",
        content: {
          body: "Hard surfaces are common in residential and commercial environments. These include tiles, stone, metal, glass, and sealed wood. Proper cleaning of hard surfaces maintains appearance, hygiene, and durability.\n\nHard surface cleaning usually begins with removing loose dirt by sweeping or wiping - this prevents scratching during wet cleaning. Use appropriate tools such as microfiber cloths for best results.\n\nCorrect product selection is essential. Some hard surfaces require specific cleaners - stone may need pH-neutral products, metal may need non-abrasive cleaners. Control moisture levels - excess water can damage grout, wood, or unsealed surfaces. Dry and inspect surfaces after cleaning.",
          steps: [
            "Remove loose dirt first",
            "Select suitable cleaning products",
            "Clean using appropriate tools",
            "Control moisture levels",
            "Inspect and dry surfaces"
          ],
          images: [
            { image_id: "M10L2_IMG1", prompt: "HD professional illustration of a cleaner wiping hard surfaces with proper technique, modern flat style, NO TEXT IN IMAGE" },
            { image_id: "M10L2_IMG2", prompt: "HD vector illustration showing cleaning of tiles and glass surfaces, clean professional design, NO TEXT IN IMAGE" }
          ],
          exercise: { task: "Name one risk of using too much water on hard surfaces.", expected_result: "Explanation related to damage or safety." },
          summary: "Cleaning hard surfaces requires correct products, moisture control, and gentle methods."
        }
      },
      {
        lesson_id: "M10L3",
        title: "Cleaning Soft Surfaces",
        content: {
          body: "Soft surfaces such as carpets, rugs, and upholstery require special cleaning methods because they absorb dirt and moisture. Incorrect cleaning can cause stains, odors, or damage.\n\nVacuuming is the first step - it removes loose dirt and debris that can damage fibers over time. High-traffic areas require extra attention and more frequent vacuuming.\n\nSpot cleaning should be done carefully: blot stains rather than scrubbing to avoid spreading them or damaging fibers. Use appropriate products designed for the specific fabric. Control moisture carefully - excessive moisture can cause mold, mildew, or shrinkage. Allow adequate drying time.",
          steps: [
            "Vacuum thoroughly",
            "Identify stains or spots",
            "Apply appropriate cleaning methods",
            "Control moisture and drying",
            "Inspect results"
          ],
          images: [
            { image_id: "M10L3_IMG1", prompt: "HD professional illustration of a cleaner vacuuming carpeted flooring, modern flat style, NO TEXT IN IMAGE" },
            { image_id: "M10L3_IMG2", prompt: "HD vector illustration showing upholstery cleaning techniques, clean professional design, NO TEXT IN IMAGE" }
          ],
          exercise: { task: "Explain why scrubbing stains can damage soft surfaces.", expected_result: "Explanation related to fiber damage." },
          summary: "Soft surface cleaning requires gentle methods, proper products, and moisture control."
        }
      },
      {
        lesson_id: "M10L4",
        title: "Cleaning Delicate Surfaces",
        content: {
          body: "Delicate surfaces such as natural stone, polished wood, and specialty finishes require extra care. Incorrect cleaning can permanently damage these materials.\n\nDelicate surfaces often require mild products and minimal moisture. Harsh chemicals and abrasive tools should be avoided. Some delicate surfaces have specific manufacturer recommendations that should be followed.\n\nTesting products on hidden areas is essential before cleaning delicate surfaces. Use gentle wiping and controlled techniques. Inspect carefully after cleaning to ensure no damage occurred.",
          steps: [
            "Identify delicate materials",
            "Select mild cleaning products",
            "Test products first",
            "Use gentle techniques",
            "Inspect carefully"
          ],
          images: [
            { image_id: "M10L4_IMG1", prompt: "HD professional illustration of a cleaner gently cleaning a delicate surface, modern flat style, NO TEXT IN IMAGE" },
            { image_id: "M10L4_IMG2", prompt: "HD vector illustration showing careful cleaning of polished surfaces, clean professional design, NO TEXT IN IMAGE" }
          ],
          exercise: { task: "State one rule when cleaning delicate surfaces.", expected_result: "Rule related to gentle products or techniques." },
          summary: "Delicate surfaces require mild products, testing, and gentle cleaning methods."
        }
      },
      {
        lesson_id: "M10L5",
        title: "Surface Cleaning Practice",
        content: {
          body: "Surface cleaning practice focuses on applying correct techniques for different materials consistently. Knowing how to clean surfaces is important, but daily practice ensures quality and safety.\n\nCleaners should review surface types before starting work. Applying the correct method prevents damage and improves results. Consistency supports professional standards - repeating proper techniques builds confidence and reliability.\n\nContinuous learning helps cleaners handle new surface types and improved products. Inspect results after cleaning and adjust techniques as needed.",
          steps: [
            "Identify surfaces before cleaning",
            "Apply correct techniques",
            "Follow consistent routines",
            "Inspect results",
            "Improve skills over time"
          ],
          images: [
            { image_id: "M10L5_IMG1", prompt: "HD professional illustration of a cleaner applying correct surface cleaning techniques, modern flat style, NO TEXT IN IMAGE" },
            { image_id: "M10L5_IMG2", prompt: "HD vector illustration showing professional surface care workflow, clean professional design, NO TEXT IN IMAGE" }
          ],
          exercise: { task: "Describe one benefit of using surface-specific cleaning methods.", expected_result: "Explanation related to protection or quality." },
          summary: "Surface cleaning practice ensures correct techniques are applied consistently for professional results."
        }
      }
    ]
  }
];

// Quiz questions for each lesson
function generateQuizQuestions(lesson: LessonData): Array<{question: string; options: string[]; correctAnswer: string; explanation: string}> {
  const lessonId = lesson.lesson_id;
  
  // Generate quiz questions based on lesson content
  const quizzes: Record<string, Array<{question: string; options: string[]; correctAnswer: string; explanation: string}>> = {
    "M1L1": [
      { question: "What is the main focus of professional cleaning?", options: ["Making spaces look nice", "Structured cleaning with hygiene and safety standards", "Using expensive equipment", "Working quickly"], correctAnswer: "B", explanation: "Professional cleaning follows defined standards focused on hygiene, safety, and consistent results." },
      { question: "How does professional cleaning differ from casual home cleaning?", options: ["It uses more water", "It follows structured methods and standards", "It takes longer", "It only covers kitchens"], correctAnswer: "B", explanation: "Professional cleaning is systematic and follows quality standards unlike casual cleaning." },
      { question: "What quality is essential for professional cleaners?", options: ["Speed above all else", "Trust and reliability", "Using the cheapest products", "Working alone"], correctAnswer: "B", explanation: "Trust, reliability, and attention to detail are essential qualities for professional cleaners." }
    ],
    "M1L2": [
      { question: "What type of cleaning focuses on private homes?", options: ["Commercial cleaning", "Industrial cleaning", "Residential cleaning", "Healthcare cleaning"], correctAnswer: "C", explanation: "Residential cleaning focuses on private living spaces like houses and apartments." },
      { question: "Why is it important to understand different types of cleaning services?", options: ["To charge more money", "To choose appropriate methods and tools", "To work fewer hours", "To avoid difficult jobs"], correctAnswer: "B", explanation: "Understanding service types helps cleaners select the right methods, tools, and expectations for each job." },
      { question: "Which cleaning type requires strict hygiene protocols?", options: ["Residential cleaning", "Office cleaning", "Healthcare cleaning", "Window cleaning"], correctAnswer: "C", explanation: "Healthcare cleaning requires strict hygiene protocols to prevent infection." }
    ],
    "M1L3": [
      { question: "Why is professional cleaning considered a stable career?", options: ["It requires no training", "Cleaning services are always needed", "It pays the most", "It has no competition"], correctAnswer: "B", explanation: "Cleaning services are needed everywhere, providing consistent demand and job security." },
      { question: "What can lead to career growth in cleaning?", options: ["Avoiding responsibility", "Experience, reliability, and training", "Working only part-time", "Ignoring client feedback"], correctAnswer: "B", explanation: "Experience, reliability, and training lead to supervisory roles and business opportunities." },
      { question: "What quality is highly valued in the cleaning industry?", options: ["Working the fastest", "Attention to detail", "Using the most chemicals", "Avoiding clients"], correctAnswer: "B", explanation: "Attention to detail and reliability are highly valued in professional cleaning." }
    ],
    "M1L4": [
      { question: "What do professional cleaning standards define?", options: ["How to avoid work", "How cleaning should be performed", "How to charge clients", "How to find new jobs"], correctAnswer: "B", explanation: "Standards define how cleaning work should be performed to achieve consistent, safe, high-quality results." },
      { question: "Why is following a checklist important?", options: ["It makes work slower", "It ensures consistency", "It reduces quality", "It's not important"], correctAnswer: "B", explanation: "Checklists help maintain consistency across different jobs and team members." },
      { question: "What is part of professional behavior in cleaning?", options: ["Being late", "Punctuality and respectful communication", "Ignoring instructions", "Using personal phones"], correctAnswer: "B", explanation: "Professional behavior includes punctuality, appropriate dress, and respectful communication." }
    ],
    "M1L5": [
      { question: "What does this course prepare you for?", options: ["Office work only", "Real-world professional cleaning work", "Cooking careers", "Sales jobs"], correctAnswer: "B", explanation: "This course prepares learners for real-world professional cleaning work." },
      { question: "What topics does this course cover?", options: ["Only residential cleaning", "Tools, products, safety, hygiene, and more", "Only chemical handling", "Only time management"], correctAnswer: "B", explanation: "The course covers tools, equipment, products, residential/commercial cleaning, safety, hygiene, time management, and customer service." },
      { question: "How should you approach this course?", options: ["Skip to the end", "Follow modules in order", "Only watch videos", "Ignore quizzes"], correctAnswer: "B", explanation: "Following the course modules in order ensures proper learning progression." }
    ],
    "M2L1": [
      { question: "What is a broom used for?", options: ["Wet cleaning", "Sweeping loose dirt", "Washing windows", "Disinfecting surfaces"], correctAnswer: "B", explanation: "Brooms are used to sweep loose dirt from floors." },
      { question: "Why are microfiber cloths effective for dusting?", options: ["They are colorful", "They trap dust without scratching", "They are expensive", "They use chemicals"], correctAnswer: "B", explanation: "Microfiber cloths trap dust effectively without scratching surfaces." },
      { question: "What should be done with tools after use?", options: ["Leave them wet", "Clean and store them properly", "Throw them away", "Hide them"], correctAnswer: "B", explanation: "Proper cleaning and storage extends tool life and maintains hygiene." }
    ],
    "M2L2": [
      { question: "What is a vacuum cleaner used for?", options: ["Wet mopping", "Removing dust and debris", "Applying chemicals", "Polishing floors"], correctAnswer: "B", explanation: "Vacuum cleaners remove dust, debris, and particles from floors and surfaces." },
      { question: "Why are cleaning machines important in professional cleaning?", options: ["They are fun to use", "They improve efficiency and results", "They make noise", "They are cheaper than hand tools"], correctAnswer: "B", explanation: "Machines improve efficiency, reduce physical effort, and achieve deeper cleaning." },
      { question: "What is essential before using cleaning machines?", options: ["Ignoring instructions", "Proper training", "Using maximum speed", "Skipping maintenance"], correctAnswer: "B", explanation: "Proper machine operation requires training for effective and safe use." }
    ],
    "M2L3": [
      { question: "What should you do before using any cleaning equipment?", options: ["Start immediately", "Inspect it carefully", "Ignore the instructions", "Remove safety guards"], correctAnswer: "B", explanation: "Inspecting equipment for damage or malfunction prevents accidents." },
      { question: "Why is non-slip footwear important?", options: ["It looks professional", "It prevents falls on wet surfaces", "It is comfortable", "It is required by law"], correctAnswer: "B", explanation: "Non-slip footwear prevents slips and falls on wet or slippery surfaces." },
      { question: "What helps prevent back strain when using equipment?", options: ["Bending at the waist", "Proper lifting techniques", "Lifting heavy items quickly", "Ignoring posture"], correctAnswer: "B", explanation: "Proper lifting techniques (bending knees, straight back) prevent muscle strain." }
    ],
    "M2L4": [
      { question: "Why should tools be dried after cleaning?", options: ["To make them shiny", "To prevent mold and odor", "To save water", "It's not necessary"], correctAnswer: "B", explanation: "Drying tools prevents mold, mildew, and odor from developing." },
      { question: "When should damaged tools be replaced?", options: ["Never", "Promptly", "Only when they break completely", "Once a year"], correctAnswer: "B", explanation: "Damaged tools should be replaced promptly as they cannot clean effectively and may cause damage." },
      { question: "What is a benefit of proper tool maintenance?", options: ["More work", "Longer tool life and better results", "Higher costs", "More breakdowns"], correctAnswer: "B", explanation: "Well-maintained tools perform better, last longer, and ensure hygiene." }
    ],
    "M2L5": [
      { question: "Why is correct posture important when using tools?", options: ["It looks professional", "It reduces strain and improves effectiveness", "It's not important", "It makes work slower"], correctAnswer: "B", explanation: "Correct posture reduces fatigue and strain while improving cleaning effectiveness." },
      { question: "What should you do before starting work?", options: ["Start immediately", "Organize tools and plan the order", "Find the nearest exit", "Take a break"], correctAnswer: "B", explanation: "Organizing tools before work ensures everything is within reach and saves time." },
      { question: "What does a systematic cleaning order prevent?", options: ["Good results", "Backtracking and wasted time", "Client satisfaction", "Professional quality"], correctAnswer: "B", explanation: "A systematic order prevents backtracking and improves efficiency." }
    ],
    "M3L1": [
      { question: "What are detergents used for?", options: ["Killing germs only", "General cleaning and grease removal", "Polishing surfaces", "Air freshening"], correctAnswer: "B", explanation: "Detergents are used for general cleaning and removing grease and dirt." },
      { question: "What can happen if you use the wrong cleaning product?", options: ["Better results", "Damage to surfaces or reduced effectiveness", "Faster cleaning", "Nothing"], correctAnswer: "B", explanation: "Using wrong products can damage surfaces or reduce cleaning quality." },
      { question: "What do disinfectants do?", options: ["Remove dirt", "Kill germs and bacteria", "Polish surfaces", "Remove odors only"], correctAnswer: "B", explanation: "Disinfectants are designed to kill germs and bacteria on surfaces." }
    ],
    "M3L2": [
      { question: "Why is reading product labels important?", options: ["It's not important", "To understand safe and effective use", "To see the price", "To check the brand"], correctAnswer: "B", explanation: "Labels provide essential information about safe and effective product use." },
      { question: "What is contact time?", options: ["Time to purchase", "How long disinfectant must stay on surface", "Time to clean", "Time between jobs"], correctAnswer: "B", explanation: "Contact time is how long the product must stay on the surface to be effective." },
      { question: "Why should dilution instructions be followed exactly?", options: ["To save money only", "For safety and effectiveness", "It doesn't matter", "To use less product"], correctAnswer: "B", explanation: "Correct dilution ensures both safety and cleaning effectiveness." }
    ],
    "M3L3": [
      { question: "Why should you never mix different cleaning chemicals?", options: ["It wastes product", "It can create toxic gases", "It takes more time", "It's not a problem"], correctAnswer: "B", explanation: "Mixing chemicals can create toxic or dangerous gases." },
      { question: "What protective equipment should be worn when handling chemicals?", options: ["Just regular clothes", "Gloves, masks, eye protection as needed", "Nothing special", "Heavy boots only"], correctAnswer: "B", explanation: "Appropriate PPE protects against chemical hazards." },
      { question: "Why is ventilation important when using strong chemicals?", options: ["To stay cool", "To reduce fume concentration", "To work faster", "It's not important"], correctAnswer: "B", explanation: "Adequate ventilation reduces exposure to potentially harmful fumes." }
    ],
    "M3L4": [
      { question: "What is a benefit of eco-friendly cleaning products?", options: ["They don't clean well", "They reduce environmental impact", "They are always cheaper", "They work faster"], correctAnswer: "B", explanation: "Eco-friendly products are designed to reduce environmental impact while cleaning effectively." },
      { question: "What might eco-friendly products require compared to conventional products?", options: ["Less care", "Different application methods or longer contact times", "No safety precautions", "More chemicals"], correctAnswer: "B", explanation: "Eco-friendly products may need different methods or longer contact times to be effective." },
      { question: "Who benefits from eco-friendly cleaning products?", options: ["Only the cleaner", "People with sensitivities and the environment", "Only the manufacturer", "No one"], correctAnswer: "B", explanation: "Eco-friendly products benefit those with sensitivities and reduce environmental pollution." }
    ],
    "M3L5": [
      { question: "What is the first step in product safety practice?", options: ["Start cleaning immediately", "Prepare products and protective equipment", "Ignore instructions", "Use random products"], correctAnswer: "B", explanation: "Preparing products and protective equipment before starting ensures safety." },
      { question: "Why should cleaning products be kept labeled and organized?", options: ["It looks nice", "To ensure correct and safe use", "It's not important", "To impress clients"], correctAnswer: "B", explanation: "Labeled and organized products prevent confusion and misuse." },
      { question: "What should be done after using cleaning products?", options: ["Leave them out", "Store them properly", "Mix leftovers", "Ignore disposal rules"], correctAnswer: "B", explanation: "Proper storage after use maintains safety and product quality." }
    ]
  };
  
  // Add more quiz questions for remaining lessons
  const defaultQuizQuestions = [
    { question: `What is a key concept covered in "${lesson.title}"?`, options: ["Ignoring safety", "Following professional standards", "Working without tools", "Avoiding clients"], correctAnswer: "B", explanation: "Professional standards are fundamental to this lesson's content." },
    { question: `Why is the content of "${lesson.title}" important for professional cleaners?`, options: ["It's not important", "It helps deliver quality service", "It reduces work", "It eliminates training"], correctAnswer: "B", explanation: "Understanding this content helps cleaners deliver professional quality service." },
    { question: `What should cleaners practice based on "${lesson.title}"?`, options: ["Shortcuts only", "Consistent professional techniques", "Ignoring guidelines", "Working without equipment"], correctAnswer: "B", explanation: "Consistent practice of proper techniques ensures professional results." }
  ];
  
  return quizzes[lessonId] || defaultQuizQuestions;
}

async function generateImage(prompt: string): Promise<string | null> {
  try {
    console.log(`Generating image: ${prompt.substring(0, 50)}...`);
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      quality: "hd",
      style: "vivid"
    });
    
    return response.data[0]?.url || null;
  } catch (error) {
    console.error("Error generating image:", error);
    return null;
  }
}

async function seedCleaningCourse() {
  console.log("🧹 Starting Professional Cleaning Services course seeding...");
  
  try {
    // Check if course already exists
    const existingCourses = await db.select().from(courses).where(eq(courses.title, "Professional Cleaning Services"));
    
    if (existingCourses.length > 0) {
      console.log("Course already exists. Deleting and recreating...");
      // Delete existing course (this will cascade to modules, lessons, etc.)
      await db.delete(courses).where(eq(courses.id, existingCourses[0].id));
    }
    
    // Create the course
    console.log("📚 Creating course...");
    const [course] = await db.insert(courses).values({
      title: "Professional Cleaning Services",
      description: "A comprehensive training course for professional cleaning services. Learn essential skills including hygiene, safety, tools, products, residential and commercial cleaning, customer service, and surface care. This course prepares you for real-world professional cleaning work with practical knowledge and hands-on techniques.",
      thumbnailUrl: "/attached_assets/cleaning-course-thumbnail.png",
      pricingType: "free",
      price: "0",
      isActive: true,
      approvalStatus: "approved",
      difficulty: "beginner",
      duration: 40,
      language: "en",
      certificationType: "certificate",
      tags: ["cleaning", "professional", "hygiene", "safety", "residential", "commercial", "free"],
      learningObjectives: [
        "Understand professional cleaning standards and practices",
        "Master the use of cleaning tools and equipment safely",
        "Learn proper handling of cleaning products and chemicals",
        "Apply residential and commercial cleaning techniques",
        "Practice health, safety, and infection control procedures",
        "Develop time management and customer service skills",
        "Clean different surface types correctly"
      ],
      publisherName: "Professional Cleaning Academy",
      publisherBio: "Expert training for professional cleaning services"
    }).returning();
    
    console.log(`✅ Course created with ID: ${course.id}`);
    
    let totalLessons = 0;
    let totalImages = 0;
    let totalQuizzes = 0;
    
    // Create modules and lessons
    for (let moduleIndex = 0; moduleIndex < courseModules.length; moduleIndex++) {
      const moduleData = courseModules[moduleIndex];
      console.log(`\n📁 Creating module ${moduleIndex + 1}: ${moduleData.title}`);
      
      const [module] = await db.insert(modules).values({
        courseId: course.id,
        title: moduleData.title,
        orderNum: moduleIndex + 1,
        description: `Module ${moduleIndex + 1} of the Professional Cleaning Services course`,
        isActive: true
      }).returning();
      
      // Create lessons for this module
      for (let lessonIndex = 0; lessonIndex < moduleData.lessons.length; lessonIndex++) {
        const lessonData = moduleData.lessons[lessonIndex];
        console.log(`  📖 Creating lesson ${lessonIndex + 1}: ${lessonData.title}`);
        
        // Build lesson content HTML
        const contentParts: string[] = [];
        
        if (lessonData.content.body) {
          contentParts.push(`<div class="prose max-w-none">
            ${lessonData.content.body.split('\n\n').map(p => `<p>${p}</p>`).join('\n')}
          </div>`);
        }
        
        if (lessonData.content.steps && lessonData.content.steps.length > 0) {
          contentParts.push(`
            <div class="mt-6">
              <h3 class="text-lg font-semibold mb-3">Key Steps</h3>
              <ol class="list-decimal list-inside space-y-2">
                ${lessonData.content.steps.map(step => `<li>${step}</li>`).join('\n')}
              </ol>
            </div>
          `);
        }
        
        if (lessonData.content.exercise) {
          contentParts.push(`
            <div class="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 class="text-lg font-semibold mb-2 text-blue-800">Exercise</h3>
              <p class="text-blue-700"><strong>Task:</strong> ${lessonData.content.exercise.task}</p>
              <p class="text-blue-600 text-sm mt-2"><strong>Expected:</strong> ${lessonData.content.exercise.expected_result || lessonData.content.exercise.expected_output}</p>
            </div>
          `);
        }
        
        if (lessonData.content.summary) {
          contentParts.push(`
            <div class="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
              <h3 class="text-lg font-semibold mb-2 text-green-800">Summary</h3>
              <p class="text-green-700">${lessonData.content.summary}</p>
            </div>
          `);
        }
        
        const [lesson] = await db.insert(lessons).values({
          moduleId: module.id,
          courseId: course.id,
          title: lessonData.title,
          content: contentParts.join('\n'),
          orderNum: lessonIndex + 1,
          durationMinutes: 10 + (lessonIndex * 2),
          freePreviewFlag: moduleIndex === 0 && lessonIndex < 2 // First 2 lessons of first module are free preview
        }).returning();
        
        totalLessons++;
        
        // Generate images for the lesson (2-3 per lesson)
        if (lessonData.content.images && lessonData.content.images.length > 0) {
          console.log(`    🖼️  Generating ${lessonData.content.images.length} images...`);
          
          const imageUrls: string[] = [];
          for (const imageData of lessonData.content.images.slice(0, 3)) {
            const imageUrl = await generateImage(imageData.prompt);
            if (imageUrl) {
              imageUrls.push(imageUrl);
              totalImages++;
              
              // Add image as content block
              await db.insert(lessonContentBlocks).values({
                lessonId: lesson.id,
                blockType: 'image',
                title: `Lesson illustration`,
                mediaUrl: imageUrl,
                displayOrder: imageUrls.length
              });
            }
            
            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          
          // Update lesson with image URLs
          if (imageUrls.length > 0) {
            await db.update(lessons)
              .set({ images: imageUrls })
              .where(eq(lessons.id, lesson.id));
          }
        }
        
        // Create quiz for the lesson
        const quizQuestions = generateQuizQuestions(lessonData);
        console.log(`    📝 Creating quiz with ${quizQuestions.length} questions...`);
        
        await db.insert(quizzes).values({
          lessonId: lesson.id,
          title: `${lessonData.title} Quiz`,
          description: `Test your understanding of ${lessonData.title}`,
          questions: quizQuestions,
          passingScore: 70,
          timeLimitMinutes: 10
        });
        
        totalQuizzes++;
      }
    }
    
    console.log("\n" + "=".repeat(50));
    console.log("🎉 Course seeding complete!");
    console.log(`📚 Course: Professional Cleaning Services`);
    console.log(`📁 Modules: ${courseModules.length}`);
    console.log(`📖 Lessons: ${totalLessons}`);
    console.log(`🖼️  Images generated: ${totalImages}`);
    console.log(`📝 Quizzes: ${totalQuizzes}`);
    console.log("=".repeat(50));
    
  } catch (error) {
    console.error("❌ Error seeding course:", error);
    throw error;
  }
}

// Run the seeding
seedCleaningCourse()
  .then(() => {
    console.log("✅ Seeding completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  });
