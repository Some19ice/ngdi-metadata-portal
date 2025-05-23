import { relations, sql } from "drizzle-orm"

import {
  pgTable,
  text,
  timestamp,
  uuid,
  jsonb,
  pgEnum,
  date,
  integer,
  real
} from "drizzle-orm/pg-core"
// import { usersTable } from "./users-schema"
import { organizationsTable } from "./organizations-schema"

// Enum for metadata status
export const metadataStatusEnum = pgEnum("metadata_status", [
  "Draft",
  "Pending Validation",
  "Needs Revision",
  "Approved",
  "Published",
  "Archived"
])

// Enum for topic categories (as an example, can be expanded based on NGDI specs)
export const metadataTopicCategoryEnum = pgEnum("metadata_topic_category", [
  "Farming",
  "Biota",
  "Boundaries",
  "Climatology/Meteorology/Atmosphere",
  "Economy",
  "Elevation",
  "Environment",
  "Geoscientific Information",
  "Health",
  "Imagery/Base Maps/Earth Cover",
  "Intelligence/Military",
  "Inland Waters",
  "Location",
  "Oceans",
  "Planning/Cadastre",
  "Society",
  "Structure",
  "Transportation",
  "Utilities/Communication",
  "Other"
])

// Enum for dataset types
export const datasetTypeEnum = pgEnum("dataset_type_enum", [
  "Raster",
  "Vector",
  "Table",
  "Service",
  "Application",
  "Document",
  "Collection",
  "Other"
])

// Enum for framework types
export const frameworkTypeEnum = pgEnum("framework_type_enum", [
  "Fundamental",
  "Thematic",
  "Special Interest",
  "Administrative",
  "Other"
])

// Enum for log action types
export const metadataLogActionTypeEnum = pgEnum("metadata_log_action_type", [
  "CreateRecord",
  "UpdateField",
  "DeleteRecord",
  "StatusChange",
  "SubmittedForValidation",
  "ApprovedRecord",
  "RejectedRecord",
  "RevisionSubmitted",
  "Other"
])

// TypeScript interfaces for JSONB fields based on docs/data-models.md
export interface LocationInfo {
  country: string | null // e.g., "Nigeria"
  geopoliticalZone: string | null
  state: string | null
  lga: string | null
  townCity: string | null
}

// START: Updated SpatialInfo and related interfaces from Subtask 24.1
export interface BoundingBoxInfo {
  westBoundingCoordinate: number | null
  eastBoundingCoordinate: number | null
  northBoundingCoordinate: number | null
  southBoundingCoordinate: number | null
}

export interface VerticalExtentInfo {
  minimumValue: number | null
  maximumValue: number | null
  unitOfMeasure: string | null
}

export interface GeometricObject {
  type: string | null
  count: number | null
}

export interface VectorSpatialRepresentationInfo {
  topologyLevel: string | null
  geometricObjects: GeometricObject[] | null
}

export interface AxisDimension {
  name: string | null
  size: number | null
  resolution: string | null
}

export interface RasterSpatialRepresentationInfo {
  axisDimensions: AxisDimension[] | null
  cellGeometry: string | null
  transformationParameterAvailability: boolean | null
  cloudCoverPercentage: number | null
  compressionGenerationQuantity: number | null
}

export interface SpatialInfo {
  // NEW detailed version
  coordinateSystem: string | null
  projection: string | null
  datum: string | null
  resolutionScale: string | null // Replaces 'scale' and 'resolution' from simpler version
  geometricObjectType: string | null // e.g. Point, Line, Polygon, Grid
  numFeaturesOrLayers: number | null
  format: string | null // e.g. GeoTIFF, Shapefile - specific to this spatial context if different from main technicalDetails.fileFormat
  distributionFormat: string | null // if specific distribution format for spatial aspect
  spatialRepresentationType:
    | "Vector"
    | "Raster"
    | "Text Table"
    | "TIN"
    | "Stereo Model"
    | "Video"
    | null
  vectorSpatialRepresentation: VectorSpatialRepresentationInfo | null
  rasterSpatialRepresentation: RasterSpatialRepresentationInfo | null
  boundingBox: BoundingBoxInfo | null
  verticalExtent: VerticalExtentInfo | null
}
// END: Updated SpatialInfo and related interfaces

export interface TemporalInfo {
  dateFrom: string | null // ISO Date string
  dateTo: string | null // ISO Date string
}

export interface TechnicalDetailsInfo {
  fileFormat: string | null // e.g., "GeoTIFF", "Shapefile"
  fileSizeMB: number | null
  numFeaturesOrLayers: number | null
  softwareHardwareRequirements: string | null
}

export interface ConstraintsInfo {
  accessConstraints: string | null
  useConstraints: string | null
  otherConstraints: string | null
}

