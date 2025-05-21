import { z } from "zod"
import {
  datasetTypeEnum,
  frameworkTypeEnum,
  metadataStatusEnum,
  metadataTopicCategoryEnum,
  type ConstraintsInfo,
  type DataQualityInfo,
  type DistributionInfo,
  type FundamentalDatasetsInfo,
  type LocationInfo,
  type MetadataPoc,
  type MetadataReferenceInfo,
  type PositionalAccuracyDetail,
  type ProcessingInfo,
  type ProcessorContact,
  type SourceInfo,
  type SpatialInfo,
  type TechnicalDetailsInfo,
  type TemporalInfo,
  type DistributionContact,
  type LicenseInfo,
  type BoundingBoxInfo,
  type VerticalExtentInfo,
  type GeometricObject,
  type VectorSpatialRepresentationInfo,
  type AxisDimension,
  type RasterSpatialRepresentationInfo
} from "@/db/schema" // Import all necessary types from the schema

// Helper for nullable Zod types that correspond to `Type | null` in Drizzle
const zodNullableString = z.string().nullable()
const zodNullableNumber = z.number().nullable()
const zodNullableBoolean = z.boolean().nullable()
const zodNullableDate = z.coerce.date().nullable()

// New helper for array of strings, nullable
const zodNullableStringArray = z.array(z.string()).nullable()

const requiredString = z.string().min(1, "This field is required.")

// Schemas for JSONB fields, aiming to match Drizzle's `Type | null` where applicable
// Fields within these objects are .nullable() if Drizzle type is `field: something | null`
// They are .optional() if the field itself might not be provided in the form for that object

export const LocationInfoSchema = z.object({
  country: zodNullableString,
  geopoliticalZone: zodNullableString,
  state: zodNullableString,
  lga: zodNullableString,
  townCity: zodNullableString
}) satisfies z.ZodType<LocationInfo> // Drizzle type is LocationInfo (not partial, not nullable itself as a field)

// Nested Schemas for SpatialInfo
export const BoundingBoxInfoSchema = z.object({
  westBoundingCoordinate: zodNullableNumber,
  eastBoundingCoordinate: zodNullableNumber,
  northBoundingCoordinate: zodNullableNumber,
  southBoundingCoordinate: zodNullableNumber
}) satisfies z.ZodType<BoundingBoxInfo>

export const VerticalExtentInfoSchema = z.object({
  minimumValue: zodNullableNumber,
  maximumValue: zodNullableNumber,
  unitOfMeasure: zodNullableString
}) satisfies z.ZodType<VerticalExtentInfo>

export const GeometricObjectSchema = z.object({
  type: zodNullableString,
  count: zodNullableNumber
}) satisfies z.ZodType<GeometricObject>

export const VectorSpatialRepresentationInfoSchema = z.object({
  topologyLevel: zodNullableString,
  geometricObjects: z.array(GeometricObjectSchema).nullable()
}) satisfies z.ZodType<VectorSpatialRepresentationInfo>

export const AxisDimensionSchema = z.object({
  name: zodNullableString,
  size: zodNullableNumber,
  resolution: zodNullableString
}) satisfies z.ZodType<AxisDimension>

export const RasterSpatialRepresentationInfoSchema = z.object({
  axisDimensions: z.array(AxisDimensionSchema).nullable(),
  cellGeometry: zodNullableString,
  transformationParameterAvailability: zodNullableBoolean,
  cloudCoverPercentage: zodNullableNumber,
  compressionGenerationQuantity: zodNullableNumber
}) satisfies z.ZodType<RasterSpatialRepresentationInfo>

