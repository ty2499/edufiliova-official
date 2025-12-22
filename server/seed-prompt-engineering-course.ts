import { db } from './db';
import { courses, modules, lessons, courseCategories } from '../shared/schema';
import { eq } from 'drizzle-orm';
import { ensureAdminUser } from './ensure-admin-user';

export async function seedPromptEngineeringCourse() {
  console.log('📝 Seeding Prompt Engineering for Beginners Course...');
  
  const adminUserId = await ensureAdminUser();
  console.log(`✅ Using admin user ID: ${adminUserId}`);
  
  const existing = await db.select().from(courses).where(eq(courses.title, 'Prompt Engineering for Beginners'));
  if (existing.length > 0) {
    console.log('✅ Prompt Engineering Course already exists');
    return;
  }

  let [techCategory] = await db.select().from(courseCategories).where(eq(courseCategories.name, 'Technology'));
  if (!techCategory) {
    [techCategory] = await db.insert(courseCategories).values({
      name: 'Technology',
      displayName: 'Technology',
      description: 'Technology and digital skills courses',
      color: 'purple',
      isActive: true
    }).returning();
  }

  const [course] = await db.insert(courses).values({
    title: 'Prompt Engineering for Beginners',
    description: 'A beginner-friendly course that teaches how to communicate effectively with AI tools using clear, structured prompts for better results.',
    thumbnailUrl: '/api/placeholder/400/300',
    image: '/api/placeholder/400/300',
    categoryId: techCategory.id,
    pricingType: 'fixed_price',
    price: '29.99',
    isActive: true,
    approvalStatus: 'approved',
    createdBy: adminUserId,
    publisherName: 'EduFiliova Learning',
    publisherBio: 'Expert educators in practical digital skills',
    tags: ['Prompt Engineering', 'AI Skills', 'Communication', 'Productivity', 'Writing'],
    language: 'en',
    difficulty: 'beginner',
    duration: 6,
    learningObjectives: [
      'Understand how prompts work',
      'Write clear and effective prompts',
      'Improve AI responses consistently',
      'Use prompts for work, study, and projects',
      'Avoid common prompt mistakes'
    ],
    certificationType: 'certificate',
    credits: 3
  }).returning();

  console.log('✅ Created course:', course.title);

  // Module 1: Introduction to Prompting
  const [module1] = await db.insert(modules).values({
    courseId: course.id,
    title: 'Introduction to Prompting',
    description: 'Understand what prompts are and why they matter.',
    orderNum: 1
  }).returning();

  await db.insert(lessons).values([
    {
      moduleId: module1.id,
      courseId: course.id,
      title: 'What Is a Prompt',
      orderNum: 1,
      durationMinutes: 20,
      content: `A prompt is an instruction or input you give to an AI system to get a specific response. Think of it as a question or command that tells the AI what you want it to do.

Every interaction with an AI tool begins with a prompt. When you type something into a chatbot, search engine, or AI assistant, you are writing a prompt. The quality of your prompt directly affects the quality of the response you receive.

**Understanding the Basics**

At its core, a prompt is simply text that communicates your intent. However, not all prompts are equal. A vague prompt leads to vague results. A specific prompt leads to specific, useful results.

Consider this example. If you ask an AI "Tell me about dogs," you will receive general information about dogs. The AI might talk about breeds, behavior, history, or care. You get a broad response because your prompt was broad.

Now consider a more specific prompt: "List five small dog breeds that are good for apartment living, including their exercise needs and temperament." This prompt tells the AI exactly what information you need. The response will be focused and directly useful.

**Components of a Prompt**

Every effective prompt contains certain elements:

1. The main request or question
2. Context about what you need
3. Any specific requirements or constraints
4. The desired format of the response

You do not always need all four elements, but including them when relevant improves your results significantly.

**Why Prompts Matter**

AI systems are powerful but not mind readers. They respond to exactly what you give them. If your prompt is unclear, the AI must guess what you want. Sometimes it guesses correctly. Often it does not.

Learning to write good prompts is like learning to ask good questions. The better your question, the better the answer you receive. This skill applies to all AI tools, from simple chatbots to advanced language models.

**Practical Application**

Start noticing how you phrase requests in daily life. When you ask someone for help, you naturally include relevant details. Apply the same approach to AI prompts. Tell the AI what you need, why you need it, and how you want it delivered.

The following lessons will teach you specific techniques for writing prompts that get results. You will learn to structure your requests clearly, provide useful context, and avoid common mistakes that lead to poor responses.

**Key Takeaways**

- A prompt is any input you give to an AI system
- Prompt quality directly affects response quality
- Specific prompts produce better results than vague ones
- Learning to prompt well is learning to communicate clearly`
    },
    {
      moduleId: module1.id,
      courseId: course.id,
      title: 'Why Prompt Quality Matters',
      orderNum: 2,
      durationMinutes: 25,
      content: `The quality of your prompt determines the quality of the response you receive. This is not just a general guideline. It is a fundamental principle that applies to every AI interaction.

**The Direct Connection**

When you write a weak prompt, you force the AI to make assumptions. It fills in gaps based on patterns it learned during training. Sometimes these assumptions match what you wanted. More often, they do not.

Strong prompts leave little room for assumption. They provide the AI with the information it needs to respond accurately. The result is a response that addresses your actual needs.

**Real-World Impact**

Consider a professional context. You need to draft an email to a client about a project delay. A weak prompt might be: "Write an email about a delay."

The AI could produce anything from an apology to a formal notice to a casual message. You would likely need to revise heavily or start over.

A stronger prompt would be: "Write a professional email to a long-term client explaining that their website redesign project will be delayed by two weeks due to technical issues. Express understanding of the inconvenience, outline next steps, and maintain a positive relationship."

This prompt gives the AI everything it needs. The response will be close to what you need, saving time and effort.

**Time and Efficiency**

Poor prompts waste time in multiple ways. You wait for a response that does not help. You try to edit an unsuitable response. You write another prompt and wait again. This cycle can repeat several times before you get useful output.

Good prompts often produce usable results on the first attempt. Even when revision is needed, you start from a much stronger position. The time invested in writing a clear prompt pays off immediately.

**Consistency of Results**

Random results are frustrating. If the same prompt produces wildly different outputs each time, you cannot rely on the AI as a tool.

Well-structured prompts produce consistent results. The AI has clear guidance, so it follows a similar path each time. You can predict what you will receive and plan accordingly.

**Learning and Improvement**

When your prompts are intentional, you can learn from the results. If a response is not what you expected, you can identify which part of your prompt caused the issue. You then adjust and improve.

With vague prompts, troubleshooting is difficult. You do not know what caused the problem because you were not specific about what you wanted.

**Building Skills**

Prompt quality matters more as AI tools become more capable. Advanced systems can do remarkable things, but only when given clear direction. Users who master prompting unlock capabilities that others never access.

This skill transfers across tools and contexts. Once you understand how to communicate clearly with AI, you can apply that knowledge to any system you encounter.

**Key Takeaways**

- Response quality depends directly on prompt quality
- Clear prompts save time by reducing revisions
- Consistent prompts produce predictable results
- Good prompting skills improve with practice and transfer across tools`
    },
    {
      moduleId: module1.id,
      courseId: course.id,
      title: 'How AI Interprets Prompts',
      orderNum: 3,
      durationMinutes: 30,
      content: `Understanding how AI processes your prompts helps you write better ones. When you know what the system is looking for, you can provide exactly that.

**Pattern Recognition**

AI systems are trained on vast amounts of text. They learn patterns in how language works, how topics relate to each other, and how different types of requests are typically answered.

When you submit a prompt, the AI matches your words against these patterns. It predicts what kind of response would typically follow text like yours. The more your prompt resembles clear, well-answered questions from the training data, the better the response.

**Word Choice Matters**

Every word in your prompt influences the response. The AI pays attention to vocabulary, tone, and structure. Using precise words leads to precise responses.

For example, "explain" and "describe" produce different outputs. "Explain" signals that you want understanding of how something works. "Describe" signals that you want details about characteristics or appearance.

Similarly, "list" produces a structured format. "Discuss" produces flowing text. "Compare" sets up a side-by-side analysis. These action words guide the AI toward a specific response type.

**Context Interpretation**

AI uses context clues to understand your intent. If your prompt mentions business, the response will use professional language. If your prompt mentions children, the response will use simpler explanations.

You can leverage this by including relevant context. Mentioning your situation, audience, or purpose helps the AI calibrate its response appropriately.

**Sequence and Structure**

The order of information in your prompt affects how the AI processes it. Information at the beginning and end tends to carry more weight. The middle can get less attention in long prompts.

Structure your prompts so the most important elements are prominent. Lead with your main request. End with key constraints or requirements.

**Handling Ambiguity**

When prompts contain ambiguous terms, the AI makes choices based on common usage. If you ask about "Python," the AI might respond about the programming language or the snake, depending on other context clues.

You can reduce ambiguity by being specific. Instead of "Python," say "Python programming language" or "Python snake." This small addition eliminates confusion.

**What AI Cannot Do**

Understanding limitations helps set realistic expectations. AI cannot:

- Access information from after its training cutoff
- Know your personal situation unless you explain it
- Read your mind about unstated preferences
- Verify facts with external sources during a conversation

Work within these limitations by providing necessary context and verifying important information independently.

**Practical Implications**

Think of the AI as a capable assistant who is meeting you for the first time. It knows a lot but nothing about your specific situation. Your prompt is the only information it has to work with.

Give it what it needs. Be clear about your goal. Specify the format you want. Include relevant context. The better you communicate, the better the AI can help.

**Key Takeaways**

- AI matches prompts against patterns from training data
- Word choice directly influences response type
- Context clues help AI calibrate tone and content
- Reducing ambiguity improves response accuracy
- Understanding limitations helps set realistic expectations`
    },
    {
      moduleId: module1.id,
      courseId: course.id,
      title: 'Good vs Bad Prompts',
      orderNum: 4,
      durationMinutes: 25,
      content: `Comparing effective and ineffective prompts illustrates what makes the difference. Studying examples builds intuition for writing better prompts yourself.

**Characteristics of Bad Prompts**

Weak prompts share common features:

Vagueness: "Help me with my project" gives no direction. What project? What kind of help?

Assumptions: "Continue what we discussed" assumes the AI remembers context it may not have.

Overload: Cramming multiple unrelated requests into one prompt confuses the system and produces scattered responses.

Missing context: "Is this a good idea?" without explaining the idea produces a meaningless response.

**Example: Bad Prompt**

"Write something about marketing."

This prompt fails in multiple ways. It does not specify what aspect of marketing. It does not indicate length, format, or audience. It does not explain the purpose. The AI must guess everything.

**Characteristics of Good Prompts**

Strong prompts share different features:

Clarity: The request is obvious on first reading.

Specificity: Key details are included.

Structure: Information is organized logically.

Purpose: The intended use is clear.

**Example: Good Prompt**

"Write a 300-word introduction for a blog post about email marketing strategies for small businesses. The tone should be professional but approachable. Include a hook to engage readers and preview three main topics that will be covered."

This prompt succeeds because it specifies length, topic, audience, tone, and structure. The AI knows exactly what to produce.

**Side-by-Side Comparison**

Bad: "Explain machine learning."
Good: "Explain machine learning to a high school student with no technical background. Use a real-world analogy and keep the explanation under 200 words."

Bad: "Write a letter."
Good: "Write a formal letter requesting a meeting with a potential investor. The company is a tech startup developing sustainable packaging solutions. The letter should be one page maximum and convey professionalism and innovation."

Bad: "Give me ideas."
Good: "Generate five unique ideas for team-building activities suitable for a remote team of 15 people. Each activity should take less than one hour and require no special equipment."

**The Transformation Process**

When you catch yourself writing a vague prompt, pause and ask:

1. What exactly do I want?
2. What context is relevant?
3. What format should the response take?
4. What constraints apply?

Answer these questions in your prompt. The extra seconds spent clarifying save minutes of dealing with unsuitable responses.

**Common Patterns to Avoid**

"Help me with..." - Specify what kind of help
"Tell me about..." - Narrow the focus
"I need..." - Explain why and how
"Write something..." - Define what exactly

**Key Takeaways**

- Bad prompts are vague, assume context, and lack specificity
- Good prompts are clear, detailed, and purposeful
- Asking clarifying questions improves prompt quality
- Small additions to prompts create large improvements in responses`
    },
    {
      moduleId: module1.id,
      courseId: course.id,
      title: 'Prompting Mindset',
      orderNum: 5,
      durationMinutes: 20,
      content: `Effective prompting requires a particular way of thinking. Developing this mindset makes writing good prompts natural rather than forced.

**Think Like a Communicator**

You are not just typing commands. You are communicating with a system that needs clear information to help you. Every prompt is an opportunity to express your needs precisely.

When you approach prompts as communication, you naturally include context and clarification. You anticipate misunderstandings and address them proactively.

**Adopt the Beginner Perspective**

Imagine explaining your request to someone who knows nothing about your situation. This person is intelligent and capable, but they are starting from zero knowledge of your context.

What would they need to know? What assumptions might they make incorrectly? What clarification would help them succeed?

This perspective reveals gaps in your prompts that you might otherwise overlook.

**Embrace Iteration**

Good prompts often develop through revision. Your first attempt may not be perfect. That is normal and expected.

View each interaction as learning. If a response is not quite right, analyze why. Adjust your prompt and try again. Each iteration teaches you something about effective prompting.

Do not see revision as failure. See it as the natural path to better results.

**Focus on Outcomes**

Start with the end in mind. What do you need the response to accomplish? What will you do with it?

When you know your goal, you can work backward to determine what the prompt must include. This goal-focused approach keeps your prompts relevant and targeted.

**Be Specific Without Over-Engineering**

There is a balance between vagueness and excessive complexity. Over-complicated prompts can confuse AI systems and produce strange results.

Aim for clarity and completeness, not exhaustive detail. Include what matters. Leave out what does not affect the response.

With experience, you develop intuition for this balance. Start by erring on the side of more detail, then learn what you can safely omit.

**Expect to Learn**

AI tools evolve. Best practices change. What works today may improve tomorrow. Maintain curiosity about new techniques and approaches.

The prompting mindset includes ongoing learning. Read about what others do. Experiment with new approaches. Share what works.

**Build Confidence**

You will get better at this. Every prompt you write is practice. Every interaction teaches you something, even when the response is not what you wanted.

Trust the process. The skills you develop apply broadly. Clear communication is valuable everywhere, not just with AI.

**Key Takeaways**

- Approach prompts as clear communication
- Adopt the perspective of someone with no context
- Embrace iteration as part of the process
- Focus on outcomes and work backward
- Balance specificity with simplicity
- Maintain curiosity and keep learning`
    }
  ]);

  console.log('✅ Created Module 1: Introduction to Prompting with 5 lessons');

  // Module 2: Prompt Structure Basics
  const [module2] = await db.insert(modules).values({
    courseId: course.id,
    title: 'Prompt Structure Basics',
    description: 'Learn the building blocks of strong prompts.',
    orderNum: 2
  }).returning();

  await db.insert(lessons).values([
    {
      moduleId: module2.id,
      courseId: course.id,
      title: 'Clear Instructions',
      orderNum: 1,
      durationMinutes: 25,
      content: `Clear instructions form the foundation of every effective prompt. When you tell the AI exactly what to do, you get exactly what you need.

**The Power of Direct Language**

Ambiguous language creates ambiguous results. Direct language creates focused results. Compare these two approaches:

Indirect: "It might be helpful to know about budgeting."
Direct: "Explain three basic budgeting methods for someone with irregular income."

The direct version specifies the topic, the number of items, and the audience. There is no room for misinterpretation.

**Start with Action Verbs**

Begin your prompts with clear action verbs:

- "List" for itemized information
- "Explain" for understanding concepts
- "Compare" for analyzing differences
- "Create" for generating new content
- "Summarize" for condensing information
- "Analyze" for deep examination
- "Suggest" for recommendations

These verbs immediately signal what type of response you want.

**Be Specific About Scope**

Define the boundaries of your request. How much do you want? How deep should the response go? What should be included or excluded?

"Explain photosynthesis" is unclear about scope. 
"Explain the basic process of photosynthesis in three paragraphs suitable for a middle school student" is precise about depth, length, and audience.

**Include Quantifiers**

Numbers add clarity:

- "Give me three examples" is clearer than "give me examples"
- "Write 200 words" is clearer than "write something short"
- "List the top five" is clearer than "list some"

Quantifiers set expectations and help the AI calibrate its response.

**Specify the Format**

Tell the AI how to structure its response:

- "Respond in bullet points"
- "Format as a numbered list"
- "Write in paragraph form"
- "Create a table with columns for X, Y, and Z"
- "Provide step-by-step instructions"

Format specification reduces the need for reformatting later.

**Avoid Compound Requests**

Separate complex requests into distinct parts. "Tell me about Rome and write a poem about it" combines two very different tasks.

Better: First ask for information about Rome. Then, in a separate prompt, request the poem. This produces better results for both.

**Common Mistakes to Avoid**

Using vague language: "good," "interesting," "some"
Making assumptions: expecting the AI to know your preferences
Over-qualifying: adding unnecessary hedging words
Burying the request: placing the main ask at the end of a long paragraph

**Practice Examples**

Transform these weak instructions into strong ones:

Weak: "Help with email"
Strong: "Write a professional email declining a meeting invitation politely while suggesting an alternative time next week."

Weak: "Tell me about healthy food"
Strong: "List ten high-protein breakfast foods with their approximate protein content per serving."

Weak: "I need a summary"
Strong: "Summarize the key points of this article in five bullet points, focusing on practical applications."

**Key Takeaways**

- Use direct language that leaves no room for interpretation
- Start with action verbs that signal response type
- Define scope with specifics about depth and length
- Include numbers when quantity matters
- Specify desired format explicitly
- Keep requests focused on one main task`
    },
    {
      moduleId: module2.id,
      courseId: course.id,
      title: 'Providing Context',
      orderNum: 2,
      durationMinutes: 25,
      content: `Context transforms generic responses into relevant ones. When AI understands your situation, it can tailor its output to your actual needs.

**What Context Includes**

Relevant context varies by situation but often includes:

- Who will use the response
- The purpose or goal
- Your level of expertise
- Any constraints or requirements
- Background information that affects the answer

Not every prompt needs all of these. Include what matters for your specific request.

**The Before and After**

Without context: "Write a cover letter."
The AI produces a generic template that could apply to anyone.

With context: "Write a cover letter for a junior marketing position at a tech startup. I have two years of internship experience in social media management and recently graduated with a communications degree."
The AI produces a targeted letter that highlights relevant experience.

**Audience Context**

Who will read or use the response? This affects vocabulary, depth, and tone.

For a technical audience: "Explain containerization to experienced developers."
For a general audience: "Explain containerization to someone with no programming background."

Same topic, completely different responses. The audience context makes this possible.

**Purpose Context**

Why do you need this information? What will you do with it?

"Explain the causes of World War I" could produce different responses depending on purpose:
- For a high school essay
- For teaching a class
- For understanding a news article reference
- For writing historical fiction

Including purpose helps the AI emphasize what matters most to you.

**Expertise Level**

Your existing knowledge affects what you need. Someone new to a topic needs foundational explanations. An expert needs advanced details.

"Explain options trading" for a beginner should cover basics simply.
"Explain options trading strategies for hedging currency risk" assumes existing knowledge.

Stating your level helps the AI calibrate appropriately.

**Constraint Context**

Limitations and requirements shape responses:

- Word or time limits
- Format requirements
- Prohibited topics or approaches
- Required elements to include

"Write a product description in under 100 words that avoids technical jargon and emphasizes eco-friendliness."

Each constraint narrows the response toward what you actually need.

**When to Add More Context**

Consider adding context when:

- The topic is ambiguous
- You need a specific angle or focus
- Standard responses would not fit your situation
- Previous attempts produced unsuitable results

You can always add context. Start with what seems necessary and add more if results are too generic.

**When Less Context Works**

For simple, straightforward requests, minimal context may suffice:

"Convert 50 kilometers to miles" needs no context.
"List the planets in our solar system" is clear enough on its own.

Judge based on how much interpretation the AI might need to do.

**Key Takeaways**

- Context transforms generic responses into relevant ones
- Include audience, purpose, expertise level, and constraints as needed
- More context helps when topics are ambiguous or personal
- Simple factual requests may need minimal context
- Add context when results are too generic`
    },
    {
      moduleId: module2.id,
      courseId: course.id,
      title: 'Defining the Output',
      orderNum: 3,
      durationMinutes: 25,
      content: `Controlling the format of responses ensures you receive information in the form you can actually use. Output definition reduces time spent reformatting and increases immediate utility.

**Why Output Definition Matters**

The same information can be presented in many ways:

- Flowing paragraphs
- Bullet points
- Numbered lists
- Tables
- Step-by-step instructions
- Question and answer format
- Comparison charts

Each format serves different purposes. Choosing the right format makes the response immediately useful.

**Format Types and Their Uses**

Paragraphs work well for:
- Explanatory content
- Persuasive writing
- Narrative flow
- Complex ideas that require transitions

Bullet points work well for:
- Quick reference
- Lists of options
- Feature breakdowns
- Scanning for specific information

Numbered lists work well for:
- Sequential processes
- Ranked items
- Instructions
- Prioritized recommendations

Tables work well for:
- Comparisons
- Data presentation
- Multiple attributes of multiple items
- Quick lookups

**Specifying Length**

Define how long the response should be:

- Word count: "Write 300 words"
- Paragraph count: "Keep it to three paragraphs"
- Item count: "List ten ideas"
- Time reference: "Write a script for a two-minute presentation"

Length specifications prevent overly brief or excessively long responses.

**Specifying Structure**

Describe how the content should be organized:

"Start with an overview, then cover three main points, then conclude with next steps."

"Begin with the definition, follow with three examples, then explain common misconceptions."

Structure guidance helps the AI organize information logically for your purpose.

**Specifying Style and Tone**

The same information can be delivered differently:

- Formal or casual
- Technical or accessible
- Serious or lighthearted
- Concise or detailed

"Write in a conversational tone" produces different results than "write in formal academic style."

**Examples of Output Definition**

Vague: "Tell me about project management."
Defined: "Provide a bulleted list of seven core project management principles, with a one-sentence explanation for each, suitable for a beginner's guide."

Vague: "Explain data analysis."
Defined: "Write a two-paragraph introduction to data analysis for business students. The first paragraph should define what it is. The second should explain why it matters in modern business."

Vague: "Give me recipe ideas."
Defined: "Create a table of five dinner recipes with columns for recipe name, main protein, preparation time, and difficulty level."

**Combining Format Specifications**

You can combine multiple format elements:

"Write a 200-word summary in three paragraphs. Use formal language. End with a question for further reflection."

"Create a numbered list of eight steps for setting up a home office. Each step should have a brief heading followed by one to two sentences of explanation."

**When Format Matters Most**

Format definition is especially important when:

- You will use the output directly without editing
- The response will be part of a larger document
- Multiple people need to understand the information
- You have specific presentation requirements

**Key Takeaways**

- Different formats serve different purposes
- Specify format to receive immediately usable responses
- Define length to get appropriate depth
- Describe structure for logical organization
- Match tone and style to your audience and purpose
- Combine format specifications for precise results`
    },
    {
      moduleId: module2.id,
      courseId: course.id,
      title: 'Setting Constraints',
      orderNum: 4,
      durationMinutes: 25,
      content: `Constraints narrow the response space to exactly what you need. By telling the AI what to avoid or limit, you guide it away from unhelpful territory.

**What Constraints Accomplish**

Without constraints, AI may:
- Include information you do not need
- Use approaches you do not want
- Address audiences different from yours
- Make assumptions that do not fit your situation

Constraints eliminate these problems by setting boundaries.

**Types of Constraints**

Content constraints:
- "Do not include technical jargon"
- "Focus only on free options"
- "Exclude anything requiring special equipment"

Length constraints:
- "Keep each point under 50 words"
- "No more than five items"
- "Maximum three sentences per section"

Scope constraints:
- "Only cover the basics"
- "Limit to events from the past decade"
- "Focus on the United States market"

Style constraints:
- "Avoid humor"
- "Do not use first person"
- "Keep the tone neutral"

**Negative Constraints**

Sometimes defining what you do not want is clearer than defining what you want:

"List outdoor activities that do not require expensive equipment."
"Explain investment options excluding cryptocurrency."
"Describe marketing strategies that do not rely on social media."

Negative constraints efficiently eliminate unwanted directions.

**Positive Constraints**

Other times, specifying requirements works better:

"Only include peer-reviewed sources."
"Each example must be from the technology sector."
"All suggestions must be implementable within one week."

Positive constraints ensure essential elements are included.

**Balancing Constraints**

Too few constraints: Responses may be too broad or include irrelevant content.

Too many constraints: Responses may become artificially limited or the AI may struggle to meet all requirements simultaneously.

Start with constraints you know matter. Add more if responses are still too broad. Remove constraints that seem unnecessary.

**Constraints in Practice**

Weak: "Give me presentation tips."
Constrained: "Give me five presentation tips specifically for virtual meetings. Exclude any tips about in-person body language. Focus on keeping audience attention."

Weak: "Write a product description."
Constrained: "Write a product description under 100 words. Do not use superlatives like 'best' or 'amazing.' Avoid mentioning competitor products. Focus on practical benefits."

Weak: "Explain climate change."
Constrained: "Explain climate change for a business audience. Avoid political arguments. Focus on impacts relevant to supply chain management. Keep under 300 words."

**Implicit vs Explicit Constraints**

Some constraints are implicit in context. If you ask for "beginner-friendly" content, you implicitly constrain against advanced material.

Making constraints explicit reduces misunderstanding:

Implicit: "Explain programming to a child."
Explicit: "Explain programming to a 10-year-old. Avoid technical terms. Use everyday analogies. Keep sentences short and simple."

Both might work, but explicit constraints give clearer guidance.

**When Constraints Help Most**

Use constraints when:
- Past responses included unwanted content
- You have specific requirements that might not be assumed
- The topic is broad and needs narrowing
- You need to match existing style or format requirements

**Key Takeaways**

- Constraints narrow responses to what you actually need
- Use content, length, scope, and style constraints
- Both positive and negative constraints work
- Balance thoroughness with practicality
- Make implicit constraints explicit when clarity matters`
    },
    {
      moduleId: module2.id,
      courseId: course.id,
      title: 'Prompt Length Balance',
      orderNum: 5,
      durationMinutes: 20,
      content: `Finding the right prompt length matters. Too short and you leave too much to interpretation. Too long and you risk confusion or buried key points.

**The Problem with Too Short**

Very brief prompts force the AI to make assumptions:

"Marketing tips" could be about:
- Digital marketing or traditional marketing
- B2B or B2C
- Any industry or specific sectors
- Beginners or experienced marketers

The AI picks something. It might not be what you wanted.

Short prompts waste time through iteration. You go back and forth, gradually adding the information you should have included initially.

**The Problem with Too Long**

Extremely long prompts create different issues:

- Important information gets buried
- Contradictions may appear unintentionally
- The AI may focus on the wrong parts
- Processing becomes less reliable

There is a point of diminishing returns. Adding more detail beyond what is needed does not improve results.

**Finding the Balance**

Good prompt length includes:
- Everything necessary for understanding
- Nothing that adds no value

This varies by request. A simple factual question needs less than a complex creative task.

**Length Guidelines by Task Type**

Factual questions: Often one to two sentences
"What is the capital of Australia?"
"Who invented the telephone and in what year?"

Explanatory requests: Usually two to four sentences
"Explain the difference between weather and climate. Include a simple example of each. Write for a general audience."

Creative tasks: Often three to six sentences
"Write a short story opening about a detective who discovers something unexpected at a crime scene. The setting should be 1920s Chicago. The tone should be noir. Keep it under 200 words."

Complex professional tasks: May be longer
"Draft a proposal for a company wellness program. The company has 200 employees across three locations. Budget is approximately $50,000 annually. Focus on mental health support and physical fitness options. Include implementation timeline and success metrics. Format as a one-page executive summary."

**Structure for Longer Prompts**

When prompts must be long, structure helps:

1. Lead with the main request
2. Follow with key context
3. Add specifications and constraints
4. End with format requirements

This structure ensures the AI grasps the core request even if it processes the middle sections with less attention.

**Editing for Clarity**

After writing a prompt, review it:

- Can any sentences be removed without losing meaning?
- Are there redundant points?
- Is the main request immediately clear?
- Does every element serve a purpose?

Trim what does not contribute. Strengthen what remains.

**Practice with Intention**

As you write more prompts, notice patterns:

- When do short prompts work?
- When do you need more detail?
- What happens when you include too much?

This awareness develops intuition for appropriate length.

**Key Takeaways**

- Too short leaves too much to interpretation
- Too long buries key information
- Match length to task complexity
- Structure longer prompts for clarity
- Edit to remove what does not serve the request
- Develop intuition through practice`
    }
  ]);

  console.log('✅ Created Module 2: Prompt Structure Basics with 5 lessons');

  // Module 3: Writing Better Prompts
  const [module3] = await db.insert(modules).values({
    courseId: course.id,
    title: 'Writing Better Prompts',
    description: 'Improve clarity and results with better wording.',
    orderNum: 3
  }).returning();

  await db.insert(lessons).values([
    {
      moduleId: module3.id,
      courseId: course.id,
      title: 'Using Simple Language',
      orderNum: 1,
      durationMinutes: 20,
      content: `Simple language produces clear results. When you write prompts in plain English, the AI understands your intent more reliably.

**Why Simplicity Works**

AI systems process language statistically. Common, clear phrases have strong patterns in training data. Unusual or overly complex phrasing has weaker patterns, leading to less predictable responses.

Simple language also reduces your own errors. When you write clearly, you are more likely to notice gaps or ambiguities before submitting.

**Characteristics of Simple Language**

Short sentences: Each sentence expresses one idea.
Common words: Use everyday vocabulary when possible.
Active voice: Subject does the action directly.
Concrete terms: Specific beats abstract.

**Transforming Complex to Simple**

Complex: "It would be beneficial to facilitate an understanding of the methodologies employed in contemporary project management frameworks."

Simple: "Explain the main methods used in modern project management."

Both ask for the same thing. The simple version is clearer and more likely to produce a focused response.

**Vocabulary Choices**

Instead of: utilize → use
Instead of: endeavor → try
Instead of: facilitate → help
Instead of: subsequent → next
Instead of: prior to → before
Instead of: in order to → to
Instead of: due to the fact that → because

These substitutions make prompts more direct without losing meaning.

**Sentence Structure**

Avoid nested clauses that require mental untangling:

Complex: "The report, which was prepared by the team that was assembled last quarter and which includes findings from the survey that was distributed in March, should be summarized."

Simple: "Summarize the team report that includes findings from the March survey."

The simple version conveys the same request with less processing required.

**Technical Terms**

Use technical terms when they add precision and you expect the AI to understand them. Avoid jargon when simpler words would work.

If you must use technical terms, you can define them briefly:

"Explain liquidity (how easily assets can be converted to cash) for someone new to investing."

**Conversational Test**

Read your prompt as if speaking to a capable colleague. Would you actually say it this way? If it sounds stilted or formal, simplify.

Prompts that sound natural tend to produce more natural responses.

**When Complexity Is Necessary**

Some topics genuinely require precise terminology. Legal, medical, and technical fields often need specific terms for accuracy.

In these cases, use the necessary terms but keep the overall structure simple:

"Define the legal concept of 'force majeure' and explain when it typically applies in commercial contracts. Use one paragraph."

The term is technical, but the request is straightforward.

**Key Takeaways**

- Simple language produces more reliable results
- Use common words, short sentences, and active voice
- Replace complex vocabulary with everyday alternatives
- Read prompts aloud to check for naturalness
- Use technical terms only when they add necessary precision`
    },
    {
      moduleId: module3.id,
      courseId: course.id,
      title: 'Avoiding Ambiguity',
      orderNum: 2,
      durationMinutes: 25,
      content: `Ambiguous prompts create confusion. When your words can be interpreted multiple ways, the AI chooses one interpretation that may not match your intent.

**Sources of Ambiguity**

Vague quantifiers: "some," "many," "a few"
Unclear references: "it," "this," "that" without clear antecedents
Multiple meanings: words that have different definitions
Assumed context: information you know but did not include

**Vague Quantifiers**

These words mean different things to different people:

"Give me some examples" - How many? Two? Ten?
"List a few options" - Three options? Five?
"Provide several points" - Where does "several" end?

Use specific numbers instead:
"Give me five examples"
"List three options"
"Provide seven points"

**Unclear References**

Pronouns can confuse:

Ambiguous: "Compare marketing and sales teams. Explain why they are more important."
Which team is "they"? Marketing? Sales? Both?

Clear: "Compare marketing and sales teams. Explain why the marketing team is more important to early-stage startups."

**Multiple Meanings**

Some words have different meanings depending on context:

"Bank" - financial institution or river edge
"Python" - programming language or snake
"Apple" - fruit or technology company
"Current" - present time or electrical flow

Add context that clarifies your intended meaning:
"Write about the Python programming language"
"Explain Apple's product design philosophy"

**Assumed Context**

You know things the AI does not:

Ambiguous: "Help me prepare for the meeting."
What meeting? With whom? What preparation is needed?

Clear: "Help me prepare talking points for a sales meeting with a potential client in the healthcare industry. The meeting is about our data security services."

**Testing for Ambiguity**

After writing a prompt, ask:
- Could someone misunderstand this?
- Are there words with multiple meanings?
- Have I assumed any context?
- Are my quantities specific?

If you answer yes to any of these, revise for clarity.

**The Stranger Test**

Imagine showing your prompt to a stranger. Would they understand exactly what you want? The AI is essentially a stranger to your situation. It knows nothing beyond what you tell it.

What would the stranger need to know? Include that information.

**Examples of Disambiguation**

Ambiguous: "Write about leadership."
Clear: "Write a 300-word article about leadership skills needed by first-time managers in technology companies."

Ambiguous: "Fix this problem."
Clear: "The problem is that customers are abandoning their shopping carts before checkout. Suggest three solutions to reduce cart abandonment rates."

Ambiguous: "Create a report."
Clear: "Create a one-page report summarizing quarterly sales performance. Include revenue, units sold, and top-performing products. Format as bullet points with a brief executive summary at the top."

**When Ambiguity Is Acceptable**

For exploratory requests, some openness is fine:
"What are interesting applications of blockchain technology?"

Here, you want the AI to interpret "interesting" broadly. You are exploring, not seeking specific information.

But for specific tasks, eliminate ambiguity.

**Key Takeaways**

- Ambiguity forces the AI to guess your intent
- Replace vague quantifiers with specific numbers
- Clarify pronouns and references
- Add context to resolve multiple meanings
- Test prompts by imagining a stranger reading them`
    },
    {
      moduleId: module3.id,
      courseId: course.id,
      title: 'Step-by-Step Prompts',
      orderNum: 3,
      durationMinutes: 25,
      content: `Step-by-step prompting guides the AI through complex tasks. By breaking down what you want into sequential parts, you get more organized and complete responses.

**When Step-by-Step Helps**

Multi-part tasks: When you need several things done in order.
Complex analysis: When you want structured thinking.
Processes: When you need instructions for doing something.
Comprehensive coverage: When you want to ensure nothing is missed.

**Structure of Step-by-Step Prompts**

You can request steps explicitly:

"Explain how to change a tire. Present the process as numbered steps. Include any necessary preparation steps before starting and safety checks after finishing."

Or you can structure your prompt in steps:

"Complete these steps:
1. Define what a business plan is
2. List the main sections of a typical business plan
3. Explain why each section matters
4. Provide one tip for writing each section"

**Benefits of Numbered Steps**

Numbered steps create clear organization:
- You can reference specific steps later
- The AI follows a logical sequence
- Nothing gets skipped
- The response is easy to scan

**First, Then, Finally Structure**

For simpler processes, transitional words work well:

"First explain what machine learning is. Then describe three common applications. Finally, discuss one limitation of current machine learning systems."

This creates flow while maintaining structure.

**Requesting Process Explanations**

When you need instructions, be explicit about format:

"Explain how to set up a monthly budget. Use numbered steps. Start from gathering financial information and end with reviewing and adjusting the budget. Include approximately five to seven steps."

**Guiding Analysis**

Step-by-step prompting works well for analysis tasks:

"Analyze this marketing strategy in three parts:
1. Identify strengths and what is working well
2. Identify weaknesses or gaps
3. Suggest two specific improvements"

This ensures balanced analysis rather than scattered observations.

**Building on Previous Steps**

You can make later steps depend on earlier ones:

"Step 1: Define the concept of sustainable business practices.
Step 2: Based on that definition, list five examples of sustainable practices in retail.
Step 3: For each example from step 2, explain one challenge of implementation."

Each step builds on the previous one, creating connected content.

**Avoiding Over-Complication**

Do not create unnecessary steps. If something can be done simply, let it be simple.

Over-engineered: "Step 1: Consider what a good email subject line is. Step 2: Think about the purpose of this email. Step 3: Draft three possible subject lines. Step 4: Evaluate each subject line. Step 5: Select the best one and explain why."

Simpler: "Write three email subject lines for a follow-up after a sales meeting. Briefly explain why each would be effective."

**Practical Examples**

For learning:
"Explain photosynthesis in four steps: 1. What is captured from sunlight. 2. What is absorbed from the environment. 3. What process converts these inputs. 4. What is produced as output."

For task completion:
"Help me write a cover letter by completing these steps: 1. Create an opening paragraph that mentions the specific job and company. 2. Write a middle paragraph highlighting relevant experience. 3. Add a paragraph about why this company interests me. 4. End with a professional closing and call to action."

**Key Takeaways**

- Step-by-step prompts organize complex tasks
- Use numbered steps for clear structure
- Transitional words work for simpler processes
- Each step can build on previous ones
- Avoid over-complicating simple requests`
    },
    {
      moduleId: module3.id,
      courseId: course.id,
      title: 'Examples in Prompts',
      orderNum: 4,
      durationMinutes: 25,
      content: `Including examples in your prompts shows the AI exactly what you want. Examples communicate more precisely than descriptions alone.

**Why Examples Work**

Examples demonstrate rather than describe. When you show the AI what you want, it can pattern-match more accurately than when you only tell it.

This is especially useful for:
- Specific formats
- Particular tones or styles
- Unusual requirements
- Creative patterns

**One-Shot Examples**

A single example can clarify your intent:

"Write product descriptions in this style:

Example: 'The CloudStep running shoe delivers lightweight comfort for daily training. Breathable mesh upper keeps feet cool during long runs. Responsive foam cushioning provides energy return with every stride.'

Now write a similar description for hiking boots."

The example shows format, length, tone, and focus. The AI can replicate these elements.

**Few-Shot Examples**

Multiple examples strengthen the pattern:

"Rewrite these technical terms in plain language.

Example 1: 'Latency' becomes 'Delay in response time'
Example 2: 'Bandwidth' becomes 'Data transfer capacity'
Example 3: 'Protocol' becomes 'Set of communication rules'

Now rewrite: 'Encryption', 'Cache', 'Firewall'"

Multiple examples establish a consistent pattern the AI can follow.

**Format Examples**

For specific output formats, examples are clearer than descriptions:

"Create entries in this format:

Term: [word]
Definition: [one sentence]
Example sentence: [usage in context]

Example:
Term: Synergy
Definition: The combined effect is greater than separate individual effects.
Example sentence: The marketing and sales teams achieved synergy by coordinating their customer outreach.

Now create entries for: Paradigm, Benchmark, Stakeholder"

**Tone and Style Examples**

Examples communicate tone better than adjectives:

"Write social media posts in this style:

Example: 'Monday motivation: Small progress is still progress. What tiny step can you take today toward your biggest goal?'

The style should be encouraging, use informal punctuation, and end with a question. Write three posts about time management."

**When to Use Examples**

Examples add most value when:
- Your requirements are specific or unusual
- Describing the desired output is difficult
- Previous attempts without examples missed the mark
- Consistency across multiple outputs matters

**Creating Good Examples**

Good examples are:
- Clear and representative
- Appropriate in length and complexity
- Free of errors you do not want replicated
- Demonstrative of key features you care about

If your example has flaws, the AI may replicate those flaws.

**Limiting Over-Dependence**

Too many examples can be constraining. The AI may follow examples too literally, reducing creativity when you want some variation.

Balance structure with flexibility. Use enough examples to clarify, not so many that you eliminate useful variation.

**Combining Examples with Instructions**

Examples work best alongside explicit instructions:

"Write newsletter subject lines that create curiosity without being clickbait.

Examples:
- 'The mistake most new managers make (and how to avoid it)'
- 'Why our approach to productivity is backwards'
- 'What I learned from analyzing 100 successful launches'

Guidelines: Keep under 60 characters. Avoid exclamation marks. Focus on providing genuine value.

Write five subject lines for a newsletter about personal finance."

**Key Takeaways**

- Examples show rather than tell
- One example can clarify; multiple examples strengthen patterns
- Examples communicate format, tone, and style effectively
- Create clear, representative examples without flaws
- Combine examples with explicit instructions for best results`
    },
    {
      moduleId: module3.id,
      courseId: course.id,
      title: 'Prompt Refinement',
      orderNum: 5,
      durationMinutes: 25,
      content: `Improving prompts through iteration is a normal and effective practice. Rarely does the first prompt produce the perfect result. Refinement gets you there.

**The Refinement Process**

1. Write your initial prompt
2. Evaluate the response
3. Identify what is missing or wrong
4. Adjust the prompt
5. Try again

This cycle may repeat several times for complex requests. Each iteration gets you closer to what you need.

**Diagnosing Problems**

When a response is not right, ask:

Is it too broad? Add constraints or specifics.
Is it too narrow? Reduce restrictions.
Wrong tone? Specify the desired tone explicitly.
Wrong format? Add format requirements.
Missing key elements? Add those elements to the prompt.
Including unwanted elements? Add exclusion constraints.

Diagnosis determines how to adjust.

**Common Adjustments**

Adding specificity: "Write about marketing" becomes "Write about email marketing for small e-commerce businesses."

Adjusting scope: "Provide comprehensive analysis" becomes "Provide a brief overview of key points."

Clarifying audience: "Explain machine learning" becomes "Explain machine learning to a business executive with no technical background."

Changing format: "Discuss three strategies" becomes "List three strategies as bullet points with brief explanations."

**Building on Responses**

Sometimes you can refine by building on what the AI produced:

"That is good, but make it more concise."
"Expand the second point with an example."
"Rewrite this in a more formal tone."

These follow-up prompts adjust without starting over.

**Keeping What Works**

When parts of a response are right, preserve them:

"The introduction and structure are good. Rewrite only the third paragraph to include specific statistics about market growth."

This targeted refinement saves time and maintains what is already working.

**Learning from Refinement**

Pay attention to what adjustments you commonly make. If you often need to add specifics, start including more detail in initial prompts. If you frequently adjust tone, make tone specification a habit.

Your refinements teach you about your prompting patterns.

**Knowing When to Stop**

Not every response needs to be perfect. Consider:

- Is the response good enough for its purpose?
- Does further refinement cost more time than manual editing?
- Are you seeking perfection when adequacy would suffice?

Sometimes accepting a good response and making small manual adjustments is more efficient than continued iteration.

**Starting Fresh**

Sometimes refinement hits a wall. The conversation has accumulated context that confuses subsequent responses. In these cases, start a new conversation with a fresh, improved prompt incorporating everything you learned.

**Documentation for Future Use**

When you develop a prompt that works well, save it. Good prompts are reusable. Building a personal library of effective prompts saves time on recurring tasks.

Note what makes each prompt work. This accelerates your improvement.

**Key Takeaways**

- Refinement through iteration is normal and effective
- Diagnose problems to determine the right adjustment
- Build on responses rather than always starting over
- Learn from your refinement patterns
- Know when good enough is sufficient
- Save effective prompts for reuse`
    }
  ]);

  console.log('✅ Created Module 3: Writing Better Prompts with 5 lessons');

  // Module 4: Prompting for Daily Tasks
  const [module4] = await db.insert(modules).values({
    courseId: course.id,
    title: 'Prompting for Daily Tasks',
    description: 'Apply prompts to real-life tasks.',
    orderNum: 4
  }).returning();

  await db.insert(lessons).values([
    {
      moduleId: module4.id,
      courseId: course.id,
      title: 'Prompts for Writing',
      orderNum: 1,
      durationMinutes: 25,
      content: `Writing is one of the most common uses for prompts. From drafting to editing, prompts can improve your writing workflow.

**Generating First Drafts**

Starting is often the hardest part. Prompts can create a foundation to build on:

"Write a first draft for a blog post about time management for remote workers. Include an introduction, three main tips, and a conclusion. The tone should be practical and encouraging. Approximately 500 words."

You now have something to work with rather than a blank page.

**Overcoming Writer's Block**

When stuck, prompts can generate ideas:

"I am writing an article about sustainable fashion. I have covered eco-friendly materials and ethical manufacturing. What other angles could I explore? List five possibilities."

Or generate specific content:

"I need to write a paragraph explaining why consumers should care about supply chain transparency in fashion. Write three different versions with different approaches."

**Improving Existing Writing**

Prompts can refine what you have written:

"Here is my paragraph: [your text]. Rewrite it to be more concise while keeping the main points."

"Here is my introduction: [your text]. Make it more engaging and add a hook to draw readers in."

"Here is my conclusion: [your text]. Strengthen the call to action and make the ending more memorable."

**Editing and Proofreading**

Use prompts for technical improvements:

"Check this paragraph for grammatical errors and awkward phrasing: [your text]"

"Simplify this text for a general audience, removing jargon and complex sentences: [your text]"

"This paragraph is too long. Break it into smaller paragraphs with clear transitions: [your text]"

**Format Transformation**

Convert content between formats:

"Turn these bullet points into flowing paragraphs: [your bullets]"

"Convert this paragraph into a bulleted list of key points: [your paragraph]"

"Reformat this content as a numbered step-by-step guide: [your content]"

**Writing Different Types**

Adapt prompts for various writing tasks:

For emails: "Write a professional email requesting a deadline extension. The project is delayed due to unexpected technical issues. The tone should be apologetic but confident."

For reports: "Write an executive summary for a quarterly sales report. Total revenue was $1.2M, up 15% from last quarter. Include three key highlights and one challenge."

For social media: "Write three tweet-length messages promoting a webinar about digital marketing. Each should have a different angle."

**Tailoring Voice and Tone**

Match your personal or brand voice:

"Rewrite this product description in a more casual, conversational tone: [your text]"

"Adjust this message to be more formal and appropriate for a CEO audience: [your text]"

"Make this more empathetic and understanding without being unprofessional: [your text]"

**Generating Outlines**

Before writing, prompts can create structure:

"Create an outline for a white paper about implementing remote work policies. Include major sections and key points for each section."

You then fill in the outline with your own content.

**Key Takeaways**

- Prompts can generate first drafts to overcome blank page syndrome
- Use prompts to explore angles when stuck
- Refine existing writing with targeted prompts
- Transform formats to repurpose content
- Match voice and tone to your needs
- Create outlines for structured writing`
    },
    {
      moduleId: module4.id,
      courseId: course.id,
      title: 'Prompts for Learning',
      orderNum: 2,
      durationMinutes: 25,
      content: `Prompts can accelerate and deepen learning. They help you understand concepts, test knowledge, and explore topics systematically.

**Understanding New Concepts**

Start with clear explanations:

"Explain compound interest to someone who has never invested before. Use a simple example with actual numbers."

"What is cognitive behavioral therapy? Explain the basic principles and how it differs from other therapy approaches."

"Describe the water cycle. Use simple language suitable for teaching a child."

**Building on Prior Knowledge**

Connect new information to what you already know:

"I understand basic economics. Explain how monetary policy affects inflation, building on supply and demand concepts."

"I am familiar with HTML and CSS. What is the logical next step in web development, and how do these technologies connect?"

**Learning Through Analogies**

Analogies make abstract concepts concrete:

"Explain how a computer network works using an analogy to postal mail."

"Compare the human immune system to something from everyday life that would help a non-scientist understand it."

"Explain machine learning using a cooking or recipe analogy."

**Testing Your Understanding**

Create quizzes for yourself:

"Generate five multiple choice questions about photosynthesis to test my understanding. Provide answers separately."

"Create three scenario-based questions about project management principles. After I answer, explain whether I am correct."

**Filling Knowledge Gaps**

Identify and address what you do not know:

"I am learning about climate change. What are the most important concepts a beginner should understand? List them in order of importance."

"What are common misconceptions about nutrition? Explain what is actually true for each one."

**Different Perspectives**

Explore topics from multiple angles:

"Explain the pros and cons of remote work from both the employer and employee perspectives."

"How would a historian, an economist, and a sociologist each explain the causes of the Industrial Revolution?"

**Structured Learning Paths**

Create study plans:

"I want to learn basic data analysis in three months. Create a week-by-week learning plan with specific topics and goals for each week."

"What should I learn before attempting to understand quantum computing? List prerequisites in the order I should study them."

**Summarizing and Reviewing**

Consolidate what you have learned:

"Summarize the key points of this article in five bullet points: [paste article or description]"

"I just finished a chapter on behavioral economics. What are the five main takeaways I should remember?"

**Practice Problems**

Generate practice material:

"Create five practice problems about calculating percentages in real-world contexts like discounts and tips."

"Give me three case studies to analyze for understanding business ethics principles. Include questions to consider for each."

**Explaining to Learn**

Teaching reinforces understanding:

"I think I understand how blockchain works. I will explain it, and you tell me if I have any misconceptions: [your explanation]"

**Key Takeaways**

- Request explanations at your level
- Use analogies to understand abstract concepts
- Test yourself with generated questions
- Explore topics from multiple perspectives
- Create structured learning paths
- Consolidate learning through summarization`
    },
    {
      moduleId: module4.id,
      courseId: course.id,
      title: 'Prompts for Research',
      orderNum: 3,
      durationMinutes: 25,
      content: `Prompts help organize and accelerate research. They can identify sources, summarize information, and structure findings.

**Defining Research Questions**

Start by clarifying what you want to learn:

"I am researching sustainable packaging for a small food business. What are the key questions I should be investigating?"

"Help me narrow down my research topic. I am interested in remote work but the topic is too broad. Suggest five specific angles I could focus on."

**Finding Sources and Starting Points**

Get direction for where to look:

"What types of sources would be most useful for researching the history of renewable energy adoption? Where would I find these sources?"

"I need to research consumer behavior trends. What databases, publications, or organizations typically publish this type of data?"

**Understanding Background Information**

Build foundational knowledge:

"Give me an overview of the key developments in artificial intelligence over the past decade. Focus on practical applications rather than technical details."

"What should I understand about supply chain management before researching supply chain disruptions?"

**Organizing Information**

Structure what you find:

"I have collected information about three different marketing strategies. Help me create a comparison framework with criteria to evaluate each."

"What categories should I use to organize research about employee wellness programs? Suggest a logical structure."

**Summarizing Sources**

Condense lengthy material:

"Summarize the main arguments in this research paper abstract: [paste abstract]"

"I am reading about economic indicators. What are the five most important points I should extract from typical articles on this topic?"

**Identifying Gaps**

Find what you might be missing:

"I have researched the benefits of plant-based diets. What counterarguments or limitations should I also investigate?"

"Looking at this outline of my research: [outline]. What important areas might I be missing?"

**Generating Questions for Interviews**

Prepare for primary research:

"I am interviewing a small business owner about their experience with digital marketing. Generate ten thoughtful questions that would yield useful insights."

**Synthesizing Findings**

Bring information together:

"I have researched three different approaches to inventory management. Help me write a synthesis that compares them and identifies which situations each is best suited for."

**Fact-Checking Considerations**

Understand limitations:

When using AI for research support, remember that AI may have outdated information or make errors. Always verify important facts through primary sources.

Use prompts like: "What claims in this area are commonly debated or contested?"

This helps you identify what requires additional verification.

**Creating Research Plans**

Structure your process:

"I need to research competitors in the fitness app market. Create a research plan with specific steps, types of information to gather, and how to organize my findings."

**Key Takeaways**

- Use prompts to clarify research questions
- Get direction for finding appropriate sources
- Organize information with frameworks and categories
- Summarize and synthesize findings
- Identify gaps in your research
- Always verify important facts independently`
    },
    {
      moduleId: module4.id,
      courseId: course.id,
      title: 'Prompts for Planning',
      orderNum: 4,
      durationMinutes: 25,
      content: `Prompts assist with planning tasks of all sizes. From daily schedules to complex projects, prompts help organize thoughts and create actionable plans.

**Daily and Weekly Planning**

Organize your time:

"I have these tasks for tomorrow: [list tasks]. Organize them into a realistic daily schedule. Assume I work from 9 AM to 5 PM with an hour lunch break."

"Create a weekly study schedule for someone preparing for a certification exam while working full time. Include specific time blocks and what to focus on each day."

**Project Planning**

Break down larger efforts:

"I am launching a small online store. Create a project plan with phases, key tasks, and estimated timeframes. Assume I am doing this part-time."

"Break down the task of writing a 50-page report into manageable steps with milestones. Include research, drafting, editing, and formatting phases."

**Goal Setting**

Define and structure goals:

"I want to improve my public speaking skills. Help me create three specific, measurable goals with realistic timeframes."

"Take my vague goal of 'getting healthier' and turn it into three concrete, actionable goals with specific criteria for success."

**Decision Frameworks**

Structure important decisions:

"I am deciding between two job offers. What criteria should I consider? Create a decision matrix template I can fill in."

"Help me think through whether to pursue a graduate degree. What questions should I answer before making this decision?"

**Event Planning**

Organize events:

"Create a planning checklist for a team offsite meeting for 20 people. Include logistics, agenda items, and follow-up tasks."

"What steps are involved in organizing a small conference or workshop? List tasks in the order they should be completed."

**Budget Planning**

Organize finances:

"Create a template for a monthly personal budget. Include common expense categories and a section for savings goals."

"I am planning a vacation with a $3000 budget. What categories should I budget for, and what percentage would you suggest for each?"

**Contingency Planning**

Prepare for problems:

"What could go wrong with a product launch? List potential issues and suggest how to prepare for each."

"I am planning an outdoor event. What weather-related contingencies should I have ready?"

**Prioritization**

Decide what matters most:

"I have ten tasks on my list but can only complete five today. Here they are: [list]. Help me prioritize based on urgency and importance."

"What criteria should I use to prioritize features for a new app when I cannot build everything at once?"

**Timeline Creation**

Sequence activities:

"Create a timeline for writing a business plan. Include major sections and realistic time estimates for each."

"I have three months before a career change. Create a month-by-month plan for preparing."

**Resource Planning**

Identify what you need:

"What resources would I need to learn web development on my own? Include tools, learning materials, and time estimates."

"I am starting a home garden. What supplies and equipment do I need? Organize by priority."

**Key Takeaways**

- Prompts help organize daily, weekly, and project planning
- Use prompts to break down goals into actionable steps
- Create decision frameworks for important choices
- Plan for contingencies and potential problems
- Prioritize when you cannot do everything
- Identify resources needed for success`
    },
    {
      moduleId: module4.id,
      courseId: course.id,
      title: 'Productivity Prompts',
      orderNum: 5,
      durationMinutes: 20,
      content: `Smart prompts save time on recurring tasks. Building a collection of productivity prompts multiplies your efficiency.

**Template Creation**

Generate reusable templates:

"Create a template for a weekly status update email. Include sections for accomplishments, upcoming work, and blockers."

"Design a template for client meeting notes. Include sections for attendees, key discussion points, decisions made, and action items."

**Quick Summaries**

Condense information rapidly:

"Summarize this long email in three bullet points: [paste email]"

"What are the key decisions in this meeting transcript? List only the decisions with who is responsible: [paste transcript or description]"

**Format Conversion**

Transform content quickly:

"Convert this meeting agenda into calendar event descriptions with time blocks: [paste agenda]"

"Turn these rough notes into a polished bulleted summary: [paste notes]"

**Batch Processing**

Handle multiple items at once:

"Write brief responses to these five customer inquiries. Keep each under 50 words: [list inquiries]"

"Create social media captions for these five product photos. Vary the style: [list products or descriptions]"

**Brainstorming on Demand**

Generate ideas quickly:

"Give me ten headline ideas for an article about remote work productivity."

"List eight possible names for a productivity app focused on task management."

**Quick Calculations and Conversions**

Handle computations:

"If a project has 40 tasks and we complete 3 per day, how many work days will it take to finish?"

"Convert these meeting times to different time zones: 9 AM Eastern to Pacific, Central, and GMT."

**Routine Communication**

Draft common messages:

"Write a brief, polite response declining a meeting invitation due to a scheduling conflict."

"Draft a thank you message for receiving helpful advice from a colleague."

**Checklist Generation**

Create action lists:

"Create a checklist for preparing a presentation. Include research, content creation, visuals, practice, and technical setup."

"What should I check before sending an important email? Create a quick review checklist."

**Information Extraction**

Pull out key data:

"From this product description, extract: name, price, key features, and target audience: [paste description]"

"List all dates and deadlines mentioned in this project brief: [paste brief]"

**Reframing and Rephrasing**

Adjust tone quickly:

"Make this feedback more constructive and less critical: [paste original]"

"Rewrite this casual message in a more professional tone: [paste message]"

**Automation Opportunities**

Identify prompts to reuse:

When you find a prompt that works well for a recurring task, save it. Build a personal library organized by task type.

Common categories:
- Email templates
- Report formats  
- Meeting preparation
- Status updates
- Feedback delivery

**Key Takeaways**

- Create templates for recurring communication
- Use prompts for quick summarization and formatting
- Batch similar tasks for efficiency
- Generate ideas rapidly when needed
- Build a personal library of effective prompts
- Identify which prompts to reuse regularly`
    }
  ]);

  console.log('✅ Created Module 4: Prompting for Daily Tasks with 5 lessons');

  // Module 5: Prompting for Work and Business
  const [module5] = await db.insert(modules).values({
    courseId: course.id,
    title: 'Prompting for Work and Business',
    description: 'Use prompts professionally.',
    orderNum: 5
  }).returning();

  await db.insert(lessons).values([
    {
      moduleId: module5.id,
      courseId: course.id,
      title: 'Email Writing Prompts',
      orderNum: 1,
      durationMinutes: 25,
      content: `Professional email communication is a frequent use case. Prompts help draft, refine, and respond to emails effectively.

**Drafting Professional Emails**

Start with clear requirements:

"Write a professional email to a client informing them that their project will be delivered on Friday instead of Wednesday. Express understanding of the inconvenience and emphasize our commitment to quality."

"Draft an email to my team announcing a new policy about remote work. The policy allows two remote days per week. Keep the tone positive and address likely questions."

**Email Tone Adjustment**

Match tone to situation:

"Rewrite this email to be more diplomatic. The message needs to deliver critical feedback without damaging the relationship: [paste email]"

"Make this email more direct. The current version is too long and the request is buried: [paste email]"

**Responding to Difficult Emails**

Navigate challenging situations:

"I received a complaint email from an unhappy customer about delayed shipping. Help me write a response that acknowledges their frustration, explains the situation briefly, and offers a concrete solution."

"A colleague sent an email that felt passive-aggressive. Write a professional response that addresses the underlying concern without escalating tension."

**Follow-Up Emails**

Maintain communication:

"Write a follow-up email for a job interview I had last week. Express continued interest and ask about next steps."

"Draft a polite follow-up to a proposal I sent two weeks ago. I have not received a response."

**Email Structure**

Organize complex messages:

"This email covers multiple topics. Restructure it with clear sections and bullet points so recipients can scan for relevant information: [paste email]"

"My email is too long. Condense it to under 150 words while keeping all essential information: [paste email]"

**Subject Lines**

Create effective openings:

"Write five subject lines for an email requesting a meeting with a potential client about partnership opportunities."

"My email is about budget approvals being due next Friday. What subject line would ensure recipients open and act on this email?"

**Cold Outreach**

Initiate professional contact:

"Write a cold email to a potential mentor I found on LinkedIn. I admire their career path and want to ask for a brief informational conversation."

"Draft an outreach email to a company I would like to partner with. We offer complementary services and I see mutual benefit."

**Thank You and Appreciation**

Express gratitude professionally:

"Write a thank you email to a client who referred new business to us. Express genuine appreciation without being overly effusive."

"Draft a recognition email for a team member who went above and beyond on a recent project. Be specific about their contribution."

**Email Templates**

Create reusable formats:

"Create an email template for onboarding new vendors. Include sections for welcome, next steps, key contacts, and important deadlines."

"Design an email template for project kickoff announcements. It should work for various project types."

**Key Takeaways**

- Specify context and relationship when drafting emails
- Match tone to the professional situation
- Structure complex emails for easy scanning
- Craft subject lines that encourage action
- Use prompts for difficult or sensitive communications
- Create templates for recurring email types`
    },
    {
      moduleId: module5.id,
      courseId: course.id,
      title: 'Content Creation Prompts',
      orderNum: 2,
      durationMinutes: 25,
      content: `Content creation for business requires consistency, quality, and efficiency. Prompts help generate and refine various content types.

**Blog Posts and Articles**

Generate structured content:

"Write an outline for a blog post about five trends in sustainable business practices. Include an introduction, a section for each trend with key points, and a conclusion."

"Create a 600-word blog post about customer service best practices for small businesses. Include practical tips and real-world applications."

**Marketing Copy**

Craft persuasive content:

"Write three versions of a product description for ergonomic office chairs. Version 1 should focus on health benefits, Version 2 on productivity, and Version 3 on value."

"Create a landing page headline and subheadline for a project management tool aimed at small marketing agencies."

**Social Media Content**

Generate platform-appropriate posts:

"Write five LinkedIn posts about workplace productivity. Each should have a different angle and include a question to encourage engagement."

"Create a week of Instagram captions for a bakery promoting their new seasonal menu. Include relevant calls to action."

**Website Copy**

Develop site content:

"Write the About Us page for a consulting firm specializing in digital transformation for mid-sized companies. The tone should be professional yet approachable."

"Create the services page content for a web design agency. Include descriptions for three service tiers."

**Case Studies**

Structure success stories:

"Create an outline for a case study about helping a client increase their email open rates by 40%. Include sections for challenge, solution, results, and client quote."

**Newsletters**

Plan regular communications:

"Write a newsletter outline for a monthly update to customers. Include sections for company news, product tips, customer spotlight, and upcoming events."

"Draft the introduction for a weekly industry newsletter. The tone should be insightful but not overly formal."

**Internal Communications**

Engage employees:

"Write an announcement about a new employee wellness program. Explain the benefits, how to participate, and emphasize leadership support."

"Create talking points for a company-wide meeting about strategic direction for next year."

**Video Scripts**

Plan multimedia content:

"Write a script for a two-minute explainer video about how our software simplifies inventory management. Include visual suggestions for each section."

**Content Planning**

Organize content strategy:

"Create a content calendar framework for a B2B software company. Include blog posts, social media, and email newsletters for one month."

"What content types would work well for a fitness coaching business? List options with brief explanations of why each works."

**Key Takeaways**

- Specify format, length, tone, and audience for content
- Generate multiple versions for testing and selection
- Create content for different platforms with appropriate adjustments
- Use prompts for structure before detailed content
- Develop templates for recurring content needs`
    },
    {
      moduleId: module5.id,
      courseId: course.id,
      title: 'Analysis Prompts',
      orderNum: 3,
      durationMinutes: 25,
      content: `Analysis requires systematic thinking. Prompts help structure analysis and ensure comprehensive examination of information.

**Data Interpretation**

Make sense of numbers:

"I have quarterly sales data showing 15% growth but declining profit margins. What questions should I investigate to understand this pattern?"

"Here are survey results showing 70% satisfaction but only 40% would recommend us. What might explain this gap?"

**SWOT Analysis**

Examine situations systematically:

"Conduct a SWOT analysis for a small coffee shop considering adding a lunch menu. Consider local competition, customer demographics, and operational capacity."

"What are the strengths, weaknesses, opportunities, and threats for remote work policies in a traditional law firm?"

**Competitive Analysis**

Understand market position:

"What factors should I compare when analyzing competitors in the meal kit delivery market? Create a comparison framework."

"I know three competitors' pricing strategies. How should I analyze which approach is most sustainable?"

**Root Cause Analysis**

Identify underlying issues:

"Customer churn increased 20% last quarter. What potential causes should I investigate? Provide a framework for analyzing each possibility."

"Our project was delayed by three weeks. Help me analyze potential causes related to planning, resources, communication, and external factors."

**Risk Analysis**

Evaluate potential problems:

"What risks should I consider before expanding into a new geographic market? Categorize by likelihood and potential impact."

"I am considering two different vendors. What risk factors should I evaluate for each? Create a comparison framework."

**Financial Analysis**

Examine business numbers:

"What financial metrics should I track for a subscription-based business? Explain why each matters."

"How should I analyze whether a marketing campaign was successful? What metrics and comparisons are most relevant?"

**Trend Analysis**

Identify patterns:

"Looking at three years of website traffic data, what patterns should I look for? What might explain seasonal variations?"

"What factors typically influence consumer behavior trends in retail? Help me create a framework for monitoring these."

**Process Analysis**

Examine workflows:

"Map out the typical customer journey from first awareness to purchase for an e-commerce store. Identify where friction might occur."

"What questions help evaluate whether a business process needs improvement? Create an assessment checklist."

**Stakeholder Analysis**

Understand perspectives:

"I am proposing a new initiative that affects multiple departments. How should I analyze each stakeholder group's likely concerns and interests?"

**Decision Analysis**

Evaluate options:

"I have three strategic options for business growth. What criteria should I use to compare them? Create a decision matrix template."

**Key Takeaways**

- Use structured frameworks for systematic analysis
- Prompts can generate comparison criteria and matrices
- Identify what questions to investigate before drawing conclusions
- Analyze risks, causes, and trends methodically
- Consider multiple stakeholder perspectives`
    },
    {
      moduleId: module5.id,
      courseId: course.id,
      title: 'Decision Support Prompts',
      orderNum: 4,
      durationMinutes: 25,
      content: `Prompts help structure thinking when facing important decisions. They ensure thorough consideration without missing key factors.

**Clarifying the Decision**

Define what you are actually deciding:

"I am trying to decide whether to hire a full-time employee or use contractors. Help me clearly define what this decision is really about and what factors matter most."

"I am overwhelmed by a complex decision about relocating my business. Help me break this into smaller, more manageable decisions."

**Listing Options**

Ensure you see all possibilities:

"I need to reduce operating costs. What are the typical approaches businesses take? Help me generate a comprehensive list of options beyond the obvious ones."

"What options exist for entering a new market? List approaches from lowest to highest resource requirements."

**Evaluating Criteria**

Determine what matters:

"What criteria should I use when evaluating potential business partners? List factors related to capability, compatibility, and risk."

"I am selecting a new software system. Help me create weighted criteria based on functionality, cost, implementation, and support."

**Pro/Con Analysis**

Examine tradeoffs:

"List the pros and cons of acquiring a competitor versus growing organically. Consider financial, operational, and strategic factors."

"What are the advantages and disadvantages of raising prices by 10%? Consider customer response, profit margins, competitive position, and brand perception."

**Scenario Planning**

Consider different futures:

"If I launch this product, what could the best case, worst case, and most likely case outcomes look like? Help me think through each scenario."

"What happens if our main supplier fails? Walk me through how to plan for this scenario."

**Devil's Advocate**

Challenge your thinking:

"I am leaning toward Option A. What arguments would someone make for choosing Option B instead? Give me the strongest case against my current preference."

"I think expanding internationally is the right move. What would a skeptic say? What risks might I be underestimating?"

**Second-Order Effects**

Think beyond immediate consequences:

"If I implement this policy change, what might be the unintended consequences? Consider effects on employees, customers, and operations."

"If we cut this product line, what ripple effects should I anticipate beyond direct revenue impact?"

**Reversibility Assessment**

Evaluate commitment:

"How reversible is this decision? If it turns out to be wrong, what would it take to change course? What would we lose?"

"What decisions in this process are hard to undo? Which can be adjusted later?"

**Information Gaps**

Identify what you need to know:

"Before making this decision, what information would reduce uncertainty the most? What questions should I answer first?"

"I feel uncertain about this choice. What specific data or input would help me decide with more confidence?"

**Decision Timing**

Consider when to decide:

"What are the costs of delaying this decision by three months? What are the costs of deciding too quickly?"

**Key Takeaways**

- Clarify exactly what decision you face
- Generate comprehensive options beyond obvious choices
- Establish criteria weighted by importance
- Consider multiple scenarios and perspectives
- Identify unintended consequences and reversibility
- Determine what information would reduce uncertainty`
    },
    {
      moduleId: module5.id,
      courseId: course.id,
      title: 'Workflow Prompts',
      orderNum: 5,
      durationMinutes: 25,
      content: `Prompts improve work processes by identifying inefficiencies, generating improvements, and documenting procedures.

**Process Documentation**

Capture how work gets done:

"Create a step-by-step process document for handling customer refund requests. Include decision points and who is responsible at each stage."

"Document the workflow for preparing monthly financial reports. Include data sources, tools used, and review checkpoints."

**Identifying Bottlenecks**

Find what slows things down:

"I described our order fulfillment process. What are likely bottlenecks or inefficiencies? Where would delays typically occur?"

"Looking at this meeting schedule, what could be made more efficient? What meetings might be combined or eliminated?"

**Process Improvement**

Generate better approaches:

"Our current onboarding process takes two weeks. What steps could be parallelized, automated, or eliminated to reduce this time?"

"How could we reduce the number of approvals needed for routine purchases under $500? Suggest a streamlined process."

**Standard Operating Procedures**

Create consistent guidelines:

"Write a standard operating procedure for responding to customer inquiries within four hours. Include escalation criteria and quality standards."

"Create SOP for weekly team status updates. Include what information to gather, how to format it, and when to submit."

**Automation Opportunities**

Identify what can be automated:

"Looking at our daily operations, what repetitive tasks could potentially be automated? List by potential time savings."

"What parts of our client reporting process could be automated versus requiring human judgment?"

**Checklists**

Ensure consistency:

"Create a checklist for launching a new product. Include pre-launch, launch day, and post-launch activities."

"What should be on a checklist for closing out a completed project? Include documentation, feedback, and handoff items."

**Handoff Procedures**

Manage transitions:

"Create a handoff document template for when a project moves from one team to another. What information must be transferred?"

"What should an employee include in a transition document when leaving a role? Create an outline."

**Meeting Efficiency**

Improve time spent together:

"What structure would make our weekly planning meetings more efficient? We currently spend 90 minutes and need to reduce to 60."

"Create a meeting agenda template that ensures productive use of time. Include timing guidance for each section."

**Communication Workflows**

Streamline information flow:

"Design a communication workflow for project updates. Who needs to know what, when, and through what channel?"

"How should customer feedback flow from support to product development? Map the information path."

**Performance Metrics**

Track what matters:

"What metrics would help us understand if our sales process is working well? List key indicators and what each tells us."

"Create a simple scorecard for tracking customer service quality. Include three to five key metrics."

**Key Takeaways**

- Document processes to ensure consistency
- Identify and address bottlenecks
- Look for automation opportunities
- Use checklists for complex or important processes
- Design clear handoff procedures
- Establish metrics to monitor performance`
    }
  ]);

  console.log('✅ Created Module 5: Prompting for Work and Business with 5 lessons');

  // Module 6: Common Prompt Mistakes
  const [module6] = await db.insert(modules).values({
    courseId: course.id,
    title: 'Common Prompt Mistakes',
    description: 'Avoid errors that reduce results.',
    orderNum: 6
  }).returning();

  await db.insert(lessons).values([
    {
      moduleId: module6.id,
      courseId: course.id,
      title: 'Vague Prompts',
      orderNum: 1,
      durationMinutes: 20,
      content: `Vague prompts are the most common mistake. They force the AI to guess what you want, leading to generic or irrelevant responses.

**What Makes a Prompt Vague**

Vague prompts lack specificity about:
- What exactly you want
- Who the audience is
- What format you need
- How much detail is appropriate
- What context applies

The AI fills these gaps with defaults that may not match your needs.

**Examples of Vague Prompts**

"Tell me about marketing."
What about marketing? Digital, traditional, B2B, B2C, strategy, tactics, history?

"Help with my presentation."
What kind of help? Content, design, delivery, structure?

"Write something about our product."
What type of writing? For whom? Emphasizing what features?

"Give me ideas."
Ideas for what? How many? What constraints?

Each of these prompts could go in dozens of directions. The AI picks one. You get something.

**Why Vagueness Fails**

Vague prompts waste time because:
- The first response rarely matches your needs
- You must iterate through clarifications
- You may not even recognize what is missing until you see the wrong output
- Mental effort goes toward evaluation rather than production

**The Fix: Be Specific**

Transform vague prompts by adding specifics:

Vague: "Tell me about marketing."
Specific: "Explain three digital marketing strategies effective for small e-commerce businesses with limited budgets. Focus on methods that can be implemented without hiring specialists."

Vague: "Help with my presentation."
Specific: "Review this presentation outline for a sales pitch to a healthcare company. Suggest improvements to structure and identify any weak points in the argument flow."

Vague: "Write something about our product."
Specific: "Write a 150-word product description for our ergonomic desk lamp. The target audience is office workers concerned about eye strain. Emphasize the adjustable lighting settings and health benefits."

**A Quick Test**

After writing a prompt, ask: "Could someone completely unfamiliar with my situation respond appropriately?"

If significant guessing would be required, add detail.

**Common Vague Words to Replace**

"Something" → specify exactly what
"Stuff" → name the specific items or topics
"Things" → be concrete about which things
"Improve" → define what improvement means
"Better" → specify criteria for better
"Good" → describe what good looks like

**Finding the Right Level of Detail**

Not every prompt needs extensive detail. Simple requests can be simple. But when responses miss the mark, vagueness is usually the cause.

Err on the side of more detail when you are not getting good results. You can always simplify once you understand what level of specificity your typical requests need.

**Key Takeaways**

- Vague prompts force AI to guess your intent
- Missing specifics lead to generic or irrelevant responses
- Replace vague words with concrete descriptions
- Test prompts by asking if a stranger could respond accurately
- Add detail when responses do not match expectations`
    },
    {
      moduleId: module6.id,
      courseId: course.id,
      title: 'Overloading Prompts',
      orderNum: 2,
      durationMinutes: 20,
      content: `Overloaded prompts try to do too much at once. They cram multiple requests, excessive constraints, or too much context into a single prompt, overwhelming the system and producing poor results.

**Signs of an Overloaded Prompt**

You might be overloading if your prompt:
- Contains multiple distinct requests
- Has more than five or six constraints
- Includes long background paragraphs
- Asks for conflicting things
- Takes more than a minute to write

**Why Overloading Fails**

When prompts try to do too much:
- The AI may focus on some parts while missing others
- Conflicting requirements create confusion
- Key instructions get buried in text
- The response tries to address everything superficially rather than anything well

**Multiple Requests Problem**

Overloaded: "Write a blog post about productivity, create three social media posts promoting it, draft an email to our newsletter subscribers, and suggest five related topics for future posts."

This prompt contains four distinct tasks. Each competes for attention. The quality of each suffers.

Better approach: Handle these as separate prompts, focusing on one task at a time with appropriate detail for each.

**Excessive Constraints**

Overloaded: "Write about leadership in under 200 words using simple language with no jargon avoiding personal pronouns in paragraph form not bullet points but make it engaging and professional while mentioning at least three specific skills and including an example but keeping the example brief and ending with a call to action that is subtle not pushy."

The AI must juggle many requirements simultaneously. Something will slip.

Better approach: Identify the most important constraints. Include those. Accept that not every preference needs specification.

**Context Overload**

Overloaded: "My company was founded in 2010 by two engineers who met in graduate school and we started with a focus on enterprise software but pivoted to consumer applications in 2015 after our Series A funding and now we have 50 employees across three offices and we are known for our user-friendly design philosophy and we are launching a new product next quarter... write a press release."

Excessive context buries the actual request. Most of this information is not needed for a press release.

Better approach: Include only context directly relevant to the specific request.

**Conflicting Requirements**

Overloaded: "Write something detailed but brief, technical but accessible, formal but engaging, comprehensive but focused."

These pairs conflict. The AI cannot optimize for both simultaneously.

Better approach: Decide which of conflicting priorities matters more. Specify that one.

**How to Simplify**

When you notice overloading:

1. Identify the core request
2. Remove anything not essential to that request
3. If multiple tasks exist, separate them
4. If many constraints exist, prioritize the important ones
5. If context is long, extract only what directly affects the response

**Sequential Approach**

Instead of one massive prompt, use a sequence:

First: "Create an outline for a blog post about remote work productivity."

Then: "Expand the second section of this outline into two paragraphs."

Then: "Write a compelling introduction that hooks readers immediately."

Each prompt is focused. Quality improves.

**Key Takeaways**

- Overloaded prompts try to accomplish too much at once
- Multiple distinct requests should be separate prompts
- Prioritize constraints rather than including all of them
- Remove context that does not affect the response
- Use sequential prompts for complex tasks`
    },
    {
      moduleId: module6.id,
      courseId: course.id,
      title: 'Missing Context',
      orderNum: 3,
      durationMinutes: 25,
      content: `Missing context forces the AI to make assumptions that may not match your situation. Recognizing what context you have not provided helps you write better prompts.

**Types of Missing Context**

Audience context: Who will use this information?
Purpose context: Why do you need this?
Expertise context: What level of knowledge exists?
Situational context: What circumstances apply?
Constraint context: What limitations exist?

**How Missing Context Affects Responses**

Without audience context:
"Explain machine learning" might produce a technical explanation when you needed a simple one for executives, or vice versa.

Without purpose context:
"Write about our company history" might produce a formal document when you needed casual social media content.

Without expertise context:
"Recommend investment strategies" might assume sophisticated knowledge you do not have.

Without situational context:
"Suggest marketing tactics" might recommend expensive campaigns when you have a limited budget.

**Recognizing When Context Is Missing**

Ask yourself:
- Would two different people interpret this prompt the same way?
- Am I assuming the AI knows something about my situation?
- Have I explained why I need this?
- Have I described who will receive this?

If answers are uncertain, context may be missing.

**Context You Often Forget**

Industry: Business norms vary by sector
Company size: Small business advice differs from enterprise
Role: A CEO needs different information than a manager
Timeline: Urgency affects recommendations
Budget: Cost constraints shape possibilities
Location: Regional factors may matter
History: Past attempts or existing knowledge affects what helps now

**Adding Missing Context Effectively**

Do not dump all possible context. Add what matters for this specific request.

Missing context: "Write a marketing plan."
Added context: "Write a marketing plan for a small law firm in a suburban area trying to attract more family law clients. Budget is $2000 monthly. Focus on local visibility and word-of-mouth."

The added context dramatically changes what plan makes sense.

**Context Through Examples**

Sometimes showing is easier than telling:

"I want headlines like these: [examples]. Write five more in the same style."

The examples carry context about tone, length, and approach without explicit description.

**Context Through Persona**

Define who you are:

"I am a project manager with five years of experience looking for ways to improve team communication. What practices would help?"

The persona provides context about perspective and needs.

**Iterating to Add Context**

If a response shows the AI misunderstood:

"That response assumes I have a large team, but I work alone. Revise with that in mind."

You learn what context was missing by seeing the wrong assumption.

**Building Context Habits**

For recurring types of prompts, identify what context consistently matters:

For business writing: Audience, tone, format, purpose
For learning: Current knowledge level, learning goal
For decisions: Constraints, priorities, timeline
For creative work: Style, audience, medium

Include these automatically.

**Key Takeaways**

- Missing context forces assumptions that may be wrong
- Consider audience, purpose, expertise, situation, and constraints
- Identify what information would change the response
- Use examples to convey context efficiently
- Build habits for including context in common prompt types`
    },
    {
      moduleId: module6.id,
      courseId: course.id,
      title: 'Unrealistic Expectations',
      orderNum: 4,
      durationMinutes: 20,
      content: `Unrealistic expectations lead to disappointment with AI responses. Understanding what AI can and cannot do helps you set appropriate expectations and write achievable prompts.

**What AI Does Well**

AI excels at:
- Generating text in various styles
- Summarizing and reformatting content
- Explaining concepts at different levels
- Brainstorming and listing options
- Following explicit instructions
- Producing drafts for human refinement
- Pattern-based tasks with clear parameters

**What AI Does Poorly**

AI struggles with:
- Knowing information from after training cutoff
- Accessing your personal files, emails, or data
- Verifying current facts or real-time information
- Maintaining perfect accuracy in all details
- Understanding unstated preferences
- Reading your mind about what you really want
- Providing professional advice that replaces experts

**Unrealistic Prompt Examples**

"Give me today's stock prices."
AI cannot access real-time data.

"Read my resume and suggest improvements."
AI cannot access your files unless you paste the content.

"Tell me exactly what to do in my specific legal situation."
AI is not qualified to replace professional legal advice.

"Write perfectly error-free content every time."
AI makes mistakes and should be reviewed.

**Setting Realistic Expectations**

Think of AI as a helpful assistant with broad knowledge but no access to your specific situation unless you explain it. It provides drafts, not final products. It offers perspectives, not definitive answers.

Good expectations:
- AI will give me a starting point to refine
- AI will help me think through options
- AI will save time on routine tasks
- AI will need my review and correction
- AI works best when I provide clear direction

Poor expectations:
- AI will give me perfect final output
- AI will know exactly what I want
- AI will never make mistakes
- AI will replace professional expertise
- AI will work without clear input from me

**Adjusting Prompts Accordingly**

Instead of: "Write my marketing plan."
Try: "Create a draft marketing plan outline I can develop further."

Instead of: "Tell me the best investment."
Try: "Explain factors to consider when choosing investments."

Instead of: "Write my legal contract."
Try: "What clauses are typically included in a freelance service agreement? Note: I will have a lawyer review any final contract."

**Handling AI Limitations**

When AI cannot do something:
- Recognize the limitation
- Adjust your approach
- Use AI for what it can do
- Supplement with other sources

For current information: AI can explain concepts, you verify current details elsewhere.
For personal data: Paste relevant content into the prompt.
For professional advice: Use AI for general education, consult professionals for specific decisions.

**Quality Control**

Always review AI output for:
- Factual accuracy
- Appropriateness for your specific situation
- Tone and style fit
- Completeness of information
- Any errors or inconsistencies

AI produces raw material. You refine it.

**Key Takeaways**

- AI has real capabilities and real limitations
- Expect drafts and starting points, not perfect outputs
- AI cannot access real-time data or your personal files
- Professional advice still requires professionals
- Review all output for accuracy and appropriateness
- Use AI for what it does well, supplement for what it does poorly`
    },
    {
      moduleId: module6.id,
      courseId: course.id,
      title: 'Fixing Bad Prompts',
      orderNum: 5,
      durationMinutes: 25,
      content: `When prompts produce poor results, systematic diagnosis and correction gets you back on track. This lesson applies everything you have learned to fix common prompt problems.

**Diagnosis Process**

When a response is unsatisfactory:

1. Read the response carefully. What specifically is wrong?
2. Compare to your prompt. What could have caused this issue?
3. Identify the problem category. Vague? Overloaded? Missing context? Unrealistic?
4. Plan your correction. What change would address this?
5. Revise and retry.

**Problem: Response Is Too Broad**

Symptom: The response covers many things superficially rather than addressing what you actually need.

Cause: Prompt lacks specificity about what aspect you care about.

Fix: Add constraints that narrow the focus.

Before: "Tell me about project management."
After: "Explain three common reasons projects go over budget and how to prevent each. Focus on software development projects."

**Problem: Response Misses the Point**

Symptom: The AI addresses something related but not what you asked.

Cause: Ambiguous language or buried key request.

Fix: Clarify exactly what you want. Put the main request first.

Before: "I have been thinking about ways to improve customer retention, maybe through loyalty programs or better service, and wondering if pricing changes could help, so what approaches work best for small retail businesses?"
After: "What are three effective customer retention strategies for small retail businesses? Briefly explain why each works."

**Problem: Wrong Tone or Style**

Symptom: Content is too formal, too casual, too technical, or otherwise stylistically wrong.

Cause: Tone not specified, or specified but not clearly enough.

Fix: Explicitly describe the desired tone, possibly with examples.

Before: "Write about our new product launch."
After: "Write about our new product launch for our company blog. The tone should be excited but professional, similar to how Apple announces new products."

**Problem: Wrong Length**

Symptom: Too long or too short for your needs.

Cause: Length expectations not specified.

Fix: Add explicit length requirements.

Before: "Explain cloud computing."
After: "Explain cloud computing in two paragraphs totaling approximately 150 words. Target a general business audience."

**Problem: Missing Key Information**

Symptom: The response is missing important points you expected.

Cause: You did not request those specific points.

Fix: Explicitly list what must be included.

Before: "Write about the benefits of remote work."
After: "Write about the benefits of remote work. Include: productivity improvements, cost savings for employers, work-life balance for employees, and environmental impact. Address each in one paragraph."

**Problem: Wrong Format**

Symptom: You received paragraphs but wanted bullets, or vice versa.

Cause: Format not specified.

Fix: Explicitly request the format you need.

Before: "Give me marketing ideas."
After: "List ten marketing ideas for a new restaurant. Present as a numbered list with one sentence describing each idea."

**Problem: Assumed Wrong Context**

Symptom: The response assumes a different situation than yours.

Cause: You did not provide your actual context.

Fix: Add relevant context about your situation.

Before: "How should I grow my business?"
After: "How should I grow my freelance graphic design business? I work alone, have about ten regular clients, and want to increase revenue without hiring employees."

**Systematic Revision Approach**

For any problematic response:

1. Note what specifically went wrong
2. Identify which prompt element caused it
3. Modify that element
4. Keep what worked from the original
5. Try again

**Key Takeaways**

- Diagnose problems by comparing responses to prompts
- Most issues fall into common categories
- Solutions match problem types: specificity for vagueness, constraints for breadth, context for assumptions
- Systematic revision is more effective than random changes
- Each correction teaches you about prompting`
    }
  ]);

  console.log('✅ Created Module 6: Common Prompt Mistakes with 5 lessons');

  console.log('🎉 Prompt Engineering for Beginners course fully seeded!');
}
