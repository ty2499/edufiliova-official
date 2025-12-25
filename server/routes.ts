import type { Express, Response, Request } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import bcrypt from "bcrypt";
import { cache, cachedQuery, CacheKeys, CacheTTL, invalidateUserMessaging, invalidateThread, invalidateGroupMessages } from "./cache.js";
import { Vonage } from '@vonage/server-sdk';
import { WhatsAppText } from '@vonage/messages';
import { sendVerificationCode as sendWhatsAppOTP, isWhatsAppConfigured } from './whatsapp-service.js';
import nodemailer from 'nodemailer';
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import { upload, getFileType, getMimeTypeFromFileType, validateFile, type FileMetadata, FILE_CONFIGS } from "./upload.js";
import { z } from "zod";
import { cloudinaryStorage } from "./cloudinary-storage.js";

// Helper function to get file extension
const getFileExtension = (fileName: string): string => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  return ext || 'txt';
};
import { db } from "./db.js";
import { requireAuth, requireAdmin, requireAdminOrModerator, requireSupportStaff, optionalAuth, type AuthenticatedRequest } from "./middleware/auth.js";
import { validateApiKey } from "./middleware/api-key.js";
import { storage } from "./storage.js";
import { countryCodes } from '../shared/countryCodes.js';
import { createPaypalOrder, capturePaypalOrder, loadPaypalDefault } from "./paypal.js";
import { getPrimaryPaymentClient, getStripeInstance, getStripePublishableKey, invalidatePaymentGatewayCache } from "./utils/payment-gateways.js";
import { seedAPIKeys } from "./seed-api-keys.js";
import dodopayRoutes from "./dodopay-routes.js";
import vodapayRoutes from "./vodapay-routes.js";
import ecocashRoutes from "./routes/ecocash-routes.js";
import { clearSettingsCache } from "./utils/settings.js";
import { generateCertificateWithCertifier, generateVerificationCode } from "./utils/certifier-certificate-generator.js";
import { 
  users, 
  profiles, 
  userRoles,
  verificationCodes,
  passwordResetTokens,
  countries,
  gradeSystems,
  userLoginSessions,
  userPrivacySettings,
  userNotificationPreferences,
  userOtherSettings,
  systemSettings,
  paymentGateways,
  paymentMethods,
  notifications,
  teacherApplications,
  freelancerApplications,
  studentProgress,
  lessonProgress,
  tasks,
  courses,
  courseCategories,
  modules,
  lessons,
  lessonMedia,
  lessonContentBlocks,
  quizzes,
  certificates,
  certificatePurchases,
  lessonAccessPermissions,
  whatsappPaymentIntents,
  topics,
  teacherAvailability,
  appointments,
  scheduleTemplates,
  courseEnrollments,
  coursePurchases,
  studyNotes,
  messages,
  chatThreads,
  chatParticipants,
  supportAgents,
  supportChatSessions,
  helpChatMessages,
  helpChatSettings,
  quickResponses,
  insertChatThreadSchema,
  insertChatParticipantSchema,
  insertMessageSchema,
  insertSupportAgentSchema,
  insertHelpChatSettingSchema,
  insertQuickResponseSchema,
  insertSupportChatSessionSchema,
  insertCourseSchema,
  insertModuleSchema,
  insertLessonSchema,
  insertLessonMediaSchema,
  insertQuizSchema,
  friendships,
  groupMemberships,
  premiumMessages,
  communityGroups,
  communityGroupMembers,
  communityPosts,
  communityReplies,
  communityReactions,
  pricingPlans,
  userSubscriptions,
  payments,
  curricula,
  countryCurricula,
  teacherStudentAssignments,
  announcements,
  announcementReads,
  moderationLogs,
  blogPosts,
  subjects,
  subjectChapters,
  subjectLessons,
  subjectExercises,
  subjectProgress,
  dailyQuestions,
  dailyQuestionProgress,
  dailyProgressSummary,
  transactions,
  payoutAccounts,
  userBalances,
  banks,
  insertPayoutAccountSchema,
  insertTransactionSchema,
  insertPricingPlanSchema,
  assignments,
  assignmentSubmissions,
  assignmentComments,
  courseReviews,
  projects,
  projectMilestones,
  downloads,
  insertProjectSchema,
  insertProjectMilestoneSchema,
  shopCategories,
  insertShopCategorySchema,
  categoryFilters,
  categoryFilterOptions,
  insertCategoryFilterSchema,
  insertCategoryFilterOptionSchema,
  categoryAccessApprovals,
  orders,
  orderItems,
  products,
  heroSections,
  insertHeroSectionSchema,
  insertProfileSchema,
  works,
  workMedia,
  shopCustomers,
  shopPurchases,
  shopAds,
  shopMemberships,
  shopTransactions,
  shopSupportTickets,
  shopMembershipPlans,
  manualPlanAssignments,
  insertShopMembershipPlanSchema,
  freelancerPricingPlans,
  insertFreelancerPricingPlanSchema,
  adsBanners,
  workLikes,
  workComments,
  courseComments,
  courseCommentReplies,
  courseCommentLikes,
  courseCommentReplyLikes,
  coupons,
  couponUsages,
  workViews,
  giftVoucherPurchases,
  shopVouchers,
  emailAccounts
} from "../shared/schema.ts";
import { eq, desc, and, or, sql, count, avg, sum, gt, lt, like, ilike, inArray, asc, isNull, isNotNull, ne, gte, lte } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import Stripe from "stripe";
import { seedCountries } from "./seed-countries.js";
import { seedGradeSystems } from "./seed-grade-systems.js";
import { seedCurricula } from "./seed-curricula.js";
import { seedMembershipPlans } from "./seed-membership-plans.js";
import { seedEnglishGrade3Zimbabwe } from "./seed-english-grade3-zimbabwe.js";
import { seedMathematicsGrade3Zimbabwe } from "./seed-mathematics-grade3-zimbabwe.js";
import { seedAIMLCourse } from "./seed-ai-ml-course.js";
import { seedPromptEngineeringCourse } from "./seed-prompt-engineering-course.js";
import { seedEmailAccounts } from "./seed-email-accounts.js";
import { ensureAdminUser } from "./ensure-admin-user.js";
import { WORLD_COUNTRIES } from "./world-countries-data.js";
import communityRouter from "./community-routes.js";
import certificatePaymentRoutes from "./certificate-payment-routes.js";
import * as adsRoutes from "./routes/ads.js";
import * as bannerPaymentRoutes from "./routes/banner-payment.js";
import * as heroSectionRoutes from "./routes/hero-sections.ts";
import * as freelancerProjectRoutes from "./routes/freelancer-projects.js";
import { requireFreelancerRole } from "./routes/freelancer-projects.js";
import showcaseRoutes from "./routes/showcase.js";
import productsRoutes from "./routes/products.js";
import ordersRoutes from "./routes/orders.js";
import cartRoutes from "./routes/cart.js";
import storageStatusRoutes from "./routes/storage-status.js";
import portfolioRoutes from "./routes/portfolio.js";
import adminCouponsRoutes from "./routes/admin-coupons.js";
import adminApiKeysRoutes from "./routes/admin-api-keys.js";
import manualPlanAssignmentRoutes from "./routes/manual-plan-assignment.js";
import certificateRoutes from "./routes/certificate-routes.js";
import adminCourseRoutes from "./routes/admin-course-routes.js";
import profileBoostRoutes from "./routes/profile-boost.js";
import workBoostRoutes from "./routes/work-boost.js";
import contactSubmissionsRoutes from "./routes/contact-submissions";
import creatorPayoutsRouter from "./routes/creator-payouts.js";
import adminTransactionsRoutes from "./routes/admin-transactions.js";
import { registerFinancialStatsRoutes } from "./routes/financial-stats.js";
import { registerLessonContentBlockRoutes } from "./routes/lesson-content-blocks.js";
import { trackProductDownload } from "./services/earnings.js";
import { generatePythonLessonContent } from "./content-generator.js";
import { regenerateJobReadinessImages } from "./regenerate-job-readiness-images.js";
// @ts-ignore - PayPal SDK types
import paypal from "@paypal/payouts-sdk";

