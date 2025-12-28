import nodemailer from 'nodemailer';
import PDFDocument from 'pdfkit';
import type PDFKit from 'pdfkit';
import { Readable } from 'stream';
import * as path from 'path';
import * as fs from 'fs';
import { getEmailConfig } from './utils/settings';

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

let cachedEmailConfig: EmailConfig | null = null;
let emailConfigured = false;

async function initializeEmailConfig(): Promise<EmailConfig | null> {
  if (cachedEmailConfig) return cachedEmailConfig;
  
  const dbConfig = await getEmailConfig();
  
  const smtpHost = dbConfig.host;
  const smtpPort = dbConfig.port;
  const smtpUser = dbConfig.user || 'orders@edufiliova.com';
  const smtpPass = dbConfig.pass;
  
  if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
    console.warn('⚠️ Email credentials not configured in database or environment');
    return null;
  }
  
  cachedEmailConfig = {
    host: smtpHost,
    port: parseInt(smtpPort),
    secure: parseInt(smtpPort) === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  };
  
  emailConfigured = true;
  console.log('✅ Email transporter configured');
  return cachedEmailConfig;
}

export async function createEmailTransporter() {
  const config = await initializeEmailConfig();
  
  if (!config) {
    throw new Error('Email credentials not configured. Please add them in Admin Dashboard or set SMTP environment variables.');
  }

  return nodemailer.createTransport(config);
}

export function createEmailTransporterSync() {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER || 'orders@edufiliova.com';
  const smtpPass = process.env.SMTP_PASS;

  if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
    throw new Error('Email credentials not configured. Please set SMTP_HOST, SMTP_PORT, SMTP_USER and SMTP_PASS environment variables.');
  }

  const config: EmailConfig = {
    host: smtpHost,
    port: parseInt(smtpPort),
    secure: parseInt(smtpPort) === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  };

  return nodemailer.createTransport(config);
}

