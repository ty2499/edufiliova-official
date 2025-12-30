CREATE TYPE "public"."meeting_mode" AS ENUM('interactive', 'broadcast');--> statement-breakpoint
CREATE TYPE "public"."meeting_status" AS ENUM('scheduled', 'live', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."mobile_money_provider" AS ENUM('vodapay', 'ecocash', 'mpesa', 'mtn_mobile_money', 'orange_money');--> statement-breakpoint
CREATE TYPE "public"."payout_status" AS ENUM('auto_generated', 'awaiting_admin', 'approved', 'payment_processing', 'completed', 'failed', 'rejected');--> statement-breakpoint
ALTER TYPE "public"."payout_account_type" ADD VALUE 'mobile_money';--> statement-breakpoint
ALTER TYPE "public"."payout_method" ADD VALUE 'mobile_money';--> statement-breakpoint
CREATE TABLE "admin_notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"data" jsonb,
	"target_role" "app_role" DEFAULT 'admin',
	"priority" text DEFAULT 'normal',
	"is_read" boolean DEFAULT false,
	"read_by" uuid,
	"read_at" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "creator_balances" (
	"creator_id" uuid PRIMARY KEY NOT NULL,
	"available_balance" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"pending_balance" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"lifetime_earnings" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"total_withdrawn" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"last_payout_date" timestamp,
	"next_payout_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "creator_earning_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"creator_id" uuid NOT NULL,
	"creator_role" text NOT NULL,
	"event_type" text NOT NULL,
	"source_type" text NOT NULL,
	"source_id" uuid NOT NULL,
	"order_id" uuid,
	"gross_amount" numeric(10, 2) NOT NULL,
	"platform_commission" numeric(10, 2) DEFAULT '0' NOT NULL,
	"creator_amount" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'USD',
	"status" text DEFAULT 'pending' NOT NULL,
	"payout_request_id" uuid,
	"metadata" jsonb,
	"event_date" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "creator_payout_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"creator_id" uuid NOT NULL,
	"amount_requested" numeric(10, 2) NOT NULL,
	"amount_approved" numeric(10, 2),
	"payout_method" text NOT NULL,
	"payout_account_id" uuid,
	"status" "payout_status" DEFAULT 'auto_generated' NOT NULL,
	"rejection_reason" text,
	"payment_reference" text,
	"requested_at" timestamp DEFAULT now() NOT NULL,
	"approved_at" timestamp,
	"processed_at" timestamp,
	"finalized_at" timestamp,
	"processed_by" uuid,
	"payout_date" timestamp,
	"admin_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"is_auto_generated" boolean DEFAULT false,
	"notification_sent" boolean DEFAULT false,
	"finalized_by_job" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "daily_quiz_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subject" text NOT NULL,
	"grade_level" "grade_level" NOT NULL,
	"question" text NOT NULL,
	"option_a" text NOT NULL,
	"option_b" text NOT NULL,
	"option_c" text NOT NULL,
	"option_d" text NOT NULL,
	"correct_answer" text NOT NULL,
	"explanation" text,
	"difficulty" text DEFAULT 'medium',
	"is_active" boolean DEFAULT true,
	"scheduled_for" timestamp,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "download_quota_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"period_start" timestamp NOT NULL,
	"download_count" integer DEFAULT 0 NOT NULL,
	"last_download_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uniq_user_period" UNIQUE("user_id","period_start")
);
--> statement-breakpoint
CREATE TABLE "email_verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"token" text NOT NULL,
	"user_id" uuid,
	"application_id" uuid,
	"expires_at" timestamp NOT NULL,
	"is_verified" boolean DEFAULT false,
	"verified_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "email_verifications_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "freelancer_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"full_name" text NOT NULL,
	"display_name" text NOT NULL,
	"email" text NOT NULL,
	"phone_number" text,
	"country" text NOT NULL,
	"primary_category" text NOT NULL,
	"tagline" text NOT NULL,
	"about" text NOT NULL,
	"skills" text[],
	"services_offered" text[],
	"behance_url" text,
	"github_url" text,
	"website_url" text,
	"status" "approval_status" DEFAULT 'pending' NOT NULL,
	"approved_by" uuid,
	"approved_at" timestamp,
	"rejection_reason" text,
	"admin_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_executions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_type" text NOT NULL,
	"run_date" text NOT NULL,
	"status" text DEFAULT 'running' NOT NULL,
	"records_processed" integer DEFAULT 0,
	"error_message" text,
	"metadata" jsonb,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"duration_ms" integer,
	CONSTRAINT "uniq_job_run" UNIQUE("job_type","run_date")
);
--> statement-breakpoint
CREATE TABLE "lesson_access_permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"subject_id" uuid NOT NULL,
	"course_id" uuid,
	"lesson_id" integer NOT NULL,
	"access_granted_at" timestamp DEFAULT now() NOT NULL,
	"subscription_snapshot" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uniq_user_subject_lesson" UNIQUE("user_id","subject_id")
);
--> statement-breakpoint
CREATE TABLE "meeting_chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"meeting_id" uuid NOT NULL,
	"sender_id" uuid NOT NULL,
	"sender_name" text NOT NULL,
	"sender_role" text NOT NULL,
	"message" text NOT NULL,
	"message_type" text DEFAULT 'text',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meeting_notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"meeting_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"notification_type" text NOT NULL,
	"scheduled_for" timestamp NOT NULL,
	"sent_at" timestamp,
	"status" text DEFAULT 'pending' NOT NULL,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meeting_participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"meeting_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" text DEFAULT 'student' NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	"left_at" timestamp,
	"duration" integer,
	"has_video" boolean DEFAULT false,
	"has_audio" boolean DEFAULT false,
	"is_view_only" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "meeting_participant_unique" UNIQUE("meeting_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "meetings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"teacher_id" uuid NOT NULL,
	"title" text NOT NULL,
	"lesson_description" text NOT NULL,
	"scheduled_time" timestamp NOT NULL,
	"duration_minutes" integer DEFAULT 45 NOT NULL,
	"end_time" timestamp NOT NULL,
	"target_grades" text[] NOT NULL,
	"mode" "meeting_mode" DEFAULT 'interactive' NOT NULL,
	"max_participants" integer DEFAULT 50,
	"agora_channel" text NOT NULL,
	"agora_app_id" text,
	"status" "meeting_status" DEFAULT 'scheduled' NOT NULL,
	"actual_start_time" timestamp,
	"actual_end_time" timestamp,
	"participant_count" integer DEFAULT 0,
	"notifications_sent" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "portfolio_samples" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"title" text NOT NULL,
	"category" text NOT NULL,
	"description" text NOT NULL,
	"file_urls" text[] NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_download_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"download_type" text NOT NULL,
	"order_id" uuid,
	"ip_address" text,
	"user_agent" text,
	"downloaded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_download_stats" (
	"product_id" uuid PRIMARY KEY NOT NULL,
	"total_downloads" integer DEFAULT 0 NOT NULL,
	"free_downloads" integer DEFAULT 0 NOT NULL,
	"paid_downloads" integer DEFAULT 0 NOT NULL,
	"subscription_downloads" integer DEFAULT 0 NOT NULL,
	"last_milestone_count" integer DEFAULT 0 NOT NULL,
	"downloads_this_week" integer DEFAULT 0 NOT NULL,
	"downloads_this_month" integer DEFAULT 0 NOT NULL,
	"last_download_at" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quiz_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"user_answer" text NOT NULL,
	"is_correct" boolean NOT NULL,
	"response_time_seconds" integer,
	"streak" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "quiz_response_unique" UNIQUE("question_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "settlement_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"settlement_date" text NOT NULL,
	"status" text DEFAULT 'running' NOT NULL,
	"creators_processed" integer DEFAULT 0,
	"auto_payouts_created" integer DEFAULT 0,
	"total_pending_moved" numeric(10, 2) DEFAULT '0.00',
	"error_message" text,
	"run_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"duration_ms" integer,
	CONSTRAINT "uniq_settlement_date" UNIQUE("settlement_date")
);
--> statement-breakpoint
CREATE TABLE "user_chats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"messages" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_chats_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "user_subjects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"subject" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_subject_unique" UNIQUE("user_id","subject")
);
--> statement-breakpoint
CREATE TABLE "users_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"level" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_progress_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "whatsapp_conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"whatsapp_phone" text NOT NULL,
	"user_id" uuid,
	"current_flow" text,
	"flow_state" jsonb,
	"last_message_at" timestamp DEFAULT now(),
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "whatsapp_conversations_whatsapp_phone_unique" UNIQUE("whatsapp_phone")
);
--> statement-breakpoint
CREATE TABLE "whatsapp_message_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid,
	"whatsapp_phone" text NOT NULL,
	"direction" text NOT NULL,
	"message_type" text NOT NULL,
	"message_content" jsonb,
	"message_id" text,
	"status" text DEFAULT 'sent',
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "whatsapp_message_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_name" text NOT NULL,
	"template_category" text NOT NULL,
	"language" text DEFAULT 'en',
	"header_text" text,
	"body_text" text NOT NULL,
	"footer_text" text,
	"buttons" jsonb,
	"meta_template_id" text,
	"status" text DEFAULT 'pending',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "whatsapp_message_templates_template_name_unique" UNIQUE("template_name")
);
--> statement-breakpoint
CREATE TABLE "whatsapp_payment_intents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"user_id" uuid,
	"course_id" uuid,
	"subscription_tier" text,
	"amount" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'USD',
	"payment_method" text,
	"payment_url" text,
	"status" text DEFAULT 'pending',
	"stripe_session_id" text,
	"paypal_order_id" text,
	"expires_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "showcase_project_boost_comments" DROP CONSTRAINT "showcase_project_boost_comments_showcase_project_id_showcase_projects_id_fk";
