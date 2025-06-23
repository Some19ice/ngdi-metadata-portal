"use server"

import { auth } from "@clerk/nextjs/server"
import { db } from "@/db/db"
import {
  InsertMetadataRecord,
  metadataRecordsTable,
  SelectMetadataRecord,
  metadataChangeLogsTable,
  InsertMetadataChangeLog,
  metadataLogActionTypeEnum,
  metadataStatusEnum,
  SelectOrganization,
  organizationsTable
} from "@/db/schema"
import { ActionState } from "@/types"
import {
  hasPermission,
  isNodeOfficerForOrg,
  requiresSystemAdmin,
  checkUserRole
} from "@/lib/rbac"
import {
  eq,
  and,
  desc,
  or,
  ilike,
  sql,
  count,
  gte,
  lte,
  asc
} from "drizzle-orm"
import { createAuditLogAction } from "@/actions/audit-log-actions"
// Import caching utilities
import { metadataCache, CacheKeys, CacheInvalidation } from "@/lib/cache"

// Helper function to log metadata changes
async function logMetadataChange(
  logEntry: Omit<InsertMetadataChangeLog, "id" | "createdAt">
): Promise<void> {
  try {
    await db.insert(metadataChangeLogsTable).values(logEntry)
  } catch (error) {
    console.error("Failed to log metadata change:", error)
    // Depending on desired error handling, you might want to re-throw or handle more gracefully
  }
}

// Define this type before it's used in getMetadataRecordsForUserAction and searchMetadataRecordsAction
export type MetadataRecordWithOrganization = SelectMetadataRecord & {
  organization?: SelectOrganization | null
}

export interface PaginatedMetadataRecords {
  records: MetadataRecordWithOrganization[]
  totalRecords: number
  totalPages: number
  currentPage: number
  pageSize: number
}

export async function createMetadataRecordAction(
  input: Omit<
    InsertMetadataRecord,
    | "id"
    | "creatorUserId"
    | "status"
    | "createdAt"
    | "updatedAt"
    | "internalNotes"
    | "legacyId"
  >
): Promise<ActionState<SelectMetadataRecord>> {
  const { userId: currentUserId } = await auth()
  if (!currentUserId) {
    return { isSuccess: false, message: "User not authenticated." }
  }

  const canCreateGlobal = await hasPermission(
    currentUserId,
    "create",
    "metadata"
  )
  const isNOForThisOrg = input.organizationId
    ? await isNodeOfficerForOrg(currentUserId, input.organizationId)
    : false

  if (!canCreateGlobal && !isNOForThisOrg) {
    return {
      isSuccess: false,
      message:
        "User does not have permission to create metadata records for this organization."
    }
  }

  try {
    // Process date fields
    const processDateField = (
      dateField: Date | string | null | undefined
    ): string | null => {
      if (!dateField) return null
      if (typeof dateField === "string") return dateField
      return dateField.toISOString()
    }

    // Process JSONB fields with proper type handling
    const processJsonbField = <T>(field: T | null | undefined): T | null => {
      if (!field) return null
      return field
    }

    // Build the record to insert
    const recordToInsert = {
      ...input,
      // Handle date fields consistently
      productionDate: processDateField(input.productionDate),
      publicationDate: processDateField(input.publicationDate),

      // Set default values for required properties
      creatorUserId: currentUserId,
      status: metadataStatusEnum.enumValues[0], // draft by default

      // Ensure JSONB fields are initialized and processed properly
      locationInfo: processJsonbField(input.locationInfo),
      spatialInfo: processJsonbField(input.spatialInfo),
      temporalInfo: processJsonbField(input.temporalInfo),
      technicalDetailsInfo: processJsonbField(input.technicalDetailsInfo),
      constraintsInfo: processJsonbField(input.constraintsInfo),
      dataQualityInfo: processJsonbField(input.dataQualityInfo),
      processingInfo: processJsonbField(input.processingInfo),
      distributionInfo: processJsonbField(input.distributionInfo),
      metadataReferenceInfo: processJsonbField(input.metadataReferenceInfo),
      fundamentalDatasetsInfo: processJsonbField(input.fundamentalDatasetsInfo),
      additionalInfo: processJsonbField(input.additionalInfo)
    }

    // Insert into database
    const [newRecord] = await db
      .insert(metadataRecordsTable)
      .values(recordToInsert as InsertMetadataRecord)
      .returning()

    // Invalidate relevant caches
    CacheInvalidation.metadata.invalidateByOrganization(
      newRecord.organizationId || ""
    )
    CacheInvalidation.metadata.invalidateByUser(newRecord.creatorUserId)

    return {
      isSuccess: true,
      message: "Metadata record created successfully.",
      data: newRecord
    }
  } catch (error) {
    console.error("Error creating metadata record:", error)
    return {
      isSuccess: false,
      message: `Failed to create metadata record: ${
        error instanceof Error ? error.message : String(error)
      }`
    }
  }
}

