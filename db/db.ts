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
  metadataAnalyticsTable,
  metadataAnalyticsSummaryTable,
  metadataRecordsRelations,
  organizationsRelations,
  metadataChangeLogsRelations,
  userRolesRelations,
  userOrganizationsRelations
} from "@/db/schema"

config({ path: ".env.local" })

const schema = {
  users: usersTable,
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
  metadataStandards: metadataStandardsTable,
  profiles: profilesTable,
  metadataAnalytics: metadataAnalyticsTable,
  metadataAnalyticsSummary: metadataAnalyticsSummaryTable,
  metadataRecordsRelations: metadataRecordsRelations,
  organizationsRelations: organizationsRelations,
  metadataChangeLogsRelations: metadataChangeLogsRelations,
  userRolesRelations: userRolesRelations,
  userOrganizationsRelations: userOrganizationsRelations
}

const client = postgres(process.env.DATABASE_URL!)

export const db = drizzle(client, { schema })
