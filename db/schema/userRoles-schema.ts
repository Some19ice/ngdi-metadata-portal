import {
  pgTable,
  text,
  integer,
  timestamp,
  primaryKey
} from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"
import { rolesTable } from "./roles-schema"
// Assuming a profilesTable or similar might exist for user profiles, but userId is just TEXT from Clerk
// import { profilesTable } from './profiles-schema'; // If you want to link to a local profiles table

export const userRolesTable = pgTable(
  "user_roles",
  {
    userId: text("user_id").notNull(), // Clerk User ID
    // If you have a local profiles table and want to enforce FK:
    // userId: text("user_id").notNull().references(() => profilesTable.id, { onDelete: "cascade" }),
    roleId: integer("role_id")
      .notNull()
      .references(() => rolesTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull()
  },
  table => {
    return {
      pk: primaryKey({ columns: [table.userId, table.roleId] })
    }
  }
)

export const userRolesRelations = relations(userRolesTable, ({ one }) => ({
  // user: one(profilesTable, { // If using a local profiles table
  //   fields: [userRolesTable.userId],
  //   references: [profilesTable.id],
  // }),
  role: one(rolesTable, {
    fields: [userRolesTable.roleId],
    references: [rolesTable.id]
  })
}))

export type InsertUserRole = typeof userRolesTable.$inferInsert
export type SelectUserRole = typeof userRolesTable.$inferSelect
