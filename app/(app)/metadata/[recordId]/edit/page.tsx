"use server"

import { Suspense } from "react"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { getOrganizationsAction } from "@/actions/db/organizations-actions"
import { getManagedOrganizationsAction } from "@/actions/db/organizations-actions"
import { getMetadataRecordByIdAction } from "@/actions/db/metadata-records-actions"
import { SelectOrganization } from "@/db/schema"
import { hasPermission } from "@/lib/rbac"
import MultiStepMetadataFormLoader from "../../create/_components/multi-step-metadata-form-loader"
import {
  MetadataFormValues,
  defaultMetadataFormValues
} from "@/lib/validators/metadata-validator"

// @ts-ignore - Workaround for Next.js types
export default async function EditMetadataPage({ params }: any) {
  const { recordId } = params
  const authData = await auth()
  const userId = authData.userId

  if (!userId) {
    redirect("/login")
  }

  // Fetch the metadata record
  const recordAction = await getMetadataRecordByIdAction(recordId)
  if (!recordAction.isSuccess || !recordAction.data) {
    redirect(`/metadata?error=record-not-found`)
  }

  const record = recordAction.data

  // Check permissions
  const canEditGlobal = await hasPermission(userId, "edit", "metadata")
  const isRecordOwner = record.creatorUserId === userId
  const isOrganizationManager = await hasPermission(
    userId,
    "manage",
    `organization:${record.organizationId}`
  )

  // Only allow edit if user created it, is org manager, or has global edit permission
  if (!isRecordOwner && !isOrganizationManager && !canEditGlobal) {
    redirect(`/metadata/${recordId}?error=unauthorized`)
  }

  // Fetch available organizations (needed for the form)
  let availableOrganizations: SelectOrganization[] = []
  const isAdmin = await hasPermission(userId, "manage", "organizations")

  if (isAdmin) {
    const orgsAction = await getOrganizationsAction()
    if (orgsAction.isSuccess && orgsAction.data) {
      availableOrganizations = orgsAction.data
    }
  } else {
    const managedOrgsAction = await getManagedOrganizationsAction()
    if (managedOrgsAction.isSuccess && managedOrgsAction.data) {
      availableOrganizations = managedOrgsAction.data
    }
  }

  // Create form values from the record, ensuring correct type conversions
  const formValues: MetadataFormValues & { id: string } = {
    ...(defaultMetadataFormValues as MetadataFormValues),
    id: record.id,
    title: record.title,
    abstract: record.abstract,
    purpose: record.purpose || "",
    dataType: record.dataType || "Other",
    organizationId: record.organizationId,
    keywords: record.keywords || [],
    updateFrequency: record.updateFrequency || "",
    productionDate: record.productionDate
      ? new Date(record.productionDate)
      : null,
    thumbnailUrl: record.thumbnailUrl || "",
    status: record.status || "Draft",
    language: record.language || "en",
    version: record.version || "",
    assessment: record.assessment || "",

    locationInfo: {
      country: record.locationInfo?.country || "Nigeria",
      geopoliticalZone: record.locationInfo?.geopoliticalZone || null,
      state: record.locationInfo?.state || null,
      lga: record.locationInfo?.lga || null,
      townCity: record.locationInfo?.townCity || null
    },

    spatialInfo: {
      spatialRepresentationType:
        record.spatialInfo?.spatialRepresentationType || null,
      coordinateSystem: record.spatialInfo?.coordinateSystem || null,
      projection: record.spatialInfo?.projection || null,
      datum: record.spatialInfo?.datum || null,
      resolutionScale: record.spatialInfo?.resolutionScale || null,
      geometricObjectType: record.spatialInfo?.geometricObjectType || null,
      numFeaturesOrLayers: record.spatialInfo?.numFeaturesOrLayers || null,
      format: record.spatialInfo?.format || null,
      distributionFormat: record.spatialInfo?.distributionFormat || null,
      vectorSpatialRepresentation:
        record.spatialInfo?.vectorSpatialRepresentation || null,
      rasterSpatialRepresentation:
        record.spatialInfo?.rasterSpatialRepresentation || null,
      scale: null, // We need to ensure this is the correct type (numeric)
      resolution: null, // We need to ensure this is the correct type (numeric)
      minLatitude:
        record.spatialInfo?.boundingBox?.southBoundingCoordinate || null,
      maxLatitude:
        record.spatialInfo?.boundingBox?.northBoundingCoordinate || null,
      minLongitude:
        record.spatialInfo?.boundingBox?.westBoundingCoordinate || null,
      maxLongitude:
        record.spatialInfo?.boundingBox?.eastBoundingCoordinate || null,
      boundingBox: {
        westBoundingCoordinate:
          record.spatialInfo?.boundingBox?.westBoundingCoordinate || null,
        eastBoundingCoordinate:
          record.spatialInfo?.boundingBox?.eastBoundingCoordinate || null,
        northBoundingCoordinate:
          record.spatialInfo?.boundingBox?.northBoundingCoordinate || null,
        southBoundingCoordinate:
          record.spatialInfo?.boundingBox?.southBoundingCoordinate || null
      },
      verticalExtent: record.spatialInfo?.verticalExtent || null
    },

    temporalInfo: {
      dateFrom: record.temporalInfo?.dateFrom
        ? new Date(record.temporalInfo.dateFrom)
        : null,
      dateTo: record.temporalInfo?.dateTo
        ? new Date(record.temporalInfo.dateTo)
        : null
    },

    distributionInfo: {
      distributionFormat: record.distributionInfo?.distributionFormat || null,
      accessMethod: record.distributionInfo?.accessMethod || null,
      downloadUrl: record.distributionInfo?.downloadUrl || null,
      apiEndpoint: record.distributionInfo?.apiEndpoint || null,
      licenseInfo: record.distributionInfo?.licenseInfo || null,
      distributionContact: record.distributionInfo?.distributionContact || null
    },

    technicalDetailsInfo: {
      fileFormat: record.technicalDetailsInfo?.fileFormat || null,
      fileSizeMB: record.technicalDetailsInfo?.fileSizeMB || null,
      numFeaturesOrLayers:
        record.technicalDetailsInfo?.numFeaturesOrLayers || null,
      softwareHardwareRequirements:
        record.technicalDetailsInfo?.softwareHardwareRequirements || null
    },

    constraintsInfo: {
      accessConstraints: record.constraintsInfo?.accessConstraints || null,
      useConstraints: record.constraintsInfo?.useConstraints || null,
      otherConstraints: record.constraintsInfo?.otherConstraints || null
    },

    dataQualityInfo: {
      logicalConsistencyReport:
        record.dataQualityInfo?.logicalConsistencyReport || null,
      completenessReport: record.dataQualityInfo?.completenessReport || null,
      attributeAccuracyReport:
        record.dataQualityInfo?.attributeAccuracyReport || null,
      horizontalAccuracy: record.dataQualityInfo?.horizontalAccuracy || null,
      verticalAccuracy: record.dataQualityInfo?.verticalAccuracy || null
    },

    processingInfo: {
      processingStepsDescription:
        record.processingInfo?.processingStepsDescription || null,
      softwareAndVersionUsed:
        record.processingInfo?.softwareAndVersionUsed || null,
      processedDate: record.processingInfo?.processedDate
        ? new Date(record.processingInfo.processedDate)
        : null,
      processorContact: record.processingInfo?.processorContact || null,
      sourceInfo: record.processingInfo?.sourceInfo
        ? {
            sourceScaleDenominator:
              record.processingInfo.sourceInfo.sourceScaleDenominator,
            sourceMediaType: record.processingInfo.sourceInfo.sourceMediaType,
            sourceCitation: record.processingInfo.sourceInfo.sourceCitation,
            citationTitle: record.processingInfo.sourceInfo.citationTitle,
            contractReference:
              record.processingInfo.sourceInfo.contractReference,
            contractDate: record.processingInfo.sourceInfo.contractDate
              ? new Date(record.processingInfo.sourceInfo.contractDate)
              : null
          }
        : null
    },

    metadataReferenceInfo: {
      metadataCreationDate: record.metadataReferenceInfo?.metadataCreationDate
        ? new Date(record.metadataReferenceInfo.metadataCreationDate)
        : null,
      metadataReviewDate: record.metadataReferenceInfo?.metadataReviewDate
        ? new Date(record.metadataReferenceInfo.metadataReviewDate)
        : null,
      metadataPoc: record.metadataReferenceInfo?.metadataPoc || null
    },

    fundamentalDatasetsInfo: {
      geodeticData: record.fundamentalDatasetsInfo?.geodeticData || null,
      topographicData: record.fundamentalDatasetsInfo?.topographicData || null,
      cadastralData: record.fundamentalDatasetsInfo?.cadastralData || null,
      administrativeBoundaries:
        record.fundamentalDatasetsInfo?.administrativeBoundaries || null,
      hydrographicData:
        record.fundamentalDatasetsInfo?.hydrographicData || null,
      landUseLandCover:
        record.fundamentalDatasetsInfo?.landUseLandCover || null,
      geologicalData: record.fundamentalDatasetsInfo?.geologicalData || null,
      demographicData: record.fundamentalDatasetsInfo?.demographicData || null,
      digitalImagery: record.fundamentalDatasetsInfo?.digitalImagery || null,
      transportationData:
        record.fundamentalDatasetsInfo?.transportationData || null,
      others: record.fundamentalDatasetsInfo?.others || null,
      othersSpecify: record.fundamentalDatasetsInfo?.othersSpecify || null
    },

    additionalInfo: record.additionalInfo || {}
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Edit Metadata Record
        </h1>
        <p className="text-muted-foreground">
          Update the details of this metadata record. You can save your progress
          as a draft at any time.
        </p>
      </div>
      <Suspense fallback={<EditFormSkeleton />}>
        <MultiStepMetadataFormLoader
          existingRecordId={recordId}
          initialData={record}
        />
      </Suspense>
    </div>
  )
}

