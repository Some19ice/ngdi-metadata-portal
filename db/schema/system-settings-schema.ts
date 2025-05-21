"use client"

import {
  pgTable,
  text,
  timestamp,
  pgEnum,
  uniqueIndex
} from "drizzle-orm/pg-core"

export const systemSettingTypeEnum = pgEnum("system_setting_type", [
  "string",
  "boolean",
  "number",
  "json"
])

export const systemSettingsTable = pgTable(
  "system_settings",
  {
    key: text("key").primaryKey(), // The setting key, e.g., 'site_name', 'maintenance_mode'
    value: text("value"), // The setting value, store as text and cast in application
    description: text("description"),
    type: systemSettingTypeEnum("type").notNull().default("string"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date())
  },
  table => {
    return {
      keyIndex: uniqueIndex("system_settings_key_idx").on(table.key)
    }
  }
)

export type InsertSystemSetting = typeof systemSettingsTable.$inferInsert
export type SelectSystemSetting = typeof systemSettingsTable.$inferSelect
