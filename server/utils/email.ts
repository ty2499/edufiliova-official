import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { db } from '../db';
import { emailAccounts } from '@shared/schema';
import { eq } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

// Load Cloudinary email asset URLs
let emailAssetMap: Record<string, string> = {};
try {
  const mapPath = path.resolve(process.cwd(), 'server/config/email-assets-map.json');
  if (fs.existsSync(mapPath)) {
    emailAssetMap = JSON.parse(fs.readFileSync(mapPath, 'utf-8'));
  }
} catch (err) {
  console.warn('⚠️ Could not load email assets map:', err instanceof Error ? err.message : String(err));
}

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
  private initialized = false;

  constructor() {
    this.initializeAsync();
  }

  private initializeAsync() {
    this.initializeFromDatabase().catch(e => {
      console.error('❌ Failed to initialize email service in constructor:', e);
    });
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

  private processEmailImages(html: string): string {
    // Replace local image references with Cloudinary URLs
    const imageRegex = /(?:href|src)="images\/([^"]+)"/g;
    
    return html.replace(imageRegex, (match, filename) => {
      // Check if we have a Cloudinary URL for this image
      if (emailAssetMap[filename]) {
        return `src="${emailAssetMap[filename]}"`;
      }
      
      // Fallback: try to find in map with slight variations (case, extensions)
      const variations = [
        filename,
        filename.toLowerCase(),
        filename.toUpperCase(),
      ];
      
      for (const variation of variations) {
        for (const [key, url] of Object.entries(emailAssetMap)) {
          if (key.toLowerCase() === variation.toLowerCase()) {
            return `src="${url}"`;
          }
        }
      }
      
      console.warn(`⚠️ Image not found in Cloudinary map: ${filename}`);
      return match; // Return original if not found
    });
  }

  private async initializeFromDatabase() {
    try {
      const accounts = await db.select().from(emailAccounts).where(eq(emailAccounts.isActive, true));
      console.log(`📧 EmailService loading ${accounts.length} accounts from database...`);
      if (accounts.length === 0) {
        console.warn('⚠️ No active email accounts found in database');
        return;
      }
      for (const account of accounts) {
        if (account.smtpHost && account.smtpPort && account.smtpUsername && account.smtpPassword) {
          try {
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
            console.log(`  ✅ Configured transporter for ${account.email}`);
          } catch (e) {
            console.error(`  ❌ Failed to create transporter for ${account.email}:`, e);
          }
        } else {
          console.warn(`  ⚠️ Account ${account.email} missing SMTP credentials`);
        }
      }
      this.initialized = true;
      console.log(`📧 EmailService initialized with ${this.transporters.size} transporters`);
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
    // Ensure initialization is complete
    if (!this.initialized) {
      await this.initializeFromDatabase();
    }
    if (this.transporters.size === 0) {
      console.error('❌ No email transporters available after initialization');
      console.error('   Available transporters:', Array.from(this.transporters.keys()));
      return false;
    }
    
    try {
      const from = options.from || `"EduFiliova" <orders@edufiliova.com>`;
      const emailMatch = from.match(/<(.+?)>/);
      const senderEmail = emailMatch ? emailMatch[1] : from;
      let transporter = this.transporters.get(senderEmail) || Array.from(this.transporters.values())[0];
      
      console.log(`📧 Email send attempt:
   - From: ${from}
   - Sender email extracted: ${senderEmail}
   - Transporter found for sender: ${this.transporters.has(senderEmail)}
   - Using fallback transporter: ${!this.transporters.has(senderEmail)}
   - Available transporters: ${Array.from(this.transporters.keys()).join(', ')}`);
      
      if (!transporter) {
        console.error('❌ No transporter available for email');
        return false;
      }

      // Process images in HTML: replace local refs with Cloudinary URLs
      let processedHtml = this.processEmailImages(options.html);
      
      const mailOptions = {
        from,
        to: options.to,
        subject: options.subject,
        html: processedHtml,
        attachments: options.attachments || [],
      };
      
    const result = await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    if (error instanceof Error && (error as any).code === 'ESTREAM') {
      console.warn('⚠️ ESTREAM error in sendEmail - likely missing attachment. Retrying without attachments...');
      try {
        const mailOptionsNoAttachments = {
          from: options.from || `"EduFiliova" <orders@edufiliova.com>`,
          to: options.to,
          subject: options.subject,
          html: this.processEmailImages(options.html),
        };
        const from = options.from || `"EduFiliova" <orders@edufiliova.com>`;
        const emailMatch = from.match(/<(.+?)>/);
        const senderEmail = emailMatch ? emailMatch[1] : from;
        const transporter = this.transporters.get(senderEmail) || Array.from(this.transporters.values())[0];
        if (transporter) {
          await transporter.sendMail(mailOptionsNoAttachments);
          console.log('✅ Email sent successfully without problematic attachments');
          return true;
        }
      } catch (retryError) {
        console.error('❌ Failed to send email even without attachments:', retryError);
      }
    }
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
        { filename: 'icon_db.png', path: assetPath('bbe5722d1ffd3c84888e18335965d5e5_linking.png'), cid: 'icon_db', contentType: 'image/png' },
        { filename: 'icon_curve.png', path: assetPath('c9513ccbbd620ff1cc148b9f159cd39d_linking.png'), cid: 'icon_curve', contentType: 'image/png' },
        { filename: 'icon_pf.png', path: assetPath('d320764f7298e63f6b035289d4219bd8_linking.png'), cid: 'icon_pf', contentType: 'image/png' },
        { filename: 'banner.png', path: assetPath('e4d45170731072cbb168266fca3fd470_linking.png'), cid: 'banner', contentType: 'image/png' },
        { filename: 'corner.png', path: assetPath('df1ad55cc4e451522007cfa4378c9bbd_linking.png'), cid: 'corner', contentType: 'image/png' },
        { filename: 'footer_logo.png', path: assetPath('4a834058470b14425c9b32ace711ef17_linking.png'), cid: 'footer_logo', contentType: 'image/png' },
        { filename: 'teacher_img.png', path: assetPath('9eefdace1f726880f93c5a973a54c2f6_linking.png'), cid: 'teacher_img', contentType: 'image/png' },
        { filename: 'social.png', path: assetPath('9f7291948d8486bdd26690d0c32796e0_linking.png'), cid: 'social', contentType: 'image/png' }
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
        { filename: 'logo.png', path: assetPath('0ac9744033a7e26f12e08d761c703308_linking.png'), cid: 'logo', contentType: 'image/png' },
        { filename: 'icon_db.png', path: assetPath('bbe5722d1ffd3c84888e18335965d5e5_linking.png'), cid: 'icon_db', contentType: 'image/png' },
        { filename: 'icon_pf.png', path: assetPath('d320764f7298e63f6b035289d4219bd8_linking.png'), cid: 'icon_pf', contentType: 'image/png' },
        { filename: 'footer_logo.png', path: assetPath('4a834058470b14425c9b32ace711ef17_linking.png'), cid: 'footer_logo', contentType: 'image/png' },
        { filename: 'social.png', path: assetPath('9f7291948d8486bdd26690d0c32796e0_linking.png'), cid: 's_social', contentType: 'image/png' },
        { filename: 'teacher_img.png', path: assetPath('917a6e905cf83da447efc0f5c2780aca_linking.png'), cid: 'teacher_img', contentType: 'image/png' },
        { filename: 'rejection_icon.png', path: assetPath('de497c5361453604d8a15c4fd9bde086_linking.png'), cid: 'rejection_icon', contentType: 'image/png' },
        { filename: 'support_img.png', path: assetPath('e06e238bd6d74a3e48f94e5b0b81388d_linking.png'), cid: 'support_img', contentType: 'image/png' },
        { filename: 'corner.png', path: assetPath('7976503d64a3eef4169fe235111cdc57_linking.png'), cid: 'corner_graphic', contentType: 'image/png' }
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
        { filename: 'corner1.png', path: assetPath('db561a55b2cf0bc6e877bb934b39b700_linking.png'), cid: 'corner1', contentType: 'image/png' },
        { filename: 'footer_logo.png', path: assetPath('41506b29d7f0bbde9fcb0d4afb720c70_linking.png'), cid: 'footer_logo', contentType: 'image/png' },
        { filename: 'ring.png', path: assetPath('83faf7f361d9ba8dfdc904427b5b6423_linking.png'), cid: 'ring', contentType: 'image/png' },
        { filename: 'social.png', path: assetPath('9f7291948d8486bdd26690d0c32796e0_linking.png'), cid: 'social', contentType: 'image/png' },
        { filename: 'corner2.png', path: assetPath('3d94f798ad2bd582f8c3afe175798088_linking.png'), cid: 'corner2', contentType: 'image/png' },
        { filename: 'student_img.png', path: assetPath('e521c0bfaebd7131cd0f55ee3686e87f_linking.png'), cid: 'student_img', contentType: 'image/png' }
      ]
    });
  }

  async sendAccountBannedEmail(email: string, data: { fullName: string; violations?: string[] }): Promise<boolean> {
    const baseUrl = this.getBaseUrl();
    const violationsList = (data.violations || []).map(v => `<li style="margin: 8px 0; color: #333;">- ${v}</li>`).join('');
    
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background-color: #f5f7fa; }
    .container { max-width: 700px; margin: 0 auto; background-color: #ffffff; }
    .header { background-color: #d32f2f; padding: 50px; text-align: center; }
    .logo { max-width: 200px; height: auto; }
    .content { padding: 50px; }
    .title { color: #d32f2f; font-size: 28px; font-weight: 700; margin: 0 0 25px 0; line-height: 1.3; }
    .message { color: #333; font-size: 16px; line-height: 1.8; margin: 0 0 25px 0; }
    .section { background-color: #fef5f5; border-left: 5px solid #d32f2f; padding: 25px; margin: 25px 0; border-radius: 4px; }
    .section h3 { margin: 0 0 15px 0; color: #d32f2f; font-size: 18px; font-weight: 700; }
    .section p { margin: 0 0 12px 0; color: #333; font-size: 15px; line-height: 1.6; }
    .violations { list-style: none; padding: 0; margin: 15px 0; }
    .violations li { padding: 8px 0; color: #333; font-size: 15px; }
    .reason-box { background-color: #f5f5f5; border: 2px solid #d32f2f; padding: 25px; margin: 25px 0; border-radius: 6px; }
    .reason-box h3 { margin: 0 0 15px 0; color: #d32f2f; font-size: 18px; font-weight: 700; }
    .reason-box p { margin: 0 0 12px 0; color: #333; font-size: 15px; line-height: 1.7; }
    .footer { background-color: #f5f5f5; padding: 30px; text-align: center; color: #666; font-size: 13px; border-top: 1px solid #ddd; }
    .footer p { margin: 8px 0; }
    .support-email { color: #d32f2f; font-weight: 700; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://res.cloudinary.com/dl2lomrhp/image/upload/v1763935567/edufiliova/edufiliova-white-logo.png" alt="Edufiliova" class="logo" />
    </div>
    <div class="content">
      <h1 class="title">Account Suspended - Policy Violation</h1>
      
      <p class="message">
        Dear {{fullName}},
      </p>

      <p class="message">
        We are writing to inform you that your EduFiliova account has been suspended effective immediately. This decision was made due to violations of our platform policies.
      </p>

      <div class="reason-box">
        <h3>Reason for Suspension</h3>
        <p>Your account violated the following policies:</p>
        <ul class="violations">
          ${violationsList || '<li>- Platform policy violation(s) detected</li>'}
        </ul>
        <p>
          We take the safety and integrity of our community very seriously. These violations represent a breach of the trust our members place in us and the terms you agreed to when creating your account.
        </p>
      </div>

      <div class="section">
        <h3>What This Means</h3>
        <p>
          Your account is now suspended and you will no longer be able to access any EduFiliova services, including:
        </p>
        <ul class="violations">
          <li>- Logging into your account</li>
          <li>- Accessing courses or course materials</li>
          <li>- Creating or managing products</li>
          <li>- Communicating with other users</li>
          <li>- Earning revenue from any platform features</li>
        </ul>
      </div>

      <div class="section">
        <h3>Appeal Process</h3>
        <p>
          If you believe this suspension was made in error or would like to provide additional context, you may submit an appeal to our support team. Please email:
        </p>
        <p style="font-size: 16px; font-weight: 700; color: #d32f2f; margin: 15px 0;">
          support@edufiliova.com
        </p>
        <p>
          In your email, please clearly state your user ID and explain why you believe the suspension should be reconsidered. Appeals are reviewed within 5 business days. However, please understand that repeated violations or severe breaches may not be eligible for appeal.
        </p>
      </div>

      <div class="section">
        <h3>Going Forward</h3>
        <p>
          If your account is reactivated in the future, you must demonstrate full compliance with all platform policies. Any further violations will result in permanent termination of your account without possibility of appeal.
        </p>
        <p>
          We encourage you to review our Terms of Service, Community Guidelines, Code of Conduct, and Privacy Policy to understand what behavior is expected on our platform.
        </p>
      </div>

      <p class="message" style="margin-top: 30px; font-size: 15px; color: #666;">
        If you have questions or need clarification about this suspension, please contact our support team immediately.
      </p>
    </div>
    <div class="footer">
      <p>EduFiliova Account Support</p>
      <p class="support-email">support@edufiliova.com</p>
      <p style="margin-top: 15px; color: #999;">
        © 2025 Edufiliova. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>`;

    // Use bulletproof name replacement
    const finalHtml = this.forceReplaceName(html, data.fullName);

    return this.sendEmail({
      to: email,
      subject: 'Account Suspended: Policy Violation',
      html: finalHtml,
      from: '"EduFiliova Support" <support@edufiliova.com>'
    });
  }

  async sendAccountUnsuspendedEmail(email: string, data: { fullName: string }): Promise<boolean> {
    const baseUrl = this.getBaseUrl();
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background-color: #f5f7fa; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background-color: #0C332C; padding: 40px; text-align: center; }
    .logo { max-width: 180px; height: auto; }
    .content { padding: 40px; }
    .title { color: #1a1a1a; font-size: 24px; font-weight: 700; margin: 0 0 20px 0; }
    .message { color: #4a5568; font-size: 16px; line-height: 1.7; margin: 0 0 20px 0; }
    .important { border-left: 4px solid #d32f2f; background-color: #fef5f5; padding: 20px; margin: 25px 0; }
    .important h3 { margin: 0 0 12px 0; color: #d32f2f; font-size: 16px; }
    .important p { margin: 0; color: #4a5568; font-size: 14px; line-height: 1.6; }
    .policies-section { border: 2px solid #0C332C; border-radius: 8px; padding: 25px; margin: 25px 0; background-color: #f9fafb; }
    .policies-section h3 { margin: 0 0 18px 0; color: #0C332C; font-size: 18px; font-weight: 700; text-align: center; }
    .policy-link { display: block; margin: 12px 0; padding: 12px; background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 6px; text-decoration: none; color: #0C332C; font-weight: 600; text-align: center; transition: all 0.2s; }
    .policy-link:hover { background-color: #0C332C; color: #ffffff; border-color: #0C332C; }
    .button { display: inline-block; background-color: #0C332C; color: #ffffff !important; padding: 14px 36px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 20px 0; }
    .footer { background-color: #0C332C; padding: 30px; text-align: center; color: #ffffff; }
    .footer a { color: #ffffff; text-decoration: none; margin: 0 10px; }
    .warning { border-left: 4px solid #ff9800; background-color: #fff8e1; padding: 16px; margin: 20px 0; border-radius: 4px; }
    .warning p { margin: 0; color: #e65100; font-size: 14px; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://res.cloudinary.com/dl2lomrhp/image/upload/v1763935567/edufiliova/edufiliova-white-logo.png" alt="Edufiliova" class="logo" />
    </div>
    <div class="content">
      <h1 class="title">Account Reactivated, {{fullName}}</h1>
      <p class="message">
        We are pleased to inform you that your account has been reviewed and reactivated. Your access to EduFiliova has been restored, and you can now use all platform features once again.
      </p>
      
      <div class="important">
        <h3>Important: Future Violations Will Not Be Tolerated</h3>
        <p>
          Your previous account suspension was due to violations of our platform policies. This is your opportunity to start fresh. Please be aware that any further violations of our Terms of Service, Community Guidelines, or Code of Conduct will result in permanent account termination without possibility of appeal.
        </p>
      </div>

      <div class="policies-section">
        <h3>Important Policies You Must Follow</h3>
        <p style="margin: 0 0 15px 0; color: #4a5568; font-size: 14px; text-align: center;">
          Please review these essential policies before using the platform:
        </p>
        <a href="${baseUrl}/terms" class="policy-link">Terms of Service</a>
        <a href="${baseUrl}/community-guidelines" class="policy-link">Community Guidelines</a>
        <a href="${baseUrl}/code-of-conduct" class="policy-link">Code of Conduct</a>
        <a href="${baseUrl}/privacy-policy" class="policy-link">Privacy Policy</a>
      </div>

      <div class="warning">
        <p>We expect all members to maintain professional, respectful conduct at all times. Violations include harassment, fraud, plagiarism, inappropriate content, and commercial misconduct.</p>
      </div>
      
      <center>
        <a href="${baseUrl}/login" class="button">Log In to Your Account</a>
      </center>
      
      <p class="message" style="margin-top: 30px;">
        If you have questions about the policies or need support, please contact our team at support@edufiliova.com.
      </p>
    </div>
    <div class="footer">
      <p>© 2025 Edufiliova. All rights reserved.</p>
      <p style="margin-top: 15px; font-size: 12px;">
        <a href="${baseUrl}/privacy-policy">Privacy Policy</a> | 
        <a href="${baseUrl}/terms">Terms of Service</a>
      </p>
    </div>
  </div>
</body>
</html>`;

    return this.sendEmail({
      to: email,
      subject: 'Important: Your Edufiliova Account Restrictions Have Been Removed',
      html,
      from: `"Edufiliova Support" <support@edufiliova.com>`
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
        { filename: 'ring_green.png', path: assetPath('bbe5722d1ffd3c84888e18335965d5e5_linking.png'), cid: 'ring_green', contentType: 'image/png' },
        { filename: 'logo.png', path: assetPath('3c3a32d57b55881831d31127dddaf32b_linking.png'), cid: 'logo', contentType: 'image/png' },
        { filename: 'ring_green2.png', path: assetPath('d320764f7298e63f6b035289d4219bd8_linking.png'), cid: 'ring_green2', contentType: 'image/png' },
        { filename: 'edu_logo.png', path: assetPath('4a834058470b14425c9b32ace711ef17_linking.png'), cid: 'edu_logo', contentType: 'image/png' },
        { filename: 'edu_logo2.png', path: assetPath('9f7291948d8486bdd26690d0c32796e0_linking.png'), cid: 'edu_logo2', contentType: 'image/png' },
        { filename: 'freelancer_img.png', path: assetPath('5079c2203be6bb217e9e7c150f5f0d60_linking.png'), cid: 'freelancer_img', contentType: 'image/png' },
        { filename: 'money_img.png', path: assetPath('c147000ffb2efef7ba64fa6ce5415a30_linking.png'), cid: 'money_img', contentType: 'image/png' },
        { filename: 'corner.png', path: assetPath('3d94f798ad2bd582f8c3afe175798088_linking.png'), cid: 'corner', contentType: 'image/png' }
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
        { filename: 'freelancer_working.png', path: assetPath('b3f1ba1bfd2e78319f53bcae30119f17_linking.png'), cid: 'freelancer_working', contentType: 'image/png' },
        { filename: 'rejection_icon.png', path: assetPath('de497c5361453604d8a15c4fd9bde086_linking.png'), cid: 'rejection_icon', contentType: 'image/png' },
        { filename: 'corner.png', path: assetPath('3d94f798ad2bd582f8c3afe175798088_linking.png'), cid: 'corner', contentType: 'image/png' },
        { filename: 'footer_logo.png', path: assetPath('4a834058470b14425c9b32ace711ef17_linking.png'), cid: 'footer_logo', contentType: 'image/png' },
        { filename: 'social.png', path: assetPath('9f7291948d8486bdd26690d0c32796e0_linking.png'), cid: 'social', contentType: 'image/png' },
        { filename: 'freelancer_label.png', path: assetPath('8889f49340b6e80a36b597a426a461b7_linking.png'), cid: 'freelancer_label', contentType: 'image/png' }
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
        { filename: 'freelancer_happy.png', path: assetPath('f7daaf49aba7bad7f235cf99406c847a_linking.png'), cid: 'freelancer_happy', contentType: 'image/png' },
        { filename: 'freelancer_working.png', path: assetPath('d249f4ce7bc112aa2f2b471a0d9e4605_linking.png'), cid: 'freelancer_working', contentType: 'image/png' },
        { filename: 'corner.png', path: assetPath('3d94f798ad2bd582f8c3afe175798088_linking.png'), cid: 'corner', contentType: 'image/png' },
        { filename: 'footer_logo.png', path: assetPath('4a834058470b14425c9b32ace711ef17_linking.png'), cid: 'footer_logo', contentType: 'image/png' },
        { filename: 'social.png', path: assetPath('9f7291948d8486bdd26690d0c32796e0_linking.png'), cid: 'social', contentType: 'image/png' }
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
        { filename: 'freelancer_laptop.png', path: assetPath('05e55bd45b360af065b59fc6f57acfee_linking.png'), cid: 'freelancer_laptop', contentType: 'image/png' },
        { filename: 'freelancer_worker.png', path: assetPath('2085c996cc224d012156b3a727be8488_linking.png'), cid: 'freelancer_worker', contentType: 'image/png' },
        { filename: 'corner.png', path: assetPath('3d94f798ad2bd582f8c3afe175798088_linking.png'), cid: 'corner', contentType: 'image/png' },
        { filename: 'footer_logo.png', path: assetPath('4a834058470b14425c9b32ace711ef17_linking.png'), cid: 'footer_logo', contentType: 'image/png' },
        { filename: 'social.png', path: assetPath('9f7291948d8486bdd26690d0c32796e0_linking.png'), cid: 'social', contentType: 'image/png' }
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
        { filename: 'teacher_banner.png', path: assetPath('98fc7367ed0e72d7900d5717bd41ec08_linking.png'), cid: 'teacher_banner', contentType: 'image/png' },
        { filename: 'corner.png', path: assetPath('3d94f798ad2bd582f8c3afe175798088_linking.png'), cid: 'corner', contentType: 'image/png' },
        { filename: 'footer_logo.png', path: assetPath('4a834058470b14425c9b32ace711ef17_linking.png'), cid: 'footer_logo', contentType: 'image/png' },
        { filename: 'social.png', path: assetPath('9f7291948d8486bdd26690d0c32796e0_linking.png'), cid: 'social', contentType: 'image/png' }
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
        { filename: 'icon1.png', path: assetPath('bbe5722d1ffd3c84888e18335965d5e5_linking.png'), cid: 'icon1', contentType: 'image/png' },
        { filename: 'logo.png', path: assetPath('292db72c5a7a0299db100d17711b8c55_linking.png'), cid: 'logo', contentType: 'image/png' },
        { filename: 'icon2.png', path: assetPath('d320764f7298e63f6b035289d4219bd8_linking.png'), cid: 'icon2', contentType: 'image/png' },
        { filename: 'corner.png', path: assetPath('3d94f798ad2bd582f8c3afe175798088_linking.png'), cid: 'corner', contentType: 'image/png' },
        { filename: 'footer_logo.png', path: assetPath('970fad9d41d01c4ad6d96829f4d86901_linking.png'), cid: 'footer_logo', contentType: 'image/png' },
        { filename: 'hero.png', path: assetPath('21c7f785caa53e237dcae6848c7f0f88_linking.png'), cid: 'hero', contentType: 'image/png' },
        { filename: 'social.png', path: assetPath('9f7291948d8486bdd26690d0c32796e0_linking.png'), cid: 'social', contentType: 'image/png' }
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
        { filename: 'icon1.png', path: assetPath('bbe5722d1ffd3c84888e18335965d5e5_linking.png'), cid: 'icon1', contentType: 'image/png' },
        { filename: 'logo1.png', path: assetPath('2f9cbc8b998ed01d09dd6fe1193c00f1_linking.png'), cid: 'logo1', contentType: 'image/png' },
        { filename: 'icon2.png', path: assetPath('d320764f7298e63f6b035289d4219bd8_linking.png'), cid: 'icon2', contentType: 'image/png' },
        { filename: 'corner.png', path: assetPath('3d94f798ad2bd582f8c3afe175798088_linking.png'), cid: 'corner', contentType: 'image/png' },
        { filename: 'logo2.png', path: assetPath('53185829a16faf137a533f19db64d893_linking.png'), cid: 'logo2', contentType: 'image/png' },
        { filename: 'hero.png', path: assetPath('bdcb48fcab505623e33c405af5c98429_linking.png'), cid: 'hero', contentType: 'image/png' },
        { filename: 'social.png', path: assetPath('9f7291948d8486bdd26690d0c32796e0_linking.png'), cid: 'social', contentType: 'image/png' }
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
        { filename: 'img1.png', path: assetPath('db561a55b2cf0bc6e877bb934b39b700_linking.png'), cid: 'img1' },
        { filename: 'img2.png', path: assetPath('292db72c5a7a0299db100d17711b8c55_linking.png'), cid: 'img2' },
        { filename: 'img3.png', path: assetPath('83faf7f361d9ba8dfdc904427b5b6423_linking.png'), cid: 'img3' },
        { filename: 'img4.png', path: assetPath('3d94f798ad2bd582f8c3afe175798088_linking.png'), cid: 'img4' },
        { filename: 'img5.png', path: assetPath('53185829a16faf137a533f19db64d893_linking.png'), cid: 'img5' },
        { filename: 'img6.png', path: assetPath('51cf8361f51fd7575b8d8390ef957e30_linking.png'), cid: 'img6' },
        { filename: 'img7.png', path: assetPath('9f7291948d8486bdd26690d0c32796e0_linking.png'), cid: 'img7' }
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
        { filename: 'img1.png', path: assetPath('db561a55b2cf0bc6e877bb934b39b700_linking.png'), cid: 'img1' },
        { filename: 'img2.png', path: assetPath('f4a85d998eb4f45ce242a7b73cf561d5_linking.png'), cid: 'img2' },
        { filename: 'img3.png', path: assetPath('83faf7f361d9ba8dfdc904427b5b6423_linking.png'), cid: 'img3' },
        { filename: 'img4.png', path: assetPath('3d94f798ad2bd582f8c3afe175798088_linking.png'), cid: 'img4' },
        { filename: 'img5.png', path: assetPath('53185829a16faf137a533f19db64d893_linking.png'), cid: 'img5' },
        { filename: 'img6.png', path: assetPath('9f7291948d8486bdd26690d0c32796e0_linking.png'), cid: 'img6' }
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
        { filename: 'icon1.png', path: assetPath('db561a55b2cf0bc6e877bb934b39b700_linking.png'), cid: 'icon1', contentType: 'image/png' },
        { filename: 'logo1.png', path: assetPath('e76fe516a6e91a2aa475626bd50a37d8_linking.png'), cid: 'logo1', contentType: 'image/png' },
        { filename: 'icon2.png', path: assetPath('83faf7f361d9ba8dfdc904427b5b6423_linking.png'), cid: 'icon2', contentType: 'image/png' },
        { filename: 'logo2.png', path: assetPath('53185829a16faf137a533f19db64d893_linking.png'), cid: 'logo2', contentType: 'image/png' },
        { filename: 'social.png', path: assetPath('9f7291948d8486bdd26690d0c32796e0_linking.png'), cid: 'social', contentType: 'image/png' },
        { filename: 'corner.png', path: assetPath('3d94f798ad2bd582f8c3afe175798088_linking.png'), cid: 'corner', contentType: 'image/png' },
        { filename: 'hero.png', path: assetPath('ccc540df188352ef9b2d4fb790d0b4bb_linking.png'), cid: 'hero', contentType: 'image/png' }
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
        { filename: 'img1.png', path: assetPath('db561a55b2cf0bc6e877bb934b39b700_linking.png'), cid: 'img1', contentType: 'image/png' },
        { filename: 'img2.png', path: assetPath('41506b29d7f0bbde9fcb0d4afb720c70_linking.png'), cid: 'img2', contentType: 'image/png' },
        { filename: 'img3.png', path: assetPath('83faf7f361d9ba8dfdc904427b5b6423_linking.png'), cid: 'img3', contentType: 'image/png' },
        { filename: 'img4.png', path: assetPath('3d94f798ad2bd582f8c3afe175798088_linking.png'), cid: 'img4', contentType: 'image/png' },
        { filename: 'img5.png', path: assetPath('2fcb5438f3a66f5b8a9aad39bcd49e69_linking.png'), cid: 'img5', contentType: 'image/png' },
        { filename: 'img6.png', path: assetPath('9f7291948d8486bdd26690d0c32796e0_linking.png'), cid: 'img6', contentType: 'image/png' }
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
        { filename: 'course1.png', path: assetPath('db561a55b2cf0bc6e877bb934b39b700_linking.png'), cid: 'course1', contentType: 'image/png' },
        { filename: 'course2.png', path: assetPath('41506b29d7f0bbde9fcb0d4afb720c70_linking.png'), cid: 'course2', contentType: 'image/png' },
        { filename: 'course3.png', path: assetPath('83faf7f361d9ba8dfdc904427b5b6423_linking.png'), cid: 'course3', contentType: 'image/png' },
        { filename: 'course4.png', path: assetPath('3d94f798ad2bd582f8c3afe175798088_linking.png'), cid: 'course4', contentType: 'image/png' },
        { filename: 'course5.png', path: assetPath('9f7291948d8486bdd26690d0c32796e0_linking.png'), cid: 'course5', contentType: 'image/png' },
        { filename: 'course6.png', path: assetPath('dae012787ae5c5348c44bb83c0009419_linking.png'), cid: 'course6', contentType: 'image/png' }
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

    return this.sendEmail({
      to: email,
      subject: 'Verify Your Student Account - EduFiliova',
      html,
      from: `"EduFiliova Security" <support@edufiliova.com>`
    });
  }

  async sendVoucherEmail(to: string, data: {
    fullName: string;
    senderName: string;
    amount: string;
    voucherCode: string;
    expiresAt: string;
    personalMessage?: string;
  }): Promise<boolean> {
    const templatePath = path.resolve(process.cwd(), 'server/templates/voucher_purchase_template/email.html');
    let html = fs.readFileSync(templatePath, 'utf8');

    const { fullName, senderName, amount, voucherCode, expiresAt, personalMessage } = data;

    // ✅ ABSOLUTE FORCE REPLACEMENT for all fields
    // This handles any potential HTML fragmentation/spans within placeholders
    const forceReplace = (text: string, key: string, value: string) => {
      // 1. Contextual injection for Hi {{fullName}}
      if (key === 'fullName') {
        text = text.replace(/Hi\s+[\s\S]*?(?:fullName|fullname|Fullname|FULLNAME)[\s\S]*?(?=[,<])/gi, `Hi ${value}`);
      }
      
      // 2. Contextual injection for senderName has sent
      if (key === 'senderName') {
        text = text.replace(/[\s\S]*?(?:senderName|sendername|Sendername|SENDERNAME)[\s\S]*?has sent/gi, `${value} has sent`);
        text = text.replace(/Message from\s+[\s\S]*?(?:senderName|sendername|Sendername|SENDERNAME)[\s\S]*?(?=[<])/gi, `Message from ${value}`);
      }

      // 3. Fragmentation-aware regex: catches cases where tags are split by spans or other markup
      // e.g. {{f</span><span>ullName}}
      const fragRegex = new RegExp(`\\{\\{[\\s\\S]*?${key.split('').join('[\\s\\S]*?')}[\\s\\S]*?\\}\\}`, 'gi');
      text = text.replace(fragRegex, value);
      
      // 4. Case-insensitive regex for the placeholder
      const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'gi');
      text = text.replace(regex, value);
      
      // 5. Exact match
      text = text.replaceAll(`{{${key}}}`, value);
      
      return text;
    };

    html = forceReplace(html, 'fullName', fullName);
    html = forceReplace(html, 'senderName', senderName);
    html = forceReplace(html, 'amount', amount);
    html = forceReplace(html, 'voucherCode', voucherCode);
    html = forceReplace(html, 'expiresAt', expiresAt);

    // Handle personal message conditional block
    if (personalMessage) {
      const personalMsgHtml = `
        <strong>Message from ${senderName}:</strong><br/>
        <em>“${personalMessage}”</em><br/><br/>
      `;
      // Target the exact block from the template
      html = html.replace(/\{\{#if personalMessage\}\}[\s\S]*?\{\{\/if\}\}/gi, personalMsgHtml);
      // Fallback if the block was fragmented
      html = html.replace(/\{\{#if[\s\S]*?personalMessage[\s\S]*?\}\}[\s\S]*?\{\{\/if\}\}/gi, personalMsgHtml);
    } else {
      html = html.replace(/\{\{#if personalMessage\}\}[\s\S]*?\{\{\/if\}\}/gi, '');
      html = html.replace(/\{\{#if[\s\S]*?personalMessage[\s\S]*?\}\}[\s\S]*?\{\{\/if\}\}/gi, '');
    }

    // Map images to CIDs
    html = html.replaceAll('images/db561a55b2cf0bc6e877bb934b39b700.png', 'cid:curve_top');
    html = html.replaceAll('images/de07618f612ae3f3a960a43365f0d61d.png', 'cid:logo');
    html = html.replaceAll('images/83faf7f361d9ba8dfdc904427b5b6423.png', 'cid:ring');
    html = html.replaceAll('images/3d94f798ad2bd582f8c3afe175798088.png', 'cid:curve_bottom');
    html = html.replaceAll('images/9f7291948d8486bdd26690d0c32796e0.png', 'cid:social');
    html = html.replaceAll('images/fe18318bf782f1266432dce6a1a46f60.png', 'cid:promo');

    const assetPath = (filename: string) => path.resolve(process.cwd(), 'public/email-assets/voucher', filename);

    return this.sendEmail({
      to,
      subject: `You've received an EduFiliova Gift Voucher from ${senderName}!`,
      html,
      from: '"EduFiliova Orders" <orders@edufiliova.com>',
      attachments: [
        { filename: 'curve_top.png', path: assetPath('db561a55b2cf0bc6e877bb934b39b700.png'), cid: 'curve_top' },
        { filename: 'logo.png', path: assetPath('de07618f612ae3f3a960a43365f0d61d.png'), cid: 'logo' },
        { filename: 'ring.png', path: assetPath('83faf7f361d9ba8dfdc904427b5b6423.png'), cid: 'ring' },
        { filename: 'curve_bottom.png', path: assetPath('3d94f798ad2bd582f8c3afe175798088.png'), cid: 'curve_bottom' },
        { filename: 'social.png', path: assetPath('9f7291948d8486bdd26690d0c32796e0.png'), cid: 'social' },
        { filename: 'promo.png', path: assetPath('fe18318bf782f1266432dce6a1a46f60.png'), cid: 'promo' },
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

    // Replace dynamic fields using exact string replacement as requested
    // No regex spacing or modifications to the placeholders
    html = html.replace('{{fullName}}', fullName);
    html = html.replace('{{restrictionType}}', restrictionType);
    html = html.replace('{{reason}}', reasonText);
    
    // Handle conditional blocks precisely for this template
    html = html.replace(/\{\{#if restrictionType\}\}[\s\S]*?\{\{\/if\}\}/gi, restrictionType ? `<p style="margin:0"><strong>Restriction Type:</strong> ${restrictionType}</p>` : '');
    html = html.replace(/\{\{#if reason\}\}[\s\S]*?\{\{\/if\}\}/gi, reasonText ? `<p style="margin:0"><strong>Reason:</strong></p><p style="margin:0">${reasonText}</p>` : '');

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

    return this.sendEmail({
      to: email,
      subject: 'Verify Your Teacher Account - EduFiliova',
      html,
      from: `"EduFiliova Security" <support@edufiliova.com>`
    });
  }

  async sendFreelancerVerificationEmail(email: string, data: { fullName: string; verificationCode: string; expiresIn?: string }): Promise<boolean> {
    const htmlPath = path.resolve(process.cwd(), 'server/templates/freelancer_verification_template/email.html');
    let html = fs.readFileSync(htmlPath, 'utf-8');

    const fullName = data.fullName || 'User';
    const code = data.verificationCode || '000000';
    const expiresIn = data.expiresIn || '24 hours';

    // ✅ USE BULLETPROOF NAME REPLACEMENT - handles split HTML spans
    html = this.forceReplaceName(html, fullName);
    
    // Replace other dynamic placeholders
    html = html.replace(/\{\{code\}\}/gi, code);
    html = html.replace(/\{\{expiresIn\}\}/gi, expiresIn);

    return this.sendEmail({
      to: email,
      subject: 'Verify Your Freelancer Account - EduFiliova',
      html,
      from: `"EduFiliova Security" <support@edufiliova.com>`
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

    return this.sendEmail({
      to: email,
      subject: 'Verify Your Account - EduFiliova',
      html,
      from: `"EduFiliova Security" <support@edufiliova.com>`
    });
  }

  async sendShopVerificationEmail(email: string, data: { fullName: string; verificationCode: string; expiresIn?: string }): Promise<boolean> {
    const htmlPath = path.resolve(process.cwd(), 'server/templates/customer_verification_template/email.html');
    let html = fs.readFileSync(htmlPath, 'utf-8');

    const fullName = data.fullName || 'User';
    const code = data.verificationCode || '000000';
    const expiresIn = data.expiresIn || '15 minutes';

    // ✅ USE BULLETPROOF NAME REPLACEMENT - handles split HTML spans
    html = this.forceReplaceName(html, fullName);
    
    // Replace other dynamic placeholders
    html = html.replace(/\{\{code\}\}/gi, code);
    html = html.replace(/\{\{expiresIn\}\}/gi, expiresIn);

    return this.sendEmail({
      to: email,
      subject: 'Verify Your Shop Account - EduFiliova',
      html,
      from: `"EduFiliova Security" <support@edufiliova.com>`
    });
  }

  async sendApplicationSubmittedEmail(email: string, data: { fullName: string }): Promise<boolean> {
    try {
      const templatePath = path.resolve(process.cwd(), 'public', 'email-assets', 'teacher-application-submitted', 'template.html');
      let html = fs.readFileSync(templatePath, 'utf-8');

      const fullName = data.fullName || 'Teacher';

      // ✅ USE BULLETPROOF NAME REPLACEMENT
      html = this.forceReplaceName(html, fullName);

      const imagesDir = path.resolve(process.cwd(), 'public', 'email-assets', 'teacher-application-submitted', 'images');

      return this.sendEmail({
        to: email,
        subject: 'Application Received - Your Teacher Application is Under Review',
        html,
        from: `"EduFiliova Applications" <support@edufiliova.com>`,
        attachments: [
          { filename: 'header-image.png', path: path.join(imagesDir, 'header-image.png'), cid: 'header-image', contentType: 'image/png' },
          { filename: 'logo-footer.png', path: path.join(imagesDir, 'logo-footer.png'), cid: 'logo-footer', contentType: 'image/png' }
        ]
      });
    } catch (error) {
      console.error('❌ Error sending application submitted email:', error);
      return false;
    }
  }

  async sendApplicationResubmittedEmail(email: string, data: { fullName: string }): Promise<boolean> {
    // Use same template but different subject for resubmissions
    try {
      const templatePath = path.resolve(process.cwd(), 'public', 'email-assets', 'teacher-application-submitted', 'template.html');
      let html = fs.readFileSync(templatePath, 'utf-8');

      const fullName = data.fullName || 'Teacher';

      // ✅ USE BULLETPROOF NAME REPLACEMENT
      html = this.forceReplaceName(html, fullName);

      const imagesDir = path.resolve(process.cwd(), 'public', 'email-assets', 'teacher-application-submitted', 'images');

      return this.sendEmail({
        to: email,
        subject: 'Application Resubmitted - Your Teacher Application is Under Review',
        html,
        from: `"EduFiliova Applications" <support@edufiliova.com>`,
        attachments: [
          { filename: 'header-image.png', path: path.join(imagesDir, 'header-image.png'), cid: 'header-image', contentType: 'image/png' },
          { filename: 'logo-footer.png', path: path.join(imagesDir, 'logo-footer.png'), cid: 'logo-footer', contentType: 'image/png' }
        ]
      });
    } catch (error) {
      console.error('❌ Error sending application resubmitted email:', error);
      return false;
    }
  }

  async sendFreelancerApplicationSubmittedEmail(email: string, data: { fullName: string }): Promise<boolean> {
    try {
      const templatePath = path.resolve(process.cwd(), 'public', 'email-assets', 'freelancer-application-submitted', 'template.html');
      let html = fs.readFileSync(templatePath, 'utf-8');

      const fullName = data.fullName || 'Freelancer';

      // ✅ USE BULLETPROOF NAME REPLACEMENT
      html = this.forceReplaceName(html, fullName);

      const imagesDir = path.resolve(process.cwd(), 'public', 'email-assets', 'freelancer-application-submitted', 'images');

      return this.sendEmail({
        to: email,
        subject: 'Application Received - Your Freelancer Application is Under Review',
        html,
        from: `"EduFiliova Applications" <noreply@edufiliova.com>`,
        attachments: [
          { filename: 'header-image.png', path: path.join(imagesDir, 'header-image.png'), cid: 'header-image', contentType: 'image/png' },
          { filename: 'promo.png', path: path.join(imagesDir, 'promo.png'), cid: 'promo', contentType: 'image/png' },
          { filename: 'logo-footer.png', path: path.join(imagesDir, 'logo-footer.png'), cid: 'logo-footer', contentType: 'image/png' }
        ]
      });
    } catch (error) {
      console.error('❌ Error sending freelancer application submitted email:', error);
      return false;
    }
  }

  async sendFreelancerApplicationResubmittedEmail(email: string, data: { fullName: string }): Promise<boolean> {
    try {
      const templatePath = path.resolve(process.cwd(), 'public', 'email-assets', 'freelancer-application-submitted', 'template.html');
      let html = fs.readFileSync(templatePath, 'utf-8');

      const fullName = data.fullName || 'Freelancer';

      // ✅ USE BULLETPROOF NAME REPLACEMENT
      html = this.forceReplaceName(html, fullName);

      const imagesDir = path.resolve(process.cwd(), 'public', 'email-assets', 'freelancer-application-submitted', 'images');

      return this.sendEmail({
        to: email,
        subject: 'Application Resubmitted - Your Freelancer Application is Under Review',
        html,
        from: `"EduFiliova Applications" <noreply@edufiliova.com>`,
        attachments: [
          { filename: 'header-image.png', path: path.join(imagesDir, 'header-image.png'), cid: 'header-image', contentType: 'image/png' },
          { filename: 'promo.png', path: path.join(imagesDir, 'promo.png'), cid: 'promo', contentType: 'image/png' },
          { filename: 'logo-footer.png', path: path.join(imagesDir, 'logo-footer.png'), cid: 'logo-footer', contentType: 'image/png' }
        ]
      });
    } catch (error) {
      console.error('❌ Error sending freelancer application resubmitted email:', error);
      return false;
    }
  }

  async sendPaymentFailedEmail(email: string, data: { 
    customerName: string; 
    orderId: string; 
    amount: string; 
    retryUrl?: string;
  }): Promise<boolean> {
    try {
      const templatePath = path.resolve(process.cwd(), 'public', 'email-assets', 'payment-failed', 'template.html');
      let html = fs.readFileSync(templatePath, 'utf-8');

      const customerName = data.customerName || 'Customer';
      const orderId = data.orderId || 'N/A';
      const amount = data.amount || '$0.00';
      const retryUrl = data.retryUrl || 'https://edufiliova.com/billing';

      // ✅ USE BULLETPROOF NAME REPLACEMENT for customerName
      html = html.replace(/\{\{\s*customerName\s*\}\}/gi, customerName);
      html = html.replace(/\{\{<\/span><span[^>]*>customerName<\/span><span[^>]*>\}\}/gi, customerName);
      
      // Replace other placeholders
      html = html.replace(/\{\{\s*orderId\s*\}\}/gi, orderId);
      html = html.replace(/\{\{\s*amount\s*\}\}/gi, amount);
      html = html.replace(/\{\{\s*retryUrl\s*\}\}/gi, retryUrl);

      const imagesDir = path.resolve(process.cwd(), 'public', 'email-assets', 'payment-failed', 'images');

      return this.sendEmail({
        to: email,
        subject: `Payment Failed - Order #${orderId}`,
        html,
        from: `"EduFiliova Billing" <orders@edufiliova.com>`,
        attachments: [
          { filename: 'spiral-left.png', path: path.join(imagesDir, 'spiral-left.png'), cid: 'spiral-left', contentType: 'image/png' },
          { filename: 'spiral-right.png', path: path.join(imagesDir, 'spiral-right.png'), cid: 'spiral-right', contentType: 'image/png' },
          { filename: 'logo-header.png', path: path.join(imagesDir, 'logo-header.png'), cid: 'logo-header', contentType: 'image/png' },
          { filename: 'whatsapp-promo.png', path: path.join(imagesDir, 'whatsapp-promo.png'), cid: 'whatsapp-promo', contentType: 'image/png' },
          { filename: 'logo-footer.png', path: path.join(imagesDir, 'logo-footer.png'), cid: 'logo-footer', contentType: 'image/png' }
        ]
      });
    } catch (error) {
      console.error('❌ Error sending payment failed email:', error);
      return false;
    }
  }

  async sendTeacherApplicationDeclinedEmail(email: string, data: { 
    fullName: string; 
    reason?: string;
  }): Promise<boolean> {
    try {
      const templatePath = path.resolve(process.cwd(), 'public', 'email-assets', 'teacher-application-declined', 'template.html');
      let html = fs.readFileSync(templatePath, 'utf-8');

      const fullName = data.fullName || 'Teacher';
      const reason = data.reason || '';

      // ✅ USE BULLETPROOF NAME REPLACEMENT
      html = this.forceReplaceName(html, fullName);
      
      // Handle conditional reason block
      if (reason) {
        html = html.replace(/\{\{#if reason\}\}([\s\S]*?)\{\{\/if\}\}/gi, '$1');
        html = html.replace(/\{\{\s*reason\s*\}\}/gi, reason);
      } else {
        html = html.replace(/\{\{#if reason\}\}[\s\S]*?\{\{\/if\}\}/gi, '');
      }

      const imagesDir = path.resolve(process.cwd(), 'public', 'email-assets', 'teacher-application-declined', 'images');

      return this.sendEmail({
        to: email,
        subject: 'Teacher Application Update - EduFiliova',
        html,
        from: `"EduFiliova Applications" <noreply@edufiliova.com>`,
        attachments: [
          { filename: 'spiral-left.png', path: path.join(imagesDir, 'spiral-left.png'), cid: 'spiral-left', contentType: 'image/png' },
          { filename: 'spiral-right.png', path: path.join(imagesDir, 'spiral-right.png'), cid: 'spiral-right', contentType: 'image/png' },
          { filename: 'logo-header.png', path: path.join(imagesDir, 'logo-header.png'), cid: 'logo-header', contentType: 'image/png' },
          { filename: 'declined-icon.png', path: path.join(imagesDir, 'declined-icon.png'), cid: 'declined-icon', contentType: 'image/png' },
          { filename: 'promo.png', path: path.join(imagesDir, 'promo.png'), cid: 'promo', contentType: 'image/png' },
          { filename: 'logo-footer.png', path: path.join(imagesDir, 'logo-footer.png'), cid: 'logo-footer', contentType: 'image/png' }
        ]
      });
    } catch (error) {
      console.error('❌ Error sending teacher application declined email:', error);
      return false;
    }
  }

  async sendTeacherUnderReviewEmail(email: string, data: { fullName: string }): Promise<boolean> {
    try {
      const templatePath = path.resolve(process.cwd(), 'public', 'email-assets', 'teacher-application-under-review', 'template.html');
      let html = fs.readFileSync(templatePath, 'utf-8');

      const fullName = data.fullName || 'Teacher';

      // USE BULLETPROOF NAME REPLACEMENT
      html = this.forceReplaceName(html, fullName);

      const imagesDir = path.resolve(process.cwd(), 'public', 'email-assets', 'teacher-application-under-review', 'images');

      return this.sendEmail({
        to: email,
        subject: 'Your Application is Now Under Review - EduFiliova',
        html,
        from: `"EduFiliova Applications" <noreply@edufiliova.com>`,
        attachments: [
          { filename: 'header-image.png', path: path.join(imagesDir, 'header-image.png'), cid: 'header-image', contentType: 'image/png' },
          { filename: 'logo-footer.png', path: path.join(imagesDir, 'logo-footer.png'), cid: 'logo-footer', contentType: 'image/png' }
        ]
      });
    } catch (error) {
      console.error('❌ Error sending teacher under review email:', error);
      return false;
    }
  }

  async sendFreelancerUnderReviewEmail(email: string, data: { fullName: string }): Promise<boolean> {
    try {
      const templatePath = path.resolve(process.cwd(), 'public', 'email-assets', 'freelancer-application-under-review', 'template.html');
      let html = fs.readFileSync(templatePath, 'utf-8');

      const fullName = data.fullName || 'Freelancer';

      // USE BULLETPROOF NAME REPLACEMENT
      html = this.forceReplaceName(html, fullName);

      const imagesDir = path.resolve(process.cwd(), 'public', 'email-assets', 'freelancer-application-under-review', 'images');

      return this.sendEmail({
        to: email,
        subject: 'Your Application is Now Under Review - EduFiliova',
        html,
        from: `"EduFiliova Applications" <noreply@edufiliova.com>`,
        attachments: [
          { filename: 'header-image.png', path: path.join(imagesDir, 'header-image.png'), cid: 'header-image', contentType: 'image/png' },
          { filename: 'logo-footer.png', path: path.join(imagesDir, 'logo-footer.png'), cid: 'logo-footer', contentType: 'image/png' }
        ]
      });
    } catch (error) {
      console.error('❌ Error sending freelancer under review email:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();
