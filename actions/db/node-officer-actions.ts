"use server"

import { db } from "@/db/db"
import {
  userOrganizationsTable,
  organizationsTable,
  // usersTable, // Removed: Not using a local usersTable for profiles
  rolesTable,
  userRolesTable,
  roleEnum
} from "@/db/schema"
import { ActionState } from "@/types"
import { auth, clerkClient, User as ClerkUserType } from "@clerk/nextjs/server"
import { and, eq, inArray } from "drizzle-orm"
import { isNodeOfficerForOrg, hasPermission } from "@/lib/rbac"
import type { UserOrganizationRole } from "@/types"

export interface OrganizationUser {
  clerkId: string
  firstName: string | null
  lastName: string | null
  emailAddress: string
  imageUrl: string
  // Roles relevant within the organization context, could be global roles
  roles: Array<(typeof roleEnum.enumValues)[number]>
  joinedOrganizationAt?: Date | null // from userOrganizationsTable.createdAt
  organizationRole?: UserOrganizationRole | null // Role from userOrganizationsTable
}

export interface OrganizationUsersData {
  users: OrganizationUser[]
  counts: {
    metadataCreator: number
    metadataApprover: number
    nodeOfficer: number // Count Node Officers in the organization
    total: number
  }
}

// --- Get Users in an Organization (for Node Officer) ---
export async function getOrganizationUsersForNOAction(
  organizationId: string
): Promise<ActionState<OrganizationUsersData>> {
  const { userId: nodeOfficerId } = await auth()
  if (!nodeOfficerId) {
    return {
      isSuccess: false,
      message: "Unauthorized: Node Officer not logged in."
    }
  }

  // 1. RBAC: Check if current user is Node Officer for the given organization
  const isNO = await isNodeOfficerForOrg(nodeOfficerId, organizationId)
  if (!isNO) {
    return {
      isSuccess: false,
      message: "Forbidden: You are not a Node Officer for this organization."
    }
  }

  // 2. RBAC: Check if Node Officer has permission to view organization users
  const canViewOrgUsers = await hasPermission(
    nodeOfficerId,
    "view",
    "organization_users"
  )
  if (!canViewOrgUsers) {
    return {
      isSuccess: false,
      message:
        "Forbidden: You do not have permission to view users in this organization."
    }
  }

  try {
    // 3. Get user IDs associated with the organization
    const orgUserEntries = await db
      .select({
        userId: userOrganizationsTable.userId,
        joinedAt: userOrganizationsTable.createdAt,
        organizationRole: userOrganizationsTable.role // Fetch the organization-specific role
      })
      .from(userOrganizationsTable)
      .where(eq(userOrganizationsTable.organizationId, organizationId))

    if (orgUserEntries.length === 0) {
      return {
        isSuccess: true,
        message: "No users found in this organization.",
        data: {
          users: [],
          counts: {
            metadataCreator: 0,
            metadataApprover: 0,
            nodeOfficer: 0,
            total: 0
          }
        }
      }
    }

    const organizationUserIds = orgUserEntries.map(entry => entry.userId)

    // 4. Fetch Clerk user details for these user IDs
    const client = await clerkClient()
    const clerkUsersResponse = await client.users.getUserList({
      userId: organizationUserIds,
      limit: organizationUserIds.length // Fetch all identified users
    })

    const clerkUsers = clerkUsersResponse.data

    // 5. Fetch global roles for these users from userRolesTable
    const userRoleAssignments = await db
      .select({
        userId: userRolesTable.userId,
        roleName: rolesTable.name
      })
      .from(userRolesTable)
      .innerJoin(rolesTable, eq(userRolesTable.roleId, rolesTable.id))
      .where(inArray(userRolesTable.userId, organizationUserIds))

    const userRolesMap = new Map<
      string,
      Array<(typeof roleEnum.enumValues)[number]>
    >()
    userRoleAssignments.forEach(assignment => {
      if (!userRolesMap.has(assignment.userId)) {
        userRolesMap.set(assignment.userId, [])
      }
      userRolesMap.get(assignment.userId)!.push(assignment.roleName)
    })

    // 6. Combine data into OrganizationUser objects
    const organizationUsers: OrganizationUser[] = clerkUsers.map(
      (clerkUser: ClerkUserType) => {
        const orgEntry = orgUserEntries.find(e => e.userId === clerkUser.id)
        return {
          clerkId: clerkUser.id,
          firstName: clerkUser.firstName,
          lastName: clerkUser.lastName,
          emailAddress:
            clerkUser.emailAddresses.find(
              e => e.id === clerkUser.primaryEmailAddressId
            )?.emailAddress ||
            clerkUser.emailAddresses[0]?.emailAddress ||
            "N/A",
          imageUrl: clerkUser.imageUrl,
          roles: userRolesMap.get(clerkUser.id) || ["Registered User"], // Default to 'Registered User' if no specific roles
          joinedOrganizationAt: orgEntry?.joinedAt,
          organizationRole:
            orgEntry?.organizationRole as UserOrganizationRole | null // Add organizationRole here
        }
      }
    )

    // Calculate counts
    const counts = {
      metadataCreator: 0,
      metadataApprover: 0,
      nodeOfficer: 0,
      total: organizationUsers.length
    }

    organizationUsers.forEach(user => {
      if (user.roles.includes("Node Officer")) counts.nodeOfficer++
      if (user.roles.includes("Metadata Creator")) counts.metadataCreator++
      if (user.roles.includes("Metadata Approver")) counts.metadataApprover++
    })

    return {
      isSuccess: true,
      message: "Organization users retrieved successfully.",
      data: { users: organizationUsers, counts }
    }
  } catch (error) {
    console.error(
      `Error getting users for organization ${organizationId}:`,
      error
    )
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error"
    return {
      isSuccess: false,
      message: `Failed to retrieve organization users: ${errorMessage}`
    }
  }
}

