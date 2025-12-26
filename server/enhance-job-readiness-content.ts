import { db } from './db';
import { lessons, courses, lessonContentBlocks, modules } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

const JOB_READINESS_COURSE_TITLE = 'Job Readiness and Career Success';

const enhancedContent: Record<string, string> = {
  "What Job Readiness Means": `<h2>What is Job Readiness?</h2>
<p>Job readiness refers to the combination of skills, behaviors, knowledge, and attitudes that prepare a person to enter and succeed in the workplace. It is not only about having technical skills but also about being dependable, professional, and adaptable. Employers look for individuals who are prepared to work responsibly, communicate clearly, and handle tasks effectively.</p>

<h3>Key Components of Job Readiness</h3>
<ul>
<li><strong>Professional Skills:</strong> The ability to complete job tasks effectively and efficiently</li>
<li><strong>Soft Skills:</strong> Communication, teamwork, problem-solving, and interpersonal abilities</li>
<li><strong>Work Ethic:</strong> Reliability, punctuality, dedication, and commitment to quality</li>
<li><strong>Adaptability:</strong> Willingness to learn new things and adjust to changing situations</li>
<li><strong>Professional Attitude:</strong> Positive mindset, respect for others, and appropriate workplace behavior</li>
</ul>

<h3>Why Job Readiness Matters</h3>
<p>Job readiness begins with understanding expectations. Every workplace has rules, routines, and standards. Being ready for work means knowing how to follow instructions, respect time schedules, and complete tasks as expected. It also includes being prepared mentally and emotionally to work with others.</p>

<p>Employers invest significant time and resources in hiring. They want candidates who can contribute quickly and require minimal supervision. A job-ready candidate demonstrates that they understand workplace norms and can integrate smoothly into the team.</p>

<h3>Self-Assessment for Job Readiness</h3>
<p>Understanding your own strengths and areas for improvement helps individuals prepare for suitable roles. Job-ready individuals know what they can do well and are willing to learn where improvement is needed. Consider these questions:</p>
<ul>
<li>Can I communicate clearly with others?</li>
<li>Do I manage my time effectively?</li>
<li>Am I reliable and punctual?</li>
<li>How do I handle feedback and criticism?</li>
<li>Am I willing to learn new skills?</li>
</ul>

<h3>Workplace Behavior Expectations</h3>
<p>Workplace behavior is equally important. Showing respect, being polite, and maintaining a positive attitude influence how others perceive reliability. Even basic behaviors such as arriving on time, dressing appropriately, and listening carefully play a major role in job success.</p>

<h3>Adaptability and Growth</h3>
<p>Job readiness also includes adaptability. Work environments change, tasks evolve, and challenges arise. Being flexible and open to feedback helps individuals adjust and grow. This mindset is essential for long-term career success.</p>

<p>In summary, job readiness is the foundation for employment success. It combines skills, behavior, mindset, and responsibility to help individuals enter the workforce confidently and professionally.</p>`,

  "Understanding Employer Expectations": `<h2>What Do Employers Expect?</h2>
<p>Employers expect more than task completion. They value reliability, honesty, teamwork, and communication. Understanding these expectations helps job seekers align behavior with workplace standards and stand out as valuable team members.</p>

<h3>Core Employer Expectations</h3>
<ul>
<li><strong>Reliability:</strong> Showing up on time and completing assigned tasks</li>
<li><strong>Honesty:</strong> Being truthful about capabilities, mistakes, and progress</li>
<li><strong>Teamwork:</strong> Working cooperatively with colleagues toward common goals</li>
<li><strong>Communication:</strong> Expressing ideas clearly and listening to others</li>
<li><strong>Initiative:</strong> Taking action without being asked when appropriate</li>
<li><strong>Professionalism:</strong> Maintaining appropriate conduct and appearance</li>
</ul>

<h3>Meeting Quality Standards</h3>
<p>Reliability involves not only attendance but also meeting quality standards consistently. Employers depend on workers to deliver results that meet or exceed expectations. This means:</p>
<ul>
<li>Following instructions carefully</li>
<li>Paying attention to details</li>
<li>Double-checking work before submission</li>
<li>Meeting deadlines consistently</li>
<li>Asking for clarification when needed</li>
</ul>

<h3>The Importance of Honesty</h3>
<p>Honesty builds trust. When mistakes happen, admitting them quickly allows for faster resolution and shows integrity. Employers appreciate workers who take responsibility rather than making excuses or blaming others.</p>

<h3>Teamwork and Collaboration</h3>
<p>Team players contribute to positive work environments. They support colleagues, share knowledge, and work toward shared objectives. Good teamwork includes:</p>
<ul>
<li>Offering help when colleagues are struggling</li>
<li>Sharing credit for team achievements</li>
<li>Communicating openly about progress and challenges</li>
<li>Respecting diverse perspectives and ideas</li>
</ul>

<h3>Taking Initiative</h3>
<p>Employers value individuals who identify issues and propose solutions proactively. This doesn't mean overstepping boundaries, but rather showing awareness and willingness to contribute beyond the minimum requirements.</p>

<p>In summary, understanding and meeting employer expectations builds professional reputation and opens doors for career growth. These expectations form the foundation of a successful working relationship.</p>`,

  "Professional Attitude and Mindset": `<h2>Developing a Professional Attitude</h2>
<p>A professional attitude influences success in the workplace. It reflects how individuals approach tasks, challenges, and interactions with others. Your attitude often determines how far you'll advance in your career.</p>

<h3>Components of a Professional Attitude</h3>
<ul>
<li><strong>Positivity:</strong> Approaching work with enthusiasm and optimism</li>
<li><strong>Responsibility:</strong> Taking ownership of your work and actions</li>
<li><strong>Respect:</strong> Treating everyone with dignity regardless of their position</li>
<li><strong>Openness:</strong> Being receptive to feedback and new ideas</li>
<li><strong>Dedication:</strong> Committing to excellence in everything you do</li>
</ul>

<h3>The Power of a Positive Mindset</h3>
<p>A positive mindset helps individuals handle pressure and setbacks. Challenges become opportunities to learn rather than obstacles. Positive workers:</p>
<ul>
<li>Focus on solutions rather than problems</li>
<li>Encourage and support their teammates</li>
<li>Maintain composure during stressful situations</li>
<li>See failures as learning experiences</li>
<li>Celebrate small wins and progress</li>
</ul>

<h3>Taking Ownership</h3>
<p>Ownership means seeing tasks through to completion and accepting responsibility for results. Workers who take ownership:</p>
<ul>
<li>Don't make excuses when things go wrong</li>
<li>Seek to understand problems fully before acting</li>
<li>Follow up to ensure satisfactory outcomes</li>
<li>Look for ways to improve processes</li>
</ul>

<h3>Handling Criticism and Feedback</h3>
<p>A professional attitude includes accepting criticism constructively. Rather than becoming defensive, professionals use feedback as a tool for improvement. When receiving feedback:</p>
<ul>
<li>Listen without interrupting</li>
<li>Ask clarifying questions if needed</li>
<li>Thank the person for their input</li>
<li>Reflect on how to apply the feedback</li>
<li>Follow up to show improvement</li>
</ul>

<h3>Maintaining Professionalism Under Pressure</h3>
<p>Maintaining composure during difficult situations demonstrates maturity and reliability. Employers notice how individuals handle stress and conflict. Stay calm, think before reacting, and focus on constructive solutions.</p>

<p>In summary, a professional attitude is built through daily choices and consistent behavior. It creates a foundation for career success and positive workplace relationships.</p>`,

  "Workplace Behavior and Etiquette": `<h2>Understanding Workplace Behavior</h2>
<p>Workplace behavior refers to how individuals act in professional environments. Etiquette includes manners, communication style, and respect for rules. These behaviors shape how colleagues, supervisors, and clients perceive you.</p>

<h3>Key Elements of Professional Etiquette</h3>
<ul>
<li><strong>Greetings:</strong> Acknowledging colleagues with polite greetings daily</li>
<li><strong>Punctuality:</strong> Arriving on time for work and meetings</li>
<li><strong>Respect:</strong> Treating everyone with courtesy regardless of position</li>
<li><strong>Privacy:</strong> Respecting confidential information and personal boundaries</li>
<li><strong>Cleanliness:</strong> Maintaining a tidy workspace and good hygiene</li>
</ul>

<h3>Communication Etiquette</h3>
<p>Professional communication includes greeting others politely, using appropriate language, and maintaining respectful tone. Key practices include:</p>
<ul>
<li>Speaking clearly and at an appropriate volume</li>
<li>Using professional language (avoiding slang or inappropriate humor)</li>
<li>Listening actively when others speak</li>
<li>Responding to emails and messages promptly</li>
<li>Being mindful of tone in written communication</li>
</ul>

<h3>Meeting Etiquette</h3>
<p>Meetings are common in most workplaces. Proper meeting etiquette includes:</p>
<ul>
<li>Arriving on time or a few minutes early</li>
<li>Coming prepared with necessary materials</li>
<li>Putting phones on silent and avoiding distractions</li>
<li>Waiting for your turn to speak</li>
<li>Staying focused on the meeting agenda</li>
</ul>

<h3>Handling Conflict Professionally</h3>
<p>Disagreements happen in every workplace. Professional behavior means handling conflicts calmly and respectfully:</p>
<ul>
<li>Address issues privately, not in front of others</li>
<li>Focus on the issue, not the person</li>
<li>Listen to understand the other perspective</li>
<li>Seek compromise or involve a supervisor if needed</li>
<li>Move forward without holding grudges</li>
</ul>

<h3>Digital Etiquette</h3>
<p>In modern workplaces, digital behavior matters too. This includes appropriate use of company email, social media policies, and respecting others' time in digital communications.</p>

<p>In summary, workplace etiquette creates a positive environment and demonstrates professional maturity. These behaviors earn respect and contribute to career advancement.</p>`,

  "Time Management Basics": `<h2>Mastering Time Management</h2>
<p>Time management is a critical job readiness skill. Employers expect tasks to be completed within given timeframes. Effective time management increases productivity, reduces stress, and improves work quality.</p>

<h3>Core Time Management Principles</h3>
<ul>
<li><strong>Planning:</strong> Organizing tasks before starting work</li>
<li><strong>Prioritizing:</strong> Identifying what needs to be done first</li>
<li><strong>Scheduling:</strong> Allocating specific times for specific tasks</li>
<li><strong>Focusing:</strong> Avoiding distractions during work periods</li>
<li><strong>Reviewing:</strong> Evaluating progress and adjusting as needed</li>
</ul>

<h3>Planning Your Day</h3>
<p>Managing time involves planning, prioritizing tasks, and avoiding distractions. Start each day by:</p>
<ul>
<li>Reviewing your task list and deadlines</li>
<li>Identifying your top 3 priorities</li>
<li>Estimating how long each task will take</li>
<li>Building in buffer time for unexpected issues</li>
<li>Scheduling breaks to maintain energy</li>
</ul>

<h3>Prioritization Techniques</h3>
<p>Not all tasks are equally important. Use these approaches to prioritize:</p>
<ul>
<li><strong>Urgent + Important:</strong> Do these first</li>
<li><strong>Important but not urgent:</strong> Schedule time for these</li>
<li><strong>Urgent but not important:</strong> Delegate if possible</li>
<li><strong>Neither urgent nor important:</strong> Eliminate or postpone</li>
</ul>

<h3>Avoiding Procrastination</h3>
<p>Procrastination wastes valuable time. Combat it by:</p>
<ul>
<li>Breaking large tasks into smaller, manageable steps</li>
<li>Starting with the most difficult task when energy is highest</li>
<li>Setting specific deadlines for each step</li>
<li>Rewarding yourself for completing tasks</li>
<li>Removing distractions from your workspace</li>
</ul>

<h3>Tools for Time Management</h3>
<p>Consider using calendars, task lists, timers, and planning apps. Find what works best for your style and use it consistently.</p>

<p>In summary, time management is essential for workplace success. Consistent practice of these techniques will improve productivity and reduce stress.</p>`,

  "Responsibility and Accountability at Work": `<h2>Taking Responsibility and Accountability</h2>
<p>Responsibility means taking ownership of tasks and actions. Accountability involves accepting outcomes and learning from mistakes. Together, they form the foundation of professional integrity.</p>

<h3>Understanding Responsibility</h3>
<p>Employers value workers who can be trusted to complete tasks independently. Responsible workers:</p>
<ul>
<li>Complete assigned tasks without constant reminders</li>
<li>Meet deadlines consistently</li>
<li>Take initiative to solve problems</li>
<li>Follow through on commitments</li>
<li>Ask for help when genuinely needed</li>
</ul>

<h3>Understanding Accountability</h3>
<p>Accountability goes beyond responsibility. It means answering for the outcomes of your actions:</p>
<ul>
<li>Acknowledging when things go wrong</li>
<li>Not blaming others for your mistakes</li>
<li>Taking steps to correct errors</li>
<li>Learning from failures to prevent repetition</li>
<li>Accepting feedback gracefully</li>
</ul>

<h3>Building Trust Through Reliability</h3>
<p>Consistent responsibility builds trust with supervisors and colleagues. When people know they can count on you, opportunities follow. Trust is built by:</p>
<ul>
<li>Doing what you say you will do</li>
<li>Being honest about your capabilities and limitations</li>
<li>Communicating proactively about progress and obstacles</li>
<li>Maintaining consistent quality in your work</li>
</ul>

<h3>Handling Mistakes Professionally</h3>
<p>Everyone makes mistakes. What matters is how you handle them:</p>
<ol>
<li>Acknowledge the mistake quickly</li>
<li>Apologize if appropriate</li>
<li>Explain what happened (without making excuses)</li>
<li>Present a plan to fix it</li>
<li>Implement the fix and follow up</li>
<li>Learn from the experience</li>
</ol>

<p>In summary, responsibility and accountability are essential professional qualities that earn respect and create opportunities for advancement.</p>`
};

