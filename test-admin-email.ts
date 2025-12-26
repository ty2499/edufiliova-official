
import { sendEmail, getEmailTemplate } from './server/routes';
import fs from 'fs/promises';
import path from 'path';

async function testEmail() {
  const testEmail = 'admin@pacreatives.co.za';
  console.log(`Sending test email to: ${testEmail}`);

  try {
    const templatePath = path.join(process.cwd(), 'server', 'templates', 'password_reset_whatsapp.html');
    const htmlContent = await fs.readFile(templatePath, 'utf-8');

    const emailHtml = getEmailTemplate('password_reset_whatsapp' as any, {
      code: '888222',
      fullName: 'Admin PA Creatives',
      expiresIn: '10',
      htmlContent
    });

    await sendEmail(testEmail, 'EduFiliova | WhatsApp Password Reset Test', emailHtml);
    console.log('Test email sent successfully to ' + testEmail);
  } catch (error) {
    console.error('Error sending test email:', error);
  }
}

testEmail();
