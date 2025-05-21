"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useRouter } from "next/navigation"
import { useState, useTransition, useEffect, useMemo } from "react"
import { toast } from "sonner"

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
import {
  GeneralInformationSection,
  LocationInformationSection,
  SpatialInformationSection,
  TemporalSection,
  DataQualitySection,
  ContactAndOtherInformationSection,
  ProcessingInformationSection,
  ReviewForm
} from "./metadata-form-sections"
import { Loader2 } from "lucide-react"
import { Form } from "@/components/ui/form"

interface MultiStepMetadataFormClientProps {
  currentUserId?: string | null
  existingRecordId?: string | null
  initialData?: Partial<SelectMetadataRecord> | null
}

const FORM_STEPS: FormStep[] = [
  {
    id: "general",
    title: "General Information",
    component: GeneralInformationSection
  },
  {
    id: "location",
    title: "Location Information",
    component: LocationInformationSection
  },
  {
    id: "spatial",
    title: "Spatial Information",
    component: SpatialInformationSection
  },
  { id: "temporal", title: "Temporal Information", component: TemporalSection },
  { id: "quality", title: "Data Quality", component: DataQualitySection },
  {
    id: "processing",
    title: "Processing Information",
    component: ProcessingInformationSection
  },
  {
    id: "contact",
    title: "Contact & Other Information",
    component: ContactAndOtherInformationSection
  },
  { id: "review", title: "Review & Submit", component: ReviewForm }
]

// Helper to prepare payload for server actions
function preparePayload(
  data: MetadataFormValues,
  currentUserId?: string | null,
  existingRecordId?: string | null
): Omit<
  InsertMetadataRecord,
  "id" | "creatorUserId" | "createdAt" | "updatedAt" | "status"
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
    cloudCoverPercentage: data.cloudCoverPercentage ?? null,
    frameworkType: data.frameworkType ?? null,
    locationInfo: data.locationInfo ? { ...data.locationInfo } : null,
    spatialInfo: data.spatialInfo ? { ...data.spatialInfo } : null,
    temporalInfo: data.temporalInfo ? { ...data.temporalInfo } : null,
    technicalDetailsInfo: data.technicalDetailsInfo
      ? { ...data.technicalDetailsInfo }
      : null,
    constraintsInfo: data.constraintsInfo ? { ...data.constraintsInfo } : null,
    dataQualityInfo: data.dataQualityInfo ? { ...data.dataQualityInfo } : null,
    processingInfo: data.processingInfo ? { ...data.processingInfo } : null,
    distributionInfo: data.distributionInfo
      ? { ...data.distributionInfo }
      : null,
    metadataReferenceInfo: data.metadataReferenceInfo
      ? { ...data.metadataReferenceInfo }
      : null,
    fundamentalDatasetsInfo: data.fundamentalDatasetsInfo
      ? { ...data.fundamentalDatasetsInfo }
      : null,
    additionalInfo: data.additionalInfo ? { ...data.additionalInfo } : null,
    contactName:
      (data.metadataReferenceInfo as any)?.metadataPoc
        ?.contactName_metadataPOC ??
      data.contactName ??
      null,
    contactEmail:
      (data.metadataReferenceInfo as any)?.metadataPoc?.email_metadataPOC ??
      data.contactEmail ??
      null,
    contactPhone:
      (data.metadataReferenceInfo as any)?.metadataPoc
        ?.phoneNumber_metadataPOC ??
      data.contactPhone ??
      null,
    contactAddress:
      (data.metadataReferenceInfo as any)?.metadataPoc?.address_metadataPOC ??
      data.contactAddress ??
      null,
    lineage: (data.dataQualityInfo as any)?.dataQualityLineage ?? null,
    doi: (data.distributionInfo as any)?.doi ?? null,
    licence: (data.distributionInfo as any)?.licenseInfo?.licenseType ?? null,
    accessAndUseLimitations:
      (data.constraintsInfo as any)?.accessConstraints ?? null,
    dataSources:
      (data.processingInfo as any)?.sourceInfo?.sourceCitation ?? null,
    methodology:
      (data.processingInfo as any)?.processingStepsDescription ?? null,
    notes: (data.additionalInfo as any)?.notes ?? null,
    additionalInformation: (data.additionalInfo as any)?.details ?? null,
    spatialRepresentationType:
      data.spatialInfo?.spatialRepresentationType ??
      data.spatialRepresentationType ??
      null,
    spatialReferenceSystem:
      data.spatialInfo?.coordinateSystem ?? data.spatialReferenceSystem ?? null,
    spatialResolution:
      data.spatialInfo?.resolution ?? data.spatialResolution ?? null,
    geographicDescription:
      (data.locationInfo as any)?.geographicDescription ??
      data.geographicDescription ??
      null,
    boundingBoxNorth:
      data.spatialInfo?.maxLatitude ?? data.boundingBoxNorth ?? null,
    boundingBoxSouth:
      data.spatialInfo?.minLatitude ?? data.boundingBoxSouth ?? null,
    boundingBoxEast:
      data.spatialInfo?.maxLongitude ?? data.boundingBoxEast ?? null,
    boundingBoxWest:
      data.spatialInfo?.minLongitude ?? data.boundingBoxWest ?? null,
    geometry: data.geometry ? JSON.stringify(data.geometry) : null,
    temporalExtentFrom: data.temporalInfo?.dateFrom
      ? formatDateString(data.temporalInfo.dateFrom)
      : formatDateString(data.temporalExtentFrom),
    temporalExtentTo: data.temporalInfo?.dateTo
      ? formatDateString(data.temporalInfo.dateTo)
      : formatDateString(data.temporalExtentTo),
    dataQualityScope:
      (data.dataQualityInfo as any)?.scope ?? data.dataQualityScope ?? null,
    dataQualityLineage:
      (data.dataQualityInfo as any)?.dataQualityLineage ??
      data.dataQualityLineage ??
      null,
    dataQualityReport:
      (data.dataQualityInfo as any)?.logicalConsistencyReport ??
      data.dataQualityReport ??
      null
  }

  return payload
}