export async function getMetadataRecordByIdAction(
  id: string
): Promise<ActionState<SelectMetadataRecord | null>> {
  const { userId: currentUserId } = await auth()
  if (!currentUserId) {
    return { isSuccess: false, message: "User not authenticated." }
  }

  try {
    const record = await db.query.metadataRecords.findFirst({
      where: eq(metadataRecordsTable.id, id),
      with: { organization: true }
    })

    if (!record) {
      return { isSuccess: false, message: "Metadata record not found." }
    }

    const canViewGlobal = await hasPermission(currentUserId, "view", "metadata")

    if (record.status !== "Published" && !canViewGlobal) {
      const isCreator = record.creatorUserId === currentUserId
      const isNOForRecordOrg = record.organizationId // Check if organizationId is not null
        ? await isNodeOfficerForOrg(currentUserId, record.organizationId)
        : false
      const isAdmin = await hasPermission(currentUserId, "manage", "metadata")

      if (!isCreator && !isNOForRecordOrg && !isAdmin) {
        return {
          isSuccess: false,
          message:
            "User does not have permission to view this non-published metadata record."
        }
      }
    }

    return {
      isSuccess: true,
      message: "Metadata record retrieved successfully.",
      data: record
    }
  } catch (error) {
    console.error("Error getting metadata record by ID:", error)
    return {
      isSuccess: false,
      message: "Failed to retrieve metadata record."
    }
  }
}

export async function getMetadataRecordsByOrgAction(
  organizationId: string
): Promise<ActionState<SelectMetadataRecord[]>> {
  const { userId: currentUserId } = await auth()
  if (!currentUserId) {
    return { isSuccess: false, message: "User not authenticated." }
  }

  const canViewGlobal = await hasPermission(currentUserId, "view", "metadata")
  const isNOForThisOrg = await isNodeOfficerForOrg(
    currentUserId,
    organizationId
  )

  if (!canViewGlobal && !isNOForThisOrg) {
    return {
      isSuccess: false,
      message:
        "User does not have permission to view metadata records for this organization."
    }
  }

  try {
    const records = await db.query.metadataRecords.findMany({
      where: eq(metadataRecordsTable.organizationId, organizationId),
      with: {
        organization: true
      },
      orderBy: [desc(metadataRecordsTable.updatedAt)]
    })

    return {
      isSuccess: true,
      message: "Metadata records for organization retrieved successfully.",
      data: records
    }
  } catch (error) {
    console.error("Error getting metadata records for organization:", error)
    return {
      isSuccess: false,
      message: "Failed to retrieve metadata records for organization."
    }
  }
}

export async function getMetadataRecordsByStatusAction(
  status: SelectMetadataRecord["status"]
): Promise<ActionState<MetadataRecordWithOrganization[]>> {
  const { userId: currentUserId } = await auth()
  if (!currentUserId) {
    return { isSuccess: false, message: "User not authenticated." }
  }

  const canManageMetadata = await hasPermission(
    currentUserId,
    "manage",
    "metadata"
  )

  if (!canManageMetadata) {
    return {
      isSuccess: false,
      message:
        "User does not have permission to view metadata records by status (requires manage permission)."
    }
  }

  try {
    const records = await db.query.metadataRecords.findMany({
      where: eq(metadataRecordsTable.status, status),
      with: {
        organization: true
      },
      orderBy: [desc(metadataRecordsTable.updatedAt)]
    })

    return {
      isSuccess: true,
      message: "Metadata records by status retrieved successfully.",
      data: records
    }
  } catch (error) {
    console.error("Error getting metadata records by status:", error)
    return {
      isSuccess: false,
      message: "Failed to retrieve metadata records by status."
    }
  }
}

export async function getMetadataRecordsForUserAction(
  targetUserId?: string
): Promise<ActionState<MetadataRecordWithOrganization[]>> {
  const { userId: currentUserId } = await auth()
  if (!currentUserId) {
    return { isSuccess: false, message: "User not authenticated." }
  }

  const userIdToQuery = targetUserId || currentUserId

  if (userIdToQuery !== currentUserId) {
    const canManageMetadata = await hasPermission(
      currentUserId,
      "manage",
      "metadata"
    )
    if (!canManageMetadata) {
      return {
        isSuccess: false,
        message:
          "User does not have permission to view metadata for other users (requires manage permission)."
      }
    }
  }

  try {
    const records = await db.query.metadataRecords.findMany({
      where: eq(metadataRecordsTable.creatorUserId, userIdToQuery),
      with: {
        organization: true
      },
      orderBy: [desc(metadataRecordsTable.updatedAt)]
    })

    return {
      isSuccess: true,
      message: "Metadata records for user retrieved successfully.",
      data: records
    }
  } catch (error) {
    console.error("Error getting metadata records for user:", error)
    return {
      isSuccess: false,
      message: "Failed to retrieve metadata records for user."
    }
  }
}

