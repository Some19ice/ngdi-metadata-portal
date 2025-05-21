"use server"

import { db } from "@/db/db"
import {
  userOrganizationsTable,
  SelectUserOrganization,
  InsertUserOrganization,
  organizationsTable,
  SelectOrganization,
  organizationUserRoleEnum
} from "@/db/schema"
import { ActionState } from "@/types"
import { auth } from "@clerk/nextjs/server"
import { and, eq } from "drizzle-orm"
import { checkUserRole, requiresSystemAdmin } from "@/lib/rbac"

// CREATE - Assign a user to an organization with a role
export async function assignUserToOrganizationAction(
  assignment: InsertUserOrganization
): Promise<ActionState<SelectUserOrganization>> {
  const isSysAdmin = await requiresSystemAdmin()
  if (!isSysAdmin) {
    return {
      isSuccess: false,
      message: "Unauthorized. System admin rights required."
    }
  }

  try {
    // Check if the assignment already exists to prevent duplicates
    const existingAssignment = await db.query.userOrganizations.findFirst({
      where: and(
        eq(userOrganizationsTable.userId, assignment.userId),
        eq(userOrganizationsTable.organizationId, assignment.organizationId),
        eq(userOrganizationsTable.role, assignment.role) // Consider if role should be part of uniqueness
      )
    })

    if (existingAssignment) {
      return {
        isSuccess: false,
        message: "User is already assigned to this organization with this role."
      }
    }

    const [newUserOrganization] = await db
      .insert(userOrganizationsTable)
      .values(assignment)
      .returning()

    return {
      isSuccess: true,
      message: "User assigned to organization successfully.",
      data: newUserOrganization
    }
  } catch (error) {
    console.error("Error assigning user to organization:", error)
    return {
      isSuccess: false,
      message: "Failed to assign user to organization."
    }
  }
}

// READ - Get organizations a user is a Node Officer for
export async function getNodeOfficerManagedOrganizationsAction(): Promise<
  ActionState<SelectOrganization[]>
> {
  const { userId } = await auth()
  if (!userId) {
    return { isSuccess: false, message: "Unauthorized: User not logged in." }
  }

  try {
    const userOrgAssignments = await db
      .select({
        organizationId: userOrganizationsTable.organizationId
      })
      .from(userOrganizationsTable)
      .where(
        and(
          eq(userOrganizationsTable.userId, userId),
          eq(userOrganizationsTable.role, "Node Officer")
        )
      )

    if (userOrgAssignments.length === 0) {
      return {
        isSuccess: true,
        message: "User is not a Node Officer for any organization.",
        data: []
      }
    }

    const organizationIds = userOrgAssignments.map(a => a.organizationId)

    const managedOrganizations = await db.query.organizations.findMany({
      where: (organizations, { inArray }) =>
        inArray(organizations.id, organizationIds)
    })

    return {
      isSuccess: true,
      message: "Managed organizations retrieved successfully.",
      data: managedOrganizations
    }
  } catch (error) {
    console.error("Error retrieving managed organizations:", error)
    return {
      isSuccess: false,
      message: "Failed to retrieve managed organizations."
    }
  }
}

// READ - Get users in an organization (useful for Node Officers to manage their org users)
export async function getUsersInOrganizationAction(
  organizationId: string
): Promise<ActionState<SelectUserOrganization[]>> {
  // Could be enriched with user details from Clerk
  const { userId } = await auth()
  if (!userId) {
    return { isSuccess: false, message: "Unauthorized." }
  }

  // Security check: Is current user a Node Officer of this organization or System Admin?
  const isNodeOfficerOfOrg = await db.query.userOrganizations.findFirst({
    where: and(
      eq(userOrganizationsTable.userId, userId),
      eq(userOrganizationsTable.organizationId, organizationId),
      eq(userOrganizationsTable.role, "Node Officer")
    )
  })
  const isSysAdmin = await checkUserRole(userId, "System Administrator")

  if (!isNodeOfficerOfOrg && !isSysAdmin) {
    return {
      isSuccess: false,
      message: "Forbidden: Not authorized to view users for this organization."
    }
  }

  try {
    const usersInOrg = await db.query.userOrganizations.findMany({
      where: eq(userOrganizationsTable.organizationId, organizationId)
      // Optionally, enrich with organization details or user details from Clerk
      // with: { organization: true, user: ... } // Requires relations and Clerk fetch
    })
    return {
      isSuccess: true,
      message: "Users in organization retrieved.",
      data: usersInOrg
    }
  } catch (error) {
    console.error("Error fetching users in organization:", error)
    return {
      isSuccess: false,
      message: "Failed to fetch users in organization."
    }
  }
}

