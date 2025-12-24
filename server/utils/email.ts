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
    
    // The splitting issue usually happens when the HTML is malformed or includes conflicting preloads/styles.
    // I will use the EXACT HTML from the attached asset but replace image sources with CIDs.
    const html = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"><meta name="format-detection" content="telephone=no, date=no, address=no, email=no"><meta name="x-apple-disable-message-reformatting"><style>@media (max-width: 450px) { .hide-mobile { display: none !important; } .show-mobile { display: block !important; } } </style></head><body style="width:100%;background-color:#f0f1f5;margin:0;padding:0"><table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#f0f1f5"><tr><td><table align="center" width="600" border="0" cellpadding="0" cellspacing="0" style="width:600px;margin:0 auto;background-color:#ffffff"><tr><td style="background-color:#2f5a4e;padding:15px 30px"><table width="100%" border="0" cellpadding="0" cellspacing="0"><tr><td align="left"><img src="cid:logo" alt="EduFiliova" width="150" style="display:block"></td><td align="right" style="color:#ffffff;font-family:Arial,sans-serif;font-size:14px">Learning • Skills • Careers</td></tr></table></td></tr><tr><td><img src="cid:banner" alt="Welcome" width="600" style="display:block;width:100%"></td></tr><tr><td style="padding:40px 30px;font-family:Arial,sans-serif;color:#0C332C"><h2 style="margin:0 0 20px;font-size:22px">Hi ${data.fullName},</h2><p style="font-size:16px;line-height:1.6;margin-bottom:20px">We’re excited to share some great news with you!</p><p style="font-size:16px;line-height:1.6;margin-bottom:20px">After a careful review of your application, qualifications, and submitted documents, we’re happy to inform you that your teacher application has been successfully <strong>approved</strong>. You are now officially part of the EduFiliova global teaching community.</p><div style="background-color:#f9f9f9;padding:25px;border-radius:8px;margin:30px 0"><h3 style="margin:0 0 15px;font-size:18px">What This Means for You</h3><ul style="margin:0;padding-left:20px;font-size:15px"><li style="margin-bottom:8px">Create and publish structured courses and lessons</li><li style="margin-bottom:8px">Schedule and host live classes or meetings</li><li style="margin-bottom:8px">Assign quizzes and learning materials</li><li style="margin-bottom:8px">Communicate with students via secure messaging</li><li style="margin-bottom:8px">Earn income through your expertise</li></ul></div><h3 style="margin:0 0 20px;font-size:18px">Next Steps:</h3><table width="100%" border="0" cellpadding="0" cellspacing="0"><tr><td width="40" valign="top"><img src="cid:icon_dashboard" width="30"></td><td style="padding:0 0 20px 15px"><strong style="display:block">Access your Teacher Dashboard</strong><span style="font-size:14px;color:#666">Explore the tools and features available to you.</span></td></tr><tr><td width="40" valign="top"><img src="cid:icon_profile" width="30"></td><td style="padding:0 0 20px 15px"><strong style="display:block">Complete Your Profile</strong><span style="font-size:14px;color:#666">Add your photo and bio to build student trust.</span></td></tr><tr><td width="40" valign="top"><img src="cid:icon_course" width="30"></td><td style="padding:0 0 20px 15px"><strong style="display:block">Create Your First Course</strong><span style="font-size:14px;color:#666">Start sharing your knowledge with the world.</span></td></tr></table><div style="text-align:center;padding-top:30px"><a href="${baseUrl}/login" style="background-color:#0C332C;color:#ffffff;padding:15px 40px;text-decoration:none;border-radius:5px;font-weight:bold;display:inline-block">Go to Dashboard</a></div></td></tr><tr><td style="background-color:#0C332C;padding:40px 30px;color:#ffffff;text-align:center;font-family:Arial,sans-serif"><img src="cid:footer_logo" alt="EduFiliova" width="150" style="margin-bottom:20px"><p style="font-size:14px;margin-bottom:20px;color:#a3f7b5">Empowering education globally through personalized learning.</p><table align="center" border="0" cellpadding="0" cellspacing="0"><tr><td style="padding:0 10px"><a href="#"><img src="cid:social_fb" width="24" height="24"></a></td><td style="padding:0 10px"><a href="#"><img src="cid:social_ig" width="24" height="24"></a></td><td style="padding:0 10px"><a href="#"><img src="cid:social_li" width="24" height="24"></a></td><td style="padding:0 10px"><a href="#"><img src="cid:social_tw" width="24" height="24"></a></td></tr></table><p style="font-size:12px;color:#888;margin-top:30px">© ${new Date().getFullYear()} EduFiliova. All rights reserved.</p></td></tr></table></td></tr></table></body></html>`;

    return this.sendEmail({
      to: email,
      subject: 'Welcome Aboard! Your Teacher Application is Approved - EduFiliova',
      html,
      from: `"EduFiliova Support" <support@edufiliova.com>`,
      attachments: [
        { filename: 'logo.png', path: './public/email-assets/c9513ccbbd620ff1cc148b9f159cd39d_1766617371531.png', cid: 'logo' },
        { filename: 'banner.png', path: './public/email-assets/e4d45170731072cbb168266fca3fd470_1766617371537.png', cid: 'banner' },
        { filename: 'icon_db.png', path: './public/email-assets/bbe5722d1ffd3c84888e18335965d5e5_1766617371529.png', cid: 'icon_dashboard' },
        { filename: 'icon_pf.png', path: './public/email-assets/d320764f7298e63f6b035289d4219bd8_1766617371533.png', cid: 'icon_profile' },
        { filename: 'icon_cs.png', path: './public/email-assets/df1ad55cc4e451522007cfa4378c9bbd_1766617371535.png', cid: 'icon_course' },
        { filename: 'flogo.png', path: './public/email-assets/4a834058470b14425c9b32ace711ef17_1766617371523.png', cid: 'footer_logo' },
        { filename: 'fb.png', path: './public/email-assets/9eefdace1f726880f93c5a973a54c2f6_1766617371524.png', cid: 'social_fb' },
        { filename: 'ig.png', path: './public/email-assets/9f7291948d8486bdd26690d0c32796e0_1766617371526.png', cid: 'social_ig' },
        { filename: 'li.png', path: './public/email-assets/9f7291948d8486bdd26690d0c32796e0_1766617371526.png', cid: 'social_li' },
        { filename: 'tw.png', path: './public/email-assets/9f7291948d8486bdd26690d0c32796e0_1766617371526.png', cid: 'social_tw' }
      ]
    });
  }
}

export const emailService = new EmailService();
