"use server"

import { auth } from "@clerk/nextjs/server"
import { db } from "@/db/db"
import {
  SelectMetadataRecord,
  metadataRecordsTable,
  metadataChangeLogsTable,
  metadataLogActionTypeEnum,
  metadataStatusEnum
} from "@/db/schema"
import { ActionState } from "@/types"
import { updateMetadataRecordStatusAction } from "./metadata-records-actions"
import { hasPermission, isNodeOfficerForOrg, checkUserRole } from "@/lib/rbac"
import { eq, and, not, inArray, or, sql, count, desc } from "drizzle-orm"

// Import directly from schema file since it's not exported from the index
import { userOrganizationsTable } from "@/db/schema/user-organizations-schema"

// Valid metadata status values from the enum
type ValidMetadataStatus =
  | "Draft"
  | "Pending Validation"
  | "Needs Revision"
  | "Approved"
  | "Published"
  | "Archived"

// Type guard to validate status values
function isValidMetadataStatus(status: string): status is ValidMetadataStatus {
  return [
    "Draft",
    "Pending Validation",
    "Needs Revision",
    "Approved",
    "Published",
    "Archived"
  ].includes(status)
}

/**
 * Allow a metadata creator to submit a metadata record for validation
 * Changes status from Draft to Pending Validation
 */
export async function submitForValidationAction(
  recordId: string
): Promise<ActionState<SelectMetadataRecord>> {
  return updateMetadataRecordStatusAction(
    recordId,
    "Pending Validation",
    "Metadata submitted for validation"
  )
}

/**
 * Allow a metadata creator to resubmit a metadata record after revision
 * Changes status from Needs Revision to Pending Validation
 */
export async function resubmitRevisedMetadataAction(
  recordId: string
): Promise<ActionState<SelectMetadataRecord>> {
  const { userId: currentUserId } = await auth()
  if (!currentUserId) {
    return { isSuccess: false, message: "User not authenticated." }
  }

  try {
    // First, get the record to ensure it's in Needs Revision status
    const record = await db.query.metadataRecords.findFirst({
      where: eq(metadataRecordsTable.id, recordId)
    })

    if (!record) {
      return { isSuccess: false, message: "Metadata record not found." }
    }

    if (record.status !== "Needs Revision") {
      return {
        isSuccess: false,
        message: "Only metadata records needing revision can be resubmitted."
      }
    }

    // Verify ownership or permissions
    const isOwner = record.creatorUserId === currentUserId
    const canEditGlobal = await hasPermission(currentUserId, "edit", "metadata")
    const isOrgManager = record.organizationId
      ? await isNodeOfficerForOrg(currentUserId, record.organizationId)
      : false

    if (!isOwner && !canEditGlobal && !isOrgManager) {
      return {
        isSuccess: false,
        message: "You don't have permission to resubmit this metadata record."
      }
    }

    // Update the record status
    return updateMetadataRecordStatusAction(
      recordId,
      "Pending Validation",
      "Metadata record revised and resubmitted for validation"
    )
  } catch (error) {
    console.error("Error resubmitting revised metadata record:", error)
    return {
      isSuccess: false,
      message: "Failed to resubmit revised metadata record."
    }
  }
}

/**
 * Allow a metadata creator to submit a metadata record for review
 * Changes status from Draft to Pending Validation
 */
export async function submitMetadataForApprovalAction(
  recordId: string
): Promise<ActionState<SelectMetadataRecord>> {
  return updateMetadataRecordStatusAction(
    recordId,
    "Pending Validation",
    "Metadata submitted for approval"
  )
}

/**
 * Perform basic automated validation checks on a metadata record
 * This is a placeholder for more sophisticated validation logic
 * Returns a list of validation issues, if any
 */
