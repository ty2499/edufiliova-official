import { db } from './db';
import { subjects, subjectChapters, subjectLessons, subjectExercises } from '../shared/schema';
import { eq, and } from 'drizzle-orm';
import { ensureAdminUser } from './ensure-admin-user';

interface EnglishLesson {
  lesson: number;
  topic: string;
  content: string;
  example?: string;
  examples?: string[];
  tips?: string;
  story?: string;
  questions?: string[];
  answers?: string[];
  instructions?: string[];
  assessment_criteria?: string[];
  activities: string[];
}

interface EnglishUnit {
  unit: number;
  title: string;
  lessons: EnglishLesson[];
}

const englishGrade3Units: EnglishUnit[] = [
  {
    unit: 1,
    title: "Reading and Comprehension",
    lessons: [
      {
        lesson: 1,
        topic: "Reading Short Stories",
        content: "Reading helps us learn new words and ideas. We read to enjoy stories and to understand what happens in them.",
        example: "Story: 'Tendai and the Mango Tree' — Tendai planted a mango seed and watered it every day. After some time, it grew into a big tree that gave sweet fruit.",
        activities: [
          "Read the story aloud with your friend.",
          "Answer: Who planted the seed? What happened to the tree?",
          "Underline all action words (verbs)."
        ]
      },
      {
        lesson: 2,
        topic: "Answering Comprehension Questions",
        content: "Comprehension means understanding what you read. We look for answers in the passage itself.",
        tips: "Read the question carefully. Look for keywords that match the story.",
        activities: [
          "Read a short story and answer: Who? What? Where? When?",
          "Write one new word you learned."
        ]
      },
      {
        lesson: 3,
        topic: "Reading with Expression",
        content: "When reading aloud, use your voice to show feeling. Stop at full stops, and pause at commas.",
        example: "Happy voice: 'I love mangoes!' Sad voice: 'The rain broke my umbrella.'",
        activities: [
          "Practice reading one paragraph aloud with expression.",
          "Ask your partner to tell if you sounded happy, sad, or surprised."
        ]
      }
    ]
  },
  {
    unit: 2,
    title: "Grammar and Vocabulary",
    lessons: [
      {
        lesson: 1,
        topic: "Nouns – Naming Words",
        content: "A noun is a word that names a person, place, or thing.",
        examples: ["boy", "school", "dog", "chair"],
        activities: [
          "Write 5 nouns you can see in your classroom.",
          "Circle nouns in the sentence: 'The cat sat on the mat.'"
        ]
      },
      {
        lesson: 2,
        topic: "Verbs – Action Words",
        content: "A verb shows what someone or something is doing.",
        examples: ["run", "eat", "sing", "jump"],
        activities: [
          "Act out 3 verbs.",
          "Write 3 sentences using any verbs."
        ]
      },
      {
        lesson: 3,
        topic: "Adjectives – Describing Words",
        content: "Adjectives describe nouns. They tell us how something looks, feels, or sounds.",
        examples: ["red", "tall", "happy", "soft"],
        activities: [
          "Describe your friend using 3 adjectives.",
          "Complete: 'The ______ cat is sleeping.'"
        ]
      },
      {
        lesson: 4,
        topic: "Singular and Plural Nouns",
        content: "One thing is singular. More than one is plural. We often add -s or -es.",
        examples: ["cat → cats", "box → boxes", "baby → babies"],
        activities: [
          "Change to plural: dog, bus, tree, glass, lady.",
          "Draw two pictures: one cat and three cats."
        ]
      }
    ]
  },
  {
    unit: 3,
    title: "Writing Skills",
    lessons: [
      {
        lesson: 1,
        topic: "Writing Sentences",
        content: "A sentence is a group of words that makes sense. It begins with a capital letter and ends with a full stop.",
        example: "My name is Tanaka.",
        activities: [
          "Write 5 sentences about yourself.",
          "Check that each starts with a capital letter and ends with a full stop."
        ]
      },
      {
        lesson: 2,
        topic: "Writing a Short Paragraph",
        content: "A paragraph has a few sentences about one main idea.",
        example: "My School: My school is called Happy Primary. It has many classrooms. I love my teachers and friends.",
        activities: [
          "Write a short paragraph about your family.",
          "Underline the main idea sentence."
        ]
      },
      {
        lesson: 3,
        topic: "Punctuation Marks",
        content: "Punctuation marks help us read and write correctly.",
        examples: ["Full stop (.)", "Comma (,)", "Question mark (?)", "Exclamation (!)"],
        activities: [
          "Add missing punctuation: where is my bag",
          "Rewrite: wow that is a big dog"
        ]
      }
    ]
  },
  {
    unit: 4,
    title: "Listening and Speaking",
    lessons: [
      {
        lesson: 1,
        topic: "Good Listening Skills",
        content: "We listen to understand what others say. Do not interrupt when someone is speaking.",
        tips: "Look at the speaker, keep quiet, and think about what they said.",
        activities: [
          "Listen to your teacher and repeat the message exactly.",
          "Play 'Chinese Whispers' to test your listening skills."
        ]
      },
      {
        lesson: 2,
        topic: "Speaking Clearly",
        content: "Speak slowly and use full sentences so others can understand you.",
        activities: [
          "Stand up and say your name and favourite food.",
          "Describe one thing you like doing at home."
        ]
      },
      {
        lesson: 3,
        topic: "Storytelling",
        content: "Telling stories helps us share ideas and practice speaking English.",
        activities: [
          "Tell a short story about 'A Rainy Day'.",
          "Ask your friends what they liked about your story."
        ]
      }
    ]
  },
  {
    unit: 5,
    title: "Creative Writing and Poetry",
    lessons: [
      {
        lesson: 1,
        topic: "Rhymes and Poems",
        content: "A poem can rhyme or use rhythm. Rhyming words sound the same at the end.",
        examples: ["cat–hat", "day–play", "sun–fun"],
        activities: [
          "Write a 4-line poem about your pet or school.",
          "Find 3 rhyming word pairs."
        ]
      },
      {
        lesson: 2,
        topic: "Writing a Simple Letter",
        content: "A letter has parts: date, greeting, body, closing, and name.",
        example: "Dear Friend, Thank you for visiting me. Love, Rudo.",
        activities: [
          "Write a short letter to your friend inviting them to play.",
          "Add a greeting and closing."
        ]
      }
    ]
  },
  {
    unit: 6,
    title: "Revision and Practice Tests",
    lessons: [
      {
        lesson: 1,
        topic: "Reading Revision",
        content: "Let's review all your reading and comprehension skills! You must be able to read short stories and answer questions correctly.",
        story: "Tendai found a lost puppy near the market. He took it home, gave it water, and named it Lucky. The puppy became his best friend.",
        questions: [
          "Who found the puppy?",
          "Where did he find it?",
          "What name did he give to the puppy?",
          "Why do you think the puppy was called Lucky?"
        ],
        answers: [
          "Tendai found the puppy.",
          "He found it near the market.",
          "He named it Lucky.",
          "Because Tendai helped the puppy and it found a home."
        ],
        activities: [
          "Read the story and answer all questions",
          "Practice reading with expression"
        ]
      },
      {
        lesson: 2,
        topic: "Grammar Practice",
        content: "Revise parts of speech, punctuation, and tenses.",
        questions: [
          "Underline the nouns: The boy kicked the ball.",
          "Circle the verbs: She sings and dances.",
          "Add the correct punctuation: where is your bag",
          "Write the plural: box, baby, tree, leaf."
        ],
        answers: [
          "Nouns: boy, ball.",
          "Verbs: sings, dances.",
          "Where is your bag?",
          "boxes, babies, trees, leaves."
        ],
        activities: [
          "Complete all grammar exercises",
          "Review parts of speech"
        ]
      },
      {
        lesson: 3,
        topic: "Writing Practice",
        content: "Write short sentences and paragraphs to show what you have learned.",
        instructions: [
          "Write 3 sentences about your best friend.",
          "Write a paragraph (5 sentences) about your favourite food.",
          "Write a letter to your teacher thanking them for helping you learn English."
        ],
        tips: "Remember: Begin each sentence with a capital letter. End with a full stop. Use neat handwriting.",
        activities: [
          "Complete all writing tasks",
          "Check your punctuation and spelling"
        ]
      },
      {
        lesson: 4,
        topic: "Speaking and Listening Practice",
        content: "You will answer questions, read aloud, and tell stories to show your confidence in English.",
        activities: [
          "Read your paragraph aloud to your partner.",
          "Tell a short story about your family trip.",
          "Play a question-and-answer game using 'who', 'what', 'where', 'when'."
        ],
        assessment_criteria: [
          "Clear pronunciation",
          "Good confidence and expression",
          "Complete sentences"
        ]
      },
      {
        lesson: 5,
        topic: "Final Test",
        instructions: [
          "Write a sentence using each: happy, school, and play.",
          "Change to plural: child, fox, lady.",
          "Read this and answer: Rudo likes reading books. She goes to the library every week. What does Rudo like doing?",
          "Write 4 lines of a short poem about rain."
        ],
        content: "Answer these final test questions to complete your Grade 3 English Language book.",
        answers: [
          "Example: I am happy to play at school.",
          "children, foxes, ladies.",
          "She likes reading books.",
          "Sample poem:\nThe rain is falling down,\nIt splashes on the ground,\nI watch it from my room,\nAnd see the flowers bloom."
        ],
        activities: [
          "Complete the final test",
          "Review all your answers"
        ]
      }
    ]
  }
];

