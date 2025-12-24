import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { db } from '../db';
import { socialMediaLinks, emailAccounts } from '@shared/schema';
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
        attachments: options.attachments || [],
        headers: {
          'X-Mailer': 'EduFiliova Mailer',
          'List-Unsubscribe': `<${baseUrl}/unsubscribe>, <mailto:unsubscribe@edufiliova.com?subject=Unsubscribe>`,
        },
      };
      
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
    const html = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"><meta name="format-detection" content="telephone=no, date=no, address=no, email=no"><meta name="x-apple-disable-message-reformatting"><meta name="keywords" content="DAG8LLZe5qE, BAG4G5R9kJI"><!--[if mso]><div>
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
      }</style><!--<![endif]--><!--[if !mso]><!--><style>@media (max-width: 200px) {
        .layout-1 {
          display: none !important;
        }
      }
@media (max-width: 200px) and (min-width: 0px) {
        .layout-1-under-200 {
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
      }</style><!--<![endif]--><!--[if !mso]><!--><style>@media (max-width: 200px) {
        .layout-3 {
          display: none !important;
        }
      }
@media (max-width: 200px) and (min-width: 0px) {
        .layout-3-under-200 {
          display: table !important;
        }
      }</style><!--<![endif]--><!--[if !mso]><!--><style>@media (max-width: 450px) {
        .layout-4 {
          display: none !important;
        }
      }
@media (max-width: 450px) and (min-width: 0px) {
        .layout-4-under-450 {
          display: table !important;
        }
      }</style><!--<![endif]--><!--[if !mso]><!--><style>@media (max-width: 1px) {
        .layout-5 {
          display: none !important;
        }
      }
@media (max-width: 1px) and (min-width: 0px) {
        .layout-5-under-1 {
          display: table !important;
        }
      }</style><!--<![endif]--></head><body style="width:100%;-webkit-text-size-adjust:100%;text-size-adjust:100%;background-color:#f0f1f5;margin:0;padding:0"><table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#f0f1f5" style="background-color:#f0f1f5"><tbody><tr><td style="background-color:#f0f1f5"><!--[if mso]><center>
                    <table align="center" border="0" cellpadding="0" cellspacing="0" width="600">
                      <tbody>
                        <tr>
                          <td><![endif]--><table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;min-height:600px;margin:0 auto;background-color:#ffffff"><tbody><tr><td style="vertical-align:top"></td></tr><tr><td style="vertical-align:top;padding:10px
           0px
           0px
           0px"><table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation"><tbody><tr><td style="padding:10px 0 10px 0;vertical-align:top"><table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="color:#000;font-style:normal;font-weight:normal;font-size:16px;line-height:1.4;letter-spacing:0;text-align:left;direction:ltr;border-collapse:collapse;font-family:Arial, Helvetica, sans-serif;white-space:normal;word-wrap:break-word;word-break:break-word"><tbody><tr><td><table border="0" cellpadding="0" cellspacing="0" class="layout-0" align="center" style="display:table;border-spacing:0px;border-collapse:separate;width:100%;max-width:100%;table-layout:fixed;margin:0 auto;background-color:#2f5a4e;border-top-left-radius:0;border-top-right-radius:0;border-bottom-left-radius:0;border-bottom-right-radius:0"><tbody><tr><td style="text-align:center;padding:12.979552793324286px 0px"><table border="0" cellpadding="0" cellspacing="0" style="border-spacing:0px;border-collapse:separate;width:100%;max-width:600px;table-layout:fixed;margin:0 auto"><tbody><tr><td width="28.12%" style="width:28.12%;box-sizing:border-box;vertical-align:bottom;border-top-left-radius:0;border-top-right-radius:0;border-bottom-left-radius:0;border-bottom-right-radius:0"><table border="0" cellpadding="0" cellspacing="0" style="border-spacing:0px;border-collapse:separate;width:100%;table-layout:fixed"><tbody><tr><td><table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="color:#000;font-style:normal;font-weight:normal;font-size:16px;line-height:1.4;letter-spacing:0;text-align:left;direction:ltr;border-collapse:collapse;font-family:Arial, Helvetica, sans-serif;white-space:normal;word-wrap:break-word;word-break:break-word"><tbody><tr><td><table cellpadding="0" cellspacing="0" border="0" style="width:100%"><tbody><tr><td align="left"><table cellpadding="0" cellspacing="0" border="0" style="border-spacing:0px;border-collapse:separate"><tbody><tr><td style="padding:0px"><img src="cid:logo" alt="EduFiliova" width="168" style="display:block;max-width:100%;height:auto;border-radius:0"></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td><td width="71.88%" style="width:71.88%;box-sizing:border-box;vertical-align:middle;border-top-left-radius:0;border-top-right-radius:0;border-bottom-left-radius:0;border-bottom-right-radius:0"><table border="0" cellpadding="0" cellspacing="0" style="border-spacing:0px;border-collapse:separate;width:100%;table-layout:fixed"><tbody><tr><td><table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="color:#000;font-style:normal;font-weight:normal;font-size:16px;line-height:1.4;letter-spacing:0;text-align:left;direction:ltr;border-collapse:collapse;font-family:Arial, Helvetica, sans-serif;white-space:normal;word-wrap:break-word;word-break:break-word"><tbody><tr><td style="padding:0px 10px"><div style="color:#ffffff;text-align:right">Learning • Skills • Careers</div></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr><tr><td style="vertical-align:top;padding:0px"><table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation"><tbody><tr><td style="padding:0px;vertical-align:top"><table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="color:#000;font-style:normal;font-weight:normal;font-size:16px;line-height:1.4;letter-spacing:0;text-align:left;direction:ltr;border-collapse:collapse;font-family:Arial, Helvetica, sans-serif;white-space:normal;word-wrap:break-word;word-break:break-word"><tbody><tr><td><table cellpadding="0" cellspacing="0" border="0" style="width:100%"><tbody><tr><td align="center"><table cellpadding="0" cellspacing="0" border="0" style="border-spacing:0px;border-collapse:separate"><tbody><tr><td style="padding:0px"><img src="cid:banner" alt="Teacher Application" width="600" style="display:block;max-width:100%;height:auto;border-radius:0"></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr><tr><td style="vertical-align:top;padding:40px 30px"><table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation"><tbody><tr><td style="padding:0px;vertical-align:top"><table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="color:#0C332C;font-style:normal;font-weight:normal;font-size:16px;line-height:1.6;letter-spacing:0;text-align:left;direction:ltr;border-collapse:collapse;font-family:Arial, Helvetica, sans-serif;white-space:normal;word-wrap:break-word;word-break:break-word"><tbody><tr><td><h2 style="margin:0 0 20px;font-size:22px;color:#0C332C">Hi ${data.fullName},</h2><p style="margin-bottom:20px">We’re excited to share some great news with you!</p><p style="margin-bottom:20px">After a careful review of your application, qualifications, and submitted documents, we’re happy to inform you that your teacher application has been successfully <strong>approved</strong>. You are now officially part of the EduFiliova global teaching community.</p></td></tr></tbody></table></td></tr></tbody></table></td></tr><tr><td style="vertical-align:top;padding:0px 30px 40px"><table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation"><tbody><tr><td style="padding:0px;vertical-align:top"><table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="color:#0C332C;font-style:normal;font-weight:normal;font-size:16px;line-height:1.6;letter-spacing:0;text-align:left;direction:ltr;border-collapse:collapse;font-family:Arial, Helvetica, sans-serif;white-space:normal;word-wrap:break-word;word-break:break-word"><tbody><tr><td style="background-color:#f9f9f9;padding:30px;border-radius:8px"><h3 style="margin:0 0 15px;font-size:18px">What This Means for You</h3><p style="margin-bottom:15px">As an approved teacher on EduFiliova, you can now:</p><ul style="margin:0;padding-left:20px"><li style="margin-bottom:10px">Create and publish structured courses and lessons</li><li style="margin-bottom:10px">Schedule and host live classes or meetings</li><li style="margin-bottom:10px">Assign quizzes, exercises, and learning materials</li><li style="margin-bottom:10px">Communicate with students through secure messaging</li><li style="margin-bottom:10px">Earn income through courses and live sessions</li><li style="margin-bottom:10px">Reach students from multiple countries</li></ul></td></tr></tbody></table></td></tr></tbody></table></td></tr><tr><td style="vertical-align:top;padding:0px 30px 40px"><table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation"><tbody><tr><td style="padding:0px;vertical-align:top"><table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="color:#0C332C;font-style:normal;font-weight:normal;font-size:16px;line-height:1.6;letter-spacing:0;text-align:left;direction:ltr;border-collapse:collapse;font-family:Arial, Helvetica, sans-serif;white-space:normal;word-wrap:break-word;word-break:break-word"><tbody><tr><td><h3 style="margin:0 0 20px;font-size:18px">Next Steps:</h3><table width="100%" border="0" cellpadding="0" cellspacing="0"><tbody><tr><td width="40" valign="top" style="padding-top:5px"><img src="cid:icon_dashboard" width="30" style="display:block"></td><td style="padding-bottom:25px;padding-left:15px"><strong>Access your Teacher Dashboard</strong><br><span style="font-size:14px;color:#666666">Log in and explore your dashboard to familiarize yourself with available tools.</span></td></tr><tr><td width="40" valign="top" style="padding-top:5px"><img src="cid:icon_profile" width="30" style="display:block"></td><td style="padding-bottom:25px;padding-left:15px"><strong>Complete Your Teacher Profile</strong><br><span style="font-size:14px;color:#666666">Add a professional photo, bio, teaching style, and subjects.</span></td></tr><tr><td width="40" valign="top" style="padding-top:5px"><img src="cid:icon_course" width="30" style="display:block"></td><td style="padding-bottom:25px;padding-left:15px"><strong>Create Your First Course</strong><br><span style="font-size:14px;color:#666666">Start with a clear, structured course aligned to a grade level you specialize in.</span></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr><tr><td style="vertical-align:top;padding:0px 30px 40px;text-align:center"><a href="${baseUrl}/login" style="background-color:#0C332C;color:#ffffff;padding:15px 35px;text-decoration:none;border-radius:5px;font-weight:bold;display:inline-block">Go to Dashboard</a></td></tr><tr><td style="vertical-align:top;padding:40px 30px;background-color:#0C332C;color:#ffffff;text-align:center;font-family:Arial, Helvetica, sans-serif"><img src="cid:footer_logo" width="150" style="margin-bottom:20px"><p style="font-size:14px;margin-bottom:20px">Empowering education globally through personalized learning experiences.</p><table align="center" border="0" cellpadding="0" cellspacing="0"><tbody><tr><td style="padding:0 10px"><a href="#"><img src="cid:social_fb" width="24" height="24"></a></td><td style="padding:0 10px"><a href="#"><img src="cid:social_ig" width="24" height="24"></a></td><td style="padding:0 10px"><a href="#"><img src="cid:social_li" width="24" height="24"></a></td><td style="padding:0 10px"><a href="#"><img src="cid:social_tw" width="24" height="24"></a></td></tr></tbody></table><p style="font-size:12px;color:#999999;margin-top:30px">© ${new Date().getFullYear()} EduFiliova. All rights reserved.<br>123 Education St, Learning City, Global</p></td></tr></tbody></table></td></tr></tbody></table></body></html>`;
    
    return this.sendEmail({
      to: email,
      subject: 'Welcome Aboard! Your Teacher Application is Approved - EduFiliova',
      html,
      from: `"EduFiliova Support" <support@edufiliova.com>`,
      attachments: [
        {
          filename: 'logo.png',
          path: './public/email-assets/c9513ccbbd620ff1cc148b9f159cd39d_1766617371531.png',
          cid: 'logo'
        },
        {
          filename: 'banner.png',
          path: './public/email-assets/e4d45170731072cbb168266fca3fd470_1766617371537.png',
          cid: 'banner'
        },
        {
          filename: 'icon_dashboard.png',
          path: './public/email-assets/bbe5722d1ffd3c84888e18335965d5e5_1766617371529.png',
          cid: 'icon_dashboard'
        },
        {
          filename: 'icon_profile.png',
          path: './public/email-assets/d320764f7298e63f6b035289d4219bd8_1766617371533.png',
          cid: 'icon_profile'
        },
        {
          filename: 'icon_course.png',
          path: './public/email-assets/df1ad55cc4e451522007cfa4378c9bbd_1766617371535.png',
          cid: 'icon_course'
        },
        {
          filename: 'footer_logo.png',
          path: './public/email-assets/4a834058470b14425c9b32ace711ef17_1766617371523.png',
          cid: 'footer_logo'
        },
        {
          filename: 'social_fb.png',
          path: './public/email-assets/9eefdace1f726880f93c5a973a54c2f6_1766617371524.png',
          cid: 'social_fb'
        },
        {
          filename: 'social_ig.png',
          path: './public/email-assets/9f7291948d8486bdd26690d0c32796e0_1766617371526.png',
          cid: 'social_ig'
        },
        {
          filename: 'social_li.png',
          path: './public/email-assets/9f7291948d8486bdd26690d0c32796e0_1766617371526.png',
          cid: 'social_li'
        },
        {
          filename: 'social_tw.png',
          path: './public/email-assets/9f7291948d8486bdd26690d0c32796e0_1766617371526.png',
          cid: 'social_tw'
        }
      ]
    });
  }
}

export const emailService = new EmailService();
