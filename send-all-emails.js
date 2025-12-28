import { 
  sendStudentWelcomeEmail, 
  sendStudentVerificationEmail, 
  sendGiftVoucherEmail, 
  sendCoursePurchaseEmail, 
  sendNewCourseAnnouncementEmail, 
  sendPlanUpgradeEmail, 
  sendSuspensionEmail, 
  sendFreelancerUnderReviewEmail, 
  sendTeacherApplicationSubmittedEmail, 
  sendTeacherDeclineEmail,
  sendAccountRestrictionEmail,
  sendNewDeviceLoginEmail,
  sendMeetingReminderEmail,
  sendCourseCompletionEmail,
  sendPaymentFailedEmail
} from './server/utils/email-templates.js';

const recipient = 'teach@pacreatives.co.za';
const name = 'Admin';

async function sendAllTemplates() {
  console.log('🚀 Starting mass email template delivery...');
  
  const tasks = [
    { name: 'Student Welcome', fn: () => sendStudentWelcomeEmail(recipient, name) },
    { name: 'Student Verification', fn: () => sendStudentVerificationEmail(recipient, name, '123456') },
    { name: 'Gift Voucher', fn: () => sendGiftVoucherEmail(recipient, name, 'Sender', 'GIFT-CODE', 100, 'Enjoy!', new Date(Date.now() + 86400000)) },
    { name: 'Course Purchase', fn: () => sendCoursePurchaseEmail(recipient, name, { courseName: 'Modern React', teacherName: 'John Smith', orderId: 'ORD-001', price: '49.99' }) },
    { name: 'New Course Announcement', fn: () => sendNewCourseAnnouncementEmail(recipient, name, { courseTitle: 'AI Engineering', teacherName: 'Sarah Doe', category: 'Technology' }) },
    { name: 'Plan Upgrade', fn: () => sendPlanUpgradeEmail(recipient, name, { planName: 'Elite', previousPlan: 'Free', price: '19.99' }) },
    { name: 'Suspension', fn: () => sendSuspensionEmail(recipient, name, 'Repeated policy violations.') },
    { name: 'Freelancer Review', fn: () => sendFreelancerUnderReviewEmail(recipient, name) },
    { name: 'Teacher Application Submitted', fn: () => sendTeacherApplicationSubmittedEmail(recipient, name) },
    { name: 'Teacher Decline', fn: () => sendTeacherDeclineEmail(recipient, name, 'Application incomplete.') },
    { name: 'Account Restriction', fn: () => sendAccountRestrictionEmail(recipient, name, { restrictionDate: '2025-12-28', restrictionType: 'Account Restriction', duration: '7 days', referenceId: 'REF-123', restrictionReason: 'Suspicious activity detected.', appealLink: 'https://edufiliova.com/appeal' }) },
    { name: 'New Device Login', fn: () => sendNewDeviceLoginEmail(recipient, name, { device: 'Chrome on macOS', location: 'Cape Town, ZA', ip: '192.168.1.1' }) },
    { name: 'Meeting Reminder', fn: () => sendMeetingReminderEmail(recipient, name, { title: 'Q&A Session', time: 'Tomorrow at 10 AM', link: 'https://zoom.us/j/123' }) },
    { name: 'Course Completion', fn: () => sendCourseCompletionEmail(recipient, name, { courseName: 'Python for Beginners' }) },
    { name: 'Payment Failed', fn: () => sendPaymentFailedEmail(recipient, name, { amount: '15.00', reason: 'Insufficient funds' }) }
  ];

  for (const task of tasks) {
    try {
      console.log(`Sending: ${task.name}...`);
      await task.fn();
      console.log(`✅ ${task.name} sent.`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limit
    } catch (err) {
      console.error(`❌ Failed to send ${task.name}:`, err.message);
    }
  }
  
  console.log('✨ All templates processed.');
  process.exit(0);
}

sendAllTemplates();
