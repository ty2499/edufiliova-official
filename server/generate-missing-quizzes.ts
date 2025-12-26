import { db } from './db';
import { subjectLessons, subjectExercises, subjects, subjectChapters } from '../shared/schema';
import { eq, and, sql, notInArray } from 'drizzle-orm';
import Anthropic from '@anthropic-ai/sdk';

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

async function generateQuizQuestionsWithAI(
  lessonTitle: string,
  lessonContent: string,
  subjectName: string,
  chapterTitle: string
): Promise<QuizQuestion[]> {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const prompt = `You are an expert educator creating quiz questions for students.

Subject: ${subjectName}
Chapter: ${chapterTitle}
Lesson: ${lessonTitle}

Lesson Content:
${lessonContent}

Create exactly 5 multiple-choice quiz questions based on this lesson content. Each question should:
1. Test understanding of key concepts from the lesson
2. Have 4 answer options
3. Include one correct answer
4. Include a brief explanation of why the answer is correct

Return ONLY a valid JSON array with this exact structure:
[
  {
    "question": "Question text here?",
    "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
    "correctAnswer": "The exact text of the correct option",
    "explanation": "Brief explanation of why this answer is correct."
  }
]

Make sure the JSON is properly formatted and parseable. Do not include any markdown formatting or code blocks.`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    let jsonText = content.text.trim();
    
    // Remove markdown code blocks if present
    jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const questions = JSON.parse(jsonText);
    
    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error('Invalid response format from AI');
    }

    return questions.slice(0, 5); // Ensure we only get 5 questions
  } catch (error) {
    console.error(`❌ Error generating quiz questions:`, error);
    throw error;
  }
}

async function generateMissingQuizzes() {
  try {
    console.log('🎯 Starting quiz generation for lessons without exercises...\n');

    // Find all lessons that don't have exercises
    const lessonsWithoutExercises = await db
      .select({
        lessonId: subjectLessons.id,
        lessonTitle: subjectLessons.title,
        lessonNotes: subjectLessons.notes,
        chapterId: subjectLessons.chapterId,
      })
      .from(subjectLessons)
      .where(
        notInArray(
          subjectLessons.id,
          db.select({ id: subjectExercises.lessonId }).from(subjectExercises)
        )
      );

    console.log(`📊 Found ${lessonsWithoutExercises.length} lessons without quizzes\n`);

    if (lessonsWithoutExercises.length === 0) {
      console.log('✅ All lessons already have quizzes!');
      return;
    }

    let successCount = 0;
    let failCount = 0;

    for (const lesson of lessonsWithoutExercises) {
      try {
        // Get chapter and subject info
        const chapterInfo = await db
          .select({
            chapterTitle: subjectChapters.title,
            subjectId: subjectChapters.subjectId,
          })
          .from(subjectChapters)
          .where(eq(subjectChapters.id, lesson.chapterId))
          .limit(1);

        if (!chapterInfo || chapterInfo.length === 0) {
          console.log(`⚠️  Skipping lesson "${lesson.lessonTitle}" - no chapter found`);
          failCount++;
          continue;
        }

        const subjectInfo = await db
          .select({
            name: subjects.name,
          })
          .from(subjects)
          .where(eq(subjects.id, chapterInfo[0].subjectId))
          .limit(1);

        if (!subjectInfo || subjectInfo.length === 0) {
          console.log(`⚠️  Skipping lesson "${lesson.lessonTitle}" - no subject found`);
          failCount++;
          continue;
        }

        console.log(`📝 Generating quiz for: ${subjectInfo[0].name} > ${chapterInfo[0].chapterTitle} > ${lesson.lessonTitle}`);

        // Generate quiz questions using AI
        const questions = await generateQuizQuestionsWithAI(
          lesson.lessonTitle,
          lesson.lessonNotes || '',
          subjectInfo[0].name,
          chapterInfo[0].chapterTitle
        );

        // Insert exercises into database
        for (let i = 0; i < questions.length; i++) {
          const q = questions[i];
          await db.insert(subjectExercises).values({
            lessonId: lesson.lessonId,
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            order: i + 1,
            isActive: true,
          });
        }

        console.log(`   ✅ Added ${questions.length} quiz questions\n`);
        successCount++;

        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`   ❌ Failed to generate quiz for lesson "${lesson.lessonTitle}":`, error);
        failCount++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`✅ Successfully generated quizzes for ${successCount} lessons`);
    console.log(`❌ Failed to generate quizzes for ${failCount} lessons`);
    console.log(`📝 Total processed: ${successCount + failCount} lessons`);

  } catch (error) {
    console.error('❌ Fatal error in quiz generation:', error);
    throw error;
  }
}

// Run the script
generateMissingQuizzes()
  .then(() => {
    console.log('\n🎉 Quiz generation completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Quiz generation failed:', error);
    process.exit(1);
  });
