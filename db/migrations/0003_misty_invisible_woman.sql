DROP TABLE "todos";--> statement-breakpoint
ALTER TABLE "metadata_records" ALTER COLUMN "location_info" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "metadata_records" ALTER COLUMN "spatial_info" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "metadata_records" ALTER COLUMN "temporal_info" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "metadata_records" ALTER COLUMN "distribution_info" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "metadata_records" ALTER COLUMN "data_quality_info" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "metadata_records" ALTER COLUMN "publication_date" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "metadata_records" ALTER COLUMN "fundamental_datasets_info" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "metadata_records" ALTER COLUMN "technical_details_info" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "metadata_records" ALTER COLUMN "constraints_info" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "metadata_records" ALTER COLUMN "processing_info" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "metadata_records" ALTER COLUMN "metadata_reference_info" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "metadata_records" ALTER COLUMN "additional_info" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "id" text PRIMARY KEY NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "first_name" varchar(100);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_name" varchar(100);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "image_url" varchar(500);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_sign_in_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "metadata_records" ADD COLUMN "contact_name" text;--> statement-breakpoint
ALTER TABLE "metadata_records" ADD COLUMN "contact_email" text;--> statement-breakpoint
ALTER TABLE "metadata_records" ADD COLUMN "contact_phone" text;--> statement-breakpoint
ALTER TABLE "metadata_records" ADD COLUMN "contact_address" text;--> statement-breakpoint
ALTER TABLE "metadata_records" ADD COLUMN "lineage" text;--> statement-breakpoint
ALTER TABLE "metadata_records" ADD COLUMN "doi" text;--> statement-breakpoint
ALTER TABLE "metadata_records" ADD COLUMN "licence" text;--> statement-breakpoint
ALTER TABLE "metadata_records" ADD COLUMN "access_and_use_limitations" text;--> statement-breakpoint
ALTER TABLE "metadata_records" ADD COLUMN "data_sources" text;--> statement-breakpoint
ALTER TABLE "metadata_records" ADD COLUMN "methodology" text;--> statement-breakpoint
ALTER TABLE "metadata_records" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "metadata_records" ADD COLUMN "additional_information" text;--> statement-breakpoint
ALTER TABLE "metadata_records" ADD COLUMN "spatial_representation_type" text;--> statement-breakpoint
ALTER TABLE "metadata_records" ADD COLUMN "spatial_reference_system" text;--> statement-breakpoint
ALTER TABLE "metadata_records" ADD COLUMN "spatial_resolution" text;--> statement-breakpoint
ALTER TABLE "metadata_records" ADD COLUMN "geographic_description" text;--> statement-breakpoint
ALTER TABLE "metadata_records" ADD COLUMN "bounding_box_north" real;--> statement-breakpoint
ALTER TABLE "metadata_records" ADD COLUMN "bounding_box_south" real;--> statement-breakpoint
ALTER TABLE "metadata_records" ADD COLUMN "bounding_box_east" real;--> statement-breakpoint
ALTER TABLE "metadata_records" ADD COLUMN "bounding_box_west" real;--> statement-breakpoint
ALTER TABLE "metadata_records" ADD COLUMN "geometry" jsonb;--> statement-breakpoint
ALTER TABLE "metadata_records" ADD COLUMN "temporal_extent_from" date;--> statement-breakpoint
ALTER TABLE "metadata_records" ADD COLUMN "temporal_extent_to" date;--> statement-breakpoint
ALTER TABLE "metadata_records" ADD COLUMN "data_quality_scope" text;--> statement-breakpoint
ALTER TABLE "metadata_records" ADD COLUMN "data_quality_report" text;--> statement-breakpoint
ALTER TABLE "metadata_records" ADD COLUMN "last_revision_date" date;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "permissions_action_subject_idx" ON "permissions" USING btree ("action","subject");