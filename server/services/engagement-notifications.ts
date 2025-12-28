import nodemailer from 'nodemailer';
import Handlebars from 'handlebars';
import { db } from '../db';
import { 
  users, 
  profiles, 
  pendingRegistrations,
  userActivityTracking,
  emailNotificationLogs,
  emailPreferences,
  courses,
  courseEnrollments,
  ENGAGEMENT_NOTIFICATION_TYPES,
  type EngagementNotificationType
} from '@shared/schema';
import { eq, and, lt, gt, isNull, sql, ne, or } from 'drizzle-orm';
import { NOTIFICATION_EMAIL_TEMPLATES } from '../templates/notifications/email-templates';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: { user: string; pass: string };
  fromName: string;
  fromEmail: string;
}

export class EngagementNotificationService {
  private transporter: nodemailer.Transporter | null = null;
  private config: EmailConfig | null = null;
  private initialized = false;

  constructor() {
    this.initializeFromEnv();
  }

  private async initializeFromEnv(): Promise<void> {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (smtpHost && smtpPort && smtpUser && smtpPass) {
      this.config = {
        host: smtpHost,
        port: parseInt(smtpPort),
        secure: parseInt(smtpPort) === 465,
        auth: { user: smtpUser, pass: smtpPass },
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
      console.log('📧 Engagement notification service initialized');
    } else {
      console.warn('⚠️ Engagement notification service not configured - missing SMTP credentials');
    }
  }

  private getBaseUrl(): string {
    return process.env.REPLIT_DEV_DOMAIN 
      ? `https://${process.env.REPLIT_DEV_DOMAIN}`
      : process.env.BASE_URL || 'https://edufiliova.com';
  }

  private getLogoUrl(): string {
    return process.env.EDUFILIOVA_WHITE_LOGO_URL || 
      'https://res.cloudinary.com/dl2lomrhp/image/upload/v1763935567/edufiliova/edufiliova-white-logo.png';
  }

  private renderTemplate(templateHtml: string, variables: Record<string, unknown>): string {
    const compiled = Handlebars.compile(templateHtml);
    return compiled(variables);
  }

  private async hasBeenNotified(
    userId: string | null, 
    pendingRegistrationId: string | null,
    notificationType: EngagementNotificationType,
    withinHours: number = 24
  ): Promise<boolean> {
    const cutoffTime = new Date(Date.now() - withinHours * 60 * 60 * 1000);
    
    const conditions = [
      eq(emailNotificationLogs.notificationType, notificationType as any),
      gt(emailNotificationLogs.createdAt, cutoffTime),
      or(
        eq(emailNotificationLogs.status, 'sent' as any),
        eq(emailNotificationLogs.status, 'queued' as any)
      )
    ];

    if (userId) {
      conditions.push(eq(emailNotificationLogs.userId, userId as any));
    }
    if (pendingRegistrationId) {
      conditions.push(eq(emailNotificationLogs.pendingRegistrationId, pendingRegistrationId as any));
    }

    const existing = await db.select({ id: emailNotificationLogs.id })
      .from(emailNotificationLogs)
      .where(and(...conditions))
      .limit(1);

    return existing.length > 0;
  }

  private async isOptedOut(userId: string): Promise<boolean> {
    const prefs = await db.select()
      .from(emailPreferences)
      .where(eq(emailPreferences.userId, userId))
      .limit(1);

    if (prefs.length > 0 && !prefs[0].marketingOptIn) {
      return true;
    }
    return false;
  }

  private async logNotification(
    userId: string | null,
    pendingRegistrationId: string | null,
    recipientEmail: string,
    recipientName: string | null,
    notificationType: EngagementNotificationType,
    subject: string,
    status: 'queued' | 'sent' | 'failed' | 'skipped',
    failureReason?: string
  ): Promise<void> {
    await db.insert(emailNotificationLogs).values({
      userId: userId as any,
      pendingRegistrationId: pendingRegistrationId as any,
      recipientEmail,
      recipientName,
      notificationType: notificationType as any,
      subject,
      status: status as any,
      scheduledAt: new Date(),
      sentAt: status === 'sent' ? new Date() : null,
      failureReason,
    });
  }

  private async sendEmail(
    to: string,
    subject: string,
    html: string
  ): Promise<boolean> {
    if (!this.transporter || !this.config) {
      console.warn('Email service not configured');
      return false;
    }

    try {
      await this.transporter.sendMail({
        from: `"${this.config.fromName}" <${this.config.fromEmail}>`,
        to,
        subject,
        html,
      });
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }

  async processIncompleteRegistrations(): Promise<{ sent: number; skipped: number }> {
    let sent = 0, skipped = 0;
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 1 * 60 * 60 * 1000);
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const pending = await db.select()
      .from(pendingRegistrations)
      .where(
        and(
          lt(pendingRegistrations.createdAt, oneHourAgo),
          gt(pendingRegistrations.expiresAt, now)
        )
      )
      .limit(50);

    for (const reg of pending) {
      const hoursSinceCreation = (now.getTime() - new Date(reg.createdAt).getTime()) / (1000 * 60 * 60);
      let notificationType: EngagementNotificationType;

      // Determine which template to use based on registration type
      const isFreelancer = reg.registrationType === 'freelancer';

      if (reg.registrationType === 'freelancer' && hoursSinceCreation >= 24) {
        notificationType = ENGAGEMENT_NOTIFICATION_TYPES.FREELANCER_INCOMPLETE_REGISTRATION_24H;
      } else if (reg.registrationType === 'freelancer' && hoursSinceCreation >= 1) {
        notificationType = ENGAGEMENT_NOTIFICATION_TYPES.FREELANCER_INCOMPLETE_REGISTRATION_1H;
      } else if (hoursSinceCreation >= 24) {
        notificationType = ENGAGEMENT_NOTIFICATION_TYPES.INCOMPLETE_REGISTRATION_24H;
      } else if (hoursSinceCreation >= 1) {
        notificationType = ENGAGEMENT_NOTIFICATION_TYPES.INCOMPLETE_REGISTRATION_1H;
      } else {
        skipped++;
        continue;
      }

      const alreadyNotified = await this.hasBeenNotified(null, reg.id, notificationType, 48);
      if (alreadyNotified) {
        skipped++;
        continue;
      }

      const template = NOTIFICATION_EMAIL_TEMPLATES[notificationType];
      const variables = {
        displayName: reg.displayName || reg.fullName,
        logoUrl: this.getLogoUrl(),
        completeUrl: `${this.getBaseUrl()}/verify-email?token=${reg.token}`,
        currentYear: new Date().getFullYear(),
        unsubscribeLink: `${this.getBaseUrl()}/contact`,
      };

      const subject = this.renderTemplate(template.subject, variables);
      const html = this.renderTemplate(template.html, variables);

      const success = await this.sendEmail(reg.email, subject, html);
      
      await this.logNotification(
        null,
        reg.id,
        reg.email,
        reg.displayName || reg.fullName,
        notificationType,
        subject,
        success ? 'sent' : 'failed',
        success ? undefined : 'Email send failed'
      );

      if (success) sent++;
      else skipped++;
    }

    return { sent, skipped };
  }

  async processWelcomeSeries(): Promise<{ sent: number; skipped: number }> {
    let sent = 0, skipped = 0;
    const now = new Date();

    const activities = await db.select({
      activity: userActivityTracking,
      user: users,
    })
      .from(userActivityTracking)
      .innerJoin(users, eq(userActivityTracking.userId, users.id))
      .where(lt(userActivityTracking.welcomeSeriesSent, 3))
      .limit(100);

    for (const { activity, user } of activities) {
      const daysSinceCreation = (now.getTime() - new Date(activity.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      let notificationType: EngagementNotificationType | null = null;

      if (activity.welcomeSeriesSent === 0 && daysSinceCreation >= 0) {
        notificationType = ENGAGEMENT_NOTIFICATION_TYPES.WELCOME_DAY_0;
      } else if (activity.welcomeSeriesSent === 1 && daysSinceCreation >= 2) {
        notificationType = ENGAGEMENT_NOTIFICATION_TYPES.WELCOME_DAY_2;
      } else if (activity.welcomeSeriesSent === 2 && daysSinceCreation >= 5) {
        notificationType = ENGAGEMENT_NOTIFICATION_TYPES.WELCOME_DAY_5;
      }

      if (!notificationType) {
        skipped++;
        continue;
      }

      if (await this.isOptedOut(user.userId)) {
        skipped++;
        continue;
      }

      const alreadyNotified = await this.hasBeenNotified(user.id, null, notificationType, 48);
      if (alreadyNotified) {
        skipped++;
        continue;
      }

      const template = NOTIFICATION_EMAIL_TEMPLATES[notificationType];
      const variables = {
        displayName: activity.displayName || user.email.split('@')[0],
        logoUrl: this.getLogoUrl(),
        dashboardUrl: `${this.getBaseUrl()}/login`,
        pricingUrl: `${this.getBaseUrl()}/customer-pricing`,
        currentYear: new Date().getFullYear(),
        unsubscribeLink: `${this.getBaseUrl()}/contact`,
      };

      const subject = this.renderTemplate(template.subject, variables);
      const html = this.renderTemplate(template.html, variables);

      const success = await this.sendEmail(user.email, subject, html);
      
      await this.logNotification(
        user.id,
        null,
        user.email,
        activity.displayName,
        notificationType,
        subject,
        success ? 'sent' : 'failed'
      );

      if (success) {
        await db.update(userActivityTracking)
          .set({ 
            welcomeSeriesSent: activity.welcomeSeriesSent + 1,
            updatedAt: new Date()
          })
          .where(eq(userActivityTracking.id, activity.id));
        sent++;
      } else {
        skipped++;
      }
    }

    return { sent, skipped };
  }

  async processLearningInactivity(): Promise<{ sent: number; skipped: number }> {
    let sent = 0, skipped = 0;
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

    const inactiveStudents = await db.select({
      activity: userActivityTracking,
      user: users,
    })
      .from(userActivityTracking)
      .innerJoin(users, eq(userActivityTracking.userId, users.id))
      .where(
        and(
          eq(userActivityTracking.role, 'student'),
          lt(userActivityTracking.lastLessonActivityAt, threeDaysAgo),
          gt(userActivityTracking.lessonsCompletedCount, 0)
        )
      )
      .limit(50);

    const notificationType = ENGAGEMENT_NOTIFICATION_TYPES.LEARNING_INACTIVITY_3D;

    for (const { activity, user } of inactiveStudents) {
      if (await this.isOptedOut(user.userId)) {
        skipped++;
        continue;
      }

      const alreadyNotified = await this.hasBeenNotified(user.id, null, notificationType, 72);
      if (alreadyNotified) {
        skipped++;
        continue;
      }

      const template = NOTIFICATION_EMAIL_TEMPLATES[notificationType];
      const variables = {
        displayName: activity.displayName || user.email.split('@')[0],
        logoUrl: this.getLogoUrl(),
        dashboardUrl: `${this.getBaseUrl()}/courses`,
        currentYear: new Date().getFullYear(),
        unsubscribeLink: `${this.getBaseUrl()}/contact`,
      };

      const subject = this.renderTemplate(template.subject, variables);
      const html = this.renderTemplate(template.html, variables);

      const success = await this.sendEmail(user.email, subject, html);
      
      await this.logNotification(
        user.id,
        null,
        user.email,
        activity.displayName,
        notificationType,
        subject,
        success ? 'sent' : 'failed'
      );

      if (success) sent++;
      else skipped++;
    }

    return { sent, skipped };
  }

  async processTeacherNoContent(): Promise<{ sent: number; skipped: number }> {
    let sent = 0, skipped = 0;
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

    const inactiveTeachers = await db.select({
      activity: userActivityTracking,
      user: users,
    })
      .from(userActivityTracking)
      .innerJoin(users, eq(userActivityTracking.userId, users.id))
      .where(
        and(
          eq(userActivityTracking.role, 'teacher'),
          eq(userActivityTracking.contentCreatedCount, 0),
          lt(userActivityTracking.createdAt, threeDaysAgo)
        )
      )
      .limit(50);

    const notificationType = ENGAGEMENT_NOTIFICATION_TYPES.TEACHER_NO_CONTENT_3D;

    for (const { activity, user } of inactiveTeachers) {
      if (await this.isOptedOut(user.userId)) {
        skipped++;
        continue;
      }

      const alreadyNotified = await this.hasBeenNotified(user.id, null, notificationType, 168);
      if (alreadyNotified) {
        skipped++;
        continue;
      }

      const template = NOTIFICATION_EMAIL_TEMPLATES[notificationType];
      const variables = {
        displayName: activity.displayName || user.email.split('@')[0],
        logoUrl: this.getLogoUrl(),
        createCourseUrl: `${this.getBaseUrl()}/teacher-login`,
        currentYear: new Date().getFullYear(),
        unsubscribeLink: `${this.getBaseUrl()}/contact`,
      };

      const subject = this.renderTemplate(template.subject, variables);
      const html = this.renderTemplate(template.html, variables);

      const success = await this.sendEmail(user.email, subject, html);
      
      await this.logNotification(
        user.id,
        null,
        user.email,
        activity.displayName,
        notificationType,
        subject,
        success ? 'sent' : 'failed'
      );

      if (success) sent++;
      else skipped++;
    }

    return { sent, skipped };
  }

  async processFreelancerNoContent(): Promise<{ sent: number; skipped: number }> {
    let sent = 0, skipped = 0;
    const now = new Date();
    const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);

    const inactiveFreelancers = await db.select({
      activity: userActivityTracking,
      user: users,
    })
      .from(userActivityTracking)
      .innerJoin(users, eq(userActivityTracking.userId, users.id))
      .where(
        and(
          eq(userActivityTracking.role, 'freelancer'),
          eq(userActivityTracking.contentCreatedCount, 0),
          lt(userActivityTracking.createdAt, fiveDaysAgo)
        )
      )
      .limit(50);

    const notificationType = ENGAGEMENT_NOTIFICATION_TYPES.FREELANCER_NO_CONTENT_5D;

    for (const { activity, user } of inactiveFreelancers) {
      if (await this.isOptedOut(user.userId)) {
        skipped++;
        continue;
      }

      const alreadyNotified = await this.hasBeenNotified(user.id, null, notificationType, 168);
      if (alreadyNotified) {
        skipped++;
        continue;
      }

      const template = NOTIFICATION_EMAIL_TEMPLATES[notificationType];
      const variables = {
        displayName: activity.displayName || user.email.split('@')[0],
        logoUrl: this.getLogoUrl(),
        uploadWorkUrl: `${this.getBaseUrl()}/freelancer-login`,
        currentYear: new Date().getFullYear(),
        unsubscribeLink: `${this.getBaseUrl()}/contact`,
      };

      const subject = this.renderTemplate(template.subject, variables);
      const html = this.renderTemplate(template.html, variables);

      const success = await this.sendEmail(user.email, subject, html);
      
      await this.logNotification(
        user.id,
        null,
        user.email,
        activity.displayName,
        notificationType,
        subject,
        success ? 'sent' : 'failed'
      );

      if (success) sent++;
      else skipped++;
    }

    return { sent, skipped };
  }

  async processTeacherNoSales(): Promise<{ sent: number; skipped: number }> {
    let sent = 0, skipped = 0;
    const now = new Date();
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const teachersNoSales = await db.select({
      activity: userActivityTracking,
      user: users,
    })
      .from(userActivityTracking)
      .innerJoin(users, eq(userActivityTracking.userId, users.id))
      .where(
        and(
          eq(userActivityTracking.role, 'teacher'),
          gt(userActivityTracking.contentCreatedCount, 0),
          or(
            isNull(userActivityTracking.lastSaleAt),
            lt(userActivityTracking.lastSaleAt, fourteenDaysAgo)
          )
        )
      )
      .limit(50);

    const notificationType = ENGAGEMENT_NOTIFICATION_TYPES.TEACHER_NO_SALES_14D;

    for (const { activity, user } of teachersNoSales) {
      if (await this.isOptedOut(user.userId)) {
        skipped++;
        continue;
      }

      const alreadyNotified = await this.hasBeenNotified(user.id, null, notificationType, 336);
      if (alreadyNotified) {
        skipped++;
        continue;
      }

      const template = NOTIFICATION_EMAIL_TEMPLATES[notificationType];
      const variables = {
        displayName: activity.displayName || user.email.split('@')[0],
        logoUrl: this.getLogoUrl(),
        dashboardUrl: `${this.getBaseUrl()}/teacher-login`,
        currentYear: new Date().getFullYear(),
        unsubscribeLink: `${this.getBaseUrl()}/contact`,
      };

      const subject = this.renderTemplate(template.subject, variables);
      const html = this.renderTemplate(template.html, variables);

      const success = await this.sendEmail(user.email, subject, html);
      
      await this.logNotification(
        user.id,
        null,
        user.email,
        activity.displayName,
        notificationType,
        subject,
        success ? 'sent' : 'failed'
      );

      if (success) sent++;
      else skipped++;
    }

    return { sent, skipped };
  }

  async processReengagement(): Promise<{ sent: number; skipped: number }> {
    let sent = 0, skipped = 0;
    const now = new Date();

    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const inactiveUsers = await db.select({
      activity: userActivityTracking,
      user: users,
    })
      .from(userActivityTracking)
      .innerJoin(users, eq(userActivityTracking.userId, users.id))
      .where(lt(userActivityTracking.lastSeenAt, sevenDaysAgo))
      .limit(100);

    for (const { activity, user } of inactiveUsers) {
      const lastSeen = activity.lastSeenAt ? new Date(activity.lastSeenAt) : new Date(activity.createdAt);
      const daysSinceLastSeen = (now.getTime() - lastSeen.getTime()) / (1000 * 60 * 60 * 24);

      let notificationType: EngagementNotificationType;
      let cooldownHours: number;

      if (daysSinceLastSeen >= 30) {
        notificationType = ENGAGEMENT_NOTIFICATION_TYPES.REENGAGEMENT_30D;
        cooldownHours = 720;
      } else if (daysSinceLastSeen >= 14) {
        notificationType = ENGAGEMENT_NOTIFICATION_TYPES.REENGAGEMENT_14D;
        cooldownHours = 336;
      } else if (daysSinceLastSeen >= 7) {
        notificationType = ENGAGEMENT_NOTIFICATION_TYPES.REENGAGEMENT_7D;
        cooldownHours = 168;
      } else {
        skipped++;
        continue;
      }

      if (await this.isOptedOut(user.userId)) {
        skipped++;
        continue;
      }

      const alreadyNotified = await this.hasBeenNotified(user.id, null, notificationType, cooldownHours);
      if (alreadyNotified) {
        skipped++;
        continue;
      }

      const template = NOTIFICATION_EMAIL_TEMPLATES[notificationType];
      const variables = {
        displayName: activity.displayName || user.email.split('@')[0],
        logoUrl: this.getLogoUrl(),
        dashboardUrl: `${this.getBaseUrl()}/login`,
        currentYear: new Date().getFullYear(),
        unsubscribeLink: `${this.getBaseUrl()}/contact`,
      };

      const subject = this.renderTemplate(template.subject, variables);
      const html = this.renderTemplate(template.html, variables);

      const success = await this.sendEmail(user.email, subject, html);
      
      await this.logNotification(
        user.id,
        null,
        user.email,
        activity.displayName,
        notificationType,
        subject,
        success ? 'sent' : 'failed'
      );

      if (success) sent++;
      else skipped++;
    }

    return { sent, skipped };
  }

  async runAllRules(): Promise<Record<string, { sent: number; skipped: number }>> {
    console.log('🔔 Running engagement notification rules...');
    
    const results: Record<string, { sent: number; skipped: number }> = {};

    try {
      results.incompleteRegistrations = await this.processIncompleteRegistrations();
      console.log(`📧 Incomplete registrations: sent=${results.incompleteRegistrations.sent}, skipped=${results.incompleteRegistrations.skipped}`);
    } catch (error) {
      console.error('Error processing incomplete registrations:', error);
      results.incompleteRegistrations = { sent: 0, skipped: 0 };
    }

    try {
      results.welcomeSeries = await this.processWelcomeSeries();
      console.log(`📧 Welcome series: sent=${results.welcomeSeries.sent}, skipped=${results.welcomeSeries.skipped}`);
    } catch (error) {
      console.error('Error processing welcome series:', error);
      results.welcomeSeries = { sent: 0, skipped: 0 };
    }

    try {
      results.learningInactivity = await this.processLearningInactivity();
      console.log(`📧 Learning inactivity: sent=${results.learningInactivity.sent}, skipped=${results.learningInactivity.skipped}`);
    } catch (error) {
      console.error('Error processing learning inactivity:', error);
      results.learningInactivity = { sent: 0, skipped: 0 };
    }

    try {
      results.teacherNoContent = await this.processTeacherNoContent();
      console.log(`📧 Teacher no content: sent=${results.teacherNoContent.sent}, skipped=${results.teacherNoContent.skipped}`);
    } catch (error) {
      console.error('Error processing teacher no content:', error);
      results.teacherNoContent = { sent: 0, skipped: 0 };
    }

    try {
      results.freelancerNoContent = await this.processFreelancerNoContent();
      console.log(`📧 Freelancer no content: sent=${results.freelancerNoContent.sent}, skipped=${results.freelancerNoContent.skipped}`);
    } catch (error) {
      console.error('Error processing freelancer no content:', error);
      results.freelancerNoContent = { sent: 0, skipped: 0 };
    }

    try {
      results.teacherNoSales = await this.processTeacherNoSales();
      console.log(`📧 Teacher no sales: sent=${results.teacherNoSales.sent}, skipped=${results.teacherNoSales.skipped}`);
    } catch (error) {
      console.error('Error processing teacher no sales:', error);
      results.teacherNoSales = { sent: 0, skipped: 0 };
    }

    try {
      results.reengagement = await this.processReengagement();
      console.log(`📧 Re-engagement: sent=${results.reengagement.sent}, skipped=${results.reengagement.skipped}`);
    } catch (error) {
      console.error('Error processing re-engagement:', error);
      results.reengagement = { sent: 0, skipped: 0 };
    }

    console.log('✅ Engagement notification rules completed');
    return results;
  }
}

export const engagementNotificationService = new EngagementNotificationService();
