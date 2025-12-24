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
    
    // Using the EXACT wording and structure from the user-provided text/HTML
    const html = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f0f1f5; }
    .container { width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background-color: #2f5a4e; padding: 15px 30px; }
    .banner { width: 100%; display: block; border: 0; }
    .content { padding: 40px 30px; color: #0C332C; line-height: 1.6; }
    .feature-box { background-color: #f9f9f9; padding: 25px; border-radius: 8px; margin: 30px 0; }
    .footer { background-color: #0C332C; padding: 40px 30px; color: #ffffff; text-align: center; }
    .btn { background-color: #0C332C; color: #ffffff !important; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; }
    .step-row { margin-bottom: 25px; width: 100%; border-collapse: collapse; }
    .step-icon { width: 40px; vertical-align: top; }
    .step-text { padding-left: 15px; vertical-align: top; }
    .social-table { margin: 0 auto; }
    a { color: #0C332C; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <table width="100%" border="0" cellpadding="0" cellspacing="0">
        <tr>
          <td align="left"><img src="cid:logo" alt="EduFiliova" width="150" style="display:block; border: 0;"></td>
          <td align="right" style="color: #ffffff; font-size: 14px; font-weight: normal;">Learning • Skills • Careers</td>
        </tr>
      </table>
    </div>
    
    <img src="cid:banner" alt="Welcome" class="banner">
    
    <div class="content">
      <h2 style="margin-top: 0; color: #0C332C; font-size: 22px;">Hi ${data.fullName},</h2>
      <p>We’re excited to share some great news with you!</p>
      <p>After a careful review of your application, qualifications, and submitted documents, we’re happy to inform you that your teacher application has been successfully <strong>approved</strong>. You are now officially part of the EduFiliova global teaching community.</p>
      
      <h3 style="color: #0C332C; font-size: 18px; margin-top: 30px;">What This Means for You</h3>
      <p>As an approved teacher on EduFiliova, you can now:</p>
      <ul style="padding-left: 20px; color: #0C332C;">
        <li style="margin-bottom: 10px;">Create and publish structured courses and lessons</li>
        <li style="margin-bottom: 10px;">Schedule and host live classes or meetings</li>
        <li style="margin-bottom: 10px;">Assign quizzes, exercises, and learning materials</li>
        <li style="margin-bottom: 10px;">Communicate with students through secure messaging</li>
        <li style="margin-bottom: 10px;">Earn income through courses, live sessions, and academic services</li>
        <li style="margin-bottom: 0;">Reach students from multiple countries and education systems</li>
      </ul>
      <p>Your teacher dashboard is now fully unlocked and ready for use.</p>

      <h3 style="color: #0C332C; font-size: 18px; margin-top: 30px;">Next Steps:</h3>
      
      <table width="100%" border="0" cellpadding="0" cellspacing="0" class="step-row">
        <tr>
          <td class="step-icon"><img src="cid:icon_db" width="30" style="display:block; border: 0;"></td>
          <td class="step-text">
            <strong style="display:block; margin-bottom: 5px; font-size: 16px;">Access your Teacher Dashboard</strong>
            <span style="font-size: 14px; color: #666;">Log in and explore your dashboard to familiarize yourself with available tools and features.</span>
          </td>
        </tr>
      </table>

      <table width="100%" border="0" cellpadding="0" cellspacing="0" class="step-row">
        <tr>
          <td class="step-icon"><img src="cid:icon_pf" width="30" style="display:block; border: 0;"></td>
          <td class="step-text">
            <strong style="display:block; margin-bottom: 5px; font-size: 16px;">Complete Your Teacher Profile</strong>
            <span style="font-size: 14px; color: #666;">Add a professional photo, bio, teaching style, subjects, and experience. A complete profile helps students trust and choose you.</span>
          </td>
        </tr>
      </table>

      <table width="100%" border="0" cellpadding="0" cellspacing="0" class="step-row">
        <tr>
          <td class="step-icon"><img src="cid:icon_cs" width="30" style="display:block; border: 0;"></td>
          <td class="step-text">
            <strong style="display:block; margin-bottom: 5px; font-size: 16px;">Create Your First Course or Lesson</strong>
            <span style="font-size: 14px; color: #666;">Start with a clear, structured course aligned to a grade level or subject you specialize in.</span>
          </td>
        </tr>
      </table>

      <div style="text-align: center; margin: 40px 0;">
        <a href="${baseUrl}/login" class="btn">Go to Dashboard</a>
      </div>

      <div style="border-top: 1px solid #eeeeee; padding-top: 25px;">
        <p style="font-size: 14px; color: #666;"><strong>Important Notes:</strong><br>
        Your account has been approved for teaching purposes only. Earnings and payouts are managed through your teacher dashboard.</p>
      </div>
    </div>

    <div class="footer">
      <img src="cid:footer_logo" alt="EduFiliova" width="150" style="margin-bottom: 20px; display: inline-block; border: 0;">
      <p style="color: #a3f7b5; font-size: 14px; margin-bottom: 25px; max-width: 450px; margin-left: auto; margin-right: auto;">Empowering education globally through personalized learning experiences.</p>
      
      <table border="0" cellpadding="0" cellspacing="0" class="social-table">
        <tr>
          <td style="padding: 0 12px;"><a href="#"><img src="cid:s_fb" width="24" height="24" alt="Facebook" style="display:block; border: 0;"></a></td>
          <td style="padding: 0 12px;"><a href="#"><img src="cid:s_ig" width="24" height="24" alt="Instagram" style="display:block; border: 0;"></a></td>
          <td style="padding: 0 12px;"><a href="#"><img src="cid:s_li" width="24" height="24" alt="LinkedIn" style="display:block; border: 0;"></a></td>
          <td style="padding: 0 12px;"><a href="#"><img src="cid:s_tw" width="24" height="24" alt="Twitter" style="display:block; border: 0;"></a></td>
        </tr>
      </table>
      
      <p style="font-size: 12px; color: #888; margin-top: 35px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px;">
        © ${new Date().getFullYear()} EduFiliova. All rights reserved.<br>
        <a href="${baseUrl}/unsubscribe" style="color: #888; text-decoration: underline;">Unsubscribe</a>
      </p>
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
        { filename: 'idb.png', path: './public/email-assets/bbe5722d1ffd3c84888e18335965d5e5_1766617371529.png', cid: 'icon_db' },
        { filename: 'ipf.png', path: './public/email-assets/d320764f7298e63f6b035289d4219bd8_1766617371533.png', cid: 'icon_pf' },
        { filename: 'ics.png', path: './public/email-assets/df1ad55cc4e451522007cfa4378c9bbd_1766617371535.png', cid: 'icon_cs' },
        { filename: 'fl.png', path: './public/email-assets/4a834058470b14425c9b32ace711ef17_1766617371523.png', cid: 'footer_logo' },
        { filename: 'fb.png', path: './public/email-assets/9eefdace1f726880f93c5a973a54c2f6_1766617371524.png', cid: 's_fb' },
        { filename: 'ig.png', path: './public/email-assets/9f7291948d8486bdd26690d0c32796e0_1766617371526.png', cid: 's_ig' },
        { filename: 'li.png', path: './public/email-assets/9f7291948d8486bdd26690d0c32796e0_1766617371526.png', cid: 's_li' },
        { filename: 'tw.png', path: './public/email-assets/9f7291948d8486bdd26690d0c32796e0_1766617371526.png', cid: 's_tw' }
      ]
    });
  }
}

export const emailService = new EmailService();
