import { emailService } from './server/utils/email';

async function sendAllApprovedTemplates() {
  const recipient = 'teach@pacreatives.co.za';
  const results: { template: string; success: boolean }[] = [];

  console.log('🎉 Sending ALL APPROVED/SUCCESS TEMPLATES to', recipient, '...\n');

  // 1. Teacher Approval
  try {
    console.log('1/9 - Teacher Approval Email...');
    await emailService.sendTeacherApprovalEmail(recipient, {
      fullName: 'Test Teacher',
      displayName: 'Test Teacher',
    });
    results.push({ template: '✅ Teacher Approval', success: true });
    console.log('   ✅ Sent\n');
  } catch (error) {
    results.push({ template: '❌ Teacher Approval', success: false });
    console.log('   ❌ Failed\n');
  }

  // 2. Freelancer Approval
  try {
    console.log('2/9 - Freelancer Approval Email...');
    await emailService.sendFreelancerApprovalEmail(recipient, {
      fullName: 'Test Freelancer',
      displayName: 'Test Freelancer',
    });
    results.push({ template: '✅ Freelancer Approval', success: true });
    console.log('   ✅ Sent\n');
  } catch (error) {
    results.push({ template: '❌ Freelancer Approval', success: false });
    console.log('   ❌ Failed\n');
  }

  // 3. Freelancer Application Status - Approved
  try {
    console.log('3/9 - Freelancer Application Approved...');
    await emailService.sendFreelancerApplicationStatusEmail(recipient, {
      fullName: 'Test Freelancer',
      status: 'approved',
    });
    results.push({ template: '✅ Freelancer Application Approved', success: true });
    console.log('   ✅ Sent\n');
  } catch (error) {
    results.push({ template: '❌ Freelancer Application Approved', success: false });
    console.log('   ❌ Failed\n');
  }

  // 4. Subscription Confirmation
  try {
    console.log('4/9 - Subscription Confirmation...');
    await emailService.sendSubscriptionConfirmationEmail(recipient, {
      customerName: 'Test Customer',
      planName: 'Premium Plus',
      billingCycle: 'Monthly',
      orderId: 'SUB-2025-001',
      price: '29.99',
      activationDate: new Date().toISOString(),
      nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      dashboardUrl: 'https://edufiliova.com/dashboard',
    });
    results.push({ template: '✅ Subscription Confirmation', success: true });
    console.log('   ✅ Sent\n');
  } catch (error) {
    results.push({ template: '❌ Subscription Confirmation', success: false });
    console.log('   ❌ Failed\n');
  }

  // 5. Meeting Reminder
  try {
    console.log('5/9 - Meeting Reminder...');
    await emailService.sendMeetingReminderEmail(recipient, {
      studentName: 'Test Student',
      teacherName: 'Dr. Sarah Johnson',
      meetingTime: new Date(Date.now() + 15 * 60 * 1000),
      meetingLink: 'https://edufiliova.com/meetings/join/abc123',
      meetingTitle: 'JavaScript Advanced Concepts Review',
    });
    results.push({ template: '✅ Meeting Reminder', success: true });
    console.log('   ✅ Sent\n');
  } catch (error) {
    results.push({ template: '❌ Meeting Reminder', success: false });
    console.log('   ❌ Failed\n');
  }

  // 6. Digital Products Purchase Receipt
  try {
    console.log('6/9 - Digital Products Purchase Receipt...');
    await emailService.sendDigitalProductsPurchaseReceiptEmail(recipient, {
      customerName: 'Test Customer',
      orderId: 'DIGITAL-2025-001',
      totalPrice: '79.99',
      purchaseDate: new Date().toISOString(),
      items: [
        { name: 'Complete Web Development eBook', downloadLink: 'https://edufiliova.com/downloads/ebook-123' },
        { name: 'JavaScript Cheat Sheet Bundle', downloadLink: 'https://edufiliova.com/downloads/cheatsheet-456' },
      ],
      expiryHours: 72,
    });
    results.push({ template: '✅ Digital Products Purchase Receipt', success: true });
    console.log('   ✅ Sent\n');
  } catch (error) {
    results.push({ template: '❌ Digital Products Purchase Receipt', success: false });
    console.log('   ❌ Failed\n');
  }

  // 7. Mobile Linked
  try {
    console.log('7/9 - Mobile App Linked...');
    await emailService.sendMobileLinkedEmail(recipient, {
      userName: 'Test User',
      maskedMobileNumber: '+27****567890',
    });
    results.push({ template: '✅ Mobile App Linked', success: true });
    console.log('   ✅ Sent\n');
  } catch (error) {
    results.push({ template: '❌ Mobile App Linked', success: false });
    console.log('   ❌ Failed\n');
  }

  // 8. Course Notification
  try {
    console.log('8/9 - Course Notification...');
    await emailService.sendCourseNotificationEmail(recipient, {
      fullName: 'Test Student',
      courseTitle: 'Advanced JavaScript Masterclass',
      teacherName: 'John Doe',
      category: 'Programming',
    });
    results.push({ template: '✅ Course Notification', success: true });
    console.log('   ✅ Sent\n');
  } catch (error) {
    results.push({ template: '❌ Course Notification', success: false });
    console.log('   ❌ Failed\n');
  }

  // 9. Account Unsuspended
  try {
    console.log('9/9 - Account Unsuspended...');
    await emailService.sendAccountUnsuspendedEmail(recipient, {
      fullName: 'Test User',
    });
    results.push({ template: '✅ Account Unsuspended', success: true });
    console.log('   ✅ Sent\n');
  } catch (error) {
    results.push({ template: '❌ Account Unsuspended', success: false });
    console.log('   ❌ Failed\n');
  }

  // Print summary
  console.log('\n' + '═'.repeat(70));
  console.log('📊 APPROVED TEMPLATES - FINAL SUMMARY');
  console.log('═'.repeat(70));
  const successful = results.filter(r => r.success).length;
  const total = results.length;
  
  console.log(`\n✅ Successfully Sent: ${successful}/${total}\n`);
  results.forEach(r => console.log(`   ${r.template}`));
  
  console.log('\n' + '═'.repeat(70));
  console.log(`📧 Email Recipient: ${recipient}`);
  console.log(`🎉 All approved templates delivered!\n`);
}

sendAllApprovedTemplates();