function generateQuestionsFromLesson(lesson: EnglishLesson): Array<{
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}> {
  const questions = [];

  if (lesson.topic === "Reading Short Stories") {
    questions.push(
      {
        question: "What helps us learn new words and ideas?",
        options: ["Sleeping", "Reading", "Running", "Eating"],
        correctAnswer: "Reading",
        explanation: "Reading helps us learn new words and ideas from stories."
      },
      {
        question: "In the story, who planted the mango seed?",
        options: ["Lucky", "Rudo", "Tendai", "The teacher"],
        correctAnswer: "Tendai",
        explanation: "Tendai planted a mango seed and watered it every day."
      },
      {
        question: "What grew from the seed that Tendai planted?",
        options: ["A flower", "A mango tree", "A vegetable", "Nothing"],
        correctAnswer: "A mango tree",
        explanation: "After watering the seed, it grew into a big mango tree."
      }
    );
  } else if (lesson.topic === "Nouns – Naming Words") {
    questions.push(
      {
        question: "What is a noun?",
        options: ["An action word", "A describing word", "A naming word", "A connecting word"],
        correctAnswer: "A naming word",
        explanation: "A noun is a word that names a person, place, or thing."
      },
      {
        question: "Which of these is a noun?",
        options: ["run", "quickly", "school", "beautiful"],
        correctAnswer: "school",
        explanation: "School is a noun because it names a place."
      },
      {
        question: "How many nouns are in this sentence: 'The cat sat on the mat'?",
        options: ["1", "2", "3", "4"],
        correctAnswer: "2",
        explanation: "Cat and mat are the two nouns in this sentence."
      }
    );
  } else if (lesson.topic === "Verbs – Action Words") {
    questions.push(
      {
        question: "What does a verb show?",
        options: ["What something looks like", "What someone is doing", "Where something is", "How many things there are"],
        correctAnswer: "What someone is doing",
        explanation: "A verb shows what someone or something is doing."
      },
      {
        question: "Which word is a verb?",
        options: ["happy", "jump", "red", "school"],
        correctAnswer: "jump",
        explanation: "Jump is a verb because it shows an action."
      },
      {
        question: "Choose the sentence with a verb:",
        options: ["The big house", "A red ball", "She sings beautifully", "My friend"],
        correctAnswer: "She sings beautifully",
        explanation: "Sings is the verb that shows what she is doing."
      }
    );
  } else if (lesson.topic === "Adjectives – Describing Words") {
    questions.push(
      {
        question: "What do adjectives do?",
        options: ["Describe nouns", "Show actions", "Connect words", "Ask questions"],
        correctAnswer: "Describe nouns",
        explanation: "Adjectives describe nouns and tell us how something looks, feels, or sounds."
      },
      {
        question: "Which word is an adjective?",
        options: ["run", "table", "tall", "quickly"],
        correctAnswer: "tall",
        explanation: "Tall is an adjective that describes how something looks."
      },
      {
        question: "Complete with an adjective: 'The _____ cat is sleeping.'",
        options: ["runs", "sleeping", "soft", "and"],
        correctAnswer: "soft",
        explanation: "Soft is an adjective that describes the cat."
      }
    );
  } else if (lesson.topic === "Writing Sentences") {
    questions.push(
      {
        question: "How does a sentence begin?",
        options: ["With a small letter", "With a capital letter", "With a number", "With a comma"],
        correctAnswer: "With a capital letter",
        explanation: "A sentence always begins with a capital letter."
      },
      {
        question: "How does a sentence end?",
        options: ["With a comma", "With a space", "With a full stop", "With a word"],
        correctAnswer: "With a full stop",
        explanation: "A sentence ends with a full stop, question mark, or exclamation mark."
      },
      {
        question: "Which is a complete sentence?",
        options: ["my name", "My name is Tanaka.", "is Tanaka", "name Tanaka"],
        correctAnswer: "My name is Tanaka.",
        explanation: "This is a complete sentence with a capital letter, subject, and full stop."
      }
    );
  } else {
    questions.push(
      {
        question: `What is the main topic of this lesson?`,
        options: ["Mathematics", lesson.topic, "Science", "Art"],
        correctAnswer: lesson.topic,
        explanation: `This lesson focuses on ${lesson.topic}.`
      },
      {
        question: "Reading and practicing helps you:",
        options: ["Get worse at English", "Learn nothing", "Improve your skills", "Forget what you learned"],
        correctAnswer: "Improve your skills",
        explanation: "Practice and reading help improve your English language skills."
      },
      {
        question: "Why is it important to learn English?",
        options: ["It's not important", "To communicate and understand better", "Just for fun", "To waste time"],
        correctAnswer: "To communicate and understand better",
        explanation: "Learning English helps us communicate effectively and understand the world around us."
      }
    );
  }

  while (questions.length < 5) {
    questions.push({
      question: `Which of these activities is mentioned in the lesson on ${lesson.topic}?`,
      options: [
        lesson.activities[0] || "Practice reading",
        "Watch TV",
        "Play outside",
        "Sleep"
      ],
      correctAnswer: lesson.activities[0] || "Practice reading",
      explanation: `The lesson suggests: ${lesson.activities[0] || "practicing to improve your skills"}.`
    });
  }

  return questions.slice(0, 5);
}

