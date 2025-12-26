
import { sendEmail, getEmailTemplate } from './server/routes';
import fs from 'fs/promises';
import path from 'path';

async function testEmail() {
  const testEmail = process.argv[2] || 'test@example.com';
  console.log(`Sending test email to: ${testEmail}`);

  try {
    const templatePath = path.join(process.cwd(), 'server', 'templates', 'password_reset_whatsapp.html');
    const htmlContent = await fs.readFile(templatePath, 'utf-8');

    const emailHtml = getEmailTemplate('password_reset_whatsapp' as any, {
      code: '123456',
      fullName: 'Test User',
      expiresIn: '10',
      htmlContent
    });

    await sendEmail(testEmail, 'Test Password Reset Email', emailHtml);
    console.log('Test email sent successfully!');
  } catch (error) {
    console.error('Error sending test email:', error);
  }
}

testEmail();
