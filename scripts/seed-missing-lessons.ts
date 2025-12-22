import { db } from "../server/db";
import { modules, lessons, quizzes, lessonContentBlocks } from "../shared/schema";
import { eq, and } from "drizzle-orm";
import OpenAI from "openai";

const openai = new OpenAI();

const COURSE_ID = "2cc75756-02b2-4f8e-beb5-4a3592aa10b4";

interface LessonData {
  title: string;
  body: string;
  steps: string[];
  imagePrompt: string;
  exercise: { task: string; expected: string };
  summary: string;
}

const missingLessons: { moduleName: string; lessons: LessonData[] }[] = [
  {
    moduleName: "Residential Cleaning",
    lessons: [
      {
        title: "Kitchen Cleaning",
        body: "Kitchen cleaning is one of the most important residential cleaning tasks because kitchens are high-use areas where food is prepared. Proper kitchen cleaning focuses on hygiene, safety, and removing grease and food residue.\n\nStart by clearing counters and removing trash. Clean appliances inside and out - refrigerator, oven, microwave, and dishwasher. Wipe down countertops with appropriate cleaners. Clean the sink thoroughly and sanitize.\n\nPay attention to high-touch areas like cabinet handles and light switches. Clean floors last, including under moveable appliances. Regular kitchen cleaning prevents pest problems and maintains a healthy cooking environment.",
        steps: [
          "Clear counters and remove trash",
          "Clean appliances inside and out",
          "Wipe countertops and sanitize sink",
          "Clean high-touch areas",
          "Finish with floor cleaning"
        ],
        imagePrompt: "HD professional illustration of a cleaner cleaning a modern kitchen with counters and appliances, flat style, NO TEXT IN IMAGE",
        exercise: { task: "Explain why kitchen hygiene is especially important.", expected: "Explanation related to food safety or health." },
        summary: "Kitchen cleaning requires attention to appliances, surfaces, and hygiene. Regular cleaning supports food safety and healthy living."
      },
      {
        title: "Bathroom Cleaning",
        body: "Bathroom cleaning requires thorough disinfection because bathrooms harbor moisture and germs. Professional bathroom cleaning focuses on sanitation, odor control, and preventing mold and mildew.\n\nWear protective gloves and use appropriate cleaning products. Clean the toilet thoroughly - bowl, seat, and exterior. Disinfect the sink, faucet, and countertops. Clean the shower or bathtub, paying attention to grout and corners.\n\nWipe down mirrors and glass. Clean floors and check behind fixtures. Restock supplies like toilet paper and towels. Proper ventilation helps prevent moisture problems.",
        steps: [
          "Wear protective equipment",
          "Clean and disinfect toilet completely",
          "Clean sink, tub, and shower",
          "Wipe mirrors and glass",
          "Clean floors and restock supplies"
        ],
        imagePrompt: "HD professional illustration of a cleaner disinfecting a bathroom sink and fixtures, modern flat style, NO TEXT IN IMAGE",
        exercise: { task: "Describe one reason bathroom disinfection is important.", expected: "Explanation related to germs or hygiene." },
        summary: "Bathroom cleaning requires thorough disinfection and attention to moisture control. Proper cleaning supports hygiene and prevents mold."
      },
      {
        title: "Bedroom Cleaning",
        body: "Bedroom cleaning focuses on creating a clean, comfortable sleeping environment. Bedrooms accumulate dust, allergens, and personal items that require systematic organization and cleaning.\n\nStart by making the bed and organizing personal items. Dust all surfaces including nightstands, dressers, and shelves. Clean mirrors and glass surfaces. Vacuum or mop floors, including under the bed.\n\nPay attention to window sills and blinds. Empty trash containers. For deep cleaning, consider mattress vacuuming and curtain cleaning. A clean bedroom supports better sleep and overall health.",
        steps: [
          "Make the bed and organize items",
          "Dust all surfaces",
          "Clean mirrors and glass",
          "Vacuum or mop floors",
          "Empty trash and check details"
        ],
        imagePrompt: "HD professional illustration of a cleaner dusting furniture in a neat bedroom, modern flat style, NO TEXT IN IMAGE",
        exercise: { task: "Explain one benefit of regular bedroom cleaning.", expected: "Explanation related to health, sleep, or comfort." },
        summary: "Bedroom cleaning creates a comfortable, healthy sleeping environment. Regular dusting and floor care reduce allergens."
      },
      {
        title: "Home Cleaning Checklist",
        body: "A home cleaning checklist helps ensure consistent, thorough residential cleaning. Checklists guide cleaners through each room and task, reducing missed areas and improving efficiency.\n\nChecklists typically organize tasks by room: kitchen, bathrooms, bedrooms, living areas, and common spaces. Each section includes specific cleaning tasks appropriate for that area.\n\nCustomize checklists based on client preferences and home layout. Review the checklist before completing service to verify all tasks are done. Checklists also serve as communication tools with clients about completed work.",
        steps: [
          "Follow room-by-room tasks",
          "Check off completed items",
          "Customize for client needs",
          "Review before completing",
          "Communicate with client"
        ],
        imagePrompt: "HD professional illustration of a cleaner following an organized cleaning routine in a home, modern flat style, NO TEXT IN IMAGE",
        exercise: { task: "Explain one benefit of using a home cleaning checklist.", expected: "Explanation related to consistency or quality." },
        summary: "Home cleaning checklists ensure consistent, thorough residential cleaning. They support quality and client communication."
      }
    ]
  },
  {
    moduleName: "Cleaning Different Surfaces",
    lessons: [
      {
        title: "Stainless Steel",
        body: "Cleaning stainless steel requires specific techniques to remove fingerprints, smudges, and streaks while maintaining the surface's appearance. Stainless steel is found in appliances, fixtures, elevators, and commercial equipment.\n\nIdentify the grain direction - stainless steel has a directional finish. Always wipe following the grain for best results. Use stainless steel specific cleaners or mild soap solutions.\n\nApply cleaner to cloth, not directly to surface. Wipe gently following grain direction. Remove all cleaner residue. Buff with a dry microfiber cloth for shine. Avoid abrasive pads that can scratch the surface.",
        steps: [
          "Identify grain direction",
          "Use appropriate cleaners",
          "Apply to cloth first",
          "Wipe following grain",
          "Buff for shine"
        ],
        imagePrompt: "HD professional illustration of a cleaner polishing stainless steel appliances, modern flat style, NO TEXT IN IMAGE",
        exercise: { task: "Explain why wiping direction matters when cleaning stainless steel.", expected: "Explanation related to grain or streak prevention." },
        summary: "Stainless steel cleaning requires following grain direction and using appropriate products for streak-free results."
      },
      {
        title: "Surface Cleaning Practice",
        body: "Surface cleaning practice brings together all material-specific knowledge into daily work. Professional cleaners must identify surfaces quickly and apply correct methods to achieve quality results without causing damage.\n\nDevelop a systematic approach to surface identification. When encountering unfamiliar materials, research appropriate cleaning methods or ask for guidance. Always test new products in inconspicuous areas first.\n\nContinue learning about new materials and products. The cleaning industry evolves, and professional cleaners must stay current. Experience builds recognition and confidence with different surfaces.",
        steps: [
          "Identify surfaces quickly",
          "Apply correct methods",
          "Test in inconspicuous areas",
          "Research unfamiliar materials",
          "Continue learning"
        ],
        imagePrompt: "HD professional illustration of a cleaner working on various surfaces with appropriate tools, modern flat style, NO TEXT IN IMAGE",
        exercise: { task: "Explain why surface identification is important before cleaning.", expected: "Explanation related to damage prevention or product selection." },
        summary: "Surface cleaning practice combines material knowledge with correct techniques for professional results."
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

async function seedMissingLessons() {
  console.log("=".repeat(50));
  console.log("📖 Adding Missing Lessons");
  console.log("=".repeat(50));

  let totalLessons = 0;
  let totalImages = 0;
  let totalQuizzes = 0;

  for (const moduleData of missingLessons) {
    console.log(`\n📁 Finding module: ${moduleData.moduleName}`);
    
    const [module] = await db.select()
      .from(modules)
      .where(and(
        eq(modules.courseId, COURSE_ID),
        eq(modules.title, moduleData.moduleName)
      ));
    
    if (!module) {
      console.log(`  ❌ Module not found: ${moduleData.moduleName}`);
      continue;
    }

    // Get existing lesson count for order
    const existingLessons = await db.select()
      .from(lessons)
      .where(eq(lessons.moduleId, module.id));
    
    let orderNum = existingLessons.length + 1;

    for (const lessonData of moduleData.lessons) {
      // Check if lesson already exists
      const existing = existingLessons.find(l => l.title === lessonData.title);
      if (existing) {
        console.log(`  ⏭️  Lesson already exists: ${lessonData.title}`);
        continue;
      }

      console.log(`  📖 Creating lesson: ${lessonData.title}`);

      const contentParts = [
        `<div class="prose max-w-none">
          <p class="text-lg leading-relaxed">${lessonData.body.replace(/\n\n/g, '</p><p class="text-lg leading-relaxed mt-4">')}</p>
        </div>`,
        `<div class="mt-6">
          <h3 class="text-lg font-semibold mb-3">Key Steps</h3>
          <ol class="list-decimal list-inside space-y-2">
            ${lessonData.steps.map(step => `<li>${step}</li>`).join('\n')}
          </ol>
        </div>`,
        `<div class="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 class="text-lg font-semibold mb-2 text-blue-800">Exercise</h3>
          <p class="text-blue-700"><strong>Task:</strong> ${lessonData.exercise.task}</p>
          <p class="text-blue-600 text-sm mt-2"><strong>Expected:</strong> ${lessonData.exercise.expected}</p>
        </div>`,
        `<div class="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
          <h3 class="text-lg font-semibold mb-2 text-green-800">Summary</h3>
          <p class="text-green-700">${lessonData.summary}</p>
        </div>`
      ];

      const [lesson] = await db.insert(lessons).values({
        moduleId: module.id,
        courseId: COURSE_ID,
        title: lessonData.title,
        content: contentParts.join('\n'),
        orderNum: orderNum,
        durationMinutes: 12,
        freePreviewFlag: false
      }).returning();

      orderNum++;
      totalLessons++;

      // Generate image
      console.log(`    🖼️  Generating image...`);
      const imageUrl = await generateImage(lessonData.imagePrompt);
      if (imageUrl) {
        totalImages++;
        
        await db.insert(lessonContentBlocks).values({
          lessonId: lesson.id,
          blockType: 'image',
          title: 'Lesson illustration',
          mediaUrl: imageUrl,
          displayOrder: 1
        });
        
        await db.update(lessons)
          .set({ images: [imageUrl] })
          .where(eq(lessons.id, lesson.id));
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));

      // Create quiz
      console.log(`    📝 Creating quiz...`);
      const quizQuestions = [
        {
          question: `What is the main focus of "${lessonData.title}"?`,
          options: [
            lessonData.summary.split('.')[0],
            "General management tasks",
            "Marketing strategies",
            "Financial planning"
          ],
          correctAnswer: 0,
          explanation: lessonData.summary
        },
        {
          question: `Which is a key step in ${lessonData.title.toLowerCase()}?`,
          options: [
            lessonData.steps[0],
            "Skip preparation",
            "Use any products available",
            "Ignore client requests"
          ],
          correctAnswer: 0,
          explanation: `Key steps include: ${lessonData.steps.join(', ')}`
        },
        {
          question: `Why is proper technique important in ${lessonData.title.toLowerCase()}?`,
          options: [
            "To ensure quality and professional results",
            "It doesn't matter",
            "Only to save time",
            "Techniques are optional"
          ],
          correctAnswer: 0,
          explanation: lessonData.summary
        }
      ];

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
  console.log("🎉 Missing lessons added!");
  console.log(`📖 Lessons: ${totalLessons}`);
  console.log(`🖼️  Images: ${totalImages}`);
  console.log(`📝 Quizzes: ${totalQuizzes}`);
  console.log("=".repeat(50));
}

seedMissingLessons()
  .then(() => {
    console.log("✅ Done");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Failed:", error);
    process.exit(1);
  });
