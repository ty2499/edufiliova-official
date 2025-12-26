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
    // 1️⃣ FIRST: Handle specific split pattern from device login template
    // Pattern: Hi {{full</span><span...>Name}</span><span...>},
    html = html.replace(/Hi {{full<\/span><span[^>]*>Name}<\/span><span[^>]*>},/gi, `Hi ${fullName},`);
    html = html.replace(/Hi {{Full<\/span><span[^>]*>Name}<\/span><span[^>]*>},/gi, `Hi ${fullName},`);
    
    // Also handle without the comma/spans
    html = html.replace(/\{\{full<\/span><span[^>]*>Name\}\}/gi, fullName);
    html = html.replace(/\{\{Full<\/span><span[^>]*>Name\}\}/gi, fullName);
    
    // 2️⃣ SECOND: Merge split placeholders caused by HTML spans
    // Handles: {{</span><span...>fullName</span><span...>}} format
    // More flexible regex that captures any content before/after the key parts
    html = html.replace(/\{\{[^<]*<\/span><span[^>]*>fullName<\/span><span[^>]*>[^}]*\}\}/gi, '{{fullName}}');
    html = html.replace(/\{\{[^<]*<\/span><span[^>]*>FullName<\/span><span[^>]*>[^}]*\}\}/gi, '{{FullName}}');
    
    // Handle cases where fullName is the only content
    html = html.replace(/\{\{<\/span><span[^>]*>fullName<\/span><span[^>]*>\}\}/gi, '{{fullName}}');
    html = html.replace(/\{\{<\/span><span[^>]*>FullName<\/span><span[^>]*>\}\}/gi, '{{FullName}}');
    
    // 3️⃣ THEN: Replace ALL possible variations of {{fullName}} and {{FullName}}
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
    
    // 4️⃣ Regex fallback for edge cases with spaces/variations
    html = html.replace(/\{\{\s*fullName\s*\}\}/gi, fullName);
    html = html.replace(/\{\{\s*FullName\s*\}\}/gi, fullName);
    
    // 5️⃣ Last resort: Look for any remaining {{ and }} that might contain variations
    // This catches edge cases like {{  fullName  }} with extra spaces
    html = html.replace(/\{\{\s*(?:full|Full)Name\s*\}\}/gi, fullName);
    
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

  async sendFreelancerApprovalEmail(email: string, data: { fullName: string; displayName?: string }): Promise<boolean> {
    const baseUrl = this.getBaseUrl();
    const htmlPath = path.resolve(process.cwd(), 'attached_assets/freelancer_approval_template.html');
    let html = fs.readFileSync(htmlPath, 'utf-8');

    // Remove preloads and add iPhone font support
    html = html.replace(/<link rel="preload" as="image" href="images\/.*?">/g, '');
    
    const iphoneFontStack = `
    <style>
      body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
      body, p, h1, h2, h3, h4, span, div, td { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol" !important; }
    </style>`;
    html = html.replace('</head>', `${iphoneFontStack}</head>`);

    const fullName = data.fullName || 'Freelancer';
    
    // ✅ USE BULLETPROOF NAME REPLACEMENT
    html = this.forceReplaceName(html, fullName);
    
    // Final cleanup
    html = html.replace(/\{\{baseUrl\}\}/gi, baseUrl);

    const assetPath = (filename: string) => path.resolve(process.cwd(), 'attached_assets', filename);

    return this.sendEmail({
      to: email,
      subject: 'Welcome Aboard! Your Freelancer Application is Approved - EduFiliova',
      html,
      from: `"EduFiliova Support" <support@edufiliova.com>`,
      attachments: [
        { filename: 'ring_green.png', path: assetPath('bbe5722d1ffd3c84888e18335965d5e5_1766708445700.png'), cid: 'ring_green', contentType: 'image/png' },
        { filename: 'logo.png', path: assetPath('3c3a32d57b55881831d31127dddaf32b_1766708445697.png'), cid: 'logo', contentType: 'image/png' },
        { filename: 'ring_green2.png', path: assetPath('d320764f7298e63f6b035289d4219bd8_1766708445702.png'), cid: 'ring_green2', contentType: 'image/png' },
        { filename: 'edu_logo.png', path: assetPath('4a834058470b14425c9b32ace711ef17_1766708445698.png'), cid: 'edu_logo', contentType: 'image/png' },
        { filename: 'edu_logo2.png', path: assetPath('9f7291948d8486bdd26690d0c32796e0_1766708445699.png'), cid: 'edu_logo2', contentType: 'image/png' },
        { filename: 'freelancer_img.png', path: assetPath('5079c2203be6bb217e9e7c150f5f0d60_1766708445700.png'), cid: 'freelancer_img', contentType: 'image/png' },
        { filename: 'money_img.png', path: assetPath('c147000ffb2efef7ba64fa6ce5415a30_1766708445701.png'), cid: 'money_img', contentType: 'image/png' },
        { filename: 'corner.png', path: assetPath('3d94f798ad2bd582f8c3afe175798088_1766708445698.png'), cid: 'corner', contentType: 'image/png' }
      ]
    });
  }

  async sendFreelancerApplicationStatusEmail(email: string, data: { fullName: string; status: 'pending' | 'under_review' | 'approved' | 'rejected'; rejectionReason?: string }): Promise<boolean> {
    // Route to appropriate email based on status
    if (data.status === 'approved') {
      return this.sendFreelancerApprovalEmail(email, { fullName: data.fullName });
    } else if (data.status === 'rejected') {
      // Use teacher rejection template for now as fallback
      return this.sendFreelancerRejectionEmail(email, { fullName: data.fullName, reason: data.rejectionReason });
    }
    return false;
  }

  async sendFreelancerRejectionEmail(email: string, data: { fullName: string; reason?: string }): Promise<boolean> {
    const baseUrl = this.getBaseUrl();
    // Use freelancer-specific decline template
    const htmlPath = path.resolve(process.cwd(), 'attached_assets/freelancer_decline_template.html');
    let html = fs.readFileSync(htmlPath, 'utf-8');

    // Remove preloads and add iPhone font support
    html = html.replace(/<link rel="preload" as="image" href="[^"]*">/g, '');
    
    const iphoneFontStack = `
    <style>
      body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
      body, p, h1, h2, h3, h4, span, div, td { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol" !important; }
    </style>`;
    html = html.replace('</head>', `${iphoneFontStack}</head>`);

    const fullName = data.fullName || 'Freelancer';
    const reasonText = data.reason && data.reason.trim() ? data.reason : 'Missing documentation';

    // ✅ USE BULLETPROOF NAME REPLACEMENT FIRST - THIS IS CRITICAL
    html = this.forceReplaceName(html, fullName);

    // Handle conditional reason blocks
    html = html.replace(/\{\{#if rejectionReason\}\}[\s\S]*?\{\{rejectionReason\}\}[\s\S]*?\{\{\/if\}\}/gi, `Reason provided: ${reasonText}`);

    // Final cleanup
    html = html.replace(/\{\{rejectionReason\}\}/gi, reasonText);
    html = html.replace(/\{\{baseUrl\}\}/gi, baseUrl);
    html = html.replace(/\{\{#if rejectionReason\}\}/gi, '');
    html = html.replace(/\{\{\/if\}\}/gi, '');

    // Replace image paths with CIDs
    html = html.replaceAll('images/b3f1ba1bfd2e78319f53bcae30119f17.png', 'cid:freelancer_working');
    html = html.replaceAll('images/de497c5361453604d8a15c4fd9bde086.png', 'cid:rejection_icon');
    html = html.replaceAll('images/3d94f798ad2bd582f8c3afe175798088.png', 'cid:corner');
    html = html.replaceAll('images/4a834058470b14425c9b32ace711ef17.png', 'cid:footer_logo');
    html = html.replaceAll('images/9f7291948d8486bdd26690d0c32796e0.png', 'cid:social');
    html = html.replaceAll('images/8889f49340b6e80a36b597a426a461b7.png', 'cid:freelancer_label');

    const assetPath = (filename: string) => path.resolve(process.cwd(), 'attached_assets', filename);

    return this.sendEmail({
      to: email,
      subject: 'Freelancer Application Status Update - EduFiliova',
      html,
      from: `"EduFiliova Support" <support@edufiliova.com>`,
      attachments: [
        { filename: 'freelancer_working.png', path: assetPath('b3f1ba1bfd2e78319f53bcae30119f17_1766709122259.png'), cid: 'freelancer_working', contentType: 'image/png' },
        { filename: 'rejection_icon.png', path: assetPath('de497c5361453604d8a15c4fd9bde086_1766709122260.png'), cid: 'rejection_icon', contentType: 'image/png' },
        { filename: 'corner.png', path: assetPath('3d94f798ad2bd582f8c3afe175798088_1766709122256.png'), cid: 'corner', contentType: 'image/png' },
        { filename: 'footer_logo.png', path: assetPath('4a834058470b14425c9b32ace711ef17_1766709122257.png'), cid: 'footer_logo', contentType: 'image/png' },
        { filename: 'social.png', path: assetPath('9f7291948d8486bdd26690d0c32796e0_1766709122257.png'), cid: 'social', contentType: 'image/png' },
        { filename: 'freelancer_label.png', path: assetPath('8889f49340b6e80a36b597a426a461b7_1766709122258.png'), cid: 'freelancer_label', contentType: 'image/png' }
      ]
    });
  }

  async sendFreelancerSubmissionEmail(email: string, data: { fullName: string; displayName?: string }): Promise<boolean> {
    const baseUrl = this.getBaseUrl();
    const htmlPath = path.resolve(process.cwd(), 'attached_assets/freelancer_submission_template.html');
    let html = fs.readFileSync(htmlPath, 'utf-8');

    // Remove preloads and add iPhone font support
    html = html.replace(/<link rel="preload" as="image" href="[^"]*">/g, '');
    
    const iphoneFontStack = `
    <style>
      body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
      body, p, h1, h2, h3, h4, span, div, td { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol" !important; }
    </style>`;
    html = html.replace('</head>', `${iphoneFontStack}</head>`);

    const fullName = data.fullName || 'Freelancer';
    
    // ✅ USE BULLETPROOF NAME REPLACEMENT
    html = this.forceReplaceName(html, fullName);
    
    // Final cleanup
    html = html.replace(/\{\{baseUrl\}\}/gi, baseUrl);

    // Replace image paths with CIDs
    html = html.replaceAll('images/f7daaf49aba7bad7f235cf99406c847a.png', 'cid:freelancer_happy');
    html = html.replaceAll('images/d249f4ce7bc112aa2f2b471a0d9e4605.png', 'cid:freelancer_working');
    html = html.replaceAll('images/3d94f798ad2bd582f8c3afe175798088.png', 'cid:corner');
    html = html.replaceAll('images/4a834058470b14425c9b32ace711ef17.png', 'cid:footer_logo');
    html = html.replaceAll('images/9f7291948d8486bdd26690d0c32796e0.png', 'cid:social');

    const assetPath = (filename: string) => path.resolve(process.cwd(), 'attached_assets', filename);

    return this.sendEmail({
      to: email,
      subject: 'Your Freelancer Application Has Been Received - EduFiliova',
      html,
      from: `"EduFiliova Support" <support@edufiliova.com>`,
      attachments: [
        { filename: 'freelancer_happy.png', path: assetPath('f7daaf49aba7bad7f235cf99406c847a_1766709377644.png'), cid: 'freelancer_happy', contentType: 'image/png' },
        { filename: 'freelancer_working.png', path: assetPath('d249f4ce7bc112aa2f2b471a0d9e4605_1766709377643.png'), cid: 'freelancer_working', contentType: 'image/png' },
        { filename: 'corner.png', path: assetPath('3d94f798ad2bd582f8c3afe175798088_1766709377640.png'), cid: 'corner', contentType: 'image/png' },
        { filename: 'footer_logo.png', path: assetPath('4a834058470b14425c9b32ace711ef17_1766709377641.png'), cid: 'footer_logo', contentType: 'image/png' },
        { filename: 'social.png', path: assetPath('9f7291948d8486bdd26690d0c32796e0_1766709377642.png'), cid: 'social', contentType: 'image/png' }
      ]
    });
  }

  async sendFreelancerPendingEmail(email: string, data: { fullName: string; displayName?: string }): Promise<boolean> {
    const baseUrl = this.getBaseUrl();
    const htmlPath = path.resolve(process.cwd(), 'attached_assets/freelancer_pending_template.html');
    let html = fs.readFileSync(htmlPath, 'utf-8');

    // Remove preloads and add iPhone font support
    html = html.replace(/<link rel="preload" as="image" href="[^"]*">/g, '');
    
    const iphoneFontStack = `
    <style>
      body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
      body, p, h1, h2, h3, h4, span, div, td { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol" !important; }
    </style>`;
    html = html.replace('</head>', `${iphoneFontStack}</head>`);

    const fullName = data.fullName || 'Freelancer';
    
    // ✅ USE BULLETPROOF NAME REPLACEMENT
    html = this.forceReplaceName(html, fullName);
    
    // Final cleanup
    html = html.replace(/\{\{baseUrl\}\}/gi, baseUrl);

    // Replace image paths with CIDs
    html = html.replaceAll('images/05e55bd45b360af065b59fc6f57acfee.png', 'cid:freelancer_laptop');
    html = html.replaceAll('images/2085c996cc224d012156b3a727be8488.png', 'cid:freelancer_worker');
    html = html.replaceAll('images/3d94f798ad2bd582f8c3afe175798088.png', 'cid:corner');
    html = html.replaceAll('images/4a834058470b14425c9b32ace711ef17.png', 'cid:footer_logo');
    html = html.replaceAll('images/9f7291948d8486bdd26690d0c32796e0.png', 'cid:social');

    const assetPath = (filename: string) => path.resolve(process.cwd(), 'attached_assets', filename);

    return this.sendEmail({
      to: email,
      subject: 'Your Freelancer Application Status: Pending - EduFiliova',
      html,
      from: `"EduFiliova Support" <support@edufiliova.com>`,
      attachments: [
        { filename: 'freelancer_laptop.png', path: assetPath('05e55bd45b360af065b59fc6f57acfee_1766709613136.png'), cid: 'freelancer_laptop', contentType: 'image/png' },
        { filename: 'freelancer_worker.png', path: assetPath('2085c996cc224d012156b3a727be8488_1766709613139.png'), cid: 'freelancer_worker', contentType: 'image/png' },
        { filename: 'corner.png', path: assetPath('3d94f798ad2bd582f8c3afe175798088_1766709613132.png'), cid: 'corner', contentType: 'image/png' },
        { filename: 'footer_logo.png', path: assetPath('4a834058470b14425c9b32ace711ef17_1766709613134.png'), cid: 'footer_logo', contentType: 'image/png' },
        { filename: 'social.png', path: assetPath('9f7291948d8486bdd26690d0c32796e0_1766709613137.png'), cid: 'social', contentType: 'image/png' }
      ]
    });
  }

  async sendTeacherPendingEmail(email: string, data: { fullName: string; displayName?: string }): Promise<boolean> {
    const baseUrl = this.getBaseUrl();
    const htmlPath = path.resolve(process.cwd(), 'attached_assets/teacher_submission_template.html');
    let html = fs.readFileSync(htmlPath, 'utf-8');

    // Remove preloads and add iPhone font support
    html = html.replace(/<link rel="preload" as="image" href="[^"]*">/g, '');
    
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

    // Replace image paths with CIDs
    html = html.replaceAll('images/98fc7367ed0e72d7900d5717bd41ec08.png', 'cid:teacher_banner');
    html = html.replaceAll('images/3d94f798ad2bd582f8c3afe175798088.png', 'cid:corner');
    html = html.replaceAll('images/4a834058470b14425c9b32ace711ef17.png', 'cid:footer_logo');
    html = html.replaceAll('images/9f7291948d8486bdd26690d0c32796e0.png', 'cid:social');

    const assetPath = (filename: string) => path.resolve(process.cwd(), 'attached_assets', filename);

    return this.sendEmail({
      to: email,
      subject: 'Application Under Review - Your Teacher Application at EduFiliova',
      html,
      from: `"EduFiliova Support" <support@edufiliova.com>`,
      attachments: [
        { filename: 'teacher_banner.png', path: assetPath('98fc7367ed0e72d7900d5717bd41ec08_1766710681996.png'), cid: 'teacher_banner', contentType: 'image/png' },
        { filename: 'corner.png', path: assetPath('3d94f798ad2bd582f8c3afe175798088_1766710681979.png'), cid: 'corner', contentType: 'image/png' },
        { filename: 'footer_logo.png', path: assetPath('4a834058470b14425c9b32ace711ef17_1766710681986.png'), cid: 'footer_logo', contentType: 'image/png' },
        { filename: 'social.png', path: assetPath('9f7291948d8486bdd26690d0c32796e0_1766710681990.png'), cid: 'social', contentType: 'image/png' }
      ]
    });
  }

  async sendSubscriptionConfirmationEmail(email: string, data: { customerName: string; planName: string; billingCycle: string; orderId: string; price: string; activationDate: string; nextBillingDate?: string; dashboardUrl?: string }): Promise<boolean> {
    const baseUrl = this.getBaseUrl();
    const htmlPath = path.resolve(process.cwd(), 'attached_assets/subscription_confirmation_template.html');
    let html = fs.readFileSync(htmlPath, 'utf-8');

    // Remove preloads and add iPhone font support
    html = html.replace(/<link rel="preload" as="image" href="[^"]*">/g, '');
    
    const iphoneFontStack = `
    <style>
      body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
      body, p, h1, h2, h3, h4, span, div, td { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol" !important; }
    </style>`;
    html = html.replace('</head>', `${iphoneFontStack}</head>`);

    const customerName = data.customerName || 'Valued Customer';
    const planName = data.planName || 'Premium Plan';
    const billingCycle = data.billingCycle || 'Monthly';
    const orderId = data.orderId || 'N/A';
    const price = data.price || '0';
    const activationDate = data.activationDate || new Date().toLocaleDateString();
    const nextBillingDate = data.nextBillingDate || '';
    const dashboardUrl = data.dashboardUrl || `${baseUrl}/dashboard`;

    // Replace split placeholders directly with values (spans break up variables)
    html = html.replace(/\{\{[^<]*<\/span><span[^>]*>customerName<\/span><span[^>]*>[^}]*\}\}/gi, customerName);
    html = html.replace(/\{\{[^<]*<\/span><span[^>]*>planName<\/span><span[^>]*>[^}]*\}\}/gi, planName);
    html = html.replace(/\{\{[^<]*<\/span><span[^>]*>billingCycle<\/span><span[^>]*>[^}]*\}\}/gi, billingCycle);
    html = html.replace(/\{\{[^<]*<\/span><span[^>]*>orderId<\/span><span[^>]*>[^}]*\}\}/gi, orderId);
    html = html.replace(/\{\{[^<]*<\/span><span[^>]*>price<\/span><span[^>]*>[^}]*\}\}/gi, price);
    html = html.replace(/\{\{[^<]*<\/span><span[^>]*>activationDate<\/span><span[^>]*>[^}]*\}\}/gi, activationDate);
    html = html.replace(/\{\{[^<]*<\/span><span[^>]*>nextBillingDate<\/span><span[^>]*>[^}]*\}\}/gi, nextBillingDate);
    html = html.replace(/\{\{[^<]*<\/span><span[^>]*>dashboardUrl<\/span><span[^>]*>[^}]*\}\}/gi, dashboardUrl);
    
    // Replace any remaining simple placeholders
    html = html.replace(/\{\{customerName\}\}/gi, customerName);
    html = html.replace(/\{\{planName\}\}/gi, planName);
    html = html.replace(/\{\{billingCycle\}\}/gi, billingCycle);
    html = html.replace(/\{\{orderId\}\}/gi, orderId);
    html = html.replace(/\{\{price\}\}/gi, price);
    html = html.replace(/\{\{activationDate\}\}/gi, activationDate);
    html = html.replace(/\{\{nextBillingDate\}\}/gi, nextBillingDate);
    html = html.replace(/\{\{dashboardUrl\}\}/gi, dashboardUrl);
    html = html.replace(/\{\{baseUrl\}\}/gi, baseUrl);

    // Handle conditional next billing date
    if (nextBillingDate && nextBillingDate.trim()) {
      html = html.replace(/\{\{#if nextBillingDate\}\}[\s\S]*?\{\{\/if\}\}/gi, ` - Next Billing Date: ${nextBillingDate}`);
    } else {
      html = html.replace(/\{\{#if nextBillingDate\}\}[\s\S]*?\{\{\/if\}\}/gi, '');
    }

    // Replace image paths with CIDs
    html = html.replaceAll('images/bbe5722d1ffd3c84888e18335965d5e5.png', 'cid:icon1');
    html = html.replaceAll('images/292db72c5a7a0299db100d17711b8c55.png', 'cid:logo');
    html = html.replaceAll('images/d320764f7298e63f6b035289d4219bd8.png', 'cid:icon2');
    html = html.replaceAll('images/3d94f798ad2bd582f8c3afe175798088.png', 'cid:corner');
    html = html.replaceAll('images/970fad9d41d01c4ad6d96829f4d86901.png', 'cid:footer_logo');
    html = html.replaceAll('images/21c7f785caa53e237dcae6848c7f0f88.png', 'cid:hero');
    html = html.replaceAll('images/9f7291948d8486bdd26690d0c32796e0.png', 'cid:social');

    const assetPath = (filename: string) => path.resolve(process.cwd(), 'attached_assets', filename);

    return this.sendEmail({
      to: email,
      subject: `Welcome to ${planName}! Your Subscription is Active - EduFiliova`,
      html,
      from: `"EduFiliova Billing" <support@edufiliova.com>`,
      attachments: [
        { filename: 'icon1.png', path: assetPath('bbe5722d1ffd3c84888e18335965d5e5_1766711046597.png'), cid: 'icon1', contentType: 'image/png' },
        { filename: 'logo.png', path: assetPath('292db72c5a7a0299db100d17711b8c55_1766711046593.png'), cid: 'logo', contentType: 'image/png' },
        { filename: 'icon2.png', path: assetPath('d320764f7298e63f6b035289d4219bd8_1766711046599.png'), cid: 'icon2', contentType: 'image/png' },
        { filename: 'corner.png', path: assetPath('3d94f798ad2bd582f8c3afe175798088_1766711046588.png'), cid: 'corner', contentType: 'image/png' },
        { filename: 'footer_logo.png', path: assetPath('970fad9d41d01c4ad6d96829f4d86901_1766711046595.png'), cid: 'footer_logo', contentType: 'image/png' },
        { filename: 'hero.png', path: assetPath('21c7f785caa53e237dcae6848c7f0f88_1766711046592.png'), cid: 'hero', contentType: 'image/png' },
        { filename: 'social.png', path: assetPath('9f7291948d8486bdd26690d0c32796e0_1766711046589.png'), cid: 'social', contentType: 'image/png' }
      ]
    });
  }

  async sendPaymentFailedEmail(email: string, data: { customerName: string; orderId: string; amount: string; reason?: string; retryPaymentUrl?: string }): Promise<boolean> {
    const baseUrl = this.getBaseUrl();
    const htmlPath = path.resolve(process.cwd(), 'attached_assets/payment_failed_template.html');
    let html = fs.readFileSync(htmlPath, 'utf-8');

    // Remove preloads and add iPhone font support
    html = html.replace(/<link rel="preload" as="image" href="[^"]*">/g, '');
    
    const iphoneFontStack = `
    <style>
      body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
      body, p, h1, h2, h3, h4, span, div, td { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol" !important; }
    </style>`;
    html = html.replace('</head>', `${iphoneFontStack}</head>`);

    const customerName = data.customerName || 'Valued Customer';
    const orderId = data.orderId || 'N/A';
    const amount = data.amount || '0';
    const reason = data.reason || '';
    const retryPaymentUrl = data.retryPaymentUrl || `${baseUrl}/retry-payment`;

    // Replace split placeholders directly with values
    html = html.replace(/\{\{[^<]*<\/span><span[^>]*>customerName<\/span><span[^>]*>[^}]*\}\}/gi, customerName);
    html = html.replace(/\{\{[^<]*<\/span><span[^>]*>orderId<\/span><span[^>]*>[^}]*\}\}/gi, orderId);
    html = html.replace(/\{\{[^<]*<\/span><span[^>]*>amount<\/span><span[^>]*>[^}]*\}\}/gi, amount);
    html = html.replace(/\{\{[^<]*<\/span><span[^>]*>reason<\/span><span[^>]*>[^}]*\}\}/gi, reason);
    html = html.replace(/\{\{[^<]*<\/span><span[^>]*>retryPaymentUrl<\/span><span[^>]*>[^}]*\}\}/gi, retryPaymentUrl);
    
    // Replace any remaining simple placeholders
    html = html.replace(/\{\{customerName\}\}/gi, customerName);
    html = html.replace(/\{\{orderId\}\}/gi, orderId);
    html = html.replace(/\{\{amount\}\}/gi, amount);
    html = html.replace(/\{\{reason\}\}/gi, reason);
    html = html.replace(/\{\{retryPaymentUrl\}\}/gi, retryPaymentUrl);
    html = html.replace(/\{\{baseUrl\}\}/gi, baseUrl);

    // Handle conditional reason
    if (reason && reason.trim()) {
      html = html.replace(/\{\{#if reason\}\}[\s\S]*?\{\{\/if\}\}/gi, ` - Reason: ${reason}`);
    } else {
      html = html.replace(/\{\{#if reason\}\}[\s\S]*?\{\{\/if\}\}/gi, '');
    }

    // Replace image paths with CIDs
    html = html.replaceAll('images/bbe5722d1ffd3c84888e18335965d5e5.png', 'cid:icon1');
    html = html.replaceAll('images/2f9cbc8b998ed01d09dd6fe1193c00f1.png', 'cid:logo1');
    html = html.replaceAll('images/d320764f7298e63f6b035289d4219bd8.png', 'cid:icon2');
    html = html.replaceAll('images/3d94f798ad2bd582f8c3afe175798088.png', 'cid:corner');
    html = html.replaceAll('images/53185829a16faf137a533f19db64d893.png', 'cid:logo2');
    html = html.replaceAll('images/bdcb48fcab505623e33c405af5c98429.png', 'cid:hero');
    html = html.replaceAll('images/9f7291948d8486bdd26690d0c32796e0.png', 'cid:social');

    const assetPath = (filename: string) => path.resolve(process.cwd(), 'attached_assets', filename);

    return this.sendEmail({
      to: email,
      subject: 'Payment Failed - Please Retry - EduFiliova',
      html,
      from: `"EduFiliova Billing" <support@edufiliova.com>`,
      attachments: [
        { filename: 'icon1.png', path: assetPath('bbe5722d1ffd3c84888e18335965d5e5_1766712061938.png'), cid: 'icon1', contentType: 'image/png' },
        { filename: 'logo1.png', path: assetPath('2f9cbc8b998ed01d09dd6fe1193c00f1_1766712061927.png'), cid: 'logo1', contentType: 'image/png' },
        { filename: 'icon2.png', path: assetPath('d320764f7298e63f6b035289d4219bd8_1766712061942.png'), cid: 'icon2', contentType: 'image/png' },
        { filename: 'corner.png', path: assetPath('3d94f798ad2bd582f8c3afe175798088_1766712061929.png'), cid: 'corner', contentType: 'image/png' },
        { filename: 'logo2.png', path: assetPath('53185829a16faf137a533f19db64d893_1766712061936.png'), cid: 'logo2', contentType: 'image/png' },
        { filename: 'hero.png', path: assetPath('bdcb48fcab505623e33c405af5c98429_1766712061940.png'), cid: 'hero', contentType: 'image/png' },
        { filename: 'social.png', path: assetPath('9f7291948d8486bdd26690d0c32796e0_1766712061933.png'), cid: 'social', contentType: 'image/png' }
      ]
    });
  }

  async sendMeetingReminderEmail(email: string, data: { studentName?: string; fullName?: string; teacherName: string; meetingTime: Date; meetingLink?: string; meetingTitle: string; meetingType?: string }): Promise<boolean> {
    const htmlPath = path.resolve(process.cwd(), 'attached_assets/meeting_reminder_template.html');
    let html = fs.readFileSync(htmlPath, 'utf-8');

    const fullName = data.fullName || data.studentName || 'Student';
    const teacherName = data.teacherName || 'Your Instructor';
    const meetingTime = data.meetingTime instanceof Date ? data.meetingTime.toLocaleString() : new Date(data.meetingTime).toLocaleString();
    const meetingTitle = data.meetingTitle || 'Class Meeting';
    const meetingType = data.meetingType || 'Standard Class';

    // Replace all dynamic placeholders
    // First replace simple ones without HTML tags
    html = html.replace(/\{\{meetingTitle\}\}/g, meetingTitle);
    html = html.replace(/\{\{teacherName\}\}/g, teacherName);
    html = html.replace(/\{\{meetingTime\}\}/g, meetingTime);
    html = html.replace(/\{\{meetingType\}\}/g, meetingType);
    
    // Then handle fullName which is split by HTML span tags
    html = html.replace(/\{\{[\s\S]*?fullName[\s\S]*?\}\}/g, fullName);

    // Replace image paths with CIDs for embedded images
    html = html.replace(/images\/db561a55b2cf0bc6e877bb934b39b700\.png/g, 'cid:img1');
    html = html.replace(/images\/292db72c5a7a0299db100d17711b8c55\.png/g, 'cid:img2');
    html = html.replace(/images\/83faf7f361d9ba8dfdc904427b5b6423\.png/g, 'cid:img3');
    html = html.replace(/images\/3d94f798ad2bd582f8c3afe175798088\.png/g, 'cid:img4');
    html = html.replace(/images\/53185829a16faf137a533f19db64d893\.png/g, 'cid:img5');
    html = html.replace(/images\/51cf8361f51fd7575b8d8390ef957e30\.png/g, 'cid:img6');
    html = html.replace(/images\/9f7291948d8486bdd26690d0c32796e0\.png/g, 'cid:img7');

    const assetPath = (filename: string) => path.resolve(process.cwd(), 'attached_assets', filename);

    return this.sendEmail({
      to: email,
      subject: `Meeting Reminder: ${meetingTitle} with ${teacherName}`,
      html,
      from: `"EduFiliova Support" <support@edufiliova.com>`,
      attachments: [
        { filename: 'img1.png', path: assetPath('db561a55b2cf0bc6e877bb934b39b700_1766739561052.png'), cid: 'img1' },
        { filename: 'img2.png', path: assetPath('292db72c5a7a0299db100d17711b8c55_1766739561047.png'), cid: 'img2' },
        { filename: 'img3.png', path: assetPath('83faf7f361d9ba8dfdc904427b5b6423_1766739561046.png'), cid: 'img3' },
        { filename: 'img4.png', path: assetPath('3d94f798ad2bd582f8c3afe175798088_1766739561038.png'), cid: 'img4' },
        { filename: 'img5.png', path: assetPath('53185829a16faf137a533f19db64d893_1766739561049.png'), cid: 'img5' },
        { filename: 'img6.png', path: assetPath('51cf8361f51fd7575b8d8390ef957e30_1766739561045.png'), cid: 'img6' },
        { filename: 'img7.png', path: assetPath('9f7291948d8486bdd26690d0c32796e0_1766739561043.png'), cid: 'img7' }
      ]
    });
  }

  async sendDigitalProductsPurchaseReceiptEmail(email: string, data: { customerName: string; orderId: string; totalPrice: string; purchaseDate: string; items: Array<{ name: string; downloadLink?: string }>; expiryHours?: number }): Promise<boolean> {
    const htmlPath = path.resolve(process.cwd(), 'attached_assets/digital_products_receipt_template.html');
    let html = fs.readFileSync(htmlPath, 'utf-8');

    const customerName = data.customerName || 'Valued Customer';
    const orderId = data.orderId || 'N/A';
    const totalPrice = data.totalPrice || '0.00';
    const purchaseDate = data.purchaseDate || new Date().toLocaleString();
    const expiryHours = data.expiryHours || 72;

    // Build items list HTML
    const itemsList = data.items
      .map(item => `<div style="margin:8px 0"><a href="${item.downloadLink || '#'}" style="color:#0d3931;text-decoration:underline;font-weight:bold">Download Now</a> <span style="color:#545454">${item.name}</span></div>`)
      .join('\n');

    // Replace all dynamic placeholders
    html = html.replace(/\{\{customerName\}\}/g, customerName);
    html = html.replace(/\{\{orderId\}\}/g, orderId);
    html = html.replace(/\{\{totalPrice\}\}/g, totalPrice);
    html = html.replace(/\{\{purchaseDate\}\}/g, purchaseDate);
    html = html.replace(/\{\{expiryHours\}\}/g, expiryHours.toString());
    html = html.replace(/\{\{itemsList\}\}/g, itemsList);

    // Replace image paths with CIDs for embedded images
    html = html.replace(/images\/db561a55b2cf0bc6e877bb934b39b700\.png/g, 'cid:img1');
    html = html.replace(/images\/f4a85d998eb4f45ce242a7b73cf561d5\.png/g, 'cid:img2');
    html = html.replace(/images\/83faf7f361d9ba8dfdc904427b5b6423\.png/g, 'cid:img3');
    html = html.replace(/images\/3d94f798ad2bd582f8c3afe175798088\.png/g, 'cid:img4');
    html = html.replace(/images\/53185829a16faf137a533f19db64d893\.png/g, 'cid:img5');
    html = html.replace(/images\/9f7291948d8486bdd26690d0c32796e0\.png/g, 'cid:img6');

    const assetPath = (filename: string) => path.resolve(process.cwd(), 'attached_assets', filename);

    return this.sendEmail({
      to: email,
      subject: `Order Confirmation #${orderId} - Digital Products Ready - EduFiliova`,
      html,
      from: `"EduFiliova Orders" <support@edufiliova.com>`,
      attachments: [
        { filename: 'img1.png', path: assetPath('db561a55b2cf0bc6e877bb934b39b700_1766741303510.png'), cid: 'img1' },
        { filename: 'img2.png', path: assetPath('f4a85d998eb4f45ce242a7b73cf561d5_1766741303511.png'), cid: 'img2' },
        { filename: 'img3.png', path: assetPath('83faf7f361d9ba8dfdc904427b5b6423_1766741303506.png'), cid: 'img3' },
        { filename: 'img4.png', path: assetPath('3d94f798ad2bd582f8c3afe175798088_1766741303501.png'), cid: 'img4' },
        { filename: 'img5.png', path: assetPath('53185829a16faf137a533f19db64d893_1766741303508.png'), cid: 'img5' },
        { filename: 'img6.png', path: assetPath('9f7291948d8486bdd26690d0c32796e0_1766741303504.png'), cid: 'img6' }
      ]
    });
  }

  async sendDeviceLoginEmail(email: string, data: { fullName: string; deviceName: string; browser: string; os: string; location: string; ipAddress: string; loginTime: string; changePasswordUrl?: string }): Promise<boolean> {
    const baseUrl = this.getBaseUrl();
    const htmlPath = path.resolve(process.cwd(), 'attached_assets/device_login_template.html');
    let html = fs.readFileSync(htmlPath, 'utf-8');

    // Remove preloads and add iPhone font support
    html = html.replace(/<link rel="preload" as="image" href="[^"]*">/g, '');
    
    const iphoneFontStack = `
    <style>
      body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
      body, p, h1, h2, h3, h4, span, div, td { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol" !important; }
    </style>`;
    html = html.replace('</head>', `${iphoneFontStack}</head>`);

    const fullName = data.fullName || 'User';
    const deviceName = data.deviceName || 'Unknown Device';
    const browser = data.browser || 'Unknown Browser';
    const os = data.os || 'Unknown OS';
    const location = data.location || 'Unknown Location';
    const ipAddress = data.ipAddress || 'N/A';
    const loginTime = data.loginTime || new Date().toLocaleString();
    const changePasswordUrl = data.changePasswordUrl || `${baseUrl}/change-password`;

    // ✅ USE BULLETPROOF NAME REPLACEMENT - handles split HTML spans
    html = this.forceReplaceName(html, fullName);
    
    // Replace all other simple placeholders
    html = html.replace(/\{\{deviceName\}\}/gi, deviceName);
    html = html.replace(/\{\{browser\}\}/gi, browser);
    html = html.replace(/\{\{os\}\}/gi, os);
    html = html.replace(/\{\{location\}\}/gi, location);
    html = html.replace(/\{\{ipAddress\}\}/gi, ipAddress);
    html = html.replace(/\{\{loginTime\}\}/gi, loginTime);
    html = html.replace(/\{\{changePasswordUrl\}\}/gi, changePasswordUrl);
    html = html.replace(/\{\{baseUrl\}\}/gi, baseUrl);

    // Replace image paths with CIDs
    html = html.replaceAll('images/db561a55b2cf0bc6e877bb934b39b700.png', 'cid:icon1');
    html = html.replaceAll('images/e76fe516a6e91a2aa475626bd50a37d8.png', 'cid:logo1');
    html = html.replaceAll('images/83faf7f361d9ba8dfdc904427b5b6423.png', 'cid:icon2');
    html = html.replaceAll('images/53185829a16faf137a533f19db64d893.png', 'cid:logo2');
    html = html.replaceAll('images/9f7291948d8486bdd26690d0c32796e0.png', 'cid:social');
    html = html.replaceAll('images/3d94f798ad2bd582f8c3afe175798088.png', 'cid:corner');
    html = html.replaceAll('images/ccc540df188352ef9b2d4fb790d0b4bb.png', 'cid:hero');

    const assetPath = (filename: string) => path.resolve(process.cwd(), 'attached_assets', filename);

    return this.sendEmail({
      to: email,
      subject: 'Security Alert: New Login Detected - EduFiliova',
      html,
      from: `"EduFiliova Security" <support@edufiliova.com>`,
      attachments: [
        { filename: 'icon1.png', path: assetPath('db561a55b2cf0bc6e877bb934b39b700_1766712317314.png'), cid: 'icon1', contentType: 'image/png' },
        { filename: 'logo1.png', path: assetPath('e76fe516a6e91a2aa475626bd50a37d8_1766712317317.png'), cid: 'logo1', contentType: 'image/png' },
        { filename: 'icon2.png', path: assetPath('83faf7f361d9ba8dfdc904427b5b6423_1766712317306.png'), cid: 'icon2', contentType: 'image/png' },
        { filename: 'logo2.png', path: assetPath('53185829a16faf137a533f19db64d893_1766712317309.png'), cid: 'logo2', contentType: 'image/png' },
        { filename: 'social.png', path: assetPath('9f7291948d8486bdd26690d0c32796e0_1766712317305.png'), cid: 'social', contentType: 'image/png' },
        { filename: 'corner.png', path: assetPath('3d94f798ad2bd582f8c3afe175798088_1766712317302.png'), cid: 'corner', contentType: 'image/png' },
        { filename: 'hero.png', path: assetPath('ccc540df188352ef9b2d4fb790d0b4bb_1766712317311.png'), cid: 'hero', contentType: 'image/png' }
      ]
    });
  }

  async sendMobileLinkedEmail(email: string, data: { userName: string; maskedMobileNumber: string }): Promise<boolean> {
    const htmlPath = path.resolve(process.cwd(), 'server/templates/mobile_linked_template/email.html');
    let html = fs.readFileSync(htmlPath, 'utf-8');

    const userName = data.userName || 'User';
    const maskedMobileNumber = data.maskedMobileNumber || '••••••••';

    // Replace dynamic placeholders
    html = html.replace(/\{\{userName\}\}/gi, userName);
    html = html.replace(/\{\{maskedMobileNumber\}\}/gi, maskedMobileNumber);

    // Replace image paths with CIDs - map original image paths to CIDs
    html = html.replaceAll('images/db561a55b2cf0bc6e877bb934b39b700.png', 'cid:img1');
    html = html.replaceAll('images/41506b29d7f0bbde9fcb0d4afb720c70.png', 'cid:img2');
    html = html.replaceAll('images/83faf7f361d9ba8dfdc904427b5b6423.png', 'cid:img3');
    html = html.replaceAll('images/3d94f798ad2bd582f8c3afe175798088.png', 'cid:img4');
    html = html.replaceAll('images/2fcb5438f3a66f5b8a9aad39bcd49e69.png', 'cid:img5');
    html = html.replaceAll('images/9f7291948d8486bdd26690d0c32796e0.png', 'cid:img6');

    const assetPath = (filename: string) => path.resolve(process.cwd(), 'attached_assets', filename);

    return this.sendEmail({
      to: email,
      subject: 'Mobile Number Successfully Linked - EduFiliova',
      html,
      from: `"EduFiliova Security" <support@edufiliova.com>`,
      attachments: [
        { filename: 'img1.png', path: assetPath('db561a55b2cf0bc6e877bb934b39b700_1766748234011.png'), cid: 'img1', contentType: 'image/png' },
        { filename: 'img2.png', path: assetPath('41506b29d7f0bbde9fcb0d4afb720c70_1766748234010.png'), cid: 'img2', contentType: 'image/png' },
        { filename: 'img3.png', path: assetPath('83faf7f361d9ba8dfdc904427b5b6423_1766748234009.png'), cid: 'img3', contentType: 'image/png' },
        { filename: 'img4.png', path: assetPath('3d94f798ad2bd582f8c3afe175798088_1766748234008.png'), cid: 'img4', contentType: 'image/png' },
        { filename: 'img5.png', path: assetPath('2fcb5438f3a66f5b8a9aad39bcd49e69_1766748234007.png'), cid: 'img5', contentType: 'image/png' },
        { filename: 'img6.png', path: assetPath('9f7291948d8486bdd26690d0c32796e0_1766748234008.png'), cid: 'img6', contentType: 'image/png' }
      ]
    });
  }

  async sendCourseNotificationEmail(email: string, data: { fullName: string; courseTitle: string; teacherName: string; category: string }): Promise<boolean> {
    const htmlPath = path.resolve(process.cwd(), 'server/templates/course_notification_template/email.html');
    let html = fs.readFileSync(htmlPath, 'utf-8');

    const fullName = data.fullName || 'User';
    const courseTitle = data.courseTitle || 'New Course';
    const teacherName = data.teacherName || 'Instructor';
    const category = data.category || 'General';

    // ✅ USE BULLETPROOF NAME REPLACEMENT - handles split HTML spans
    html = this.forceReplaceName(html, fullName);
    
    // Replace other dynamic placeholders
    html = html.replace(/\{\{courseTitle\}\}/gi, courseTitle);
    html = html.replace(/\{\{teacherName\}\}/gi, teacherName);
    html = html.replace(/\{\{category\}\}/gi, category);

    // Replace image paths with CIDs
    html = html.replaceAll('images/db561a55b2cf0bc6e877bb934b39b700.png', 'cid:course1');
    html = html.replaceAll('images/41506b29d7f0bbde9fcb0d4afb720c70.png', 'cid:course2');
    html = html.replaceAll('images/83faf7f361d9ba8dfdc904427b5b6423.png', 'cid:course3');
    html = html.replaceAll('images/3d94f798ad2bd582f8c3afe175798088.png', 'cid:course4');
    html = html.replaceAll('images/9f7291948d8486bdd26690d0c32796e0.png', 'cid:course5');
    html = html.replaceAll('images/dae012787ae5c5348c44bb83c0009419.png', 'cid:course6');

    const assetPath = (filename: string) => path.resolve(process.cwd(), 'attached_assets', filename);

    return this.sendEmail({
      to: email,
      subject: `New Course Alert: ${courseTitle} - EduFiliova`,
      html,
      from: `"EduFiliova Courses" <support@edufiliova.com>`,
      attachments: [
        { filename: 'course1.png', path: assetPath('db561a55b2cf0bc6e877bb934b39b700_1766749237272.png'), cid: 'course1', contentType: 'image/png' },
        { filename: 'course2.png', path: assetPath('41506b29d7f0bbde9fcb0d4afb720c70_1766749237266.png'), cid: 'course2', contentType: 'image/png' },
        { filename: 'course3.png', path: assetPath('83faf7f361d9ba8dfdc904427b5b6423_1766749237264.png'), cid: 'course3', contentType: 'image/png' },
        { filename: 'course4.png', path: assetPath('3d94f798ad2bd582f8c3afe175798088_1766749237259.png'), cid: 'course4', contentType: 'image/png' },
        { filename: 'course5.png', path: assetPath('9f7291948d8486bdd26690d0c32796e0_1766749237262.png'), cid: 'course5', contentType: 'image/png' },
        { filename: 'course6.png', path: assetPath('dae012787ae5c5348c44bb83c0009419_1766749237268.png'), cid: 'course6', contentType: 'image/png' }
      ]
    });
  }

  async sendStudentVerificationEmail(email: string, data: { fullName: string; code: string; expiresIn: string }): Promise<boolean> {
    const htmlPath = path.resolve(process.cwd(), 'server/templates/student_verification_template/email.html');
    let html = fs.readFileSync(htmlPath, 'utf-8');

    const fullName = data.fullName || 'User';
    const code = data.code || '000000';
    const expiresIn = data.expiresIn || '10';

    // ✅ USE BULLETPROOF NAME REPLACEMENT - handles split HTML spans
    html = this.forceReplaceName(html, fullName);
    
    // Replace other dynamic placeholders
    html = html.replace(/\{\{code\}\}/gi, code);
    html = html.replace(/\{\{expiresIn\}\}/gi, expiresIn);

    // Replace image paths with CIDs
    html = html.replaceAll('images/db561a55b2cf0bc6e877bb934b39b700.png', 'cid:verify1');
    html = html.replaceAll('images/f28befc0a869e8a352bf79aa02080dc7.png', 'cid:verify2');
    html = html.replaceAll('images/83faf7f361d9ba8dfdc904427b5b6423.png', 'cid:verify3');
    html = html.replaceAll('images/8c5dfa6f6ff7f681bbf586933883b270.png', 'cid:verify4');
    html = html.replaceAll('images/9f7291948d8486bdd26690d0c32796e0.png', 'cid:verify5');
    html = html.replaceAll('images/50df79cf94bcde6e18f9cb9ac1a740dd.png', 'cid:verify6');

    const assetPath = (filename: string) => path.resolve(process.cwd(), 'attached_assets', filename);

    return this.sendEmail({
      to: email,
      subject: 'Verify Your Student Account - EduFiliova',
      html,
      from: `"EduFiliova Security" <support@edufiliova.com>`,
      attachments: [
        { filename: 'verify1.png', path: assetPath('db561a55b2cf0bc6e877bb934b39b700_1766749617228.png'), cid: 'verify1', contentType: 'image/png' },
        { filename: 'verify2.png', path: assetPath('f28befc0a869e8a352bf79aa02080dc7_1766749617230.png'), cid: 'verify2', contentType: 'image/png' },
        { filename: 'verify3.png', path: assetPath('83faf7f361d9ba8dfdc904427b5b6423_1766749617221.png'), cid: 'verify3', contentType: 'image/png' },
        { filename: 'verify4.png', path: assetPath('8c5dfa6f6ff7f681bbf586933883b270_1766749617209.png'), cid: 'verify4', contentType: 'image/png' },
        { filename: 'verify5.png', path: assetPath('9f7291948d8486bdd26690d0c32796e0_1766749617212.png'), cid: 'verify5', contentType: 'image/png' },
        { filename: 'verify6.png', path: assetPath('50df79cf94bcde6e18f9cb9ac1a740dd_1766749617214.png'), cid: 'verify6', contentType: 'image/png' }
      ]
    });
  }

  async sendAccountRestrictionEmail(email: string, data: { fullName: string; restrictionType?: string; reason?: string }): Promise<boolean> {
    const baseUrl = this.getBaseUrl();
    const htmlPath = path.resolve(process.cwd(), 'public/email-assets/restriction/template.html');
    let html = fs.readFileSync(htmlPath, 'utf-8');

    // Remove preloads and add iPhone font support
    html = html.replace(/<link rel="preload" as="image" href="images\/.*?">/g, '');
    
    const iphoneFontStack = `
    <style>
      body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
      body, p, h1, h2, h3, h4, span, div, td { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol" !important; }
    </style>`;
    html = html.replace('</head>', `${iphoneFontStack}</head>`);

    const fullName = data.fullName || 'User';
    const restrictionType = data.restrictionType || 'Temporarily Restricted';
    const reasonText = data.reason || 'Account policy review';

    // ✅ USE BULLETPROOF NAME REPLACEMENT
    html = this.forceReplaceName(html, fullName);
    
    // Replace dynamic fields
    html = html.replaceAll('{{restrictionType}}', restrictionType);
    html = html.replaceAll('{{reason}}', reasonText);
    
    // ✅ Handle specific split pattern for userName in this template
    // Pattern found in template: {{</span><span ...>userName</span><span ...>}}
    html = html.replace(/\{\{[^<]*<\/span><span[^>]*>userName<\/span><span[^>]*>[^}]*\}\}/gi, fullName);
    html = html.replaceAll('{{userName}}', fullName);
    
    html = html.replace(/\{\{#if restrictionType\}\}[\s\S]*?\{\{\/if\}\}/gi, restrictionType ? `Restriction Type: ${restrictionType}` : '');
    html = html.replace(/\{\{#if reason\}\}[\s\S]*?\{\{\/if\}\}/gi, reasonText ? `Reason: ${reasonText}` : '');

    // Replace image paths with CIDs
    html = html.replaceAll('images/db561a55b2cf0bc6e877bb934b39b700.png', 'cid:curve');
    html = html.replaceAll('images/f28befc0a869e8a352bf79aa02080dc7.png', 'cid:logo');
    html = html.replaceAll('images/83faf7f361d9ba8dfdc904427b5b6423.png', 'cid:ring');
    html = html.replaceAll('images/53d788456ae4cc2800001f0737c2d843.png', 'cid:arrow');
    html = html.replaceAll('images/9f7291948d8486bdd26690d0c32796e0.png', 'cid:social');

    const assetPath = (filename: string) => path.resolve(process.cwd(), 'public/email-assets/restriction', filename);

    return this.sendEmail({
      to: email,
      subject: 'Important: Your EduFiliova Account Status - Temporary Restriction',
      html,
      from: `"EduFiliova Trust & Safety" <support@edufiliova.com>`,
      attachments: [
        { filename: 'logo.png', path: assetPath('logo.png'), cid: 'logo', contentType: 'image/png' },
        { filename: 'curve.png', path: assetPath('curve.png'), cid: 'curve', contentType: 'image/png' },
        { filename: 'ring.png', path: assetPath('ring.png'), cid: 'ring', contentType: 'image/png' },
        { filename: 'arrow.png', path: assetPath('arrow.png'), cid: 'arrow', contentType: 'image/png' },
        { filename: 'social.png', path: assetPath('social.png'), cid: 'social', contentType: 'image/png' }
      ]
    });
  }

  async sendTeacherVerificationEmail(email: string, data: { fullName: string; code: string; expiresIn: string }): Promise<boolean> {
    const htmlPath = path.resolve(process.cwd(), 'server/templates/teacher_verification_template/email.html');
    let html = fs.readFileSync(htmlPath, 'utf-8');

    const fullName = data.fullName || 'User';
    const code = data.code || '000000';
    const expiresIn = data.expiresIn || '10';

    // ✅ USE BULLETPROOF NAME REPLACEMENT - handles split HTML spans
    html = this.forceReplaceName(html, fullName);
    
    // Replace other dynamic placeholders
    html = html.replace(/\{\{code\}\}/gi, code);
    html = html.replace(/\{\{expiresIn\}\}/gi, expiresIn);

    // Replace image paths with CIDs
    html = html.replaceAll('images/db561a55b2cf0bc6e877bb934b39b700.png', 'cid:teacher1');
    html = html.replaceAll('images/f28befc0a869e8a352bf79aa02080dc7.png', 'cid:teacher2');
    html = html.replaceAll('images/83faf7f361d9ba8dfdc904427b5b6423.png', 'cid:teacher3');
    html = html.replaceAll('images/e5c031c97fefa56399311851ed3cb1de.png', 'cid:teacher4');
    html = html.replaceAll('images/9f7291948d8486bdd26690d0c32796e0.png', 'cid:teacher5');
    html = html.replaceAll('images/8c5dfa6f6ff7f681bbf586933883b270.png', 'cid:teacher6');

    const assetPath = (filename: string) => path.resolve(process.cwd(), 'attached_assets', filename);

    return this.sendEmail({
      to: email,
      subject: 'Verify Your Teacher Account - EduFiliova',
      html,
      from: `"EduFiliova Security" <support@edufiliova.com>`,
      attachments: [
        { filename: 'teacher1.png', path: assetPath('db561a55b2cf0bc6e877bb934b39b700_1766749820555.png'), cid: 'teacher1', contentType: 'image/png' },
        { filename: 'teacher2.png', path: assetPath('f28befc0a869e8a352bf79aa02080dc7_1766749820559.png'), cid: 'teacher2', contentType: 'image/png' },
        { filename: 'teacher3.png', path: assetPath('83faf7f361d9ba8dfdc904427b5b6423_1766749820553.png'), cid: 'teacher3', contentType: 'image/png' },
        { filename: 'teacher4.png', path: assetPath('e5c031c97fefa56399311851ed3cb1de_1766749820557.png'), cid: 'teacher4', contentType: 'image/png' },
        { filename: 'teacher5.png', path: assetPath('9f7291948d8486bdd26690d0c32796e0_1766749820548.png'), cid: 'teacher5', contentType: 'image/png' },
        { filename: 'teacher6.png', path: assetPath('8c5dfa6f6ff7f681bbf586933883b270_1766749820545.png'), cid: 'teacher6', contentType: 'image/png' }
      ]
    });
  }

  async sendFreelancerVerificationEmail(email: string, data: { fullName: string; code: string; expiresIn: string }): Promise<boolean> {
    const htmlPath = path.resolve(process.cwd(), 'server/templates/freelancer_verification_template/email.html');
    let html = fs.readFileSync(htmlPath, 'utf-8');

    const fullName = data.fullName || 'User';
    const code = data.code || '000000';
    const expiresIn = data.expiresIn || '10';

    // ✅ USE BULLETPROOF NAME REPLACEMENT - handles split HTML spans
    html = this.forceReplaceName(html, fullName);
    
    // Replace other dynamic placeholders
    html = html.replace(/\{\{code\}\}/gi, code);
    html = html.replace(/\{\{expiresIn\}\}/gi, expiresIn);

    // Replace image paths with CIDs
    html = html.replaceAll('images/db561a55b2cf0bc6e877bb934b39b700.png', 'cid:freelancer1');
    html = html.replaceAll('images/9564092012b952eb113aed5a5f2f67f8.png', 'cid:freelancer2');
    html = html.replaceAll('images/83faf7f361d9ba8dfdc904427b5b6423.png', 'cid:freelancer3');
    html = html.replaceAll('images/53d788456ae4cc2800001f0737c2d843.png', 'cid:freelancer4');
    html = html.replaceAll('images/9f7291948d8486bdd26690d0c32796e0.png', 'cid:freelancer5');
    html = html.replaceAll('images/1bf5815502d2621deb8af9e7b0187f86.png', 'cid:freelancer6');

    const assetPath = (filename: string) => path.resolve(process.cwd(), 'attached_assets', filename);

    return this.sendEmail({
      to: email,
      subject: 'Verify Your Freelancer Account - EduFiliova',
      html,
      from: `"EduFiliova Security" <support@edufiliova.com>`,
      attachments: [
        { filename: 'freelancer1.png', path: assetPath('db561a55b2cf0bc6e877bb934b39b700_1766749969172.png'), cid: 'freelancer1', contentType: 'image/png' },
        { filename: 'freelancer2.png', path: assetPath('9564092012b952eb113aed5a5f2f67f8_1766749969170.png'), cid: 'freelancer2', contentType: 'image/png' },
        { filename: 'freelancer3.png', path: assetPath('83faf7f361d9ba8dfdc904427b5b6423_1766749969169.png'), cid: 'freelancer3', contentType: 'image/png' },
        { filename: 'freelancer4.png', path: assetPath('53d788456ae4cc2800001f0737c2d843_1766749969168.png'), cid: 'freelancer4', contentType: 'image/png' },
        { filename: 'freelancer5.png', path: assetPath('9f7291948d8486bdd26690d0c32796e0_1766749969167.png'), cid: 'freelancer5', contentType: 'image/png' },
        { filename: 'freelancer6.png', path: assetPath('1bf5815502d2621deb8af9e7b0187f86_1766749969164.png'), cid: 'freelancer6', contentType: 'image/png' }
      ]
    });
  }

  async sendCustomerVerificationEmail(email: string, data: { fullName: string; code: string; expiresIn: string }): Promise<boolean> {
    const htmlPath = path.resolve(process.cwd(), 'server/templates/customer_verification_template/email.html');
    let html = fs.readFileSync(htmlPath, 'utf-8');

    const fullName = data.fullName || 'User';
    const code = data.code || '000000';
    const expiresIn = data.expiresIn || '10';

    // ✅ USE BULLETPROOF NAME REPLACEMENT - handles split HTML spans
    html = this.forceReplaceName(html, fullName);
    
    // Replace other dynamic placeholders
    html = html.replace(/\{\{code\}\}/gi, code);
    html = html.replace(/\{\{expiresIn\}\}/gi, expiresIn);

    // Replace image paths with CIDs
    html = html.replaceAll('images/db561a55b2cf0bc6e877bb934b39b700.png', 'cid:customer1');
    html = html.replaceAll('images/41506b29d7f0bbde9fcb0d4afb720c70.png', 'cid:customer2');
    html = html.replaceAll('images/83faf7f361d9ba8dfdc904427b5b6423.png', 'cid:customer3');
    html = html.replaceAll('images/3d94f798ad2bd582f8c3afe175798088.png', 'cid:customer4');
    html = html.replaceAll('images/9f7291948d8486bdd26690d0c32796e0.png', 'cid:customer5');
    html = html.replaceAll('images/fcf514453cb3c939b52a8a2bcbb97b94.png', 'cid:customer6');

    const assetPath = (filename: string) => path.resolve(process.cwd(), 'attached_assets', filename);

    return this.sendEmail({
      to: email,
      subject: 'Verify Your Account - EduFiliova',
      html,
      from: `"EduFiliova Security" <support@edufiliova.com>`,
      attachments: [
        { filename: 'customer1.png', path: assetPath('db561a55b2cf0bc6e877bb934b39b700_1766750209430.png'), cid: 'customer1', contentType: 'image/png' },
        { filename: 'customer2.png', path: assetPath('41506b29d7f0bbde9fcb0d4afb720c70_1766750209426.png'), cid: 'customer2', contentType: 'image/png' },
        { filename: 'customer3.png', path: assetPath('83faf7f361d9ba8dfdc904427b5b6423_1766750209423.png'), cid: 'customer3', contentType: 'image/png' },
        { filename: 'customer4.png', path: assetPath('3d94f798ad2bd582f8c3afe175798088_1766750209420.png'), cid: 'customer4', contentType: 'image/png' },
        { filename: 'customer5.png', path: assetPath('9f7291948d8486bdd26690d0c32796e0_1766750209420.png'), cid: 'customer5', contentType: 'image/png' },
        { filename: 'customer6.png', path: assetPath('fcf514453cb3c939b52a8a2bcbb97b94_1766750209434.png'), cid: 'customer6', contentType: 'image/png' }
      ]
    });
  }
}

export const emailService = new EmailService();