export interface PositionalAccuracyDetail {
  accuracyReport: string | null
  accuracyPercentage: number | null
  accuracyExplanation: string | null
}

export interface DataQualityInfo {
  logicalConsistencyReport: string | null
  completenessReport: string | null
  attributeAccuracyReport: string | null
  horizontalAccuracy: PositionalAccuracyDetail | null
  verticalAccuracy: PositionalAccuracyDetail | null
}

export interface ProcessorContact {
  processorName: string | null
  processorEmail: string | null
  processorAddress: string | null
}

export interface SourceInfo {
  sourceScaleDenominator: number | null
  sourceMediaType: string | null
  sourceCitation: string | null
  citationTitle: string | null
  contractReference: string | null
  contractDate: string | null // ISO Date string
}

export interface ProcessingInfo {
  processingStepsDescription: string | null
  softwareAndVersionUsed: string | null
  processedDate: string | null // ISO Date string
  processorContact: ProcessorContact | null
  sourceInfo: SourceInfo | null
}

export interface DistributionContact {
  contactPersonOffice: string | null
  email: string | null
  departmentUnit: string | null
  phoneNumber: string | null
}

export interface LicenseInfo {
  licenseType: string | null
  usageTerms: string | null
  attributionRequirements: string | null
  accessRestrictions: string[] | null // Array of selected strings
}

export interface DistributionInfo {
  distributionFormat: string | null
  accessMethod: string | null // e.g., "Download", "API"
  downloadUrl: string | null
  apiEndpoint: string | null
  licenseInfo: LicenseInfo | null
  distributionContact: DistributionContact | null
}

export interface MetadataPoc {
  contactName_metadataPOC: string | null
  address_metadataPOC: string | null
  email_metadataPOC: string | null
  phoneNumber_metadataPOC: string | null
}

export interface MetadataReferenceInfo {
  metadataCreationDate: string | null // ISO Date string
  metadataReviewDate: string | null // ISO Date string
  metadataPoc: MetadataPoc | null
}

export interface FundamentalDatasetsInfo {
  geodeticData: boolean | null
  topographicData: boolean | null
  cadastralData: boolean | null // Assuming based on common fundamental types
  administrativeBoundaries: boolean | null
  hydrographicData: boolean | null
  landUseLandCover: boolean | null
  geologicalData: boolean | null
  demographicData: boolean | null
  digitalImagery: boolean | null
  transportationData: boolean | null
  others: boolean | null
  othersSpecify: string | null
}

