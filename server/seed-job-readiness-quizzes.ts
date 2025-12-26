import { db } from './db';
import { quizzes, lessons, modules, courses } from '@shared/schema';
import { eq } from 'drizzle-orm';

const JOB_READINESS_COURSE_TITLE = 'Job Readiness and Career Success';

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

const lessonQuizzes: Record<string, QuizQuestion[]> = {
  "What Job Readiness Means": [
    {
      question: "What is job readiness?",
      options: ["Only having technical skills", "The combination of skills, behaviors, and attitudes that prepare a person for work", "Wearing formal clothes", "Having a university degree"],
      correctAnswer: "B",
      explanation: "Job readiness is about having the complete package of skills, behaviors, knowledge, and attitudes needed to succeed in the workplace."
    },
    {
      question: "Which of the following is NOT a component of job readiness?",
      options: ["Professional attitude", "Adaptability", "Inherited wealth", "Communication skills"],
      correctAnswer: "C",
      explanation: "Job readiness is about skills and behaviors you develop, not external factors like wealth."
    },
    {
      question: "Why do employers value job-ready candidates?",
      options: ["They require less training", "They are more reliable and productive", "They adapt better to workplace culture", "All of the above"],
      correctAnswer: "D",
      explanation: "Job-ready candidates bring multiple benefits to employers including reduced training time, reliability, and cultural fit."
    },
    {
      question: "What is the first step in becoming job-ready?",
      options: ["Getting a degree", "Understanding workplace expectations", "Buying professional clothes", "Finding a job posting"],
      correctAnswer: "B",
      explanation: "Understanding what employers expect is the foundation for developing job readiness."
    }
  ],
  "Understanding Employer Expectations": [
    {
      question: "What do most employers expect from new employees?",
      options: ["Perfect technical skills", "Willingness to learn and follow instructions", "Years of experience", "High salary demands"],
      correctAnswer: "B",
      explanation: "Employers value employees who are willing to learn and can follow instructions, especially when starting out."
    },
    {
      question: "Which soft skill do employers value most?",
      options: ["Playing video games", "Communication skills", "Social media presence", "Physical strength"],
      correctAnswer: "B",
      explanation: "Communication skills are consistently rated as one of the most important soft skills by employers."
    },
    {
      question: "Why is punctuality important to employers?",
      options: ["It shows respect for others' time", "It indicates reliability", "It demonstrates professionalism", "All of the above"],
      correctAnswer: "D",
      explanation: "Punctuality signals multiple positive traits that employers value highly."
    },
    {
      question: "What should you do if you don't understand an instruction?",
      options: ["Ignore it", "Guess what to do", "Ask for clarification", "Complain to coworkers"],
      correctAnswer: "C",
      explanation: "Asking for clarification shows initiative and prevents costly mistakes."
    }
  ],
  "Professional Attitude and Mindset": [
    {
      question: "What characterizes a professional attitude?",
      options: ["Being arrogant about your skills", "Taking responsibility for your work", "Avoiding difficult tasks", "Working only when supervised"],
      correctAnswer: "B",
      explanation: "A professional attitude includes taking ownership and responsibility for your work and actions."
    },
    {
      question: "How should you respond to constructive criticism?",
      options: ["Get defensive", "Listen and learn from it", "Ignore it completely", "Argue with the person"],
      correctAnswer: "B",
      explanation: "Constructive criticism is an opportunity for growth when received with an open mind."
    },
    {
      question: "What is a growth mindset?",
      options: ["Believing abilities are fixed", "Believing you can develop skills through effort", "Refusing to accept challenges", "Avoiding feedback"],
      correctAnswer: "B",
      explanation: "A growth mindset is the belief that abilities can be developed through dedication and hard work."
    },
    {
      question: "Why is positivity important in the workplace?",
      options: ["It makes work more enjoyable", "It improves team morale", "It increases productivity", "All of the above"],
      correctAnswer: "D",
      explanation: "A positive attitude benefits both individual wellbeing and team performance."
    }
  ],
  "Workplace Behavior and Etiquette": [
    {
      question: "What is appropriate workplace behavior?",
      options: ["Gossiping about coworkers", "Treating everyone with respect", "Using your phone constantly", "Taking long breaks"],
      correctAnswer: "B",
      explanation: "Respectful treatment of all colleagues is fundamental to professional workplace behavior."
    },
    {
      question: "How should you handle a disagreement with a coworker?",
      options: ["Shout at them", "Discuss it calmly and privately", "Complain to everyone else", "Stop talking to them"],
      correctAnswer: "B",
      explanation: "Professional conflict resolution involves calm, private discussion focused on solutions."
    },
    {
      question: "What is appropriate dress code behavior?",
      options: ["Wearing whatever you want", "Following company guidelines", "Dressing to impress only on interviews", "Ignoring dress codes"],
      correctAnswer: "B",
      explanation: "Following company dress code guidelines shows respect for workplace culture and professionalism."
    },
    {
      question: "When is it appropriate to use your personal phone at work?",
      options: ["Anytime you want", "During designated breaks", "During important meetings", "While serving customers"],
      correctAnswer: "B",
      explanation: "Personal phone use should be limited to breaks to maintain productivity and professionalism."
    }
  ],
  "Time Management Basics": [
    {
      question: "What is time management?",
      options: ["Working as fast as possible", "Planning and controlling how you spend your time", "Doing multiple things at once", "Avoiding deadlines"],
      correctAnswer: "B",
      explanation: "Time management is the process of organizing and planning how to divide your time effectively."
    },
    {
      question: "Which tool helps with time management?",
      options: ["To-do lists", "Social media", "Video games", "Sleeping more"],
      correctAnswer: "A",
      explanation: "To-do lists help organize tasks and prioritize what needs to be done."
    },
    {
      question: "What should you do first when starting work?",
      options: ["Check social media", "Prioritize your most important tasks", "Chat with coworkers", "Take a break"],
      correctAnswer: "B",
      explanation: "Starting with priority tasks ensures the most important work gets done."
    },
    {
      question: "How can you avoid procrastination?",
      options: ["Break large tasks into smaller ones", "Wait until the last minute", "Avoid difficult tasks", "Work only when motivated"],
      correctAnswer: "A",
      explanation: "Breaking tasks into smaller, manageable pieces makes them less overwhelming and easier to start."
    }
  ],
  "Responsibility and Accountability at Work": [
    {
      question: "What does accountability mean in the workplace?",
      options: ["Blaming others for mistakes", "Taking ownership of your actions and outcomes", "Avoiding difficult situations", "Letting others make decisions"],
      correctAnswer: "B",
      explanation: "Accountability means accepting responsibility for your work, decisions, and their outcomes."
    },
    {
      question: "What should you do if you make a mistake at work?",
      options: ["Hide it", "Blame someone else", "Acknowledge it and work to fix it", "Pretend it didn't happen"],
      correctAnswer: "C",
      explanation: "Owning up to mistakes and working to correct them shows integrity and professionalism."
    },
    {
      question: "Why is reliability important in the workplace?",
      options: ["It builds trust with colleagues and supervisors", "It leads to more opportunities", "It creates a positive reputation", "All of the above"],
      correctAnswer: "D",
      explanation: "Being reliable creates multiple benefits in your career and workplace relationships."
    },
    {
      question: "How can you demonstrate responsibility?",
      options: ["Complete tasks on time", "Follow through on commitments", "Ask for help when needed", "All of the above"],
      correctAnswer: "D",
      explanation: "Responsibility is shown through consistent actions that prove you can be counted on."
    }
  ],
  "Following Instructions Correctly": [
    {
      question: "What is the first step when receiving instructions?",
      options: ["Start working immediately", "Listen carefully and take notes", "Ask someone else to do it", "Guess what to do"],
      correctAnswer: "B",
      explanation: "Active listening and note-taking ensure you understand instructions correctly before starting."
    },
    {
      question: "What should you do if instructions are unclear?",
      options: ["Ignore them", "Ask for clarification", "Do what you think is right", "Wait for someone else to ask"],
      correctAnswer: "B",
      explanation: "Asking for clarification prevents mistakes and shows you want to do the job correctly."
    },
    {
      question: "Why is it important to follow instructions accurately?",
      options: ["To avoid errors and rework", "To meet quality standards", "To build trust with supervisors", "All of the above"],
      correctAnswer: "D",
      explanation: "Following instructions correctly has multiple benefits for work quality and professional relationships."
    },
    {
      question: "When given written instructions, you should:",
      options: ["Read them once quickly", "Read them carefully and refer back as needed", "Ignore them if you think you know better", "Ask someone to summarize them"],
      correctAnswer: "B",
      explanation: "Careful reading and regular reference to written instructions ensures accuracy."
    }
  ],
  "Adaptability in the Workplace": [
    {
      question: "What does adaptability mean in the workplace?",
      options: ["Doing the same thing every day", "Being able to adjust to new situations and changes", "Refusing new responsibilities", "Working only in your comfort zone"],
      correctAnswer: "B",
      explanation: "Adaptability is the ability to adjust to new conditions, learn new skills, and handle change effectively."
    },
    {
      question: "Why is adaptability important in today's workplace?",
      options: ["Workplaces change frequently", "Technology evolves rapidly", "New challenges arise regularly", "All of the above"],
      correctAnswer: "D",
      explanation: "Modern workplaces require adaptability due to constant change in technology, processes, and requirements."
    },
    {
      question: "How can you become more adaptable?",
      options: ["Resist all changes", "Be open to learning new skills", "Avoid challenging situations", "Stick to what you know"],
      correctAnswer: "B",
      explanation: "Openness to learning and growth is key to developing adaptability."
    },
    {
      question: "What is a benefit of being adaptable?",
      options: ["More career opportunities", "Better problem-solving skills", "Improved resilience", "All of the above"],
      correctAnswer: "D",
      explanation: "Adaptability provides numerous benefits for career growth and personal development."
    }
  ],
  "Personal Presentation and Appearance": [
    {
      question: "Why is personal appearance important in the workplace?",
      options: ["It creates a first impression", "It shows professionalism", "It reflects company image", "All of the above"],
      correctAnswer: "D",
      explanation: "Personal appearance affects perceptions and represents both you and your employer."
    },
    {
      question: "What does appropriate professional dress typically include?",
      options: ["Clean, neat clothing", "Clothes appropriate for the industry", "Minimal distracting accessories", "All of the above"],
      correctAnswer: "D",
      explanation: "Professional dress involves cleanliness, appropriateness, and attention to workplace norms."
    },
    {
      question: "Personal hygiene in the workplace is:",
      options: ["Optional", "Essential for professionalism", "Only important for customer-facing roles", "Not related to job performance"],
      correctAnswer: "B",
      explanation: "Good personal hygiene is fundamental to professionalism in any role."
    },
    {
      question: "How can you learn about workplace dress expectations?",
      options: ["Observe what colleagues wear", "Ask HR or your supervisor", "Review company policies", "All of the above"],
      correctAnswer: "D",
      explanation: "Multiple sources can help you understand and meet dress code expectations."
    }
  ],
  "Job Readiness Practice and Reflection": [
    {
      question: "Why is self-reflection important for job readiness?",
      options: ["It helps identify areas for improvement", "It builds self-awareness", "It guides personal development", "All of the above"],
      correctAnswer: "D",
      explanation: "Self-reflection is a powerful tool for continuous improvement and growth."
    },
    {
      question: "How often should you assess your job readiness skills?",
      options: ["Never", "Once in your career", "Regularly as you grow", "Only when looking for a job"],
      correctAnswer: "C",
      explanation: "Regular assessment helps ensure continuous development and identifies new areas for growth."
    },
    {
      question: "What is the best way to improve job readiness?",
      options: ["Practice skills regularly", "Seek feedback from others", "Set specific goals", "All of the above"],
      correctAnswer: "D",
      explanation: "Improvement comes from a combination of practice, feedback, and goal-setting."
    },
    {
      question: "How can you demonstrate job readiness to employers?",
      options: ["Through your resume", "During interviews", "In how you present yourself", "All of the above"],
      correctAnswer: "D",
      explanation: "Job readiness should be evident in every interaction with potential employers."
    }
  ]
};

