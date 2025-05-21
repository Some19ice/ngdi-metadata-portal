import { config } from "dotenv"
import postgres from "postgres"
import { drizzle } from "drizzle-orm/postgres-js"

// Load environment variables from .env.local
config({ path: ".env.local" })

// Get the database URL from environment variables
const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error("DATABASE_URL environment variable not found")
  process.exit(1)
}

async function main() {
  console.log("Connecting to database...")

  // Create a PostgreSQL client - TypeScript requires a definite string here
  const client = postgres(databaseUrl as string)
  const db = drizzle(client)

  console.log("Running migration tasks...")

  try {
    // Step 1: Create the organization_user_role enum type
    await client`
      DO $$ BEGIN
        CREATE TYPE "public"."organization_user_role" AS ENUM('Node Officer', 'Member', 'Metadata Creator', 'Metadata Approver');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `
    console.log(
      "Created organization_user_role enum type (or it already exists)"
    )

    // Step 2: Add the role column to the user_organizations table
    await client`
      ALTER TABLE "user_organizations" ADD COLUMN IF NOT EXISTS "role" "organization_user_role";
    `
    console.log("Added role column to user_organizations table")

    // Step 3: Migrate data from is_node_officer to role
    await client`
      UPDATE "user_organizations" 
      SET "role" = CASE 
        WHEN "is_node_officer" = true THEN 'Node Officer'::organization_user_role
        ELSE 'Member'::organization_user_role
      END
      WHERE "role" IS NULL;
    `
    console.log("Migrated data from is_node_officer to role column")

    // Step 4: Make role column NOT NULL
    await client`
      ALTER TABLE "user_organizations" ALTER COLUMN "role" SET NOT NULL;
    `
    console.log("Set role column to NOT NULL")

    // Optional Step 5: Drop the is_node_officer column if no longer needed
    // Uncomment this if you want to remove the old column after migration
    // await client`
    //   ALTER TABLE "user_organizations" DROP COLUMN "is_node_officer";
    // `
    // console.log("Dropped is_node_officer column")

    console.log("Migration completed successfully!")
  } catch (error) {
    console.error("Error during migration:", error)
    process.exit(1)
  } finally {
    // Close the database connection
    await client.end()
  }
}

main()
