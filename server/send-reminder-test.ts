import { emailService } from './utils/email';

async function sendReminderEmail() {
  const testEmail = 'hallpt7@gmail.com';
  
  try {
    console.log('📧 Sending meeting reminder email to', testEmail, '...\n');
    
    const success = await emailService.sendMeetingReminderEmail(testEmail, {
      studentName: 'Test User',
      teacherName: 'Dr. Sarah Johnson',
      meetingTime: new Date(Date.now() + 15 * 60 * 1000),
      meetingLink: 'https://edufiliova.com/meetings/join/abc123',
      meetingTitle: 'JavaScript Advanced Concepts Review',
    });
    
    if (success) {
      console.log('✅ Meeting reminder email sent successfully to', testEmail);
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