// Placeholder for assignOrganizationRoleForNOAction

// --- Add User to Organization (for Node Officer) ---
export async function addUserToOrganizationForNOAction(
  organizationId: string,
  emailToAdd: string,
  initialRoleName?: (typeof roleEnum.enumValues)[number] // Allow any valid role from enum
): Promise<ActionState<{ userId: string; organizationId: string }>> {
  const { userId: nodeOfficerId } = await auth()
  if (!nodeOfficerId) {
    return {
      isSuccess: false,
      message: "Unauthorized: Node Officer not logged in."
    }
  }

  // 1. RBAC: Check if current user is Node Officer for the given organization
  const isNO = await isNodeOfficerForOrg(nodeOfficerId, organizationId)
  if (!isNO) {
    return {
      isSuccess: false,
      message: "Forbidden: You are not a Node Officer for this organization."
    }
  }

  // 2. RBAC: Check if Node Officer has permission to manage organization users
  const canManageOrgUsers = await hasPermission(
    nodeOfficerId,
    "manage",
    "organization_users"
  )
  if (!canManageOrgUsers) {
    return {
      isSuccess: false,
      message:
        "Forbidden: You do not have permission to manage users in this organization."
    }
  }

  if (!emailToAdd) {
    return { isSuccess: false, message: "Email address to add is required." }
  }

  try {
    // 3. Find Clerk user by email
    const clerk = await clerkClient()
    const clerkUsers = await clerk.users.getUserList({
      emailAddress: [emailToAdd]
    })
    if (!clerkUsers.data || clerkUsers.data.length === 0) {
      return {
        isSuccess: false,
        message: `User with email '${emailToAdd}' not found.`
      }
    }
    const targetUser = clerkUsers.data[0]
    const targetUserId = targetUser.id

    // 4. Check if user is already in the organization
    const existingAssociation = await db
      .select({ userId: userOrganizationsTable.userId })
      .from(userOrganizationsTable)
      .where(
        and(
          eq(userOrganizationsTable.userId, targetUserId),
          eq(userOrganizationsTable.organizationId, organizationId)
        )
      )
      .limit(1)

    if (existingAssociation.length > 0) {
      return {
        isSuccess: false,
        message: `User ${targetUser.firstName || targetUserId} is already in this organization.`
      }
    }

    await db.transaction(async tx => {
      // 5. Add entry to userOrganizationsTable
      await tx.insert(userOrganizationsTable).values({
        userId: targetUserId,
        organizationId: organizationId,
        role: "Metadata Creator" // New users added by NO are Metadata Creators by default
      })

      // 6. If initialRoleName is provided, assign it
      if (initialRoleName) {
        if (!roleEnum.enumValues.includes(initialRoleName)) {
          // This check is more for JS safety, TS should catch it.
          throw new Error(`Invalid role name: ${initialRoleName}`)
        }
        const roleEntry = await tx
          .select({ id: rolesTable.id })
          .from(rolesTable)
          .where(eq(rolesTable.name, initialRoleName))
          .limit(1)

        if (!roleEntry || roleEntry.length === 0) {
          // Should not happen if initialRoleName is from roleEnum and DB is seeded
          throw new Error(`Role '${initialRoleName}' not found in database.`)
        }
        const roleIdToAssign = roleEntry[0].id

        // Remove any existing instances of this specific role for the user before adding
        // This makes the assignment idempotent for the specific role.
        // Or, decide if user can have multiple instances of same global role (unlikely needed for MC/MA)
        await tx
          .delete(userRolesTable)
          .where(
            and(
              eq(userRolesTable.userId, targetUserId),
              eq(userRolesTable.roleId, roleIdToAssign)
            )
          )

        await tx.insert(userRolesTable).values({
          userId: targetUserId,
          roleId: roleIdToAssign
        })

        // Update Clerk metadata if assigning a significant role
        if (
          initialRoleName === "Metadata Creator" ||
          initialRoleName === "Metadata Approver"
        ) {
          const clerkForMetaUpdate = await clerkClient()
          await clerkForMetaUpdate.users.updateUserMetadata(targetUserId, {
            publicMetadata: {
              // Append or set role. Be mindful of existing metadata.
              // This simple approach overwrites. A more robust one might merge.
              role: initialRoleName
            }
          })
        }
      }
    })

    return {
      isSuccess: true,
      message: `User ${targetUser.firstName || targetUserId} added to organization successfully${initialRoleName ? " with role " + initialRoleName : ""}.`,
      data: { userId: targetUserId, organizationId: organizationId }
    }
  } catch (error) {
    console.error(`Error adding user to organization ${organizationId}:`, error)
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error"
    return {
      isSuccess: false,
      message: `Failed to add user to organization: ${errorMessage}`
    }
  }
}

