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

// Modules 5-10 only (continuation from where we left off)
const remainingModules: ModuleData[] = [
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
            { image_id: "M5L1_IMG1", prompt: "HD professional illustration of a cleaner cleaning desks and workstations in a modern office, flat style, NO TEXT IN IMAGE" }
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
            { image_id: "M5L2_IMG1", prompt: "HD professional illustration of a cleaner disinfecting a commercial restroom sink and fixtures, modern flat style, NO TEXT IN IMAGE" }
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
            { image_id: "M5L3_IMG1", prompt: "HD professional illustration of a cleaner mopping a commercial floor using proper technique, modern flat style, NO TEXT IN IMAGE" }
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
            { image_id: "M5L4_IMG1", prompt: "HD professional illustration of a cleaner maintaining a busy commercial hallway, modern flat style, NO TEXT IN IMAGE" }
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
            { image_id: "M5L5_IMG1", prompt: "HD professional illustration of a cleaner following a structured cleaning routine in a commercial space, modern flat style, NO TEXT IN IMAGE" }
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
            { image_id: "M5L6_IMG1", prompt: "HD professional illustration of a supervisor inspecting a clean commercial space, modern flat style, NO TEXT IN IMAGE" }
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
            { image_id: "M6L1_IMG1", prompt: "HD professional illustration of a cleaner wearing gloves, mask, and protective clothing while working, modern flat style, NO TEXT IN IMAGE" }
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
            { image_id: "M6L2_IMG1", prompt: "HD professional illustration of a cleaner lifting equipment safely using proper posture, modern flat style, NO TEXT IN IMAGE" }
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
            { image_id: "M6L3_IMG1", prompt: "HD professional illustration of a cleaner safely cleaning a liquid spill with warning signs in place, modern flat style, NO TEXT IN IMAGE" }
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
            { image_id: "M6L4_IMG1", prompt: "HD professional illustration of a cleaner calmly responding to an emergency situation in a workplace, modern flat style, NO TEXT IN IMAGE" }
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
            { image_id: "M6L5_IMG1", prompt: "HD professional illustration of a cleaner working safely with proper posture and equipment in a clean environment, modern flat style, NO TEXT IN IMAGE" }
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
            { image_id: "M7L1_IMG1", prompt: "HD professional illustration of a cleaner practicing good hygiene while cleaning shared surfaces, modern flat style, NO TEXT IN IMAGE" }
          ],
          exercise: { task: "Explain why hygiene is important in professional cleaning.", expected_result: "Explanation related to health or infection prevention." },
          summary: "Hygiene focuses on preventing illness and maintaining healthy environments. Understanding hygiene principles helps professional cleaners reduce contamination and protect health."
        }
      },
      {
        lesson_id: "M7L2",
        title: "Preventing Cross Contamination",
        content: {
          body: "Preventing cross contamination is critical for hygiene and infection control. Cross contamination occurs when germs are transferred from one surface, area, or item to another. In professional cleaning, improper practices can spread contamination instead of removing it.\n\nCommon causes of cross contamination include: using the same cloth or mop in multiple areas, not changing gloves between tasks, moving from dirty to clean areas without handwashing, and improper storage of cleaning tools.\n\nPrevention methods include: using color-coded cloths and tools for different areas, changing gloves frequently, cleaning tools after each use, following proper cleaning order (clean to dirty), and maintaining strict personal hygiene practices.",
          steps: [
            "Understand cross contamination risks",
            "Use color-coded tools",
            "Change gloves frequently",
            "Follow proper cleaning order",
            "Maintain tool hygiene"
          ],
          images: [
            { image_id: "M7L2_IMG1", prompt: "HD professional illustration showing proper tool handling and color-coded cleaning supplies, modern flat style, NO TEXT IN IMAGE" }
          ],
          exercise: { task: "Describe one method used to prevent cross contamination.", expected_result: "A clear method related to tools, order, or hygiene." },
          summary: "Preventing cross contamination requires proper tool use, correct cleaning order, and strict hygiene practices. These methods help protect health and maintain professional cleaning standards."
        }
      },
      {
        lesson_id: "M7L3",
        title: "Disinfection Basics",
        content: {
          body: "Disinfection is the process of killing or eliminating germs on surfaces. It is a key step in infection control, especially in healthcare settings, restrooms, kitchens, and high-touch areas. Disinfection goes beyond regular cleaning by targeting harmful microorganisms.\n\nDisinfection requires correct product selection. Different disinfectants are effective against different types of germs. Always read product labels for proper use, dilution, and contact time (how long the surface must stay wet).\n\nProper disinfection steps include: clean the surface first to remove dirt and debris, apply disinfectant evenly, allow the required contact time, and let the surface air dry or wipe as directed. Never mix disinfectants with other cleaning products.",
          steps: [
            "Select appropriate disinfectant",
            "Clean surface before disinfecting",
            "Apply disinfectant evenly",
            "Allow required contact time",
            "Follow drying instructions"
          ],
          images: [
            { image_id: "M7L3_IMG1", prompt: "HD professional illustration of a cleaner properly applying disinfectant to a surface, modern flat style, NO TEXT IN IMAGE" }
          ],
          exercise: { task: "Explain why contact time is important during disinfection.", expected_result: "Explanation related to germ elimination or effectiveness." },
          summary: "Disinfection kills harmful germs on surfaces. Proper product selection, application, and contact time are essential for effective infection control."
        }
      },
      {
        lesson_id: "M7L4",
        title: "High-Touch Surface Cleaning",
        content: {
          body: "High-touch surfaces are areas that people frequently touch with their hands. These surfaces include door handles, light switches, elevator buttons, handrails, faucets, and shared equipment. High-touch surfaces are major transmission points for germs and require frequent cleaning and disinfection.\n\nIdentifying high-touch surfaces is the first step. Consider traffic patterns and common behaviors in each environment. Offices, healthcare facilities, schools, and public spaces each have specific high-touch areas.\n\nClean and disinfect high-touch surfaces multiple times daily, especially during illness outbreaks. Use appropriate disinfectants and allow proper contact time. Document cleaning schedules to ensure consistency. Regular attention to high-touch surfaces significantly reduces disease transmission.",
          steps: [
            "Identify high-touch surfaces",
            "Clean surfaces before disinfecting",
            "Apply appropriate disinfectant",
            "Clean frequently throughout the day",
            "Document cleaning schedules"
          ],
          images: [
            { image_id: "M7L4_IMG1", prompt: "HD professional illustration of a cleaner disinfecting door handles and light switches, modern flat style, NO TEXT IN IMAGE" }
          ],
          exercise: { task: "Name two high-touch surfaces and explain why they need frequent cleaning.", expected_result: "Correct identification with transmission-related explanation." },
          summary: "High-touch surfaces are major points for germ transmission. Frequent cleaning and disinfection of these areas is essential for effective infection control."
        }
      },
      {
        lesson_id: "M7L5",
        title: "Waste Management",
        content: {
          body: "Proper waste management is an important part of hygiene and infection control. Waste generated during cleaning may include general trash, recyclables, hazardous materials, and infectious waste. Each type requires appropriate handling and disposal methods.\n\nGeneral waste should be placed in appropriate containers and removed regularly. Recyclable materials should be sorted according to local guidelines. Hazardous waste (chemicals, sharps, batteries) must be handled and disposed of according to safety regulations.\n\nInfectious waste is particularly important in healthcare settings. Use designated containers, wear appropriate PPE, and follow disposal protocols. Never overfill waste containers, and always wash hands after handling waste. Proper waste management protects health and maintains professional standards.",
          steps: [
            "Identify waste types",
            "Use appropriate containers",
            "Sort recyclables correctly",
            "Handle hazardous waste safely",
            "Follow disposal protocols"
          ],
          images: [
            { image_id: "M7L5_IMG1", prompt: "HD professional illustration of proper waste sorting and disposal in a professional cleaning environment, modern flat style, NO TEXT IN IMAGE" }
          ],
          exercise: { task: "Explain one safety precaution when handling hazardous waste.", expected_result: "A clear precaution related to PPE or disposal." },
          summary: "Proper waste management includes correct sorting, handling, and disposal of different waste types. Following protocols protects health and supports infection control."
        }
      },
      {
        lesson_id: "M7L6",
        title: "Infection Control Practice",
        content: {
          body: "Infection control practice brings together all hygiene and contamination prevention knowledge into daily work. Professional cleaners must apply these principles consistently to protect themselves, clients, and the public.\n\nEffective infection control combines: personal hygiene (handwashing, clean uniforms), proper PPE use, correct cleaning and disinfection techniques, cross contamination prevention, and proper waste management.\n\nStay informed about current health guidelines and best practices. During outbreaks, enhanced cleaning protocols may be required. Report any concerns about hygiene or safety to supervisors. Continuous learning and attention to detail support professional infection control standards.",
          steps: [
            "Apply all hygiene principles daily",
            "Use PPE consistently",
            "Follow enhanced protocols when needed",
            "Stay informed about guidelines",
            "Report concerns promptly"
          ],
          images: [
            { image_id: "M7L6_IMG1", prompt: "HD professional illustration of a cleaner demonstrating comprehensive infection control practices, modern flat style, NO TEXT IN IMAGE" }
          ],
          exercise: { task: "Describe one way professional cleaners help prevent infection spread.", expected_result: "A clear action related to disinfection, hygiene, or contamination prevention." },
          summary: "Infection control practice combines personal hygiene, proper techniques, and consistent application of safety protocols. Professional cleaners play a vital role in maintaining healthy environments."
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
        title: "Planning Your Work",
        content: {
          body: "Planning your work is fundamental to professional cleaning efficiency. Good planning ensures tasks are completed on time, nothing is forgotten, and resources are used effectively. Professional cleaners who plan well deliver better results with less stress.\n\nStart each job by reviewing the scope of work: what needs to be cleaned, what products and tools are required, and how much time is available. Consider any special requests or priority areas. Gather all necessary supplies before starting.\n\nCreate a mental or written plan for the cleaning order. Work systematically to avoid backtracking or repeating tasks. Planning also includes anticipating challenges and having solutions ready. Regular planning practice improves speed and quality over time.",
          steps: [
            "Review scope of work",
            "Gather necessary supplies",
            "Plan cleaning order",
            "Anticipate challenges",
            "Execute systematically"
          ],
          images: [
            { image_id: "M8L1_IMG1", prompt: "HD professional illustration of a cleaner organizing supplies and planning work before starting, modern flat style, NO TEXT IN IMAGE" }
          ],
          exercise: { task: "Explain one benefit of planning before starting cleaning work.", expected_result: "Explanation related to efficiency, time, or quality." },
          summary: "Planning your work improves efficiency, reduces stress, and ensures quality results. Systematic planning is a key professional skill."
        }
      },
      {
        lesson_id: "M8L2",
        title: "Efficient Cleaning Order",
        content: {
          body: "Following an efficient cleaning order saves time and improves results. The correct order prevents re-contamination of cleaned areas and reduces wasted effort. Professional cleaners use proven sequences to maximize efficiency.\n\nGeneral principles include: work top to bottom (dust falls downward), work back to front (exit without walking on cleaned floors), clean dry before wet (dusting before mopping), and complete one room before moving to another.\n\nSpecific order varies by environment, but common patterns include: declutter and gather trash first, dust high surfaces, clean middle surfaces, clean low surfaces, and finish with floors. Following consistent order builds habits that increase speed over time.",
          steps: [
            "Work top to bottom",
            "Work back to front",
            "Clean dry before wet",
            "Complete one room at a time",
            "Finish with floors"
          ],
          images: [
            { image_id: "M8L2_IMG1", prompt: "HD professional illustration showing systematic room cleaning from top to bottom, modern flat style, NO TEXT IN IMAGE" }
          ],
          exercise: { task: "Explain why cleaners should work from top to bottom.", expected_result: "Explanation related to dust or efficiency." },
          summary: "Following efficient cleaning order saves time and improves results. Consistent sequences build professional habits."
        }
      },
      {
        lesson_id: "M8L3",
        title: "Speed and Quality Balance",
        content: {
          body: "Balancing speed and quality is a key skill in professional cleaning. Clients expect both timely completion and high-quality results. Rushing leads to missed spots and callbacks, while being too slow reduces productivity and earnings.\n\nSpeed comes from practice and good habits, not from cutting corners. Focus on efficient movement, proper tool selection, and systematic approaches. Quality comes from attention to detail and following correct procedures.\n\nSet realistic time expectations based on job size and complexity. Monitor your pace during work. If falling behind, identify areas where you can work more efficiently without sacrificing quality. Regular self-assessment helps improve this balance over time.",
          steps: [
            "Practice efficient techniques",
            "Maintain attention to detail",
            "Set realistic time expectations",
            "Monitor pace during work",
            "Improve through self-assessment"
          ],
          images: [
            { image_id: "M8L3_IMG1", prompt: "HD professional illustration of a cleaner working efficiently with focus and attention to detail, modern flat style, NO TEXT IN IMAGE" }
          ],
          exercise: { task: "Explain how a cleaner can increase speed without reducing quality.", expected_result: "Explanation related to practice, efficiency, or techniques." },
          summary: "Balancing speed and quality requires practice, efficient techniques, and attention to detail. Professional cleaners develop this balance through experience and self-assessment."
        }
      },
      {
        lesson_id: "M8L4",
        title: "Handling Multiple Tasks",
        content: {
          body: "Professional cleaners often handle multiple tasks and responsibilities simultaneously. Managing multiple tasks effectively requires organization, prioritization, and flexibility. These skills help complete work efficiently without becoming overwhelmed.\n\nPrioritize tasks based on importance and deadlines. Identify which tasks are critical and which can be delayed if necessary. Group similar tasks together to reduce transitions and tool changes.\n\nStay organized by keeping track of progress. Use checklists or mental notes to ensure nothing is missed. Remain flexible - unexpected issues may require adjusting plans. Communicate with supervisors or clients if priorities need to change. Effective multitasking improves productivity and professional reputation.",
          steps: [
            "Prioritize tasks by importance",
            "Group similar tasks together",
            "Track progress systematically",
            "Stay flexible with plans",
            "Communicate changes when needed"
          ],
          images: [
            { image_id: "M8L4_IMG1", prompt: "HD professional illustration of a cleaner efficiently managing multiple cleaning tasks, modern flat style, NO TEXT IN IMAGE" }
          ],
          exercise: { task: "Describe one way to stay organized when handling multiple tasks.", expected_result: "A clear method related to tracking or prioritization." },
          summary: "Handling multiple tasks effectively requires prioritization, organization, and flexibility. These skills support professional productivity and reliability."
        }
      },
      {
        lesson_id: "M8L5",
        title: "Time Management Practice",
        content: {
          body: "Time management practice applies all planning and efficiency skills to daily work routines. Professional cleaners who manage time well consistently meet expectations, reduce stress, and maintain high quality.\n\nStart each day by reviewing scheduled work and preparing supplies. Arrive on time and begin work promptly. Track time during tasks to understand where time is spent. Identify patterns - some tasks may take longer than expected.\n\nContinuously improve by analyzing what works well and what needs adjustment. Set personal goals for efficiency. Take appropriate breaks to maintain energy and focus. Good time management is a competitive advantage in professional cleaning.",
          steps: [
            "Review schedule and prepare daily",
            "Arrive and start promptly",
            "Track time during tasks",
            "Analyze and adjust patterns",
            "Set improvement goals"
          ],
          images: [
            { image_id: "M8L5_IMG1", prompt: "HD professional illustration of a cleaner reviewing schedule and managing time effectively, modern flat style, NO TEXT IN IMAGE" }
          ],
          exercise: { task: "Explain one way to improve time management in cleaning work.", expected_result: "A clear improvement method related to tracking, planning, or habits." },
          summary: "Time management practice combines planning, tracking, and continuous improvement. Professional time management supports reliability and career success."
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
        title: "Professional Communication",
        content: {
          body: "Professional communication is essential for building trust and maintaining positive client relationships. How cleaners communicate affects client satisfaction, repeat business, and professional reputation. Clear, respectful, and professional communication creates positive impressions.\n\nProfessional communication includes: speaking clearly and politely, listening actively to client needs, asking clarifying questions when needed, and providing honest updates about work progress or issues.\n\nNon-verbal communication matters too: maintain appropriate eye contact, use positive body language, dress professionally, and be punctual. Written communication (texts, emails, notes) should be clear and professional. Remember that you represent your company or business in every interaction.",
          steps: [
            "Speak clearly and politely",
            "Listen actively",
            "Ask clarifying questions",
            "Provide honest updates",
            "Maintain professional appearance"
          ],
          images: [
            { image_id: "M9L1_IMG1", prompt: "HD professional illustration of a cleaner communicating professionally with a client, modern flat style, NO TEXT IN IMAGE" }
          ],
          exercise: { task: "Describe one element of professional communication with clients.", expected_result: "A clear element related to speaking, listening, or presentation." },
          summary: "Professional communication builds trust and positive relationships. Clear, respectful, and honest communication is essential for client satisfaction."
        }
      },
      {
        lesson_id: "M9L2",
        title: "Understanding Client Needs",
        content: {
          body: "Understanding client needs is the foundation of excellent customer service. Each client has unique expectations, preferences, and priorities. Professional cleaners who understand these needs can deliver personalized service that exceeds expectations.\n\nStart by listening carefully during initial meetings or instructions. Ask questions to clarify specific preferences: priority areas, products to use or avoid, special instructions, and scheduling preferences. Take notes to remember important details.\n\nObserve patterns over time - regular clients may have consistent preferences. Be attentive to feedback and adjust accordingly. Understanding needs helps build long-term relationships and reduces misunderstandings. Clients appreciate cleaners who remember their preferences.",
          steps: [
            "Listen carefully to instructions",
            "Ask clarifying questions",
            "Take notes on preferences",
            "Observe patterns over time",
            "Adjust based on feedback"
          ],
          images: [
            { image_id: "M9L2_IMG1", prompt: "HD professional illustration of a cleaner listening attentively to client instructions, modern flat style, NO TEXT IN IMAGE" }
          ],
          exercise: { task: "Explain why understanding client needs is important.", expected_result: "Explanation related to satisfaction, trust, or service quality." },
          summary: "Understanding client needs enables personalized, excellent service. Active listening and attention to preferences build strong client relationships."
        }
      },
      {
        lesson_id: "M9L3",
        title: "Handling Complaints",
        content: {
          body: "Handling complaints professionally is an important skill because even excellent cleaners occasionally receive criticism. How complaints are handled can turn negative situations into opportunities to strengthen client relationships.\n\nWhen receiving a complaint, remain calm and professional. Don't become defensive or make excuses. Listen fully to understand the concern. Acknowledge the client's feelings and apologize sincerely for any dissatisfaction.\n\nWork toward resolution: ask what would make the situation right, offer to correct the issue, and follow through on commitments. Learn from complaints to prevent similar issues. Report significant complaints to supervisors. Professional complaint handling demonstrates maturity and commitment to quality.",
          steps: [
            "Remain calm and professional",
            "Listen fully to the concern",
            "Acknowledge and apologize sincerely",
            "Work toward resolution",
            "Learn from feedback"
          ],
          images: [
            { image_id: "M9L3_IMG1", prompt: "HD professional illustration of a cleaner handling a client concern calmly and professionally, modern flat style, NO TEXT IN IMAGE" }
          ],
          exercise: { task: "Describe one step to handle a client complaint professionally.", expected_result: "A clear step related to listening, acknowledging, or resolving." },
          summary: "Professional complaint handling turns negative situations into opportunities. Staying calm, listening, and resolving issues builds trust and demonstrates commitment to quality."
        }
      },
      {
        lesson_id: "M9L4",
        title: "Building Trust",
        content: {
          body: "Building trust is essential because clients allow cleaners into their personal and professional spaces. Trust develops through consistent reliability, honesty, and professional behavior. Strong trust leads to long-term relationships, referrals, and career success.\n\nReliability builds trust: arrive on time, complete agreed work, and follow through on promises. Honesty builds trust: communicate truthfully about work, report accidents or damage immediately, and never take items from client properties.\n\nRespect client privacy and property. Handle personal items carefully, maintain confidentiality about what you observe, and be discreet about client information. Professional boundaries demonstrate maturity and respect. Trust, once established, must be maintained through continued professional behavior.",
          steps: [
            "Be reliable and punctual",
            "Communicate honestly",
            "Report issues immediately",
            "Respect privacy and property",
            "Maintain professional boundaries"
          ],
          images: [
            { image_id: "M9L4_IMG1", prompt: "HD professional illustration of a cleaner demonstrating trustworthy and reliable behavior, modern flat style, NO TEXT IN IMAGE" }
          ],
          exercise: { task: "Explain one way professional cleaners build trust with clients.", expected_result: "A clear method related to reliability, honesty, or respect." },
          summary: "Trust is built through reliability, honesty, and respect. Strong trust leads to lasting client relationships and professional success."
        }
      },
      {
        lesson_id: "M9L5",
        title: "Customer Service Practice",
        content: {
          body: "Customer service practice brings together all client interaction skills into daily work. Professional cleaners who excel at customer service create positive experiences that lead to satisfied clients, repeat business, and referrals.\n\nApply communication skills consistently: greet clients professionally, ask about any special needs, and thank them at the end of service. Be attentive to feedback and responsive to concerns. Go above expectations when possible.\n\nMaintain professionalism even during challenging interactions. Remember that positive client relationships benefit both parties. Seek feedback proactively to understand areas for improvement. Excellence in customer service distinguishes professional cleaners from competitors.",
          steps: [
            "Greet clients professionally",
            "Ask about special needs",
            "Be responsive to concerns",
            "Go above expectations",
            "Seek improvement feedback"
          ],
          images: [
            { image_id: "M9L5_IMG1", prompt: "HD professional illustration of a cleaner providing excellent customer service to a satisfied client, modern flat style, NO TEXT IN IMAGE" }
          ],
          exercise: { task: "Describe one customer service habit that creates positive client experiences.", expected_result: "A clear habit related to communication, attention, or going above expectations." },
          summary: "Excellent customer service creates satisfied clients and drives career success. Consistent application of communication, trust, and responsiveness builds lasting professional relationships."
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
        title: "Glass and Mirrors",
        content: {
          body: "Cleaning glass and mirrors requires specific techniques to achieve streak-free, clear results. Glass surfaces include windows, mirrors, glass tables, and glass doors. Proper cleaning enhances appearance and allows maximum light transmission.\n\nStart by removing loose dust and debris with a dry cloth or duster. Apply glass cleaner in controlled amounts - too much product causes streaking. Use a microfiber cloth or squeegee for best results.\n\nClean in overlapping, S-shaped strokes. Wipe edges and corners carefully. For stubborn spots, allow cleaner to sit briefly before wiping. Check from different angles to identify streaks or missed spots. Regular glass cleaning maintains professional appearance.",
          steps: [
            "Remove loose dust first",
            "Apply glass cleaner sparingly",
            "Use microfiber or squeegee",
            "Clean in overlapping strokes",
            "Check for streaks from angles"
          ],
          images: [
            { image_id: "M10L1_IMG1", prompt: "HD professional illustration of a cleaner cleaning glass windows with a squeegee, modern flat style, NO TEXT IN IMAGE" }
          ],
          exercise: { task: "Explain one technique for achieving streak-free glass.", expected_result: "A clear technique related to products, tools, or motion." },
          summary: "Glass and mirror cleaning requires proper techniques for streak-free results. Using correct products, tools, and methods achieves professional-quality finishes."
        }
      },
      {
        lesson_id: "M10L2",
        title: "Wood Surfaces",
        content: {
          body: "Cleaning wood surfaces requires care to maintain appearance and prevent damage. Wood is found in furniture, cabinets, trim, and floors. Different finishes (sealed, oiled, unfinished) require different approaches.\n\nIdentify the wood type and finish before cleaning. Sealed wood can tolerate more moisture than unfinished wood. Use wood-appropriate cleaners - general cleaners may damage finishes or leave residue.\n\nDust regularly to prevent buildup. Apply cleaner to cloth, not directly to surface. Wipe following the wood grain direction. Remove excess moisture promptly. For polished wood, apply appropriate polish sparingly and buff to shine. Avoid water pooling on any wood surface.",
          steps: [
            "Identify wood type and finish",
            "Dust regularly",
            "Use appropriate wood cleaners",
            "Wipe following grain direction",
            "Remove excess moisture promptly"
          ],
          images: [
            { image_id: "M10L2_IMG1", prompt: "HD professional illustration of a cleaner carefully cleaning wooden furniture, modern flat style, NO TEXT IN IMAGE" }
          ],
          exercise: { task: "Explain why cleaners should wipe wood following the grain direction.", expected_result: "Explanation related to appearance or damage prevention." },
          summary: "Wood surface cleaning requires appropriate products and techniques. Following wood grain and managing moisture maintains appearance and prevents damage."
        }
      },
      {
        lesson_id: "M10L3",
        title: "Tile and Grout",
        content: {
          body: "Cleaning tile and grout requires attention to both the tile surface and the porous grout lines. Tiles are commonly found in bathrooms, kitchens, and entryways. Regular cleaning prevents buildup and maintains a professional appearance.\n\nSweep or vacuum to remove loose debris first. Apply appropriate tile cleaner and allow dwell time for tough stains. Scrub tiles and grout with appropriate brushes - grout may need stiffer bristles.\n\nGrout is porous and absorbs stains more easily than tile. Regular cleaning prevents discoloration. For heavily stained grout, specialized cleaners or paste may be needed. Rinse thoroughly to remove cleaner residue. Dry tiles to prevent water spots and slip hazards.",
          steps: [
            "Remove loose debris",
            "Apply appropriate tile cleaner",
            "Scrub tiles and grout",
            "Rinse thoroughly",
            "Dry to prevent spots"
          ],
          images: [
            { image_id: "M10L3_IMG1", prompt: "HD professional illustration of a cleaner scrubbing tile and grout with proper tools, modern flat style, NO TEXT IN IMAGE" }
          ],
          exercise: { task: "Explain why grout requires special attention during cleaning.", expected_result: "Explanation related to porosity or stain absorption." },
          summary: "Tile and grout cleaning requires attention to both surfaces. Regular cleaning and appropriate products prevent buildup and maintain appearance."
        }
      },
      {
        lesson_id: "M10L4",
        title: "Stainless Steel",
        content: {
          body: "Cleaning stainless steel requires specific techniques to remove fingerprints, smudges, and streaks while maintaining the surface's appearance. Stainless steel is found in appliances, fixtures, elevators, and commercial equipment.\n\nIdentify the grain direction - stainless steel has a directional finish. Always wipe following the grain for best results. Use stainless steel specific cleaners or mild soap solutions.\n\nApply cleaner to cloth, not directly to surface. Wipe gently following grain direction. Remove all cleaner residue. Buff with a dry microfiber cloth for shine. For stubborn spots, use appropriate stainless steel polish. Avoid abrasive pads that can scratch the surface.",
          steps: [
            "Identify grain direction",
            "Use appropriate cleaners",
            "Apply to cloth first",
            "Wipe following grain",
            "Buff for shine"
          ],
          images: [
            { image_id: "M10L4_IMG1", prompt: "HD professional illustration of a cleaner polishing stainless steel appliances, modern flat style, NO TEXT IN IMAGE" }
          ],
          exercise: { task: "Explain why wiping direction matters when cleaning stainless steel.", expected_result: "Explanation related to grain or streak prevention." },
          summary: "Stainless steel cleaning requires following grain direction and using appropriate products. Proper technique achieves streak-free, professional results."
        }
      },
      {
        lesson_id: "M10L5",
        title: "Surface Cleaning Practice",
        content: {
          body: "Surface cleaning practice brings together all material-specific knowledge into daily work. Professional cleaners must identify surfaces quickly and apply correct methods to achieve quality results without causing damage.\n\nDevelop a systematic approach to surface identification. When encountering unfamiliar materials, research appropriate cleaning methods or ask for guidance. Always test new products or methods in inconspicuous areas first.\n\nContinue learning about new materials and products. The cleaning industry evolves, and professional cleaners must stay current. Experience builds recognition and confidence with different surfaces. Attention to surface-specific requirements distinguishes professional work from amateur cleaning.",
          steps: [
            "Identify surfaces quickly",
            "Apply correct methods",
            "Test in inconspicuous areas",
            "Research unfamiliar materials",
            "Continue learning about surfaces"
          ],
          images: [
            { image_id: "M10L5_IMG1", prompt: "HD professional illustration of a cleaner working on various surfaces with appropriate tools, modern flat style, NO TEXT IN IMAGE" }
          ],
          exercise: { task: "Explain why surface identification is important before cleaning.", expected_result: "Explanation related to damage prevention or product selection." },
          summary: "Surface cleaning practice combines material knowledge with correct techniques. Identifying surfaces and using appropriate methods achieves professional results and prevents damage."
        }
      }
    ]
  }
];

