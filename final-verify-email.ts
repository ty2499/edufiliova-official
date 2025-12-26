
import { sendEmail, getEmailTemplate } from './server/routes';
import fs from 'fs/promises';
import path from 'path';

async function testEmail() {
  const testEmail = 'admin@pacreatives.co.za';
  console.log(`Sending final verification email to: ${testEmail}`);

  try {
    const templatePath = path.join(process.cwd(), 'server', 'templates', 'password_reset_whatsapp.html');
    const htmlContent = await fs.readFile(templatePath, 'utf-8');

    const emailData = getEmailTemplate('password_reset_whatsapp' as any, {
      code: '999111',
      fullName: 'PA Creatives Admin',
      expiresIn: '10',
      htmlContent
    });

    const result = await sendEmail(testEmail, 'EduFiliova | Final Branding Verification', emailData as any);
    if (result.success) {
      console.log('✅ Success! Email sent to ' + testEmail);
    } else {
      console.error('❌ Failed:', result.error);
    }
  } catch (error) {
    console.error('Error sending test email:', error);
  }
}

testEmail();
