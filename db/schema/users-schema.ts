import { pgEnum, pgTable } from "drizzle-orm/pg-core"

export const organizationRoleEnum = pgEnum("organization_role", [
  "admin",
  "editor",
  "viewer"
])

export const usersTable = pgTable("users", {
  // ... existing code ...
})