export async function enhanceJobReadinessContent(): Promise<void> {
  console.log('\n📝 Enhancing Job Readiness Course content...\n');

  const course = await db.select().from(courses)
    .where(eq(courses.title, JOB_READINESS_COURSE_TITLE))
    .limit(1);

  if (course.length === 0) {
    throw new Error(`Course not found`);
  }

  const courseId = course[0].id;
  console.log(`📚 Found course: ${course[0].title}`);

  const courseModules = await db.select().from(modules)
    .where(eq(modules.courseId, courseId));

  let updated = 0;

  for (const mod of courseModules) {
    const moduleLessons = await db.select().from(lessons)
      .where(eq(lessons.moduleId, mod.id));

    for (const lesson of moduleLessons) {
      const content = enhancedContent[lesson.title];
      
      if (content) {
        const textBlocks = await db.select().from(lessonContentBlocks)
          .where(and(
            eq(lessonContentBlocks.lessonId, lesson.id),
            eq(lessonContentBlocks.blockType, 'text')
          ));

        if (textBlocks.length > 0) {
          await db.update(lessonContentBlocks)
            .set({ content: content })
            .where(eq(lessonContentBlocks.id, textBlocks[0].id));
          console.log(`✅ Updated: ${lesson.title}`);
          updated++;
        }
      }
    }
  }

  console.log(`\n✅ Enhanced ${updated} lessons with detailed content`);
}

import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);

if (process.argv[1] === __filename) {
  enhanceJobReadinessContent()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Failed:', error);
      process.exit(1);
    });
}