export default function MultiStepMetadataFormClient({
  currentUserId,
  existingRecordId,
  initialData
}: MultiStepMetadataFormClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isLoading, setIsLoading] = useState(true)
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [availableOrganizations, setAvailableOrganizations] = useState<
    SelectOrganization[]
  >([])
  const [currentStep, setCurrentStep] = useState(0)

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
      : null
    formValues.spatialInfo = dataFromDb.spatialInfo
      ? {
          ...(dataFromDb.spatialInfo as DrizzleSpatialInfo),
          scale:
            dataFromDb.spatialInfo.scale !== null
              ? Number(dataFromDb.spatialInfo.scale)
              : null,
          minLatitude:
            dataFromDb.spatialInfo.minLatitude !== null
              ? Number(dataFromDb.spatialInfo.minLatitude)
              : null,
          minLongitude:
            dataFromDb.spatialInfo.minLongitude !== null
              ? Number(dataFromDb.spatialInfo.minLongitude)
              : null,
          maxLatitude:
            dataFromDb.spatialInfo.maxLatitude !== null
              ? Number(dataFromDb.spatialInfo.maxLatitude)
              : null,
          maxLongitude:
            dataFromDb.spatialInfo.maxLongitude !== null
              ? Number(dataFromDb.spatialInfo.maxLongitude)
              : null
        }
      : null
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
      : null
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
      : null
    formValues.constraintsInfo = dataFromDb.constraintsInfo
      ? { ...(dataFromDb.constraintsInfo as DrizzleConstraintsInfo) }
      : null
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
      : null
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
      : null
    formValues.distributionInfo = dataFromDb.distributionInfo
      ? { ...(dataFromDb.distributionInfo as DrizzleDistributionInfo) }
      : null
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
      : null
    formValues.fundamentalDatasetsInfo = dataFromDb.fundamentalDatasetsInfo
      ? {
          ...(dataFromDb.fundamentalDatasetsInfo as DrizzleFundamentalDatasetsInfo)
        }
      : null
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
      dataFromDb.spatialInfo?.resolution ?? dataFromDb.spatialResolution ?? null
    formValues.geographicDescription =
      (dataFromDb.locationInfo as any)?.geographicDescription ??
      dataFromDb.geographicDescription ??
      null
    formValues.boundingBoxNorth =
      dataFromDb.spatialInfo?.maxLatitude ?? dataFromDb.boundingBoxNorth ?? null
    formValues.boundingBoxSouth =
      dataFromDb.spatialInfo?.minLatitude ?? dataFromDb.boundingBoxSouth ?? null
    formValues.boundingBoxEast =
      dataFromDb.spatialInfo?.maxLongitude ?? dataFromDb.boundingBoxEast ?? null
    formValues.boundingBoxWest =
      dataFromDb.spatialInfo?.minLongitude ?? dataFromDb.boundingBoxWest ?? null
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
      form.reset(defaultMetadataFormValues)
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
      const result = await createMetadataRecordAction({
        ...payload,
        creatorUserId: currentUserId,
        status: isDraft
          ? metadataStatusEnum.enumValues[1]
          : metadataStatusEnum.enumValues[0]
      })
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

  const onSubmit = (data: MetadataFormValues) => {
    startTransition(() => {
      processAndSubmitData(data, false).finally(() => {})
    })
  }

  const onSaveDraft = (data: MetadataFormValues) => {
    setIsSavingDraft(true)
    startTransition(() => {
      processAndSubmitData(data, true).finally(() => {
        setIsSavingDraft(false)
      })
    })
  }

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
        <MultiStepForm
          form={form}
          onSubmit={onSubmit}
          onSaveDraft={onSaveDraft}
          isSubmitting={isPending}
          steps={FORM_STEPS}
          currentStep={currentStep}
          setCurrentStep={setCurrentStep}
          isSavingDraft={isSavingDraft}
          availableOrganizations={availableOrganizations}
          existingRecordId={existingRecordId}
          isLoading={isLoading}
        >
          {FORM_STEPS.map((step, index) => (
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
