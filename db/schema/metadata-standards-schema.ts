import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"

export const metadataStandardsTable = pgTable("metadata_standards", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(),
  version: text("version"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
})

export type InsertMetadataStandard = typeof metadataStandardsTable.$inferInsert
export type SelectMetadataStandard = typeof metadataStandardsTable.$inferSelect