export async function updateMetadataRecordAction(params: {
  id: string
  data: Partial<
    Omit<
      InsertMetadataRecord,
      "id" | "creatorUserId" | "createdAt" | "updatedAt"
    >
  >
  userId: string
  isDraftSubmission?: boolean
}): Promise<ActionState<SelectMetadataRecord>> {
  const { userId: currentUserId } = await auth() // Authenticate the action
  if (!currentUserId) {
    return { isSuccess: false, message: "User not authenticated." }
  }

  const { id, data, userId, isDraftSubmission } = params

  try {
    const existingRecord = await db.query.metadataRecords.findFirst({
      where: eq(metadataRecordsTable.id, id)
    })

    if (!existingRecord) {
      return { isSuccess: false, message: "Metadata record not found." }
    }

    // Process date fields
    const processDateField = (
      dateField: Date | string | null | undefined
    ): string | null => {
      if (!dateField) return null
      if (typeof dateField === "string") return dateField
      return dateField.toISOString()
    }

    // Process JSONB fields with proper type handling
    const processJsonbField = <T>(field: T | null | undefined): T | null => {
      if (!field) return null
      return field
    }

    // Prepare the data for update, processing date and JSONB fields
    const updateData = {
      ...data,
      // Correctly process date fields from the partial data if they exist
      ...(data.productionDate && {
        productionDate: processDateField(data.productionDate)
      }),
      ...(data.publicationDate && {
        publicationDate: processDateField(data.publicationDate)
      }),
      ...(data.temporalInfo && {
        temporalInfo: {
          dateFrom: processDateField(data.temporalInfo.dateFrom),
          dateTo: processDateField(data.temporalInfo.dateTo)
        }
      }),

      // Correctly process JSONB fields from the partial data if they exist
      ...(data.locationInfo && {
        locationInfo: processJsonbField(data.locationInfo)
      }),
      ...(data.spatialInfo && {
        spatialInfo: processJsonbField(data.spatialInfo)
      }),
      ...(data.technicalDetailsInfo && {
        technicalDetailsInfo: processJsonbField(data.technicalDetailsInfo)
      }),
      ...(data.constraintsInfo && {
        constraintsInfo: processJsonbField(data.constraintsInfo)
      }),
      ...(data.dataQualityInfo && {
        dataQualityInfo: processJsonbField(data.dataQualityInfo)
      }),
      ...(data.processingInfo && {
        processingInfo: processJsonbField(data.processingInfo)
      }),
      ...(data.distributionInfo && {
        distributionInfo: processJsonbField(data.distributionInfo)
      }),
      ...(data.metadataReferenceInfo && {
        metadataReferenceInfo: processJsonbField(data.metadataReferenceInfo)
      }),
      ...(data.fundamentalDatasetsInfo && {
        fundamentalDatasetsInfo: processJsonbField(data.fundamentalDatasetsInfo)
      }),
      updatedAt: new Date() // Ensure updatedAt is always set
    }

    // Conditionally assign additionalInfo if present in data
    if (data.hasOwnProperty("additionalInfo")) {
      ;(updateData as any).additionalInfo = processJsonbField(
        data.additionalInfo
      )
    }

    // RBAC: Check permissions
    const canManageGlobal = await hasPermission(
      currentUserId,
      "manage",
      "metadata"
    )
    const isCreator = existingRecord.creatorUserId === currentUserId
    const isNOForRecordOrg = existingRecord.organizationId // Check if organizationId is not null
      ? await isNodeOfficerForOrg(currentUserId, existingRecord.organizationId)
      : false

    let canUpdate = canManageGlobal
    if (!canUpdate) {
      if (isDraftSubmission && (isCreator || isNOForRecordOrg)) {
        // If it's a draft submission, creator or NO of the org can update specific fields and submit
        canUpdate = true
        // Potentially restrict fields they can update here if needed
      } else if (existingRecord.status === "Draft" && isCreator) {
        // Creator can update their own drafts
        canUpdate = true
      } else if (isNOForRecordOrg) {
        // Node Officer can update records for their organization (e.g. status, notes)
        // Further logic might be needed here to restrict what a NO can change vs a global admin
        canUpdate = true
      }
    }

    if (!canUpdate) {
      return {
        isSuccess: false,
        message: "User does not have permission to update this metadata record."
      }
    }

    // Perform update
    const [updatedRecord] = await db
      .update(metadataRecordsTable)
      .set(updateData)
      .where(eq(metadataRecordsTable.id, id))
      .returning()

    // Log the change
    await logMetadataChange({
      metadataRecordId: id,
      userId: currentUserId,
      actionType:
        isDraftSubmission && existingRecord.status === "Draft"
          ? metadataLogActionTypeEnum.enumValues.find(
              e => e === "SubmittedForValidation"
            ) || "Other"
          : metadataLogActionTypeEnum.enumValues.find(
              e => e === "UpdateField"
            ) || "Other",
      changedFields: data,
      oldStatus: existingRecord.status,
      newStatus: data.status || existingRecord.status, // Use new status if provided, else old
      comments: isDraftSubmission
        ? "Record submitted for validation."
        : "Record fields updated.",
      details: { updatedFields: data }
    })

    // Invalidate relevant caches
    CacheInvalidation.metadata.invalidateMetadataRecord(updatedRecord.id)
    if (updatedRecord.organizationId) {
      CacheInvalidation.metadata.invalidateByOrganization(
        updatedRecord.organizationId
      )
    }
    CacheInvalidation.metadata.invalidateByUser(updatedRecord.creatorUserId)

    return {
      isSuccess: true,
      message: "Metadata record updated successfully.",
      data: updatedRecord
    }
  } catch (error) {
    console.error("Error updating metadata record:", error)
    return {
      isSuccess: false,
      message: `Failed to update metadata record: ${
        error instanceof Error ? error.message : String(error)
      }`
    }
  }
}

