import { pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"

export const permissionsTable = pgTable("permissions", {
  id: serial("id").primaryKey(),
  action: varchar("action", { length: 100 }).notNull(), // e.g., "create", "read", "update", "delete", "approve"
  subject: varchar("subject", { length: 100 }).notNull(), // e.g., "organization", "metadataRecord", "user"
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
})
// As per data-models.md: *Unique constraint on (`action`, `subject`)*
// This needs to be added in drizzle-kit if not directly expressible here or handled at DB level.
// For now, ensuring the application logic maintains this is key.

export type InsertPermission = typeof permissionsTable.$inferInsert
export type SelectPermission = typeof permissionsTable.$inferSelect