export const SpatialInfoSchema = z.object({
  coordinateSystem: zodNullableString,
  projection: zodNullableString,
  datum: zodNullableString,
  resolutionScale: zodNullableString,
  geometricObjectType: zodNullableString,
  numFeaturesOrLayers: zodNullableNumber,
  format: zodNullableString,
  distributionFormat: zodNullableString,
  spatialRepresentationType: zodNullableString,
  vectorSpatialRepresentation: VectorSpatialRepresentationInfoSchema.nullable(),
  rasterSpatialRepresentation: RasterSpatialRepresentationInfoSchema.nullable(),
  boundingBox: BoundingBoxInfoSchema.nullable(),
  verticalExtent: VerticalExtentInfoSchema.nullable(),
  // Additional fields used in the client component
  scale: zodNullableNumber,
  resolution: zodNullableString,
  minLatitude: zodNullableNumber,
  maxLatitude: zodNullableNumber,
  minLongitude: zodNullableNumber,
  maxLongitude: zodNullableNumber
}) // Removed satisfies constraint since we added custom fields

// For TemporalInfo, Drizzle stores dates as `string | null` (ISO strings)
// Zod will use `Date | null` for form handling. Conversion happens during action.
export const TemporalInfoSchema = z.object({
  dateFrom: zodNullableDate,
  dateTo: zodNullableDate
}) // No `satisfies` due to Date vs string for Drizzle

export const TechnicalDetailsInfoSchema = z.object({
  fileFormat: zodNullableString,
  fileSizeMB: zodNullableNumber,
  numFeaturesOrLayers: zodNullableNumber,
  softwareHardwareRequirements: zodNullableString
}) satisfies z.ZodType<TechnicalDetailsInfo>

export const ConstraintsInfoSchema = z.object({
  accessConstraints: zodNullableString,
  useConstraints: zodNullableString,
  otherConstraints: zodNullableString
}) satisfies z.ZodType<ConstraintsInfo>

export const PositionalAccuracyDetailSchema = z.object({
  accuracyReport: zodNullableString,
  accuracyPercentage: zodNullableNumber,
  accuracyExplanation: zodNullableString
}) satisfies z.ZodType<PositionalAccuracyDetail>

// DataQualityInfo contains nested PositionalAccuracyDetail which itself is `Type | null` in Drizzle
export const DataQualityInfoSchema = z.object({
  logicalConsistencyReport: zodNullableString,
  completenessReport: zodNullableString,
  attributeAccuracyReport: zodNullableString,
  horizontalAccuracy: PositionalAccuracyDetailSchema.nullable(), // Drizzle: PositionalAccuracyDetail | null
  verticalAccuracy: PositionalAccuracyDetailSchema.nullable() // Drizzle: PositionalAccuracyDetail | null
}) satisfies z.ZodType<DataQualityInfo>

export const ProcessorContactSchema = z.object({
  processorName: zodNullableString,
  processorEmail: z
    .string()
    .email({ message: "Invalid email address" })
    .nullable(), // or(z.literal("")) removed for stricter null
  processorAddress: zodNullableString
}) satisfies z.ZodType<ProcessorContact>

export const SourceInfoSchema = z.object({
  sourceScaleDenominator: zodNullableNumber,
  sourceMediaType: zodNullableString,
  sourceCitation: zodNullableString,
  citationTitle: zodNullableString,
  contractReference: zodNullableString,
  contractDate: zodNullableDate // Drizzle: string | null (ISO)
}) // No `satisfies` due to Date vs string

export const ProcessingInfoSchema = z.object({
  processingStepsDescription: zodNullableString,
  softwareAndVersionUsed: zodNullableString,
  processedDate: zodNullableDate, // Drizzle: string | null (ISO)
  processorContact: ProcessorContactSchema.nullable(), // Drizzle: ProcessorContact | null
  sourceInfo: SourceInfoSchema.nullable() // Drizzle: SourceInfo | null
}) // No `satisfies` due to Date vs string in children

export const DistributionContactSchema = z.object({
  contactPersonOffice: zodNullableString,
  email: z.string().email({ message: "Invalid email address" }).nullable(),
  departmentUnit: zodNullableString,
  phoneNumber: zodNullableString
}) satisfies z.ZodType<DistributionContact>

