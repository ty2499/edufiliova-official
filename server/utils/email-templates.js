import { emailService } from './email.ts';
import * as fs from 'fs';
import * as path from 'path';

const VERIFICATION_TEMPLATE = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <title>Verify Your Account</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 20px auto; background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { background: #0d3931; color: #fff; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { padding: 30px; text-align: center; }
        .code-box { background: #f0f1f5; border: 2px dashed #0d3931; padding: 20px; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; color: #0d3931; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>EduFiliova</h1>
        </div>
        <div class="content">
            <h2>Verify Your {{userType}} Account</h2>
            <p>Hi {{fullName}},</p>
            <p>Thank you for joining EduFiliova! Please use the verification code below to complete your registration:</p>
            <div class="code-box">{{code}}</div>
            <p>This code will expire in {{expiresIn}} minutes.</p>
            <p>If you didn't request this, you can safely ignore this email.</p>
        </div>
        <div class="footer">
            <p>&copy; 2025 EduFiliova. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;

async function getTemplate(dirName, userType) {
  const possiblePaths = [
    path.join(process.cwd(), 'public', 'templates', dirName, 'email.html'),
    path.join(process.cwd(), 'dist', 'public', 'templates', dirName, 'email.html'),
    path.join('/app', 'public', 'templates', dirName, 'email.html'),
    path.join('/app', 'dist', 'public', 'templates', dirName, 'email.html')
  ];
  
  try {
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) return fs.readFileSync(p, 'utf-8');
    }
  } catch (e) {
    console.warn(`⚠️ Template file not found for ${userType}, using fallback`);
  }
  
  return VERIFICATION_TEMPLATE.replace('{{userType}}', userType);
}

export async function sendStudentWelcomeEmail(recipientEmail, recipientName) {
  console.log(`📧 Sending student welcome email to ${recipientEmail}...`);
  try {
    const templatePath = path.join(process.cwd(), 'public', 'email-assets', 'student-welcome', 'template.html');
    let emailHtml = fs.readFileSync(templatePath, 'utf-8');
    const fullName = recipientName || 'Student';
    emailHtml = emailHtml.replace(/Hi \{\{<\/span><span[^>]*>fullName<\/span><span[^>]*>\}\},/gi, `Hi ${fullName},`);
    emailHtml = emailHtml.replace(/\{\{<\/span><span[^>]*>fullName<\/span><span[^>]*>\}\}/gi, fullName);
    emailHtml = emailHtml.replace(/\{\{fullName\}\}/gi, fullName);
    emailHtml = emailHtml.replace(/\{\{FullName\}\}/gi, fullName);
    emailHtml = emailHtml.replace(/\{\{ fullName \}\}/gi, fullName);
    return await emailService.sendEmail({
      to: recipientEmail,
      subject: 'Welcome to EduFiliova - Your Learning Journey Begins!',
      html: emailHtml,
      from: `"EduFiliova" <noreply@edufiliova.com>`
    });
  } catch (error) {
    console.error(`❌ Error sending student welcome email:`, error);
    throw error;
  }
}

export async function sendStudentVerificationEmail(recipientEmail, recipientName, verificationCode, expiresInMinutes = 15) {
  console.log(`📧 Sending student verification email to ${recipientEmail}...`);
  try {
    let emailHtml = await getTemplate('student_verification_template', 'Student');
    const replacements = { 'fullName': recipientName || 'Student', 'code': verificationCode, 'expiresIn': expiresInMinutes.toString() };
    for (const [key, value] of Object.entries(replacements)) {
      emailHtml = emailHtml.replace(new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'gi'), value);
    }
    return await emailService.sendEmail({
      to: recipientEmail,
      subject: 'Verify Your Student Account - EduFiliova',
      html: emailHtml,
      from: `"EduFiliova Verification" <verify@edufiliova.com>`
    });
  } catch (error) {
    console.error(`❌ Error sending student verification email:`, error);
    throw error;
  }
}

