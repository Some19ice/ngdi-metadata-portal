"use client"

import {
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  pgEnum
} from "drizzle-orm/pg-core"

export const notificationTypeEnum = pgEnum("notification_type", [
  "MetadataStatusChange", // e.g., your draft was approved, needs revision
  "NewRoleAssignment", // e.g., you have been made a Node Officer
  "TaskDelegation", // e.g., a metadata record review is assigned to you
  "SystemAlert", // e.g., planned maintenance
  "UserMention", // e.g., someone mentioned you in a comment
  "NewFeatureAnnouncement",
  "Other"
])

export const notificationsTable = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  recipientUserId: text("recipient_user_id").notNull(), // Clerk User ID
  type: notificationTypeEnum("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  link: text("link"), // Optional URL to a relevant page
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
})

export type InsertNotification = typeof notificationsTable.$inferInsert
export type SelectNotification = typeof notificationsTable.$inferSelect