export async function updateMetadataRecordStatusAction(
  recordId: string,
  newStatus: SelectMetadataRecord["status"],
  notes?: string // Optional notes for the status change (e.g., rejection reason)
): Promise<ActionState<SelectMetadataRecord>> {
  const { userId: currentUserId } = await auth()
  if (!currentUserId) {
    return { isSuccess: false, message: "User not authenticated." }
  }

  try {
    const existingRecord = await db.query.metadataRecords.findFirst({
      where: eq(metadataRecordsTable.id, recordId)
    })

    if (!existingRecord) {
      return { isSuccess: false, message: "Metadata record not found." }
    }

    // RBAC: Determine who can change status
    const isAdmin = await hasPermission(currentUserId, "manage", "metadata") // Broad admin permission
    const isNOForRecordOrg = existingRecord.organizationId // Check if organizationId is not null
      ? await isNodeOfficerForOrg(currentUserId, existingRecord.organizationId)
      : false

    let canChangeStatus = false

    // System Admins can change to any status
    if (isAdmin) {
      canChangeStatus = true
    } else if (isNOForRecordOrg) {
      // Node officers might have restrictions, e.g., can approve/reject but not publish directly
      // This depends on the specific workflow defined.
      // Example: NO can move from Pending Validation to Needs Revision or Approved
      if (
        existingRecord.status === "Pending Validation" &&
        (newStatus === "Needs Revision" || newStatus === "Approved")
      ) {
        canChangeStatus = true
      }
      // Example: NO can archive their org's published records
      if (existingRecord.status === "Published" && newStatus === "Archived") {
        canChangeStatus = true
      }
      // Add other allowed transitions for Node Officers
    }

    // Check for specific status transition permissions if the above general checks aren't enough.
    // For example, if only a user with "approve_metadata" permission can move to "Approved".
    if (newStatus === "Approved") {
      const canApprove = await hasPermission(
        currentUserId,
        "approve",
        "metadata"
      )
      if (canApprove) canChangeStatus = true
    }
    if (newStatus === "Published") {
      const canPublish = await hasPermission(
        currentUserId,
        "publish",
        "metadata" // Assuming a specific publish permission
      )
      if (canPublish) canChangeStatus = true
    }

    if (!canChangeStatus) {
      return {
        isSuccess: false,
        message: `User does not have permission to change status from ${existingRecord.status} to ${newStatus}.`
      }
    }

    const [updatedRecord] = await db
      .update(metadataRecordsTable)
      .set({ status: newStatus, updatedAt: new Date() })
      .where(eq(metadataRecordsTable.id, recordId))
      .returning()

    // Log the status change
    await logMetadataChange({
      metadataRecordId: recordId,
      userId: currentUserId,
      actionType:
        metadataLogActionTypeEnum.enumValues.find(e => e === "StatusChange") ||
        "Other", // More specific log types can be added
      changedFields: { status: newStatus },
      oldStatus: existingRecord.status,
      newStatus: newStatus,
      comments:
        notes ||
        `Status changed from ${existingRecord.status} to ${newStatus}.`,
      details: {
        previousStatus: existingRecord.status,
        newStatus: newStatus,
        notes
      }
    })

    // --- Audit Log ---
    await createAuditLogAction({
      actionCategory: "MetadataWorkflow",
      actionType: "MetadataStatusChanged",
      targetEntityType: "MetadataRecord",
      targetEntityId: recordId,
      details: {
        title: existingRecord.title,
        previousStatus: existingRecord.status,
        newStatus: newStatus,
        notes: notes || "N/A"
      }
    })
    // --- End Audit Log ---

    // Invalidate relevant caches
    CacheInvalidation.metadata.invalidateMetadataRecord(updatedRecord.id)
    if (updatedRecord.organizationId) {
      CacheInvalidation.metadata.invalidateByOrganization(
        updatedRecord.organizationId
      )
    }
    CacheInvalidation.metadata.invalidateByUser(updatedRecord.creatorUserId)

    return {
      isSuccess: true,
      message: "Metadata record status updated successfully.",
      data: updatedRecord
    }
  } catch (error) {
    console.error("Error updating metadata record status:", error)
    return {
      isSuccess: false,
      message: "Failed to update metadata record status."
    }
  }
}

