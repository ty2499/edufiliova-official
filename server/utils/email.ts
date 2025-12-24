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

    // 1:1 replacement of image paths with CIDs in the original HTML
    html = html.replace('images/c9513ccbbd620ff1cc148b9f159cd39d.png', 'cid:logo');
    html = html.replace('images/e4d45170731072cbb168266fca3fd470.png', 'cid:banner');
    html = html.replace('images/bbe5722d1ffd3c84888e18335965d5e5.png', 'cid:icon_db');
    html = html.replace('images/d320764f7298e63f6b035289d4219bd8.png', 'cid:icon_pf');
    html = html.replace('images/df1ad55cc4e451522007cfa4378c9bbd.png', 'cid:icon_cs');
    html = html.replace('images/4a834058470b14425c9b32ace711ef17.png', 'cid:footer_logo');
    html = html.replace('images/9eefdace1f726880f93c5a973a54c2f6.png', 'cid:s_fb');
    html = html.replace('images/9f7291948d8486bdd26690d0c32796e0.png', 'cid:s_social'); // Same ID for all social to match repeat pattern if needed, or specific

    // Inject dynamic data
    html = html.replace('[[Full Name]]', data.fullName);
    html = html.replace('[[Display Name]]', data.displayName);
    html = html.replaceAll('{{baseUrl}}', baseUrl);

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
        { filename: 'social.png', path: './public/email-assets/9f7291948d8486bdd26690d0c32796e0_1766617371526.png', cid: 's_social' }
      ]
    });
  }
}

export const emailService = new EmailService();
