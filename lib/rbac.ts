"use server"

import { db } from "@/db/db"
import {
  userRolesTable,
  rolesTable,
  rolePermissionsTable,
  permissionsTable,
  roleEnum,
  userOrganizationsTable
} from "@/db/schema"
import { eq, inArray, sql, and } from "drizzle-orm"
import { auth } from "@clerk/nextjs/server"

interface AuthCheckResult {
  isAllowed: boolean
  userId: string | null
  message?: string
  userRoles?: string[] // Optional: return the user's roles for further use
}

export interface Permission {
  action: string
  subject: string
}

/**
 * Retrieves all global roles for a given user.
 * @param userId - The ID of the user.
 * @returns A promise that resolves to an array of role names.
 */
export async function getUserRoles(
  userId: string
): Promise<Array<(typeof roleEnum.enumValues)[number]>> {
  if (!userId) return []

  try {
    const userRoleEntries = await db
      .select({
        roleName: rolesTable.name
      })
      .from(userRolesTable)
      .innerJoin(rolesTable, eq(userRolesTable.roleId, rolesTable.id))
      .where(eq(userRolesTable.userId, userId))

    return userRoleEntries.map(entry => entry.roleName)
  } catch (error) {
    console.error("Error fetching user roles:", error)
    return []
  }
}

/**
 * Checks if a user has a specific global role.
 * @param userId - The ID of the user.
 * @param targetRole - The name of the role to check for (must match roleEnum values).
 * @returns A promise that resolves to true if the user has the role, false otherwise.
 */
export async function checkUserRole(
  userId: string,
  targetRole: (typeof roleEnum.enumValues)[number]
): Promise<boolean> {
  if (!userId) return false
  const roles = await getUserRoles(userId)
  return roles.includes(targetRole)
}

/**
 * Retrieves all permissions for a given user based on their global roles.
 * @param userId - The ID of the user.
 * @returns A promise that resolves to an array of permission objects (action, subject).
 */
export async function getUserPermissions(
  userId: string
): Promise<Permission[]> {
  if (!userId) return []

  try {
    // Get role IDs for the user
    const userRoleIdsQuery = db
      .selectDistinct({ roleId: userRolesTable.roleId })
      .from(userRolesTable)
      .where(eq(userRolesTable.userId, userId))

    // Get permission IDs associated with those role IDs
    const permissionIdsQuery = db
      .selectDistinct({ permissionId: rolePermissionsTable.permissionId })
      .from(rolePermissionsTable)
      .where(sql`${rolePermissionsTable.roleId} IN (${userRoleIdsQuery})`)

    // Get the actual permissions (action, subject) for those permission IDs
    const userPermissions = await db
      .selectDistinct({
        action: permissionsTable.action,
        subject: permissionsTable.subject
      })
      .from(permissionsTable)
      .where(sql`${permissionsTable.id} IN (${permissionIdsQuery})`)
      .orderBy(permissionsTable.subject, permissionsTable.action) // Optional ordering

    return userPermissions
  } catch (error) {
    console.error(`Error fetching permissions for user ${userId}:`, error)
    return []
  }
}

/**
 * Checks if a user has a specific permission based on their global roles.
 * @param userId - The ID of the user.
 * @param action - The action of the permission (e.g., 'create', 'read').
 * @param subject - The subject of the permission (e.g., 'organization', 'metadataRecord').
 * @returns A promise that resolves to true if the user has the permission, false otherwise.
 */
export async function hasPermission(
  userId: string,
  action: string,
  subject: string
): Promise<boolean> {
  if (!userId) return false
  try {
    const userPermissions = await getUserPermissions(userId)
    return userPermissions.some(
      p => p.action === action && p.subject === subject
    )
  } catch (error) {
    console.error(
      `Error checking permission ${action}:${subject} for user ${userId}:`,
      error
    )
    return false // Deny permission on error
  }
}