export async function deleteMetadataRecordAction(
  recordId: string
): Promise<ActionState<void>> {
  const { userId: currentUserId } = await auth()
  if (!currentUserId) {
    return { isSuccess: false, message: "User not authenticated." }
  }

  try {
    const existingRecord = await db.query.metadataRecords.findFirst({
      where: eq(metadataRecordsTable.id, recordId)
    })

    if (!existingRecord) {
      return { isSuccess: false, message: "Metadata record not found." }
    }

    const isAdmin = await hasPermission(currentUserId, "delete", "metadata") // Assumes a general delete:metadata permission

    // Safely check isNodeOfficerForOrg only if organizationId exists
    let isNOForRecordOrg = false
    if (existingRecord.organizationId) {
      // Check if organizationId is not null
      isNOForRecordOrg = await isNodeOfficerForOrg(
        currentUserId,
        existingRecord.organizationId
      )
    }

    // Creators might only be allowed to delete their own records if they are in 'Draft' status
    const isCreatorAndDraft =
      existingRecord.creatorUserId === currentUserId &&
      existingRecord.status === "Draft"

    if (!isAdmin && !isNOForRecordOrg && !isCreatorAndDraft) {
      return {
        isSuccess: false,
        message: "User does not have permission to delete this metadata record."
      }
    }

    await db
      .delete(metadataRecordsTable)
      .where(eq(metadataRecordsTable.id, recordId))

    // Invalidate relevant caches
    CacheInvalidation.metadata.invalidateMetadataRecord(recordId)
    if (existingRecord.organizationId) {
      CacheInvalidation.metadata.invalidateByOrganization(
        existingRecord.organizationId
      )
    }
    CacheInvalidation.metadata.invalidateByUser(existingRecord.creatorUserId)

    // --- Audit Log ---
    await createAuditLogAction({
      actionCategory: "MetadataWorkflow",
      actionType: "MetadataDeleted",
      targetEntityType: "MetadataRecord",
      targetEntityId: recordId,
      details: {
        title: existingRecord.title, // Log some identifying info
        status: existingRecord.status
      }
    })
    // --- End Audit Log ---

    await logMetadataChange({
      metadataRecordId: recordId,
      userId: currentUserId,
      actionType:
        metadataLogActionTypeEnum.enumValues.find(e => e === "DeleteRecord") ||
        "Other",
      changedFields: existingRecord,
      oldStatus: existingRecord.status,
      newStatus: null,
      comments: `Record deleted. ${JSON.stringify(existingRecord)}`,
      details: { deletedData: existingRecord }
    })

    return {
      isSuccess: true,
      message: "Metadata record deleted successfully.",
      data: undefined
    }
  } catch (error) {
    console.error("Error deleting metadata record:", error)
    return { isSuccess: false, message: "Failed to delete metadata record." }
  }
}

