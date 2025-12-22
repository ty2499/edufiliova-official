import { db } from './db';
import { subjects, subjectChapters, subjectLessons, subjectExercises } from '../shared/schema';
import { eq, and } from 'drizzle-orm';
import { ensureAdminUser } from './ensure-admin-user';

interface ComputerScienceLesson {
  title: string;
  notes: string;
  examples: string[];
  mediaUrl?: string;
  questions: Array<{
    question: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
  }>;
}

// Define Computer Science chapters and lessons
const computerScienceChapters = [
  {
    title: "Digital Literacy & Safety",
    description: "Understanding computers, internet, and digital citizenship",
    order: 1,
    lessons: [
      {
        title: "Introduction to Computers",
        mediaUrl: "/attached_assets/generated_images/Computer_hardware_educational_diagram_df5cc348.png",
        notes: `A computer is an electronic device that processes data and performs tasks according to instructions. Modern computers consist of two main components: hardware and software.

**Hardware Components:**
Hardware refers to the physical parts of a computer that you can touch. Key components include:

- **Input Devices**: Keyboard, mouse, microphone, touchscreen - these allow you to enter information into the computer
- **Output Devices**: Monitor, speakers, printer - these display or present information from the computer
- **Processing Unit (CPU)**: Often called the "brain" of the computer, this processes instructions and calculations
- **Memory (RAM)**: Temporary storage that holds data and programs currently being used
- **Storage Devices**: Hard drives, SSDs, USB drives - permanent storage for files and programs

**Software Components:**
Software consists of programs and applications that run on the computer:

- **Operating System**: Windows, macOS, Linux - manages the computer's hardware and other software
- **Applications**: Word processors, web browsers, games - programs that help users accomplish specific tasks
- **System Software**: Device drivers, utilities - programs that help the computer function properly

**How Computers Work:**
1. Input: User enters data through input devices
2. Processing: CPU processes the data according to program instructions
3. Storage: Data is temporarily stored in RAM or permanently saved to storage devices
4. Output: Results are displayed through output devices

Understanding these basics helps you make better decisions about technology and troubleshoot simple problems.`,
        examples: [
          "Input Example: Typing on a keyboard sends electrical signals to the computer, which converts them into letters on screen",
          "Processing Example: When you click 'Calculate' in a math program, the CPU performs the mathematical operations",
          "Storage Example: Saving a document moves it from temporary RAM to permanent storage on your hard drive",
          "Output Example: Playing music sends audio data from storage through the sound card to your speakers"
        ],
        questions: [
          {
            question: "Which component is considered the 'brain' of the computer?",
            options: ["Hard Drive", "CPU", "Monitor", "Keyboard"],
            correctAnswer: "CPU",
            explanation: "The CPU (Central Processing Unit) is called the brain because it processes all instructions and calculations."
          },
          {
            question: "What type of device is a keyboard?",
            options: ["Output device", "Storage device", "Input device", "Processing device"],
            correctAnswer: "Input device",
            explanation: "A keyboard is an input device because it allows users to enter information into the computer."
          },
          {
            question: "Which of these is an example of software?",
            options: ["Monitor", "Mouse", "Operating System", "Hard Drive"],
            correctAnswer: "Operating System",
            explanation: "An operating system is software that manages the computer's hardware and other programs."
          },
          {
            question: "What does RAM stand for?",
            options: ["Read Access Memory", "Random Access Memory", "Rapid Access Memory", "Real Application Memory"],
            correctAnswer: "Random Access Memory",
            explanation: "RAM stands for Random Access Memory, which provides temporary storage for active programs and data."
          },
          {
            question: "Which device would you use to print a document?",
            options: ["Input device", "Processing device", "Output device", "Storage device"],
            correctAnswer: "Output device",
            explanation: "A printer is an output device because it takes information from the computer and produces physical output."
          }
        ]
      },
      {
        title: "The Internet & Web",
        notes: `The Internet is a global network of interconnected computers that allows information sharing worldwide. The World Wide Web (WWW) is a system of linked documents and resources accessed through the Internet.

**Understanding the Internet:**
The Internet is like a massive highway system connecting millions of computers globally. Key concepts include:

- **Network**: A group of connected computers that can share information
- **Internet Service Provider (ISP)**: Companies that provide Internet access to homes and businesses
- **IP Address**: A unique number assigned to every device on the Internet (like a postal address)
- **Domain Name**: Human-friendly web addresses like google.com or edufiliova.com

**Web Browsers:**
Web browsers are programs that help you navigate and view content on the Internet:

- **Popular Browsers**: Chrome, Firefox, Safari, Edge
- **Browser Functions**: Display web pages, manage bookmarks, store passwords, handle downloads
- **Address Bar**: Where you type web addresses (URLs)
- **Tabs**: Allow you to view multiple websites simultaneously

**Search Engines:**
Search engines help you find information on the vast Internet:

- **How They Work**: Search engines use programs called "crawlers" to index billions of web pages
- **Popular Search Engines**: Google, Bing, Yahoo, DuckDuckGo
- **Search Tips**: Use specific keywords, put phrases in quotes, use minus signs to exclude terms

**Websites and Web Pages:**
- **Website**: A collection of related web pages under one domain name
- **Web Page**: A single document on the Internet, usually written in HTML
- **Homepage**: The main page of a website, usually the first page visitors see
- **Hyperlinks**: Clickable text or images that take you to other pages or websites

**Internet Safety Basics:**
- Only visit websites you trust
- Be careful what information you share online
- Don't download files from unknown sources
- Use strong, unique passwords for different websites`,
        examples: [
          "Browsing Example: Type 'www.nasa.gov' in your browser to visit NASA's website and learn about space",
          "Search Example: Search 'how to bake cookies' to find thousands of recipes and cooking videos",
          "Navigation Example: Click on links in Wikipedia articles to learn about related topics",
          "Website Example: A school website might have pages for news, calendar, courses, and contact information"
        ],
        questions: [
          {
            question: "What does WWW stand for?",
            options: ["World Wide Web", "World Wide Wire", "Web Wide World", "Wide World Web"],
            correctAnswer: "World Wide Web",
            explanation: "WWW stands for World Wide Web, the system of linked documents accessed through the Internet."
          },
          {
            question: "Which of these is a web browser?",
            options: ["Google", "Windows", "Chrome", "Internet"],
            correctAnswer: "Chrome",
            explanation: "Chrome is a web browser. Google is a search engine, Windows is an operating system."
          },
          {
            question: "What is an IP address?",
            options: ["A type of website", "A unique number for Internet devices", "A web browser", "A search engine"],
            correctAnswer: "A unique number for Internet devices",
            explanation: "An IP address is a unique numerical identifier assigned to every device connected to the Internet."
          },
          {
            question: "What does ISP stand for?",
            options: ["Internet Service Provider", "Internet Safety Protocol", "International Service Provider", "Internet Security Program"],
            correctAnswer: "Internet Service Provider",
            explanation: "ISP stands for Internet Service Provider, companies that provide Internet access to users."
          },
          {
            question: "What are hyperlinks?",
            options: ["Fast Internet connections", "Clickable elements that take you to other pages", "Types of websites", "Search engines"],
            correctAnswer: "Clickable elements that take you to other pages",
            explanation: "Hyperlinks are clickable text or images that connect web pages and allow navigation between them."
          }
        ]
      }
    ]
  },
  {
    title: "Programming Fundamentals",
    description: "Introduction to algorithms, flowcharts, and basic programming concepts",
    order: 2,
    lessons: [
      {
        title: "Introduction to Algorithms & Flowcharts",
        notes: `An algorithm is a step-by-step set of instructions used to solve a problem or complete a task. Think of algorithms as recipes - they provide clear, ordered steps to achieve a desired outcome.

**What is an Algorithm?**
Algorithms are everywhere in daily life:
- A recipe for making sandwiches
- Instructions for assembling furniture
- Steps to solve a math problem
- Directions to get from home to school

**Characteristics of Good Algorithms:**
- **Clear**: Each step should be easy to understand
- **Precise**: No ambiguity about what to do
- **Finite**: The algorithm must eventually end
- **Effective**: It should solve the intended problem
- **Input/Output**: Takes some input and produces output

**Flowcharts:**
Flowcharts are visual representations of algorithms using symbols and arrows:

**Flowchart Symbols:**
- **Oval**: Start/End (Terminal)
- **Rectangle**: Process/Action
- **Diamond**: Decision/Question
- **Parallelogram**: Input/Output
- **Arrow**: Flow direction

**Creating Flowcharts:**
1. Start with the problem you want to solve
2. Break it down into simple steps
3. Use appropriate symbols for each step
4. Connect symbols with arrows showing the flow
5. Test your flowchart by following it step-by-step

**Example Algorithm - Making Tea:**
1. Start
2. Boil water
3. Put tea bag in cup
4. Pour hot water into cup
5. Wait 3-5 minutes
6. Remove tea bag
7. Add sugar if desired
8. Stir
9. Tea is ready
10. End

**Benefits of Algorithms:**
- Help organize thoughts and solve problems systematically
- Can be followed by anyone to get consistent results
- Form the foundation for computer programming
- Improve logical thinking skills`,
        examples: [
          "Daily Algorithm: Getting ready for school - wake up, brush teeth, eat breakfast, pack bag, leave house",
          "Math Algorithm: Finding the area of a rectangle - measure length, measure width, multiply length × width",
          "Game Algorithm: Rock Paper Scissors - choose your move, reveal moves, compare choices, determine winner",
          "Cooking Algorithm: Making toast - get bread, put in toaster, select setting, push down lever, wait, take out toast"
        ],
        questions: [
          {
            question: "What is an algorithm?",
            options: ["A computer program", "A step-by-step set of instructions", "A type of calculator", "A programming language"],
            correctAnswer: "A step-by-step set of instructions",
            explanation: "An algorithm is a step-by-step set of instructions used to solve a problem or complete a task."
          },
          {
            question: "Which flowchart symbol represents a decision?",
            options: ["Rectangle", "Oval", "Diamond", "Circle"],
            correctAnswer: "Diamond",
            explanation: "A diamond symbol represents a decision or question in a flowchart."
          },
          {
            question: "What does the oval symbol represent in a flowchart?",
            options: ["Process", "Decision", "Start/End", "Input/Output"],
            correctAnswer: "Start/End",
            explanation: "Oval symbols represent the start and end points (terminals) of a flowchart."
          },
          {
            question: "Which is NOT a characteristic of a good algorithm?",
            options: ["Clear", "Infinite", "Precise", "Effective"],
            correctAnswer: "Infinite",
            explanation: "A good algorithm must be finite - it should eventually end. Infinite algorithms would never complete."
          },
          {
            question: "What shape represents a process in a flowchart?",
            options: ["Diamond", "Rectangle", "Oval", "Circle"],
            correctAnswer: "Rectangle",
            explanation: "Rectangle symbols represent processes or actions in a flowchart."
          }
        ]
      }
    ]
  },
  {
    title: "ICT Applications",
    description: "Word processing, spreadsheets, presentations, and multimedia tools",
    order: 3,
    lessons: [
      {
        title: "Word Processing Skills",
        notes: `Word processing is the use of computer software to create, edit, format, and print text documents. Word processors have revolutionized how we create and share written content.

**What is Word Processing?**
Word processing software allows you to:
- Type and edit text easily
- Format documents to look professional
- Check spelling and grammar
- Insert images, tables, and other elements
- Save documents for future use
- Share documents with others

**Popular Word Processing Software:**
- **Microsoft Word**: Most widely used word processor
- **Google Docs**: Cloud-based, allows real-time collaboration
- **LibreOffice Writer**: Free, open-source alternative
- **Pages**: Apple's word processor for Mac

**Basic Word Processing Skills:**

**1. Document Creation and Editing:**
- Creating new documents
- Opening existing documents
- Typing and entering text
- Selecting text (click and drag, double-click for words)
- Copy, cut, and paste operations
- Undo and redo functions
- Find and replace text

**2. Text Formatting:**
- **Font**: Changing typeface, size, and color
- **Style**: Bold, italic, underline, strikethrough
- **Alignment**: Left, center, right, justified
- **Line Spacing**: Single, double, or custom spacing
- **Lists**: Bulleted and numbered lists
- **Indentation**: Moving text left or right

**3. Document Structure:**
- **Paragraphs**: Organizing text into logical sections
- **Headings**: Using different heading levels (Heading 1, 2, 3)
- **Page Breaks**: Starting new pages
- **Headers and Footers**: Information at top/bottom of pages
- **Page Numbers**: Automatic page numbering

**4. Advanced Features:**
- **Tables**: Organizing data in rows and columns
- **Images**: Inserting and positioning pictures
- **Spell Check**: Automatically finding spelling errors
- **Grammar Check**: Identifying grammatical mistakes
- **Templates**: Pre-designed document layouts

**Professional Document Tips:**
- Use consistent formatting throughout
- Choose appropriate fonts (Arial, Times New Roman for formal documents)
- Keep line spacing consistent
- Use headings to organize content
- Proofread before sharing or printing`,
        examples: [
          "School Report: Create a science report with title, headings, paragraphs, and inserted images of experiments",
          "Business Letter: Format a formal letter with proper heading, date, address, salutation, body, and signature",
          "Newsletter: Use columns, images, and varied fonts to create an engaging class newsletter",
          "Resume: Format personal information, education, and skills using tables and bullet points"
        ],
        questions: [
          {
            question: "What is word processing?",
            options: ["Creating spreadsheets", "Using computer software to create text documents", "Making presentations", "Browsing the internet"],
            correctAnswer: "Using computer software to create text documents",
            explanation: "Word processing is the use of computer software to create, edit, format, and print text documents."
          },
          {
            question: "Which of these is a word processing software?",
            options: ["Excel", "PowerPoint", "Microsoft Word", "Calculator"],
            correctAnswer: "Microsoft Word",
            explanation: "Microsoft Word is a popular word processing software. Excel is for spreadsheets, PowerPoint is for presentations."
          },
          {
            question: "What does 'Ctrl+C' typically do in word processing?",
            options: ["Close document", "Copy selected text", "Create new document", "Change font color"],
            correctAnswer: "Copy selected text",
            explanation: "Ctrl+C is the keyboard shortcut for copying selected text to the clipboard."
          },
          {
            question: "What is the purpose of headers and footers?",
            options: ["To make text bold", "To add information at the top/bottom of pages", "To change font size", "To insert images"],
            correctAnswer: "To add information at the top/bottom of pages",
            explanation: "Headers and footers provide consistent information (like page numbers, titles) at the top and bottom of document pages."
          },
          {
            question: "Which alignment centers text on the page?",
            options: ["Left alignment", "Right alignment", "Center alignment", "Justify alignment"],
            correctAnswer: "Center alignment",
            explanation: "Center alignment positions text in the middle of the page, equally spaced from left and right margins."
          }
        ]
      }
    ]
  },
  {
    title: "Emerging Technologies",
    description: "Introduction to AI, robotics, and cybersecurity basics",
    order: 4,
    lessons: [
      {
        title: "Artificial Intelligence Basics",
        notes: `Artificial Intelligence (AI) is the development of computer systems that can perform tasks typically requiring human intelligence. AI is rapidly becoming part of our daily lives and is transforming how we work, learn, and interact with technology.

**What is Artificial Intelligence?**
AI refers to computer systems that can:
- Learn from experience
- Recognize patterns
- Make decisions
- Solve problems
- Understand language
- Process visual information

**Types of AI:**

**1. Narrow AI (Weak AI):**
- Designed for specific tasks
- Most AI we encounter today
- Examples: Voice assistants, recommendation systems, spam filters

**2. General AI (Strong AI):**
- Theoretical AI that could perform any intellectual task
- Does not exist yet
- Would match human cognitive abilities

**Common AI Applications:**

**1. Voice Assistants:**
- Siri, Alexa, Google Assistant
- Understand speech and respond to questions
- Can control smart home devices

**2. Recommendation Systems:**
- Netflix suggests movies you might like
- YouTube recommends videos
- Online stores suggest products

**3. Image Recognition:**
- Photo tagging on social media
- Medical diagnosis from X-rays
- Self-driving car navigation

**4. Language Translation:**
- Google Translate
- Real-time conversation translation
- Document translation

**How AI Learns:**
AI systems learn through a process called machine learning:
- **Training Data**: Large amounts of examples
- **Patterns**: AI finds patterns in the data
- **Prediction**: Uses patterns to make predictions about new data
- **Improvement**: Gets better with more data and feedback

**AI in Education:**
- Personalized learning experiences
- Automatic grading and feedback
- Language learning apps
- Educational chatbots
- Content recommendation

**Benefits of AI:**
- Automates repetitive tasks
- Processes information faster than humans
- Available 24/7
- Can handle large amounts of data
- Assists in complex decision-making

**AI Challenges and Ethics:**
- Job displacement concerns
- Privacy and data security
- Bias in AI systems
- Need for human oversight
- Importance of ethical AI development

**Future of AI:**
AI will continue advancing in areas like healthcare, transportation, education, and entertainment while requiring careful consideration of ethical implications.`,
        examples: [
          "Personal Example: When you ask Siri 'What's the weather today?', AI processes your speech, understands the question, and provides relevant weather information",
          "Shopping Example: Amazon uses AI to analyze your purchase history and browsing behavior to suggest products you might want to buy",
          "Social Media Example: Instagram uses AI to recognize faces in photos and suggest who to tag automatically",
          "Gaming Example: AI opponents in video games learn your playing style and adapt their strategies to provide challenging gameplay"
        ],
        questions: [
          {
            question: "What is Artificial Intelligence?",
            options: ["A type of computer hardware", "Computer systems that perform tasks requiring human intelligence", "A programming language", "A type of internet connection"],
            correctAnswer: "Computer systems that perform tasks requiring human intelligence",
            explanation: "AI refers to computer systems that can perform tasks typically requiring human intelligence, such as learning, reasoning, and problem-solving."
          },
          {
            question: "Which of these is an example of Narrow AI?",
            options: ["A robot that can do any human task", "Netflix movie recommendations", "A computer that thinks like humans", "A universal problem solver"],
            correctAnswer: "Netflix movie recommendations",
            explanation: "Netflix recommendations are Narrow AI - designed for the specific task of suggesting movies based on viewing history."
          },
          {
            question: "How do AI systems typically learn?",
            options: ["By reading books", "Through machine learning with training data", "By copying human brains", "Through manual programming only"],
            correctAnswer: "Through machine learning with training data",
            explanation: "AI systems learn through machine learning, using large amounts of training data to find patterns and make predictions."
          },
          {
            question: "Which is NOT a common AI application?",
            options: ["Voice assistants", "Image recognition", "Physical exercise", "Language translation"],
            correctAnswer: "Physical exercise",
            explanation: "Physical exercise is a human activity. Voice assistants, image recognition, and language translation are all common AI applications."
          },
          {
            question: "What is a key ethical concern about AI?",
            options: ["AI uses too much electricity", "AI systems can be biased", "AI is too expensive", "AI is too slow"],
            correctAnswer: "AI systems can be biased",
            explanation: "Bias in AI systems is a major ethical concern, as AI can perpetuate or amplify human biases present in training data."
          }
        ]
      }
    ]
  }
];