// PayPal Configuration with proper types
const paypalClient = (): any => {
  const environment = process.env.PAYPAL_ENVIRONMENT === 'production' 
    ? new (paypal as any).core.LiveEnvironment(
        process.env.PAYPAL_CLIENT_ID!, 
        process.env.PAYPAL_CLIENT_SECRET!
      )
    : new (paypal as any).core.SandboxEnvironment(
        process.env.PAYPAL_CLIENT_ID || 'test_client_id', 
        process.env.PAYPAL_CLIENT_SECRET || 'test_client_secret'
      );

  return new (paypal as any).core.PayPalHttpClient(environment);
};

// File upload configuration is imported from upload.ts

// WebSocket clients management
const wsClients = new Map<string, WebSocket>();
const adminClients = new Set<WebSocket>();

// Rate limiting for community features
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

const createRateLimit = (windowMs: number, maxRequests: number) => {
  return (req: Request, res: Response, next: express.NextFunction) => {
    const key = `${req.ip || 'unknown'}_${req.headers['x-session-id'] || 'no-session'}`;
    const now = Date.now();
    
    // Clean up expired entries
    for (const [k, v] of rateLimitStore.entries()) {
      if (now > v.resetTime) {
        rateLimitStore.delete(k);
      }
    }
    
    let bucket = rateLimitStore.get(key);
    if (!bucket || now > bucket.resetTime) {
      bucket = { count: 0, resetTime: now + windowMs };
      rateLimitStore.set(key, bucket);
    }
    
    if (bucket.count >= maxRequests) {
      const remainingTime = Math.ceil((bucket.resetTime - now) / 1000);
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        retryAfter: remainingTime
      });
    }
    
    bucket.count++;
    next();
  };
};