export async function searchMetadataRecordsAction(params: {
  query?: string
  organizationId?: string
  status?: SelectMetadataRecord["status"]
  temporalExtentStartDate?: string // ISO Date string
  temporalExtentEndDate?: string // ISO Date string
  frameworkType?: string
  datasetType?: string
  bbox_north?: string
  bbox_south?: string
  bbox_east?: string
  bbox_west?: string
  sortBy?: string
  sortOrder?: "asc" | "desc"
  page?: number
  pageSize?: number
}): Promise<ActionState<PaginatedMetadataRecords>> {
  const { userId: currentUserId } = await auth()

  try {
    // Input validation
    const pageNumber = Math.max(1, params.page || 1)
    const size = Math.min(Math.max(1, params.pageSize || 10), 100) // Limit max page size to 100
    const offset = (pageNumber - 1) * size

    // Validate query length for security
    if (params.query && params.query.length > 200) {
      return {
        isSuccess: false,
        message: "Search query too long. Maximum 200 characters allowed."
      }
    }

    // Validate temporal dates
    if (params.temporalExtentStartDate) {
      const startDate = new Date(params.temporalExtentStartDate)
      if (isNaN(startDate.getTime())) {
        return {
          isSuccess: false,
          message: "Invalid start date format. Use ISO date string."
        }
      }
    }

    if (params.temporalExtentEndDate) {
      const endDate = new Date(params.temporalExtentEndDate)
      if (isNaN(endDate.getTime())) {
        return {
          isSuccess: false,
          message: "Invalid end date format. Use ISO date string."
        }
      }
    }

    const conditions = []

    // Text search conditions - Fixed OR logic structure
    if (params.query && params.query.trim()) {
      const q = `%${params.query.trim()}%`
      const textSearchConditions = [
        ilike(metadataRecordsTable.title, q),
        ilike(metadataRecordsTable.abstract, q),
        ilike(metadataRecordsTable.purpose, q),
        // Keyword search in TEXT[] array
        sql`EXISTS (SELECT 1 FROM unnest(${metadataRecordsTable.keywords}) keyword WHERE keyword ILIKE ${q})`
      ]

      // Add the OR condition as a single condition
      conditions.push(or(...textSearchConditions))
    }

    if (params.organizationId) {
      conditions.push(
        eq(metadataRecordsTable.organizationId, params.organizationId)
      )
    }

    // Status filtering with permission check
    if (params.status) {
      conditions.push(eq(metadataRecordsTable.status, params.status))
    } else {
      // Default to searching only published records if no specific status is given
      // unless user has special permissions to view all.
      if (currentUserId) {
        try {
          const canViewAll = await hasPermission(
            currentUserId,
            "manage",
            "metadata"
          )
          if (!canViewAll) {
            conditions.push(eq(metadataRecordsTable.status, "Published"))
          }
        } catch (permissionError) {
          console.warn(
            "Permission check failed, defaulting to Published only:",
            permissionError
          )
          conditions.push(eq(metadataRecordsTable.status, "Published"))
        }
      } else {
        // Unauthenticated users only see Published records.
        conditions.push(eq(metadataRecordsTable.status, "Published"))
      }
    }

    // Temporal extent filtering
    if (params.temporalExtentStartDate) {
      conditions.push(
        sql`(${metadataRecordsTable.temporalInfo} ->> 'dateTo')::date >= ${params.temporalExtentStartDate}::date`
      )
    }

    if (params.temporalExtentEndDate) {
      conditions.push(
        sql`(${metadataRecordsTable.temporalInfo} ->> 'dateFrom')::date <= ${params.temporalExtentEndDate}::date`
      )
    }

    // Framework type filtering
    if (params.frameworkType) {
      conditions.push(
        sql`${metadataRecordsTable.frameworkType} = ${params.frameworkType}`
      )
    }

    // Data type filtering (mapping datasetType to dataType for backward compatibility)
    if (params.datasetType) {
      conditions.push(
        sql`${metadataRecordsTable.dataType}::text = ${params.datasetType}`
      )
    }

    // Spatial search conditions - Bounding Box filter with validation
    if (
      params.bbox_north &&
      params.bbox_south &&
      params.bbox_east &&
      params.bbox_west
    ) {
      try {
        const north = parseFloat(params.bbox_north)
        const south = parseFloat(params.bbox_south)
        const east = parseFloat(params.bbox_east)
        const west = parseFloat(params.bbox_west)

        // Validate coordinate bounds
        if (
          isNaN(north) ||
          isNaN(south) ||
          isNaN(east) ||
          isNaN(west) ||
          north < -90 ||
          north > 90 ||
          south < -90 ||
          south > 90 ||
          east < -180 ||
          east > 180 ||
          west < -180 ||
          west > 180 ||
          north <= south ||
          east <= west
        ) {
          return {
            isSuccess: false,
            message:
              "Invalid bounding box coordinates. Check latitude/longitude bounds and ensure north > south, east > west."
          }
        }

        // Check if spatial_info and boundingBox exist before attempting to query the geometry
        conditions.push(
          sql`
            (${metadataRecordsTable.spatialInfo} IS NOT NULL AND 
            ${metadataRecordsTable.spatialInfo} ? 'boundingBox' AND
            ST_Intersects(
              ST_MakeEnvelope(${west}, ${south}, ${east}, ${north}, 4326),
              (${metadataRecordsTable.spatialInfo} ->> 'boundingBox')::geometry
            ))
          `
        )
      } catch (e) {
        console.warn("Error parsing BBOX parameters:", e)
        return {
          isSuccess: false,
          message: "Invalid bounding box parameters format."
        }
      }
    }

    const finalConditions =
      conditions.length > 0 ? and(...conditions) : undefined

    // Sorting with validation
    let orderByClause: any[] = [desc(metadataRecordsTable.updatedAt)] // Default sort
    if (params.sortBy) {
      const validSortColumns = ["title", "createdAt", "updatedAt", "status"]
      if (validSortColumns.includes(params.sortBy)) {
        const sortColumn = (metadataRecordsTable as any)[params.sortBy]
        if (sortColumn) {
          orderByClause = [
            params.sortOrder === "asc" ? asc(sortColumn) : desc(sortColumn)
          ]
        }
      } else {
        console.warn(
          `Invalid sortBy column: ${params.sortBy}. Defaulting to updatedAt.`
        )
      }
    }

    // Use Promise.all for concurrent execution
    const [records, totalRecordsResult] = await Promise.all([
      db.query.metadataRecords.findMany({
        where: finalConditions,
        with: {
          organization: true
        },
        orderBy: orderByClause,
        limit: size,
        offset: offset
      }),
      db
        .select({ count: count() })
        .from(metadataRecordsTable)
        .where(finalConditions)
    ])

    const totalRecords = totalRecordsResult[0]?.count || 0
    const totalPages = Math.ceil(totalRecords / size)

    return {
      isSuccess: true,
      message: `Found ${totalRecords} metadata record${totalRecords === 1 ? "" : "s"}.`,
      data: {
        records,
        totalRecords,
        totalPages,
        currentPage: pageNumber,
        pageSize: size
      }
    }
  } catch (error) {
    console.error("Error searching metadata records:", error)

    // Handle specific database errors
    if (error instanceof Error) {
      if (error.message.includes("invalid input syntax")) {
        return {
          isSuccess: false,
          message: "Invalid search parameters format."
        }
      }
      if (error.message.includes("permission denied")) {
        return {
          isSuccess: false,
          message: "Insufficient permissions to search metadata records."
        }
      }
    }

    return {
      isSuccess: false,
      message: "Failed to search metadata records. Please try again."
    }
  }
}

