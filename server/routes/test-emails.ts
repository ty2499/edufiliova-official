import { Router } from 'express';
import type { Request, Response } from 'express';
import { emailService } from '../utils/email.js';
import { sendVoucherEmail, sendBulkVouchersEmail } from '../email.js';
import { sendGiftVoucherEmail } from '../utils/email-templates.js';

const router = Router();

// Test endpoint specifically for gift voucher email (the one sent when buying for someone)
router.post('/test-emails/gift-voucher', async (req: Request, res: Response) => {
  try {
    const { testEmail, recipientName, buyerName, personalMessage } = req.body;
    
    if (!testEmail) {
      return res.status(400).json({ error: 'testEmail is required' });
    }

    console.log(`📧 Testing gift voucher email to ${testEmail}...`);

    const testVoucherCode = 'TEST' + Math.random().toString(36).substring(2, 10).toUpperCase();
    
    const result = await sendGiftVoucherEmail(
      testEmail,
      recipientName || 'Test Recipient',
      buyerName || 'Test Buyer',
      testVoucherCode,
      50.00,
      personalMessage || 'This is a test gift voucher!'
    );

    res.json({
      success: result,
      message: result ? 'Gift voucher email sent successfully' : 'Failed to send gift voucher email',
      details: {
        recipientEmail: testEmail,
        voucherCode: testVoucherCode,
        amount: 50.00
      }
    });
  } catch (error: any) {
    console.error('❌ Error sending gift voucher test email:', error);
    res.status(500).json({ error: 'Failed to send gift voucher email', details: error.message });
  }
});

