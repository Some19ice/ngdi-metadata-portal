"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useFieldArray } from "react-hook-form"
import { useRouter } from "next/navigation"
import { useState, useTransition, useEffect, useMemo, useCallback } from "react"
import { toast } from "sonner"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

import {
  metadataFormSchema,
  MetadataFormValues,
  defaultMetadataFormValues
} from "@/lib/validators/metadata-validator"
import {
  SelectOrganization,
  InsertMetadataRecord,
  SelectMetadataRecord,
  LocationInfo as DrizzleLocationInfo,
  SpatialInfo as DrizzleSpatialInfo,
  TemporalInfo as DrizzleTemporalInfo,
  TechnicalDetailsInfo as DrizzleTechnicalDetailsInfo,
  ConstraintsInfo as DrizzleConstraintsInfo,
  DataQualityInfo as DrizzleDataQualityInfo,
  ProcessingInfo as DrizzleProcessingInfo,
  DistributionInfo as DrizzleDistributionInfo,
  MetadataReferenceInfo as DrizzleMetadataReferenceInfo,
  FundamentalDatasetsInfo as DrizzleFundamentalDatasetsInfo,
  metadataStatusEnum
} from "@/db/schema"
import {
  createMetadataRecordAction,
  updateMetadataRecordAction,
  getOrganizationsAction
} from "@/actions/db/metadata-records-actions"

import MultiStepForm, { FormStep } from "./multi-step-form"
// Dynamic imports for code splitting and better performance
import dynamic from "next/dynamic"

// Dynamically import form sections for better bundle splitting
const GeneralInformationSection = dynamic(
  () =>
    import("./metadata-form-sections").then(mod => ({
      default: mod.GeneralInformationSection
    })),
  {
    loading: () => <div className="animate-pulse h-96 bg-gray-100 rounded" />,
    ssr: false
  }
)

const LocationInformationSection = dynamic(
  () =>
    import("./metadata-form-sections").then(mod => ({
      default: mod.LocationInformationSection
    })),
  {
    loading: () => <div className="animate-pulse h-96 bg-gray-100 rounded" />,
    ssr: false
  }
)

const SpatialInformationSection = dynamic(
  () =>
    import("./metadata-form-sections").then(mod => ({
      default: mod.SpatialInformationSection
    })),
  {
    loading: () => <div className="animate-pulse h-96 bg-gray-100 rounded" />,
    ssr: false
  }
)

const TemporalSection = dynamic(
  () =>
    import("./metadata-form-sections").then(mod => ({
      default: mod.TemporalSection
    })),
  {
    loading: () => <div className="animate-pulse h-96 bg-gray-100 rounded" />,
    ssr: false
  }
)

const DataQualitySection = dynamic(
  () =>
    import("./metadata-form-sections").then(mod => ({
      default: mod.DataQualitySection
    })),
  {
    loading: () => <div className="animate-pulse h-96 bg-gray-100 rounded" />,
    ssr: false
  }
)

const ContactAndOtherInformationSection = dynamic(
  () =>
    import("./metadata-form-sections").then(mod => ({
      default: mod.ContactAndOtherInformationSection
    })),
  {
    loading: () => <div className="animate-pulse h-96 bg-gray-100 rounded" />,
    ssr: false
  }
)

const ProcessingInformationSection = dynamic(
  () =>
    import("./metadata-form-sections").then(mod => ({
      default: mod.ProcessingInformationSection
    })),
  {
    loading: () => <div className="animate-pulse h-96 bg-gray-100 rounded" />,
    ssr: false
  }
)

const ReviewForm = dynamic(
  () =>
    import("./metadata-form-sections").then(mod => ({
      default: mod.MetadataPreviewSection
    })),
  {
    loading: () => <div className="animate-pulse h-96 bg-gray-100 rounded" />,
    ssr: false
  }
)
const GISServiceFormSection = dynamic(
  () =>
    import("./gis-service-form-section").then(mod => ({
      default: mod.GISServiceFormSection
    })),
  {
    loading: () => <div className="animate-pulse h-96 bg-gray-100 rounded" />,
    ssr: false
  }
)
import { Loader2, Wand2, Lightbulb, Plus } from "lucide-react"
import { Form } from "@/components/ui/form"
import { AutoSaveStatus } from "@/components/ui/auto-save-status"
import { useAutoSave } from "@/lib/hooks/use-auto-save"

interface MultiStepMetadataFormClientProps {
  currentUserId?: string | null
  existingRecordId?: string | null
  initialData?: Partial<SelectMetadataRecord> | null
  defaultOrganizationId?: string | null
  userRole?: "Node Officer" | "Metadata Creator" | "Metadata Approver" | null
}

