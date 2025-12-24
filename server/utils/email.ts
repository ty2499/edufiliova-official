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
<html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"><meta name="format-detection" content="telephone=no, date=no, address=no, email=no"><meta name="x-apple-disable-message-reformatting"><style>
  body { margin: 0; padding: 0; width: 100% !important; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; background-color: #000000; }
  img { border: 0; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
  table { border-collapse: collapse !important; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
  .container { width: 100%; max-width: 600px !important; margin: 0 auto; background-color: #0C332C; }
</style></head>
<body style="margin: 0; padding: 0; background-color: #000000;">
  <center>
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #000000;">
      <tr>
        <td align="center">
          <table border="0" cellpadding="0" cellspacing="0" class="container" width="600" style="background-color: #0C332C;">
            <!-- Header Logo -->
            <tr>
              <td align="center" style="padding: 40px 0; background-color: #000000;">
                <img src="${baseUrl}/email-assets/bbe5722d1ffd3c84888e18335965d5e5.png" alt="Logo" width="180" style="display: block;">
              </td>
            </tr>
            <!-- Hero Image -->
            <tr>
              <td align="center">
                <img src="${baseUrl}/email-assets/e4d45170731072cbb168266fca3fd470.png" alt="Welcome" width="600" style="display: block; width: 100%; max-width: 600px;">
              </td>
            </tr>
            <!-- Content Area -->
            <tr>
              <td style="padding: 40px; color: #ffffff; font-family: 'Segoe UI', Arial, sans-serif;">
                <h1 style="margin: 0 0 20px; font-size: 28px; font-weight: 800; line-height: 1.2;">Welcome to the Team, ${data.fullName}!</h1>
                <p style="margin: 0 0 20px; font-size: 18px; line-height: 1.6; color: rgba(255,255,255,0.9);">
                  We are thrilled to inform you that your teacher application for <strong>EduFiliova</strong> has been officially <strong>APPROVED</strong>.
                </p>
                <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.6; color: rgba(255,255,255,0.8);">
                  You now have full access to your teacher dashboard. Join our community of educators and start shaping the future today.
                </p>
                <table border="0" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td align="center">
                      <a href="${baseUrl}/teacher-login" style="background-color: #ffffff; color: #0C332C; padding: 15px 35px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">Access Teacher Dashboard</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <!-- Decorative Section (df1ad...) -->
            <tr>
              <td align="center">
                <img src="${baseUrl}/email-assets/df1ad55cc4e451522007cfa4378c9bbd.png" alt="Decoration" width="600" style="display: block; width: 100%;">
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td align="center" style="padding: 40px 20px; background-color: #000000; color: rgba(255,255,255,0.6); font-family: Arial, sans-serif; font-size: 12px;">
                <div style="margin-bottom: 20px;">
                  <img src="${baseUrl}/email-assets/9f7291948d8486bdd26690d0c32796e0.png" alt="Social" width="24" style="display: inline-block; margin: 0 10px;">
                  <img src="${baseUrl}/email-assets/4a834058470b14425c9b32ace711ef17.png" alt="Icon" width="24" style="display: inline-block; margin: 0 10px;">
                </div>
                <p style="margin: 0;">© ${new Date().getFullYear()} EduFiliova. All rights reserved.</p>
                <p style="margin: 10px 0 0;">Modern Education for Everyone.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </center>
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
