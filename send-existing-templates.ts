import { emailService } from './server/utils/email';

async function sendExistingTemplates() {
  const recipient = 'teach@pacreatives.co.za';
  const results: { template: string; success: boolean; error?: string }[] = [];

  console.log('🚀 Sending existing email templates to', recipient, '...\n');

  // 1. Teacher Verification Code Email
  try {
    console.log('1/16 - Teacher Verification Code...');
    await emailService.sendTeacherVerificationEmail(recipient, {
      fullName: 'Test Teacher',
      verificationCode: '123456',
    });
    results.push({ template: 'Teacher Verification Code', success: true });
    console.log('✅ Sent\n');
  } catch (error) {
    results.push({ template: 'Teacher Verification Code', success: false, error: String(error) });
    console.log('❌ Failed\n');
  }

  // 2. Freelancer Verification Code Email
  try {
    console.log('2/16 - Freelancer Verification Code...');
    await emailService.sendFreelancerVerificationEmail(recipient, {
      fullName: 'Test Freelancer',
      verificationCode: '789012',
    });
    results.push({ template: 'Freelancer Verification Code', success: true });
    console.log('✅ Sent\n');
  } catch (error) {
    results.push({ template: 'Freelancer Verification Code', success: false, error: String(error) });
    console.log('❌ Failed\n');
  }

  // 3. Shop Customer Verification Email
  try {
    console.log('3/16 - Shop Customer Verification...');
    await emailService.sendShopVerificationEmail(recipient, {
      fullName: 'Test Customer',
      verificationCode: '345678',
    });
    results.push({ template: 'Shop Customer Verification', success: true });
    console.log('✅ Sent\n');
  } catch (error) {
    results.push({ template: 'Shop Customer Verification', success: false, error: String(error) });
    console.log('❌ Failed\n');
  }

  // 4. Shop Verification Link Email
  try {
    console.log('4/16 - Shop Verification Link...');
    await emailService.sendShopVerificationLinkEmail(recipient, {
      fullName: 'Test Customer',
      verificationLink: 'https://edufiliova.com/api/shop/verify-link?token=abc123xyz456',
      expiresIn: '24 hours',
    });
    results.push({ template: 'Shop Verification Link', success: true });
    console.log('✅ Sent\n');
  } catch (error) {
    results.push({ template: 'Shop Verification Link', success: false, error: String(error) });
    console.log('❌ Failed\n');
  }

  // 5. Course Purchase Email
  try {
    console.log('5/16 - Course Purchase...');
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

  // 6. Digital Product Purchase Email
  try {
    console.log('6/16 - Digital Product Purchase...');
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
      ],
    });
    results.push({ template: 'Digital Product Purchase', success: true });
    console.log('✅ Sent\n');
  } catch (error) {
    results.push({ template: 'Digital Product Purchase', success: false, error: String(error) });
    console.log('❌ Failed\n');
  }

  // 7. Ad Purchase Email
  try {
    console.log('7/16 - Advertisement Purchase...');
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

  // 8. Subscription Email
  try {
    console.log('8/16 - Subscription Purchase...');
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

  // 9. Teacher Approval Email
  try {
    console.log('9/16 - Teacher Approval...');
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

  // 10. Teacher Rejection Email
  try {
    console.log('10/16 - Teacher Rejection...');
    await emailService.sendTeacherRejectionEmail(recipient, {
      fullName: 'Test Teacher',
      displayName: 'Test Teacher',
      reason: 'Missing required certifications',
    });
    results.push({ template: 'Teacher Rejection', success: true });
    console.log('✅ Sent\n');
  } catch (error) {
    results.push({ template: 'Teacher Rejection', success: false, error: String(error) });
    console.log('❌ Failed\n');
  }

  // 11. Account Banned Email
  try {
    console.log('11/16 - Account Banned...');
    await emailService.sendAccountBannedEmail(recipient, {
      fullName: 'Test User',
      violations: ['Spam activity', 'Terms of service violation']
    });
    results.push({ template: 'Account Banned', success: true });
    console.log('✅ Sent\n');
  } catch (error) {
    results.push({ template: 'Account Banned', success: false, error: String(error) });
    console.log('❌ Failed\n');
  }

  // 12-16. Notification Templates (from email-templates.ts)
  try {
    console.log('12/16 - Welcome Email (Day 0)...');
    const { NOTIFICATION_EMAIL_TEMPLATES } = await import('./server/templates/notifications/email-templates');
    const welcomeTemplate = NOTIFICATION_EMAIL_TEMPLATES.welcome_day_0;
    const welcomeHtml = welcomeTemplate.html
      .replace(/{{displayName}}/g, 'Test User')
      .replace(/{{logoUrl}}/g, 'https://res.cloudinary.com/dl2lomrhp/image/upload/v1763935567/edufiliova/edufiliova-white-logo.png')
      .replace(/{{dashboardUrl}}/g, 'https://edufiliova.com/dashboard')
      .replace(/{{currentYear}}/g, new Date().getFullYear().toString())
      .replace(/{{unsubscribeLink}}/g, 'https://edufiliova.com/unsubscribe');
    
    await emailService.sendEmail({
      to: recipient,
      subject: welcomeTemplate.subject.replace(/{{displayName}}/g, 'Test User'),
      html: welcomeHtml,
      from: '"EduFiliova Support" <support@edufiliova.com>'
    });
    results.push({ template: 'Welcome Email (Day 0)', success: true });
    console.log('✅ Sent\n');
  } catch (error) {
    results.push({ template: 'Welcome Email (Day 0)', success: false, error: String(error) });
    console.log('❌ Failed\n');
  }

  // Print summary
  console.log('\n📊 SUMMARY');
  console.log('═'.repeat(50));
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`Total Sent: ${successful}`);
  console.log(`Failed: ${failed}`);
  console.log(`\nTemplates Sent:`);
  results.forEach(r => {
    const icon = r.success ? '✅' : '❌';
    console.log(`${icon} ${r.template}`);
  });
}

sendExistingTemplates();