// --- Remove User From Organization (for Node Officer) ---
export async function removeUserFromOrganizationForNOAction(
  organizationId: string,
  targetUserId: string
): Promise<ActionState<{ userId: string; organizationId: string }>> {
  const { userId: nodeOfficerId } = await auth()
  if (!nodeOfficerId) {
    return {
      isSuccess: false,
      message: "Unauthorized: Node Officer not logged in."
    }
  }

  // 1. RBAC Checks
  const isNO = await isNodeOfficerForOrg(nodeOfficerId, organizationId)
  if (!isNO) {
    return {
      isSuccess: false,
      message: "Forbidden: You are not a Node Officer for this organization."
    }
  }
  const canManageOrgUsers = await hasPermission(
    nodeOfficerId,
    "manage",
    "organization_users"
  )
  if (!canManageOrgUsers) {
    return {
      isSuccess: false,
      message:
        "Forbidden: You do not have permission to manage users in this organization."
    }
  }

  if (!targetUserId) {
    return { isSuccess: false, message: "Target user ID is required." }
  }

  // Prevent Node Officer from removing themselves from the org via this action
  if (nodeOfficerId === targetUserId) {
    return {
      isSuccess: false,
      message:
        "Node Officers cannot remove themselves from the organization using this action."
    }
  }

  try {
    // 2. Verify targetUserId is part of organizationId
    const orgUserLink = await db
      .select({ userId: userOrganizationsTable.userId })
      .from(userOrganizationsTable)
      .where(
        and(
          eq(userOrganizationsTable.userId, targetUserId),
          eq(userOrganizationsTable.organizationId, organizationId)
        )
      )
      .limit(1)

    if (orgUserLink.length === 0) {
      return {
        isSuccess: false,
        message: "Target user is not part of this organization."
      }
    }

    // 3. Get IDs for 'Metadata Creator' and 'Metadata Approver' roles
    const rolesToClean = ["Metadata Creator", "Metadata Approver"] as const
    const roleEntries = await db
      .select({ id: rolesTable.id, name: rolesTable.name })
      .from(rolesTable)
      .where(inArray(rolesTable.name, [...rolesToClean]))

    const roleIdsToClean = roleEntries.map(r => r.id)

    await db.transaction(async tx => {
      // 4. Remove entry from userOrganizationsTable
      await tx
        .delete(userOrganizationsTable)
        .where(
          and(
            eq(userOrganizationsTable.userId, targetUserId),
            eq(userOrganizationsTable.organizationId, organizationId)
          )
        )

      // 5. Remove 'Metadata Creator' or 'Metadata Approver' roles from userRolesTable if they exist
      if (roleIdsToClean.length > 0) {
        await tx
          .delete(userRolesTable)
          .where(
            and(
              eq(userRolesTable.userId, targetUserId),
              inArray(userRolesTable.roleId, roleIdsToClean)
            )
          )
      }

      // 6. Update Clerk publicMetadata
      const client = await clerkClient()
      const clerkUser = await client.users.getUser(targetUserId)
      const currentClerkRole = clerkUser.publicMetadata?.role as
        | string
        | undefined

      if (currentClerkRole && rolesToClean.includes(currentClerkRole as any)) {
        // If their Clerk role was one of the ones we might have just removed context for.
        await client.users.updateUserMetadata(targetUserId, {
          publicMetadata: {
            role: "Registered User" // Default back to Registered User
          }
        })
      }
    })

    return {
      isSuccess: true,
      message: `User removed from organization successfully.`,
      data: { userId: targetUserId, organizationId: organizationId }
    }
  } catch (error) {
    console.error(
      `Error removing user ${targetUserId} from org ${organizationId}:`,
      error
    )
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error"
    return {
      isSuccess: false,
      message: `Failed to remove user from organization: ${errorMessage}`
    }
  }
}

