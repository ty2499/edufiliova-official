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
    // Priority 1: Use BASE_URL if explicitly set (usually production)
    if (process.env.BASE_URL) {
      return process.env.BASE_URL;
    }
    // Priority 2: Use REPLIT_DEV_DOMAIN for development environment
    if (process.env.REPLIT_DEV_DOMAIN) {
      return `https://${process.env.REPLIT_DEV_DOMAIN}`;
    }
    // Priority 3: Fallback
    return 'https://edufiliova.com';
  }

  private async processEmailImages(html: string): Promise<{ html: string; attachments: EmailAttachment[] }> {
    console.log(`🖼️ Processing images in HTML (length: ${html.length})`);

    const localAssetDir = path.resolve(process.cwd(), 'server/email-local-assets');
    const files = fs.existsSync(localAssetDir) ? fs.readdirSync(localAssetDir) : [];
    const attachments: EmailAttachment[] = [];
    const usedCids = new Set<string>();

    const getExt = (name: string) => path.extname(name).slice(1) || 'png';

    // Comprehensive replacement for all attributes including src, href, style, and data-src
    const replaceFn = (match: string, prefix: string, quote: string, pathVal: string) => {
      let fileName = pathVal.split('/').pop() || '';
      let targetFile = '';

      // 1. Resolve target file
      if (pathVal.toLowerCase().startsWith('cid:')) {
        const cid = pathVal.slice(4).toLowerCase();
        targetFile = files.find(f => f.toLowerCase().startsWith(cid)) || '';
      } else if (dataUriMap.has(fileName)) {
        targetFile = fileName;
      }

      if (targetFile) {
        const cid = targetFile.split('.')[0];
        if (!usedCids.has(cid)) {
          attachments.push({
            filename: targetFile,
            path: path.join(localAssetDir, targetFile),
            cid: cid
          });
          usedCids.add(cid);
        }
        return `${prefix}=${quote}cid:${cid}${quote}`;
      }

      // Fallback to Cloudinary mapping if no local file found
      for (const [key, url] of Object.entries(emailAssetMap)) {
        if (pathVal.includes(key)) {
          return `${prefix}=${quote}${url}${quote}`;
        }
      }

      return match;
    };

    // We need a map for quick lookup if we wanted base64, but here we want CID
    const dataUriMap = new Set(files);

    // Replace in attributes
    html = html.replace(/(src|href|data-src|poster)\s*=\s*(["'])([^"']+)\2/gi, replaceFn);

    // Replace in CSS url() patterns
    html = html.replace(/url\((["']?)([^"'\)]+)\1\)/gi, (match, quote, pathVal) => {
      let fileName = pathVal.split('/').pop() || '';
      if (dataUriMap.has(fileName)) {
        const cid = fileName.split('.')[0];
        if (!usedCids.has(cid)) {
          attachments.push({
            filename: fileName,
            path: path.join(localAssetDir, fileName),
            cid: cid
          });
          usedCids.add(cid);
        }
        return `url(${quote}cid:${cid}${quote})`;
      }
      return match;
    });

    return { html, attachments };
  }

  // ✅ Keep for legacy or if processing fails
  private finalCidClean(html: string): string {
    return html; // Base64 embedding handles this now
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
    // 1️⃣ FIRST: Handle specific split patterns from various templates
    // Pattern: Hi {{full</span><span...>Name}</span><span...>},
    html = html.replace(/{{full<\/span><span[^>]*>Name}<\/span><span[^>]*>}/gi, fullName);
    html = html.replace(/{{Full<\/span><span[^>]*>Name}<\/span><span[^>]*>}/gi, fullName);
    html = html.replace(/{{fullName<\/span><span[^>]*>}/gi, fullName);
    html = html.replace(/{{FullName<\/span><span[^>]*>}/gi, fullName);
    
    // 2️⃣ SECOND: Merge split placeholders caused by HTML spans or styling
    // Handles: {{</span><span...>fullName</span><span...>}} format
    html = html.replace(/{{[^}]*fullName[^}]*}}/gi, fullName);
    html = html.replace(/{{[^}]*FullName[^}]*}}/gi, fullName);
    html = html.replace(/{{[^}]*fullname[^}]*}}/gi, fullName);
    html = html.replace(/{{[^}]*FULLNAME[^}]*}}/gi, fullName);
    
    // 3️⃣ THIRD: Handle cases where the placeholder might be partially outside brackets
    // e.g., {fullName} or [fullName] or even just fullName in specific contexts
    html = html.replace(/{fullName}/gi, fullName);
    html = html.replace(/{FullName}/gi, fullName);
    
    // 4️⃣ FOURTH: Replace ALL possible variations of {{fullName}} and {{FullName}}
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
      '[[fullName]]',
      '[[FullName]]',
    ];
    
    patterns.forEach(pattern => {
      html = html.replaceAll(pattern, fullName);
    });
    
    // 5️⃣ Regex fallback for edge cases with spaces/variations/newlines
    html = html.replace(/{{\s*fullName\s*}}/gi, fullName);
    html = html.replace(/{{\s*FullName\s*}}/gi, fullName);
    html = html.replace(/{{\s*fullname\s*}}/gi, fullName);
    html = html.replace(/{{\s*FULLNAME\s*}}/gi, fullName);
    
    // 6️⃣ Handle broken template tags like { {fullName} } or {{fullName}
    html = html.replace(/{{\s*(?:full|Full)Name\s*}/gi, fullName);
    html = html.replace(/{\s*(?:full|Full)Name\s*}}/gi, fullName);
    
    // 7️⃣ Last resort: Look for any remaining {{ and }} that might contain variations
    html = html.replace(/{{\s*(?:full|Full)Name\s*}}/gi, fullName);
    
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
        console.error('❌ No transporter available for email. Attempting re-initialization...');
        await this.initializeFromDatabase();
        transporter = this.transporters.get(senderEmail) || Array.from(this.transporters.values())[0];
        if (!transporter) {
          console.error('❌ Still no transporter available after re-initialization');
          return false;
        }
      }

    // Log final HTML before sending as requested
    console.log(`✉️ Sending email to: ${options.to} | Subject: ${options.subject}`);
    
    // Process images in HTML: replace local refs and CID placeholders with Cloudinary URLs
    const { html: processedHtml, attachments: imageAttachments } = await this.processEmailImages(options.html);

    // Final CID pass using dedicated cleaner (if needed, but processEmailImages handles it)
    // processedHtml = this.finalCidClean(processedHtml);

    // Log final HTML after processing
    // console.log(`✉️ Final HTML content:\n${processedHtml}`);

    const mailOptions = {
      from,
      to: options.to,
      subject: options.subject,
      html: processedHtml,
      attachments: [...(options.attachments || []), ...imageAttachments], 
    };
      
    const result = await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    if (error instanceof Error && (error as any).code === 'ESTREAM') {
      console.warn('⚠️ ESTREAM error in sendEmail - likely missing attachment. Retrying without attachments...');
      try {
        const { html: finalHtml, attachments: retryAttachments } = await this.processEmailImages(options.html);
        const mailOptionsNoAttachments = {
          from: options.from || `"EduFiliova" <orders@edufiliova.com>`,
          to: options.to,
          subject: options.subject,
          html: finalHtml,
          attachments: retryAttachments
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

  private getGlobalTemplate(title: string, content: string): string {
    return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${title}</title>
  <style type="text/css">
    body { margin: 0; padding: 0; min-width: 100%; background-color: #f4f7f9; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }
    .wrapper { width: 100%; table-layout: fixed; background-color: #f4f7f9; padding-bottom: 40px; }
    .main-table { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
    .header { background-color: #0c332c; padding: 40px 0; text-align: center; }
    .content { padding: 40px 50px; color: #333333; line-height: 1.6; }
    .content h1 { color: #0c332c; font-size: 24px; margin-bottom: 20px; font-weight: 700; }
    .content p { font-size: 16px; margin-bottom: 20px; }
    .footer { background-color: #f8fafc; padding: 40px 50px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 13px; }
    .footer p { margin: 10px 0; line-height: 1.5; }
    .footer a { color: #0c332c; text-decoration: none; font-weight: 600; }
    .divider { height: 1px; background-color: #e2e8f0; margin: 20px 0; }
    .btn { display: inline-block; padding: 12px 24px; background-color: #0c332c; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
    .highlight { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 20px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <table class="main-table" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td class="header">
          <img src="https://res.cloudinary.com/dl2lomrhp/image/upload/v1763935567/edufiliova/edufiliova-white-logo.png" alt="EduFiliova" width="180" style="display: block; margin: 0 auto;" />
        </td>
      </tr>
      <tr>
        <td class="content">
          ${content}
        </td>
      </tr>
      <tr>
        <td class="footer">
          <p><strong>EduFiliova</strong></p>
          <p>Empowering global talent through education and opportunity.</p>
          <div class="divider"></div>
          <p>This is an automated message. Please do not reply directly to this email. For assistance, contact our support team at <a href="mailto:support@edufiliova.com">support@edufiliova.com</a>.</p>
          <p>&copy; 2025 EduFiliova. All rights reserved.</p>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;
  }

  async sendTeacherApprovalEmail(email: string, data: { fullName: string; displayName: string }): Promise<boolean> {
    try {
      let html = fs.readFileSync(
        path.resolve(process.cwd(), 'server/templates/teacher_application_approved_template/email.html'),
        'utf-8'
      );

      // Use the bulletproof name replacement to handle span/styling issues in the template
      html = this.forceReplaceName(html, data.fullName);

      return this.sendEmail({
        to: email,
        subject: 'Congratulations! Your Teacher Application has been Approved - EduFiliova',
        html: html,
        from: '"EduFiliova Support" <support@edufiliova.com>'
      });
    } catch (error) {
      console.error('Error sending teacher approval email:', error);
      return false;
    }
  }

  async sendTeacherApplicationDeclinedEmail(email: string, data: { fullName: string; reason?: string }): Promise<boolean> {
    try {
      let html = fs.readFileSync(
        path.resolve(process.cwd(), 'server/templates/teacher_application_declined_template/email.html'),
        'utf-8'
      );

      // Use the bulletproof name replacement to handle span/styling issues in the template
      html = this.forceReplaceName(html, data.fullName);

      // Handle the optional reason - standard template placeholder
      if (data.reason) {
        // Replace the Handlebars-style conditional if it exists, or just the placeholder
        html = html.replace(/{{#if reason}}[\s\S]*?{{reason}}[\s\S]*?{{\/if}}/gi, `Reason provided:<br>${data.reason}`);
        html = html.replace(/{{reason}}/gi, data.reason);
      } else {
        // Remove the reason section completely if no reason provided
        html = html.replace(/{{#if reason}}[\s\S]*?{{\/if}}/gi, '');
        html = html.replace(/Reason provided:[\s\S]*?{{reason}}/gi, '');
      }

      // Attachments with CID references for embedded images
      const imagesPath = path.resolve(process.cwd(), 'server/email-local-assets');
      const attachments = [
        { filename: 'bbe5722d1ffd3c84888e18335965d5e5.png', path: path.join(imagesPath, 'bbe5722d1ffd3c84888e18335965d5e5.png'), cid: 'spiral1', contentType: 'image/png' },
        { filename: '0ac9744033a7e26f12e08d761c703308.png', path: path.join(imagesPath, '0ac9744033a7e26f12e08d761c703308.png'), cid: 'logo', contentType: 'image/png' },
        { filename: 'd320764f7298e63f6b035289d4219bd8.png', path: path.join(imagesPath, 'd320764f7298e63f6b035289d4219bd8.png'), cid: 'spiral2', contentType: 'image/png' },
        { filename: '917a6e905cf83da447efc0f5c2780aca.png', path: path.join(imagesPath, '917a6e905cf83da447efc0f5c2780aca.png'), cid: 'teacherapp', contentType: 'image/png' },
        { filename: 'de497c5361453604d8a15c4fd9bde086.png', path: path.join(imagesPath, 'de497c5361453604d8a15c4fd9bde086.png'), cid: 'declinedicon', contentType: 'image/png' },
        { filename: '7976503d64a3eef4169fe235111cdc57.png', path: path.join(imagesPath, '7976503d64a3eef4169fe235111cdc57.png'), cid: 'arrow', contentType: 'image/png' },
        { filename: '4a834058470b14425c9b32ace711ef17.png', path: path.join(imagesPath, '4a834058470b14425c9b32ace711ef17.png'), cid: 'logofull', contentType: 'image/png' },
        { filename: 'e06e238bd6d74a3e48f94e5b0b81388d.png', path: path.join(imagesPath, 'e06e238bd6d74a3e48f94e5b0b81388d.png'), cid: 'teacherbanner', contentType: 'image/png' },
        { filename: '9f7291948d8486bdd26690d0c32796e0.png', path: path.join(imagesPath, '9f7291948d8486bdd26690d0c32796e0.png'), cid: 'logofull2', contentType: 'image/png' }
      ];

      return this.sendEmail({
        to: email,
        subject: 'Teacher Application Update - EduFiliova',
        html: html,
        from: '"EduFiliova Support" <support@edufiliova.com>',
        attachments
      });
    } catch (error) {
      console.error('Error sending teacher application declined email:', error);
      return false;
    }
  }

  async sendTeacherUnderReviewEmail(email: string, data: { fullName: string }): Promise<boolean> {
    const content = `
      <h1>Application Under Review</h1>
      <p>Hello ${data.fullName},</p>
      <p>Your teacher application is now under review by our team. We'll notify you as soon as there's an update.</p>
      <p>Thank you for your patience.</p>
    `;
    return this.sendEmail({
      to: email,
      subject: 'Application Under Review - EduFiliova',
      html: this.getGlobalTemplate('Application Under Review', content),
      from: '"EduFiliova Support" <support@edufiliova.com>'
    });
  }

  async sendApplicationSubmittedEmail(email: string, data: { fullName: string }): Promise<boolean> {
    const content = `
      <h1>Application Received</h1>
      <p>Hello ${data.fullName},</p>
      <p>Your application has been successfully submitted and is waiting for review.</p>
      <p>We'll get back to you within 3-5 business days.</p>
    `;
    return this.sendEmail({
      to: email,
      subject: 'Application Received - EduFiliova',
      html: this.getGlobalTemplate('Application Received', content),
      from: '"EduFiliova Support" <support@edufiliova.com>'
    });
  }

  async sendApplicationResubmittedEmail(email: string, data: { fullName: string; applicationType: 'teacher' | 'freelancer' }): Promise<boolean> {
    const appType = data.applicationType === 'teacher' ? 'Teacher' : 'Freelancer';
    const content = `
      <h1>Application Resubmitted</h1>
      <p>Hello ${data.fullName},</p>
      <p>Your ${appType} application resubmission has been received. Our team will review the updated information and get back to you soon.</p>
    `;
    return this.sendEmail({
      to: email,
      subject: `Your ${appType} Application Resubmission Received - EduFiliova`,
      html: this.getGlobalTemplate('Application Resubmitted', content),
      from: '"EduFiliova Support" <support@edufiliova.com>'
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
    .header { background-color: #0c332c; padding: 50px; text-align: center; }
    .logo { max-width: 200px; height: auto; }
    .content { padding: 50px; }
    .title { color: #0c332c; font-size: 28px; font-weight: 700; margin: 0 0 25px 0; line-height: 1.3; }
    .message { color: #333; font-size: 16px; line-height: 1.8; margin: 0 0 25px 0; }
    .section { background-color: #f0fdf4; border-left: 5px solid #0c332c; padding: 25px; margin: 25px 0; border-radius: 4px; }
    .section h3 { margin: 0 0 15px 0; color: #0c332c; font-size: 18px; font-weight: 700; }
    .section p { margin: 0 0 12px 0; color: #333; font-size: 15px; line-height: 1.6; }
    .violations { list-style: none; padding: 0; margin: 15px 0; }
    .violations li { padding: 8px 0; color: #333; font-size: 15px; }
    .reason-box { background-color: #f8fafc; border: 2px solid #0c332c; padding: 25px; margin: 25px 0; border-radius: 6px; }
    .reason-box h3 { margin: 0 0 15px 0; color: #0c332c; font-size: 18px; font-weight: 700; }
    .reason-box p { margin: 0 0 12px 0; color: #333; font-size: 15px; line-height: 1.7; }
    .footer { background-color: #f5f5f5; padding: 30px; text-align: center; color: #666; font-size: 13px; border-top: 1px solid #ddd; }
    .footer p { margin: 8px 0; }
    .support-email { color: #0c332c; font-weight: 700; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
    </div>
    <div class="content">
      <h1 class="title" style="color: #0c332c;">Account Update</h1>
      
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
    let finalHtml = this.forceReplaceName(html, data.fullName);
    
    // Also try to replace generic name placeholders if found
    finalHtml = finalHtml.replace(/Dear\s+Customer/gi, `Dear ${data.fullName}`);
    finalHtml = finalHtml.replace(/Hi\s+there/gi, `Hi ${data.fullName}`);

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
    .header { background-color: #0c332c; padding: 40px; text-align: center; }
    .logo { max-width: 180px; height: auto; }
    .content { padding: 40px; }
    .title { color: #1a1a1a; font-size: 24px; font-weight: 700; margin: 0 0 20px 0; }
    .message { color: #4a5568; font-size: 16px; line-height: 1.7; margin: 0 0 20px 0; }
    .important { border-left: 4px solid #d32f2f; background-color: #fef5f5; padding: 20px; margin: 25px 0; }
    .important h3 { margin: 0 0 12px 0; color: #d32f2f; font-size: 16px; }
    .important p { margin: 0; color: #4a5568; font-size: 14px; line-height: 1.6; }
    .policies-section { border: 2px solid #0c332c; border-radius: 8px; padding: 25px; margin: 25px 0; background-color: #f9fafb; }
    .policies-section h3 { margin: 0 0 18px 0; color: #0c332c; font-size: 18px; font-weight: 700; text-align: center; }
    .policy-link { display: block; margin: 12px 0; padding: 12px; background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 6px; text-decoration: none; color: #0c332c; font-weight: 600; text-align: center; transition: all 0.2s; }
    .policy-link:hover { background-color: #0c332c; color: #ffffff; border-color: #0c332c; }
    .button { display: inline-block; background-color: #0c332c; color: #ffffff !important; padding: 14px 36px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 20px 0; }
    .footer { background-color: #0c332c; padding: 30px; text-align: center; color: #ffffff; }
    .footer a { color: #ffffff; text-decoration: none; margin: 0 10px; }
    .warning { border-left: 4px solid #ff9800; background-color: #fff8e1; padding: 16px; margin: 20px 0; border-radius: 4px; }
    .warning p { margin: 0; color: #e65100; font-size: 14px; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://res.cloudinary.com/dl2lomrhp/image/upload/v1763935567/edufiliova/edufiliova-white-logo.png
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
    const htmlPath = path.resolve(process.cwd(), 'public/email-assets/freelancer-application-approved/template.html');
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

    return this.sendEmail({
      to: email,
      subject: 'Welcome Aboard! Your Freelancer Application is Approved - EduFiliova',
      html,
      from: `"EduFiliova Support" <support@edufiliova.com>`,
      attachments: [] // Images are handled via Cloudinary URLs in sendEmail
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
    const htmlPath = path.resolve(process.cwd(), 'public/email-assets/freelancer-application-declined/template.html');
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
    const reasonText = data.reason && data.reason.trim() ? data.reason : 'Your application did not meet our current freelancer requirements. Please review the feedback and strengthen your profile before reapplying.';

    // ✅ USE BULLETPROOF NAME REPLACEMENT FIRST - THIS IS CRITICAL
    html = this.forceReplaceName(html, fullName);

    // Final cleanup
    html = html.replace(/\{\{rejectionReason\}\}/gi, reasonText);
    html = html.replace(/\{\{baseUrl\}\}/gi, baseUrl);
    html = html.replace(/\{\{email\}\}/gi, email);

    return this.sendEmail({
      to: email,
      subject: 'Freelancer Application Status Update - EduFiliova',
      html,
      from: `"EduFiliova Support" <support@edufiliova.com>`
    });
  }

  async sendFreelancerSubmissionEmail(email: string, data: { fullName: string; displayName?: string }): Promise<boolean> {
    const baseUrl = this.getBaseUrl();
    const htmlPath = path.resolve(process.cwd(), 'public/email-assets/freelancer-application-submitted/template.html');
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
    html = html.replace(/\{\{email\}\}/gi, email);

    return this.sendEmail({
      to: email,
      subject: 'Your Freelancer Application Has Been Received - EduFiliova',
      html,
      from: `"EduFiliova Support" <support@edufiliova.com>`
    });
  }

  async sendFreelancerPendingEmail(email: string, data: { fullName: string; displayName?: string }): Promise<boolean> {
    const baseUrl = this.getBaseUrl();
    const htmlPath = path.resolve(process.cwd(), 'public/email-assets/freelancer-application-under-review/template.html');
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
    html = html.replace(/\{\{email\}\}/gi, email);

    return this.sendEmail({
      to: email,
      subject: 'Your Freelancer Application Status: Under Review - EduFiliova',
      html,
      from: `"EduFiliova Support" <support@edufiliova.com>`
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


  async sendSubscriptionCancellationEmail(email: string, customerName: string, planName: string, expiryDate?: string): Promise<boolean> {
    const baseUrl = this.getBaseUrl();
    const formattedExpiryDate = expiryDate ? new Date(expiryDate).toLocaleDateString() : 'the end of your billing period';
    
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Subscription Cancelled</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f7fa; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background: white; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
    .header { background-color: #0c332c; padding: 30px 40px; text-align: center; }
    .content { padding: 40px; }
    .info-box { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0c332c; }
    .info-item { margin: 10px 0; font-size: 16px; }
    .message { color: #64748b; font-size: 16px; line-height: 1.6; margin: 20px 0; }
    .cta-button { display: inline-block; background-color: #0c332c; color: white !important; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; }
    .footer { background: #0c332c; padding: 30px 40px; color: #ffffff; text-align: center; }
    .footer-text { margin: 5px 0; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="color: #ffffff; margin: 0;">EduFiliova</h1>
    </div>
    <div class="content">
      <h2 style="color: #1a1a1a; margin-top: 0;">Subscription Cancelled</h2>
      <p style="color: #64748b;">Hello ${customerName || 'Valued Customer'},</p>
      <p class="message">We're sorry to see you go. Your <strong>${planName}</strong> subscription has been cancelled.</p>
      <div class="info-box">
        <div class="info-item"><strong>Plan:</strong> ${planName}</div>
        <div class="info-item"><strong>Access Until:</strong> ${formattedExpiryDate}</div>
        <div class="info-item"><strong>Status:</strong> Cancelled</div>
      </div>
      <div class="message">
        You'll continue to have full access to all premium features until <strong>${formattedExpiryDate}</strong>. After that, your account will switch to the free plan.
      </div>
      <div class="message">
        Changed your mind? You can reactivate your subscription anytime before it expires.
      </div>
      <div style="text-align: center;">
        <a href="${baseUrl}/?page=student-dashboard" class="cta-button">Visit Your Dashboard</a>
      </div>
      <div class="message" style="margin-top: 30px; font-size: 14px; color: #718096;">
        If you have any questions or feedback about why you cancelled, we'd love to hear from you. Simply reply to this email or contact our support team.
      </div>
    </div>
    <div class="footer">
      <div class="footer-text">Thank you for being part of the EduFiliova community!</div>
      <div class="footer-text">&copy; ${new Date().getFullYear()} EduFiliova. All rights reserved.</div>
    </div>
  </div>
</body>
</html>`;

    return this.sendEmail({
      to: email,
      subject: `Your ${planName} Subscription Has Been Cancelled`,
      html,
      from: `"EduFiliova" <support@edufiliova.com>`
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
    const expiresIn = data.expiresIn || '15';

    // ✅ USE BULLETPROOF NAME REPLACEMENT - handles split HTML spans
    html = this.forceReplaceName(html, fullName);
    
    // Replace other dynamic placeholders
    html = html.replace(/\{\{code\}\}/gi, code);
    html = html.replace(/\{\{expiresIn\}\}/gi, expiresIn);
    html = html.replace(/\{\{fullName\}\}/gi, fullName); // Extra safety

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
    const expiresIn = data.expiresIn || '15 minutes';

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
    
    // Ensure template exists, if not use a robust fallback
    let html: string;
    try {
      if (fs.existsSync(htmlPath)) {
        html = fs.readFileSync(htmlPath, 'utf-8');
      } else {
        console.warn(`⚠️ Freelancer verification template not found at ${htmlPath}. Using fallback.`);
        html = `<!DOCTYPE html><html><body><h1>Verify Your Email</h1><p>Hi {{fullName}},</p><p>Your verification code is: <strong>{{code}}</strong></p><p>Expires in: {{expiresIn}}</p></body></html>`;
      }
    } catch (err) {
      console.error('❌ Error reading freelancer verification template:', err);
      html = `<!DOCTYPE html><html><body><h1>Verify Your Email</h1><p>Your verification code is: <strong>{{code}}</strong></p></body></html>`;
    }

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
      from: `"EduFiliova Security" <verify@edufiliova.com>`
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

      const logoUrl = 'https://res.cloudinary.com/dl2lomrhp/image/upload/v1763935567/edufiliova/edufiliova-white-logo.png';

      return this.sendEmail({
        to: email,
        subject: 'Application Received - Your Teacher Application is Under Review',
        html,
        from: `"EduFiliova Applications" <support@edufiliova.com>`,
        attachments: []
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

      const logoUrl = 'https://res.cloudinary.com/dl2lomrhp/image/upload/v1763935567/edufiliova/edufiliova-white-logo.png';

      return this.sendEmail({
        to: email,
        subject: 'Application Resubmitted - Your Teacher Application is Under Review',
        html,
        from: `"EduFiliova Applications" <support@edufiliova.com>`,
        attachments: []
      });
    } catch (error) {
      console.error('❌ Error sending application resubmitted email:', error);
      return false;
    }
  }

  async sendFreelancerApplicationSubmittedEmail(email: string, data: { fullName: string }): Promise<boolean> {
    const html = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Application Received - EduFiliova</title>
  <style type="text/css">
    body { margin: 0; padding: 0; min-width: 100%; background-color: #f4f7f9; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }
    .wrapper { width: 100%; table-layout: fixed; background-color: #f4f7f9; padding-bottom: 40px; }
    .main-table { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
    .header { background-color: #0c332c; padding: 40px 0; text-align: center; }
    .content { padding: 40px 50px; color: #333333; line-height: 1.6; }
    .content h1 { color: #0c332c; font-size: 24px; margin-bottom: 20px; font-weight: 700; }
    .content p { font-size: 16px; margin-bottom: 20px; }
    .footer { background-color: #f8fafc; padding: 40px 50px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 13px; }
    .footer p { margin: 10px 0; line-height: 1.5; }
    .footer a { color: #0c332c; text-decoration: none; font-weight: 600; }
    .divider { height: 1px; background-color: #e2e8f0; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <table class="main-table" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td class="header">
          <img src="https://res.cloudinary.com/dl2lomrhp/image/upload/v1763935567/edufiliova/edufiliova-white-logo.png" alt="EduFiliova" width="180" style="display: block; margin: 0 auto;" />
        </td>
      </tr>
      <tr>
        <td class="content">
          <h1>Application Received</h1>
          <p>Hello {{fullName}},</p>
          <p>We've successfully received your freelancer application. Our team will review your profile and portfolio samples shortly.</p>
          <p>The review process typically takes 3-5 business days. We will notify you via email as soon as an update is available.</p>
          <p>Thank you for your patience and interest in EduFiliova.</p>
          <p>Best regards,<br />The EduFiliova Team</p>
        </td>
      </tr>
      <tr>
        <td class="footer">
          <p><strong>EduFiliova</strong></p>
          <p>Empowering global talent through education and opportunity.</p>
          <div class="divider"></div>
          <p>This is an automated message. Please do not reply directly to this email. For assistance, contact our support team at <a href="mailto:support@edufiliova.com">support@edufiliova.com</a>.</p>
          <p>&copy; 2025 EduFiliova. All rights reserved.</p>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;

    return this.sendEmail({
      to: email,
      subject: 'Your Freelancer Application has been Received - EduFiliova',
      html: this.forceReplaceName(html, data.fullName),
      from: '"EduFiliova Support" <support@edufiliova.com>'
    });
  }

  async sendFreelancerApplicationResubmittedEmail(email: string, data: { fullName: string }): Promise<boolean> {
    try {
      const templatePath = path.resolve(process.cwd(), 'public', 'email-assets', 'freelancer-application-submitted', 'template.html');
      let html = fs.readFileSync(templatePath, 'utf-8');

      const fullName = data.fullName || 'Freelancer';

      // ✅ USE BULLETPROOF NAME REPLACEMENT
      html = this.forceReplaceName(html, fullName);

      const logoUrl = 'https://res.cloudinary.com/dl2lomrhp/image/upload/v1763935567/edufiliova/edufiliova-white-logo.png';

      return this.sendEmail({
        to: email,
        subject: 'Application Resubmitted - Your Freelancer Application is Under Review',
        html,
        from: `"EduFiliova Applications" <noreply@edufiliova.com>`,
        attachments: []
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

      const logoUrl = 'https://res.cloudinary.com/dl2lomrhp/image/upload/v1763935567/edufiliova/edufiliova-white-logo.png';

      return this.sendEmail({
        to: email,
        subject: `Payment Failed - Order #${orderId}`,
        html,
        from: `"EduFiliova Billing" <orders@edufiliova.com>`,
        attachments: []
      });
    } catch (error) {
      console.error('❌ Error sending payment failed email:', error);
      return false;
    }
  }

  async sendTeacherApplicationDeclinedEmailLegacy(email: string, data: { 
    fullName: string; 
    reason?: string;
  }): Promise<boolean> {
    try {
      const templatePath = path.resolve(process.cwd(), 'public', 'email-assets', 'teacher-application-declined', 'template.html');
      let html = fs.readFileSync(templatePath, 'utf-8');

      const fullName = data.fullName || 'Teacher';
      const reason = data.reason || '';

      // USE BULLETPROOF NAME REPLACEMENT
      html = this.forceReplaceName(html, fullName);
      
      // Handle conditional reason block
      if (reason) {
        html = html.replace(/\{\{#if reason\}\}([\s\S]*?)\{\{\/if\}\}/gi, '$1');
        html = html.replace(/\{\{\s*reason\s*\}\}/gi, reason);
      } else {
        html = html.replace(/\{\{#if reason\}\}[\s\S]*?\{\{\/if\}\}/gi, '');
      }

      // Attachments with CID references for embedded images
      const imagesPath = path.resolve(process.cwd(), 'server/email-local-assets');
      const attachments = [
        { filename: 'bbe5722d1ffd3c84888e18335965d5e5.png', path: path.join(imagesPath, 'bbe5722d1ffd3c84888e18335965d5e5.png'), cid: 'spiral1', contentType: 'image/png' },
        { filename: '0ac9744033a7e26f12e08d761c703308.png', path: path.join(imagesPath, '0ac9744033a7e26f12e08d761c703308.png'), cid: 'logo', contentType: 'image/png' },
        { filename: 'd320764f7298e63f6b035289d4219bd8.png', path: path.join(imagesPath, 'd320764f7298e63f6b035289d4219bd8.png'), cid: 'spiral2', contentType: 'image/png' },
        { filename: '917a6e905cf83da447efc0f5c2780aca.png', path: path.join(imagesPath, '917a6e905cf83da447efc0f5c2780aca.png'), cid: 'teacherapp', contentType: 'image/png' },
        { filename: 'de497c5361453604d8a15c4fd9bde086.png', path: path.join(imagesPath, 'de497c5361453604d8a15c4fd9bde086.png'), cid: 'declinedicon', contentType: 'image/png' },
        { filename: '7976503d64a3eef4169fe235111cdc57.png', path: path.join(imagesPath, '7976503d64a3eef4169fe235111cdc57.png'), cid: 'arrow', contentType: 'image/png' },
        { filename: '4a834058470b14425c9b32ace711ef17.png', path: path.join(imagesPath, '4a834058470b14425c9b32ace711ef17.png'), cid: 'logofull', contentType: 'image/png' },
        { filename: 'e06e238bd6d74a3e48f94e5b0b81388d.png', path: path.join(imagesPath, 'e06e238bd6d74a3e48f94e5b0b81388d.png'), cid: 'teacherbanner', contentType: 'image/png' },
        { filename: '9f7291948d8486bdd26690d0c32796e0.png', path: path.join(imagesPath, '9f7291948d8486bdd26690d0c32796e0.png'), cid: 'logofull2', contentType: 'image/png' }
      ];

      return this.sendEmail({
        to: email,
        subject: 'Teacher Application Update - EduFiliova',
        html,
        from: `"EduFiliova Applications" <noreply@edufiliova.com>`,
        attachments
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

      const logoUrl = 'https://res.cloudinary.com/dl2lomrhp/image/upload/v1763935567/edufiliova/edufiliova-white-logo.png';

      return this.sendEmail({
        to: email,
        subject: 'Your Application is Now Under Review - EduFiliova',
        html,
        from: `"EduFiliova Applications" <noreply@edufiliova.com>`,
        attachments: []
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

      const logoUrl = 'https://res.cloudinary.com/dl2lomrhp/image/upload/v1763935567/edufiliova/edufiliova-white-logo.png';

      return this.sendEmail({
        to: email,
        subject: 'Your Application is Now Under Review - EduFiliova',
        html,
        from: `"EduFiliova Applications" <noreply@edufiliova.com>`,
        attachments: []
      });
    } catch (error) {
      console.error('❌ Error sending freelancer under review email:', error);
      return false;
    }
  }

  wrapWithBrandedTemplate(title: string, content: string, unsubscribeLink?: string): string {
    const baseHtml = this.getGlobalTemplate(title, content);
    
    if (unsubscribeLink) {
      return baseHtml.replace(
        '<p>&copy; 2025 EduFiliova. All rights reserved.</p>',
        `<p><a href="${unsubscribeLink}" style="color: #64748b; text-decoration: underline;">Unsubscribe</a> from marketing emails</p>
        <p>&copy; 2025 EduFiliova. All rights reserved.</p>`
      );
    }
    
    return baseHtml;
  }

  async sendBulkEmailWithAttachment(options: {
    to: string;
    recipientName: string;
    subject: string;
    bodyContent: string;
    pdfBuffer?: Buffer;
    pdfFilename?: string;
    unsubscribeLink?: string;
    from?: string;
  }): Promise<boolean> {
    try {
      const personalizedContent = this.forceReplaceName(options.bodyContent, options.recipientName);
      const html = this.wrapWithBrandedTemplate(options.subject, personalizedContent, options.unsubscribeLink);
      
      const attachments: EmailAttachment[] = [];
      if (options.pdfBuffer && options.pdfFilename) {
        attachments.push({
          filename: options.pdfFilename,
          content: options.pdfBuffer,
          contentType: 'application/pdf'
        });
      }
      
      return this.sendEmail({
        to: options.to,
        subject: options.subject,
        html,
        from: options.from || `"EduFiliova" <support@edufiliova.com>`,
        attachments
      });
    } catch (error) {
      console.error('❌ Error sending bulk email with attachment:', error);
      return false;
    }
  }

  async sendMarketingEmail(options: {
    to: string;
    recipientName: string;
    subject: string;
    htmlContent: string;
    unsubscribeLink?: string;
    pdfBuffer?: Buffer;
    pdfFilename?: string;
    from?: string;
  }): Promise<boolean> {
    try {
      let content = options.htmlContent;
      content = this.forceReplaceName(content, options.recipientName);
      content = content.replace(/{{recipientName}}/gi, options.recipientName);
      content = content.replace(/{{recipientEmail}}/gi, options.to);
      
      const html = this.wrapWithBrandedTemplate(options.subject, content, options.unsubscribeLink);
      
      const attachments: EmailAttachment[] = [];
      if (options.pdfBuffer && options.pdfFilename) {
        attachments.push({
          filename: options.pdfFilename,
          content: options.pdfBuffer,
          contentType: 'application/pdf'
        });
      }
      
      return this.sendEmail({
        to: options.to,
        subject: options.subject,
        html,
        from: options.from || `"EduFiliova" <support@edufiliova.com>`,
        attachments
      });
    } catch (error) {
      console.error('❌ Error sending marketing email:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();