export async function performAutomatedValidationAction(
  recordId: string
): Promise<ActionState<{ valid: boolean; issues: string[] }>> {
  const { userId: currentUserId } = await auth()
  if (!currentUserId) {
    return { isSuccess: false, message: "User not authenticated." }
  }

  try {
    // Get the metadata record
    const record = await db.query.metadataRecords.findFirst({
      where: eq(metadataRecordsTable.id, recordId)
    })

    if (!record) {
      return { isSuccess: false, message: "Metadata record not found." }
    }

    // Check permissions
    const canValidate =
      (record.organizationId &&
        (await isNodeOfficerForOrg(currentUserId, record.organizationId))) ||
      (await hasPermission(currentUserId, "approve", "metadata"))

    if (!canValidate) {
      return {
        isSuccess: false,
        message:
          "User does not have permission to validate this metadata record."
      }
    }

    // Initialize validation results
    const issues: string[] = []

    // Perform validation checks
    // 1. Check for required fields
    if (!record.title || record.title.trim() === "") {
      issues.push("Title is required")
    }

    if (!record.abstract || record.abstract.trim() === "") {
      issues.push("Abstract is required")
    }

    // 2. Check for organization
    if (!record.organizationId) {
      issues.push("Organization is required")
    }

    // 3. Check for spatial extent (if applicable)
    const spatialInfo = record.spatialInfo as any
    const hasSpatialInfo =
      spatialInfo?.boundingBox?.southBoundingCoordinate ||
      spatialInfo?.boundingBox?.northBoundingCoordinate ||
      spatialInfo?.boundingBox?.westBoundingCoordinate ||
      spatialInfo?.boundingBox?.eastBoundingCoordinate

    if (!hasSpatialInfo) {
      issues.push("Spatial extent information is recommended")
    }

    // 4. Check for temporal information (if applicable)
    const temporalInfo = record.temporalInfo as any
    if (
      !temporalInfo?.dateFrom &&
      !temporalInfo?.dateTo &&
      !record.productionDate
    ) {
      issues.push("Temporal information is recommended")
    }

    // 5. Check for access information
    if (!record.accessMethod) {
      issues.push("Access method information is recommended")
    }

    // Log validation performed
    await db.insert(metadataChangeLogsTable).values({
      metadataRecordId: recordId,
      userId: currentUserId,
      actionType: "Other",
      comments: `Automated validation performed. Issues found: ${issues.length}`,
      details: {
        validationType: "automated",
        issuesCount: issues.length,
        issues: issues.length > 0 ? issues : null
      }
    })

    return {
      isSuccess: true,
      message:
        issues.length > 0
          ? `Validation completed with ${issues.length} issues.`
          : "Validation completed successfully with no issues.",
      data: {
        valid: issues.length === 0,
        issues
      }
    }
  } catch (error) {
    console.error("Error performing automated validation:", error)
    return {
      isSuccess: false,
      message: "An error occurred during automated validation."
    }
  }
}

/**
 * Allow a metadata approver to approve a metadata record
 * Changes status from Pending Validation to Approved
 */
export async function approveMetadataAction(
  recordId: string,
  notes?: string
): Promise<ActionState<SelectMetadataRecord>> {
  return updateMetadataRecordStatusAction(
    recordId,
    "Approved",
    notes || "Metadata record approved"
  )
}

/**
 * Allow a metadata approver to reject a metadata record
 * Changes status from Pending Validation to Needs Revision
 */
export async function rejectMetadataAction(
  recordId: string,
  rejectionReason: string
): Promise<ActionState<SelectMetadataRecord>> {
  if (!rejectionReason || rejectionReason.trim() === "") {
    return {
      isSuccess: false,
      message: "Rejection reason is required"
    }
  }

  return updateMetadataRecordStatusAction(
    recordId,
    "Needs Revision",
    `Metadata record needs revision: ${rejectionReason}`
  )
}

/**
 * Publish an approved metadata record
 * Changes status from Approved to Published
 */
