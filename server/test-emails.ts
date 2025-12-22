import { emailService } from './utils/email';
import { sendVoucherEmail, sendBulkVouchersEmail } from './email';

async function sendAllTestEmails() {
  const testEmail = 'tylerwillsza@gmail.com';
  const results: { template: string; success: boolean; error?: string }[] = [];

  console.log('🚀 Starting to send all 16 email templates to', testEmail, '...\n');

  // 1. Teacher Verification Code Email
  try {
    console.log('Sending 1/16: Teacher Verification Code...');
    await emailService.sendTeacherVerificationEmail(testEmail, {
      fullName: 'Tyler Williams',
      verificationCode: '123456',
    });
    results.push({ template: 'Teacher Verification Code', success: true });
    console.log('✅ Sent successfully\n');
  } catch (error) {
    results.push({ template: 'Teacher Verification Code', success: false, error: String(error) });
    console.log('❌ Failed:', error, '\n');
  }

  // 2. Freelancer Verification Code Email
  try {
    console.log('Sending 2/16: Freelancer Verification Code...');
    await emailService.sendFreelancerVerificationEmail(testEmail, {
      fullName: 'Tyler Williams',
      verificationCode: '789012',
    });
    results.push({ template: 'Freelancer Verification Code', success: true });
    console.log('✅ Sent successfully\n');
  } catch (error) {
    results.push({ template: 'Freelancer Verification Code', success: false, error: String(error) });
    console.log('❌ Failed:', error, '\n');
  }

  // 3. Shop Customer Verification Email
  try {
    console.log('Sending 3/16: Shop Customer Verification (Legacy Code)...');
    await emailService.sendShopVerificationEmail(testEmail, {
      fullName: 'Tyler Williams',
      verificationCode: '345678',
    });
    results.push({ template: 'Shop Customer Verification (Legacy Code)', success: true });
    console.log('✅ Sent successfully\n');
  } catch (error) {
    results.push({ template: 'Shop Customer Verification (Legacy Code)', success: false, error: String(error) });
    console.log('❌ Failed:', error, '\n');
  }

  // 4. NEW Shop Customer Verification Link Email
  try {
    console.log('Sending 4/16: Shop Customer Verification Link...');
    await emailService.sendShopVerificationLinkEmail(testEmail, {
      fullName: 'Tyler Williams',
      verificationLink: 'https://edufiliova.com/api/shop/verify-link?token=abc123xyz456',
      expiresIn: '24 hours',
    });
    results.push({ template: 'Shop Customer Verification Link', success: true });
    console.log('✅ Sent successfully\n');
  } catch (error) {
    results.push({ template: 'Shop Customer Verification Link', success: false, error: String(error) });
    console.log('❌ Failed:', error, '\n');
  }

  // 5. Advertisement Purchase Email
  try {
    console.log('Sending 5/16: Advertisement Purchase...');
    await emailService.sendAdPurchaseEmail(testEmail, {
      customerName: 'Tyler Williams',
      adTitle: 'Premium Course Advertisement',
      placement: 'Homepage Banner',
      price: 99.99,
      duration: 30,
      orderId: 'AD-2025-001',
    });
    results.push({ template: 'Advertisement Purchase', success: true });
    console.log('✅ Sent successfully\n');
  } catch (error) {
    results.push({ template: 'Advertisement Purchase', success: false, error: String(error) });
    console.log('❌ Failed:', error, '\n');
  }

  // 5. Course Purchase Email
  try {
    console.log('Sending 6/16: Course Purchase...');
    await emailService.sendCoursePurchaseEmail(testEmail, {
      courseName: 'Advanced JavaScript Masterclass',
      price: 149.99,
      orderId: 'COURSE-2025-001',
      customerName: 'Tyler Williams',
      accessUrl: 'https://edufiliova.com/courses/advanced-javascript',
    });
    results.push({ template: 'Course Purchase', success: true });
    console.log('✅ Sent successfully\n');
  } catch (error) {
    results.push({ template: 'Course Purchase', success: false, error: String(error) });
    console.log('❌ Failed:', error, '\n');
  }

  // 6. Digital Product Purchase Email
  try {
    console.log('Sending 7/16: Digital Product Purchase...');
    await emailService.sendDigitalProductPurchaseEmail(testEmail, {
      orderId: 'DIGITAL-2025-001',
      customerName: 'Tyler Williams',
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
    console.log('✅ Sent successfully\n');
  } catch (error) {
    results.push({ template: 'Digital Product Purchase', success: false, error: String(error) });
    console.log('❌ Failed:', error, '\n');
  }

  // 7. Physical Product Purchase Email
  try {
    console.log('Sending 8/16: Physical Product Purchase...');
    await emailService.sendProductPurchaseEmail(testEmail, {
      productName: 'Programming Books Bundle',
      quantity: 3,
      price: 199.99,
      orderId: 'PRODUCT-2025-001',
      customerName: 'Tyler Williams',
      items: [
        { name: 'Clean Code Book', quantity: 1, price: 49.99 },
        { name: 'JavaScript: The Good Parts', quantity: 1, price: 39.99 },
        { name: 'Design Patterns', quantity: 1, price: 59.99 },
      ],
      shippingAddress: '123 Main St, Cape Town, South Africa',
    });
    results.push({ template: 'Physical Product Purchase', success: true });
    console.log('✅ Sent successfully\n');
  } catch (error) {
    results.push({ template: 'Physical Product Purchase', success: false, error: String(error) });
    console.log('❌ Failed:', error, '\n');
  }

  // 8. Subscription Email
  try {
    console.log('Sending 9/16: Subscription Activation...');
    await emailService.sendSubscriptionEmail(testEmail, {
      planName: 'Premium Learning Plan',
      price: 29.99,
      billingCycle: 'Monthly',
      orderId: 'SUB-2025-001',
      customerName: 'Tyler Williams',
      features: [
        'Unlimited access to all courses',
        'Download course materials',
        'Priority support',
        'Certificate of completion',
        'Exclusive webinars and workshops',
      ],
    });
    results.push({ template: 'Subscription Activation', success: true });
    console.log('✅ Sent successfully\n');
  } catch (error) {
    results.push({ template: 'Subscription Activation', success: false, error: String(error) });
    console.log('❌ Failed:', error, '\n');
  }

  // 9. Certificate Issuance Email
  try {
    console.log('Sending 10/16: Certificate Issuance...');
    await emailService.sendCertificateEmail(testEmail, {
      studentName: 'Tyler Williams',
      courseTitle: 'Advanced JavaScript Masterclass',
      completionDate: new Date(),
      verificationCode: 'CERT-2025-12345',
      certificateUrl: 'https://edufiliova.com/certificates/download/12345',
      finalScore: 95,
    });
    results.push({ template: 'Certificate Issuance', success: true });
    console.log('✅ Sent successfully\n');
  } catch (error) {
    results.push({ template: 'Certificate Issuance', success: false, error: String(error) });
    console.log('❌ Failed:', error, '\n');
  }

  // 10. Teacher Approval Email
  try {
    console.log('Sending 11/16: Teacher Application Approval...');
    await emailService.sendTeacherApprovalEmail(testEmail, {
      fullName: 'Tyler Williams',
      displayName: 'Tyler W.',
    });
    results.push({ template: 'Teacher Application Approval', success: true });
    console.log('✅ Sent successfully\n');
  } catch (error) {
    results.push({ template: 'Teacher Application Approval', success: false, error: String(error) });
    console.log('❌ Failed:', error, '\n');
  }

  // 11. Meeting Reminder Email
  try {
    console.log('Sending 12/16: Meeting Reminder...');
    await emailService.sendMeetingReminderEmail(testEmail, {
      studentName: 'Tyler Williams',
      teacherName: 'Dr. Sarah Johnson',
      meetingTime: new Date(Date.now() + 15 * 60 * 1000),
      meetingLink: 'https://edufiliova.com/meetings/join/abc123',
      meetingTitle: 'JavaScript Advanced Concepts Review',
    });
    results.push({ template: 'Meeting Reminder', success: true });
    console.log('✅ Sent successfully\n');
  } catch (error) {
    results.push({ template: 'Meeting Reminder', success: false, error: String(error) });
    console.log('❌ Failed:', error, '\n');
  }

  // 12. Contact Form Notification Email
  try {
    console.log('Sending 13/16: Contact Form Notification...');
    await emailService.sendContactFormNotificationEmail({
      senderName: 'Tyler Williams',
      senderEmail: testEmail,
      subject: 'Question about Course Enrollment',
      message: 'Hello,\n\nI am interested in enrolling in the Advanced JavaScript course. Could you please provide more information about the course duration and prerequisites?\n\nThank you!',
      submittedAt: new Date(),
    });
    results.push({ template: 'Contact Form Notification', success: true });
    console.log('✅ Sent successfully\n');
  } catch (error) {
    results.push({ template: 'Contact Form Notification', success: false, error: String(error) });
    console.log('❌ Failed:', error, '\n');
  }

  // 13. Design Team Inquiry Notification Email
  try {
    console.log('Sending 14/16: Design Team Inquiry...');
    await emailService.sendDesignInquiryNotificationEmail({
      clientName: 'Tyler Williams',
      clientEmail: testEmail,
      phone: '+27 11 123 4567',
      projectType: 'Website Redesign',
      projectDetails: 'We need a complete website redesign for our educational platform. Looking for modern, clean design with improved UX. The project should include homepage, course pages, and student dashboard.',
      budget: '$5,000 - $10,000',
      timeline: '2-3 months',
      submittedAt: new Date(),
    });
    results.push({ template: 'Design Team Inquiry', success: true });
    console.log('✅ Sent successfully\n');
  } catch (error) {
    results.push({ template: 'Design Team Inquiry', success: false, error: String(error) });
    console.log('❌ Failed:', error, '\n');
  }

  // 14. Single Gift Voucher Email
  try {
    console.log('Sending 15/16: Single Gift Voucher...');
    const expiryDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
    await sendVoucherEmail(
      testEmail,
      'Tyler Williams',
      'GIFT2025ABC123',
      100,
      'Happy Birthday Gift Voucher',
      expiryDate
    );
    results.push({ template: 'Single Gift Voucher', success: true });
    console.log('✅ Sent successfully\n');
  } catch (error) {
    results.push({ template: 'Single Gift Voucher', success: false, error: String(error) });
    console.log('❌ Failed:', error, '\n');
  }

  // 15. Bulk Gift Vouchers Email
  try {
    console.log('Sending 16/16: Bulk Gift Vouchers...');
    const bulkVouchers = Array.from({ length: 5 }, (_, i) => ({
      code: `BULK2025-${String(i + 1).padStart(3, '0')}`,
      amount: 50,
      description: 'Corporate Gift Voucher',
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    }));
    
    await sendBulkVouchersEmail(
      testEmail,
      'Tyler Williams',
      bulkVouchers
    );
    results.push({ template: 'Bulk Gift Vouchers', success: true });
    console.log('✅ Sent successfully\n');
  } catch (error) {
    results.push({ template: 'Bulk Gift Vouchers', success: false, error: String(error) });
    console.log('❌ Failed:', error, '\n');
  }

  // Print Summary
  console.log('\n═══════════════════════════════════════════════');
  console.log('📊 EMAIL SENDING SUMMARY');
  console.log('═══════════════════════════════════════════════\n');

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log(`Total: ${results.length} emails`);
  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}\n`);

  if (failed > 0) {
    console.log('Failed templates:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.template}: ${r.error}`);
    });
  }

  console.log('\n═══════════════════════════════════════════════\n');
}

sendAllTestEmails()
  .then(() => {
    console.log('✅ All email tests completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error running email tests:', error);
    process.exit(1);
  });
