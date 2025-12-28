import { emailService } from './email.ts';
import * as fs from 'fs';
import * as path from 'path';

export async function sendStudentWelcomeEmail(recipientEmail, recipientName) {
  console.log(`📧 Sending student welcome email to ${recipientEmail}...`);
  console.log(`   - Recipient: ${recipientName}`);
  
  try {
    const templatePath = path.join(process.cwd(), 'public', 'email-assets', 'student-welcome', 'template.html');
    let emailHtml = fs.readFileSync(templatePath, 'utf-8');
    
    const fullName = recipientName || 'Student';
    
    emailHtml = emailHtml.replace(/Hi \{\{<\/span><span[^>]*>fullName<\/span><span[^>]*>\}\},/gi, `Hi ${fullName},`);
    emailHtml = emailHtml.replace(/\{\{<\/span><span[^>]*>fullName<\/span><span[^>]*>\}\}/gi, fullName);
    emailHtml = emailHtml.replace(/\{\{fullName\}\}/gi, fullName);
    emailHtml = emailHtml.replace(/\{\{FullName\}\}/gi, fullName);
    emailHtml = emailHtml.replace(/\{\{ fullName \}\}/gi, fullName);
    
    const baseUrl = process.env.REPLIT_DEV_DOMAIN 
      ? `https://${process.env.REPLIT_DEV_DOMAIN}`
      : 'https://edufiliova.com';
    const logoUrl = 'https://res.cloudinary.com/dl2lomrhp/image/upload/v1763935567/edufiliova/edufiliova-white-logo.png';
    const spiral1Url = 'https://res.cloudinary.com/dl2lomrhp/image/upload/v1766908569/edufiliova/email-assets/db561a55b2cf0bc6e877bb934b39b700_1766506747370.png';
    const spiral2Url = 'https://res.cloudinary.com/dl2lomrhp/image/upload/v1766908559/edufiliova/email-assets/83faf7f361d9ba8dfdc904427b5b6423_1766506747364.png';
    const cornerUrl = 'https://res.cloudinary.com/dl2lomrhp/image/upload/v1766908555/edufiliova/email-assets/3d94f798ad2bd582f8c3afe175798088_1766506747360.png';
    const promoUrl = 'https://res.cloudinary.com/dl2lomrhp/image/upload/v1766908554/edufiliova/email-assets/dc84055d94aa2dc70856ec3b8b024828.png';

    // Image removed
    // Image removed
    // Image removed
    // Image removed
    // Image removed
    // Image removed

    const attachments = [];

    const result = await emailService.sendEmail({
      to: recipientEmail,
      subject: 'Welcome to EduFiliova - Your Learning Journey Begins!',
      html: emailHtml,
      from: `"EduFiliova" <noreply@edufiliova.com>`,
      attachments
    });
    
    if (result) {
      console.log(`✅ Student welcome email sent successfully to ${recipientEmail}`);
    } else {
      console.error(`❌ Student welcome email failed to send to ${recipientEmail}`);
    }
    
    return result;
  } catch (error) {
    console.error(`❌ Error sending student welcome email:`, error);
    throw error;
  }
}

export async function sendStudentVerificationEmail(recipientEmail, recipientName, verificationCode, expiresInMinutes = 15) {
  console.log(`📧 Sending student verification email to ${recipientEmail}...`);
  console.log(`   - Recipient: ${recipientName}`);
  console.log(`   - Code: ${verificationCode}`);
  console.log(`   - Expires in: ${expiresInMinutes} minutes`);
  
  try {
    const templatePath = path.join(process.cwd(), 'public', 'email-assets', 'student-verification', 'template.html');
    let emailHtml = fs.readFileSync(templatePath, 'utf-8');
    
    const fullName = recipientName || 'Student';
    const code = verificationCode;
    const expiresIn = expiresInMinutes.toString();
    
    emailHtml = emailHtml.replace(/Hi \{\{<\/span><span[^>]*>fullName<\/span><span[^>]*>\}\},/gi, `Hi ${fullName},`);
    emailHtml = emailHtml.replace(/\{\{<\/span><span[^>]*>fullName<\/span><span[^>]*>\}\}/gi, fullName);
    emailHtml = emailHtml.replace(/\{\{fullName\}\}/gi, fullName);
    emailHtml = emailHtml.replace(/\{\{FullName\}\}/gi, fullName);
    emailHtml = emailHtml.replace(/\{\{ fullName \}\}/gi, fullName);
    
    emailHtml = emailHtml.replace(/\{\{<\/span><span[^>]*>code<\/span><span[^>]*>\}\}/gi, code);
    emailHtml = emailHtml.replace(/\{\{code\}\}/gi, code);
    emailHtml = emailHtml.replace(/\{\{Code\}\}/gi, code);
    emailHtml = emailHtml.replace(/\{\{ code \}\}/gi, code);
    
    emailHtml = emailHtml.replace(/\{\{<\/span><span[^>]*>expiresIn<\/span><span[^>]*>\}\}/gi, expiresIn);
    emailHtml = emailHtml.replace(/\{\{expiresIn\}\}/gi, expiresIn);
    emailHtml = emailHtml.replace(/\{\{ExpiresIn\}\}/gi, expiresIn);
    emailHtml = emailHtml.replace(/\{\{ expiresIn \}\}/gi, expiresIn);
    
    const logoUrl = 'https://res.cloudinary.com/dl2lomrhp/image/upload/v1763935567/edufiliova/edufiliova-white-logo.png';
    const spiral1Url = 'https://res.cloudinary.com/dl2lomrhp/image/upload/v1766908569/edufiliova/email-assets/db561a55b2cf0bc6e877bb934b39b700_1766506747370.png';
    const spiral2Url = 'https://res.cloudinary.com/dl2lomrhp/image/upload/v1766908559/edufiliova/email-assets/83faf7f361d9ba8dfdc904427b5b6423_1766506747364.png';
    const cornerUrl = 'https://res.cloudinary.com/dl2lomrhp/image/upload/v1766908554/edufiliova/email-assets/8c5dfa6f6ff7f681bbf586933883b270.png';
    const promoUrl = 'https://res.cloudinary.com/dl2lomrhp/image/upload/v1766908554/edufiliova/email-assets/50df79cf94bcde6e18f9cb9ac1a740dd.png';

    // Image removed
    // Image removed
    // Image removed
    // Image removed
    // Image removed
    // Image removed

    const attachments = [];

    const result = await emailService.sendEmail({
      to: recipientEmail,
      subject: 'Verify Your Student Account - EduFiliova',
      html: emailHtml,
      from: `"EduFiliova" <verify@edufiliova.com>`,
      attachments
    });
    
    if (result) {
      console.log(`✅ Student verification email sent successfully to ${recipientEmail}`);
    } else {
      console.error(`❌ Student verification email failed to send to ${recipientEmail}`);
    }
    
    return result;
  } catch (error) {
    console.error(`❌ Error sending student verification email:`, error);
    throw error;
  }
}