export async function getMetadataRecordCountsByStatusAction(): Promise<
  ActionState<Array<{ status: SelectMetadataRecord["status"]; count: number }>>
> {
  const { userId } = await auth()
  if (!userId) {
    return { isSuccess: false, message: "User not authenticated." }
  }

  // RBAC: Only allow admins or users with specific permissions to see aggregate counts
  const canViewCounts = await hasPermission(userId, "view", "system_reports") // Example permission
  if (!canViewCounts) {
    return {
      isSuccess: false,
      message: "User does not have permission to view metadata record counts."
    }
  }

  try {
    const counts = await db
      .select({
        status: metadataRecordsTable.status,
        count: count(metadataRecordsTable.id)
      })
      .from(metadataRecordsTable)
      .groupBy(metadataRecordsTable.status)

    return {
      isSuccess: true,
      message: "Metadata record counts by status retrieved successfully.",
      data: counts as Array<{
        status: SelectMetadataRecord["status"]
        count: number
      }>
    }
  } catch (error) {
    console.error("Error getting metadata record counts by status:", error)
    return {
      isSuccess: false,
      message: "Failed to retrieve metadata record counts by status."
    }
  }
}

export async function getMetadataRecordCountsForOrgByStatusAction(
  organizationId: string
): Promise<
  ActionState<Array<{ status: SelectMetadataRecord["status"]; count: number }>>
> {
  const { userId } = await auth()
  if (!userId) {
    return { isSuccess: false, message: "User not authenticated." }
  }

  // RBAC: Check if user can view this organization's counts
  const canViewOrgCounts =
    (await isNodeOfficerForOrg(userId, organizationId)) ||
    (await hasPermission(userId, "view", "system_reports")) // Or admin

  if (!canViewOrgCounts) {
    return {
      isSuccess: false,
      message:
        "User does not have permission to view metadata record counts for this organization."
    }
  }

  try {
    const counts = await db
      .select({
        status: metadataRecordsTable.status,
        count: count(metadataRecordsTable.id)
      })
      .from(metadataRecordsTable)
      .where(eq(metadataRecordsTable.organizationId, organizationId))
      .groupBy(metadataRecordsTable.status)

    return {
      isSuccess: true,
      message:
        "Metadata record counts for organization by status retrieved successfully.",
      data: counts as Array<{
        status: SelectMetadataRecord["status"]
        count: number
      }>
    }
  } catch (error) {
    console.error(
      "Error getting metadata record counts for organization by status:",
      error
    )
    return {
      isSuccess: false,
      message:
        "Failed to retrieve metadata record counts for organization by status."
    }
  }
}

