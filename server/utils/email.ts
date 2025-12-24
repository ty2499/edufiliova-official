import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { db } from '../db';
import { emailAccounts } from '@shared/schema';
import { eq } from 'drizzle-orm';

interface EmailAttachment {
  filename: string;
  content?: Buffer;
  path?: string;
  cid?: string;
  contentType?: string;
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
  attachments?: EmailAttachment[];
}

export class EmailService {
  private transporters: Map<string, Transporter> = new Map();

  constructor() {
    this.initialize();
  }

  private getBaseUrl(): string {
    if (process.env.REPLIT_DEV_DOMAIN) {
      return `https://${process.env.REPLIT_DEV_DOMAIN}`;
    }
    if (process.env.BASE_URL) {
      return process.env.BASE_URL;
    }
    return 'https://edufiliova.com';
  }

  private initialize() {
    this.initializeFromDatabase();
  }

  private async initializeFromDatabase() {
    try {
      const accounts = await db.select().from(emailAccounts).where(eq(emailAccounts.isActive, true));
      if (accounts.length === 0) return;
      for (const account of accounts) {
        if (account.smtpHost && account.smtpPort && account.smtpUsername && account.smtpPassword) {
          const transporter = nodemailer.createTransport({
            host: account.smtpHost,
            port: account.smtpPort,
            secure: account.smtpSecure || account.smtpPort === 465,
            auth: {
              user: account.smtpUsername,
              pass: account.smtpPassword,
            },
          });
          this.transporters.set(account.email, transporter);
        }
      }
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error);
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (this.transporters.size === 0) {
      await this.initializeFromDatabase();
    }
    if (this.transporters.size === 0) return false;
    
    try {
      const from = options.from || `"EduFiliova" <orders@edufiliova.com>`;
      const emailMatch = from.match(/<(.+?)>/);
      const senderEmail = emailMatch ? emailMatch[1] : from;
      let transporter = this.transporters.get(senderEmail) || Array.from(this.transporters.values())[0];
      
      if (!transporter) return false;

      const mailOptions = {
        from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        attachments: options.attachments || [],
      };
      
      await transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('❌ Error in sendEmail:', error);
      return false;
    }
  }