const defaultQuestions: QuizQuestion[] = [
  {
    question: "What is the main focus of this lesson?",
    options: ["Technical skills only", "Professional development and workplace success", "Entertainment", "Personal hobbies"],
    correctAnswer: "B",
    explanation: "This course focuses on developing professional skills for workplace success."
  },
  {
    question: "How can you apply what you learned in this lesson?",
    options: ["Ignore it", "Practice in daily situations", "Wait until you have a job", "Tell others what to do"],
    correctAnswer: "B",
    explanation: "Applying lessons in daily situations helps reinforce learning and develop skills."
  },
  {
    question: "What is important for career success?",
    options: ["Continuous learning", "Professional behavior", "Good communication", "All of the above"],
    correctAnswer: "D",
    explanation: "Career success requires a combination of skills and professional behaviors."
  },
  {
    question: "Why is this topic important for your career?",
    options: ["It builds essential workplace skills", "Employers value these qualities", "It helps you stand out", "All of the above"],
    correctAnswer: "D",
    explanation: "Understanding and practicing these skills gives you advantages in your career."
  }
];

export async function seedJobReadinessQuizzes(): Promise<{
  quizzesCreated: number;
  lessonsProcessed: number;
}> {
  console.log('\n🎯 Starting Job Readiness Course quiz seeding...\n');

  const course = await db.select().from(courses)
    .where(eq(courses.title, JOB_READINESS_COURSE_TITLE))
    .limit(1);

  if (course.length === 0) {
    throw new Error(`Course "${JOB_READINESS_COURSE_TITLE}" not found`);
  }

  const courseId = course[0].id;
  console.log(`📚 Found course: ${course[0].title} (ID: ${courseId})`);

  const courseModules = await db.select().from(modules)
    .where(eq(modules.courseId, courseId));

  let quizzesCreated = 0;
  let lessonsProcessed = 0;

  for (const mod of courseModules) {
    console.log(`\n📦 Processing Module: ${mod.title}`);

    const moduleLessons = await db.select().from(lessons)
      .where(eq(lessons.moduleId, mod.id));

    for (const lesson of moduleLessons) {
      lessonsProcessed++;
      
      const existingQuiz = await db.select().from(quizzes)
        .where(eq(quizzes.lessonId, lesson.id))
        .limit(1);

      if (existingQuiz.length > 0) {
        console.log(`  ⏭️  Quiz already exists for: ${lesson.title}`);
        continue;
      }

      const questions = lessonQuizzes[lesson.title] || defaultQuestions;

      await db.insert(quizzes).values({
        lessonId: lesson.id,
        title: `${lesson.title} Quiz`,
        description: `Test your understanding of ${lesson.title}`,
        questions: questions,
        timeLimitMinutes: 10,
        passingScore: 70,
        order: 1,
        isActive: true
      });

      quizzesCreated++;
      console.log(`  ✅ Created quiz for: ${lesson.title} (${questions.length} questions)`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 Quiz Seeding Summary:');
  console.log(`   Lessons Processed: ${lessonsProcessed}`);
  console.log(`   Quizzes Created: ${quizzesCreated}`);
  console.log('='.repeat(60) + '\n');

  return { quizzesCreated, lessonsProcessed };
}

import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);

if (process.argv[1] === __filename) {
  seedJobReadinessQuizzes()
    .then((stats) => {
      console.log('✅ Quiz seeding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Quiz seeding failed:', error);
      process.exit(1);
    });
}