export async function seedEnglishGrade3Zimbabwe() {
  try {
    console.log('📚 Starting Grade 3 English Language (Zimbabwe) seeding...');

    // Ensure admin user exists and get their ID
    const adminUserId = await ensureAdminUser();
    console.log(`✅ Using admin user ID: ${adminUserId}`);

    const existingSubject = await db
      .select()
      .from(subjects)
      .where(and(
        eq(subjects.name, 'English Language'),
        eq(subjects.gradeLevel, 3),
        eq(subjects.gradeSystem, 'zimbabwe')
      ))
      .limit(1);

    let subjectId: string;

    if (existingSubject.length > 0) {
      console.log('✓ English Language Grade 3 subject already exists');
      subjectId = existingSubject[0].id;
      
      // Update existing subject to have admin as creator if not set
      if (!existingSubject[0].createdBy) {
        await db
          .update(subjects)
          .set({ createdBy: adminUserId })
          .where(eq(subjects.id, subjectId));
        console.log('✅ Updated existing subject with admin creator');
      }
    } else {
      const [newSubject] = await db
        .insert(subjects)
        .values({
          name: 'English Language',
          gradeSystem: 'zimbabwe',
          gradeLevel: 3,
          description: 'English Language curriculum for Grade 3 students in Zimbabwe, covering reading, writing, grammar, listening, and speaking skills.',
          createdBy: adminUserId,
          isActive: true
        })
        .returning();

      subjectId = newSubject.id;
      console.log('✅ Created English Language Grade 3 subject with admin as creator');
    }

    for (const unit of englishGrade3Units) {
      const existingChapter = await db
        .select()
        .from(subjectChapters)
        .where(and(
          eq(subjectChapters.subjectId, subjectId),
          eq(subjectChapters.title, unit.title)
        ))
        .limit(1);

      let chapterId: string;

      if (existingChapter.length > 0) {
        console.log(`⏭️  Unit "${unit.title}" already exists, skipping...`);
        chapterId = existingChapter[0].id;
        
        const existingLessons = await db
          .select()
          .from(subjectLessons)
          .where(eq(subjectLessons.chapterId, chapterId));

        if (existingLessons.length > 0) {
          console.log(`  ⏭️  Lessons already exist for this unit`);
          continue;
        }
      } else {
        const [newChapter] = await db
          .insert(subjectChapters)
          .values({
            subjectId: subjectId,
            title: unit.title,
            description: `Unit ${unit.unit}: ${unit.title}`,
            order: unit.unit,
            isActive: true
          })
          .returning();

        chapterId = newChapter.id;
        console.log(`✅ Created Unit ${unit.unit}: ${unit.title}`);
      }

      for (let i = 0; i < unit.lessons.length; i++) {
        const lesson = unit.lessons[i];

        const examplesArray = lesson.examples || (lesson.example ? [lesson.example] : []);
        const notesContent = [
          lesson.content,
          lesson.tips ? `\n**Tips:** ${lesson.tips}` : '',
          lesson.story ? `\n**Story:**\n${lesson.story}` : '',
          lesson.questions && lesson.questions.length > 0 ? `\n**Questions:**\n${lesson.questions.map((q, idx) => `${idx + 1}. ${q}`).join('\n')}` : '',
          lesson.instructions && lesson.instructions.length > 0 ? `\n**Instructions:**\n${lesson.instructions.map((inst, idx) => `${idx + 1}. ${inst}`).join('\n')}` : '',
          lesson.assessment_criteria && lesson.assessment_criteria.length > 0 ? `\n**Assessment Criteria:**\n${lesson.assessment_criteria.map((c, idx) => `${idx + 1}. ${c}`).join('\n')}` : ''
        ].filter(Boolean).join('\n');

        const [insertedLesson] = await db
          .insert(subjectLessons)
          .values({
            chapterId: chapterId,
            title: lesson.topic,
            notes: notesContent,
            examples: examplesArray,
            cloudinaryImages: [],
            order: i + 1,
            durationMinutes: 30,
            isActive: true
          })
          .returning();

        console.log(`  ✅ Created Lesson ${i + 1}: ${lesson.topic}`);

        const quizQuestions = generateQuestionsFromLesson(lesson);
        for (let j = 0; j < quizQuestions.length; j++) {
          const question = quizQuestions[j];
          
          await db
            .insert(subjectExercises)
            .values({
              lessonId: insertedLesson.id,
              question: question.question,
              options: question.options,
              correctAnswer: question.correctAnswer,
              explanation: question.explanation,
              order: j + 1,
              isActive: true
            });
        }
        console.log(`  ✅ Added ${quizQuestions.length} quiz questions`);
      }
    }

    console.log('🎉 Grade 3 English Language (Zimbabwe) seeding completed!');

  } catch (error) {
    console.error('❌ Error seeding Grade 3 English Language:', error);
    throw error;
  }
}