export const LicenseInfoSchema = z.object({
  licenseType: zodNullableString,
  usageTerms: zodNullableString,
  attributionRequirements: zodNullableString,
  accessRestrictions: z.array(z.string()).nullable() // Drizzle: string[] | null
}) satisfies z.ZodType<LicenseInfo>

export const DistributionInfoSchema = z.object({
  distributionFormat: zodNullableString,
  accessMethod: zodNullableString,
  downloadUrl: z.string().url({ message: "Invalid URL" }).nullable(),
  apiEndpoint: z.string().url({ message: "Invalid URL" }).nullable(),
  licenseInfo: LicenseInfoSchema.nullable(), // Drizzle: LicenseInfo | null
  distributionContact: DistributionContactSchema.nullable() // Drizzle: DistributionContact | null
}) satisfies z.ZodType<DistributionInfo>

export const MetadataPocSchema = z.object({
  contactName_metadataPOC: zodNullableString,
  address_metadataPOC: zodNullableString,
  email_metadataPOC: z
    .string()
    .email({ message: "Invalid email address" })
    .nullable(),
  phoneNumber_metadataPOC: zodNullableString
}) satisfies z.ZodType<MetadataPoc>

export const MetadataReferenceInfoSchema = z.object({
  metadataCreationDate: zodNullableDate, // Drizzle: string | null (ISO)
  metadataReviewDate: zodNullableDate, // Drizzle: string | null (ISO)
  metadataPoc: MetadataPocSchema.nullable() // Drizzle: MetadataPoc | null
}) // No `satisfies` due to Date vs string

export const FundamentalDatasetsInfoSchema = z.object({
  geodeticData: zodNullableBoolean,
  topographicData: zodNullableBoolean,
  cadastralData: zodNullableBoolean,
  administrativeBoundaries: zodNullableBoolean,
  hydrographicData: zodNullableBoolean,
  landUseLandCover: zodNullableBoolean,
  geologicalData: zodNullableBoolean,
  demographicData: zodNullableBoolean,
  digitalImagery: zodNullableBoolean,
  transportationData: zodNullableBoolean,
  others: zodNullableBoolean,
  othersSpecify: zodNullableString
}) satisfies z.ZodType<FundamentalDatasetsInfo>

