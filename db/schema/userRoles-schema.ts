import {
  pgTable,
  text,
  integer,
  timestamp,
  primaryKey
} from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"
import { rolesTable } from "./roles-schema"
import { usersTable } from "./users-schema"

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
  user: one(usersTable, {
    fields: [userRolesTable.userId],
    references: [usersTable.id]
  }),
  role: one(rolesTable, {
    fields: [userRolesTable.roleId],
    references: [rolesTable.id]
  })
}))

export type InsertUserRole = typeof userRolesTable.$inferInsert
export type SelectUserRole = typeof userRolesTable.$inferSelect
