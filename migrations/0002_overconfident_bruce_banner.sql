CREATE TYPE "public"."device_platform" AS ENUM('android', 'ios', 'web');--> statement-breakpoint
CREATE TYPE "public"."email_campaign_status" AS ENUM('draft', 'scheduled', 'sending', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."email_delivery_status" AS ENUM('pending', 'sent', 'delivered', 'bounced', 'failed');--> statement-breakpoint
CREATE TYPE "public"."email_preference_category" AS ENUM('marketing', 'newsletter', 'product_updates', 'promotions', 'transactional');--> statement-breakpoint
CREATE TYPE "public"."engagement_notification_status" AS ENUM('queued', 'sent', 'failed', 'skipped');--> statement-breakpoint
CREATE TYPE "public"."engagement_notification_type" AS ENUM('incomplete_registration_1h', 'incomplete_registration_24h', 'welcome_day_0', 'welcome_day_2', 'welcome_day_5', 'learning_inactivity_3d', 'course_not_started_3d', 'download_reminder_24h', 'teacher_no_content_3d', 'freelancer_no_content_5d', 'teacher_no_sales_14d', 'customer_no_download_7d', 'reengagement_7d', 'reengagement_14d', 'reengagement_30d', 'course_completion', 'new_enrollment_teacher', 'payout_ready');--> statement-breakpoint
CREATE TYPE "public"."error_category" AS ENUM('database', 'api', 'validation', 'auth', 'payment', 'file', 'network', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."error_severity" AS ENUM('critical', 'error', 'warning', 'info');--> statement-breakpoint
CREATE TYPE "public"."receipt_delivery_status" AS ENUM('pending', 'sent', 'failed', 'downloaded');--> statement-breakpoint
CREATE TYPE "public"."receipt_type" AS ENUM('order', 'subscription', 'freelancer_plan', 'banner_payment', 'certificate');--> statement-breakpoint
ALTER TYPE "public"."app_role" ADD VALUE 'customer';--> statement-breakpoint
CREATE TABLE "admin_audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_user_id" text NOT NULL,
	"action" text NOT NULL,
	"target_user_id" text,
	"details" jsonb DEFAULT '{}'::jsonb,
	"ip_address" text,
	"channel" text DEFAULT 'web',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaign_deliveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"user_id" text,
	"recipient_email" text NOT NULL,
	"recipient_name" text,
	"status" "email_delivery_status" DEFAULT 'pending' NOT NULL,
	"sent_at" timestamp,
	"delivered_at" timestamp,
	"opened_at" timestamp,
	"clicked_at" timestamp,
	"bounced_at" timestamp,
	"bounce_reason" text,
	"error_message" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaign_segments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"filters" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"estimated_size" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "device_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" text NOT NULL,
	"platform" "device_platform" NOT NULL,
	"device_info" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_used" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "device_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "email_campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"subject" text NOT NULL,
	"template_id" uuid,
	"html_content" text NOT NULL,
	"text_content" text,
	"status" "email_campaign_status" DEFAULT 'draft' NOT NULL,
	"scheduled_at" timestamp,
	"sent_at" timestamp,
	"completed_at" timestamp,
	"segment_filters" jsonb DEFAULT '{}'::jsonb,
	"total_recipients" integer DEFAULT 0,
	"sent_count" integer DEFAULT 0,
	"delivered_count" integer DEFAULT 0,
	"opened_count" integer DEFAULT 0,
	"clicked_count" integer DEFAULT 0,
	"bounced_count" integer DEFAULT 0,
	"failed_count" integer DEFAULT 0,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_marketing_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"subject" text NOT NULL,
	"html_content" text NOT NULL,
	"text_content" text,
	"category" text DEFAULT 'general',
	"variables" jsonb DEFAULT '[]'::jsonb,
	"is_active" boolean DEFAULT true,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_notification_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"pending_registration_id" uuid,
	"recipient_email" text NOT NULL,
	"recipient_name" text,
	"notification_type" "engagement_notification_type" NOT NULL,
	"status" "engagement_notification_status" DEFAULT 'queued' NOT NULL,
	"subject" text,
	"scheduled_at" timestamp,
	"sent_at" timestamp,
	"payload" jsonb DEFAULT '{}'::jsonb,
	"failure_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "notification_logs_unique" UNIQUE("user_id","notification_type","scheduled_at")
);
--> statement-breakpoint
CREATE TABLE "email_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"email" text NOT NULL,
	"marketing_opt_in" boolean DEFAULT true,
	"newsletter_opt_in" boolean DEFAULT true,
	"product_updates_opt_in" boolean DEFAULT true,
	"promotions_opt_in" boolean DEFAULT true,
	"unsubscribe_token" text NOT NULL,
	"unsubscribed_at" timestamp,
	"unsubscribe_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "email_preferences_unsubscribe_token_unique" UNIQUE("unsubscribe_token")
);
--> statement-breakpoint
CREATE TABLE "gift_voucher_purchases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"voucher_id" uuid,
	"buyer_id" uuid,
	"buyer_email" text,
	"buyer_name" text,
	"recipient_email" text NOT NULL,
	"recipient_name" text,
	"amount" numeric(10, 2) NOT NULL,
	"personal_message" text,
	"send_to_self" boolean DEFAULT false,
	"payment_method" text,
	"payment_intent_id" text,
	"payment_status" text DEFAULT 'pending',
	"email_sent" boolean DEFAULT false,
	"email_sent_at" timestamp,
	"expires_at" timestamp,
	"is_redeemed" boolean DEFAULT false,
	"redeemed_at" timestamp,
	"redeemed_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "gift_voucher_purchases_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "pending_registrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"token" text NOT NULL,
	"verification_code" text,
	"registration_type" text NOT NULL,
	"password_hash" text NOT NULL,
	"full_name" text NOT NULL,
	"display_name" text NOT NULL,
	"phone_number" text,
	"country" text NOT NULL,
	"additional_data" jsonb,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "pending_registrations_email_unique" UNIQUE("email"),
	CONSTRAINT "pending_registrations_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "pending_shop_signups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"full_name" text NOT NULL,
	"password_hash" text NOT NULL,
	"verification_code" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "pending_shop_signups_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "quiz_question_options" (
	"id" serial PRIMARY KEY NOT NULL,
	"question_id" integer NOT NULL,
	"option_text" text NOT NULL,
	"is_correct" boolean DEFAULT false NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quiz_questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"quiz_id" integer NOT NULL,
	"question_text" text NOT NULL,
	"question_type" text DEFAULT 'multiple_choice' NOT NULL,
	"explanation" text,
	"points" integer DEFAULT 1 NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"media_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "receipts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text,
	"payer_email" text NOT NULL,
	"payer_name" text,
	"receipt_type" "receipt_type" NOT NULL,
	"source_id" text NOT NULL,
	"receipt_number" text NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"payment_method" text,
	"items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"issued_at" timestamp DEFAULT now() NOT NULL,
	"delivery_status" "receipt_delivery_status" DEFAULT 'pending' NOT NULL,
	"email_sent_at" timestamp,
	"download_count" integer DEFAULT 0 NOT NULL,
	"last_downloaded_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "subject_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"icon" text,
	"color" text,
	"description" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "system_errors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"occurred_at" timestamp DEFAULT now() NOT NULL,
	"severity" "error_severity" DEFAULT 'error' NOT NULL,
	"category" "error_category" DEFAULT 'unknown' NOT NULL,
	"source" text NOT NULL,
	"endpoint" text,
	"method" text,
	"user_role_context" text,
	"user_id" text,
	"message" text NOT NULL,
	"user_friendly_message" text,
	"stack" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"resolved" boolean DEFAULT false NOT NULL,
	"resolved_at" timestamp,
	"resolved_by" text,
	"resolved_notes" text
);
--> statement-breakpoint
CREATE TABLE "teacher_subjects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"teacher_id" uuid NOT NULL,
	"subject_id" uuid NOT NULL,
	"is_primary" boolean DEFAULT false,
	"experience_years" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uniq_teacher_subject" UNIQUE("teacher_id","subject_id")
);
--> statement-breakpoint
CREATE TABLE "user_activity_tracking" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"role" text NOT NULL,
	"email" text NOT NULL,
	"display_name" text,
	"last_login_at" timestamp,
	"last_lesson_activity_at" timestamp,
	"last_course_enrollment_at" timestamp,
	"last_course_start_at" timestamp,
	"last_content_creation_at" timestamp,
	"last_download_at" timestamp,
	"last_purchase_at" timestamp,
	"last_sale_at" timestamp,
	"last_seen_at" timestamp,
	"course_enrollment_count" integer DEFAULT 0,
	"courses_started_count" integer DEFAULT 0,
	"lessons_completed_count" integer DEFAULT 0,
	"downloads_count" integer DEFAULT 0,
	"content_created_count" integer DEFAULT 0,
	"sales_count" integer DEFAULT 0,
	"total_earnings" numeric(10, 2) DEFAULT '0.00',
	"welcome_series_sent" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_activity_tracking_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "quizzes" ALTER COLUMN "questions" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "blog_posts" ADD COLUMN "youtube_url" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "subscription_cancelled_at" timestamp;--> statement-breakpoint
