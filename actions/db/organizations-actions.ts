"use server"

import { db } from "@/db/db"
import {
  InsertOrganization,
  SelectOrganization,
  organizationsTable,
  organizationStatusEnum
} from "@/db/schema/organizations-schema"
import { ActionState } from "@/types"
import { auth } from "@clerk/nextjs/server"
import { eq, desc, and, count, sql, asc, ilike, or, inArray } from "drizzle-orm"
import { hasPermission, checkUserRole, requiresSystemAdmin } from "@/lib/rbac"
import {
  userOrganizationsTable,
  userRolesTable,
  rolesTable,
  profilesTable
} from "@/db/schema"
import { createAuditLogAction, CreateAuditLogInput } from "../audit-log-actions"
import { clerkClient } from "@clerk/nextjs/server"
import { AdminOrganizationView } from "@/db/schema/organizations-schema"

// --- Create Organization Action ---
export async function createOrganizationAction(
  data: InsertOrganization
): Promise<ActionState<SelectOrganization>> {
  const { userId } = await auth()
  if (!userId) {
    return { isSuccess: false, message: "Unauthorized: User not logged in." }
  }
  const canCreate = await hasPermission(userId, "create", "organizations")
  if (!canCreate) {
    return {
      isSuccess: false,
      message: "Forbidden: You do not have permission to create organizations."
    }
  }

  try {
    if (!data.name) {
      return { isSuccess: false, message: "Organization name is required." }
    }

    const [newOrganization] = await db
      .insert(organizationsTable)
      .values(data)
      .returning()

    if (!newOrganization) {
      return { isSuccess: false, message: "Failed to create organization." }
    }

    // Create audit log entry
    const auditLogData: CreateAuditLogInput = {
      actionCategory: "OrganizationManagement",
      actionType: "OrganizationCreated",
      targetEntityType: "Organization",
      targetEntityId: newOrganization.id,
      details: { name: newOrganization.name }
    }
    await createAuditLogAction(auditLogData)
    // We don't typically need to check the result of the audit log for the primary action's success,
    // but errors in audit logging will be console logged by createAuditLogAction itself.

    return {
      isSuccess: true,
      message: "Organization created successfully.",
      data: newOrganization
    }
  } catch (error) {
    console.error("Error creating organization:", error)
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error"
    return {
      isSuccess: false,
      message: `Failed to create organization: ${errorMessage}`
    }
  }
}

// --- Get Organization By ID Action ---
export async function getOrganizationByIdAction(
  id: string
): Promise<ActionState<SelectOrganization | null>> {
  const { userId } = await auth()
  if (!userId) {
    return { isSuccess: false, message: "Unauthorized: User not logged in." }
  }

  const canViewGlobally = await hasPermission(userId, "view", "organizations")

  const isSysAdmin = await checkUserRole(userId, "System Administrator")

  if (!canViewGlobally && !isSysAdmin) {
    return {
      isSuccess: false,
      message:
        "Forbidden: You do not have permission to view this organization directly by ID without broader view rights or admin privileges."
    }
  }

  try {
    if (!id) {
      return { isSuccess: false, message: "Organization ID is required." }
    }
    const organization = await db.query.organizations.findFirst({
      where: eq(organizationsTable.id, id)
    })

    if (!organization) {
      return { isSuccess: true, message: "Organization not found.", data: null }
    }

    return {
      isSuccess: true,
      message: "Organization retrieved successfully.",
      data: organization
    }
  } catch (error) {
    console.error("Error getting organization by ID:", error)
    return { isSuccess: false, message: "Failed to retrieve organization." }
  }
}

export async function getOrganizationsCountAction(): Promise<
  ActionState<number>
> {
  const isSysAdmin = await requiresSystemAdmin()
  if (!isSysAdmin) {
    return {
      isSuccess: false,
      message: "Unauthorized. System admin rights required."
    }
  }

  try {
    const result = await db.select({ value: count() }).from(organizationsTable)
    const numOrganizations = result[0]?.value || 0
    return {
      isSuccess: true,
      message: "Organizations count retrieved successfully.",
      data: numOrganizations
    }
  } catch (error) {
    console.error("Error getting organizations count:", error)
    return { isSuccess: false, message: "Failed to get organizations count." }
  }
}

// --- Get Organizations Action (List) ---
interface GetOrganizationsParams {
  limit?: number
  offset?: number
  status?: (typeof organizationStatusEnum.enumValues)[number]
}

