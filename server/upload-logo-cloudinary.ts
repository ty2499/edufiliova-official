import { v2 as cloudinary } from 'cloudinary';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function uploadLogo() {
  try {
    console.log('📤 Uploading white logo to Cloudinary...');
    
    const logoPath = path.join(process.cwd(), 'public', 'edufiliova-white-logo.png');
    
    const result = await cloudinary.uploader.upload(logoPath, {
      folder: 'edufiliova',
      public_id: 'edufiliova-white-logo',
      overwrite: true,
      resource_type: 'image',
    });
    
    console.log('✅ Logo uploaded successfully!');
    console.log('🔗 Public URL:', result.secure_url);
    console.log('\nAdd this to your .env file:');
    console.log(`EDUFILIOVA_WHITE_LOGO_URL="${result.secure_url}"`);
    
    return result.secure_url;
  } catch (error) {
    console.error('❌ Error uploading logo:', error);
    throw error;
  }
}

uploadLogo();