export const metadataRecordsTable = pgTable("metadata_records", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  dataType: datasetTypeEnum("data_type").notNull(),
  abstract: text("abstract").notNull(),
  purpose: text("purpose"),
  metadataStandard: text("metadata_standard").default("NGDI Standard v1.0"),
  metadataStandardVersion: text("metadata_standard_version").default("1.0"),
  status: metadataStatusEnum("status").default("Draft").notNull(),
  creatorUserId: text("creator_user_id").notNull(),
  organizationId: uuid("organization_id").references(
    () => organizationsTable.id,
    { onDelete: "set null" }
  ),

  // Identification & General Information (from PRD 5.1)
  keywords: text("keywords").array(),
  language: text("language").default("en").notNull(),
  supplementalInformation: text("supplemental_information"),
  version: text("version"),
  author: text("author"),
  frameworkType: frameworkTypeEnum("framework_type"),
  thumbnailUrl: text("thumbnail_url"),
  imageName: text("image_name"),
  validationStatusPrd: text("validation_status_prd"),
  assessment: text("assessment"),

  // Contact Information - flat fields for form compatibility
  contactName: text("contact_name"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  contactAddress: text("contact_address"),

  // Additional flat fields for form compatibility
  lineage: text("lineage"),
  doi: text("doi"),
  licence: text("licence"),
  accessAndUseLimitations: text("access_and_use_limitations"),
  dataSources: text("data_sources"),
  methodology: text("methodology"),
  notes: text("notes"),
  additionalInformation: text("additional_information"),
  spatialRepresentationType: text("spatial_representation_type"),
  spatialReferenceSystem: text("spatial_reference_system"),
  spatialResolution: text("spatial_resolution"),
  geographicDescription: text("geographic_description"),
  boundingBoxNorth: real("bounding_box_north"),
  boundingBoxSouth: real("bounding_box_south"),
  boundingBoxEast: real("bounding_box_east"),
  boundingBoxWest: real("bounding_box_west"),
  geometry: jsonb("geometry"),
  temporalExtentFrom: date("temporal_extent_from"),
  temporalExtentTo: date("temporal_extent_to"),
  dataQualityScope: text("data_quality_scope"),
  dataQualityReport: text("data_quality_report"),

  // Spatial Information (from PRD 5.2)
  locationInfo: jsonb("location_info").$type<LocationInfo>(),
  spatialInfo: jsonb("spatial_info").$type<SpatialInfo>(),

  // Temporal Information (from PRD 5.3)
  productionDate: text("production_date"), // Changed to text for ISO string compatibility
  temporalInfo: jsonb("temporal_info").$type<TemporalInfo>(),
  updateFrequency: text("update_frequency"),
  plannedAvailableDateTime: timestamp("planned_available_date_time"),
  dateInfo: jsonb("date_info"),

  // Contact Information (from PRD 5.4) - Storing as JSONB for flexibility
  pointOfContact: jsonb("point_of_contact"),
  distributorContact: jsonb("distributor_contact"),
  processContact: jsonb("process_contact"),
  metadataContact: jsonb("metadata_contact"),

  // Distribution Information (from PRD 5.5)
  distributionInfo: jsonb("distribution_info").$type<DistributionInfo>(),
  distributorNamePrd: text("distributor_name_prd"),
  resourceDescriptionPrd: text("resource_description_prd"),
  distributionLiability: text("distribution_liability"),
  customOrderProcess: text("custom_order_process"),
  technicalPrerequisites: text("technical_prerequisites"),
  standardOrderProcess: jsonb("standard_order_process"),
  orderingInstructions: text("ordering_instructions"),
  fees: text("fees"),
  turnaroundTime: text("turnaround_time"),
  formTypeDistributionFormat: jsonb("form_type_distribution_format"),
  distributorTransferOptions: jsonb("distributor_transfer_options"),
  accessMethod: text("access_method"),
  downloadUrl: text("download_url"),
  apiEndpoint: text("api_endpoint"),
  licenseType: text("license_type"),
  usageTerms: text("usage_terms"),
  attributionRequirements: text("attribution_requirements"),
  accessRestrictions: jsonb("access_restrictions"),
  fileFormat: text("file_format"),
  fileSize: text("file_size"),
  numberOfFeatures: text("number_of_features"),

  // Data Quality Information (from PRD 5.6)
  dataQualityInfo: jsonb("data_quality_info").$type<DataQualityInfo>(),
  cloudCover: text("cloud_cover"),
  attributeAccuracyReport: text("attribute_accuracy_report"),
  positionalAccuracy: jsonb("positional_accuracy"),
  typeOfSourceMedia: text("type_of_source_media"),

  // Source and Lineage Information (from PRD 5.7)
  sourceCitation: text("source_citation"),
  sourceCitationAbbreviation: text("source_citation_abbreviation"),
  sourceContribution: text("source_contribution"),
  contractGrantReference: text("contract_grant_reference"),
  resourceLineageStatement: text("resource_lineage_statement"),
  hierarchyLevel: text("hierarchy_level"),
  processSteps: jsonb("process_steps"),

  // Metadata Administration (from PRD 5.8)
  metadataReviewDate: date("metadata_review_date"),
  metadataLinkage: text("metadata_linkage"),

  // System Specific / Other Internal Fields (from PRD 5.9)
  publicationDate: text("publication_date"), // Changed to text for ISO string compatibility
  lastRevisionDate: text("last_revision_date"), // Added missing field
  internalNotes: text("internal_notes"),
  legacyId: text("legacy_id"),
  fundamentalDatasetsInfo: jsonb(
    "fundamental_datasets_info"
  ).$type<FundamentalDatasetsInfo>(),

  // JSONB Fields from data-models.md
  technicalDetailsInfo: jsonb(
    "technical_details_info"
  ).$type<TechnicalDetailsInfo>(),
  constraintsInfo: jsonb("constraints_info").$type<ConstraintsInfo>(),
  processingInfo: jsonb("processing_info").$type<ProcessingInfo>(),
  metadataReferenceInfo: jsonb(
    "metadata_reference_info"
  ).$type<MetadataReferenceInfo>(),
  additionalInfo: jsonb("additional_info"), // For any other relevant information

  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
})

export const metadataChangeLogsTable = pgTable("metadata_change_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  metadataRecordId: uuid("metadata_record_id")
    .references(() => metadataRecordsTable.id, { onDelete: "cascade" })
    .notNull(),
  userId: text("user_id")
    // .references(() => usersTable.id, { onDelete: "set null" })
    .notNull(),
  actionType: metadataLogActionTypeEnum("action_type").notNull(),
  changedFields: jsonb("changed_fields"),
  oldStatus: text("old_status"),
  newStatus: text("new_status"),
  comments: text("comments"),
  details: jsonb("details"),
  createdAt: timestamp("created_at").defaultNow().notNull()
})

export type InsertMetadataRecord = typeof metadataRecordsTable.$inferInsert
export type SelectMetadataRecord = typeof metadataRecordsTable.$inferSelect

export type InsertMetadataChangeLog =
  typeof metadataChangeLogsTable.$inferInsert
export type SelectMetadataChangeLog =
  typeof metadataChangeLogsTable.$inferSelect