// Smart suggestions based on field content
const getSmartSuggestions = (
  fieldName: string,
  value: string,
  dataType?: string
) => {
  const suggestions: string[] = []

  if (fieldName === "keywords" && value.length > 2) {
    const commonKeywords = [
      "geospatial",
      "GIS",
      "mapping",
      "spatial analysis",
      "remote sensing",
      "urban planning",
      "environmental",
      "transportation",
      "infrastructure",
      "demographics",
      "land use",
      "topography",
      "climate",
      "hydrology"
    ]

    suggestions.push(
      ...commonKeywords.filter(
        k =>
          k.toLowerCase().includes(value.toLowerCase()) &&
          !suggestions.includes(k)
      )
    )
  }

  if (fieldName === "coordinateSystem") {
    const systems = ["WGS84", "UTM Zone 31N", "NAD83", "EPSG:4326", "EPSG:3857"]
    suggestions.push(
      ...systems.filter(s => s.toLowerCase().includes(value.toLowerCase()))
    )
  }

  if (fieldName === "fileFormat" && dataType) {
    const formatsByType: Record<string, string[]> = {
      Vector: ["Shapefile", "GeoJSON", "KML", "GeoPackage", "PostGIS"],
      Raster: ["GeoTIFF", "NetCDF", "JPEG2000", "PNG", "HDF5"],
      Table: ["CSV", "Excel", "JSON", "Parquet", "SQLite"],
      "Point Cloud": ["LAS", "LAZ", "PLY", "XYZ", "E57"]
    }

    suggestions.push(...(formatsByType[dataType] || []))
  }

  return suggestions.slice(0, 5)
}

// Validation quality scoring
const calculateFormQuality = (data: Partial<MetadataFormValues>) => {
  let score = 0
  let maxScore = 0

  // Title quality (max 15 points)
  maxScore += 15
  if (data.title) {
    if (data.title.length >= 10) score += 10
    if (data.title.split(" ").length >= 3) score += 5
  }

  // Abstract quality (max 20 points)
  maxScore += 20
  if (data.abstract) {
    if (data.abstract.length >= 100) score += 10
    if (data.abstract.length >= 200) score += 5
    if (data.abstract.split(" ").length >= 20) score += 5
  }

  // Keywords quality (max 15 points)
  maxScore += 15
  if (data.keywords && data.keywords.length >= 3) score += 10
  if (data.keywords && data.keywords.length >= 5) score += 5

  // Spatial info (max 20 points)
  maxScore += 20
  if (data.spatialReferenceSystem) score += 10
  if (
    data.boundingBoxNorth !== null &&
    data.boundingBoxSouth !== null &&
    data.boundingBoxEast !== null &&
    data.boundingBoxWest !== null
  ) {
    if (
      data.boundingBoxNorth !== 0 ||
      data.boundingBoxSouth !== 0 ||
      data.boundingBoxEast !== 0 ||
      data.boundingBoxWest !== 0
    ) {
      score += 10
    }
  }

  // Technical info (max 15 points)
  maxScore += 15
  if (data.technicalDetailsInfo?.fileFormat) score += 10
  if (data.technicalDetailsInfo?.fileSizeMB) score += 5

  // Quality info (max 15 points)
  maxScore += 15
  if (
    data.dataQualityInfo?.logicalConsistencyReport &&
    data.dataQualityInfo.logicalConsistencyReport.length >= 20
  )
    score += 15

  return Math.round((score / maxScore) * 100)
}

// Helper to prepare payload for server actions
function preparePayload(
  data: MetadataFormValues,
  currentUserId?: string | null,
  existingRecordId?: string | null
): Omit<
  InsertMetadataRecord,
  "id" | "createdAt" | "updatedAt" | "status" | "creatorUserId"
