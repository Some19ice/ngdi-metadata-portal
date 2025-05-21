/*
<ai_context>
Initializes the database connection and schema for the app.
</ai_context>
*/

import { config } from "dotenv"
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"

import {
  organizationsTable,
  rolesTable,
  permissionsTable,
  rolePermissionsTable,
  userRolesTable,
  userOrganizationsTable,
  metadataRecordsTable,
  metadataValidationRulesTable,
  auditLogsTable,
  notificationsTable,
  systemSettingsTable,
  usersTable,
  metadataStandardsTable,
  metadataChangeLogsTable,
  profilesTable,
  metadataRecordsRelations,
  organizationsRelations,
  metadataChangeLogsRelations
} from "@/db/schema"

config({ path: ".env.local" })

const schema = {
  organizations: organizationsTable,
  roles: rolesTable,
  permissions: permissionsTable,
  rolePermissions: rolePermissionsTable,
  userRoles: userRolesTable,
  userOrganizations: userOrganizationsTable,
  metadataRecords: metadataRecordsTable,
  metadataChangeLogs: metadataChangeLogsTable,
  metadataValidationRules: metadataValidationRulesTable,
  auditLogs: auditLogsTable,
  notifications: notificationsTable,
  systemSettings: systemSettingsTable,
  users: usersTable,
  metadataStandards: metadataStandardsTable,
  profiles: profilesTable,
  metadataRecordsRelations: metadataRecordsRelations,
  organizationsRelations: organizationsRelations,
  metadataChangeLogsRelations: metadataChangeLogsRelations
}

const client = postgres(process.env.DATABASE_URL!)

export const db = drizzle(client, { schema })
