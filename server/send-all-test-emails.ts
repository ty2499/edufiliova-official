import { emailService } from './utils/email';
import { sendVoucherEmail } from './email';

async function sendAllTestEmails() {
  const testEmail = 'hallpt7@gmail.com';
  const results: { template: string; success: boolean; error?: string }[] = [];

  console.log('🚀 Starting to send ALL test emails to', testEmail, '...\n');

  // 1. Teacher Verification Code Email
  try {
    console.log('Sending 1/16: Teacher Verification Code...');
    await emailService.sendTeacherVerificationEmail(testEmail, {
      fullName: 'Test User',
      verificationCode: '123456',
    });
    results.push({ template: 'Teacher Verification Code', success: true });
    console.log('✅ Sent\n');
  } catch (error) {
    results.push({ template: 'Teacher Verification Code', success: false, error: String(error) });
    console.log('❌ Failed:', error, '\n');
  }

  // 2. Freelancer Verification Code Email
  try {
    console.log('Sending 2/16: Freelancer Verification Code...');
    await emailService.sendFreelancerVerificationEmail(testEmail, {
      fullName: 'Test User',
      verificationCode: '789012',
    });
    results.push({ template: 'Freelancer Verification Code', success: true });
    console.log('✅ Sent\n');
  } catch (error) {
    results.push({ template: 'Freelancer Verification Code', success: false, error: String(error) });
    console.log('❌ Failed\n');
  }

  // 3. Customer Verification Email
  try {
    console.log('Sending 3/16: Customer Verification...');
    await emailService.sendShopVerificationEmail(testEmail, {
      fullName: 'Test User',
      verificationCode: '345678',
    });
    results.push({ template: 'Customer Verification', success: true });
    console.log('✅ Sent\n');
  } catch (error) {
    results.push({ template: 'Customer Verification', success: false, error: String(error) });
    console.log('❌ Failed\n');
  }

  // 4. Verification Link Email
  try {
    console.log('Sending 4/16: Verification Link Email...');
    await emailService.sendShopVerificationLinkEmail(testEmail, {
      fullName: 'Test User',
      verificationLink: 'https://edufiliova.com/api/verify?token=abc123xyz456',
      expiresIn: '24 hours',
    });
    results.push({ template: 'Verification Link', success: true });
    console.log('✅ Sent\n');
  } catch (error) {
    results.push({ template: 'Verification Link', success: false, error: String(error) });
    console.log('❌ Failed\n');
  }

  // 5. Ad Purchase Email
  try {
    console.log('Sending 5/16: Advertisement Purchase...');
    await emailService.sendAdPurchaseEmail(testEmail, {
      customerName: 'Test User',
      adTitle: 'Premium Course Advertisement',
      placement: 'Homepage Banner',
      price: 99.99,
      duration: 30,
      orderId: 'AD-2025-001',
    });
    results.push({ template: 'Ad Purchase', success: true });
    console.log('✅ Sent\n');
  } catch (error) {
    results.push({ template: 'Ad Purchase', success: false, error: String(error) });
    console.log('❌ Failed\n');
  }

  // 6. Course Purchase Email
  try {
    console.log('Sending 6/16: Course Purchase...');
    await emailService.sendCoursePurchaseEmail(testEmail, {
      courseName: 'Advanced JavaScript Masterclass',
      price: 149.99,
      orderId: 'COURSE-2025-001',
      customerName: 'Test User',
      accessUrl: 'https://edufiliova.com/courses/advanced-javascript',
    });
    results.push({ template: 'Course Purchase', success: true });
    console.log('✅ Sent\n');
  } catch (error) {
    results.push({ template: 'Course Purchase', success: false, error: String(error) });
    console.log('❌ Failed\n');
  }

  // 7. Digital Product Purchase Email
  try {
    console.log('Sending 7/16: Digital Product Purchase...');
    await emailService.sendDigitalProductPurchaseEmail(testEmail, {
      orderId: 'DIGITAL-2025-001',
      customerName: 'Test User',
      totalPrice: 79.99,
      items: [
        {
          name: 'Complete Web Development eBook',
          downloadToken: 'token123456',
          expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        },
        {
          name: 'JavaScript Cheat Sheet Bundle',
          downloadToken: 'token789012',
          expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        },
      ],
    });
    results.push({ template: 'Digital Product Purchase', success: true });
    console.log('✅ Sent\n');
  } catch (error) {
    results.push({ template: 'Digital Product Purchase', success: false, error: String(error) });
    console.log('❌ Failed\n');
  }

  // 8. Physical Product Purchase Email
  try {
    console.log('Sending 8/16: Physical Product Purchase...');
    await emailService.sendProductPurchaseEmail(testEmail, {
      productName: 'Programming Books Bundle',
      quantity: 3,
      price: 199.99,
      orderId: 'PRODUCT-2025-001',
      customerName: 'Test User',
      items: [
        { name: 'Clean Code Book', quantity: 1, price: 49.99 },
        { name: 'JavaScript: The Good Parts', quantity: 1, price: 39.99 },
        { name: 'Design Patterns', quantity: 1, price: 59.99 },
      ],
      shippingAddress: '123 Main St, Cape Town, South Africa',
    });
    results.push({ template: 'Physical Product Purchase', success: true });
    console.log('✅ Sent\n');
  } catch (error) {
    results.push({ template: 'Physical Product Purchase', success: false, error: String(error) });
    console.log('❌ Failed\n');
  }

  // 9. Subscription Email
  try {
    console.log('Sending 9/16: Subscription Activation...');
    await emailService.sendSubscriptionEmail(testEmail, {
      planName: 'Premium Learning Plan',
      price: 29.99,
      billingCycle: 'Monthly',
      orderId: 'SUB-2025-001',
      customerName: 'Test User',
      features: [
        'Unlimited access to all courses',
        'Download course materials',
        'Priority support',
        'Certificate of completion',
        'Exclusive webinars and workshops',
      ],
    });
    results.push({ template: 'Subscription Activation', success: true });
    console.log('✅ Sent\n');
  } catch (error) {
    results.push({ template: 'Subscription Activation', success: false, error: String(error) });
    console.log('❌ Failed\n');
  }

  // 10. Course Completion Email
  try {
    console.log('Sending 10/16: Course Completion...');
    await emailService.sendCourseCompletionEmail(testEmail, {
      fullName: 'Test User',
      courseName: 'Advanced JavaScript Masterclass',
      certificateLink: 'https://edufiliova.com/certificates/cert-123',
    });
    results.push({ template: 'Course Completion', success: true });
    console.log('✅ Sent\n');
  } catch (error) {
    results.push({ template: 'Course Completion', success: false, error: String(error) });
    console.log('❌ Failed\n');
  }

  // 11. Voucher Email
  try {
    console.log('Sending 11/16: Gift Voucher...');
    const success = await sendVoucherEmail(testEmail, 'Test User', 'VOUCHER123', 50.00, 'Premium Course Bundle', '2025-12-31');
    results.push({ template: 'Gift Voucher', success: success });
    console.log(success ? '✅ Sent\n' : '❌ Failed\n');
  } catch (error) {
    results.push({ template: 'Gift Voucher', success: false, error: String(error) });
    console.log('❌ Failed\n');
  }

  // 12. Meeting Reminder Email
  try {
    console.log('Sending 12/16: Meeting Reminder...');
    const success = await emailService.sendMeetingReminderEmail(testEmail, {
      fullName: 'Test User',
      teacherName: 'Dr. Sarah Johnson',
      meetingTime: new Date(Date.now() + 15 * 60 * 1000),
      meetingLink: 'https://edufiliova.com/meetings/join/abc123',
      meetingTitle: 'JavaScript Advanced Concepts Review',
      meetingType: 'Online Class',
    });
    results.push({ template: 'Meeting Reminder', success: success });
    console.log(success ? '✅ Sent\n' : '❌ Failed\n');
  } catch (error) {
    results.push({ template: 'Meeting Reminder', success: false, error: String(error) });
    console.log('❌ Failed\n');
  }

  // 13. Digital Products Receipt Email
  try {
    console.log('Sending 13/16: Digital Products Receipt...');
    const success = await emailService.sendDigitalProductsPurchaseReceiptEmail(testEmail, {
      customerName: 'Test User',
      orderId: 'ORD-20251226-001',
      totalPrice: '49.99',
      purchaseDate: new Date().toLocaleString(),
      items: [
        { name: 'Advanced JavaScript Course', downloadLink: 'https://example.com/download/js-course' },
        { name: 'React Mastery Bundle', downloadLink: 'https://example.com/download/react-bundle' },
        { name: 'Web Design Templates Pack', downloadLink: 'https://example.com/download/templates' }
      ],
      expiryHours: 72
    });
    results.push({ template: 'Digital Products Receipt', success: success });
    console.log(success ? '✅ Sent\n' : '❌ Failed\n');
  } catch (error) {
    results.push({ template: 'Digital Products Receipt', success: false, error: String(error) });
    console.log('❌ Failed\n');
  }

  // 14. Mobile Linked Email
  try {
    console.log('Sending 14/16: Mobile Linked Notification...');
    const success = await emailService.sendMobileLinkedEmail(testEmail, {
      fullName: 'Test User',
      deviceName: 'iPhone 15 Pro',
      linkTime: new Date().toLocaleString(),
    });
    results.push({ template: 'Mobile Linked', success: success });
    console.log(success ? '✅ Sent\n' : '❌ Failed\n');
  } catch (error) {
    results.push({ template: 'Mobile Linked', success: false, error: String(error) });
    console.log('❌ Failed\n');
  }

  // 15. Course Purchase Notification
  try {
    console.log('Sending 15/16: Course Purchase Notification...');
    const success = await emailService.sendCoursePurchaseNotificationEmail(testEmail, {
      recipientName: 'Test User',
      courseName: 'Web Development Bootcamp',
      courseLink: 'https://edufiliova.com/courses/web-dev',
      price: 199.99,
    });
    results.push({ template: 'Course Purchase Notification', success: success });
    console.log(success ? '✅ Sent\n' : '❌ Failed\n');
  } catch (error) {
    results.push({ template: 'Course Purchase Notification', success: false, error: String(error) });
    console.log('❌ Failed\n');
  }

  // 16. Voucher Purchase Email
  try {
    console.log('Sending 16/16: Voucher Purchase...');
    const success = await emailService.sendVoucherPurchaseEmail(testEmail, {
      recipientName: 'Test User',
      voucherCode: 'VOUCHER456',
      voucherAmount: 100,
      expiryDate: '2025-12-31',
    });
    results.push({ template: 'Voucher Purchase', success: success });
    console.log(success ? '✅ Sent\n' : '❌ Failed\n');
  } catch (error) {
    results.push({ template: 'Voucher Purchase', success: false, error: String(error) });
    console.log('❌ Failed\n');
  }

  // Print Summary
  console.log('\n═══════════════════════════════════════════════');
  console.log('📊 TEST EMAIL SUMMARY');
  console.log('═══════════════════════════════════════════════\n');

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log(`Total sent: ${results.length} test emails`);
  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}\n`);

  console.log('📧 Email templates sent to:', testEmail);
  console.log('\nTemplates included:');
  results.forEach((r, i) => {
    console.log(`${i + 1}. ${r.template} ${r.success ? '✅' : '❌'}`);
  });

  if (failed > 0) {
    console.log('\n⚠️ Failed templates:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.template}: ${r.error}`);
    });
  }

  console.log('\n═══════════════════════════════════════════════\n');
}

sendAllTestEmails()
  .then(() => {
    console.log('✅ All test emails completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