export async function publishMetadataAction(
  recordId: string
): Promise<ActionState<SelectMetadataRecord>> {
  const { userId: currentUserId } = await auth()
  if (!currentUserId) {
    return { isSuccess: false, message: "User not authenticated." }
  }

  try {
    // First, get the record to ensure it's in Approved status
    const record = await db.query.metadataRecords.findFirst({
      where: eq(metadataRecordsTable.id, recordId)
    })

    if (!record) {
      return { isSuccess: false, message: "Metadata record not found." }
    }

    if (record.status !== "Approved") {
      return {
        isSuccess: false,
        message: "Only approved metadata records can be published."
      }
    }

    // Set publication date as now
    const [updatedRecord] = await db
      .update(metadataRecordsTable)
      .set({
        publicationDate: new Date().toISOString(),
        updatedAt: new Date()
      })
      .where(eq(metadataRecordsTable.id, recordId))
      .returning()

    if (!updatedRecord) {
      return {
        isSuccess: false,
        message: "Failed to update publication date."
      }
    }

    // Then change the status to Published
    return updateMetadataRecordStatusAction(
      recordId,
      "Published",
      "Metadata record published"
    )
  } catch (error) {
    console.error("Error publishing metadata record:", error)
    return {
      isSuccess: false,
      message: "Failed to publish metadata record."
    }
  }
}

/**
 * Get metadata records pending validation for a specific organization with pagination
 */
export async function getPendingValidationMetadataPaginatedAction(
  organizationId: string,
  page: number = 1,
  pageSize: number = 20,
  filters?: {
    searchTerm?: string
    status?: string
    sortBy?: "submittedAt" | "title" | "priority"
  }
): Promise<
  ActionState<{
    records: SelectMetadataRecord[]
    total: number
    hasMore: boolean
    page: number
    pageSize: number
  }>
> {
  const { userId: currentUserId } = await auth()
  if (!currentUserId) {
    return { isSuccess: false, message: "User not authenticated." }
  }

  try {
    // Check if the user has permission to view pending records for this org
    const canView =
      (await isNodeOfficerForOrg(currentUserId, organizationId)) ||
      (await hasPermission(currentUserId, "approve", "metadata"))

    if (!canView) {
      return {
        isSuccess: false,
        message:
          "User does not have permission to view pending records for this organization."
      }
    }

    const offset = (page - 1) * pageSize

    let conditions = [eq(metadataRecordsTable.organizationId, organizationId)]

    // Apply status filter
    if (filters?.status) {
      // Validate the status value before using it
      if (isValidMetadataStatus(filters.status)) {
        conditions.push(eq(metadataRecordsTable.status, filters.status))
      } else {
        // If invalid status provided, return error
        return {
          isSuccess: false,
          message: `Invalid status filter: ${filters.status}. Valid values are: Draft, Pending Validation, Needs Revision, Approved, Published, Archived.`
        }
      }
    } else {
      // Default to pending validation and needs revision
      conditions.push(
        inArray(metadataRecordsTable.status, [
          "Pending Validation",
          "Needs Revision"
        ])
      )
    }

    // Get total count
    const totalResult = await db
      .select({ count: count() })
      .from(metadataRecordsTable)
      .where(and(...conditions))

    const total = totalResult[0]?.count || 0

    // Build search conditions
    let searchConditions = conditions
    if (filters?.searchTerm) {
      const searchTerm = `%${filters.searchTerm.toLowerCase()}%`
      const searchCondition = or(
        sql`LOWER(${metadataRecordsTable.title}) LIKE ${searchTerm}`,
        sql`LOWER(${metadataRecordsTable.abstract}) LIKE ${searchTerm}`
      )
      if (searchCondition) {
        searchConditions = [...conditions, searchCondition]
      }
    }

    // Build order by
    let orderBy: any[]
    switch (filters?.sortBy) {
      case "title":
        orderBy = [metadataRecordsTable.title]
        break
      case "priority":
        // Custom priority logic - Pending Validation > Needs Revision
        orderBy = [
          sql`CASE 
            WHEN ${metadataRecordsTable.status} = 'Pending Validation' THEN 1 
            WHEN ${metadataRecordsTable.status} = 'Needs Revision' THEN 2 
            ELSE 3 
          END`,
          metadataRecordsTable.updatedAt
        ]
        break
      case "submittedAt":
      default:
        orderBy = [metadataRecordsTable.updatedAt]
        break
    }

    const records = await db.query.metadataRecords.findMany({
      where: and(...searchConditions),
      orderBy,
      limit: pageSize,
      offset,
      with: {
        organization: true,
        changeLogs: {
          orderBy: [desc(metadataChangeLogsTable.createdAt)],
          where: and(
            eq(metadataChangeLogsTable.actionType, "StatusChange"),
            inArray(metadataChangeLogsTable.newStatus, [
              "Pending Validation",
              "Needs Revision"
            ])
          ),
          limit: 1
        }
      }
    })

    const hasMore = offset + records.length < total

    return {
      isSuccess: true,
      message: `Retrieved ${records.length} metadata records.`,
      data: {
        records,
        total,
        hasMore,
        page,
        pageSize
      }
    }
  } catch (error) {
    console.error("Error getting pending validation metadata:", error)
    return {
      isSuccess: false,
      message: "Failed to retrieve pending validation metadata records."
    }
  }
}