export async function getRecentOrgMetadataActivityAction(
  organizationId: string,
  limit: number = 5
): Promise<ActionState<MetadataRecordWithOrganization[]>> {
  const { userId: currentUserId } = await auth()
  if (!currentUserId) {
    return { isSuccess: false, message: "User not authenticated." }
  }

  const isNOForThisOrg = await isNodeOfficerForOrg(
    currentUserId,
    organizationId
  )
  const isSysAdmin = await checkUserRole(currentUserId, "System Administrator")

  if (!isNOForThisOrg && !isSysAdmin) {
    return {
      isSuccess: false,
      message:
        "User does not have permission to view recent activity for this organization."
    }
  }

  try {
    const recentRecords = await db.query.metadataRecords.findMany({
      where: eq(metadataRecordsTable.organizationId, organizationId),
      with: {
        organization: true
      },
      orderBy: [desc(metadataRecordsTable.updatedAt)], // Could also be createdAt or a combination
      limit: limit
    })

    return {
      isSuccess: true,
      message:
        "Recent metadata activity for organization retrieved successfully.",
      data: recentRecords
    }
  } catch (error) {
    console.error(
      "Error getting recent metadata activity for organization:",
      error
    )
    return {
      isSuccess: false,
      message: "Failed to retrieve recent metadata activity for organization."
    }
  }
}

export async function getOrganizationsAction(): Promise<
  ActionState<SelectOrganization[]>
> {
  const { userId } = await auth()
  if (!userId) {
    return { isSuccess: false, message: "User not authenticated." }
  }

  // RBAC: Potentially restrict which organizations are listed based on user role
  // For now, assuming any authenticated user can get a list of all organizations.
  // A System Admin might see all, a Node Officer might see their own and related, etc.

  try {
    const organizations = await db.query.organizations.findMany({
      orderBy: [asc(organizationsTable.name)]
    })
    return {
      isSuccess: true,
      message: "Organizations retrieved successfully.",
      data: organizations
    }
  } catch (error) {
    console.error("Error retrieving organizations:", error)
    return {
      isSuccess: false,
      message: "Failed to retrieve organizations."
    }
  }
}

export async function getMetadataRecordsWithSpatialBoundsAction(): Promise<
  ActionState<SelectMetadataRecord[]>
> {
  // Check cache first
  const cacheKey = CacheKeys.metadata.spatialBounds()
  const cachedData = metadataCache.get(cacheKey)

  if (cachedData) {
    return {
      isSuccess: true,
      message:
        "Metadata records with spatial bounds retrieved successfully (cached).",
      data: cachedData
    }
  }

  try {
    // Fetch published metadata records that have spatial bounds
    const records = await db.query.metadataRecords.findMany({
      where: and(
        eq(metadataRecordsTable.status, "Published"),
        // Check if spatialInfo exists and has boundingBox with coordinates
        sql`${metadataRecordsTable.spatialInfo} ? 'boundingBox' AND 
            ${metadataRecordsTable.spatialInfo} -> 'boundingBox' ? 'northBoundingCoordinate' AND
            ${metadataRecordsTable.spatialInfo} -> 'boundingBox' ? 'southBoundingCoordinate' AND
            ${metadataRecordsTable.spatialInfo} -> 'boundingBox' ? 'eastBoundingCoordinate' AND
            ${metadataRecordsTable.spatialInfo} -> 'boundingBox' ? 'westBoundingCoordinate' AND
            ${metadataRecordsTable.spatialInfo} -> 'boundingBox' ->> 'northBoundingCoordinate' IS NOT NULL AND
            ${metadataRecordsTable.spatialInfo} -> 'boundingBox' ->> 'southBoundingCoordinate' IS NOT NULL AND
            ${metadataRecordsTable.spatialInfo} -> 'boundingBox' ->> 'eastBoundingCoordinate' IS NOT NULL AND
            ${metadataRecordsTable.spatialInfo} -> 'boundingBox' ->> 'westBoundingCoordinate' IS NOT NULL`
      ),
      orderBy: [desc(metadataRecordsTable.updatedAt)],
      with: {
        organization: true
      }
    })

    // Cache the results for 5 minutes (spatial bounds don't change frequently)
    metadataCache.set(cacheKey, records, 5 * 60 * 1000)

    return {
      isSuccess: true,
      message: "Metadata records with spatial bounds retrieved successfully.",
      data: records
    }
  } catch (error) {
    console.error("Error getting metadata records with spatial bounds:", error)
    return {
      isSuccess: false,
      message: "Failed to retrieve metadata records with spatial bounds."
    }
  }
}
