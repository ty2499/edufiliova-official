import { db } from './db';
import { lessons, courses, lessonContentBlocks, modules } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

const JOB_READINESS_COURSE_TITLE = 'Job Readiness and Career Success';

const enhancedContent: Record<string, string> = {
  "Following Instructions Correctly": `<h2>The Importance of Following Instructions</h2>
<p>Following instructions accurately ensures quality work and safety. Misunderstanding instructions can cause errors, delays, and even workplace accidents. This skill is fundamental to professional success.</p>

<h3>Active Listening When Receiving Instructions</h3>
<p>Clarifying instructions and confirming understanding are professional habits that prevent costly mistakes. When receiving verbal instructions:</p>
<ul>
<li>Give your full attention to the speaker</li>
<li>Take notes on key points and deadlines</li>
<li>Avoid interrupting while instructions are being given</li>
<li>Repeat back key points to confirm understanding</li>
<li>Ask questions about anything unclear</li>
</ul>

<h3>Reading Written Instructions</h3>
<p>Written instructions require careful attention:</p>
<ul>
<li>Read the entire document before starting</li>
<li>Highlight or underline key requirements</li>
<li>Note any deadlines or special conditions</li>
<li>Keep instructions accessible while working</li>
<li>Refer back to them regularly during the task</li>
</ul>

<h3>When to Ask for Clarification</h3>
<p>It's always better to ask than to guess. Seek clarification when:</p>
<ul>
<li>Any part of the instruction is unclear</li>
<li>The deadline or priority isn't specified</li>
<li>Resources or tools needed aren't mentioned</li>
<li>The expected outcome isn't clearly defined</li>
<li>Instructions seem to conflict with other tasks</li>
</ul>

<h3>Executing Instructions Accurately</h3>
<p>Once you understand the instructions:</p>
<ol>
<li>Plan your approach before starting</li>
<li>Gather all necessary materials and tools</li>
<li>Follow steps in the correct order</li>
<li>Check your work against the original instructions</li>
<li>Report completion and any issues encountered</li>
</ol>

<p>In summary, following instructions correctly is a foundational workplace skill that builds trust and ensures quality outcomes.</p>`,

  "Adaptability in the Workplace": `<h2>Being Adaptable at Work</h2>
<p>Adaptability allows workers to adjust to change. Tasks, schedules, and expectations can shift unexpectedly in any workplace. Being adaptable makes you more valuable to employers.</p>

<h3>Why Adaptability Matters</h3>
<p>Modern workplaces are dynamic environments where:</p>
<ul>
<li>Technology constantly evolves</li>
<li>Market conditions change rapidly</li>
<li>Teams restructure and grow</li>
<li>New challenges emerge regularly</li>
<li>Customer needs shift over time</li>
</ul>

<h3>Signs of an Adaptable Worker</h3>
<p>Flexible individuals handle change calmly and learn quickly. They:</p>
<ul>
<li>Remain calm when plans change</li>
<li>See challenges as opportunities</li>
<li>Learn new skills willingly</li>
<li>Help others adjust to changes</li>
<li>Offer solutions rather than complaints</li>
</ul>

<h3>Developing Adaptability</h3>
<p>You can build your adaptability through practice:</p>
<ul>
<li>Step outside your comfort zone regularly</li>
<li>Learn new skills proactively</li>
<li>Practice staying calm under pressure</li>
<li>Seek feedback and act on it</li>
<li>Observe how successful colleagues handle change</li>
</ul>

<h3>Adapting to Different Situations</h3>
<p>Adaptability applies to many workplace situations:</p>
<ul>
<li><strong>New tasks:</strong> Approach unfamiliar work with curiosity</li>
<li><strong>New technology:</strong> Embrace learning new tools</li>
<li><strong>New team members:</strong> Welcome and support newcomers</li>
<li><strong>New processes:</strong> Follow updated procedures positively</li>
<li><strong>Unexpected problems:</strong> Focus on solutions, not blame</li>
</ul>

<p>In summary, adaptability improves long-term career success by making you a resilient and valuable team member.</p>`,

  "Personal Presentation and Appearance": `<h2>Professional Presentation</h2>
<p>Personal presentation influences first impressions. Clean, appropriate appearance shows respect for the workplace and yourself. How you present yourself communicates professionalism before you even speak.</p>

<h3>Components of Professional Presentation</h3>
<ul>
<li><strong>Grooming:</strong> Clean hair, nails, and overall hygiene</li>
<li><strong>Clothing:</strong> Appropriate, clean, and well-fitted attire</li>
<li><strong>Accessories:</strong> Professional and not distracting</li>
<li><strong>Body Language:</strong> Confident posture and expressions</li>
<li><strong>Voice:</strong> Clear, professional tone and language</li>
</ul>

<h3>Understanding Dress Codes</h3>
<p>Dress standards vary by industry and company, but neatness and hygiene are always expected:</p>
<ul>
<li><strong>Business Formal:</strong> Suits, ties, professional dresses</li>
<li><strong>Business Casual:</strong> Collared shirts, slacks, modest dresses</li>
<li><strong>Smart Casual:</strong> Neat jeans, polo shirts, clean sneakers</li>
<li><strong>Uniforms:</strong> Clean, properly worn company attire</li>
</ul>

<h3>Personal Hygiene in the Workplace</h3>
<p>Basic hygiene is essential for professionalism:</p>
<ul>
<li>Shower or bathe daily</li>
<li>Use deodorant</li>
<li>Keep breath fresh</li>
<li>Maintain clean, trimmed nails</li>
<li>Wear clean clothes daily</li>
</ul>

<h3>First Impressions</h3>
<p>People form impressions within seconds. Your appearance communicates:</p>
<ul>
<li>Attention to detail</li>
<li>Respect for the workplace</li>
<li>Self-confidence</li>
<li>Professionalism</li>
</ul>

<p>In summary, presenting yourself professionally opens doors and demonstrates respect for your workplace and colleagues.</p>`,

  "Understanding Personal Strengths and Skills": `<h2>Knowing Your Strengths</h2>
<p>Understanding your personal strengths and skills is the first step in career planning. Self-awareness helps you identify suitable career paths and communicate your value to employers.</p>

<h3>Types of Strengths</h3>
<ul>
<li><strong>Technical Skills:</strong> Specific abilities like computer use, writing, or calculations</li>
<li><strong>Transferable Skills:</strong> Abilities that apply across jobs like communication and organization</li>
<li><strong>Personal Qualities:</strong> Traits like reliability, creativity, or persistence</li>
<li><strong>Knowledge:</strong> Information and expertise you've gained through education and experience</li>
</ul>

<h3>Identifying Your Strengths</h3>
<p>Reflect on these questions:</p>
<ul>
<li>What tasks do you complete easily that others find difficult?</li>
<li>What do people often ask for your help with?</li>
<li>What activities energize rather than drain you?</li>
<li>What have you been praised for in the past?</li>
<li>What skills have you developed through hobbies or volunteer work?</li>
</ul>

<h3>Gathering External Feedback</h3>
<p>Others can see strengths you might overlook:</p>
<ul>
<li>Ask trusted friends or family what they see as your strengths</li>
<li>Review past performance evaluations if available</li>
<li>Consider compliments you've received</li>
<li>Think about roles you've naturally assumed in group settings</li>
</ul>

<h3>Using Strengths in Your Career</h3>
<p>Once you identify your strengths:</p>
<ul>
<li>Look for jobs that use these strengths</li>
<li>Highlight them on your resume and in interviews</li>
<li>Build on them through continued practice</li>
<li>Use them to contribute value to your team</li>
</ul>

<p>In summary, understanding your strengths helps you make better career choices and present yourself confidently to employers.</p>`,

  "Identifying Areas for Improvement": `<h2>Recognizing Areas for Growth</h2>
<p>No one is perfect. Identifying areas where you need improvement shows maturity and commitment to professional development. This self-awareness is valued by employers.</p>

<h3>Common Areas for Development</h3>
<ul>
<li><strong>Communication:</strong> Speaking, writing, or listening skills</li>
<li><strong>Technical abilities:</strong> Computer skills, industry-specific knowledge</li>
<li><strong>Time management:</strong> Organization and prioritization</li>
<li><strong>Interpersonal skills:</strong> Working with others, handling conflict</li>
<li><strong>Leadership:</strong> Guiding others, taking initiative</li>
</ul>

<h3>How to Identify Improvement Areas</h3>
<p>Be honest with yourself about where you struggle:</p>
<ul>
<li>What tasks do you avoid or procrastinate on?</li>
<li>Where have you received constructive criticism?</li>
<li>What skills do jobs you want require that you lack?</li>
<li>Where do you feel less confident?</li>
<li>What feedback have you received from others?</li>
</ul>

<h3>Creating an Improvement Plan</h3>
<p>Once you identify areas for growth:</p>
<ol>
<li>Prioritize which areas to focus on first</li>
<li>Set specific, measurable goals</li>
<li>Identify resources for learning (courses, mentors, books)</li>
<li>Practice regularly</li>
<li>Track your progress over time</li>
</ol>

<h3>Discussing Weaknesses in Interviews</h3>
<p>When asked about weaknesses:</p>
<ul>
<li>Be honest but strategic</li>
<li>Choose a real area for improvement</li>
<li>Explain what you're doing to improve</li>
<li>Show progress you've already made</li>
</ul>

<p>In summary, acknowledging and working on weaknesses demonstrates professionalism and commitment to growth.</p>`,

  "Setting Realistic Career Goals": `<h2>Planning Your Career Path</h2>
<p>Setting realistic career goals gives you direction and motivation. Clear goals help you make better decisions about education, jobs, and professional development.</p>

<h3>Types of Career Goals</h3>
<ul>
<li><strong>Short-term goals:</strong> Achievements within 1 year (get a job, learn a skill)</li>
<li><strong>Medium-term goals:</strong> Achievements in 1-5 years (promotion, salary increase)</li>
<li><strong>Long-term goals:</strong> Achievements in 5+ years (leadership role, career change)</li>
</ul>

<h3>SMART Goal Framework</h3>
<p>Effective goals are SMART:</p>
<ul>
<li><strong>Specific:</strong> Clearly defined outcome</li>
<li><strong>Measurable:</strong> Quantifiable progress indicators</li>
<li><strong>Achievable:</strong> Realistic given your resources</li>
<li><strong>Relevant:</strong> Aligned with your values and larger goals</li>
<li><strong>Time-bound:</strong> Has a deadline</li>
</ul>

<h3>Steps to Set Career Goals</h3>
<ol>
<li>Reflect on your interests, strengths, and values</li>
<li>Research career options that match</li>
<li>Identify required skills and qualifications</li>
<li>Set specific milestones along the path</li>
<li>Create action steps for each milestone</li>
<li>Review and adjust goals regularly</li>
</ol>

<h3>Overcoming Obstacles</h3>
<p>Anticipate challenges and plan for them:</p>
<ul>
<li>Lack of experience: Seek internships or volunteer work</li>
<li>Missing skills: Take courses or self-study</li>
<li>Limited network: Attend events, join professional groups</li>
<li>Financial constraints: Look for free resources and scholarships</li>
</ul>

<p>In summary, realistic career goals provide direction and increase your chances of professional success.</p>`,

  "Common Interview Questions and How to Answer": `<h2>Preparing for Interview Questions</h2>
<p>Job interviews often include predictable questions. Preparing thoughtful answers in advance helps you respond confidently and professionally.</p>

<h3>Tell Me About Yourself</h3>
<p>This opening question sets the tone. Structure your answer:</p>
<ul>
<li>Brief professional background</li>
<li>Key skills and experiences relevant to the role</li>
<li>Why you're interested in this opportunity</li>
<li>Keep it concise (1-2 minutes)</li>
</ul>

<h3>Why Do You Want This Job?</h3>
<p>Show you've researched the company:</p>
<ul>
<li>Connect your goals to the company's mission</li>
<li>Mention specific aspects that attract you</li>
<li>Explain how you can contribute</li>
<li>Be genuine and specific</li>
</ul>

<h3>What Are Your Strengths?</h3>
<p>Choose strengths relevant to the job:</p>
<ul>
<li>Select 2-3 genuine strengths</li>
<li>Provide examples demonstrating each</li>
<li>Connect strengths to job requirements</li>
</ul>

<h3>What Are Your Weaknesses?</h3>
<p>Answer honestly but strategically:</p>
<ul>
<li>Choose a real but not critical weakness</li>
<li>Explain what you're doing to improve</li>
<li>Show self-awareness and growth mindset</li>
</ul>

<h3>Why Should We Hire You?</h3>
<p>Summarize your value proposition:</p>
<ul>
<li>Highlight your most relevant qualifications</li>
<li>Demonstrate enthusiasm for the role</li>
<li>Show understanding of their needs</li>
<li>Express confidence without arrogance</li>
</ul>

<h3>Do You Have Any Questions?</h3>
<p>Always have questions prepared:</p>
<ul>
<li>Ask about team dynamics or company culture</li>
<li>Inquire about growth opportunities</li>
<li>Clarify next steps in the process</li>
<li>Avoid questions about salary in first interviews</li>
</ul>

<p>In summary, preparation is key to interview success. Practice your answers but keep them natural and conversational.</p>`,

  "Building Positive Work Relationships": `<h2>Creating Strong Workplace Relationships</h2>
<p>Positive work relationships make your job more enjoyable and productive. Good relationships with colleagues, supervisors, and clients contribute to career success.</p>

<h3>Benefits of Positive Relationships</h3>
<ul>
<li>More enjoyable work environment</li>
<li>Better collaboration and teamwork</li>
<li>Increased job satisfaction</li>
<li>More opportunities for advancement</li>
<li>Stronger professional network</li>
</ul>

<h3>Building Relationships with Colleagues</h3>
<ul>
<li>Be friendly and approachable</li>
<li>Show genuine interest in others</li>
<li>Offer help when you can</li>
<li>Celebrate others' successes</li>
<li>Keep commitments and be reliable</li>
</ul>

<h3>Working with Your Supervisor</h3>
<ul>
<li>Understand their expectations clearly</li>
<li>Communicate proactively about progress</li>
<li>Accept feedback professionally</li>
<li>Ask for guidance when needed</li>
<li>Respect their time and priorities</li>
</ul>

<h3>Navigating Difficult Relationships</h3>
<p>Not everyone will be easy to work with:</p>
<ul>
<li>Stay professional regardless of others' behavior</li>
<li>Focus on work tasks, not personal differences</li>
<li>Seek to understand different perspectives</li>
<li>Address conflicts calmly and privately</li>
<li>Involve HR or management if necessary</li>
</ul>

<h3>Maintaining Professional Boundaries</h3>
<p>While being friendly:</p>
<ul>
<li>Keep personal information appropriate for the workplace</li>
<li>Avoid gossip and office politics</li>
<li>Respect others' privacy and boundaries</li>
<li>Separate personal feelings from professional interactions</li>
</ul>

<p>In summary, investing in positive work relationships creates a better work experience and supports career growth.</p>`,

  "Continuous Learning and Skill Improvement": `<h2>Lifelong Learning for Career Success</h2>
<p>The world of work constantly evolves. Continuous learning keeps your skills relevant and opens new opportunities throughout your career.</p>

<h3>Why Continuous Learning Matters</h3>
<ul>
<li>Technology and industries change rapidly</li>
<li>New skills create new opportunities</li>
<li>Staying current makes you more valuable</li>
<li>Learning keeps work engaging</li>
<li>Career advancement often requires new competencies</li>
</ul>

<h3>Ways to Continue Learning</h3>
<ul>
<li><strong>Formal education:</strong> Courses, certifications, degrees</li>
<li><strong>Online learning:</strong> Free and paid courses, tutorials, webinars</li>
<li><strong>Reading:</strong> Books, articles, industry publications</li>
<li><strong>Learning from others:</strong> Mentors, colleagues, networking</li>
<li><strong>On-the-job learning:</strong> New projects, stretch assignments</li>
</ul>

<h3>Creating a Learning Plan</h3>
<ol>
<li>Identify skills needed for your career goals</li>
<li>Assess your current skill level</li>
<li>Prioritize what to learn first</li>
<li>Choose appropriate learning methods</li>
<li>Schedule regular time for learning</li>
<li>Apply new skills in your work</li>
</ol>

<h3>Overcoming Learning Barriers</h3>
<ul>
<li><strong>Time constraints:</strong> Start with 15-30 minutes daily</li>
<li><strong>Cost:</strong> Utilize free resources (libraries, YouTube, MOOCs)</li>
<li><strong>Motivation:</strong> Connect learning to meaningful goals</li>
<li><strong>Overwhelm:</strong> Focus on one skill at a time</li>
</ul>

<h3>Demonstrating Your Learning</h3>
<p>Show employers your commitment to growth:</p>
<ul>
<li>Update your resume with new skills</li>
<li>Mention learning in interviews</li>
<li>Share knowledge with colleagues</li>
<li>Apply skills in visible projects</li>
</ul>

<p>In summary, continuous learning is essential for long-term career success and job security in a changing world.</p>`
};

export async function enhanceMoreContent(): Promise<void> {
  console.log('\n📝 Enhancing more Job Readiness lessons...\n');

  const course = await db.select().from(courses)
    .where(eq(courses.title, JOB_READINESS_COURSE_TITLE))
    .limit(1);

  if (course.length === 0) {
    throw new Error(`Course not found`);
  }

  const courseModules = await db.select().from(modules)
    .where(eq(modules.courseId, course[0].id));

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

  console.log(`\n✅ Enhanced ${updated} more lessons`);
}

import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);

if (process.argv[1] === __filename) {
  enhanceMoreContent()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Failed:', error);
      process.exit(1);
    });
}
