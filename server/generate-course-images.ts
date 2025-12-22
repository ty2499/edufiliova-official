import fs from 'fs/promises';
import path from 'path';
import { generateAndSaveImage, createEducationalImagePrompt } from './utils/image-generator';

interface Lesson {
  id: string;
  title: string;
  content: string;
  mediaUrl?: string;
  imagePrompt?: string;
}

interface Chapter {
  id: string;
  title: string;
  lessons: Lesson[];
}

interface CourseBook {
  book: {
    title: string;
    grade: number;
    language: string;
    chapters: Chapter[];
  };
}

async function generateImagesForCourse(filePath: string) {
  console.log(`\n📚 Processing course file: ${filePath}`);
  
  try {
    // Read the JSON file
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const courseData: CourseBook = JSON.parse(fileContent);
    
    let totalLessons = 0;
    let imagesGenerated = 0;
    let imagesSkipped = 0;
    
    // Process each chapter
    for (const chapter of courseData.book.chapters) {
      console.log(`\n📖 Chapter: ${chapter.title}`);
      
      for (const lesson of chapter.lessons) {
        totalLessons++;
        
        // Skip if image already exists
        if (lesson.mediaUrl && lesson.mediaUrl.trim() !== '') {
          console.log(`  ⏭️  Skipping "${lesson.title}" - already has image`);
          imagesSkipped++;
          continue;
        }
        
        // Skip if no image prompt is provided
        if (!lesson.imagePrompt) {
          console.log(`  ⏭️  Skipping "${lesson.title}" - no image prompt provided`);
          imagesSkipped++;
          continue;
        }
        
        console.log(`  🎨 Generating image for "${lesson.title}"`);
        
        try {
          // Generate the image
          const result = await generateAndSaveImage({
            prompt: lesson.imagePrompt,
            size: '1024x1024',
            quality: 'standard',
            style: 'natural'
          });
          
          // Update the lesson with the image URL
          lesson.mediaUrl = result.publicUrl;
          imagesGenerated++;
          
          console.log(`  ✅ Image saved: ${result.publicUrl}`);
          
          // Add a small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 2000));
          
        } catch (error: any) {
          console.error(`  ❌ Failed to generate image for "${lesson.title}":`, error.message);
        }
      }
    }
    
    // Save the updated JSON file
    await fs.writeFile(
      filePath,
      JSON.stringify(courseData, null, 2),
      'utf-8'
    );
    
    console.log(`\n✅ Course file updated: ${filePath}`);
    console.log(`📊 Stats: ${totalLessons} total lessons, ${imagesGenerated} images generated, ${imagesSkipped} skipped`);
    
  } catch (error: any) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

async function main() {
  console.log('🚀 Starting course image generation...\n');
  
  // List of course JSON files to process
  const courseFiles = [
    'grade7_english.json',
    'grade7_mathematics.json',
    'grade7_science.json',
    'grade7_social_studies.json',
    'grade7_english_book.json',
    'grade7_math_book.json'
  ];
  
  for (const fileName of courseFiles) {
    const filePath = path.join(process.cwd(), fileName);
    
    try {
      await fs.access(filePath);
      await generateImagesForCourse(filePath);
    } catch (error) {
      console.log(`⏭️  Skipping ${fileName} - file not found`);
    }
  }
  
  console.log('\n✅ Image generation complete!');
}

// Run if called directly
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { generateImagesForCourse, main };
