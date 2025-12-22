import { db } from './db';
import { subjectChapters, subjectLessons, subjectExercises } from '../shared/schema';
import { eq, and } from 'drizzle-orm';

async function createSampleChineseLessons() {
  try {
    console.log('📖 Creating sample Chinese lessons...');

    // Get the first Chinese chapter (Chinese Characters and Radicals)
    const chineseChapter = await db
      .select()
      .from(subjectChapters)
      .where(eq(subjectChapters.title, 'Chinese Characters and Radicals'))
      .limit(1);

    if (chineseChapter.length === 0) {
      console.log('❌ Chinese Characters and Radicals chapter not found');
      return;
    }

    const chapterId = chineseChapter[0].id;

    // Sample lessons for "Chinese Characters and Radicals" chapter
    const sampleLessons = [
      {
        title: 'Introduction to Chinese Characters',
        notes: 'Chinese characters (汉字 hànzì) are the foundation of written Chinese. Unlike alphabetic writing systems, Chinese uses logographic characters where each character represents a word or meaningful unit. There are over 50,000 Chinese characters in existence, but you only need to know about 3,000-4,000 characters to read modern Chinese fluently.\n\nChinese characters evolved from ancient pictographs - simple drawings that represented objects. For example, the character 人 (rén) meaning "person" looks like a walking person, and 山 (shān) meaning "mountain" resembles mountain peaks.\n\nEvery Chinese character is written within an imaginary square, and proper stroke order is essential for creating well-formed characters. Characters can be simple (single component) or compound (multiple components combined).',
        examples: [
          '人 (rén) - person, human',
          '山 (shān) - mountain, hill', 
          '水 (shuǐ) - water',
          '火 (huǒ) - fire'
        ],
        questions: [
          {
            question: 'What does the Chinese character 人 (rén) mean?',
            options: ['water', 'person', 'mountain', 'fire'],
            correctAnswer: 'person',
            explanation: '人 (rén) means person or human. The character resembles a walking person when you look at its shape.'
          },
          {
            question: 'Chinese characters evolved from what ancient writing form?',
            options: ['alphabets', 'pictographs', 'syllables', 'numbers'],
            correctAnswer: 'pictographs',
            explanation: 'Chinese characters evolved from ancient pictographs - simple drawings that represented objects and concepts.'
          },
          {
            question: 'How many characters do you need to know to read modern Chinese fluently?',
            options: ['1,000-2,000', '3,000-4,000', '10,000-20,000', '50,000'],
            correctAnswer: '3,000-4,000',
            explanation: 'While there are over 50,000 Chinese characters in existence, knowing 3,000-4,000 characters is sufficient for reading modern Chinese fluently.'
          }
        ]
      },
      {
        title: 'Basic Radicals and Character Components',
        notes: 'Radicals (部首 bùshǒu) are the building blocks of Chinese characters. A radical is a component that appears in multiple characters and often provides a clue about the character\'s meaning or pronunciation. There are 214 traditional radicals, but learning the most common 100 radicals will help you understand thousands of characters.\n\nFor example, the radical 氵(water radical) appears in characters related to water: 河 (river), 海 (sea), 湖 (lake). The radical 木 (wood) appears in characters related to trees and wood: 树 (tree), 林 (forest), 森 (forest).\n\nUnderstanding radicals helps you:\n1. Guess the meaning of unknown characters\n2. Look up characters in dictionaries\n3. Remember characters more easily\n4. Group similar characters together',
        examples: [
          '氵(water radical): 河 (hé) river, 海 (hǎi) sea',
          '木 (wood radical): 树 (shù) tree, 林 (lín) forest',
          '口 (mouth radical): 吃 (chī) eat, 喝 (hē) drink',
          '心 (heart radical): 想 (xiǎng) think, 爱 (ài) love'
        ],
        questions: [
          {
            question: 'What is a radical in Chinese characters?',
            options: ['a complete character', 'a pronunciation guide', 'a character component', 'a grammar rule'],
            correctAnswer: 'a character component',
            explanation: 'A radical is a component that appears in multiple characters and often provides clues about meaning or pronunciation.'
          },
          {
            question: 'Which radical is related to water?',
            options: ['木', '氵', '口', '心'],
            correctAnswer: '氵',
            explanation: 'The radical 氵(water radical) appears in characters related to water like 河 (river) and 海 (sea).'
          },
          {
            question: 'How many traditional radicals are there?',
            options: ['100', '214', '500', '1000'],
            correctAnswer: '214',
            explanation: 'There are 214 traditional radicals, though learning the most common 100 will help you understand thousands of characters.'
          }
        ]
      },
      {
        title: 'Stroke Order Rules',
        notes: 'Proper stroke order is crucial for writing Chinese characters correctly and beautifully. Following the correct stroke order helps with:\n1. Character recognition\n2. Writing speed\n3. Character balance and proportion\n4. Handwriting legibility\n\nBasic stroke order rules:\n1. Top to bottom: 三 (sān) - three\n2. Left to right: 川 (chuān) - river\n3. Horizontal before vertical when they cross: 十 (shí) - ten\n4. Outside before inside: 月 (yuè) - moon\n5. Inside before closing: 国 (guó) - country\n6. Left-falling stroke before right-falling: 人 (rén) - person\n7. Center before outside: 小 (xiǎo) - small\n8. Dots and minor strokes last: 玉 (yù) - jade\n\nPracticing stroke order from the beginning helps develop muscle memory and makes writing Chinese characters feel natural.',
        examples: [
          '十 (shí) - horizontal stroke first, then vertical',
          '人 (rén) - left-falling stroke before right-falling',
          '口 (kǒu) - outside strokes before closing bottom',
          '国 (guó) - outside frame, then inside components, then closing'
        ],
        questions: [
          {
            question: 'In the character 十 (shí), which stroke comes first?',
            options: ['vertical', 'horizontal', 'left-falling', 'right-falling'],
            correctAnswer: 'horizontal',
            explanation: 'When horizontal and vertical strokes cross, the horizontal stroke is written first. So in 十, write the horizontal line first.'
          },
          {
            question: 'Why is proper stroke order important?',
            options: ['for meaning', 'for pronunciation', 'for recognition and speed', 'for grammar'],
            correctAnswer: 'for recognition and speed',
            explanation: 'Proper stroke order helps with character recognition, writing speed, balance, and legibility.'
          },
          {
            question: 'In most characters, which direction do you write first?',
            options: ['bottom to top', 'right to left', 'top to bottom', 'inside to outside'],
            correctAnswer: 'top to bottom',
            explanation: 'The general rule is to write from top to bottom and left to right when writing Chinese characters.'
          }
        ]
      }
    ];

    // Insert the sample lessons
    for (let i = 0; i < sampleLessons.length; i++) {
      const lessonData = sampleLessons[i];

      // Check if lesson already exists
      const existingLesson = await db
        .select()
        .from(subjectLessons)
        .where(
          and(
            eq(subjectLessons.chapterId, chapterId),
            eq(subjectLessons.title, lessonData.title)
          )
        )
        .limit(1);

      if (existingLesson.length > 0) {
        console.log(`⏭️  Lesson "${lessonData.title}" already exists, skipping...`);
        continue;
      }

      // Insert lesson
      const insertedLesson = await db
        .insert(subjectLessons)
        .values({
          chapterId: chapterId,
          title: lessonData.title,
          notes: lessonData.notes,
          examples: lessonData.examples,
          cloudinaryImages: [],
          order: i + 1,
          durationMinutes: 40,
          isActive: true
        })
        .returning();

      console.log(`✅ Created lesson: ${lessonData.title}`);

      // Insert quiz questions
      for (let j = 0; j < lessonData.questions.length; j++) {
        const question = lessonData.questions[j];
        
        await db.insert(subjectExercises).values({
          lessonId: insertedLesson[0].id,
          question: question.question,
          options: question.options,
          correctAnswer: question.correctAnswer,
          explanation: question.explanation,
          order: j + 1,
          isActive: true
        });
      }
      console.log(`📋 Created ${lessonData.questions.length} quiz questions for ${lessonData.title}`);
    }

    console.log('🎉 Sample Chinese lessons created successfully!');

  } catch (error) {
    console.error('❌ Error creating sample Chinese lessons:', error);
    throw error;
  }
}

// Run the function directly
createSampleChineseLessons()
  .then(() => {
    console.log('✨ Sample lesson creation completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Sample lesson creation failed:', error);
    process.exit(1);
  });

export { createSampleChineseLessons };