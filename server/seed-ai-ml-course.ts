import { db } from './db';
import { courses, modules, lessons, quizzes, courseCategories } from '../shared/schema';
import { eq } from 'drizzle-orm';
import { ensureAdminUser } from './ensure-admin-user';

// AI/ML Course Data
export async function seedAIMLCourse() {
  console.log('🤖 Seeding AI/ML Course...');
  
  // Ensure admin user exists
  const adminUserId = await ensureAdminUser();
  console.log(`✅ Using admin user ID: ${adminUserId}`);
  
  // Check if course already exists
  const existing = await db.select().from(courses).where(eq(courses.title, 'Artificial Intelligence and Machine Learning'));
  if (existing.length > 0) {
    console.log('✅ AI/ML Course already exists');
    return;
  }

  // Ensure AI/ML category exists
  let [aiCategory] = await db.select().from(courseCategories).where(eq(courseCategories.name, 'Artificial Intelligence'));
  if (!aiCategory) {
    [aiCategory] = await db.insert(courseCategories).values({
      name: 'Artificial Intelligence',
      displayName: 'Artificial Intelligence',
      description: 'Courses related to AI and Machine Learning',
      color: 'blue',
      isActive: true
    }).returning();
  }

  // Create the course
  const [course] = await db.insert(courses).values({
    title: 'Artificial Intelligence and Machine Learning',
    description: 'A comprehensive 12-unit course covering the foundations of AI and machine learning, from basic concepts to advanced applications including deep learning, NLP, computer vision, and reinforcement learning.',
    thumbnailUrl: '/api/placeholder/400/300',
    image: '/api/placeholder/400/300',
    categoryId: aiCategory.id,
    pricingType: 'subscription',
    gradeTier: 'college_university',
    isActive: true,
    approvalStatus: 'approved',
    createdBy: adminUserId,
    publisherName: 'EduFiliova AI Department',
    publisherBio: 'Expert educators in artificial intelligence and machine learning',
    tags: ['Artificial Intelligence', 'Machine Learning', 'Deep Learning', 'Data Science', 'Computer Science'],
    language: 'en',
    difficulty: 'intermediate',
    duration: 120, // 120 weeks
    learningObjectives: [
      'Understand core AI and ML concepts',
      'Master supervised and unsupervised learning',
      'Build neural networks and deep learning models',
      'Apply NLP and computer vision techniques',
      'Develop ethical and responsible AI systems'
    ],
    certificationType: 'diploma',
    credits: 12
  }).returning();

  console.log('✅ Created course:', course.title);

  // Unit 1: Introduction to Artificial Intelligence
  const [unit1] = await db.insert(modules).values({
    courseId: course.id,
    title: 'Introduction to Artificial Intelligence',
    description: 'This unit lays the foundation for understanding Artificial Intelligence (AI). Students will explore the history, categories, real-world applications, and limitations of AI systems while developing an ethical and strategic mindset toward AI-driven innovation.',
    orderNum: 1
  }).returning();

  // Unit 1 Lessons
  const unit1Lessons = [
    {
      title: 'What is Artificial Intelligence?',
      content: `Artificial Intelligence (AI) is the science of creating machines that can think, learn, and act intelligently. The term was first coined in 1956 by John McCarthy, who defined it as 'the science and engineering of making intelligent machines.' Over the decades, AI has evolved from simple rule-based programs to systems capable of perception, reasoning, and creativity.

Unlike traditional software, which follows strict predefined rules, AI systems learn from data and experience. They recognize patterns, make predictions, and even generate creative content. AI has become an integral part of modern life, powering everything from virtual assistants like Siri and Alexa to recommendation systems on Netflix and Spotify.

**Key Characteristics of AI:**
- **Learning**: AI can improve performance through experience
- **Reasoning**: AI can draw conclusions from available information
- **Problem-solving**: AI can find solutions to complex challenges
- **Perception**: AI can interpret sensory data like images and sounds
- **Language understanding**: AI can process and generate human language

**Pseudocode:**
\`\`\`
DEFINE AI_System
  INPUT: data
  PROCESS: learn patterns using algorithms
  OUTPUT: intelligent actions or predictions
\`\`\`

**Activities:**
1. Research one modern AI product (e.g., ChatGPT, Google Assistant) and explain how it learns from data.
2. Write a short paragraph distinguishing AI from traditional computer programs.`
    },
    {
      title: 'History and Evolution of AI',
      content: `The story of AI begins with curiosity about human thought. In the 1950s, pioneers like Alan Turing proposed the idea that machines could simulate human reasoning, introducing the Turing Test. Early AI relied on symbolic reasoning—programs that used rules and logic to solve problems.

During the 1970s–1980s, AI research faced 'winters' due to limited computing power and data. However, the emergence of the internet and exponential growth in storage and processing capabilities revived the field. The 21st century witnessed breakthroughs in machine learning and deep learning, enabling AI to surpass human performance in specific tasks like image recognition and game playing.

**Key Milestones:**
- **1950**: Alan Turing proposes the Turing Test
- **1956**: Term "Artificial Intelligence" coined at Dartmouth Conference
- **1997**: IBM's Deep Blue defeats world chess champion
- **2012**: Deep learning breakthrough in ImageNet competition
- **2016**: AlphaGo defeats world Go champion
- **2022**: ChatGPT demonstrates advanced language capabilities

**Pseudocode:**
\`\`\`
FOR each AI_Era IN ['Symbolic', 'Machine Learning', 'Deep Learning']:
  DESCRIBE technological shift and its impact
  RECORD major achievements
\`\`\`

**Activities:**
1. Create a timeline showing key AI milestones.
2. Discuss how computing power has influenced AI's evolution.`
    },
    {
      title: 'Branches and Applications of AI',
      content: `AI is a vast field encompassing many sub-areas. Machine Learning focuses on learning from data; Natural Language Processing enables machines to understand human language; Computer Vision helps machines interpret images and videos; Robotics integrates AI into physical systems; and Expert Systems simulate human decision-making.

These technologies power real-world innovations—AI doctors analyzing scans, financial systems predicting market movements, and climate models forecasting weather patterns.

**Main Branches:**
- **Machine Learning**: Learning patterns from data
- **Natural Language Processing**: Understanding and generating human language
- **Computer Vision**: Interpreting visual information
- **Robotics**: Creating intelligent physical systems
- **Expert Systems**: Simulating specialized human expertise

**Applications Across Industries:**
- **Healthcare**: Disease diagnosis, drug discovery
- **Finance**: Fraud detection, algorithmic trading
- **Transportation**: Self-driving cars, traffic optimization
- **Education**: Personalized learning, automated grading
- **Entertainment**: Content recommendation, game AI

**Pseudocode:**
\`\`\`
DEFINE AI_Branches = [Machine_Learning, NLP, Computer_Vision, Robotics, Expert_Systems]
FOR each branch IN AI_Branches:
  DISPLAY applications and benefits
\`\`\`

**Activities:**
1. List 5 industries transformed by AI and describe one use-case per industry.
2. Identify one area where AI could improve your own community.`
    },
    {
      title: 'The Intelligence Spectrum: From Narrow to General AI',
      content: `Artificial Intelligence operates on a spectrum. At one end lies Narrow AI—systems built to perform specific tasks, like image recognition or spam filtering. These are highly efficient but limited in scope. General AI, in contrast, would perform any intellectual task that a human can, from reasoning to emotional understanding.

Currently, all deployed AI is narrow. Even the most advanced systems, like autonomous vehicles or conversational models, excel in specific domains but cannot transfer learning across radically different tasks.

**Types of AI:**
- **Narrow AI (Weak AI)**: Task-specific intelligence (current reality)
- **General AI (Strong AI)**: Human-level intelligence (theoretical)
- **Super AI**: Beyond human intelligence (speculative)

**Examples of Narrow AI:**
- Spam filters
- Voice assistants
- Recommendation systems
- Chess programs
- Image recognition

**Pseudocode:**
\`\`\`
IF Task == Specific:
  USE Narrow_AI()
ELSE IF Task == Broad_Human_Level:
  USE General_AI()
\`\`\`

**Activities:**
1. Write two examples of Narrow AI in daily life.
2. Debate: Is pursuing General AI ethical and necessary?`
    },
    {
      title: 'Benefits and Limitations of AI',
      content: `AI has revolutionized how we live and work. It increases efficiency, reduces human error, and opens new opportunities in science, healthcare, and business. Automated systems can handle vast datasets far faster than humans, enabling insights that drive innovation.

However, AI has clear limitations. It depends heavily on data—biased or incomplete data leads to biased outputs. AI lacks common sense and contextual understanding. Moreover, while AI can recognize patterns, it doesn't truly "understand" meaning the way humans do.

**Benefits:**
- Increased efficiency and productivity
- 24/7 availability
- Handling complex calculations
- Reducing human error
- Enabling new discoveries

**Limitations:**
- Data dependency and bias
- Lack of common sense
- Limited creativity
- Inability to explain decisions
- Requires significant computing resources

**Pseudocode:**
\`\`\`
EVALUATE System:
  IF Data_Biased THEN Output_Biased
  IF No_Human_Check THEN Risk += 1
\`\`\`

**Activities:**
1. List three benefits and three limitations of AI.
2. Suggest one method to reduce bias in AI systems.`
    },
    {
      title: 'Ethics and Responsible AI',
      content: `Ethics is central to sustainable AI. Developers must consider fairness, accountability, transparency, and privacy. For example, an AI system used in recruitment should not disadvantage any group. Bias can enter data from human decisions, so systems must be audited and corrected.

Responsible AI also means being aware of unintended consequences. Developers and users should understand the societal impact of automation. Ethical AI frameworks, such as those from the EU and IEEE, guide responsible development.

**Key Ethical Principles:**
- **Fairness**: Equal treatment across demographics
- **Accountability**: Clear responsibility for AI decisions
- **Transparency**: Explainable AI systems
- **Privacy**: Protecting user data
- **Safety**: Preventing harm

**Ethical Challenges:**
- Algorithmic bias
- Job displacement
- Privacy violations
- Autonomous weapons
- Deepfakes and misinformation

**Pseudocode:**
\`\`\`
FOR each AI_Model:
  CHECK fairness, transparency, accountability
  IF unethical_behavior DETECTED:
    APPLY correction and document impact
\`\`\`

**Activities:**
1. Analyze a recent AI controversy and explain how ethics were or were not applied.
2. Draft an AI ethics code for a student project.`
    }
  ];

  // Get the first available category
  const [defaultCategory] = await db.select().from(courseCategories).limit(1);
  const categoryId = defaultCategory?.id || aiCategory.id;

  for (let i = 0; i < unit1Lessons.length; i++) {
    await db.insert(lessons).values({
      moduleId: unit1.id,
      courseId: course.id,
      categoryId: categoryId,
      title: unit1Lessons[i].title,
      content: unit1Lessons[i].content,
      orderNum: i + 1,
      order: i,
      durationMinutes: 45
    });
  }

  // Unit 1 Quiz
  await db.insert(quizzes).values({
    lessonId: null,
    title: 'Unit 1: Introduction to AI - Quiz',
    description: 'Test your understanding of AI fundamentals',
    questions: [
      {
        question: 'Which of the following best defines Artificial Intelligence?',
        options: [
          'A system that strictly follows human-written rules',
          'A machine that learns and adapts from data to perform intelligent tasks',
          'A calculator executing predefined operations',
          'A software that can only automate repetitive tasks'
        ],
        correctAnswer: 'A machine that learns and adapts from data to perform intelligent tasks'
      },
      {
        question: 'Which of the following is an example of Narrow AI?',
        options: [
          'A general reasoning robot capable of philosophy',
          'A speech recognition system on a smartphone',
          'A self-aware humanoid android',
          'A machine that can perform all human intellectual tasks'
        ],
        correctAnswer: 'A speech recognition system on a smartphone'
      },
      {
        question: 'Which AI subfield focuses on enabling machines to understand and use human language?',
        options: [
          'Robotics',
          'Natural Language Processing',
          'Computer Vision',
          'Reinforcement Learning'
        ],
        correctAnswer: 'Natural Language Processing'
      },
      {
        question: 'Which ethical principle is MOST relevant when addressing algorithmic bias?',
        options: [
          'Efficiency',
          'Fairness',
          'Scalability',
          'Speed'
        ],
        correctAnswer: 'Fairness'
      },
      {
        question: 'What is the main limitation of current AI systems?',
        options: [
          'They can reason creatively like humans',
          'They depend heavily on data and lack general understanding',
          'They understand emotions deeply',
          'They do not require training data'
        ],
        correctAnswer: 'They depend heavily on data and lack general understanding'
      }
    ],
    passingScore: 70,
    timeLimitMinutes: 30
  });

  console.log('✅ Created Unit 1: Introduction to AI with 6 lessons and quiz');

  console.log('🎉 AI/ML Course seed completed!');
}
