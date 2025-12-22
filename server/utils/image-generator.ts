import { getOpenAIClient } from '../openai';
import { cloudflareR2Storage } from '../cloudflare-r2-storage';
import https from 'https';
import crypto from 'crypto';

interface GenerateImageOptions {
  prompt: string;
  size?: '1024x1024' | '1792x1024' | '1024x1792';
  quality?: 'standard' | 'hd';
  style?: 'vivid' | 'natural';
  folder?: string;
}

interface GeneratedImage {
  url: string;
  r2Key?: string;
  originalPrompt: string;
  uploadedToR2: boolean;
}

async function downloadImageToBuffer(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const request = https.get(url, { timeout: 60000 }, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download image: ${response.statusCode}`));
        return;
      }
      const chunks: Buffer[] = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    });
    request.on('error', reject);
    request.on('timeout', () => {
      request.destroy();
      reject(new Error('Download timeout'));
    });
  });
}

export async function generateAndSaveImage(
  options: GenerateImageOptions
): Promise<GeneratedImage> {
  const {
    prompt,
    size = '1024x1024',
    quality = 'standard',
    style = 'natural',
    folder = 'courses/generated-images'
  } = options;

  console.log('🎨 Generating image with prompt:', prompt.substring(0, 100) + '...');

  try {
    const openai = await getOpenAIClient();
    if (!openai) {
      throw new Error('OpenAI not configured');
    }
    
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: prompt,
      size: size,
      quality: quality,
      style: style,
      n: 1
    });

    const imageUrl = response.data?.[0]?.url;
    if (!imageUrl) {
      throw new Error('No image URL returned from OpenAI');
    }

    console.log('✅ Image generated successfully, downloading...');

    const hash = crypto.randomBytes(4).toString('hex');
    const sanitizedPrompt = prompt
      .substring(0, 40)
      .replace(/[^a-zA-Z0-9]/g, '_')
      .replace(/_+/g, '_')
      .toLowerCase();
    const filename = `${sanitizedPrompt}_${hash}.png`;

    const imageBuffer = await downloadImageToBuffer(imageUrl);
    console.log(`📥 Downloaded image (${(imageBuffer.length / 1024).toFixed(1)} KB)`);

    if (cloudflareR2Storage.isConfigured()) {
      console.log('📤 Uploading to Cloudflare R2...');
      
      const uploadResult = await cloudflareR2Storage.uploadFile(
        imageBuffer,
        filename,
        'image/png',
        folder
      );

      if (uploadResult.success && uploadResult.url) {
        console.log(`✅ Uploaded to R2: ${uploadResult.url}`);
        return {
          url: uploadResult.url,
          r2Key: uploadResult.key,
          originalPrompt: prompt,
          uploadedToR2: true
        };
      } else {
        console.warn(`⚠️ R2 upload failed: ${uploadResult.error}, returning temporary OpenAI URL`);
        return {
          url: imageUrl,
          originalPrompt: prompt,
          uploadedToR2: false
        };
      }
    } else {
      console.warn('⚠️ Cloudflare R2 not configured, returning temporary OpenAI URL');
      return {
        url: imageUrl,
        originalPrompt: prompt,
        uploadedToR2: false
      };
    }
  } catch (error: any) {
    console.error('❌ Image generation failed:', error.message);
    throw new Error(`Failed to generate image: ${error.message}`);
  }
}

export async function generateAndUploadToR2(
  prompt: string,
  filename: string,
  folder: string = 'courses/lesson-images'
): Promise<string | null> {
  try {
    const openai = await getOpenAIClient();
    if (!openai) {
      console.log('❌ OpenAI not configured');
      return null;
    }

    console.log(`🎨 Generating: ${prompt.substring(0, 50)}...`);
    
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: prompt,
      n: 1,
      size: '1024x1024',
      quality: 'hd',
      style: 'natural'
    });

    const tempUrl = response.data?.[0]?.url;
    if (!tempUrl) {
      console.log('❌ No image URL returned');
      return null;
    }

    console.log(`📥 Downloading generated image...`);
    const imageBuffer = await downloadImageToBuffer(tempUrl);
    
    if (!cloudflareR2Storage.isConfigured()) {
      console.log('❌ Cloudflare R2 not configured');
      return tempUrl;
    }

    console.log(`📤 Uploading to R2 (${(imageBuffer.length / 1024).toFixed(1)} KB)...`);
    const uploadResult = await cloudflareR2Storage.uploadFile(
      imageBuffer,
      filename,
      'image/png',
      folder
    );

    if (uploadResult.success && uploadResult.url) {
      console.log(`✅ Uploaded: ${uploadResult.url}`);
      return uploadResult.url;
    }
    
    console.log(`❌ Upload failed: ${uploadResult.error}`);
    return null;
  } catch (error: any) {
    console.log(`❌ Error: ${error.message}`);
    return null;
  }
}

export function createEducationalImagePrompt(
  topic: string,
  description: string,
  style: 'diagram' | 'illustration' | 'infographic' | 'realistic' = 'illustration'
): string {
  const styleInstructions = {
    diagram: 'Create a clean, educational diagram with clear labels and simple shapes.',
    illustration: 'Create a colorful, engaging educational illustration suitable for students.',
    infographic: 'Create a modern infographic with icons, text, and visual elements.',
    realistic: 'Create a realistic educational photograph or rendering.'
  };

  return `${styleInstructions[style]} Topic: ${topic}. ${description} Style: professional, educational, appropriate for students, high quality, clear and informative. NO TEXT IN IMAGE.`;
}
