import OpenAI from 'openai';
import { getOpenAIClient } from './openai';

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
let openaiInstance: OpenAI | null = null;

async function getOpenAI(): Promise<OpenAI> {
  if (!openaiInstance) {
    openaiInstance = await getOpenAIClient();
  }
  if (!openaiInstance) {
    throw new Error('OpenAI API key not configured. Please add it in Admin Dashboard or as environment variable.');
  }
  return openaiInstance;
}

// Step-by-step Python lesson content generator (ONE lesson at a time)
export async function generatePythonLessonContent(
  moduleTitle: string, 
  lessonTitle: string, 
  lessonGoal: string,
  lessonNumber: number,
  totalLessonsInModule: number
): Promise<{
  content: string;
  examples: string[];
  imagePrompts: string[];
  questions: Array<{
    text: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }>;
}> {
  const prompt = `You are a professional e-learning course generation engine.

Generate comprehensive content for ONE Python lesson:

Module: ${moduleTitle}
Lesson ${lessonNumber} of ${totalLessonsInModule}: ${lessonTitle}
Goal: ${lessonGoal}

CONTENT RULES (STRICT):
- Beginner-friendly
- Simple, clear English
- Step-by-step explanations
- Practical and realistic examples
- No hype, no fluff, no emojis, no slang
- Do NOT mention AI, OpenAI, or automation

LESSON LENGTH REQUIREMENTS (VERY IMPORTANT):
- Minimum length: 1500 words
- Preferred range: 1500-3000 words
- Must be detailed, structured, and educational

Generate:
1. "content": Full lesson text (1500-3000 words) with clear sections, code examples, explanations
2. "examples": 4-5 practical Python code examples with explanations
3. "imagePrompts": 2-3 image prompts for HD illustrations/diagrams (NO TEXT IN IMAGE - must include this phrase)
4. "questions": 5 multiple choice quiz questions

Respond in JSON format:
{
  "content": "Full lesson content here (1500-3000 words)...",
  "examples": [
    "Example 1: Description and code...",
    "Example 2: Description and code..."
  ],
  "imagePrompts": [
    "HD flat illustration of a Python code editor showing variables, modern professional style, clean design, NO TEXT IN IMAGE",
    "HD diagram showing data flow in a Python program, flat design, educational, NO TEXT IN IMAGE"
  ],
  "questions": [
    {
      "text": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Why this answer is correct"
    }
  ]
}

QUIZ RULES (CRITICAL):
- Use "text" for question text (NOT "question")
- Use "correctIndex" for correct answer (0-based index)
- Include 5 questions per lesson`;

  try {
    const openai = await getOpenAI();
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: 8000
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return {
      content: result.content || '',
      examples: result.examples || [],
      imagePrompts: result.imagePrompts || [],
      questions: result.questions || []
    };
  } catch (error) {
    console.error('Error generating Python lesson content:', error);
    throw new Error('Failed to generate Python lesson content');
  }
}

export async function generateScienceLessonContent(chapterTitle: string, lessonTitle: string): Promise<{
  notes: string;
  examples: string[];
  questions: Array<{
    text: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }>;
}> {
  const prompt = `Create comprehensive Grade 7 science lesson content for:
Chapter: ${chapterTitle}
Lesson: ${lessonTitle}

Generate content that includes:
1. Detailed notes (1500-2000 words) explaining the topic in student-friendly language with comprehensive coverage
2. 4-5 practical examples or experiments students can understand
3. 10 multiple choice questions with 4 options each

IMPORTANT - Make lessons BIG and comprehensive:
- Include detailed explanations, background context, and theory
- Cover multiple aspects of the topic
- Provide real-world applications and case studies

Make sure the content is:
- Age-appropriate for 12-13 year old students
- Clear and engaging
- Scientifically accurate
- Includes real-world applications
- Uses simple vocabulary while maintaining scientific precision

Respond in JSON format with this structure:
{
  "notes": "detailed explanation text (1500-2000 words)",
  "examples": ["example 1", "example 2", "example 3", "example 4"],
  "questions": [
    {
      "text": "question text here",
      "options": ["option A", "option B", "option C", "option D"],
      "correctIndex": 0,
      "explanation": "why this is correct"
    }
  ]
}

QUIZ RULES (CRITICAL - use exact field names):
- Use "text" for question text (NOT "question")
- Use "correctIndex" for correct answer (NOT "correctAnswer")
- correctIndex is 0-based (0 = first option, 1 = second, etc.)`;

  try {
    const openai = await getOpenAI();
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: 12000
    });

    const content = JSON.parse(response.choices[0].message.content || '{}');
    return content;
  } catch (error) {
    console.error('Error generating lesson content:', error);
    throw new Error('Failed to generate lesson content');
  }
}

