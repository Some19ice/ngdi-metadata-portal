import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar
} from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"
import { metadataRecordsTable } from "./metadata-records-schema"

export const organizationStatusEnum = pgEnum("organization_status_enum", [
  "active",
  "inactive",
  "pending_approval"
])

export const organizationsTable = pgTable("organizations", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  primaryContactName: varchar("primary_contact_name", { length: 255 }),
  primaryContactEmail: varchar("primary_contact_email", { length: 255 }),
  primaryContactPhone: varchar("primary_contact_phone", { length: 50 }),
  websiteUrl: varchar("website_url", { length: 255 }),
  address: text("address"),
  logoUrl: varchar("logo_url", { length: 255 }),
  nodeOfficerId: text("node_officer_id"),
  status: organizationStatusEnum("status").default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
})

export type InsertOrganization = typeof organizationsTable.$inferInsert
export type SelectOrganization = typeof organizationsTable.$inferSelect

// Admin view of organization data with additional fields
export interface AdminOrganizationView extends SelectOrganization {
  nodeOfficerName?: string
  memberCount?: number
}
