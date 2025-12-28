import { emailService } from './server/utils/email';

async function sendApprovedTemplates() {
  const recipient = 'teach@pacreatives.co.za';
  const results: { template: string; success: boolean; error?: string }[] = [];

  console.log('🚀 Sending all APPROVED/SUCCESS email templates to', recipient, '...\n');

  // 1. Teacher Approval Email
  try {
    console.log('1/8 - Teacher Approval...');
    await emailService.sendTeacherApprovalEmail(recipient, {
      fullName: 'Test Teacher',
      displayName: 'Test Teacher',
    });
    results.push({ template: 'Teacher Approval', success: true });
    console.log('✅ Sent\n');
  } catch (error) {
    results.push({ template: 'Teacher Approval', success: false, error: String(error) });
    console.log('❌ Failed\n');
  }

  // 2. Course Purchase Email
  try {
    console.log('2/8 - Course Purchase Confirmation...');
    await emailService.sendCoursePurchaseEmail(recipient, {
      courseName: 'Advanced JavaScript Masterclass',
      price: 149.99,
      orderId: 'COURSE-2025-001',
      customerName: 'Test Customer',
      accessUrl: 'https://edufiliova.com/courses/advanced-javascript',
    });
    results.push({ template: 'Course Purchase', success: true });
    console.log('✅ Sent\n');
  } catch (error) {
    results.push({ template: 'Course Purchase', success: false, error: String(error) });
    console.log('❌ Failed\n');
  }

  // 3. Digital Product Purchase Email
  try {
    console.log('3/8 - Digital Product Purchase...');
    await emailService.sendDigitalProductPurchaseEmail(recipient, {
      orderId: 'DIGITAL-2025-001',
      customerName: 'Test Customer',
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

  // 4. Ad Purchase Email
  try {
    console.log('4/8 - Advertisement Purchase...');
    await emailService.sendAdPurchaseEmail(recipient, {
      customerName: 'Test Customer',
      adTitle: 'Premium Course Advertisement',
      placement: 'Homepage Banner',
      price: 99.99,
      duration: 30,
      orderId: 'AD-2025-001',
    });
    results.push({ template: 'Advertisement Purchase', success: true });
    console.log('✅ Sent\n');
  } catch (error) {
    results.push({ template: 'Advertisement Purchase', success: false, error: String(error) });
    console.log('❌ Failed\n');
  }

  // 5. Subscription Email
  try {
    console.log('5/8 - Subscription Activation...');
    await emailService.sendSubscriptionEmail(recipient, {
      planName: 'Premium Plus Membership',
      price: 29.99,
      billingCycle: 'Monthly',
      orderId: 'SUB-2025-001',
      customerName: 'Test Customer',
      features: [
        'Unlimited access to all courses',
        'Priority customer support',
        'Exclusive community access',
        'Monthly live workshops',
        'Downloadable resources'
      ]
    });
    results.push({ template: 'Subscription', success: true });
    console.log('✅ Sent\n');
  } catch (error) {
    results.push({ template: 'Subscription', success: false, error: String(error) });
    console.log('❌ Failed\n');
  }

  // 6. Certificate Issuance Email
  try {
    console.log('6/8 - Certificate Issuance...');
    await emailService.sendCertificateEmail(recipient, {
      studentName: 'Test Student',
      courseTitle: 'Advanced JavaScript Masterclass',
      completionDate: new Date(),
      verificationCode: 'CERT-2025-12345',
      certificateUrl: 'https://edufiliova.com/certificates/download/12345',
      finalScore: 95,
    });
    results.push({ template: 'Certificate Issuance', success: true });
    console.log('✅ Sent\n');
  } catch (error) {
    results.push({ template: 'Certificate Issuance', success: false, error: String(error) });
    console.log('❌ Failed\n');
  }

  // 7. Physical Product Purchase Email
  try {
    console.log('7/8 - Physical Product Purchase...');
    await emailService.sendProductPurchaseEmail(recipient, {
      productName: 'Programming Books Bundle',
      quantity: 3,
      price: 199.99,
      orderId: 'PRODUCT-2025-001',
      customerName: 'Test Customer',
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

  // 8. Meeting Reminder Email
  try {
    console.log('8/8 - Meeting Reminder...');
    await emailService.sendMeetingReminderEmail(recipient, {
      studentName: 'Test Student',
      teacherName: 'Dr. Sarah Johnson',
      meetingTime: new Date(Date.now() + 15 * 60 * 1000),
      meetingLink: 'https://edufiliova.com/meetings/join/abc123',
      meetingTitle: 'JavaScript Advanced Concepts Review',
    });
    results.push({ template: 'Meeting Reminder', success: true });
    console.log('✅ Sent\n');
  } catch (error) {
    results.push({ template: 'Meeting Reminder', success: false, error: String(error) });
    console.log('❌ Failed\n');
  }

  // Print summary
  console.log('\n📊 APPROVED TEMPLATES SUMMARY');
  console.log('═'.repeat(60));
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`✅ Successfully Sent: ${successful}/${results.length}`);
  console.log(`❌ Failed: ${failed}/${results.length}`);
  console.log('\nTemplates Sent:');
  results.forEach(r => {
    const icon = r.success ? '✅' : '❌';
    console.log(`${icon} ${r.template}`);
  });
  
  console.log('\n' + '═'.repeat(60));
  console.log(`📧 All approved templates sent to: ${recipient}`);
}

sendApprovedTemplates();
