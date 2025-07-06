import {
  pgTable,
  text,
  timestamp,
  uuid,
  jsonb,
  integer
} from "drizzle-orm/pg-core"
import { metadataRecordsTable } from "./metadata-records-schema"

// Analytics events table to track metadata usage
export const metadataAnalyticsTable = pgTable("metadata_analytics", {
  id: uuid("id").defaultRandom().primaryKey(),
  metadataRecordId: uuid("metadata_record_id")
    .references(() => metadataRecordsTable.id, { onDelete: "cascade" })
    .notNull(),
  eventType: text("event_type").notNull(), // 'view', 'download', 'share', 'bookmark', 'search', 'export'
  userId: text("user_id"), // Optional - can be null for anonymous users
  sessionId: text("session_id"), // For tracking anonymous sessions
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  metadata: jsonb("metadata"), // Additional event-specific data
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
})

// Aggregated analytics table for faster queries
export const metadataAnalyticsSummaryTable = pgTable(
  "metadata_analytics_summary",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    metadataRecordId: uuid("metadata_record_id")
      .references(() => metadataRecordsTable.id, { onDelete: "cascade" })
      .notNull()
      .unique(),
    totalViews: integer("total_views").default(0).notNull(),
    totalDownloads: integer("total_downloads").default(0).notNull(),
    totalShares: integer("total_shares").default(0).notNull(),
    totalBookmarks: integer("total_bookmarks").default(0).notNull(),
    totalSearches: integer("total_searches").default(0).notNull(),
    totalExports: integer("total_exports").default(0).notNull(),
    lastViewedAt: timestamp("last_viewed_at"),
    lastDownloadedAt: timestamp("last_downloaded_at"),
    lastSharedAt: timestamp("last_shared_at"),
    lastBookmarkedAt: timestamp("last_bookmarked_at"),
    lastSearchedAt: timestamp("last_searched_at"),
    lastExportedAt: timestamp("last_exported_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date())
  }
)

export type InsertMetadataAnalytics = typeof metadataAnalyticsTable.$inferInsert
export type SelectMetadataAnalytics = typeof metadataAnalyticsTable.$inferSelect

export type InsertMetadataAnalyticsSummary =
  typeof metadataAnalyticsSummaryTable.$inferInsert
export type SelectMetadataAnalyticsSummary =
  typeof metadataAnalyticsSummaryTable.$inferSelect