export async function sendTeacherVerificationEmail(recipientEmail, recipientName, verificationCode, expiresInMinutes = 15) {
  console.log(`📧 Sending teacher verification email to ${recipientEmail}...`);
  try {
    let emailHtml = await getTemplate('teacher_verification_template', 'Teacher');
    const replacements = { 'fullName': recipientName || 'Teacher', 'code': verificationCode, 'expiresIn': expiresInMinutes.toString() };
    for (const [key, value] of Object.entries(replacements)) {
      emailHtml = emailHtml.replace(new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'gi'), value);
    }
    return await emailService.sendEmail({
      to: recipientEmail,
      subject: 'Verify Your Teacher Account - EduFiliova',
      html: emailHtml,
      from: `"EduFiliova Verification" <verify@edufiliova.com>`
    });
  } catch (error) {
    console.error(`❌ Error sending teacher verification email:`, error);
    throw error;
  }
}

export async function sendFreelancerVerificationEmail(recipientEmail, recipientName, verificationCode, expiresInMinutes = 15) {
  console.log(`📧 Sending freelancer verification email to ${recipientEmail}...`);
  try {
    let emailHtml = await getTemplate('freelancer_verification_template', 'Freelancer');
    const replacements = { 'fullName': recipientName || 'Freelancer', 'code': verificationCode, 'expiresIn': expiresInMinutes.toString() };
    for (const [key, value] of Object.entries(replacements)) {
      emailHtml = emailHtml.replace(new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'gi'), value);
    }
    return await emailService.sendEmail({
      to: recipientEmail,
      subject: 'Verify Your Freelancer Account - EduFiliova',
      html: emailHtml,
      from: `"EduFiliova Verification" <verify@edufiliova.com>`
    });
  } catch (error) {
    console.error(`❌ Error sending freelancer verification email:`, error);
    throw error;
  }
}

export async function sendCustomerVerificationEmail(recipientEmail, recipientName, verificationCode, expiresInMinutes = 15) {
  console.log(`📧 Sending customer verification email to ${recipientEmail}...`);
  try {
    let emailHtml = await getTemplate('customer_verification_template', 'Customer');
    const replacements = { 'fullName': recipientName || 'Customer', 'code': verificationCode, 'expiresIn': expiresInMinutes.toString() };
    for (const [key, value] of Object.entries(replacements)) {
      emailHtml = emailHtml.replace(new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'gi'), value);
    }
    return await emailService.sendEmail({
      to: recipientEmail,
      subject: 'Verify Your Customer Account - EduFiliova',
      html: emailHtml,
      from: `"EduFiliova Verification" <verify@edufiliova.com>`
    });
  } catch (error) {
    console.error(`❌ Error sending customer verification email:`, error);
    throw error;
  }
}