export async function generateScienceLessonsForChapter(chapterTitle: string, chapterDescription: string): Promise<Array<{
  title: string;
  notes: string;
  examples: string[];
  questions: Array<{
    text: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }>;
}>> {
  const prompt = `Create 3-4 comprehensive Grade 7 science lessons for the chapter:
Chapter: ${chapterTitle}
Description: ${chapterDescription}

For each lesson, generate:
1. A clear lesson title that builds progressively on the chapter topic
2. DETAILED notes (1500-2000 words each) explaining concepts comprehensively in student-friendly language
3. 4-5 practical examples or experiments with detailed descriptions
4. 10 multiple choice questions with 4 options each

IMPORTANT - Make lessons BIG and comprehensive:
- Include detailed explanations covering theory, background, and practical applications
- Cover multiple aspects of each topic thoroughly
- Provide real-world case studies and applications

Make lessons progressive - each should build on the previous one.

Respond in JSON format:
{
  "lessons": [
    {
      "title": "lesson title",
      "notes": "detailed explanation (1500-2000 words)",
      "examples": ["example 1", "example 2", "example 3", "example 4"],
      "questions": [
        {
          "text": "question text here",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctIndex": 0,
          "explanation": "why this is correct"
        }
      ]
    }
  ]
}

QUIZ RULES (CRITICAL - use exact field names):
- Use "text" for question text (NOT "question")
- Use "correctIndex" for correct answer (NOT "correctAnswer")
- correctIndex is 0-based (0 = first option, 1 = second, 2 = third, 3 = fourth)`;

  try {
    const openai = await getOpenAI();
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: 12000
    });

    const content = JSON.parse(response.choices[0].message.content || '{}');
    return content.lessons || [];
  } catch (error) {
    console.error('Error generating chapter lessons:', error);
    throw new Error('Failed to generate chapter lessons');
  }
}

export async function generateChineseLessonsForChapter(chapterTitle: string, chapterDescription: string): Promise<Array<{
  title: string;
  notes: string;
  examples: string[];
  questions: Array<{
    text: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }>;
}>> {
  const prompt = `Create 3-4 comprehensive Grade 7 Chinese language lessons for the chapter:
Chapter: ${chapterTitle}
Description: ${chapterDescription}

For each lesson, generate:
1. A clear lesson title that builds progressively on the chapter topic
2. DETAILED notes (1500-2000 words each) explaining Chinese language concepts comprehensively in student-friendly English
3. 5-6 practical examples with Chinese characters, pinyin pronunciation, and English meanings
4. 10 multiple choice questions with 4 options each

IMPORTANT - Make lessons BIG and comprehensive:
- Include detailed explanations covering theory, background, and cultural context
- Cover multiple aspects of each topic thoroughly
- Provide real-world usage scenarios and conversation examples

Make content appropriate for beginner Chinese learners aged 12-13:
- Include pinyin (pronunciation guides) for all Chinese characters
- Use simplified Chinese characters
- Explain cultural context where relevant
- Focus on practical, everyday Chinese usage
- Include stroke order information for character lessons
- Make lessons progressive - each should build on the previous one

For character-based lessons, include:
- Character meanings and etymology when helpful
- Stroke order basics
- Common usage in words and sentences

For pronunciation lessons, include:
- Tone explanations (1st, 2nd, 3rd, 4th tone)
- Similar sounds in English where possible
- Common pronunciation mistakes to avoid

For grammar lessons, include:
- Clear explanation of Chinese sentence structure
- Comparison with English grammar where helpful
- Common patterns and usage

Respond in JSON format:
{
  "lessons": [
    {
      "title": "lesson title",
      "notes": "detailed explanation (1500-2000 words) with Chinese characters, pinyin, and English meanings",
      "examples": ["Example 1: 你好 (nǐ hǎo) - Hello", "Example 2: 谢谢 (xiè xiè) - Thank you", "Example 3: 再见 (zài jiàn) - Goodbye"],
      "questions": [
        {
          "text": "What does 你好 (nǐ hǎo) mean?",
          "options": ["Goodbye", "Hello", "Thank you", "Please"],
          "correctIndex": 1,
          "explanation": "你好 (nǐ hǎo) is the most common way to say 'Hello' in Chinese. 你 (nǐ) means 'you' and 好 (hǎo) means 'good'."
        }
      ]
    }
  ]
}

QUIZ RULES (CRITICAL - use exact field names):
- Use "text" for question text (NOT "question")
- Use "correctIndex" for correct answer (NOT "correctAnswer")
- correctIndex is 0-based (0 = first option, 1 = second, 2 = third, 3 = fourth)`;

  try {
    const openai = await getOpenAI();
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: 12000
    });

    const content = JSON.parse(response.choices[0].message.content || '{}');
    return content.lessons || [];
  } catch (error) {
    console.error('Error generating Chinese chapter lessons:', error);
    throw new Error('Failed to generate Chinese chapter lessons');
  }
}