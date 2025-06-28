import {
  pgTable,
  text,
  uuid,
  timestamp,
  primaryKey,
  pgEnum
} from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"
import { organizationsTable } from "./organizations-schema"
import { usersTable } from "./users-schema"

export const organizationUserRoleEnum = pgEnum("organization_user_role", [
  "Node Officer",
  "Metadata Creator",
  "Metadata Approver"
])

export const userOrganizationsTable = pgTable(
  "user_organizations",
  {
    userId: text("user_id").notNull(), // Clerk User ID
    organizationId: uuid("organization_id")
      .references(() => organizationsTable.id, { onDelete: "cascade" })
      .notNull(),
    role: organizationUserRoleEnum("role").notNull(), // e.g., 'Node Officer', 'Member', 'Metadata Creator', 'Metadata Approver'
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date())
  },
  t => ({
    pk: primaryKey({ columns: [t.userId, t.organizationId] })
  })
)

export const userOrganizationsRelations = relations(
  userOrganizationsTable,
  ({ one }) => ({
    user: one(usersTable, {
      fields: [userOrganizationsTable.userId],
      references: [usersTable.id]
    }),
    organization: one(organizationsTable, {
      fields: [userOrganizationsTable.organizationId],
      references: [organizationsTable.id]
    })
  })
)

export type SelectUserOrganization = typeof userOrganizationsTable.$inferSelect
export type InsertUserOrganization = typeof userOrganizationsTable.$inferInsert