export async function seedComputerScienceSubject() {
  try {
    console.log('💻 Starting Computer Science subject setup...');

    // Ensure admin user exists and get their ID
    const adminUserId = await ensureAdminUser();
    console.log(`✅ Using admin user ID: ${adminUserId}`);

    // Check if Computer Science subject already exists
    const existingSubject = await db
      .select()
      .from(subjects)
      .where(and(eq(subjects.name, 'Computer Science'), eq(subjects.gradeLevel, 7)))
      .limit(1);

    let subjectId: string;

    if (existingSubject.length === 0) {
      // Create Computer Science subject
      const insertedSubject = await db
        .insert(subjects)
        .values({
          name: 'Computer Science',
          gradeSystem: 'international',
          gradeLevel: 7,
          description: 'Comprehensive introduction to computer science, programming, and digital literacy',
          iconUrl: null,
          createdBy: adminUserId,
          isActive: true
        })
        .returning();

      subjectId = insertedSubject[0].id;
      console.log('✅ Created Computer Science subject with admin as creator');
    } else {
      subjectId = existingSubject[0].id;
      console.log('📚 Computer Science subject already exists');
      
      // Update existing subject to have admin as creator if not set
      if (!existingSubject[0].createdBy) {
        await db
          .update(subjects)
          .set({ createdBy: adminUserId })
          .where(eq(subjects.id, subjectId));
        console.log('✅ Updated existing subject with admin creator');
      }
    }

    // Create chapters and lessons
    for (const chapterData of computerScienceChapters) {
      console.log(`📖 Processing chapter: ${chapterData.title}`);

      // Check if chapter already exists
      const existingChapter = await db
        .select()
        .from(subjectChapters)
        .where(and(
          eq(subjectChapters.subjectId, subjectId),
          eq(subjectChapters.title, chapterData.title)
        ))
        .limit(1);

      let chapterId: string;

      if (existingChapter.length === 0) {
        // Create chapter
        const insertedChapter = await db
          .insert(subjectChapters)
          .values({
            subjectId: subjectId,
            title: chapterData.title,
            description: chapterData.description,
            order: chapterData.order,
            isActive: true
          })
          .returning();

        chapterId = insertedChapter[0].id;
        console.log(`✅ Created chapter: ${chapterData.title}`);
      } else {
        chapterId = existingChapter[0].id;
        console.log(`📚 Chapter ${chapterData.title} already exists`);
      }

      // Create lessons for this chapter
      for (let i = 0; i < chapterData.lessons.length; i++) {
        const lessonData = chapterData.lessons[i];
        console.log(`📝 Processing lesson: ${lessonData.title}`);

        // Check if lesson already exists
        const existingLesson = await db
          .select()
          .from(subjectLessons)
          .where(and(
            eq(subjectLessons.chapterId, chapterId),
            eq(subjectLessons.title, lessonData.title)
          ))
          .limit(1);

        if (existingLesson.length === 0) {
          // Create lesson
          const insertedLesson = await db
            .insert(subjectLessons)
            .values({
              chapterId: chapterId,
              title: lessonData.title,
              notes: lessonData.notes,
              examples: lessonData.examples,
              mediaUrl: lessonData.mediaUrl || null,
              cloudinaryImages: [], // Will be populated later with generated images
              order: i + 1,
              durationMinutes: 35,
              isActive: true
            })
            .returning();

          console.log(`✅ Created lesson: ${lessonData.title}`);

          // Create quiz questions for this lesson
          for (let j = 0; j < lessonData.questions.length; j++) {
            const questionData = lessonData.questions[j];

            await db
              .insert(subjectExercises)
              .values({
                lessonId: insertedLesson[0].id,
                question: questionData.question,
                options: questionData.options,
                correctAnswer: questionData.correctAnswer,
                explanation: questionData.explanation,
                order: j + 1,
                isActive: true
              });
          }

          console.log(`✅ Added ${lessonData.questions.length} quiz questions for ${lessonData.title}`);
        } else {
          console.log(`📚 Lesson ${lessonData.title} already exists`);
        }
      }
    }

    console.log('🎉 Computer Science subject setup completed!');

  } catch (error) {
    console.error('❌ Error setting up Computer Science subject:', error);
    throw error;
  }
}

// Note: Do NOT run this at module level - it will exit the process
// Call seedComputerScienceSubject() from server startup instead