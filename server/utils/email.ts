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
    const html = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"><style>
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #000000; color: #ffffff; }
  .container { max-width: 600px; margin: 20px auto; background: #0C332C; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.5); border: 1px solid #1a4d43; }
  .header { padding: 40px 20px; text-align: center; background-color: #000000; }
  .hero-section { position: relative; width: 100%; }
  .hero-image { width: 100%; display: block; }
  .content { padding: 40px; line-height: 1.6; background-color: #0C332C; }
  .footer { background-color: #000000; padding: 30px 20px; text-align: center; color: rgba(255,255,255,0.6); font-size: 12px; }
  .button { display: inline-block; padding: 14px 35px; background-color: #ffffff; color: #0C332C !important; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 25px 0; transition: all 0.3s ease; }
  h1, h2 { color: #ffffff; margin-top: 0; }
  p { color: rgba(255,255,255,0.9); margin-bottom: 20px; }
  .social-links { margin: 20px 0; }
  .social-icon { width: 24px; margin: 0 10px; opacity: 0.8; }
</style></head>
<body>
<div class="container">
  <div class="header">
    <img src="${baseUrl}/email-assets/bbe5722d1ffd3c84888e18335965d5e5.png" alt="EduFiliova Logo" style="max-width: 180px;">
  </div>
  <div class="hero-section">
    <img src="${baseUrl}/email-assets/e4d45170731072cbb168266fca3fd470.png" alt="Welcome Aboard" class="hero-image">
  </div>
  <div class="content">
    <h1 style="font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">Welcome to the Team, ${data.fullName}!</h1>
    <p style="font-size: 18px;">We are thrilled to inform you that your teacher application for <strong>EduFiliova</strong> has been officially <strong>APPROVED</strong>.</p>
    <p>You now have full access to your teacher dashboard where you can start creating courses, managing students, and building your educational community.</p>
    <div style="text-align: center;">
      <a href="${baseUrl}/teacher-login" class="button">Access Teacher Dashboard</a>
    </div>
    <p style="font-size: 14px; color: rgba(255,255,255,0.7);">If you have any questions or need assistance getting started, our support team is always here to help.</p>
    <p>Best regards,<br><span style="font-weight: bold; color: #ffffff;">The EduFiliova Team</span></p>
  </div>
  <div class="footer">
    <div class="social-links">
      <img src="${baseUrl}/email-assets/9f7291948d8486bdd26690d0c32796e0.png" alt="Social" class="social-icon">
    </div>
    <p>© ${new Date().getFullYear()} EduFiliova. Modern Education for Everyone.</p>
    <p style="margin-top: 10px; font-size: 10px;">You're receiving this because your application was approved. If this wasn't you, please contact support.</p>
  </div>
</div>
</body></html>`;
    return this.sendEmail({
      to: email,
      subject: 'Welcome Aboard! Your Teacher Application is Approved - EduFiliova',
      html,
      from: `"EduFiliova Support" <support@edufiliova.com>`,
    });
  }
}

export const emailService = new EmailService();
