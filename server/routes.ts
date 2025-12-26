import path from 'path';
import fs from 'fs';
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
export const getEmailTemplate = (type: 'verification' | 'welcome' | 'password_reset' | 'teacher-verification' | 'password_reset_whatsapp' | 'password_changed_confirmation_whatsapp' | 'phone_linking_verification', data: any) => {
  const whiteLogoUrl = process.env.EDUFILIOVA_WHITE_LOGO_URL || 'https://res.cloudinary.com/dl2lomrhp/image/upload/v1763935567/edufiliova/edufiliova-white-logo.png';
  const baseUrl = process.env.REPLIT_DEV_DOMAIN 
    ? `https://${process.env.REPLIT_DEV_DOMAIN}`
    : process.env.BASE_URL || process.env.APP_URL || 'https://edufiliova.com';
  const currentYear = new Date().getFullYear();

  const cleanReplace = (html: string, key: string, value: any) => {
    const val = String(value);
    const fuzzyRegex = new RegExp('\\{\\{[^{}]*?' + key + '[^{}]*?\\}\\}', 'g');
    html = html.replace(fuzzyRegex, val);
    const fuzzySingleRegex = new RegExp('\\{[^{}]*?' + key + '[^{}]*?\\}', 'g');
    html = html.replace(fuzzySingleRegex, val);
    const fallbackRegex = new RegExp('<span[^>]*>' + key + '<\\/span>', 'g');
    return html.replace(fallbackRegex, val);
  };
  
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

                                case 'password_reset_whatsapp':
      const imageAssets = [
        'db561a55b2cf0bc6e877bb934b39b700_1766506747370.png',
        '41506b29d7f0bbde9fcb0d4afb720c70_1766506747366.png',
        '83faf7f361d9ba8dfdc904427b5b6423_1766506747364.png',
        '3d94f798ad2bd582f8c3afe175798088_1766506747360.png',
        'afa2a8b912b8da2c69e49d9de4a30768_1766506747368.png',
        '9f7291948d8486bdd26690d0c32796e0_1766506747363.png'
      ];
      
      let rendered = data.htmlContent;
      
      // Ultra-aggressive placeholder cleanup
      

      rendered = cleanReplace(rendered, 'fullName', data.fullName || 'User');
      rendered = cleanReplace(rendered, 'code', data.code);
      rendered = cleanReplace(rendered, 'expiresIn', data.expiresIn || '10');
      
      return {
        html: rendered,
        attachments: imageAssets.map(img => ({
          filename: img,
          path: path.join(process.cwd(), 'attached_assets', img),
          cid: img.split('_')[0] + '.png'
        }))
      };

        case 'password_changed_confirmation_whatsapp':
      const confirmImageAssets = [
        'db561a55b2cf0bc6e877bb934b39b700_1766506747370.png',
        '41506b29d7f0bbde9fcb0d4afb720c70_1766506747366.png',
        '83faf7f361d9ba8dfdc904427b5b6423_1766506747364.png',
        '230f9575641a060a9b3772a9085c3203_1766745461892.png',
        '3d94f798ad2bd582f8c3afe175798088_1766506747360.png',
        '9f7291948d8486bdd26690d0c32796e0_1766506747363.png'
      ];
      
      let confirmRendered = data.htmlContent;
      // Handle dynamics
      

      confirmRendered = cleanReplace(confirmRendered, 'fullName', data.fullName || 'User');
      
      return {
        html: confirmRendered,
        attachments: confirmImageAssets.map(img => ({
          filename: img,
          path: path.join(process.cwd(), 'attached_assets', img),
          cid: img.split('_')[0] + '.png'
        }))
      };

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

export const sendEmail = async (to: string, subject: string, html: any, fromAddress = 'verify@edufiliova.com') => {
  try {
    const isObject = typeof html === 'object' && html !== null && !Array.isArray(html);
    const actualHtml = isObject ? html.html : html;
    const attachments = isObject ? (html.attachments || []) : [];

    // Extract verification code safely
    let verificationCode = 'Unknown';
    if (typeof actualHtml === 'string') {
      const codeMatch = actualHtml.match(/<div class="code">(\d+)<\/div>/) || 
                        actualHtml.match(/{{code}}/) || 
                        actualHtml.match(/>(\d{6})</);
      verificationCode = codeMatch ? (codeMatch[1] || codeMatch[0]) : 'Unknown';
    }
    
    console.log('📧 Subject:', subject);
    
    try {
      const transporter = await createEmailTransporter(fromAddress);
      const mailOptions = {
        from: `"EduFiliova" <${fromAddress}>`,
        to,
        subject,
        html: actualHtml,
        attachments: attachments
      };
      const info = await transporter.sendMail(mailOptions);
      return { success: true, messageId: info.messageId };
    } catch (smtpError) {
      console.error('❌ Email sending failed:', smtpError);
      return { success: false, error: 'Failed to send email' };
    }
  } catch (error) {
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

      res.json({ success: true,
        success: true,
        data: transformedFreelancers,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          hasMore: freelancers.length === Number(limit)
        }
      });
    } catch (error: any) {
      console.error('Error fetching freelancers:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch freelancers' });
    }
  });
  app.get('/api/freelancers/:id/stats', async (req: Request, res: Response) => {
    try {
      const freelancerId = req.params.id; // This is the user ID
      const viewerUserId = (req as any).user?.id;
      
      // Look up the profile ID from the user ID
      const profile = await db.select({ id: profiles.id })
        .from(profiles)
        .where(eq(profiles.userId, freelancerId))
        .limit(1);
      
      if (profile.length === 0) {
        return res.status(404).json({ success: false, error: 'Profile not found' });
      }
      
      const profileId = profile[0].id;
      const stats = await storage.getProfileStats(profileId, viewerUserId);
      res.json(stats);
    } catch (error: any) {
      console.error('Error fetching profile stats:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch profile stats' });
    }
  });

  // Get freelancer profile
  app.get('/api/freelancers/:id/profile', async (req: Request, res: Response) => {
    try {
      const freelancerId = req.params.id; // This is the user ID
      
      // Fetch the complete profile data
      const profileData = await db
        .select()
        .from(profiles)
        .where(eq(profiles.userId, freelancerId))
        .limit(1);
      
      if (profileData.length === 0) {
        return res.status(404).json({ success: false, error: 'Freelancer profile not found' });
      }
      
      const profile = profileData[0];
      
      // Return the profile data in the format expected by the frontend
      res.json({ success: true,
        success: true,
        data: {
          id: profile.id,
          userId: profile.userId,
          name: profile.name || '',
          displayName: profile.displayName || profile.name || '',
          professionalTitle: profile.professionalTitle || '',
          tagline: profile.tagline || '',
          email: profile.email || '',
          contactEmail: profile.contactEmail || profile.email || '',
          avatarUrl: profile.avatarUrl,
          coverImageUrl: profile.coverImageUrl,
          bio: profile.bio,
          professionalStatement: profile.professionalStatement,
          location: profile.location,
          country: profile.country,
          hourlyRate: profile.hourlyRate,
          experienceYears: profile.experienceYears,
          skills: profile.skills,
          languages: profile.languages,
          education: profile.education,
          certifications: profile.certifications,
          portfolioUrl: profile.portfolioUrl,
          websiteUrl: profile.websiteUrl,
          linkedinUrl: profile.linkedinUrl,
          twitterUrl: profile.twitterUrl,
          instagramUrl: profile.instagramUrl,
          behanceUrl: profile.behanceUrl,
          dribbbleUrl: profile.dribbbleUrl,
          githubUrl: profile.githubUrl,
          availability: profile.availability,
          role: profile.role,
          approvalStatus: profile.approvalStatus,
          qualifications: profile.qualifications,
          experience: profile.experience,
          availableHours: profile.availableHours,
          verificationBadge: profile.verificationBadge,
          verified: profile.verified,
          verificationBadges: profile.verificationBadges,
          profileViews: profile.profileViews,
          likesCount: profile.likesCount,
          followersCount: profile.followersCount,
          completedProjects: profile.completedProjects,
          reviewCount: profile.reviewCount || profile.clientReviews,
          rating: profile.rating || profile.averageRating,
          responseTime: profile.responseTime,
          workAvailability: profile.workAvailability,
          yearsOfExperience: profile.yearsOfExperience || profile.experienceYears,
          phoneNumber: profile.phoneNumber,
          socialLinks: profile.socialLinks,
          joinedAt: profile.createdAt
        }
      });
    } catch (error: any) {
      console.error('Error fetching freelancer profile:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch freelancer profile' });
    }
  });

  // Get freelancer portfolio works
  app.get('/api/freelancers/:id/portfolio', async (req: Request, res: Response) => {
    try {
      const freelancerId = req.params.id; // This is the user ID
      
      // First get the profile to verify the freelancer exists
      const profileData = await db
        .select({ id: profiles.id })
        .from(profiles)
        .where(eq(profiles.userId, freelancerId))
        .limit(1);
      
      if (profileData.length === 0) {
        return res.status(404).json({ success: false, error: 'Freelancer not found' });
      }
      
      // Fetch portfolio works for this freelancer
      const portfolioWorks = await db
        .select()
        .from(works)
        .where(eq(works.userId, freelancerId))
        .orderBy(desc(works.createdAt));
      
      // Fetch media for each work
      const worksWithMedia = await Promise.all(
        portfolioWorks.map(async (work) => {
          const media = await db
            .select()
            .from(workMedia)
            .where(eq(workMedia.workId, work.id))
            .orderBy(asc(workMedia.sortOrder));
          
          return {
            ...work,
            media
          };
        })
      );
      
      res.json({ success: true,
        success: true,
        data: worksWithMedia
      });
    } catch (error: any) {
      console.error('Error fetching freelancer portfolio:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch portfolio' });
    }
  });

  app.post('/api/freelancers/:id/views', async (req: Request, res: Response) => {
    try {
      const freelancerId = req.params.id; // This is the user ID
      const viewerUserId = (req as any).user?.id;
      const { visitorId, sessionId, ipHash, uaHash, referer } = req.body;
      
      // Look up the profile ID from the user ID
      const profile = await db.select({ id: profiles.id })
        .from(profiles)
        .where(eq(profiles.userId, freelancerId))
        .limit(1);
      
      if (profile.length === 0) {
        return res.status(404).json({ success: false, error: 'Profile not found' });
      }
      
      const profileId = profile[0].id;
      
      const recorded = await storage.recordProfileView(profileId, {
        viewerUserId,
        visitorId,
        sessionId,
        ipHash,
        uaHash,
        referer
      });
      
      res.json({ success: true, recorded });
    } catch (error: any) {
      console.error('Error recording profile view:', error);
      res.status(500).json({ success: false, error: 'Failed to record view' });
    }
  });

  app.post('/api/freelancers/:id/likes', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const freelancerId = req.params.id; // This is the user ID
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Authentication required to like profiles' });
      }
      
      // Look up the profile ID from the user ID
      const profile = await db.select({ id: profiles.id })
        .from(profiles)
        .where(eq(profiles.userId, freelancerId))
        .limit(1);
      
      if (profile.length === 0) {
        return res.status(404).json({ success: false, error: 'Profile not found' });
      }
      
      const profileId = profile[0].id;
      const result = await storage.toggleProfileLike(profileId, userId);
      res.json({ success: true, ...result });
    } catch (error: any) {
      console.error('Error toggling profile like:', error);
      res.status(500).json({ success: false, error: 'Failed to toggle like' });
    }
  });

  app.post('/api/freelancers/:id/follows', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const freelancerId = req.params.id; // This is the user ID
      const followerUserId = req.user?.id;
      
      if (!followerUserId) {
        return res.status(401).json({ success: false, error: 'Authentication required to follow profiles' });
      }
      
      // Look up the profile ID from the user ID
      const profile = await db.select({ id: profiles.id })
        .from(profiles)
        .where(eq(profiles.userId, freelancerId))
        .limit(1);
      
      if (profile.length === 0) {
        return res.status(404).json({ success: false, error: 'Profile not found' });
      }
      
      const profileId = profile[0].id;
      const result = await storage.toggleProfileFollow(profileId, followerUserId);
      res.json({ success: true, isFollowing: result.following, followersCount: result.followersCount });
    } catch (error: any) {
      console.error('Error toggling profile follow:', error);
      res.status(500).json({ success: false, error: 'Failed to toggle follow' });
    }
  });

  // Comprehensive health check endpoint
  app.get("/api/health", async (_req, res) => {
    try {
      const startTime = Date.now();
      
      // Database connectivity check
      await db.select().from(users).limit(1);
      
      // Check if countries are properly seeded
      const countriesCount = await db.select({ count: count() }).from(countries);
      const isCountriesHealthy = countriesCount[0].count >= 190; // Should have ~199 countries
      
      // Check if grade systems are properly seeded
      const gradeSystemsCount = await db.select({ count: count() }).from(gradeSystems);
      const isGradeSystemsHealthy = gradeSystemsCount[0].count >= 2000; // Should have ~2987 grade systems
      
      // Check verification codes cleanup
      const expiredCodesCount = await db
        .select({ count: count() })
        .from(verificationCodes)
        .where(lt(verificationCodes.expiresAt, new Date()));
      
      const responseTime = Date.now() - startTime;
      
      const healthStatus = {
        status: "healthy",
        timestamp: new Date().toISOString(),
        responseTime: `${responseTime}ms`,
        database: {
          connected: true,
          countries: {
            count: countriesCount[0].count,
            healthy: isCountriesHealthy
          },
          gradeSystems: {
            count: gradeSystemsCount[0].count,
            healthy: isGradeSystemsHealthy
          },
          verificationCodes: {
            expiredCount: expiredCodesCount[0].count,
            needsCleanup: expiredCodesCount[0].count > 100
          }
        },
        services: {
          emailService: "configured",
          smsService: process.env.VONAGE_API_KEY ? "configured" : "missing",
          stripeService: process.env.STRIPE_SECRET_KEY ? "configured" : "missing"
        },
        loginSystem: {
          status: isCountriesHealthy && isGradeSystemsHealthy ? "operational" : "degraded",
          countriesAvailable: isCountriesHealthy,
          gradeSystemsAvailable: isGradeSystemsHealthy
        }
      };
      
      const statusCode = (isCountriesHealthy && isGradeSystemsHealthy) ? 200 : 206;
      res.status(statusCode).json(healthStatus);
      
    } catch (error: any) {
      res.status(503).json({ 
        status: "unhealthy", 
        timestamp: new Date().toISOString(),
        database: "disconnected",
        error: error instanceof Error ? error.message : 'Unknown error',
        loginSystem: {
          status: "unavailable"
        }
      });
    }
  });

  // Countries API with auto-recovery
  app.get("/api/countries", async (_req, res) => {
    try {
      const countriesData = await db.select().from(countries).orderBy(countries.name);
      
      // Auto-recovery: If countries data is missing or corrupted, re-seed
      if (countriesData.length < 190) {
        // Countries data incomplete - triggering auto-recovery
        await seedCountries();
        const reseededCountries = await db.select().from(countries).orderBy(countries.name);
        return res.json({ success: true, data: reseededCountries, recovered: true });
      }
      
      res.json({ success: true, data: countriesData });
    } catch (error: any) {
      console.error('Countries fetch error:', error);
      
      // Try to recover by reseeding
      try {
        // Attempting database recovery
        await seedCountries();
        const recoveredCountries = await db.select().from(countries).orderBy(countries.name);
        return res.json({ success: true, data: recoveredCountries, recovered: true });
      } catch (recoveryError) {
        // Database recovery failed
        // Fallback to static countries data when database fails
        console.log('🔄 Using fallback countries data due to database connectivity issues');
        const fallbackCountries = WORLD_COUNTRIES.map((country, index) => ({
          id: index + 1,
          code: country.code,
          name: country.name,
          gradeSystemType: country.gradeSystemType,
          createdAt: new Date()
        }));
        res.json({ success: true, data: fallbackCountries, fallback: true });
      }
    }
  });

  // Location detection API - returns user's detected location
  app.get("/api/location/detect", (req, res) => {
    try {
      const location = req.userLocation;
      
      if (!location) {
        return res.json({ success: true,
          country: 'Unknown',
          city: 'Unknown',
          region: 'Unknown'
        });
      }

      res.json({ success: true,
        country: location.country || 'Unknown',
        city: location.city || 'Unknown',
        region: location.region || 'Unknown',
        timezone: location.timezone,
        latitude: location.latitude,
        longitude: location.longitude
      });
    } catch (error: any) {
      console.error('Location detection error:', error);
      res.json({ success: true,
        country: 'Unknown',
        city: 'Unknown',
        region: 'Unknown'
      });
    }
  });

  // Cities API by country
  app.get("/api/cities/:countryCode", async (req, res) => {
    try {
      const { countryCode } = req.params;
      
      // Handle country code mapping for cities
      // Some countries have different codes in the countries table vs cities table
      const countryCodeMapping: { [key: string]: string } = {
        'UK': 'GB',  // United Kingdom maps to Great Britain in cities
        // Add more mappings as needed
      };
      
      const actualCountryCode = countryCodeMapping[countryCode] || countryCode;
      
      const citiesData = await db
        .select({
          id: sql`cities.id`,
          name: sql`cities.name`,
          countryCode: sql`cities.country_code`,
          isMajor: sql`cities.is_major`
        })
        .from(sql`cities`)
        .where(sql`cities.country_code = ${actualCountryCode}`)
        .orderBy(sql`cities.name`);
      
      res.json({ success: true, data: citiesData });
    } catch (error: any) {
      console.error('Cities fetch error:', error);
      // Return empty array if no cities found for this country
      res.json({ success: true, data: [] });
    }
  });

  // Grade systems API with auto-recovery
  app.get("/api/grade-systems/:countryId", async (req, res) => {
    try {
      const countryId = parseInt(req.params.countryId);
      const gradeSystemsData = await db
        .select()
        .from(gradeSystems)
        .where(eq(gradeSystems.countryId, countryId))
        .orderBy(gradeSystems.gradeNumber);
      
      // Auto-recovery: If grade systems data is missing for this country, re-seed
      if (gradeSystemsData.length === 0) {
        console.log(`⚠️ Grade systems data missing for country ${countryId}, triggering auto-recovery...`);
        await seedGradeSystems();
        const reseededGrades = await db
          .select()
          .from(gradeSystems)
          .where(eq(gradeSystems.countryId, countryId))
          .orderBy(gradeSystems.gradeNumber);
        console.log('✅ Grade systems auto-recovery completed');
        return res.json({ success: true, data: reseededGrades, recovered: true });
      }
      
      res.json({ success: true, data: gradeSystemsData });
    } catch (error: any) {
      console.error('Grade systems fetch error:', error);
      
      // Try to recover by reseeding
      try {
        console.log('🔄 Attempting grade systems recovery...');
        await seedGradeSystems();
        const recoveredGrades = await db
          .select()
          .from(gradeSystems)
          .where(eq(gradeSystems.countryId, parseInt(req.params.countryId)))
          .orderBy(gradeSystems.gradeNumber);
        console.log('✅ Grade systems recovery successful');
        return res.json({ success: true, data: recoveredGrades, recovered: true });
      } catch (recoveryError) {
        console.error('❌ Grade systems recovery failed:', recoveryError);
        // Fallback to default grade system when database fails
        console.log('🔄 Using fallback grade systems data due to database connectivity issues');
        const fallbackGrades = [
          { id: 1, countryId: parseInt(req.params.countryId), gradeNumber: 1, displayName: "Grade 1", educationLevel: "Primary", ageRange: "6-7", createdAt: new Date() },
          { id: 2, countryId: parseInt(req.params.countryId), gradeNumber: 2, displayName: "Grade 2", educationLevel: "Primary", ageRange: "7-8", createdAt: new Date() },
          { id: 3, countryId: parseInt(req.params.countryId), gradeNumber: 3, displayName: "Grade 3", educationLevel: "Primary", ageRange: "8-9", createdAt: new Date() },
          { id: 4, countryId: parseInt(req.params.countryId), gradeNumber: 4, displayName: "Grade 4", educationLevel: "Primary", ageRange: "9-10", createdAt: new Date() },
          { id: 5, countryId: parseInt(req.params.countryId), gradeNumber: 5, displayName: "Grade 5", educationLevel: "Primary", ageRange: "10-11", createdAt: new Date() },
          { id: 6, countryId: parseInt(req.params.countryId), gradeNumber: 6, displayName: "Grade 6", educationLevel: "Primary", ageRange: "11-12", createdAt: new Date() },
          { id: 7, countryId: parseInt(req.params.countryId), gradeNumber: 7, displayName: "Grade 7", educationLevel: "Secondary", ageRange: "12-13", createdAt: new Date() },
          { id: 8, countryId: parseInt(req.params.countryId), gradeNumber: 8, displayName: "Grade 8", educationLevel: "Secondary", ageRange: "13-14", createdAt: new Date() },
          { id: 9, countryId: parseInt(req.params.countryId), gradeNumber: 9, displayName: "Grade 9", educationLevel: "Secondary", ageRange: "14-15", createdAt: new Date() },
          { id: 10, countryId: parseInt(req.params.countryId), gradeNumber: 10, displayName: "Grade 10", educationLevel: "Secondary", ageRange: "15-16", createdAt: new Date() },
          { id: 11, countryId: parseInt(req.params.countryId), gradeNumber: 11, displayName: "Grade 11", educationLevel: "Secondary", ageRange: "16-17", createdAt: new Date() },
          { id: 12, countryId: parseInt(req.params.countryId), gradeNumber: 12, displayName: "Grade 12", educationLevel: "Secondary", ageRange: "17-18", createdAt: new Date() },
          { id: 13, countryId: parseInt(req.params.countryId), gradeNumber: 13, displayName: "College", educationLevel: "College", ageRange: "18+", createdAt: new Date() },
          { id: 14, countryId: parseInt(req.params.countryId), gradeNumber: 14, displayName: "University", educationLevel: "University", ageRange: "18+", createdAt: new Date() },
          { id: 15, countryId: parseInt(req.params.countryId), gradeNumber: 15, displayName: "Other", educationLevel: "Other", ageRange: "Any", createdAt: new Date() }
        ];
        res.json({ success: true, data: fallbackGrades, fallback: true });
      }
    }
  });

  // Get current user profile (for refreshing auth state)
  app.get("/api/auth/profile", async (req, res) => {
    try {
      const authHeader = req.headers.authorization as string;
      const user = await getUserFromSession(authHeader);
      
      if (!user) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
      }

      // Get fresh profile data from database
      const profile = await db.select()
        .from(profiles)
        .where(eq(profiles.userId, user.id))
        .limit(1);

      if (profile.length === 0) {
        return res.status(404).json({ success: false, error: 'Profile not found' });
      }

      // Fetch application status for teachers and freelancers
      let teacherApplicationStatus = null;
      let freelancerApplicationStatus = null;
      
      if (profile[0].role === 'teacher') {
        const teacherApp = await db.select({
          id: teacherApplications.id,
          status: teacherApplications.status,
          submittedAt: teacherApplications.createdAt
        })
          .from(teacherApplications)
          .where(eq(teacherApplications.userId, user.id))
          .limit(1);
        
        if (teacherApp.length > 0) {
          teacherApplicationStatus = {
            id: teacherApp[0].id,
            status: teacherApp[0].status,
            submittedAt: teacherApp[0].submittedAt
          };
        }
      } else if (profile[0].role === 'freelancer') {
        const freelancerApp = await db.select({
          id: freelancerApplications.id,
          status: freelancerApplications.status,
          createdAt: freelancerApplications.createdAt,
          approvedAt: freelancerApplications.approvedAt
        })
          .from(freelancerApplications)
          .where(eq(freelancerApplications.userId, user.id))
          .limit(1);
        
        if (freelancerApp.length > 0) {
          freelancerApplicationStatus = {
            id: freelancerApp[0].id,
            status: freelancerApp[0].status,
            createdAt: freelancerApp[0].createdAt,
            approvedAt: freelancerApp[0].approvedAt
          };
        }
      }

      res.json({ success: true,
        success: true,
        user: {
          id: user.id,
          userId: user.userId,
          email: user.email
        },
        profile: profile[0],
        teacherApplicationStatus,
        freelancerApplicationStatus
      });

    } catch (error: any) {
      console.error('Get profile error:', error);
      res.status(500).json({ success: false, error: 'Failed to get profile' });
    }
  });

  // Get Teacher Profile with Application Data
  app.get("/api/teacher/profile", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      if (req.user?.role !== 'teacher') {
        return res.status(403).json({ success: false, error: 'Access denied. Teacher access required.' });
      }

      const userUuid = req.user.id; // This is the UUID from the auth middleware
      const userTextId = req.user.userId; // This is the text ID like "T2509P002"

      console.log('🔍 Teacher profile request - userUuid:', userUuid, 'userTextId:', userTextId);

      // Get basic profile data using UUID
      const profile = await db.select()
        .from(profiles)
        .where(eq(profiles.userId, userUuid))
        .limit(1);

      if (profile.length === 0) {
        console.log('❌ Profile not found for UUID:', userUuid);
        return res.status(404).json({ success: false, error: 'Profile not found' });
      }

      // Get user email using UUID
      const user = await db.select()
        .from(users)
        .where(eq(users.id, userUuid))
        .limit(1);

      console.log('✅ Found basic data - profile:', !!profile[0], 'user:', !!user[0]);

      // Create a basic teacher profile with essential data
      const teacherProfile = {
        // Basic profile data
        id: profile[0].id,
        userId: profile[0].userId,
        name: profile[0].name || 'Teacher Name',
        email: user[0]?.email || profile[0].email || 'teacher@example.com',
        bio: profile[0].bio || '',
        avatarUrl: profile[0].avatarUrl || null,
        country: profile[0].country || '',
        role: profile[0].role,
        
        // Teacher application data from profile
        phoneNumber: profile[0].phoneNumber || null,
        qualifications: profile[0].qualifications || '',
        experience: profile[0].experience || '',
        portfolioLinks: [],
        certifications: [],
        availableHours: profile[0].availableHours || '',
        hourlyRate: profile[0].hourlyRate || '25.00',
        applicationStatus: 'approved'
      };

      console.log('📋 Returning teacher profile:', {
        name: teacherProfile.name,
        email: teacherProfile.email,
        phoneNumber: teacherProfile.phoneNumber,
        hourlyRate: teacherProfile.hourlyRate,
        qualifications: teacherProfile.qualifications,
        experience: teacherProfile.experience,
        availableHours: teacherProfile.availableHours
      });

      res.json({ success: true,
        success: true,
        profile: teacherProfile
      });

    } catch (error: any) {
      console.error('Get teacher profile error:', error);
      res.status(500).json({ success: false, error: 'Failed to get teacher profile' });
    }
  });

  // Update Teacher Profile
  app.put("/api/teacher/profile", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      if (req.user?.role !== 'teacher') {
        return res.status(403).json({ success: false, error: 'Access denied. Teacher access required.' });
      }

      const userUuid = req.user.id;
      const { 
        name, 
        bio, 
        phoneNumber, 
        hourlyRate, 
        availableHours,
        qualifications,
        experience,
        portfolioLinks,
        certifications,
        avatarUrl 
      } = req.body;

      console.log('🔄 Updating teacher profile for:', userUuid, 'with data:', {
        name, bio, phoneNumber, hourlyRate, availableHours
      });

      // Update profile table (this should always work)
      const profileUpdates: any = { updatedAt: new Date() };
      if (name !== undefined && name.trim()) profileUpdates.name = name.trim();
      if (bio !== undefined) profileUpdates.bio = bio;
      if (avatarUrl !== undefined) profileUpdates.avatarUrl = avatarUrl;
      if (qualifications !== undefined) profileUpdates.qualifications = qualifications;
      if (experience !== undefined) profileUpdates.experience = experience;
      if (availableHours !== undefined) profileUpdates.availableHours = availableHours;
      if (hourlyRate !== undefined) profileUpdates.hourlyRate = hourlyRate;
      if (phoneNumber !== undefined) profileUpdates.phoneNumber = phoneNumber;

      if (Object.keys(profileUpdates).length > 1) { // More than just updatedAt
        await db
          .update(profiles)
          .set(profileUpdates)
          .where(eq(profiles.userId, userUuid));
        console.log('✅ Profile table updated successfully');
      }

      // Try to update teacher application table with only safe columns
      try {
        const teacherApp = await db.select({ id: teacherApplications.id })
          .from(teacherApplications)
          .where(eq(teacherApplications.userId, userUuid))
          .limit(1);

        if (teacherApp.length > 0) {
          const safeAppUpdates: any = { updatedAt: new Date() };
          
          // Only update fields that we know exist
          if (phoneNumber !== undefined) safeAppUpdates.phoneNumber = phoneNumber;
          if (hourlyRate !== undefined) safeAppUpdates.hourlyRate = hourlyRate;
          if (qualifications !== undefined) safeAppUpdates.qualifications = qualifications;
          if (experience !== undefined) safeAppUpdates.experience = experience;
          if (bio !== undefined) safeAppUpdates.bio = bio;

          if (Object.keys(safeAppUpdates).length > 1) {
            await db
              .update(teacherApplications)
              .set(safeAppUpdates)
              .where(eq(teacherApplications.userId, userUuid));
            console.log('✅ Teacher application table updated successfully');
          }
        } else {
          console.log('ℹ️ No teacher application record found, skipping app table update');
        }
      } catch (appError) {
        console.log('⚠️ Could not update teacher application table:', appError.message);
        // Don't fail the entire request if teacher app table update fails
      }

      res.json({ success: true,
        success: true,
        message: 'Teacher profile updated successfully'
      });

    } catch (error: any) {
      console.error('Update teacher profile error:', error);
      res.status(500).json({ success: false, error: 'Failed to update teacher profile' });
    }
  });

  // Freelancer Registration Endpoint
  app.post("/api/freelancer-register", async (req, res) => {
    try {
      const {
        fullName,
        email,
        password,
        phoneNumber,
        skills,
        experience,
        hourlyRate,
        portfolio,
        specializations,
        bio,
        contactType,
        verificationMethod
      } = req.body;

      // Check for existing verification request (don't check users table before verification)
      const existingVerification = await db
        .select()
        .from(verificationCodes)
        .where(eq(verificationCodes.contactInfo, email))
        .limit(1);

      if (existingVerification.length > 0 && !existingVerification[0].isUsed) {
        return res.status(400).json({
          success: false,
          error: "A verification request is already pending for this email. Please check your email or wait a few minutes."
        });
      }

      // Clean up any expired verification codes
      await db.delete(verificationCodes).where(eq(verificationCodes.contactInfo, email));

      // Prepare user data but DON'T create user yet - wait for verification
      const hashedPassword = await bcrypt.hash(password, 12);
      const verificationCode = generateVerificationCode();
      const userIdString = generateUserId();

      // Store ALL registration data in verification codes table temporarily
      await db
        .insert(verificationCodes)
        .values({
          contactInfo: email,
          type: 'email',
          code: verificationCode,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
          userData: { 
            // User data
            userId: userIdString,
            email,
            passwordHash: hashedPassword,
            educationLevel: 'other',
            // Profile data
            fullName,
            age: 25,
            grade: 12,
            country: 'Unknown',
            countryId: null,
            role: 'freelancer',
            bio: bio || '',
            experience: experience || '',
            hourlyRate: hourlyRate || null,
            qualifications: specializations ? specializations.join(', ') : null,
            availableHours: 'Flexible',
            // Additional freelancer data
            skills, 
            portfolio, 
            phoneNumber,
            specializations,
            userType: 'freelancer' 
          }
        });

      // Send verification email
      if (contactType === 'email') {
        try {
          const emailTemplate = getEmailTemplate('verification', {
            name: fullName,
            code: verificationCode,
            expiryMinutes: 15
          });

          const transporter = await createEmailTransporter('verify@edufiliova.com');
          await transporter.sendMail({
            from: '"EduFiliova Freelancer Platform" <verify@edufiliova.com>',
            to: email,
            subject: 'Verify Your Freelancer Account - EduFiliova',
            html: emailTemplate
          });
          console.log('✅ Verification email sent successfully to:', email);
        } catch (emailError) {
          console.error('❌ Failed to send verification email:', {
            error: emailError instanceof Error ? emailError.message : 'Unknown error',
            code: (emailError as any)?.code,
            response: (emailError as any)?.response,
            responseCode: (emailError as any)?.responseCode,
            to: email,
            timestamp: new Date().toISOString()
          });
          
          // Clean up verification code since email failed
          await db
            .delete(verificationCodes)
            .where(eq(verificationCodes.contactInfo, email));

          return res.status(500).json({
            success: false,
            error: 'Failed to send verification email. Please try again.'
          });
        }
      }

      res.status(201).json({
        success: true,
        message: "Verification email sent successfully. Please check your email to complete registration.",
        data: {
          email: email,
          message: "Account will be created after email verification"
        }
      });

    } catch (error: any) {
      console.error('Freelancer registration error:', error);
      res.status(500).json({
        success: false,
        error: 'Registration failed. Please try again.'
      });
    }
  });

  // Resend verification code endpoint
  app.post("/api/auth/resend-verification", async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          error: "Email is required"
        });
      }

      // Find verification code for this email
      const existingCode = await db
        .select()
        .from(verificationCodes)
        .where(eq(verificationCodes.contactInfo, email))
        .orderBy(desc(verificationCodes.createdAt))
        .limit(1);

      if (existingCode.length === 0) {
        return res.status(404).json({
          success: false,
          error: "No verification code found for this email"
        });
      }

      const code = existingCode[0].code;

      // Resend verification email
      try {
        const emailTemplate = getEmailTemplate('verification', {
          name: 'User',
          code: code,
          expiryMinutes: 15
        });

        const transporter = await createEmailTransporter('verify@edufiliova.com');
        await transporter.sendMail({
          from: '"EduFiliova Platform" <verify@edufiliova.com>',
          to: email,
          subject: 'Verification Code - EduFiliova',
          html: emailTemplate
        });

        console.log('✅ Verification email resent successfully to:', email);

        res.status(200).json({
          success: true,
          message: "Verification code resent successfully"
        });

      } catch (emailError) {
        console.error('❌ Failed to resend verification email:', {
          error: emailError instanceof Error ? emailError.message : 'Unknown error',
          code: (emailError as any)?.code,
          response: (emailError as any)?.response,
          responseCode: (emailError as any)?.responseCode,
          to: email,
          timestamp: new Date().toISOString()
        });

        res.status(500).json({
          success: false,
          error: 'Failed to resend verification email. Please try again.'
        });
      }

    } catch (error: any) {
      console.error('Resend verification error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to resend verification code. Please try again.'
      });
    }
  });

  // Admin Freelancer Management Routes
  app.get("/api/admin/freelancers", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { status, search } = req.query;
      
      console.log('🔍 Freelancer search request:', { status, search });
      
      // Build conditions array
      const conditions = [eq(profiles.role, 'freelancer')];
      
      if (status) {
        conditions.push(eq(profiles.approvalStatus, status as any));
      }

      if (search && typeof search === 'string') {
        const searchPattern = `%${search}%`;
        console.log('🔍 Search pattern:', searchPattern);
        conditions.push(
          or(
            ilike(profiles.name, searchPattern),
            ilike(profiles.displayName, searchPattern),
            ilike(profiles.email, searchPattern)
          )
        );
      }

      const freelancers = await db
        .select({
          id: profiles.id,
          userId: profiles.userId,
          name: profiles.name,
          displayName: profiles.displayName,
          email: profiles.email,
          avatarUrl: profiles.avatarUrl,
          country: profiles.country,
          experience: profiles.experience,
          hourlyRate: profiles.hourlyRate,
          bio: profiles.bio,
          qualifications: profiles.qualifications,
          approvalStatus: profiles.approvalStatus,
          approvedBy: profiles.approvedBy,
          approvedAt: profiles.approvedAt,
          rejectionReason: profiles.rejectionReason,
          adminNotes: profiles.adminNotes,
          likesCount: profiles.likesCount,
          followersCount: profiles.followersCount,
          role: profiles.role,
          createdAt: profiles.createdAt
        })
        .from(profiles)
        .where(and(...conditions))
        .orderBy(profiles.createdAt);

      console.log('🔍 Found freelancers:', freelancers.length);
      console.log('🔍 Freelancer names:', freelancers.map(f => f.name));

      res.json({ success: true,
        success: true,
        data: freelancers
      });
    } catch (error: any) {
      console.error('❌ Error fetching freelancers:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch freelancers'
      });
    }
  });

  app.post("/api/admin/freelancers/:userId/approve", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const { notes } = req.body;
      const adminUserId = req.user?.id;

      // Check if freelancer profile exists and is pending
      const [freelancerProfile] = await db
        .select()
        .from(profiles)
        .where(and(
          eq(profiles.userId, userId),
          eq(profiles.role, 'freelancer')
        ))
        .limit(1);

      if (!freelancerProfile) {
        return res.status(404).json({
          success: false,
          error: 'Freelancer profile not found'
        });
      }

      if (freelancerProfile.approvalStatus === 'approved') {
        return res.json({ success: true,
          success: true,
          message: 'Freelancer already approved'
        });
      }

      // Update approval status
      await db
        .update(profiles)
        .set({
          approvalStatus: 'approved',
          approvedBy: adminUserId,
          approvedAt: new Date(),
          adminNotes: notes || null,
          rejectionReason: null
        })
        .where(eq(profiles.userId, userId));

      // Send approval email notification
      try {
        const emailTemplate = getEmailTemplate('welcome', {
          name: freelancerProfile.name,
          notes: notes || 'Your freelancer application has been approved!'
        });

        const transporter = await createEmailTransporter('support@edufiliova.com');
        await transporter.sendMail({
          from: '"EduFiliova Support" <support@edufiliova.com>',
          to: freelancerProfile.email || '',
          subject: 'Congratulations! Your Freelancer Application Approved - EduFiliova',
          html: emailTemplate
        });
      } catch (emailError) {
        console.error('Failed to send approval email:', emailError);
      }

      res.json({ success: true,
        success: true,
        message: 'Freelancer approved successfully'
      });

    } catch (error: any) {
      console.error('Error approving freelancer:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to approve freelancer'
      });
    }
  });

  app.post("/api/admin/freelancers/:userId/reject", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const { reason, notes } = req.body;
      const adminUserId = req.user?.id;

      if (!reason || reason.trim() === '') {
        return res.status(400).json({
          success: false,
          error: 'Rejection reason is required'
        });
      }

      // Check if freelancer profile exists
      const [freelancerProfile] = await db
        .select()
        .from(profiles)
        .where(and(
          eq(profiles.userId, userId),
          eq(profiles.role, 'freelancer')
        ))
        .limit(1);

      if (!freelancerProfile) {
        return res.status(404).json({
          success: false,
          error: 'Freelancer profile not found'
        });
      }

      if (freelancerProfile.approvalStatus === 'rejected') {
        return res.json({ success: true,
          success: true,
          message: 'Freelancer already rejected'
        });
      }

      // Update rejection status
      await db
        .update(profiles)
        .set({
          approvalStatus: 'rejected',
          approvedBy: adminUserId,
          approvedAt: new Date(),
          rejectionReason: reason,
          adminNotes: notes || null
        })
        .where(eq(profiles.userId, userId));

      // Send rejection email notification
      try {
        const emailTemplate = getEmailTemplate('freelancerRejection', {
          name: freelancerProfile.name,
          reason: reason,
          notes: notes
        });

        const transporter = await createEmailTransporter('support@edufiliova.com');
        await transporter.sendMail({
          from: '"EduFiliova Support" <support@edufiliova.com>',
          to: freelancerProfile.email || '',
          subject: 'Update on Your Freelancer Application - EduFiliova',
          html: emailTemplate
        });
      } catch (emailError) {
        console.error('Failed to send rejection email:', emailError);
      }

      res.json({ success: true,
        success: true,
        message: 'Freelancer rejected successfully'
      });

    } catch (error: any) {
      console.error('Error rejecting freelancer:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to reject freelancer'
      });
    }
  });

  // Featured Users Management (Admin only)
  app.get("/api/admin/featured-users", requireAuth, requireAdmin, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const featuredUsers = await storage.getFeaturedUsers(limit);
      
      res.json({ success: true,
        success: true,
        data: featuredUsers
      });
    } catch (error: any) {
      console.error('Error fetching featured users:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch featured users'
      });
    }
  });

  app.post("/api/admin/users/:userId/toggle-featured", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { userId: textUserId } = req.params;
      const adminUserId = req.user?.id;

      if (!adminUserId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
      }

      // Look up the user's UUID by their text userId
      const user = await db.select({ id: users.id })
        .from(users)
        .where(eq(users.userId, textUserId))
        .limit(1);

      if (user.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      const userUuid = user[0].id;
      const result = await storage.toggleFeaturedStatus(userUuid, adminUserId);
      
      res.json({ success: true,
        success: true,
        data: result,
        message: result.isFeatured ? 'User marked as featured' : 'User removed from featured'
      });
    } catch (error: any) {
      console.error('Error toggling featured status:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to toggle featured status'
      });
    }
  });

  // Public endpoint to get featured creators
  app.get("/api/featured-creators", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const featuredUsers = await storage.getFeaturedUsers(limit);
      
      res.json({ success: true,
        success: true,
        data: featuredUsers
      });
    } catch (error: any) {
      console.error('Error fetching featured creators:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch featured creators'
      });
    }
  });

  // User Registration with Dual Verification
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { name, age, grade, educationLevel, country, email, phone, password, whatsappOptIn } = req.body;

      // Validation
      if (!name || !age || !grade || !country || !email || !password) {
        return res.status(400).json({ success: false, error: "Missing required fields" });
      }

      if (!isValidEmail(email)) {
        return res.status(400).json({ success: false, error: "Invalid email format" });
      }

      if (phone && !isValidPhone(phone)) {
        return res.status(400).json({ success: false, error: "Invalid phone number format" });
      }

      // Check for existing verification request (don't check users table before verification)
      const existingVerification = await db
        .select()
        .from(verificationCodes)
        .where(eq(verificationCodes.contactInfo, email))
        .limit(1);

      if (existingVerification.length > 0 && !existingVerification[0].isUsed) {
        return res.status(400).json({ 
          success: false, 
          error: "A verification request is already pending for this email. Please check your email or wait a few minutes." 
        });
      }

      // Clean up any expired verification codes
      await db.delete(verificationCodes).where(eq(verificationCodes.contactInfo, email));

      // Store registration data temporarily and send verification
      const emailCode = generateVerificationCode();
      const smsCode = phone ? generateVerificationCode() : null;

      const registrationData = {
        name,
        age: parseInt(age),
        grade: parseInt(grade),
        educationLevel: educationLevel || 'grade',
        country,
        email,
        phone: phone || null,
        passwordHash: await bcrypt.hash(password, 10),
        emailCode,
        smsCode,
        emailVerified: false,
        smsVerified: !phone // If no phone, consider SMS verified
      };

      // Determine verification method based on whatsappOptIn
      let emailResult = { success: true, error: undefined as string | undefined };
      let whatsappResult = { success: true, messageId: undefined as string | undefined, error: undefined as string | undefined };
      
      if (whatsappOptIn && phone && smsCode) {
        // WhatsApp opted in: Send ONLY WhatsApp OTP (no email)
        if (isWhatsAppConfigured()) {
          whatsappResult = await sendWhatsAppOTP(phone, smsCode);
          if (whatsappResult.success) {
            console.log('✅ WhatsApp OTP sent successfully to:', phone);
          } else {
            console.error('❌ WhatsApp OTP failed:', whatsappResult.error);
            return res.status(500).json({
              success: false,
              error: "Failed to send WhatsApp verification. Please try again or uncheck WhatsApp option.",
              details: whatsappResult.error
            });
          }
        } else {
          console.error('❌ WhatsApp not configured but user opted in');
          return res.status(500).json({
            success: false,
            error: "WhatsApp verification is not available. Please uncheck the WhatsApp option and try again."
          });
        }
      } else {
        // No WhatsApp opt-in: Send email verification only
        emailResult = await sendEmail(
          email,
          'Verify Your EduFiliova Account',
          getEmailTemplate('verification', { code: emailCode })
        );

        if (!emailResult.success) {
          return res.status(500).json({
            success: false,
            error: "Failed to send verification email. Please try again.",
            details: emailResult.error
          });
        }
      }

      // Clean up any existing verification codes for this email/phone
      await db.delete(verificationCodes).where(eq(verificationCodes.contactInfo, email));
      if (phone) {
        await db.delete(verificationCodes).where(eq(verificationCodes.contactInfo, phone));
      }

      if (whatsappOptIn && phone && whatsappResult.success) {
        // WhatsApp flow: Only store phone verification (email will be auto-verified)
        await db.insert(verificationCodes).values({
          contactInfo: phone,
          type: 'phone',
          code: smsCode,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
          userData: registrationData
        });

        res.json({ success: true,
          success: true,
          message: "WhatsApp verification code sent",
          requiresEmailVerification: false,
          requiresPhoneVerification: true,
          emailSent: false,
          whatsappSent: true
        });
      } else {
        // Email flow: Only store email verification
        await db.insert(verificationCodes).values({
          contactInfo: email,
          type: 'email',
          code: emailCode,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
          userData: registrationData
        });

        res.json({ success: true,
          success: true,
          message: "Email verification code sent",
          requiresEmailVerification: true,
          requiresPhoneVerification: false,
          emailSent: true,
          whatsappSent: false
        });
      }

    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Provide specific error messages for better user experience
      if (error instanceof Error) {
        if (error.message.includes('duplicate key value violates unique constraint')) {
          if (error.message.includes('verification_codes_contact_info_unique')) {
            return res.status(400).json({ 
              success: false, 
              error: "A verification request is already pending for this email. Please check your email or try again in a few minutes." 
            });
          }
          if (error.message.includes('auth_users_email_unique')) {
            return res.status(400).json({ 
              success: false, 
              error: "An account with this email already exists. Please try logging in instead." 
            });
          }
        }
        if (error.message.includes('Connection') || error.message.includes('timeout')) {
          return res.status(503).json({ 
            success: false, 
            error: "Service temporarily unavailable. Please try again in a few minutes." 
          });
        }
      }
      
      res.status(500).json({ success: false, error: "Registration failed. Please try again." });
    }
  });

  // Verify Registration Codes
  app.post("/api/auth/verify-registration", async (req, res) => {
    try {
      const { email, emailCode, smsCode, contactInfo, code, contactType } = req.body;

      let userData: any;
      let verificationRecordId: number;

      // Handle WhatsApp/phone verification (contactType: 'phone')
      if (contactType === 'phone' && contactInfo && code) {
        // Get phone verification record
        const phoneVerification = await db
          .select()
          .from(verificationCodes)
          .where(and(
            eq(verificationCodes.contactInfo, contactInfo),
            eq(verificationCodes.type, 'phone'),
            eq(verificationCodes.isUsed, false)
          ))
          .limit(1);

        if (phoneVerification.length === 0) {
          return res.status(400).json({ success: false, error: "Invalid or expired verification code" });
        }

        const phoneRecord = phoneVerification[0];

        // Check phone code and expiration
        if (phoneRecord.code !== code || new Date() > phoneRecord.expiresAt) {
          return res.status(400).json({ success: false, error: "Invalid or expired verification code" });
        }

        userData = phoneRecord.userData as any;
        verificationRecordId = phoneRecord.id;

        // Mark phone verification as used
        await db
          .update(verificationCodes)
          .set({ isUsed: true })
          .where(eq(verificationCodes.id, phoneRecord.id));

        // Also mark email verification as used (auto-verify email when WhatsApp is verified)
        if (userData.email) {
          await db
            .update(verificationCodes)
            .set({ isUsed: true })
            .where(and(
              eq(verificationCodes.contactInfo, userData.email),
              eq(verificationCodes.type, 'email'),
              eq(verificationCodes.isUsed, false)
            ));
        }
      } 
      // Handle email verification (contactType: 'email' or legacy flow)
      else if ((contactType === 'email' && email && emailCode) || (email && emailCode)) {
        // Get email verification record
        const emailVerification = await db
          .select()
          .from(verificationCodes)
          .where(and(
            eq(verificationCodes.contactInfo, email),
            eq(verificationCodes.type, 'email'),
            eq(verificationCodes.isUsed, false)
          ))
          .limit(1);

        if (emailVerification.length === 0) {
          return res.status(400).json({ success: false, error: "Invalid or expired email verification code" });
        }

        const emailRecord = emailVerification[0];

        // Check email code and expiration
        if (emailRecord.code !== emailCode || new Date() > emailRecord.expiresAt) {
          return res.status(400).json({ success: false, error: "Invalid or expired email verification code" });
        }

        userData = emailRecord.userData as any;
        verificationRecordId = emailRecord.id;

        // Mark email verification as used
        await db
          .update(verificationCodes)
          .set({ isUsed: true })
          .where(eq(verificationCodes.id, emailRecord.id));

        // Check SMS verification if phone was provided and smsCode is given
        if (userData.phone && smsCode) {
          const smsVerification = await db
            .select()
            .from(verificationCodes)
            .where(and(
              eq(verificationCodes.contactInfo, userData.phone),
              eq(verificationCodes.type, 'phone'),
              eq(verificationCodes.isUsed, false)
            ))
            .limit(1);

          if (smsVerification.length === 0 || smsVerification[0].code !== smsCode || new Date() > smsVerification[0].expiresAt) {
            return res.status(400).json({ success: false, error: "Invalid or expired SMS verification code" });
          }

          // Mark SMS verification as used
          await db
            .update(verificationCodes)
            .set({ isUsed: true })
            .where(eq(verificationCodes.id, smsVerification[0].id));
        }
        // Note: If phone was provided but smsCode is missing, we don't block - email verification is sufficient
      } else {
        return res.status(400).json({ success: false, error: "Verification code required" });
      }

      // Check if user already exists (in case verification is retried)
      const existingUser = await db.select().from(users).where(eq(users.email, userData.email)).limit(1);
      if (existingUser.length > 0) {
        return res.status(400).json({ success: false, error: "An account with this email already exists. Please try logging in instead." });
      }

      // Create user account
      const userId = generateUserId();
      
      const newUser = await db.insert(users).values({
        userId,
        email: userData.email,
        passwordHash: userData.passwordHash
      }).returning();

      // Find country ID
      const countryRecord = await db
        .select()
        .from(countries)
        .where(eq(countries.name, userData.country))
        .limit(1);

      // Get detected location from IP
      const detectedLocation = req.userLocation;
      const locationStr = detectedLocation 
        ? `${detectedLocation.city || ''}, ${detectedLocation.country || ''}`.trim() 
        : null;

      // Create profile with location data
      const newProfile = await db.insert(profiles).values({
        userId: newUser[0].id,
        name: userData.name || userData.fullName, // Handle freelancer fullName
        email: userData.email, // Add email to profile
        age: userData.age || 25, // Default age for freelancers
        grade: userData.grade || 12, // Add required grade field with default
        educationLevel: userData.educationLevel || "other", // Default education level
      // Send welcome email with login credentials
      });
      const loginEmail = userData.email;
      const loginPhone = userData.phone || undefined;
      const welcomeHtml = `
        ${getEmailTemplate('blue', {})}
        <div class="content">
          <h2 class="title">Welcome to EduFiliova!</h2>
          <p class="message">Hi ${userData.name},<br><br>Thank you for joining EduFiliova! We're excited to have you as part of our learning community.</p>
          <div class="alert-success" style="text-align: center; padding: 30px;"><div style="margin-bottom: 10px;"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div><div style="color: #065f46; font-size: 18px; font-weight: bold; margin-bottom: 8px;">Account Created Successfully</div><div style="color: #047857; font-size: 14px;">You're all set to start your journey with us!</div></div>
          <div style="background-color: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 25px 0;"><div style="color: #1f2937; font-size: 16px; font-weight: 600; margin-bottom: 15px;"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#374151" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 6px;"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>Your Login Credentials</div><div style="background-color: #ffffff; border: 1px solid #d1d5db; border-radius: 6px; padding: 15px; margin-bottom: 12px;"><div style="color: #6b7280; font-size: 12px; font-weight: 600; margin-bottom: 5px; text-transform: uppercase;">Email</div><div style="color: #1f2937; font-size: 14px; font-family: 'Monaco', 'Courier New', monospace; word-break: break-all;">${loginEmail}</div></div>${loginPhone ? `<div style="background-color: #ffffff; border: 1px solid #d1d5db; border-radius: 6px; padding: 15px; margin-bottom: 12px;"><div style="color: #6b7280; font-size: 12px; font-weight: 600; margin-bottom: 5px; text-transform: uppercase;">Phone</div><div style="color: #1f2937; font-size: 14px; font-family: 'Monaco', 'Courier New', monospace;">${loginPhone}</div></div>` : ''}<div style="background-color: #fef3c7; border: 1px solid #fcd34d; border-radius: 6px; padding: 12px; margin-top: 12px;"><div style="color: #92400e; font-size: 13px; line-height: 1.6;"><strong>🔒 Security Reminder:</strong> Please keep your login credentials safe and secure. Never share them with anyone, including EduFiliova staff members. Always use the official login page to sign in.</div></div></div><div style="text-align: center; margin: 30px 0;"><a href="${req.protocol}://${req.get('host')}/login" class="button">Go to Dashboard</a></div><p class="message" style="font-size: 14px;">Need help? Check out our <a href="${req.protocol}://${req.get('host')}/help" style="color: #2d5ddd; text-decoration: none;">Help Center</a> or contact us at support@edufiliova.com</p>
        </div>
      `;
      await sendEmail(
        userData.email,
        'Welcome to EduFiliova - Your Account is Ready!',
        welcomeHtml
      );
      // Send welcome email
      await sendEmail(
        userData.email,
        'Welcome to EduFiliova!',
        getEmailTemplate('welcome', { 
          name: userData.name,
          loginUrl: `${req.protocol}://${req.get('host')}`
        })
      );

      res.json({ success: true,
        success: true,
        message: "Account created successfully!",
        user: {
          userId: newUser[0].userId,
          email: newUser[0].email
        },
        profile: newProfile[0]
      });

    } catch (error: any) {
      console.error('Verification error:', error);
      res.status(500).json({ success: false, error: "Verification failed" });
    }
  });

  // User Login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { loginId, password } = req.body;

      if (!loginId || !password) {
        return res.status(400).json({ success: false, error: "Login ID and password are required" });
      }

      // Find user by email, userId, or phone number (including profiles join)
      let user = await db
        .select()
        .from(users)
        .where(or(
          eq(users.email, loginId),
          eq(users.userId, loginId)
        ))
        .limit(1);

      // If not found by email or userId, search by phone in profiles
      if (user.length === 0) {
        const normalizedPhone = loginId.replace(/\+/g, '');
        const profilesWithPhone = await db
          .select({ userId: profiles.userId })
          .from(profiles)
          .where(or(
            eq(profiles.phoneNumber, loginId),
            eq(profiles.phoneNumber, `+${normalizedPhone}`),
            eq(profiles.phoneNumber, normalizedPhone)
          ))
          .limit(1);

        if (profilesWithPhone.length > 0) {
          user = await db
            .select()
            .from(users)
            .where(eq(users.id, profilesWithPhone[0].userId))
            .limit(1);
        }
      }

      if (user.length === 0) {
        return res.status(401).json({ success: false, error: "Invalid credentials" });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user[0].passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ success: false, error: "Invalid credentials" });
      }

      // Get user profile
      const profile = await db
        .select()
        .from(profiles)
        .where(eq(profiles.userId, user[0].id))
        .limit(1);

      if (profile.length === 0) {
        return res.status(401).json({ success: false, error: "User profile not found" });
      }

      // Check if user is banned or suspended
      if (profile[0].status === 'banned') {
        return res.status(403).json({ 
          success: false, 
          error: 'Account has been banned. Please contact support if you believe this is an error.' 
        });
      }

      if (profile[0].status === 'suspended') {
        return res.status(403).json({ 
          success: false, 
          error: 'Account has been temporarily suspended. Please contact support for more information.' 
        });
      }

      // Create session
      const sessionId = uuidv4();
      await db.insert(userLoginSessions).values({
        userId: user[0].id,
        sessionId,
        userAgent: req.headers['user-agent'] || 'Unknown',
        ipAddress: req.ip || 'Unknown',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      });

      // Fetch application status for teachers and freelancers
      let teacherApplicationStatus = null;
      let freelancerApplicationStatus = null;
      
      console.log('🔍 Fetching application status - role:', profile[0].role, 'userId:', user[0].id);
      
      if (profile[0].role === 'teacher') {
        try {
          const teacherApp = await db.select({
            id: teacherApplications.id,
            status: teacherApplications.status,
            submittedAt: teacherApplications.createdAt
          })
            .from(teacherApplications)
            .where(eq(teacherApplications.userId, user[0].id))
            .limit(1);
          
          console.log('🔍 Teacher application query result:', teacherApp);
          
          if (teacherApp.length > 0) {
            teacherApplicationStatus = {
              id: teacherApp[0].id,
              status: teacherApp[0].status,
              submittedAt: teacherApp[0].submittedAt
            };
          }
        } catch (error: any) {
          console.error('❌ Error fetching teacher application:', error);
        }
      } else if (profile[0].role === 'freelancer') {
        const freelancerApp = await db.select({
          id: freelancerApplications.id,
          status: freelancerApplications.status,
          createdAt: freelancerApplications.createdAt,
          approvedAt: freelancerApplications.approvedAt
        })
          .from(freelancerApplications)
          .where(eq(freelancerApplications.userId, user[0].id))
          .limit(1);
        
        if (freelancerApp.length > 0) {
          freelancerApplicationStatus = {
            id: freelancerApp[0].id,
            status: freelancerApp[0].status,
            createdAt: freelancerApp[0].createdAt,
            approvedAt: freelancerApp[0].approvedAt
          };
        }
      }

      // Set session cookie for cross-subdomain auth
      const requestHost = req.get('host') || '';
      const originHeader = req.get('origin') || '';
      
      // Detect production based on NODE_ENV OR hostname (Replit deployments may run with NODE_ENV=development)
      const isEdufiliovaRequest = requestHost.includes('edufiliova.com') || originHeader.includes('edufiliova.com');
      const isProductionHost = isEdufiliovaRequest || requestHost.includes('.replit.app');
      const isProduction = process.env.NODE_ENV === 'production' || isProductionHost;
      
      // Determine cookie domain based on request host OR origin
      // This handles cross-subdomain requests (e.g., app.edufiliova.com -> edufiliova.com)
      // For Replit subdomains (.replit.app, .repl.co), don't set domain to let browser use current host
      let cookieDomain: string | undefined = undefined;
      
      if (isEdufiliovaRequest) {
        cookieDomain = '.edufiliova.com';
      }
      
      // Use sameSite: 'none' for cross-origin requests to allow cookie sharing between subdomains
      // This is required when app.edufiliova.com makes requests to edufiliova.com API
      const isCrossOrigin = originHeader && !originHeader.includes(requestHost);
      
      console.log('🍪 Cookie settings:', { 
        requestHost, 
        originHeader, 
        isProduction, 
        isEdufiliovaRequest, 
        isCrossOrigin, 
        cookieDomain,
        sameSite: isEdufiliovaRequest && isCrossOrigin ? 'none' : 'lax'
      });
      
      res.cookie('sessionId', sessionId, {
        httpOnly: false,
        secure: isProduction,
        sameSite: isEdufiliovaRequest && isCrossOrigin ? 'none' : 'lax',
        domain: cookieDomain,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/' 
      });

      res.json({ success: true,
        success: true,
        user: {
          id: user[0].id,
          userId: user[0].userId,
          email: user[0].email
        },
        profile: profile.length > 0 ? profile[0] : null,
        sessionId,
        teacherApplicationStatus,
        freelancerApplicationStatus
      });
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(500).json({ success: false, error: "Login failed" });
    }
  });

  // Password Reset Request
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      const user = await db.query.users.findFirst({ where: eq(users.email, email) });
      
      if (!user) {
        return res.json({ success: true, message: "If an account with this email exists, a verification code has been sent." });
      }

      // Generate 6-digit code
      const emailCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Delete any existing verification codes for this email (to handle unique constraint)
      await db.delete(verificationCodes)
        .where(and(
          eq(verificationCodes.contactInfo, email),
          eq(verificationCodes.type, 'email_password_reset')
        ));
      // Store code in verification_codes table
      await db.insert(verificationCodes).values({
        contactInfo: email,
        userId: user.id,
        code: emailCode,
        type: 'email_password_reset',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        userData: { email }
      });

      // Send reset email using new template
      const templatePath = path.join(process.cwd(), 'server', 'templates', 'password_reset_whatsapp.html');
      const htmlContent = fs.readFileSync(templatePath, 'utf-8');
      const profile = await db.query.profiles.findFirst({ where: eq(profiles.userId, user.id) });

      await sendEmail(
        email,
        'Password Reset Verification Code',
        getEmailTemplate('password_reset_whatsapp' as any, { 
          code: emailCode, 
          fullName: profile?.name || 'User',
          expiresIn: '10',
          htmlContent 
        })
      );

      res.json({ success: true, message: "If an account with this email exists, a verification code has been sent." });
    } catch (error) {
      console.error('Password reset request error:', error);
      res.status(500).json({ success: false, error: "Password reset request failed" });
    }
  });

  // Verify Reset Code - Password Reset (no auth required)
  app.post("/api/auth/verify-reset-code", async (req, res) => {
    try {
      const { email, code, newPassword } = req.body;

      if (!email || !code || !newPassword) {
        return res.status(400).json({ success: false, error: "Email, code, and password are required" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ success: false, error: "Password must be at least 6 characters long" });
      }

      // Get user by email first
      const user = await db.query.users.findFirst({
        where: eq(users.email, email)
      });

      if (!user) {
        return res.status(400).json({ success: false, error: "User not found" });
      }

      // Find the verification code
      const verifyCode = await db.query.verificationCodes.findFirst({
        where: and(
          eq(verificationCodes.contactInfo, email),
          eq(verificationCodes.code, code),
          eq(verificationCodes.type, 'email_password_reset')
        )
      });

      if (!verifyCode || new Date() > verifyCode.expiresAt) {
        return res.status(400).json({ success: false, error: "Invalid or expired reset code" });
      }

      // Hash and update password
      const newPasswordHash = await bcrypt.hash(newPassword, 10);
      const updateResult = await db
        .update(users)
        .set({ passwordHash: newPasswordHash })
        .where(eq(users.id, user.id));

      // Delete the verification code
      await db.delete(verificationCodes)
        .where(eq(verificationCodes.id, verifyCode.id));

      res.json({ success: true, message: "Password reset successful" });
    } catch (error: any) {
      console.error("Verify reset code error:", error);
      res.status(500).json({ success: false, error: "Password reset failed" });
    }
  });

  // Confirm Dodopay Purchase
  app.post('/api/course-creator/confirm-dodopay-purchase', requireAuth, async (req, res) => {
    try {
      const { paymentId, courseId, amount } = req.body;
      const user = req.user;
      
      if (!user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      if (!courseId) {
        return res.status(400).json({
          success: false,
          error: 'Course ID is required'
        });
      }

      // Verify course exists
      const [course] = await db
        .select()
        .from(courses)
        .where(eq(courses.id, courseId))
        .limit(1);

      if (!course) {
        return res.status(404).json({
          success: false,
          error: 'Course not found'
        });
      }

      // Check if already enrolled
      const [existingEnrollment] = await db
        .select()
        .from(courseEnrollments)
        .where(and(
          eq(courseEnrollments.courseId, courseId),
          eq(courseEnrollments.userId, user.id)
        ))
        .limit(1);

      if (existingEnrollment) {
        return res.json({
          success: true,
          message: 'Already enrolled in this course',
          enrollment: existingEnrollment
        });
      }

      // Create enrollment
      const [enrollment] = await db.insert(courseEnrollments).values({
        courseId: courseId,
        userId: user.id,
        status: 'enrolled',
        progress: 0,
        enrolledAt: new Date()
      }).returning();

      // Update course total enrollments
      await db.update(courses)
        .set({ totalEnrollments: sql`COALESCE(total_enrollments, 0) + 1` })
        .where(eq(courses.id, courseId));

      // Record the payment
      const orderAmount = amount?.toString() || course.price?.toString() || '0';
      await db.insert(orders).values({
        userId: user.id,
        totalAmount: orderAmount,
        amount: orderAmount,
        currency: 'USD',
        paymentMethod: 'dodopay',
        status: 'paid',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Send confirmation email
      const userEmail = user.email;
      const userName = user.profile?.fullName || userEmail;
      
      if (userEmail) {
        try {
          const emailData = {
            to: userEmail,
            subject: `Course Enrollment Confirmed: ${course.title}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #42fa76;">Course Enrollment Confirmed!</h2>
                <p>Dear ${userName},</p>
                <p>Congratulations! You have successfully enrolled in:</p>
                <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="margin: 0 0 10px 0;">${course.title}</h3>
                  <p style="margin: 0; color: #666;">${course.description?.substring(0, 150)}...</p>
                </div>
                <p>You can access your course from your dashboard under "My Courses".</p>
                <p>Happy learning!</p>
                <p>Best regards,<br>EduFiliova Team</p>
              </div>
            `
          };
          await sendEmailWithAccount(emailData, 'orders');
          console.log('📧 Course purchase confirmation email sent to:', userEmail);
        } catch (emailError) {
          console.error('Failed to send course purchase email:', emailError);
        }
      }

      console.log(`✅ Course enrollment confirmed via DodoPay: ${course.title} for user ${user.id}`);

      res.json({
        success: true,
        message: 'Course purchased successfully',
        enrollment: enrollment
      });
    } catch (error: any) {
      console.error('DodoPay course purchase confirmation error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to confirm course purchase'
      });
    }
  });

  return server;
}