> {
  const formatDateString = (
    date: Date | string | null | undefined
  ): string | null => {
    if (!date) return null
    if (typeof date === "string") return date
    return date.toISOString()
  }

  const payload = {
    title: data.title,
    dataType: data.dataType,
    abstract: data.abstract,
    purpose: data.purpose ?? null,
    organizationId: data.organizationId ?? null,
    version: data.version ?? null,
    language: data.language ?? "en",
    assessment: data.assessment ?? null,
    updateFrequency: data.updateFrequency ?? null,
    productionDate: formatDateString(data.productionDate),
    publicationDate: formatDateString(data.publicationDate),
    lastRevisionDate: formatDateString(data.lastRevisionDate),
    keywords: data.keywords && data.keywords.length > 0 ? data.keywords : null,
    thumbnailUrl: data.thumbnailUrl ?? null,
    frameworkType: data.frameworkType ?? null,

    // Flat contact fields
    contactName: data.contactName ?? null,
    contactEmail: data.contactEmail ?? null,
    contactPhone: data.contactPhone ?? null,
    contactAddress: data.contactAddress ?? null,

    // Additional flat fields
    lineage: data.lineage ?? null,
    doi: data.doi ?? null,
    licence: data.licence ?? null,
    accessAndUseLimitations: data.accessAndUseLimitations ?? null,
    dataSources: data.dataSources ?? null,
    methodology: data.methodology ?? null,
    notes: data.notes ?? null,
    additionalInformation: data.additionalInformation ?? null,
    spatialRepresentationType: data.spatialRepresentationType ?? null,
    spatialReferenceSystem: data.spatialReferenceSystem ?? null,
    spatialResolution: data.spatialResolution ?? null,
    geographicDescription: data.geographicDescription ?? null,
    boundingBoxNorth: data.boundingBoxNorth ?? null,
    boundingBoxSouth: data.boundingBoxSouth ?? null,
    boundingBoxEast: data.boundingBoxEast ?? null,
    boundingBoxWest: data.boundingBoxWest ?? null,
    geometry: data.geometry ? JSON.parse(data.geometry) : null,
    temporalExtentFrom: data.temporalExtentFrom
      ? data.temporalExtentFrom.toISOString().split("T")[0]
      : null,
    temporalExtentTo: data.temporalExtentTo
      ? data.temporalExtentTo.toISOString().split("T")[0]
      : null,
    dataQualityScope: data.dataQualityScope ?? null,
    dataQualityReport: data.dataQualityReport ?? null,

    // JSONB fields - use undefined when empty to avoid assignment issues
    locationInfo:
      data.locationInfo &&
      Object.values(data.locationInfo).some(v => v !== null)
        ? { ...data.locationInfo }
        : undefined,
    spatialInfo:
      data.spatialInfo && Object.values(data.spatialInfo).some(v => v !== null)
        ? {
            coordinateSystem: data.spatialInfo.coordinateSystem ?? null,
            projection: data.spatialInfo.projection ?? null,
            datum: data.spatialInfo.datum ?? null,
            resolutionScale: data.spatialInfo.resolutionScale ?? null,
            geometricObjectType: data.spatialInfo.geometricObjectType ?? null,
            numFeaturesOrLayers: data.spatialInfo.numFeaturesOrLayers ?? null,
            format: data.spatialInfo.format ?? null,
            distributionFormat: data.spatialInfo.distributionFormat ?? null,
            spatialRepresentationType: data.spatialInfo
              .spatialRepresentationType as
              | "Vector"
              | "Raster"
              | "Text Table"
              | "TIN"
              | "Stereo Model"
              | "Video"
              | null,
            vectorSpatialRepresentation:
              data.spatialInfo.vectorSpatialRepresentation ?? null,
            rasterSpatialRepresentation:
              data.spatialInfo.rasterSpatialRepresentation ?? null,
            boundingBox: data.spatialInfo.boundingBox ?? null,
            verticalExtent: data.spatialInfo.verticalExtent ?? null,

            // Additional fields used in the client component (for backward compatibility)
            scale: (data.spatialInfo as any).scale ?? null,
            resolution: (data.spatialInfo as any).resolution ?? null,
            minLatitude:
              data.spatialInfo.boundingBox?.southBoundingCoordinate ??
              (data.spatialInfo as any).minLatitude ??
              null,
            maxLatitude:
              data.spatialInfo.boundingBox?.northBoundingCoordinate ??
              (data.spatialInfo as any).maxLatitude ??
              null,
            minLongitude:
              data.spatialInfo.boundingBox?.westBoundingCoordinate ??
              (data.spatialInfo as any).minLongitude ??
              null,
            maxLongitude:
              data.spatialInfo.boundingBox?.eastBoundingCoordinate ??
              (data.spatialInfo as any).maxLongitude ??
              null
          }
        : undefined,
    temporalInfo:
      data.temporalInfo &&
      (data.temporalInfo.dateFrom || data.temporalInfo.dateTo)
        ? {
            dateFrom: formatDateString(data.temporalInfo.dateFrom),
            dateTo: formatDateString(data.temporalInfo.dateTo)
          }
        : undefined,
    technicalDetailsInfo:
      data.technicalDetailsInfo &&
      Object.values(data.technicalDetailsInfo).some(v => v !== null)
        ? { ...data.technicalDetailsInfo }
        : undefined,
    constraintsInfo:
      data.constraintsInfo &&
      Object.values(data.constraintsInfo).some(v => v !== null)
        ? { ...data.constraintsInfo }
        : undefined,
    dataQualityInfo:
      data.dataQualityInfo &&
      Object.values(data.dataQualityInfo).some(v => v !== null)
        ? { ...data.dataQualityInfo }
        : undefined,
    processingInfo:
      data.processingInfo &&
      Object.values(data.processingInfo).some(v => v !== null)
        ? {
            ...data.processingInfo,
            processedDate: formatDateString(data.processingInfo.processedDate),
            sourceInfo: data.processingInfo.sourceInfo
              ? {
                  ...data.processingInfo.sourceInfo,
                  contractDate: formatDateString(
                    data.processingInfo.sourceInfo.contractDate
                  )
                }
              : null
          }
        : undefined,
    distributionInfo:
      data.distributionInfo &&
      Object.values(data.distributionInfo).some(v => v !== null)
        ? { ...data.distributionInfo }
        : undefined,
    metadataReferenceInfo:
      data.metadataReferenceInfo &&
      Object.values(data.metadataReferenceInfo).some(v => v !== null)
        ? {
            ...data.metadataReferenceInfo,
            metadataCreationDate: formatDateString(
              data.metadataReferenceInfo.metadataCreationDate
            ),
            metadataReviewDate: formatDateString(
              data.metadataReferenceInfo.metadataReviewDate
            )
          }
        : undefined,
    fundamentalDatasetsInfo:
      data.fundamentalDatasetsInfo &&
      Object.values(data.fundamentalDatasetsInfo).some(v => v !== null)
        ? { ...data.fundamentalDatasetsInfo }
        : undefined,
    additionalInfo:
      data.additionalInfo && Object.keys(data.additionalInfo).length > 0
        ? { ...data.additionalInfo }
        : undefined,

    // Required fields for database
    metadataStandard: "NGDI Standard v1.0",
    metadataStandardVersion: "1.0"
  }

  return payload
}