export async function sendGiftVoucherEmail(recipientEmail, recipientName, buyerName, voucherCode, amount, personalMessage, expiresAt) {
  console.log(`📧 Sending gift voucher email to ${recipientEmail}...`);
  try {
    const templatePath = path.join(process.cwd(), 'public', 'email-assets', 'voucher', 'template.html');
    let emailHtml = fs.readFileSync(templatePath, 'utf-8');
    const formatDate = (date) => {
      if (!date) return 'No expiration';
      const d = new Date(date);
      return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    };
    const voucherAmount = typeof amount === 'number' ? amount.toFixed(2) : amount;
    const replacements = { 'fullName': recipientName || 'Friend', 'senderName': buyerName || 'Someone special', 'amount': voucherAmount, 'voucherCode': voucherCode, 'expiresAt': formatDate(expiresAt), 'personalMessage': personalMessage || '' };
    for (const [key, value] of Object.entries(replacements)) {
      emailHtml = emailHtml.replace(new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'gi'), value);
    }
    return await emailService.sendEmail({
      to: recipientEmail,
      subject: \`You've received a $\${voucherAmount} Gift Voucher from \${replacements.senderName}!\`,
      html: emailHtml,
      from: `"EduFiliova" <orders@edufiliova.com>`
    });
  } catch (error) {
    console.error(`❌ Error sending gift voucher email:`, error);
    throw error;
  }
}

export async function sendCoursePurchaseEmail(recipientEmail, recipientName, courseData) {
  console.log(`📧 Sending course purchase email to ${recipientEmail}...`);
  try {
    const templatePath = path.join(process.cwd(), 'public', 'email-assets', 'course-purchase', 'template.html');
    let emailHtml = fs.readFileSync(templatePath, 'utf-8');
    const replacements = { 'fullName': recipientName || 'Student', 'courseName': courseData.courseName || 'Your Course', 'teacherName': courseData.teacherName || 'EduFiliova Instructor', 'orderId': courseData.orderId || 'N/A', 'price': courseData.price || '0.00', 'accessType': courseData.accessType || 'Lifetime Access', 'purchaseDate': courseData.purchaseDate || new Date().toLocaleDateString() };
    for (const [key, value] of Object.entries(replacements)) {
      emailHtml = emailHtml.replace(new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'gi'), value);
    }
    return await emailService.sendEmail({
      to: recipientEmail,
      subject: \`Course Purchase Confirmed - \${replacements.courseName}\`,
      html: emailHtml,
      from: `"EduFiliova Orders" <orders@edufiliova.com>`
    });
  } catch (error) {
    console.error(`❌ Error sending course purchase email:`, error);
    throw error;
  }
}

export async function sendNewCourseAnnouncementEmail(recipientEmail, recipientName, courseData) {
  try {
    const templatePath = path.join(process.cwd(), 'public', 'email-assets', 'new-course-announcement', 'template.html');
    let emailHtml = fs.readFileSync(templatePath, 'utf-8');
    const replacements = { 'fullName': recipientName || 'Student', 'courseTitle': courseData.courseTitle || 'New Course', 'teacherName': courseData.teacherName || 'EduFiliova Instructor', 'category': courseData.category || 'General' };
    for (const [key, value] of Object.entries(replacements)) {
      emailHtml = emailHtml.replace(new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'gi'), value);
    }
    return await emailService.sendEmail({
      to: recipientEmail,
      subject: \`New Course Available: \${replacements.courseTitle}\`,
      html: emailHtml,
      from: `"EduFiliova" <noreply@edufiliova.com>`
    });
  } catch (error) {
    console.error(`❌ Error sending course announcement email:`, error);
    return false;
  }
}

export async function sendCourseAnnouncementToEligibleStudents(courseData) {
  try {
    const { db } = await import('../db.js');
    const { profiles, users } = await import('../../shared/schema.js');
    const { eq, and, or, ilike } = await import('drizzle-orm');
    const eligibleStudents = await db.select({ email: profiles.email, name: profiles.name }).from(profiles).innerJoin(users, eq(users.id, profiles.userId)).where(and(eq(users.role, 'student'), or(ilike(profiles.grade, '%11%'), ilike(profiles.grade, '%12%'), ilike(profiles.grade, '%Form 5%'), ilike(profiles.grade, '%Form 6%'), ilike(profiles.grade, '%College%'), ilike(profiles.grade, '%University%'), ilike(profiles.grade, '%A-Level%'), ilike(profiles.grade, '%AS-Level%'), ilike(profiles.grade, '%A2-Level%'))));
    let successCount = 0;
    for (const student of eligibleStudents) {
      if (student.email) {
        try { await sendNewCourseAnnouncementEmail(student.email, student.name, courseData); successCount++; } catch (err) {}
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    return { sent: successCount, total: eligibleStudents.length };
  } catch (error) {
    console.error('Error sending course announcements:', error);
    return { sent: 0, total: 0, error: error.message };
  }
}

export async function sendPlanUpgradeEmail(recipientEmail, recipientName, upgradeData) {
  try {
    const templatePath = path.join(process.cwd(), 'public', 'email-assets', 'plan-upgrade', 'template.html');
    let emailHtml = fs.readFileSync(templatePath, 'utf-8');
    const replacements = { 'fullName': recipientName || 'Student', 'planName': upgradeData.planName || 'Premium', 'previousPlan': upgradeData.previousPlan || 'Free', 'price': upgradeData.price || '0.00', 'billingCycle': upgradeData.billingCycle || 'Monthly', 'expiryDate': upgradeData.expiryDate || new Date(Date.now() + 30*24*60*60*1000).toLocaleDateString(), 'upgradeDate': upgradeData.upgradeDate || new Date().toLocaleDateString() };
    for (const [key, value] of Object.entries(replacements)) {
      emailHtml = emailHtml.replace(new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'gi'), value);
    }
    return await emailService.sendEmail({
      to: recipientEmail,
      subject: \`Welcome to \${replacements.planName} - Your Subscription is Active!\`,
      html: emailHtml,
      from: `"EduFiliova" <noreply@edufiliova.com>`
    });
  } catch (error) {
    console.error(`❌ Error sending plan upgrade email:`, error);
    return false;
  }
}

export async function sendSuspensionEmail(recipientEmail, recipientName, suspensionReason) {
  console.log(`📧 Sending suspension email to ${recipientEmail}...`);
  try {
    const templatePath = path.join(process.cwd(), 'public', 'email-assets', 'suspension', 'template.html');
    let emailHtml = fs.readFileSync(templatePath, 'utf-8');
    emailHtml = emailHtml.replace(/\{\{fullName\}\}/gi, recipientName || 'User');
    if (suspensionReason && suspensionReason.trim()) {
      emailHtml = emailHtml.replace('{{SUSPENSION_REASON_BLOCK}}', \`<p class="info-text" style="margin-top: 10px; border-top: 1px solid #eee; padding-top: 10px;"><strong>Additional Details:</strong> \${suspensionReason}</p>\`);
    } else { emailHtml = emailHtml.replace('{{SUSPENSION_REASON_BLOCK}}', ''); }
    return await emailService.sendEmail({
      to: recipientEmail,
      subject: 'Important: Your EduFiliova Account Status',
      html: emailHtml,
      from: `"EduFiliova Trust & Safety" <support@edufiliova.com>`
    });
  } catch (error) {
    console.error(`❌ Error sending suspension email:`, error);
    throw error;
  }
}

export async function sendAccountRestrictionEmail(recipientEmail, recipientName, restrictionData) {
  console.log(`📧 Sending account restriction email to ${recipientEmail}...`);
  try {
    const templatePath = path.join(process.cwd(), 'public', 'email-assets', 'restriction', 'template.html');
    let emailHtml = fs.readFileSync(templatePath, 'utf-8');
    const replacements = { 'fullName': recipientName || 'User', 'restrictionDate': restrictionData.restrictionDate || new Date().toLocaleDateString(), 'restrictionType': restrictionData.restrictionType || 'Account Restriction', 'duration': restrictionData.duration || 'Temporary', 'referenceId': restrictionData.referenceId || 'N/A', 'restrictionReason': restrictionData.restrictionReason || 'Violation of terms.', 'appealLink': restrictionData.appealLink || 'https://edufiliova.com/appeal' };
    for (const [key, value] of Object.entries(replacements)) {
      emailHtml = emailHtml.replace(new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'gi'), value);
    }
    return await emailService.sendEmail({
      to: recipientEmail,
      subject: 'Important: Your Account Has Been Restricted',
      html: emailHtml,
      from: `"EduFiliova Trust & Safety" <support@edufiliova.com>`
    });
  } catch (error) {
    console.error(`❌ Error sending account restriction email:`, error);
    throw error;
  }
}

export async function sendNewDeviceLoginEmail(recipientEmail, recipientName, loginData) {
  console.log(`📧 Sending new device login email to ${recipientEmail}...`);
  try {
    const templatePath = path.join(process.cwd(), 'public', 'email-assets', 'new-device-login', 'template.html');
    let emailHtml = fs.readFileSync(templatePath, 'utf-8');
    const replacements = { 'fullName': recipientName || 'User', 'device': loginData.device || 'Unknown Device', 'location': loginData.location || 'Unknown Location', 'ip': loginData.ip || 'Unknown IP', 'time': loginData.time || new Date().toLocaleString() };
    for (const [key, value] of Object.entries(replacements)) {
      emailHtml = emailHtml.replace(new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'gi'), value);
    }
    return await emailService.sendEmail({
      to: recipientEmail,
      subject: 'New Device Login Alert',
      html: emailHtml,
      from: `"EduFiliova Security" <security@edufiliova.com>`
    });
  } catch (error) {
    console.error(`❌ Error sending new device login email:`, error);
    throw error;
  }
}

export async function sendMeetingReminderEmail(recipientEmail, recipientName, meetingData) {
  console.log(`📧 Sending meeting reminder email to ${recipientEmail}...`);
  try {
    const templatePath = path.join(process.cwd(), 'public', 'email-assets', 'meeting-reminder', 'template.html');
    let emailHtml = fs.readFileSync(templatePath, 'utf-8');
    const replacements = { 'fullName': recipientName || 'User', 'meetingTitle': meetingData.title || 'Meeting', 'meetingTime': meetingData.time || 'Scheduled Time', 'meetingLink': meetingData.link || '#' };
    for (const [key, value] of Object.entries(replacements)) {
      emailHtml = emailHtml.replace(new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'gi'), value);
    }
    return await emailService.sendEmail({
      to: recipientEmail,
      subject: \`Reminder: \${replacements.meetingTitle}\`,
      html: emailHtml,
      from: `"EduFiliova" <noreply@edufiliova.com>`
    });
  } catch (error) {
    console.error(`❌ Error sending meeting reminder email:`, error);
    throw error;
  }
}

export async function sendCourseCompletionEmail(recipientEmail, recipientName, completionData) {
  console.log(`📧 Sending course completion email to ${recipientEmail}...`);
  try {
    const templatePath = path.join(process.cwd(), 'public', 'email-assets', 'course-completion', 'template.html');
    let emailHtml = fs.readFileSync(templatePath, 'utf-8');
    const replacements = { 'fullName': recipientName || 'Student', 'courseName': completionData.courseName || 'Course', 'completionDate': completionData.date || new Date().toLocaleDateString(), 'certificateUrl': completionData.certificateUrl || '#' };
    for (const [key, value] of Object.entries(replacements)) {
      emailHtml = emailHtml.replace(new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'gi'), value);
    }
    return await emailService.sendEmail({
      to: recipientEmail,
      subject: \`Congratulations on completing \${replacements.courseName}!\`,
      html: emailHtml,
      from: `"EduFiliova" <noreply@edufiliova.com>`
    });
  } catch (error) {
    console.error(`❌ Error sending course completion email:`, error);
    throw error;
  }
}

export async function sendPaymentFailedEmail(recipientEmail, recipientName, paymentData) {
  console.log(`📧 Sending payment failed email to ${recipientEmail}...`);
  try {
    const templatePath = path.join(process.cwd(), 'public', 'email-assets', 'payment-failed', 'template.html');
    let emailHtml = fs.readFileSync(templatePath, 'utf-8');
    const replacements = { 'fullName': recipientName || 'Customer', 'amount': paymentData.amount || '0.00', 'reason': paymentData.reason || 'Payment declined', 'retryLink': paymentData.retryLink || '#' };
    for (const [key, value] of Object.entries(replacements)) {
      emailHtml = emailHtml.replace(new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'gi'), value);
    }
    return await emailService.sendEmail({
      to: recipientEmail,
      subject: 'Payment Failed',
      html: emailHtml,
      from: `"EduFiliova Billing" <billing@edufiliova.com>`
    });
  } catch (error) {
    console.error(`❌ Error sending payment failed email:`, error);
    throw error;
  }
}

export async function sendFreelancerUnderReviewEmail(recipientEmail, recipientName) {
  console.log(`📧 Sending freelancer review email to ${recipientEmail}...`);
  try {
    const templatePath = path.join(process.cwd(), 'public', 'email-assets', 'freelancer-application-under-review', 'template.html');
    let emailHtml = fs.readFileSync(templatePath, 'utf-8');
    emailHtml = emailHtml.replace(/\{\{fullName\}\}/gi, recipientName || 'Freelancer');
    return await emailService.sendEmail({
      to: recipientEmail,
      subject: 'Application Received - EduFiliova Freelancer Network',
      html: emailHtml,
      from: `"EduFiliova Review Team" <support@edufiliova.com>`
    });
  } catch (error) {
    console.error(`❌ Error sending freelancer review email:`, error);
    throw error;
  }
}

export async function sendTeacherApplicationSubmittedEmail(recipientEmail, recipientName) {
  console.log(`📧 Sending teacher application submitted email to ${recipientEmail}...`);
  try {
    const templatePath = path.join(process.cwd(), 'public', 'email-assets', 'teacher-application-submitted', 'template.html');
    let emailHtml = fs.readFileSync(templatePath, 'utf-8');
    emailHtml = emailHtml.replace(/\{\{fullName\}\}/gi, recipientName || 'Teacher');
    return await emailService.sendEmail({
      to: recipientEmail,
      subject: 'Application Received - EduFiliova Teacher Network',
      html: emailHtml,
      from: `"EduFiliova Review Team" <support@edufiliova.com>`
    });
  } catch (error) {
    console.error(`❌ Error sending teacher application submitted email:`, error);
    throw error;
  }
}

export async function sendTeacherDeclineEmail(recipientEmail, recipientName, reason = null) {
  console.log(`📧 Sending teacher application decline email to ${recipientEmail}...`);
  try {
    const templatePath = path.join(process.cwd(), 'public', 'email-assets', 'teacher-decline', 'template.html');
    let emailHtml = fs.readFileSync(templatePath, 'utf-8');
    const fullName = recipientName || 'Applicant';
    emailHtml = emailHtml.replace(/\{\{\s*fullName\s*\}\}/gi, fullName);
    if (reason) {
      emailHtml = emailHtml.replace(/\{\{#if reason\}\}([\s\S]*?)\{\{\/if\}\}/gi, (match, p1) => p1.replace(/\{\{\s*reason\s*\}\}/gi, reason));
    } else { emailHtml = emailHtml.replace(/\{\{#if reason\}\}[\s\S]*?\{\{\/if\}\}/gi, ''); }
    return await emailService.sendEmail({
      to: recipientEmail,
      subject: 'Update Regarding Your Teacher Application - EduFiliova',
      html: emailHtml,
      from: `"EduFiliova Review Team" <support@edufiliova.com>`
    });
  } catch (error) {
    console.error(`❌ Error sending teacher decline email:`, error);
    throw error;
  }
}

export async function sendTeacherUnderReviewEmail(recipientEmail, recipientName) {
  console.log(`📧 Sending teacher under review email to ${recipientEmail}...`);
  try {
    const templatePath = path.join(process.cwd(), 'public', 'email-assets', 'teacher-application-under-review', 'template.html');
    let emailHtml = fs.readFileSync(templatePath, 'utf-8');
    emailHtml = emailHtml.replace(/\{\{fullName\}\}/gi, recipientName || 'Teacher');
    return await emailService.sendEmail({
      to: recipientEmail,
      subject: 'Application Update - EduFiliova Teacher Network',
      html: emailHtml,
      from: `"EduFiliova Review Team" <support@edufiliova.com>`
    });
  } catch (error) {
    console.error(`❌ Error sending teacher under review email:`, error);
    throw error;
  }
}

export async function sendShopPurchaseEmail(recipientEmail, recipientName, purchaseData) {
  console.log(`📧 Sending shop purchase email to ${recipientEmail}...`);
  try {
    const templatePath = path.join(process.cwd(), 'public', 'email-assets', 'shop-purchase', 'template.html');
    let emailHtml = fs.readFileSync(templatePath, 'utf-8');
    const replacements = { 'fullName': recipientName || 'Customer', 'productName': purchaseData.productName || 'Product', 'amount': purchaseData.amount || '0.00', 'orderId': purchaseData.orderId || 'N/A' };
    for (const [key, value] of Object.entries(replacements)) {
      emailHtml = emailHtml.replace(new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'gi'), value);
    }
    return await emailService.sendEmail({
      to: recipientEmail,
      subject: \`Order Confirmation - \${replacements.productName}\`,
      html: emailHtml,
      from: `"EduFiliova Shop" <orders@edufiliova.com>`
    });
  } catch (error) {
    console.error(`❌ Error sending shop purchase email:`, error);
    throw error;
  }
}

export async function sendFreelancerApplicationSubmittedEmail(recipientEmail, recipientName) {
  console.log(`📧 Sending freelancer application submitted email to ${recipientEmail}...`);
  try {
    const templatePath = path.join(process.cwd(), 'public', 'email-assets', 'freelancer-application-submitted', 'template.html');
    let emailHtml = fs.readFileSync(templatePath, 'utf-8');
    emailHtml = emailHtml.replace(/\{\{fullName\}\}/gi, recipientName || 'Freelancer');
    return await emailService.sendEmail({
      to: recipientEmail,
      subject: 'Application Received - EduFiliova Freelancer Network',
      html: emailHtml,
      from: `"EduFiliova Review Team" <support@edufiliova.com>`
    });
  } catch (error) {
    console.error(`❌ Error sending freelancer application submitted email:`, error);
    throw error;
  }
}