export async function getOrganizationsAction(
  params: GetOrganizationsParams = {}
): Promise<ActionState<SelectOrganization[]>> {
  const { userId } = await auth()
  if (!userId) {
    return { isSuccess: false, message: "Unauthorized: User not logged in." }
  }
  const canViewList = await hasPermission(userId, "view", "organizations")
  if (!canViewList) {
    return {
      isSuccess: false,
      message: "Forbidden: You do not have permission to list organizations."
    }
  }

  const { limit = 10, offset = 0, status } = params

  try {
    const queryOptions = {
      orderBy: [desc(organizationsTable.createdAt)],
      limit: limit,
      offset: offset,
      where: status ? eq(organizationsTable.status, status) : undefined
    }

    const organizations = await db.query.organizations.findMany(queryOptions)

    return {
      isSuccess: true,
      message: "Organizations retrieved successfully.",
      data: organizations
    }
  } catch (error) {
    console.error("Error getting organizations:", error)
    return { isSuccess: false, message: "Failed to retrieve organizations." }
  }
}

// --- Update Organization Action ---
export async function updateOrganizationAction(
  id: string,
  data: Partial<Omit<InsertOrganization, "id">>
): Promise<ActionState<SelectOrganization>> {
  const { userId } = await auth()
  if (!userId) {
    return { isSuccess: false, message: "Unauthorized: User not logged in." }
  }
  const canManage = await hasPermission(userId, "manage", "organizations")
  if (!canManage) {
    return {
      isSuccess: false,
      message:
        "Forbidden: You do not have permission to update this organization."
    }
  }

  try {
    if (!id) {
      return {
        isSuccess: false,
        message: "Organization ID is required for update."
      }
    }
    if (Object.keys(data).length === 0) {
      return { isSuccess: false, message: "No data provided for update." }
    }

    const [updatedOrganization] = await db
      .update(organizationsTable)
      .set({
        ...data,
        updatedAt: new Date() // Explicitly set updatedAt
      })
      .where(eq(organizationsTable.id, id))
      .returning()

    if (!updatedOrganization) {
      return {
        isSuccess: false,
        message: "Organization not found or failed to update."
      }
    }

    // Create audit log entry for organization update
    const auditLogData: CreateAuditLogInput = {
      actionCategory: "OrganizationManagement",
      actionType: "OrganizationUpdated",
      targetEntityType: "Organization",
      targetEntityId: updatedOrganization.id,
      details: { updatedFields: Object.keys(data) } // Log which fields were part of the update operation
    }
    await createAuditLogAction(auditLogData)

    return {
      isSuccess: true,
      message: "Organization updated successfully.",
      data: updatedOrganization
    }
  } catch (error) {
    console.error("Error updating organization:", error)
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error"
    return {
      isSuccess: false,
      message: `Failed to update organization: ${errorMessage}`
    }
  }
}

// --- Delete Organization Action ---
export async function deleteOrganizationAction(
  id: string
): Promise<ActionState<void>> {
  const { userId } = await auth()
  if (!userId) {
    return { isSuccess: false, message: "Unauthorized: User not logged in." }
  }
  const canManage = await hasPermission(userId, "manage", "organizations")
  if (!canManage) {
    return {
      isSuccess: false,
      message:
        "Forbidden: You do not have permission to delete this organization."
    }
  }

  try {
    if (!id) {
      return {
        isSuccess: false,
        message: "Organization ID is required for deletion."
      }
    }

    const result = await db
      .delete(organizationsTable)
      .where(eq(organizationsTable.id, id))
      .returning({ deletedId: organizationsTable.id })

    if (result.length === 0 || !result[0].deletedId) {
      return {
        isSuccess: false,
        message: "Organization not found or failed to delete."
      }
    }

    return {
      isSuccess: true,
      message: "Organization deleted successfully.",
      data: undefined
    }
  } catch (error) {
    console.error("Error deleting organization:", error)
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error"
    return {
      isSuccess: false,
      message: `Failed to delete organization: ${errorMessage}`
    }
  }
}

// --- Get Managed Organizations Action (For Node Officers) ---
export async function getManagedOrganizationsAction(): Promise<
  ActionState<SelectOrganization[]>
