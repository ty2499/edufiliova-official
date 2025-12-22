import OpenAI from "openai";
import { v2 as cloudinary } from 'cloudinary';
import { db } from "../server/db";
import { courses } from "../shared/schema";
import { eq, or, like, isNull } from "drizzle-orm";
import https from 'https';

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function initCloudinary() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary credentials not configured");
  }
  
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });
  
  console.log(`✅ Cloudinary configured for cloud: ${cloudName}`);
}

async function generateCourseImage(courseTitle: string, courseDescription: string): Promise<string> {
  const prompt = `Professional educational course thumbnail for "${courseTitle}". 
Modern, clean design with relevant visual elements representing the course topic. 
Professional color scheme, high quality, suitable for an online learning platform.
No text or letters in the image.`;

  console.log(`🎨 Generating image for: ${courseTitle}`);
  
  const response = await openai.images.generate({
    model: "dall-e-3",
    prompt: prompt,
    n: 1,
    size: "1024x1024",
    quality: "standard",
  });

  const imageUrl = response.data[0].url;
  if (!imageUrl) {
    throw new Error("No image URL returned from OpenAI");
  }
  
  console.log(`✅ Image generated successfully`);
  return imageUrl;
}

async function downloadImage(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      const chunks: Buffer[] = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    }).on('error', reject);
  });
}

async function uploadToCloudinary(imageBuffer: Buffer, courseId: string): Promise<string> {
  console.log(`📤 Uploading to Cloudinary...`);
  
  const result = await new Promise<any>((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder: 'courses/thumbnails',
        public_id: `course-${courseId}`,
        resource_type: 'image',
        quality: 'auto:good',
        fetch_format: 'auto',
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    ).end(imageBuffer);
  });
  
  console.log(`✅ Uploaded to Cloudinary: ${result.public_id}`);
  return result.secure_url;
}

async function fixCourseImages() {
  try {
    await initCloudinary();
    
    const coursesWithMissingImages = await db.select()
      .from(courses)
      .where(
        or(
          isNull(courses.thumbnailUrl),
          like(courses.thumbnailUrl, '%placeholder%'),
          like(courses.thumbnailUrl, '%unsplash%'),
          isNull(courses.image),
          like(courses.image, '%placeholder%')
        )
      );
    
    console.log(`\n📚 Found ${coursesWithMissingImages.length} courses with missing/placeholder images\n`);
    
    for (const course of coursesWithMissingImages) {
      console.log(`\n🔄 Processing: ${course.title} (${course.id})`);
      console.log(`   Current thumbnail: ${course.thumbnailUrl}`);
      console.log(`   Current image: ${course.image}`);
      
      try {
        const needsNewThumbnail = !course.thumbnailUrl || 
          course.thumbnailUrl.includes('placeholder') || 
          course.thumbnailUrl.includes('unsplash');
        
        const needsNewImage = !course.image || 
          course.image.includes('placeholder');
        
        if (needsNewThumbnail || needsNewImage) {
          const openaiImageUrl = await generateCourseImage(
            course.title, 
            course.description || ''
          );
          
          const imageBuffer = await downloadImage(openaiImageUrl);
          
          const cloudinaryUrl = await uploadToCloudinary(imageBuffer, course.id);
          
          const updates: any = {};
          if (needsNewThumbnail) {
            updates.thumbnailUrl = cloudinaryUrl;
          }
          if (needsNewImage) {
            updates.image = cloudinaryUrl;
          }
          
          await db.update(courses)
            .set(updates)
            .where(eq(courses.id, course.id));
          
          console.log(`✅ Updated course with new image: ${cloudinaryUrl}`);
        }
      } catch (error) {
        console.error(`❌ Error processing course ${course.id}:`, error);
      }
    }
    
    console.log(`\n✅ Course image fix complete!\n`);
    
  } catch (error) {
    console.error("Error fixing course images:", error);
    process.exit(1);
  }
}

fixCourseImages();