/**
 * Get all metadata records pending validation for a specific organization (legacy)
 */
export async function getPendingValidationMetadataAction(
  organizationId?: string
): Promise<ActionState<SelectMetadataRecord[]>> {
  const { userId: currentUserId } = await auth()
  if (!currentUserId) {
    return { isSuccess: false, message: "User not authenticated." }
  }

  try {
    let conditions = [eq(metadataRecordsTable.status, "Pending Validation")]

    // If organizationId is provided, filter by it
    if (organizationId) {
      // Check if the user has permission to view pending records for this org
      const canView =
        (await isNodeOfficerForOrg(currentUserId, organizationId)) ||
        (await hasPermission(currentUserId, "approve", "metadata"))

      if (!canView) {
        return {
          isSuccess: false,
          message:
            "User does not have permission to view pending records for this organization."
        }
      }

      conditions.push(eq(metadataRecordsTable.organizationId, organizationId))
    } else {
      // If no org specified, check if user is a system admin
      const isAdmin = await hasPermission(currentUserId, "manage", "metadata")

      if (!isAdmin) {
        // If not admin, find all orgs where user is a Node Officer
        const userOrgs = await db.query.userOrganizations.findMany({
          where: and(
            eq(userOrganizationsTable.userId, currentUserId),
            eq(userOrganizationsTable.role, "Node Officer")
          ),
          columns: {
            organizationId: true
          }
        })

        if (userOrgs.length === 0) {
          return {
            isSuccess: false,
            message: "User is not a Node Officer for any organization."
          }
        }

        // Filter by these organizations
        const orgIds = userOrgs.map(org => org.organizationId)
        conditions.push(inArray(metadataRecordsTable.organizationId, orgIds))
      }
    }

    const records = await db.query.metadataRecords.findMany({
      where: and(...conditions),
      orderBy: [metadataRecordsTable.updatedAt],
      with: {
        organization: true,
        changeLogs: {
          orderBy: [metadataChangeLogsTable.createdAt],
          where: and(
            eq(metadataChangeLogsTable.actionType, "StatusChange"),
            eq(metadataChangeLogsTable.newStatus, "Pending Validation")
          ),
          limit: 1
        }
      }
    })

    return {
      isSuccess: true,
      message: `Retrieved ${records.length} metadata records pending validation.`,
      data: records
    }
  } catch (error) {
    console.error("Error getting pending validation metadata:", error)
    return {
      isSuccess: false,
      message: "Failed to retrieve pending validation metadata records."
    }
  }
}

/**
 * Get all metadata records that need revision for a specific user or organization
 */
