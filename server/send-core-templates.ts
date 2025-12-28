import { emailService } from './utils/email';

async function sendTemplates(testEmail: string) {
  console.log(`🚀 Sending template pack to ${testEmail}...`);
  
  const templates = [
    { name: 'Teacher Verification', fn: () => emailService.sendTeacherVerificationEmail(testEmail, { fullName: 'Tyler Williams', verificationCode: '111222' }) },
    { name: 'Freelancer Verification', fn: () => emailService.sendFreelancerVerificationEmail(testEmail, { fullName: 'Tyler Williams', verificationCode: '333444' }) },
    { name: 'Student Verification', fn: () => emailService.sendStudentVerificationEmail(testEmail, { fullName: 'Tyler Williams', verificationCode: '555666' }) },
    { name: 'Shop Verification', fn: () => emailService.sendShopVerificationEmail(testEmail, { fullName: 'Tyler Williams', verificationCode: '777888' }) },
    { name: 'Password Reset', fn: () => emailService.sendPasswordResetEmail(testEmail, 'https://edufiliova.com/reset', 'Tyler Williams') }
  ];

  for (const template of templates) {
    try {
      console.log(`Sending: ${template.name}...`);
      await template.fn();
      console.log(`✅ ${template.name} sent.`);
    } catch (e) {
      console.error(`❌ ${template.name} failed:`, e);
    }
  }
}

const email = process.argv[2];
if (!email) process.exit(1);
sendTemplates(email).then(() => process.exit(0));
