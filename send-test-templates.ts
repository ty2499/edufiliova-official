
import { emailService } from './server/utils/email-templates.js';
import { createEmailTransporter } from './server/email.js';
import * as fs from 'fs';
import * as path from 'path';

const RECIPIENT = 'teach@pacreatives.co.za';

async function sendAllTemplates() {
  console.log('🚀 Starting to send all email templates to:', RECIPIENT);
  
  // 1. Core Templates from server/templates
  const coreTemplatesDir = path.join(process.cwd(), 'server', 'templates');
  const coreFolders = fs.readdirSync(coreTemplatesDir).filter(f => 
    fs.statSync(path.join(coreTemplatesDir, f)).isDirectory()
  );

  const transporter = await createEmailTransporter();

  for (const folder of coreFolders) {
    const htmlPath = path.join(coreTemplatesDir, folder, 'email.html');
    if (fs.existsSync(htmlPath)) {
      console.log(`📧 Sending core template: ${folder}`);
      let html = fs.readFileSync(htmlPath, 'utf-8');
      
      // Basic placeholder replacement for testing
      html = html.replace(/\{\{.*?\}\}/g, 'TEST_DATA');
      
      try {
        await transporter.sendMail({
          to: RECIPIENT,
          subject: `[CORE TEST] ${folder}`,
          html: html,
          from: '"EduFiliova Test" <noreply@edufiliova.com>'
        });
        console.log(`✅ Sent ${folder}`);
      } catch (err) {
        console.error(`❌ Failed to send ${folder}:`, err.message);
      }
    }
  }

  // 2. Asset Templates from public/email-assets
  const assetTemplatesDir = path.join(process.cwd(), 'public', 'email-assets');
  const assetFolders = fs.readdirSync(assetTemplatesDir).filter(f => 
    fs.statSync(path.join(assetTemplatesDir, f)).isDirectory()
  );

  for (const folder of assetFolders) {
    const htmlPath = path.join(assetTemplatesDir, folder, 'template.html');
    if (fs.existsSync(htmlPath)) {
      console.log(`📧 Sending asset template: ${folder}`);
      let html = fs.readFileSync(htmlPath, 'utf-8');
      
      // Basic placeholder replacement for testing
      html = html.replace(/\{\{.*?\}\}/g, 'TEST_DATA');
      
      try {
        await transporter.sendMail({
          to: RECIPIENT,
          subject: `[ASSET TEST] ${folder}`,
          html: html,
          from: '"EduFiliova Test" <noreply@edufiliova.com>'
        });
        console.log(`✅ Sent ${folder}`);
      } catch (err) {
        console.error(`❌ Failed to send ${folder}:`, err.message);
      }
    }
  }

  console.log('🎉 All templates processed!');
}

sendAllTemplates().catch(console.error);