> {
  const { userId } = await auth()
  if (!userId) {
    return { isSuccess: false, message: "Unauthorized: User not logged in." }
  }

  // Optional: Check if the user even has the Node Officer role globally,
  // though the main check is the join for isNodeOfficer = true.
  // const isNO = await checkUserRole(userId, "Node Officer");
  // if (!isNO) {
  //   return { isSuccess: true, message: "User is not a Node Officer.", data: [] };
  // }

  try {
    const managedOrganizations = await db
      .select({
        id: organizationsTable.id,
        name: organizationsTable.name,
        description: organizationsTable.description,
        primaryContactName: organizationsTable.primaryContactName,
        primaryContactEmail: organizationsTable.primaryContactEmail,
        primaryContactPhone: organizationsTable.primaryContactPhone,
        websiteUrl: organizationsTable.websiteUrl,
        address: organizationsTable.address,
        logoUrl: organizationsTable.logoUrl,
        nodeOfficerId: organizationsTable.nodeOfficerId,
        status: organizationsTable.status,
        createdAt: organizationsTable.createdAt,
        updatedAt: organizationsTable.updatedAt
      })
      .from(organizationsTable)
      .innerJoin(
        userOrganizationsTable,
        eq(organizationsTable.id, userOrganizationsTable.organizationId)
      )
      .where(
        and(
          eq(userOrganizationsTable.userId, userId),
          eq(userOrganizationsTable.role, "Node Officer")
        )
      )
      .orderBy(desc(organizationsTable.name))

    return {
      isSuccess: true,
      message: "Managed organizations retrieved successfully.",
      data: managedOrganizations
    }
  } catch (error) {
    console.error("Error getting managed organizations:", error)
    return {
      isSuccess: false,
      message: "Failed to retrieve managed organizations."
    }
  }
}

// --- Enhanced Get Organizations Admin Action with advanced filtering ---
interface GetOrganizationsAdminOptions {
  page?: number
  limit?: number
  searchTerm?: string
  status?: (typeof organizationStatusEnum.enumValues)[number]
  sortBy?: "name" | "createdAt" | "memberCount" | "status"
  sortOrder?: "asc" | "desc"
  nodeOfficerId?: string
}

export async function getOrganizationsAdminAction(
  options: GetOrganizationsAdminOptions = {}
): Promise<
  ActionState<{ organizations: AdminOrganizationView[]; totalCount: number }>
> {
  const { userId } = await auth()
  if (!userId) {
    return { isSuccess: false, message: "Unauthorized: User not logged in." }
  }

  const isAdmin = await hasPermission(userId, "manage", "organizations")
  if (!isAdmin) {
    return {
      isSuccess: false,
      message:
        "Forbidden: Admin privileges required to view detailed organization data."
    }
  }

  try {
    const {
      page = 1,
      limit = 10,
      searchTerm = "",
      status,
      sortBy = "createdAt",
      sortOrder = "desc",
      nodeOfficerId
    } = options

    const offset = (page - 1) * limit

    // Build base query for organizations - removing nodeOfficerId temporarily
    let query = db
      .select({
        id: organizationsTable.id,
        name: organizationsTable.name,
        description: organizationsTable.description,
        primaryContactName: organizationsTable.primaryContactName,
        primaryContactEmail: organizationsTable.primaryContactEmail,
        primaryContactPhone: organizationsTable.primaryContactPhone,
        websiteUrl: organizationsTable.websiteUrl,
        address: organizationsTable.address,
        logoUrl: organizationsTable.logoUrl,
        // Temporarily remove nodeOfficerId until migration is run
        // nodeOfficerId: organizationsTable.nodeOfficerId,
        status: organizationsTable.status,
        createdAt: organizationsTable.createdAt,
        updatedAt: organizationsTable.updatedAt,
        memberCount: sql<number>`COUNT(DISTINCT ${userOrganizationsTable.userId})`
      })
      .from(organizationsTable)
      .leftJoin(
        userOrganizationsTable,
        eq(userOrganizationsTable.organizationId, organizationsTable.id)
      )
      .groupBy(organizationsTable.id)
      .$dynamic()

    // Apply filters
    const conditions = []

    // Search term filter (name or description)
    if (searchTerm) {
      conditions.push(
        or(
          ilike(organizationsTable.name, `%${searchTerm}%`),
          ilike(organizationsTable.description || "", `%${searchTerm}%`),
          ilike(organizationsTable.primaryContactName || "", `%${searchTerm}%`),
          ilike(organizationsTable.primaryContactEmail || "", `%${searchTerm}%`)
        )
      )
    }

    // Status filter
    if (status) {
      conditions.push(eq(organizationsTable.status, status))
    }

    // Comment out Node Officer filter until we have the column
    // if (nodeOfficerId) {
    //   conditions.push(eq(organizationsTable.nodeOfficerId, nodeOfficerId))
    // }

    // Apply all conditions if any exist
    if (conditions.length > 0) {
      query = query.where(and(...conditions))
    }

    // Get total count for pagination
    const countQuery = db
      .select({
        count: sql<number>`COUNT(DISTINCT ${organizationsTable.id})`
      })
      .from(organizationsTable)
      .$dynamic()

    // Apply same filtering conditions to count query
    if (conditions.length > 0) {
      countQuery.where(and(...conditions))
    }

    const [countResult] = await countQuery
    const totalCount = countResult?.count || 0

    // Apply sorting
    if (sortBy === "name") {
      query = query.orderBy(
        sortOrder === "asc"
          ? asc(organizationsTable.name)
          : desc(organizationsTable.name)
      )
    } else if (sortBy === "status") {
      query = query.orderBy(
        sortOrder === "asc"
          ? asc(organizationsTable.status)
          : desc(organizationsTable.status)
      )
    } else if (sortBy === "memberCount") {
      query = query.orderBy(
        sortOrder === "asc"
          ? sql`COUNT(DISTINCT ${userOrganizationsTable.userId}) ASC`
          : sql`COUNT(DISTINCT ${userOrganizationsTable.userId}) DESC`
      )
    } else {
      // Default to createdAt
      query = query.orderBy(
        sortOrder === "asc"
          ? asc(organizationsTable.createdAt)
          : desc(organizationsTable.createdAt)
      )
    }

    // Apply pagination
    query = query.limit(limit).offset(offset)

    // Execute the query
    const organizations = await query

    // If no organizations found, return early
    if (organizations.length === 0) {
      return {
        isSuccess: true,
        message: "No organizations found.",
        data: { organizations: [], totalCount }
      }
    }

    // For now, return without node officer information
    const organizationsWithExtras = organizations.map(org => {
      return { ...org } as AdminOrganizationView
    })

    return {
      isSuccess: true,
      message: "Organizations retrieved successfully.",
      data: {
        organizations: organizationsWithExtras,
        totalCount
      }
    }
  } catch (error) {
    console.error("Error in getOrganizationsAdminAction:", error)
    return {
      isSuccess: false,
      message: "Failed to retrieve organizations. Please try again."
    }
  }
}

