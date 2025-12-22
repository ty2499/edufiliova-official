import { CloudflareR2Storage } from '../cloudflare-r2-storage';
import * as fs from 'fs';
import * as path from 'path';

async function uploadImages() {
  const r2 = new CloudflareR2Storage();
  
  const images = [
    { file: 'attached_assets/generated_images/students_learning_together_collaboratively.png', name: 'students' },
    { file: 'attached_assets/generated_images/professional_teacher_teaching_virtually.png', name: 'teachers' },
    { file: 'attached_assets/generated_images/creative_freelancer_working_productively.png', name: 'freelancers' }
  ];
  
  const uploadedUrls: Record<string, string> = {};
  
  for (const img of images) {
    console.log(`Uploading ${img.name}...`);
    const fullPath = path.join(process.cwd(), img.file);
    const buffer = fs.readFileSync(fullPath);
    const result = await r2.uploadFile(buffer, `${img.name}-getstarted.png`, 'image/png', 'getstarted');
    
    if (result.success && result.url) {
      console.log(`✅ ${img.name}: ${result.url}`);
      uploadedUrls[img.name] = result.url;
    } else {
      console.error(`❌ Failed to upload ${img.name}:`, result.error);
    }
  }
  
  console.log('\n📋 URLs for GetStarted.tsx:');
  console.log(JSON.stringify(uploadedUrls, null, 2));
}

uploadImages().catch(console.error);