export async function sendVoucherEmail(
  recipientEmail: string,
  recipientName: string,
  voucherCode: string,
  amount: number,
  description: string,
  expiresAt?: string
): Promise<boolean> {
  try {
    const transporter = await createEmailTransporter();
    const formattedAmount = amount.toFixed(2);
    const expiryDate = expiresAt ? new Date(expiresAt).toLocaleDateString() : null;

    const emailHTML = generateVoucherEmailHTML(
      voucherCode,
      amount,
      description,
      recipientName,
      expiresAt
    );

    const mailOptions = {
      from: `"Edufiliova Gift Vouchers" <${process.env.SMTP_USER || 'orders@edufiliova.com'}>`,
      to: recipientEmail,
      subject: `🎁 Your $${formattedAmount} Gift Voucher - Code: ${voucherCode}`,
      html: emailHTML,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending voucher email:', error);
    return false;
  }
}

export async function sendSubscriptionCancellationEmail(
  recipientEmail: string,
  recipientName: string,
  planName: string,
  expiryDate?: string
): Promise<boolean> {
  try {
    const transporter = await createEmailTransporter();
    const baseUrl = process.env.REPLIT_DEV_DOMAIN 
      ? `https://${process.env.REPLIT_DEV_DOMAIN}`
      : 'https://edufiliova.com';
    const whiteLogoUrl = (process.env.EDUFILIOVA_WHITE_LOGO_URL || 'https://res.cloudinary.com/dl2lomrhp/image/upload/v1763935567/edufiliova/edufiliova-white-logo.png').replace(/\/f_auto,?/g, '/');
    const formattedExpiryDate = expiryDate ? new Date(expiryDate).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }) : 'the end of your billing period';

    const emailHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Subscription Cancellation Confirmation</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f5f7fa;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    }
    .header {
      background-color: #2f5a4e;
      padding: 30px 40px;
      text-align: center;
    }
    .logo {
      max-width: 200px;
      height: auto;
    }
    .content {
      padding: 40px;
    }
    .greeting {
      font-size: 24px;
      font-weight: bold;
      color: #1a1a1a;
      margin-bottom: 20px;
    }
    .message {
      font-size: 16px;
      color: #4a5568;
      line-height: 1.6;
      margin-bottom: 20px;
    }
    .info-box {
      background: #f9fafb;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      border-left: 4px solid #2f5a4e;
    }
    .info-title {
      font-weight: bold;
      color: #1a1a1a;
      margin-bottom: 10px;
    }
    .info-item {
      color: #4a5568;
      margin: 8px 0;
    }
    .cta-button {
      display: inline-block;
      background-color: #2f5a4e;
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 28px;
      border-radius: 8px;
      font-weight: 600;
      margin: 20px 0;
    }
    .footer {
      background: #2f5a4e;
      padding: 30px 40px;
      color: #ffffff;
      text-align: center;
    }
    .footer-text {
      color: rgba(255,255,255,0.8);
      font-size: 13px;
      margin: 10px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="${whiteLogoUrl}" alt="Edufiliova" class="logo">
    </div>
    <div class="content">
      <div class="greeting">Hi ${recipientName || 'there'},</div>
      <div class="message">
        We're sorry to see you go! Your subscription has been successfully cancelled.
      </div>
      <div class="info-box">
        <div class="info-title">Cancellation Details</div>
        <div class="info-item"><strong>Plan:</strong> ${planName}</div>
        <div class="info-item"><strong>Access Until:</strong> ${formattedExpiryDate}</div>
        <div class="info-item"><strong>Status:</strong> Cancelled</div>
      </div>
      <div class="message">
        You'll continue to have full access to all premium features until <strong>${formattedExpiryDate}</strong>. After that, your account will switch to the free plan.
      </div>
      <div class="message">
        Changed your mind? You can reactivate your subscription anytime before it expires.
      </div>
      <div style="text-align: center;">
        <a href="${baseUrl}/?page=student-dashboard" class="cta-button">Visit Your Dashboard</a>
      </div>
      <div class="message" style="margin-top: 30px; font-size: 14px; color: #718096;">
        If you have any questions or feedback about why you cancelled, we'd love to hear from you. Simply reply to this email or contact our support team.
      </div>
    </div>
    <div class="footer">
      <div class="footer-text">Thank you for being part of the Edufiliova community!</div>
      <div class="footer-text">&copy; ${new Date().getFullYear()} Edufiliova. All rights reserved.</div>
    </div>
  </div>
</body>
</html>`;

    const mailOptions = {
      from: `"Edufiliova" <${process.env.SMTP_USER || 'orders@edufiliova.com'}>`,
      to: recipientEmail,
      subject: `Your ${planName} Subscription Has Been Cancelled`,
      html: emailHTML,
    };

    console.log(`✉️ Final HTML for Subscription Cancellation to ${recipientEmail}:\n${emailHTML}`);
    await transporter.sendMail(mailOptions);
    console.log(`Subscription cancellation email sent to ${recipientEmail}`);
    return true;
  } catch (error) {
    console.error('Error sending subscription cancellation email:', error);
    return false;
  }
}

function generateVoucherEmailHTML(
  code: string,
  amount: number,
  description: string = "Gift Voucher",
  recipientName?: string,
  expiresAt?: string
): string {
  const formattedAmount = amount.toFixed(2);
  const expiryDate = expiresAt ? new Date(expiresAt).toLocaleDateString() : null;
  const baseUrl = process.env.REPLIT_DEV_DOMAIN 
    ? `https://${process.env.REPLIT_DEV_DOMAIN}`
    : 'https://edufiliova.com';
  const whiteLogoUrl = process.env.EDUFILIOVA_WHITE_LOGO_URL || 'https://res.cloudinary.com/dl2lomrhp/image/upload/v1763935567/edufiliova/edufiliova-white-logo.png';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Gift Voucher</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f5f7fa;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    }
    .header {
      background-color: #2f5a4e;
      padding: 30px 40px;
      text-align: center;
      border-bottom: none;
    }
    .logo {
      max-width: 200px;
      height: auto;
    }
    .content {
      padding: 40px;
    }
    .voucher-card {
      background: linear-gradient(135deg, #ffffff 0%, #f9fafb 100%);
      margin: 30px;
      padding: 40px;
      border-radius: 12px;
      border: 3px solid #2f5a4e;
      position: relative;
    }
    .voucher-code {
      background: #1a1a1a;
      color: #c4f03b;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
      margin: 20px 0;
      font-family: 'Courier New', monospace;
    }
    .amount {
      font-size: 48px;
      font-weight: bold;
      color: #2f5a4e;
      text-align: center;
      margin: 20px 0;
    }
    .instructions {
      background: #f9fafb;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      border-left: 4px solid #2f5a4e;
    }
    .footer {
      background: #2f5a4e;
      padding: 40px;
      border-top: 3px solid #2f5a4e;
      color: #ffffff;
    }
    .footer-contact {
      text-align: center;
      margin: 25px 0;
    }
    .contact-item {
      display: inline-block;
      margin: 10px 20px;
      color: #ffffff;
      text-decoration: none;
      font-size: 14px;
    }
    .footer-links {
      text-align: center;
      margin: 25px 0;
      padding-top: 25px;
      border-top: 1px solid rgba(255,255,255,0.2);
    }
    .footer-link {
      color: #ffffff !important;
      text-decoration: none;
      font-size: 13px;
      margin: 0 12px;
      font-weight: 500;
      transition: opacity 0.3s;
    }
    .footer-bottom {
      text-align: center;
      padding-top: 20px;
      margin-top: 20px;
      border-top: 1px solid rgba(255,255,255,0.2);
      color: rgba(255,255,255,0.7);
      font-size: 12px;
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="${whiteLogoUrl}" alt="EduFiliova" class="logo" />
    </div>
    
    <div style="padding: 30px 40px; text-align: center;">
      <h1 style="margin: 0 0 10px 0; font-size: 32px; color: #1a1a1a;">🎁 Gift Voucher</h1>
      <p style="margin: 0; font-size: 16px; color: #64748b;">${description}</p>
    </div>

    <div class="voucher-card">
      ${recipientName ? `<p style="text-align: center; color: #666; margin-bottom: 20px;">For: <strong>${recipientName}</strong></p>` : ''}
      
      <div class="amount">$${formattedAmount}</div>
      
      <div class="voucher-code">
        <p style="margin: 0 0 10px 0; font-size: 12px; color: #888; letter-spacing: 2px;">YOUR CODE</p>
        <p style="margin: 0; font-size: 24px; font-weight: bold; letter-spacing: 3px;">${code}</p>
      </div>

      <div class="instructions">
        <h3 style="margin-top: 0; color: #333;">How to Redeem:</h3>
        <ol style="color: #666; line-height: 1.8; margin: 10px 0;">
          <li>Visit our store and add items to your cart</li>
          <li>Enter code <strong>${code}</strong> at checkout</li>
          <li>Enjoy your $${formattedAmount} credit!</li>
        </ol>
      </div>

      <div style="background: #fff3e0; padding: 15px; border-radius: 6px; margin-top: 20px;">
        <h4 style="margin-top: 0; color: #2f5a4e;">Terms & Conditions:</h4>
        <ul style="color: #666; font-size: 13px; line-height: 1.6; margin: 0; padding-left: 20px;">
          <li>One-time use only per customer</li>
          <li>Cannot be combined with other offers</li>
          <li>Non-transferable and non-refundable</li>
          ${expiryDate ? `<li><strong>Valid until: ${expiryDate}</strong></li>` : '<li>No expiry date</li>'}
        </ul>
      </div>

      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px dashed #e0e0e0;">
        <p style="color: #999; font-size: 12px; margin: 0;">
          Keep this email safe. You'll need the code to redeem your voucher.
        </p>
      </div>
    </div>

    <div class="footer">
      <div class="footer-contact">
        <p style="color: #ffffff; font-size: 16px; margin: 0 0 20px 0; text-align: center;">
          You need help? Contact us on <a href="mailto:support@edufiliova.com" style="color: #ffffff; text-decoration: underline;">support@edufiliova.com</a>
        </p>
      </div>
      
      <div class="footer-links">
        <a href="${baseUrl}/help" class="footer-link" style="color: #ffffff;">Help Center</a>
        <a href="${baseUrl}/privacy-policy" class="footer-link" style="color: #ffffff;">Privacy Policy</a>
        <a href="${baseUrl}/terms" class="footer-link" style="color: #ffffff;">Terms of Service</a>
        <a href="${baseUrl}/refund-policy" class="footer-link" style="color: #ffffff;">Refund Policy</a>
        <a href="${baseUrl}/contact" class="footer-link" style="color: #ffffff;">Contact Us</a>
      </div>
      
      <div class="footer-bottom">
        © ${new Date().getFullYear()} EduFiliova. All rights reserved.<br>
        Creativity, Learning, and Growth in One Place
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export interface VoucherData {
  code: string;
  amount: number;
  description: string;
  expiresAt?: string;
}

export async function sendBulkVouchersEmail(
  recipientEmail: string,
  recipientName: string,
  vouchers: VoucherData[]
): Promise<boolean> {
  try {
    const transporter = await createEmailTransporter();
    const pdfBuffer = await generateVouchersPDF(vouchers, recipientName);
    
    const totalAmount = vouchers.reduce((sum, v) => sum + v.amount, 0);
    const formattedTotal = totalAmount.toFixed(2);
    
    const baseUrl = process.env.REPLIT_DEV_DOMAIN 
      ? `https://${process.env.REPLIT_DEV_DOMAIN}`
      : 'https://edufiliova.com';
    const whiteLogoUrl = (process.env.EDUFILIOVA_WHITE_LOGO_URL || 'https://res.cloudinary.com/dl2lomrhp/image/upload/v1763935567/edufiliova/edufiliova-white-logo.png').replace(/\/f_auto,?/g, '/');

    const emailHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: #f5f7fa;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    }
    .header {
      background-color: #2f5a4e;
      padding: 30px 40px;
      text-align: center;
      border-bottom: none;
    }
    .logo {
      max-width: 200px;
      height: auto;
    }
    .content {
      padding: 40px;
    }
    .content h1 {
      color: #1a1a1a;
      margin: 0 0 10px 0;
      text-align: center;
    }
    .summary {
      background: #f9fafb;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .summary-item {
      display: flex;
      justify-content: space-between;
      margin: 10px 0;
      font-size: 16px;
    }
    .total {
      font-size: 24px;
      font-weight: bold;
      color: #2f5a4e;
      border-top: 2px solid #ddd;
      padding-top: 15px;
      margin-top: 15px;
    }
    .attachment-note {
      background: #fff3e0;
      padding: 15px;
      border-radius: 8px;
      margin: 20px 0;
      border-left: 4px solid #2f5a4e;
    }
    .footer {
      background: #2f5a4e;
      padding: 40px;
      border-top: 3px solid #2f5a4e;
      color: #ffffff;
    }
    .footer-contact {
      text-align: center;
      margin: 25px 0;
    }
    .footer-links {
      text-align: center;
      margin: 25px 0;
      padding-top: 25px;
      border-top: 1px solid rgba(255,255,255,0.2);
    }
    .footer-link {
      color: #ffffff !important;
      text-decoration: none;
      font-size: 13px;
      margin: 0 12px;
      font-weight: 500;
      transition: opacity 0.3s;
    }
    .footer-bottom {
      text-align: center;
      padding-top: 20px;
      margin-top: 20px;
      border-top: 1px solid rgba(255,255,255,0.2);
      color: rgba(255,255,255,0.7);
      font-size: 12px;
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="${whiteLogoUrl}" alt="EduFiliova" class="logo" />
    </div>
    
    <div class="content">
      <h1>🎁 Your Gift Vouchers</h1>
      ${recipientName ? `<p style="color: #666; text-align: center;">For: <strong>${recipientName}</strong></p>` : ''}

    <div class="summary">
      <div class="summary-item">
        <span>Number of Vouchers:</span>
        <strong>${vouchers.length}</strong>
      </div>
      <div class="summary-item">
        <span>Amount per Voucher:</span>
        <strong>$${vouchers[0]?.amount.toFixed(2)}</strong>
      </div>
      <div class="summary-item total">
        <span>Total Value:</span>
        <span>$${formattedTotal}</span>
      </div>
    </div>

    <div class="attachment-note">
      <h3 style="margin-top: 0; color: #2f5a4e;">📎 Vouchers Attached</h3>
      <p style="margin: 0; color: #666;">
        Your ${vouchers.length} voucher codes are attached as a PDF file. 
        Download and save the PDF - you'll need the codes to redeem your vouchers.
      </p>
    </div>

    <div style="background: #f9fafb; padding: 15px; border-radius: 8px;">
      <h4 style="margin-top: 0; color: #333;">How to Redeem:</h4>
      <ol style="color: #666; line-height: 1.8; margin: 10px 0; padding-left: 20px;">
        <li>Open the attached PDF to view your voucher codes</li>
        <li>Visit our store and add items to your cart</li>
        <li>Enter any voucher code at checkout</li>
        <li>Enjoy your credit!</li>
      </ol>
    </div>

    <div class="footer">
      <div class="footer-contact">
        <p style="color: #ffffff; font-size: 16px; margin: 0 0 20px 0; text-align: center;">
          You need help? Contact us on <a href="mailto:support@edufiliova.com" style="color: #ffffff; text-decoration: underline;">support@edufiliova.com</a>
        </p>
      </div>
      
      <div class="footer-links">
        <a href="${baseUrl}/help" class="footer-link" style="color: #ffffff;">Help Center</a>
        <a href="${baseUrl}/privacy-policy" class="footer-link" style="color: #ffffff;">Privacy Policy</a>
        <a href="${baseUrl}/terms" class="footer-link" style="color: #ffffff;">Terms of Service</a>
        <a href="${baseUrl}/refund-policy" class="footer-link" style="color: #ffffff;">Refund Policy</a>
        <a href="${baseUrl}/contact" class="footer-link" style="color: #ffffff;">Contact Us</a>
      </div>
      
      <div class="footer-bottom">
        © ${new Date().getFullYear()} EduFiliova. All rights reserved.<br>
        Creativity, Learning, and Growth in One Place
      </div>
    </div>
    </div>
  </div>
</body>
</html>
    `.trim();

    const mailOptions = {
      from: `"Edufiliova Gift Vouchers" <${process.env.SMTP_USER || 'orders@edufiliova.com'}>`,
      to: recipientEmail,
      subject: `🎁 Your ${vouchers.length} Gift Vouchers ($${formattedTotal} Total Value)`,
      html: emailHTML,
      attachments: [
        {
          filename: `vouchers-${Date.now()}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    };

    console.log(`✉️ Final HTML for Bulk Vouchers to ${recipientEmail}:\n${emailHTML}`);
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending bulk vouchers email:', error);
    return false;
  }
}

function generateVouchersPDF(vouchers: VoucherData[], recipientName?: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ 
        size: 'A4', 
        margin: 0,
        bufferPages: true 
      });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const totalAmount = vouchers.reduce((sum, v) => sum + v.amount, 0);
      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;

      // HEADER - Orange background with white logo (matching email template)
      doc.rect(0, 0, pageWidth, 120).fillColor('#2f5a4e').fill();
      
      const whiteLogoPath = path.join(process.cwd(), 'public', 'edufiliova-white-logo.png');
      const fallbackLogoPath = path.join(process.cwd(), 'public', 'Edufiliova_Logo_Optimized.png');
      const logoExists = fs.existsSync(whiteLogoPath) || fs.existsSync(fallbackLogoPath);
      
      if (logoExists) {
        const finalLogoPath = fs.existsSync(whiteLogoPath) ? whiteLogoPath : fallbackLogoPath;
        doc.image(finalLogoPath, (pageWidth - 180) / 2, 30, { width: 180 });
      }
      
      // Title section
      doc.y = 140;
      doc.fontSize(32).fillColor('#1a1a1a').font('Helvetica-Bold')
        .text('Gift Vouchers', 50, doc.y, {
          width: pageWidth - 100,
          align: 'center'
        });
      
      doc.moveDown(0.8);
      
      if (recipientName) {
        doc.fontSize(14).fillColor('#666666').font('Helvetica')
          .text(`For: ${recipientName}`, 50, doc.y, {
            width: pageWidth - 100,
            align: 'center'
          });
        doc.moveDown(0.5);
      }

      doc.fontSize(12).fillColor('#999999')
        .text(`Generated: ${new Date().toLocaleDateString()}`, 50, doc.y, {
          width: pageWidth - 100,
          align: 'center'
        });
      doc.moveDown(1);

      doc.fontSize(11).fillColor('#333333').font('Helvetica-Bold')
        .text(`Total Vouchers: ${vouchers.length}`, 50, doc.y, {
          width: pageWidth - 100,
          align: 'center'
        })
        .text(`Total Value: $${totalAmount.toFixed(2)}`, 50, doc.y, {
          width: pageWidth - 100,
          align: 'center'
        });
      
      doc.moveDown(2);

      // VOUCHERS - Better layout matching email voucher cards
      vouchers.forEach((voucher, index) => {
        // Check if we need a new page (NO footer, so more space available)
        if (doc.y > pageHeight - 220) {
          doc.addPage();
          doc.y = 50;
        }

        const yPos = doc.y;
        const cardHeight = 180;
        const cardPadding = 50;
        const cardWidth = pageWidth - (cardPadding * 2);
        
        // Voucher card border (matching email's border: 3px solid #2f5a4e)
        doc.roundedRect(cardPadding, yPos, cardWidth, cardHeight, 12)
          .lineWidth(3)
          .strokeColor('#2f5a4e')
          .stroke();

        // Voucher number
        doc.fontSize(10).fillColor('#999999').font('Helvetica')
          .text(`Voucher #${index + 1}`, cardPadding + 20, yPos + 20);

        // Amount (matching email's large red amount)
        doc.fontSize(48).fillColor('#2f5a4e').font('Helvetica-Bold')
          .text(`$${voucher.amount.toFixed(2)}`, cardPadding + 20, yPos + 40);

        // Description
        doc.fontSize(10).fillColor('#666666').font('Helvetica')
          .text(voucher.description || 'Corporate Gift Voucher', cardPadding + 20, yPos + 95);

        // Voucher code box (matching email's black box with yellow text)
        const codeBoxY = yPos + 115;
        doc.roundedRect(cardPadding + 20, codeBoxY, cardWidth - 40, 35, 5)
          .fillColor('#1a1a1a')
          .fill();

        doc.fontSize(8).fillColor('#888888').font('Helvetica')
          .text('VOUCHER CODE', cardPadding + 20, codeBoxY + 5, {
            width: cardWidth - 40,
            align: 'center'
          });

        doc.fontSize(16).fillColor('#c4f03b').font('Courier-Bold')
          .text(voucher.code, cardPadding + 20, codeBoxY + 16, {
            width: cardWidth - 40,
            align: 'center'
          });

        // Expiry or terms
        doc.font('Helvetica');
        if (voucher.expiresAt) {
          const expiryDate = new Date(voucher.expiresAt).toLocaleDateString();
          doc.fontSize(9).fillColor('#2f5a4e')
            .text(`Valid until: ${expiryDate}`, cardPadding + 20, yPos + 160);
        }
        
        doc.fontSize(8).fillColor('#999999')
          .text('One-time use • Cannot be combined with other offers', cardPadding + 20, yPos + 160, {
            width: cardWidth - 40,
            align: 'right'
          });

        doc.y = yPos + cardHeight + 20;
      });

      // Add instructions page (matching email content)
      doc.addPage();
      
      // How to Redeem section
      doc.fontSize(20).fillColor('#333333').font('Helvetica-Bold')
        .text('How to Redeem Your Vouchers', 50, 80, {
          width: pageWidth - 100,
          align: 'center'
        });
      doc.moveDown(2);

      const instructionsY = doc.y;
      doc.fontSize(12).fillColor('#666666').font('Helvetica')
        .text('1. Visit our store and add items to your cart', 70, instructionsY)
        .moveDown(0.8)
        .text('2. Enter any voucher code from above at checkout', 70, doc.y)
        .moveDown(0.8)
        .text('3. The voucher amount will be applied to your purchase', 70, doc.y)
        .moveDown(0.8)
        .text('4. Each code can only be used once', 70, doc.y);

      doc.moveDown(3);

      // Terms & Conditions section
      doc.fontSize(16).fillColor('#2f5a4e').font('Helvetica-Bold')
        .text('Terms & Conditions', 70, doc.y);
      doc.moveDown(1);
      
      doc.fontSize(11).fillColor('#666666').font('Helvetica')
        .text('• One-time use only per voucher code', 90, doc.y)
        .moveDown(0.6)
        .text('• Cannot be combined with other promotional offers', 90, doc.y)
        .moveDown(0.6)
        .text('• Non-transferable and non-refundable', 90, doc.y)
        .moveDown(0.6)
        .text('• No cash value', 90, doc.y);

      doc.moveDown(3);

      // Contact information
      doc.fontSize(12).fillColor('#999999')
        .text('Need help? Contact us:', 50, doc.y, {
          width: pageWidth - 100,
          align: 'center'
        });
      doc.moveDown(0.5);
      doc.fontSize(11).fillColor('#666666')
        .text('Email: support@edufiliova.com', 50, doc.y, {
          width: pageWidth - 100,
          align: 'center'
        })
        .moveDown(0.3)
        .text('Website: edufiliova.com', 50, doc.y, {
          width: pageWidth - 100,
          align: 'center'
        });

      // NO FOOTER per requirement
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
