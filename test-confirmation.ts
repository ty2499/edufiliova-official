
import { sendEmail, getEmailTemplate } from './server/routes';
import fs from 'fs/promises';
import path from 'path';

async function testConfirmation() {
  const testEmail = 'admin@pacreatives.co.za';
  console.log(`Sending password change confirmation email to: ${testEmail}`);

  try {
    const templatePath = path.join(process.cwd(), 'server', 'templates', 'password_changed_whatsapp.html');
    const htmlContent = await fs.readFile(templatePath, 'utf-8');

    const emailData = getEmailTemplate('password_changed_confirmation_whatsapp' as any, {
      fullName: 'PA Creatives Admin',
      htmlContent
    });

    const result = await sendEmail(testEmail, 'EduFiliova | Password Changed Successfully', emailData as any);
    if (result.success) {
      console.log('✅ Success! Confirmation email sent to ' + testEmail);
    } else {
      console.error('❌ Failed:', result.error);
    }
  } catch (error) {
    console.error('Error sending confirmation email:', error);
  }
}

testConfirmation();
