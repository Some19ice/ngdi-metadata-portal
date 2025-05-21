DO $$ BEGIN
 CREATE TYPE "public"."organization_role" AS ENUM('admin', 'editor', 'viewer');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."dataset_type_enum" AS ENUM('Raster', 'Vector', 'Table', 'Service', 'Application', 'Document', 'Collection', 'Other');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."framework_type_enum" AS ENUM('Fundamental', 'Thematic', 'Special Interest', 'Administrative', 'Other');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."metadata_log_action_type" AS ENUM('CreateRecord', 'UpdateField', 'DeleteRecord', 'StatusChange', 'SubmittedForValidation', 'ApprovedRecord', 'RejectedRecord', 'RevisionSubmitted', 'Other');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."metadata_status" AS ENUM('Draft', 'Pending Validation', 'Needs Revision', 'Approved', 'Published', 'Archived');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."metadata_topic_category" AS ENUM('Farming', 'Biota', 'Boundaries', 'Climatology/Meteorology/Atmosphere', 'Economy', 'Elevation', 'Environment', 'Geoscientific Information', 'Health', 'Imagery/Base Maps/Earth Cover', 'Intelligence/Military', 'Inland Waters', 'Location', 'Oceans', 'Planning/Cadastre', 'Society', 'Structure', 'Transportation', 'Utilities/Communication', 'Other');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."role" AS ENUM('System Administrator', 'Node Officer', 'Registered User', 'Metadata Creator', 'Metadata Approver');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."organization_user_role" AS ENUM('Node Officer', 'Member', 'Metadata Creator', 'Metadata Approver');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."validation_rule_type" AS ENUM('Regex', 'MandatoryField', 'ValueRange', 'ControlledVocabulary', 'FieldLength', 'UrlFormat', 'CustomLogic');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."audit_log_action_category" AS ENUM('Authentication', 'UserManagement', 'OrganizationManagement', 'PermissionManagement', 'SettingsManagement', 'MetadataWorkflow', 'SecurityEvent', 'SystemEvent', 'Other');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."audit_log_target_entity_type" AS ENUM('User', 'Organization', 'Role', 'Permission', 'SystemSetting', 'MetadataRecord', 'System', 'None');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."notification_type" AS ENUM('MetadataStatusChange', 'NewRoleAssignment', 'TaskDelegation', 'SystemAlert', 'UserMention', 'NewFeatureAnnouncement', 'Other');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."system_setting_type" AS ENUM('string', 'boolean', 'number', 'json');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (

);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "metadata_standards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"version" text,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "metadata_standards_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "metadata_change_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"metadata_record_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"action_type" "metadata_log_action_type" NOT NULL,
	"changed_fields" jsonb,
	"old_status" text,
	"new_status" text,
	"comments" text,
	"details" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "metadata_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"data_type" "dataset_type_enum" NOT NULL,
	"abstract" text NOT NULL,
	"purpose" text,
	"metadata_standard" text DEFAULT 'NGDI Standard v1.0',
	"metadata_standard_version" text DEFAULT '1.0',
	"status" "metadata_status" DEFAULT 'Draft' NOT NULL,
	"creator_user_id" text NOT NULL,
	"organization_id" uuid,
	"keywords" text[],
	"language" text DEFAULT 'en' NOT NULL,
	"supplemental_information" text,
	"version" text,
	"author" text,
	"framework_type" "framework_type_enum",
	"thumbnail_url" text,
	"image_name" text,
	"validation_status_prd" text,
	"assessment" text,
	"location_info" jsonb DEFAULT '{}'::jsonb,
	"spatial_info" jsonb DEFAULT '{}'::jsonb,
	"production_date" date,
	"temporal_info" jsonb DEFAULT '{}'::jsonb,
	"update_frequency" text,
	"planned_available_date_time" timestamp,
	"date_info" jsonb,
	"point_of_contact" jsonb,
	"distributor_contact" jsonb,
	"process_contact" jsonb,
	"metadata_contact" jsonb,
	"distribution_info" jsonb DEFAULT '{}'::jsonb,
	"distributor_name_prd" text,
	"resource_description_prd" text,
	"distribution_liability" text,
	"custom_order_process" text,
	"technical_prerequisites" text,
	"standard_order_process" jsonb,
	"ordering_instructions" text,
	"fees" text,
	"turnaround_time" text,
	"form_type_distribution_format" jsonb,
	"distributor_transfer_options" jsonb,
	"access_method" text,
	"download_url" text,
	"api_endpoint" text,
	"license_type" text,
	"usage_terms" text,
	"attribution_requirements" text,
	"access_restrictions" jsonb,
	"file_format" text,
	"file_size" text,
	"number_of_features" text,
	"data_quality_info" jsonb DEFAULT '{}'::jsonb,
	"cloud_cover" text,
	"attribute_accuracy_report" text,
	"positional_accuracy" jsonb,
	"type_of_source_media" text,
	"source_citation" text,
	"source_citation_abbreviation" text,
	"source_contribution" text,
	"contract_grant_reference" text,
	"resource_lineage_statement" text,
	"hierarchy_level" text,
	"process_steps" jsonb,
	"metadata_review_date" date,
	"metadata_linkage" text,
	"publication_date" timestamp,
	"internal_notes" text,
	"legacy_id" text,
	"fundamental_datasets_info" jsonb DEFAULT '{}'::jsonb,
	"technical_details_info" jsonb DEFAULT '{}'::jsonb,
	"constraints_info" jsonb DEFAULT '{}'::jsonb,
	"processing_info" jsonb DEFAULT '{}'::jsonb,
	"metadata_reference_info" jsonb DEFAULT '{}'::jsonb,
	"additional_info" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "metadata_validation_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"metadata_standard_id" uuid,
	"rule_name" text NOT NULL,
	"description" text NOT NULL,
	"rule_type" "validation_rule_type" NOT NULL,
	"rule_configuration" jsonb NOT NULL,
	"error_message" text NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"user_id" text,
	"action_category" "audit_log_action_category" NOT NULL,
	"action_type" text NOT NULL,
	"target_entity_type" "audit_log_target_entity_type",
	"target_entity_id" text,
	"details" jsonb,
	"ip_address" text,
	"user_agent" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipient_user_id" text NOT NULL,
	"type" "notification_type" NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"link" text,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "system_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text,
	"description" text,
	"type" "system_setting_type" DEFAULT 'string' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "roles" ALTER COLUMN "name" SET DATA TYPE public.role USING "name"::text::public.role;
--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "node_officer_id" text;
--> statement-breakpoint
-- ALTER TABLE "user_organizations" ADD COLUMN "role" "organization_user_role" NOT NULL;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "metadata_change_logs" ADD CONSTRAINT "metadata_change_logs_metadata_record_id_metadata_records_id_fk" FOREIGN KEY ("metadata_record_id") REFERENCES "public"."metadata_records"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "metadata_records" ADD CONSTRAINT "metadata_records_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "metadata_validation_rules" ADD CONSTRAINT "metadata_validation_rules_metadata_standard_id_metadata_standards_id_fk" FOREIGN KEY ("metadata_standard_id") REFERENCES "public"."metadata_standards"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "system_settings_key_idx" ON "system_settings" USING btree ("key");--> statement-breakpoint
ALTER TABLE "user_organizations" DROP COLUMN IF EXISTS "is_node_officer";