// Helper function to map country names to codes
function getCountryCodeFromName(countryName: string): string {
  const country = countryCodes.find(c => c.name === countryName);
  return country ? country.code : 'US';
}

// Helper function to convert userId to UUID (handles both text ID and UUID formats)
async function getUserUuidByTextId(userIdOrUuid: string): Promise<string | null> {
  try {
    // Check if it's already a UUID format
    if (userIdOrUuid && userIdOrUuid.length === 36 && userIdOrUuid.includes('-')) {
      // It's already a UUID, return as-is
      return userIdOrUuid;
    }
    
    // It's a text ID, convert to UUID
    const user = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.userId, userIdOrUuid))
      .limit(1);
    
    return user.length > 0 ? user[0].id : null;
  } catch (error: any) {
    console.error('Error converting userId to UUID:', error);
    return null;
  }
}

// Helper function to get text ID by profile UUID
async function getTextIdByProfileUuid(profileUuid: string): Promise<string | null> {
  try {
    // Get the user ID (UUID) from the profile
    const profile = await db
      .select({ userId: profiles.userId })
      .from(profiles)
      .where(eq(profiles.id, profileUuid))
      .limit(1);
    
    if (profile.length === 0) return null;
    
    // Get the text ID from users table
    const user = await db
      .select({ userId: users.userId })
      .from(users)
      .where(eq(users.id, profile[0].userId))
      .limit(1);
      
    return user.length > 0 ? user[0].userId : null;
  } catch (error: any) {
    console.error('Error getting text ID by profile UUID:', error);
    return null;
  }
}

// Helper function to check if user has active subscription
async function hasActiveSubscription(userIdOrUuid: string): Promise<{ hasAccess: boolean; subscriptionTier?: string; planExpiry?: Date; plan?: string }> {
  try {
    // Convert text ID to UUID if needed
    const userUuid = await getUserUuidByTextId(userIdOrUuid);
    if (!userUuid) {
      return { hasAccess: false };
    }

    const profile = await db
      .select({
        subscriptionTier: profiles.subscriptionTier,
        legacyPlan: profiles.legacyPlan,
        planExpiry: profiles.planExpiry,
        gradeLevel: profiles.gradeLevel,
        stripeSubscriptionId: profiles.stripeSubscriptionId
      })
      .from(profiles)
      .where(eq(profiles.userId, userUuid))
      .limit(1);

    if (profile.length === 0) {
      return { hasAccess: false };
    }

    const userProfile = profile[0];
    
    // New grade-based subscription system with proper expiry validation
    if (userProfile.subscriptionTier) {
      // CRITICAL: Must check planExpiry for grade-based subscriptions
      if (userProfile.planExpiry) {
        const expiry = new Date(userProfile.planExpiry);
        const now = new Date();
        
        if (expiry <= now) {
          // Subscription expired - no access
          return { 
            hasAccess: false, 
            subscriptionTier: userProfile.subscriptionTier,
            planExpiry: userProfile.planExpiry,
            plan: userProfile.subscriptionTier 
          };
        }
        
        // Valid subscription with future expiry
        return { 
          hasAccess: true, 
          subscriptionTier: userProfile.subscriptionTier,
          planExpiry: userProfile.planExpiry,
          plan: userProfile.subscriptionTier 
        };
      } else {
        // No expiry set means subscription was never properly activated
        return { 
          hasAccess: false, 
          subscriptionTier: userProfile.subscriptionTier,
          planExpiry: undefined,
          plan: userProfile.subscriptionTier 
        };
      }
    }
    
    // Legacy support: Check old plan system for backward compatibility
    if (userProfile.legacyPlan && userProfile.legacyPlan !== 'free' && userProfile.legacyPlan !== '') {
      // Check for indefinite access: if user has a premium plan but planExpiry is null, grant access
      if (!userProfile.planExpiry) {
        const hasPremiumPlan = userProfile.legacyPlan.includes('premium') || userProfile.legacyPlan.includes('pro');
        
        if (hasPremiumPlan) {
          return { 
            hasAccess: true, 
            subscriptionTier: userProfile.subscriptionTier || 'legacy_premium',
            planExpiry: undefined,
            plan: userProfile.legacyPlan 
          };
        }
        
        // For non-premium plans with null expiry, deny access
        return { 
          hasAccess: false, 
          subscriptionTier: userProfile.subscriptionTier || 'free',
          planExpiry: userProfile.planExpiry || undefined,
          plan: userProfile.legacyPlan 
        };
      }

      // Check if legacy subscription has expired
      if (userProfile.planExpiry && new Date() > userProfile.planExpiry) {
        return { 
          hasAccess: false, 
          subscriptionTier: userProfile.subscriptionTier || 'free',
          planExpiry: userProfile.planExpiry || undefined,
          plan: userProfile.legacyPlan 
        };
      }

      // User has active legacy subscription
      return { 
        hasAccess: true, 
        subscriptionTier: userProfile.subscriptionTier || 'legacy_premium',
        planExpiry: userProfile.planExpiry || undefined,
        plan: userProfile.legacyPlan 
      };
    }

    // No subscription found
    return { 
      hasAccess: false, 
      subscriptionTier: 'free',
      planExpiry: undefined,
      plan: 'free' 
    };

  } catch (error: any) {
    console.error('Error checking subscription status:', error);
    return { hasAccess: false };
  }
}