--> statement-breakpoint
ALTER TABLE "teacher_applications" ALTER COLUMN "phone_number" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "teacher_applications" ALTER COLUMN "qualifications" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "teacher_applications" ALTER COLUMN "experience" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "teacher_applications" ALTER COLUMN "preferred_payment_method" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "course_purchases" ADD COLUMN "payment_method" text;--> statement-breakpoint
ALTER TABLE "payout_accounts" ADD COLUMN "mobile_money_provider" "mobile_money_provider";--> statement-breakpoint
ALTER TABLE "payout_accounts" ADD COLUMN "mobile_money_number" text;--> statement-breakpoint
ALTER TABLE "payout_accounts" ADD COLUMN "mobile_money_country" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "boost_views_count" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "whatsapp_opt_in" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "school_name" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "learning_preferences" text[];--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "education_system" text;--> statement-breakpoint
ALTER TABLE "teacher_applications" ADD COLUMN "passport_photo_url" text;--> statement-breakpoint
ALTER TABLE "teacher_applications" ADD COLUMN "display_name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "teacher_applications" ADD COLUMN "date_of_birth" text NOT NULL;--> statement-breakpoint
ALTER TABLE "teacher_applications" ADD COLUMN "gender" text;--> statement-breakpoint
ALTER TABLE "teacher_applications" ADD COLUMN "nationality" text;--> statement-breakpoint
ALTER TABLE "teacher_applications" ADD COLUMN "emergency_contact" jsonb;--> statement-breakpoint
ALTER TABLE "teacher_applications" ADD COLUMN "teaching_categories" text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "teacher_applications" ADD COLUMN "grade_levels" text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "teacher_applications" ADD COLUMN "languages_taught" text[];--> statement-breakpoint
ALTER TABLE "teacher_applications" ADD COLUMN "preferred_teaching_style" text;--> statement-breakpoint
ALTER TABLE "teacher_applications" ADD COLUMN "time_zone" text;--> statement-breakpoint
ALTER TABLE "teacher_applications" ADD COLUMN "availability_schedule" jsonb;--> statement-breakpoint
ALTER TABLE "teacher_applications" ADD COLUMN "highest_qualification" text NOT NULL;--> statement-breakpoint
ALTER TABLE "teacher_applications" ADD COLUMN "qualification_certificates" text[];--> statement-breakpoint
ALTER TABLE "teacher_applications" ADD COLUMN "id_passport_document" text NOT NULL;--> statement-breakpoint
ALTER TABLE "teacher_applications" ADD COLUMN "cv_resume" text;--> statement-breakpoint
ALTER TABLE "teacher_applications" ADD COLUMN "background_check_status" text DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "teacher_applications" ADD COLUMN "background_check_document" text;--> statement-breakpoint
ALTER TABLE "teacher_applications" ADD COLUMN "references" jsonb;--> statement-breakpoint
ALTER TABLE "teacher_applications" ADD COLUMN "years_of_experience" text NOT NULL;--> statement-breakpoint
ALTER TABLE "teacher_applications" ADD COLUMN "experience_summary" text NOT NULL;--> statement-breakpoint
ALTER TABLE "teacher_applications" ADD COLUMN "proof_of_teaching" text[];--> statement-breakpoint
ALTER TABLE "teacher_applications" ADD COLUMN "sample_materials" text[];--> statement-breakpoint
ALTER TABLE "teacher_applications" ADD COLUMN "introduction_video" text;--> statement-breakpoint
ALTER TABLE "teacher_applications" ADD COLUMN "agreement_truthful" boolean NOT NULL;--> statement-breakpoint
ALTER TABLE "teacher_applications" ADD COLUMN "agreement_content" boolean NOT NULL;--> statement-breakpoint
ALTER TABLE "teacher_applications" ADD COLUMN "agreement_terms" boolean NOT NULL;--> statement-breakpoint
ALTER TABLE "teacher_applications" ADD COLUMN "agreement_understand" boolean NOT NULL;--> statement-breakpoint
ALTER TABLE "teacher_applications" ADD COLUMN "agreement_safety" boolean NOT NULL;--> statement-breakpoint
ALTER TABLE "works" ADD COLUMN "boost_likes_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "works" ADD COLUMN "boost_views_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "admin_notifications" ADD CONSTRAINT "admin_notifications_read_by_auth_users_id_fk" FOREIGN KEY ("read_by") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creator_balances" ADD CONSTRAINT "creator_balances_creator_id_auth_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creator_earning_events" ADD CONSTRAINT "creator_earning_events_creator_id_auth_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creator_earning_events" ADD CONSTRAINT "creator_earning_events_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creator_payout_requests" ADD CONSTRAINT "creator_payout_requests_creator_id_auth_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creator_payout_requests" ADD CONSTRAINT "creator_payout_requests_payout_account_id_payout_accounts_id_fk" FOREIGN KEY ("payout_account_id") REFERENCES "public"."payout_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creator_payout_requests" ADD CONSTRAINT "creator_payout_requests_processed_by_auth_users_id_fk" FOREIGN KEY ("processed_by") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_quiz_questions" ADD CONSTRAINT "daily_quiz_questions_created_by_auth_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "download_quota_usage" ADD CONSTRAINT "download_quota_usage_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_verifications" ADD CONSTRAINT "email_verifications_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_verifications" ADD CONSTRAINT "email_verifications_application_id_teacher_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."teacher_applications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "freelancer_applications" ADD CONSTRAINT "freelancer_applications_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "freelancer_applications" ADD CONSTRAINT "freelancer_applications_approved_by_auth_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_access_permissions" ADD CONSTRAINT "lesson_access_permissions_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_access_permissions" ADD CONSTRAINT "lesson_access_permissions_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_access_permissions" ADD CONSTRAINT "lesson_access_permissions_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_access_permissions" ADD CONSTRAINT "lesson_access_permissions_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_chat_messages" ADD CONSTRAINT "meeting_chat_messages_meeting_id_meetings_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."meetings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_chat_messages" ADD CONSTRAINT "meeting_chat_messages_sender_id_auth_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_notifications" ADD CONSTRAINT "meeting_notifications_meeting_id_meetings_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."meetings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_notifications" ADD CONSTRAINT "meeting_notifications_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_participants" ADD CONSTRAINT "meeting_participants_meeting_id_meetings_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."meetings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_participants" ADD CONSTRAINT "meeting_participants_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_teacher_id_auth_users_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolio_samples" ADD CONSTRAINT "portfolio_samples_application_id_freelancer_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."freelancer_applications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_download_events" ADD CONSTRAINT "product_download_events_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_download_events" ADD CONSTRAINT "product_download_events_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_download_events" ADD CONSTRAINT "product_download_events_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_download_stats" ADD CONSTRAINT "product_download_stats_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_responses" ADD CONSTRAINT "quiz_responses_question_id_daily_quiz_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."daily_quiz_questions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_responses" ADD CONSTRAINT "quiz_responses_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_chats" ADD CONSTRAINT "user_chats_user_id_auth_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_subjects" ADD CONSTRAINT "user_subjects_user_id_auth_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users_progress" ADD CONSTRAINT "users_progress_user_id_auth_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_conversations" ADD CONSTRAINT "whatsapp_conversations_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_message_logs" ADD CONSTRAINT "whatsapp_message_logs_conversation_id_whatsapp_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."whatsapp_conversations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_payment_intents" ADD CONSTRAINT "whatsapp_payment_intents_conversation_id_whatsapp_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."whatsapp_conversations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_payment_intents" ADD CONSTRAINT "whatsapp_payment_intents_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_payment_intents" ADD CONSTRAINT "whatsapp_payment_intents_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_admin_notifications_type" ON "admin_notifications" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_admin_notifications_role" ON "admin_notifications" USING btree ("target_role");--> statement-breakpoint
CREATE INDEX "idx_admin_notifications_read" ON "admin_notifications" USING btree ("is_read");--> statement-breakpoint
CREATE INDEX "idx_creator_balances_creator" ON "creator_balances" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "idx_earning_events_creator" ON "creator_earning_events" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "idx_earning_events_status" ON "creator_earning_events" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_earning_events_date" ON "creator_earning_events" USING btree ("event_date" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_payout_requests_creator" ON "creator_payout_requests" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "idx_payout_requests_status" ON "creator_payout_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_payout_requests_date" ON "creator_payout_requests" USING btree ("payout_date");--> statement-breakpoint
CREATE INDEX "daily_quiz_subject_idx" ON "daily_quiz_questions" USING btree ("subject");--> statement-breakpoint
CREATE INDEX "daily_quiz_grade_idx" ON "daily_quiz_questions" USING btree ("grade_level");--> statement-breakpoint
CREATE INDEX "daily_quiz_scheduled_idx" ON "daily_quiz_questions" USING btree ("scheduled_for");--> statement-breakpoint
CREATE INDEX "idx_download_quota_user" ON "download_quota_usage" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_download_quota_period" ON "download_quota_usage" USING btree ("period_start" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "freelancer_applications_status_idx" ON "freelancer_applications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "freelancer_applications_email_idx" ON "freelancer_applications" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_job_executions_type" ON "job_executions" USING btree ("job_type");--> statement-breakpoint
CREATE INDEX "idx_job_executions_date" ON "job_executions" USING btree ("run_date" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_lesson_access_user" ON "lesson_access_permissions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_lesson_access_subject" ON "lesson_access_permissions" USING btree ("subject_id");--> statement-breakpoint
CREATE INDEX "idx_lesson_access_course" ON "lesson_access_permissions" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "meeting_chat_meeting_idx" ON "meeting_chat_messages" USING btree ("meeting_id");--> statement-breakpoint
CREATE INDEX "meeting_chat_created_idx" ON "meeting_chat_messages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "meeting_notifications_meeting_idx" ON "meeting_notifications" USING btree ("meeting_id");--> statement-breakpoint
CREATE INDEX "meeting_notifications_user_idx" ON "meeting_notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "meeting_notifications_scheduled_idx" ON "meeting_notifications" USING btree ("scheduled_for");--> statement-breakpoint
CREATE INDEX "meeting_notifications_status_idx" ON "meeting_notifications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "meeting_participants_meeting_idx" ON "meeting_participants" USING btree ("meeting_id");--> statement-breakpoint
CREATE INDEX "meeting_participants_user_idx" ON "meeting_participants" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "meetings_teacher_idx" ON "meetings" USING btree ("teacher_id");--> statement-breakpoint
CREATE INDEX "meetings_scheduled_time_idx" ON "meetings" USING btree ("scheduled_time");--> statement-breakpoint
CREATE INDEX "meetings_status_idx" ON "meetings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "meetings_agora_channel_idx" ON "meetings" USING btree ("agora_channel");--> statement-breakpoint
CREATE INDEX "portfolio_samples_application_idx" ON "portfolio_samples" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "idx_download_events_product" ON "product_download_events" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_download_events_user" ON "product_download_events" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_download_events_date" ON "product_download_events" USING btree ("downloaded_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_download_stats_product" ON "product_download_stats" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "quiz_responses_question_idx" ON "quiz_responses" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX "quiz_responses_user_idx" ON "quiz_responses" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_settlement_runs_date" ON "settlement_runs" USING btree ("settlement_date" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "user_chats_user_id_idx" ON "user_chats" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_subjects_user_id_idx" ON "user_subjects" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "users_progress_user_id_idx" ON "users_progress" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "whatsapp_conversations_phone_idx" ON "whatsapp_conversations" USING btree ("whatsapp_phone");--> statement-breakpoint
CREATE INDEX "whatsapp_conversations_user_idx" ON "whatsapp_conversations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "whatsapp_logs_conversation_idx" ON "whatsapp_message_logs" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "whatsapp_logs_phone_idx" ON "whatsapp_message_logs" USING btree ("whatsapp_phone");--> statement-breakpoint
CREATE INDEX "whatsapp_logs_created_idx" ON "whatsapp_message_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "whatsapp_templates_name_idx" ON "whatsapp_message_templates" USING btree ("template_name");--> statement-breakpoint
CREATE INDEX "whatsapp_templates_category_idx" ON "whatsapp_message_templates" USING btree ("template_category");--> statement-breakpoint
CREATE INDEX "whatsapp_payment_conversation_idx" ON "whatsapp_payment_intents" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "whatsapp_payment_user_idx" ON "whatsapp_payment_intents" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "whatsapp_payment_status_idx" ON "whatsapp_payment_intents" USING btree ("status");