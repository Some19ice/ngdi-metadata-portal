-- Create the organization_user_role enum type
DO $$ BEGIN
 CREATE TYPE "public"."organization_user_role" AS ENUM('Node Officer', 'Member', 'Metadata Creator', 'Metadata Approver');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Add the role column to the user_organizations table
ALTER TABLE "user_organizations" ADD COLUMN "role" "organization_user_role";
--> statement-breakpoint

-- Migrate data from is_node_officer to role
UPDATE "user_organizations" 
SET "role" = CASE 
    WHEN "is_node_officer" = true THEN 'Node Officer'::organization_user_role
    ELSE 'Member'::organization_user_role
END;
--> statement-breakpoint

-- Make role column NOT NULL after data migration
ALTER TABLE "user_organizations" ALTER COLUMN "role" SET NOT NULL;
--> statement-breakpoint

-- Optionally drop the is_node_officer column if no longer needed
-- ALTER TABLE "user_organizations" DROP COLUMN "is_node_officer"; 