/*
 * Enhanced Metadata Records Seeding Script
 * ----------------------------------------
 * Creates comprehensive, realistic metadata records using the data generator.
 * Populates all major fields including complex JSONB structures for a complete
 * testing and demonstration environment.
 *
 * Usage:
 *   1. Ensure organizations and users exist (run seed-users-and-roles.ts first)
 *   2. Set SEED_CREATOR_USER_ID environment variable:
 *      export SEED_CREATOR_USER_ID="user_123456789"
 *   3. Run: npx tsx scripts/enhanced-seed-metadata-records.ts
 *
 * Options:
 *   --count=N     Number of records to generate (default: 25)
 *   --clear       Clear existing metadata records before seeding
 *   --status=X    Set specific status for all records (default: mix of statuses)
 */

import { config } from "dotenv"
import { db } from "@/db/db"
import {
  metadataRecordsTable,
  organizationsTable,
  InsertMetadataRecord,
  metadataStatusEnum
} from "@/db/schema"
import { eq, count } from "drizzle-orm"
import {
  DATASET_TEMPLATES,
  generateMetadataRecord
} from "./metadata-data-generator"

// Load environment variables
config({ path: ".env.local" })

const CREATOR_USER_ID = process.env.SEED_CREATOR_USER_ID as string
const DEFAULT_RECORD_COUNT = 25

interface SeedingOptions {
  count: number
  clear: boolean
  status?: (typeof metadataStatusEnum.enumValues)[number]
  verbose: boolean
}

function parseArguments(): SeedingOptions {
  const args = process.argv.slice(2)

  const options: SeedingOptions = {
    count: DEFAULT_RECORD_COUNT,
    clear: false,
    verbose: true
  }

  args.forEach(arg => {
    if (arg.startsWith("--count=")) {
      options.count = parseInt(arg.split("=")[1]) || DEFAULT_RECORD_COUNT
    } else if (arg === "--clear") {
      options.clear = true
    } else if (arg.startsWith("--status=")) {
      const status = arg.split(
        "="
      )[1] as (typeof metadataStatusEnum.enumValues)[number]
      if (metadataStatusEnum.enumValues.includes(status)) {
        options.status = status
      }
    } else if (arg === "--quiet") {
      options.verbose = false
    }
  })

  return options
}

function getRandomStatus(): (typeof metadataStatusEnum.enumValues)[number] {
  // Weight the distribution to have more published records
  const statusWeights = {
    Published: 0.6, // 60% published
    Approved: 0.15, // 15% approved
    "Pending Validation": 0.1, // 10% pending
    Draft: 0.1, // 10% draft
    "Needs Revision": 0.04, // 4% needs revision
    Archived: 0.01 // 1% archived
  }

  const rand = Math.random()
  let cumulative = 0

  for (const [status, weight] of Object.entries(statusWeights)) {
    cumulative += weight
    if (rand <= cumulative) {
      return status as (typeof metadataStatusEnum.enumValues)[number]
    }
  }

  return "Published" // Fallback
}

async function getOrganizations() {
  const organizations = await db.select().from(organizationsTable)

  if (organizations.length === 0) {
    console.warn(
      "⚠️  No organizations found. Creating default organizations for seeding."
    )

    const defaultOrganizations = [
      {
        name: "Nigerian Geological Survey Agency",
        description: "National geological surveys and mineral resource mapping",
        category: "Federal Agency",
        websiteUrl: "https://ngsa.gov.ng"
      },
      {
        name: "Nigerian Meteorological Agency",
        description: "Weather, climate, and atmospheric research",
        category: "Federal Agency",
        websiteUrl: "https://nimet.gov.ng"
      },
      {
        name: "Centre for Geodesy and Geodynamics",
        description: "Geodetic surveys and geodynamic research",
        category: "Research Institute",
        websiteUrl: "https://cgg.gov.ng"
      },
      {
        name: "National Centre for Remote Sensing",
        description: "Satellite imagery and remote sensing applications",
        category: "Research Institute",
        websiteUrl: "https://ncrs.gov.ng"
      },
      {
        name: "Federal Department of Forestry",
        description: "Forest resource management and monitoring",
        category: "Federal Agency",
        websiteUrl: "https://forestry.gov.ng"
      }
    ]

    const insertedOrgs = await db
      .insert(organizationsTable)
      .values(defaultOrganizations)
      .returning()

    console.log(`✅  Created ${insertedOrgs.length} default organizations`)
    return insertedOrgs
  }

  return organizations
}

async function clearExistingRecords(options: SeedingOptions) {
  if (!options.clear) return

  console.log("🗑️  Clearing existing metadata records...")

  const result = await db.delete(metadataRecordsTable)
  console.log("✅  Existing metadata records cleared")
}