  async sendTeacherApprovalEmail(email: string, data: { fullName: string; displayName: string }): Promise<boolean> {
    const baseUrl = this.getBaseUrl();
    
    // Fixed template:
    // 1. Removed repeated social media CIDs to prevent triple logos
    // 2. Corrected image path mapping (Banner image path was correct, but some clients handle background-style CIDs poorly)
    // 3. Simplified footer to use distinct CIDs for each social platform
    const html = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f0f1f5; }
    .container { width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background-color: #2f5a4e; padding: 20px 30px; }
    .banner { width: 100%; display: block; }
    .content { padding: 40px 30px; color: #0C332C; line-height: 1.6; }
    .feature-box { background-color: #f9f9f9; padding: 25px; border-radius: 8px; margin: 30px 0; }
    .footer { background-color: #0C332C; padding: 40px 30px; color: #ffffff; text-align: center; }
    .btn { background-color: #0C332C; color: #ffffff !important; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; }
    .step-row { margin-bottom: 20px; }
    .step-icon { width: 30px; vertical-align: top; }
    .step-text { padding-left: 15px; display: inline-block; width: 480px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <table width="100%" border="0" cellpadding="0" cellspacing="0">
        <tr>
          <td align="left"><img src="cid:logo" alt="EduFiliova" width="150"></td>
          <td align="right" style="color: #ffffff; font-size: 14px;">Learning • Skills • Careers</td>
        </tr>
      </table>
    </div>
    
    <img src="cid:banner" alt="Teacher Application" class="banner">
    
    <div class="content">
      <h2 style="margin-top: 0;">Hi ${data.fullName},</h2>
      <p>We’re excited to share some great news with you!</p>
      <p>After a careful review of your application, qualifications, and submitted documents, we’re happy to inform you that your teacher application has been successfully <strong>approved</strong>. You are now officially part of the EduFiliova global teaching community.</p>
      
      <div class="feature-box">
        <h3 style="margin-top: 0;">What This Means for You</h3>
        <ul style="padding-left: 20px;">
          <li>Create and publish structured courses and lessons</li>
          <li>Schedule and host live classes or meetings</li>
          <li>Assign quizzes and learning materials</li>
          <li>Communicate with students via secure messaging</li>
          <li>Earn income through your expertise</li>
        </ul>
      </div>

      <h3>Next Steps:</h3>
      
      <table width="100%" border="0" cellpadding="0" cellspacing="0" class="step-row">
        <tr>
          <td class="step-icon"><img src="cid:icon_db" width="30"></td>
          <td class="step-text">
            <strong>Access your Teacher Dashboard</strong><br>
            <span style="font-size: 14px; color: #666;">Explore the tools and features available to you.</span>
          </td>
        </tr>
      </table>

      <table width="100%" border="0" cellpadding="0" cellspacing="0" class="step-row">
        <tr>
          <td class="step-icon"><img src="cid:icon_pf" width="30"></td>
          <td class="step-text">
            <strong>Complete Your Profile</strong><br>
            <span style="font-size: 14px; color: #666;">Add your photo and bio to build student trust.</span>
          </td>
        </tr>
      </table>

      <table width="100%" border="0" cellpadding="0" cellspacing="0" class="step-row">
        <tr>
          <td class="step-icon"><img src="cid:icon_cs" width="30"></td>
          <td class="step-text">
            <strong>Create Your First Course</strong><br>
            <span style="font-size: 14px; color: #666;">Start sharing your knowledge with the world.</span>
          </td>
        </tr>
      </table>

      <div style="text-align: center; margin-top: 40px;">
        <a href="${baseUrl}/login" class="btn">Go to Dashboard</a>
      </div>
    </div>

    <div class="footer">
      <img src="cid:footer_logo" alt="EduFiliova" width="150" style="margin-bottom: 20px;">
      <p style="color: #a3f7b5; font-size: 14px; margin-bottom: 20px;">Empowering education globally through personalized learning.</p>
      
      <table align="center" border="0" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding: 0 10px;"><a href="#"><img src="cid:fb" width="24" height="24" alt="FB"></a></td>
          <td style="padding: 0 10px;"><a href="#"><img src="cid:ig" width="24" height="24" alt="IG"></a></td>
          <td style="padding: 0 10px;"><a href="#"><img src="cid:li" width="24" height="24" alt="LI"></a></td>
          <td style="padding: 0 10px;"><a href="#"><img src="cid:tw" width="24" height="24" alt="TW"></a></td>
        </tr>
      </table>
      
      <p style="font-size: 12px; color: #888; margin-top: 30px;">© ${new Date().getFullYear()} EduFiliova. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;

    return this.sendEmail({
      to: email,
      subject: 'Welcome Aboard! Your Teacher Application is Approved - EduFiliova',
      html,
      from: `"EduFiliova Support" <support@edufiliova.com>`,
      attachments: [
        { filename: 'logo.png', path: './public/email-assets/c9513ccbbd620ff1cc148b9f159cd39d_1766617371531.png', cid: 'logo' },
        { filename: 'banner.png', path: './public/email-assets/e4d45170731072cbb168266fca3fd470_1766617371537.png', cid: 'banner' },
        { filename: 'icon_db.png', path: './public/email-assets/bbe5722d1ffd3c84888e18335965d5e5_1766617371529.png', cid: 'icon_db' },
        { filename: 'icon_pf.png', path: './public/email-assets/d320764f7298e63f6b035289d4219bd8_1766617371533.png', cid: 'icon_pf' },
        { filename: 'icon_cs.png', path: './public/email-assets/df1ad55cc4e451522007cfa4378c9bbd_1766617371535.png', cid: 'icon_cs' },
        { filename: 'flogo.png', path: './public/email-assets/4a834058470b14425c9b32ace711ef17_1766617371523.png', cid: 'footer_logo' },
        { filename: 'fb.png', path: './public/email-assets/9eefdace1f726880f93c5a973a54c2f6_1766617371524.png', cid: 'fb' },
        { filename: 'ig.png', path: './public/email-assets/9f7291948d8486bdd26690d0c32796e0_1766617371526.png', cid: 'ig' },
        { filename: 'li.png', path: './public/email-assets/9f7291948d8486bdd26690d0c32796e0_1766617371526.png', cid: 'li' },
        { filename: 'tw.png', path: './public/email-assets/9f7291948d8486bdd26690d0c32796e0_1766617371526.png', cid: 'tw' }
      ]
    });
  }
}

export const emailService = new EmailService();
