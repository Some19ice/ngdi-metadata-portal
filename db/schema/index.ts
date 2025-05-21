/*
<ai_context>
Exports the database schema for the app.
</ai_context>
*/

// export * from "./auth-schema"
export * from "./users-schema"
export * from "./organizations-schema"
export * from "./metadata-standards-schema"
export * from "./metadata-records-schema"
export * from "./roles-schema"
export * from "./permissions-schema"
export * from "./rolePermissions-schema"
export * from "./userRoles-schema"
export * from "./user-organizations-schema"
export * from "./metadata-validation-rules-schema"
export * from "./audit-logs-schema"
export * from "./notifications-schema"
export * from "./system-settings-schema"
export * from "./profiles-schema"

export type {
  ConstraintsInfo,
  DataQualityInfo,
  DistributionInfo,
  FundamentalDatasetsInfo,
  LocationInfo,
  MetadataReferenceInfo,
  ProcessingInfo,
  SpatialInfo,
  TechnicalDetailsInfo,
  TemporalInfo,
  BoundingBoxInfo,
  VerticalExtentInfo,
  GeometricObject,
  VectorSpatialRepresentationInfo,
  AxisDimension,
  RasterSpatialRepresentationInfo,
  PositionalAccuracyDetail,
  ProcessorContact,
  SourceInfo,
  DistributionContact,
  LicenseInfo,
  MetadataPoc
} from "./metadata-records-schema"

// export * from "./api-keys-schema"

// Import relations function and all necessary tables for defining relations
import { relations } from "drizzle-orm"
import {
  metadataRecordsTable,
  metadataChangeLogsTable
} from "./metadata-records-schema"
import { organizationsTable } from "./organizations-schema"
// Import other tables that have relations if they were modified e.g. usersTable from './users-schema' if creator relation was active

// Define relations for metadataRecordsTable
export const metadataRecordsRelations = relations(
  metadataRecordsTable,
  ({ one, many }) => ({
    organization: one(organizationsTable, {
      fields: [metadataRecordsTable.organizationId],
      references: [organizationsTable.id]
    }),
    changeLogs: many(metadataChangeLogsTable)
    // If usersTable is involved for creators:
    // creator: one(usersTable, {
    //   fields: [metadataRecordsTable.creatorUserId],
    //   references: [usersTable.id],
    // }),
  })
)

// Define relations for metadataChangeLogsTable
export const metadataChangeLogsRelations = relations(
  metadataChangeLogsTable,
  ({ one }) => ({
    metadataRecord: one(metadataRecordsTable, {
      fields: [metadataChangeLogsTable.metadataRecordId],
      references: [metadataRecordsTable.id]
    })
    // If usersTable is involved:
    // user: one(usersTable, {
    //   fields: [metadataChangeLogsTable.userId],
    //   references: [usersTable.id],
    // }),
  })
)

// Define relations for organizationsTable
export const organizationsRelations = relations(
  organizationsTable,
  ({ many }) => ({
    metadataRecords: many(metadataRecordsTable)
  })
)

// Add other relations definitions here if they were removed from other schema files
