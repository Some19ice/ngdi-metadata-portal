/*
 * Script: seed-metadata-records.ts
 * --------------------------------
 * This utility seeds the database with a handful of sample metadata records so that developers
 * can test listing, searching, and workflow functionality end-to-end without having to create
 * records manually through the UI.
 *
 * Usage:
 *   1. Ensure you already have at least one organization row and a valid Clerk user in the DB.
 *      The existing `seed-users-and-roles.ts` script is the easiest way to create both.
 *   2. Export the Clerk userId you want to attribute as the creator via the environment variable
 *      `SEED_CREATOR_USER_ID`, e.g.:
 *
 *         export SEED_CREATOR_USER_ID="user_123456789"
 *
 *      The script will exit early if this variable is missing.
 *   3. Run the script with tsx:
 *
 *         npx tsx scripts/seed-metadata-records.ts
 *
 *   Adjust NUM_RECORDS or the `sampleRecords` array below as needed.
 */

import { config } from "dotenv"
import { db } from "@/db/db"
import {
  metadataRecordsTable,
  datasetTypeEnum,
  frameworkTypeEnum,
  InsertMetadataRecord
} from "@/db/schema"
import { organizationsTable } from "@/db/schema/organizations-schema"
import { eq } from "drizzle-orm"

// Load .env.local so we can access database creds as well as the seed user id.
config({ path: ".env.local" })

const CREATOR_USER_ID =
  (process.env.SEED_CREATOR_USER_ID as string) || "seed_user"
if (!process.env.SEED_CREATOR_USER_ID) {
  console.warn(
    "⚠️  SEED_CREATOR_USER_ID not provided. Using placeholder creatorUserId 'seed_user'. For realistic data attribution, set SEED_CREATOR_USER_ID to a real Clerk user ID."
  )
}

// Feel free to tweak the sample data as required for your tests.
interface SampleRecordInput {
  title: string
  dataType: (typeof datasetTypeEnum.enumValues)[number]
  abstract: string
  keywords?: string[]
  frameworkType?: (typeof frameworkTypeEnum.enumValues)[number]
}

const SAMPLE_RECORDS: SampleRecordInput[] = [
  {
    title: "Nigeria Administrative Boundaries – Level 1",
    dataType: "Vector",
    abstract:
      "Administrative boundary polygons representing Nigeria's first-level subdivisions (states). Seeded test data.",
    keywords: ["Nigeria", "Boundaries", "States"],
    frameworkType: "Administrative"
  },
  {
    title: "Landsat-8 Imagery – Abuja (2024-01-15)",
    dataType: "Raster",
    abstract:
      "False-color Landsat-8 scene captured on 2024-01-15 covering Abuja and surrounding areas. Seeded test data.",
    keywords: ["Imagery", "Landsat", "Abuja"],
    frameworkType: "Thematic"
  },
  {
    title: "National Road Network (v2024)",
    dataType: "Vector",
    abstract:
      "Comprehensive polyline layer of Nigeria's trunk A, B and C road network compiled from multiple authoritative sources.",
    keywords: ["Transportation", "Roads", "Network"],
    frameworkType: "Fundamental"
  }
]

async function main() {
  console.log("🚀  Seeding metadata records…")

  // Ensure there is at least one organization. If none exists, create a default one for seeding.
  let [org] = await db.select().from(organizationsTable).limit(1)
  if (!org) {
    console.warn(
      "⚠️  No organizations found. Creating a default 'Seed Organization'."
    )
    const [insertedOrg] = await db
      .insert(organizationsTable)
      .values({
        name: "Seed Organization",
        description: "Auto-created for seeding"
      })
      .returning()
    org = insertedOrg
    console.log(`✅  Created default organization: ${org.name} (${org.id})`)
  }

  for (const record of SAMPLE_RECORDS) {
    // Check if a record with the same title already exists to make the script idempotent.
    const existing = await db
      .select({ id: metadataRecordsTable.id })
      .from(metadataRecordsTable)
      .where(eq(metadataRecordsTable.title, record.title))
      .limit(1)

    if (existing.length > 0) {
      console.log(`ℹ️  Metadata record already exists: ${record.title}`)
      continue
    }

    const payload: InsertMetadataRecord = {
      title: record.title,
      dataType: record.dataType,
      abstract: record.abstract,
      keywords: record.keywords ?? [],
      frameworkType: record.frameworkType ?? null,
      creatorUserId: CREATOR_USER_ID,
      organizationId: org.id,
      status: "Published"
    }

    await db.insert(metadataRecordsTable).values(payload)

    console.log(`✅  Inserted metadata record: ${record.title}`)
  }

  console.log("🎉  Seeding complete!")
  process.exit(0)
}

main().catch(err => {
  console.error("❌  Seeding failed:", err)
  process.exit(1)
})
