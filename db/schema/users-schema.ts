import { pgEnum, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core"

export const organizationRoleEnum = pgEnum("organization_role", [
  "admin",
  "editor",
  "viewer"
])

export const usersTable = pgTable("users", {
  id: text("id").primaryKey(), // Clerk User ID
  email: varchar("email", { length: 255 }).notNull(),
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  imageUrl: varchar("image_url", { length: 500 }),
  lastSignInAt: timestamp("last_sign_in_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
})

export type InsertUser = typeof usersTable.$inferInsert
export type SelectUser = typeof usersTable.$inferSelect
