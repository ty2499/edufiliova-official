import { CloudflareR2Storage } from '../cloudflare-r2-storage';
import * as fs from 'fs';
import * as path from 'path';

async function uploadAllAssets() {
  const r2 = new CloudflareR2Storage();
  
  const imagesToUpload = [
    'Students_studying_together_collaboratively_e313eeac.png',
    'Male_freelancer_headshot_e41c1a56.png',
    'Modern_freelancer_workspace_background_30112dbd.png',
    'Mature_female_freelancer_headshot_1046ea13.png',
    'Young_businessman_professional_headshot_76a308f7.png',
    'Young_businesswoman_professional_headshot_43cbcb58.png',
    'Middle_Eastern_man_professional_headshot_5735ac8b.png',
    'Hispanic_woman_professional_headshot_c0cc0322.png',
    'Female_freelancer_headshot_23df22bc.png',
    'Creative_male_freelancer_headshot_3f2fbe8e.png',
    'Asian_woman_professional_headshot_bd9bcd3b.png',
    'Black_man_professional_headshot_0c79bce5.png',
    'IT_Programming_Workspace_cd64f4d1.webp',
    'Creative_Design_Studio_a6e6f8a1.webp',
    'Mobile_Apps_Development_e8873651.webp',
    'Web_Design_Workspace_3523473f.webp',
    'Photoshop_Photo_Editing_e52bd9e2.webp',
    'UI_UX_Design_9305be58.webp',
    'Premiere_Pro_Editing_7fada861.webp',
    'Illustrator_Vector_Graphics_1fe027aa.webp',
    'Substance_Designer_Materials_c35f3939.webp',
    'After_Effects_Animation_9e6d02ce.webp',
    'HTML_CSS_Development_a6d728d7.webp',
    'Tailwind_CSS_Framework_7f864ffa.webp',
    'InDesign_Publishing_c63eb5f9.webp',
    'Adobe_XD_Interface_f6ff981e.webp',
    'Adobe_Capture_Assets_0fc27245.webp',
    'Adobe_Dimension_3D_27347ba3.webp',
    'Substance_Painter_Texturing_73b7dac7.webp',
    'Substance_Sampler_Materials_7a6e4b75.webp',
    'Substance_Stager_Scenes_8ac7006a.webp',
    'Adobe_Aero_AR_8d561156.webp',
  ];

  const uploadedUrls: Record<string, string> = {};
  const baseDir = path.join(process.cwd(), 'attached_assets/generated_images');

  for (const imageName of imagesToUpload) {
    const fullPath = path.join(baseDir, imageName);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️ SKIP (not found): ${imageName}`);
      continue;
    }

    console.log(`Uploading ${imageName}...`);
    const buffer = fs.readFileSync(fullPath);
    const contentType = imageName.endsWith('.webp') ? 'image/webp' : 'image/png';
    const result = await r2.uploadFile(buffer, imageName, contentType, 'assets');
    
    if (result.success && result.url) {
      console.log(`✅ ${imageName}`);
      uploadedUrls[imageName] = result.url;
    } else {
      console.error(`❌ Failed: ${imageName} - ${result.error}`);
    }
  }
  
  console.log('\n📋 Uploaded URLs (JSON):');
  console.log(JSON.stringify(uploadedUrls, null, 2));
}

uploadAllAssets().catch(console.error);