function EditFormSkeleton() {
  return (
    <div className="space-y-6">
      {/* Step indicator skeleton */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex flex-col items-center w-full relative">
              <div className="w-10 h-10 rounded-full bg-muted animate-pulse"></div>
              <div className="mt-2 h-4 w-16 bg-muted rounded animate-pulse"></div>
              {i < 5 && (
                <div className="absolute top-5 left-1/2 w-full h-0.5 bg-muted"></div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Form content skeleton */}
      <div className="p-6 border rounded-lg shadow-sm bg-card">
        <div className="h-8 w-1/3 bg-muted rounded animate-pulse mb-6"></div>
        <div className="space-y-6">
          {[...Array(4)].map((_, fieldIndex) => (
            <div key={fieldIndex} className="space-y-2">
              <div className="h-4 w-1/4 bg-muted rounded animate-pulse"></div>
              <div className="h-10 w-full bg-muted rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Button area skeleton */}
      <div className="flex justify-between items-center pt-6">
        <div className="h-10 w-24 bg-muted rounded animate-pulse"></div>
        <div className="flex gap-3">
          <div className="h-10 w-28 bg-muted rounded animate-pulse"></div>
          <div className="h-10 w-24 bg-primary/70 rounded animate-pulse"></div>
        </div>
      </div>
    </div>
  )
}
