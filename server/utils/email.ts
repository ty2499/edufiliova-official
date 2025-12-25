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
    const htmlPath = path.resolve(process.cwd(), 'server/utils/approval-template.html');
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
    
    // Explicitly replace the hardcoded "Hi {{FullName}}" or variations
    html = html.replace(/Hi\s+\{\{FullName\}\}/gi, `Hi ${fullName}`);
    html = html.replace(/Hi\s+Tyler\s+Williams/gi, `Hi ${fullName}`);
    html = html.replace(/Hi\s+\[\[Full Name\]\]/gi, `Hi ${fullName}`);

    // Final cleanup
    html = html.replace(/\{\{baseUrl\}\}/gi, baseUrl);

    // 1:1 replacement of EXACT relative paths with CIDs
    html = html.replaceAll('images/0ac9744033a7e26f12e08d761c703308.png', 'cid:logo');
    html = html.replaceAll('images/e4d45170731072cbb168266fca3fd470.png', 'cid:banner');
    html = html.replaceAll('images/bbe5722d1ffd3c84888e18335965d5e5.png', 'cid:icon_db');
    html = html.replaceAll('images/d320764f7298e63f6b035289d4219bd8.png', 'cid:icon_pf');
    html = html.replaceAll('images/7976503d64a3eef4169fe235111cdc57.png', 'cid:corner_graphic');
    html = html.replaceAll('images/4a834058470b14425c9b32ace711ef17.png', 'cid:footer_logo');
    html = html.replaceAll('images/9f7291948d8486bdd26690d0c32796e0.png', 'cid:s_social');

    const assetPath = (filename: string) => path.resolve(process.cwd(), 'public/email-assets', filename);

    return this.sendEmail({
      to: email,
      subject: 'Welcome Aboard! Your Teacher Application is Approved - EduFiliova',
      html,
      from: `"EduFiliova Support" <support@edufiliova.com>`,
      attachments: [
        { filename: 'logo.png', path: assetPath('0ac9744033a7e26f12e08d761c703308_1766647041179.png'), cid: 'logo', contentType: 'image/png' },
        { filename: 'banner.png', path: assetPath('e4d45170731072cbb168266fca3fd470_1766617371537.png'), cid: 'banner', contentType: 'image/png' },
        { filename: 'icon_db.png', path: assetPath('bbe5722d1ffd3c84888e18335965d5e5_1766647041212.png'), cid: 'icon_db', contentType: 'image/png' },
        { filename: 'icon_pf.png', path: assetPath('d320764f7298e63f6b035289d4219bd8_1766647041216.png'), cid: 'icon_pf', contentType: 'image/png' },
        { filename: 'footer_logo.png', path: assetPath('4a834058470b14425c9b32ace711ef17_1766647041186.png'), cid: 'footer_logo', contentType: 'image/png' },
        { filename: 'social.png', path: assetPath('9f7291948d8486bdd26690d0c32796e0_1766647041190.png'), cid: 's_social', contentType: 'image/png' },
        { filename: 'corner.png', path: assetPath('7976503d64a3eef4169fe235111cdc57_1766647041205.png'), cid: 'corner_graphic', contentType: 'image/png' }
      ]
    });
  }

  async sendTeacherRejectionEmail(email: string, data: { fullName: string; displayName?: string; reason?: string }): Promise<boolean> {
    const baseUrl = this.getBaseUrl();
    const htmlPath = path.resolve(process.cwd(), 'attached_assets/email_declined_teacher_1766647033808.html');
    let html = fs.readFileSync(htmlPath, 'utf-8');

    // Remove preloads and add iPhone font support
    html = html.replace(/<link rel="preload" as="image" href="images\/.*?">/g, '');
    
    const iphoneFontStack = `
    <style>
      body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
      body, p, h1, h2, h3, h4, span, div, td { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol" !important; }
    </style>`;
    html = html.replace('</head>', `${iphoneFontStack}</head>`);

    // Dynamic Data Injection - Unified high-reliability approach
    const fullName = data.fullName || 'Teacher';
    const displayName = data.displayName || data.fullName || 'Teacher';
    const reasonText = data.reason && data.reason.trim() ? data.reason : 'Missing documentation';

    // 1. Handle blocks first
    html = html.replace(/\{\{#if reason\}\}[\s\S]*?\{\{reason\}\}[\s\S]*?\{\{\/if\}\}/gi, `Reason provided:\n\n${reasonText}`);

    // 2. Aggressive fallback: Replace ANY occurrence of known hardcoded names or patterns
    const hardcodedNames = [/Tyler Williams/gi, /Test Teacher/gi, /EduFiliova Teacher/gi, /Hallpt Design/gi, /\{\{FullName\}\}/gi];
    hardcodedNames.forEach(pattern => {
      html = html.replace(pattern, fullName);
    });

    // 3. Standardize all dynamic variants
    const namePatterns = [
      /\{\{fullName\}\}/gi,
      /\{\{ fullName \}\}/gi,
      /\{\{data\.fullName\}\}/gi,
      /\{\{ data\.fullName \}\}/gi,
      /\{\{displayName\}\}/gi,
      /\{\{ displayName \}\}/gi,
      /\{\{data\.displayName\}\}/gi,
      /\{\{ data\.displayName \}\}/gi,
      /\$\{data\.fullName\}/gi,
      /\$\{fullName\}/gi,
      /\$\{data\.displayName\}/gi,
      /\$\{displayName\}/gi,
      /\[\[Full Name\]\]/gi,
      /\[\[Display Name\]\]/gi,
      /\[\[data\.fullName\]\]/gi,
      /\[\[data\.displayName\]\]/gi
    ];

    namePatterns.forEach(pattern => {
      html = html.replace(pattern, fullName);
    });

    // 4. Force replace greetings
    html = html.replace(/Hi\s+[\$]?\{[^\}]+\}/gi, `Hi ${fullName}`);
    html = html.replace(/Hi\s+\[\[[^\]]+\]\]/gi, `Hi ${fullName}`);
    html = html.replace(/Hi\s+Tyler\s+Williams/gi, `Hi ${fullName}`);

    // 5. Final cleanup
    html = html.replace(/\{\{reason\}\}/gi, reasonText);
    html = html.replace(/\{\{baseUrl\}\}/gi, baseUrl);
    html = html.replace(/\{\{#if reason\}\}/gi, '');
    html = html.replace(/\{\{\/if\}\}/gi, '');

    // 1:1 replacement of EXACT relative paths with CIDs (matching declined template images)
    html = html.replaceAll('images/bbe5722d1ffd3c84888e18335965d5e5.png', 'cid:icon_db');
    html = html.replaceAll('images/0ac9744033a7e26f12e08d761c703308.png', 'cid:logo');
    html = html.replaceAll('images/d320764f7298e63f6b035289d4219bd8.png', 'cid:icon_pf');
    html = html.replaceAll('images/4a834058470b14425c9b32ace711ef17.png', 'cid:footer_logo');
    html = html.replaceAll('images/9f7291948d8486bdd26690d0c32796e0.png', 'cid:s_social');
    html = html.replaceAll('images/917a6e905cf83da447efc0f5c2780aca.png', 'cid:teacher_img');
    html = html.replaceAll('images/de497c5361453604d8a15c4fd9bde086.png', 'cid:rejection_icon');
    html = html.replaceAll('images/e06e238bd6d74a3e48f94e5b0b81388d.png', 'cid:support_img');
    html = html.replaceAll('images/7976503d64a3eef4169fe235111cdc57.png', 'cid:corner_graphic');

    const assetPath = (filename: string) => path.resolve(process.cwd(), 'public/email-assets', filename);

    return this.sendEmail({
      to: email,
      subject: 'Application Status Update - EduFiliova Teacher Application',
      html,
      from: `"EduFiliova Support" <support@edufiliova.com>`,
      attachments: [
        { filename: 'logo.png', path: assetPath('0ac9744033a7e26f12e08d761c703308_1766647041179.png'), cid: 'logo', contentType: 'image/png' },
        { filename: 'icon_db.png', path: assetPath('bbe5722d1ffd3c84888e18335965d5e5_1766647041212.png'), cid: 'icon_db', contentType: 'image/png' },
        { filename: 'icon_pf.png', path: assetPath('d320764f7298e63f6b035289d4219bd8_1766647041216.png'), cid: 'icon_pf', contentType: 'image/png' },
        { filename: 'footer_logo.png', path: assetPath('4a834058470b14425c9b32ace711ef17_1766647041186.png'), cid: 'footer_logo', contentType: 'image/png' },
        { filename: 'social.png', path: assetPath('9f7291948d8486bdd26690d0c32796e0_1766647041190.png'), cid: 's_social', contentType: 'image/png' },
        { filename: 'teacher_img.png', path: assetPath('917a6e905cf83da447efc0f5c2780aca_1766647041197.png'), cid: 'teacher_img', contentType: 'image/png' },
        { filename: 'rejection_icon.png', path: assetPath('de497c5361453604d8a15c4fd9bde086_1766647041219.png'), cid: 'rejection_icon', contentType: 'image/png' },
        { filename: 'support_img.png', path: assetPath('e06e238bd6d74a3e48f94e5b0b81388d_1766647041222.png'), cid: 'support_img', contentType: 'image/png' },
        { filename: 'corner.png', path: assetPath('7976503d64a3eef4169fe235111cdc57_1766647041205.png'), cid: 'corner_graphic', contentType: 'image/png' }
      ]
    });
  }
}

export const emailService = new EmailService();
