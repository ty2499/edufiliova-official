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

  // ✅ BULLETPROOF NAME REPLACEMENT - Force all variations to display
  private forceReplaceName(html: string, fullName: string): string {
    // Replace ALL possible variations of {{fullName}} and {{FullName}}
    const patterns = [
      '{{fullName}}',
      '{{FullName}}',
      '{{ fullName}}',
      '{{ FullName}}',
      '{{fullName }}',
      '{{FullName }}',
      '{{ fullName }}',
      '{{ FullName }}',
      '{{fullname}}',
      '{{FULLNAME}}',
    ];
    
    patterns.forEach(pattern => {
      html = html.replaceAll(pattern, fullName);
    });
    
    // Regex fallback for edge cases with spaces/variations
    html = html.replace(/\{\{\s*fullName\s*\}\}/gi, fullName);
    html = html.replace(/\{\{\s*FullName\s*\}\}/gi, fullName);
    
    return html;
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
    const htmlPath = path.resolve(process.cwd(), 'attached_assets/teacher_approval_template.html');
    let html = fs.readFileSync(htmlPath, 'utf-8');

    // Remove preloads and add iPhone font support
    html = html.replace(/<link rel="preload" as="image" href="images\/.*?">/g, '');
    
    const iphoneFontStack = `
    <style>
      body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
      body, p, h1, h2, h3, h4, span, div, td { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol" !important; }
    </style>`;
    html = html.replace('</head>', `${iphoneFontStack}</head>`);

    const fullName = data.fullName || 'Teacher';
    
    // ✅ USE BULLETPROOF NAME REPLACEMENT
    html = this.forceReplaceName(html, fullName);
    
    // Final cleanup
    html = html.replace(/\{\{baseUrl\}\}/gi, baseUrl);

    const assetPath = (filename: string) => path.resolve(process.cwd(), 'attached_assets', filename);

    return this.sendEmail({
      to: email,
      subject: 'Welcome Aboard! Your Teacher Application is Approved - EduFiliova',
      html,
      from: `"EduFiliova Support" <support@edufiliova.com>`,
      attachments: [
        { filename: 'icon_db.png', path: assetPath('bbe5722d1ffd3c84888e18335965d5e5_1766647041212.png'), cid: 'icon_db', contentType: 'image/png' },
        { filename: 'icon_curve.png', path: assetPath('c9513ccbbd620ff1cc148b9f159cd39d_1766706140594.png'), cid: 'icon_curve', contentType: 'image/png' },
        { filename: 'icon_pf.png', path: assetPath('d320764f7298e63f6b035289d4219bd8_1766647041216.png'), cid: 'icon_pf', contentType: 'image/png' },
        { filename: 'banner.png', path: assetPath('e4d45170731072cbb168266fca3fd470_1766706140600.png'), cid: 'banner', contentType: 'image/png' },
        { filename: 'corner.png', path: assetPath('df1ad55cc4e451522007cfa4378c9bbd_1766706140598.png'), cid: 'corner', contentType: 'image/png' },
        { filename: 'footer_logo.png', path: assetPath('4a834058470b14425c9b32ace711ef17_1766706140574.png'), cid: 'footer_logo', contentType: 'image/png' },
        { filename: 'teacher_img.png', path: assetPath('9eefdace1f726880f93c5a973a54c2f6_1766706140581.png'), cid: 'teacher_img', contentType: 'image/png' },
        { filename: 'social.png', path: assetPath('9f7291948d8486bdd26690d0c32796e0_1766706140583.png'), cid: 'social', contentType: 'image/png' }
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

    const fullName = data.fullName || 'Teacher';
    const displayName = data.displayName || data.fullName || 'Teacher';
    const reasonText = data.reason && data.reason.trim() ? data.reason : 'Missing documentation';

    // ✅ USE BULLETPROOF NAME REPLACEMENT FIRST
    html = this.forceReplaceName(html, fullName);

    // 1. Handle blocks
    html = html.replace(/\{\{#if reason\}\}[\s\S]*?\{\{reason\}\}[\s\S]*?\{\{\/if\}\}/gi, `Reason provided:\n\n${reasonText}`);

    // 2. Replace hardcoded placeholder names
    const hardcodedNames = [/Tyler Williams/gi, /Test Teacher/gi, /EduFiliova Teacher/gi, /Hallpt Design/gi];
    hardcodedNames.forEach(pattern => {
      html = html.replace(pattern, fullName);
    });

    // 3. Final cleanup
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

  async sendApplicationResubmittedEmail(email: string, data: { fullName: string; applicationType: 'teacher' | 'freelancer' }): Promise<boolean> {
    const baseUrl = this.getBaseUrl();
    const htmlPath = path.resolve(process.cwd(), 'attached_assets/resubmission_template.html');
    let html = fs.readFileSync(htmlPath, 'utf-8');

    // Remove preloads and add iPhone font support
    html = html.replace(/<link rel="preload" as="image" href="images\/.*?">/g, '');
    
    const iphoneFontStack = `
    <style>
      body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
      body, p, h1, h2, h3, h4, span, div, td { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol" !important; }
    </style>`;
    html = html.replace('</head>', `${iphoneFontStack}</head>`);

    const fullName = data.fullName || (data.applicationType === 'teacher' ? 'Teacher' : 'Freelancer');
    const appType = data.applicationType === 'teacher' ? 'Teacher' : 'Freelancer';
    
    // ✅ USE BULLETPROOF NAME REPLACEMENT
    html = this.forceReplaceName(html, fullName);
    
    // Final cleanup
    html = html.replace(/\{\{appType\}\}/gi, appType);
    html = html.replace(/\{\{baseUrl\}\}/gi, baseUrl);

    const assetPath = (filename: string) => path.resolve(process.cwd(), 'attached_assets', filename);

    return this.sendEmail({
      to: email,
      subject: `Your ${appType} Application Resubmission Received - EduFiliova`,
      html,
      from: `"EduFiliova Support" <support@edufiliova.com>`,
      attachments: [
        { filename: 'corner1.png', path: assetPath('db561a55b2cf0bc6e877bb934b39b700_1766707814016.png'), cid: 'corner1', contentType: 'image/png' },
        { filename: 'footer_logo.png', path: assetPath('41506b29d7f0bbde9fcb0d4afb720c70_1766707814016.png'), cid: 'footer_logo', contentType: 'image/png' },
        { filename: 'ring.png', path: assetPath('83faf7f361d9ba8dfdc904427b5b6423_1766707814014.png'), cid: 'ring', contentType: 'image/png' },
        { filename: 'social.png', path: assetPath('9f7291948d8486bdd26690d0c32796e0_1766707814013.png'), cid: 'social', contentType: 'image/png' },
        { filename: 'corner2.png', path: assetPath('3d94f798ad2bd582f8c3afe175798088_1766707814012.png'), cid: 'corner2', contentType: 'image/png' },
        { filename: 'student_img.png', path: assetPath('e521c0bfaebd7131cd0f55ee3686e87f_1766707814018.png'), cid: 'student_img', contentType: 'image/png' }
      ]
    });
  }
}

export const emailService = new EmailService();
