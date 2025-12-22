import nodemailer from 'nodemailer';
import Handlebars from 'handlebars';
import { storage } from '../storage';
import { db } from '../db';
import { emailAccounts } from '@shared/schema';
import { eq } from 'drizzle-orm';
import type { 
  EmailCampaign, 
  EmailMarketingTemplate,
  CampaignDelivery,
  SegmentFilters 
} from '@shared/schema';

Handlebars.registerHelper('eq', (a: unknown, b: unknown) => a === b);
Handlebars.registerHelper('neq', (a: unknown, b: unknown) => a !== b);
Handlebars.registerHelper('gt', (a: number, b: number) => a > b);
Handlebars.registerHelper('lt', (a: number, b: number) => a < b);
Handlebars.registerHelper('gte', (a: number, b: number) => a >= b);
Handlebars.registerHelper('lte', (a: number, b: number) => a <= b);
Handlebars.registerHelper('and', (a: unknown, b: unknown) => a && b);
Handlebars.registerHelper('or', (a: unknown, b: unknown) => a || b);
Handlebars.registerHelper('not', (a: unknown) => !a);
Handlebars.registerHelper('capitalize', (str: string) => str ? str.charAt(0).toUpperCase() + str.slice(1) : '');
Handlebars.registerHelper('formatDate', (date: Date | string) => {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
});

export interface EmailMarketingConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  fromName: string;
  fromEmail: string;
}

export class EmailMarketingService {
  private transporter: nodemailer.Transporter | null = null;
  private config: EmailMarketingConfig | null = null;
  private templateCache: Map<string, Handlebars.TemplateDelegate> = new Map();
  private initialized: boolean = false;
  private initPromise: Promise<void> | null = null;

  constructor() {
    console.log('📧 EmailMarketingService constructor called');
    this.initPromise = this.initializeFromDatabase().catch((err) => {
      console.error('📧 EmailMarketingService initialization failed:', err);
    });
  }

  private async initializeFromDatabase(): Promise<void> {
    console.log('📧 EmailMarketingService initializeFromDatabase starting...');
    try {
      const accounts = await db.select().from(emailAccounts).where(eq(emailAccounts.isActive, true)).limit(1);
      console.log('📧 Found', accounts.length, 'active email accounts');
      
      if (accounts.length > 0) {
        const account = accounts[0];
        
        if (account.smtpHost && account.smtpPort && account.smtpUsername && account.smtpPassword) {
          this.config = {
            host: account.smtpHost,
            port: account.smtpPort,
            secure: account.smtpSecure || account.smtpPort === 465,
            auth: {
              user: account.smtpUsername,
              pass: account.smtpPassword,
            },
            fromName: account.displayName || 'EduFiliova',
            fromEmail: account.email,
          };

          this.transporter = nodemailer.createTransport({
            host: this.config.host,
            port: this.config.port,
            secure: this.config.secure,
            auth: this.config.auth,
          });

          this.initialized = true;
          console.log('📧 Email marketing service initialized from database with:', account.email);
          return;
        }
      }
      
      const smtpHost = process.env.SMTP_HOST;
      const smtpPort = process.env.SMTP_PORT;
      const smtpUser = process.env.SMTP_USER;
      const smtpPass = process.env.SMTP_PASS;

      if (smtpHost && smtpPort && smtpUser && smtpPass) {
        this.config = {
          host: smtpHost,
          port: parseInt(smtpPort),
          secure: parseInt(smtpPort) === 465,
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
          fromName: process.env.EMAIL_FROM_NAME || 'EduFiliova',
          fromEmail: process.env.EMAIL_FROM_EMAIL || smtpUser,
        };

        this.transporter = nodemailer.createTransport({
          host: this.config.host,
          port: this.config.port,
          secure: this.config.secure,
          auth: this.config.auth,
        });

        this.initialized = true;
        console.log('📧 Email marketing service initialized from env vars');
        return;
      }
      
      console.warn('⚠️ Email marketing service not configured - no email accounts in database or env vars');
    } catch (error) {
      console.error('❌ Failed to initialize email marketing service:', error);
    }
  }

  async ensureInitialized(): Promise<void> {
    if (this.initPromise) {
      await this.initPromise;
    }
    if (!this.initialized) {
      this.initPromise = this.initializeFromDatabase();
      await this.initPromise;
    }
  }