async function generateImage(prompt: string): Promise<string | null> {
  try {
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
    console.error("Image generation error:", error);
    return null;
  }
}

function generateQuizQuestions(lessonData: LessonData): any[] {
  const questions = [];
  
  const questionTypes = [
    {
      question: `What is the main focus of "${lessonData.title}"?`,
      options: [
        lessonData.content.summary.split('.')[0],
        "General office management and administration",
        "Marketing and sales techniques",
        "Financial planning and budgeting"
      ],
      correctAnswer: 0,
      explanation: lessonData.content.summary
    },
    {
      question: `Which of the following is a key step mentioned in this lesson?`,
      options: [
        lessonData.content.steps[0],
        "Skip safety procedures to save time",
        "Use any available cleaning products",
        "Ignore client preferences"
      ],
      correctAnswer: 0,
      explanation: `This lesson emphasizes: ${lessonData.content.steps.join(', ')}`
    },
    {
      question: `Based on this lesson, why is proper technique important?`,
      options: [
        "To ensure quality results and professional standards",
        "It doesn't matter how tasks are completed",
        "Only to impress supervisors",
        "Techniques are optional suggestions"
      ],
      correctAnswer: 0,
      explanation: lessonData.content.summary
    }
  ];

  return questionTypes;
}

async function continueSeeding() {
  console.log("=".repeat(50));
  console.log("🧹 Continuing Professional Cleaning Services Course Seeding");
  console.log("📌 Adding modules M5-M10");
  console.log("=".repeat(50));

  try {
    // Get existing course
    const [course] = await db.select()
      .from(courses)
      .where(eq(courses.title, "Professional Cleaning Services"));
    
    if (!course) {
      throw new Error("Course not found. Please run the main seeding script first.");
    }

    console.log(`\n📚 Found course: ${course.title} (ID: ${course.id})`);

    let totalLessons = 0;
    let totalImages = 0;
    let totalQuizzes = 0;

    // Start module index from 4 (M5 is the 5th module, index 4)
    const startModuleIndex = 4;

    for (let i = 0; i < remainingModules.length; i++) {
      const moduleData = remainingModules[i];
      const moduleIndex = startModuleIndex + i;
      console.log(`\n📁 Creating Module ${moduleIndex + 1}: ${moduleData.title}`);

      const [module] = await db.insert(modules).values({
        courseId: course.id,
        title: moduleData.title,
        description: `Learn about ${moduleData.title.toLowerCase()} in professional cleaning`,
        orderNum: moduleIndex + 1
      }).returning();

      for (let lessonIndex = 0; lessonIndex < moduleData.lessons.length; lessonIndex++) {
        const lessonData = moduleData.lessons[lessonIndex];
        console.log(`  📖 Creating lesson: ${lessonData.title}`);

        const contentParts: string[] = [];
        
        if (lessonData.content.body) {
          contentParts.push(`<div class="prose max-w-none">
            <p class="text-lg leading-relaxed">${lessonData.content.body.replace(/\n\n/g, '</p><p class="text-lg leading-relaxed mt-4">')}</p>
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
          freePreviewFlag: false
        }).returning();
        
        totalLessons++;
        
        // Generate 1 image per lesson to save time
        if (lessonData.content.images && lessonData.content.images.length > 0) {
          console.log(`    🖼️  Generating image...`);
          
          const imageData = lessonData.content.images[0];
          const imageUrl = await generateImage(imageData.prompt);
          if (imageUrl) {
            totalImages++;
            
            await db.insert(lessonContentBlocks).values({
              lessonId: lesson.id,
              blockType: 'image',
              title: `Lesson illustration`,
              mediaUrl: imageUrl,
              displayOrder: 1
            });
            
            await db.update(lessons)
              .set({ images: [imageUrl] })
              .where(eq(lessons.id, lesson.id));
          }
          
          // Delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        // Create quiz for the lesson
        const quizQuestions = generateQuizQuestions(lessonData);
        console.log(`    📝 Creating quiz...`);
        
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
    console.log("🎉 Continuation seeding complete!");
    console.log(`📁 Modules added: ${remainingModules.length}`);
    console.log(`📖 Lessons added: ${totalLessons}`);
    console.log(`🖼️  Images generated: ${totalImages}`);
    console.log(`📝 Quizzes created: ${totalQuizzes}`);
    console.log("=".repeat(50));
    
  } catch (error) {
    console.error("❌ Error during continuation seeding:", error);
    throw error;
  }
}

// Run the continuation
continueSeeding()
  .then(() => {
    console.log("✅ Continuation seeding completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Continuation seeding failed:", error);
    process.exit(1);
  });
