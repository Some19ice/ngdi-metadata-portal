import { integer, primaryKey, pgTable, timestamp } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"
import { rolesTable } from "./roles-schema"
import { permissionsTable } from "./permissions-schema"

export const rolePermissionsTable = pgTable(
  "role_permissions",
  {
    roleId: integer("role_id")
      .notNull()
      .references(() => rolesTable.id, { onDelete: "cascade" }),
    permissionId: integer("permission_id")
      .notNull()
      .references(() => permissionsTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull()
  },
  table => {
    return {
      pk: primaryKey({ columns: [table.roleId, table.permissionId] })
    }
  }
)

export const rolePermissionsRelations = relations(
  rolePermissionsTable,
  ({ one }) => ({
    role: one(rolesTable, {
      fields: [rolePermissionsTable.roleId],
      references: [rolesTable.id]
    }),
    permission: one(permissionsTable, {
      fields: [rolePermissionsTable.permissionId],
      references: [permissionsTable.id]
    })
  })
)

export type InsertRolePermission = typeof rolePermissionsTable.$inferInsert
export type SelectRolePermission = typeof rolePermissionsTable.$inferSelect