export async function getNeedsRevisionMetadataAction(options?: {
  userId?: string
  organizationId?: string
}): Promise<ActionState<SelectMetadataRecord[]>> {
  const { userId: currentUserId } = await auth()
  if (!currentUserId) {
    return { isSuccess: false, message: "User not authenticated." }
  }

  try {
    let conditions = [eq(metadataRecordsTable.status, "Needs Revision")]

    // If specific user requested
    if (options?.userId) {
      // Users can only see their own unless they have special permissions
      if (options.userId !== currentUserId) {
        // Check if user has global management permission
        const hasManagePermission = await hasPermission(
          currentUserId,
          "manage",
          "metadata"
        )

        // If no global permission, we need to check if the current user
        // is a Node Officer for the organization of the requested user's records
        if (!hasManagePermission) {
          // We need to first find the organizations where the target user has records
          const userRecords = await db.query.metadataRecords.findMany({
            where: and(
              eq(metadataRecordsTable.creatorUserId, options.userId),
              eq(metadataRecordsTable.status, "Needs Revision")
            ),
            columns: {
              organizationId: true
            },
            limit: 100
          })

          // Get unique organization IDs
          const uniqueOrgIds = [
            ...new Set(userRecords.map(r => r.organizationId))
          ]

          // Check if current user is a Node Officer for any of these organizations
          let hasOrgPermission = false
          for (const orgId of uniqueOrgIds) {
            if (orgId && (await isNodeOfficerForOrg(currentUserId, orgId))) {
              hasOrgPermission = true
              break
            }
          }

          if (!hasOrgPermission) {
            return {
              isSuccess: false,
              message:
                "User does not have permission to view other users' records."
            }
          }
        }
      }

      conditions.push(eq(metadataRecordsTable.creatorUserId, options.userId))
    }
    // If specific organization requested
    else if (options?.organizationId) {
      // Check if the user has permission to view records for this org
      const canView =
        (await isNodeOfficerForOrg(currentUserId, options.organizationId)) ||
        (await hasPermission(currentUserId, "manage", "metadata"))

      if (!canView) {
        return {
          isSuccess: false,
          message:
            "User does not have permission to view records for this organization."
        }
      }

      conditions.push(
        eq(metadataRecordsTable.organizationId, options.organizationId)
      )
    }
    // If no filters, default to current user's records only unless admin
    else {
      const isAdmin = await hasPermission(currentUserId, "manage", "metadata")
      const isNodeOfficer = await checkUserRole(currentUserId, "Node Officer")

      if (!isAdmin && !isNodeOfficer) {
        conditions.push(eq(metadataRecordsTable.creatorUserId, currentUserId))
      } else if (isNodeOfficer && !isAdmin) {
        // For Node Officers, get their organizations
        const userOrgs = await db.query.userOrganizations.findMany({
          where: and(
            eq(userOrganizationsTable.userId, currentUserId),
            eq(userOrganizationsTable.role, "Node Officer")
          ),
          columns: {
            organizationId: true
          }
        })

        const orgIds = userOrgs.map(org => org.organizationId)
        conditions.push(inArray(metadataRecordsTable.organizationId, orgIds))
      }
      // Admins can see all
    }

    const records = await db.query.metadataRecords.findMany({
      where: and(...conditions),
      orderBy: [metadataRecordsTable.updatedAt],
      with: {
        organization: true,
        changeLogs: {
          orderBy: [metadataChangeLogsTable.createdAt],
          where: and(
            eq(metadataChangeLogsTable.actionType, "StatusChange"),
            eq(metadataChangeLogsTable.newStatus, "Needs Revision")
          ),
          limit: 1
        }
      }
    })

    return {
      isSuccess: true,
      message: `Retrieved ${records.length} metadata records needing revision.`,
      data: records
    }
  } catch (error) {
    console.error("Error getting needs-revision metadata:", error)
    return {
      isSuccess: false,
      message: "Failed to retrieve metadata records needing revision."
    }
  }
}
