# Course Creation Guide for EduFiliova

This guide documents the correct data structure and process for creating courses programmatically or via AI.

## Database Structure

### 1. Courses Table
```typescript
{
  id: uuid,              // Auto-generated
  title: string,         // Course title
  description: string,   // Course description
  thumbnailUrl: string,  // Course cover image URL
  categoryId: uuid,      // Reference to course_categories
  pricingType: 'free' | 'fixed_price' | 'subscription',
  price: number,         // Price in cents/smallest unit
  isActive: boolean,     // Default true
  approvalStatus: 'pending' | 'approved' | 'rejected',
  createdBy: uuid,       // MUST be admin user ID for AI-created courses
  publisherName: string, // Publisher name
  publisherBio: string,  // Publisher description
  publisherAvatar: string, // Publisher image URL
}
```

### 2. Modules Table
```typescript
{
  id: serial,           // Auto-generated integer
  courseId: uuid,       // Reference to courses.id
  title: string,        // Module title
  orderNum: integer,    // Order: 1, 2, 3...
  description: string,  // Module description
  isActive: boolean,    // Default true
}
```

### 3. Lessons Table
```typescript
{
  id: serial,           // Auto-generated integer
  moduleId: integer,    // Reference to modules.id
  title: string,        // Lesson title
  content: string,      // HTML content - use proper HTML tags!
  videoUrl: string,     // Optional video URL
  orderNum: integer,    // Order within module: 1, 2, 3...
  durationMinutes: integer, // Estimated duration
  freePreviewFlag: boolean, // Allow free preview
  isActive: boolean,    // Default true
}
```

### 4. Quizzes Table (IMPORTANT: Correct Format)
```typescript
{
  id: serial,           // Auto-generated integer
  lessonId: integer,    // Reference to lessons.id
  title: string,        // Quiz title
  description: string,  // Quiz description
  passingScore: integer, // Default 70
  questions: jsonb,     // Array of questions - SEE FORMAT BELOW!
}
```

## CRITICAL: Quiz Question Format

The `questions` field MUST use this exact JSON structure:

```json
[
  {
    "id": 1,
    "text": "What is a digital product?",
    "options": [
      "An item sold online without physical form",
      "A physical item that is shipped",
      "A product that needs a warehouse",
      "A service provided in person"
    ],
    "correctIndex": 0,
    "explanation": "Digital products are sold online and do not have a physical form."
  },
  {
    "id": 2,
    "text": "Which of the following is NOT a digital product?",
    "options": ["Furniture", "eBook", "Online course", "Software"],
    "correctIndex": 0,
    "explanation": "Furniture is a physical item."
  }
]
```

### Question Field Mapping:
| Field | Type | Description |
|-------|------|-------------|
| `id` | number | Unique ID within the quiz (1, 2, 3...) |
| `text` | string | The question text (NOT `question`!) |
| `options` | string[] | Array of answer choices |
| `correctIndex` | number | Zero-based index of correct answer (NOT `correctAnswer`!) |
| `explanation` | string | Shown after answering |

## Lesson Content Format

Use proper HTML for lesson content. The system renders HTML correctly:

```html
<h2>What Is a Digital Product</h2>

<div class="lesson-explanation">
  Digital products are items you can sell online without any physical form.
  They can be downloaded or accessed through the internet.
</div>

<h3>Step-by-Step Guide</h3>
<ol>
  <li>Understand the concept of digital products.</li>
  <li>Identify the benefits of selling digital products.</li>
  <li>Research successful digital product examples.</li>
</ol>

<h3>Real-World Example</h3>
<div class="lesson-example">
  An author writes an eBook and sells it on their website.
  Each time someone buys the eBook, they receive a downloadable file.
</div>

<h3>Your Exercise</h3>
<div class="lesson-exercise">
  <p><strong>Task:</strong> List three types of digital products you are familiar with.</p>
  <p><strong>Expected Output:</strong> A list with explanations.</p>
</div>
```

## Admin User for AI-Created Courses

All AI-created courses MUST be assigned to the admin user:

```sql
-- Get admin user ID
SELECT id FROM users WHERE email = 'support@edufiliova.com';
```