// Note: Stripe is now initialized dynamically from admin settings
// Use getStripeInstance() from payment-gateways.ts instead of this global instance

// Initialize Vonage (SMS & WhatsApp)

const vonage = new Vonage({
  apiKey: process.env.VONAGE_API_KEY?.trim() || '',
  apiSecret: process.env.VONAGE_API_SECRET?.trim() || ''
});

// Create email transporter for EduFiliova professional email system
// Uses database-stored credentials for each email account
const createEmailTransporter = async (senderEmail: string) => {
  // Fetch email account credentials from database
  const emailAccount = await db
    .select()
    .from(emailAccounts)
    .where(eq(emailAccounts.email, senderEmail))
    .limit(1);
  
  if (emailAccount.length > 0 && emailAccount[0].smtpPassword) {
    // Use database credentials
    console.log(`📧 Using database credentials for ${senderEmail}`);
    return nodemailer.createTransport({
      host: emailAccount[0].smtpHost || 'mail.spacemail.com',
      port: emailAccount[0].smtpPort || 465,
      secure: emailAccount[0].smtpSecure ?? true,
      auth: {
        user: emailAccount[0].smtpUsername || senderEmail,
        pass: emailAccount[0].smtpPassword
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }
  
  // Fallback to environment variable if no database entry
  console.log(`📧 Using fallback SMTP_PASSWORD for ${senderEmail}`);
  return nodemailer.createTransport({
    host: 'mail.spacemail.com',
    port: 465,
    secure: true,
    auth: {
      user: senderEmail,
      pass: process.env.SMTP_PASSWORD || ''
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

// Email templates with modern branding
export const getEmailTemplate = (type: 'verification' | 'welcome' | 'password_reset' | 'teacher-verification', data: any) => {
  const whiteLogoUrl = process.env.EDUFILIOVA_WHITE_LOGO_URL || 'https://res.cloudinary.com/dl2lomrhp/image/upload/v1763935567/edufiliova/edufiliova-white-logo.png';
  const baseUrl = process.env.REPLIT_DEV_DOMAIN 
    ? `https://${process.env.REPLIT_DEV_DOMAIN}`
    : process.env.BASE_URL || process.env.APP_URL || 'https://edufiliova.com';
  const currentYear = new Date().getFullYear();
  
  const baseStyle = `
    <style>
      body { 
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
        margin: 0; 
        padding: 0; 
        background-color: #f5f7fa; 
      }
      .container { 
        max-width: 600px; 
        margin: 0 auto; 
        background-color: #ffffff; 
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05); 
      }
      .header { 
        background-color: #0C332C; 
        padding: 30px 40px; 
        text-align: center; 
      }
      .logo { 
        max-width: 200px; 
        height: auto; 
      }
      .content { 
        padding: 40px; 
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
      .button { 
        display: inline-block; 
        background-color: #0C332C; 
        color: #ffffff !important; 
        padding: 14px 32px; 
        text-decoration: none; 
        border-radius: 8px; 
        font-weight: 600; 
        font-size: 15px; 
        margin: 20px 0; 
      }
      .alert-warning { 
        background-color: #fff4ed; 
        border-left: 4px solid #0C332C; 
        padding: 15px 20px; 
        border-radius: 6px; 
        margin: 20px 0; 
      }
      .footer { 
        background: #0C332C; 
        padding: 40px; 
        color: #ffffff; 
      }
      .footer-contact { 
        text-align: center; 
        margin: 25px 0; 
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
  `;

  const footer = `
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
        © ${currentYear} EduFiliova. All rights reserved.<br>
        Creativity, Learning, and Growth in One Place
      </div>
    </div>
  `;

  switch (type) {
    case 'verification':
      return `
        <!DOCTYPE html>
        <html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">${baseStyle}</head><body>
          <div class="container">
            <div class="header">
              <img src="${whiteLogoUrl}" alt="EduFiliova" class="logo" />
            </div>
            <div class="content">
              <h2 class="title">Verify Your Account</h2>
              <p class="message">
                ${data.name ? `Hi ${data.name},<br><br>` : ''}Welcome to EduFiliova! Please use the verification code below to complete your registration:
              </p>
              
              <div class="verification-code-box">
                <div class="code-label">YOUR VERIFICATION CODE</div>
                <div class="verification-code">${data.code}</div>
                <div style="color: rgba(255, 255, 255, 0.8); font-size: 12px; margin-top: 10px;">
                  Code expires in 15 minutes
                </div>
              </div>
              
              <p class="message">
                Please enter this code on the verification page to complete your signup and create your account.
              </p>

              <div class="alert-warning">
                <div style="color: #92400e; font-size: 13px;">
                  <strong>Didn't request this?</strong> If you didn't try to sign up for EduFiliova, you can safely ignore this email.
                </div>
              </div>
              
              <p class="message" style="font-size: 14px;">
                Need help? Contact our support team at support@edufiliova.com
              </p>
            </div>
            ${footer}
          </div>
        </body></html>
      `;

    case 'welcome':
      return `
        <!DOCTYPE html>
        <html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">${baseStyle}</head><body>
          <div class="container">
            <div class="header">
              <img src="${whiteLogoUrl}" alt="EduFiliova" class="logo" />
            </div>
            <div class="content">
              <h2 class="title">Welcome to EduFiliova!</h2>
              <p class="message">
                Congratulations, <strong>${data.name}</strong>! Your account has been successfully verified and you're now part of our global learning community.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${data.loginUrl}" class="button">Start Learning</a>
              </div>
              
              <div style="background-color: #f9fafb; border-radius: 10px; padding: 25px; margin: 25px 0;">
                <h3 style="color: #1f2937; margin: 0 0 15px 0;">What's Next?</h3>
                <ul style="color: #4b5563; line-height: 2; margin: 0; padding-left: 20px;">
                  <li>Explore personalized learning content</li>
                  <li>Access premium educational resources</li>
                  <li>Connect with teachers and tutors</li>
                  <li>Track your learning progress</li>
                </ul>
              </div>
              
              <p class="message" style="font-size: 14px;">
                Need help getting started? Contact our support team at support@edufiliova.com
              </p>
            </div>
            ${footer}
          </div>
        </body></html>
      `;

    case 'password_reset':
      return `
        <!DOCTYPE html>
        <html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">${baseStyle}</head><body>
          <div class="container">
            <div class="header">
              <img src="${whiteLogoUrl}" alt="EduFiliova" class="logo" />
            </div>
            <div class="content">
              <h2 class="title">Reset Your Password</h2>
              <p class="message">
                We received a request to reset your password. Click the button below to create a new password:
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${data.resetUrl}" class="button">Reset Password</a>
              </div>
              
              <div class="alert-warning">
                <div style="color: #92400e; font-size: 13px;">
                  <strong>Security Notice:</strong> This link expires in 1 hour. If you didn't request this reset, please ignore this email.
                </div>
              </div>
              
              <p class="message" style="font-size: 14px;">
                For security, this link can only be used once.
              </p>
            </div>
            ${footer}
          </div>
        </body></html>
      `;

    case 'teacher-verification':
      return `
        <!DOCTYPE html>
        <html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">${baseStyle}</head><body>
          <div class="container">
            <div class="header">
              <img src="${whiteLogoUrl}" alt="EduFiliova" class="logo" />
            </div>
            <div class="content">
              <h2 class="title">Verify Your Teacher Application</h2>
              <p class="message">
                Hi ${data.fullName},<br><br>
                Thank you for applying to teach with EduFiliova! Please use the verification code below to complete your application:
              </p>
              
              <div class="verification-code-box">
                <div class="code-label">YOUR VERIFICATION CODE</div>
                <div class="verification-code">${data.code}</div>
                <div style="color: rgba(255, 255, 255, 0.8); font-size: 12px; margin-top: 10px;">
                  Code expires in 24 hours
                </div>
              </div>
              
              <p class="message">
                Please enter this code on the verification page to continue with your teacher application.
              </p>

              <div class="alert-warning">
                <div style="color: #92400e; font-size: 13px;">
                  <strong>Didn't request this?</strong> If you didn't apply to become a teacher, you can safely ignore this email.
                </div>
              </div>
              
              <p class="message" style="font-size: 14px; margin-top: 24px;">
                Once verified, your application will be reviewed by our team and you'll receive an update within 24-48 hours.
              </p>
            </div>
            ${footer}
          </div>
        </body></html>
      `;

    default:
      return '<p>Invalid email template</p>';
  }
};

// Utility functions
// Utility functions
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const generateUserId = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const sendSMS = async (phoneNumber: string, message: string) => {
  try {
    if (!process.env.VONAGE_API_KEY || !process.env.VONAGE_API_SECRET) {
      console.log('⚠️ Vonage credentials not configured, skipping SMS');
      return { success: false, error: 'SMS service not configured' };
    }

    const from = "EduFiliova";
    const to = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
    
    const response = await vonage.sms.send({ to, from, text: message });
    console.log('✅ SMS sent successfully:', response);
    return { success: true, messageId: response.messages[0]?.['message-id'] };
  } catch (error: any) {
    console.error('❌ SMS sending failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export const sendEmail = async (to: string, subject: string, html: string, fromAddress = 'verify@edufiliova.com') => {
  try {
    // Extract verification code from HTML for console logging
    const codeMatch = html.match(/<div class="code">(\d+)<\/div>/);
    const verificationCode = codeMatch ? codeMatch[1] : 'Unknown';
    
    // Store verification code (for development - remove in production)
    console.log('📧 Subject:', subject);
    
    // Try to send email, but don't fail if SMTP fails
    try {
      const transporter = await createEmailTransporter(fromAddress);
      
      const mailOptions = {
        from: `"EduFiliova" <${fromAddress}>`,
        to,
        subject,
        html,
      };

      const info = await transporter.sendMail(mailOptions);
      // Email sent successfully
      return { success: true, messageId: info.messageId };
    } catch (smtpError) {
      // Email sending failed - log error and return failure
      console.error('❌ Email sending failed:', smtpError);
      return { success: false, error: 'Failed to send email' };
    }
  } catch (error: any) {
    console.error('❌ Email processing failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

const isValidEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isValidPhone = (phone: string) => {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
};

// Broadcasting functions for real-time updates
const broadcastToAdmins = (message: any) => {
  adminClients.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  });
};

const broadcastToUser = (userId: string, message: any) => {
  const userWs = wsClients.get(userId);
  if (userWs && userWs.readyState === WebSocket.OPEN) {
    userWs.send(JSON.stringify(message));
  }
};

// Helper function to generate 14-character alphanumeric voucher code
function generateVoucherCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 14; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function registerRoutes(app: Express): Promise<Server> {
  const server = createServer(app);

  // Run all seeding operations in parallel and await completion before serving requests
  // This ensures data integrity while still benefiting from parallel execution
  const results = await Promise.allSettled([
    seedCountries(),
    seedGradeSystems(),
    seedCurricula(),
    seedMembershipPlans(),
    seedAPIKeys(),
    seedEnglishGrade3Zimbabwe(),
    seedMathematicsGrade3Zimbabwe(),
    seedEmailAccounts(),
    // seedAIMLCourse(), // Disabled - user requested deletion
    // seedPromptEngineeringCourse(), // Disabled - user requested deletion
  ]);
  
  results.forEach((result, index) => {
    const operations = ['countries', 'grade systems', 'curricula', 'membership plans', 'API keys', 'English Grade 3', 'Mathematics Grade 3', 'Email accounts'];
    if (result.status === 'rejected') {
      console.error(`❌ Failed to seed ${operations[index]}:`, result.reason);
    }
  });

  // Clean up expired verification codes periodically
  const cleanupExpiredCodes = async () => {
    try {
      const now = new Date();
      const deleted = await db.delete(verificationCodes).where(
        or(
          lt(verificationCodes.expiresAt, now),
          eq(verificationCodes.isUsed, true)
        )
      );
      console.log('🧹 Cleaned up expired verification codes');
    } catch (error: any) {
      console.error('❌ Failed to cleanup verification codes:', error);
    }
  };

  // Run cleanup every 30 minutes
  setInterval(cleanupExpiredCodes, 30 * 60 * 1000);
  
  // Run initial cleanup
  cleanupExpiredCodes();

  // Mount community routes
  app.use('/api/community', communityRouter);
  // Mount certificate payment routes
  app.use(certificatePaymentRoutes);

  // Mount showcase portfolio routes
  app.use('/api/showcase', showcaseRoutes);
  
  // Mount portfolio routes (Behance-like works system)
  app.use('/api/portfolio', portfolioRoutes);

  // Mount products shop routes
  app.use('/api/products', productsRoutes);

  // Mount cart management routes
  app.use('/api/cart', cartRoutes);

  // Mount orders management routes  
  app.use('/api/orders', ordersRoutes);

  // Mount admin coupon management routes
  app.use('/api/certificates', certificateRoutes);
  app.use('/api/admin/courses', requireAuth, requireAdmin, adminCourseRoutes);
  app.use('/api/admin/coupons', adminCouponsRoutes);
  app.use('/api/admin/api-keys', requireAuth, requireAdmin, adminApiKeysRoutes);
  app.use('/api/admin/manual-plan-assignments', requireAuth, manualPlanAssignmentRoutes);
  app.use('/api', contactSubmissionsRoutes);
  app.use('/api/admin/profile-boost', requireAuth, requireAdmin, profileBoostRoutes);
  // Mount creator payouts routes
  app.use('/api/creator-payouts', creatorPayoutsRouter);
  registerFinancialStatsRoutes(app);
  registerLessonContentBlockRoutes(app, requireAuth);
  app.use('/api', adminTransactionsRoutes);
  app.use('/api/admin/storage', storageStatusRoutes);
  app.use('/api/admin/work-boost', requireAuth, requireAdmin, workBoostRoutes);

  // PayPal routes - Referenced from PayPal integration blueprint
  app.get("/api/paypal/setup", async (req, res) => {
    await loadPaypalDefault(req, res);
  });

  app.post("/api/paypal/order", async (req, res) => {
    // Request body should contain: { intent, amount, currency }
    await createPaypalOrder(req, res);
  });

  app.post("/api/paypal/order/:orderID/capture", async (req, res) => {
  
    await capturePaypalOrder(req, res);
  });

  // DoDo Pay routes
  app.use("/api/dodopay", dodopayRoutes);

  // VodaPay routes
  app.use("/api/vodapay", vodapayRoutes);

  // EcoCash routes (Zimbabwe only)
  app.use("/api", ecocashRoutes);

  // Advertisement routes - Full CRUD Management System
  app.get('/api/ads/manage', requireAuth, adsRoutes.getManageAds);           // Get all ads (admin) or user's own ads
  app.get('/api/ads/my-ads', requireAuth, adsRoutes.getMyAds);               // Get current user's ads
  app.post('/api/ads/create', requireAuth, adsRoutes.createAd);              // Create ad (admin only - free)
  app.put('/api/ads/:id', requireAuth, adsRoutes.updateAd);                  // Edit ad (admin or owner)
  app.delete('/api/ads/:id', requireAuth, adsRoutes.deleteAd);               // Delete ad (admin or owner)
  app.post('/api/ads/approve/:id', requireAuth, adsRoutes.approveAd);        // Approve ad (admin only)
  app.post('/api/ads/reject/:id', requireAuth, adsRoutes.rejectAd);          // Reject ad (admin only)
  app.get('/api/ads/active', adsRoutes.getActiveAds);                        // Get active ads for dashboard
  app.post('/api/ads/impression', adsRoutes.trackImpression);                // Track impressions
  app.post('/api/ads/click', adsRoutes.trackClick);                          // Track clicks
  app.get('/api/ads/pricing-config', requireAuth, adsRoutes.getPricingConfig);    // Get pricing config (admin)
  app.put('/api/ads/pricing-config/:id', requireAuth, adsRoutes.updatePricingConfig); // Update pricing (admin)
  app.delete('/api/ads/pricing-config/:id', requireAuth, adsRoutes.deletePricingConfig); // Delete pricing (admin)
  app.post('/api/ads/calculate-price', adsRoutes.calculatePrice);            // Calculate ad price

  // Banner Payment Routes
  app.post('/api/ads/banner/create-with-payment', requireAuth, bannerPaymentRoutes.createBannerWithPayment);
  app.post('/api/ads/banner/confirm-payment', requireAuth, bannerPaymentRoutes.confirmBannerPayment);
  app.post('/api/ads/banner/confirm-paypal-payment', bannerPaymentRoutes.confirmPayPalBannerPayment);
  app.get('/api/ads/banner/payment-success', bannerPaymentRoutes.handlePaymentSuccess);
  app.delete('/api/ads/banner/:bannerId', requireAuth, bannerPaymentRoutes.deleteBannerAd);
  app.put('/api/ads/banner/:bannerId', requireAuth, bannerPaymentRoutes.updateBannerAd);

  // Hero Sections Routes - Admin management and public display
  app.get('/api/hero-sections/manage', requireAuth, heroSectionRoutes.getManageHeroSections);   // Get all hero sections (admin only)
  app.get('/api/hero-sections/my-hero-sections', requireAuth, heroSectionRoutes.getMyHeroSections);  // Get current user's hero sections
  app.post('/api/hero-sections/create', requireAuth, heroSectionRoutes.createHeroSection);     // Create hero section (admin only)
  app.put('/api/hero-sections/:id', requireAuth, heroSectionRoutes.updateHeroSection);        // Update hero section
  app.delete('/api/hero-sections/:id', requireAuth, heroSectionRoutes.deleteHeroSection);     // Delete hero section
  app.put('/api/hero-sections/:id/status', requireAuth, heroSectionRoutes.updateHeroSectionStatus); // Update hero section status (admin only)
  app.get('/api/hero-sections/active', heroSectionRoutes.getActiveHeroSections);              // Get active hero sections for display
  app.post('/api/hero-sections/impression', heroSectionRoutes.trackImpression);               // Track hero section impressions
  app.post('/api/hero-sections/click', heroSectionRoutes.trackClick);                         // Track hero section clicks

  // Freelancer Projects Routes - Secured with role-based authorization
  app.get('/api/freelancer/projects/my', requireFreelancerRole, freelancerProjectRoutes.getMyProjects);         // Get freelancer's projects
  app.get('/api/freelancer/projects/:id', requireFreelancerRole, freelancerProjectRoutes.getProject);           // Get specific project details
  app.post('/api/freelancer/projects', requireFreelancerRole, freelancerProjectRoutes.createProject);           // Create new project
  app.put('/api/freelancer/projects/:id', requireFreelancerRole, freelancerProjectRoutes.updateProject);        // Update project
  app.delete('/api/freelancer/projects/:id', requireFreelancerRole, freelancerProjectRoutes.deleteProject);     // Delete project
  app.post('/api/freelancer/projects/:id/milestones', requireFreelancerRole, freelancerProjectRoutes.addMilestone); // Add milestone to project
  
  // Freelancer stats endpoint
  app.get('/api/freelancer/stats', requireAuth, requireFreelancerRole, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
      }

      // Calculate freelancer stats
      const userProjects = await db
        .select()
        .from(projects)
        .where(eq(projects.freelancerId, userId));

      const completedProjects = userProjects.filter(p => p.status === 'completed');
      const averageRating = completedProjects.length > 0 
        ? completedProjects.reduce((sum, p) => sum + (p.feedbackRating ?? 0), 0) / completedProjects.length 
        : 0;

      const stats = {
        averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
        totalReviews: completedProjects.filter(p => (p.feedbackRating ?? 0) > 0).length
      };

      res.json(stats);
    } catch (error: any) {
      console.error('Error fetching freelancer stats:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch stats' });
    }
  });

  // Profile Statistics Endpoints - views, likes, follows
  
  // Get all freelancers - supports filtering, sorting, and pagination
  app.get('/api/freelancers', async (req: Request, res: Response) => {
    try {
      const { sort = 'rating', page = 1, limit = 12 } = req.query;

      const freelancers = await db
        .select()
        .from(profiles)
        .where(eq(profiles.role, 'freelancer'))
        .orderBy(desc(profiles.createdAt))
        .limit(Number(limit))
        .offset((Number(page) - 1) * Number(limit));

      // Get portfolio stats for each freelancer
      const portfolioStats = await db
        .select({
          userId: works.userId,
          worksCount: count(works.id),
          totalLikes: sum(works.likesCount),
        })
        .from(works)
        .where(inArray(works.userId, freelancers.map(f => f.userId)))
        .groupBy(works.userId);

      const portfolioStatsMap = portfolioStats.reduce((acc, stat) => {
        acc[stat.userId] = {
          worksCount: Number(stat.worksCount) || 0,
          totalLikes: Number(stat.totalLikes) || 0,
        };
        return acc;
      }, {} as Record<string, { worksCount: number; totalLikes: number }>);

      const transformedFreelancers = freelancers.map(f => ({
        id: f.userId,
        name: f.name || '',
        displayName: f.displayName || f.name || '',
        avatarUrl: f.avatarUrl,
        coverImageUrl: f.coverImageUrl,
        bio: f.bio,
        title: f.professionalTitle,
        skills: f.skills || [],
        hourlyRate: f.hourlyRate ? Number(f.hourlyRate) : null,
        location: f.location,
        rating: f.averageRating ? Number(f.averageRating) : 0,
        reviewCount: f.clientReviews || 0,
        completedProjects: f.completedProjects || 0,
        isOnline: f.isOnline || false,
        profileViews: f.profileViews || 0,
        joinedAt: f.createdAt?.toISOString() || new Date().toISOString(),
        verificationBadge: f.verificationBadge,
        responseTime: f.responseTime,
        workAvailability: f.workAvailability,
        likesCount: (portfolioStatsMap[f.userId]?.totalLikes || 0) + (f.likesCount || 0),
        worksShared: portfolioStatsMap[f.userId]?.worksCount || 0,
      }));

      res.json({ 
        success: true, 
        availability: availabilityData,
        teachingSubjects: profile[0].teachingSubjects || []
      });
    } catch (error: any) {
      console.error('Get teacher availability settings error:', error);
      res.status(500).json({ success: false, error: "Failed to get availability settings" });
    }
  });

  // Save teacher availability settings (complete form)
  app.post("/api/teacher/availability/:userId", requireAuth, async (req, res) => {
    try {
      const { userId } = req.params;
      const availabilityData = req.body;

      // Validate the data structure
      if (!availabilityData.timezone || !availabilityData.weeklyAvailability || 
          !availabilityData.startTime || !availabilityData.endTime) {
        return res.status(400).json({ 
          success: false, 
          error: 'Missing required availability data' 
        });
      }

      // Extract teachingSubjects if provided (separate from availability settings)
      const { teachingSubjects, ...availabilityOnly } = availabilityData;
      
      // Update the profile with the availability settings and teaching subjects
      const updateData: any = { 
        availabilitySettings: JSON.stringify(availabilityOnly),
        updatedAt: new Date()
      };
      
      // Only update teachingSubjects if provided
      if (teachingSubjects && Array.isArray(teachingSubjects)) {
        updateData.teachingSubjects = teachingSubjects;
      }
      
      await db.update(profiles)
        .set(updateData)
        .where(eq(profiles.userId, userId));