export default function MultiStepMetadataFormClient({
  currentUserId,
  existingRecordId,
  initialData,
  defaultOrganizationId,
  userRole
}: MultiStepMetadataFormClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [suggestions, setSuggestions] = useState<Record<string, string[]>>({})
  const [qualityScore, setQualityScore] = useState(0)
  const [availableOrganizations, setAvailableOrganizations] = useState<
    SelectOrganization[]
  >([])
  const [isLoading, setIsLoading] = useState(true)

  const transformedInitialData = useMemo(() => {
    if (!initialData) return defaultMetadataFormValues
    const dataFromDb = { ...initialData }
    const formValues: Partial<MetadataFormValues> = {
      ...defaultMetadataFormValues
    }

    Object.keys(defaultMetadataFormValues).forEach(key => {
      const formKey = key as keyof MetadataFormValues
      if (formKey in dataFromDb) {
        const dbValue = (dataFromDb as any)[formKey]
        if (
          formKey === "productionDate" ||
          formKey === "publicationDate" ||
          formKey === "lastRevisionDate"
        ) {
          ;(formValues as any)[formKey] = dbValue ? new Date(dbValue) : null
        } else if (formKey === "geometry" && typeof dbValue === "string") {
          try {
            ;(formValues as any)[formKey] = JSON.parse(dbValue)
          } catch (e) {
            console.error(`Error parsing geometry JSON for ${formKey}:`, e)
            ;(formValues as any)[formKey] = null
          }
        } else {
          ;(formValues as any)[formKey] = dbValue ?? null
        }
      }
    })

    formValues.locationInfo = dataFromDb.locationInfo
      ? { ...(dataFromDb.locationInfo as DrizzleLocationInfo) }
      : undefined
    formValues.spatialInfo = dataFromDb.spatialInfo
      ? {
          // Core spatial info fields from database
          coordinateSystem: dataFromDb.spatialInfo.coordinateSystem ?? null,
          projection: dataFromDb.spatialInfo.projection ?? null,
          datum: dataFromDb.spatialInfo.datum ?? null,
          resolutionScale: dataFromDb.spatialInfo.resolutionScale ?? null,
          geometricObjectType:
            dataFromDb.spatialInfo.geometricObjectType ?? null,
          numFeaturesOrLayers:
            dataFromDb.spatialInfo.numFeaturesOrLayers ?? null,
          format: dataFromDb.spatialInfo.format ?? null,
          distributionFormat: dataFromDb.spatialInfo.distributionFormat ?? null,
          spatialRepresentationType: dataFromDb.spatialInfo
            .spatialRepresentationType as
            | "Vector"
            | "Raster"
            | "Text Table"
            | "TIN"
            | "Stereo Model"
            | "Video"
            | null,
          vectorSpatialRepresentation:
            dataFromDb.spatialInfo.vectorSpatialRepresentation ?? null,
          rasterSpatialRepresentation:
            dataFromDb.spatialInfo.rasterSpatialRepresentation ?? null,
          boundingBox: dataFromDb.spatialInfo.boundingBox ?? null,
          verticalExtent: dataFromDb.spatialInfo.verticalExtent ?? null,

          // Additional fields used in the client component (for backward compatibility)
          scale: (dataFromDb.spatialInfo as any).scale ?? null,
          resolution: (dataFromDb.spatialInfo as any).resolution ?? null,
          minLatitude:
            dataFromDb.spatialInfo.boundingBox?.southBoundingCoordinate ??
            (dataFromDb.spatialInfo as any).minLatitude ??
            null,
          maxLatitude:
            dataFromDb.spatialInfo.boundingBox?.northBoundingCoordinate ??
            (dataFromDb.spatialInfo as any).maxLatitude ??
            null,
          minLongitude:
            dataFromDb.spatialInfo.boundingBox?.westBoundingCoordinate ??
            (dataFromDb.spatialInfo as any).minLongitude ??
            null,
          maxLongitude:
            dataFromDb.spatialInfo.boundingBox?.eastBoundingCoordinate ??
            (dataFromDb.spatialInfo as any).maxLongitude ??
            null
        }
      : undefined
    formValues.temporalInfo = dataFromDb.temporalInfo
      ? {
          ...(dataFromDb.temporalInfo as DrizzleTemporalInfo),
          dateFrom: dataFromDb.temporalInfo.dateFrom
            ? new Date(dataFromDb.temporalInfo.dateFrom)
            : null,
          dateTo: dataFromDb.temporalInfo.dateTo
            ? new Date(dataFromDb.temporalInfo.dateTo)
            : null
        }
      : undefined
    formValues.technicalDetailsInfo = dataFromDb.technicalDetailsInfo
      ? {
          ...(dataFromDb.technicalDetailsInfo as DrizzleTechnicalDetailsInfo),
          fileSizeMB:
            dataFromDb.technicalDetailsInfo.fileSizeMB !== null
              ? Number(dataFromDb.technicalDetailsInfo.fileSizeMB)
              : null,
          numFeaturesOrLayers:
            dataFromDb.technicalDetailsInfo.numFeaturesOrLayers !== null
              ? Number(dataFromDb.technicalDetailsInfo.numFeaturesOrLayers)
              : null
        }
      : undefined
    formValues.constraintsInfo = dataFromDb.constraintsInfo
      ? { ...(dataFromDb.constraintsInfo as DrizzleConstraintsInfo) }
      : undefined
    formValues.dataQualityInfo = dataFromDb.dataQualityInfo
      ? {
          ...(dataFromDb.dataQualityInfo as DrizzleDataQualityInfo),
          horizontalAccuracy: dataFromDb.dataQualityInfo.horizontalAccuracy
            ? {
                ...(dataFromDb.dataQualityInfo.horizontalAccuracy as any),
                accuracyPercentage:
                  dataFromDb.dataQualityInfo.horizontalAccuracy
                    .accuracyPercentage !== null
                    ? Number(
                        dataFromDb.dataQualityInfo.horizontalAccuracy
                          .accuracyPercentage
                      )
                    : null
              }
            : null,
          verticalAccuracy: dataFromDb.dataQualityInfo.verticalAccuracy
            ? {
                ...(dataFromDb.dataQualityInfo.verticalAccuracy as any),
                accuracyPercentage:
                  dataFromDb.dataQualityInfo.verticalAccuracy
                    .accuracyPercentage !== null
                    ? Number(
                        dataFromDb.dataQualityInfo.verticalAccuracy
                          .accuracyPercentage
                      )
                    : null
              }
            : null
        }
      : undefined
    formValues.processingInfo = dataFromDb.processingInfo
      ? {
          ...(dataFromDb.processingInfo as DrizzleProcessingInfo),
          processedDate: dataFromDb.processingInfo.processedDate
            ? new Date(dataFromDb.processingInfo.processedDate)
            : null,
          sourceInfo: dataFromDb.processingInfo.sourceInfo
            ? {
                ...(dataFromDb.processingInfo.sourceInfo as any),
                contractDate: dataFromDb.processingInfo.sourceInfo.contractDate
                  ? new Date(dataFromDb.processingInfo.sourceInfo.contractDate)
                  : null,
                sourceScaleDenominator:
                  dataFromDb.processingInfo.sourceInfo
                    .sourceScaleDenominator !== null
                    ? Number(
                        dataFromDb.processingInfo.sourceInfo
                          .sourceScaleDenominator
                      )
                    : null
              }
            : null
        }
      : undefined
    formValues.distributionInfo = dataFromDb.distributionInfo
      ? { ...(dataFromDb.distributionInfo as DrizzleDistributionInfo) }
      : undefined
    formValues.metadataReferenceInfo = dataFromDb.metadataReferenceInfo
      ? {
          ...(dataFromDb.metadataReferenceInfo as DrizzleMetadataReferenceInfo),
          metadataCreationDate: dataFromDb.metadataReferenceInfo
            .metadataCreationDate
            ? new Date(dataFromDb.metadataReferenceInfo.metadataCreationDate)
            : null,
          metadataReviewDate: dataFromDb.metadataReferenceInfo
            .metadataReviewDate
            ? new Date(dataFromDb.metadataReferenceInfo.metadataReviewDate)
            : null
        }
      : undefined
    formValues.fundamentalDatasetsInfo = dataFromDb.fundamentalDatasetsInfo
      ? {
          ...(dataFromDb.fundamentalDatasetsInfo as DrizzleFundamentalDatasetsInfo)
        }
      : undefined
    formValues.additionalInfo = dataFromDb.additionalInfo
      ? { ...(dataFromDb.additionalInfo as any) }
      : null

    formValues.contactName =
      (dataFromDb.metadataReferenceInfo as any)?.metadataPoc
        ?.contactName_metadataPOC ??
      dataFromDb.contactName ??
      null
    formValues.contactEmail =
      (dataFromDb.metadataReferenceInfo as any)?.metadataPoc
        ?.email_metadataPOC ??
      dataFromDb.contactEmail ??
      null
    formValues.contactPhone =
      (dataFromDb.metadataReferenceInfo as any)?.metadataPoc
        ?.phoneNumber_metadataPOC ??
      dataFromDb.contactPhone ??
      null
    formValues.contactAddress =
      (dataFromDb.metadataReferenceInfo as any)?.metadataPoc
        ?.address_metadataPOC ??
      dataFromDb.contactAddress ??
      null

    formValues.lineage =
      (dataFromDb.dataQualityInfo as any)?.dataQualityLineage ??
      dataFromDb.lineage ??
      null
    formValues.doi =
      (dataFromDb.distributionInfo as any)?.doi ?? dataFromDb.doi ?? null
    formValues.licence =
      (dataFromDb.distributionInfo as any)?.licenseInfo?.licenseType ??
      dataFromDb.licence ??
      null
    formValues.accessAndUseLimitations =
      (dataFromDb.constraintsInfo as any)?.accessConstraints ??
      dataFromDb.accessAndUseLimitations ??
      null
    formValues.dataSources =
      (dataFromDb.processingInfo as any)?.sourceInfo?.sourceCitation ??
      dataFromDb.dataSources ??
      null
    formValues.methodology =
      (dataFromDb.processingInfo as any)?.processingStepsDescription ??
      dataFromDb.methodology ??
      null
    formValues.notes =
      (dataFromDb.additionalInfo as any)?.notes ?? dataFromDb.notes ?? null
    formValues.additionalInformation =
      (dataFromDb.additionalInfo as any)?.details ??
      dataFromDb.additionalInformation ??
      null

    formValues.spatialRepresentationType =
      dataFromDb.spatialInfo?.spatialRepresentationType ??
      dataFromDb.spatialRepresentationType ??
      null
    formValues.spatialReferenceSystem =
      dataFromDb.spatialInfo?.coordinateSystem ??
      dataFromDb.spatialReferenceSystem ??
      null
    formValues.spatialResolution =
      dataFromDb.spatialInfo?.resolutionScale ??
      dataFromDb.spatialResolution ??
      null
    formValues.geographicDescription =
      (dataFromDb.locationInfo as any)?.geographicDescription ??
      dataFromDb.geographicDescription ??
      null
    formValues.boundingBoxNorth =
      dataFromDb.spatialInfo?.boundingBox?.northBoundingCoordinate ??
      dataFromDb.boundingBoxNorth ??
      null
    formValues.boundingBoxSouth =
      dataFromDb.spatialInfo?.boundingBox?.southBoundingCoordinate ??
      dataFromDb.boundingBoxSouth ??
      null
    formValues.boundingBoxEast =
      dataFromDb.spatialInfo?.boundingBox?.eastBoundingCoordinate ??
      dataFromDb.boundingBoxEast ??
      null
    formValues.boundingBoxWest =
      dataFromDb.spatialInfo?.boundingBox?.westBoundingCoordinate ??
      dataFromDb.boundingBoxWest ??
      null
    formValues.geometry = dataFromDb.geometry
      ? JSON.stringify(dataFromDb.geometry)
      : null

    formValues.temporalExtentFrom = dataFromDb.temporalInfo?.dateFrom
      ? new Date(dataFromDb.temporalInfo.dateFrom)
      : dataFromDb.temporalExtentFrom
        ? new Date(dataFromDb.temporalExtentFrom)
        : null
    formValues.temporalExtentTo = dataFromDb.temporalInfo?.dateTo
      ? new Date(dataFromDb.temporalInfo.dateTo)
      : dataFromDb.temporalExtentTo
        ? new Date(dataFromDb.temporalExtentTo)
        : null

    formValues.dataQualityScope =
      (dataFromDb.dataQualityInfo as any)?.scope ??
      dataFromDb.dataQualityScope ??
      null
    formValues.dataQualityReport =
      (dataFromDb.dataQualityInfo as any)?.logicalConsistencyReport ??
      dataFromDb.dataQualityReport ??
      null

    return { ...defaultMetadataFormValues, ...formValues }
  }, [initialData])

  const form = useForm<MetadataFormValues>({
    resolver: zodResolver(metadataFormSchema),
    defaultValues: transformedInitialData,
    mode: "onChange"
  })

  const {
    fields: keywordFields,
    append: appendKeyword,
    remove: removeKeyword
  } = useFieldArray({
    control: form.control,
    name: "keywords"
  })

  // Watch only the data type for section updates
  const watchedDataType = form.watch("dataType")

  // Get dirty fields for auto-save optimization
  const getDirtyFormData = useCallback(() => {
    const dirtyFields = form.formState.dirtyFields
    const allValues = form.getValues()

    // Only include dirty fields in auto-save data
    const dirtyData: Partial<MetadataFormValues> = {}

    Object.keys(dirtyFields).forEach(key => {
      const fieldKey = key as keyof MetadataFormValues
      if (dirtyFields[fieldKey]) {
        dirtyData[fieldKey] = allValues[fieldKey]
      }
    })

    return dirtyData
  }, [form])

  // Auto-save functionality with optimized data
  const {
    lastSaved,
    isSaving,
    hasUnsavedChanges,
    restoreData,
    clearSavedData
  } = useAutoSave({
    key: `metadata-form-${existingRecordId || "new"}`,
    data: getDirtyFormData(),
    onRestore: data => {
      // Merge restored data with current form values
      const currentValues = form.getValues()
      const mergedData = { ...currentValues, ...data }
      form.reset(mergedData)
      toast.success("Form data restored from auto-save")
    },
    debounceMs: 5000, // Wait 5 seconds after user stops typing
    autoSaveInterval: 120000, // Auto-save every 2 minutes (reduced frequency)
    enabled:
      !isSavingDraft &&
      !isPending &&
      Object.keys(form.formState.dirtyFields).length > 0 // Only auto-save when there are dirty fields
  })

  // Update quality score in real-time
  useEffect(() => {
    const currentValues = form.getValues()
    const score = calculateFormQuality(currentValues)
    setQualityScore(score)
  }, [form, form.formState.isDirty])

  // Generate smart suggestions
  const handleFieldFocus = (fieldName: string, value: string) => {
    const currentValues = form.getValues()
    const smartSuggestions = getSmartSuggestions(
      fieldName,
      value,
      currentValues.dataType
    )
    setSuggestions(prev => ({
      ...prev,
      [fieldName]: smartSuggestions
    }))
  }

  const applySuggestion = (fieldName: string, suggestion: string) => {
    if (fieldName === "keywords") {
      appendKeyword(suggestion)
    } else {
      form.setValue(fieldName as any, suggestion)
    }
    setSuggestions(prev => ({
      ...prev,
      [fieldName]: []
    }))
  }

  // Suggestion list component
  const SuggestionList = ({ fieldName }: { fieldName: string }) => {
    const fieldSuggestions = suggestions[fieldName] || []

    if (fieldSuggestions.length === 0) return null

    return (
      <div className="mt-2 p-2 border rounded-md bg-muted/50">
        <div className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
          <Lightbulb className="h-3 w-3" />
          Suggestions:
        </div>
        <div className="flex flex-wrap gap-1">
          {fieldSuggestions.map((suggestion, index) => (
            <Badge
              key={index}
              variant="outline"
              className="text-xs cursor-pointer hover:bg-primary hover:text-primary-foreground"
              onClick={() => applySuggestion(fieldName, suggestion)}
            >
              {suggestion}
            </Badge>
          ))}
        </div>
      </div>
    )
  }

  // Quality indicator component
  const QualityIndicator = () => (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Wand2 className="h-4 w-4" />
          Form Progress & Quality
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Completion Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Form Completion</span>
              <span className="font-medium">{completionPercentage}%</span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
            <div className="text-xs text-muted-foreground">
              {completionPercentage === 100
                ? "All required sections completed"
                : `${relevantSections.length - Math.round((completionPercentage / 100) * relevantSections.length)} sections remaining`}
            </div>
          </div>

          {/* Quality Score */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Metadata Quality</span>
              <span className="font-medium">{qualityScore}%</span>
            </div>
            <Progress value={qualityScore} className="h-2" />
            <div className="text-xs text-muted-foreground">
              {qualityScore >= 80
                ? "Excellent metadata quality"
                : qualityScore >= 60
                  ? "Good quality, minor improvements suggested"
                  : qualityScore >= 40
                    ? "Fair quality, several improvements needed"
                    : "Poor quality, significant improvements required"}
            </div>
          </div>

          {/* Section Status */}
          {watchedDataType && (
            <div className="text-xs text-muted-foreground">
              <span className="font-medium">
                Active sections for {watchedDataType}:
              </span>{" "}
              {relevantSections.length} sections
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )

  useEffect(() => {
    async function fetchOrgsAndSetLoading() {
      try {
        const orgsResult = await getOrganizationsAction()
        if (orgsResult.isSuccess && orgsResult.data) {
          setAvailableOrganizations(orgsResult.data)
        }
      } catch (error) {
        console.error("Failed to fetch organizations:", error)
        toast.error("Failed to load organization data.")
      }
      setIsLoading(false)
    }

    if (existingRecordId && initialData) {
      form.reset(transformedInitialData)
      setIsLoading(false)
    } else {
      // Set default organization ID if user belongs to an organization
      const defaultFormValues = { ...defaultMetadataFormValues }
      if (defaultOrganizationId) {
        defaultFormValues.organizationId = defaultOrganizationId
      }
      form.reset(defaultFormValues)
    }
    fetchOrgsAndSetLoading()
  }, [existingRecordId, initialData, form, transformedInitialData])

  const processAndSubmitData = async (
    data: MetadataFormValues,
    isDraft: boolean = false
  ) => {
    if (!currentUserId) {
      toast.error("User not authenticated.")
      return
    }

    const payload = preparePayload(data, currentUserId, existingRecordId)

    if (existingRecordId) {
      const result = await updateMetadataRecordAction({
        id: existingRecordId,
        data: payload,
        userId: currentUserId,
        isDraftSubmission: isDraft
      })
      if (result.isSuccess) {
        toast.success(
          isDraft
            ? "Draft updated successfully!"
            : "Metadata record updated successfully!"
        )
        if (!isDraft) router.push(`/metadata/${existingRecordId}`)
      } else {
        toast.error(`Failed to update metadata: ${result.message}`)
      }
    } else {
      const result = await createMetadataRecordAction(payload)
      if (result.isSuccess && result.data) {
        toast.success(
          isDraft
            ? "Draft saved successfully!"
            : "New metadata record created successfully!"
        )
        if (!isDraft) router.push(`/metadata/${result.data.id}`)
      } else {
        toast.error(`Failed to create metadata: ${result.message}`)
      }
    }
  }

  const onSubmit = async (data: MetadataFormValues): Promise<void> => {
    return new Promise<void>(resolve => {
      startTransition(async () => {
        try {
          await processAndSubmitData(data, false)
        } finally {
          resolve()
        }
      })
    })
  }

  const onSaveDraft = async (data: MetadataFormValues): Promise<void> => {
    return new Promise<void>(resolve => {
      setIsSavingDraft(true)
      startTransition(async () => {
        try {
          await processAndSubmitData(data, true)
        } finally {
          setIsSavingDraft(false)
          resolve()
        }
      })
    })
  }

  // Add logic to determine which sections to show based on data type
  const getRelevantSections = (dataType?: string) => {
    const allSections = [
      {
        id: "general",
        title: "General Information",
        component: GeneralInformationSection,
        required: true,
        description: "Basic metadata and identification"
      },
      {
        id: "location",
        title: "Location Information",
        component: LocationInformationSection,
        required: true,
        description: "Geographic coverage and spatial extent"
      },
      {
        id: "spatial",
        title: "Spatial Information",
        component: SpatialInformationSection,
        required:
          dataType !== "Document" &&
          dataType !== "Collection" &&
          dataType !== "Application", // Show for spatial data types
        description: "Coordinate systems and spatial properties"
      },
      {
        id: "temporal",
        title: "Temporal Information",
        component: TemporalSection,
        required: true, // Show for all data types since temporal info is generally important
        description: "Time coverage and temporal properties"
      },
      {
        id: "quality",
        title: "Data Quality",
        component: DataQualitySection,
        required:
          dataType !== "Service" &&
          dataType !== "Document" &&
          dataType !== "Application", // Hide for services, documents, and applications
        description: "Quality metrics and assessment"
      },
      {
        id: "processing",
        title: "Processing Information",
        component: ProcessingInformationSection,
        required:
          dataType === "Raster" ||
          dataType === "Vector" ||
          dataType === "Table", // Show for processed data types (removed Point Cloud as it's not in enum)
        description: "Processing history and algorithms"
      },
      {
        id: "gis-service",
        title: "GIS Service Details",
        component: GISServiceFormSection,
        required: dataType === "Service",
        description: "Service endpoints and capabilities"
      },
      {
        id: "contact",
        title: "Contact & Additional Info",
        component: ContactAndOtherInformationSection,
        required: true,
        description: "Contact information and additional details"
      },
      {
        id: "review",
        title: "Review & Submit",
        component: ReviewForm,
        required: true,
        description: "Review your metadata before submission"
      }
    ]

    // Filter sections based on data type and requirements
    return allSections.filter(section => {
      if (section.required === true) return true
      if (section.required === false) return dataType ? true : false // Show optional sections only if data type is selected
      return section.required // Boolean logic for conditional requirements
    })
  }

  // Get relevant sections based on current data type
  const relevantSections = useMemo(
    () => getRelevantSections(watchedDataType),
    [watchedDataType]
  )

  // Calculate completion percentage based on relevant sections only
  const calculateCompletionPercentage = () => {
    const formData = form.getValues()
    let completedSections = 0

    relevantSections.forEach(section => {
      let sectionComplete = false

      switch (section.id) {
        case "general":
          sectionComplete = !!(
            formData.title &&
            formData.abstract &&
            formData.dataType
          )
          break
        case "location":
          sectionComplete = !!formData.locationInfo?.country
          break
        case "spatial":
          sectionComplete = !!formData.spatialInfo?.coordinateSystem
          break
        case "temporal":
          sectionComplete = !!formData.temporalInfo?.dateFrom
          break
        case "quality":
          sectionComplete = !!(
            formData.dataQualityInfo?.attributeAccuracyReport ||
            formData.dataQualityInfo?.logicalConsistencyReport
          )
          break
        case "processing":
          sectionComplete =
            !!formData.processingInfo?.processingStepsDescription
          break
        case "gis-service":
          sectionComplete = !!formData.technicalDetailsInfo?.fileFormat
          break
        case "contact":
          sectionComplete = !!(formData.contactName && formData.contactEmail)
          break
        case "review":
          sectionComplete = true // Always complete when reached
          break
      }

      if (sectionComplete) completedSections++
    })

    return Math.round((completedSections / relevantSections.length) * 100)
  }

  const completionPercentage = calculateCompletionPercentage()

  if (isLoading && existingRecordId && !initialData) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <QualityIndicator />
        <AutoSaveStatus
          lastSaved={lastSaved}
          isSaving={isSaving}
          hasUnsavedChanges={hasUnsavedChanges}
        />
        <MultiStepForm
          form={form}
          onSubmit={onSubmit}
          onSaveDraft={onSaveDraft}
          isSubmitting={isPending}
          steps={relevantSections}
          currentStep={currentStep}
          setCurrentStep={setCurrentStep}
          isSavingDraft={isSavingDraft}
          availableOrganizations={availableOrganizations}
          existingRecordId={existingRecordId}
          isLoading={isLoading}
        >
          {relevantSections.map((step, index) => (
            <div
              key={step.id}
              className={currentStep === index ? "" : "hidden"}
            >
              <step.component form={form} />
            </div>
          ))}
        </MultiStepForm>
      </form>
    </Form>
  )
}
