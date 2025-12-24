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
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <style>
    body { margin: 0; padding: 0; width: 100% !important; background-color: #f4f4f4; font-family: 'Segoe UI', Arial, sans-serif; }
    .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .green-section { background-color: #0C332C; padding: 40px 20px; color: #ffffff; text-align: center; }
    .light-green-box { background-color: #a3f7b5; padding: 30px; margin: 20px; border-radius: 8px; color: #0C332C; }
    .button { display: inline-block; background-color: #ffffff; color: #0C332C; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; margin: 20px 0; }
    ul { padding-left: 20px; margin: 20px 0; }
    li { margin-bottom: 10px; }
  </style>
</head>
<body>
  <div class="email-container">
    <!-- Header -->
    <div style="background-color: #0C332C; padding: 30px; text-align: center;">
      <img src="${baseUrl}/email-assets/bbe5722d1ffd3c84888e18335965d5e5.png" alt="EduFiliova" width="200" style="display: block; margin: 0 auto;" />
      <p style="color: #ffffff; margin-top: 10px; font-size: 14px; opacity: 0.8;">Learning • Skills • Careers</p>
    </div>

    <!-- Hero Image -->
    <div style="padding: 0;">
      <img src="${baseUrl}/email-assets/e4d45170731072cbb168266fca3fd470.png" alt="Teacher Application" width="600" style="width: 100%; display: block;" />
    </div>

    <!-- Greeting -->
    <div style="padding: 40px 30px; color: #0C332C;">
      <h2 style="margin: 0 0 20px; font-size: 22px;">Hi ${data.fullName},</h2>
      <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
        We're excited to share some great news with you!
      </p>
      <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
        After a careful review of your application, qualifications, and submitted documents, we're happy to inform you that your teacher application has been successfully <strong style="color: #0C332C;">approved</strong>. You are now officially part of the EduFiliova global teaching community.
      </p>
    </div>

    <!-- What This Means Section -->
    <div style="background-color: #061f1a; color: #ffffff; padding: 15px 30px;">
      <h3 style="margin: 0; font-size: 18px;">What This Means for You</h3>
    </div>

    <div class="light-green-box">
      <img src="${baseUrl}/email-assets/df1ad55cc4e451522007cfa4378c9bbd.png" alt="Icon" width="40" style="margin-bottom: 20px;" />
      <p style="font-weight: bold; margin-bottom: 15px;">As an approved teacher on EduFiliova, you can now:</p>
      <ul style="font-size: 15px; line-height: 1.5;">
        <li>Create and publish structured courses and lessons</li>
        <li>Schedule and host live classes or meetings</li>
        <li>Assign quizzes, exercises, and learning materials</li>
        <li>Communicate with students through secure messaging</li>
        <li>Earn income through courses, live sessions, and academic services</li>
        <li>Reach students from multiple countries and education systems</li>
      </ul>
    </div>

    <!-- Availability & Guidelines -->
    <div style="padding: 0 30px 40px; color: #0C332C;">
      <h3 style="font-size: 18px; margin-bottom: 10px;">Set Your Availability (Optional)</h3>
      <p style="font-size: 15px; line-height: 1.6; margin-bottom: 25px;">
        If you plan to host live classes or meetings, set your availability to allow students to book sessions.
      </p>

      <h3 style="font-size: 18px; margin-bottom: 10px;">Review Teacher Guidelines</h3>
      <p style="font-size: 15px; line-height: 1.6;">
        Make sure you understand EduFiliova's teaching standards, content policies, and Students Rights.
      </p>
    </div>

    <!-- Second Brand Section -->
    <div style="background-color: #0C332C; padding: 30px; text-align: center;">
      <img src="${baseUrl}/email-assets/c9513ccbbd620ff1cc148b9f159cd39d.png" alt="EduFiliova" width="180" />
    </div>

    <!-- Important Notes -->
    <div style="padding: 40px 30px; color: #0C332C; border-top: 1px solid #eee;">
      <h3 style="font-size: 16px; margin: 0 0 20px; color: #666;">Important Notes</h3>
      <ul style="font-size: 14px; color: #333;">
        <li>Your account has been approved for teaching purposes only.</li>
        <li>All content is subject to periodic quality and policy review to ensure a safe learning environment.</li>
        <li>Earnings and payouts are managed through your teacher dashboard and follow our payout policies.</li>
      </ul>
    </div>

    <!-- Promo Section -->
    <div style="padding: 0 30px;">
       <img src="${baseUrl}/email-assets/9eefdace1f726880f93c5a973a54c2f6.png" alt="Start Making Money" width="540" style="width: 100%; border-radius: 15px;" />
    </div>

    <!-- Support Section -->
    <div style="padding: 40px 30px; color: #0C332C;">
      <h3 style="font-size: 18px; margin-bottom: 15px;">Support & Help</h3>
      <p style="font-size: 15px; line-height: 1.6; margin-bottom: 25px;">
        If you need help setting up your profile, creating courses, or understanding how teaching works on <strong style="color: #0C332C;">EduFiliova</strong>, we're here for you.
      </p>
      <p style="font-size: 15px; line-height: 1.6;">
        We're proud to welcome you as an educator on EduFiliova and look forward to seeing the positive impact you'll make on learners around the world.
      </p>
      <p style="margin-top: 30px; font-weight: bold;">Warm regards,</p>
      <p style="font-size: 18px; font-weight: bold; color: #0C332C;">The EduFiliova Support Team</p>
    </div>

    <!-- Footer -->
    <div style="background-color: #0C332C; padding: 40px 30px; text-align: center; color: #ffffff;">
       <h2 style="font-size: 24px; margin-bottom: 10px;">Thank you!</h2>
       <p style="font-size: 14px; opacity: 0.8; margin-bottom: 30px;">Feel free to reach out if you have any questions.</p>
       
       <div style="border-top: 1px solid rgba(255,255,255,0.2); padding-top: 20px; font-size: 12px; opacity: 0.7;">
         <p>You can unsubscribe from these emails <a href="${baseUrl}/unsubscribe" style="color: #ffffff; text-decoration: underline;">here</a>.</p>
         <p style="margin-top: 10px;">Visit the Teacher <a href="${baseUrl}/help" style="color: #ffffff; text-decoration: underline;">Help Center</a></p>
         <p style="margin-top: 10px;">Or contact us anytime at support@edufiliova.com</p>
       </div>
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
