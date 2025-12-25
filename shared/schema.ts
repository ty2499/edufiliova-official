import { pgTable, text, serial, integer, boolean, timestamp, uuid, jsonb, pgEnum, numeric, varchar, unique, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

// Enums
export const appRoleEnum = pgEnum("app_role", ["admin", "moderator", "teacher", "student", "freelancer", "accountant", "customer_service", "customer"]);
export const verificationBadgeEnum = pgEnum("verification_badge", ["none", "green", "blue"]);
export const transactionTypeEnum = pgEnum("transaction_type", ["credit", "debit"]);
export const transactionStatusEnum = pgEnum("transaction_status", ["pending", "completed", "failed", "cancelled"]);
export const payoutMethodEnum = pgEnum("payout_method", ["bank", "paypal", "crypto", "mobile_money"]);
export const payoutAccountTypeEnum = pgEnum("payout_account_type", ["bank", "paypal", "crypto", "mobile_money"]);
export const mobileMoneyProviderEnum = pgEnum("mobile_money_provider", ["vodapay", "ecocash", "mpesa", "mtn_mobile_money", "orange_money"]);
export const payoutStatusEnum = pgEnum("payout_status", ["auto_generated", "awaiting_admin", "approved", "payment_processing", "completed", "failed", "rejected"]);
export const curriculumTypeEnum = pgEnum("curriculum_type", ["cambridge", "american", "local", "all_systems"]);
export const contentTypeEnum = pgEnum("content_type", ["reading_material", "quiz", "test", "assignment"]);
export const taskStatusEnum = pgEnum("task_status", ["todo", "in_progress", "done"]);
export const educationLevelEnum = pgEnum("education_level", ["primary", "secondary", "college", "university", "other"]);
export const helpChatSenderEnum = pgEnum("help_chat_sender", ["visitor", "admin"]);
export const assignmentModeEnum = pgEnum("assignment_mode", ["auto_assign", "manual_assign"]);
export const approvalStatusEnum = pgEnum("approval_status", ["pending", "approved", "rejected"]);
export const coursePricingTypeEnum = pgEnum("course_pricing_type", ["free", "fixed_price", "subscription"]);
// Grade-based subscription enums - Exact tiers for the new system
export const gradeSubscriptionTierEnum = pgEnum("grade_subscription_tier", ["elementary", "high_school", "college_university"]);
export const subscriptionBillingPeriodEnum = pgEnum("subscription_billing_period", ["monthly", "yearly"]);

// Grade level enum for user profiles
export const gradeLevelEnum = pgEnum("grade_level", ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "college", "university"]);

// TypeScript types for grade-based subscription system
export type SubscriptionTier = 'elementary' | 'high_school' | 'college_university';
export type GradeLevel = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12' | 'college' | 'university';
export type BillingPeriod = 'monthly' | 'yearly';

// Grade-based subscription plan constants
export const GRADE_SUBSCRIPTION_PLANS = {
  elementary: {
    tier: "elementary" as const,
    name: "Elementary Plan",
    gradeRange: "Grades 1-7",
    description: "Perfect for elementary students with essential learning tools and interactive content.",
    pricing: {
      monthly: 5.99,
      yearly: 54.99
    },
    dodoPayProductIds: {
      monthly: "pdt_0NUcgx93GuWjSEwLFx6AB",
      yearly: "pdt_0NUcirdzfxaSCFTN9DMVh"
    },
    features: [
      "Access to all elementary courses (Grades 1-7)",
      "Interactive learning games and activities",
      "Basic progress tracking",
      "Parent reports and updates",
      "Math, reading, and science fundamentals",
      "Homework help and support"
    ],
  },
  high_school: {
    tier: "high_school" as const,
    name: "High School Plan", 
    gradeRange: "Grades 8-12",
    description: "Advanced learning for high school students with college prep and comprehensive subjects.",
    pricing: {
      monthly: 9.99,
      yearly: 99.90
    },
    dodoPayProductIds: {
      monthly: "pdt_0NUcirdzfxaSCFTN9DMVh",
      yearly: "pdt_0NUcj46lbet1s6JsO61kx"
    },
    features: [
      "Access to all high school courses (Grades 8-12)",
      "Advanced STEM subjects and AP courses",
      "College preparation materials",
      "SAT/ACT prep resources",
      "Live teacher sessions and tutoring",
      "Research tools and academic writing support",
      "Grade 12+ students get college content access"
    ],
  },
  college_university: {
    tier: "college_university" as const,
    name: "College & University Plan",
    gradeRange: "College & University",
    description: "Comprehensive higher education support with specialized courses and career development.",
    pricing: {
      monthly: 99.00,
      yearly: 799.00
    },
    dodoPayProductIds: {
      monthly: "pdt_0NUcjcuCHDvZ9eGbuHY60",
      yearly: "pdt_0NUcjFxIA8pPtPvNBfwQ1"
    },
    features: [
      "Access to all college and university courses",
      "Specialized degree program support",
      "Advanced research database access",
      "Thesis and dissertation assistance",
      "Career counseling and internship opportunities",
      "Professional networking and industry connections",
      "Graduate school preparation"
    ],
  }
} as const;

// Helper function to get subscription tier from grade level
export const getSubscriptionTierFromGrade = (gradeLevel: string | number): keyof typeof GRADE_SUBSCRIPTION_PLANS => {
  if (typeof gradeLevel === 'number') {
    if (gradeLevel >= 1 && gradeLevel <= 7) return 'elementary';
    if (gradeLevel >= 8 && gradeLevel <= 12) return 'high_school';
    return 'college_university';
  }
  
  if (typeof gradeLevel === 'string') {
    const numGrade = parseInt(gradeLevel);
    if (!isNaN(numGrade)) {
      if (numGrade >= 1 && numGrade <= 7) return 'elementary';
      if (numGrade >= 8 && numGrade <= 12) return 'high_school';
    }
    if (gradeLevel === 'college' || gradeLevel === 'university') return 'college_university';
  }
  
  return 'college_university'; // Default fallback
};

// Helper function to check if a user should have college access (Grade 12+)
export const shouldHaveCollegeAccess = (gradeLevel: string | number): boolean => {
  if (typeof gradeLevel === 'number') {
    return gradeLevel >= 12;
  }
  
  if (typeof gradeLevel === 'string') {
    const numGrade = parseInt(gradeLevel);
    if (!isNaN(numGrade)) {
      return numGrade >= 12;
    }
    return gradeLevel === 'college' || gradeLevel === 'university';
  }
  
  return false;
};

// Helper function to get numeric grade from grade level
export const getNumericGrade = (gradeLevel: string | number | null | undefined): number | null => {
  if (!gradeLevel) return null;
  
  if (typeof gradeLevel === 'number') {
    return gradeLevel;
  }
  
  if (typeof gradeLevel === 'string') {
    const numGrade = parseInt(gradeLevel);
    if (!isNaN(numGrade)) {
      return numGrade;
    }
    // College/University treated as grade 13+ for feature access
    if (gradeLevel === 'college' || gradeLevel === 'university') return 13;
  }
  
  return null;
};

// Grade-based feature restrictions for child safety (DEPRECATED - use getFeatureAccess instead)
// This function only considers grade level, not subscription status
export const getGradeFeatureRestrictions = (gradeLevel: string | number | null | undefined) => {
  const numericGrade = getNumericGrade(gradeLevel);
  
  if (!numericGrade) {
    return {
      canAccessCommunity: false,
      canAccessBilling: false,
      canAccessPurchases: true, // All students can view their purchases
      canAccessDownloads: true, // All students can access their downloads
      canAccessCreateAd: false,
      canAccessFreelancers: false,
      canAccessCourses: false,
      canSeeCommunityInMessages: false,
      canSeeTeachersInMessages: false,
      allowedMessageContacts: ['admin'] as string[],
    };
  }
  
  if (numericGrade >= 1 && numericGrade <= 7) {
    return {
      canAccessCommunity: false,
      canAccessBilling: false,
      canAccessPurchases: true, // All students can view their purchases
      canAccessDownloads: true, // All students can access their downloads
      canAccessCreateAd: false,
      canAccessFreelancers: false,
      canAccessCourses: false,
      canSeeCommunityInMessages: false,
      canSeeTeachersInMessages: false,
      allowedMessageContacts: ['admin'] as string[],
    };
  }
  
  if (numericGrade >= 8 && numericGrade <= 11) {
    return {
      canAccessCommunity: false,
      canAccessBilling: false,
      canAccessPurchases: true, // All students can view their purchases
      canAccessDownloads: true, // All students can access their downloads
      canAccessCreateAd: false,
      canAccessFreelancers: false, // Hidden for grades 8-11 (only grade 12+ can access)
      canAccessCourses: true,
      canSeeCommunityInMessages: false,
      canSeeTeachersInMessages: true,
      allowedMessageContacts: ['admin', 'teacher'] as string[],
    };
  }
  
  return {
    canAccessCommunity: true,
    canAccessBilling: true,
    canAccessPurchases: true,
    canAccessDownloads: true,
    canAccessCreateAd: true,
    canAccessFreelancers: true,
    canAccessCourses: true,
    canSeeCommunityInMessages: true,
    canSeeTeachersInMessages: true,
    allowedMessageContacts: ['admin', 'teacher', 'student', 'community'] as string[],
  };
};

// NEW: Comprehensive feature access control based on grade AND subscription status
export const getFeatureAccess = (
  gradeLevel: string | number | null | undefined,
  hasActiveSubscription: boolean
) => {
  const numericGrade = getNumericGrade(gradeLevel);
  
  if (!numericGrade) {
    return {
      canAccessAllLessons: false,
      canAccessMeetings: false,
      canAccessDailyChallenge: false,
      canAccessWhatsAppQuiz: false,
      canAccessCommunity: false,
      canSendFriendRequests: false,
      canAccessUnlimitedDownloads: false,
      allowedMessageContacts: ['admin'] as string[],
      lessonLimit: null,
      freeSubjectLimit: 1,
      freeCourseLimit: 1,
      freeDownloadsPerMonth: 5,
    };
  }
  
  // Grade 1-7: Elementary
  if (numericGrade >= 1 && numericGrade <= 7) {
    if (hasActiveSubscription) {
      return {
        canAccessAllLessons: true,
        canAccessMeetings: true,
        canAccessDailyChallenge: true,
        canAccessWhatsAppQuiz: true,
        canAccessCommunity: false, // NEVER for elementary (child safety)
        canSendFriendRequests: false, // NEVER for elementary (child safety)
        canAccessUnlimitedDownloads: true,
        allowedMessageContacts: ['admin'] as string[], // Only admins (child safety)
        lessonLimit: null, // unlimited
        freeSubjectLimit: null, // unlimited subjects
        freeCourseLimit: null, // unlimited courses
        freeDownloadsPerMonth: null, // unlimited with subscription
      };
    } else {
      return {
        canAccessAllLessons: false,
        canAccessMeetings: false,
        canAccessDailyChallenge: false,
        canAccessWhatsAppQuiz: false,
        canAccessCommunity: false,
        canSendFriendRequests: false,
        canAccessUnlimitedDownloads: false,
        allowedMessageContacts: ['admin'] as string[],
        lessonLimit: null, // All lessons in unlocked subject
        freeSubjectLimit: 1, // Can unlock 1 full subject (all lessons)
        freeCourseLimit: null, // Not applicable for elementary
        freeDownloadsPerMonth: 5,
      };
    }
  }
  
  // Grade 8-11: High School
  if (numericGrade >= 8 && numericGrade <= 11) {
    if (hasActiveSubscription) {
      return {
        canAccessAllLessons: true,
        canAccessMeetings: true,
        canAccessDailyChallenge: true,
        canAccessWhatsAppQuiz: true,
        canAccessCommunity: false, // NEVER for grades 8-11 (child safety)
        canSendFriendRequests: false, // NEVER for grades 8-11 (child safety)
        canAccessUnlimitedDownloads: true,
        allowedMessageContacts: ['admin', 'teacher'] as string[], // Can message teachers when paid
        lessonLimit: null, // unlimited
        freeSubjectLimit: null, // unlimited subjects
        freeCourseLimit: null, // unlimited courses
        freeDownloadsPerMonth: null, // unlimited with subscription
      };
    } else {
      return {
        canAccessAllLessons: false,
        canAccessMeetings: false,
        canAccessDailyChallenge: false,
        canAccessWhatsAppQuiz: false,
        canAccessCommunity: false,
        canSendFriendRequests: false,
        canAccessUnlimitedDownloads: false,
        allowedMessageContacts: ['admin'] as string[], // Only admins when unpaid
        lessonLimit: null, // All lessons in unlocked subject
        freeSubjectLimit: 1, // Can unlock 1 full subject (all lessons)
        freeCourseLimit: null, // Not applicable for high school
        freeDownloadsPerMonth: 5,
      };
    }
  }
  
  // Grade 12+: College/University
  if (hasActiveSubscription) {
    return {
      canAccessAllLessons: true,
      canAccessMeetings: true,
      canAccessDailyChallenge: true,
      canAccessWhatsAppQuiz: true,
      canAccessCommunity: true, // YES for grade 12+ when PAID
      canSendFriendRequests: true, // YES for grade 12+ when PAID
      canAccessUnlimitedDownloads: true,
      allowedMessageContacts: ['admin', 'teacher', 'student', 'community'] as string[],
      lessonLimit: null, // unlimited
      freeSubjectLimit: null, // unlimited subjects
      freeCourseLimit: null, // unlimited courses
      freeDownloadsPerMonth: null, // unlimited with subscription
    };
  } else {
    return {
      canAccessAllLessons: false,
      canAccessMeetings: false,
      canAccessDailyChallenge: false,
      canAccessWhatsAppQuiz: false,
      canAccessCommunity: false,
      canSendFriendRequests: false,
      canAccessUnlimitedDownloads: false,
      allowedMessageContacts: ['admin'] as string[],
      lessonLimit: null, // All lessons in unlocked course
      freeSubjectLimit: null, // Not applicable for university
      freeCourseLimit: 1, // Can unlock 1 full course (all lessons)
      freeDownloadsPerMonth: 5,
    };
  }
};

