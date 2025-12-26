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
