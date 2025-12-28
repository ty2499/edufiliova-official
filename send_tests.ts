
import { EmailService } from './server/utils/email';
import path from 'path';
import fs from 'fs';

async function sendAllTemplates() {
  const emailService = new EmailService();
  const testEmail = 'hallpt7@gmail.com';
  const testData = {
    fullName: 'Test User',
    displayName: 'Tester',
    reason: 'This is a test reason for rejection.',
    violations: ['Personal info sharing', 'Unsafe content'],
    applicationType: 'teacher' as const,
    code: '123456',
    courseName: 'Advanced Web Development',
    productName: 'Premium UI Kit',
    planName: 'Pro Plan',
    amount: '$49.99',
    date: new Date().toLocaleDateString(),
    supportEmail: 'support@edufiliova.com'
  };

  const templates = [
    { name: 'Teacher Approval', method: 'sendTeacherApprovalEmail', args: [testEmail, { fullName: testData.fullName, displayName: testData.displayName }] },
    { name: 'Teacher Rejection', method: 'sendTeacherRejectionEmail', args: [testEmail, { fullName: testData.fullName, reason: testData.reason }] },
    { name: 'Account Banned', method: 'sendAccountBannedEmail', args: [testEmail, { fullName: testData.fullName, violations: testData.violations }] },
    { name: 'Verification Code', method: 'sendVerificationEmail', args: [testEmail, testData.fullName, testData.code] }
  ];

  console.log('🚀 Starting to send test emails...');

  for (const template of templates) {
    try {
      console.log(`📤 Sending ${template.name}...`);
      // @ts-ignore
      const success = await emailService[template.method](...template.args);
      console.log(`${success ? '✅' : '❌'} ${template.name} sent.`);
    } catch (error) {
      console.error(`❌ Error sending ${template.name}:`, error);
    }
  }

  // Also send raw templates for those not explicitly wrapped in methods yet
  const templateDir = path.resolve(process.cwd(), 'public/email-assets');
  const templateFolders = fs.readdirSync(templateDir);

  for (const folder of templateFolders) {
    const templatePath = path.join(templateDir, folder, 'template.html');
    if (fs.existsSync(templatePath)) {
      try {
        console.log(`📤 Sending raw template: ${folder}...`);
        let html = fs.readFileSync(templatePath, 'utf-8');
        // Simple replacement for test data
        html = html.replace(/{{fullName}}/g, testData.fullName)
                   .replace(/{{courseName}}/g, testData.courseName)
                   .replace(/{{productName}}/g, testData.productName)
                   .replace(/{{amount}}/g, testData.amount)
                   .replace(/{{code}}/g, testData.code);

        const success = await emailService.sendEmail({
          to: testEmail,
          subject: `Test Template: ${folder}`,
          html: html
        });
        console.log(`${success ? '✅' : '❌'} Raw template ${folder} sent.`);
      } catch (error) {
        console.error(`❌ Error sending raw template ${folder}:`, error);
      }
    }
  }

  console.log('🏁 All test emails processed.');
}

sendAllTemplates().catch(console.error);
