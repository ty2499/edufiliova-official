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
    
    emailHtml = emailHtml.replace(/images\/db561a55b2cf0bc6e877bb934b39b700\.png/g, 'cid:spiral1');
    emailHtml = emailHtml.replace(/images\/f28befc0a869e8a352bf79aa02080dc7\.png/g, 'cid:logo');
    emailHtml = emailHtml.replace(/images\/83faf7f361d9ba8dfdc904427b5b6423\.png/g, 'cid:spiral2');
    emailHtml = emailHtml.replace(/images\/3d94f798ad2bd582f8c3afe175798088\.png/g, 'cid:corner');
    emailHtml = emailHtml.replace(/images\/dc84055d94aa2dc70856ec3b8b024828\.png/g, 'cid:promo');
    emailHtml = emailHtml.replace(/images\/9f7291948d8486bdd26690d0c32796e0\.png/g, 'cid:logofull');

    const imagesDir = path.join(process.cwd(), 'public', 'email-assets', 'student-welcome', 'images');
    const attachments = [
      {
        filename: 'spiral1.png',
        path: path.join(imagesDir, 'db561a55b2cf0bc6e877bb934b39b700.png'),
        cid: 'spiral1',
        contentType: 'image/png'
      },
      {
        filename: 'logo.png',
        path: path.join(imagesDir, 'f28befc0a869e8a352bf79aa02080dc7.png'),
        cid: 'logo',
        contentType: 'image/png'
      },
      {
        filename: 'spiral2.png',
        path: path.join(imagesDir, '83faf7f361d9ba8dfdc904427b5b6423.png'),
        cid: 'spiral2',
        contentType: 'image/png'
      },
      {
        filename: 'corner.png',
        path: path.join(imagesDir, '3d94f798ad2bd582f8c3afe175798088.png'),
        cid: 'corner',
        contentType: 'image/png'
      },
      {
        filename: 'promo.png',
        path: path.join(imagesDir, 'dc84055d94aa2dc70856ec3b8b024828.png'),
        cid: 'promo',
        contentType: 'image/png'
      },
      {
        filename: 'logofull.png',
        path: path.join(imagesDir, '9f7291948d8486bdd26690d0c32796e0.png'),
        cid: 'logofull',
        contentType: 'image/png'
      }
    ];

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
    
    emailHtml = emailHtml.replace(/images\/db561a55b2cf0bc6e877bb934b39b700\.png/g, 'cid:spiral1');
    emailHtml = emailHtml.replace(/images\/f28befc0a869e8a352bf79aa02080dc7\.png/g, 'cid:logo');
    emailHtml = emailHtml.replace(/images\/83faf7f361d9ba8dfdc904427b5b6423\.png/g, 'cid:spiral2');
    emailHtml = emailHtml.replace(/images\/8c5dfa6f6ff7f681bbf586933883b270\.png/g, 'cid:corner');
    emailHtml = emailHtml.replace(/images\/50df79cf94bcde6e18f9cb9ac1a740dd\.png/g, 'cid:promo');
    emailHtml = emailHtml.replace(/images\/9f7291948d8486bdd26690d0c32796e0\.png/g, 'cid:logofull');

    const imagesDir = path.join(process.cwd(), 'public', 'email-assets', 'student-verification', 'images');
    const attachments = [
      {
        filename: 'spiral1.png',
        path: path.join(imagesDir, 'db561a55b2cf0bc6e877bb934b39b700.png'),
        cid: 'spiral1',
        contentType: 'image/png'
      },
      {
        filename: 'logo.png',
        path: path.join(imagesDir, 'f28befc0a869e8a352bf79aa02080dc7.png'),
        cid: 'logo',
        contentType: 'image/png'
      },
      {
        filename: 'spiral2.png',
        path: path.join(imagesDir, '83faf7f361d9ba8dfdc904427b5b6423.png'),
        cid: 'spiral2',
        contentType: 'image/png'
      },
      {
        filename: 'corner.png',
        path: path.join(imagesDir, '8c5dfa6f6ff7f681bbf586933883b270.png'),
        cid: 'corner',
        contentType: 'image/png'
      },
      {
        filename: 'promo.png',
        path: path.join(imagesDir, '50df79cf94bcde6e18f9cb9ac1a740dd.png'),
        cid: 'promo',
        contentType: 'image/png'
      },
      {
        filename: 'logofull.png',
        path: path.join(imagesDir, '9f7291948d8486bdd26690d0c32796e0.png'),
        cid: 'logofull',
        contentType: 'image/png'
      }
    ];

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
    
    emailHtml = emailHtml.replace(/images\/db561a55b2cf0bc6e877bb934b39b700\.png/g, 'cid:spiral1');
    emailHtml = emailHtml.replace(/images\/de07618f612ae3f3a960a43365f0d61d\.png/g, 'cid:logo');
    emailHtml = emailHtml.replace(/images\/83faf7f361d9ba8dfdc904427b5b6423\.png/g, 'cid:spiral2');
    emailHtml = emailHtml.replace(/images\/3d94f798ad2bd582f8c3afe175798088\.png/g, 'cid:corner');
    emailHtml = emailHtml.replace(/images\/fe18318bf782f1266432dce6a1a46f60\.png/g, 'cid:promo');
    emailHtml = emailHtml.replace(/images\/9f7291948d8486bdd26690d0c32796e0\.png/g, 'cid:logofull');

    const imagesDir = path.join(process.cwd(), 'public', 'email-assets', 'voucher', 'images');
    const attachments = [
      {
        filename: 'spiral1.png',
        path: path.join(imagesDir, 'db561a55b2cf0bc6e877bb934b39b700.png'),
        cid: 'spiral1',
        contentType: 'image/png'
      },
      {
        filename: 'logo.png',
        path: path.join(imagesDir, 'de07618f612ae3f3a960a43365f0d61d.png'),
        cid: 'logo',
        contentType: 'image/png'
      },
      {
        filename: 'spiral2.png',
        path: path.join(imagesDir, '83faf7f361d9ba8dfdc904427b5b6423.png'),
        cid: 'spiral2',
        contentType: 'image/png'
      },
      {
        filename: 'corner.png',
        path: path.join(imagesDir, '3d94f798ad2bd582f8c3afe175798088.png'),
        cid: 'corner',
        contentType: 'image/png'
      },
      {
        filename: 'promo.png',
        path: path.join(imagesDir, 'fe18318bf782f1266432dce6a1a46f60.png'),
        cid: 'promo',
        contentType: 'image/png'
      },
      {
        filename: 'logofull.png',
        path: path.join(imagesDir, '9f7291948d8486bdd26690d0c32796e0.png'),
        cid: 'logofull',
        contentType: 'image/png'
      }
    ];

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
    
    // Replace image paths with CID references
    emailHtml = emailHtml.replace(/images\/db561a55b2cf0bc6e877bb934b39b700\.png/g, 'cid:spiral1');
    emailHtml = emailHtml.replace(/images\/d003f0807fd61e8939ef89ef37a2a824\.png/g, 'cid:logo');
    emailHtml = emailHtml.replace(/images\/83faf7f361d9ba8dfdc904427b5b6423\.png/g, 'cid:spiral2');
    emailHtml = emailHtml.replace(/images\/3d94f798ad2bd582f8c3afe175798088\.png/g, 'cid:corner');
    emailHtml = emailHtml.replace(/images\/c986afbaeaa02e99d02feeac68f6b944\.png/g, 'cid:promo');
    emailHtml = emailHtml.replace(/images\/9f7291948d8486bdd26690d0c32796e0\.png/g, 'cid:logofull');
    
    const imagesDir = path.join(process.cwd(), 'public', 'email-assets', 'course-purchase');
    
    const attachments = [
      {
        filename: 'spiral1.png',
        path: path.join(imagesDir, 'db561a55b2cf0bc6e877bb934b39b700.png'),
        cid: 'spiral1',
        contentType: 'image/png'
      },
      {
        filename: 'logo.png',
        path: path.join(imagesDir, 'd003f0807fd61e8939ef89ef37a2a824.png'),
        cid: 'logo',
        contentType: 'image/png'
      },
      {
        filename: 'spiral2.png',
        path: path.join(imagesDir, '83faf7f361d9ba8dfdc904427b5b6423.png'),
        cid: 'spiral2',
        contentType: 'image/png'
      },
      {
        filename: 'corner.png',
        path: path.join(imagesDir, '3d94f798ad2bd582f8c3afe175798088.png'),
        cid: 'corner',
        contentType: 'image/png'
      },
      {
        filename: 'promo.png',
        path: path.join(imagesDir, 'c986afbaeaa02e99d02feeac68f6b944.png'),
        cid: 'promo',
        contentType: 'image/png'
      },
      {
        filename: 'logofull.png',
        path: path.join(imagesDir, '9f7291948d8486bdd26690d0c32796e0.png'),
        cid: 'logofull',
        contentType: 'image/png'
      }
    ];

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
    
    // Replace image paths with CID references
    emailHtml = emailHtml.replace(/images\/db561a55b2cf0bc6e877bb934b39b700\.png/g, 'cid:spiral1');
    emailHtml = emailHtml.replace(/images\/41506b29d7f0bbde9fcb0d4afb720c70\.png/g, 'cid:logo');
    emailHtml = emailHtml.replace(/images\/83faf7f361d9ba8dfdc904427b5b6423\.png/g, 'cid:spiral2');
    emailHtml = emailHtml.replace(/images\/3d94f798ad2bd582f8c3afe175798088\.png/g, 'cid:corner');
    emailHtml = emailHtml.replace(/images\/dae012787ae5c5348c44bb83c0009419\.png/g, 'cid:promo');
    emailHtml = emailHtml.replace(/images\/9f7291948d8486bdd26690d0c32796e0\.png/g, 'cid:logofull');
    
    const imagesDir = path.join(process.cwd(), 'public', 'email-assets', 'new-course-announcement', 'images');
    
    const attachments = [
      {
        filename: 'spiral1.png',
        path: path.join(imagesDir, 'db561a55b2cf0bc6e877bb934b39b700.png'),
        cid: 'spiral1',
        contentType: 'image/png'
      },
      {
        filename: 'logo.png',
        path: path.join(imagesDir, '41506b29d7f0bbde9fcb0d4afb720c70.png'),
        cid: 'logo',
        contentType: 'image/png'
      },
      {
        filename: 'spiral2.png',
        path: path.join(imagesDir, '83faf7f361d9ba8dfdc904427b5b6423.png'),
        cid: 'spiral2',
        contentType: 'image/png'
      },
      {
        filename: 'corner.png',
        path: path.join(imagesDir, '3d94f798ad2bd582f8c3afe175798088.png'),
        cid: 'corner',
        contentType: 'image/png'
      },
      {
        filename: 'promo.png',
        path: path.join(imagesDir, 'dae012787ae5c5348c44bb83c0009419.png'),
        cid: 'promo',
        contentType: 'image/png'
      },
      {
        filename: 'logofull.png',
        path: path.join(imagesDir, '9f7291948d8486bdd26690d0c32796e0.png'),
        cid: 'logofull',
        contentType: 'image/png'
      }
    ];

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
    
    // Replace image paths with CID references
    emailHtml = emailHtml.replace(/images\/db561a55b2cf0bc6e877bb934b39b700\.png/g, 'cid:spiral1');
    emailHtml = emailHtml.replace(/images\/41506b29d7f0bbde9fcb0d4afb720c70\.png/g, 'cid:logo');
    emailHtml = emailHtml.replace(/images\/83faf7f361d9ba8dfdc904427b5b6423\.png/g, 'cid:spiral2');
    emailHtml = emailHtml.replace(/images\/3d94f798ad2bd582f8c3afe175798088\.png/g, 'cid:corner');
    emailHtml = emailHtml.replace(/images\/fcf514453cb3c939b52a8a2bcbb97b94\.png/g, 'cid:promo');
    emailHtml = emailHtml.replace(/images\/9f7291948d8486bdd26690d0c32796e0\.png/g, 'cid:logofull');
    
    const imagesDir = path.join(process.cwd(), 'public', 'email-assets', 'plan-upgrade', 'images');
    
    const attachments = [
      {
        filename: 'spiral1.png',
        path: path.join(imagesDir, 'db561a55b2cf0bc6e877bb934b39b700.png'),
        cid: 'spiral1',
        contentType: 'image/png'
      },
      {
        filename: 'logo.png',
        path: path.join(imagesDir, '41506b29d7f0bbde9fcb0d4afb720c70.png'),
        cid: 'logo',
        contentType: 'image/png'
      },
      {
        filename: 'spiral2.png',
        path: path.join(imagesDir, '83faf7f361d9ba8dfdc904427b5b6423.png'),
        cid: 'spiral2',
        contentType: 'image/png'
      },
      {
        filename: 'corner.png',
        path: path.join(imagesDir, '3d94f798ad2bd582f8c3afe175798088.png'),
        cid: 'corner',
        contentType: 'image/png'
      },
      {
        filename: 'promo.png',
        path: path.join(imagesDir, 'fcf514453cb3c939b52a8a2bcbb97b94.png'),
        cid: 'promo',
        contentType: 'image/png'
      },
      {
        filename: 'logofull.png',
        path: path.join(imagesDir, '9f7291948d8486bdd26690d0c32796e0.png'),
        cid: 'logofull',
        contentType: 'image/png'
      }
    ];

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