// Main Metadata Record Form Schema
// Renamed from metadataRecordFormSchema to metadataFormSchema to match imports
export const metadataFormSchema = z.object({
  id: z.string().uuid().optional(), // For updates, not required for new records
  title: requiredString,
  dataType: z.enum(datasetTypeEnum.enumValues),
  topicCategory: z.enum(metadataTopicCategoryEnum.enumValues).optional(), // Made optional to match usage
  abstract: requiredString,
  purpose: zodNullableString.optional(), // Optional field
  creatorUserId: z.string().optional(), // Made optional for client-side form usage
  organizationId: z.string().uuid().nullable().optional(), // Optional, might be derived
  status: z.enum(metadataStatusEnum.enumValues).default("Draft").optional(),
  version: zodNullableString.optional(),
  language: z.string().default("en").optional(),
  assessment: zodNullableString.optional(),
  updateFrequency: zodNullableString.optional(),
  productionDate: zodNullableDate.optional(),
  publicationDate: zodNullableDate.optional(),
  lastRevisionDate: zodNullableDate.optional(),
  keywords: z.array(z.string()).optional().default([]),
  thumbnailUrl: z
    .string()
    .url({ message: "Invalid URL" })
    .nullable()
    .optional(),
  cloudCoverPercentage: zodNullableNumber
    .optional()
    .refine(
      val => val === null || val === undefined || (val >= 0 && val <= 100),
      { message: "Must be between 0 and 100 or empty" }
    ),
  frameworkType: z.enum(frameworkTypeEnum.enumValues).nullable().optional(),

  // Additional fields used in the client component
  contactName: zodNullableString.optional(),
  contactEmail: zodNullableString.optional(),
  contactPhone: zodNullableString.optional(),
  contactAddress: zodNullableString.optional(),
  lineage: zodNullableString.optional(),
  doi: zodNullableString.optional(),
  licence: zodNullableString.optional(),
  accessAndUseLimitations: zodNullableString.optional(),
  dataSources: zodNullableString.optional(),
  methodology: zodNullableString.optional(),
  notes: zodNullableString.optional(),
  additionalInformation: zodNullableString.optional(),
  spatialRepresentationType: zodNullableString.optional(),
  spatialReferenceSystem: zodNullableString.optional(),
  spatialResolution: zodNullableString.optional(),
  geographicDescription: zodNullableString.optional(),
  boundingBoxNorth: zodNullableNumber.optional(),
  boundingBoxSouth: zodNullableNumber.optional(),
  boundingBoxEast: zodNullableNumber.optional(),
  boundingBoxWest: zodNullableNumber.optional(),
  geometry: z.any().optional(), // Could be more strictly typed if needed
  temporalExtentFrom: zodNullableDate.optional(),
  temporalExtentTo: zodNullableDate.optional(),
  dataQualityScope: zodNullableString.optional(),
  dataQualityLineage: zodNullableString.optional(),
  dataQualityReport: zodNullableString.optional(),

  // JSONB Fields are .optional() if the entire object can be missing from the form submission.
  // They default to providing the full structure with nulls if the object itself is mandatory but fields are nullable.
  locationInfo: LocationInfoSchema.optional().default({
    country: null,
    geopoliticalZone: null,
    state: null,
    lga: null,
    townCity: null
  }),
  spatialInfo: SpatialInfoSchema.optional().default({
    coordinateSystem: null,
    projection: null,
    datum: null,
    resolutionScale: null,
    geometricObjectType: null,
    numFeaturesOrLayers: null,
    format: null,
    distributionFormat: null,
    spatialRepresentationType: null,
    vectorSpatialRepresentation: null,
    rasterSpatialRepresentation: null,
    boundingBox: null,
    verticalExtent: null,
    // Additional fields used in the client component
    scale: null,
    resolution: null,
    minLatitude: null,
    maxLatitude: null,
    minLongitude: null,
    maxLongitude: null
  }),
  temporalInfo: TemporalInfoSchema.optional().default({
    dateFrom: null,
    dateTo: null
  }),
  technicalDetailsInfo: TechnicalDetailsInfoSchema.optional().default({
    fileFormat: null,
    fileSizeMB: null,
    numFeaturesOrLayers: null,
    softwareHardwareRequirements: null
  }),
  constraintsInfo: ConstraintsInfoSchema.optional().default({
    accessConstraints: null,
    useConstraints: null,
    otherConstraints: null
  }),
  dataQualityInfo: DataQualityInfoSchema.optional().default({
    logicalConsistencyReport: null,
    completenessReport: null,
    attributeAccuracyReport: null,
    horizontalAccuracy: null,
    verticalAccuracy: null
  }),
  processingInfo: ProcessingInfoSchema.optional().default({
    processingStepsDescription: null,
    softwareAndVersionUsed: null,
    processedDate: null,
    processorContact: null,
    sourceInfo: null
  }),
  distributionInfo: DistributionInfoSchema.optional().default({
    distributionFormat: null,
    accessMethod: null,
    downloadUrl: null,
    apiEndpoint: null,
    licenseInfo: null,
    distributionContact: null
  }),
  metadataReferenceInfo: MetadataReferenceInfoSchema.optional().default({
    metadataCreationDate: null,
    metadataReviewDate: null,
    metadataPoc: null
  }),
  fundamentalDatasetsInfo: FundamentalDatasetsInfoSchema.optional().default({
    geodeticData: null,
    topographicData: null,
    cadastralData: null,
    administrativeBoundaries: null,
    hydrographicData: null,
    landUseLandCover: null,
    geologicalData: null,
    demographicData: null,
    digitalImagery: null,
    transportationData: null,
    others: null,
    othersSpecify: null
  }),
  additionalInfo: z.record(z.string(), z.any()).optional().default({}) // For flexible additional key-value pairs
})