// UPDATE - Update a user's role within an organization
export async function updateUserRoleInOrganizationAction(
  userIdToUpdate: string,
  organizationId: string,
  newRole: (typeof organizationUserRoleEnum.enumValues)[number]
): Promise<ActionState<SelectUserOrganization>> {
  const { userId: currentUserId } = await auth()
  if (!currentUserId) {
    return { isSuccess: false, message: "Unauthorized." }
  }

  // Security: Only System Admin or Node Officer of that specific org can update roles in it
  const isNodeOfficerOfOrg = await db.query.userOrganizations.findFirst({
    where: and(
      eq(userOrganizationsTable.userId, currentUserId),
      eq(userOrganizationsTable.organizationId, organizationId),
      eq(userOrganizationsTable.role, "Node Officer")
    )
  })
  const isSysAdmin = await checkUserRole(currentUserId, "System Administrator")

  if (!isNodeOfficerOfOrg && !isSysAdmin) {
    return {
      isSuccess: false,
      message:
        "Forbidden: Not authorized to update roles for this organization."
    }
  }

  try {
    const [updatedAssignment] = await db
      .update(userOrganizationsTable)
      .set({ role: newRole, updatedAt: new Date() })
      .where(
        and(
          eq(userOrganizationsTable.userId, userIdToUpdate),
          eq(userOrganizationsTable.organizationId, organizationId)
        )
      )
      .returning()

    if (!updatedAssignment) {
      return {
        isSuccess: false,
        message: "User organization assignment not found or no change made."
      }
    }
    return {
      isSuccess: true,
      message: "User role in organization updated successfully.",
      data: updatedAssignment
    }
  } catch (error) {
    console.error("Error updating user role in organization:", error)
    return { isSuccess: false, message: "Failed to update user role." }
  }
}

// DELETE - Remove a user from an organization
export async function removeUserFromOrganizationAction(
  userIdToRemove: string,
  organizationId: string
): Promise<ActionState<void>> {
  const { userId: currentUserId } = await auth()
  if (!currentUserId) {
    return { isSuccess: false, message: "Unauthorized." }
  }

  // Security: Only System Admin or Node Officer of that specific org can remove users from it
  const isNodeOfficerOfOrg = await db.query.userOrganizations.findFirst({
    where: and(
      eq(userOrganizationsTable.userId, currentUserId),
      eq(userOrganizationsTable.organizationId, organizationId),
      eq(userOrganizationsTable.role, "Node Officer")
    )
  })
  const isSysAdmin = await checkUserRole(currentUserId, "System Administrator")

  if (!isNodeOfficerOfOrg && !isSysAdmin) {
    return {
      isSuccess: false,
      message:
        "Forbidden: Not authorized to remove users from this organization."
    }
  }

  // Prevent Node Officer from removing themselves if they are the *only* Node Officer?
  // This is complex business logic. For now, allow removal.
  // A check could be: if userIdToRemove === currentUserId && role === 'Node Officer', count other Node Officers.

  try {
    const result = await db
      .delete(userOrganizationsTable)
      .where(
        and(
          eq(userOrganizationsTable.userId, userIdToRemove),
          eq(userOrganizationsTable.organizationId, organizationId)
        )
      )
    // .returning() // Not strictly needed for delete if we don't use the result

    // Drizzle delete doesn't directly tell you rows affected unless using .returning() and checking length
    // For now, assume success if no error. Could be enhanced to check if a row was actually deleted.
    return {
      isSuccess: true,
      message: "User removed from organization successfully.",
      data: undefined
    }
  } catch (error) {
    console.error("Error removing user from organization:", error)
    return { isSuccess: false, message: "Failed to remove user." }
  }
}