// Countries table - Keep for user registration
export const countries = pgTable("countries", {
  id: serial("id").primaryKey(),
  code: text("code").notNull(),
  name: text("name").notNull(),
  gradeSystemType: text("grade_system_type").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Cities table - For location selection in profiles
export const cities = pgTable("cities", {
  id: serial("id").primaryKey(),
  countryId: integer("country_id").references(() => countries.id),
  countryCode: text("country_code").notNull(),
  name: text("name").notNull(),
  isMajor: boolean("is_major").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Grade systems table - Keep for user registration
export const gradeSystems = pgTable("grade_systems", {
  id: serial("id").primaryKey(),
  countryId: integer("country_id").references(() => countries.id),
  gradeNumber: integer("grade_number").notNull(),
  displayName: text("display_name").notNull(),
  educationLevel: text("education_level"),
  ageRange: text("age_range"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Users table (for authentication) - with 10-digit user ID for easy login
export const users = pgTable("auth_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().unique(), // 10-digit ID like "232355665CD"
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"), // Make nullable for social auth users
  educationLevel: educationLevelEnum("education_level").default("primary"),
  // Social authentication fields
  supabaseUserId: text("supabase_user_id").unique(), // Supabase user ID for social auth
  authProvider: text("auth_provider").default("email"), // email, google, twitter, apple
  hasCompletedProfile: boolean("has_completed_profile").default(false),
  hasSelectedRole: boolean("has_selected_role").default(false),
  isFromCheckout: boolean("is_from_checkout").default(false), // Track if user registered via checkout
  isBlocked: boolean("is_blocked").default(false), // Admin can block users
  isActive: boolean("is_active").default(true), // Soft delete flag
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Session storage table for Replit Auth.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Replit Auth users table - for social authentication
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const replitUsers = pgTable("replit_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  // Additional fields for user onboarding flow
  hasCompletedProfile: boolean("has_completed_profile").default(false),
  hasSelectedRole: boolean("has_selected_role").default(false),
  selectedRole: text("selected_role"), // teacher, student, freelancer
  // Additional profile fields for social login
  additionalInfo: jsonb("additional_info"), // Store extra data from social login
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertReplitUser = typeof replitUsers.$inferInsert;
export type ReplitUser = typeof replitUsers.$inferSelect;

// Verification codes table - simplified for single verification
export const verificationCodes = pgTable("verification_codes", {
  id: uuid("id").primaryKey().defaultRandom(),
  contactInfo: text("contact_info").notNull().unique(), // email or phone number
  type: text("type").notNull(), // 'email' or 'phone'
  code: text("code").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  isUsed: boolean("is_used").default(false),
  attempts: integer("attempts").default(0),
  userData: jsonb("user_data"), // Store temp registration data
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Password reset tokens table
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").references(() => users.userId).notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  isUsed: boolean("is_used").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Email verifications table - for teacher application flow
export const emailVerifications = pgTable("email_verifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull(),
  token: text("token").notNull().unique(),
  userId: uuid("user_id").references(() => users.id),
  applicationId: uuid("application_id").references(() => teacherApplications.id),
  expiresAt: timestamp("expires_at").notNull(),
  isVerified: boolean("is_verified").default(false),
  verifiedAt: timestamp("verified_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Pending registrations table - stores registration data until email is verified
// User/profile is NOT created until verification code is entered
export const pendingRegistrations = pgTable("pending_registrations", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  token: text("token").notNull().unique(), // Verification token (kept for backward compatibility)
  verificationCode: text("verification_code"), // 6-digit verification code
  registrationType: text("registration_type").notNull(), // 'freelancer', 'teacher', or 'customer'
  passwordHash: text("password_hash").notNull(),
  fullName: text("full_name").notNull(),
  displayName: text("display_name").notNull(),
  phoneNumber: text("phone_number"),
  country: text("country").notNull(),
  // Additional data stored as JSON (varies by registration type)
  additionalData: jsonb("additional_data"),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("pending_registrations_email_idx").on(table.email),
  index("pending_registrations_token_idx").on(table.token),
  index("pending_registrations_expires_idx").on(table.expiresAt),
]);

// Pending Registration types
export type PendingRegistration = typeof pendingRegistrations.$inferSelect;
export type InsertPendingRegistration = typeof pendingRegistrations.$inferInsert;

// Profiles table
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull().unique(),
  name: text("name").notNull(),
  displayName: text("display_name"), // Added as requested
  email: text("email"), // Added as requested  
  age: integer("age").notNull(),
  grade: integer("grade").notNull(), // Student grade level (1-12, 13+ for college/university)
  gradeLevel: gradeLevelEnum("grade_level"), // New standardized grade level
  educationLevel: text("education_level").default("grade"), // grade, college, university, other
  subscriptionTier: text("subscription_tier"), // Student tiers: elementary, high_school, college_university; Shop tiers: free, creator, pro, business
  country: text("country").notNull(),
  countryId: integer("country_id").references(() => countries.id),
  gradeSystem: text("grade_system"), // User's grade system (e.g., "Cambridge", "Zimbabwe", "US K-12")
  avatarUrl: text("avatar_url"),
  profilePicture: text("profile_picture"), // Added as requested
  role: text("role").default("student"),
  status: text("status").default("active"), // active, banned, suspended
  pronouns: text("pronouns"), // Support for pronouns (they/them, she/her, he/him, etc.)
  bio: text("bio"),
  qualifications: text("qualifications"), // Teacher qualifications
  experience: text("experience"), // Teacher experience
  availableHours: text("available_hours"), // Teacher available hours
  hourlyRate: numeric("hourly_rate", { precision: 10, scale: 2 }), // Teacher hourly rate
  // Legacy fields kept for backward compatibility (to be deprecated)
  legacyPlan: text("plan").default(""), // DEPRECATED: use subscriptionTier instead
  planExpiry: timestamp("plan_expiry"), // DEPRECATED: will be replaced with subscription end date
  subscriptionCancelledAt: timestamp("subscription_cancelled_at"), // When subscription was cancelled (but still active until planExpiry)
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  isTest: boolean("is_test").default(false), // Flag for test accounts - never appear in production
  isOnline: boolean("is_online").default(false), // Current online status
  lastSeen: timestamp("last_seen"), // For online presence tracking
  lastPricingShown: timestamp("last_pricing_shown"), // Track when pricing was last shown for 24-hour delay
  availabilitySettings: text("availability_settings"), // JSON string for teacher availability settings
  // Freelancer approval workflow fields
  approvalStatus: approvalStatusEnum("approval_status").default("pending"),
  approvedBy: uuid("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  rejectionReason: text("rejection_reason"),
  adminNotes: text("admin_notes"),
  
  // Enhanced Behance-style freelancer profile fields
  professionalTitle: text("professional_title"), // e.g., "UI/UX Designer", "Full-Stack Developer"
  tagline: text("tagline"), // Short professional tagline/motto
  coverImageUrl: text("cover_image_url"), // Profile cover/banner image
  skills: text("skills").array(), // Array of skills/expertise
  socialLinks: jsonb("social_links"), // { linkedin, twitter, instagram, behance, dribbble, etc. }
  websiteUrl: text("website_url"), // Personal/portfolio website
  portfolioLinks: text("portfolio_links").array(), // Array of portfolio URLs
  location: text("location"), // City, Country or detailed location
  locationLat: numeric("location_lat", { precision: 10, scale: 7 }), // Latitude for location
  locationLng: numeric("location_lng", { precision: 10, scale: 7 }), // Longitude for location
  timeZone: text("time_zone"), // User's timezone
  yearsOfExperience: integer("years_of_experience"), // Years of professional experience
  workAvailability: text("work_availability").default("available"), // available, busy, unavailable
  responseTime: text("response_time").default("within 24 hours"), // Typical response time
  professionalStatement: text("professional_statement"), // Detailed professional bio/statement
  languages: text("languages").array(), // Languages spoken
  completedProjects: integer("completed_projects").default(0), // Number of completed projects
  clientReviews: integer("client_reviews").default(0), // Number of client reviews
  averageRating: numeric("average_rating", { precision: 3, scale: 2 }).default("0.00"), // Average rating (0.00-5.00)
  profileViews: integer("profile_views").default(0), // Profile view count
  likesCount: integer("likes_count").default(0), // Profile likes count
  followersCount: integer("followers_count").default(0), // Profile followers count
  boostViewsCount: integer("boost_views_count").default(0), // Admin-added vanity views for maintaining realistic ratios
  profileVisibility: text("profile_visibility").default("public"), // public, private, unlisted
  profileCompleteness: integer("profile_completeness").default(0), // Profile completeness percentage
  featuredWorkIds: text("featured_work_ids").array(), // Array of featured work/project IDs
  verified: boolean("verified").default(false), // Verified professional status
  verificationBadge: verificationBadgeEnum("verification_badge").default("none"), // User verification badge (none, green, blue)
  verificationBadges: text("verification_badges").array(), // Array of verification badges
  isFeatured: boolean("is_featured").default(false), // Featured creator status (admin controlled)
  featuredAt: timestamp("featured_at"), // When the user was marked as featured
  contactEmail: text("contact_email"), // Professional contact email (can differ from login email)
  phoneNumber: text("phone_number"), // Professional phone number
  
  // Student-specific fields
  whatsappOptIn: boolean("whatsapp_opt_in").default(false), // Student consent for WhatsApp communications
  schoolName: text("school_name"), // Student's school name (optional)
  learningPreferences: text("learning_preferences").array(), // What student wants to focus on (Math, English, Science, etc.)
  educationSystem: text("education_system"), // Cambridge, American, Local/National, Other
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Profile views tracking table
export const profileViews = pgTable("profile_views", {
  id: uuid("id").primaryKey().defaultRandom(),
  profileId: uuid("profile_id").references(() => profiles.id).notNull(),
  viewerUserId: uuid("viewer_user_id").references(() => users.id), // null for anonymous users
  visitorId: text("visitor_id"), // localStorage-based visitor ID for anonymous tracking
  sessionId: text("session_id"), // sessionStorage-based session ID  
  ipHash: text("ip_hash"), // hashed IP for deduplication
  uaHash: text("ua_hash"), // hashed user agent for deduplication
  referer: text("referer"), // referrer URL
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("profileViews_profileId_idx").on(table.profileId),
  index("profileViews_createdAt_idx").on(table.createdAt),
]);

// Profile likes tracking table
export const profileLikes = pgTable("profile_likes", {
  id: uuid("id").primaryKey().defaultRandom(),
  profileId: uuid("profile_id").references(() => profiles.id).notNull(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  unique("profileLikes_unique").on(table.profileId, table.userId),
  index("profileLikes_profileId_idx").on(table.profileId),
  index("profileLikes_userId_idx").on(table.userId),
]);

// Profile follows tracking table  
export const profileFollows = pgTable("profile_follows", {
  id: uuid("id").primaryKey().defaultRandom(),
  profileId: uuid("profile_id").references(() => profiles.id).notNull(), // profile being followed
  followerUserId: uuid("follower_user_id").references(() => users.id).notNull(), // user doing the following
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  unique("profileFollows_unique").on(table.profileId, table.followerUserId),
  index("profileFollows_profileId_idx").on(table.profileId),
  index("profileFollows_followerUserId_idx").on(table.followerUserId),
]);

// Profile boost likes - Admin-added vanity likes with random generated names
export const profileBoostLikes = pgTable("profile_boost_likes", {
  id: uuid("id").primaryKey().defaultRandom(),
  profileId: uuid("profile_id").references(() => profiles.id).notNull(),
  displayName: text("display_name").notNull(), // Random generated name
  avatarUrl: text("avatar_url"), // Random avatar URL
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("profileBoostLikes_profileId_idx").on(table.profileId),
]);

// Profile boost followers - Admin-added vanity followers with random generated names
export const profileBoostFollowers = pgTable("profile_boost_followers", {
  id: uuid("id").primaryKey().defaultRandom(),
  profileId: uuid("profile_id").references(() => profiles.id).notNull(),
  displayName: text("display_name").notNull(), // Random generated name
  avatarUrl: text("avatar_url"), // Random avatar URL
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("profileBoostFollowers_profileId_idx").on(table.profileId),
]);

// User roles table
export const userRoles = pgTable("user_roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  role: appRoleEnum("role").notNull().default("student"),
  assignedAt: timestamp("assigned_at").defaultNow(),
  assignedBy: uuid("assigned_by").references(() => users.id),
  isActive: boolean("is_active").default(true),
});

// Teacher applications table
export const teacherApplications = pgTable("teacher_applications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id),
  
  // 1. Basic Personal Information
  passportPhotoUrl: text("passport_photo_url"),
  fullName: text("full_name").notNull(),
  displayName: text("display_name").notNull(),
  email: text("email").notNull(),
  phoneNumber: text("phone_number").notNull(),
  dateOfBirth: text("date_of_birth").notNull(),
  gender: text("gender"),
  country: text("country").notNull(),
  nationality: text("nationality"),
  emergencyContact: jsonb("emergency_contact"),
  
  // 2. Teaching Details
  teachingCategories: text("teaching_categories").array().notNull(),
  gradeLevels: text("grade_levels").array().notNull(),
  languagesTaught: text("languages_taught").array(),
  preferredTeachingStyle: text("preferred_teaching_style"),
  timeZone: text("time_zone"),
  availabilitySchedule: jsonb("availability_schedule"),
  
  // 3. Qualifications & Identity Verification
  highestQualification: text("highest_qualification").notNull(),
  qualificationCertificates: text("qualification_certificates").array(),
  idPassportDocument: text("id_passport_document").notNull(),
  cvResume: text("cv_resume"),
  backgroundCheckStatus: text("background_check_status").default("pending"),
  backgroundCheckDocument: text("background_check_document"),
  references: jsonb("references"),
  
  // 4. Teaching Experience
  yearsOfExperience: text("years_of_experience").notNull(),
  experienceSummary: text("experience_summary").notNull(),
  proofOfTeaching: text("proof_of_teaching").array(),
  
  // 5. Lesson Samples
  sampleMaterials: text("sample_materials").array(),
  introductionVideo: text("introduction_video"),
  
  // 6. Payment Setup (to be completed after approval)
  preferredPaymentMethod: text("preferred_payment_method"),
  bankDetails: jsonb("bank_details"),
  paypalEmail: text("paypal_email"),
  taxInformation: jsonb("tax_information"),
  
  // 7. Agreements
  agreementTruthful: boolean("agreement_truthful").notNull(),
  agreementContent: boolean("agreement_content").notNull(),
  agreementTerms: boolean("agreement_terms").notNull(),
  agreementUnderstand: boolean("agreement_understand").notNull(),
  agreementSafety: boolean("agreement_safety").notNull(),
  
  // Legacy fields for backward compatibility
  qualifications: text("qualifications"),
  experience: text("experience"),
  portfolioLinks: text("portfolio_links").array(),
  certifications: text("certifications").array(),
  billingAddress: jsonb("billing_address"),
  availableHours: text("available_hours"),
  hourlyRate: numeric("hourly_rate", { precision: 10, scale: 2 }),
  bio: text("bio"),
  
  // Application status tracking
  teacherRole: text("teacher_role").default("teacher"),
  status: text("status").default("pending"), // pending, under_review, approved, rejected
  adminNotes: text("admin_notes"),
  reviewedBy: uuid("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// System settings table
export const systemSettings = pgTable("system_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value"),
  type: text("type").notNull().default("string"), // string, number, boolean, json
  description: text("description"),
  category: text("category").notNull().default("general"),
  isPublic: boolean("is_public").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// User payment methods table
export const paymentMethods = pgTable("payment_methods", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  stripePaymentMethodId: text("stripe_payment_method_id"), // Stripe payment method ID
  type: text("type").notNull(), // stripe_card, paypal, bank_transfer
  displayName: text("display_name").notNull(),
  lastFour: text("last_four"),
  expiryDate: text("expiry_date"),
  cardholderName: text("cardholder_name"),
  isDefault: boolean("is_default").default(false),
  isVerified: boolean("is_verified").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// User login sessions table
export const userLoginSessions = pgTable("user_login_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  sessionId: text("session_id").notNull().unique(),
  userAgent: text("user_agent"),
  ipAddress: text("ip_address"),
  expiresAt: timestamp("expires_at").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User privacy settings table
export const userPrivacySettings = pgTable("user_privacy_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull().unique(),
  profileVisibility: text("profile_visibility").default("public"), // public, private, friends
  allowMessages: boolean("allow_messages").default(true),
  allowNotifications: boolean("allow_notifications").default(true),
  dataProcessingConsent: boolean("data_processing_consent").default(false),
  marketingConsent: boolean("marketing_consent").default(false),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// User notification preferences table
export const userNotificationPreferences = pgTable("user_notification_preferences", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull().unique(),
  emailLessons: boolean("email_lessons").default(true),
  emailProgress: boolean("email_progress").default(true),
  emailMessages: boolean("email_messages").default(true),
  emailMarketing: boolean("email_marketing").default(false),
  smsLessons: boolean("sms_lessons").default(false),
  smsProgress: boolean("sms_progress").default(false),
  smsMessages: boolean("sms_messages").default(false),
  pushNotifications: boolean("push_notifications").default(true),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// User other settings table
export const userOtherSettings = pgTable("user_other_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull().unique(),
  gradeFlexibility: boolean("grade_flexibility").default(true),
  advancedAnalytics: boolean("advanced_analytics").default(true),
  prioritySupport: boolean("priority_support").default(true),
  offlineAccess: boolean("offline_access").default(false),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // info, warning, error, success
  isRead: boolean("is_read").default(false),
  actionUrl: text("action_url"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// API Keys table - For marketplace API access
export const apiKeys = pgTable("api_keys", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  keyHash: text("key_hash").notNull().unique(), // Hashed version of the API key
  keyPreview: text("key_preview").notNull(), // First 10 chars for display
  name: text("name").notNull(),
  tier: text("tier").notNull(), // basic, advanced
  permissions: text("permissions").array().default(sql`ARRAY[]::text[]`), // Array of permission strings
  lastUsedAt: timestamp("last_used_at"),
  expiresAt: timestamp("expires_at"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  revokedAt: timestamp("revoked_at"),
});

// Curricula table - Educational curriculum systems
export const curricula = pgTable("curricula", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`), // Keep existing varchar type
  country: text("country").notNull(), // Added as requested
  systemName: text("system_name").notNull(), // Added as requested
  effectiveFrom: timestamp("effective_from"), // Added as requested
  description: text("description"),
  // Keep existing fields for compatibility
  name: text("name").notNull(), // "Cambridge IGCSE", "Zimbabwe Education System", "American K-12"
  displayName: text("display_name").notNull(),
  systemType: curriculumTypeEnum("system_type").notNull(),
  countryCode: text("country_code"), // ISO country code (ZW, US, GB, etc.) - null for "All Systems"
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Country-Curriculum mapping table
export const countryCurricula = pgTable("country_curricula", {
  id: uuid("id").primaryKey().defaultRandom(),
  countryId: integer("country_id").references(() => countries.id).notNull(),
  curriculumId: varchar("curriculum_id").references(() => curricula.id).notNull(),
  isPrimary: boolean("is_primary").default(false), // Primary curriculum for this country
  createdAt: timestamp("created_at").defaultNow().notNull(),
});



// Course categories table
export const courseCategories = pgTable("course_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  displayName: text("display_name").notNull(),
  description: text("description"),
  color: text("color").default("gray"), // For UI theming
  iconUrl: text("icon_url"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Shop categories table - For product marketplace categories with role-based scoping
export const categoryScope = pgEnum("category_scope", ["global", "seller"]);

export const shopCategories = pgTable("shop_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  displayName: text("display_name").notNull(),
  description: text("description"),
  imageUrl: text("image_url"), // Category image/mockup
  backgroundColor: text("background_color").default("bg-gradient-to-br from-gray-100 to-gray-200"), // Tailwind classes
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  scope: categoryScope("scope").default("global").notNull(), // global (admin-created) or seller (teacher/freelancer-created)
  createdBy: uuid("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Category filters table - For product filtering within categories
export const filterTypeEnum = pgEnum("filter_type", ["range", "multiselect", "singleselect", "boolean"]);

export const categoryFilters = pgTable("category_filters", {
  id: uuid("id").primaryKey().defaultRandom(),
  categoryId: uuid("category_id").references(() => shopCategories.id).notNull(),
  name: text("name").notNull(), // e.g., "price_range", "difficulty_level"
  displayName: text("display_name").notNull(), // e.g., "Price Range", "Difficulty Level"
  type: filterTypeEnum("type").notNull(),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Category filter options table - For filter values (multiselect, singleselect, range options)
export const categoryFilterOptions = pgTable("category_filter_options", {
  id: uuid("id").primaryKey().defaultRandom(),
  filterId: uuid("filter_id").references(() => categoryFilters.id).notNull(),
  value: text("value").notNull(), // e.g., "0-50", "intermediate"
  displayName: text("display_name").notNull(), // e.g., "$0 - $50", "Intermediate"
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Courses table - For university/college students
export const courses = pgTable("courses", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description"),
  thumbnailUrl: text("thumbnail_url"),
  categoryId: uuid("category_id").references(() => courseCategories.id),
  pricingType: coursePricingTypeEnum("pricing_type").default("free"), // free, fixed_price, subscription
  price: numeric("price", { precision: 10, scale: 2 }),
  isActive: boolean("is_active").default(true),
  approvalStatus: approvalStatusEnum("approval_status").default("pending"),
  image: text("image"), // Added as requested
  gradeTier: gradeSubscriptionTierEnum("grade_tier"), // Which grade tier this course is for
  previewLessons: text("preview_lessons").array(), // Added as requested
  curriculumId: varchar("curriculum_id").references(() => curricula.id), // Added as requested (nullable)
  createdBy: uuid("created_by").references(() => users.id), // Admin/Teacher/Freelancer who created
  publisherName: text("publisher_name"), // Publisher information
  publisherBio: text("publisher_bio"), // Publisher bio/description
  publisherAvatar: text("publisher_avatar"), // Publisher profile image
  resourceUrls: text("resource_urls").array().default([]), // Additional resource URLs
  pdfUrls: text("pdf_urls").array().default([]), // PDF resource URLs
  videoUrls: text("video_urls").array().default([]), // Video URLs
  tags: text("tags").array().default([]), // Course tags for better searchability
  language: text("language").default("en"), // Course language
  avgRating: numeric("avg_rating", { precision: 3, scale: 2 }).default("0"), // Average rating
  totalReviews: integer("total_reviews").default(0), // Total number of reviews
  totalEnrollments: integer("total_enrollments").default(0), // Total enrollments
  certificationType: text("certificate_type").default("certificate"), // 'diploma' or 'certificate' - diploma for comprehensive courses, certificate for completion
  // Keep existing fields for compatibility
  courseCode: text("course_code"),
  credits: integer("credits").default(3),
  instructorId: uuid("instructor_id").references(() => users.id),
  duration: integer("duration").default(15),
  difficulty: text("difficulty").default("intermediate"), // beginner, intermediate, advanced
  prerequisites: text("prerequisites").array(),
  learningObjectives: text("learning_objectives").array(),
  enrollmentLimit: integer("enrollment_limit"),
  isFeatured: boolean("is_featured").default(false),
  featuredAt: timestamp("featured_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Course reviews table
export const courseReviews = pgTable("course_reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  courseId: uuid("course_id").references(() => courses.id).notNull(),
  studentId: uuid("student_id").references(() => users.id).notNull(),
  rating: integer("rating").notNull(), // 1-5 stars
  review: text("review"),
  isVerifiedPurchase: boolean("is_verified_purchase").default(false), // Verified purchase review
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  // Ensure one review per user per course
  userCourseUnique: unique().on(table.studentId, table.courseId),
}));

// Course comments table - discussion/comments on courses
export const courseComments = pgTable("course_comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  courseId: uuid("course_id").references(() => courses.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  comment: text("comment").notNull(),
  likesCount: integer("likes_count").default(0),
  repliesCount: integer("replies_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Course comment replies table - replies to comments
export const courseCommentReplies = pgTable("course_comment_replies", {
  id: uuid("id").primaryKey().defaultRandom(),
  commentId: uuid("comment_id").references(() => courseComments.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  reply: text("reply").notNull(),
  likesCount: integer("likes_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Course comment likes table
export const courseCommentLikes = pgTable("course_comment_likes", {
  id: uuid("id").primaryKey().defaultRandom(),
  commentId: uuid("comment_id").references(() => courseComments.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userCommentUnique: unique().on(table.commentId, table.userId),
}));

// Course comment reply likes table
export const courseCommentReplyLikes = pgTable("course_comment_reply_likes", {
  id: uuid("id").primaryKey().defaultRandom(),
  replyId: uuid("reply_id").references(() => courseCommentReplies.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userReplyUnique: unique().on(table.replyId, table.userId),
}));

// Types for course comments
export type CourseComment = typeof courseComments.$inferSelect;
export type InsertCourseComment = typeof courseComments.$inferInsert;
export type CourseCommentReply = typeof courseCommentReplies.$inferSelect;
export type InsertCourseCommentReply = typeof courseCommentReplies.$inferInsert;

// Modules table - Course modules
export const modules = pgTable("modules", {
  id: serial("id").primaryKey(),
  courseId: uuid("course_id").references(() => courses.id).notNull(),
  title: text("title").notNull(),
  orderNum: integer("order_num").notNull().default(1),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Lessons table - Individual lessons within modules
export const lessons = pgTable("lessons", {
  id: serial("id").primaryKey(), // Keep existing serial type
  moduleId: integer("module_id").references(() => modules.id).notNull(),
  title: text("title").notNull(),
  content: text("content"), // Rich text / HTML content
  videoUrl: text("video_url"), // YouTube embed URL
  orderNum: integer("order_num").notNull(),
  // Keep existing fields for compatibility
  categoryId: integer("category_id"),
  description: text("description"),
  level: integer("level").default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  courseId: uuid("course_id").references(() => courses.id),
  subjectId: uuid("subject_id"),
  images: text("images").array(),
  durationMinutes: integer("duration_minutes").default(30),
  order: integer("order").default(0),
  freePreviewFlag: boolean("free_preview_flag").default(false),
});

// Relations for modules and lessons
export const modulesRelations = relations(modules, ({ one, many }) => ({
  course: one(courses, { fields: [modules.courseId], references: [courses.id] }),
  lessons: many(lessons),
}));

export const lessonsRelations = relations(lessons, ({ one }) => ({
  module: one(modules, { fields: [lessons.moduleId], references: [modules.id] }),
  course: one(courses, { fields: [lessons.courseId], references: [courses.id] }),
}));

// Lesson Media table - Store images and files for lessons
export const lessonMedia = pgTable("lesson_media", {
  id: serial("id").primaryKey(),
  lessonId: integer("lesson_id").references(() => lessons.id).notNull(),
  type: text("type").notNull(), // 'image' or 'file'
  fileUrl: text("file_url").notNull(),
  originalName: text("original_name"),
  fileSize: integer("file_size"),
  mimeType: text("mime_type"),
  isCollapsible: boolean("is_collapsible").default(true), // Can this media be collapsed/expanded
  isVisibleByDefault: boolean("is_visible_by_default").default(true), // Is media shown or hidden by default
  displayOrder: integer("display_order").default(0), // Order of media within lesson
  caption: text("caption"), // Optional caption for the media
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Lesson Content Blocks table - For Alison/Shaw Academy style collapsible sections
export const lessonContentBlocks = pgTable("lesson_content_blocks", {
  id: serial("id").primaryKey(),
  lessonId: integer("lesson_id").references(() => lessons.id).notNull(),
  blockType: text("block_type").notNull(), // 'text', 'image', 'video', 'file', 'quiz', 'accordion'
  title: text("title"), // Section title (for accordion-style blocks)
  content: text("content"), // Text content or HTML
  mediaUrl: text("media_url"), // URL for image/video/file
  mediaType: text("media_type"), // 'image', 'video', 'pdf', 'document'
  isCollapsible: boolean("is_collapsible").default(false), // Can this block be collapsed
  isExpandedByDefault: boolean("is_expanded_by_default").default(true), // Default expanded state
  displayOrder: integer("display_order").notNull().default(0), // Order of blocks in lesson
  settings: jsonb("settings"), // Additional block-specific settings (gallery, lightbox, etc.)
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Quizzes table - Store quiz metadata for lessons (normalized structure)
export const quizzes = pgTable("quizzes", {
  id: serial("id").primaryKey(),
  lessonId: integer("lesson_id").references(() => lessons.id),
  topicId: integer("topic_id").references(() => topics.id),
  title: text("title").notNull(),
  description: text("description"),
  questions: jsonb("questions"), // DEPRECATED - Use quiz_questions table instead. Kept for backwards compatibility during migration.
  timeLimitMinutes: integer("time_limit_minutes"),
  passingScore: integer("passing_score").default(70),
  order: integer("order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_quizzes_lesson").on(table.lessonId),
  index("idx_quizzes_topic").on(table.topicId),
]);

// Quiz Questions table - Individual questions for quizzes (normalized structure)
export const quizQuestions = pgTable("quiz_questions", {
  id: serial("id").primaryKey(),
  quizId: integer("quiz_id").references(() => quizzes.id, { onDelete: "cascade" }).notNull(),
  questionText: text("question_text").notNull(),
  questionType: text("question_type").default("multiple_choice").notNull(), // 'multiple_choice', 'true_false', 'short_answer'
  explanation: text("explanation"), // Explanation shown after answering
  points: integer("points").default(1).notNull(), // Points for this question
  order: integer("order").default(0).notNull(), // Order within the quiz
  mediaUrl: text("media_url"), // Optional image/video for the question
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_quiz_questions_quiz").on(table.quizId),
  index("idx_quiz_questions_order").on(table.quizId, table.order),
]);

// Quiz Question Options table - Answer options for quiz questions
export const quizQuestionOptions = pgTable("quiz_question_options", {
  id: serial("id").primaryKey(),
  questionId: integer("question_id").references(() => quizQuestions.id, { onDelete: "cascade" }).notNull(),
  optionText: text("option_text").notNull(),
  isCorrect: boolean("is_correct").default(false).notNull(),
  order: integer("order").default(0).notNull(), // Display order (A, B, C, D)
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_quiz_options_question").on(table.questionId),
]);

// Topics table - Individual topics within lessons
export const topics = pgTable("topics", {
  id: serial("id").primaryKey(),
  lessonId: integer("lesson_id").references(() => lessons.id).notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  mediaType: text("media_type"), // 'image' or 'video' or null
  mediaUrl: text("media_url"), // URL to the media file
  order: integer("order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Scheduling system tables

// Teacher availability slots
export const teacherAvailability = pgTable("teacher_availability", {
  id: uuid("id").primaryKey().defaultRandom(),
  teacherId: uuid("teacher_id").references(() => users.id).notNull(),
  dayOfWeek: integer("day_of_week").notNull(), // 0-6 (Sunday-Saturday)
  startTime: text("start_time").notNull(), // "09:00"
  endTime: text("end_time").notNull(), // "17:00"
  timeZone: text("time_zone").default("UTC"),
  isRecurring: boolean("is_recurring").default(true),
  specificDate: timestamp("specific_date"), // For one-time availability
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Appointments/bookings - matches actual database structure
export const appointments = pgTable("appointments", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  teacherId: uuid("teacher_id").references(() => users.id),
  studentId: uuid("student_id").references(() => users.id),
  adminId: uuid("admin_id").references(() => users.id),
  freelancerId: uuid("freelancer_id").references(() => users.id),
  requesterId: uuid("requester_id").references(() => users.id).notNull(),
  status: text("status").notNull(), // scheduled, confirmed, completed, cancelled, no_show
  type: text("type").notNull(), // virtual, in_person, etc.
  subject: text("subject"),
  meetingUrl: text("meeting_url"),
  location: text("location"),
  notes: text("notes"),
  reminderSent: boolean("reminder_sent"),
  cancelledBy: uuid("cancelled_by").references(() => users.id),
  cancellationReason: text("cancellation_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Schedule templates (for recurring schedules)
export const scheduleTemplates = pgTable("schedule_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  teacherId: uuid("teacher_id").references(() => users.id).notNull(),
  name: text("name").notNull(), // "Weekly Math Tutoring"
  description: text("description"),
  duration: integer("duration_minutes").default(60),
  price: numeric("price", { precision: 10, scale: 2 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Banner content table - Admin-editable announcements

// Course enrollments
export const courseEnrollments = pgTable("course_enrollments", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  courseId: uuid("course_id").references(() => courses.id).notNull(),
  enrolledAt: timestamp("enrolled_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  progress: integer("progress").default(0),
  grade: text("grade"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Course purchases - Track paid course purchases
export const coursePurchases = pgTable("course_purchases", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  courseId: uuid("course_id").references(() => courses.id).notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("USD").notNull(),
  paymentIntentId: text("payment_intent_id"), // Payment intent/transaction ID
  paymentMethod: text("payment_method"), // stripe, paypal, dodopay, vodapay, etc.
  paymentStatus: text("payment_status").default("pending").notNull(), // pending, completed, failed, refunded
  purchasedAt: timestamp("purchased_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userCourseUnique: unique().on(table.userId, table.courseId),
}));

// Student progress table - Track progress on courses and content
export const studentProgress = pgTable("student_progress", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  courseId: uuid("course_id").references(() => courses.id),
  lessonId: integer("lesson_id").references(() => lessons.id),
  progressPercentage: integer("progress_percentage").default(0),
  score: integer("score"), // For quizzes and tests
  completedAt: timestamp("completed_at"),
  timeSpent: integer("time_spent_minutes"),
  lastAccessedAt: timestamp("last_accessed_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Lesson Progress table - Specific progress tracking as requested
export const lessonProgress = pgTable("lesson_progress", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  lessonId: integer("lesson_id").references(() => lessons.id).notNull(),
  courseOrSubjectId: uuid("course_or_subject_id").notNull(), // Can reference either course or subject
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  progressPercent: integer("progress_percent").default(0),
  quizPassed: boolean("quiz_passed"),
  score: integer("score"),
  lastAccessedAt: timestamp("last_accessed_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Video Meetings System - Teacher-to-Students video conferencing

// Meeting status and mode enums
export const meetingStatusEnum = pgEnum("meeting_status", ["scheduled", "live", "completed", "cancelled"]);
export const meetingModeEnum = pgEnum("meeting_mode", ["interactive", "broadcast"]); // interactive: 50 max with video, broadcast: unlimited viewers

// Meetings table - Video meetings created by teachers
export const meetings = pgTable("meetings", {
  id: uuid("id").primaryKey().defaultRandom(),
  teacherId: uuid("teacher_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  lessonDescription: text("lesson_description").notNull(), // Reason/lesson for the meeting
  scheduledTime: timestamp("scheduled_time").notNull(),
  duration: integer("duration_minutes").notNull().default(45), // Duration in minutes
  endTime: timestamp("end_time").notNull(), // Calculated: scheduledTime + duration
  targetGrades: text("target_grades").array().notNull(), // Array of grade levels: ['5', '6', '7']
  mode: meetingModeEnum("mode").notNull().default("interactive"), // interactive or broadcast
  maxParticipants: integer("max_participants").default(50), // Max for interactive mode
  agoraChannel: text("agora_channel").notNull(), // Unique Agora channel name
  agoraAppId: text("agora_app_id"), // Agora App ID (stored for reference)
  status: meetingStatusEnum("status").notNull().default("scheduled"),
  actualStartTime: timestamp("actual_start_time"), // When teacher actually started
  actualEndTime: timestamp("actual_end_time"), // When meeting actually ended
  participantCount: integer("participant_count").default(0), // Current participant count
  notificationsSent: boolean("notifications_sent").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("meetings_teacher_idx").on(table.teacherId),
  index("meetings_scheduled_time_idx").on(table.scheduledTime),
  index("meetings_status_idx").on(table.status),
  index("meetings_agora_channel_idx").on(table.agoraChannel),
]);

// Meeting participants - Track who joined the meeting
export const meetingParticipants = pgTable("meeting_participants", {
  id: uuid("id").primaryKey().defaultRandom(),
  meetingId: uuid("meeting_id").references(() => meetings.id).notNull(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  role: text("role").notNull().default("student"), // teacher, student
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
  leftAt: timestamp("left_at"),
  sessionDuration: integer("duration"), // Time spent in meeting (renamed from duration to avoid conflict with meetings.duration)
  hasVideo: boolean("has_video").default(false), // Whether they have video access
  hasAudio: boolean("has_audio").default(false), // Whether they have audio access
  isViewOnly: boolean("is_view_only").default(false), // True if over capacity limit
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  unique("meeting_participant_unique").on(table.meetingId, table.userId),
  index("meeting_participants_meeting_idx").on(table.meetingId),
  index("meeting_participants_user_idx").on(table.userId),
]);

// Meeting chat messages - Live chat during video meetings
export const meetingChatMessages = pgTable("meeting_chat_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  meetingId: uuid("meeting_id").references(() => meetings.id).notNull(),
  senderId: uuid("sender_id").references(() => users.id).notNull(),
  senderName: text("sender_name").notNull(), // Cached for display
  senderRole: text("sender_role").notNull(), // teacher, student
  message: text("message").notNull(),
  messageType: text("message_type").default("text"), // text, system, announcement
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("meeting_chat_meeting_idx").on(table.meetingId),
  index("meeting_chat_created_idx").on(table.createdAt),
]);

// Meeting notifications - Track notification delivery
export const meetingNotifications = pgTable("meeting_notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  meetingId: uuid("meeting_id").references(() => meetings.id).notNull(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  notificationType: text("notification_type").notNull(), // email_15min, sms_5min, in_app
  scheduledFor: timestamp("scheduled_for").notNull(), // When to send
  sentAt: timestamp("sent_at"), // When actually sent (null if pending)
  status: text("status").notNull().default("pending"), // pending, sent, failed
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("meeting_notifications_meeting_idx").on(table.meetingId),
  index("meeting_notifications_user_idx").on(table.userId),
  index("meeting_notifications_scheduled_idx").on(table.scheduledFor),
  index("meeting_notifications_status_idx").on(table.status),
]);

// Meeting relations
export const meetingsRelations = relations(meetings, ({ one, many }) => ({
  teacher: one(users, { fields: [meetings.teacherId], references: [users.id] }),
  participants: many(meetingParticipants),
  notifications: many(meetingNotifications),
  chatMessages: many(meetingChatMessages),
}));

export const meetingParticipantsRelations = relations(meetingParticipants, ({ one }) => ({
  meeting: one(meetings, { fields: [meetingParticipants.meetingId], references: [meetings.id] }),
  user: one(users, { fields: [meetingParticipants.userId], references: [users.id] }),
}));

export const meetingNotificationsRelations = relations(meetingNotifications, ({ one }) => ({
  meeting: one(meetings, { fields: [meetingNotifications.meetingId], references: [meetings.id] }),
  user: one(users, { fields: [meetingNotifications.userId], references: [users.id] }),
}));

export const meetingChatMessagesRelations = relations(meetingChatMessages, ({ one }) => ({
  meeting: one(meetings, { fields: [meetingChatMessages.meetingId], references: [meetings.id] }),
  sender: one(users, { fields: [meetingChatMessages.senderId], references: [users.id] }),
}));

// Users relations (for profile relation needed by meeting notifications)
export const usersRelations = relations(users, ({ one }) => ({
  profile: one(profiles, { fields: [users.id], references: [profiles.userId] }),
}));

// Certificates table - Course completion certificates
export const certificates = pgTable("certificates", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  courseId: uuid("course_id").references(() => courses.id).notNull(),
  studentName: text("student_name").notNull(),
  studentEmail: text("student_email"), // Email for Certifier
  courseTitle: text("course_title").notNull(),
  courseDescription: text("course_description"),
  verificationCode: text("verification_code").notNull().unique(), // Unique code for verification
  certificateUrl: text("certificate_url"), // URL to the generated certificate PDF
  previewImageUrl: text("preview_image_url"), // Certifier shareable preview image URL
  completionDate: timestamp("completion_date").notNull(),
  finalScore: integer("final_score"), // Final quiz/assessment score
  instructorName: text("instructor_name"), // Instructor who taught the course
  certificateType: text("certificate_type").default("certificate"), // 'diploma' or 'certificate'
  issueDate: timestamp("issue_date").defaultNow().notNull(),
  isRevoked: boolean("is_revoked").default(false), // Can revoke certificates if needed
  revokedAt: timestamp("revoked_at"),
  revokedReason: text("revoked_reason"),
  certifierId: text("certifier_id"), // Certifier API credential ID
  certifierPublicId: text("certifier_public_id"), // Certifier public ID for digital wallet
  certifierGroupId: text("certifier_group_id"), // Certifier group ID used
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_certificates_user").on(table.userId),
  index("idx_certificates_course").on(table.courseId),
  index("idx_certificates_verification").on(table.verificationCode),
]);

// Certificate purchases table - Track certificate payments
export const certificatePurchases = pgTable("certificate_purchases", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  certificateId: uuid("certificate_id").references(() => certificates.id), // Set after certificate generation
  courseId: uuid("course_id").references(() => courses.id).notNull(),
  certificateType: text("certificate_type").notNull(), // 'soft_copy' or 'hard_copy'
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  paymentIntentId: text("payment_intent_id").notNull().unique(),
  paymentStatus: text("payment_status").default("pending"), // pending, completed, failed
  stripeCustomerId: text("stripe_customer_id"),
  shippingAddress: jsonb("shipping_address"), // For hard copy: { name, address, city, state, postalCode, country }
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_certificate_purchases_user").on(table.userId),
  index("idx_certificate_purchases_course").on(table.courseId),
  index("idx_certificate_purchases_payment_intent").on(table.paymentIntentId),
]);

// Contact Messages table - Messages from the contact form
export const contactMessages = pgTable("contact_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_contact_messages_created").on(table.createdAt),
  index("idx_contact_messages_read").on(table.isRead),
]);

// Tasks table - Student tasks and assignments
export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  subject: text("subject").notNull(),
  dueDate: timestamp("due_date").notNull(),
  status: taskStatusEnum("status").default("todo").notNull(),
  progress: integer("progress").default(0),
  commentsCount: integer("comments_count").default(0),
  priority: text("priority").default("medium"), // low, medium, high
  tags: text("tags").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Assignments System Tables
export const assignmentStatusEnum = pgEnum("assignment_status", ["draft", "published", "closed"]);
export const submissionStatusEnum = pgEnum("submission_status", ["pending", "submitted", "graded", "resubmit"]);

// Assignments table - Teacher-created assignments
export const assignments = pgTable("assignments", {
  id: uuid("id").primaryKey().defaultRandom(),
  teacherId: uuid("teacher_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  instructions: text("instructions"), // Detailed instructions for students
  dueDate: timestamp("due_date").notNull(),
  attachments: jsonb("attachments"), // Array of file URLs and metadata
  questions: jsonb("questions"), // Array of quiz questions with options and correct answers
  targetType: text("target_type").notNull().default("all"), // "all", "class", "individual"
  targetStudents: jsonb("target_students"), // Array of student IDs if individual targeting
  subject: text("subject").notNull(),
  grade: integer("grade").notNull(), // Grade level filter (e.g., 7, 8, 9, etc.)
  maxGrade: integer("max_grade").default(100),
  allowLateSubmission: boolean("allow_late_submission").default(false),
  allowResubmission: boolean("allow_resubmission").default(false),
  status: assignmentStatusEnum("status").default("draft").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Assignment Submissions table - Student submissions to assignments
export const assignmentSubmissions = pgTable("assignment_submissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  assignmentId: uuid("assignment_id").references(() => assignments.id).notNull(),
  studentId: uuid("student_id").references(() => users.id).notNull(),
  fileUrls: jsonb("file_urls"), // Array of uploaded file URLs
  textContent: text("text_content"), // Written response/notes
  questionAnswers: jsonb("question_answers"), // Object mapping question IDs to student answers
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  grade: text("grade"), // Score/letter/percentage
  numericGrade: integer("numeric_grade"), // Numeric grade for calculations
  feedback: text("feedback"), // Teacher's written feedback
  status: submissionStatusEnum("status").default("submitted").notNull(),
  isLate: boolean("is_late").default(false),
  resubmissionCount: integer("resubmission_count").default(0),
  gradedAt: timestamp("graded_at"),
  gradedBy: uuid("graded_by").references(() => users.id), // Which teacher graded it
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  // Unique constraint: one active submission per student per assignment
  studentAssignmentUnique: unique().on(table.assignmentId, table.studentId),
  // Performance indexes
  assignmentIdx: index("idx_submissions_assignment").on(table.assignmentId),
  studentIdx: index("idx_submissions_student").on(table.studentId),
  statusIdx: index("idx_submissions_status").on(table.status),
}));

// Assignment Comments table - Comments and feedback threads
export const assignmentComments = pgTable("assignment_comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  submissionId: uuid("submission_id").references(() => assignmentSubmissions.id).notNull(),
  authorId: uuid("author_id").references(() => users.id).notNull(), // Teacher or student
  content: text("content").notNull(),
  isPrivate: boolean("is_private").default(false), // Only visible to teacher and student
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Study Notes table - Student notes for subjects
export const studyNotes = pgTable("study_notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  subject: text("subject").notNull(),
  color: text("color").default("#42fa76"), // Subject-specific color
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Chat thread status enum for freelancer-customer conversations - TEMPORARILY COMMENTED OUT FOR DB MIGRATION
// export const chatThreadStatusEnum = pgEnum("chat_thread_status", ["open", "closed"]);

// Chat participant role uses existing app_role enum

// Chat Threads table - Freelancer-customer conversation threads
export const chatThreads = pgTable("chat_threads", {
  id: uuid("id").primaryKey().defaultRandom(),
  freelancerId: uuid("freelancer_id").references(() => users.id).notNull(),
  customerId: uuid("customer_id").references(() => users.id).notNull(),
  projectId: uuid("project_id").references(() => projects.id), // Optional project context
  status: text("status").default("open").notNull(), // Temporary: using text instead of enum to avoid migration issues
  lastMessageAt: timestamp("last_message_at"),
  lastMessagePreview: text("last_message_preview"), // Preview text for thread list
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  // Unique constraint to prevent duplicate threads for same freelancer+customer+project
  uniqueThreadIdx: unique("unique_chat_thread").on(table.freelancerId, table.customerId, table.projectId),
  // Performance indexes
  freelancerIdx: index("idx_chat_threads_freelancer").on(table.freelancerId),
  customerIdx: index("idx_chat_threads_customer").on(table.customerId),
  statusIdx: index("idx_chat_threads_status").on(table.status),
  lastMessageAtIdx: index("idx_chat_threads_last_message_at").on(table.lastMessageAt.desc()),
}));

// Chat Participants table - Track who can participate in threads (including admin join)
export const chatParticipants = pgTable("chat_participants", {
  id: uuid("id").primaryKey().defaultRandom(),
  threadId: uuid("thread_id").references(() => chatThreads.id).notNull(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  role: appRoleEnum("role").notNull(), // 'freelancer', 'customer', 'admin'
  muted: boolean("muted").default(false),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
}, (table) => ({
  // Unique constraint to prevent duplicate participants in same thread
  uniqueParticipantIdx: unique("unique_chat_participant").on(table.threadId, table.userId),
  // Composite index for thread-user lookups
  threadUserIdx: index("idx_chat_participants_thread_user").on(table.threadId, table.userId),
  userIdx: index("idx_chat_participants_user").on(table.userId),
}));

// Messages table - Clean structure for real-time messaging
export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  senderId: uuid("sender_id").notNull().references(() => profiles.id), // UUID reference to profiles.id
  receiverId: uuid("receiver_id").references(() => profiles.id), // UUID reference to profiles.id (nullable for group chat)
  groupId: uuid("group_id").references(() => communityGroups.id), // For group chat (nullable)
  threadId: uuid("thread_id").references(() => chatThreads.id), // For freelancer-customer chat threads (nullable)
  content: text("content"), // Text messages (nullable)
  messageType: text("message_type").default("text"), // text, voice, image, video, document
  fileUrl: text("file_url"), // Spaceship file storage URL (nullable)
  fileType: text("file_type"), // image, video, audio, doc, location (nullable)
  isRead: boolean("is_read").default(false), // Whether message has been read
  deliveredAt: timestamp("delivered_at"), // When message was delivered
  readAt: timestamp("read_at"), // When message was read
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  // Performance indexes for messaging
  senderReceiverIdx: index("idx_messages_sender_receiver").on(table.senderId, table.receiverId),
  receiverCreatedAtIdx: index("idx_messages_receiver_created_at").on(table.receiverId, table.createdAt.desc()),
  senderCreatedAtIdx: index("idx_messages_sender_created_at").on(table.senderId, table.createdAt.desc()),
  groupCreatedAtIdx: index("idx_messages_group_created_at").on(table.groupId, table.createdAt.desc()),
  createdAtIdx: index("idx_messages_created_at").on(table.createdAt.desc()),
  unreadIdx: index("idx_messages_unread").on(table.receiverId, table.isRead, table.readAt),
  threadCreatedAtIdx: index("idx_messages_thread_created_at").on(table.threadId, table.createdAt.desc()),
}));

// Support Agents table - Enhanced for profile management
export const supportAgents = pgTable("support_agents", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  avatarUrl: text("avatar_url"),
  role: text("role"), // Optional role/description like "Senior Support Agent"
  description: text("description"), // e.g., "African Woman", "Indian Man", etc.
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0), // For rotation order
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Support Chat Sessions table - Track guest sessions and assigned agents
export const supportChatSessions = pgTable("support_chat_sessions", {
  id: serial("id").primaryKey(),
  guestId: varchar("guest_id", { length: 50 }).notNull().unique(), // unique visitor ID
  assignedAgentId: integer("assigned_agent_id").references(() => supportAgents.id),
  adminTakenOver: boolean("admin_taken_over").default(false),
  adminUserId: uuid("admin_user_id").references(() => users.id), // real admin who took over
  userLocation: jsonb("user_location"), // User's location data
  userDevice: jsonb("user_device"), // User's device info
  firstMessageSent: boolean("first_message_sent").default(false),
  welcomeMessageSent: boolean("welcome_message_sent").default(false),
  isActive: boolean("is_active").default(true),
  sessionStartedAt: timestamp("session_started_at").defaultNow().notNull(),
  lastActivityAt: timestamp("last_activity_at").defaultNow().notNull(),
}, (table) => ({
  guestIdIdx: index("idx_support_sessions_guest_id").on(table.guestId),
  agentIdIdx: index("idx_support_sessions_agent_id").on(table.assignedAgentId),
  adminIdIdx: index("idx_support_sessions_admin_id").on(table.adminUserId),
}));

// Help Chat Messages table - Enhanced for visitor support chat with admin
export const helpChatMessages = pgTable("help_chat_messages", {
  id: serial("id").primaryKey(),
  guestId: varchar("guest_id", { length: 50 }).notNull(), // unique visitor ID
  receiverId: uuid("receiver_id").references(() => users.id), // admin ID
  message: text("message").notNull(),
  sender: helpChatSenderEnum("sender").notNull(),
  agentId: integer("agent_id").references(() => supportAgents.id), // Support agent handling the chat
  isAutoMessage: boolean("is_auto_message").default(false), // For automatic welcome messages
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  // Performance indexes for help chat
  guestIdIdx: index("idx_help_chat_guest_id").on(table.guestId),
  receiverIdIdx: index("idx_help_chat_receiver_id").on(table.receiverId),
  createdAtIdx: index("idx_help_chat_created_at").on(table.createdAt.desc()),
  guestCreatedAtIdx: index("idx_help_chat_guest_created_at").on(table.guestId, table.createdAt.desc()),
  agentIdIdx: index("idx_help_chat_agent_id").on(table.agentId),
}));

// Help Chat Settings table - Store assignment mode and other chat settings
export const helpChatSettings = pgTable("help_chat_settings", {
  id: serial("id").primaryKey(),
  settingKey: text("setting_key").notNull().unique(),
  settingValue: text("setting_value").notNull(),
  description: text("description"),
  updatedBy: uuid("updated_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Quick Responses table - Admin-defined quick response templates
export const quickResponses = pgTable("quick_responses", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(), // Short title for admin reference
  content: text("content").notNull(), // The actual response text
  shortcut: text("shortcut"), // Optional keyboard shortcut (e.g., "welcome", "hours")
  category: text("category").default("general"), // Organize responses by category
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Friendships table - Student to student friend requests and connections
export const friendships = pgTable("friendships", {
  id: uuid("id").primaryKey().defaultRandom(),
  requesterId: uuid("requester_id").references(() => users.id).notNull(),
  receiverId: uuid("receiver_id").references(() => users.id).notNull(),
  status: text("status").notNull().default("pending"), // pending, accepted, blocked, rejected
  requestMessage: text("request_message"), // Optional message when sending friend request
  connectionType: text("connection_type").default("friend"), // friend, study_buddy, mentor
  commonSubjects: text("common_subjects").array(), // Shared subjects for better matching
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  // Unique constraint: one friendship per requester-receiver pair
  requesterReceiverUnique: unique().on(table.requesterId, table.receiverId)
}));

// Student discovery preferences table
export const studentDiscoveryPreferences = pgTable("student_discovery_preferences", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull().unique(),
  isDiscoverable: boolean("is_discoverable").default(true),
  showGrade: boolean("show_grade").default(true),
  showCountry: boolean("show_country").default(true),
  showSubjects: boolean("show_subjects").default(true),
  preferredConnectionTypes: text("preferred_connection_types").array().default(['friend']),
  subjectsOfInterest: text("subjects_of_interest").array(),
  studyGoals: text("study_goals"),
  maxConnections: integer("max_connections").default(100),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Group memberships table - Members of community groups
export const groupMemberships = pgTable("group_memberships", {
  id: uuid("id").primaryKey().defaultRandom(),
  groupId: uuid("group_id").references(() => communityGroups.id).notNull(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  role: text("role").default("member"), // member, moderator, admin
  status: text("status").default("active"), // active, removed, banned
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Premium messages table - Premium messaging between students
export const premiumMessages = pgTable("premium_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  senderId: uuid("sender_id").references(() => users.id).notNull(),
  receiverId: uuid("receiver_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  messageType: text("message_type").default("text"), // text, voice, image, video, document
  fileMetadata: jsonb("file_metadata"), // {url: string, fileName: string, fileSize: number, mimeType: string}
  status: text("status").default("pending"), // pending, approved, rejected, delivered
  approvedBy: uuid("approved_by").references(() => users.id), // Admin who approved
  approvedAt: timestamp("approved_at"),
  rejectionReason: text("rejection_reason"),
  sentAt: timestamp("sent_at").defaultNow().notNull(),
  deliveredAt: timestamp("delivered_at"),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});


// Community Groups table - User-created groups for focused discussions  
export const communityGroups = pgTable("community_groups", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  createdBy: uuid("created_by").references(() => users.id).notNull(),
  memberCount: integer("member_count").default(0),
  membersCount: integer("members_count").default(0), // Added as requested
  status: text("status").default("pending"), // pending, approved, rejected, active, suspended
  approvedBy: uuid("approved_by").references(() => users.id), // Admin who approved the group
  approvedAt: timestamp("approved_at"),
  rejectionReason: text("rejection_reason"),
  isPrivate: boolean("is_private").default(false), // Private groups require invitation
  maxMembers: integer("max_members").default(100000), // Maximum number of members (100K)
  tags: text("tags").array(), // Tags for categorizing groups
  avatarUrl: text("avatar_url"), // Group profile picture
  postCount: integer("post_count").default(0),
  isPublic: boolean("is_public").default(true),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Groups table alias for user requirements
export const groups = communityGroups;

// Community Group Members table - Track group memberships
export const communityGroupMembers = pgTable("community_group_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  groupId: uuid("group_id").references(() => communityGroups.id).notNull(),
  userId: uuid("user_id").notNull(), // No foreign key constraint for now
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
  role: text("role").default("member"), // member, moderator, admin
});

// Community Posts table - Discussion posts for students (matches existing database)
export const communityPosts = pgTable("community_posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  authorId: varchar("author_id").notNull(), // Matches existing database
  groupId: uuid("group_id").references(() => communityGroups.id), // Optional group association
  title: varchar("title").notNull(),
  content: text("content").notNull(),
  body: text("body"), // Additional content field found in database
  subject: varchar("subject"), // Related subject if any (Mathematics, Science, etc.)
  grade: integer("grade"), // Target grade level
  topicType: text("topic_type").default("discussion"), // discussion, question, study_group, announcement
  tags: text("tags").array(),
  likes: integer("likes").default(0),
  upvotes: integer("upvotes").default(0), // Found in existing database
  downvotes: integer("downvotes").default(0), // Found in existing database
  isAnonymous: boolean("is_anonymous").default(false),
  isModerated: boolean("is_moderated").default(false),
  moderatorId: varchar("moderator_id"), // Matches existing database
  isTest: boolean("is_test").default(false), // Found in existing database
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Keep alias for backward compatibility
export const communityTopics = communityPosts;

// Community Reactions table - Emoji reactions for posts and replies (acts as Likes system)
export const communityReactions = pgTable("community_reactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").notNull(), // Matches existing database
  targetType: text("target_type").notNull(), // post, reply
  targetId: uuid("target_id").notNull(),
  emoji: text("emoji").notNull(), // 👍, ❤️, 😂, 😮, 😢, 😡
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  // Unique constraint: one reaction per user per target
  userTargetUnique: unique().on(table.userId, table.targetId, table.targetType)
}));

// Community Replies table (comments on topics)
export const communityReplies = pgTable("community_replies", {
  id: uuid("id").primaryKey().defaultRandom(),
  postId: uuid("post_id").references(() => communityPosts.id).notNull(),
  authorId: varchar("author_id").notNull(), // Matches existing database
  content: text("content").notNull(),
  upvotes: integer("upvotes").default(0),
  downvotes: integer("downvotes").default(0),
  isAnonymous: boolean("is_anonymous").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Announcements table - Real-time announcements from teachers/admins to students
export const announcements = pgTable("announcements", {
  id: uuid("id").primaryKey().defaultRandom(),
  teacherId: uuid("teacher_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  priority: text("priority").default("normal"), // low, normal, high, urgent
  targetAudience: text("target_audience").default("all"), // all, grade_specific, subject_specific
  targetGrade: integer("target_grade"), // Single grade number
  targetStudentIds: text("target_student_ids").array(), // Array of student IDs
  isActive: boolean("is_active").default(true),
  expiresAt: timestamp("expires_at"), // Optional expiry
  readBy: text("read_by").array().default([]), // Array of user IDs who have read - for compatibility
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Announcement reads table - Track which students have read announcements
export const announcementReads = pgTable("announcement_reads", {
  id: uuid("id").primaryKey().defaultRandom(),
  announcementId: uuid("announcement_id").references(() => announcements.id).notNull(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  readAt: timestamp("read_at").defaultNow().notNull(),
});

// Moderation Logs table - Track admin moderation actions
export const moderationLogs = pgTable("moderation_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  moderatorId: uuid("moderator_id").references(() => users.id).notNull(),
  actionType: text("action_type").notNull(), // message_delete, message_flag, user_warn, user_suspend
  targetType: text("target_type").notNull(), // message, user, announcement
  targetId: uuid("target_id").notNull(),
  reason: text("reason"),
  details: jsonb("details"), // Additional context about the action
  originalContent: text("original_content"), // Store original content before deletion/modification
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Teacher-Student Assignments table - Track which students are assigned to which teachers
export const teacherStudentAssignments = pgTable("teacher_student_assignments", {
  id: uuid("id").primaryKey().defaultRandom(),
  teacherId: uuid("teacher_id").references(() => users.id).notNull(),
  studentId: uuid("student_id").references(() => users.id).notNull(),
  assignedAt: timestamp("assigned_at").defaultNow().notNull(),
  assignedBy: uuid("assigned_by").references(() => users.id), // Admin who made the assignment
  isActive: boolean("is_active").default(true),
  notes: text("notes"), // Any notes about the assignment
});

// Pricing Plans table - Updated to support grade-based subscriptions while maintaining existing structure
export const pricingPlans = pgTable("pricing_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  displayName: text("display_name"),
  description: text("description"),
  priceMonthly: numeric("price_monthly", { precision: 10, scale: 2 }),
  priceYearly: numeric("price_yearly", { precision: 10, scale: 2 }),
  currency: text("currency").default("USD"),
  billingPeriod: text("billing_period").default("monthly"),
  features: text("features").array(),
  limitations: jsonb("limitations"),
  maxSubjects: integer("max_subjects"),
  maxMessagesPerDay: integer("max_messages_per_day"),
  maxCommunityPostsPerDay: integer("max_community_posts_per_day"),
  isActive: boolean("is_active").default(true),
  isPopular: boolean("is_popular").default(false),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  // New fields for grade-based system (nullable for backward compatibility)
  gradeTier: gradeSubscriptionTierEnum("grade_tier"), // elementary, high_school, college_university
  gradeRange: text("grade_range"), // "1-7", "8-12", "College & University"
  benefits: text("benefits").array(), // Key benefits for this tier
});

// Removed friendRequests table - using friendships table instead to avoid conflicts

// User Subscriptions table - updated to match existing database structure
export const userSubscriptions = pgTable("user_subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(), // Keep as text to match existing structure
  planId: uuid("plan_id").references(() => pricingPlans.id).notNull(),
  subscriptionStatus: approvalStatusEnum("subscription_status"), // Match existing enum
  stripeSubscriptionId: text("stripe_subscription_id"),
  paymentMethod: text("payment_method"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Manual Plan Assignments table - Track admin manual plan assignments (cash payments, error compensation, etc.)
export const manualPlanAssignmentReasonEnum = pgEnum("manual_plan_assignment_reason", ["cash_payment", "error_compensation", "promotional", "trial_extension", "other"]);

export const manualPlanAssignments = pgTable("manual_plan_assignments", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  assignedByAdminId: uuid("assigned_by_admin_id").references(() => users.id).notNull(),
  subscriptionTier: text("subscription_tier"), // Student tiers: elementary, high_school, college_university; Shop tiers: free, creator, pro, business
  freelancerPlanId: text("freelancer_plan_id"), // planId from freelancerPricingPlans (for freelancers/teachers)
  reason: manualPlanAssignmentReasonEnum("reason").notNull(),
  notes: text("notes"), // Additional notes about the assignment
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  duration: text("duration"), // e.g., "1 month", "3 months", "6 months", "1 year", "custom"
  previousPlan: text("previous_plan"), // What plan the user had before (student/shop tier)
  previousFreelancerPlan: text("previous_freelancer_plan"), // What plan the freelancer had before
  previousExpiry: timestamp("previous_expiry"), // When the previous plan expired
  isActive: boolean("is_active").default(true), // Whether this assignment is currently active
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("idx_manual_plan_assignments_user").on(table.userId),
  adminIdx: index("idx_manual_plan_assignments_admin").on(table.assignedByAdminId),
  activeIdx: index("idx_manual_plan_assignments_active").on(table.isActive),
  createdAtIdx: index("idx_manual_plan_assignments_created_at").on(table.createdAt.desc()),
}));

// Payments table - Track individual payment transactions
export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  planType: text("plan_type"), // Added as requested
  provider: text("provider").default("Stripe"), // Added as requested (Stripe)
  providerId: text("provider_id"), // Added as requested
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("USD").notNull(),
  status: text("status").notNull(), // succeeded, failed, pending, refunded
  // Keep existing fields for compatibility
  subscriptionId: uuid("subscription_id").references(() => userSubscriptions.id),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  stripeChargeId: text("stripe_charge_id"),
  description: text("description"),
  paymentMethod: text("payment_method"), // card, bank_transfer, etc
  receiptUrl: text("receipt_url"),
  refundedAmount: numeric("refunded_amount", { precision: 10, scale: 2 }).default("0"),
  metadata: jsonb("metadata"), // Additional payment details
  processedAt: timestamp("processed_at"),
  failureReason: text("failure_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Projects table - Freelancer projects with client relationships
export const projectStatusEnum = pgEnum("freelancer_project_status", ["draft", "active", "pending", "in_progress", "waiting_review", "completed", "cancelled"]);
export const projectPriorityEnum = pgEnum("freelancer_project_priority", ["low", "medium", "high", "urgent"]);

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  instructions: text("instructions"), // Detailed project instructions
  clientId: uuid("client_id").references(() => users.id).notNull(), // Project client
  freelancerId: uuid("freelancer_id").references(() => users.id).notNull(), // Assigned freelancer
  status: projectStatusEnum("status").default("draft").notNull(),
  priority: projectPriorityEnum("priority").default("medium").notNull(),
  budget: numeric("budget", { precision: 10, scale: 2 }), // Project budget
  currency: text("currency").default("USD"),
  deadline: timestamp("deadline"),
  startDate: timestamp("start_date"),
  completedAt: timestamp("completed_at"),
  milestones: jsonb("milestones"), // Array of milestone objects
  deliverables: jsonb("deliverables"), // Array of deliverable file URLs
  requirements: text("requirements").array(), // Array of requirements
  tags: text("tags").array(), // Project tags
  attachments: jsonb("attachments"), // Client-provided attachments
  progress: integer("progress").default(0), // Progress percentage (0-100)
  estimatedHours: integer("estimated_hours"), // Estimated work hours
  actualHours: integer("actual_hours").default(0), // Actual hours worked
  isUrgent: boolean("is_urgent").default(false),
  clientNotes: text("client_notes"), // Notes from client
  freelancerNotes: text("freelancer_notes"), // Notes from freelancer
  feedbackRating: integer("feedback_rating"), // 1-5 star rating from client
  feedbackComment: text("feedback_comment"), // Client feedback comment
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  // Performance indexes
  freelancerIdx: index("idx_projects_freelancer").on(table.freelancerId),
  clientIdx: index("idx_projects_client").on(table.clientId),
  statusIdx: index("idx_projects_status").on(table.status),
  deadlineIdx: index("idx_projects_deadline").on(table.deadline),
  createdAtIdx: index("idx_projects_created_at").on(table.createdAt.desc()),
}));

// Project milestones table - Track project milestones separately
export const projectMilestones = pgTable("project_milestones", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").references(() => projects.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  deadline: timestamp("deadline"),
  status: text("status").default("pending"), // pending, in_progress, completed, overdue
  completedAt: timestamp("completed_at"),
  order: integer("order").default(0), // Order of milestone
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  projectIdx: index("idx_project_milestones_project").on(table.projectId),
  statusIdx: index("idx_project_milestones_status").on(table.status),
}));

// ============================================
// FREELANCER PORTFOLIO & SHOP SYSTEM
// ============================================

// Additional enums for showcase and shop features
export const showcaseStatusEnum = pgEnum("showcase_status", ["pending", "approved", "rejected"]);
export const productTypeEnum = pgEnum("product_type", ["digital", "physical"]);
export const productStatusEnum = pgEnum("product_status", ["pending", "approved", "rejected", "out_of_stock"]);
export const orderStatusEnum = pgEnum("order_status", ["pending", "paid", "processing", "shipped", "delivered", "cancelled", "refunded"]);
export const couponDiscountTypeEnum = pgEnum("coupon_discount_type", ["percentage", "fixed"]);

// Showcase Projects table - Behance-style portfolio projects
export const showcaseProjects = pgTable("showcase_projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  freelancerId: uuid("freelancer_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  media: jsonb("media"), // Array of image/video URLs
  tags: text("tags").array(), // Array of tags
  status: showcaseStatusEnum("status").default("approved").notNull(),
  approvedBy: uuid("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  rejectionReason: text("rejection_reason"),
  viewCount: integer("views_count").default(0),
  likeCount: integer("likes_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  freelancerIdx: index("idx_showcase_freelancer").on(table.freelancerId),
  statusIdx: index("idx_showcase_status").on(table.status),
  createdAtIdx: index("idx_showcase_created_at").on(table.createdAt.desc()),
}));

// Showcase project boost likes - Admin-added vanity likes with random generated names
export const showcaseProjectBoostLikes = pgTable("showcase_project_boost_likes", {
  id: uuid("id").primaryKey().defaultRandom(),
  showcaseProjectId: uuid("showcase_project_id").references(() => showcaseProjects.id).notNull(),
  displayName: text("display_name").notNull(), // Random generated name
  avatarUrl: text("avatar_url"), // Random avatar URL
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("showcaseProjectBoostLikes_projectId_idx").on(table.showcaseProjectId),
]);

// Work boost comments - Admin-added vanity comments for portfolio works (migrated from showcase system)
export const showcaseProjectBoostComments = pgTable("showcase_project_boost_comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  showcaseProjectId: uuid("showcase_project_id").notNull(), // Now references works.id (column name kept for DB compatibility)
  displayName: text("display_name").notNull(), // Synthetic commenter name
  avatarUrl: text("avatar_url"), // Synthetic commenter avatar
  content: text("content").notNull(), // Comment message
  boostFlag: boolean("boost_flag").default(true).notNull(), // Flag to identify synthetic comments
  createdAt: timestamp("created_at").notNull(), // Randomized timestamp for authenticity
}, (table) => [
  index("showcaseProjectBoostComments_projectId_idx").on(table.showcaseProjectId),
  index("showcaseProjectBoostComments_createdAt_idx").on(table.createdAt),
]);

// Products table - Digital and physical products for sale by freelancers, teachers, and admin
export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  sellerId: uuid("seller_id").references(() => users.id).notNull(), // Can be freelancer, teacher, or admin
  sellerRole: appRoleEnum("seller_role").notNull(), // freelancer, teacher, admin
  name: text("name").notNull(),
  description: text("description").notNull(),
  type: productTypeEnum("type").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("USD"),
  fileUrl: text("file_url"), // For digital products (legacy)
  downloadLimit: integer("download_limit"), // Max downloads per purchase
  images: text("images").array(), // Product gallery images
  previewImages: text("preview_images").array(), // Preview/showcase images
  downloadableFiles: jsonb("downloadable_files"), // Array of downloadable files with metadata
  stock: integer("stock"), // For physical products (null = unlimited)
  categoryId: uuid("category_id").references(() => categories.id), // Link to categories table
  category: text("category"), // Keep for backward compatibility
  tags: text("tags").array(),
  // Filter fields for advanced product filtering
  subcategory: text("subcategory"), // packaging, apparel, bags_sacks, bottles, vehicles, devices, etc.
  fileFormat: text("file_format").array(), // PSD, AI, Sketch, Figma, etc. (for digital products)
  style: text("style"), // realistic, flat, 3d, minimalist, etc.
  dimensions: text("dimensions"), // size specifications
  compatibility: text("compatibility").array(), // Adobe Photoshop, Illustrator, Sketch, etc.
  status: productStatusEnum("status").default("pending").notNull(),
  approvedBy: uuid("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  rejectionReason: text("rejection_reason"),
  salesCount: integer("sales_count").default(0),
  rating: numeric("rating", { precision: 3, scale: 2 }), // Average rating
  reviewCount: integer("review_count").default(0),
  likesCount: integer("likes_count").default(0), // Total likes on product
  followersCount: integer("followers_count").default(0), // Followers of the product seller
  featured: boolean("featured").default(false), // Featured on landing page
  featuredAt: timestamp("featured_at"), // When the product was marked as featured
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  sellerIdx: index("idx_products_seller").on(table.sellerId),
  sellerRoleIdx: index("idx_products_seller_role").on(table.sellerRole),
  statusIdx: index("idx_products_status").on(table.status),
  categoryIdIdx: index("idx_products_category_id").on(table.categoryId),
  categoryIdx: index("idx_products_category").on(table.category),
  createdAtIdx: index("idx_products_created_at").on(table.createdAt.desc()),
}));

// Product likes tracking table
export const productLikes = pgTable("product_likes", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id").references(() => products.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  unique("product_likes_unique").on(table.productId, table.userId),
  index("product_likes_product_id_idx").on(table.productId),
  index("product_likes_user_id_idx").on(table.userId),
]);

// Product follows tracking table (follows the seller/creator)
export const productFollows = pgTable("product_follows", {
  id: uuid("id").primaryKey().defaultRandom(),
  sellerId: uuid("seller_id").references(() => users.id, { onDelete: "cascade" }).notNull(), // user being followed
  followerId: uuid("follower_id").references(() => users.id, { onDelete: "cascade" }).notNull(), // user doing the following
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  unique("product_follows_unique").on(table.sellerId, table.followerId),
  index("product_follows_seller_id_idx").on(table.sellerId),
  index("product_follows_follower_id_idx").on(table.followerId),
]);

// Orders table - Customer purchases (supports multi-item orders)
export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id), // Buyer - nullable for guest orders
  guestEmail: text("guest_email"), // Email for guest orders when userId is null
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("USD"),
  status: orderStatusEnum("status").default("pending").notNull(),
  paymentIntentId: text("payment_intent_id"), // Stripe payment intent ID
  paymentMethod: text("payment_method"), // stripe, paypal, bank, system_wallet
  shippingAddress: jsonb("shipping_address"), // For physical products
  // orderNumber: text("order_number").unique().notNull(), // Human-readable order number - DISABLED: column doesn't exist in DB
  customerNotes: text("customer_notes"),
  adminNotes: text("admin_notes"),
  // Coupon/discount fields
  couponId: uuid("coupon_id").references(() => coupons.id), // Applied coupon
  discountAmount: numeric("discount_amount", { precision: 10, scale: 2 }).default("0"), // Discount applied
  completedAt: timestamp("completed_at"),
  // Digital fulfillment fields
  digitalFulfillmentStatus: text("digital_fulfillment_status").default("pending"), // pending, sent, completed, failed
  downloadEmailSent: boolean("download_email_sent").default(false),
  downloadEmailSentAt: timestamp("download_email_sent_at"),
  downloadLinksExpiresAt: timestamp("download_links_expires_at"), // 3 days from order
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  // Keep backward compatibility fields for existing single-item order support
  buyerId: uuid("buyer_id").references(() => users.id), // DEPRECATED: use userId
  productId: uuid("product_id").references(() => products.id), // DEPRECATED: use orderItems
  sellerId: uuid("seller_id").references(() => users.id), // DEPRECATED: use orderItems
  amount: numeric("amount", { precision: 10, scale: 2 }), // DEPRECATED: use totalAmount
  quantity: integer("quantity").default(1), // DEPRECATED: use orderItems
  downloadUrl: text("download_url"), // DEPRECATED: use orderItems
  downloadCount: integer("download_count").default(0), // DEPRECATED: use orderItems
  expiresAt: timestamp("expires_at"), // DEPRECATED: use orderItems
}, (table) => ({
  userIdx: index("idx_orders_user").on(table.userId),
  statusIdx: index("idx_orders_status").on(table.status),
  createdAtIdx: index("idx_orders_created_at").on(table.createdAt.desc()),
  // Keep backward compatibility indexes
  buyerIdx: index("idx_orders_buyer").on(table.buyerId),
  sellerIdx: index("idx_orders_seller").on(table.sellerId),
  productIdx: index("idx_orders_product").on(table.productId),
}));

// Categories table - Product categories for organization  
export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Carts table - Persistent shopping carts for users
export const carts = pgTable("carts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("idx_carts_user").on(table.userId),
}));

// Cart Items table - Individual items in shopping carts
export const cartItems = pgTable("cart_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  cartId: uuid("cart_id").references(() => carts.id).notNull(),
  productId: uuid("product_id").references(() => products.id).notNull(),
  quantity: integer("quantity").notNull().default(1),
  priceAtAdd: numeric("price_at_add", { precision: 10, scale: 2 }).notNull(), // Price when added to cart
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  cartIdx: index("idx_cart_items_cart").on(table.cartId),
  productIdx: index("idx_cart_items_product").on(table.productId),
  // Unique constraint: one product per cart
  cartProductUnique: unique().on(table.cartId, table.productId),
}));

// Order Items table - Items within orders (supports multi-item orders)
export const orderItems = pgTable("order_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").references(() => orders.id).notNull(),
  productId: uuid("product_id").references(() => products.id).notNull(),
  quantity: integer("quantity").notNull().default(1),
  unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(), // Price per unit at time of order
  totalPrice: numeric("total_price", { precision: 10, scale: 2 }).notNull(), // Total price (unit_price * quantity)
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(), // Deprecated - kept for backward compatibility
}, (table) => ({
  orderIdx: index("idx_order_items_order").on(table.orderId),
  productIdx: index("idx_order_items_product").on(table.productId),
}));

// Downloads table - Track digital product downloads with limits and security
export const downloads = pgTable("downloads", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(), // Who downloaded
  productId: uuid("product_id").references(() => products.id).notNull(), // What was downloaded
  orderId: uuid("order_id").references(() => orders.id).notNull(), // Which purchase
  downloadToken: text("download_token").notNull().unique(), // Secure download token
  downloadedAt: timestamp("downloaded_at").defaultNow().notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  expiresAt: timestamp("expires_at"), // Download link expiry (24 hours default)
  isExpired: boolean("is_expired").default(false),
}, (table) => ({
  userIdx: index("idx_downloads_user").on(table.userId),
  productIdx: index("idx_downloads_product").on(table.productId),
  orderIdx: index("idx_downloads_order").on(table.orderId),
  tokenIdx: index("idx_downloads_token").on(table.downloadToken),
  userProductIdx: index("idx_downloads_user_product").on(table.userId, table.productId),
}));

// Coupons table - Discount codes for shop orders
export const coupons = pgTable("coupons", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(), // Unique coupon code (e.g., "SAVE20")
  description: text("description"), // What this coupon is for
  discountType: couponDiscountTypeEnum("discount_type").notNull(), // percentage or fixed
  discountValue: numeric("discount_value", { precision: 10, scale: 2 }).notNull(), // Percentage (e.g., 20 for 20%) or fixed amount
  minOrderAmount: numeric("min_order_amount", { precision: 10, scale: 2 }), // Minimum order total required
  maxDiscount: numeric("max_discount", { precision: 10, scale: 2 }), // Maximum discount amount (for percentage type)
  startDate: timestamp("start_date"), // When coupon becomes valid
  endDate: timestamp("end_date"), // When coupon expires
  totalUsageLimit: integer("total_usage_limit"), // Max total uses across all users (null = unlimited)
  perUserLimit: integer("per_user_limit").default(1), // Max uses per user
  usageCount: integer("usage_count").default(0), // Current total usage count
  isActive: boolean("is_active").default(true), // Admin can enable/disable
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  codeIdx: index("idx_coupons_code").on(table.code),
  activeIdx: index("idx_coupons_active").on(table.isActive),
  datesIdx: index("idx_coupons_dates").on(table.startDate, table.endDate),
}));

// Coupon Usages table - Track who used which coupons and when
export const couponUsages = pgTable("coupon_usages", {
  id: uuid("id").primaryKey().defaultRandom(),
  couponId: uuid("coupon_id").references(() => coupons.id).notNull(),
  userId: uuid("user_id").references(() => users.id), // null for guest users
  guestEmail: text("guest_email"), // Email for guest users
  orderId: uuid("order_id").references(() => orders.id), // null until checkout completes
  cartId: uuid("cart_id").references(() => carts.id), // Track which cart applied it
  discountApplied: numeric("discount_applied", { precision: 10, scale: 2 }).notNull(), // Actual discount amount
  orderTotal: numeric("order_total", { precision: 10, scale: 2 }), // Order total before discount
  metadata: jsonb("metadata"), // Additional tracking data
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  couponIdx: index("idx_coupon_usages_coupon").on(table.couponId),
  userIdx: index("idx_coupon_usages_user").on(table.userId),
  orderIdx: index("idx_coupon_usages_order").on(table.orderId),
}));

// Transactions table - Track earnings and withdrawals for freelancers/teachers
export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  type: transactionTypeEnum("type").notNull(), // credit or debit
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  status: transactionStatusEnum("status").default("pending").notNull(),
  method: payoutMethodEnum("method"), // bank or paypal (for payouts only)
  description: text("description").notNull(),
  reference: text("reference"), // Course ID, lesson ID, or payout reference
  payoutAccountId: uuid("payout_account_id").references(() => payoutAccounts.id),
  paypalPayoutId: text("paypal_payout_id"), // PayPal payout batch ID
  adminNotes: text("admin_notes"), // Admin can add notes when processing
  processedBy: uuid("processed_by").references(() => users.id), // Admin who processed
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Payout Accounts table - Bank, PayPal, and Mobile Money accounts for freelancers/teachers
export const payoutAccounts = pgTable("payout_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  type: payoutAccountTypeEnum("type").notNull(), // bank, paypal, crypto, mobile_money
  accountName: text("account_name").notNull(), // Display name for the account
  details: jsonb("details").notNull(), // Account-specific info (masked in UI)
  // Mobile Money specific fields
  mobileMoneyProvider: mobileMoneyProviderEnum("mobile_money_provider"), // vodapay, ecocash, mpesa, etc.
  mobileMoneyNumber: text("mobile_money_number"), // Phone number for mobile money
  mobileMoneyCountry: text("mobile_money_country"), // ISO country code (ZA, ZW, KE, etc.)
  isVerified: boolean("is_verified").default(false),
  isDefault: boolean("is_default").default(false),
  verifiedAt: timestamp("verified_at"),
  verifiedBy: uuid("verified_by").references(() => users.id), // Admin who verified
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// User Balances table - Track available balance for each user
export const userBalances = pgTable("user_balances", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull().unique(),
  availableBalance: numeric("available_balance", { precision: 10, scale: 2 }).default("0.00").notNull(),
  totalEarnings: numeric("total_earnings", { precision: 10, scale: 2 }).default("0.00").notNull(),
  totalWithdrawn: numeric("total_withdrawn", { precision: 10, scale: 2 }).default("0.00").notNull(),
  pendingPayouts: numeric("pending_payouts", { precision: 10, scale: 2 }).default("0.00").notNull(),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================
// CREATOR EARNINGS & PAYOUT SYSTEM
// ============================================

// Creator Earning Events - Track all earning transactions
export const creatorEarningEvents = pgTable("creator_earning_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  creatorId: uuid("creator_id").references(() => users.id).notNull(),
  creatorRole: text("creator_role").notNull(), // 'freelancer' or 'teacher'
  eventType: text("event_type").notNull(), // 'product_sale', 'free_download_milestone', 'subscription_download', 'course_sale'
  sourceType: text("source_type").notNull(), // 'product', 'course', 'subscription'
  sourceId: uuid("source_id").notNull(), // product_id, course_id, or order_id
  orderId: uuid("order_id").references(() => orders.id), // Reference to order if applicable
  grossAmount: numeric("gross_amount", { precision: 10, scale: 2 }).notNull(), // Total sale amount
  platformCommission: numeric("platform_commission", { precision: 10, scale: 2 }).notNull().default("0"), // Platform's cut (25%)
  creatorAmount: numeric("creator_amount", { precision: 10, scale: 2 }).notNull(), // Creator's cut (75%)
  currency: text("currency").default("USD"),
  status: text("status").notNull().default("pending"), // 'pending', 'available', 'paid'
  payoutRequestId: uuid("payout_request_id"), // Reference to payout request when paid
  metadata: jsonb("metadata"), // Additional data (product name, download count, etc.)
  eventDate: timestamp("event_date").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  creatorIdx: index("idx_earning_events_creator").on(table.creatorId),
  statusIdx: index("idx_earning_events_status").on(table.status),
  dateIdx: index("idx_earning_events_date").on(table.eventDate.desc()),
}));

// Creator Balances - Track current balance for each creator
export const creatorBalances = pgTable("creator_balances", {
  creatorId: uuid("creator_id").primaryKey().references(() => users.id),
  availableBalance: numeric("available_balance", { precision: 10, scale: 2 }).notNull().default("0.00"),
  pendingBalance: numeric("pending_balance", { precision: 10, scale: 2 }).notNull().default("0.00"),
  lifetimeEarnings: numeric("lifetime_earnings", { precision: 10, scale: 2 }).notNull().default("0.00"),
  totalWithdrawn: numeric("total_withdrawn", { precision: 10, scale: 2 }).notNull().default("0.00"),
  lastPayoutDate: timestamp("last_payout_date"),
  nextPayoutDate: timestamp("next_payout_date"), // Always 5th of next month
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  creatorIdx: index("idx_creator_balances_creator").on(table.creatorId),
}));

// Settlement Runs - Track monthly settlement executions for idempotency
export const settlementRuns = pgTable("settlement_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  settlementDate: text("settlement_date").notNull(), // Format: YYYY-MM-DD
  status: text("status").notNull().default("running"), // 'running', 'completed', 'failed'
  creatorsProcessed: integer("creators_processed").default(0),
  autoPayoutsCreated: integer("auto_payouts_created").default(0),
  totalPendingMoved: numeric("total_pending_moved", { precision: 10, scale: 2 }).default("0.00"),
  errorMessage: text("error_message"),
  runAt: timestamp("run_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  durationMs: integer("duration_ms"),
}, (table) => ({
  uniqueSettlementDate: unique("uniq_settlement_date").on(table.settlementDate),
  dateIdx: index("idx_settlement_runs_date").on(table.settlementDate.desc()),
}));

// Creator Payout Requests - Track withdrawal requests
export const creatorPayoutRequests = pgTable("creator_payout_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  creatorId: uuid("creator_id").references(() => users.id).notNull(),
  amountRequested: numeric("amount_requested", { precision: 10, scale: 2 }).notNull(),
  amountApproved: numeric("amount_approved", { precision: 10, scale: 2 }),
  payoutMethod: text("payout_method").notNull(), // 'bank', 'paypal', 'crypto', 'mobile_money'
  payoutAccountId: uuid("payout_account_id").references(() => payoutAccounts.id),
  status: payoutStatusEnum("status").notNull().default("auto_generated"), // auto_generated, awaiting_admin, approved, payment_processing, completed, failed, rejected
  rejectionReason: text("rejection_reason"),
  paymentReference: text("payment_reference"), // Bank/PayPal/Mobile Money transaction reference
  requestedAt: timestamp("requested_at").notNull().defaultNow(),
  approvedAt: timestamp("approved_at"), // When admin approves
  processedAt: timestamp("processed_at"), // When admin marks as paid
  finalizedAt: timestamp("finalized_at"), // When system finalizes on 5th
  processedBy: uuid("processed_by").references(() => users.id),
  payoutDate: timestamp("payout_date"), // Scheduled for 5th of month
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  isAutoGenerated: boolean("is_auto_generated").default(false), // True for auto-generated payouts on settlement
  notificationSent: boolean("notification_sent").default(false), // True if admin was notified
  finalizedByJob: boolean("finalized_by_job").default(false), // True if finalized by automated job
}, (table) => ({
  creatorIdx: index("idx_payout_requests_creator").on(table.creatorId),
  statusIdx: index("idx_payout_requests_status").on(table.status),
  dateIdx: index("idx_payout_requests_date").on(table.payoutDate),
}));

// Product Download Stats - Track downloads for free download milestones
export const productDownloadStats = pgTable("product_download_stats", {
  productId: uuid("product_id").primaryKey().references(() => products.id, { onDelete: "cascade" }),
  totalDownloads: integer("total_downloads").notNull().default(0),
  freeDownloads: integer("free_downloads").notNull().default(0),
  paidDownloads: integer("paid_downloads").notNull().default(0),
  subscriptionDownloads: integer("subscription_downloads").notNull().default(0),
  lastMilestoneCount: integer("last_milestone_count").notNull().default(0), // Track which milestone was last paid (0, 50, 100, 150...)
  downloadsThisWeek: integer("downloads_this_week").notNull().default(0),
  downloadsThisMonth: integer("downloads_this_month").notNull().default(0),
  lastDownloadAt: timestamp("last_download_at"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  productIdx: index("idx_download_stats_product").on(table.productId),
}));

// Product Download Events - Track individual download events
export const productDownloadEvents = pgTable("product_download_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id").references(() => products.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  downloadType: text("download_type").notNull(), // 'free', 'paid', 'subscription'
  orderId: uuid("order_id").references(() => orders.id), // For paid downloads
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  downloadedAt: timestamp("downloaded_at").notNull().defaultNow(),
}, (table) => ({
  productIdx: index("idx_download_events_product").on(table.productId),
  userIdx: index("idx_download_events_user").on(table.userId),
  dateIdx: index("idx_download_events_date").on(table.downloadedAt.desc()),
}));

// Banks table - Store bank information by country
export const banks = pgTable("banks", {
  id: uuid("id").primaryKey().defaultRandom(),
  countryCode: text("country_code").notNull(), // ISO country code (US, GB, CA, etc.)
  bankName: text("bank_name").notNull(), // Full bank name
  bankCode: text("bank_code"), // Bank identifier/routing code
  swiftCode: text("swift_code"), // International SWIFT code
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Admin Notifications - Track system notifications for admin dashboard
export const adminNotifications = pgTable("admin_notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: text("type").notNull(), // 'payout_due', 'payout_overdue', 'system_alert'
  title: text("title").notNull(),
  message: text("message").notNull(),
  data: jsonb("data"), // {payoutCount, totalAmount, month, etc.}
  targetRole: appRoleEnum("target_role").default("admin"), // Which admin role should see this
  priority: text("priority").default("normal"), // 'low', 'normal', 'high', 'urgent'
  isRead: boolean("is_read").default(false),
  readBy: uuid("read_by").references(() => users.id),
  readAt: timestamp("read_at"),
  expiresAt: timestamp("expires_at"), // Auto-hide after this date
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  typeIdx: index("idx_admin_notifications_type").on(table.type),
  roleIdx: index("idx_admin_notifications_role").on(table.targetRole),
  readIdx: index("idx_admin_notifications_read").on(table.isRead),
}));

// Job Executions - Track scheduled job runs for idempotency
export const jobExecutions = pgTable("job_executions", {
  id: uuid("id").primaryKey().defaultRandom(),
  jobType: text("job_type").notNull(), // 'payout_creation', 'payout_finalization', 'settlement'
  runDate: text("run_date").notNull(), // Format: YYYY-MM-DD
  status: text("status").notNull().default("running"), // 'running', 'completed', 'failed'
  recordsProcessed: integer("records_processed").default(0),
  errorMessage: text("error_message"),
  metadata: jsonb("metadata"), // Job-specific data
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  durationMs: integer("duration_ms"),
}, (table) => ({
  uniqueJobRun: unique("uniq_job_run").on(table.jobType, table.runDate),
  jobTypeIdx: index("idx_job_executions_type").on(table.jobType),
  runDateIdx: index("idx_job_executions_date").on(table.runDate.desc()),
}));

// ============================================
// SUBSCRIPTION ACCESS CONTROL TRACKING
// ============================================

// Lesson Access Permissions - Track which lesson was unlocked per subject for unpaid users
// Enforces "1 lesson per subject" rule for unpaid users
export const lessonAccessPermissions = pgTable("lesson_access_permissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  subjectId: uuid("subject_id").references(() => subjects.id).notNull(), // Which subject
  courseId: uuid("course_id").references(() => courses.id), // Optional: for college courses
  lessonId: integer("lesson_id").references(() => lessons.id).notNull(), // The specific lesson unlocked
  accessGrantedAt: timestamp("access_granted_at").notNull().defaultNow(),
  subscriptionSnapshot: text("subscription_snapshot"), // Store subscription status at time of access for audit
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  // Unique constraint: unpaid users can only access ONE lesson per subject
  userSubjectUnique: unique("uniq_user_subject_lesson").on(table.userId, table.subjectId),
  userIdx: index("idx_lesson_access_user").on(table.userId),
  subjectIdx: index("idx_lesson_access_subject").on(table.subjectId),
  courseIdx: index("idx_lesson_access_course").on(table.courseId),
}));

// Download Quota Usage - Track monthly free product download limits (5 downloads/month for unpaid)
// Keyed by month for automatic rollover without mass updates
export const downloadQuotaUsage = pgTable("download_quota_usage", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  periodStart: timestamp("period_start").notNull(), // Date truncated to month (e.g., 2025-01-01)
  downloadCount: integer("download_count").notNull().default(0),
  lastDownloadAt: timestamp("last_download_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  // Unique constraint: one record per user per month
  userPeriodUnique: unique("uniq_user_period").on(table.userId, table.periodStart),
  userIdx: index("idx_download_quota_user").on(table.userId),
  periodIdx: index("idx_download_quota_period").on(table.periodStart.desc()),
}));

// ============================================
// SUBJECT-BASED EDUCATION SYSTEM (Primary/Secondary)
// ============================================

// Subjects table - For primary/secondary education
export const subjects = pgTable("subjects", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(), // Mathematics, Science, English, etc.
  gradeSystem: text("grade_system").notNull(), // cambridge, zimbabwe, american, etc.
  gradeLevel: integer("grade_level").notNull(), // 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12
  description: text("description"),
  iconUrl: text("icon_url"),
  createdBy: uuid("created_by").references(() => users.id), // Admin/Teacher who created
  isActive: boolean("is_active").default(true),
  approvalStatus: text("approval_status").default("pending").notNull(), // pending, approved, rejected
  adminNotes: text("admin_notes"), // Notes from admin about approval/rejection
  reviewedBy: uuid("reviewed_by").references(() => users.id), // Admin who reviewed
  reviewedAt: timestamp("reviewed_at"), // When the subject was reviewed
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Teacher Subjects table - Links teachers to subjects they teach
export const teacherSubjects = pgTable("teacher_subjects", {
  id: uuid("id").primaryKey().defaultRandom(),
  teacherId: uuid("teacher_id").references(() => users.id).notNull(),
  subjectId: uuid("subject_id").references(() => subjects.id).notNull(),
  isPrimary: boolean("is_primary").default(false), // Is this their primary subject?
  experienceYears: integer("experience_years"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  teacherSubjectUnique: unique("uniq_teacher_subject").on(table.teacherId, table.subjectId),
  teacherIdx: index("idx_teacher_subjects_teacher").on(table.teacherId),
  subjectIdx: index("idx_teacher_subjects_subject").on(table.subjectId),
}));

// Subject Chapters table - Organize lessons within subjects
export const subjectChapters = pgTable("subject_chapters", {
  id: uuid("id").primaryKey().defaultRandom(),
  subjectId: uuid("subject_id").references(() => subjects.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  order: integer("order").notNull().default(1),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Subject Lessons table - Individual lessons within chapters
export const subjectLessons = pgTable("subject_lessons", {
  id: uuid("id").primaryKey().defaultRandom(),
  chapterId: uuid("chapter_id").references(() => subjectChapters.id).notNull(),
  title: text("title").notNull(),
  notes: text("notes").notNull(), // Main teaching content
  examples: text("examples").array().default([]), // Worked-out problems/examples
  cloudinaryImages: text("cloudinary_images").array().default([]), // Image URLs from Cloudinary
  order: integer("order").notNull().default(1),
  durationMinutes: integer("duration_minutes").default(30),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Subject Exercises table - Quiz questions for lessons (15 questions per lesson)
export const subjectExercises = pgTable("subject_exercises", {
  id: uuid("id").primaryKey().defaultRandom(),
  lessonId: uuid("lesson_id").references(() => subjectLessons.id).notNull(),
  question: text("question").notNull(),
  options: text("options").array().notNull(), // 4 multiple choice options
  correctAnswer: text("correct_answer").notNull(), // The correct option
  explanation: text("explanation"), // Explanation for the answer
  order: integer("order").notNull().default(1),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Subject Progress table - Track student progress on subject lessons
export const subjectProgress = pgTable("subject_progress", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  lessonId: uuid("lesson_id").references(() => subjectLessons.id).notNull(),
  status: text("status").default("not_started"), // not_started, in_progress, completed
  score: integer("score"), // Quiz score out of 15 (or percentage)
  totalQuestions: integer("total_questions").default(15),
  correctAnswers: integer("correct_answers").default(0),
  completedAt: timestamp("completed_at"),
  timeSpent: integer("time_spent").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Daily Questions system - 7 questions per day across subjects for 200 days
export const dailyQuestions = pgTable("daily_questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  dayNumber: integer("day_number").notNull(), // 1-200 days
  subjectId: uuid("subject_id").references(() => subjects.id).notNull(),
  question: text("question").notNull(),
  options: text("options").array().notNull(), // 4 multiple choice options
  correctAnswer: text("correct_answer").notNull(), // The correct option
  explanation: text("explanation"), // Explanation for the answer
  difficulty: text("difficulty").default("medium"), // easy, medium, hard
  questionOrder: integer("question_order").notNull(), // 1-7 for each day
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Daily Question Progress - Track student answers and progress
export const dailyQuestionProgress = pgTable("daily_question_progress", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  questionId: uuid("question_id").references(() => dailyQuestions.id).notNull(),
  dayNumber: integer("day_number").notNull(),
  selectedAnswer: text("selected_answer"),
  isCorrect: boolean("is_correct"),
  timeSpent: integer("time_spent").default(0), // in seconds
  attemptedAt: timestamp("attempted_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Daily Progress Summary - Daily statistics
export const dailyProgressSummary = pgTable("daily_progress_summary", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  dayNumber: integer("day_number").notNull(),
  totalQuestions: integer("total_questions").default(7),
  correctAnswers: integer("correct_answers").default(0),
  totalTime: integer("total_time").default(0), // in seconds
  completedAt: timestamp("completed_at"),
  streakDay: integer("streak_day").default(0), // Track daily streaks
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCitySchema = createInsertSchema(cities).omit({ id: true, createdAt: true });
export const insertProfileSchema = createInsertSchema(profiles).omit({ id: true, createdAt: true, updatedAt: true });
export const insertVerificationCodeSchema = createInsertSchema(verificationCodes).omit({ id: true, createdAt: true });
export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens).omit({ id: true, createdAt: true });
export const insertEmailVerificationSchema = createInsertSchema(emailVerifications).omit({ id: true, createdAt: true, verifiedAt: true });
export const insertUserRoleSchema = createInsertSchema(userRoles).omit({ id: true, assignedAt: true });
export const insertTeacherApplicationSchema = createInsertSchema(teacherApplications).omit({ id: true, createdAt: true, updatedAt: true, submittedAt: true });
export const insertSystemSettingSchema = createInsertSchema(systemSettings).omit({ id: true, createdAt: true, updatedAt: true });
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true });
export const insertApiKeySchema = createInsertSchema(apiKeys).omit({ id: true, createdAt: true, lastUsedAt: true, revokedAt: true });
export const insertStudentProgressSchema = createInsertSchema(studentProgress).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTaskSchema = createInsertSchema(tasks).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCourseSchema = createInsertSchema(courses).omit({ id: true, createdAt: true, updatedAt: true });
export const insertModuleSchema = createInsertSchema(modules).omit({ id: true, createdAt: true, updatedAt: true });
export const insertLessonSchema = createInsertSchema(lessons).omit({ id: true, createdAt: true });
export const insertLessonMediaSchema = createInsertSchema(lessonMedia).omit({ id: true, createdAt: true });
export const insertQuizSchema = createInsertSchema(quizzes).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCourseEnrollmentSchema = createInsertSchema(courseEnrollments).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCoursePurchaseSchema = createInsertSchema(coursePurchases).omit({ id: true, createdAt: true });
export const insertStudyNoteSchema = createInsertSchema(studyNotes).omit({ id: true, createdAt: true, updatedAt: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true });
// Chat system insert schemas
export const insertChatThreadSchema = createInsertSchema(chatThreads).omit({ id: true, createdAt: true, updatedAt: true });
export const insertChatParticipantSchema = createInsertSchema(chatParticipants).omit({ id: true, joinedAt: true });
export const insertSupportAgentSchema = createInsertSchema(supportAgents).omit({ id: true, createdAt: true });
export const insertSupportChatSessionSchema = createInsertSchema(supportChatSessions).omit({ id: true, sessionStartedAt: true, lastActivityAt: true });
export const insertHelpChatMessageSchema = createInsertSchema(helpChatMessages).omit({ id: true, createdAt: true });
export const insertHelpChatSettingSchema = createInsertSchema(helpChatSettings).omit({ id: true, createdAt: true, updatedAt: true });
export const insertQuickResponseSchema = createInsertSchema(quickResponses).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCourseCategorySchema = createInsertSchema(courseCategories).omit({ id: true, createdAt: true });
export const insertCourseReviewSchema = createInsertSchema(courseReviews).omit({ id: true, createdAt: true });
export const insertCommunityGroupSchema = createInsertSchema(communityGroups).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCommunityGroupMemberSchema = createInsertSchema(communityGroupMembers).omit({ id: true, joinedAt: true });
export const insertCommunityReactionSchema = createInsertSchema(communityReactions).omit({ id: true, createdAt: true });
export const insertCommunityTopicSchema = createInsertSchema(communityTopics).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCommunityPostSchema = insertCommunityTopicSchema; // Backward compatibility
export const insertCommunityReplySchema = createInsertSchema(communityReplies).omit({ id: true, createdAt: true, updatedAt: true });
export const insertStudentDiscoveryPreferencesSchema = createInsertSchema(studentDiscoveryPreferences).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPricingPlanSchema = createInsertSchema(pricingPlans).omit({ id: true, createdAt: true, updatedAt: true });
export const insertUserSubscriptionSchema = createInsertSchema(userSubscriptions).omit({ id: true, createdAt: true, updatedAt: true });
export const insertManualPlanAssignmentSchema = createInsertSchema(manualPlanAssignments).omit({ id: true, createdAt: true });
export const insertPaymentSchema = createInsertSchema(payments).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCurriculumSchema = createInsertSchema(curricula).omit({ id: true, createdAt: true, updatedAt: true });
export const insertLessonProgressSchema = createInsertSchema(lessonProgress).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCountryCurriculumSchema = createInsertSchema(countryCurricula).omit({ id: true, createdAt: true });
export const insertAnnouncementSchema = createInsertSchema(announcements).omit({ id: true, createdAt: true, updatedAt: true });
export const insertModerationLogSchema = createInsertSchema(moderationLogs).omit({ id: true, createdAt: true });
export const insertTeacherStudentAssignmentSchema = createInsertSchema(teacherStudentAssignments).omit({ id: true, assignedAt: true });
export const insertFriendshipSchema = createInsertSchema(friendships).omit({ id: true, createdAt: true, updatedAt: true });
export const insertGroupMembershipSchema = createInsertSchema(groupMemberships).omit({ id: true, joinedAt: true, updatedAt: true });
export const insertPremiumMessageSchema = createInsertSchema(premiumMessages).omit({ id: true, createdAt: true, updatedAt: true });
// Subject-based education system insert schemas
export const insertSubjectSchema = createInsertSchema(subjects).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSubjectChapterSchema = createInsertSchema(subjectChapters).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSubjectLessonSchema = createInsertSchema(subjectLessons).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSubjectExerciseSchema = createInsertSchema(subjectExercises).omit({ id: true, createdAt: true });
export const insertSubjectProgressSchema = createInsertSchema(subjectProgress).omit({ id: true, createdAt: true, updatedAt: true });
// Daily Questions system insert schemas
export const insertDailyQuestionSchema = createInsertSchema(dailyQuestions).omit({ id: true, createdAt: true });
export const insertDailyQuestionProgressSchema = createInsertSchema(dailyQuestionProgress).omit({ id: true, createdAt: true });
export const insertDailyProgressSummarySchema = createInsertSchema(dailyProgressSummary).omit({ id: true, createdAt: true, updatedAt: true });

// Projects system insert schemas
export const insertProjectSchema = createInsertSchema(projects).omit({ id: true, createdAt: true, updatedAt: true });
export const insertProjectMilestoneSchema = createInsertSchema(projectMilestones).omit({ id: true, createdAt: true, updatedAt: true });

// Payment and transaction validation schemas
export const insertPayoutAccountSchema = createInsertSchema(payoutAccounts).omit({ 
  id: true, 
  isVerified: true, 
  verifiedAt: true, 
  verifiedBy: true, 
  createdAt: true, 
  updatedAt: true 
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({ 
  id: true, 
  processedBy: true, 
  processedAt: true, 
  createdAt: true, 
  updatedAt: true 
});

export const insertBankSchema = createInsertSchema(banks).omit({ 
  id: true, 
  createdAt: true 
});

// Creator Earnings & Payout system insert schemas
export const insertCreatorEarningEventSchema = createInsertSchema(creatorEarningEvents).omit({ 
  id: true, 
  createdAt: true 
});

export const insertCreatorBalanceSchema = createInsertSchema(creatorBalances).omit({ 
  createdAt: true, 
  updatedAt: true 
});

export const insertCreatorPayoutRequestSchema = createInsertSchema(creatorPayoutRequests).omit({ 
  id: true, 
  createdAt: true,
  processedAt: true,
  processedBy: true
});

export const insertProductDownloadStatsSchema = createInsertSchema(productDownloadStats).omit({ 
  updatedAt: true 
});

export const insertProductDownloadEventSchema = createInsertSchema(productDownloadEvents).omit({ 
  id: true 
});

// Subscription Access Control Schemas
export const insertLessonAccessPermissionSchema = createInsertSchema(lessonAccessPermissions).omit({ 
  id: true, 
  createdAt: true,
  accessGrantedAt: true
});

export const insertDownloadQuotaUsageSchema = createInsertSchema(downloadQuotaUsage).omit({ 
  id: true, 
  createdAt: true,
  updatedAt: true
});

// Shop Cart System Schemas
export const insertCategorySchema = createInsertSchema(categories).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const insertProductSchema = createInsertSchema(products).omit({ 
  id: true, 
  sellerId: true, // Server sets this from authenticated user
  sellerRole: true, // Server sets this from user profile
  approvedBy: true, 
  approvedAt: true, 
  rejectionReason: true, 
  salesCount: true, 
  rating: true, 
  reviewCount: true, 
  createdAt: true, 
  updatedAt: true 
});

export const insertCartSchema = createInsertSchema(carts).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const insertCartItemSchema = createInsertSchema(cartItems).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const insertOrderSchema = createInsertSchema(orders).omit({ 
  id: true, 
  completedAt: true, 
  createdAt: true, 
  updatedAt: true,
  // Omit deprecated fields for new orders
  buyerId: true,
  productId: true,
  sellerId: true,
  amount: true,
  quantity: true,
  downloadUrl: true,
  downloadCount: true,
  expiresAt: true
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({ 
  id: true, 
  createdAt: true 
});

export const insertCouponSchema = z.object({
  code: z.string(),
  description: z.string().nullable().optional(),
  discountType: z.enum(["percentage", "fixed"]),
  discountValue: z.string(),
  minOrderAmount: z.string().nullable().optional(),
  maxDiscount: z.string().nullable().optional(),
  startDate: z.coerce.date().nullable().optional(),
  endDate: z.coerce.date().nullable().optional(),
  totalUsageLimit: z.number().nullable().optional(),
  perUserLimit: z.number().nullable().optional(),
  isActive: z.boolean().optional().default(true),
});

export const insertCouponUsageSchema = createInsertSchema(couponUsages).omit({ 
  id: true, 
  createdAt: true 
});

// Select schemas
export const selectUserSchema = createSelectSchema(users);
export const selectProfileSchema = createSelectSchema(profiles);
export const selectVerificationCodeSchema = createSelectSchema(verificationCodes);
export const selectPasswordResetTokenSchema = createSelectSchema(passwordResetTokens);
export const selectUserRoleSchema = createSelectSchema(userRoles);
export const selectTeacherApplicationSchema = createSelectSchema(teacherApplications);
export const selectSystemSettingSchema = createSelectSchema(systemSettings);
export const selectNotificationSchema = createSelectSchema(notifications);
export const selectStudentProgressSchema = createSelectSchema(studentProgress);
export const selectTaskSchema = createSelectSchema(tasks);
export const selectCourseSchema = createSelectSchema(courses);
export const selectLessonSchema = createSelectSchema(lessons);
export const selectCourseEnrollmentSchema = createSelectSchema(courseEnrollments);
export const selectStudyNoteSchema = createSelectSchema(studyNotes);
export const selectMessageSchema = createSelectSchema(messages);
// Chat system select schemas  
export const selectChatThreadSchema = createSelectSchema(chatThreads);
export const selectChatParticipantSchema = createSelectSchema(chatParticipants);
export const selectHelpChatMessageSchema = createSelectSchema(helpChatMessages);
export const selectHelpChatSettingSchema = createSelectSchema(helpChatSettings);
export const selectQuickResponseSchema = createSelectSchema(quickResponses);
export const selectCourseCategorySchema = createSelectSchema(courseCategories);
export const selectCourseReviewSchema = createSelectSchema(courseReviews);
export const selectCommunityGroupSchema = createSelectSchema(communityGroups);
export const selectCommunityGroupMemberSchema = createSelectSchema(communityGroupMembers);
export const selectCommunityReactionSchema = createSelectSchema(communityReactions);
export const selectCommunityTopicSchema = createSelectSchema(communityTopics);
export const selectCommunityPostSchema = selectCommunityTopicSchema; // Backward compatibility
export const selectCommunityReplySchema = createSelectSchema(communityReplies);
export const selectStudentDiscoveryPreferencesSchema = createSelectSchema(studentDiscoveryPreferences);
export const selectPricingPlanSchema = createSelectSchema(pricingPlans);
export const selectUserSubscriptionSchema = createSelectSchema(userSubscriptions);
export const selectManualPlanAssignmentSchema = createSelectSchema(manualPlanAssignments);
export const selectPaymentSchema = createSelectSchema(payments);
export const selectCurriculumSchema = createSelectSchema(curricula);
export const selectCountryCurriculumSchema = createSelectSchema(countryCurricula);
export const selectAnnouncementSchema = createSelectSchema(announcements);
export const selectModerationLogSchema = createSelectSchema(moderationLogs);
export const selectTeacherStudentAssignmentSchema = createSelectSchema(teacherStudentAssignments);
export const selectFriendshipSchema = createSelectSchema(friendships);
export const selectGroupMembershipSchema = createSelectSchema(groupMemberships);
export const selectPremiumMessageSchema = createSelectSchema(premiumMessages);
// Subject-based education system select schemas
export const selectSubjectSchema = createSelectSchema(subjects);
export const selectSubjectChapterSchema = createSelectSchema(subjectChapters);
export const selectSubjectLessonSchema = createSelectSchema(subjectLessons);
export const selectSubjectExerciseSchema = createSelectSchema(subjectExercises);
export const selectSubjectProgressSchema = createSelectSchema(subjectProgress);
// Daily Questions system select schemas
export const selectDailyQuestionSchema = createSelectSchema(dailyQuestions);
export const selectDailyQuestionProgressSchema = createSelectSchema(dailyQuestionProgress);
export const selectDailyProgressSummarySchema = createSelectSchema(dailyProgressSummary);

// Subscription Access Control select schemas
export const selectLessonAccessPermissionSchema = createSelectSchema(lessonAccessPermissions);
export const selectDownloadQuotaUsageSchema = createSelectSchema(downloadQuotaUsage);

// Projects system select schemas  
export const selectProjectSchema = createSelectSchema(projects);
export const selectProjectMilestoneSchema = createSelectSchema(projectMilestones);

// Category Management Access Approval Table
export const categoryAccessApprovals = pgTable("category_access_approvals", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  userRole: appRoleEnum("user_role").notNull(), // teacher or freelancer
  status: approvalStatusEnum("status").default("pending").notNull(),
  requestedAt: timestamp("requested_at").defaultNow().notNull(),
  approvedBy: uuid("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  rejectedAt: timestamp("rejected_at"),
  rejectionReason: text("rejection_reason"),
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  unique().on(table.userId, table.userRole) // One approval request per user per role
]);

// Category Access Approval Types
export type CategoryAccessApproval = typeof categoryAccessApprovals.$inferSelect;
export type InsertCategoryAccessApproval = typeof categoryAccessApprovals.$inferInsert;
export const insertCategoryAccessApprovalSchema = createInsertSchema(categoryAccessApprovals).omit({
  id: true,
  requestedAt: true,
  approvedBy: true,
  approvedAt: true,
  rejectedAt: true,
  createdAt: true,
  updatedAt: true
});

// Freelancer Portfolio & Shop system schemas
export const insertShowcaseProjectSchema = createInsertSchema(showcaseProjects).omit({ 
  id: true, 
  freelancerId: true, // Set from auth context
  status: true, // Prevent approval bypass - set server-side
  approvedBy: true, 
  approvedAt: true, 
  rejectionReason: true, // Server-controlled
  viewCount: true, 
  likeCount: true, 
  createdAt: true, 
  updatedAt: true 
});


export const selectShowcaseProjectSchema = createSelectSchema(showcaseProjects);
export const selectProductSchema = createSelectSchema(products);
export const selectOrderSchema = createSelectSchema(orders);
export const selectCouponSchema = createSelectSchema(coupons);
export const selectCouponUsageSchema = createSelectSchema(couponUsages);

// Types
export type User = typeof users.$inferSelect;
export type Profile = typeof profiles.$inferSelect;
export type VerificationCode = typeof verificationCodes.$inferSelect;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type EmailVerification = typeof emailVerifications.$inferSelect;
export type UserRole = typeof userRoles.$inferSelect;
export type TeacherApplication = typeof teacherApplications.$inferSelect;
export type SystemSetting = typeof systemSettings.$inferSelect;
export type PaymentGateway = typeof paymentGateways.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type StudentProgress = typeof studentProgress.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type Course = typeof courses.$inferSelect;
export type Lesson = typeof lessons.$inferSelect;
export type Topic = typeof topics.$inferSelect;
export type TeacherAvailability = typeof teacherAvailability.$inferSelect;
export type Appointment = typeof appointments.$inferSelect;
export type ScheduleTemplate = typeof scheduleTemplates.$inferSelect;
export type CourseEnrollment = typeof courseEnrollments.$inferSelect;
export type StudyNote = typeof studyNotes.$inferSelect;
export type Message = typeof messages.$inferSelect;
// Chat system types
export type ChatThread = typeof chatThreads.$inferSelect;
export type ChatParticipant = typeof chatParticipants.$inferSelect;
export type SupportAgent = typeof supportAgents.$inferSelect;
export type SupportChatSession = typeof supportChatSessions.$inferSelect;
export type HelpChatMessage = typeof helpChatMessages.$inferSelect;
export type HelpChatSetting = typeof helpChatSettings.$inferSelect;
export type QuickResponse = typeof quickResponses.$inferSelect;
export type CourseCategory = typeof courseCategories.$inferSelect;
export type CourseReview = typeof courseReviews.$inferSelect;
export type Friendship = typeof friendships.$inferSelect;
export type CommunityGroup = typeof communityGroups.$inferSelect;
export type CommunityGroupMember = typeof communityGroupMembers.$inferSelect;
export type CommunityReaction = typeof communityReactions.$inferSelect;
export type CommunityTopic = typeof communityTopics.$inferSelect;
export type CommunityPost = typeof communityTopics.$inferSelect; // Backward compatibility
export type CommunityReply = typeof communityReplies.$inferSelect;
export type StudentDiscoveryPreferences = typeof studentDiscoveryPreferences.$inferSelect;
export type PricingPlan = typeof pricingPlans.$inferSelect;
export type UserSubscription = typeof userSubscriptions.$inferSelect;
export type ManualPlanAssignment = typeof manualPlanAssignments.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type Curriculum = typeof curricula.$inferSelect;
export type CountryCurriculum = typeof countryCurricula.$inferSelect;
export type Announcement = typeof announcements.$inferSelect;
export type ModerationLog = typeof moderationLogs.$inferSelect;
export type TeacherStudentAssignment = typeof teacherStudentAssignments.$inferSelect;
export type GroupMembership = typeof groupMemberships.$inferSelect;
export type PremiumMessage = typeof premiumMessages.$inferSelect;
// Subject-based education system types
export type Subject = typeof subjects.$inferSelect;
export type SubjectChapter = typeof subjectChapters.$inferSelect;
export type SubjectLesson = typeof subjectLessons.$inferSelect;
export type SubjectExercise = typeof subjectExercises.$inferSelect;
export type SubjectProgress = typeof subjectProgress.$inferSelect;
// Daily Questions system types
export type DailyQuestion = typeof dailyQuestions.$inferSelect;
export type DailyQuestionProgress = typeof dailyQuestionProgress.$inferSelect;
export type DailyProgressSummary = typeof dailyProgressSummary.$inferSelect;
// Transaction system types
export type Transaction = typeof transactions.$inferSelect;
export type PayoutAccount = typeof payoutAccounts.$inferSelect;
export type UserBalance = typeof userBalances.$inferSelect;
// Creator Earnings & Payout system types
export type CreatorEarningEvent = typeof creatorEarningEvents.$inferSelect;
export type CreatorBalance = typeof creatorBalances.$inferSelect;
export type CreatorPayoutRequest = typeof creatorPayoutRequests.$inferSelect;
export type ProductDownloadStats = typeof productDownloadStats.$inferSelect;
export type ProductDownloadEvent = typeof productDownloadEvents.$inferSelect;
// Assignment system types
export type Assignment = typeof assignments.$inferSelect;
export type AssignmentSubmission = typeof assignmentSubmissions.$inferSelect;
export type AssignmentComment = typeof assignmentComments.$inferSelect;
// Projects system types
export type Project = typeof projects.$inferSelect;
export type ProjectMilestone = typeof projectMilestones.$inferSelect;

// Video meetings system types
export type Meeting = typeof meetings.$inferSelect;
export type MeetingParticipant = typeof meetingParticipants.$inferSelect;
export type MeetingChatMessage = typeof meetingChatMessages.$inferSelect;
export type MeetingNotification = typeof meetingNotifications.$inferSelect;

// Freelancer Portfolio & Shop system types
export type ShowcaseProject = typeof showcaseProjects.$inferSelect;
export type ShowcaseProjectBoostLike = typeof showcaseProjectBoostLikes.$inferSelect;
export type InsertShowcaseProjectBoostLike = typeof showcaseProjectBoostLikes.$inferInsert;
export type ShowcaseProjectBoostComment = typeof showcaseProjectBoostComments.$inferSelect;
export type InsertShowcaseProjectBoostComment = typeof showcaseProjectBoostComments.$inferInsert;
export type Product = typeof products.$inferSelect;
export type ProductLike = typeof productLikes.$inferSelect;
export type ProductFollow = typeof productFollows.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Cart = typeof carts.$inferSelect;
export type CartItem = typeof cartItems.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type Coupon = typeof coupons.$inferSelect;
export type CouponUsage = typeof couponUsages.$inferSelect;

export type InsertUser = typeof users.$inferInsert;
export type InsertProfile = typeof profiles.$inferInsert;
export type InsertVerificationCode = typeof verificationCodes.$inferInsert;
export type InsertPasswordResetToken = typeof passwordResetTokens.$inferInsert;
export type InsertEmailVerification = typeof emailVerifications.$inferInsert;
export type InsertUserRole = typeof userRoles.$inferInsert;
export type InsertTeacherApplication = typeof teacherApplications.$inferInsert;
export type InsertSystemSetting = typeof systemSettings.$inferInsert;
export type InsertPaymentGateway = typeof paymentGateways.$inferInsert;
export type InsertNotification = typeof notifications.$inferInsert;
export type InsertApiKey = typeof apiKeys.$inferInsert;
export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertStudentProgress = typeof studentProgress.$inferInsert;
export type InsertTask = typeof tasks.$inferInsert;
export type InsertCourse = typeof courses.$inferInsert;
export type InsertLesson = typeof lessons.$inferInsert;
export type InsertTopic = typeof topics.$inferInsert;
export type InsertTeacherAvailability = typeof teacherAvailability.$inferInsert;
export type InsertAppointment = typeof appointments.$inferInsert;
export type InsertScheduleTemplate = typeof scheduleTemplates.$inferInsert;
export type InsertCourseEnrollment = typeof courseEnrollments.$inferInsert;
export type InsertStudyNote = typeof studyNotes.$inferInsert;
export type InsertMessage = typeof messages.$inferInsert;
// Chat system insert types
export type InsertChatThread = typeof chatThreads.$inferInsert;
export type InsertChatParticipant = typeof chatParticipants.$inferInsert;
export type InsertSupportAgent = typeof supportAgents.$inferInsert;
export type InsertSupportChatSession = typeof supportChatSessions.$inferInsert;
export type InsertHelpChatMessage = typeof helpChatMessages.$inferInsert;
export type InsertHelpChatSetting = typeof helpChatSettings.$inferInsert;
export type InsertQuickResponse = typeof quickResponses.$inferInsert;
export type InsertCourseCategory = typeof courseCategories.$inferInsert;
export type InsertCourseReview = typeof courseReviews.$inferInsert;
export type InsertFriendship = typeof friendships.$inferInsert;
export type InsertCommunityGroup = typeof communityGroups.$inferInsert;
export type InsertCommunityGroupMember = typeof communityGroupMembers.$inferInsert;
export type InsertCommunityReaction = typeof communityReactions.$inferInsert;
export type InsertCommunityTopic = typeof communityTopics.$inferInsert;
export type InsertCommunityPost = typeof communityTopics.$inferInsert; // Backward compatibility  
export type InsertCommunityReply = typeof communityReplies.$inferInsert;
export type InsertStudentDiscoveryPreferences = typeof studentDiscoveryPreferences.$inferInsert;
export type InsertPricingPlan = typeof pricingPlans.$inferInsert;
export type InsertUserSubscription = typeof userSubscriptions.$inferInsert;
export type InsertManualPlanAssignment = typeof manualPlanAssignments.$inferInsert;
export type InsertPayment = typeof payments.$inferInsert;
export type InsertCurriculum = typeof curricula.$inferInsert;
export type InsertCountryCurriculum = typeof countryCurricula.$inferInsert;
export type InsertAnnouncement = typeof announcements.$inferInsert;
export type InsertAnnouncementRead = typeof announcementReads.$inferInsert;
export type InsertModerationLog = typeof moderationLogs.$inferInsert;
export type InsertTeacherStudentAssignment = typeof teacherStudentAssignments.$inferInsert;
export type InsertGroupMembership = typeof groupMemberships.$inferInsert;
export type InsertPremiumMessage = typeof premiumMessages.$inferInsert;
// Subject-based education system insert types
export type InsertSubject = typeof subjects.$inferInsert;
export type InsertSubjectChapter = typeof subjectChapters.$inferInsert;
export type InsertSubjectLesson = typeof subjectLessons.$inferInsert;
export type InsertSubjectExercise = typeof subjectExercises.$inferInsert;
export type InsertSubjectProgress = typeof subjectProgress.$inferInsert;
// Daily Questions system insert types
export type InsertDailyQuestion = typeof dailyQuestions.$inferInsert;
export type InsertDailyQuestionProgress = typeof dailyQuestionProgress.$inferInsert;
export type InsertDailyProgressSummary = typeof dailyProgressSummary.$inferInsert;
// Subscription Access Control types
export type LessonAccessPermission = typeof lessonAccessPermissions.$inferSelect;
export type InsertLessonAccessPermission = typeof lessonAccessPermissions.$inferInsert;
export type DownloadQuotaUsage = typeof downloadQuotaUsage.$inferSelect;
export type InsertDownloadQuotaUsage = typeof downloadQuotaUsage.$inferInsert;
// Transaction system insert types
export type InsertTransaction = typeof transactions.$inferInsert;
export type InsertPayoutAccount = typeof payoutAccounts.$inferInsert;
export type InsertUserBalance = typeof userBalances.$inferInsert;
// Assignment system insert types
export type InsertAssignment = typeof assignments.$inferInsert;
export type InsertAssignmentSubmission = typeof assignmentSubmissions.$inferInsert;
export type InsertAssignmentComment = typeof assignmentComments.$inferInsert;
// Projects system insert types
export type InsertProject = typeof projects.$inferInsert;
export type InsertProjectMilestone = typeof projectMilestones.$inferInsert;

// Video meetings system insert types
export type InsertMeeting = typeof meetings.$inferInsert;
export type InsertMeetingParticipant = typeof meetingParticipants.$inferInsert;
export type InsertMeetingChatMessage = typeof meetingChatMessages.$inferInsert;
export type InsertMeetingNotification = typeof meetingNotifications.$inferInsert;

// Video meetings insert schemas with validation
export const insertMeetingSchema = createInsertSchema(meetings).omit({
  id: true,
  teacherId: true, // Set server-side from authenticated user
  endTime: true, // Calculated server-side from scheduledTime + duration
  agoraChannel: true, // Generated server-side
  agoraAppId: true,
  status: true,
  actualStartTime: true,
  actualEndTime: true,
  participantCount: true,
  notificationsSent: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMeetingParticipantSchema = createInsertSchema(meetingParticipants).omit({
  id: true,
  leftAt: true,
  sessionDuration: true,
  createdAt: true,
});

export const insertMeetingChatMessageSchema = createInsertSchema(meetingChatMessages).omit({
  id: true,
  createdAt: true,
});

export const insertMeetingNotificationSchema = createInsertSchema(meetingNotifications).omit({
  id: true,
  sentAt: true,
  status: true,
  errorMessage: true,
  createdAt: true,
});

// Product system insert types
export type InsertProduct = typeof products.$inferInsert;
export type InsertProductLike = typeof productLikes.$inferInsert;
export type InsertProductFollow = typeof productFollows.$inferInsert;
export type InsertCoupon = typeof coupons.$inferInsert;
export type InsertCouponUsage = typeof couponUsages.$inferInsert;

// Ads & Sponsored Listings system
export const adStatusEnum = pgEnum("ad_status", ["pending", "approved", "rejected", "expired", "paused"]);
export const adPlacementEnum = pgEnum("ad_placement", ["student_dashboard", "teacher_dashboard", "freelancer_dashboard", "customer_dashboard", "advertise_page", "talent_page"]);

// Banner Ads table
export const adsBanners = pgTable("ads_banners", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id), // Nullable for guest users
  title: text("title").notNull(),
  imageUrl: text("image_url").notNull(),
  placement: adPlacementEnum("placement").notNull(), // Primary placement (for backwards compatibility)
  placements: jsonb("placements"), // Array of placements for multi-dashboard targeting ["student_dashboard", "teacher_dashboard"]
  size: text("size").notNull(), // e.g. 728x90, 300x250, responsive
  status: adStatusEnum("status").default("pending").notNull(),
  price: numeric("price").notNull().default("0"), // Ad price - required field
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  targetLocations: jsonb("target_locations"), // ["US","ZA"] or null for global
  targetGrades: jsonb("target_grades"), // [1, 2, 12] or null for all grades
  targetDashboard: text("target_dashboard"), // Additional targeting option (deprecated, use placements)
  minAge: integer("min_age"), // Minimum age for ad display (nullable for no restriction)
  maxAge: integer("max_age"), // Maximum age for ad display (nullable for no restriction)
  guestEmail: text("guest_email"), // For guest advertisers
  guestName: text("guest_name"), // For guest advertisers
  linkUrl: varchar("link_url"), // Click-through URL
  impressions: integer("impressions").default(0).notNull(),
  clicks: integer("clicks").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Ad Pricing Configuration table - for managing ad pricing by targeting type and duration
export const adPricingConfig = pgTable("ad_pricing_config", {
  id: uuid("id").primaryKey().defaultRandom(),
  targetingType: text("targeting_type").notNull(), // "local" or "global"
  durationDays: integer("duration_days").notNull(), // 7, 14, 30, 90
  price: numeric("price", { precision: 10, scale: 2 }).notNull(), // Price for this combination
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  // Unique constraint to prevent duplicate pricing entries
  uniqueTargetingDuration: unique("unique_targeting_duration").on(table.targetingType, table.durationDays),
}));

// Relations for ads system
export const adsBannersRelations = relations(adsBanners, ({ one }) => ({
  user: one(users, { fields: [adsBanners.userId], references: [users.id] }),
}));


// Type exports for ads system
export type AdsBanner = typeof adsBanners.$inferSelect;
export type AdPricingConfig = typeof adPricingConfig.$inferSelect;

// Insert type exports for ads system
export type InsertAdsBanner = typeof adsBanners.$inferInsert;
export type InsertAdPricingConfig = typeof adPricingConfig.$inferInsert;

// Hero Sections table - Admin-managed responsive hero images for different pages
export const heroSections = pgTable("hero_sections", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id), // Admin who created
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  description: text("description"), // Optional description field
  placement: text("placement").notNull(), // "home", "about", "contact", "shop", "courses", etc.
  desktopImageUrl: text("desktop_image_url").notNull(), // 1920x1080
  tabletImageUrl: text("tablet_image_url").notNull(), // 1280x800
  mobileImageUrl: text("mobile_image_url").notNull(), // 720x1280
  linkUrl: text("link_url"), // Optional call-to-action link
  buttonText: text("button_text"), // CTA button text
  secondButtonText: text("second_button_text"), // Optional second button text
  secondButtonUrl: text("second_button_url"), // Optional second button URL
  status: text("status").default("active").notNull(), // active, inactive, scheduled
  priority: integer("priority").default(1).notNull(), // For ordering multiple heroes
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  textColor: text("text_color").default("#FFFFFF"), // Hex color for overlay text
  backgroundColor: text("background_color").default("#000000"), // Background overlay
  overlayOpacity: integer("overlay_opacity").default(30), // 0-100 for background overlay
  isFullHeight: boolean("is_full_height").default(true), // Full viewport height or custom
  customHeight: text("custom_height"), // e.g., "400px", "60vh"
  contentAlignment: text("content_alignment").default("center"), // left, center, right
  impressions: integer("impressions").default(0).notNull(),
  clicks: integer("clicks").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  // Index for efficient querying by placement and status
  placementStatusIdx: index("hero_placement_status_idx").on(table.placement, table.status),
}));

// Hero sections relations
export const heroSectionsRelations = relations(heroSections, ({ one }) => ({
  user: one(users, { fields: [heroSections.userId], references: [users.id] }),
}));

// Hero sections type exports
export type HeroSection = typeof heroSections.$inferSelect;
export type InsertHeroSection = typeof heroSections.$inferInsert;

// Hero sections Zod schemas - simplified to handle client data types
export const insertHeroSectionSchema = z.object({
  // Required fields
  title: z.string().min(1, "Title is required"),
  placement: z.string().min(1, "Placement is required"),
  desktopImageUrl: z.string().min(1, "Desktop image is required"),
  tabletImageUrl: z.string().min(1, "Tablet image is required"), 
  mobileImageUrl: z.string().min(1, "Mobile image is required"),
  
  // Optional fields with proper coercion
  subtitle: z.string().nullable().optional().transform(val => val === "" ? null : val),
  description: z.string().nullable().optional().transform(val => val === "" ? null : val),
  linkUrl: z.string().nullable().optional().transform(val => val === "" ? null : val),
  buttonText: z.string().nullable().optional().transform(val => val === "" ? null : val),
  secondButtonText: z.string().nullable().optional().transform(val => val === "" ? null : val),
  secondButtonUrl: z.string().nullable().optional().transform(val => val === "" ? null : val),
  userId: z.string().nullable().optional(),
  status: z.enum(["active", "inactive", "scheduled"]).default("active"),
  
  // Date fields - accept strings and convert to dates
  startDate: z.string().optional().transform(val => val ? new Date(val) : null),
  endDate: z.string().optional().transform(val => val ? new Date(val) : null),
  
  // Number fields - coerce from strings
  priority: z.coerce.number().positive().default(1),
  overlayOpacity: z.coerce.number().min(0).max(100).default(30),
  isFullHeight: z.coerce.boolean().default(true),
  
  // Style fields
  textColor: z.string().default("#FFFFFF"),
  backgroundColor: z.string().default("#000000"),
  contentAlignment: z.enum(["left", "center", "right"]).default("center"),
  customHeight: z.string().nullable().optional().transform(val => val === "" ? null : val),
});
export const selectHeroSectionSchema = createSelectSchema(heroSections);

// Shop categories types
export type ShopCategory = typeof shopCategories.$inferSelect;
export type InsertShopCategory = typeof shopCategories.$inferInsert;
export type CategoryFilter = typeof categoryFilters.$inferSelect;
export type InsertCategoryFilter = typeof categoryFilters.$inferInsert;
export type CategoryFilterOption = typeof categoryFilterOptions.$inferSelect;
export type InsertCategoryFilterOption = typeof categoryFilterOptions.$inferInsert;

// Shop categories Zod schemas
export const insertShopCategorySchema = createInsertSchema(shopCategories).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export const selectShopCategorySchema = createSelectSchema(shopCategories);

// Category filters Zod schemas
export const insertCategoryFilterSchema = createInsertSchema(categoryFilters).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export const selectCategoryFilterSchema = createSelectSchema(categoryFilters);

// Category filter options Zod schemas
export const insertCategoryFilterOptionSchema = createInsertSchema(categoryFilterOptions).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export const selectCategoryFilterOptionSchema = createSelectSchema(categoryFilterOptions);

// Portfolio System - Behance-like work showcase

// Portfolio work visibility enum
export const workVisibilityEnum = pgEnum("work_visibility", ["public", "unlisted", "private"]);

// Work media type enum  
export const workMediaTypeEnum = pgEnum("work_media_type", ["image", "video", "youtube", "vimeo"]);

// Works table - Main portfolio pieces
export const works = pgTable("works", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category"), // Category for filtering projects (e.g., "IT & Programming", "Design & Creative")
  tags: text("tags").array(), // Array of tags for categorization
  coverMediaId: uuid("cover_media_id"), // Reference to work_media for cover image (nullable for existing works)
  visibility: workVisibilityEnum("visibility").default("public").notNull(),
  likesCount: integer("likes_count").default(0).notNull(),
  commentsCount: integer("comments_count").default(0).notNull(),
  viewsCount: integer("views_count").default(0).notNull(),
  boostLikesCount: integer("boost_likes_count").default(0).notNull(), // Admin-added vanity likes
  boostViewsCount: integer("boost_views_count").default(0).notNull(), // Admin-added vanity views
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  // Performance optimization indexes
  index("idx_works_user_id").on(table.userId),
  index("idx_works_visibility").on(table.visibility),
  index("idx_works_created_at").on(table.createdAt),
  index("idx_works_user_visibility").on(table.userId, table.visibility), // Composite index for user's own works
  // Optimized composite indexes for query performance
  index("idx_works_user_created_desc").on(table.userId, table.createdAt.desc()),
  index("idx_works_visibility_created_desc").on(table.visibility, table.createdAt.desc()),
  index("idx_works_category").on(table.category), // Index for category filtering
]);

// Work media table - Images, videos, YouTube embeds for each work
export const workMedia = pgTable("work_media", {
  id: uuid("id").primaryKey().defaultRandom(),
  workId: uuid("work_id").references(() => works.id, { onDelete: "cascade" }).notNull(),
  type: workMediaTypeEnum("type").notNull(),
  url: text("url").notNull(), // Cloudinary URL or YouTube URL
  thumbUrl: text("thumb_url"), // Thumbnail URL for videos
  width: integer("width"),
  height: integer("height"),
  durationSec: integer("duration_sec"), // Video duration in seconds
  provider: text("provider"), // 'youtube' for YouTube videos
  providerId: text("provider_id"), // YouTube video ID
  sortOrder: integer("sort_order").default(0).notNull(), // Display order
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  // Performance optimization indexes
  index("idx_work_media_work_id").on(table.workId),
  index("idx_work_media_sort_order").on(table.sortOrder),
  index("idx_work_media_work_sort_order").on(table.workId, table.sortOrder), // Composite index for ordered media per work
]);

// Work likes table - Track user likes on works
export const workLikes = pgTable("work_likes", {
  id: uuid("id").primaryKey().defaultRandom(),
  workId: uuid("work_id").references(() => works.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  unique().on(table.workId, table.userId), // Prevent duplicate likes
  index("idx_work_likes_work_id").on(table.workId),
  index("idx_work_likes_user_id").on(table.userId),
]);

// Work comments table - Comments and replies on works
export const workComments = pgTable("work_comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  workId: uuid("work_id").references(() => works.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  content: text("content").notNull(),
  parentId: uuid("parent_id"), // Self-reference to be defined later
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_work_comments_work_id").on(table.workId, table.createdAt),
  index("idx_work_comments_parent_id").on(table.parentId),
]);

// Work views table - Track unique views per work
export const workViews = pgTable("work_views", {
  id: uuid("id").primaryKey().defaultRandom(),
  workId: uuid("work_id").references(() => works.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }), // Null for anonymous views
  sessionId: varchar("session_id", { length: 255 }), // For anonymous user tracking
  ipHash: varchar("ip_hash", { length: 255 }), // Hashed IP for deduplication
  viewDate: text("view_date").notNull(), // Store date as text for deduplication (YYYY-MM-DD)
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  // Prevent duplicate views per day - user or session/IP combination
  unique("unique_user_view_per_day").on(table.workId, table.userId, table.viewDate),
  unique("unique_session_view_per_day").on(table.workId, table.sessionId, table.viewDate),
  index("idx_work_views_work_id").on(table.workId),
]);

// Portfolio work types
export type Work = typeof works.$inferSelect;
export type InsertWork = typeof works.$inferInsert;
export type WorkMedia = typeof workMedia.$inferSelect;
export type InsertWorkMedia = typeof workMedia.$inferInsert;
export type WorkLike = typeof workLikes.$inferSelect;
export type InsertWorkLike = typeof workLikes.$inferInsert;
export type WorkComment = typeof workComments.$inferSelect;
export type InsertWorkComment = typeof workComments.$inferInsert;
export type WorkView = typeof workViews.$inferSelect;
export type InsertWorkView = typeof workViews.$inferInsert;

// Portfolio work Zod schemas
export const insertWorkSchema = createInsertSchema(works).omit({ 
  id: true, 
  userId: true,  // Added this - userId comes from auth context, not client
  likesCount: true,
  commentsCount: true,
  viewsCount: true,
  createdAt: true, 
  updatedAt: true 
});

export const selectWorkSchema = createSelectSchema(works);

// Update work schema - only allow specific fields to be updated
// Note: coverMediaId excluded - use dedicated PATCH /works/:workId/cover endpoint for security
export const updateWorkSchema = createInsertSchema(works).pick({
  title: true,
  description: true,
  category: true,
  tags: true,
  visibility: true
}).partial();

export const insertWorkMediaSchema = createInsertSchema(workMedia).omit({ 
  id: true, 
  createdAt: true 
});
export const selectWorkMediaSchema = createSelectSchema(workMedia);

export const insertWorkLikeSchema = createInsertSchema(workLikes).omit({ 
  id: true, 
  createdAt: true 
});
export const selectWorkLikeSchema = createSelectSchema(workLikes);

export const insertWorkCommentSchema = createInsertSchema(workComments).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export const selectWorkCommentSchema = createSelectSchema(workComments);

export const insertWorkViewSchema = createInsertSchema(workViews).omit({ 
  id: true, 
  createdAt: true 
});
export const selectWorkViewSchema = createSelectSchema(workViews);

// ============================================
// CUSTOMER DASHBOARD TABLES (EduFiliova Shop)
// ============================================

// Pending shop signups (before email verification)
export const pendingShopSignups = pgTable("pending_shop_signups", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  passwordHash: text("password_hash").notNull(),
  verificationCode: text("verification_code").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Shop customers table (extends users)
export const shopCustomers = pgTable("shop_customers", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull().unique(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  phoneCountryCode: text("phone_country_code").default("+1"),
  country: text("country"),
  accountType: text("account_type").default("free"), // free, monthly, yearly
  walletBalance: numeric("wallet_balance", { precision: 10, scale: 2 }).default("0.00"),
  profilePicture: text("profile_picture"),
  referralCode: text("referral_code").unique(),
  referralCount: integer("referral_count").default(0),
  referredBy: uuid("referred_by").references((): any => shopCustomers.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Shop purchases table
export const shopPurchases = pgTable("shop_purchases", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerId: uuid("customer_id").references(() => shopCustomers.id).notNull(),
  itemName: text("item_name").notNull(),
  itemType: text("item_type").notNull(), // mockup, template, bundle
  downloadUrl: text("download_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  orderId: text("order_id"), // Optional - null for free downloads, set for paid purchases
  status: text("status").default("completed"), // completed, pending, refunded
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_shop_purchases_customer_id").on(table.customerId),
  index("idx_shop_purchases_order_id").on(table.orderId),
]);

// Shop ads campaigns table
export const shopAds = pgTable("shop_ads", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerId: uuid("customer_id").references(() => shopCustomers.id).notNull(),
  campaignName: text("campaign_name").notNull(),
  status: text("status").default("pending"), // running, pending, expired, paused
  budget: numeric("budget", { precision: 10, scale: 2 }).notNull(),
  spent: numeric("spent", { precision: 10, scale: 2 }).default("0.00"),
  impressions: integer("impressions").default(0),
  clicks: integer("clicks").default(0),
  conversions: integer("conversions").default(0),
  targetAudience: text("target_audience"),
  adContent: text("ad_content"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_shop_ads_customer_id").on(table.customerId),
  index("idx_shop_ads_status").on(table.status),
  index("idx_shop_ads_customer_status").on(table.customerId, table.status),
]);

// Shop memberships table
export const shopMemberships = pgTable("shop_memberships", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerId: uuid("customer_id").references(() => shopCustomers.id).notNull().unique(),
  plan: text("plan").notNull(), // free, creator, pro, business
  billingCycle: text("billing_cycle"), // monthly, yearly
  status: text("status").default("active"), // active, expired, cancelled
  renewalDate: timestamp("renewal_date"),
  nextPaymentAmount: numeric("next_payment_amount", { precision: 10, scale: 2 }),
  scheduledPlan: text("scheduled_plan"), // Plan to switch to at scheduledPlanDate
  scheduledPlanDate: timestamp("scheduled_plan_date"), // When to apply scheduled plan change
  stripeSubscriptionId: text("stripe_subscription_id"),
  dailyDownloadsUsed: integer("daily_downloads_used").default(0),
  monthlyPaidDownloadsUsed: integer("monthly_paid_downloads_used").default(0),
  adsCreatedThisMonth: integer("ads_created_this_month").default(0),
  lastDailyResetDate: timestamp("last_daily_reset_date").defaultNow(),
  lastMonthlyResetDate: timestamp("last_monthly_reset_date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Shop wallet transactions table
export const shopTransactions = pgTable("shop_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerId: uuid("customer_id").references(() => shopCustomers.id).notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  type: text("type").notNull(), // add_funds, purchase, ad_spend, refund
  description: text("description").notNull(),
  status: text("status").default("completed"), // completed, pending, failed
  referenceId: text("reference_id"), // order ID or transaction reference
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_shop_transactions_customer_id").on(table.customerId),
  index("idx_shop_transactions_type").on(table.type),
  index("idx_shop_transactions_created_at").on(table.createdAt),
  index("idx_shop_transactions_reference_id").on(table.referenceId),
  unique("unique_shop_transactions_reference_id").on(table.referenceId),
]);

// Shop support tickets table
export const shopSupportTickets = pgTable("shop_support_tickets", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerId: uuid("customer_id").references(() => shopCustomers.id).notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  status: text("status").default("open"), // open, in_progress, resolved, closed, responded
  priority: text("priority").default("medium"), // low, medium, high, urgent
  category: text("category"), // technical, billing, general
  adminReply: text("admin_reply"),
  adminName: text("admin_name"),
  adminEmail: text("admin_email"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_shop_tickets_customer_id").on(table.customerId),
  index("idx_shop_tickets_status").on(table.status),
]);

// Shop vouchers table - Admin-created vouchers for wallet credit
export const shopVouchers = pgTable("shop_vouchers", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(), // Voucher code (e.g., "WELCOME100", "SUMMER50")
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(), // Amount to add to wallet
  description: text("description"), // Description of what the voucher is for
  maxRedemptions: integer("max_redemptions"), // null = unlimited, number = limited uses
  currentRedemptions: integer("current_redemptions").default(0), // How many times it's been used
  expiresAt: timestamp("expires_at"), // null = never expires
  isActive: boolean("is_active").default(true), // Whether voucher can be redeemed
  recipientName: text("recipient_name"), // Name of retailer/recipient
  recipientEmail: text("recipient_email"), // Email of retailer/recipient
  emailSent: boolean("email_sent").default(false), // Whether email was sent
  emailSentAt: timestamp("email_sent_at"), // When email was sent
  createdBy: uuid("created_by").references(() => users.id).notNull(), // Admin who created it
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_shop_vouchers_code").on(table.code),
  index("idx_shop_vouchers_active").on(table.isActive),
]);

// Shop voucher redemptions table - Track who redeemed which vouchers
export const shopVoucherRedemptions = pgTable("shop_voucher_redemptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  voucherId: uuid("voucher_id").references(() => shopVouchers.id).notNull(),
  customerId: uuid("customer_id").references(() => shopCustomers.id).notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(), // Amount credited
  redeemedAt: timestamp("redeemed_at").defaultNow().notNull(),
}, (table) => [
  index("idx_voucher_redemptions_voucher").on(table.voucherId),
  index("idx_voucher_redemptions_customer").on(table.customerId),
  unique("unique_customer_voucher").on(table.customerId, table.voucherId), // One redemption per customer per voucher
]);

// Shop voucher failed attempts table - Track failed redemption attempts for fraud prevention
export const shopVoucherFailedAttempts = pgTable("shop_voucher_failed_attempts", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerId: uuid("customer_id").references(() => shopCustomers.id).notNull(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  attemptedCode: text("attempted_code").notNull(), // The code they tried to use
  attemptedAt: timestamp("attempted_at").defaultNow().notNull(),
  ipAddress: text("ip_address"), // Optional IP tracking
}, (table) => [
  index("idx_voucher_failed_customer").on(table.customerId),
  index("idx_voucher_failed_user").on(table.userId),
  index("idx_voucher_failed_attempted_at").on(table.attemptedAt),
]);

// Gift voucher purchases table - Track user-purchased gift vouchers
export const giftVoucherPurchases = pgTable("gift_voucher_purchases", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(),
  voucherId: uuid("voucher_id").references(() => shopVouchers.id),
  buyerId: uuid("buyer_id").references(() => users.id),
  buyerEmail: text("buyer_email"),
  buyerName: text("buyer_name"),
  recipientEmail: text("recipient_email").notNull(),
  recipientName: text("recipient_name"),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  personalMessage: text("personal_message"),
  sendToSelf: boolean("send_to_self").default(false),
  paymentMethod: text("payment_method"),
  paymentIntentId: text("payment_intent_id"),
  paymentStatus: text("payment_status").default("pending"),
  emailSent: boolean("email_sent").default(false),
  emailSentAt: timestamp("email_sent_at"),
  expiresAt: timestamp("expires_at"),
  isRedeemed: boolean("is_redeemed").default(false),
  redeemedAt: timestamp("redeemed_at"),
  redeemedBy: uuid("redeemed_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_gift_voucher_code").on(table.code),
  index("idx_gift_voucher_buyer").on(table.buyerId),
  index("idx_gift_voucher_recipient").on(table.recipientEmail),
  index("idx_gift_voucher_status").on(table.paymentStatus),
]);

// Shop membership plans table - Admin-configurable plans
export const shopMembershipPlans = pgTable("shop_membership_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  planId: text("plan_id").notNull().unique(), // e.g., 'free', 'creator', 'pro', 'business'
  name: text("name").notNull(), // Display name
  description: text("description").notNull(),
  monthlyPrice: numeric("monthly_price", { precision: 10, scale: 2 }).notNull(),
  yearlyPrice: numeric("yearly_price", { precision: 10, scale: 2 }).notNull(),
  downloadsLimit: text("downloads_limit"), // e.g., "30 downloads", "Unlimited"
  features: jsonb("features").notNull().$type<string[]>(), // Array of feature strings
  annualAdLimit: integer("annual_ad_limit"), // Null = unlimited, 0 = none, positive = limit
  dailyDownloadLimit: integer("daily_download_limit"), // Daily download limit
  monthlyPaidDownloadLimit: integer("monthly_paid_download_limit"), // Monthly paid product download limit (null = unlimited)
  adDurations: jsonb("ad_durations").$type<number[]>(), // Allowed ad durations in days [7, 14, 30]
  popular: boolean("popular").default(false),
  active: boolean("active").default(true), // Allow admins to hide/show plans
  displayOrder: integer("display_order").default(0), // Order to display plans
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_shop_plans_active").on(table.active),
  index("idx_shop_plans_order").on(table.displayOrder),
]);

// Freelancer pricing plans table - Admin-configurable plans for freelancers
export const freelancerPricingPlans = pgTable("freelancer_pricing_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  planId: text("plan_id").notNull().unique(), // e.g., 'starter', 'pro', 'elite'
  name: text("name").notNull(), // Display name
  description: text("description").notNull(),
  badgeColor: text("badge_color").notNull(), // e.g., 'blue', 'green', 'orange'
  monthlyPrice: numeric("monthly_price", { precision: 10, scale: 2 }), // Null for lifetime plans
  yearlyPrice: numeric("yearly_price", { precision: 10, scale: 2 }), // Null for lifetime plans
  lifetimePrice: numeric("lifetime_price", { precision: 10, scale: 2 }), // For one-time plans
  billingType: text("billing_type").notNull().default("subscription"), // subscription or lifetime
  features: jsonb("features").notNull().$type<string[]>(), // Array of feature strings
  popular: boolean("popular").default(false),
  active: boolean("active").default(true), // Allow admins to hide/show plans
  displayOrder: integer("display_order").default(0), // Order to display plans
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_freelancer_plans_active").on(table.active),
  index("idx_freelancer_plans_order").on(table.displayOrder),
]);

// Course pricing plans table - Admin-configurable pricing tiers for courses
export const coursePricingPlans = pgTable("course_pricing_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  planId: text("plan_id").notNull().unique(), // e.g., 'free', 'tier_39', 'tier_69', 'tier_189', 'unlimited_99'
  name: text("name").notNull(), // Display name like 'Basic Tier', 'Standard Tier'
  description: text("description").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(), // Course price (0 for free)
  billingType: text("billing_type").notNull().default("one_time"), // 'one_time' or 'subscription'
  features: jsonb("features").notNull().$type<string[]>(), // Array of feature strings
  popular: boolean("popular").default(false),
  active: boolean("active").default(true), // Allow admins to hide/show plans
  displayOrder: integer("display_order").default(0), // Order to display plans
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_course_plans_active").on(table.active),
  index("idx_course_plans_order").on(table.displayOrder),
]);

// Admin Settings - API Keys and general configurations
export const adminSettings = pgTable("admin_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  settingKey: text("setting_key").notNull().unique(), // e.g., 'stripe_secret_key', 'paypal_client_id'
  settingValue: text("setting_value"), // Encrypted sensitive values
  category: text("category").notNull(), // 'payment', 'api', 'email', 'sms', 'general'
  description: text("description"), // What this setting does
  isEncrypted: boolean("is_encrypted").default(false), // Whether value is encrypted
  isActive: boolean("is_active").default(true), // Whether setting is currently active
  updatedBy: text("updated_by"), // Admin user ID who last updated
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_admin_settings_category").on(table.category),
  index("idx_admin_settings_active").on(table.isActive),
]);

// Payment Gateway Settings - Configurable payment providers
export const paymentGateways = pgTable("payment_gateways", {
  id: uuid("id").primaryKey().defaultRandom(),
  gatewayId: text("gateway_id").notNull().unique(), // 'stripe', 'paypal', 'square', etc.
  gatewayName: text("gateway_name").notNull(), // Display name
  isEnabled: boolean("is_enabled").default(false), // Whether gateway is active
  isPrimary: boolean("is_primary").default(false), // Primary payment method
  publishableKey: text("publishable_key"), // Public/Publishable key
  secretKey: text("secret_key"), // Secret key (encrypted)
  webhookSecret: text("webhook_secret"), // Webhook secret (encrypted)
  additionalConfig: jsonb("additional_config").$type<Record<string, any>>(), // Extra configs
  testMode: boolean("test_mode").default(true), // Test or production mode
  supportedCurrencies: jsonb("supported_currencies").$type<string[]>(), // ['USD', 'EUR', etc.]
  features: jsonb("features").$type<string[]>(), // ['subscriptions', 'one_time', 'refunds']
  updatedBy: text("updated_by"), // Admin user ID
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_payment_gateways_enabled").on(table.isEnabled),
  index("idx_payment_gateways_primary").on(table.isPrimary),
]);

// Types
export type PendingShopSignup = typeof pendingShopSignups.$inferSelect;
export type InsertPendingShopSignup = typeof pendingShopSignups.$inferInsert;
export type ShopCustomer = typeof shopCustomers.$inferSelect;
export type InsertShopCustomer = typeof shopCustomers.$inferInsert;
export type ShopPurchase = typeof shopPurchases.$inferSelect;
export type InsertShopPurchase = typeof shopPurchases.$inferInsert;
export type ShopAd = typeof shopAds.$inferSelect;
export type InsertShopAd = typeof shopAds.$inferInsert;
export type ShopMembership = typeof shopMemberships.$inferSelect;
export type InsertShopMembership = typeof shopMemberships.$inferInsert;
export type ShopTransaction = typeof shopTransactions.$inferSelect;
export type InsertShopTransaction = typeof shopTransactions.$inferInsert;
export type ShopSupportTicket = typeof shopSupportTickets.$inferSelect;
export type InsertShopSupportTicket = typeof shopSupportTickets.$inferInsert;
export type ShopVoucher = typeof shopVouchers.$inferSelect;
export type InsertShopVoucher = typeof shopVouchers.$inferInsert;
export type ShopVoucherRedemption = typeof shopVoucherRedemptions.$inferSelect;
export type InsertShopVoucherRedemption = typeof shopVoucherRedemptions.$inferInsert;
export type GiftVoucherPurchase = typeof giftVoucherPurchases.$inferSelect;
export type InsertGiftVoucherPurchase = typeof giftVoucherPurchases.$inferInsert;
export type ShopMembershipPlan = typeof shopMembershipPlans.$inferSelect;
export type InsertShopMembershipPlan = typeof shopMembershipPlans.$inferInsert;
export type FreelancerPricingPlan = typeof freelancerPricingPlans.$inferSelect;
export type InsertFreelancerPricingPlan = typeof freelancerPricingPlans.$inferInsert;
export type AdminSetting = typeof adminSettings.$inferSelect;
export type InsertAdminSetting = typeof adminSettings.$inferInsert;

// Zod schemas
export const insertPendingShopSignupSchema = createInsertSchema(pendingShopSignups).omit({ 
  id: true, 
  createdAt: true 
});
export const insertShopCustomerSchema = createInsertSchema(shopCustomers).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export const insertShopPurchaseSchema = createInsertSchema(shopPurchases).omit({ 
  id: true, 
  createdAt: true 
});
export const insertShopAdSchema = createInsertSchema(shopAds).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export const insertShopMembershipSchema = createInsertSchema(shopMemberships).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export const insertShopTransactionSchema = createInsertSchema(shopTransactions).omit({ 
  id: true, 
  createdAt: true 
});
export const insertShopSupportTicketSchema = createInsertSchema(shopSupportTickets).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export const insertShopVoucherSchema = createInsertSchema(shopVouchers).omit({ 
  id: true, 
  currentRedemptions: true,
  createdAt: true, 
  updatedAt: true 
});
export const insertShopVoucherRedemptionSchema = createInsertSchema(shopVoucherRedemptions).omit({ 
  id: true, 
  redeemedAt: true 
});
export const insertGiftVoucherPurchaseSchema = createInsertSchema(giftVoucherPurchases).omit({ 
  id: true, 
  createdAt: true 
});
export const insertShopMembershipPlanSchema = createInsertSchema(shopMembershipPlans).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export const insertFreelancerPricingPlanSchema = createInsertSchema(freelancerPricingPlans).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export const insertAdminSettingSchema = createInsertSchema(adminSettings).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export const insertPaymentGatewaySchema = createInsertSchema(paymentGateways).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

// Shop Dashboard Response Schemas
export const shopDashboardStatsSchema = z.object({
  totalPurchases: z.number(),
  activeAds: z.number(),
  walletBalance: z.string(),
  membership: z.object({
    plan: z.string(),
    planName: z.string(),
    billingCycle: z.enum(['monthly', 'yearly']),
    dailyDownloadsUsed: z.number(),
    dailyDownloadLimit: z.number().nullable(),
    monthlyPaidDownloadsUsed: z.number(),
    monthlyPaidDownloadLimit: z.number().nullable(),
    adsCreatedThisMonth: z.number(),
    adLimit: z.number().nullable(),
    adDurations: z.array(z.number()).nullable()
  }).nullable(),
});

export const shopWalletSchema = z.object({
  balance: z.string(),
});

export const shopProfileSchema = z.object({
  fullName: z.string(),
  email: z.string(),
  phone: z.string().nullable().optional(),
  phoneCountryCode: z.string().nullable().optional(),
  profilePicture: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
});

export type ShopDashboardStats = z.infer<typeof shopDashboardStatsSchema>;
export type ShopWallet = z.infer<typeof shopWalletSchema>;
export type ShopProfile = z.infer<typeof shopProfileSchema>;

// Certificates types and schemas
export type Certificate = typeof certificates.$inferSelect;
export type InsertCertificate = typeof certificates.$inferInsert;

export const insertCertificateSchema = createInsertSchema(certificates).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

// Contact Messages types and schemas
export type ContactMessage = typeof contactMessages.$inferSelect;
export type InsertContactMessage = typeof contactMessages.$inferInsert;

export const insertContactMessageSchema = createInsertSchema(contactMessages).omit({
  id: true,
  createdAt: true,
  isRead: true,
  readAt: true
});

// Email Accounts table - for managing multiple email accounts
export const emailAccounts = pgTable("email_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  displayName: text("display_name").notNull(),
  
  // IMAP settings
  imapHost: text("imap_host").notNull(),
  imapPort: integer("imap_port").notNull().default(993),
  imapSecure: boolean("imap_secure").notNull().default(true),
  imapUsername: text("imap_username").notNull(),
  imapPassword: text("imap_password").notNull(),
  
  // SMTP settings
  smtpHost: text("smtp_host").notNull(),
  smtpPort: integer("smtp_port").notNull().default(587),
  smtpSecure: boolean("smtp_secure").notNull().default(false),
  smtpUsername: text("smtp_username").notNull(),
  smtpPassword: text("smtp_password").notNull(),
  
  // Account status
  isActive: boolean("is_active").notNull().default(true),
  lastSyncedAt: timestamp("last_synced_at"),
  syncStatus: text("sync_status").default("idle"), // idle, syncing, error
  syncError: text("sync_error"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Email Messages table - for storing fetched emails
export const emailMessages = pgTable("email_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  emailAccountId: uuid("email_account_id").references(() => emailAccounts.id).notNull(),
  
  // Email metadata
  messageId: text("message_id").notNull().unique(), // Unique message ID from email server
  from: text("from").notNull(),
  to: text("to").notNull(),
  cc: text("cc"),
  bcc: text("bcc"),
  subject: text("subject").notNull(),
  
  // Email content
  textBody: text("text_body"),
  htmlBody: text("html_body"),
  
  // Email status
  isRead: boolean("is_read").notNull().default(false),
  isReplied: boolean("is_replied").notNull().default(false),
  isStarred: boolean("is_starred").notNull().default(false),
  isSpam: boolean("is_spam").notNull().default(false),
  isArchived: boolean("is_archived").notNull().default(false),
  isTrashed: boolean("is_trashed").notNull().default(false),
  
  // Threading
  inReplyTo: text("in_reply_to"),
  references: text("references"),
  
  // Attachments (stored as JSON array)
  attachments: jsonb("attachments"),
  
  receivedAt: timestamp("received_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("emailMessages_emailAccountId_idx").on(table.emailAccountId),
  index("emailMessages_messageId_idx").on(table.messageId),
  index("emailMessages_receivedAt_idx").on(table.receivedAt),
]);

// Email Replies table - for tracking sent replies
export const emailReplies = pgTable("email_replies", {
  id: uuid("id").primaryKey().defaultRandom(),
  emailMessageId: uuid("email_message_id").references(() => emailMessages.id).notNull(),
  emailAccountId: uuid("email_account_id").references(() => emailAccounts.id).notNull(),
  
  // Reply content
  to: text("to").notNull(),
  cc: text("cc"),
  subject: text("subject").notNull(),
  textBody: text("text_body"),
  htmlBody: text("html_body"),
  
  // Attachments (stored as JSON array of file URLs)
  attachments: jsonb("attachments"),
  
  // Reply metadata
  sentBy: uuid("sent_by").references(() => users.id).notNull(),
  sentAt: timestamp("sent_at").notNull(),
  sendStatus: text("send_status").default("sent"), // sent, failed
  sendError: text("send_error"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("emailReplies_emailMessageId_idx").on(table.emailMessageId),
  index("emailReplies_emailAccountId_idx").on(table.emailAccountId),
]);

// Email account types and schemas
export type EmailAccount = typeof emailAccounts.$inferSelect;
export type InsertEmailAccount = typeof emailAccounts.$inferInsert;

export const insertEmailAccountSchema = createInsertSchema(emailAccounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastSyncedAt: true,
});

// Email message types and schemas
export type EmailMessage = typeof emailMessages.$inferSelect;
export type InsertEmailMessage = typeof emailMessages.$inferInsert;

export const insertEmailMessageSchema = createInsertSchema(emailMessages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Email reply types and schemas
export type EmailReply = typeof emailReplies.$inferSelect;
export type InsertEmailReply = typeof emailReplies.$inferInsert;

export const insertEmailReplySchema = createInsertSchema(emailReplies).omit({
  id: true,
  createdAt: true,
});

// Email Folders table - for organizing emails (Inbox, Sent, Drafts, Custom folders)
export const emailFolders = pgTable("email_folders", {
  id: uuid("id").primaryKey().defaultRandom(),
  emailAccountId: uuid("email_account_id").references(() => emailAccounts.id).notNull(),
  name: text("name").notNull(),
  type: text("type").notNull().default("custom"), // system (inbox, sent, drafts, trash), custom
  icon: text("icon"),
  color: text("color"),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("emailFolders_emailAccountId_idx").on(table.emailAccountId),
]);

// Email Labels table - for categorizing emails
export const emailLabels = pgTable("email_labels", {
  id: uuid("id").primaryKey().defaultRandom(),
  emailAccountId: uuid("email_account_id").references(() => emailAccounts.id).notNull(),
  name: text("name").notNull(),
  color: text("color").notNull().default("#3b82f6"), // Tailwind blue-500
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("emailLabels_emailAccountId_idx").on(table.emailAccountId),
]);

// Email Label Assignments - many-to-many relationship
export const emailLabelAssignments = pgTable("email_label_assignments", {
  id: uuid("id").primaryKey().defaultRandom(),
  emailMessageId: uuid("email_message_id").references(() => emailMessages.id).notNull(),
  emailLabelId: uuid("email_label_id").references(() => emailLabels.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("emailLabelAssignments_emailMessageId_idx").on(table.emailMessageId),
  index("emailLabelAssignments_emailLabelId_idx").on(table.emailLabelId),
  unique("emailLabelAssignments_unique").on(table.emailMessageId, table.emailLabelId),
]);

// Sent Emails table - for storing sent/composed emails
export const sentEmails = pgTable("sent_emails", {
  id: uuid("id").primaryKey().defaultRandom(),
  emailAccountId: uuid("email_account_id").references(() => emailAccounts.id).notNull(),
  
  // Email metadata
  to: text("to").notNull(),
  cc: text("cc"),
  bcc: text("bcc"),
  subject: text("subject").notNull(),
  
  // Email content
  textBody: text("text_body"),
  htmlBody: text("html_body"),
  
  // Attachments (stored as JSON array of file URLs)
  attachments: jsonb("attachments"),
  
  // Send status
  status: text("status").notNull().default("sending"), // draft, sending, sent, failed
  sendError: text("send_error"),
  
  // Threading
  inReplyTo: text("in_reply_to"),
  references: text("references"),
  
  sentBy: uuid("sent_by").references(() => users.id).notNull(),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("sentEmails_emailAccountId_idx").on(table.emailAccountId),
  index("sentEmails_status_idx").on(table.status),
  index("sentEmails_sentAt_idx").on(table.sentAt),
]);

// Email folder types and schemas
export type EmailFolder = typeof emailFolders.$inferSelect;
export type InsertEmailFolder = typeof emailFolders.$inferInsert;

export const insertEmailFolderSchema = createInsertSchema(emailFolders).omit({
  id: true,
  createdAt: true,
});

// Email label types and schemas
export type EmailLabel = typeof emailLabels.$inferSelect;
export type InsertEmailLabel = typeof emailLabels.$inferInsert;

export const insertEmailLabelSchema = createInsertSchema(emailLabels).omit({
  id: true,
  createdAt: true,
});

// Email label assignment types
export type EmailLabelAssignment = typeof emailLabelAssignments.$inferSelect;
export type InsertEmailLabelAssignment = typeof emailLabelAssignments.$inferInsert;

// Sent email types and schemas
export type SentEmail = typeof sentEmails.$inferSelect;
export type InsertSentEmail = typeof sentEmails.$inferInsert;

export const insertSentEmailSchema = createInsertSchema(sentEmails).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Blog Posts table
export const blogPosts = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  excerpt: text("excerpt"),
  content: text("content").notNull(),
  category: text("category"),
  coverImage: text("cover_image"),
  youtubeUrl: text("youtube_url"),
  authorId: uuid("author_id").references(() => users.id).notNull(),
  authorName: text("author_name").notNull(),
  authorAvatar: text("author_avatar"),
  isPublished: boolean("is_published").default(false).notNull(),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("blogPosts_slug_idx").on(table.slug),
  index("blogPosts_isPublished_idx").on(table.isPublished),
  index("blogPosts_publishedAt_idx").on(table.publishedAt),
]);

// Blog post types and schemas
export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = typeof blogPosts.$inferInsert;

export const insertBlogPostSchema = createInsertSchema(blogPosts).omit({
  id: true,
  slug: true,
  authorId: true,
  authorName: true,
  authorAvatar: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true,
});

// Contact form submissions table
export const contactSubmissions = pgTable("contact_submissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  formType: text("form_type").notNull(), // 'contact' or 'design-team'
  name: text("name").notNull(),
  email: text("email").notNull(),
  subject: text("subject"),
  message: text("message").notNull(),
  company: text("company"),
  phone: text("phone"),
  projectType: text("project_type"),
  budget: text("budget"),
  timeline: text("timeline"),
  fileUrl: text("file_url"),
  isRead: boolean("is_read").default(false).notNull(),
  status: text("status").default("new").notNull(), // 'new', 'in-progress', 'resolved'
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("contactSubmissions_formType_idx").on(table.formType),
  index("contactSubmissions_isRead_idx").on(table.isRead),
  index("contactSubmissions_status_idx").on(table.status),
  index("contactSubmissions_createdAt_idx").on(table.createdAt),
]);

// Contact submission types and schemas
export type ContactSubmission = typeof contactSubmissions.$inferSelect;
export type InsertContactSubmission = typeof contactSubmissions.$inferInsert;

export const insertContactSubmissionSchema = createInsertSchema(contactSubmissions).omit({
  id: true,
  isRead: true,
  status: true,
  adminNotes: true,
  createdAt: true,
  updatedAt: true,
});

// App Download Links table for managing mobile app store badges in footer
export const appDownloadLinks = pgTable("app_download_links", {
  id: serial("id").primaryKey(),
  appStoreUrl: text("app_store_url"),
  appStoreText: text("app_store_text").default("Download on the"),
  googlePlayUrl: text("google_play_url"),
  googlePlayText: text("google_play_text").default("Get it on"),
  huaweiGalleryUrl: text("huawei_gallery_url"),
  huaweiGalleryText: text("huawei_gallery_text").default("Explore it on"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// App Download Links types and schemas
export type AppDownloadLinks = typeof appDownloadLinks.$inferSelect;
export type InsertAppDownloadLinks = typeof appDownloadLinks.$inferInsert;

export const insertAppDownloadLinksSchema = createInsertSchema(appDownloadLinks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Social Media Links table for managing social media icons in footer
export const socialMediaLinks = pgTable("social_media_links", {
  id: serial("id").primaryKey(),
  whatsappUrl: text("whatsapp_url"),
  linkedinUrl: text("linkedin_url"),
  instagramUrl: text("instagram_url"),
  threadsUrl: text("threads_url"),
  tiktokUrl: text("tiktok_url"),
  dribbbleUrl: text("dribbble_url"),
  facebookUrl: text("facebook_url"),
  xUrl: text("x_url"),
  pinterestUrl: text("pinterest_url"),
  behanceUrl: text("behance_url"),
  telegramUrl: text("telegram_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Social Media Links types and schemas
export type SocialMediaLinks = typeof socialMediaLinks.$inferSelect;
export type InsertSocialMediaLinks = typeof socialMediaLinks.$inferInsert;

export const insertSocialMediaLinksSchema = createInsertSchema(socialMediaLinks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// WhatsApp Integration Tables

// WhatsApp conversations - Track user conversations and state
export const whatsappConversations = pgTable("whatsapp_conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  whatsappPhone: text("whatsapp_phone").notNull().unique(),
  userId: uuid("user_id").references(() => users.id),
  currentFlow: text("current_flow"), // 'registration', 'course_browsing', 'payment', 'quiz', null
  flowState: jsonb("flow_state"), // Store current state in the conversation flow
  lastMessageAt: timestamp("last_message_at").defaultNow(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("whatsapp_conversations_phone_idx").on(table.whatsappPhone),
  index("whatsapp_conversations_user_idx").on(table.userId),
]);

// WhatsApp message logs - Track all sent and received messages
export const whatsappMessageLogs = pgTable("whatsapp_message_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  conversationId: uuid("conversation_id").references(() => whatsappConversations.id),
  whatsappPhone: text("whatsapp_phone").notNull(),
  direction: text("direction").notNull(), // 'inbound' or 'outbound'
  messageType: text("message_type").notNull(), // 'text', 'interactive', 'template', 'image', etc.
  messageContent: jsonb("message_content"), // Full message payload
  messageId: text("message_id"), // WhatsApp message ID
  status: text("status").default("sent"), // 'sent', 'delivered', 'read', 'failed'
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("whatsapp_logs_conversation_idx").on(table.conversationId),
  index("whatsapp_logs_phone_idx").on(table.whatsappPhone),
  index("whatsapp_logs_created_idx").on(table.createdAt),
]);

// Daily quiz questions - Questions sent via WhatsApp
export const dailyQuizQuestions = pgTable("daily_quiz_questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  subject: text("subject").notNull(), // 'Math', 'Science', 'English', etc.
  gradeLevel: gradeLevelEnum("grade_level").notNull(),
  question: text("question").notNull(),
  optionA: text("option_a").notNull(),
  optionB: text("option_b").notNull(),
  optionC: text("option_c").notNull(),
  optionD: text("option_d").notNull(),
  correctAnswer: text("correct_answer").notNull(), // 'A', 'B', 'C', or 'D'
  explanation: text("explanation"),
  difficulty: text("difficulty").default("medium"), // 'easy', 'medium', 'hard'
  isActive: boolean("is_active").default(true),
  scheduledFor: timestamp("scheduled_for"), // When to send this quiz
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("daily_quiz_subject_idx").on(table.subject),
  index("daily_quiz_grade_idx").on(table.gradeLevel),
  index("daily_quiz_scheduled_idx").on(table.scheduledFor),
]);

// Quiz responses - Student answers to WhatsApp quizzes
export const quizResponses = pgTable("quiz_responses", {
  id: uuid("id").primaryKey().defaultRandom(),
  questionId: uuid("question_id").references(() => dailyQuizQuestions.id).notNull(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  userAnswer: text("user_answer").notNull(), // 'A', 'B', 'C', or 'D'
  isCorrect: boolean("is_correct").notNull(),
  responseTime: integer("response_time_seconds"), // How long to answer
  streak: integer("streak").default(0), // Current streak of correct answers
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("quiz_responses_question_idx").on(table.questionId),
  index("quiz_responses_user_idx").on(table.userId),
  unique("quiz_response_unique").on(table.questionId, table.userId),
]);

// WhatsApp payment intents - Track payment flows initiated via WhatsApp
export const whatsappPaymentIntents = pgTable("whatsapp_payment_intents", {
  id: uuid("id").primaryKey().defaultRandom(),
  conversationId: uuid("conversation_id").references(() => whatsappConversations.id).notNull(),
  userId: uuid("user_id").references(() => users.id),
  courseId: uuid("course_id").references(() => courses.id),
  subscriptionTier: text("subscription_tier"), // If subscribing
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("USD"),
  paymentMethod: text("payment_method"), // 'stripe', 'paypal', 'vodapay'
  paymentUrl: text("payment_url"), // Generated payment link
  status: text("status").default("pending"), // 'pending', 'completed', 'cancelled', 'expired'
  stripeSessionId: text("stripe_session_id"),
  paypalOrderId: text("paypal_order_id"),
  expiresAt: timestamp("expires_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("whatsapp_payment_conversation_idx").on(table.conversationId),
  index("whatsapp_payment_user_idx").on(table.userId),
  index("whatsapp_payment_status_idx").on(table.status),
]);

// WhatsApp message templates - Approved templates for sending messages
export const whatsappMessageTemplates = pgTable("whatsapp_message_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  templateName: text("template_name").notNull().unique(),
  templateCategory: text("template_category").notNull(), // 'authentication', 'utility', 'marketing'
  language: text("language").default("en"),
  headerText: text("header_text"),
  bodyText: text("body_text").notNull(),
  footerText: text("footer_text"),
  buttons: jsonb("buttons"), // Array of button objects
  metaTemplateId: text("meta_template_id"), // Template ID from Meta
  status: text("status").default("pending"), // 'pending', 'approved', 'rejected'
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("whatsapp_templates_name_idx").on(table.templateName),
  index("whatsapp_templates_category_idx").on(table.templateCategory),
]);

// WhatsApp Conversation types
export type WhatsAppConversation = typeof whatsappConversations.$inferSelect;
export type InsertWhatsAppConversation = typeof whatsappConversations.$inferInsert;

export const insertWhatsAppConversationSchema = createInsertSchema(whatsappConversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// WhatsApp Message Log types
export type WhatsAppMessageLog = typeof whatsappMessageLogs.$inferSelect;
export type InsertWhatsAppMessageLog = typeof whatsappMessageLogs.$inferInsert;

export const insertWhatsAppMessageLogSchema = createInsertSchema(whatsappMessageLogs).omit({
  id: true,
  createdAt: true,
});

// Daily Quiz Question types
export type DailyQuizQuestion = typeof dailyQuizQuestions.$inferSelect;
export type InsertDailyQuizQuestion = typeof dailyQuizQuestions.$inferInsert;

export const insertDailyQuizQuestionSchema = createInsertSchema(dailyQuizQuestions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Quiz Response types
export type QuizResponse = typeof quizResponses.$inferSelect;
export type InsertQuizResponse = typeof quizResponses.$inferInsert;

export const insertQuizResponseSchema = createInsertSchema(quizResponses).omit({
  id: true,
  createdAt: true,
});

// WhatsApp Payment Intent types
export type WhatsAppPaymentIntent = typeof whatsappPaymentIntents.$inferSelect;
export type InsertWhatsAppPaymentIntent = typeof whatsappPaymentIntents.$inferInsert;

export const insertWhatsAppPaymentIntentSchema = createInsertSchema(whatsappPaymentIntents).omit({
  id: true,
  createdAt: true,
});

// WhatsApp Message Template types
export type WhatsAppMessageTemplate = typeof whatsappMessageTemplates.$inferSelect;
export type InsertWhatsAppMessageTemplate = typeof whatsappMessageTemplates.$inferInsert;

export const insertWhatsAppMessageTemplateSchema = createInsertSchema(whatsappMessageTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Profile boost likes types and schemas
export type ProfileBoostLike = typeof profileBoostLikes.$inferSelect;
export type InsertProfileBoostLike = typeof profileBoostLikes.$inferInsert;

export const insertProfileBoostLikeSchema = createInsertSchema(profileBoostLikes).omit({
  id: true,
  createdAt: true,
});

// Profile boost followers types and schemas
export type ProfileBoostFollower = typeof profileBoostFollowers.$inferSelect;
export type InsertProfileBoostFollower = typeof profileBoostFollowers.$inferInsert;

export const insertProfileBoostFollowerSchema = createInsertSchema(profileBoostFollowers).omit({
  id: true,
  createdAt: true,
});

// Freelancer Applications table - Stores freelancer signup applications
export const freelancerApplications = pgTable("freelancer_applications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id),
  fullName: text("full_name").notNull(),
  displayName: text("display_name").notNull(),
  email: text("email").notNull(),
  phoneNumber: text("phone_number"),
  country: text("country").notNull(),
  primaryCategory: text("primary_category").notNull(),
  tagline: text("tagline").notNull(),
  about: text("about").notNull(),
  skills: text("skills").array(),
  servicesOffered: text("services_offered").array(),
  behanceUrl: text("behance_url"),
  githubUrl: text("github_url"),
  websiteUrl: text("website_url"),
  status: approvalStatusEnum("status").default("pending").notNull(),
  approvedBy: uuid("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  rejectionReason: text("rejection_reason"),
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("freelancer_applications_status_idx").on(table.status),
  index("freelancer_applications_email_idx").on(table.email),
]);

// Portfolio Samples table - Stores portfolio samples for freelancer applications
export const portfolioSamples = pgTable("portfolio_samples", {
  id: uuid("id").primaryKey().defaultRandom(),
  applicationId: uuid("application_id").references(() => freelancerApplications.id).notNull(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  fileUrls: text("file_urls").array().notNull(),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("portfolio_samples_application_idx").on(table.applicationId),
]);

// Freelancer Application types and schemas
export type FreelancerApplication = typeof freelancerApplications.$inferSelect;
export type InsertFreelancerApplication = typeof freelancerApplications.$inferInsert;

export const insertFreelancerApplicationSchema = createInsertSchema(freelancerApplications).omit({
  id: true,
  userId: true,
  status: true,
  approvedBy: true,
  approvedAt: true,
  rejectionReason: true,
  adminNotes: true,
  createdAt: true,
  updatedAt: true,
});

// Portfolio Sample types and schemas
export type PortfolioSample = typeof portfolioSamples.$inferSelect;
export type InsertPortfolioSample = typeof portfolioSamples.$inferInsert;

export const insertPortfolioSampleSchema = createInsertSchema(portfolioSamples).omit({
  id: true,
  applicationId: true,
  createdAt: true,
});

// User Progress table - Stores user learning progress and level
export const usersProgress = pgTable("users_progress", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").references(() => users.userId).notNull().unique(),
  level: integer("level").notNull().default(1),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("users_progress_user_id_idx").on(table.userId),
]);

// User Progress types and schemas
export type UserProgress = typeof usersProgress.$inferSelect;
export type InsertUserProgress = typeof usersProgress.$inferInsert;

export const insertUserProgressSchema = createInsertSchema(usersProgress).omit({
  id: true,
  updatedAt: true,
});

// User Subjects table - Stores subjects selected by users
export const userSubjects = pgTable("user_subjects", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").references(() => users.userId).notNull(),
  subject: text("subject").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("user_subjects_user_id_idx").on(table.userId),
  unique("user_subject_unique").on(table.userId, table.subject),
]);

// User Subjects types and schemas
export type UserSubject = typeof userSubjects.$inferSelect;
export type InsertUserSubject = typeof userSubjects.$inferInsert;

export const insertUserSubjectSchema = createInsertSchema(userSubjects).omit({
  id: true,
  updatedAt: true,
});

// User Chats table - Stores user chat messages and quiz results
export const userChats = pgTable("user_chats", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").references(() => users.userId).notNull().unique(),
  messages: jsonb("messages").notNull().default(sql`'[]'::jsonb`),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("user_chats_user_id_idx").on(table.userId),
]);

// User Chats types and schemas
export type UserChat = typeof userChats.$inferSelect;
export type InsertUserChat = typeof userChats.$inferInsert;

export const insertUserChatSchema = createInsertSchema(userChats).omit({
  id: true,
  updatedAt: true,
});

// Error severity enum for system error logging
export const errorSeverityEnum = pgEnum("error_severity", ["critical", "error", "warning", "info"]);

// Error category enum for classification
export const errorCategoryEnum = pgEnum("error_category", ["database", "api", "validation", "auth", "payment", "file", "network", "unknown"]);

// System Errors table - Admin-only error tracking
export const systemErrors = pgTable("system_errors", {
  id: uuid("id").primaryKey().defaultRandom(),
  occurredAt: timestamp("occurred_at").defaultNow().notNull(),
  severity: errorSeverityEnum("severity").notNull().default("error"),
  category: errorCategoryEnum("category").notNull().default("unknown"),
  source: text("source").notNull(), // e.g., "server", "client", "webhook"
  endpoint: text("endpoint"), // API endpoint that caused the error
  method: text("method"), // HTTP method
  userRoleContext: text("user_role_context"), // Role of user who triggered error
  userId: text("user_id"), // User ID if available
  message: text("message").notNull(), // Full technical error message
  userFriendlyMessage: text("user_friendly_message"), // Sanitized message shown to user
  stack: text("stack"), // Stack trace
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`), // Additional context (request body, headers, etc.)
  resolved: boolean("resolved").notNull().default(false),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: text("resolved_by"),
  resolvedNotes: text("resolved_notes"),
}, (table) => [
  index("system_errors_occurred_at_idx").on(table.occurredAt),
  index("system_errors_severity_idx").on(table.severity),
  index("system_errors_category_idx").on(table.category),
  index("system_errors_resolved_idx").on(table.resolved),
]);

// System Errors types and schemas
export type SystemError = typeof systemErrors.$inferSelect;
export type InsertSystemError = typeof systemErrors.$inferInsert;

export const insertSystemErrorSchema = createInsertSchema(systemErrors).omit({
  id: true,
  occurredAt: true,
  resolved: true,
  resolvedAt: true,
  resolvedBy: true,
  resolvedNotes: true,
});

// User-friendly error message mappings
export const USER_FRIENDLY_ERRORS: Record<string, string> = {
  // Database errors
  "database_connection": "We're experiencing technical difficulties. Please try again in a moment.",
  "database_query": "Unable to complete your request. Please try again.",
  "duplicate_entry": "This information already exists in our system.",
  
  // API errors
  "api_timeout": "The request is taking longer than expected. Please try again.",
  "api_error": "Something went wrong. Please try again later.",
  "invalid_response": "Unable to process the response. Please try again.",
  
  // Authentication errors
  "auth_required": "Please log in to continue.",
  "auth_expired": "Your session has expired. Please log in again.",
  "auth_invalid": "Invalid credentials. Please check and try again.",
  "permission_denied": "You don't have permission to perform this action.",
  
  // Validation errors
  "validation_failed": "Please check your information and try again.",
  "missing_required": "Please fill in all required fields.",
  "invalid_format": "Please check the format of your information.",
  
  // Payment errors
  "payment_failed": "Payment could not be processed. Please try again or use a different payment method.",
  "payment_declined": "Your payment was declined. Please contact your bank or try another method.",
  
  // File errors
  "file_upload_failed": "Unable to upload your file. Please try again.",
  "file_too_large": "The file is too large. Please choose a smaller file.",
  "file_invalid_type": "This file type is not supported.",
  
  // Network errors
  "network_error": "Connection issue. Please check your internet and try again.",
  
  // Default fallback
  "unknown": "Something went wrong. Please try again later.",
};

// Receipt type enum for PDF receipts
export const receiptTypeEnum = pgEnum("receipt_type", ["order", "subscription", "freelancer_plan", "banner_payment", "certificate"]);

// Receipt delivery status enum
export const receiptDeliveryStatusEnum = pgEnum("receipt_delivery_status", ["pending", "sent", "failed", "downloaded"]);

// Receipts table - Stores all purchase receipts for users
export const receipts = pgTable("receipts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").references(() => users.userId),
  payerEmail: text("payer_email").notNull(),
  payerName: text("payer_name"),
  receiptType: receiptTypeEnum("receipt_type").notNull(),
  sourceId: text("source_id").notNull(),
  receiptNumber: text("receipt_number").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("USD"),
  paymentMethod: text("payment_method"),
  items: jsonb("items").notNull().default(sql`'[]'::jsonb`),
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
  issuedAt: timestamp("issued_at").defaultNow().notNull(),
  deliveryStatus: receiptDeliveryStatusEnum("delivery_status").notNull().default("pending"),
  emailSentAt: timestamp("email_sent_at"),
  downloadCount: integer("download_count").notNull().default(0),
  lastDownloadedAt: timestamp("last_downloaded_at"),
}, (table) => [
  index("receipts_user_id_idx").on(table.userId),
  index("receipts_payer_email_idx").on(table.payerEmail),
  index("receipts_receipt_type_idx").on(table.receiptType),
  index("receipts_source_id_idx").on(table.sourceId),
  index("receipts_issued_at_idx").on(table.issuedAt),
]);

// Receipt types and schemas
export type Receipt = typeof receipts.$inferSelect;
export type InsertReceipt = typeof receipts.$inferInsert;

export const insertReceiptSchema = createInsertSchema(receipts).omit({
  id: true,
  issuedAt: true,
  emailSentAt: true,
  downloadCount: true,
  lastDownloadedAt: true,
});

// Receipt item type for PDF generation
export interface ReceiptItem {
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

// Receipt payload for PDF generation
export interface ReceiptPayload {
  receiptNumber: string;
  receiptType: 'order' | 'subscription' | 'freelancer_plan' | 'banner_payment' | 'certificate';
  payerName: string;
  payerEmail: string;
  userId?: string;
  items: ReceiptItem[];
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  paymentMethod: string;
  issuedAt: Date;
  sourceId: string;
  metadata?: {
    orderId?: string;
    subscriptionTier?: string;
    billingPeriod?: string;
    planName?: string;
    bannerTitle?: string;
    certificateName?: string;
    userRole?: string;
    planExpiry?: string;
    placement?: string;
    durationDays?: number;
  };
}

// =====================================================
// EMAIL MARKETING SYSTEM
// =====================================================

// Enums for email marketing
export const emailCampaignStatusEnum = pgEnum("email_campaign_status", ["draft", "scheduled", "sending", "completed", "cancelled"]);
export const emailDeliveryStatusEnum = pgEnum("email_delivery_status", ["pending", "sent", "delivered", "bounced", "failed"]);
export const emailPreferenceCategoryEnum = pgEnum("email_preference_category", ["marketing", "newsletter", "product_updates", "promotions", "transactional"]);

// Email Marketing Templates - Reusable email designs
export const emailMarketingTemplates = pgTable("email_marketing_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  htmlContent: text("html_content").notNull(),
  textContent: text("text_content"),
  category: text("category").default("general"),
  variables: jsonb("variables").default(sql`'[]'::jsonb`),
  isActive: boolean("is_active").default(true),
  createdBy: text("created_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("email_templates_name_idx").on(table.name),
  index("email_templates_category_idx").on(table.category),
]);

export type EmailMarketingTemplate = typeof emailMarketingTemplates.$inferSelect;
export type InsertEmailMarketingTemplate = typeof emailMarketingTemplates.$inferInsert;

export const insertEmailMarketingTemplateSchema = createInsertSchema(emailMarketingTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Email Campaigns - Marketing email campaigns
export const emailCampaigns = pgTable("email_campaigns", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  templateId: uuid("template_id").references(() => emailMarketingTemplates.id),
  htmlContent: text("html_content").notNull(),
  textContent: text("text_content"),
  status: emailCampaignStatusEnum("status").default("draft").notNull(),
  scheduledAt: timestamp("scheduled_at"),
  sentAt: timestamp("sent_at"),
  completedAt: timestamp("completed_at"),
  segmentFilters: jsonb("segment_filters").default(sql`'{}'::jsonb`),
  totalRecipients: integer("total_recipients").default(0),
  sentCount: integer("sent_count").default(0),
  deliveredCount: integer("delivered_count").default(0),
  openedCount: integer("opened_count").default(0),
  clickedCount: integer("clicked_count").default(0),
  bouncedCount: integer("bounced_count").default(0),
  failedCount: integer("failed_count").default(0),
  createdBy: text("created_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("email_campaigns_status_idx").on(table.status),
  index("email_campaigns_scheduled_idx").on(table.scheduledAt),
  index("email_campaigns_created_idx").on(table.createdAt),
]);

export type EmailCampaign = typeof emailCampaigns.$inferSelect;
export type InsertEmailCampaign = typeof emailCampaigns.$inferInsert;

export const insertEmailCampaignSchema = createInsertSchema(emailCampaigns).omit({
  id: true,
  sentAt: true,
  completedAt: true,
  totalRecipients: true,
  sentCount: true,
  deliveredCount: true,
  openedCount: true,
  clickedCount: true,
  bouncedCount: true,
  failedCount: true,
  createdAt: true,
  updatedAt: true,
});

// Email Preferences - User opt-in/out settings
export const emailPreferences = pgTable("email_preferences", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  email: text("email").notNull(),
  marketingOptIn: boolean("marketing_opt_in").default(true),
  newsletterOptIn: boolean("newsletter_opt_in").default(true),
  productUpdatesOptIn: boolean("product_updates_opt_in").default(true),
  promotionsOptIn: boolean("promotions_opt_in").default(true),
  unsubscribeToken: text("unsubscribe_token").notNull().unique(),
  unsubscribedAt: timestamp("unsubscribed_at"),
  unsubscribeReason: text("unsubscribe_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("email_preferences_user_idx").on(table.userId),
  index("email_preferences_email_idx").on(table.email),
  index("email_preferences_token_idx").on(table.unsubscribeToken),
]);

export type EmailPreference = typeof emailPreferences.$inferSelect;
export type InsertEmailPreference = typeof emailPreferences.$inferInsert;

export const insertEmailPreferenceSchema = createInsertSchema(emailPreferences).omit({
  id: true,
  unsubscribedAt: true,
  createdAt: true,
  updatedAt: true,
});

// Campaign Deliveries - Track individual email sends
export const campaignDeliveries = pgTable("campaign_deliveries", {
  id: uuid("id").primaryKey().defaultRandom(),
  campaignId: uuid("campaign_id").references(() => emailCampaigns.id).notNull(),
  userId: text("user_id"),
  recipientEmail: text("recipient_email").notNull(),
  recipientName: text("recipient_name"),
  status: emailDeliveryStatusEnum("status").default("pending").notNull(),
  sentAt: timestamp("sent_at"),
  deliveredAt: timestamp("delivered_at"),
  openedAt: timestamp("opened_at"),
  clickedAt: timestamp("clicked_at"),
  bouncedAt: timestamp("bounced_at"),
  bounceReason: text("bounce_reason"),
  errorMessage: text("error_message"),
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("campaign_deliveries_campaign_idx").on(table.campaignId),
  index("campaign_deliveries_user_idx").on(table.userId),
  index("campaign_deliveries_status_idx").on(table.status),
  index("campaign_deliveries_email_idx").on(table.recipientEmail),
]);

export type CampaignDelivery = typeof campaignDeliveries.$inferSelect;
export type InsertCampaignDelivery = typeof campaignDeliveries.$inferInsert;

export const insertCampaignDeliverySchema = createInsertSchema(campaignDeliveries).omit({
  id: true,
  sentAt: true,
  deliveredAt: true,
  openedAt: true,
  clickedAt: true,
  bouncedAt: true,
  createdAt: true,
});

// Campaign Segments - Saved audience segments for targeting
export const campaignSegments = pgTable("campaign_segments", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  filters: jsonb("filters").notNull().default(sql`'{}'::jsonb`),
  estimatedSize: integer("estimated_size").default(0),
  isActive: boolean("is_active").default(true),
  createdBy: text("created_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("campaign_segments_name_idx").on(table.name),
  index("campaign_segments_active_idx").on(table.isActive),
]);

export type CampaignSegment = typeof campaignSegments.$inferSelect;
export type InsertCampaignSegment = typeof campaignSegments.$inferInsert;

export const insertCampaignSegmentSchema = createInsertSchema(campaignSegments).omit({
  id: true,
  estimatedSize: true,
  createdAt: true,
  updatedAt: true,
});

// Segment filter types for targeting users
export interface SegmentFilters {
  roles?: string[];
  gradeMin?: number;
  gradeMax?: number;
  subscriptionTiers?: string[];
  hasActiveSubscription?: boolean;
  countries?: string[];
  registeredAfter?: string;
  registeredBefore?: string;
  lastActiveAfter?: string;
  lastActiveBefore?: string;
  hasCompletedProfile?: boolean;
  excludeUserIds?: string[];
}

// Admin audit logs for tracking admin actions
export const adminAuditLogs = pgTable("admin_audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  adminUserId: text("admin_user_id").notNull(),
  action: text("action").notNull(),
  targetUserId: text("target_user_id"),
  details: jsonb("details").default(sql`'{}'::jsonb`),
  ipAddress: text("ip_address"),
  channel: text("channel").default("web"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("admin_audit_logs_admin_idx").on(table.adminUserId),
  index("admin_audit_logs_action_idx").on(table.action),
  index("admin_audit_logs_created_idx").on(table.createdAt),
]);

export type AdminAuditLog = typeof adminAuditLogs.$inferSelect;
export type InsertAdminAuditLog = typeof adminAuditLogs.$inferInsert;

// =====================================================
// ENGAGEMENT EMAIL NOTIFICATION SYSTEM
// =====================================================

// Notification types for automated engagement emails
export const engagementNotificationTypeEnum = pgEnum("engagement_notification_type", [
  "incomplete_registration_1h",
  "incomplete_registration_24h",
  "welcome_day_0",
  "welcome_day_2",
  "welcome_day_5",
  "learning_inactivity_3d",
  "course_not_started_3d",
  "download_reminder_24h",
  "teacher_no_content_3d",
  "freelancer_no_content_5d",
  "teacher_no_sales_14d",
  "customer_no_download_7d",
  "reengagement_7d",
  "reengagement_14d",
  "reengagement_30d",
  "course_completion",
  "new_enrollment_teacher",
  "payout_ready"
]);

export const engagementNotificationStatusEnum = pgEnum("engagement_notification_status", [
  "queued",
  "sent",
  "failed",
  "skipped"
]);

// User activity tracking table - tracks key activities for triggering notifications
export const userActivityTracking = pgTable("user_activity_tracking", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull().unique(),
  role: text("role").notNull(),
  email: text("email").notNull(),
  displayName: text("display_name"),
  lastLoginAt: timestamp("last_login_at"),
  lastLessonActivityAt: timestamp("last_lesson_activity_at"),
  lastCourseEnrollmentAt: timestamp("last_course_enrollment_at"),
  lastCourseStartAt: timestamp("last_course_start_at"),
  lastContentCreationAt: timestamp("last_content_creation_at"),
  lastDownloadAt: timestamp("last_download_at"),
  lastPurchaseAt: timestamp("last_purchase_at"),
  lastSaleAt: timestamp("last_sale_at"),
  lastSeenAt: timestamp("last_seen_at"),
  courseEnrollmentCount: integer("course_enrollment_count").default(0),
  coursesStartedCount: integer("courses_started_count").default(0),
  lessonsCompletedCount: integer("lessons_completed_count").default(0),
  downloadsCount: integer("downloads_count").default(0),
  contentCreatedCount: integer("content_created_count").default(0),
  salesCount: integer("sales_count").default(0),
  totalEarnings: numeric("total_earnings", { precision: 10, scale: 2 }).default("0.00"),
  welcomeSeriesSent: integer("welcome_series_sent").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("user_activity_userId_idx").on(table.userId),
  index("user_activity_role_idx").on(table.role),
  index("user_activity_lastLogin_idx").on(table.lastLoginAt),
  index("user_activity_lastSeen_idx").on(table.lastSeenAt),
]);

export type UserActivityTracking = typeof userActivityTracking.$inferSelect;
export type InsertUserActivityTracking = typeof userActivityTracking.$inferInsert;

export const insertUserActivityTrackingSchema = createInsertSchema(userActivityTracking).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Email notification logs table - tracks all automated engagement emails sent
export const emailNotificationLogs = pgTable("email_notification_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id),
  pendingRegistrationId: uuid("pending_registration_id").references(() => pendingRegistrations.id),
  recipientEmail: text("recipient_email").notNull(),
  recipientName: text("recipient_name"),
  notificationType: engagementNotificationTypeEnum("notification_type").notNull(),
  status: engagementNotificationStatusEnum("status").default("queued").notNull(),
  subject: text("subject"),
  scheduledAt: timestamp("scheduled_at"),
  sentAt: timestamp("sent_at"),
  payload: jsonb("payload").default(sql`'{}'::jsonb`),
  failureReason: text("failure_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("notification_logs_userId_idx").on(table.userId),
  index("notification_logs_type_idx").on(table.notificationType),
  index("notification_logs_status_idx").on(table.status),
  index("notification_logs_scheduled_idx").on(table.scheduledAt),
  index("notification_logs_pendingReg_idx").on(table.pendingRegistrationId),
  unique("notification_logs_unique").on(table.userId, table.notificationType, table.scheduledAt),
]);

export type EmailNotificationLog = typeof emailNotificationLogs.$inferSelect;
export type InsertEmailNotificationLog = typeof emailNotificationLogs.$inferInsert;

export const insertEmailNotificationLogSchema = createInsertSchema(emailNotificationLogs).omit({
  id: true,
  sentAt: true,
  createdAt: true,
});

// Notification type constants for easy reference
export const ENGAGEMENT_NOTIFICATION_TYPES = {
  INCOMPLETE_REGISTRATION_1H: "incomplete_registration_1h",
  INCOMPLETE_REGISTRATION_24H: "incomplete_registration_24h",
  WELCOME_DAY_0: "welcome_day_0",
  WELCOME_DAY_2: "welcome_day_2",
  WELCOME_DAY_5: "welcome_day_5",
  LEARNING_INACTIVITY_3D: "learning_inactivity_3d",
  COURSE_NOT_STARTED_3D: "course_not_started_3d",
  DOWNLOAD_REMINDER_24H: "download_reminder_24h",
  TEACHER_NO_CONTENT_3D: "teacher_no_content_3d",
  FREELANCER_NO_CONTENT_5D: "freelancer_no_content_5d",
  TEACHER_NO_SALES_14D: "teacher_no_sales_14d",
  CUSTOMER_NO_DOWNLOAD_7D: "customer_no_download_7d",
  REENGAGEMENT_7D: "reengagement_7d",
  REENGAGEMENT_14D: "reengagement_14d",
  REENGAGEMENT_30D: "reengagement_30d",
  COURSE_COMPLETION: "course_completion",
  NEW_ENROLLMENT_TEACHER: "new_enrollment_teacher",
  PAYOUT_READY: "payout_ready",
} as const;

export type EngagementNotificationType = typeof ENGAGEMENT_NOTIFICATION_TYPES[keyof typeof ENGAGEMENT_NOTIFICATION_TYPES];

// Device tokens for mobile push notifications
export const devicePlatformEnum = pgEnum("device_platform", ["android", "ios", "web"]);

export const deviceTokens = pgTable("device_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  token: text("token").notNull().unique(),
  platform: devicePlatformEnum("platform").notNull(),
  deviceInfo: jsonb("device_info").default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastUsed: timestamp("last_used").defaultNow().notNull(),
}, (table) => [
  index("device_tokens_userId_idx").on(table.userId),
  index("device_tokens_platform_idx").on(table.platform),
]);

export type DeviceToken = typeof deviceTokens.$inferSelect;
export type InsertDeviceToken = typeof deviceTokens.$inferInsert;

export const insertDeviceTokenSchema = createInsertSchema(deviceTokens).omit({
  id: true,
  createdAt: true,
  lastUsed: true,
});