// Export MetadataFormValues instead of MetadataRecordFormData
export type MetadataFormValues = z.infer<typeof metadataFormSchema>

// Default values for the form
// Match the structure produced by .optional().default() in the schema for JSONB fields
export const defaultMetadataFormValues: Partial<MetadataFormValues> = {
  title: "",
  // dataType, topicCategory will be selected by user
  abstract: "",
  purpose: null,
  // creatorUserId and organizationId will be set by system/user context
  status: "Draft",
  version: null,
  language: "en",
  assessment: null,
  updateFrequency: null,
  productionDate: null,
  publicationDate: null,
  lastRevisionDate: null,
  keywords: [],
  thumbnailUrl: null,
  cloudCoverPercentage: null,
  // frameworkType will be selected by user

  locationInfo: {
    country: "Nigeria",
    geopoliticalZone: null,
    state: null,
    lga: null,
    townCity: null
  },
  spatialInfo: {
    coordinateSystem: null,
    projection: null,
    datum: null,
    resolutionScale: null,
    geometricObjectType: null,
    numFeaturesOrLayers: null,
    format: null,
    distributionFormat: null,
    spatialRepresentationType: null,
    scale: null,
    resolution: null,
    minLatitude: null,
    maxLatitude: null,
    minLongitude: null,
    maxLongitude: null,
    vectorSpatialRepresentation: {
      topologyLevel: null,
      geometricObjects: null
    },
    rasterSpatialRepresentation: {
      axisDimensions: null,
      cellGeometry: null,
      transformationParameterAvailability: null,
      cloudCoverPercentage: null,
      compressionGenerationQuantity: null
    },
    boundingBox: {
      westBoundingCoordinate: null,
      eastBoundingCoordinate: null,
      northBoundingCoordinate: null,
      southBoundingCoordinate: null
    },
    verticalExtent: {
      minimumValue: null,
      maximumValue: null,
      unitOfMeasure: null
    }
  },
  temporalInfo: { dateFrom: null, dateTo: null },
  technicalDetailsInfo: {
    fileFormat: null,
    fileSizeMB: null,
    numFeaturesOrLayers: null,
    softwareHardwareRequirements: null
  },
  constraintsInfo: {
    accessConstraints: null,
    useConstraints: null,
    otherConstraints: null
  },
  dataQualityInfo: {
    logicalConsistencyReport: null,
    completenessReport: null,
    attributeAccuracyReport: null,
    horizontalAccuracy: null,
    verticalAccuracy: null
  },
  processingInfo: {
    processingStepsDescription: null,
    softwareAndVersionUsed: null,
    processedDate: null,
    processorContact: null,
    sourceInfo: null
  },
  distributionInfo: {
    distributionFormat: null,
    accessMethod: null,
    downloadUrl: null,
    apiEndpoint: null,
    licenseInfo: null,
    distributionContact: null
  },
  metadataReferenceInfo: {
    metadataCreationDate: null,
    metadataReviewDate: null,
    metadataPoc: null
  },
  fundamentalDatasetsInfo: {
    geodeticData: null,
    topographicData: null,
    cadastralData: null,
    administrativeBoundaries: null,
    hydrographicData: null,
    landUseLandCover: null,
    geologicalData: null,
    demographicData: null,
    digitalImagery: null,
    transportationData: null,
    others: null,
    othersSpecify: null
  },
  additionalInfo: {}
}

// Example of how you might refine a field based on another
// This is illustrative and might be better handled in UI logic or server-side validation
// export const refinedMetadataFormSchema = metadataFormSchema.refine(
//   (data) => {
//     if (data.fundamentalDatasetsInfo?.others && !data.fundamentalDatasetsInfo.othersSpecify) {
//       return false;
//     }
//     return true;
//   },
//   {
//     message: "Specify 'others' if selected in Fundamental Datasets.",
//     path: ["fundamentalDatasetsInfo", "othersSpecify"],
//   }
// );
