import {
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
  uniqueIndex
} from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"

export const permissionsTable = pgTable(
  "permissions",
  {
    id: serial("id").primaryKey(),
    action: varchar("action", { length: 100 }).notNull(), // e.g., "create", "read", "update", "delete", "approve"
    subject: varchar("subject", { length: 100 }).notNull(), // e.g., "organization", "metadataRecord", "user"
    description: text("description"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date())
  },
  table => {
    return {
      actionSubjectIdx: uniqueIndex("permissions_action_subject_idx").on(
        table.action,
        table.subject
      )
    }
  }
)

export type InsertPermission = typeof permissionsTable.$inferInsert
export type SelectPermission = typeof permissionsTable.$inferSelect