  isConfigured(): boolean {
    return this.transporter !== null && this.initialized;
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    if (!this.transporter) {
      return { success: false, error: 'Email service not configured' };
    }

    try {
      await this.transporter.verify();
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  private compileTemplate(templateString: string, cacheKey?: string): Handlebars.TemplateDelegate {
    if (cacheKey && this.templateCache.has(cacheKey)) {
      return this.templateCache.get(cacheKey)!;
    }
    
    const compiled = Handlebars.compile(templateString);
    
    if (cacheKey) {
      this.templateCache.set(cacheKey, compiled);
    }
    
    return compiled;
  }

  private renderTemplate(template: string, variables: Record<string, unknown>, cacheKey?: string): string {
    try {
      const compiledTemplate = this.compileTemplate(template, cacheKey);
      return compiledTemplate(variables);
    } catch (error) {
      console.error('Template rendering error:', error);
      let result = template;
      for (const [key, value] of Object.entries(variables)) {
        result = result.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
      }
      return result;
    }
  }

  clearTemplateCache(cacheKey?: string): void {
    if (cacheKey) {
      this.templateCache.delete(cacheKey);
    } else {
      this.templateCache.clear();
    }
  }

  private generateUnsubscribeLink(token: string): string {
    const baseUrl = process.env.REPLIT_DEV_DOMAIN 
      ? `https://${process.env.REPLIT_DEV_DOMAIN}`
      : process.env.BASE_URL || 'https://edufiliova.com';
    return `${baseUrl}/unsubscribe?token=${token}`;
  }

  async sendCampaignEmail(
    delivery: CampaignDelivery,
    campaign: EmailCampaign,
    unsubscribeToken: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.transporter || !this.config) {
      return { success: false, error: 'Email service not configured' };
    }

    try {
      const unsubscribeLink = this.generateUnsubscribeLink(unsubscribeToken);
      
      const variables: Record<string, unknown> = {
        recipientName: delivery.recipientName || 'Valued User',
        recipientEmail: delivery.recipientEmail,
        unsubscribeLink,
        campaignName: campaign.name,
        currentYear: new Date().getFullYear(),
        currentDate: new Date().toISOString(),
      };

      let htmlContent = this.renderTemplate(campaign.htmlContent, variables, `campaign_${campaign.id}_html`);
      
      htmlContent += `
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; font-size: 12px; color: #666;">
          <p>You're receiving this email because you're subscribed to updates from EduFiliova.</p>
          <p><a href="${unsubscribeLink}" style="color: #666;">Unsubscribe</a> from marketing emails</p>
        </div>
      `;

      const textContent = campaign.textContent 
        ? this.renderTemplate(campaign.textContent, variables, `campaign_${campaign.id}_text`) + `\n\nUnsubscribe: ${unsubscribeLink}`
        : undefined;

      await this.transporter.sendMail({
        from: `"${this.config.fromName}" <${this.config.fromEmail}>`,
        to: delivery.recipientEmail,
        subject: campaign.subject,
        html: htmlContent,
        text: textContent,
        headers: {
          'List-Unsubscribe': `<${unsubscribeLink}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      });

      await storage.markDeliveryAsSent(delivery.id);
      
      return { success: true };
    } catch (error) {
      const errorMessage = (error as Error).message;
      await storage.markDeliveryAsFailed(delivery.id, errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  async sendCampaign(campaignId: string): Promise<{
    total: number;
    sent: number;
    failed: number;
    errors: string[];
  }> {
    console.log(`📧 [CAMPAIGN] Starting send for campaign: ${campaignId}`);
    
    const campaign = await storage.getEmailCampaignById(campaignId);
    if (!campaign) {
      console.error(`📧 [CAMPAIGN] Campaign not found: ${campaignId}`);
      throw new Error('Campaign not found');
    }

    console.log(`📧 [CAMPAIGN] Campaign found: "${campaign.name}" status: ${campaign.status}`);

    if (campaign.status === 'completed' || campaign.status === 'sending') {
      console.error(`📧 [CAMPAIGN] Campaign already ${campaign.status}`);
      throw new Error(`Campaign is already ${campaign.status}`);
    }

    await storage.updateEmailCampaign(campaignId, { status: 'sending', sentAt: new Date() });

    const filters = (campaign.segmentFilters as SegmentFilters) || {};
    console.log(`📧 [CAMPAIGN] Segment filters:`, JSON.stringify(filters));
    
    const recipients = await storage.getEmailableUsers(filters);
    console.log(`📧 [CAMPAIGN] Found ${recipients.length} potential recipients from getEmailableUsers`);

    const deliveries: Array<{
      campaignId: string;
      userId: string;
      recipientEmail: string;
      recipientName: string;
    }> = [];

    let skippedOptOut = 0;
    for (const recipient of recipients) {
      const preference = await storage.getEmailPreferenceByUserId(recipient.userId);
      
      if (preference && !preference.marketingOptIn) {
        skippedOptOut++;
        continue;
      }

      let unsubscribeToken = preference?.unsubscribeToken;
      
      if (!preference) {
        const newPref = await storage.createOrUpdateEmailPreference({
          userId: recipient.userId,
          email: recipient.email,
          unsubscribeToken: crypto.randomUUID(),
          marketingOptIn: true,
          newsletterOptIn: true,
          productUpdatesOptIn: true,
          promotionsOptIn: true,
        });
        unsubscribeToken = newPref.unsubscribeToken;
      }

      deliveries.push({
        campaignId,
        userId: recipient.userId,
        recipientEmail: recipient.email,
        recipientName: recipient.name,
      });
    }

    console.log(`📧 [CAMPAIGN] Skipped ${skippedOptOut} users who opted out, ${deliveries.length} deliveries to create`);
    
    const createdDeliveries = await storage.createBulkCampaignDeliveries(deliveries);
    console.log(`📧 [CAMPAIGN] Created ${createdDeliveries.length} delivery records`);
    
    await storage.updateEmailCampaign(campaignId, { totalRecipients: createdDeliveries.length });

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    const BATCH_SIZE = 10;
    const DELAY_BETWEEN_BATCHES = 1000;

    for (let i = 0; i < createdDeliveries.length; i += BATCH_SIZE) {
      const batch = createdDeliveries.slice(i, i + BATCH_SIZE);
      
      console.log(`📧 [CAMPAIGN] Processing batch ${i / BATCH_SIZE + 1}, ${batch.length} emails`);
      
      const results = await Promise.all(
        batch.map(async (delivery) => {
          const preference = await storage.getEmailPreferenceByUserId(delivery.userId || '');
          const unsubscribeToken = preference?.unsubscribeToken || crypto.randomUUID();
          
          return this.sendCampaignEmail(delivery, campaign, unsubscribeToken);
        })
      );

      for (const result of results) {
        if (result.success) {
          sent++;
        } else {
          failed++;
          console.error(`📧 [CAMPAIGN] Email send failed:`, result.error);
          if (result.error && errors.length < 10) {
            errors.push(result.error);
          }
        }
      }
      
      console.log(`📧 [CAMPAIGN] Batch complete: sent=${sent}, failed=${failed}`);

      await storage.updateCampaignStats(campaignId, { sentCount: sent, failedCount: failed });

      if (i + BATCH_SIZE < createdDeliveries.length) {
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
      }
    }

    await storage.updateEmailCampaign(campaignId, { 
      status: 'completed', 
      completedAt: new Date(),
    });
    
    await storage.updateCampaignStats(campaignId, { 
      sentCount: sent, 
      failedCount: failed 
    });

    console.log(`📧 [CAMPAIGN] Campaign completed: total=${createdDeliveries.length}, sent=${sent}, failed=${failed}`);
    if (errors.length > 0) {
      console.log(`📧 [CAMPAIGN] Errors:`, errors);
    }

    return {
      total: createdDeliveries.length,
      sent,
      failed,
      errors,
    };
  }

  async sendTestEmail(
    recipientEmail: string,
    subject: string,
    htmlContent: string,
    textContent?: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.transporter || !this.config) {
      return { success: false, error: 'Email service not configured' };
    }

    try {
      await this.transporter.sendMail({
        from: `"${this.config.fromName}" <${this.config.fromEmail}>`,
        to: recipientEmail,
        subject: `[TEST] ${subject}`,
        html: htmlContent,
        text: textContent,
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async getTemplatePreview(
    templateId: string,
    variables?: Record<string, string>
  ): Promise<{ subject: string; html: string; text?: string } | null> {
    const template = await storage.getEmailMarketingTemplateById(templateId);
    if (!template) return null;

    const defaultVars = {
      recipientName: 'John Doe',
      recipientEmail: 'john@example.com',
      unsubscribeLink: '#',
      ...variables,
    };

    return {
      subject: this.renderTemplate(template.subject, defaultVars),
      html: this.renderTemplate(template.htmlContent, defaultVars),
      text: template.textContent 
        ? this.renderTemplate(template.textContent, defaultVars) 
        : undefined,
    };
  }
}

export const emailMarketingService = new EmailMarketingService();