Use this ID for `createdBy` field when creating courses programmatically.

## Complete Course Creation Script Example

```typescript
import { db } from './server/db';
import { courses, modules, lessons, quizzes } from './shared/schema';

const ADMIN_EMAIL = 'support@edufiliova.com';

async function createCourse(courseData: {
  title: string;
  description: string;
  thumbnailUrl: string;
  modules: ModuleData[];
}) {
  // 1. Get admin user ID
  const admin = await db.select({ id: users.id })
    .from(users)
    .where(eq(users.email, ADMIN_EMAIL))
    .limit(1);
  
  const adminId = admin[0]?.id;
  if (!adminId) throw new Error('Admin user not found');

  // 2. Create course
  const [course] = await db.insert(courses).values({
    title: courseData.title,
    description: courseData.description,
    thumbnailUrl: courseData.thumbnailUrl,
    pricingType: 'free',
    isActive: true,
    approvalStatus: 'approved',
    createdBy: adminId,
    publisherName: 'EduFiliova',
  }).returning();

  // 3. Create modules
  for (let mIdx = 0; mIdx < courseData.modules.length; mIdx++) {
    const moduleData = courseData.modules[mIdx];
    
    const [module] = await db.insert(modules).values({
      courseId: course.id,
      title: moduleData.title,
      description: moduleData.description,
      orderNum: mIdx + 1,
      isActive: true,
    }).returning();

    // 4. Create lessons for this module
    for (let lIdx = 0; lIdx < moduleData.lessons.length; lIdx++) {
      const lessonData = moduleData.lessons[lIdx];
      
      const [lesson] = await db.insert(lessons).values({
        moduleId: module.id,
        title: lessonData.title,
        content: lessonData.content, // HTML content
        durationMinutes: lessonData.duration || 22,
        orderNum: lIdx + 1,
        freePreviewFlag: mIdx === 0 && lIdx === 0, // First lesson free
        isActive: true,
      }).returning();

      // 5. Create quiz for lesson (if provided)
      if (lessonData.quiz) {
        await db.insert(quizzes).values({
          lessonId: lesson.id,
          title: `${lessonData.title} Quiz`,
          description: `Test your understanding of ${lessonData.title}`,
          passingScore: 70,
          questions: lessonData.quiz.questions.map((q, i) => ({
            id: i + 1,
            text: q.text,           // Use 'text' NOT 'question'
            options: q.options,
            correctIndex: q.correctIndex, // Use 'correctIndex' NOT 'correctAnswer'
            explanation: q.explanation,
          })),
        });
      }
    }
  }

  return course;
}
```

## OpenAI Prompt Template for Course Generation

When using OpenAI to generate course content, use this prompt format:

```
Generate course content for module: "{MODULE_TITLE}"

For each lesson, provide:
1. Lesson title
2. HTML content (use h2, h3, div, ol, ul, li, p tags)
3. Quiz with 5 questions

Quiz format (IMPORTANT - use exact field names):
{
  "questions": [
    {
      "id": 1,
      "text": "Question text here",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Explanation for correct answer"
    }
  ]
}

Rules:
- Use "text" for question text (NOT "question")
- Use "correctIndex" for correct answer (NOT "correctAnswer")
- correctIndex is 0-based (0 = first option, 1 = second, etc.)
- Each question needs exactly 4 options
- Include explanation for each question
```

## Troubleshooting

### Quiz questions not showing text
**Cause:** Using `question` instead of `text` field
**Fix:** Ensure quiz questions use `text` field for question text

### Wrong answer marked as correct
**Cause:** Using `correctAnswer` instead of `correctIndex`
**Fix:** Use `correctIndex` (0-based index)

### HTML showing as raw text
**Cause:** Content not being rendered as HTML
**Fix:** System now auto-detects HTML and renders it properly

## Files Changed for These Fixes

- `client/src/pages/CoursePlayer.tsx` - Updated to handle both field formats
  - Line 87-95: Interface updated for both text/question and correctIndex/correctAnswer
  - Line 1021: Renders `question.text || question.question`
  - Line 1037: Uses `question.correctIndex ?? question.correctAnswer`
  - Line 561: Quiz submit uses correct field