/**
 * Checks if the currently authenticated user has at least one of the specified roles.
 * @param requiredRoles - An array of role names (e.g., ["admin", "super_admin"]).
 * @returns A promise that resolves to an AuthCheckResult.
 */
export async function requiresRole(
  requiredRoles: Array<(typeof roleEnum.enumValues)[number]>
): Promise<AuthCheckResult> {
  const authState = await auth()
  const userId = authState.userId

  if (!userId) {
    return {
      isAllowed: false,
      userId: null,
      message: "User not authenticated."
    }
  }

  if (requiredRoles.length === 0) {
    // If no roles are required, access is technically allowed based on role check, but this might indicate a misconfiguration.
    // Consider if this case should be an error or a specific type of allowance.
    return { isAllowed: true, userId, message: "No specific roles required." }
  }

  const userRoles = await getUserRoles(userId)
  const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role))

  if (!hasRequiredRole) {
    return {
      isAllowed: false,
      userId,
      userRoles,
      message: `Access denied. Requires one of the following roles: ${requiredRoles.join(", ")}. User has roles: ${userRoles.join(", ") || "None"}.`
    }
  }

  return { isAllowed: true, userId, userRoles }
}

/**
 * Convenience function to check if the current user is a system administrator.
 * Uses the role name "System Administrator" as defined in roleEnum.
 */
export async function requiresSystemAdmin(): Promise<AuthCheckResult> {
  return requiresRole(["System Administrator"])
}

// --- Organization-Specific RBAC ---

/**
 * Checks if a user is a Node Officer for a specific organization.
 * @param userId - The ID of the user.
 * @param organizationId - The ID of the organization.
 * @returns A promise that resolves to true if the user is a Node Officer for the org, false otherwise.
 */
export async function isNodeOfficerForOrg(
  userId: string,
  organizationId: string
): Promise<boolean> {
  if (!userId) return false

  // Validate organizationId is a valid UUID
  if (
    !organizationId ||
    !organizationId.match(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    )
  ) {
    console.warn(`Invalid organizationId provided: ${organizationId}`)
    return false
  }

  try {
    // Simply check if the user is associated with the specified organization as a Node Officer
    const association = await db
      .select({ associatedUserId: userOrganizationsTable.userId })
      .from(userOrganizationsTable)
      .where(
        and(
          eq(userOrganizationsTable.userId, userId),
          eq(userOrganizationsTable.organizationId, organizationId),
          eq(userOrganizationsTable.role, "Node Officer")
        )
      )
      .limit(1)

    return association.length > 0
  } catch (error) {
    console.error(
      `Error checking if user ${userId} is Node Officer for org ${organizationId}:`,
      error
    )
    return false
  }
}

/**
 * Checks if a user has a specific role for a specific organization.
 * @param userId - The ID of the user.
 * @param organizationId - The ID of the organization.
 * @param role - The role to check for.
 * @returns A promise that resolves to true if the user has the role for the org, false otherwise.
 */
export async function hasOrgRole(
  userId: string,
  organizationId: string,
  role: "Node Officer" | "Metadata Creator" | "Metadata Approver"
): Promise<boolean> {
  if (!userId) return false

  // Validate organizationId is a valid UUID
  if (
    !organizationId ||
    !organizationId.match(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    )
  ) {
    console.warn(`Invalid organizationId provided: ${organizationId}`)
    return false
  }

  try {
    const association = await db
      .select({ associatedUserId: userOrganizationsTable.userId })
      .from(userOrganizationsTable)
      .where(
        and(
          eq(userOrganizationsTable.userId, userId),
          eq(userOrganizationsTable.organizationId, organizationId),
          eq(userOrganizationsTable.role, role)
        )
      )
      .limit(1)

    return association.length > 0
  } catch (error) {
    console.error(
      `Error checking if user ${userId} has role ${role} for org ${organizationId}:`,
      error
    )
    return false
  }
}

// TODO:
// - Add functions for organization-specific permission checks
// - Consider caching for roles/permissions to reduce DB queries in a single request lifecycle.
