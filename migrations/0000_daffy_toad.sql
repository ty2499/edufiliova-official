CREATE TYPE "public"."ad_placement" AS ENUM('student_dashboard', 'teacher_dashboard', 'freelancer_dashboard', 'customer_dashboard', 'advertise_page', 'talent_page');--> statement-breakpoint
CREATE TYPE "public"."ad_status" AS ENUM('pending', 'approved', 'rejected', 'expired', 'paused');--> statement-breakpoint
CREATE TYPE "public"."app_role" AS ENUM('admin', 'moderator', 'teacher', 'student', 'freelancer', 'accountant', 'customer_service');--> statement-breakpoint
CREATE TYPE "public"."approval_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."assignment_mode" AS ENUM('auto_assign', 'manual_assign');--> statement-breakpoint
CREATE TYPE "public"."assignment_status" AS ENUM('draft', 'published', 'closed');--> statement-breakpoint
CREATE TYPE "public"."category_scope" AS ENUM('global', 'seller');--> statement-breakpoint
CREATE TYPE "public"."content_type" AS ENUM('reading_material', 'quiz', 'test', 'assignment');--> statement-breakpoint
CREATE TYPE "public"."coupon_discount_type" AS ENUM('percentage', 'fixed');--> statement-breakpoint
CREATE TYPE "public"."course_pricing_type" AS ENUM('free', 'fixed_price', 'subscription');--> statement-breakpoint
CREATE TYPE "public"."curriculum_type" AS ENUM('cambridge', 'american', 'local', 'all_systems');--> statement-breakpoint
CREATE TYPE "public"."education_level" AS ENUM('primary', 'secondary', 'college', 'university', 'other');--> statement-breakpoint
CREATE TYPE "public"."filter_type" AS ENUM('range', 'multiselect', 'singleselect', 'boolean');--> statement-breakpoint
CREATE TYPE "public"."grade_level" AS ENUM('1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', 'college', 'university');--> statement-breakpoint
CREATE TYPE "public"."grade_subscription_tier" AS ENUM('elementary', 'high_school', 'college_university');--> statement-breakpoint
CREATE TYPE "public"."help_chat_sender" AS ENUM('visitor', 'admin');--> statement-breakpoint
CREATE TYPE "public"."manual_plan_assignment_reason" AS ENUM('cash_payment', 'error_compensation', 'promotional', 'trial_extension', 'other');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."payout_account_type" AS ENUM('bank', 'paypal', 'crypto');--> statement-breakpoint
CREATE TYPE "public"."payout_method" AS ENUM('bank', 'paypal', 'crypto');--> statement-breakpoint
CREATE TYPE "public"."product_status" AS ENUM('pending', 'approved', 'rejected', 'out_of_stock');--> statement-breakpoint
CREATE TYPE "public"."product_type" AS ENUM('digital', 'physical');--> statement-breakpoint
CREATE TYPE "public"."freelancer_project_priority" AS ENUM('low', 'medium', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."freelancer_project_status" AS ENUM('draft', 'active', 'pending', 'in_progress', 'waiting_review', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."showcase_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."submission_status" AS ENUM('pending', 'submitted', 'graded', 'resubmit');--> statement-breakpoint
CREATE TYPE "public"."subscription_billing_period" AS ENUM('monthly', 'yearly');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('todo', 'in_progress', 'done');--> statement-breakpoint
CREATE TYPE "public"."transaction_status" AS ENUM('pending', 'completed', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."transaction_type" AS ENUM('credit', 'debit');--> statement-breakpoint
CREATE TYPE "public"."verification_badge" AS ENUM('none', 'green', 'blue');--> statement-breakpoint
CREATE TYPE "public"."work_media_type" AS ENUM('image', 'video', 'youtube', 'vimeo');--> statement-breakpoint
CREATE TYPE "public"."work_visibility" AS ENUM('public', 'unlisted', 'private');--> statement-breakpoint
CREATE TABLE "ad_pricing_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"targeting_type" text NOT NULL,
	"duration_days" integer NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_targeting_duration" UNIQUE("targeting_type","duration_days")
);
--> statement-breakpoint
CREATE TABLE "admin_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"setting_key" text NOT NULL,
	"setting_value" text,
	"category" text NOT NULL,
	"description" text,
	"is_encrypted" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"updated_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admin_settings_setting_key_unique" UNIQUE("setting_key")
);
--> statement-breakpoint
CREATE TABLE "ads_banners" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"title" text NOT NULL,
	"image_url" text NOT NULL,
	"placement" "ad_placement" NOT NULL,
	"placements" jsonb,
	"size" text NOT NULL,
	"status" "ad_status" DEFAULT 'pending' NOT NULL,
	"price" numeric DEFAULT '0' NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"target_locations" jsonb,
	"target_grades" jsonb,
	"target_dashboard" text,
	"min_age" integer,
	"max_age" integer,
	"guest_email" text,
	"guest_name" text,
	"link_url" varchar,
	"impressions" integer DEFAULT 0 NOT NULL,
	"clicks" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "announcement_reads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"announcement_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"read_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "announcements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"teacher_id" uuid NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"priority" text DEFAULT 'normal',
	"target_audience" text DEFAULT 'all',
	"target_grade" integer,
	"target_student_ids" text[],
	"is_active" boolean DEFAULT true,
	"expires_at" timestamp,
	"read_by" text[] DEFAULT '{}',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "api_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"key_hash" text NOT NULL,
	"key_preview" text NOT NULL,
	"name" text NOT NULL,
	"tier" text NOT NULL,
	"permissions" text[] DEFAULT ARRAY[]::text[],
	"last_used_at" timestamp,
	"expires_at" timestamp,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"revoked_at" timestamp,
	CONSTRAINT "api_keys_key_hash_unique" UNIQUE("key_hash")
);
--> statement-breakpoint
CREATE TABLE "app_download_links" (
	"id" serial PRIMARY KEY NOT NULL,
	"app_store_url" text,
	"app_store_text" text DEFAULT 'Download on the',
	"google_play_url" text,
	"google_play_text" text DEFAULT 'Get it on',
	"huawei_gallery_url" text,
	"huawei_gallery_text" text DEFAULT 'Explore it on',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "appointments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"teacher_id" uuid,
	"student_id" uuid,
	"admin_id" uuid,
	"freelancer_id" uuid,
	"requester_id" uuid NOT NULL,
	"status" text NOT NULL,
	"type" text NOT NULL,
	"subject" text,
	"meeting_url" text,
	"location" text,
	"notes" text,
	"reminder_sent" boolean,
	"cancelled_by" uuid,
	"cancellation_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assignment_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submission_id" uuid NOT NULL,
	"author_id" uuid NOT NULL,
	"content" text NOT NULL,
	"is_private" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assignment_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assignment_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"file_urls" jsonb,
	"text_content" text,
	"question_answers" jsonb,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	"grade" text,
	"numeric_grade" integer,
	"feedback" text,
	"status" "submission_status" DEFAULT 'submitted' NOT NULL,
	"is_late" boolean DEFAULT false,
	"resubmission_count" integer DEFAULT 0,
	"graded_at" timestamp,
	"graded_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "assignment_submissions_assignment_id_student_id_unique" UNIQUE("assignment_id","student_id")
);
--> statement-breakpoint
CREATE TABLE "assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"teacher_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"instructions" text,
	"due_date" timestamp NOT NULL,
	"attachments" jsonb,
	"questions" jsonb,
	"target_type" text DEFAULT 'all' NOT NULL,
	"target_students" jsonb,
	"subject" text NOT NULL,
	"grade" integer NOT NULL,
	"max_grade" integer DEFAULT 100,
	"allow_late_submission" boolean DEFAULT false,
	"allow_resubmission" boolean DEFAULT false,
	"status" "assignment_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "banks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"country_code" text NOT NULL,
	"bank_name" text NOT NULL,
	"bank_code" text,
	"swift_code" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blog_posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"excerpt" text,
	"content" text NOT NULL,
	"category" text,
	"cover_image" text,
	"author_id" uuid NOT NULL,
	"author_name" text NOT NULL,
	"author_avatar" text,
	"is_published" boolean DEFAULT false NOT NULL,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "blog_posts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "cart_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cart_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"price_at_add" numeric(10, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "cart_items_cart_id_product_id_unique" UNIQUE("cart_id","product_id")
);
--> statement-breakpoint
CREATE TABLE "carts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "carts_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "category_access_approvals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"user_role" "app_role" NOT NULL,
	"status" "approval_status" DEFAULT 'pending' NOT NULL,
	"requested_at" timestamp DEFAULT now() NOT NULL,
	"approved_by" uuid,
	"approved_at" timestamp,
	"rejected_at" timestamp,
	"rejection_reason" text,
	"admin_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "category_access_approvals_user_id_user_role_unique" UNIQUE("user_id","user_role")
);
--> statement-breakpoint
CREATE TABLE "category_filter_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"filter_id" uuid NOT NULL,
	"value" text NOT NULL,
	"display_name" text NOT NULL,
	"sort_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "category_filters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid NOT NULL,
	"name" text NOT NULL,
	"display_name" text NOT NULL,
	"type" "filter_type" NOT NULL,
	"sort_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "certificate_purchases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"certificate_id" uuid,
	"course_id" uuid NOT NULL,
	"certificate_type" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"payment_intent_id" text NOT NULL,
	"payment_status" text DEFAULT 'pending',
	"stripe_customer_id" text,
	"shipping_address" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "certificate_purchases_payment_intent_id_unique" UNIQUE("payment_intent_id")
);
--> statement-breakpoint
CREATE TABLE "certificates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"course_id" uuid NOT NULL,
	"student_name" text NOT NULL,
	"student_email" text,
	"course_title" text NOT NULL,
	"course_description" text,
	"verification_code" text NOT NULL,
	"certificate_url" text,
	"preview_image_url" text,
	"completion_date" timestamp NOT NULL,
	"final_score" integer,
	"instructor_name" text,
	"certificate_type" text DEFAULT 'certificate',
	"issue_date" timestamp DEFAULT now() NOT NULL,
	"is_revoked" boolean DEFAULT false,
	"revoked_at" timestamp,
	"revoked_reason" text,
	"certifier_id" text,
	"certifier_public_id" text,
	"certifier_group_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "certificates_verification_code_unique" UNIQUE("verification_code")
);
--> statement-breakpoint
CREATE TABLE "chat_participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"thread_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "app_role" NOT NULL,
	"muted" boolean DEFAULT false,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_chat_participant" UNIQUE("thread_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "chat_threads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"freelancer_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"project_id" uuid,
	"status" text DEFAULT 'open' NOT NULL,
	"last_message_at" timestamp,
	"last_message_preview" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_chat_thread" UNIQUE("freelancer_id","customer_id","project_id")
);
--> statement-breakpoint
CREATE TABLE "cities" (
	"id" serial PRIMARY KEY NOT NULL,
	"country_id" integer,
	"country_code" text NOT NULL,
	"name" text NOT NULL,
	"is_major" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "community_group_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	"role" text DEFAULT 'member'
);
--> statement-breakpoint
CREATE TABLE "community_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_by" uuid NOT NULL,
	"member_count" integer DEFAULT 0,
	"members_count" integer DEFAULT 0,
	"status" text DEFAULT 'pending',
	"approved_by" uuid,
	"approved_at" timestamp,
	"rejection_reason" text,
	"is_private" boolean DEFAULT false,
	"max_members" integer DEFAULT 100000,
	"tags" text[],
	"avatar_url" text,
	"post_count" integer DEFAULT 0,
	"is_public" boolean DEFAULT true,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "community_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"author_id" varchar NOT NULL,
	"group_id" uuid,
	"title" varchar NOT NULL,
	"content" text NOT NULL,
	"body" text,
	"subject" varchar,
	"grade" integer,
	"topic_type" text DEFAULT 'discussion',
	"tags" text[],
	"likes" integer DEFAULT 0,
	"upvotes" integer DEFAULT 0,
	"downvotes" integer DEFAULT 0,
	"is_anonymous" boolean DEFAULT false,
	"is_moderated" boolean DEFAULT false,
	"moderator_id" varchar,
	"is_test" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "community_reactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"target_type" text NOT NULL,
	"target_id" uuid NOT NULL,
	"emoji" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "community_reactions_user_id_target_id_target_type_unique" UNIQUE("user_id","target_id","target_type")
);
--> statement-breakpoint
CREATE TABLE "community_replies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" uuid NOT NULL,
	"author_id" varchar NOT NULL,
	"content" text NOT NULL,
	"upvotes" integer DEFAULT 0,
	"downvotes" integer DEFAULT 0,
	"is_anonymous" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contact_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"subject" text NOT NULL,
	"message" text NOT NULL,
	"is_read" boolean DEFAULT false,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contact_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"form_type" text NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"subject" text,
	"message" text NOT NULL,
	"company" text,
	"phone" text,
	"project_type" text,
	"budget" text,
	"timeline" text,
	"file_url" text,
	"is_read" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"admin_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "countries" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"grade_system_type" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "country_curricula" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"country_id" integer NOT NULL,
	"curriculum_id" varchar NOT NULL,
	"is_primary" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coupon_usages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"coupon_id" uuid NOT NULL,
	"user_id" uuid,
	"guest_email" text,
	"order_id" uuid,
	"cart_id" uuid,
	"discount_applied" numeric(10, 2) NOT NULL,
	"order_total" numeric(10, 2),
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coupons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"description" text,
	"discount_type" "coupon_discount_type" NOT NULL,
	"discount_value" numeric(10, 2) NOT NULL,
	"min_order_amount" numeric(10, 2),
	"max_discount" numeric(10, 2),
	"start_date" timestamp,
	"end_date" timestamp,
	"total_usage_limit" integer,
	"per_user_limit" integer DEFAULT 1,
	"usage_count" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "coupons_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "course_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"display_name" text NOT NULL,
	"description" text,
	"color" text DEFAULT 'gray',
	"icon_url" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "course_categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "course_comment_likes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"comment_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "course_comment_likes_comment_id_user_id_unique" UNIQUE("comment_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "course_comment_replies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"comment_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"reply" text NOT NULL,
	"likes_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_comment_reply_likes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reply_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "course_comment_reply_likes_reply_id_user_id_unique" UNIQUE("reply_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "course_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"comment" text NOT NULL,
	"likes_count" integer DEFAULT 0,
	"replies_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_enrollments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"course_id" uuid NOT NULL,
	"enrolled_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"progress" integer DEFAULT 0,
	"grade" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_pricing_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"billing_type" text DEFAULT 'one_time' NOT NULL,
	"features" jsonb NOT NULL,
	"popular" boolean DEFAULT false,
	"active" boolean DEFAULT true,
	"display_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "course_pricing_plans_plan_id_unique" UNIQUE("plan_id")
);
--> statement-breakpoint
CREATE TABLE "course_purchases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"course_id" uuid NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"payment_intent_id" text,
	"payment_status" text DEFAULT 'pending' NOT NULL,
	"purchased_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "course_purchases_user_id_course_id_unique" UNIQUE("user_id","course_id")
);
--> statement-breakpoint
CREATE TABLE "course_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"rating" integer NOT NULL,
	"review" text,
	"is_verified_purchase" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "course_reviews_student_id_course_id_unique" UNIQUE("student_id","course_id")
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"thumbnail_url" text,
	"category_id" uuid,
	"pricing_type" "course_pricing_type" DEFAULT 'free',
	"price" numeric(10, 2),
	"is_active" boolean DEFAULT true,
	"approval_status" "approval_status" DEFAULT 'pending',
	"image" text,
	"grade_tier" "grade_subscription_tier",
	"preview_lessons" text[],
	"curriculum_id" varchar,
	"created_by" uuid,
	"publisher_name" text,
	"publisher_bio" text,
	"publisher_avatar" text,
	"resource_urls" text[] DEFAULT '{}',
	"pdf_urls" text[] DEFAULT '{}',
	"video_urls" text[] DEFAULT '{}',
	"tags" text[] DEFAULT '{}',
	"language" text DEFAULT 'en',
	"avg_rating" numeric(3, 2) DEFAULT '0',
	"total_reviews" integer DEFAULT 0,
	"total_enrollments" integer DEFAULT 0,
	"certificate_type" text DEFAULT 'certificate',
	"course_code" text,
	"credits" integer DEFAULT 3,
	"instructor_id" uuid,
	"duration" integer DEFAULT 15,
	"difficulty" text DEFAULT 'intermediate',
	"prerequisites" text[],
	"learning_objectives" text[],
	"enrollment_limit" integer,
	"is_featured" boolean DEFAULT false,
	"featured_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "curricula" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"country" text NOT NULL,
	"system_name" text NOT NULL,
	"effective_from" timestamp,
	"description" text,
	"name" text NOT NULL,
	"display_name" text NOT NULL,
	"system_type" "curriculum_type" NOT NULL,
	"country_code" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_progress_summary" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"day_number" integer NOT NULL,
	"total_questions" integer DEFAULT 7,
	"correct_answers" integer DEFAULT 0,
	"total_time" integer DEFAULT 0,
	"completed_at" timestamp,
	"streak_day" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_question_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"question_id" uuid NOT NULL,
	"day_number" integer NOT NULL,
	"selected_answer" text,
	"is_correct" boolean,
	"time_spent" integer DEFAULT 0,
	"attempted_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"day_number" integer NOT NULL,
	"subject_id" uuid NOT NULL,
	"question" text NOT NULL,
	"options" text[] NOT NULL,
	"correct_answer" text NOT NULL,
	"explanation" text,
	"difficulty" text DEFAULT 'medium',
	"question_order" integer NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "downloads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"download_token" text NOT NULL,
	"downloaded_at" timestamp DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"expires_at" timestamp,
	"is_expired" boolean DEFAULT false,
	CONSTRAINT "downloads_download_token_unique" UNIQUE("download_token")
);
--> statement-breakpoint
CREATE TABLE "email_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"display_name" text NOT NULL,
	"imap_host" text NOT NULL,
	"imap_port" integer DEFAULT 993 NOT NULL,
	"imap_secure" boolean DEFAULT true NOT NULL,
	"imap_username" text NOT NULL,
	"imap_password" text NOT NULL,
	"smtp_host" text NOT NULL,
	"smtp_port" integer DEFAULT 587 NOT NULL,
	"smtp_secure" boolean DEFAULT false NOT NULL,
	"smtp_username" text NOT NULL,
	"smtp_password" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_synced_at" timestamp,
	"sync_status" text DEFAULT 'idle',
	"sync_error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "email_accounts_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "email_folders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email_account_id" uuid NOT NULL,
	"name" text NOT NULL,
	"type" text DEFAULT 'custom' NOT NULL,
	"icon" text,
	"color" text,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_label_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email_message_id" uuid NOT NULL,
	"email_label_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "emailLabelAssignments_unique" UNIQUE("email_message_id","email_label_id")
);
--> statement-breakpoint
CREATE TABLE "email_labels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email_account_id" uuid NOT NULL,
	"name" text NOT NULL,
	"color" text DEFAULT '#3b82f6' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email_account_id" uuid NOT NULL,
	"message_id" text NOT NULL,
	"from" text NOT NULL,
	"to" text NOT NULL,
	"cc" text,
	"bcc" text,
	"subject" text NOT NULL,
	"text_body" text,
	"html_body" text,
	"is_read" boolean DEFAULT false NOT NULL,
	"is_replied" boolean DEFAULT false NOT NULL,
	"is_starred" boolean DEFAULT false NOT NULL,
	"is_spam" boolean DEFAULT false NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	"is_trashed" boolean DEFAULT false NOT NULL,
	"in_reply_to" text,
	"references" text,
	"attachments" jsonb,
	"received_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "email_messages_message_id_unique" UNIQUE("message_id")
);
--> statement-breakpoint
CREATE TABLE "email_replies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email_message_id" uuid NOT NULL,
	"email_account_id" uuid NOT NULL,
	"to" text NOT NULL,
	"cc" text,
	"subject" text NOT NULL,
	"text_body" text,
	"html_body" text,
	"attachments" jsonb,
	"sent_by" uuid NOT NULL,
	"sent_at" timestamp NOT NULL,
	"send_status" text DEFAULT 'sent',
	"send_error" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "freelancer_pricing_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"badge_color" text NOT NULL,
	"monthly_price" numeric(10, 2),
	"yearly_price" numeric(10, 2),
	"lifetime_price" numeric(10, 2),
	"billing_type" text DEFAULT 'subscription' NOT NULL,
	"features" jsonb NOT NULL,
	"popular" boolean DEFAULT false,
	"active" boolean DEFAULT true,
	"display_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "freelancer_pricing_plans_plan_id_unique" UNIQUE("plan_id")
);
--> statement-breakpoint
CREATE TABLE "friendships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"requester_id" uuid NOT NULL,
	"receiver_id" uuid NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"request_message" text,
	"connection_type" text DEFAULT 'friend',
	"common_subjects" text[],
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "friendships_requester_id_receiver_id_unique" UNIQUE("requester_id","receiver_id")
);
--> statement-breakpoint
CREATE TABLE "grade_systems" (
	"id" serial PRIMARY KEY NOT NULL,
	"country_id" integer,
	"grade_number" integer NOT NULL,
	"display_name" text NOT NULL,
	"education_level" text,
	"age_range" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "group_memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" text DEFAULT 'member',
	"status" text DEFAULT 'active',
	"joined_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "help_chat_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"guest_id" varchar(50) NOT NULL,
	"receiver_id" uuid,
	"message" text NOT NULL,
	"sender" "help_chat_sender" NOT NULL,
	"agent_id" integer,
	"is_auto_message" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "help_chat_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"setting_key" text NOT NULL,
	"setting_value" text NOT NULL,
	"description" text,
	"updated_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "help_chat_settings_setting_key_unique" UNIQUE("setting_key")
);
--> statement-breakpoint
CREATE TABLE "hero_sections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"title" text NOT NULL,
	"subtitle" text,
	"description" text,
	"placement" text NOT NULL,
	"desktop_image_url" text NOT NULL,
	"tablet_image_url" text NOT NULL,
	"mobile_image_url" text NOT NULL,
	"link_url" text,
	"button_text" text,
	"second_button_text" text,
	"second_button_url" text,
	"status" text DEFAULT 'active' NOT NULL,
	"priority" integer DEFAULT 1 NOT NULL,
	"start_date" timestamp,
	"end_date" timestamp,
	"text_color" text DEFAULT '#FFFFFF',
	"background_color" text DEFAULT '#000000',
	"overlay_opacity" integer DEFAULT 30,
	"is_full_height" boolean DEFAULT true,
	"custom_height" text,
	"content_alignment" text DEFAULT 'center',
	"impressions" integer DEFAULT 0 NOT NULL,
	"clicks" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lesson_content_blocks" (
	"id" serial PRIMARY KEY NOT NULL,
	"lesson_id" integer NOT NULL,
	"block_type" text NOT NULL,
	"title" text,
	"content" text,
	"media_url" text,
	"media_type" text,
	"is_collapsible" boolean DEFAULT false,
	"is_expanded_by_default" boolean DEFAULT true,
	"display_order" integer DEFAULT 0 NOT NULL,
	"settings" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lesson_media" (
	"id" serial PRIMARY KEY NOT NULL,
	"lesson_id" integer NOT NULL,
	"type" text NOT NULL,
	"file_url" text NOT NULL,
	"original_name" text,
	"file_size" integer,
	"mime_type" text,
	"is_collapsible" boolean DEFAULT true,
	"is_visible_by_default" boolean DEFAULT true,
	"display_order" integer DEFAULT 0,
	"caption" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lesson_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"lesson_id" integer NOT NULL,
	"course_or_subject_id" uuid NOT NULL,
	"started_at" timestamp DEFAULT now(),
	"completed_at" timestamp,
	"progress_percent" integer DEFAULT 0,
	"quiz_passed" boolean,
	"score" integer,
	"last_accessed_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lessons" (
	"id" serial PRIMARY KEY NOT NULL,
	"module_id" integer NOT NULL,
	"title" text NOT NULL,
	"content" text,
	"video_url" text,
	"order_num" integer NOT NULL,
	"category_id" integer,
	"description" text,
	"level" integer DEFAULT 1,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"course_id" uuid,
	"subject_id" uuid,
	"images" text[],
	"duration_minutes" integer DEFAULT 30,
	"order" integer DEFAULT 0,
	"free_preview_flag" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "manual_plan_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"assigned_by_admin_id" uuid NOT NULL,
	"subscription_tier" text,
	"freelancer_plan_id" text,
	"reason" "manual_plan_assignment_reason" NOT NULL,
	"notes" text,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"duration" text,
	"previous_plan" text,
	"previous_freelancer_plan" text,
	"previous_expiry" timestamp,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sender_id" uuid NOT NULL,
	"receiver_id" uuid,
	"group_id" uuid,
	"thread_id" uuid,
	"content" text,
	"message_type" text DEFAULT 'text',
	"file_url" text,
	"file_type" text,
	"is_read" boolean DEFAULT false,
	"delivered_at" timestamp,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "moderation_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"moderator_id" uuid NOT NULL,
	"action_type" text NOT NULL,
	"target_type" text NOT NULL,
	"target_id" uuid NOT NULL,
	"reason" text,
	"details" jsonb,
	"original_content" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "modules" (
	"id" serial PRIMARY KEY NOT NULL,
	"course_id" uuid NOT NULL,
	"title" text NOT NULL,
	"order_num" integer DEFAULT 1 NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"type" text NOT NULL,
	"is_read" boolean DEFAULT false,
	"action_url" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"total_price" numeric(10, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"price" numeric(10, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"guest_email" text,
	"total_amount" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'USD',
	"status" "order_status" DEFAULT 'pending' NOT NULL,
	"payment_intent_id" text,
	"payment_method" text,
	"shipping_address" jsonb,
	"customer_notes" text,
	"admin_notes" text,
	"coupon_id" uuid,
	"discount_amount" numeric(10, 2) DEFAULT '0',
	"completed_at" timestamp,
	"digital_fulfillment_status" text DEFAULT 'pending',
	"download_email_sent" boolean DEFAULT false,
	"download_email_sent_at" timestamp,
	"download_links_expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"buyer_id" uuid,
	"product_id" uuid,
	"seller_id" uuid,
	"amount" numeric(10, 2),
	"quantity" integer DEFAULT 1,
	"download_url" text,
	"download_count" integer DEFAULT 0,
	"expires_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"is_used" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "password_reset_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "payment_gateways" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gateway_id" text NOT NULL,
	"gateway_name" text NOT NULL,
	"is_enabled" boolean DEFAULT false,
	"is_primary" boolean DEFAULT false,
	"publishable_key" text,
	"secret_key" text,
	"webhook_secret" text,
	"additional_config" jsonb,
	"test_mode" boolean DEFAULT true,
	"supported_currencies" jsonb,
	"features" jsonb,
	"updated_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "payment_gateways_gateway_id_unique" UNIQUE("gateway_id")
);
--> statement-breakpoint
CREATE TABLE "payment_methods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"stripe_payment_method_id" text,
	"type" text NOT NULL,
	"display_name" text NOT NULL,
	"last_four" text,
	"expiry_date" text,
	"cardholder_name" text,
	"is_default" boolean DEFAULT false,
	"is_verified" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"plan_type" text,
	"provider" text DEFAULT 'Stripe',
	"provider_id" text,
	"amount" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"status" text NOT NULL,
	"subscription_id" uuid,
	"stripe_payment_intent_id" text,
	"stripe_charge_id" text,
	"description" text,
	"payment_method" text,
	"receipt_url" text,
	"refunded_amount" numeric(10, 2) DEFAULT '0',
	"metadata" jsonb,
	"processed_at" timestamp,
	"failure_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payout_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "payout_account_type" NOT NULL,
	"account_name" text NOT NULL,
	"details" jsonb NOT NULL,
	"is_verified" boolean DEFAULT false,
	"is_default" boolean DEFAULT false,
	"verified_at" timestamp,
	"verified_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "premium_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sender_id" uuid NOT NULL,
	"receiver_id" uuid NOT NULL,
	"content" text NOT NULL,
	"message_type" text DEFAULT 'text',
	"file_metadata" jsonb,
	"status" text DEFAULT 'pending',
	"approved_by" uuid,
	"approved_at" timestamp,
	"rejection_reason" text,
	"sent_at" timestamp DEFAULT now() NOT NULL,
	"delivered_at" timestamp,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pricing_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"display_name" text,
	"description" text,
	"price_monthly" numeric(10, 2),
	"price_yearly" numeric(10, 2),
	"currency" text DEFAULT 'USD',
	"billing_period" text DEFAULT 'monthly',
	"features" text[],
	"limitations" jsonb,
	"max_subjects" integer,
	"max_messages_per_day" integer,
	"max_community_posts_per_day" integer,
	"is_active" boolean DEFAULT true,
	"is_popular" boolean DEFAULT false,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"grade_tier" "grade_subscription_tier",
	"grade_range" text,
	"benefits" text[]
);
--> statement-breakpoint
CREATE TABLE "product_follows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"seller_id" uuid NOT NULL,
	"follower_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "product_follows_unique" UNIQUE("seller_id","follower_id")
);
--> statement-breakpoint
CREATE TABLE "product_likes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "product_likes_unique" UNIQUE("product_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"seller_id" uuid NOT NULL,
	"seller_role" "app_role" NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"type" "product_type" NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'USD',
	"file_url" text,
	"download_limit" integer,
	"images" text[],
	"preview_images" text[],
	"downloadable_files" jsonb,
	"stock" integer,
	"category_id" uuid,
	"category" text,
	"tags" text[],
	"subcategory" text,
	"file_format" text[],
	"style" text,
	"dimensions" text,
	"compatibility" text[],
	"status" "product_status" DEFAULT 'pending' NOT NULL,
	"approved_by" uuid,
	"approved_at" timestamp,
	"rejection_reason" text,
	"sales_count" integer DEFAULT 0,
	"rating" numeric(3, 2),
	"review_count" integer DEFAULT 0,
	"likes_count" integer DEFAULT 0,
	"followers_count" integer DEFAULT 0,
	"featured" boolean DEFAULT false,
	"featured_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profile_boost_followers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"display_name" text NOT NULL,
	"avatar_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profile_boost_likes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"display_name" text NOT NULL,
	"avatar_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profile_follows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"follower_user_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "profileFollows_unique" UNIQUE("profile_id","follower_user_id")
);
--> statement-breakpoint
CREATE TABLE "profile_likes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "profileLikes_unique" UNIQUE("profile_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "profile_views" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"viewer_user_id" uuid,
	"visitor_id" text,
	"session_id" text,
	"ip_hash" text,
	"ua_hash" text,
	"referer" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"display_name" text,
	"email" text,
	"age" integer NOT NULL,
	"grade" integer NOT NULL,
	"grade_level" "grade_level",
	"education_level" text DEFAULT 'grade',
	"subscription_tier" text,
	"country" text NOT NULL,
	"country_id" integer,
	"grade_system" text,
	"avatar_url" text,
	"profile_picture" text,
	"role" text DEFAULT 'student',
	"status" text DEFAULT 'active',
	"pronouns" text,
	"bio" text,
	"qualifications" text,
	"experience" text,
	"available_hours" text,
	"hourly_rate" numeric(10, 2),
	"plan" text DEFAULT '',
	"plan_expiry" timestamp,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"is_test" boolean DEFAULT false,
	"is_online" boolean DEFAULT false,
	"last_seen" timestamp,
	"last_pricing_shown" timestamp,
	"availability_settings" text,
	"approval_status" "approval_status" DEFAULT 'pending',
	"approved_by" uuid,
	"approved_at" timestamp,
	"rejection_reason" text,
	"admin_notes" text,
	"professional_title" text,
	"tagline" text,
	"cover_image_url" text,
	"skills" text[],
	"social_links" jsonb,
	"website_url" text,
	"portfolio_links" text[],
	"location" text,
	"location_lat" numeric(10, 7),
	"location_lng" numeric(10, 7),
	"time_zone" text,
	"years_of_experience" integer,
	"work_availability" text DEFAULT 'available',
	"response_time" text DEFAULT 'within 24 hours',
	"professional_statement" text,
	"languages" text[],
	"completed_projects" integer DEFAULT 0,
	"client_reviews" integer DEFAULT 0,
	"average_rating" numeric(3, 2) DEFAULT '0.00',
	"profile_views" integer DEFAULT 0,
	"likes_count" integer DEFAULT 0,
	"followers_count" integer DEFAULT 0,
	"profile_visibility" text DEFAULT 'public',
	"profile_completeness" integer DEFAULT 0,
	"featured_work_ids" text[],
	"verified" boolean DEFAULT false,
	"verification_badge" "verification_badge" DEFAULT 'none',
	"verification_badges" text[],
	"is_featured" boolean DEFAULT false,
	"featured_at" timestamp,
	"contact_email" text,
	"phone_number" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "project_milestones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"deadline" timestamp,
	"status" text DEFAULT 'pending',
	"completed_at" timestamp,
	"order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"instructions" text,
	"client_id" uuid NOT NULL,
	"freelancer_id" uuid NOT NULL,
	"status" "freelancer_project_status" DEFAULT 'draft' NOT NULL,
	"priority" "freelancer_project_priority" DEFAULT 'medium' NOT NULL,
	"budget" numeric(10, 2),
	"currency" text DEFAULT 'USD',
	"deadline" timestamp,
	"start_date" timestamp,
	"completed_at" timestamp,
	"milestones" jsonb,
	"deliverables" jsonb,
	"requirements" text[],
	"tags" text[],
	"attachments" jsonb,
	"progress" integer DEFAULT 0,
	"estimated_hours" integer,
	"actual_hours" integer DEFAULT 0,
	"is_urgent" boolean DEFAULT false,
	"client_notes" text,
	"freelancer_notes" text,
	"feedback_rating" integer,
	"feedback_comment" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quick_responses" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"shortcut" text,
	"category" text DEFAULT 'general',
	"is_active" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quizzes" (
	"id" serial PRIMARY KEY NOT NULL,
	"lesson_id" integer,
	"topic_id" integer,
	"title" text NOT NULL,
	"description" text,
	"questions" jsonb NOT NULL,
	"time_limit_minutes" integer,
	"passing_score" integer DEFAULT 70,
	"order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "replit_users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"has_completed_profile" boolean DEFAULT false,
	"has_selected_role" boolean DEFAULT false,
	"selected_role" text,
	"additional_info" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "replit_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "schedule_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"teacher_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"duration_minutes" integer DEFAULT 60,
	"price" numeric(10, 2),
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sent_emails" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email_account_id" uuid NOT NULL,
	"to" text NOT NULL,
	"cc" text,
	"bcc" text,
	"subject" text NOT NULL,
	"text_body" text,
	"html_body" text,
	"attachments" jsonb,
	"status" text DEFAULT 'sending' NOT NULL,
	"send_error" text,
	"in_reply_to" text,
	"references" text,
	"sent_by" uuid NOT NULL,
	"sent_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shop_ads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"campaign_name" text NOT NULL,
	"status" text DEFAULT 'pending',
	"budget" numeric(10, 2) NOT NULL,
	"spent" numeric(10, 2) DEFAULT '0.00',
	"impressions" integer DEFAULT 0,
	"clicks" integer DEFAULT 0,
	"conversions" integer DEFAULT 0,
	"target_audience" text,
	"ad_content" text,
	"start_date" timestamp,
	"end_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shop_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"display_name" text NOT NULL,
	"description" text,
	"image_url" text,
	"background_color" text DEFAULT 'bg-gradient-to-br from-gray-100 to-gray-200',
	"sort_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"scope" "category_scope" DEFAULT 'global' NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "shop_categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "shop_customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"full_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"phone_country_code" text DEFAULT '+1',
	"country" text,
	"account_type" text DEFAULT 'free',
	"wallet_balance" numeric(10, 2) DEFAULT '0.00',
	"profile_picture" text,
	"referral_code" text,
	"referral_count" integer DEFAULT 0,
	"referred_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "shop_customers_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "shop_customers_referral_code_unique" UNIQUE("referral_code")
);
--> statement-breakpoint
CREATE TABLE "shop_membership_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"monthly_price" numeric(10, 2) NOT NULL,
	"yearly_price" numeric(10, 2) NOT NULL,
	"downloads_limit" text,
	"features" jsonb NOT NULL,
	"annual_ad_limit" integer,
	"daily_download_limit" integer,
	"monthly_paid_download_limit" integer,
	"ad_durations" jsonb,
	"popular" boolean DEFAULT false,
	"active" boolean DEFAULT true,
	"display_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "shop_membership_plans_plan_id_unique" UNIQUE("plan_id")
);
--> statement-breakpoint
CREATE TABLE "shop_memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"plan" text NOT NULL,
	"billing_cycle" text,
	"status" text DEFAULT 'active',
	"renewal_date" timestamp,
	"next_payment_amount" numeric(10, 2),
	"scheduled_plan" text,
	"scheduled_plan_date" timestamp,
	"stripe_subscription_id" text,
	"daily_downloads_used" integer DEFAULT 0,
	"monthly_paid_downloads_used" integer DEFAULT 0,
	"ads_created_this_month" integer DEFAULT 0,
	"last_daily_reset_date" timestamp DEFAULT now(),
	"last_monthly_reset_date" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "shop_memberships_customer_id_unique" UNIQUE("customer_id")
);
--> statement-breakpoint
CREATE TABLE "shop_purchases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"item_name" text NOT NULL,
	"item_type" text NOT NULL,
	"download_url" text NOT NULL,
	"thumbnail_url" text,
	"price" numeric(10, 2) NOT NULL,
	"order_id" text,
	"status" text DEFAULT 'completed',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shop_support_tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"subject" text NOT NULL,
	"message" text NOT NULL,
	"status" text DEFAULT 'open',
	"priority" text DEFAULT 'medium',
	"category" text,
	"admin_reply" text,
	"admin_name" text,
	"admin_email" text,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shop_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"type" text NOT NULL,
	"description" text NOT NULL,
	"status" text DEFAULT 'completed',
	"reference_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_shop_transactions_reference_id" UNIQUE("reference_id")
);
--> statement-breakpoint
CREATE TABLE "shop_voucher_failed_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"attempted_code" text NOT NULL,
	"attempted_at" timestamp DEFAULT now() NOT NULL,
	"ip_address" text
);
--> statement-breakpoint
CREATE TABLE "shop_voucher_redemptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"voucher_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"redeemed_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_customer_voucher" UNIQUE("customer_id","voucher_id")
);
--> statement-breakpoint
CREATE TABLE "shop_vouchers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"description" text,
	"max_redemptions" integer,
	"current_redemptions" integer DEFAULT 0,
	"expires_at" timestamp,
	"is_active" boolean DEFAULT true,
	"recipient_name" text,
	"recipient_email" text,
	"email_sent" boolean DEFAULT false,
	"email_sent_at" timestamp,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "shop_vouchers_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "showcase_project_boost_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"showcase_project_id" uuid NOT NULL,
	"display_name" text NOT NULL,
	"avatar_url" text,
	"content" text NOT NULL,
	"boost_flag" boolean DEFAULT true NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "showcase_project_boost_likes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"showcase_project_id" uuid NOT NULL,
	"display_name" text NOT NULL,
	"avatar_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "showcase_projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"freelancer_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"media" jsonb,
	"tags" text[],
	"status" "showcase_status" DEFAULT 'approved' NOT NULL,
	"approved_by" uuid,
	"approved_at" timestamp,
	"rejection_reason" text,
	"views_count" integer DEFAULT 0,
	"likes_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "social_media_links" (
	"id" serial PRIMARY KEY NOT NULL,
	"whatsapp_url" text,
	"linkedin_url" text,
	"instagram_url" text,
	"threads_url" text,
	"tiktok_url" text,
	"dribbble_url" text,
	"facebook_url" text,
	"x_url" text,
	"pinterest_url" text,
	"behance_url" text,
	"telegram_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_discovery_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"is_discoverable" boolean DEFAULT true,
	"show_grade" boolean DEFAULT true,
	"show_country" boolean DEFAULT true,
	"show_subjects" boolean DEFAULT true,
	"preferred_connection_types" text[] DEFAULT '{"friend"}',
	"subjects_of_interest" text[],
	"study_goals" text,
	"max_connections" integer DEFAULT 100,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "student_discovery_preferences_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "student_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"course_id" uuid,
	"lesson_id" integer,
	"progress_percentage" integer DEFAULT 0,
	"score" integer,
	"completed_at" timestamp,
	"time_spent_minutes" integer,
	"last_accessed_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "study_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"subject" text NOT NULL,
	"color" text DEFAULT '#42fa76',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subject_chapters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subject_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"order" integer DEFAULT 1 NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subject_exercises" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lesson_id" uuid NOT NULL,
	"question" text NOT NULL,
	"options" text[] NOT NULL,
	"correct_answer" text NOT NULL,
	"explanation" text,
	"order" integer DEFAULT 1 NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subject_lessons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chapter_id" uuid NOT NULL,
	"title" text NOT NULL,
	"notes" text NOT NULL,
	"examples" text[] DEFAULT '{}',
	"cloudinary_images" text[] DEFAULT '{}',
	"order" integer DEFAULT 1 NOT NULL,
	"duration_minutes" integer DEFAULT 30,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subject_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"lesson_id" uuid NOT NULL,
	"status" text DEFAULT 'not_started',
	"score" integer,
	"total_questions" integer DEFAULT 15,
	"correct_answers" integer DEFAULT 0,
	"completed_at" timestamp,
	"time_spent" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subjects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"grade_system" text NOT NULL,
	"grade_level" integer NOT NULL,
	"description" text,
	"icon_url" text,
	"created_by" uuid,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_agents" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"avatar_url" text,
	"role" text,
	"description" text,
	"is_active" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_chat_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"guest_id" varchar(50) NOT NULL,
	"assigned_agent_id" integer,
	"admin_taken_over" boolean DEFAULT false,
	"admin_user_id" uuid,
	"user_location" jsonb,
	"user_device" jsonb,
	"first_message_sent" boolean DEFAULT false,
	"welcome_message_sent" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"session_started_at" timestamp DEFAULT now() NOT NULL,
	"last_activity_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "support_chat_sessions_guest_id_unique" UNIQUE("guest_id")
);
--> statement-breakpoint
CREATE TABLE "system_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"value" text,
	"type" text DEFAULT 'string' NOT NULL,
	"description" text,
	"category" text DEFAULT 'general' NOT NULL,
	"is_public" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "system_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"subject" text NOT NULL,
	"due_date" timestamp NOT NULL,
	"status" "task_status" DEFAULT 'todo' NOT NULL,
	"progress" integer DEFAULT 0,
	"comments_count" integer DEFAULT 0,
	"priority" text DEFAULT 'medium',
	"tags" text[],
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teacher_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"full_name" text NOT NULL,
	"email" text NOT NULL,
	"phone_number" text,
	"qualifications" text NOT NULL,
	"experience" text NOT NULL,
	"portfolio_links" text[],
	"certifications" text[],
	"country" text NOT NULL,
	"preferred_payment_method" text NOT NULL,
	"bank_details" jsonb,
	"paypal_email" text,
	"teacher_role" text DEFAULT 'teacher',
	"status" text DEFAULT 'pending',
	"admin_notes" text,
	"reviewed_by" uuid,
	"reviewed_at" timestamp,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"billing_address" jsonb,
	"tax_information" jsonb,
	"available_hours" text,
	"hourly_rate" numeric(10, 2),
	"bio" text
);
--> statement-breakpoint
CREATE TABLE "teacher_availability" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"teacher_id" uuid NOT NULL,
	"day_of_week" integer NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"time_zone" text DEFAULT 'UTC',
	"is_recurring" boolean DEFAULT true,
	"specific_date" timestamp,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teacher_student_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"teacher_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"assigned_at" timestamp DEFAULT now() NOT NULL,
	"assigned_by" uuid,
	"is_active" boolean DEFAULT true,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "topics" (
	"id" serial PRIMARY KEY NOT NULL,
	"lesson_id" integer NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"media_type" text,
	"media_url" text,
	"order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "transaction_type" NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"status" "transaction_status" DEFAULT 'pending' NOT NULL,
	"method" "payout_method",
	"description" text NOT NULL,
	"reference" text,
	"payout_account_id" uuid,
	"paypal_payout_id" text,
	"admin_notes" text,
	"processed_by" uuid,
	"processed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_balances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"available_balance" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"total_earnings" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"total_withdrawn" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"pending_payouts" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"last_updated" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_balances_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "user_login_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"session_id" text NOT NULL,
	"user_agent" text,
	"ip_address" text,
	"expires_at" timestamp NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_login_sessions_session_id_unique" UNIQUE("session_id")
);
--> statement-breakpoint
CREATE TABLE "user_notification_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"email_lessons" boolean DEFAULT true,
	"email_progress" boolean DEFAULT true,
	"email_messages" boolean DEFAULT true,
	"email_marketing" boolean DEFAULT false,
	"sms_lessons" boolean DEFAULT false,
	"sms_progress" boolean DEFAULT false,
	"sms_messages" boolean DEFAULT false,
	"push_notifications" boolean DEFAULT true,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_notification_preferences_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "user_other_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"grade_flexibility" boolean DEFAULT true,
	"advanced_analytics" boolean DEFAULT true,
	"priority_support" boolean DEFAULT true,
	"offline_access" boolean DEFAULT false,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_other_settings_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "user_privacy_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"profile_visibility" text DEFAULT 'public',
	"allow_messages" boolean DEFAULT true,
	"allow_notifications" boolean DEFAULT true,
	"data_processing_consent" boolean DEFAULT false,
	"marketing_consent" boolean DEFAULT false,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_privacy_settings_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "app_role" DEFAULT 'student' NOT NULL,
	"assigned_at" timestamp DEFAULT now(),
	"assigned_by" uuid,
	"is_active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "user_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"plan_id" uuid NOT NULL,
	"subscription_status" "approval_status",
	"stripe_subscription_id" text,
	"payment_method" text,
	"start_date" timestamp,
	"end_date" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "auth_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text,
	"education_level" "education_level" DEFAULT 'primary',
	"supabase_user_id" text,
	"auth_provider" text DEFAULT 'email',
	"has_completed_profile" boolean DEFAULT false,
	"has_selected_role" boolean DEFAULT false,
	"is_from_checkout" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "auth_users_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "auth_users_email_unique" UNIQUE("email"),
	CONSTRAINT "auth_users_supabase_user_id_unique" UNIQUE("supabase_user_id")
);
--> statement-breakpoint
CREATE TABLE "verification_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contact_info" text NOT NULL,
	"type" text NOT NULL,
	"code" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"is_used" boolean DEFAULT false,
	"attempts" integer DEFAULT 0,
	"user_data" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "verification_codes_contact_info_unique" UNIQUE("contact_info")
);
--> statement-breakpoint
CREATE TABLE "work_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"work_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"content" text NOT NULL,
	"parent_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "work_likes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"work_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "work_likes_work_id_user_id_unique" UNIQUE("work_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "work_media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"work_id" uuid NOT NULL,
	"type" "work_media_type" NOT NULL,
	"url" text NOT NULL,
	"thumb_url" text,
	"width" integer,
	"height" integer,
	"duration_sec" integer,
	"provider" text,
	"provider_id" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "work_views" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"work_id" uuid NOT NULL,
	"user_id" uuid,
	"session_id" varchar(255),
	"ip_hash" varchar(255),
	"view_date" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_user_view_per_day" UNIQUE("work_id","user_id","view_date"),
	CONSTRAINT "unique_session_view_per_day" UNIQUE("work_id","session_id","view_date")
);
--> statement-breakpoint
CREATE TABLE "works" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"category" text,
	"tags" text[],
	"cover_media_id" uuid,
	"visibility" "work_visibility" DEFAULT 'public' NOT NULL,
	"likes_count" integer DEFAULT 0 NOT NULL,
	"comments_count" integer DEFAULT 0 NOT NULL,
	"views_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ads_banners" ADD CONSTRAINT "ads_banners_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcement_reads" ADD CONSTRAINT "announcement_reads_announcement_id_announcements_id_fk" FOREIGN KEY ("announcement_id") REFERENCES "public"."announcements"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcement_reads" ADD CONSTRAINT "announcement_reads_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_teacher_id_auth_users_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_teacher_id_auth_users_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_student_id_auth_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_admin_id_auth_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_freelancer_id_auth_users_id_fk" FOREIGN KEY ("freelancer_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_requester_id_auth_users_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_cancelled_by_auth_users_id_fk" FOREIGN KEY ("cancelled_by") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignment_comments" ADD CONSTRAINT "assignment_comments_submission_id_assignment_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."assignment_submissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignment_comments" ADD CONSTRAINT "assignment_comments_author_id_auth_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignment_submissions" ADD CONSTRAINT "assignment_submissions_assignment_id_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."assignments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignment_submissions" ADD CONSTRAINT "assignment_submissions_student_id_auth_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignment_submissions" ADD CONSTRAINT "assignment_submissions_graded_by_auth_users_id_fk" FOREIGN KEY ("graded_by") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_teacher_id_auth_users_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_author_id_auth_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cart_id_carts_id_fk" FOREIGN KEY ("cart_id") REFERENCES "public"."carts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "carts" ADD CONSTRAINT "carts_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category_access_approvals" ADD CONSTRAINT "category_access_approvals_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category_access_approvals" ADD CONSTRAINT "category_access_approvals_approved_by_auth_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category_filter_options" ADD CONSTRAINT "category_filter_options_filter_id_category_filters_id_fk" FOREIGN KEY ("filter_id") REFERENCES "public"."category_filters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category_filters" ADD CONSTRAINT "category_filters_category_id_shop_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."shop_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificate_purchases" ADD CONSTRAINT "certificate_purchases_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificate_purchases" ADD CONSTRAINT "certificate_purchases_certificate_id_certificates_id_fk" FOREIGN KEY ("certificate_id") REFERENCES "public"."certificates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificate_purchases" ADD CONSTRAINT "certificate_purchases_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_participants" ADD CONSTRAINT "chat_participants_thread_id_chat_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."chat_threads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_participants" ADD CONSTRAINT "chat_participants_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_threads" ADD CONSTRAINT "chat_threads_freelancer_id_auth_users_id_fk" FOREIGN KEY ("freelancer_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_threads" ADD CONSTRAINT "chat_threads_customer_id_auth_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_threads" ADD CONSTRAINT "chat_threads_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cities" ADD CONSTRAINT "cities_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_group_members" ADD CONSTRAINT "community_group_members_group_id_community_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."community_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_groups" ADD CONSTRAINT "community_groups_created_by_auth_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_groups" ADD CONSTRAINT "community_groups_approved_by_auth_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_posts" ADD CONSTRAINT "community_posts_group_id_community_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."community_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_replies" ADD CONSTRAINT "community_replies_post_id_community_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."community_posts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "country_curricula" ADD CONSTRAINT "country_curricula_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "country_curricula" ADD CONSTRAINT "country_curricula_curriculum_id_curricula_id_fk" FOREIGN KEY ("curriculum_id") REFERENCES "public"."curricula"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_usages" ADD CONSTRAINT "coupon_usages_coupon_id_coupons_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_usages" ADD CONSTRAINT "coupon_usages_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_usages" ADD CONSTRAINT "coupon_usages_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_usages" ADD CONSTRAINT "coupon_usages_cart_id_carts_id_fk" FOREIGN KEY ("cart_id") REFERENCES "public"."carts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_comment_likes" ADD CONSTRAINT "course_comment_likes_comment_id_course_comments_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."course_comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_comment_likes" ADD CONSTRAINT "course_comment_likes_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_comment_replies" ADD CONSTRAINT "course_comment_replies_comment_id_course_comments_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."course_comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_comment_replies" ADD CONSTRAINT "course_comment_replies_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_comment_reply_likes" ADD CONSTRAINT "course_comment_reply_likes_reply_id_course_comment_replies_id_fk" FOREIGN KEY ("reply_id") REFERENCES "public"."course_comment_replies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_comment_reply_likes" ADD CONSTRAINT "course_comment_reply_likes_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_comments" ADD CONSTRAINT "course_comments_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_comments" ADD CONSTRAINT "course_comments_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_enrollments" ADD CONSTRAINT "course_enrollments_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_enrollments" ADD CONSTRAINT "course_enrollments_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_purchases" ADD CONSTRAINT "course_purchases_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_purchases" ADD CONSTRAINT "course_purchases_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_reviews" ADD CONSTRAINT "course_reviews_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_reviews" ADD CONSTRAINT "course_reviews_student_id_auth_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_category_id_course_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."course_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_curriculum_id_curricula_id_fk" FOREIGN KEY ("curriculum_id") REFERENCES "public"."curricula"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_created_by_auth_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_instructor_id_auth_users_id_fk" FOREIGN KEY ("instructor_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_progress_summary" ADD CONSTRAINT "daily_progress_summary_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_question_progress" ADD CONSTRAINT "daily_question_progress_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_question_progress" ADD CONSTRAINT "daily_question_progress_question_id_daily_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."daily_questions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_questions" ADD CONSTRAINT "daily_questions_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "downloads" ADD CONSTRAINT "downloads_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "downloads" ADD CONSTRAINT "downloads_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "downloads" ADD CONSTRAINT "downloads_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_folders" ADD CONSTRAINT "email_folders_email_account_id_email_accounts_id_fk" FOREIGN KEY ("email_account_id") REFERENCES "public"."email_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_label_assignments" ADD CONSTRAINT "email_label_assignments_email_message_id_email_messages_id_fk" FOREIGN KEY ("email_message_id") REFERENCES "public"."email_messages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_label_assignments" ADD CONSTRAINT "email_label_assignments_email_label_id_email_labels_id_fk" FOREIGN KEY ("email_label_id") REFERENCES "public"."email_labels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_labels" ADD CONSTRAINT "email_labels_email_account_id_email_accounts_id_fk" FOREIGN KEY ("email_account_id") REFERENCES "public"."email_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_messages" ADD CONSTRAINT "email_messages_email_account_id_email_accounts_id_fk" FOREIGN KEY ("email_account_id") REFERENCES "public"."email_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_replies" ADD CONSTRAINT "email_replies_email_message_id_email_messages_id_fk" FOREIGN KEY ("email_message_id") REFERENCES "public"."email_messages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_replies" ADD CONSTRAINT "email_replies_email_account_id_email_accounts_id_fk" FOREIGN KEY ("email_account_id") REFERENCES "public"."email_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_replies" ADD CONSTRAINT "email_replies_sent_by_auth_users_id_fk" FOREIGN KEY ("sent_by") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_requester_id_auth_users_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_receiver_id_auth_users_id_fk" FOREIGN KEY ("receiver_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grade_systems" ADD CONSTRAINT "grade_systems_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_memberships" ADD CONSTRAINT "group_memberships_group_id_community_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."community_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_memberships" ADD CONSTRAINT "group_memberships_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "help_chat_messages" ADD CONSTRAINT "help_chat_messages_receiver_id_auth_users_id_fk" FOREIGN KEY ("receiver_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "help_chat_messages" ADD CONSTRAINT "help_chat_messages_agent_id_support_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."support_agents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "help_chat_settings" ADD CONSTRAINT "help_chat_settings_updated_by_auth_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hero_sections" ADD CONSTRAINT "hero_sections_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_content_blocks" ADD CONSTRAINT "lesson_content_blocks_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_media" ADD CONSTRAINT "lesson_media_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_module_id_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manual_plan_assignments" ADD CONSTRAINT "manual_plan_assignments_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manual_plan_assignments" ADD CONSTRAINT "manual_plan_assignments_assigned_by_admin_id_auth_users_id_fk" FOREIGN KEY ("assigned_by_admin_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_profiles_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_receiver_id_profiles_id_fk" FOREIGN KEY ("receiver_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_group_id_community_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."community_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_thread_id_chat_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."chat_threads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moderation_logs" ADD CONSTRAINT "moderation_logs_moderator_id_auth_users_id_fk" FOREIGN KEY ("moderator_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "modules" ADD CONSTRAINT "modules_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_coupon_id_coupons_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_buyer_id_auth_users_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_seller_id_auth_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_auth_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_methods" ADD CONSTRAINT "payment_methods_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_subscription_id_user_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."user_subscriptions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payout_accounts" ADD CONSTRAINT "payout_accounts_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payout_accounts" ADD CONSTRAINT "payout_accounts_verified_by_auth_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "premium_messages" ADD CONSTRAINT "premium_messages_sender_id_auth_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "premium_messages" ADD CONSTRAINT "premium_messages_receiver_id_auth_users_id_fk" FOREIGN KEY ("receiver_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "premium_messages" ADD CONSTRAINT "premium_messages_approved_by_auth_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_follows" ADD CONSTRAINT "product_follows_seller_id_auth_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."auth_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_follows" ADD CONSTRAINT "product_follows_follower_id_auth_users_id_fk" FOREIGN KEY ("follower_id") REFERENCES "public"."auth_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_likes" ADD CONSTRAINT "product_likes_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_likes" ADD CONSTRAINT "product_likes_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_seller_id_auth_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_approved_by_auth_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_boost_followers" ADD CONSTRAINT "profile_boost_followers_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_boost_likes" ADD CONSTRAINT "profile_boost_likes_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_follows" ADD CONSTRAINT "profile_follows_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_follows" ADD CONSTRAINT "profile_follows_follower_user_id_auth_users_id_fk" FOREIGN KEY ("follower_user_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_likes" ADD CONSTRAINT "profile_likes_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_likes" ADD CONSTRAINT "profile_likes_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_views" ADD CONSTRAINT "profile_views_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_views" ADD CONSTRAINT "profile_views_viewer_user_id_auth_users_id_fk" FOREIGN KEY ("viewer_user_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_approved_by_auth_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_milestones" ADD CONSTRAINT "project_milestones_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_client_id_auth_users_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_freelancer_id_auth_users_id_fk" FOREIGN KEY ("freelancer_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quick_responses" ADD CONSTRAINT "quick_responses_created_by_auth_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_templates" ADD CONSTRAINT "schedule_templates_teacher_id_auth_users_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sent_emails" ADD CONSTRAINT "sent_emails_email_account_id_email_accounts_id_fk" FOREIGN KEY ("email_account_id") REFERENCES "public"."email_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sent_emails" ADD CONSTRAINT "sent_emails_sent_by_auth_users_id_fk" FOREIGN KEY ("sent_by") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_ads" ADD CONSTRAINT "shop_ads_customer_id_shop_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."shop_customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_categories" ADD CONSTRAINT "shop_categories_created_by_auth_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_customers" ADD CONSTRAINT "shop_customers_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_customers" ADD CONSTRAINT "shop_customers_referred_by_shop_customers_id_fk" FOREIGN KEY ("referred_by") REFERENCES "public"."shop_customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_memberships" ADD CONSTRAINT "shop_memberships_customer_id_shop_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."shop_customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_purchases" ADD CONSTRAINT "shop_purchases_customer_id_shop_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."shop_customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_support_tickets" ADD CONSTRAINT "shop_support_tickets_customer_id_shop_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."shop_customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_transactions" ADD CONSTRAINT "shop_transactions_customer_id_shop_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."shop_customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_voucher_failed_attempts" ADD CONSTRAINT "shop_voucher_failed_attempts_customer_id_shop_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."shop_customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_voucher_failed_attempts" ADD CONSTRAINT "shop_voucher_failed_attempts_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_voucher_redemptions" ADD CONSTRAINT "shop_voucher_redemptions_voucher_id_shop_vouchers_id_fk" FOREIGN KEY ("voucher_id") REFERENCES "public"."shop_vouchers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_voucher_redemptions" ADD CONSTRAINT "shop_voucher_redemptions_customer_id_shop_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."shop_customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_vouchers" ADD CONSTRAINT "shop_vouchers_created_by_auth_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "showcase_project_boost_comments" ADD CONSTRAINT "showcase_project_boost_comments_showcase_project_id_showcase_projects_id_fk" FOREIGN KEY ("showcase_project_id") REFERENCES "public"."showcase_projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "showcase_project_boost_likes" ADD CONSTRAINT "showcase_project_boost_likes_showcase_project_id_showcase_projects_id_fk" FOREIGN KEY ("showcase_project_id") REFERENCES "public"."showcase_projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "showcase_projects" ADD CONSTRAINT "showcase_projects_freelancer_id_auth_users_id_fk" FOREIGN KEY ("freelancer_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "showcase_projects" ADD CONSTRAINT "showcase_projects_approved_by_auth_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_discovery_preferences" ADD CONSTRAINT "student_discovery_preferences_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_progress" ADD CONSTRAINT "student_progress_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_progress" ADD CONSTRAINT "student_progress_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_progress" ADD CONSTRAINT "student_progress_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_notes" ADD CONSTRAINT "study_notes_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subject_chapters" ADD CONSTRAINT "subject_chapters_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subject_exercises" ADD CONSTRAINT "subject_exercises_lesson_id_subject_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."subject_lessons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subject_lessons" ADD CONSTRAINT "subject_lessons_chapter_id_subject_chapters_id_fk" FOREIGN KEY ("chapter_id") REFERENCES "public"."subject_chapters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subject_progress" ADD CONSTRAINT "subject_progress_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subject_progress" ADD CONSTRAINT "subject_progress_lesson_id_subject_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."subject_lessons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_created_by_auth_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_chat_sessions" ADD CONSTRAINT "support_chat_sessions_assigned_agent_id_support_agents_id_fk" FOREIGN KEY ("assigned_agent_id") REFERENCES "public"."support_agents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_chat_sessions" ADD CONSTRAINT "support_chat_sessions_admin_user_id_auth_users_id_fk" FOREIGN KEY ("admin_user_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_applications" ADD CONSTRAINT "teacher_applications_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_applications" ADD CONSTRAINT "teacher_applications_reviewed_by_auth_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_availability" ADD CONSTRAINT "teacher_availability_teacher_id_auth_users_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_student_assignments" ADD CONSTRAINT "teacher_student_assignments_teacher_id_auth_users_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_student_assignments" ADD CONSTRAINT "teacher_student_assignments_student_id_auth_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_student_assignments" ADD CONSTRAINT "teacher_student_assignments_assigned_by_auth_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topics" ADD CONSTRAINT "topics_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_payout_account_id_payout_accounts_id_fk" FOREIGN KEY ("payout_account_id") REFERENCES "public"."payout_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_processed_by_auth_users_id_fk" FOREIGN KEY ("processed_by") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_balances" ADD CONSTRAINT "user_balances_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_login_sessions" ADD CONSTRAINT "user_login_sessions_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_notification_preferences" ADD CONSTRAINT "user_notification_preferences_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_other_settings" ADD CONSTRAINT "user_other_settings_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_privacy_settings" ADD CONSTRAINT "user_privacy_settings_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_assigned_by_auth_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_plan_id_pricing_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."pricing_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_comments" ADD CONSTRAINT "work_comments_work_id_works_id_fk" FOREIGN KEY ("work_id") REFERENCES "public"."works"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_comments" ADD CONSTRAINT "work_comments_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_likes" ADD CONSTRAINT "work_likes_work_id_works_id_fk" FOREIGN KEY ("work_id") REFERENCES "public"."works"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_likes" ADD CONSTRAINT "work_likes_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_media" ADD CONSTRAINT "work_media_work_id_works_id_fk" FOREIGN KEY ("work_id") REFERENCES "public"."works"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_views" ADD CONSTRAINT "work_views_work_id_works_id_fk" FOREIGN KEY ("work_id") REFERENCES "public"."works"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_views" ADD CONSTRAINT "work_views_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "works" ADD CONSTRAINT "works_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_admin_settings_category" ON "admin_settings" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_admin_settings_active" ON "admin_settings" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_submissions_assignment" ON "assignment_submissions" USING btree ("assignment_id");--> statement-breakpoint
CREATE INDEX "idx_submissions_student" ON "assignment_submissions" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "idx_submissions_status" ON "assignment_submissions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "blogPosts_slug_idx" ON "blog_posts" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "blogPosts_isPublished_idx" ON "blog_posts" USING btree ("is_published");--> statement-breakpoint
CREATE INDEX "blogPosts_publishedAt_idx" ON "blog_posts" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX "idx_cart_items_cart" ON "cart_items" USING btree ("cart_id");--> statement-breakpoint
CREATE INDEX "idx_cart_items_product" ON "cart_items" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_carts_user" ON "carts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_certificate_purchases_user" ON "certificate_purchases" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_certificate_purchases_course" ON "certificate_purchases" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "idx_certificate_purchases_payment_intent" ON "certificate_purchases" USING btree ("payment_intent_id");--> statement-breakpoint
CREATE INDEX "idx_certificates_user" ON "certificates" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_certificates_course" ON "certificates" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "idx_certificates_verification" ON "certificates" USING btree ("verification_code");--> statement-breakpoint
CREATE INDEX "idx_chat_participants_thread_user" ON "chat_participants" USING btree ("thread_id","user_id");--> statement-breakpoint
CREATE INDEX "idx_chat_participants_user" ON "chat_participants" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_chat_threads_freelancer" ON "chat_threads" USING btree ("freelancer_id");--> statement-breakpoint
CREATE INDEX "idx_chat_threads_customer" ON "chat_threads" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_chat_threads_status" ON "chat_threads" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_chat_threads_last_message_at" ON "chat_threads" USING btree ("last_message_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_contact_messages_created" ON "contact_messages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_contact_messages_read" ON "contact_messages" USING btree ("is_read");--> statement-breakpoint
CREATE INDEX "contactSubmissions_formType_idx" ON "contact_submissions" USING btree ("form_type");--> statement-breakpoint
CREATE INDEX "contactSubmissions_isRead_idx" ON "contact_submissions" USING btree ("is_read");--> statement-breakpoint
CREATE INDEX "contactSubmissions_status_idx" ON "contact_submissions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "contactSubmissions_createdAt_idx" ON "contact_submissions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_coupon_usages_coupon" ON "coupon_usages" USING btree ("coupon_id");--> statement-breakpoint
CREATE INDEX "idx_coupon_usages_user" ON "coupon_usages" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_coupon_usages_order" ON "coupon_usages" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_coupons_code" ON "coupons" USING btree ("code");--> statement-breakpoint
CREATE INDEX "idx_coupons_active" ON "coupons" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_coupons_dates" ON "coupons" USING btree ("start_date","end_date");--> statement-breakpoint
CREATE INDEX "idx_course_plans_active" ON "course_pricing_plans" USING btree ("active");--> statement-breakpoint
CREATE INDEX "idx_course_plans_order" ON "course_pricing_plans" USING btree ("display_order");--> statement-breakpoint
CREATE INDEX "idx_downloads_user" ON "downloads" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_downloads_product" ON "downloads" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_downloads_order" ON "downloads" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_downloads_token" ON "downloads" USING btree ("download_token");--> statement-breakpoint
CREATE INDEX "idx_downloads_user_product" ON "downloads" USING btree ("user_id","product_id");--> statement-breakpoint
CREATE INDEX "emailFolders_emailAccountId_idx" ON "email_folders" USING btree ("email_account_id");--> statement-breakpoint
CREATE INDEX "emailLabelAssignments_emailMessageId_idx" ON "email_label_assignments" USING btree ("email_message_id");--> statement-breakpoint
CREATE INDEX "emailLabelAssignments_emailLabelId_idx" ON "email_label_assignments" USING btree ("email_label_id");--> statement-breakpoint
CREATE INDEX "emailLabels_emailAccountId_idx" ON "email_labels" USING btree ("email_account_id");--> statement-breakpoint
CREATE INDEX "emailMessages_emailAccountId_idx" ON "email_messages" USING btree ("email_account_id");--> statement-breakpoint
CREATE INDEX "emailMessages_messageId_idx" ON "email_messages" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "emailMessages_receivedAt_idx" ON "email_messages" USING btree ("received_at");--> statement-breakpoint
CREATE INDEX "emailReplies_emailMessageId_idx" ON "email_replies" USING btree ("email_message_id");--> statement-breakpoint
CREATE INDEX "emailReplies_emailAccountId_idx" ON "email_replies" USING btree ("email_account_id");--> statement-breakpoint
CREATE INDEX "idx_freelancer_plans_active" ON "freelancer_pricing_plans" USING btree ("active");--> statement-breakpoint
CREATE INDEX "idx_freelancer_plans_order" ON "freelancer_pricing_plans" USING btree ("display_order");--> statement-breakpoint
CREATE INDEX "idx_help_chat_guest_id" ON "help_chat_messages" USING btree ("guest_id");--> statement-breakpoint
CREATE INDEX "idx_help_chat_receiver_id" ON "help_chat_messages" USING btree ("receiver_id");--> statement-breakpoint
CREATE INDEX "idx_help_chat_created_at" ON "help_chat_messages" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_help_chat_guest_created_at" ON "help_chat_messages" USING btree ("guest_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_help_chat_agent_id" ON "help_chat_messages" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "hero_placement_status_idx" ON "hero_sections" USING btree ("placement","status");--> statement-breakpoint
CREATE INDEX "idx_manual_plan_assignments_user" ON "manual_plan_assignments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_manual_plan_assignments_admin" ON "manual_plan_assignments" USING btree ("assigned_by_admin_id");--> statement-breakpoint
CREATE INDEX "idx_manual_plan_assignments_active" ON "manual_plan_assignments" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_manual_plan_assignments_created_at" ON "manual_plan_assignments" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_messages_sender_receiver" ON "messages" USING btree ("sender_id","receiver_id");--> statement-breakpoint
CREATE INDEX "idx_messages_receiver_created_at" ON "messages" USING btree ("receiver_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_messages_sender_created_at" ON "messages" USING btree ("sender_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_messages_group_created_at" ON "messages" USING btree ("group_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_messages_created_at" ON "messages" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_messages_unread" ON "messages" USING btree ("receiver_id","is_read","read_at");--> statement-breakpoint
CREATE INDEX "idx_messages_thread_created_at" ON "messages" USING btree ("thread_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_order_items_order" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_order_items_product" ON "order_items" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_orders_user" ON "orders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_orders_status" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_orders_created_at" ON "orders" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_orders_buyer" ON "orders" USING btree ("buyer_id");--> statement-breakpoint
CREATE INDEX "idx_orders_seller" ON "orders" USING btree ("seller_id");--> statement-breakpoint
CREATE INDEX "idx_orders_product" ON "orders" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_payment_gateways_enabled" ON "payment_gateways" USING btree ("is_enabled");--> statement-breakpoint
CREATE INDEX "idx_payment_gateways_primary" ON "payment_gateways" USING btree ("is_primary");--> statement-breakpoint
CREATE INDEX "product_follows_seller_id_idx" ON "product_follows" USING btree ("seller_id");--> statement-breakpoint
CREATE INDEX "product_follows_follower_id_idx" ON "product_follows" USING btree ("follower_id");--> statement-breakpoint
CREATE INDEX "product_likes_product_id_idx" ON "product_likes" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "product_likes_user_id_idx" ON "product_likes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_products_seller" ON "products" USING btree ("seller_id");--> statement-breakpoint
CREATE INDEX "idx_products_seller_role" ON "products" USING btree ("seller_role");--> statement-breakpoint
CREATE INDEX "idx_products_status" ON "products" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_products_category_id" ON "products" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "idx_products_category" ON "products" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_products_created_at" ON "products" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "profileBoostFollowers_profileId_idx" ON "profile_boost_followers" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "profileBoostLikes_profileId_idx" ON "profile_boost_likes" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "profileFollows_profileId_idx" ON "profile_follows" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "profileFollows_followerUserId_idx" ON "profile_follows" USING btree ("follower_user_id");--> statement-breakpoint
CREATE INDEX "profileLikes_profileId_idx" ON "profile_likes" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "profileLikes_userId_idx" ON "profile_likes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "profileViews_profileId_idx" ON "profile_views" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "profileViews_createdAt_idx" ON "profile_views" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_project_milestones_project" ON "project_milestones" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "idx_project_milestones_status" ON "project_milestones" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_projects_freelancer" ON "projects" USING btree ("freelancer_id");--> statement-breakpoint
CREATE INDEX "idx_projects_client" ON "projects" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "idx_projects_status" ON "projects" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_projects_deadline" ON "projects" USING btree ("deadline");--> statement-breakpoint
CREATE INDEX "idx_projects_created_at" ON "projects" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "sentEmails_emailAccountId_idx" ON "sent_emails" USING btree ("email_account_id");--> statement-breakpoint
CREATE INDEX "sentEmails_status_idx" ON "sent_emails" USING btree ("status");--> statement-breakpoint
CREATE INDEX "sentEmails_sentAt_idx" ON "sent_emails" USING btree ("sent_at");--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");--> statement-breakpoint
CREATE INDEX "idx_shop_ads_customer_id" ON "shop_ads" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_shop_ads_status" ON "shop_ads" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_shop_ads_customer_status" ON "shop_ads" USING btree ("customer_id","status");--> statement-breakpoint
CREATE INDEX "idx_shop_plans_active" ON "shop_membership_plans" USING btree ("active");--> statement-breakpoint
CREATE INDEX "idx_shop_plans_order" ON "shop_membership_plans" USING btree ("display_order");--> statement-breakpoint
CREATE INDEX "idx_shop_purchases_customer_id" ON "shop_purchases" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_shop_purchases_order_id" ON "shop_purchases" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_shop_tickets_customer_id" ON "shop_support_tickets" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_shop_tickets_status" ON "shop_support_tickets" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_shop_transactions_customer_id" ON "shop_transactions" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_shop_transactions_type" ON "shop_transactions" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_shop_transactions_created_at" ON "shop_transactions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_shop_transactions_reference_id" ON "shop_transactions" USING btree ("reference_id");--> statement-breakpoint
CREATE INDEX "idx_voucher_failed_customer" ON "shop_voucher_failed_attempts" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_voucher_failed_user" ON "shop_voucher_failed_attempts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_voucher_failed_attempted_at" ON "shop_voucher_failed_attempts" USING btree ("attempted_at");--> statement-breakpoint
CREATE INDEX "idx_voucher_redemptions_voucher" ON "shop_voucher_redemptions" USING btree ("voucher_id");--> statement-breakpoint
CREATE INDEX "idx_voucher_redemptions_customer" ON "shop_voucher_redemptions" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_shop_vouchers_code" ON "shop_vouchers" USING btree ("code");--> statement-breakpoint
CREATE INDEX "idx_shop_vouchers_active" ON "shop_vouchers" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "showcaseProjectBoostComments_projectId_idx" ON "showcase_project_boost_comments" USING btree ("showcase_project_id");--> statement-breakpoint
CREATE INDEX "showcaseProjectBoostComments_createdAt_idx" ON "showcase_project_boost_comments" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "showcaseProjectBoostLikes_projectId_idx" ON "showcase_project_boost_likes" USING btree ("showcase_project_id");--> statement-breakpoint
CREATE INDEX "idx_showcase_freelancer" ON "showcase_projects" USING btree ("freelancer_id");--> statement-breakpoint
CREATE INDEX "idx_showcase_status" ON "showcase_projects" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_showcase_created_at" ON "showcase_projects" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_support_sessions_guest_id" ON "support_chat_sessions" USING btree ("guest_id");--> statement-breakpoint
CREATE INDEX "idx_support_sessions_agent_id" ON "support_chat_sessions" USING btree ("assigned_agent_id");--> statement-breakpoint
CREATE INDEX "idx_support_sessions_admin_id" ON "support_chat_sessions" USING btree ("admin_user_id");--> statement-breakpoint
CREATE INDEX "idx_work_comments_work_id" ON "work_comments" USING btree ("work_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_work_comments_parent_id" ON "work_comments" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "idx_work_likes_work_id" ON "work_likes" USING btree ("work_id");--> statement-breakpoint
CREATE INDEX "idx_work_likes_user_id" ON "work_likes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_work_media_work_id" ON "work_media" USING btree ("work_id");--> statement-breakpoint
CREATE INDEX "idx_work_media_sort_order" ON "work_media" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "idx_work_media_work_sort_order" ON "work_media" USING btree ("work_id","sort_order");--> statement-breakpoint
CREATE INDEX "idx_work_views_work_id" ON "work_views" USING btree ("work_id");--> statement-breakpoint
CREATE INDEX "idx_works_user_id" ON "works" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_works_visibility" ON "works" USING btree ("visibility");--> statement-breakpoint
CREATE INDEX "idx_works_created_at" ON "works" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_works_user_visibility" ON "works" USING btree ("user_id","visibility");--> statement-breakpoint
CREATE INDEX "idx_works_user_created_desc" ON "works" USING btree ("user_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_works_visibility_created_desc" ON "works" USING btree ("visibility","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_works_category" ON "works" USING btree ("category");