// --- Assign Organization Role (for Node Officer) ---
export async function assignOrganizationRoleForNOAction(
  organizationId: string,
  targetUserId: string,
  roleToAssignName: "Metadata Creator" | "Metadata Approver" // Specific roles NO can assign
): Promise<ActionState<{ userId: string; roleAssigned: string }>> {
  const { userId: nodeOfficerId } = await auth()
  if (!nodeOfficerId) {
    return {
      isSuccess: false,
      message: "Unauthorized: Node Officer not logged in."
    }
  }

  // 1. RBAC: Check if current user is Node Officer for the given organization
  const isNO = await isNodeOfficerForOrg(nodeOfficerId, organizationId)
  if (!isNO) {
    return {
      isSuccess: false,
      message: "Forbidden: You are not a Node Officer for this organization."
    }
  }

  // 2. RBAC: Check if Node Officer has permission to manage organization users
  const canManageOrgUsers = await hasPermission(
    nodeOfficerId,
    "manage",
    "organization_users"
  )
  if (!canManageOrgUsers) {
    return {
      isSuccess: false,
      message:
        "Forbidden: You do not have permission to manage roles in this organization."
    }
  }

  if (!targetUserId || !roleToAssignName) {
    return {
      isSuccess: false,
      message: "Target user ID and role name are required."
    }
  }

  try {
    // 3. Verify targetUserId is part of organizationId
    const orgUserLink = await db
      .select({ userId: userOrganizationsTable.userId })
      .from(userOrganizationsTable)
      .where(
        and(
          eq(userOrganizationsTable.userId, targetUserId),
          eq(userOrganizationsTable.organizationId, organizationId)
        )
      )
      .limit(1)

    if (orgUserLink.length === 0) {
      return {
        isSuccess: false,
        message: "Target user is not part of this organization."
      }
    }

    // 4. Get Role ID from rolesTable for roleToAssignName
    const roleEntry = await db
      .select({ id: rolesTable.id })
      .from(rolesTable)
      .where(eq(rolesTable.name, roleToAssignName))
      .limit(1)

    if (!roleEntry || roleEntry.length === 0) {
      return {
        isSuccess: false,
        message: `Role '${roleToAssignName}' not found.` // Should not happen with TS check
      }
    }
    const roleIdToAssign = roleEntry[0].id

    await db.transaction(async tx => {
      // 5. Add to userRolesTable (ensure it's idempotent or unique)
      // For simplicity, remove existing then add. Or use ON CONFLICT DO NOTHING if role is unique per user.
      // Current global role system means a user can have this role from other contexts too.
      // For org-specific assignment, this simply ensures they have it.
      // If a user can only have ONE of (MC, MA) within an org, more complex logic is needed here
      // to remove the other role first.
      // For now, just ensure the target role is assigned.

      // To make it truly idempotent for THIS specific role for this user:
      await tx
        .delete(userRolesTable)
        .where(
          and(
            eq(userRolesTable.userId, targetUserId),
            eq(userRolesTable.roleId, roleIdToAssign)
          )
        )

      await tx.insert(userRolesTable).values({
        userId: targetUserId,
        roleId: roleIdToAssign
      })

      // 6. Update Clerk publicMetadata
      // This will set their displayed role to this one. Consider if a user has multiple significant roles.
      const client = await clerkClient()
      await client.users.updateUserMetadata(targetUserId, {
        publicMetadata: {
          role: roleToAssignName
        }
      })
    })

    return {
      isSuccess: true,
      message: `Role '${roleToAssignName}' assigned to user successfully.`, // Add user identifier if available
      data: { userId: targetUserId, roleAssigned: roleToAssignName }
    }
  } catch (error) {
    console.error(
      `Error assigning role '${roleToAssignName}' to user ${targetUserId} in org ${organizationId}:`,
      error
    )
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error"
    return {
      isSuccess: false,
      message: `Failed to assign role: ${errorMessage}`
    }
  }
}

