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
      console.log('📧 No transporters initialized, re-initializing...');
      await this.initializeFromDatabase();
    }
    if (this.transporters.size === 0) {
      console.error('📧 Critical: No email transporters available after re-initialization');
      return false;
    }
    try {
      const from = options.from || `"EduFiliova" <orders@edufiliova.com>`;
      const emailMatch = from.match(/<(.+?)>/);
      const senderEmail = emailMatch ? emailMatch[1] : from;
      let transporter = this.transporters.get(senderEmail) || this.transporters.get('orders@edufiliova.com');
      
      if (!transporter) {
        console.log(`📧 Transporter for ${senderEmail} not found, using first available`);
        transporter = Array.from(this.transporters.values())[0];
      }
      
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
      console.log(`📧 Sending email to ${options.to} from ${from}...`);
      await transporter.sendMail(mailOptions);
      console.log(`✅ Email sent successfully to ${options.to}`);
      return true;
    } catch (error) {
      console.error('❌ Error in sendEmail:', error);
      return false;
    }
  }

  async sendTeacherApprovalEmail(email: string, data: { fullName: string; displayName: string }): Promise<boolean> {
    const baseUrl = this.getBaseUrl();
    const html = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><link rel="preload" as="image" href="${baseUrl}/email-assets/db561a55b2cf0bc6e877bb934b39b700.png"><link rel="preload" as="image" href="${baseUrl}/email-assets/41506b29d7f0bbde9fcb0d4afb720c70.png"><link rel="preload" as="image" href="${baseUrl}/email-assets/83faf7f361d9ba8dfdc904427b5b6423.png"><link rel="preload" as="image" href="${baseUrl}/email-assets/3d94f798ad2bd582f8c3afe175798088.png"><link rel="preload" as="image" href="${baseUrl}/email-assets/afa2a8b912b8da2c69e49d9de4a30768.png"><link rel="preload" as="image" href="${baseUrl}/email-assets/9f7291948d8486bdd26690d0c32796e0.png"><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"><meta name="format-detection" content="telephone=no, date=no, address=no, email=no"><meta name="x-apple-disable-message-reformatting"><meta name="keywords" content="DAG8LLZe5qE, BAG4G5R9kJI"><!--[if mso]><div>
                <noscript>
                  <xml>
                    <o:OfficeDocumentSettings>
                      <o:AllowPNG/>
                      <o:PixelsPerInch>96</o:PixelsPerInch>
                    </o:OfficeDocumentSettings>
                  </xml>
                </noscript></div><![endif]--><!--[if !mso]><!--><style>@media (max-width: 1px) {
        .layout-0 {
          display: none !important;
        }
      }
@media (max-width: 1px) and (min-width: 0px) {
        .layout-0-under-1 {
          display: table !important;
        }
      }</style><!--<![endif]--><!--[if !mso]><!--><style>@media (max-width: 450px) {
        .layout-1 {
          display: none !important;
        }
      }
@media (max-width: 450px) and (min-width: 0px) {
        .layout-1-under-450 {
          display: table !important;
        }
      }</style><!--<![endif]--><!--[if !mso]><!--><style>@media (max-width: 450px) {
        .layout-2 {
          display: none !important;
        }
      }
@media (max-width: 450px) and (min-width: 0px) {
        .layout-2-under-450 {
          display: table !important;
        }
      }</style><!--<![endif]--><!--[if !mso]><!--><style>@media (max-width: 1px) {
        .layout-3 {
          display: none !important;
        }
      }
@media (max-width: 1px) and (min-width: 0px) {
        .layout-3-under-1 {
          display: table !important;
        }
      }</style><!--<![endif]--></head><body style="width:100%;-webkit-text-size-adjust:100%;text-size-adjust:100%;background-color:#f0f1f5;margin:0;padding:0"><table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#f0f1f5" style="background-color:#f0f1f5"><tbody><tr><td style="background-color:#f0f1f5"><!--[if mso]><center>
                    <table align="center" border="0" cellpadding="0" cellspacing="0" width="600">
                      <tbody>
                        <tr>
                          <td><![endif]--><table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;margin:0 auto;background-color:#ffffff"><tbody><tr><td style="padding:10px 0px 0px 0px"><table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation"><tbody><tr><td style="padding:10px 0 10px 0"><table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="color:#000;font-style:normal;font-weight:normal;font-size:16px;line-height:1.4;letter-spacing:0;text-align:left;direction:ltr;border-collapse:collapse;font-family:Arial, Helvetica, sans-serif;white-space:normal;word-wrap:break-word"><tbody><tr><td style="padding:10px 0 10px 0;text-align:center"><img src="${baseUrl}/email-assets/41506b29d7f0bbde9fcb0d4afb720c70.png" alt="EduFiliova" width="200" style="display:inline-block;max-width:100%;height:auto"></td></tr><tr><td style="padding:10px 0 10px 0;text-align:center;color:#0C332C;font-weight:bold">Learning • Skills • Careers</td></tr></tbody></table></td></tr></tbody></table></td></tr><tr><td style="padding:0px"><img src="${baseUrl}/email-assets/afa2a8b912b8da2c69e49d9de4a30768.png" alt="Welcome" width="600" style="display:block;width:100%;max-width:600px;height:auto"></td></tr><tr><td style="padding:40px 30px;color:#0C332C;font-family:Arial, Helvetica, sans-serif"><h2 style="margin:0 0 20px;font-size:22px">Hi ${data.fullName},</h2><p style="font-size:16px;line-height:1.6;margin-bottom:20px">We're excited to share some great news with you!</p><p style="font-size:16px;line-height:1.6;margin-bottom:20px">After a careful review of your application, qualifications, and submitted documents, we're happy to inform you that your teacher application has been successfully <strong style="color:#0C332C">approved</strong>. You are now officially part of the EduFiliova global teaching community.</p></td></tr><tr><td style="background-color:#061f1a;padding:15px 30px;color:#ffffff;font-family:Arial, Helvetica, sans-serif"><h3 style="margin:0;font-size:18px">What This Means for You</h3></td></tr><tr><td style="padding:20px"><table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color:#a3f7b5;border-radius:8px"><tbody><tr><td style="padding:30px;color:#0C332C;font-family:Arial, Helvetica, sans-serif"><img src="${baseUrl}/email-assets/3d94f798ad2bd582f8c3afe175798088.png" alt="Icon" width="40" style="margin-bottom:20px"><p style="font-weight:bold;margin-bottom:15px">As an approved teacher on EduFiliova, you can now:</p><ul style="font-size:15px;line-height:1.5"><li>Create and publish structured courses and lessons</li><li>Schedule and host live classes or meetings</li><li>Assign quizzes, exercises, and learning materials</li><li>Communicate with students through secure messaging</li><li>Earn income through courses, live sessions, and academic services</li><li>Reach students from multiple countries and education systems</li></ul></td></tr></tbody></table></td></tr><tr><td style="padding:40px 30px;color:#0C332C;font-family:Arial, Helvetica, sans-serif;background-color:#ffffff"><h3 style="font-size:18px;margin-bottom:10px">Set Your Availability (Optional)</h3><p style="font-size:15px;line-height:1.6;margin-bottom:25px">If you plan to host live classes or meetings, set your availability to allow students to book sessions.</p><h3 style="font-size:18px;margin-bottom:10px">Review Teacher Guidelines</h3><p style="font-size:15px;line-height:1.6">Make sure you understand EduFiliova's teaching standards, content policies, and Students Rights.</p></td></tr><tr><td style="background-color:#0C332C;padding:30px;text-align:center"><img src="${baseUrl}/email-assets/9f7291948d8486bdd26690d0c32796e0.png" alt="EduFiliova" width="180"></td></tr><tr><td style="padding:40px 30px;color:#0C332C;font-family:Arial, Helvetica, sans-serif;border-top:1px solid #eee;background-color:#ffffff"><h3 style="font-size:16px;margin:0 0 20px;color:#666">Important Notes</h3><ul style="font-size:14px;color:#333"><li>Your account has been approved for teaching purposes only.</li><li>All content is subject to periodic quality and policy review to ensure a safe learning environment.</li><li>Earnings and payouts are managed through your teacher dashboard and follow our payout policies.</li></ul></td></tr><tr><td style="padding:40px 30px;color:#0C332C;font-family:Arial, Helvetica, sans-serif;background-color:#ffffff"><h3 style="font-size:18px;margin-bottom:15px">Support & Help</h3><p style="font-size:15px;line-height:1.6;margin-bottom:25px">If you need help setting up your profile, creating courses, or understanding how teaching works on <strong style="color:#0C332C">EduFiliova</strong>, we're here for you.</p><p style="font-size:15px;line-height:1.6">We're proud to welcome you as an educator on EduFiliova and look forward to seeing the positive impact you'll make on learners around the world.</p><p style="margin-top:30px;font-weight:bold">Warm regards,</p><p style="font-size:18px;font-weight:bold;color:#0C332C">The EduFiliova Support Team</p></td></tr><tr><td style="background-color:#0C332C;padding:40px 30px;text-align:center;color:#ffffff;font-family:Arial, Helvetica, sans-serif"><h2 style="font-size:24px;margin-bottom:10px">Thank you!</h2><p style="font-size:14px;opacity:0.8;margin-bottom:30px">Feel free to reach out if you have any questions.</p><div style="border-top:1px solid rgba(255,255,255,0.2);padding-top:20px;font-size:12px;opacity:0.7"><p>You can unsubscribe from these emails <a href="${baseUrl}/unsubscribe" style="color:#ffffff;text-decoration:underline">here</a>.</p><p style="margin-top:10px">Visit the Teacher <a href="${baseUrl}/help" style="color:#ffffff;text-decoration:underline">Help Center</a></p><p style="margin-top:10px">Or contact us anytime at support@edufiliova.com</p></div></td></tr></tbody></table><!--[if mso]></td></tr></tbody></table></center><![endif]--></td></tr></tbody></table></body></html>`;
    return this.sendEmail({
      to: email,
      subject: 'Welcome Aboard! Your Teacher Application is Approved - EduFiliova',
      html,
      from: `"EduFiliova Support" <support@edufiliova.com>`,
    });
  }
}

export const emailService = new EmailService();
