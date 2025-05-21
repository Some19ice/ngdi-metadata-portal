import {
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  varchar
} from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"

export const roleEnum = pgEnum("role", [
  "System Administrator",
  "Node Officer",
  "Registered User",
  "Metadata Creator",
  "Metadata Approver"
])

export const rolesTable = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: roleEnum("name").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
})

export type InsertRole = typeof rolesTable.$inferInsert
export type SelectRole = typeof rolesTable.$inferSelect