// Add a new action to assign a node officer to an organization
export async function assignNodeOfficerAction(
  organizationId: string,
  nodeOfficerId: string | null
): Promise<ActionState<SelectOrganization>> {
  const { userId } = await auth()
  if (!userId) {
    return { isSuccess: false, message: "Unauthorized: User not logged in." }
  }

  // Temporarily returning error until migration is complete
  return {
    isSuccess: false,
    message:
      "This feature is currently unavailable. Database migration required to add nodeOfficerId column."
  }

  // TODO: Uncomment and fix when migration is complete
  /*
  const isAdmin = await hasPermission(userId, "manage", "organizations")
  if (!isAdmin) {
    return {
      isSuccess: false,
      message: "Forbidden: Admin privileges required to assign node officers."
    }
  }

  try {
    // If nodeOfficerId is provided, verify the user exists and has node officer role
    if (nodeOfficerId) {
      const isNodeOfficer = await checkUserRole(nodeOfficerId, "Node Officer")
      if (!isNodeOfficer) {
        return {
          isSuccess: false,
          message: "The selected user is not a Node Officer."
        }
      }
    }

    // Update the organization
    const [updatedOrganization] = await db
      .update(organizationsTable)
      .set({
        nodeOfficerId,
        updatedAt: new Date()
      })
      .where(eq(organizationsTable.id, organizationId))
      .returning()

    if (!updatedOrganization) {
      return {
        isSuccess: false,
        message: "Organization not found or update failed."
      }
    }

    // Create audit log entry
    const auditLogData: CreateAuditLogInput = {
      actionCategory: "OrganizationManagement",
      actionType: nodeOfficerId ? "NodeOfficerAssigned" : "NodeOfficerRemoved",
      targetEntityType: "Organization",
      targetEntityId: organizationId,
      details: nodeOfficerId ? { nodeOfficerId } : { removedAssignment: true }
    }
    await createAuditLogAction(auditLogData)

    return {
      isSuccess: true,
      message: nodeOfficerId
        ? "Node Officer assigned successfully."
        : "Node Officer assignment removed.",
      data: updatedOrganization
    }
  } catch (error) {
    console.error("Error assigning node officer:", error)
    return {
      isSuccess: false,
      message: "Failed to update Node Officer assignment."
    }
  }
  */
}
