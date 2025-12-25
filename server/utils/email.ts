import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { db } from '../db';
import { emailAccounts } from '@shared/schema';
import { eq } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

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
    const htmlPath = path.resolve(process.cwd(), 'attached_assets/email_1766617362502.html');
    let html = fs.readFileSync(htmlPath, 'utf-8');

    // Remove preloads and add iPhone font support
    html = html.replace(/<link rel="preload" as="image" href="images\/.*?">/g, '');
    
    const iphoneFontStack = `
    <style>
      body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
      body, p, h1, h2, h3, h4, span, div, td { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol" !important; }
    </style>`;
    html = html.replace('</head>', `${iphoneFontStack}</head>`);

    // Dynamic Data Injection - ensure exact replacement for placeholders
    // Using a more aggressive replacement strategy to catch various placeholder formats
    const fullName = data.fullName || 'Teacher';
    const displayName = data.displayName || data.fullName || 'Teacher';
    
    // Replace standard placeholders
    html = html.replaceAll('[[Full Name]]', fullName);
    html = html.replaceAll('[[Display Name]]', displayName);
    html = html.replaceAll('{{fullName}}', fullName);
    html = html.replaceAll('{{displayName}}', displayName);
    html = html.replaceAll('{{baseUrl}}', baseUrl);
    
    // Also catch potential hardcoded test names that might be in the template
    html = html.replaceAll('Test Teacher', fullName);
    html = html.replaceAll('Tyler Williams', fullName);
    html = html.replaceAll('Hallpt Design', fullName);

    // 1:1 replacement of EXACT relative paths from the provided HTML with CIDs
    html = html.replaceAll('images/c9513ccbbd620ff1cc148b9f159cd39d.png', 'cid:logo');
    html = html.replaceAll('images/e4d45170731072cbb168266fca3fd470.png', 'cid:banner');
    html = html.replaceAll('images/bbe5722d1ffd3c84888e18335965d5e5.png', 'cid:icon_db');
    html = html.replaceAll('images/d320764f7298e63f6b035289d4219bd8.png', 'cid:icon_pf');
    html = html.replaceAll('images/df1ad55cc4e451522007cfa4378c9bbd.png', 'cid:icon_cs');
    html = html.replaceAll('images/4a834058470b14425c9b32ace711ef17.png', 'cid:footer_logo');
    html = html.replaceAll('images/9eefdace1f726880f93c5a973a54c2f6.png', 'cid:s_fb');
    html = html.replaceAll('images/9f7291948d8486bdd26690d0c32796e0.png', 'cid:s_social');

    const assetPath = (filename: string) => path.resolve(process.cwd(), 'public/email-assets', filename);

    return this.sendEmail({
      to: email,
      subject: 'Welcome Aboard! Your Teacher Application is Approved - EduFiliova',
      html,
      from: `"EduFiliova Support" <support@edufiliova.com>`,
      attachments: [
        { filename: 'logo.png', path: assetPath('c9513ccbbd620ff1cc148b9f159cd39d_1766617371531.png'), cid: 'logo', contentType: 'image/png' },
        { filename: 'banner.png', path: assetPath('e4d45170731072cbb168266fca3fd470_1766617371537.png'), cid: 'banner', contentType: 'image/png' },
        { filename: 'idb.png', path: assetPath('bbe5722d1ffd3c84888e18335965d5e5_1766617371529.png'), cid: 'icon_db', contentType: 'image/png' },
        { filename: 'ipf.png', path: assetPath('d320764f7298e63f6b035289d4219bd8_1766617371533.png'), cid: 'icon_pf', contentType: 'image/png' },
        { filename: 'ics.png', path: assetPath('df1ad55cc4e451522007cfa4378c9bbd_1766617371535.png'), cid: 'icon_cs', contentType: 'image/png' },
        { filename: 'fl.png', path: assetPath('4a834058470b14425c9b32ace711ef17_1766617371523.png'), cid: 'footer_logo', contentType: 'image/png' },
        { filename: 'fb.png', path: assetPath('9eefdace1f726880f93c5a973a54c2f6_1766617371524.png'), cid: 's_fb', contentType: 'image/png' },
        { filename: 'social.png', path: assetPath('9f7291948d8486bdd26690d0c32796e0_1766617371526.png'), cid: 's_social', contentType: 'image/png' }
      ]
    });
  }

  async sendTeacherRejectionEmail(email: string, data: { fullName: string; displayName?: string; reason?: string }): Promise<boolean> {
    const baseUrl = this.getBaseUrl();
    const htmlPath = path.resolve(process.cwd(), 'attached_assets/email_declined_template.html');
    let html = fs.readFileSync(htmlPath, 'utf-8');

    // Remove preloads and add iPhone font support
    html = html.replace(/<link rel="preload" as="image" href="images\/.*?">/g, '');
    
    const iphoneFontStack = `
    <style>
      body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
      body, p, h1, h2, h3, h4, span, div, td { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol" !important; }
    </style>`;
    html = html.replace('</head>', `${iphoneFontStack}</head>`);

    // Dynamic Data Injection
    const fullName = data.fullName || 'Teacher';
    const dashboardUrl = `${baseUrl}/teacher/dashboard`;
    const unsubscribeLink = `${baseUrl}/unsubscribe?email=${encodeURIComponent(email)}`;
    
    // Replace placeholders
    html = html.replaceAll('{{fullName}}', fullName);
    html = html.replaceAll('{{displayName}}', data.displayName || fullName);
    html = html.replaceAll('{{dashboardUrl}}', dashboardUrl);
    html = html.replaceAll('{{unsubscribeLink}}', unsubscribeLink);
    html = html.replaceAll('{{baseUrl}}', baseUrl);

    const assetPath = (filename: string) => path.resolve(process.cwd(), 'public/email-assets', filename);

    return this.sendEmail({
      to: email,
      subject: 'Your EduFiliova Teacher Application - Next Steps',
      html,
      from: `"EduFiliova Support" <support@edufiliova.com>`,
      attachments: [
        { filename: 'logo.png', path: assetPath('c9513ccbbd620ff1cc148b9f159cd39d_1766617371531.png'), cid: 'logo', contentType: 'image/png' }
      ]
    });
  }
}

export const emailService = new EmailService();
