import {
  pgTable,
  text,
  timestamp,
  uuid,
  pgEnum,
  jsonb
} from "drizzle-orm/pg-core"
// We might want to reference usersTable if we had a full local user profile table,
// but for now, userId (clerkId) is text.

export const auditLogActionCategoryEnum = pgEnum("audit_log_action_category", [
  "Authentication", // e.g., login, logout, failed_login
  "UserManagement", // e.g., user_create, user_update, user_delete, role_assign, role_revoke
  "OrganizationManagement", // e.g., org_create, org_update, org_delete, org_user_add, org_user_remove
  "PermissionManagement", // e.g., permission_grant, permission_revoke (if more granular than roles)
  "SettingsManagement", // e.g., system_setting_update
  "MetadataWorkflow", // This could be an alternative or supplement to metadata_change_logs for high-level workflow events
  "SecurityEvent", // e.g., suspicious_activity, rate_limit_exceeded
  "SystemEvent", // e.g., cron_job_start, cron_job_fail, backup_complete
  "Other"
])

export const auditLogTargetEntityTypeEnum = pgEnum(
  "audit_log_target_entity_type",
  [
    "User",
    "Organization",
    "Role",
    "Permission",
    "SystemSetting",
    "MetadataRecord", // Can be used if this table also logs high-level metadata events
    "System", // For system-wide events not tied to a specific entity
    "None" // For actions that don't have a specific target entity (e.g., user login)
  ]
)

export const auditLogsTable = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  timestamp: timestamp("timestamp", { withTimezone: true })
    .defaultNow()
    .notNull(),

  userId: text("user_id"), // Clerk User ID - can be null if system initiated the action

  actionCategory: auditLogActionCategoryEnum("action_category").notNull(),
  actionType: text("action_type").notNull(), // Specific action, e.g., "user_login_success", "updated_org_name"

  targetEntityType: auditLogTargetEntityTypeEnum("target_entity_type"),
  targetEntityId: text("target_entity_id"), // UUID or other ID type depending on the entity

  details: jsonb("details"), // Store any relevant details, old/new values, IP address, etc.

  ipAddress: text("ip_address"), // Optional: IP address of the user performing the action
  userAgent: text("user_agent") // Optional: User agent of the client
})

export type InsertAuditLog = typeof auditLogsTable.$inferInsert
export type SelectAuditLog = typeof auditLogsTable.$inferSelect