ALTER TABLE "subjects" ADD COLUMN "approval_status" text DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "subjects" ADD COLUMN "admin_notes" text;--> statement-breakpoint
ALTER TABLE "subjects" ADD COLUMN "reviewed_by" uuid;--> statement-breakpoint
ALTER TABLE "subjects" ADD COLUMN "reviewed_at" timestamp;--> statement-breakpoint
ALTER TABLE "teacher_availability" ADD COLUMN "category_id" uuid;--> statement-breakpoint
ALTER TABLE "auth_users" ADD COLUMN "is_blocked" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "auth_users" ADD COLUMN "is_active" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "campaign_deliveries" ADD CONSTRAINT "campaign_deliveries_campaign_id_email_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."email_campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "device_tokens" ADD CONSTRAINT "device_tokens_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_campaigns" ADD CONSTRAINT "email_campaigns_template_id_email_marketing_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."email_marketing_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_notification_logs" ADD CONSTRAINT "email_notification_logs_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_notification_logs" ADD CONSTRAINT "email_notification_logs_pending_registration_id_pending_registrations_id_fk" FOREIGN KEY ("pending_registration_id") REFERENCES "public"."pending_registrations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gift_voucher_purchases" ADD CONSTRAINT "gift_voucher_purchases_voucher_id_shop_vouchers_id_fk" FOREIGN KEY ("voucher_id") REFERENCES "public"."shop_vouchers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gift_voucher_purchases" ADD CONSTRAINT "gift_voucher_purchases_buyer_id_auth_users_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gift_voucher_purchases" ADD CONSTRAINT "gift_voucher_purchases_redeemed_by_auth_users_id_fk" FOREIGN KEY ("redeemed_by") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_question_options" ADD CONSTRAINT "quiz_question_options_question_id_quiz_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."quiz_questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_questions" ADD CONSTRAINT "quiz_questions_quiz_id_quizzes_id_fk" FOREIGN KEY ("quiz_id") REFERENCES "public"."quizzes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_user_id_auth_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_subjects" ADD CONSTRAINT "teacher_subjects_teacher_id_auth_users_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_subjects" ADD CONSTRAINT "teacher_subjects_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_activity_tracking" ADD CONSTRAINT "user_activity_tracking_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "admin_audit_logs_admin_idx" ON "admin_audit_logs" USING btree ("admin_user_id");--> statement-breakpoint
CREATE INDEX "admin_audit_logs_action_idx" ON "admin_audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "admin_audit_logs_created_idx" ON "admin_audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "campaign_deliveries_campaign_idx" ON "campaign_deliveries" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "campaign_deliveries_user_idx" ON "campaign_deliveries" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "campaign_deliveries_status_idx" ON "campaign_deliveries" USING btree ("status");--> statement-breakpoint
CREATE INDEX "campaign_deliveries_email_idx" ON "campaign_deliveries" USING btree ("recipient_email");--> statement-breakpoint
CREATE INDEX "campaign_segments_name_idx" ON "campaign_segments" USING btree ("name");--> statement-breakpoint
CREATE INDEX "campaign_segments_active_idx" ON "campaign_segments" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "device_tokens_userId_idx" ON "device_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "device_tokens_platform_idx" ON "device_tokens" USING btree ("platform");--> statement-breakpoint
CREATE INDEX "email_campaigns_status_idx" ON "email_campaigns" USING btree ("status");--> statement-breakpoint
CREATE INDEX "email_campaigns_scheduled_idx" ON "email_campaigns" USING btree ("scheduled_at");--> statement-breakpoint
CREATE INDEX "email_campaigns_created_idx" ON "email_campaigns" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "email_templates_name_idx" ON "email_marketing_templates" USING btree ("name");--> statement-breakpoint
CREATE INDEX "email_templates_category_idx" ON "email_marketing_templates" USING btree ("category");--> statement-breakpoint
CREATE INDEX "notification_logs_userId_idx" ON "email_notification_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notification_logs_type_idx" ON "email_notification_logs" USING btree ("notification_type");--> statement-breakpoint
CREATE INDEX "notification_logs_status_idx" ON "email_notification_logs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "notification_logs_scheduled_idx" ON "email_notification_logs" USING btree ("scheduled_at");--> statement-breakpoint
CREATE INDEX "notification_logs_pendingReg_idx" ON "email_notification_logs" USING btree ("pending_registration_id");--> statement-breakpoint
CREATE INDEX "email_preferences_user_idx" ON "email_preferences" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "email_preferences_email_idx" ON "email_preferences" USING btree ("email");--> statement-breakpoint
CREATE INDEX "email_preferences_token_idx" ON "email_preferences" USING btree ("unsubscribe_token");--> statement-breakpoint
CREATE INDEX "idx_gift_voucher_code" ON "gift_voucher_purchases" USING btree ("code");--> statement-breakpoint
CREATE INDEX "idx_gift_voucher_buyer" ON "gift_voucher_purchases" USING btree ("buyer_id");--> statement-breakpoint
CREATE INDEX "idx_gift_voucher_recipient" ON "gift_voucher_purchases" USING btree ("recipient_email");--> statement-breakpoint
CREATE INDEX "idx_gift_voucher_status" ON "gift_voucher_purchases" USING btree ("payment_status");--> statement-breakpoint
CREATE INDEX "pending_registrations_email_idx" ON "pending_registrations" USING btree ("email");--> statement-breakpoint
CREATE INDEX "pending_registrations_token_idx" ON "pending_registrations" USING btree ("token");--> statement-breakpoint
CREATE INDEX "pending_registrations_expires_idx" ON "pending_registrations" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_quiz_options_question" ON "quiz_question_options" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX "idx_quiz_questions_quiz" ON "quiz_questions" USING btree ("quiz_id");--> statement-breakpoint
CREATE INDEX "idx_quiz_questions_order" ON "quiz_questions" USING btree ("quiz_id","order");--> statement-breakpoint
CREATE INDEX "receipts_user_id_idx" ON "receipts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "receipts_payer_email_idx" ON "receipts" USING btree ("payer_email");--> statement-breakpoint
CREATE INDEX "receipts_receipt_type_idx" ON "receipts" USING btree ("receipt_type");--> statement-breakpoint
CREATE INDEX "receipts_source_id_idx" ON "receipts" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX "receipts_issued_at_idx" ON "receipts" USING btree ("issued_at");--> statement-breakpoint
CREATE INDEX "system_errors_occurred_at_idx" ON "system_errors" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "system_errors_severity_idx" ON "system_errors" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "system_errors_category_idx" ON "system_errors" USING btree ("category");--> statement-breakpoint
CREATE INDEX "system_errors_resolved_idx" ON "system_errors" USING btree ("resolved");--> statement-breakpoint
CREATE INDEX "idx_teacher_subjects_teacher" ON "teacher_subjects" USING btree ("teacher_id");--> statement-breakpoint
CREATE INDEX "idx_teacher_subjects_subject" ON "teacher_subjects" USING btree ("subject_id");--> statement-breakpoint
CREATE INDEX "user_activity_userId_idx" ON "user_activity_tracking" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_activity_role_idx" ON "user_activity_tracking" USING btree ("role");--> statement-breakpoint
CREATE INDEX "user_activity_lastLogin_idx" ON "user_activity_tracking" USING btree ("last_login_at");--> statement-breakpoint
CREATE INDEX "user_activity_lastSeen_idx" ON "user_activity_tracking" USING btree ("last_seen_at");--> statement-breakpoint
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_reviewed_by_auth_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_availability" ADD CONSTRAINT "teacher_availability_category_id_subject_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."subject_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_quizzes_lesson" ON "quizzes" USING btree ("lesson_id");--> statement-breakpoint
CREATE INDEX "idx_quizzes_topic" ON "quizzes" USING btree ("topic_id");