export async function sendGiftVoucherEmail(recipientEmail, recipientName, buyerName, voucherCode, amount, personalMessage, expiresAt) {
  console.log(`📧 Sending gift voucher email to ${recipientEmail}...`);
  console.log(`   - Recipient: ${recipientName}`);
  console.log(`   - From: ${buyerName}`);
  console.log(`   - Code: ${voucherCode}`);
  console.log(`   - Amount: $${amount}`);
  
  try {
    const templatePath = path.join(process.cwd(), 'public', 'email-assets', 'voucher', 'template.html');
    let emailHtml = fs.readFileSync(templatePath, 'utf-8');
    
    const formatDate = (date) => {
      if (!date) return 'No expiration';
      const d = new Date(date);
      return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    };
    
    const fullName = recipientName || 'Friend';
    const senderName = buyerName || 'Someone special';
    const voucherAmount = typeof amount === 'number' ? amount.toFixed(2) : amount;
    const expiryDate = formatDate(expiresAt);
    const message = personalMessage || '';
    
    emailHtml = emailHtml.replace(/Hi \{\{<\/span><span[^>]*>fullName<\/span><span[^>]*>\}\},/gi, `Hi ${fullName},`);
    emailHtml = emailHtml.replace(/\{\{<\/span><span[^>]*>fullName<\/span><span[^>]*>\}\}/gi, fullName);
    emailHtml = emailHtml.replace(/\{\{fullName\}\}/gi, fullName);
    emailHtml = emailHtml.replace(/\{\{FullName\}\}/gi, fullName);
    emailHtml = emailHtml.replace(/\{\{ fullName \}\}/gi, fullName);
    
    emailHtml = emailHtml.replace(/\{\{<\/span><span[^>]*>senderName<\/span><span[^>]*>\}\}/gi, senderName);
    emailHtml = emailHtml.replace(/\{\{senderName\}\}/gi, senderName);
    emailHtml = emailHtml.replace(/\{\{SenderName\}\}/gi, senderName);
    emailHtml = emailHtml.replace(/\{\{ senderName \}\}/gi, senderName);
    
    emailHtml = emailHtml.replace(/\$\{\{<\/span><span[^>]*>amount<\/span><span[^>]*>\}\}/gi, `$${voucherAmount}`);
    emailHtml = emailHtml.replace(/\$\{\{amount\}\}/gi, `$${voucherAmount}`);
    emailHtml = emailHtml.replace(/\{\{amount\}\}/gi, voucherAmount);
    emailHtml = emailHtml.replace(/\{\{Amount\}\}/gi, voucherAmount);
    emailHtml = emailHtml.replace(/\{\{ amount \}\}/gi, voucherAmount);
    
    emailHtml = emailHtml.replace(/\{\{<\/span><span[^>]*>voucherCode<\/span><span[^>]*>\}\}/gi, voucherCode);
    emailHtml = emailHtml.replace(/\{\{voucherCode\}\}/gi, voucherCode);
    emailHtml = emailHtml.replace(/\{\{VoucherCode\}\}/gi, voucherCode);
    emailHtml = emailHtml.replace(/\{\{ voucherCode \}\}/gi, voucherCode);
    
    emailHtml = emailHtml.replace(/\{\{<\/span><span[^>]*>expiresAt<\/span><span[^>]*>\}\}/gi, expiryDate);
    emailHtml = emailHtml.replace(/\{\{expiresAt\}\}/gi, expiryDate);
    emailHtml = emailHtml.replace(/\{\{ExpiresAt\}\}/gi, expiryDate);
    emailHtml = emailHtml.replace(/\{\{ expiresAt \}\}/gi, expiryDate);
    
    if (message) {
      emailHtml = emailHtml.replace(/\{\{#if personalMessage\}\}[\s\S]*?\{\{\/if\}\}/gi, (match) => {
        let content = match.replace(/\{\{#if personalMessage\}\}/gi, '').replace(/\{\{\/if\}\}/gi, '');
        content = content.replace(/\{\{personalMessage\}\}/gi, message);
        content = content.replace(/\{\{senderName\}\}/gi, senderName);
        return content;
      });
      emailHtml = emailHtml.replace(/\{\{<\/span><span[^>]*>personalMessage<\/span><span[^>]*>\}\}/gi, message);
      emailHtml = emailHtml.replace(/\{\{personalMessage\}\}/gi, message);
    } else {
      emailHtml = emailHtml.replace(/\{\{#if personalMessage\}\}[\s\S]*?\{\{\/if\}\}/gi, '');
    }
    
    const logoUrl = 'https://res.cloudinary.com/dl2lomrhp/image/upload/v1763935567/edufiliova/edufiliova-white-logo.png';
    const spiral1Url = 'https://res.cloudinary.com/dl2lomrhp/image/upload/v1766908569/edufiliova/email-assets/db561a55b2cf0bc6e877bb934b39b700_1766506747370.png';
    const spiral2Url = 'https://res.cloudinary.com/dl2lomrhp/image/upload/v1766908559/edufiliova/email-assets/83faf7f361d9ba8dfdc904427b5b6423_1766506747364.png';
    const cornerUrl = 'https://res.cloudinary.com/dl2lomrhp/image/upload/v1766908555/edufiliova/email-assets/3d94f798ad2bd582f8c3afe175798088_1766506747360.png';
    const promoUrl = 'https://res.cloudinary.com/dl2lomrhp/image/upload/v1766908572/edufiliova/email-assets/fe18318bf782f1266432dce6a1a46f60.png';

    // Image removed
    // Image removed
    // Image removed
    // Image removed
    // Image removed
    // Image removed

    const attachments = [];

    const result = await emailService.sendEmail({
      to: recipientEmail,
      subject: `You've received a $${voucherAmount} Gift Voucher from ${senderName}!`,
      html: emailHtml,
      from: `"EduFiliova" <orders@edufiliova.com>`,
      attachments
    });
    
    if (result) {
      console.log(`✅ Gift voucher email sent successfully to ${recipientEmail}`);
    } else {
      console.error(`❌ Gift voucher email failed to send to ${recipientEmail}`);
    }
    
    return result;
  } catch (error) {
    console.error(`❌ Error sending gift voucher email:`, error);
    throw error;
  }
}

export async function sendCoursePurchaseEmail(recipientEmail, recipientName, courseData) {
  console.log(`📧 Sending course purchase email to ${recipientEmail}...`);
  console.log(`   - Recipient: ${recipientName}`);
  console.log(`   - Course: ${courseData.courseName}`);
  
  try {
    const templatePath = path.join(process.cwd(), 'public', 'email-assets', 'course-purchase', 'template.html');
    let emailHtml = fs.readFileSync(templatePath, 'utf-8');
    
    const fullName = recipientName || 'Student';
    const courseName = courseData.courseName || 'Your Course';
    const teacherName = courseData.teacherName || 'EduFiliova Instructor';
    const orderId = courseData.orderId || 'N/A';
    const price = courseData.price || '0.00';
    const accessType = courseData.accessType || 'Lifetime Access';
    const purchaseDate = courseData.purchaseDate || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    
    // Replace placeholders - handle split HTML spans
    const replacements = {
      'fullName': fullName,
      'courseName': courseName,
      'teacherName': teacherName,
      'orderId': orderId,
      'price': price,
      'accessType': accessType,
      'purchaseDate': purchaseDate
    };
    
    // Handle various placeholder formats
    for (const [key, value] of Object.entries(replacements)) {
      // Standard format
      emailHtml = emailHtml.replace(new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'gi'), value);
      // Split span format
      emailHtml = emailHtml.replace(new RegExp(`\\{\\{<\\/span><span[^>]*>${key}<\\/span><span[^>]*>\\}\\}`, 'gi'), value);
    }
    
    const logoUrl = 'https://res.cloudinary.com/dl2lomrhp/image/upload/v1763935567/edufiliova/edufiliova-white-logo.png';
    const spiral1Url = 'https://res.cloudinary.com/dl2lomrhp/image/upload/v1766908569/edufiliova/email-assets/db561a55b2cf0bc6e877bb934b39b700_1766506747370.png';
    const spiral2Url = 'https://res.cloudinary.com/dl2lomrhp/image/upload/v1766908559/edufiliova/email-assets/83faf7f361d9ba8dfdc904427b5b6423_1766506747364.png';
    const cornerUrl = 'https://res.cloudinary.com/dl2lomrhp/image/upload/v1766908555/edufiliova/email-assets/3d94f798ad2bd582f8c3afe175798088_1766506747360.png';
    const promoUrl = 'https://res.cloudinary.com/dl2lomrhp/image/upload/v1766908554/edufiliova/email-assets/c986afbaeaa02e99d02feeac68f6b944.png';

    // Replace image paths with CDN references
    // Image removed
    // Image removed
    // Image removed
    // Image removed
    // Image removed
    // Image removed
    
    const attachments = [];

    const result = await emailService.sendEmail({
      to: recipientEmail,
      subject: `Course Purchase Confirmed - ${courseName}`,
      html: emailHtml,
      from: `"EduFiliova Orders" <orders@edufiliova.com>`,
      attachments
    });
    
    if (result) {
      console.log(`✅ Course purchase email sent successfully to ${recipientEmail}`);
    } else {
      console.error(`❌ Course purchase email failed to send to ${recipientEmail}`);
    }
    
    return result;
  } catch (error) {
    console.error(`❌ Error sending course purchase email:`, error);
    throw error;
  }
}

/**
 * Send new course announcement email to Grade 11+ students
 */
export async function sendNewCourseAnnouncementEmail(recipientEmail, recipientName, courseData) {
  try {
    const templatePath = path.join(process.cwd(), 'public', 'email-assets', 'new-course-announcement', 'template.html');
    let emailHtml = fs.readFileSync(templatePath, 'utf-8');
    
    const fullName = recipientName || 'Student';
    const courseTitle = courseData.courseTitle || 'New Course';
    const teacherName = courseData.teacherName || 'EduFiliova Instructor';
    const category = courseData.category || 'General';
    
    // Replace placeholders - handle split HTML spans
    const replacements = {
      'fullName': fullName,
      'courseTitle': courseTitle,
      'teacherName': teacherName,
      'category': category
    };
    
    // Handle various placeholder formats
    for (const [key, value] of Object.entries(replacements)) {
      // Standard format
      emailHtml = emailHtml.replace(new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'gi'), value);
      // Split span format
      emailHtml = emailHtml.replace(new RegExp(`\\{\\{<\\/span><span[^>]*>${key}<\\/span><span[^>]*>\\}\\}`, 'gi'), value);
    }
    
    const logoUrl = 'https://res.cloudinary.com/dl2lomrhp/image/upload/v1763935567/edufiliova/edufiliova-white-logo.png';
    const spiral1Url = 'https://res.cloudinary.com/dl2lomrhp/image/upload/v1766908569/edufiliova/email-assets/db561a55b2cf0bc6e877bb934b39b700_1766506747370.png';
    const spiral2Url = 'https://res.cloudinary.com/dl2lomrhp/image/upload/v1766908559/edufiliova/email-assets/83faf7f361d9ba8dfdc904427b5b6423_1766506747364.png';
    const cornerUrl = 'https://res.cloudinary.com/dl2lomrhp/image/upload/v1766908555/edufiliova/email-assets/3d94f798ad2bd582f8c3afe175798088_1766506747360.png';
    const promoUrl = 'https://res.cloudinary.com/dl2lomrhp/image/upload/v1766908554/edufiliova/email-assets/dae012787ae5c5348c44bb83c0009419.png';

    // Replace image paths with CDN references
    // Image removed
    // Image removed
    // Image removed
    // Image removed
    // Image removed
    // Image removed
    
    const attachments = [];

    const result = await emailService.sendEmail({
      to: recipientEmail,
      subject: `New Course Available: ${courseTitle}`,
      html: emailHtml,
      from: `"EduFiliova" <noreply@edufiliova.com>`,
      attachments
    });
    
    if (result) {
      console.log(`✅ Course announcement email sent to ${recipientEmail}`);
    }
    
    return result;
  } catch (error) {
    console.error(`❌ Error sending course announcement email:`, error);
    return false;
  }
}

/**
 * Send course announcement to all Grade 11+ students
 */
export async function sendCourseAnnouncementToEligibleStudents(courseData) {
  try {
    // Import database connection
    const { db } = await import('../db.js');
    const { profiles, users } = await import('../../shared/schema.js');
    const { eq, and, or, ilike, sql } = await import('drizzle-orm');
    
    // Find all students in Grade 11, 12, or college level
    const eligibleStudents = await db
      .select({
        email: profiles.email,
        name: profiles.name,
        grade: profiles.grade
      })
      .from(profiles)
      .innerJoin(users, eq(users.id, profiles.userId))
      .where(
        and(
          eq(users.role, 'student'),
          or(
            ilike(profiles.grade, '%11%'),
            ilike(profiles.grade, '%12%'),
            ilike(profiles.grade, '%Form 5%'),
            ilike(profiles.grade, '%Form 6%'),
            ilike(profiles.grade, '%College%'),
            ilike(profiles.grade, '%University%'),
            ilike(profiles.grade, '%A-Level%'),
            ilike(profiles.grade, '%AS-Level%'),
            ilike(profiles.grade, '%A2-Level%')
          )
        )
      );
    
    console.log(`📧 Found ${eligibleStudents.length} eligible students (Grade 11+ / College) for course announcement`);
    
    let successCount = 0;
    let failCount = 0;
    
    for (const student of eligibleStudents) {
      if (student.email) {
        try {
          await sendNewCourseAnnouncementEmail(student.email, student.name, courseData);
          successCount++;
        } catch (err) {
          failCount++;
          console.error(`Failed to send to ${student.email}:`, err.message);
        }
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    console.log(`📧 Course announcement complete: ${successCount} sent, ${failCount} failed`);
    return { sent: successCount, failed: failCount, total: eligibleStudents.length };
  } catch (error) {
    console.error('Error sending course announcements:', error);
    return { sent: 0, failed: 0, total: 0, error: error.message };
  }
}

/**
 * Send plan upgrade confirmation email to student
 */
export async function sendPlanUpgradeEmail(recipientEmail, recipientName, upgradeData) {
  try {
    const templatePath = path.join(process.cwd(), 'public', 'email-assets', 'plan-upgrade', 'template.html');
    let emailHtml = fs.readFileSync(templatePath, 'utf-8');
    
    const fullName = recipientName || 'Student';
    const planName = upgradeData.planName || 'Premium';
    const previousPlan = upgradeData.previousPlan || 'Free';
    const price = upgradeData.price || '0.00';
    const billingCycle = upgradeData.billingCycle || 'Monthly';
    const expiryDate = upgradeData.expiryDate || new Date(Date.now() + 30*24*60*60*1000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const upgradeDate = upgradeData.upgradeDate || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    
    // Replace placeholders - handle split HTML spans
    const replacements = {
      'fullName': fullName,
      'planName': planName,
      'previousPlan': previousPlan,
      'price': price,
      'billingCycle': billingCycle,
      'expiryDate': expiryDate,
      'upgradeDate': upgradeDate
    };
    
    // Handle various placeholder formats
    for (const [key, value] of Object.entries(replacements)) {
      emailHtml = emailHtml.replace(new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'gi'), value);
      emailHtml = emailHtml.replace(new RegExp(`\\{\\{<\\/span><span[^>]*>${key}<\\/span><span[^>]*>\\}\\}`, 'gi'), value);
    }
    
    const logoUrl = 'https://res.cloudinary.com/dl2lomrhp/image/upload/v1763935567/edufiliova/edufiliova-white-logo.png';
    const spiral1Url = 'https://res.cloudinary.com/dl2lomrhp/image/upload/v1766908569/edufiliova/email-assets/db561a55b2cf0bc6e877bb934b39b700_1766506747370.png';
    const spiral2Url = 'https://res.cloudinary.com/dl2lomrhp/image/upload/v1766908559/edufiliova/email-assets/83faf7f361d9ba8dfdc904427b5b6423_1766506747364.png';
    const cornerUrl = 'https://res.cloudinary.com/dl2lomrhp/image/upload/v1766908555/edufiliova/email-assets/3d94f798ad2bd582f8c3afe175798088_1766506747360.png';
    const promoUrl = 'https://res.cloudinary.com/dl2lomrhp/image/upload/v1766908554/edufiliova/email-assets/fcf514453cb3c939b52a8a2bcbb97b94.png';

    // Replace image paths with CDN references
    // Image removed
    // Image removed
    // Image removed
    // Image removed
    // Image removed
    // Image removed
    
    const attachments = [];

    const result = await emailService.sendEmail({
      to: recipientEmail,
      subject: `Welcome to ${planName} - Your Subscription is Active!`,
      html: emailHtml,
      from: `"EduFiliova" <noreply@edufiliova.com>`,
      attachments
    });
    
    if (result) {
      console.log(`✅ Plan upgrade email sent to ${recipientEmail}`);
    }
    
    return result;
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
    
    const fullName = recipientName || 'User';
    const reason = suspensionReason || 'Violation of platform policies.';
    
    emailHtml = emailHtml.replace(/\{\{fullName\}\}/gi, fullName);
    emailHtml = emailHtml.replace(/\{\{FullName\}\}/gi, fullName);
    emailHtml = emailHtml.replace(/\{\{suspensionReason\}\}/gi, reason);
    
    const result = await emailService.sendEmail({
      to: recipientEmail,
      subject: 'Important: Your EduFiliova Account Status',
      html: emailHtml,
      from: `"EduFiliova Trust & Safety" <support@edufiliova.com>`
    });
    
    return result;
  } catch (error) {
    console.error(`❌ Error sending suspension email:`, error);
    throw error;
  }
}

export async function sendFreelancerUnderReviewEmail(recipientEmail, recipientName) {
  console.log(`📧 Sending freelancer review email to ${recipientEmail}...`);
  try {
    const templatePath = path.join(process.cwd(), 'public', 'email-assets', 'freelancer-application-under-review', 'template.html');
    let emailHtml = fs.readFileSync(templatePath, 'utf-8');
    
    const fullName = recipientName || 'Freelancer';
    
    emailHtml = emailHtml.replace(/\{\{fullName\}\}/gi, fullName);
    emailHtml = emailHtml.replace(/\{\{FullName\}\}/gi, fullName);
    
    const result = await emailService.sendEmail({
      to: recipientEmail,
      subject: 'Application Received - EduFiliova Freelancer Network',
      html: emailHtml,
      from: `"EduFiliova Review Team" <support@edufiliova.com>`
    });
    
    return result;
  } catch (error) {
    console.error(`❌ Error sending freelancer review email:`, error);
    throw error;
  }
}

/**
 * Send teacher application decline email
 */
export async function sendTeacherDeclineEmail(recipientEmail, recipientName, reason = null) {
  console.log(`📧 Sending teacher application decline email to ${recipientEmail}...`);
  console.log(`   - Recipient: ${recipientName}`);
  if (reason) console.log(`   - Reason: ${reason}`);

  try {
    const templatePath = path.join(process.cwd(), 'public', 'email-assets', 'teacher-decline', 'template.html');
    let emailHtml = fs.readFileSync(templatePath, 'utf-8');

    const fullName = recipientName || 'Applicant';

    // Handle placeholders
    emailHtml = emailHtml.replace(/\{\{\s*fullName\s*\}\}/gi, fullName);
    emailHtml = emailHtml.replace(/\{\{<\/span><span[^>]*>fullName<\/span><span[^>]*>\}\}/gi, fullName);

    if (reason) {
      emailHtml = emailHtml.replace(/\{\{#if reason\}\}([\s\S]*?)\{\{\/if\}\}/gi, (match, p1) => {
        return p1.replace(/\{\{\s*reason\s*\}\}/gi, reason)
                 .replace(/\{\{<\/span><span[^>]*>reason<\/span><span[^>]*>\}\}/gi, reason);
      });
    } else {
      emailHtml = emailHtml.replace(/\{\{#if reason\}\}[\s\S]*?\{\{\/if\}\}/gi, '');
    }

    // Aggressive tag cleanup for images/ paths before passing to emailService
    emailHtml = emailHtml.replace(/images\/(?:<[^>]*>)*([^"'>\s]+?)(?:<[^>]*>)*\.(png|jpg|jpeg|gif)/gi, 'images/$1.$2');

    // Final direct replacement of known local paths to absolute URLs as a fallback
    const fallbackBase = "https://edufiliova.com/email-assets/teacher-decline/images/";
    emailHtml = emailHtml.replace(/src=["']images\/([^"']+)["']/gi, `src="${fallbackBase}$1"`);
    emailHtml = emailHtml.replace(/href=["']images\/([^"']+)["']/gi, `href="${fallbackBase}$1"`);

    const attachments = [];

    const result = await emailService.sendEmail({
      to: recipientEmail,
      subject: 'Update on Your Teacher Application - EduFiliova',
      html: emailHtml,
      from: `"EduFiliova Review Team" <support@edufiliova.com>`,
      attachments
    });

    if (result) {
      console.log(`✅ Teacher application decline email sent successfully to ${recipientEmail}`);
    } else {
      console.error(`❌ Teacher application decline email failed to send to ${recipientEmail}`);
    }

    return result;
  } catch (error) {
    console.error(`❌ Error sending teacher decline email:`, error);
    throw error;
  }
}

/**
 * Send new device login alert email
 */
export async function sendNewDeviceLoginEmail(recipientEmail, recipientName, loginData) {
  try {
    const templatePath = path.join(process.cwd(), 'public', 'email-assets', 'new-device-login', 'template.html');
    let emailHtml = fs.readFileSync(templatePath, 'utf-8');
    
    const fullName = recipientName || 'User';
    const deviceName = loginData.deviceName || 'Unknown Device';
    const browser = loginData.browser || 'Unknown Browser';
    const os = loginData.os || 'Unknown OS';
    const location = loginData.location || 'Unknown Location';
    const ipAddress = loginData.ipAddress || 'Unknown IP';
    const loginTime = loginData.loginTime || new Date().toLocaleString('en-US', { 
      year: 'numeric', month: 'long', day: 'numeric', 
      hour: '2-digit', minute: '2-digit', timeZoneName: 'short' 
    });
    
    // Replace placeholders
    const replacements = {
      'fullName': fullName,
      'deviceName': deviceName,
      'browser': browser,
      'os': os,
      'location': location,
      'ipAddress': ipAddress,
      'loginTime': loginTime
    };
    
    for (const [key, value] of Object.entries(replacements)) {
      emailHtml = emailHtml.replace(new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'gi'), value);
      emailHtml = emailHtml.replace(new RegExp(`\\{\\{<\\/span><span[^>]*>${key}<\\/span><span[^>]*>\\}\\}`, 'gi'), value);
    }
    
    const logoUrl = 'https://res.cloudinary.com/dl2lomrhp/image/upload/v1763935567/edufiliova/edufiliova-white-logo.png';
    const spiral1Url = 'https://res.cloudinary.com/dl2lomrhp/image/upload/v1766908569/edufiliova/email-assets/db561a55b2cf0bc6e877bb934b39b700_1766506747370.png';
    const spiral2Url = 'https://res.cloudinary.com/dl2lomrhp/image/upload/v1766908559/edufiliova/email-assets/83faf7f361d9ba8dfdc904427b5b6423_1766506747364.png';
    const cornerUrl = 'https://res.cloudinary.com/dl2lomrhp/image/upload/v1766908555/edufiliova/email-assets/3d94f798ad2bd582f8c3afe175798088_1766506747360.png';
    const promoUrl = 'https://res.cloudinary.com/dl2lomrhp/image/upload/v1766908554/edufiliova/email-assets/ccc540df188352ef9b2d4fb790d0b4bb.png';

    // Replace image paths with CDN references
    // Image removed
    // Image removed
    // Image removed
    // Image removed
    // Image removed
    // Image removed
    // Image removed
    
    const attachments = [];

    const result = await emailService.sendEmail({
      to: recipientEmail,
      subject: 'Security Alert: New Login Detected - EduFiliova',
      html: emailHtml,
      from: `"EduFiliova Security" <noreply@edufiliova.com>`,
      attachments
    });
    
    if (result) {
      console.log(`✅ New device login alert sent to ${recipientEmail}`);
    }
    
    return result;
  } catch (error) {
    console.error(`❌ Error sending new device login email:`, error);
    return false;
  }
}

/**
 * Send meeting reminder email (15 minutes before)
 */
export async function sendMeetingReminderEmail(recipientEmail, recipientName, meetingData) {
  try {
    const templatePath = path.join(process.cwd(), 'public', 'email-assets', 'meeting-reminder', 'template.html');
    let emailHtml = fs.readFileSync(templatePath, 'utf-8');
    
    const fullName = recipientName || 'User';
    const meetingTitle = meetingData.meetingTitle || 'Scheduled Meeting';
    const teacherName = meetingData.teacherName || 'Your Teacher';
    const meetingTime = meetingData.meetingTime || new Date().toLocaleString('en-US', { 
      year: 'numeric', month: 'long', day: 'numeric', 
      hour: '2-digit', minute: '2-digit', timeZoneName: 'short' 
    });
    const meetingType = meetingData.meetingType || 'Video Call';
    const joinLink = meetingData.joinLink || 'https://edufiliova.com/meetings';
    
    // Replace placeholders - handle both normal and span-split formats
    const replacements = {
      'fullName': fullName,
      'meetingTitle': meetingTitle,
      'teacherName': teacherName,
      'meetingTime': meetingTime,
      'meetingType': meetingType,
      'joinLink': joinLink
    };
    
    for (const [key, value] of Object.entries(replacements)) {
      emailHtml = emailHtml.replace(new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'gi'), value);
      emailHtml = emailHtml.replace(new RegExp(`\\{\\{<\\/span><span[^>]*>${key}<\\/span><span[^>]*>\\}\\}`, 'gi'), value);
    }
    
    const logoUrl = 'https://res.cloudinary.com/dl2lomrhp/image/upload/v1763935567/edufiliova/edufiliova-white-logo.png';
    const spiral1Url = 'https://res.cloudinary.com/dl2lomrhp/image/upload/v1766908569/edufiliova/email-assets/db561a55b2cf0bc6e877bb934b39b700_1766506747370.png';
    const logoHeaderUrl = 'https://res.cloudinary.com/dl2lomrhp/image/upload/v1766908554/edufiliova/email-assets/292db72c5a7a0299db100d17711b8c55.png';
    const spiral2Url = 'https://res.cloudinary.com/dl2lomrhp/image/upload/v1766908559/edufiliova/email-assets/83faf7f361d9ba8dfdc904427b5b6423_1766506747364.png';
    const cornerUrl = 'https://res.cloudinary.com/dl2lomrhp/image/upload/v1766908555/edufiliova/email-assets/3d94f798ad2bd582f8c3afe175798088_1766506747360.png';
    const footerLogoUrl = 'https://res.cloudinary.com/dl2lomrhp/image/upload/v1766908563/edufiliova/email-assets/9f7291948d8486bdd26690d0c32796e0_1766647041190.png';
    const whatsappPromoUrl = 'https://res.cloudinary.com/dl2lomrhp/image/upload/v1766908554/edufiliova/email-assets/51cf8361f51fd7575b8d8390ef957e30.png';

    // Replace image paths with CDN references
    // Image removed
    // Image removed
    // Image removed
    // Image removed
    // Image removed
    // Image removed
    // Image removed
    
    const attachments = [];

    const result = await emailService.sendEmail({
      to: recipientEmail,
      subject: `Reminder: Your Meeting Starts in 15 Minutes - ${meetingTitle}`,
      html: emailHtml,
      from: `"EduFiliova" <noreply@edufiliova.com>`,
      attachments
    });
    
    if (result) {
      console.log(`✅ Meeting reminder email sent to ${recipientEmail}`);
    }
    
    return result;
  } catch (error) {
    console.error(`❌ Error sending meeting reminder email:`, error);
    return false;
  }
}

/**
 * Send shop product purchase confirmation email
 */
export async function sendShopPurchaseEmail(recipientEmail, recipientName, orderData) {
  try {
    const templatePath = path.join(process.cwd(), 'public', 'email-assets', 'shop-purchase', 'template.html');
    let emailHtml = fs.readFileSync(templatePath, 'utf-8');
    
    const fullName = recipientName || 'Customer';
    const orderId = orderData.orderId || 'N/A';
    const totalPrice = orderData.totalPrice || '0.00';
    const purchaseDate = orderData.purchaseDate || new Date().toLocaleString('en-US', { 
      year: 'numeric', month: 'long', day: 'numeric'
    });
    const downloadLink = orderData.downloadLink || 'https://edufiliova.com/downloads';
    
    // Replace placeholders - handle both normal and span-split formats
    const replacements = {
      'fullName': fullName,
      'orderId': orderId,
      'totalPrice': totalPrice,
      'purchaseDate': purchaseDate,
      'downloadLink': downloadLink
    };
    
    for (const [key, value] of Object.entries(replacements)) {
      emailHtml = emailHtml.replace(new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'gi'), value);
      emailHtml = emailHtml.replace(new RegExp(`\\{\\{<\\/span><span[^>]*>${key}<\\/span><span[^>]*>\\}\\}`, 'gi'), value);
    }
    
    const logoUrl = 'https://res.cloudinary.com/dl2lomrhp/image/upload/v1763935567/edufiliova/edufiliova-white-logo.png';
    const spiral1Url = 'https://res.cloudinary.com/dl2lomrhp/image/upload/v1766908569/edufiliova/email-assets/db561a55b2cf0bc6e877bb934b39b700_1766506747370.png';
    const logoHeaderUrl = 'https://res.cloudinary.com/dl2lomrhp/image/upload/v1766908554/edufiliova/email-assets/f4a85d998eb4f45ce242a7b73cf561d5.png';
    const spiral2Url = 'https://res.cloudinary.com/dl2lomrhp/image/upload/v1766908559/edufiliova/email-assets/83faf7f361d9ba8dfdc904427b5b6423_1766506747364.png';
    const cornerUrl = 'https://res.cloudinary.com/dl2lomrhp/image/upload/v1766908555/edufiliova/email-assets/3d94f798ad2bd582f8c3afe175798088_1766506747360.png';
    const footerLogoUrl = 'https://res.cloudinary.com/dl2lomrhp/image/upload/v1766908563/edufiliova/email-assets/9f7291948d8486bdd26690d0c32796e0_1766647041190.png';

    // Replace image paths with CDN references
    // Image removed
    // Image removed
    // Image removed
    // Image removed
    // Image removed
    
    const attachments = [];

    const result = await emailService.sendEmail({
      to: recipientEmail,
      subject: `Order Confirmed - Your Digital Products Are Ready! #${orderId}`,
      html: emailHtml,
      from: `"EduFiliova Orders" <orders@edufiliova.com>`,
      attachments
    });
    
    if (result) {
      console.log(`✅ Shop purchase email sent to ${recipientEmail} for order #${orderId}`);
    }
    
    return result;
  } catch (error) {
    console.error(`❌ Error sending shop purchase email:`, error);
    return false;
  }
}

/**
 * Send course completion email with certificate details
 */
export async function sendCourseCompletionEmail(recipientEmail, recipientName, courseData) {
  try {
    const templatePath = path.join(process.cwd(), 'public', 'email-assets', 'course-completion', 'template.html');
    let emailHtml = fs.readFileSync(templatePath, 'utf-8');
    
    const fullName = recipientName || 'Student';
    const courseTitle = courseData.courseTitle || 'Course';
    const completionDate = courseData.completionDate || new Date().toLocaleString('en-US', { 
      year: 'numeric', month: 'long', day: 'numeric'
    });
    const finalScore = courseData.finalScore || '100';
    const certificateType = courseData.certificateType || 'Certificate of Completion';
    const verificationCode = courseData.verificationCode || 'N/A';
    
    // Replace placeholders - handle both normal and span-split formats
    const replacements = {
      'fullName': fullName,
      'courseTitle': courseTitle,
      'completionDate': completionDate,
      'finalScore': finalScore,
      'certificateType': certificateType,
      'verificationCode': verificationCode
    };
    
    for (const [key, value] of Object.entries(replacements)) {
      emailHtml = emailHtml.replace(new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'gi'), value);
      emailHtml = emailHtml.replace(new RegExp(`\\{\\{<\\/span><span[^>]*>${key}<\\/span><span[^>]*>\\}\\}`, 'gi'), value);
    }
    
    const logoUrl = 'https://res.cloudinary.com/dl2lomrhp/image/upload/v1763935567/edufiliova/edufiliova-white-logo.png';
    const spiral1Url = 'https://res.cloudinary.com/dl2lomrhp/image/upload/v1766908569/edufiliova/email-assets/db561a55b2cf0bc6e877bb934b39b700_1766506747370.png';
    const logoHeaderUrl = 'https://res.cloudinary.com/dl2lomrhp/image/upload/v1766908554/edufiliova/email-assets/a0f41a0ecf16a144a8fae636842d4fcc.png';
    const spiral2Url = 'https://res.cloudinary.com/dl2lomrhp/image/upload/v1766908559/edufiliova/email-assets/83faf7f361d9ba8dfdc904427b5b6423_1766506747364.png';
    const cornerUrl = 'https://res.cloudinary.com/dl2lomrhp/image/upload/v1766908555/edufiliova/email-assets/3d94f798ad2bd582f8c3afe175798088_1766506747360.png';
    const footerLogoUrl = 'https://res.cloudinary.com/dl2lomrhp/image/upload/v1766908563/edufiliova/email-assets/9f7291948d8486bdd26690d0c32796e0_1766647041190.png';
    const gradBannerUrl = 'https://res.cloudinary.com/dl2lomrhp/image/upload/v1766908554/edufiliova/email-assets/371e2880c8a2b5b2073b1f18b5482c1f.png';

    // Replace image paths with CDN references
    // Image removed
    // Image removed
    // Image removed
    // Image removed
    // Image removed
    // Image removed
    
    const attachments = [];

    const result = await emailService.sendEmail({
      to: recipientEmail,
      subject: `Congratulations! You've Completed ${courseTitle}`,
      html: emailHtml,
      from: `"EduFiliova Certifications" <noreply@edufiliova.com>`,
      attachments
    });
    
    if (result) {
      console.log(`✅ Course completion email sent to ${recipientEmail} for ${courseTitle}`);
    }
    
    return result;
  } catch (error) {
    console.error(`❌ Error sending course completion email:`, error);
    return false;
  }
}

/**
 * Send teacher application submitted confirmation email
 */
export async function sendTeacherApplicationSubmittedEmail(recipientEmail, recipientName) {
  try {
    const templatePath = path.join(process.cwd(), 'public', 'email-assets', 'teacher-application-submitted', 'template.html');
    let emailHtml = fs.readFileSync(templatePath, 'utf-8');
    
    const fullName = recipientName || 'Teacher';
    
    // Replace placeholders - handle both normal and span-split formats
    emailHtml = emailHtml.replace(/\{\{\s*fullName\s*\}\}/gi, fullName);
    emailHtml = emailHtml.replace(/\{\{<\/span><span[^>]*>fullName<\/span><span[^>]*>\}\}/gi, fullName);
    
    const logoUrl = 'https://res.cloudinary.com/dl2lomrhp/image/upload/v1763935567/edufiliova/edufiliova-white-logo.png';
    const attachments = [];

    const result = await emailService.sendEmail({
      to: recipientEmail,
      subject: `Application Received - Your Teacher Application is Under Review`,
      html: emailHtml,
      from: `"EduFiliova Applications" <noreply@edufiliova.com>`,
      attachments
    });
    
    if (result) {
      console.log(`✅ Teacher application submitted email sent to ${recipientEmail}`);
    }
    
    return result;
  } catch (error) {
    console.error(`❌ Error sending teacher application submitted email:`, error);
    return false;
  }
}