// --- Remove Organization Role (for Node Officer) ---
export async function removeOrganizationRoleForNOAction(
  organizationId: string,
  targetUserId: string,
  roleToRemoveName: "Metadata Creator" | "Metadata Approver"
): Promise<ActionState<{ userId: string; roleRemoved: string }>> {
  const { userId: nodeOfficerId } = await auth()
  if (!nodeOfficerId) {
    return {
      isSuccess: false,
      message: "Unauthorized: Node Officer not logged in."
    }
  }

  // 1. RBAC Checks (similar to assign role)
  const isNO = await isNodeOfficerForOrg(nodeOfficerId, organizationId)
  if (!isNO) {
    return {
      isSuccess: false,
      message: "Forbidden: You are not a Node Officer for this organization."
    }
  }
  const canManageOrgUsers = await hasPermission(
    nodeOfficerId,
    "manage",
    "organization_users"
  )
  if (!canManageOrgUsers) {
    return {
      isSuccess: false,
      message:
        "Forbidden: You do not have permission to manage roles in this organization."
    }
  }

  if (!targetUserId || !roleToRemoveName) {
    return {
      isSuccess: false,
      message: "Target user ID and role name are required."
    }
  }

  try {
    // 2. Verify targetUserId is part of organizationId (optional, but good practice)
    const orgUserLink = await db
      .select({ userId: userOrganizationsTable.userId })
      .from(userOrganizationsTable)
      .where(
        and(
          eq(userOrganizationsTable.userId, targetUserId),
          eq(userOrganizationsTable.organizationId, organizationId)
        )
      )
      .limit(1)

    if (orgUserLink.length === 0) {
      return {
        isSuccess: false,
        message:
          "Target user is not part of this organization (or error checking)."
      }
    }

    // 3. Get Role ID from rolesTable for roleToRemoveName
    const roleEntry = await db
      .select({ id: rolesTable.id })
      .from(rolesTable)
      .where(eq(rolesTable.name, roleToRemoveName))
      .limit(1)

    if (!roleEntry || roleEntry.length === 0) {
      return {
        isSuccess: false,
        message: `Role '${roleToRemoveName}' not found.`
      }
    }
    const roleIdToRemove = roleEntry[0].id

    await db.transaction(async tx => {
      // 4. Remove from userRolesTable
      await tx
        .delete(userRolesTable)
        .where(
          and(
            eq(userRolesTable.userId, targetUserId),
            eq(userRolesTable.roleId, roleIdToRemove)
          )
        )

      // 5. Update Clerk publicMetadata
      const client = await clerkClient()
      const clerkUser = await client.users.getUser(targetUserId) // Get current metadata

      if (clerkUser.publicMetadata?.role === roleToRemoveName) {
        // If the removed role was the primary one in metadata, set to Registered User or determine new primary.
        // For now, set to "Registered User".
        await client.users.updateUserMetadata(targetUserId, {
          publicMetadata: {
            role: "Registered User"
          }
        })
      }
      // If it wasn't the primary role, we might not need to change publicMetadata,
      // or we might want to recalculate based on remaining roles. This is simpler.
    })

    return {
      isSuccess: true,
      message: `Role '${roleToRemoveName}' removed from user successfully.`,
      data: { userId: targetUserId, roleRemoved: roleToRemoveName }
    }
  } catch (error) {
    console.error(
      `Error removing role '${roleToRemoveName}' from user ${targetUserId} in org ${organizationId}:`,
      error
    )
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error"
    return {
      isSuccess: false,
      message: `Failed to remove role: ${errorMessage}`
    }
  }
}
