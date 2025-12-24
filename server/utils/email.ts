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

class EmailService {
  private transporters: Map<string, Transporter> = new Map();
  private socialMediaCache: SocialMediaData | null = null;
  private lastCacheUpdate: number = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000;

  constructor() {
    this.initialize();
  }

  private getBaseUrl(): string {
    return process.env.REPLIT_DEV_DOMAIN 
      ? `https://${process.env.REPLIT_DEV_DOMAIN}`
      : 'https://edufiliova.com';
  }

  private initialize() {
    // Initialize asynchronously from database
    this.initializeFromDatabase();
  }

  private async initializeFromDatabase() {
    try {
      // Load email accounts from database
      const accounts = await db.select().from(emailAccounts).where(eq(emailAccounts.isActive, true));
      
      if (accounts.length === 0) {
        console.warn('⚠️ No active email accounts found in database');
        return;
      }

      let configuredCount = 0;
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
          configuredCount++;
        }
      }

      if (configuredCount === 0) {
        console.warn('⚠️ No email accounts configured from database');
      } else {
        console.log(`✅ Email service initialized with ${configuredCount} account(s) from database`);
      }
    } catch (error) {
      console.error('❌ Failed to initialize email service from database:', error);
    }
  }

  private async getSocialMediaLinks(): Promise<SocialMediaData> {
    const now = Date.now();
    if (this.socialMediaCache && (now - this.lastCacheUpdate < this.CACHE_TTL)) {
      return this.socialMediaCache;
    }

    try {
      const [social] = await db.select().from(socialMediaLinks).limit(1);
      this.socialMediaCache = social || {};
      this.lastCacheUpdate = now;
      return this.socialMediaCache;
    } catch (error) {
      console.error('Failed to fetch social media links:', error);
      return {};
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (this.transporters.size === 0) {
      console.warn('⚠️ Email not sent: Email service not configured');
      return false;
    }

    try {
      const from = options.from || `"EduFiliova" <orders@edufiliova.com>`;
      
      // Extract email address from "Display Name <email@example.com>" format
      const emailMatch = from.match(/<(.+?)>/);
      const senderEmail = emailMatch ? emailMatch[1] : from;
      
      // Get the appropriate transporter for this sender
      let transporter = this.transporters.get(senderEmail);
      
      // Fallback to orders@ if specific transporter not found
      if (!transporter) {
        transporter = this.transporters.get('orders@edufiliova.com');
      }
      
      if (!transporter) {
        console.error('❌ No transporter available for:', senderEmail);
        return false;
      }
      
      const baseUrl = process.env.REPLIT_DEV_DOMAIN 
        ? `https://${process.env.REPLIT_DEV_DOMAIN}` 
        : 'https://edufiliova.com';
      
      const mailOptions: any = {
        from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        headers: {
          'X-Mailer': 'EduFiliova Mailer',
          'X-Priority': '3',
          'List-Unsubscribe': `<${baseUrl}/unsubscribe>, <mailto:unsubscribe@edufiliova.com?subject=Unsubscribe>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      };
      
      if (options.attachments && options.attachments.length > 0) {
        mailOptions.attachments = options.attachments.map(att => ({
          filename: att.filename,
          content: att.content,
          contentType: att.contentType || 'application/pdf',
        }));
      }
      
      await transporter.sendMail(mailOptions);
      console.log(`✅ Email sent successfully from ${senderEmail} to:`, options.to, options.attachments ? `with ${options.attachments.length} attachment(s)` : '');
      return true;
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      return false;
    }
  }

  // Get SVG icon for social media (white color)
  private getSocialIcon(platform: 'instagram' | 'x' | 'facebook' | 'behance'): string {
    const icons = {
      instagram: '<svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>',
      x: '<svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
      facebook: '<svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>',
      behance: '<svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M6.938 4.503c.702 0 1.34.06 1.92.188.577.13 1.07.33 1.485.61.41.28.733.65.96 1.12.225.47.34 1.05.34 1.73 0 .74-.17 1.36-.507 1.86-.338.5-.837.9-1.502 1.22.906.26 1.576.72 2.022 1.37.448.66.665 1.45.665 2.36 0 .75-.13 1.39-.41 1.93-.28.55-.67 1-1.16 1.35-.48.348-1.05.6-1.67.767-.61.165-1.252.254-1.91.254H0V4.51h6.938v-.007zM16.94 16.665c.44.428 1.073.643 1.894.643.59 0 1.1-.148 1.53-.447.424-.29.68-.61.78-.94h2.588c-.403 1.28-1.048 2.2-1.9 2.75-.85.56-1.884.83-3.08.83-.837 0-1.584-.13-2.272-.4-.673-.27-1.24-.65-1.72-1.14-.464-.49-.823-1.07-1.077-1.74-.251-.67-.379-1.40-.379-2.18 0-.75.125-1.45.373-2.13.252-.67.608-1.25 1.078-1.72.47-.48 1.03-.85 1.693-1.12.66-.27 1.39-.404 2.22-.404.86 0 1.61.16 2.29.49.67.325 1.23.78 1.66 1.35.43.58.75 1.25.95 2.01.2.75.28 1.54.25 2.38h-7.69c-.02.86.18 1.57.62 1.99zm-6.43-9.42h4.42v1.62h-4.42v-1.62zm-6.44 11.65h2.55c.805 0 1.487-.17 2.038-.504.552-.336.836-.932.836-1.784 0-.44-.093-.8-.278-1.088-.186-.288-.43-.52-.733-.693-.303-.174-.65-.298-1.038-.372-.388-.075-.776-.112-1.164-.112H4.07v4.553zm0-6.43h2.32c.35 0 .695-.044 1.036-.132.34-.088.643-.22.907-.396.265-.176.478-.404.64-.684.162-.28.243-.625.243-1.037 0-.728-.23-1.275-.69-1.64-.46-.366-1.077-.548-1.853-.548H4.07v4.437zm13.96-1.074c-.4-.4-.944-.602-1.63-.602-.45 0-.834.088-1.154.26-.318.17-.574.39-.77.66-.193.267-.33.56-.41.878-.076.318-.11.62-.11.91h5.23c-.08-.77-.36-1.36-.76-1.76z"/></svg>'
    };
    return icons[platform];
  }

  // Get smaller SVG icon for contact info
  private getContactIcon(type: 'email' | 'website'): string {
    const icons = {
      email: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>',
      website: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>'
    };
    return icons[type];
  }

  getEmailTemplate(headerColor: 'orange' | 'blue' = 'blue', logoUrl?: string): string {
    const whiteLogoUrl = logoUrl || process.env.EDUFILIOVA_WHITE_LOGO_URL || 'https://res.cloudinary.com/dl2lomrhp/image/upload/v1763935567/edufiliova/edufiliova-white-logo.png';
    const headerBgColor = '#0C332C';
    
    return `
      <!DOCTYPE html>
      <html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="x-apple-disable-message-reformatting">
        <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no">
        <title>EduFiliova</title>
        <!--[if mso]>
        <noscript>
          <xml>
            <o:OfficeDocumentSettings>
              <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
          </xml>
        </noscript>
        <![endif]-->
        <style>
          body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #f5f7fa;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          }
          .header {
            background-color: ${headerBgColor};
            padding: 30px 40px;
            text-align: center;
            border-bottom: none;
          }
          .logo {
            max-width: 200px;
            width: 200px;
            height: auto;
            display: block;
            margin: 0 auto;
          }
          .logo-fallback {
            color: #ffffff;
            font-size: 28px;
            font-weight: 700;
            text-decoration: none;
            display: none;
          }
          .brand-name {
            color: #2d5ddd;
            font-size: 32px;
            font-weight: 700;
            margin: 0;
            letter-spacing: -0.5px;
          }
          .content {
            padding: 40px 40px;
          }
          .title {
            color: #1a1a1a;
            font-size: 26px;
            font-weight: 700;
            margin: 0 0 20px 0;
            line-height: 1.3;
          }
          .message {
            color: #4a5568;
            font-size: 16px;
            line-height: 1.6;
            margin: 0 0 25px 0;
          }
          .details-box {
            background-color: #f9fafb;
            border: 2px solid #e2e8f0;
            border-radius: 10px;
            padding: 25px;
            margin: 25px 0;
          }
          .details-table {
            width: 100%;
            border-collapse: collapse;
          }
          .details-table td {
            padding: 12px 0;
            border-bottom: 1px solid #e2e8f0;
            vertical-align: top;
          }
          .details-table tr:last-child td {
            border-bottom: none;
          }
          .detail-label {
            color: #64748b;
            font-size: 14px;
            font-weight: 600;
            text-align: left;
            width: 40%;
          }
          .detail-value {
            color: #1a1a1a;
            font-size: 14px;
            font-weight: 700;
            text-align: right;
            width: 60%;
          }
          .button {
            display: inline-block;
            background-color: #2d5ddd;
            color: #ffffff !important;
            padding: 14px 32px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 15px;
            margin: 20px 0;
            transition: background-color 0.3s;
          }
          .button:hover {
            background-color: #1e4ac9;
          }
          .button-secondary {
            background-color: #0C332C;
          }
          .button-secondary:hover {
            background-color: #e64520;
          }
          .verification-code-box {
            background: linear-gradient(135deg, #2d5ddd 0%, #1e4ac9 100%);
            border-radius: 12px;
            padding: 30px;
            text-align: center;
            margin: 30px 0;
          }
          .verification-code {
            font-size: 42px;
            font-weight: 800;
            color: #ffffff;
            letter-spacing: 10px;
            font-family: 'Courier New', monospace;
            margin: 10px 0;
          }
          .code-label {
            color: rgba(255, 255, 255, 0.9);
            font-size: 13px;
            font-weight: 600;
            letter-spacing: 2px;
            text-transform: uppercase;
          }
          .alert-info {
            background-color: #eff6ff;
            border-left: 4px solid #2d5ddd;
            padding: 15px 20px;
            border-radius: 6px;
            margin: 20px 0;
          }
          .alert-warning {
            background-color: #fff4ed;
            border-left: 4px solid #0C332C;
            padding: 15px 20px;
            border-radius: 6px;
            margin: 20px 0;
          }
          .alert-success {
            background-color: #f0fdf4;
            border-left: 4px solid #10b981;
            padding: 15px 20px;
            border-radius: 6px;
            margin: 20px 0;
          }
          .footer {
            background: #0C332C;
            padding: 40px;
            border-top: 3px solid #0C332C;
            color: #ffffff;
          }
          .footer-social {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 25px;
            border-bottom: 1px solid rgba(255,255,255,0.2);
          }
          .social-icon {
            display: inline-block;
            margin: 0 8px;
            padding: 10px;
            width: 44px;
            height: 44px;
            border-radius: 50%;
            background-color: rgba(255,255,255,0.15);
            text-align: center;
            text-decoration: none;
            transition: all 0.3s ease;
            border: 2px solid rgba(255,255,255,0.3);
          }
          .social-icon:hover {
            background-color: rgba(255,255,255,0.25);
            border-color: rgba(255,255,255,0.5);
          }
          .social-icon img {
            vertical-align: middle;
          }
          .footer-contact {
            text-align: center;
            margin: 25px 0;
          }
          .contact-item {
            display: inline-block;
            margin: 10px 20px;
            color: #ffffff;
            text-decoration: none;
            font-size: 14px;
          }
          .contact-item:hover {
            opacity: 0.8;
          }
          .footer-links {
            text-align: center;
            margin: 25px 0;
            padding-top: 25px;
            border-top: 1px solid rgba(255,255,255,0.2);
          }
          .footer-link {
            color: #ffffff !important;
            text-decoration: none;
            font-size: 13px;
            margin: 0 12px;
            font-weight: 500;
            transition: opacity 0.3s;
          }
          .footer-link:hover {
            opacity: 0.8;
            text-decoration: underline;
          }
          .footer-bottom {
            text-align: center;
            padding-top: 20px;
            margin-top: 20px;
            border-top: 1px solid rgba(255,255,255,0.2);
            color: rgba(255,255,255,0.7);
            font-size: 12px;
            line-height: 1.6;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <!--[if mso]>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr><td align="center">
            <![endif]-->
            <a href="https://edufiliova.com" style="text-decoration: none;">
              <img src="${whiteLogoUrl}" alt="EduFiliova - Learning Platform" class="logo" width="200" height="auto" style="max-width: 200px; width: 200px; height: auto; display: block; margin: 0 auto; border: 0;" />
            </a>
            <!--[if mso]>
            </td></tr></table>
            <![endif]-->
          </div>
    `;
  }

  async getEmailFooter(footerType: 'orange' | 'green' = 'orange', socialLinks?: SocialMediaData): Promise<string> {
    const baseUrl = process.env.REPLIT_DEV_DOMAIN 
      ? `https://${process.env.REPLIT_DEV_DOMAIN}`
      : 'https://edufiliova.com';
    
    return `
          <div class="footer">
            <div class="footer-contact">
              <p style="color: #ffffff; font-size: 16px; margin: 0 0 20px 0; text-align: center;">
                You need help? Contact us on <a href="mailto:support@edufiliova.com" style="color: #ffffff; text-decoration: underline;">support@edufiliova.com</a>
              </p>
            </div>
            
            <div class="footer-links">
              <a href="${baseUrl}/help" class="footer-link" style="color: #ffffff;">Help Center</a>
              <a href="${baseUrl}/privacy-policy" class="footer-link" style="color: #ffffff;">Privacy Policy</a>
              <a href="${baseUrl}/terms" class="footer-link" style="color: #ffffff;">Terms of Service</a>
              <a href="${baseUrl}/refund-policy" class="footer-link" style="color: #ffffff;">Refund Policy</a>
              <a href="${baseUrl}/contact" class="footer-link" style="color: #ffffff;">Contact Us</a>
            </div>
            
            <div class="footer-bottom">
              © ${new Date().getFullYear()} EduFiliova. All rights reserved.<br>
              Creativity, Learning, and Growth in One Place
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Ad Purchase Confirmation Email - uses orders@edufiliova.com
  async sendAdPurchaseEmail(
    email: string,
    data: {
      adTitle: string;
      placement: string;
      duration: number;
      price: number;
      orderId: string;
      customerName?: string;
    }
  ): Promise<boolean> {
    const footer = await this.getEmailFooter('orange');
    const html = `
      ${this.getEmailTemplate('orange')}
      <div class="content">
        <h2 class="title">Advertisement Purchase Confirmed!</h2>
        <p class="message">
          ${data.customerName ? `Hi ${data.customerName},` : 'Hello,'}
          <br><br>
          Thank you for your advertisement purchase! Your banner ad has been created and is pending approval. 
          Our team will review it within 24 business hours.
        </p>
        
        <div class="details-box">
          <table class="details-table">
            <tr>
              <td class="detail-label">Ad Title</td>
              <td class="detail-value">${data.adTitle}</td>
            </tr>
            <tr>
              <td class="detail-label">Placement</td>
              <td class="detail-value">${data.placement}</td>
            </tr>
            <tr>
              <td class="detail-label">Duration</td>
              <td class="detail-value">${data.duration} days</td>
            </tr>
            <tr>
              <td class="detail-label">Order ID</td>
              <td class="detail-value">#${data.orderId.substring(0, 12).toUpperCase()}</td>
            </tr>
            <tr>
              <td class="detail-label">Total Paid</td>
              <td class="detail-value" style="color: #0C332C;">$${data.price.toFixed(2)}</td>
            </tr>
          </table>
        </div>

        <p class="message">
          Once approved, your ad will be displayed to your target audience across the platform. 
          You can track impressions and clicks from your dashboard.
        </p>
        
        <a href="${this.getBaseUrl()}/customer-dashboard" class="button button-secondary">View Dashboard</a>
      </div>
      ${footer}
    `;

    return this.sendEmail({
      to: email,
      subject: `Advertisement Purchase Confirmed - Order #${data.orderId.substring(0, 8).toUpperCase()}`,
      html,
      from: `"EduFiliova Orders" <orders@edufiliova.com>`,
    });
  }

  // Course Purchase Confirmation Email
  async sendCoursePurchaseEmail(
    email: string,
    data: {
      courseName: string;
      price: number;
      orderId: string;
      customerName?: string;
      accessUrl?: string;
    }
  ): Promise<boolean> {
    const footer = await this.getEmailFooter('orange');
    const html = `
      ${this.getEmailTemplate('orange')}
      <div class="content">
        <h2 class="title">Course Purchase Confirmed!</h2>
        <p class="message">
          ${data.customerName ? `Hi ${data.customerName},` : 'Hello,'}
          <br><br>
          Congratulations! You now have full access to your new course. Start learning at your own pace.
        </p>
        
        <div class="details-box">
          <table class="details-table">
            <tr>
              <td class="detail-label">Course Name</td>
              <td class="detail-value">${data.courseName}</td>
            </tr>
            <tr>
              <td class="detail-label">Order ID</td>
              <td class="detail-value">#${data.orderId.substring(0, 12).toUpperCase()}</td>
            </tr>
            <tr>
              <td class="detail-label">Amount Paid</td>
              <td class="detail-value" style="color: #0C332C;">$${data.price.toFixed(2)}</td>
            </tr>
            <tr>
              <td class="detail-label">Access</td>
              <td class="detail-value">Lifetime Access</td>
            </tr>
          </table>
        </div>

        <p class="message">
          Your course materials are now available in your dashboard. You can access them anytime, anywhere.
        </p>
        
        <a href="${data.accessUrl || `${this.getBaseUrl()}/courses`}" class="button">Access Course Now</a>
      </div>
      ${footer}
    `;

    return this.sendEmail({
      to: email,
      subject: `Course Access Granted - ${data.courseName}`,
      html,
      from: `"EduFiliova Orders" <orders@edufiliova.com>`,
    });
  }

  // Subscription/Membership Purchase Email
  async sendSubscriptionEmail(
    email: string,
    data: {
      planName: string;
      price: number;
      billingCycle: string;
      orderId: string;
      customerName?: string;
      features: string[];
    }
  ): Promise<boolean> {
    const footer = await this.getEmailFooter('orange');
    const featuresHtml = data.features
      .map(feature => `<div style="padding: 8px 0; color: #4b5563;"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 8px;"><polyline points="20 6 9 17 4 12"/></svg>${feature}</div>`)
      .join('');

    const html = `
      ${this.getEmailTemplate('orange')}
      <div class="content">
        <h2 class="title">Subscription Activated!</h2>
        <p class="message">
          ${data.customerName ? `Hi ${data.customerName},` : 'Hello,'}
          <br><br>
          Welcome to ${data.planName}! Your subscription has been activated and you now have access to all premium features.
        </p>
        
        <div class="details-box">
          <table class="details-table">
            <tr>
              <td class="detail-label">Plan</td>
              <td class="detail-value">${data.planName}</td>
            </tr>
            <tr>
              <td class="detail-label">Billing Cycle</td>
              <td class="detail-value">${data.billingCycle}</td>
            </tr>
            <tr>
              <td class="detail-label">Order ID</td>
              <td class="detail-value">#${data.orderId.substring(0, 12).toUpperCase()}</td>
            </tr>
            <tr>
              <td class="detail-label">Amount</td>
              <td class="detail-value" style="color: #0C332C;">$${data.price.toFixed(2)}</td>
            </tr>
          </table>
        </div>

        <div style="margin: 30px 0;">
          <div style="font-size: 16px; font-weight: 600; color: #111827; margin-bottom: 15px;">
            Your Premium Features:
          </div>
          ${featuresHtml}
        </div>

        <p class="message">
          Start enjoying your premium membership benefits today!
        </p>
        
        <a href="${this.getBaseUrl()}/customer-dashboard" class="button">Go to Dashboard</a>
      </div>
      ${footer}
    `;

    return this.sendEmail({
      to: email,
      subject: `${data.planName} Subscription Activated - Welcome!`,
      html,
      from: `"EduFiliova Orders" <orders@edufiliova.com>`,
    });
  }

  // Digital Product Purchase Confirmation Email with Download Links
  async sendDigitalProductPurchaseEmail(
    email: string,
    data: {
      orderId: string;
      customerName?: string;
      totalPrice: number;
      items: Array<{
        name: string;
        downloadToken: string;
        expiresAt: Date;
      }>;
    }
  ): Promise<boolean> {
    const footer = await this.getEmailFooter('orange');
    const baseUrl = process.env.REPLIT_DEV_DOMAIN 
      ? `https://${process.env.REPLIT_DEV_DOMAIN}` 
      : 'http://localhost:5000';
    
    const itemsHtml = data.items
      .map(
        item => {
          const downloadUrl = `${baseUrl}/download/${item.downloadToken}`;
          const expiryDate = new Date(item.expiresAt).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
          });
          
          return `
          <div style="margin: 20px 0; padding: 20px; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px;">
            <div style="font-size: 16px; font-weight: 600; color: #111827; margin-bottom: 10px;">
              ${item.name}
            </div>
            <div style="margin: 15px 0;">
              <a href="${downloadUrl}" 
                 class="button" style="display: inline-block;">
                Download Now
              </a>
            </div>
            <div style="font-size: 12px; color: #6b7280; margin-top: 10px;">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 4px;"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              Download link expires on ${expiryDate}
            </div>
          </div>
        `;
        }
      )
      .join('');

    const html = `
      ${this.getEmailTemplate('orange')}
      <div class="content">
        <h2 class="title">Your Digital Products Are Ready!</h2>
        <p class="message">
          ${data.customerName ? `Hi ${data.customerName},` : 'Hello,'}
          <br><br>
          Thank you for your purchase! Your digital products are ready to download. Click the download buttons below to access your files.
        </p>
        
        <div class="alert-warning">
          <div style="color: #92400e; font-size: 14px; font-weight: 600; margin-bottom: 5px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#F59E0B" style="vertical-align: middle; margin-right: 6px;"><path d="M12 2L2 22h20L12 2zm0 4l7.5 14h-15L12 6zm-1 5v4h2v-4h-2zm0 6v2h2v-2h-2z"/></svg>
            Important: Download Links Expire in 3 Days
          </div>
          <div style="color: #b45309; font-size: 13px;">
            Please download your files within 3 days. After that, you'll need to request new download links from your dashboard.
          </div>
        </div>

        <div style="margin: 30px 0;">
          <div style="font-size: 18px; font-weight: 600; color: #111827; margin-bottom: 15px;">
            Your Downloads:
          </div>
          ${itemsHtml}
        </div>

        <div class="details-box">
          <table class="details-table">
            <tr>
              <td class="detail-label">Order ID</td>
              <td class="detail-value">#${data.orderId.substring(0, 12).toUpperCase()}</td>
            </tr>
            <tr>
              <td class="detail-label">Total Paid</td>
              <td class="detail-value" style="color: #0C332C;">$${data.totalPrice.toFixed(2)}</td>
            </tr>
          </table>
        </div>

        <p class="message">
          You can also access your downloads anytime from your customer dashboard.
        </p>
        
        <a href="${baseUrl}/customer-dashboard" class="button">Go to Dashboard</a>
      </div>
      ${footer}
    `;

    return this.sendEmail({
      to: email,
      subject: `Your Digital Products Are Ready - Order #${data.orderId.substring(0, 8).toUpperCase()}`,
      html,
      from: `"EduFiliova Orders" <orders@edufiliova.com>`,
    });
  }

  // Physical Product Purchase Confirmation Email
  async sendProductPurchaseEmail(
    email: string,
    data: {
      productName: string;
      quantity: number;
      price: number;
      orderId: string;
      customerName?: string;
      items: Array<{ name: string; quantity: number; price: number }>;
      shippingAddress?: string;
    }
  ): Promise<boolean> {
    const footer = await this.getEmailFooter('orange');
    const itemsHtml = data.items
      .map(
        item => `
            <tr>
              <td class="detail-label">${item.name} (x${item.quantity})</td>
              <td class="detail-value">$${(item.price * item.quantity).toFixed(2)}</td>
            </tr>
      `
      )
      .join('');

    const html = `
      ${this.getEmailTemplate('orange')}
      <div class="content">
        <h2 class="title">Order Confirmed!</h2>
        <p class="message">
          ${data.customerName ? `Hi ${data.customerName},` : 'Hello,'}
          <br><br>
          Thank you for your order! We've received your payment and your order is being processed. 
          We'll send you another email with tracking information once your order ships.
        </p>
        
        <div class="details-box">
          <div style="font-size: 14px; font-weight: 600; color: #111827; margin-bottom: 15px;">
            Order Items:
          </div>
          <table class="details-table">
          ${itemsHtml}
            <tr style="border-top: 2px solid #111827;">
              <td class="detail-label" style="font-size: 16px; padding-top: 15px;">Total</td>
              <td class="detail-value" style="color: #0C332C; font-size: 18px; padding-top: 15px;">$${data.price.toFixed(2)}</td>
            </tr>
          </table>
        </div>

        <div class="alert-info">
          <div style="color: #1e40af; font-size: 14px; font-weight: 600; margin-bottom: 5px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1e40af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 6px;"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
            Order ID: #${data.orderId.substring(0, 12).toUpperCase()}
          </div>
          <div style="color: #3b82f6; font-size: 13px;">
            ${data.shippingAddress ? `Shipping to: ${data.shippingAddress}<br>` : ''}
            You can track your order status in your dashboard
          </div>
        </div>

        <p class="message" style="font-size: 14px;">
          We'll email you as soon as your order ships with tracking details.
        </p>

        <a href="${this.getBaseUrl()}/customer-dashboard" class="button">View Order Details</a>
      </div>
      ${footer}
    `;

    return this.sendEmail({
      to: email,
      subject: `Order Confirmed - #${data.orderId.substring(0, 8).toUpperCase()}`,
      html,
      from: `"EduFiliova Orders" <orders@edufiliova.com>`,
    });
  }

  // Certificate Issuance Email
  async sendCertificateEmail(
    email: string,
    data: {
      studentName: string;
      courseTitle: string;
      completionDate: Date;
      verificationCode: string;
      certificateUrl: string;
      finalScore?: number;
    }
  ): Promise<boolean> {
    const footer = await this.getEmailFooter();
    const baseUrl = this.getBaseUrl();
    
    const verifyUrl = `${baseUrl}/verify-certificate/${data.verificationCode}`;
    const myCertificatesUrl = `${baseUrl}/my-certificates`;

    const completionDateStr = new Date(data.completionDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const html = `
      ${this.getEmailTemplate('blue')}
      <div class="content">
        <h2 class="title">Congratulations! Your Certificate is Ready</h2>
        <p class="message">
          Hi ${data.studentName},
          <br><br>
          Congratulations on completing <strong>${data.courseTitle}</strong>! We're proud of your achievement and dedication to learning.
        </p>
        
        <div class="details-box">
          <table class="details-table">
            <tr>
              <td class="detail-label">Course</td>
              <td class="detail-value">${data.courseTitle}</td>
            </tr>
            <tr>
              <td class="detail-label">Completion Date</td>
              <td class="detail-value">${completionDateStr}</td>
            </tr>
            ${data.finalScore ? `
            <tr>
              <td class="detail-label">Final Score</td>
              <td class="detail-value">${data.finalScore}%</td>
            </tr>
            ` : ''}
            <tr>
              <td class="detail-label">Verification Code</td>
              <td class="detail-value" style="font-family: monospace;">${data.verificationCode}</td>
            </tr>
          </table>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.certificateUrl}" class="button" style="margin: 10px;">Download Certificate</a>
          <a href="${verifyUrl}" class="button-secondary button" style="margin: 10px;">View Certificate</a>
        </div>

        <div class="alert-success">
          <div style="color: #065f46; font-size: 14px; font-weight: 600; margin-bottom: 5px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#065f46" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 6px;"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
            Share Your Achievement
          </div>
          <div style="color: #047857; font-size: 13px;">
            Share your certificate on LinkedIn, Twitter, or other social platforms to showcase your new skills!
          </div>
        </div>

        <p class="message">
          Your certificate is permanently stored in your account. You can access it anytime from your certificates dashboard.
        </p>
        
        <a href="${myCertificatesUrl}" class="button">View All Certificates</a>
      </div>
      ${footer}
    `;

    return this.sendEmail({
      to: email,
      subject: `Your Certificate for ${data.courseTitle} is Ready!`,
      html,
      from: `"EduFiliova Orders" <orders@edufiliova.com>`,
    });
  }

  // @deprecated - Use sendVerificationLinkEmail instead (link-based verification)
  // Legacy Teacher Verification Code Email - kept for backward compatibility only
  async sendTeacherVerificationEmail(
    email: string,
    data: {
      fullName: string;
      verificationCode: string;
    }
  ): Promise<boolean> {
    const footer = await this.getEmailFooter();
    const html = `
      ${this.getEmailTemplate('blue')}
      <div class="content">
        <h2 class="title">Verify Your Email Address</h2>
        <p class="message">
          Hi ${data.fullName},
          <br><br>
          Thank you for applying to become a teacher on EduFiliova! To continue with your application, 
          please verify your email address using the code below.
        </p>
        
        <div class="verification-code-box">
          <div class="code-label">YOUR VERIFICATION CODE</div>
          <div class="verification-code">${data.verificationCode}</div>
          <div style="color: rgba(255, 255, 255, 0.8); font-size: 12px; margin-top: 10px;">
            Code expires in 24 hours
          </div>
        </div>

        <p class="message">
          Please enter this code on the verification page to continue with your teacher application.
        </p>

        <div class="alert-warning">
          <div style="color: #92400e; font-size: 13px;">
            <strong>Didn't request this?</strong> If you didn't apply to become a teacher, 
            you can safely ignore this email.
          </div>
        </div>

        <p class="message" style="font-size: 14px;">
          Need help? Contact our support team at support@edufiliova.com
        </p>
      </div>
      ${footer}
    `;

    return this.sendEmail({
      to: email,
      subject: '[Action Required] Verify Your Teacher Application - EduFiliova',
      html,
      from: `"EduFiliova Verification" <verify@edufiliova.com>`,
    });
  }

  // @deprecated - Use sendVerificationLinkEmail instead (link-based verification)
  // Legacy Freelancer Verification Code Email - kept for backward compatibility only
  async sendFreelancerVerificationEmail(
    email: string,
    data: {
      fullName: string;
      verificationCode: string;
    }
  ): Promise<boolean> {
    const footer = await this.getEmailFooter();
    const html = `
      ${this.getEmailTemplate('blue')}
      <div class="content">
        <h2 class="title">Verify Your Email Address</h2>
        <p class="message">
          Hi ${data.fullName},
          <br><br>
          Thank you for applying to become a freelancer on EduFiliova! To continue with your application, 
          please verify your email address using the code below.
        </p>
        
        <div class="verification-code-box">
          <div class="code-label">YOUR VERIFICATION CODE</div>
          <div class="verification-code">${data.verificationCode}</div>
          <div style="color: rgba(255, 255, 255, 0.8); font-size: 12px; margin-top: 10px;">
            Code expires in 24 hours
          </div>
        </div>

        <p class="message">
          Please enter this code on the verification page to continue with your freelancer application.
        </p>

        <div class="alert-warning">
          <div style="color: #92400e; font-size: 13px;">
            <strong>Didn't request this?</strong> If you didn't apply to become a freelancer, 
            you can safely ignore this email.
          </div>
        </div>

        <p class="message" style="font-size: 14px;">
          Need help? Contact our support team at support@edufiliova.com
        </p>
      </div>
      ${footer}
    `;

    return this.sendEmail({
      to: email,
      subject: '[Action Required] Verify Your Freelancer Application - EduFiliova',
      html,
      from: `"EduFiliova Verification" <verify@edufiliova.com>`,
    });
  }

  // Send Verification Link Email (for Teacher/Freelancer registration flow)
  async sendVerificationLinkEmail(
    email: string,
    data: {
      fullName: string;
      verificationLink: string;
      expiresIn: string;
      applicationType?: 'teacher' | 'freelancer';
    }
  ): Promise<boolean> {
    const footer = await this.getEmailFooter();
    const appType = data.applicationType === 'freelancer' ? 'freelancer' : 'teacher';
    const appTitle = appType === 'freelancer' ? 'Freelancer' : 'Teacher';
    
    const html = `
      ${this.getEmailTemplate('orange')}
      <div class="content">
        <h2 class="title">Verify Your Email Address</h2>
        <p class="message">
          Hi ${data.fullName},
          <br><br>
          Thank you for applying to become a ${appType} on EduFiliova! To complete your registration, 
          please click the button below to verify your email address.
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.verificationLink}" style="display: inline-block; background: linear-gradient(135deg, #0C332C 0%, #e84a2a 100%); color: #ffffff; text-decoration: none; padding: 16px 48px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(255, 88, 52, 0.3);">
            Verify Email Address
          </a>
        </div>

        <div style="background: rgba(255, 88, 52, 0.08); border-radius: 8px; padding: 15px; margin: 20px 0; border-left: 4px solid #0C332C;">
          <div style="color: #9a3412; font-size: 14px;">
            <strong>Link expires in ${data.expiresIn}</strong>
          </div>
        </div>

        <p class="message" style="font-size: 13px; color: #666;">
          If the button doesn't work, copy and paste this link into your browser:
          <br>
          <span style="word-break: break-all; color: #0C332C;">${data.verificationLink}</span>
        </p>

        <div class="alert-warning">
          <div style="color: #92400e; font-size: 13px;">
            <strong>Didn't apply?</strong> If you didn't apply to become a ${appType} on EduFiliova, 
            you can safely ignore this email. No account will be created.
          </div>
        </div>

        <p class="message" style="font-size: 14px;">
          Need help? Contact our support team at support@edufiliova.com
        </p>
      </div>
      ${footer}
    `;

    return this.sendEmail({
      to: email,
      subject: `[Action Required] Verify Your ${appTitle} Application - EduFiliova`,
      html,
      from: `"EduFiliova Verification" <verify@edufiliova.com>`,
    });
  }

  // Send Student Verification Email
  async sendStudentVerificationEmail(
    email: string,
    data: {
      fullName: string;
      verificationCode: string;
    }
  ): Promise<boolean> {
    const footer = await this.getEmailFooter();
    const html = `
      ${this.getEmailTemplate('orange')}
      <div class="content">
        <h2 class="title">Verify Your Email Address</h2>
        <p class="message">
          Hi ${data.fullName},
          <br><br>
          Welcome to EduFiliova! To complete your registration and start learning, 
          please verify your email address using the code below.
        </p>
        
        <div class="verification-code-box">
          <div class="code-label">YOUR VERIFICATION CODE</div>
          <div class="verification-code">${data.verificationCode}</div>
          <div style="color: rgba(255, 255, 255, 0.8); font-size: 12px; margin-top: 10px;">
            Code expires in 15 minutes
          </div>
        </div>

        <p class="message">
          Please enter this code on the verification page to complete your signup and create your account.
        </p>

        <div class="alert-warning">
          <div style="color: #92400e; font-size: 13px;">
            <strong>Didn't request this?</strong> If you didn't try to sign up for EduFiliova, 
            you can safely ignore this email.
          </div>
        </div>

        <p class="message" style="font-size: 14px;">
          Need help? Contact our support team at support@edufiliova.com
        </p>
      </div>
      ${footer}
    `;

    return this.sendEmail({
      to: email,
      subject: '[Action Required] Verify Your Email - EduFiliova',
      html,
      from: `"EduFiliova Verification" <verify@edufiliova.com>`,
    });
  }

  // @deprecated - Use sendShopVerificationLinkEmail instead (link-based verification)
  // Legacy Shop Customer Verification Code Email - kept for backward compatibility only
  async sendShopVerificationEmail(
    email: string,
    data: {
      fullName: string;
      verificationCode: string;
    }
  ): Promise<boolean> {
    const footer = await this.getEmailFooter();
    const html = `
      ${this.getEmailTemplate('orange')}
      <div class="content">
        <h2 class="title">Verify Your Email Address</h2>
        <p class="message">
          Hi ${data.fullName},
          <br><br>
          Welcome to EduFiliova Shop! To complete your registration and start shopping, 
          please verify your email address using the code below.
        </p>
        
        <div class="verification-code-box">
          <div class="code-label">YOUR VERIFICATION CODE</div>
          <div class="verification-code">${data.verificationCode}</div>
          <div style="color: rgba(255, 255, 255, 0.8); font-size: 12px; margin-top: 10px;">
            Code expires in 15 minutes
          </div>
        </div>

        <p class="message">
          Please enter this code on the verification page to complete your signup and create your account.
        </p>

        <div class="alert-warning">
          <div style="color: #92400e; font-size: 13px;">
            <strong>Didn't request this?</strong> If you didn't try to sign up for EduFiliova Shop, 
            you can safely ignore this email.
          </div>
        </div>

        <p class="message" style="font-size: 14px;">
          Need help? Contact our support team at support@edufiliova.com
        </p>
      </div>
      ${footer}
    `;

    return this.sendEmail({
      to: email,
      subject: '[Action Required] Verify Your Email - EduFiliova Shop',
      html,
      from: `"EduFiliova Verification" <verify@edufiliova.com>`,
    });
  }

  // Send Shop Customer Verification Link Email (link based)
  async sendShopVerificationLinkEmail(
    email: string,
    data: {
      fullName: string;
      verificationLink: string;
      expiresIn: string;
    }
  ): Promise<boolean> {
    const footer = await this.getEmailFooter();
    const html = `
      ${this.getEmailTemplate('orange')}
      <div class="content">
        <h2 class="title">Verify Your Email Address</h2>
        <p class="message">
          Hi ${data.fullName},
          <br><br>
          Welcome to EduFiliova Shop! To complete your registration and start shopping, 
          please click the button below to verify your email address.
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.verificationLink}" style="display: inline-block; background: linear-gradient(135deg, #0C332C 0%, #e84a2a 100%); color: #ffffff; text-decoration: none; padding: 16px 48px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(255, 88, 52, 0.3);">
            Verify Email Address
          </a>
        </div>

        <div style="background: rgba(255, 88, 52, 0.08); border-radius: 8px; padding: 15px; margin: 20px 0; border-left: 4px solid #0C332C;">
          <div style="color: #9a3412; font-size: 14px;">
            <strong>Link expires in ${data.expiresIn}</strong>
          </div>
        </div>

        <p class="message" style="font-size: 13px; color: #666;">
          If the button doesn't work, copy and paste this link into your browser:
          <br>
          <span style="word-break: break-all; color: #0C332C;">${data.verificationLink}</span>
        </p>

        <div class="alert-warning">
          <div style="color: #92400e; font-size: 13px;">
            <strong>Didn't request this?</strong> If you didn't try to sign up for EduFiliova Shop, 
            you can safely ignore this email. No account will be created.
          </div>
        </div>

        <p class="message" style="font-size: 14px;">
          Need help? Contact our support team at support@edufiliova.com
        </p>
      </div>
      ${footer}
    `;

    return this.sendEmail({
      to: email,
      subject: '[Action Required] Verify Your Email - EduFiliova Shop',
      html,
      from: `"EduFiliova Verification" <verify@edufiliova.com>`,
    });
  }

  // Send Teacher Approval Email - Uses Your Custom HTML Template
  async sendTeacherApprovalEmail(
    email: string,
    data: {
      fullName: string;
      displayName: string;
    }
  ): Promise<boolean> {
    // Your custom professional B2B email template
    const html = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><link rel="preload" as="image" href="images/db561a55b2cf0bc6e877bb934b39b700.png"><link rel="preload" as="image" href="images/41506b29d7f0bbde9fcb0d4afb720c70.png"><link rel="preload" as="image" href="images/83faf7f361d9ba8dfdc904427b5b6423.png"><link rel="preload" as="image" href="images/3d94f798ad2bd582f8c3afe175798088.png"><link rel="preload" as="image" href="images/afa2a8b912b8da2c69e49d9de4a30768.png"><link rel="preload" as="image" href="images/9f7291948d8486bdd26690d0c32796e0.png"><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"><meta name="format-detection" content="telephone=no, date=no, address=no, email=no"><meta name="x-apple-disable-message-reformatting"><meta name="keywords" content="EduFiliova Teacher Approval"><style>body { width: 100%; -webkit-text-size-adjust: 100%; text-size-adjust: 100%; background-color: #f0f1f5; margin: 0; padding: 0; } table { border-collapse: collapse; } .layout-0 { display: table; } .dark-green { background-color: #0C332C; } .teacher-name { color: #ffffff; font-weight: 700; font-size: 18px; } .approval-heading { color: #ffffff; font-size: 28px; font-weight: 700; margin: 20px 0; }</style></head><body style="width:100%;-webkit-text-size-adjust:100%;text-size-adjust:100%;background-color:#f0f1f5;margin:0;padding:0"><table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#f0f1f5" style="background-color:#f0f1f5"><tbody><tr><td style="background-color:#f0f1f5"><table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;margin:0 auto;background-color:#ffffff"><tbody><tr><td><table border="0" cellpadding="0" cellspacing="0" class="layout-0 dark-green" align="center" style="display:table;border-spacing:0px;border-collapse:separate;width:100%;max-width:100%;table-layout:fixed;margin:0 auto;background-color:#0C332C"><tbody><tr><td style="text-align:center;padding:40px 30px"><div class="approval-heading">Congratulations, ${data.fullName}!</div><p style="color:#a0fab2;font-size:16px;margin:10px 0;">Your Teacher Application is Approved</p></td></tr></tbody></table></td></tr><tr><td style="padding:40px 30px"><p style="color:#333;font-size:16px;line-height:1.6;margin:0 0 20px 0;">Dear ${data.fullName},</p><p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 20px 0;">We're thrilled to inform you that your teacher application has been <strong>approved</strong>! You are now officially part of the EduFiliova teaching community.</p><table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin:30px 0;background:#f9fafb;border-left:4px solid #0C332C"><tbody><tr><td style="padding:20px"><h3 style="color:#0C332C;margin:0 0 15px 0;font-size:16px;">What You Can Do Now:</h3><ul style="color:#666;font-size:14px;line-height:1.8;margin:0;padding-left:20px"><li>Access your teacher dashboard</li><li>Create and upload courses</li><li>Connect with students worldwide</li><li>Manage your teaching materials</li><li>Track student progress</li></ul></td></tr></tbody></table><p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 25px 0;"><a href="https://edufiliova.com/teacher/dashboard" style="display:inline-block;background-color:#0C332C;color:#ffffff;padding:14px 32px;text-decoration:none;border-radius:6px;font-weight:600;font-size:15px;">Access Your Teacher Dashboard</a></p><p style="color:#999;font-size:13px;line-height:1.6;">Need help? Contact our support team at support@edufiliova.com</p></td></tr><tr><td style="background-color:#0C332C;padding:30px;color:#ffffff;text-align:center;font-size:12px"><p style="margin:10px 0;line-height:1.6;">© 2024 EduFiliova. All rights reserved.<br>Creativity, Learning, and Growth in One Place</p></td></tr></tbody></table></td></tr></tbody></table></body></html>`;

    return this.sendEmail({
      to: email,
      subject: 'Congratulations! Your Teacher Application is Approved - EduFiliova',
      html,
      from: `"EduFiliova Support" <support@edufiliova.com>`,
    });
  }

  // Send Teacher Under Review Email
  async sendTeacherUnderReviewEmail(
    email: string,
    data: {
      fullName: string;
    }
  ): Promise<boolean> {
    const footer = await this.getEmailFooter();
    
    const html = `
      ${this.getEmailTemplate('orange')}
      <div class="content">
        <h2 class="title">Your Application is Under Review</h2>
        <p class="message">
          Hi ${data.fullName},
          <br><br>
          Thank you for applying to become a teacher at EduFiliova. We wanted to let you know that your application is now being actively reviewed by our team.
        </p>
        
        <div class="alert-info" style="text-align: center; padding: 30px;">
          <div style="margin-bottom: 10px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="22" fill="#6366F1"/>
              <circle cx="24" cy="24" r="8" stroke="white" stroke-width="3"/>
              <line x1="30" y1="30" x2="38" y2="38" stroke="white" stroke-width="3" stroke-linecap="round"/>
            </svg>
          </div>
          <div style="color: #1e40af; font-size: 18px; font-weight: bold; margin-bottom: 8px;">
            Application Under Review
          </div>
          <div style="color: #1d4ed8; font-size: 14px;">
            Our team is carefully reviewing your documents and qualifications
          </div>
        </div>

        <p class="message">
          This process typically takes 2-5 business days. We'll notify you via email once a decision has been made.
        </p>

        <div class="details-box">
          <div style="color: #374151; font-size: 14px; font-weight: 600; margin-bottom: 15px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 48 48" fill="none" style="vertical-align: middle; margin-right: 8px;">
              <rect x="6" y="6" width="36" height="36" rx="4" fill="#F3F4F6"/>
              <circle cx="14" cy="16" r="3" fill="#10B981"/>
              <circle cx="14" cy="24" r="3" fill="#10B981"/>
              <circle cx="14" cy="32" r="3" fill="#10B981"/>
              <path d="M22 16H38M22 24H38M22 32H32" stroke="#374151" stroke-width="2" stroke-linecap="round"/>
            </svg>
            What happens next:
          </div>
          <div style="color: #4b5563; font-size: 14px; line-height: 1.8;">
            1. Our team reviews your qualifications<br>
            2. We verify your documents<br>
            3. You'll receive an approval or rejection email<br>
            4. If approved, you can start teaching!
          </div>
        </div>
        
        <p class="message" style="font-size: 14px; margin-top: 30px;">
          Have questions? Contact our support team at <a href="mailto:support@edufiliova.com" style="color: #2d5ddd; text-decoration: none;">support@edufiliova.com</a>
        </p>
      </div>
      ${footer}
    `;

    return this.sendEmail({
      to: email,
      subject: 'Your Teacher Application is Under Review - EduFiliova',
      html,
      from: `"EduFiliova Support" <support@edufiliova.com>`,
    });
  }

  // Send Teacher Rejection Email
  async sendTeacherRejectionEmail(
    email: string,
    data: {
      fullName: string;
      reason?: string;
    }
  ): Promise<boolean> {
    const footer = await this.getEmailFooter();
    
    const html = `
      ${this.getEmailTemplate('orange')}
      <div class="content">
        <h2 class="title">Application Update</h2>
        <p class="message">
          Hi ${data.fullName},
          <br><br>
          Thank you for your interest in becoming a teacher at EduFiliova. After careful review of your application, we regret to inform you that we are unable to approve your application at this time.
        </p>
        
        <div class="alert-warning" style="text-align: center; padding: 30px;">
          <div style="margin-bottom: 10px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none">
              <path d="M24 4L44 40H4L24 4Z" fill="#F59E0B"/>
              <path d="M24 18V28M24 32V34" stroke="white" stroke-width="3" stroke-linecap="round"/>
            </svg>
          </div>
          <div style="color: #92400e; font-size: 18px; font-weight: bold; margin-bottom: 8px;">
            Application Not Approved
          </div>
        </div>

        ${data.reason ? `
        <div class="details-box">
          <div style="color: #374151; font-size: 14px; font-weight: 600; margin-bottom: 15px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 48 48" fill="none" style="vertical-align: middle; margin-right: 8px;">
              <rect x="6" y="8" width="36" height="36" rx="4" fill="#F3F4F6" stroke="#374151" stroke-width="2"/>
              <path d="M14 18H34M14 26H30M14 34H26" stroke="#374151" stroke-width="2" stroke-linecap="round"/>
            </svg>
            Reason:
          </div>
          <div style="color: #4b5563; font-size: 14px; line-height: 1.8;">
            ${data.reason}
          </div>
        </div>
        ` : ''}

        <p class="message">
          We encourage you to address any issues mentioned above and reapply in the future. You may also contact our support team if you have questions about this decision.
        </p>
        
        <p class="message" style="font-size: 14px; margin-top: 30px;">
          Need clarification? Contact our support team at <a href="mailto:support@edufiliova.com" style="color: #2d5ddd; text-decoration: none;">support@edufiliova.com</a>
        </p>
      </div>
      ${footer}
    `;

    return this.sendEmail({
      to: email,
      subject: 'Application Update - EduFiliova',
      html,
      from: `"EduFiliova Support" <support@edufiliova.com>`,
    });
  }

  // Send Application Submitted Confirmation Email
  async sendApplicationSubmittedEmail(
    email: string,
    data: {
      fullName: string;
      applicationType: 'teacher' | 'freelancer';
    }
  ): Promise<boolean> {
    const footer = await this.getEmailFooter();
    const roleDisplay = data.applicationType === 'teacher' ? 'Teacher' : 'Freelancer';
    
    const html = `
      ${this.getEmailTemplate('orange')}
      <div class="content">
        <h2 class="title">Application Submitted Successfully!</h2>
        <p class="message">
          Hi ${data.fullName},
          <br><br>
          Thank you for submitting your ${roleDisplay.toLowerCase()} application to EduFiliova! We've received your application and our team will begin reviewing it shortly.
        </p>
        
        <div class="alert-success" style="text-align: center; padding: 30px;">
          <div style="margin-bottom: 10px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="22" fill="#10B981"/>
              <path d="M15 24L21 30L33 18" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div style="color: #065f46; font-size: 18px; font-weight: bold; margin-bottom: 8px;">
            Application Received
          </div>
          <div style="color: #047857; font-size: 14px;">
            Your ${roleDisplay.toLowerCase()} application has been submitted successfully
          </div>
        </div>

        <div class="details-box">
          <div style="color: #374151; font-size: 14px; font-weight: 600; margin-bottom: 15px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 48 48" fill="none" style="vertical-align: middle; margin-right: 8px;">
              <circle cx="24" cy="24" r="22" fill="#F59E0B"/>
              <circle cx="24" cy="24" r="18" stroke="white" stroke-width="2"/>
              <path d="M24 12V24L32 28" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            What to expect:
          </div>
          <div style="color: #4b5563; font-size: 14px; line-height: 1.8;">
            1. Our team will review your application within 2-5 business days<br>
            2. You'll receive an email when your application is under review<br>
            3. We'll notify you of our decision via email<br>
            4. If approved, you'll get full access to your ${roleDisplay.toLowerCase()} dashboard
          </div>
        </div>

        <p class="message" style="font-size: 14px;">
          In the meantime, you can log in to check your application status at any time.
        </p>
        
        <p class="message" style="font-size: 14px; margin-top: 30px;">
          Have questions? Contact our support team at <a href="mailto:support@edufiliova.com" style="color: #2d5ddd; text-decoration: none;">support@edufiliova.com</a>
        </p>
      </div>
      ${footer}
    `;

    return this.sendEmail({
      to: email,
      subject: `${roleDisplay} Application Received - EduFiliova`,
      html,
      from: `"EduFiliova Support" <support@edufiliova.com>`,
    });
  }

  // Meeting Reminder Email (15 minutes before)
  async sendMeetingReminderEmail(
    email: string,
    data: {
      studentName: string;
      teacherName: string;
      meetingTime: Date;
      meetingLink: string;
      meetingTitle?: string;
    }
  ): Promise<boolean> {
    const footer = await this.getEmailFooter();
    const meetingTimeStr = new Date(data.meetingTime).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    const html = `
      ${this.getEmailTemplate('blue')}
      <div class="content">
        <h2 class="title">Meeting Starting Soon!</h2>
        <p class="message">
          Hi ${data.studentName},
          <br><br>
          This is a friendly reminder that your meeting with ${data.teacherName} is starting in 15 minutes!
        </p>
        
        <div class="details-box">
          <table class="details-table">
            ${data.meetingTitle ? `
            <tr>
              <td class="detail-label">Meeting Title</td>
              <td class="detail-value">${data.meetingTitle}</td>
            </tr>
            ` : ''}
            <tr>
              <td class="detail-label">With</td>
              <td class="detail-value">${data.teacherName}</td>
            </tr>
            <tr>
              <td class="detail-label">Time</td>
              <td class="detail-value">${meetingTimeStr}</td>
            </tr>
          </table>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.meetingLink}" class="button" style="font-size: 16px; padding: 16px 40px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 48 48" fill="none" style="vertical-align: middle; margin-right: 8px;">
              <rect x="4" y="10" width="30" height="28" rx="4" fill="white"/>
              <path d="M34 20L44 14V34L34 28V20Z" fill="white"/>
            </svg>
            Join Meeting Now
          </a>
        </div>

        <div class="alert-info">
          <div style="color: #1e40af; font-size: 13px;">
            <strong>Tip:</strong> Make sure your camera and microphone are working before joining. 
            We recommend joining a few minutes early to test your setup.
          </div>
        </div>

        <p class="message" style="font-size: 14px;">
          If you need to reschedule or cancel, please contact ${data.teacherName} or our support team as soon as possible.
        </p>
      </div>
      ${footer}
    `;

    return this.sendEmail({
      to: email,
      subject: `[Reminder] Meeting with ${data.teacherName} in 15 Minutes`,
      html,
      from: `"EduFiliova" <noreply@edufiliova.com>`,
    });
  }

  // Contact Form Notification Email (Internal)
  async sendContactFormNotificationEmail(
    data: {
      senderName: string;
      senderEmail: string;
      subject: string;
      message: string;
      submittedAt: Date;
    }
  ): Promise<boolean> {
    const footer = await this.getEmailFooter();
    const submittedTimeStr = new Date(data.submittedAt).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    const html = `
      ${this.getEmailTemplate('blue')}
      <div class="content">
        <h2 class="title">New Contact Form Submission</h2>
        <p class="message">
          A new message has been submitted through the contact form on the website.
        </p>
        
        <div class="details-box">
          <table class="details-table">
            <tr>
              <td class="detail-label">From</td>
              <td class="detail-value">${data.senderName}</td>
            </tr>
            <tr>
              <td class="detail-label">Email</td>
              <td class="detail-value">${data.senderEmail}</td>
            </tr>
            <tr>
              <td class="detail-label">Subject</td>
              <td class="detail-value">${data.subject}</td>
            </tr>
            <tr>
              <td class="detail-label">Submitted</td>
              <td class="detail-value">${submittedTimeStr}</td>
            </tr>
          </table>
        </div>

        <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 25px 0;">
          <div style="font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 10px;">
            Message:
          </div>
          <div style="color: #4b5563; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">
            ${data.message}
          </div>
        </div>

        <div class="alert-info">
          <div style="color: #1e40af; font-size: 13px;">
            <strong>Action Required:</strong> Please respond to this inquiry within 24 hours to maintain our high customer service standards.
          </div>
        </div>

        <p class="message" style="font-size: 14px;">
          Reply directly to <a href="mailto:${data.senderEmail}" style="color: #2d5ddd; text-decoration: none;">${data.senderEmail}</a> to respond to this message.
        </p>
      </div>
      ${footer}
    `;

    return this.sendEmail({
      to: 'support@edufiliova.com',
      subject: `New Contact Form: ${data.subject}`,
      html,
      from: `"EduFiliova Support" <support@edufiliova.com>`,
    });
  }

  // Design Team Inquiry Notification Email (Internal)
  async sendDesignInquiryNotificationEmail(
    data: {
      clientName: string;
      clientEmail: string;
      phone?: string;
      projectType: string;
      projectDetails: string;
      budget?: string;
      timeline?: string;
      submittedAt: Date;
    }
  ): Promise<boolean> {
    const footer = await this.getEmailFooter();
    const submittedTimeStr = new Date(data.submittedAt).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    const html = `
      ${this.getEmailTemplate('blue')}
      <div class="content">
        <h2 class="title">New Design Project Inquiry</h2>
        <p class="message">
          A new design project inquiry has been submitted. Review the details below and respond promptly.
        </p>
        
        <div class="details-box">
          <table class="details-table">
            <tr>
              <td class="detail-label">Client Name</td>
              <td class="detail-value">${data.clientName}</td>
            </tr>
            <tr>
              <td class="detail-label">Email</td>
              <td class="detail-value">${data.clientEmail}</td>
            </tr>
            ${data.phone ? `
            <tr>
              <td class="detail-label">Phone</td>
              <td class="detail-value">${data.phone}</td>
            </tr>
            ` : ''}
            <tr>
              <td class="detail-label">Project Type</td>
              <td class="detail-value">${data.projectType}</td>
            </tr>
            ${data.budget ? `
            <tr>
              <td class="detail-label">Budget</td>
              <td class="detail-value">${data.budget}</td>
            </tr>
            ` : ''}
            ${data.timeline ? `
            <tr>
              <td class="detail-label">Timeline</td>
              <td class="detail-value">${data.timeline}</td>
            </tr>
            ` : ''}
            <tr>
              <td class="detail-label">Submitted</td>
              <td class="detail-value">${submittedTimeStr}</td>
            </tr>
          </table>
        </div>

        <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 25px 0;">
          <div style="font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 10px;">
            Project Details:
          </div>
          <div style="color: #4b5563; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">
            ${data.projectDetails}
          </div>
        </div>

        <div class="alert-warning">
          <div style="color: #92400e; font-size: 13px;">
            <strong>High Priority:</strong> Design inquiries should receive an initial response within 12 hours to avoid losing potential clients.
          </div>
        </div>

        <p class="message" style="font-size: 14px;">
          Contact the client at <a href="mailto:${data.clientEmail}" style="color: #2d5ddd; text-decoration: none;">${data.clientEmail}</a>
          ${data.phone ? ` or ${data.phone}` : ''} to discuss the project details and provide a quote.
        </p>
      </div>
      ${footer}
    `;

    return this.sendEmail({
      to: 'design@edufiliova.com',
      subject: `New Design Inquiry: ${data.projectType} - ${data.clientName}`,
      html,
      from: `"EduFiliova Design Team" <design@edufiliova.com>`,
    });
  }

  // New Device Login Security Notification Email
  async sendNewDeviceLoginEmail(
    email: string,
    data: {
      userName: string;
      deviceName: string;
      location: string;
      ipAddress: string;
      loginTime: Date;
      browser?: string;
      os?: string;
    }
  ): Promise<boolean> {
    const footer = await this.getEmailFooter();
    const loginTimeStr = new Date(data.loginTime).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    const baseUrl = process.env.REPLIT_DEV_DOMAIN 
      ? `https://${process.env.REPLIT_DEV_DOMAIN}` 
      : 'https://edufiliova.com';

    const html = `
      ${this.getEmailTemplate('blue')}
      <div class="content">
        <h2 class="title">New Device Login Detected</h2>
        <p class="message">
          Hi ${data.userName},
          <br><br>
          We detected a new login to your account from a device or location we don't recognize. 
          If this was you, you can safely ignore this email.
        </p>
        
        <div class="details-box">
          <table class="details-table">
            <tr>
              <td class="detail-label">Device</td>
              <td class="detail-value">${data.deviceName}</td>
            </tr>
            ${data.browser ? `
            <tr>
              <td class="detail-label">Browser</td>
              <td class="detail-value">${data.browser}</td>
            </tr>
            ` : ''}
            ${data.os ? `
            <tr>
              <td class="detail-label">Operating System</td>
              <td class="detail-value">${data.os}</td>
            </tr>
            ` : ''}
            <tr>
              <td class="detail-label">Location</td>
              <td class="detail-value">${data.location}</td>
            </tr>
            <tr>
              <td class="detail-label">IP Address</td>
              <td class="detail-value">${data.ipAddress}</td>
            </tr>
            <tr>
              <td class="detail-label">Login Time</td>
              <td class="detail-value">${loginTimeStr}</td>
            </tr>
          </table>
        </div>

        <div class="alert-warning">
          <div style="color: #92400e; font-size: 14px; font-weight: 600; margin-bottom: 8px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#F59E0B" style="vertical-align: middle; margin-right: 6px;"><path d="M12 2L2 22h20L12 2zm0 4l7.5 14h-15L12 6zm-1 5v4h2v-4h-2zm0 6v2h2v-2h-2z"/></svg>
            Didn't recognize this login?
          </div>
          <div style="color: #b45309; font-size: 13px;">
            If this wasn't you, please secure your account immediately by changing your password and reviewing your recent account activity.
          </div>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${baseUrl}/settings" class="button">Review Account Security</a>
          <a href="${baseUrl}/settings" class="button-secondary button" style="margin-left: 10px;">Change Password</a>
        </div>

        <p class="message" style="font-size: 13px; color: #6b7280;">
          We sent this email to protect your account. If you have any questions, contact our support team.
        </p>
      </div>
      ${footer}
    `;

    return this.sendEmail({
      to: email,
      subject: '[Security Alert] New Device Login Detected - EduFiliova',
      html,
      from: `"EduFiliova Security" <noreply@edufiliova.com>`,
    });
  }

  // Password Reset Email
  async sendPasswordResetEmail(
    email: string,
    data: {
      userName: string;
      resetToken: string;
      expiresIn: number; // minutes
    }
  ): Promise<boolean> {
    const footer = await this.getEmailFooter();
    const baseUrl = process.env.REPLIT_DEV_DOMAIN 
      ? `https://${process.env.REPLIT_DEV_DOMAIN}` 
      : 'https://edufiliova.com';
    
    const resetUrl = `${baseUrl}/reset-password?token=${data.resetToken}`;

    const html = `
      ${this.getEmailTemplate('blue')}
      <div class="content">
        <h2 class="title">Password Reset Request</h2>
        <p class="message">
          Hi ${data.userName},
          <br><br>
          We received a request to reset your password. Click the button below to create a new password.
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" class="button">Reset Password</a>
        </div>

        <div class="alert-info">
          <div style="color: #1e40af; font-size: 13px;">
            This link will expire in <strong>${data.expiresIn} minutes</strong>. 
            If you didn't request a password reset, you can safely ignore this email.
          </div>
        </div>

        <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <div style="font-size: 12px; color: #6b7280;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${resetUrl}" style="color: #2d5ddd; word-break: break-all;">${resetUrl}</a>
          </div>
        </div>

        <p class="message" style="font-size: 13px;">
          For security reasons, never share this link with anyone.
        </p>
      </div>
      ${footer}
    `;

    return this.sendEmail({
      to: email,
      subject: 'Reset Your Password - EduFiliova',
      html,
      from: `"EduFiliova Security" <noreply@edufiliova.com>`,
    });
  }

  // Order Shipped Notification Email
  async sendOrderShippedEmail(
    email: string,
    data: {
      customerName: string;
      orderId: string;
      trackingNumber: string;
      carrier: string;
      trackingUrl?: string;
      estimatedDelivery?: Date;
    }
  ): Promise<boolean> {
    const footer = await this.getEmailFooter('orange');
    const estimatedDeliveryStr = data.estimatedDelivery 
      ? new Date(data.estimatedDelivery).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      : null;

    const html = `
      ${this.getEmailTemplate('orange')}
      <div class="content">
        <h2 class="title">Your Order Has Shipped!</h2>
        <p class="message">
          Hi ${data.customerName},
          <br><br>
          Great news! Your order has been shipped and is on its way to you.
        </p>
        
        <div class="details-box">
          <table class="details-table">
            <tr>
              <td class="detail-label">Order ID</td>
              <td class="detail-value">#${data.orderId.substring(0, 12).toUpperCase()}</td>
            </tr>
            <tr>
              <td class="detail-label">Carrier</td>
              <td class="detail-value">${data.carrier}</td>
            </tr>
            <tr>
              <td class="detail-label">Tracking Number</td>
              <td class="detail-value" style="font-family: monospace;">${data.trackingNumber}</td>
            </tr>
            ${estimatedDeliveryStr ? `
            <tr>
              <td class="detail-label">Estimated Delivery</td>
              <td class="detail-value">${estimatedDeliveryStr}</td>
            </tr>
            ` : ''}
          </table>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          ${data.trackingUrl ? `
            <a href="${data.trackingUrl}" class="button">Track Your Package</a>
          ` : ''}
        </div>

        <div class="alert-success">
          <div style="color: #065f46; font-size: 13px;">
            You'll receive an email confirmation once your package has been delivered.
          </div>
        </div>
      </div>
      ${footer}
    `;

    return this.sendEmail({
      to: email,
      subject: `Your Order Has Shipped - #${data.orderId.substring(0, 8).toUpperCase()}`,
      html,
      from: `"EduFiliova Orders" <orders@edufiliova.com>`,
    });
  }

  // Payment Failed Notification Email
  async sendPaymentFailedEmail(
    email: string,
    data: {
      customerName: string;
      orderId: string;
      amount: number;
      reason: string;
      retryUrl: string;
    }
  ): Promise<boolean> {
    const footer = await this.getEmailFooter();

    const html = `
      ${this.getEmailTemplate('orange')}
      <div class="content">
        <h2 class="title">Payment Failed</h2>
        <p class="message">
          Hi ${data.customerName},
          <br><br>
          We were unable to process your payment for order #${data.orderId.substring(0, 12).toUpperCase()}.
        </p>
        
        <div class="details-box">
          <table class="details-table">
            <tr>
              <td class="detail-label">Order ID</td>
              <td class="detail-value">#${data.orderId.substring(0, 12).toUpperCase()}</td>
            </tr>
            <tr>
              <td class="detail-label">Amount</td>
              <td class="detail-value" style="color: #0C332C;">$${data.amount.toFixed(2)}</td>
            </tr>
            <tr>
              <td class="detail-label">Reason</td>
              <td class="detail-value">${data.reason}</td>
            </tr>
          </table>
        </div>

        <div class="alert-warning">
          <div style="color: #92400e; font-size: 14px; font-weight: 600; margin-bottom: 8px;">
            Action Required
          </div>
          <div style="color: #b45309; font-size: 13px;">
            Please update your payment method or try again with a different payment option to complete your order.
          </div>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.retryUrl}" class="button">Retry Payment</a>
        </div>

        <p class="message" style="font-size: 13px;">
          If you need assistance, please contact our support team at support@edufiliova.com
        </p>
      </div>
      ${footer}
    `;

    return this.sendEmail({
      to: email,
      subject: `[Action Required] Payment Failed - Order #${data.orderId.substring(0, 8).toUpperCase()}`,
      html,
      from: `"EduFiliova Orders" <orders@edufiliova.com>`,
    });
  }

  // Account Welcome Email
  async sendWelcomeEmail(
    email: string,
    data: {
      userName: string;
      accountType: string; // student, teacher, freelancer, etc.
      loginEmail?: string;
      loginPhone?: string;
    }
  ): Promise<boolean> {
    const footer = await this.getEmailFooter();
    const baseUrl = process.env.REPLIT_DEV_DOMAIN 
      ? `https://${process.env.REPLIT_DEV_DOMAIN}` 
      : 'https://edufiliova.com';

    const html = `
      ${this.getEmailTemplate('blue')}
      <div class="content">
        <h2 class="title">Welcome to EduFiliova!</h2>
        <p class="message">
          Hi ${data.userName},
          <br><br>
          Thank you for joining EduFiliova! We're excited to have you as part of our learning community.
        </p>
        
        <div class="alert-success" style="text-align: center; padding: 30px;">
          <div style="margin-bottom: 10px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
          <div style="color: #065f46; font-size: 18px; font-weight: bold; margin-bottom: 8px;">
            Account Created Successfully
          </div>
          <div style="color: #047857; font-size: 14px;">
            You're all set to start your journey with us!
          </div>
        </div>

        <!-- Login Credentials Section -->
        <div style="background-color: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 25px 0;">
          <div style="color: #1f2937; font-size: 16px; font-weight: 600; margin-bottom: 15px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#374151" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 6px;"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            Your Login Credentials
          </div>
          
          <div style="background-color: #ffffff; border: 1px solid #d1d5db; border-radius: 6px; padding: 15px; margin-bottom: 12px;">
            <div style="color: #6b7280; font-size: 12px; font-weight: 600; margin-bottom: 5px; text-transform: uppercase;">Email</div>
            <div style="color: #1f2937; font-size: 14px; font-family: 'Monaco', 'Courier New', monospace; word-break: break-all;">${data.loginEmail || email}</div>
          </div>

          ${data.loginPhone ? `
          <div style="background-color: #ffffff; border: 1px solid #d1d5db; border-radius: 6px; padding: 15px; margin-bottom: 12px;">
            <div style="color: #6b7280; font-size: 12px; font-weight: 600; margin-bottom: 5px; text-transform: uppercase;">Phone</div>
            <div style="color: #1f2937; font-size: 14px; font-family: 'Monaco', 'Courier New', monospace;">${data.loginPhone}</div>
          </div>
          ` : ''}

          <div style="background-color: #fef3c7; border: 1px solid #fcd34d; border-radius: 6px; padding: 12px; margin-top: 12px;">
            <div style="color: #92400e; font-size: 13px; line-height: 1.6;">
              <strong>🔒 Security Reminder:</strong> Please keep your login credentials safe and secure. Never share them with anyone, including EduFiliova staff members. Always use the official login page to sign in.
            </div>
          </div>
        </div>

        <div class="details-box">
          <div style="color: #374151; font-size: 14px; font-weight: 600; margin-bottom: 15px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#374151" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 6px;"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            Get Started:
          </div>
          <div style="color: #4b5563; font-size: 14px; line-height: 1.8;">
            ${data.accountType === 'student' ? `
              1. Browse our course catalog<br>
              2. Enroll in your first course<br>
              3. Start learning at your own pace<br>
              4. Track your progress and earn certificates
            ` : data.accountType === 'teacher' ? `
              1. Complete your teacher profile<br>
              2. Create your first course or lesson<br>
              3. Connect with students<br>
              4. Start earning by teaching
            ` : `
              1. Complete your profile<br>
              2. Explore available opportunities<br>
              3. Connect with clients<br>
              4. Start building your portfolio
            `}
          </div>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${baseUrl}/login" class="button">Go to Dashboard</a>
        </div>

        <p class="message" style="font-size: 14px;">
          Need help? Check out our <a href="${baseUrl}/help" style="color: #2d5ddd; text-decoration: none;">Help Center</a> 
          or contact us at support@edufiliova.com
        </p>
      </div>
      ${footer}
    `;

    return this.sendEmail({
      to: email,
      subject: 'Welcome to EduFiliova - Let\'s Get Started!',
      html,
      from: `"EduFiliova Support" <support@edufiliova.com>`,
    });
  }

  // Freelancer Application Status Update Email
  async sendFreelancerApplicationStatusEmail(
    email: string,
    data: {
      fullName: string;
      status: 'approved' | 'rejected' | 'pending_review' | 'under_review' | 'pending';
      reason?: string;
      rejectionReason?: string;
    }
  ): Promise<boolean> {
    const footer = await this.getEmailFooter();
    const baseUrl = process.env.REPLIT_DEV_DOMAIN 
      ? `https://${process.env.REPLIT_DEV_DOMAIN}` 
      : 'https://edufiliova.com';

    const isApproved = data.status === 'approved';
    const isRejected = data.status === 'rejected';
    const isUnderReview = data.status === 'under_review' || data.status === 'pending_review';
    const rejectionReason = data.rejectionReason || data.reason;

    const html = `
      ${this.getEmailTemplate('blue')}
      <div class="content">
        <h2 class="title">${isApproved ? 'Application Approved!' : isRejected ? 'Application Update' : isUnderReview ? 'Application Under Review' : 'Application Received'}</h2>
        <p class="message">
          Hi ${data.fullName},
          <br><br>
          ${isApproved 
            ? 'Congratulations! Your freelancer application has been approved. You can now start accepting projects and connecting with clients.'
            : isRejected
            ? 'Thank you for your interest in joining EduFiliova as a freelancer. After careful review, we are unable to approve your application at this time.'
            : isUnderReview
            ? 'Great news! Your freelancer application is now being actively reviewed by our team. We will notify you once a decision has been made.'
            : 'We have received your freelancer application and it is currently pending review. We will notify you once a decision has been made.'
          }
        </p>
        
        ${isApproved ? `
          <div class="alert-success" style="text-align: center; padding: 30px;">
            <div style="margin-bottom: 10px;">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div style="color: #065f46; font-size: 18px; font-weight: bold;">
              Welcome to the Team!
            </div>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${baseUrl}/freelancer-dashboard" class="button">Access Dashboard</a>
          </div>
        ` : isRejected ? `
          ${rejectionReason ? `
            <div class="details-box">
              <div style="color: #374151; font-size: 14px; font-weight: 600; margin-bottom: 10px;">
                Reason:
              </div>
              <div style="color: #4b5563; font-size: 14px;">
                ${rejectionReason}
              </div>
            </div>
          ` : ''}

          <p class="message">
            You're welcome to reapply in the future. If you have any questions, please contact our support team.
          </p>
        ` : isUnderReview ? `
          <div class="alert-info">
            <div style="color: #1e40af; font-size: 13px;">
              <strong>Your application is being reviewed!</strong><br>
              Our team is now actively reviewing your portfolio and credentials. We typically complete reviews within 2-3 business days.
            </div>
          </div>
        ` : `
          <div class="alert-info">
            <div style="color: #1e40af; font-size: 13px;">
              We typically review applications within 2-3 business days. Thank you for your patience!
            </div>
          </div>
        `}
      </div>
      ${footer}
    `;

    return this.sendEmail({
      to: email,
      subject: isApproved 
        ? 'Congratulations! Freelancer Application Approved - EduFiliova'
        : isRejected
        ? 'Freelancer Application Update - EduFiliova'
        : isUnderReview
        ? 'Application Under Review - EduFiliova'
        : 'Application Received - EduFiliova',
      html,
      from: `"EduFiliova Support" <support@edufiliova.com>`,
    });
  }

  async sendReceiptEmail(
    email: string,
    data: {
      receiptNumber: string;
      receiptType: 'order' | 'subscription' | 'freelancer_plan' | 'banner_payment' | 'certificate';
      customerName: string;
      totalAmount: number;
      currency?: string;
      items: Array<{ name: string; quantity: number; price: number }>;
      sourceId: string;
      userRole?: string;
    },
    pdfBuffer: Buffer
  ): Promise<boolean> {
    const footer = await this.getEmailFooter('orange');
    const baseUrl = this.getBaseUrl();
    
    const receiptTypeLabels: Record<string, string> = {
      order: 'Order',
      subscription: 'Subscription',
      freelancer_plan: 'Freelancer Plan',
      banner_payment: 'Advertisement',
      certificate: 'Certificate',
    };
    
    const receiptLabel = receiptTypeLabels[data.receiptType] || 'Purchase';
    const currencySymbol = data.currency === 'USD' ? '$' : data.currency || '$';
    
    const itemsHtml = data.items.map(item => `
      <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
        <span style="color: #374151;">${item.name} × ${item.quantity}</span>
        <span style="color: #111827; font-weight: 600;">${currencySymbol}${(item.price * item.quantity).toFixed(2)}</span>
      </div>
    `).join('');
    
    const dashboardUrl = data.userRole === 'freelancer' 
      ? `${baseUrl}/freelancer-dashboard`
      : data.userRole === 'teacher'
      ? `${baseUrl}/teacher-dashboard`
      : data.userRole === 'student'
      ? `${baseUrl}/student-dashboard`
      : `${baseUrl}/customer-dashboard`;

    const html = `
      ${this.getEmailTemplate('orange')}
      <div class="content">
        <h2 class="title">Payment Receipt</h2>
        <p class="message">
          ${data.customerName ? `Hi ${data.customerName},` : 'Hello,'}
          <br><br>
          Thank you for your ${receiptLabel.toLowerCase()} purchase! Your payment has been successfully processed. 
          Your official receipt is attached to this email as a PDF.
        </p>
        
        <div class="alert-success" style="text-align: center; padding: 20px;">
          <div style="margin-bottom: 8px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div style="color: #065f46; font-size: 16px; font-weight: bold;">Payment Confirmed</div>
        </div>
        
        <div class="details-box">
          <table class="details-table">
            <tr>
              <td class="detail-label">Receipt Number</td>
              <td class="detail-value">${data.receiptNumber}</td>
            </tr>
            <tr>
              <td class="detail-label">Type</td>
              <td class="detail-value">${receiptLabel} Receipt</td>
            </tr>
            <tr>
              <td class="detail-label">Date</td>
              <td class="detail-value">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
            </tr>
          </table>
        </div>

        <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <div style="font-weight: 600; color: #111827; margin-bottom: 15px;">Items Purchased:</div>
          ${itemsHtml}
          <div style="display: flex; justify-content: space-between; padding-top: 15px; margin-top: 10px; border-top: 2px solid #111827;">
            <span style="color: #111827; font-weight: 700; font-size: 16px;">Total Paid</span>
            <span style="color: #0C332C; font-weight: 700; font-size: 18px;">${currencySymbol}${data.totalAmount.toFixed(2)}</span>
          </div>
        </div>

        <p class="message" style="font-size: 14px; color: #6b7280;">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 4px;"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
          Your official PDF receipt is attached to this email. You can also download receipts anytime from your dashboard.
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${dashboardUrl}" class="button button-secondary">View Dashboard</a>
        </div>
      </div>
      ${footer}
    `;

    return this.sendEmail({
      to: email,
      subject: `Receipt #${data.receiptNumber} - ${receiptLabel} Purchase Confirmed`,
      html,
      from: `"EduFiliova Orders" <orders@edufiliova.com>`,
      attachments: [{
        filename: `EduFiliova-Receipt-${data.receiptNumber}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      }],
    });
  }

  async sendEmailWithReceipt(
    email: string,
    data: {
      subject: string;
      html: string;
      pdfBuffer: Buffer;
      receiptNumber: string;
    }
  ): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: data.subject,
      html: `
        ${this.getEmailTemplate('orange')}
        <div class="content">
          ${data.html}
        </div>
        ${await this.getEmailFooter('orange')}
      `,
      from: `"EduFiliova Orders" <orders@edufiliova.com>`,
      attachments: [{
        filename: `EduFiliova-Receipt-${data.receiptNumber}.pdf`,
        content: data.pdfBuffer,
        contentType: 'application/pdf',
      }],
    });
  }
}

// Export singleton instance

// Send voucher email to recipient
interface VoucherEmailOptions {
  recipientEmail: string;
  recipientName?: string;
  voucherCode: string;
  amount: number;
  personalMessage?: string;
  senderName?: string;
  expiresAt?: string;
}

export async function sendVoucherEmail(options: VoucherEmailOptions): Promise<boolean> {
  const {
    recipientEmail,
    recipientName,
    voucherCode,
    amount,
    personalMessage,
    senderName = 'Someone special',
    expiresAt
  } = options;

  const formattedAmount = amount.toFixed(2);
  const expiryDate = expiresAt ? new Date(expiresAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : null;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You've Received a Gift Voucher!</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
    <div style="background: linear-gradient(135deg, #0C332C 0%, #0C332C 100%); padding: 40px 30px; text-align: center; color: white;">
      <h1 style="margin: 0; font-size: 32px;">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 48 48" fill="none" style="vertical-align: middle; margin-right: 10px;">
          <rect x="6" y="18" width="36" height="26" rx="4" fill="white"/>
          <rect x="6" y="12" width="36" height="10" rx="2" fill="#FCD34D"/>
          <rect x="21" y="12" width="6" height="32" fill="#0C332C"/>
          <path d="M24 12C24 12 18 6 14 10C10 14 16 18 24 12Z" fill="#0C332C"/>
          <path d="M24 12C24 12 30 6 34 10C38 14 32 18 24 12Z" fill="#0C332C"/>
        </svg>
        You've Received a Gift!
      </h1>
      <p style="margin: 15px 0 0 0; font-size: 18px; opacity: 0.95;">${senderName} sent you an EduFiliova Gift Voucher</p>
    </div>

    ${personalMessage ? `
    <div style="background: #fff9e6; padding: 20px 30px; border-bottom: 1px solid #f0e0b0;">
      <p style="margin: 0; color: #666; font-style: italic; font-size: 16px; line-height: 1.6;">
        "${personalMessage}"
      </p>
      <p style="margin: 10px 0 0 0; color: #999; font-size: 14px;">— ${senderName}</p>
    </div>
    ` : ''}

    <div style="background: linear-gradient(135deg, #ffffff 0%, #f9fafb 100%); margin: 30px; padding: 40px; border-radius: 12px; border: 3px solid #0C332C; position: relative;">
      ${recipientName ? `<p style="text-align: center; color: #666; margin-bottom: 20px; font-size: 16px;">For: <strong>${recipientName}</strong></p>` : ''}
      
      <div style="text-align: center; font-size: 52px; font-weight: bold; color: #0C332C; margin: 20px 0;">
        $${formattedAmount}
      </div>
      
      <div style="background: #1a1a1a; color: #c4f03b; padding: 25px; border-radius: 8px; text-align: center; margin: 25px 0; font-family: 'Courier New', monospace;">
        <p style="margin: 0 0 10px 0; font-size: 12px; color: #888; letter-spacing: 2px; text-transform: uppercase;">Your Voucher Code</p>
        <p style="margin: 0; font-size: 28px; font-weight: bold; letter-spacing: 4px;">${voucherCode}</p>
      </div>

      <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0C332C;">
        <h3 style="margin-top: 0; color: #333; font-size: 16px;">How to Redeem:</h3>
        <ol style="color: #666; line-height: 1.8; margin: 10px 0; padding-left: 20px;">
          <li>Log in to your EduFiliova account</li>
          <li>Go to your Wallet and click "Redeem Voucher"</li>
          <li>Enter code <strong style="color: #0C332C;">${voucherCode}</strong></li>
          <li>Your $${formattedAmount} credit will be added instantly!</li>
        </ol>
      </div>

      <div style="background: #fff3e0; padding: 15px; border-radius: 6px; margin-top: 20px;">
        <h4 style="margin-top: 0; color: #0C332C; font-size: 14px;">Terms & Conditions:</h4>
        <ul style="color: #666; font-size: 13px; line-height: 1.6; margin: 0; padding-left: 20px;">
          <li>One-time use only</li>
          <li>Can be used for any course or subscription</li>
          <li>Non-transferable and non-refundable</li>
          ${expiryDate ? `<li><strong>Valid until: ${expiryDate}</strong></li>` : '<li>No expiry date</li>'}
        </ul>
      </div>
    </div>

    <div style="text-align: center; padding: 30px; color: #666; font-size: 14px; border-top: 1px solid #eee;">
      <p style="margin: 0 0 15px 0;">Ready to start learning?</p>
      <a href="https://edufiliova.com" style="display: inline-block; background: #0C332C; color: white; padding: 14px 30px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">Visit EduFiliova</a>
      <p style="margin: 20px 0 0 0; font-size: 12px; color: #999;">
        Questions? Contact our support team at support@edufiliova.com
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();

  return emailService.sendEmail({
    to: recipientEmail,
    subject: `${senderName} sent you a $${formattedAmount} EduFiliova Gift Voucher!`,
    html,
    from: '"EduFiliova Gifts" <orders@edufiliova.com>'
  });
}

export const emailService = new EmailService();