// Test endpoint to send all email types to a specific email address
router.post('/test-emails/send-all', async (req: Request, res: Response) => {
  try {
    const { testEmail } = req.body;
    
    if (!testEmail) {
      return res.status(400).json({ error: 'testEmail is required' });
    }

    const results: any[] = [];
    const errors: any[] = [];

    // 1. Ad Purchase Email (orders@edufiliova.com)
    try {
      const adPurchaseResult = await emailService.sendAdPurchaseEmail(testEmail, {
        adTitle: 'Test Banner Advertisement',
        placement: 'Homepage Hero',
        duration: 30,
        price: 299.99,
        orderId: 'TEST-ORDER-001',
        customerName: 'Test User'
      });
      results.push({ type: 'Ad Purchase Email (orders@)', success: adPurchaseResult });
    } catch (error: any) {
      errors.push({ type: 'Ad Purchase Email', error: error.message });
    }

    // 2. Course Purchase Email (orders@edufiliova.com)
    try {
      const coursePurchaseResult = await emailService.sendCoursePurchaseEmail(testEmail, {
        courseName: 'Complete Web Development Bootcamp',
        price: 149.99,
        orderId: 'TEST-COURSE-001',
        customerName: 'Test User',
        accessUrl: 'https://edufiliova.com/courses/web-dev'
      });
      results.push({ type: 'Course Purchase Email (orders@)', success: coursePurchaseResult });
    } catch (error: any) {
      errors.push({ type: 'Course Purchase Email', error: error.message });
    }

    // 3. Subscription Email (orders@edufiliova.com)
    try {
      const subscriptionResult = await emailService.sendSubscriptionEmail(testEmail, {
        planName: 'Premium Plan',
        price: 29.99,
        billingCycle: 'Monthly',
        orderId: 'TEST-SUB-001',
        customerName: 'Test User',
        features: [
          'Unlimited course access',
          'Priority support',
          'Exclusive workshops',
          'Certificate of completion'
        ]
      });
      results.push({ type: 'Subscription Email (orders@)', success: subscriptionResult });
    } catch (error: any) {
      errors.push({ type: 'Subscription Email', error: error.message });
    }

    // 4. Digital Product Purchase Email (orders@edufiliova.com)
    try {
      const digitalProductResult = await emailService.sendDigitalProductPurchaseEmail(testEmail, {
        orderId: 'TEST-DIGITAL-001',
        customerName: 'Test User',
        totalPrice: 99.99,
        items: [
          {
            name: 'Design Templates Bundle',
            downloadToken: 'test-token-123',
            expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
          }
        ]
      });
      results.push({ type: 'Digital Product Email (orders@)', success: digitalProductResult });
    } catch (error: any) {
      errors.push({ type: 'Digital Product Email', error: error.message });
    }

    // 5. Physical Product Purchase Email (orders@edufiliova.com)
    try {
      const productPurchaseResult = await emailService.sendProductPurchaseEmail(testEmail, {
        productName: 'Educational Books Set',
        quantity: 2,
        price: 79.99,
        orderId: 'TEST-PRODUCT-001',
        customerName: 'Test User',
        items: [
          { name: 'Mathematics Workbook', quantity: 1, price: 39.99 },
          { name: 'Science Guide', quantity: 1, price: 39.99 }
        ],
        shippingAddress: '123 Main St, City, Country'
      });
      results.push({ type: 'Physical Product Email (orders@)', success: productPurchaseResult });
    } catch (error: any) {
      errors.push({ type: 'Physical Product Email', error: error.message });
    }

    // 6. Teacher Verification Link Email (verify@edufiliova.com)
    try {
      const teacherVerificationResult = await emailService.sendVerificationLinkEmail(testEmail, {
        fullName: 'Test Teacher',
        verificationLink: 'https://edufiliova.com/verify-email?token=test-teacher-token-123',
        expiresIn: '24 hours',
        applicationType: 'teacher'
      });
      results.push({ type: 'Teacher Verification Link (verify@)', success: teacherVerificationResult });
    } catch (error: any) {
      errors.push({ type: 'Teacher Verification Link', error: error.message });
    }

    // 7. Freelancer Verification Link Email (verify@edufiliova.com)
    try {
      const freelancerVerificationResult = await emailService.sendVerificationLinkEmail(testEmail, {
        fullName: 'Test Freelancer',
        verificationLink: 'https://edufiliova.com/verify-email?token=test-freelancer-token-456',
        expiresIn: '24 hours',
        applicationType: 'freelancer'
      });
      results.push({ type: 'Freelancer Verification Link (verify@)', success: freelancerVerificationResult });
    } catch (error: any) {
      errors.push({ type: 'Freelancer Verification Link', error: error.message });
    }

    // 8. Shop Verification Link Email (verify@edufiliova.com)
    try {
      const shopVerificationResult = await emailService.sendShopVerificationLinkEmail(testEmail, {
        fullName: 'Test Customer',
        verificationLink: 'https://edufiliova.com/shop/verify?token=test-shop-token-789',
        expiresIn: '24 hours'
      });
      results.push({ type: 'Shop Verification Link (verify@)', success: shopVerificationResult });
    } catch (error: any) {
      errors.push({ type: 'Shop Verification Link', error: error.message });
    }

    // 8b. Student Verification Code Email (verify@edufiliova.com)
    try {
      const studentVerificationResult = await emailService.sendStudentVerificationEmail(testEmail, {
        fullName: 'Test Student',
        verificationCode: '345678'
      });
      results.push({ type: 'Student Verification Code (verify@)', success: studentVerificationResult });
    } catch (error: any) {
      errors.push({ type: 'Student Verification Code', error: error.message });
    }

    // 9. Teacher Approval Email (support@edufiliova.com)
    try {
      const teacherApprovalResult = await emailService.sendTeacherApprovalEmail(testEmail, {
        fullName: 'Test Teacher',
        displayName: 'Teacher Profile'
      });
      results.push({ type: 'Teacher Approval Email (support@)', success: teacherApprovalResult });
    } catch (error: any) {
      errors.push({ type: 'Teacher Approval Email', error: error.message });
    }

    // 9b. Teacher Rejection Email (support@edufiliova.com)
    try {
      const teacherRejectionResult = await emailService.sendTeacherRejectionEmail(testEmail, {
        fullName: 'Test Teacher',
        reason: 'Missing qualification documents'
      });
      results.push({ type: 'Teacher Rejection Email (support@)', success: teacherRejectionResult });
    } catch (error: any) {
      errors.push({ type: 'Teacher Rejection Email', error: error.message });
    }

    // 10. Meeting Reminder Email (support@edufiliova.com)
    try {
      const meetingReminderResult = await emailService.sendMeetingReminderEmail(testEmail, {
        studentName: 'Test User',
        teacherName: 'Teacher Name',
        meetingTime: new Date(Date.now() + 15 * 60 * 1000),
        meetingLink: 'https://meet.edufiliova.com/test-meeting',
        meetingTitle: 'Mathematics Tutoring Session'
      });
      results.push({ type: 'Meeting Reminder Email (support@)', success: meetingReminderResult });
    } catch (error: any) {
      errors.push({ type: 'Meeting Reminder Email', error: error.message });
    }

    // 11. Certificate Email (orders@edufiliova.com)
    try {
      const certificateResult = await emailService.sendCertificateEmail(testEmail, {
        studentName: 'Test User',
        courseTitle: 'Web Development Course',
        completionDate: new Date(),
        verificationCode: 'CERT-TEST-12345',
        certificateUrl: 'https://edufiliova.com/certificates/test-12345',
        finalScore: 95
      });
      results.push({ type: 'Certificate Email (orders@)', success: certificateResult });
    } catch (error: any) {
      errors.push({ type: 'Certificate Email', error: error.message });
    }

    // 12. Single Voucher Email (orders@edufiliova.com) - with logo in email
    try {
      const voucherResult = await sendVoucherEmail(
        testEmail,
        'Test User',
        'GIFT50TEST',
        50.00,
        'Welcome Bonus Gift Voucher'
      );
      results.push({ type: 'Single Voucher Email (orders@)', success: voucherResult });
    } catch (error: any) {
      errors.push({ type: 'Single Voucher Email', error: error.message });
    }

    // 13. Bulk Vouchers Email with PDF (orders@edufiliova.com) - PDF includes logo
    try {
      const bulkVouchersResult = await sendBulkVouchersEmail(
        testEmail,
        'Test User',
        [
          { code: 'BULK10A', amount: 10.00, description: 'Bulk Voucher 1' },
          { code: 'BULK10B', amount: 10.00, description: 'Bulk Voucher 2' },
          { code: 'BULK10C', amount: 10.00, description: 'Bulk Voucher 3' }
        ]
      );
      results.push({ type: 'Bulk Vouchers Email with PDF (orders@)', success: bulkVouchersResult });
    } catch (error: any) {
      errors.push({ type: 'Bulk Vouchers Email', error: error.message });
    }

    res.json({
      success: true,
      message: `Sent ${results.length} test emails to ${testEmail}`,
      emailConfiguration: {
        orders: 'orders@edufiliova.com - for orders, purchases, subscriptions, certificates',
        verify: 'verify@edufiliova.com - for account registrations and verifications',
        support: 'support@edufiliova.com - for support emails, approvals, reminders'
      },
      results,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error: any) {
    console.error('❌ Error sending test emails:', error);
    res.status(500).json({ error: 'Failed to send test emails', details: error.message });
  }
});

// Simple test endpoint to send to tylerwillsza@gmail.com
router.get('/test-emails/send-to-tyler', async (req: Request, res: Response) => {
  try {
    const testEmail = 'tylerwillsza@gmail.com';
    
    const results: any[] = [];
    const errors: any[] = [];

    console.log(`📧 Sending all test emails to ${testEmail}...`);

    // Send all email types
    const emailTypes = [
      { type: 'Ad Purchase', fn: () => emailService.sendAdPurchaseEmail(testEmail, {
        adTitle: 'Premium Banner Ad',
        placement: 'Homepage Hero',
        duration: 30,
        price: 299.99,
        orderId: 'ORDER-' + Date.now(),
        customerName: 'Tyler Williams'
      })},
      { type: 'Course Purchase', fn: () => emailService.sendCoursePurchaseEmail(testEmail, {
        courseName: 'Complete Web Development Bootcamp',
        price: 149.99,
        orderId: 'COURSE-' + Date.now(),
        customerName: 'Tyler Williams'
      })},
      { type: 'Subscription', fn: () => emailService.sendSubscriptionEmail(testEmail, {
        planName: 'Premium Plan',
        price: 29.99,
        billingCycle: 'Monthly',
        orderId: 'SUB-' + Date.now(),
        customerName: 'Tyler Williams',
        features: ['Unlimited access', 'Priority support', 'Certificates']
      })},
      { type: 'Teacher Verification (Link)', fn: () => emailService.sendVerificationLinkEmail(testEmail, {
        fullName: 'Tyler Williams',
        verificationLink: 'https://edufiliova.com/verify-email?token=test-teacher-token-123',
        expiresIn: '24 hours',
        applicationType: 'teacher'
      })},
      { type: 'Freelancer Verification (Link)', fn: () => emailService.sendVerificationLinkEmail(testEmail, {
        fullName: 'Tyler Williams',
        verificationLink: 'https://edufiliova.com/verify-email?token=test-freelancer-token-456',
        expiresIn: '24 hours',
        applicationType: 'freelancer'
      })},
      { type: 'Shop Verification (Link)', fn: () => emailService.sendShopVerificationLinkEmail(testEmail, {
        fullName: 'Tyler Williams',
        verificationLink: 'https://edufiliova.com/shop/verify?token=test-shop-token-789',
        expiresIn: '24 hours'
      })},
      { type: 'Student Verification (Code)', fn: () => emailService.sendStudentVerificationEmail(testEmail, {
        fullName: 'Tyler Williams',
        verificationCode: '345678'
      })},
      { type: 'Teacher Approval', fn: () => emailService.sendTeacherApprovalEmail(testEmail, {
        fullName: 'Tyler Williams',
        displayName: 'Tyler W.'
      })},
      { type: 'Certificate', fn: () => emailService.sendCertificateEmail(testEmail, {
        studentName: 'Tyler Williams',
        courseTitle: 'Advanced JavaScript',
        completionDate: new Date(),
        verificationCode: 'CERT-' + Date.now(),
        certificateUrl: 'https://edufiliova.com/cert/test',
        finalScore: 98
      })},
      { type: 'Voucher', fn: () => sendVoucherEmail(testEmail, 'Tyler Williams', 'GIFT50', 50.00, 'Welcome Gift')},
      { type: 'Bulk Vouchers PDF', fn: () => sendBulkVouchersEmail(testEmail, 'Tyler Williams', [
        { code: 'BULK10A', amount: 10.00, description: 'Voucher 1' },
        { code: 'BULK10B', amount: 10.00, description: 'Voucher 2' },
        { code: 'BULK10C', amount: 10.00, description: 'Voucher 3' }
      ])},
      { type: 'New Device Login (Security)', fn: () => emailService.sendNewDeviceLoginEmail(testEmail, {
        userName: 'Tyler Williams',
        deviceName: 'Chrome on Windows',
        location: 'New York, United States',
        ipAddress: '203.0.113.45',
        loginTime: new Date(),
        browser: 'Chrome 120',
        os: 'Windows 11'
      })},
      { type: 'Password Reset', fn: () => emailService.sendPasswordResetEmail(testEmail, {
        userName: 'Tyler Williams',
        resetToken: 'test-reset-token-' + Date.now(),
        expiresIn: 30
      })},
      { type: 'Order Shipped', fn: () => emailService.sendOrderShippedEmail(testEmail, {
        customerName: 'Tyler Williams',
        orderId: 'SHIP-' + Date.now(),
        trackingNumber: '1Z999AA10123456784',
        carrier: 'UPS',
        trackingUrl: 'https://www.ups.com/track?track=yes',
        estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
      })},
      { type: 'Payment Failed', fn: () => emailService.sendPaymentFailedEmail(testEmail, {
        customerName: 'Tyler Williams',
        orderId: 'FAIL-' + Date.now(),
        amount: 99.99,
        reason: 'Insufficient funds',
        retryUrl: 'https://edufiliova.com/retry-payment'
      })},
      { type: 'Welcome Email', fn: () => emailService.sendWelcomeEmail(testEmail, {
        userName: 'Tyler Williams',
        accountType: 'student'
      })},
      { type: 'Freelancer Status Update (Approved)', fn: () => emailService.sendFreelancerApplicationStatusEmail(testEmail, {
        fullName: 'Tyler Williams',
        status: 'approved'
      })}
    ];

    for (const emailType of emailTypes) {
      try {
        await emailType.fn();
        results.push({ type: emailType.type, success: true });
        console.log(`✅ Sent ${emailType.type} email`);
      } catch (error: any) {
        errors.push({ type: emailType.type, error: error.message });
        console.log(`❌ Failed to send ${emailType.type}: ${error.message}`);
      }
    }

    res.json({
      success: true,
      message: `Sent ${results.length} emails to ${testEmail}`,
      emailAccounts: {
        orders: 'orders@edufiliova.com',
        verify: 'verify@edufiliova.com',
        support: 'support@edufiliova.com'
      },
      results,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error: any) {
    console.error('❌ Error sending test emails:', error);
    res.status(500).json({ error: 'Failed to send test emails', details: error.message });
  }
});

export default router;
