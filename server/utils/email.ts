import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { db } from '../db';
import { socialMediaLinks, emailAccounts } from '@shared/schema';
import { eq } from 'drizzle-orm';

interface EmailAttachment {
  filename: string;
  content: Buffer;
  contentType?: string;
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
  attachments?: EmailAttachment[];
}

interface SocialMediaData {
  whatsappUrl?: string | null;
  linkedinUrl?: string | null;
  instagramUrl?: string | null;
  threadsUrl?: string | null;
  tiktokUrl?: string | null;
  dribbbleUrl?: string | null;
  facebookUrl?: string | null;
  xUrl?: string | null;
  pinterestUrl?: string | null;
  behanceUrl?: string | null;
  telegramUrl?: string | null;
}

export class EmailService {
  private transporters: Map<string, Transporter> = new Map();
  private socialMediaCache: SocialMediaData | null = null;
  private lastCacheUpdate: number = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000;

  constructor() {
    this.initialize();
  }

  private getBaseUrl(): string {
    return process.env.REPLIT_DEV_DOMAIN 
      ? `https://${process.env.REPLIT_DEV_DOMAIN}`
      : 'https://edufiliova.com';
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
    if (this.transporters.size === 0) return false;
    try {
      const from = options.from || `"EduFiliova" <orders@edufiliova.com>`;
      const emailMatch = from.match(/<(.+?)>/);
      const senderEmail = emailMatch ? emailMatch[1] : from;
      let transporter = this.transporters.get(senderEmail) || this.transporters.get('orders@edufiliova.com');
      if (!transporter) return false;
      const baseUrl = this.getBaseUrl();
      const mailOptions: any = {
        from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        headers: {
          'X-Mailer': 'EduFiliova Mailer',
          'List-Unsubscribe': `<${baseUrl}/unsubscribe>, <mailto:unsubscribe@edufiliova.com?subject=Unsubscribe>`,
        },
      };
      if (options.attachments) {
        mailOptions.attachments = options.attachments.map(att => ({
          filename: att.filename,
          content: att.content,
          contentType: att.contentType || 'application/pdf',
        }));
      }
      await transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      return false;
    }
  }

  async sendTeacherApprovalEmail(email: string, data: { fullName: string; displayName: string }): Promise<boolean> {
    const baseUrl = this.getBaseUrl();
    const html = \`<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<style>
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f0f1f5; color: #333; }
  .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
  .header { background-color: #0C332C; padding: 40px 20px; text-align: center; color: white; }
  .content { padding: 40px; line-height: 1.6; }
  .footer { background-color: #0C332C; padding: 20px; text-align: center; color: rgba(255,255,255,0.7); font-size: 12px; }
  .button { display: inline-block; padding: 12px 30px; background-color: #e84a2a; color: white !important; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
  .hero-image { width: 100%; max-width: 600px; height: auto; display: block; }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <img src="\${baseUrl}/email-assets/bbe5722d1ffd3c84888e18335965d5e5.png" alt="EduFiliova Logo" style="max-width: 150px; margin-bottom: 20px;">
    <h1 style="margin: 0; font-size: 24px;">Welcome to the Team!</h1>
  </div>
  <img src="\${baseUrl}/email-assets/e4d45170731072cbb168266fca3fd470.png" alt="Welcome" style="width:100%; display:block;">
  <div class="content">
    <h2 style="color: #0C332C;">Congratulations \${data.fullName}!</h2>
    <p>Your teacher application for <strong>EduFiliova</strong> has been officially <strong>APPROVED</strong>.</p>
    <div style="text-align: center;">
      <a href="\${baseUrl}/teacher-login" class="button">Access Your Dashboard</a>
    </div>
    <p>Best regards,<br>The EduFiliova Team</p>
  </div>
  <div class="footer">
    <img src="\${baseUrl}/email-assets/9f7291948d8486bdd26690d0c32796e0.png" alt="Social" style="width: 24px; margin-bottom: 10px;">
    <p>© \${new Date().getFullYear()} EduFiliova. All rights reserved.</p>
  </div>
</div>
</body>
</html>\`;
    return this.sendEmail({
      to: email,
      subject: 'Congratulations! Your Teacher Application is Approved - EduFiliova',
      html,
      from: \`"EduFiliova Support" <support@edufiliova.com>\`,
    });
  }
}

export const emailService = new EmailService();
