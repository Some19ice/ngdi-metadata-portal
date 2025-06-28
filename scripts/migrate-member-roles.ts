import { db } from "@/db/db"
import { userOrganizationsTable } from "@/db/schema"
import { eq } from "drizzle-orm"

/**
 * Migration script to update existing "Member" roles to "Metadata Creator"
 * Run this after updating the schema to remove the "Member" role
 */
async function migrateMemberRoles() {
  console.log("Starting migration of Member roles to Metadata Creator...")

  try {
    // Update all "Member" roles to "Metadata Creator"
    const result = await db
      .update(userOrganizationsTable)
      .set({ role: "Metadata Creator", updatedAt: new Date() })
      .where(eq(userOrganizationsTable.role, "Member" as any))
      .returning()

    console.log(
      `Successfully migrated ${result.length} Member roles to Metadata Creator`
    )

    // Verify no Member roles remain
    const remainingMembers = await db
      .select()
      .from(userOrganizationsTable)
      .where(eq(userOrganizationsTable.role, "Member" as any))

    if (remainingMembers.length > 0) {
      console.error(
        `Warning: ${remainingMembers.length} Member roles still exist`
      )
    } else {
      console.log("✓ All Member roles successfully migrated")
    }
  } catch (error) {
    console.error("Error migrating Member roles:", error)
    process.exit(1)
  }
}

// Run the migration
migrateMemberRoles()
  .then(() => {
    console.log("Migration completed successfully")
    process.exit(0)
  })
  .catch(error => {
    console.error("Migration failed:", error)
    process.exit(1)
  })
