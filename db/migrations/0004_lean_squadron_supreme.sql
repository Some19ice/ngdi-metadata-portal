DO $$ BEGIN
 CREATE TYPE "public"."notification_priority" AS ENUM('low', 'medium', 'high', 'urgent');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."subscription_source" AS ENUM('footer', 'modal', 'other');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TYPE "notification_type" ADD VALUE 'approval_required';--> statement-breakpoint
ALTER TYPE "notification_type" ADD VALUE 'user_added';--> statement-breakpoint
ALTER TYPE "notification_type" ADD VALUE 'deadline_approaching';--> statement-breakpoint
ALTER TYPE "notification_type" ADD VALUE 'system_update';--> statement-breakpoint
ALTER TYPE "notification_type" ADD VALUE 'record_published';--> statement-breakpoint
ALTER TYPE "notification_type" ADD VALUE 'record_approved';--> statement-breakpoint
ALTER TYPE "notification_type" ADD VALUE 'record_rejected';--> statement-breakpoint
ALTER TYPE "notification_type" ADD VALUE 'role_assigned';--> statement-breakpoint
ALTER TYPE "notification_type" ADD VALUE 'role_removed';--> statement-breakpoint
ALTER TYPE "notification_type" ADD VALUE 'organization_updated';--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "metadata_analytics_summary" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"metadata_record_id" uuid NOT NULL,
	"total_views" integer DEFAULT 0 NOT NULL,
	"total_downloads" integer DEFAULT 0 NOT NULL,
	"total_shares" integer DEFAULT 0 NOT NULL,
	"total_bookmarks" integer DEFAULT 0 NOT NULL,
	"total_searches" integer DEFAULT 0 NOT NULL,
	"total_exports" integer DEFAULT 0 NOT NULL,
	"last_viewed_at" timestamp,
	"last_downloaded_at" timestamp,
	"last_shared_at" timestamp,
	"last_bookmarked_at" timestamp,
	"last_searched_at" timestamp,
	"last_exported_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "metadata_analytics_summary_metadata_record_id_unique" UNIQUE("metadata_record_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "metadata_analytics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"metadata_record_id" uuid NOT NULL,
	"event_type" text NOT NULL,
	"user_id" text,
	"session_id" text,
	"ip_address" text,
	"user_agent" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "newsletter_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"source" "subscription_source" DEFAULT 'footer' NOT NULL,
	"subscribed_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "newsletter_subscriptions_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "notifications" ALTER COLUMN "created_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "notifications" ALTER COLUMN "updated_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "user_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "organization_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "priority" "notification_priority" DEFAULT 'medium' NOT NULL;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "action_url" text;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "metadata" jsonb;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "read_at" timestamp;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "expires_at" timestamp;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "metadata_analytics_summary" ADD CONSTRAINT "metadata_analytics_summary_metadata_record_id_metadata_records_id_fk" FOREIGN KEY ("metadata_record_id") REFERENCES "public"."metadata_records"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "metadata_analytics" ADD CONSTRAINT "metadata_analytics_metadata_record_id_metadata_records_id_fk" FOREIGN KEY ("metadata_record_id") REFERENCES "public"."metadata_records"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notifications" ADD CONSTRAINT "notifications_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "notifications" DROP COLUMN IF EXISTS "recipient_user_id";--> statement-breakpoint
ALTER TABLE "notifications" DROP COLUMN IF EXISTS "link";