import { emailService } from './utils/email';

async function sendReminderEmail() {
  const testEmail = 'hallpt7@gmail.com';
  
  try {
    console.log('📧 Sending meeting reminder email with professional template to', testEmail, '...\n');
    
    const success = await emailService.sendMeetingReminderEmail(testEmail, {
      fullName: 'Test User',
      teacherName: 'Dr. Sarah Johnson',
      meetingTime: new Date(Date.now() + 15 * 60 * 1000),
      meetingLink: 'https://edufiliova.com/meetings/join/abc123',
      meetingTitle: 'JavaScript Advanced Concepts Review',
      meetingType: 'Online Class',
    });
    
    if (success) {
      console.log('✅ Meeting reminder email sent successfully to', testEmail);
      console.log('📧 Email includes:');
      console.log('   - Professional EduFiliova branding');
      console.log('   - Dynamic meeting details (title, teacher, time, type)');
      console.log('   - All template images embedded');
      console.log('   - Helpful tips and security information');
    } else {
      console.log('⚠️ Email sending returned false');
    }
    process.exit(0);
  } catch (error) {
    console.error('❌ Error sending email:', error);
    process.exit(1);
  }
}

sendReminderEmail();