async function generateRecords(organizations: any[], options: SeedingOptions) {
  console.log(`🎲  Generating ${options.count} metadata records...`)

  const records: InsertMetadataRecord[] = []

  for (let i = 0; i < options.count; i++) {
    // Select random template and organization
    const template =
      DATASET_TEMPLATES[Math.floor(Math.random() * DATASET_TEMPLATES.length)]
    const organization =
      organizations[Math.floor(Math.random() * organizations.length)]

    // Generate the record
    const record = generateMetadataRecord(
      template,
      organization.id,
      CREATOR_USER_ID
    )

    // Set status
    record.status = options.status || getRandomStatus()

    // Add some variation to make records unique
    if (i > 0) {
      record.title = `${record.title} - Dataset ${String(i + 1).padStart(3, "0")}`
    }

    records.push(record as InsertMetadataRecord)

    if (options.verbose && (i + 1) % 5 === 0) {
      console.log(`   Generated ${i + 1}/${options.count} records...`)
    }
  }

  return records
}

async function insertRecords(
  records: InsertMetadataRecord[],
  options: SeedingOptions
) {
  console.log(`💾  Inserting ${records.length} records into database...`)

  // Insert in batches to avoid memory issues and get better error handling
  const batchSize = 10
  let inserted = 0

  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize)

    try {
      await db.insert(metadataRecordsTable).values(batch)
      inserted += batch.length

      if (options.verbose) {
        console.log(
          `   Inserted batch ${Math.ceil((i + 1) / batchSize)}/${Math.ceil(records.length / batchSize)} (${inserted} total)`
        )
      }
    } catch (error) {
      console.error(
        `❌  Error inserting batch starting at record ${i + 1}:`,
        error
      )

      // Try inserting records individually to identify problematic ones
      for (const record of batch) {
        try {
          await db.insert(metadataRecordsTable).values(record)
          inserted++
        } catch (individualError) {
          console.error(
            `❌  Failed to insert record "${record.title}":`,
            individualError
          )
        }
      }
    }
  }

  return inserted
}

async function generateStatistics(insertedCount: number) {
  // Get statistics about the seeded data
  const statusCounts = await db
    .select({
      status: metadataRecordsTable.status,
      count: count()
    })
    .from(metadataRecordsTable)
    .groupBy(metadataRecordsTable.status)

  const dataTypeCounts = await db
    .select({
      dataType: metadataRecordsTable.dataType,
      count: count()
    })
    .from(metadataRecordsTable)
    .groupBy(metadataRecordsTable.dataType)

  const frameworkTypeCounts = await db
    .select({
      frameworkType: metadataRecordsTable.frameworkType,
      count: count()
    })
    .from(metadataRecordsTable)
    .groupBy(metadataRecordsTable.frameworkType)

  console.log("\n📊  Seeding Statistics:")
  console.log(`   Total records inserted: ${insertedCount}`)

  console.log("\n   By Status:")
  statusCounts.forEach(item => {
    console.log(`     ${item.status}: ${item.count}`)
  })

  console.log("\n   By Data Type:")
  dataTypeCounts.forEach(item => {
    console.log(`     ${item.dataType}: ${item.count}`)
  })

  console.log("\n   By Framework Type:")
  frameworkTypeCounts.forEach(item => {
    console.log(`     ${item.frameworkType || "None"}: ${item.count}`)
  })
}

async function main() {
  console.log("🚀  Enhanced Metadata Records Seeding")
  console.log("=====================================")

  // Validate required environment variables
  if (!CREATOR_USER_ID) {
    console.error("❌  SEED_CREATOR_USER_ID environment variable is required")
    console.error(
      '   Export the Clerk user ID: export SEED_CREATOR_USER_ID="user_123456789"'
    )
    process.exit(1)
  }

  const options = parseArguments()

  console.log(`📋  Seeding Options:`)
  console.log(`   Records to generate: ${options.count}`)
  console.log(`   Clear existing: ${options.clear}`)
  console.log(`   Fixed status: ${options.status || "Mixed"}`)
  console.log(`   Creator User ID: ${CREATOR_USER_ID}`)
  console.log("")

  try {
    // Get or create organizations
    const organizations = await getOrganizations()
    console.log(`✅  Found ${organizations.length} organizations`)

    // Clear existing records if requested
    await clearExistingRecords(options)

    // Generate metadata records
    const records = await generateRecords(organizations, options)
    console.log(`✅  Generated ${records.length} metadata records`)

    // Insert records into database
    const insertedCount = await insertRecords(records, options)
    console.log(
      `✅  Successfully inserted ${insertedCount}/${records.length} records`
    )

    // Generate and display statistics
    await generateStatistics(insertedCount)

    console.log("\n🎉  Enhanced metadata seeding completed successfully!")

    if (insertedCount < records.length) {
      console.log(
        `⚠️  Note: ${records.length - insertedCount} records failed to insert`
      )
      process.exit(1)
    }
  } catch (error) {
    console.error("❌  Seeding failed:", error)
    process.exit(1)
  }
}

// Handle script execution
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error("❌  Fatal error:", error)
      process.exit(1)
    })
}

export { main as enhancedSeedMetadata }
