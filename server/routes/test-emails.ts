import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { emailService } from '../utils/email.js';
import { sendVoucherEmail, sendBulkVouchersEmail } from '../email.js';
import { sendGiftVoucherEmail } from '../utils/email-templates.js';

const router = Router();

// Bypass auth for all test-emails routes (public testing endpoint)
router.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[Test-Emails] Incoming request to: ${req.path}`);
  // Mark as authenticated to bypass auth middleware
  (req as any).user = { id: 'test-user', role: 'admin' };
  next();
});

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
        fullName: 'Test User',
        courseName: 'Complete Web Development Bootcamp',
        teacherName: 'John Instructor',
        orderId: 'TEST-COURSE-001',
        price: 149.99,
        accessType: 'Lifetime Access',
        purchaseDate: new Date().toLocaleDateString()
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
        fullName: 'Tyler Williams',
        displayName: 'Tyler W.'
      });
      results.push({ type: 'Teacher Approval Email (support@)', success: teacherApprovalResult });
      
      // Return immediately if we only care about approval
      return res.json({
        success: true,
        message: `Sent Approval test email to ${testEmail}`,
        results: [{ type: 'Teacher Approval Email (support@)', success: teacherApprovalResult }]
      });
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
        fullName: 'Tyler Williams',
        courseName: 'Complete Web Development Bootcamp',
        teacherName: 'Sarah Smith',
        orderId: 'COURSE-' + Date.now(),
        price: 149.99,
        accessType: 'Lifetime Access',
        purchaseDate: new Date().toLocaleDateString()
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

// Test endpoint for digital purchase order email
router.post('/test-emails/digital-purchase', async (req: Request, res: Response) => {
  try {
    const { testEmail } = req.body;
    const emailToTest = testEmail || 'admin@pacreatives.co.za';
    
    console.log(`📧 Testing digital purchase email to ${emailToTest}...`);

    const digitalPurchaseTemplate = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"><meta name="format-detection" content="telephone=no, date=no, address=no, email=no"><meta name="x-apple-disable-message-reformatting"><style>@media (max-width: 1px) { .layout-0 { display: none !important; } } @media (max-width: 1px) and (min-width: 0px) { .layout-0-under-1 { display: table !important; } }</style></head><body style="width:100%;-webkit-text-size-adjust:100%;text-size-adjust:100%;background-color:#f0f1f5;margin:0;padding:0"><table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#f0f1f5" style="background-color:#f0f1f5"><tbody><tr><td style="background-color:#f0f1f5"><table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;margin:0 auto;background-color:#ffffff"><tbody><tr><td style="vertical-align:top;padding:20px"><table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#0d3931;border-radius:12px"><tbody><tr><td style="padding:20px;vertical-align:top;text-align:center"><table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation"><tbody><tr><td dir="ltr" style="color:#ffffff;font-size:20px;font-weight:700;font-family:Arial, Helvetica, sans-serif;white-space:pre-wrap;text-align:center">Thank you for your purchase!</td></tr></tbody></table></td></tr></tbody></table></td></tr><tr><td style="vertical-align:top;padding:20px 20px 20px 20px"><table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation"><tbody><tr><td dir="ltr" style="color:#545454;font-size:16px;font-family:Arial, Helvetica, sans-serif;text-align:center">Hi {{customerName}},<br><br>Thank you for your purchase! Your order has been successfully processed, and your digital products are now ready for download. You can access your files immediately from the links below or anytime from your EduFiliova account.</td></tr></tbody></table></td></tr><tr><td style="vertical-align:top;padding:20px 20px 20px 20px"><table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#f0f1f5;border-radius:12px"><tbody><tr><td style="padding:20px;vertical-align:top"><table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation"><tbody><tr><td dir="ltr" style="color:#2f5a4e;font-size:18px;font-weight:700;font-family:Arial, Helvetica, sans-serif;">Order Details</td></tr><tr><td style="padding-top:15px"><table cellpadding="0" cellspacing="0" border="0" style="width:100%"><tbody><tr><td style="width:50%;padding-right:10px"><span style="color:#545454;">Order ID:</span></td><td style="width:50%;padding-left:10px"><span style="font-weight:700;color:#2f5a4e;">#{{orderId}}</span></td></tr><tr><td style="width:50%;padding-right:10px;padding-top:10px"><span style="color:#545454;">Total Paid:</span></td><td style="width:50%;padding-left:10px;padding-top:10px"><span style="font-weight:700;color:#2f5a4e;">\${{totalPrice}}</span></td></tr><tr><td style="width:50%;padding-right:10px;padding-top:10px"><span style="color:#545454;">Purchase Date:</span></td><td style="width:50%;padding-left:10px;padding-top:10px"><span style="font-weight:700;color:#2f5a4e;">{{purchaseDate}}</span></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr><tr><td style="vertical-align:top;padding:20px 20px 20px 20px"><table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#fef3e2;border-radius:12px;border-left:4px solid #a0fab2"><tbody><tr><td style="padding:20px;vertical-align:top"><table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation"><tbody><tr><td dir="ltr" style="color:#2f5a4e;font-size:18px;font-weight:700;font-family:Arial, Helvetica, sans-serif;">Important Download Information</td></tr><tr><td style="padding-top:15px"><dir ltr" style="color:#545454;font-size:16px;font-family:Arial, Helvetica, sans-serif;"><span>• Download links are time-limited and may expire after 48 hours<br>• You can re-download your purchases anytime from your account dashboard<br>• Keep a backup of your files after downloading<br>• Do not share your download links with others<br><br>If a download link expires or you experience any issues, our support team can assist you.</span></td></tr></tbody></table></td></tr></tbody></table></td></tr><tr><td style="vertical-align:top;padding:20px 20px 0px 20px"><table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation"><tbody><tr><td style="padding:20px;vertical-align:top;background-color:#0d3931;border-radius:8px"><table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation"><tbody><tr><td><table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation"><tbody><tr><td style="padding:0 0 0 0;text-align:center"><a href="https://edufiliova.com/my-downloads" target="_blank" rel="noopener noreferrer" style="color:#ffffff;text-decoration:none;font-weight:700;font-size:16px">Go to My Downloads</a></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr><tr><td style="vertical-align:top;padding:20px"><table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation"><tbody><tr><td dir="ltr" style="color:#2f5a4e;font-size:18px;font-weight:700;font-family:Arial, Helvetica, sans-serif;">Need Help?</td></tr><tr><td style="padding-top:15px"><dir ltr" style="color:#545454;font-size:16px;font-family:Arial, Helvetica, sans-serif;"><span>If you're unable to download your files or have questions about your order, contact us at <a href="mailto:support@edufiliova.com" target="_blank" style="color:#2f5a4e;text-decoration:underline;">support@edufiliova.com</a> and include your Order ID (#{{orderId}}) for faster assistance.<br><br>Thank you for choosing EduFiliova. We hope your digital products help you learn, create, and grow.<br><br><strong>Warm regards,<br>EduFiliova Orders Team</strong></span></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></body></html>`;

    // Replace template variables with test data
    const customerName = 'Test User';
    const orderId = 'TEST-' + Math.random().toString(36).substring(2, 10).toUpperCase();
    const totalPrice = '$99.99';
    const purchaseDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const emailContent = digitalPurchaseTemplate
      .replace(/{{customerName}}/g, customerName)
      .replace(/{{orderId}}/g, orderId)
      .replace(/{{totalPrice}}/g, totalPrice)
      .replace(/{{purchaseDate}}/g, purchaseDate);

    const transporter = await (await import('../email.js')).createEmailTransporter();
    const mailOptions = {
      from: `"EduFiliova Orders" <orders@edufiliova.com>`,
      to: emailToTest,
      subject: 'Your Digital Purchase Receipt - Download Your Files Now 📥',
      html: emailContent
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Digital purchase test email sent to ${emailToTest}`);

    res.json({
      success: true,
      message: `Digital purchase email sent successfully to ${emailToTest}`,
      details: {
        orderId,
        totalPrice,
        purchaseDate,
        customerName
      }
    });
  } catch (error: any) {
    console.error('❌ Error sending digital purchase test email:', error);
    res.status(500).json({ error: 'Failed to send digital purchase email', details: error.message });
  }
});

// Test endpoint for course completion email
router.post('/test-emails/course-completion', async (req: Request, res: Response) => {
  try {
    const { testEmail, fullName, courseTitle, completionDate, finalScore, certificateType, verificationCode } = req.body;
    
    if (!testEmail) {
      return res.status(400).json({ error: 'testEmail is required' });
    }

    console.log(`📧 Testing course completion email to ${testEmail}...`);

    const result = await emailService.sendCourseCompletionEmail(testEmail, {
      fullName: fullName || 'John Doe',
      courseTitle: courseTitle || 'Advanced Mathematics Masterclass',
      completionDate: completionDate || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      finalScore: finalScore || '98',
      certificateType: certificateType || 'Certificate of Excellence',
      verificationCode: verificationCode || 'CERT-' + Math.random().toString(36).substring(2, 8).toUpperCase()
    });

    res.json({
      success: result,
      message: result ? 'Course completion email sent successfully' : 'Failed to send course completion email',
      details: {
        recipientEmail: testEmail,
        courseTitle: courseTitle || 'Advanced Mathematics Masterclass'
      }
    });
  } catch (error: any) {
    console.error('❌ Error sending course completion test email:', error);
    res.status(500).json({ error: 'Failed to send course completion email', details: error.message });
  }
});

// Test endpoint for course purchase email
router.post('/test-emails/course-purchase', async (req: Request, res: Response) => {
  try {
    const { testEmail, fullName, courseName, teacherName, orderId, price, accessType, purchaseDate } = req.body;
    
    if (!testEmail) {
      return res.status(400).json({ error: 'testEmail is required' });
    }

    console.log(`📧 Testing course purchase email to ${testEmail}...`);

    const result = await emailService.sendCoursePurchaseEmail(testEmail, {
      fullName: fullName || 'John Doe',
      courseName: courseName || 'Advanced Mathematics Masterclass',
      teacherName: teacherName || 'Dr. Sarah Wilson',
      orderId: orderId || 'EDU-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      price: price || '99.99',
      accessType: accessType || 'Lifetime Access',
      purchaseDate: purchaseDate || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    });

    res.json({
      success: result,
      message: result ? 'Course purchase email sent successfully' : 'Failed to send course purchase email',
      details: {
        recipientEmail: testEmail,
        courseName: courseName || 'Advanced Mathematics Masterclass'
      }
    });
  } catch (error: any) {
    console.error('❌ Error sending course purchase test email:', error);
    res.status(500).json({ error: 'Failed to send course purchase email', details: error.message });
  }
});

// Test endpoint specifically for device login email
router.post('/test-emails/device-login', async (req: Request, res: Response) => {
  try {
    const { testEmail } = req.body;
    
    if (!testEmail) {
      return res.status(400).json({ error: 'testEmail is required' });
    }

    console.log(`📧 Testing device login email to ${testEmail}...`);

    const result = await emailService.sendDeviceLoginEmail(testEmail, {
      fullName: 'Test User',
      deviceName: 'Chrome on Windows',
      browser: 'Chrome 120',
      os: 'Windows 11',
      location: 'New York, United States',
      ipAddress: '203.0.113.45',
      loginTime: new Date().toLocaleString()
    });

    res.json({
      success: result,
      message: result ? 'Device login email sent successfully' : 'Failed to send device login email',
      details: {
        recipientEmail: testEmail,
        deviceName: 'Chrome on Windows',
        location: 'New York, United States'
      }
    });
  } catch (error: any) {
    console.error('❌ Error sending device login test email:', error);
    res.status(500).json({ error: 'Failed to send device login email', details: error.message });
  }
});

// Test endpoint for account restriction email
router.post('/test-emails/account-restriction', async (req: Request, res: Response) => {
  try {
    const { testEmail, fullName, restrictionType, reason } = req.body;
    if (!testEmail) return res.status(400).json({ error: 'testEmail is required' });

    const success = await emailService.sendAccountRestrictionEmail(testEmail, {
      fullName: fullName || 'Test User',
      restrictionType: restrictionType || 'Temporarily Restricted',
      reason: reason || 'Routine security review'
    });

    res.json({ success, message: success ? 'Account restriction email sent' : 'Failed to send' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Test endpoint for voucher purchase email
router.post('/test-emails/voucher-purchase', async (req: Request, res: Response) => {
  try {
    const { testEmail, fullName, senderName, amount, voucherCode, expiresAt, personalMessage } = req.body;
    if (!testEmail) return res.status(400).json({ error: 'testEmail is required' });

    const success = await emailService.sendVoucherEmail(testEmail, {
      fullName: fullName || 'Test User',
      senderName: senderName || 'A Friend',
      amount: amount || '100.00',
      voucherCode: voucherCode || 'VOUCH-1234-TEST',
      expiresAt: expiresAt || 'December 31, 2026',
      personalMessage: personalMessage || 'Enjoy your gift!'
    });

    res.json({ success, message: success ? 'Voucher email sent' : 'Failed to send' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Test endpoint specifically for mobile linked email
router.post('/test-emails/mobile-linked', async (req: Request, res: Response) => {
  try {
    const { testEmail, userName, maskedMobileNumber } = req.body;
    
    if (!testEmail) {
      return res.status(400).json({ error: 'testEmail is required' });
    }

    console.log(`📧 Testing mobile linked email to ${testEmail}...`);

    const result = await emailService.sendMobileLinkedEmail(testEmail, {
      userName: userName || 'Test User',
      maskedMobileNumber: maskedMobileNumber || '+1 (***) ***-5432'
    });

    res.json({
      success: result,
      message: result ? 'Mobile linked email sent successfully' : 'Failed to send mobile linked email',
      details: {
        recipientEmail: testEmail,
        userName: userName || 'Test User',
        maskedMobileNumber: maskedMobileNumber || '+1 (***) ***-5432'
      }
    });
  } catch (error: any) {
    console.error('❌ Error sending mobile linked test email:', error);
    res.status(500).json({ error: 'Failed to send mobile linked email', details: error.message });
  }
});

// Test endpoint specifically for course notification email
router.post('/test-emails/course-notification', async (req: Request, res: Response) => {
  try {
    const { testEmail, fullName, courseTitle, teacherName, category } = req.body;
    
    if (!testEmail) {
      return res.status(400).json({ error: 'testEmail is required' });
    }

    console.log(`📧 Testing course notification email to ${testEmail}...`);

    const result = await emailService.sendCourseNotificationEmail(testEmail, {
      fullName: fullName || 'Test User',
      courseTitle: courseTitle || 'Advanced Web Development',
      teacherName: teacherName || 'Expert Instructor',
      category: category || 'Technology'
    });

    res.json({
      success: result,
      message: result ? 'Course notification email sent successfully' : 'Failed to send course notification email',
      details: {
        recipientEmail: testEmail,
        fullName: fullName || 'Test User',
        courseTitle: courseTitle || 'Advanced Web Development',
        teacherName: teacherName || 'Expert Instructor',
        category: category || 'Technology'
      }
    });
  } catch (error: any) {
    console.error('❌ Error sending course notification test email:', error);
    res.status(500).json({ error: 'Failed to send course notification email', details: error.message });
  }
});

// Test endpoint specifically for student verification email
router.post('/test-emails/student-verification', async (req: Request, res: Response) => {
  try {
    const { testEmail, fullName, code, expiresIn } = req.body;
    
    if (!testEmail) {
      return res.status(400).json({ error: 'testEmail is required' });
    }

    console.log(`📧 Testing student verification email to ${testEmail}...`);

    const result = await emailService.sendStudentVerificationEmail(testEmail, {
      fullName: fullName || 'Test Student',
      code: code || '123456',
      expiresIn: expiresIn || '10'
    });

    res.json({
      success: result,
      message: result ? 'Student verification email sent successfully' : 'Failed to send student verification email',
      details: {
        recipientEmail: testEmail,
        fullName: fullName || 'Test Student',
        code: code || '123456',
        expiresIn: expiresIn || '10'
      }
    });
  } catch (error: any) {
    console.error('❌ Error sending student verification test email:', error);
    res.status(500).json({ error: 'Failed to send student verification email', details: error.message });
  }
});

// Test endpoint specifically for teacher verification email
router.post('/test-emails/teacher-verification', async (req: Request, res: Response) => {
  try {
    const { testEmail, fullName, code, expiresIn } = req.body;
    
    if (!testEmail) {
      return res.status(400).json({ error: 'testEmail is required' });
    }

    console.log(`📧 Testing teacher verification email to ${testEmail}...`);

    const result = await emailService.sendTeacherVerificationEmail(testEmail, {
      fullName: fullName || 'Test Teacher',
      code: code || '123456',
      expiresIn: expiresIn || '10'
    });

    res.json({
      success: result,
      message: result ? 'Teacher verification email sent successfully' : 'Failed to send teacher verification email',
      details: {
        recipientEmail: testEmail,
        fullName: fullName || 'Test Teacher',
        code: code || '123456',
        expiresIn: expiresIn || '10'
      }
    });
  } catch (error: any) {
    console.error('❌ Error sending teacher verification test email:', error);
    res.status(500).json({ error: 'Failed to send teacher verification email', details: error.message });
  }
});

// Test endpoint specifically for freelancer verification email
router.post('/test-emails/freelancer-verification', async (req: Request, res: Response) => {
  try {
    const { testEmail, fullName, code, expiresIn } = req.body;
    
    if (!testEmail) {
      return res.status(400).json({ error: 'testEmail is required' });
    }

    console.log(`📧 Testing freelancer verification email to ${testEmail}...`);

    const result = await emailService.sendFreelancerVerificationEmail(testEmail, {
      fullName: fullName || 'Test Freelancer',
      code: code || '123456',
      expiresIn: expiresIn || '10'
    });

    res.json({
      success: result,
      message: result ? 'Freelancer verification email sent successfully' : 'Failed to send freelancer verification email',
      details: {
        recipientEmail: testEmail,
        fullName: fullName || 'Test Freelancer',
        code: code || '123456',
        expiresIn: expiresIn || '10'
      }
    });
  } catch (error: any) {
    console.error('❌ Error sending freelancer verification test email:', error);
    res.status(500).json({ error: 'Failed to send freelancer verification email', details: error.message });
  }
});

// Test endpoint specifically for customer verification email
router.post('/test-emails/customer-verification', async (req: Request, res: Response) => {
  try {
    const { testEmail, fullName, code, expiresIn } = req.body;
    
    if (!testEmail) {
      return res.status(400).json({ error: 'testEmail is required' });
    }

    console.log(`📧 Testing customer verification email to ${testEmail}...`);

    const result = await emailService.sendCustomerVerificationEmail(testEmail, {
      fullName: fullName || 'Test Customer',
      code: code || '123456',
      expiresIn: expiresIn || '10'
    });

    res.json({
      success: result,
      message: result ? 'Customer verification email sent successfully' : 'Failed to send customer verification email',
      details: {
        recipientEmail: testEmail,
        fullName: fullName || 'Test Customer',
        code: code || '123456',
        expiresIn: expiresIn || '10'
      }
    });
  } catch (error: any) {
    console.error('❌ Error sending customer verification test email:', error);
    res.status(500).json({ error: 'Failed to send customer verification email', details: error.message });
  }
});

// Test endpoint specifically for account restriction email
// Removed requirement for testing purposes during development
// @ts-ignore
router.post('/test-emails/account-restriction', async (req: Request, res: Response) => {
  try {
    const { testEmail, fullName, restrictionType, reason } = req.body;
    
    if (!testEmail) {
      return res.status(400).json({ error: 'testEmail is required' });
    }

    console.log(`📧 Testing account restriction email to ${testEmail}...`);

    const result = await emailService.sendAccountRestrictionEmail(testEmail, {
      fullName: fullName || 'Test User',
      restrictionType: restrictionType || 'Temporarily Restricted',
      reason: reason || 'Routine compliance review'
    });

    res.json({
      success: result,
      message: result ? 'Account restriction email sent successfully' : 'Failed to send account restriction email',
      details: {
        recipientEmail: testEmail,
        fullName: fullName || 'Test User'
      }
    });
  } catch (error: any) {
    console.error('❌ Error sending account restriction test email:', error);
    res.status(500).json({ error: 'Failed to send account restriction email', details: error.message });
  }
});

export default router;
