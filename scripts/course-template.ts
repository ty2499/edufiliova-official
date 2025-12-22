/**
 * Course Creation Template
 * 
 * Use this template to create new courses with rich content including:
 * - Images (use generated images from attached_assets or Cloudinary URLs)
 * - Videos (YouTube embeds or direct video URLs)
 * - Quizzes with explanations
 * - HTML-formatted lesson content
 * 
 * INSTRUCTIONS:
 * 1. Copy this file and rename it (e.g., seed-my-course.ts)
 * 2. Update ADMIN_ID to a valid auth_users ID
 * 3. Fill in COURSE_DATA and MODULES with your content
 * 4. Run: npx tsx scripts/seed-my-course.ts
 */

import { db } from '../server/db';
import { courses, modules, lessons, quizzes, lessonContentBlocks } from '../shared/schema';
import { eq } from 'drizzle-orm';

// Get admin ID from auth_users table
// Run: SELECT id FROM auth_users LIMIT 1;
const ADMIN_ID = 'YOUR_AUTH_USER_ID_HERE';

// Course configuration
const COURSE_DATA = {
  title: 'Your Course Title',
  description: 'Course description here...',
  thumbnailUrl: '/attached_assets/generated_images/your-image.png', // Use generated images
  pricingType: 'free' as const, // 'free' | 'fixed_price' | 'subscription'
  price: 0, // In cents for fixed_price
  isActive: true,
  approvalStatus: 'approved' as const,
  createdBy: ADMIN_ID,
  publisherName: 'EduFiliova Academy',
  publisherBio: 'Your trusted partner in quality online education',
  difficulty: 'beginner', // beginner | intermediate | advanced
  duration: 120, // Total minutes
  certificationType: 'certificate' // certificate | diploma
};

// Module and lesson structure
const MODULES = [
  {
    title: 'Module 1: Introduction',
    description: 'Overview of the topic',
    orderNum: 1,
    lessons: [
      {
        title: 'Lesson 1.1: Getting Started',
        orderNum: 1,
        durationMinutes: 15,
        freePreviewFlag: true, // First lesson usually free
        content: `<h2>Lesson Title</h2>

<div class="lesson-explanation">
<!-- Add image at the start of lesson -->
<img src="/attached_assets/generated_images/your-lesson-image.png" alt="Description" style="width: 100%; max-width: 600px; border-radius: 12px; margin: 20px auto; display: block;" />

Your lesson explanation here. Explain the core concepts clearly.
</div>

<h3>Key Points</h3>
<ul>
<li><strong>Point 1:</strong> Explanation</li>
<li><strong>Point 2:</strong> Explanation</li>
</ul>

<!-- For YouTube videos -->
<h3>Video Tutorial</h3>
<div style="position: relative; padding-bottom: 56.25%; height: 0;">
<iframe src="https://www.youtube.com/embed/VIDEO_ID" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" frameborder="0" allowfullscreen></iframe>
</div>

<!-- Code examples -->
<h3>Code Example</h3>
<pre style="background: #1e1e1e; color: #d4d4d4; padding: 15px; border-radius: 8px; overflow-x: auto;">
<code>// Your code here
console.log("Hello World");
</code></pre>

<h3>Exercise</h3>
<div class="lesson-exercise">
<p><strong>Task:</strong> What students should do</p>
<p><strong>Expected Output:</strong> What they should achieve</p>
</div>

<h3>Summary</h3>
<div class="lesson-summary">
Brief recap of what was learned in this lesson.
</div>`,
        quiz: {
          title: 'Lesson 1.1 Quiz',
          description: 'Test your understanding',
          passingScore: 70,
          questions: [
            {
              id: 1,
              text: 'Question text here?', // Use 'text' NOT 'question'
              options: ['Option A', 'Option B', 'Option C', 'Option D'],
              correctIndex: 0, // 0-based index, Use 'correctIndex' NOT 'correctAnswer'
              explanation: 'Explanation for the correct answer'
            },
            {
              id: 2,
              text: 'Another question?',
              options: ['A', 'B', 'C', 'D'],
              correctIndex: 1,
              explanation: 'Why B is correct'
            }
          ]
        }
      }
      // Add more lessons...
    ]
  }
  // Add more modules...
];

async function seedCourse() {
  console.log(`📚 Creating course: ${COURSE_DATA.title}...`);
  
  try {
    // Check if course already exists
    const existing = await db.select().from(courses).where(eq(courses.title, COURSE_DATA.title)).limit(1);
    
    if (existing.length > 0) {
      console.log('⚠️ Course already exists. Skipping...');
      return existing[0];
    }
    
    // Create the course
    const [course] = await db.insert(courses).values(COURSE_DATA).returning();
    console.log(`✅ Created course: ${course.title} (${course.id})`);
    
    // Create modules and lessons
    for (const moduleData of MODULES) {
      const [module] = await db.insert(modules).values({
        courseId: course.id,
        title: moduleData.title,
        description: moduleData.description,
        orderNum: moduleData.orderNum,
        isActive: true
      }).returning();
      console.log(`  📚 Created module: ${module.title}`);
      
      for (const lessonData of moduleData.lessons) {
        const [lesson] = await db.insert(lessons).values({
          moduleId: module.id,
          title: lessonData.title,
          content: lessonData.content,
          orderNum: lessonData.orderNum,
          durationMinutes: lessonData.durationMinutes,
          freePreviewFlag: lessonData.freePreviewFlag,
          isActive: true
        }).returning();
        console.log(`    📖 Created lesson: ${lesson.title}`);
        
        // Create content block
        await db.insert(lessonContentBlocks).values({
          lessonId: lesson.id,
          blockType: 'text',
          title: 'Lesson Content',
          content: lessonData.content,
          displayOrder: 1,
          isCollapsible: false,
          isExpandedByDefault: true
        });
        
        // Create quiz
        if (lessonData.quiz) {
          await db.insert(quizzes).values({
            lessonId: lesson.id,
            title: lessonData.quiz.title,
            description: lessonData.quiz.description,
            passingScore: lessonData.quiz.passingScore,
            questions: lessonData.quiz.questions
          });
          console.log(`      ✓ Created quiz: ${lessonData.quiz.title}`);
        }
      }
    }
    
    console.log('\n🎉 Course created successfully!');
    return course;
    
  } catch (error) {
    console.error('❌ Error creating course:', error);
    throw error;
  }
}

// Run if executed directly
seedCourse()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));

export { seedCourse };
