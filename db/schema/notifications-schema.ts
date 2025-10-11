import {
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  pgEnum,
  jsonb
} from "drizzle-orm/pg-core"
import { organizationsTable } from "./organizations-schema"
import { metadataRecordsTable } from "./metadata-records-schema"

export const notificationTypeEnum = pgEnum("notification_type", [
  "approval_required",
  "user_added",
  "deadline_approaching",
  "system_update",
  "record_published",
  "record_approved",
  "record_rejected",
  "role_assigned",
  "role_removed",
  "organization_updated"
])

export const notificationPriorityEnum = pgEnum("notification_priority", [
  "low",
  "medium",
  "high",
  "urgent"
])

export const notificationsTable = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(), // Clerk user ID of the recipient
  organizationId: uuid("organization_id")
    .references(() => organizationsTable.id, { onDelete: "cascade" })
    .notNull(),
  type: notificationTypeEnum("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  priority: notificationPriorityEnum("priority").notNull().default("medium"),
  isRead: boolean("is_read").notNull().default(false),
  actionUrl: text("action_url"), // Optional URL for the notification action
  metadata: jsonb("metadata"), // Additional data like recordId, userId, etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  readAt: timestamp("read_at"), // When the notification was read
  expiresAt: timestamp("expires_at") // Optional expiration date
})

export type InsertNotification = typeof notificationsTable.$inferInsert
export type SelectNotification = typeof notificationsTable.$inferSelect
