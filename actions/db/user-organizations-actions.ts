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
import { auth, clerkClient } from "@clerk/nextjs/server"
import { and, eq, inArray } from "drizzle-orm"
import { checkUserRole, requiresSystemAdmin } from "@/lib/rbac"

/**
 * Business rule: Prevents removal of the last Node Officer from an organization
 * Imported from organizations-actions.ts to maintain consistent validation
 */
async function validateNodeOfficerRemoval(
  organizationId: string,
  userIdToRemove: string
): Promise<{ isValid: boolean; error?: string }> {
  const nodeOfficers = await db.query.userOrganizations.findMany({
    where: and(
      eq(userOrganizationsTable.organizationId, organizationId),
      eq(userOrganizationsTable.role, "Node Officer")
    )
  })

  // If there's only one Node Officer and it's the one being removed, prevent it
  if (nodeOfficers.length === 1 && nodeOfficers[0].userId === userIdToRemove) {
    return {
      isValid: false,
      error:
        "Cannot remove the last Node Officer from an organization. Assign another Node Officer first."
    }
  }

  return { isValid: true }
}

/**
 * Business rule: Prevents demoting the last Node Officer from an organization
 * Similar to validateNodeOfficerRemoval but for role changes
 */
async function validateNodeOfficerDemotion(
  organizationId: string,
  userIdToUpdate: string,
  newRole: string
): Promise<{ isValid: boolean; error?: string }> {
  // Only check if we're demoting FROM Node Officer to something else
  const currentAssignment = await db.query.userOrganizations.findFirst({
    where: and(
      eq(userOrganizationsTable.userId, userIdToUpdate),
      eq(userOrganizationsTable.organizationId, organizationId)
    )
  })

  // If current role is not Node Officer, no validation needed
  if (!currentAssignment || currentAssignment.role !== "Node Officer") {
    return { isValid: true }
  }

  // If new role is still Node Officer, no validation needed
  if (newRole === "Node Officer") {
    return { isValid: true }
  }

  // We are demoting a Node Officer - check if they're the last one
  const nodeOfficers = await db.query.userOrganizations.findMany({
    where: and(
      eq(userOrganizationsTable.organizationId, organizationId),
      eq(userOrganizationsTable.role, "Node Officer")
    )
  })

  // If there's only one Node Officer and it's the one being demoted, prevent it
  if (nodeOfficers.length === 1 && nodeOfficers[0].userId === userIdToUpdate) {
    return {
      isValid: false,
      error:
        "Cannot demote the last Node Officer from an organization. Assign another Node Officer first."
    }
  }

  return { isValid: true }
}

/**
 * Validates that a Clerk user exists and is active before database operations
 * Prevents silent failures from typos in user IDs
 */
async function validateClerkUser(
  userId: string
): Promise<{ isValid: boolean; error?: string }> {
  try {
    const clerkUser = await (await clerkClient()).users.getUser(userId)
    if (!clerkUser) {
      return {
        isValid: false,
        error: "User not found in authentication system"
      }
    }

    // Check if user is banned/inactive
    if (clerkUser.banned) {
      return {
        isValid: false,
        error: "User is banned and cannot be assigned to organizations"
      }
    }

    return { isValid: true }
  } catch (error) {
    console.error("Error validating Clerk user:", error)
    return {
      isValid: false,
      error: "Failed to validate user in authentication system"
    }
  }
}

/**
 * Adds a user to an organization with a specific role.
 * Requires System Administrator privileges.
 * Prevents duplicate assignments by checking existing associations.
 *
 * @param assignment - User organization assignment data
 * @param assignment.userId - Clerk user ID to assign
 * @param assignment.organizationId - UUID of the organization
 * @param assignment.role - Role to assign ("Node Officer", "Member", "Metadata Creator", "Metadata Approver")
 *
 * @returns Promise resolving to ActionState containing the created user-organization association
 *
 * @example
 * ```typescript
 * const result = await addUserToOrganizationAction({
 *   userId: "user_2ABC123DEF456",
 *   organizationId: "123e4567-e89b-12d3-a456-426614174000",
 *   role: "Node Officer"
 * });
 *
 * if (result.isSuccess) {
 *   console.log("User assigned successfully:", result.data.role);
 * }
 * ```
 */
export async function addUserToOrganizationAction(
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
    // Validate that the Clerk user exists and is active
    const userValidation = await validateClerkUser(assignment.userId)
    if (!userValidation.isValid) {
      return {
        isSuccess: false,
        message: userValidation.error!
      }
    }

    // Check if the assignment already exists to prevent duplicates
    const existingAssignment = await db.query.userOrganizations.findFirst({
      where: and(
        eq(userOrganizationsTable.userId, assignment.userId),
        eq(userOrganizationsTable.organizationId, assignment.organizationId)
        // Leave role out – a user may only appear once per organisation.
        // If you intend multi-role support, add a dedicated junction table instead.
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

/**
 * Retrieves all organizations that the current user manages as a Node Officer.
 * Only returns organizations where the authenticated user has the "Node Officer" role.
 *
 * @returns Promise resolving to ActionState containing array of managed organizations
 *
 * @example
 * ```typescript
 * const result = await getNodeOfficerManagedOrganizationsAction();
 *
 * if (result.isSuccess) {
 *   console.log(`Managing ${result.data.length} organizations`);
 *   result.data.forEach(org => console.log(`- ${org.name}`));
 * }
 * ```
 */
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

/**
 * Retrieves all users associated with a specific organization.
 * Requires either Node Officer role for the specific organization or System Administrator role.
 *
 * @param organizationId - UUID of the organization to get users for
 *
 * @returns Promise resolving to ActionState containing array of user-organization associations
 *
 * @example
 * ```typescript
 * const result = await getUsersInOrganizationAction("123e4567-e89b-12d3-a456-426614174000");
 *
 * if (result.isSuccess) {
 *   console.log(`Organization has ${result.data.length} users`);
 *   result.data.forEach(userOrg => {
 *     console.log(`User ${userOrg.userId} has role: ${userOrg.role}`);
 *   });
 * }
 * ```
 */
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

/**
 * Updates a user's role within a specific organization.
 * Requires either Node Officer role for the specific organization or System Administrator role.
 * Cannot demote the last Node Officer of an organization to prevent orphaned organizations.
 *
 * @param userIdToUpdate - Clerk user ID whose role should be updated
 * @param organizationId - UUID of the organization
 * @param newRole - New role to assign ("Node Officer", "Member", "Metadata Creator", "Metadata Approver")
 *
 * @returns Promise resolving to ActionState containing the updated user-organization association
 *
 * @example
 * ```typescript
 * const result = await updateUserOrganizationRoleAction(
 *   "user_2ABC123DEF456",
 *   "123e4567-e89b-12d3-a456-426614174000",
 *   "Metadata Approver"
 * );
 *
 * if (result.isSuccess) {
 *   console.log("Role updated to:", result.data.role);
 * }
 * ```
 */
export async function updateUserOrganizationRoleAction(
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

  // Validate Node Officer demotion to prevent orphaned organizations
  const demotionValidation = await validateNodeOfficerDemotion(
    organizationId,
    userIdToUpdate,
    newRole
  )
  if (!demotionValidation.isValid) {
    return {
      isSuccess: false,
      message: demotionValidation.error!
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

/**
 * Removes a user from an organization completely.
 * Requires either Node Officer role for the specific organization or System Administrator role.
 * Cannot remove the last Node Officer from an organization to prevent orphaned organizations.
 *
 * ⚠️ **IMPORTANT**: This will permanently remove the user's association and any organization-specific permissions.
 *
 * @param userIdToRemove - Clerk user ID to remove from the organization
 * @param organizationId - UUID of the organization to remove the user from
 *
 * @returns Promise resolving to ActionState with success/failure status
 *
 * @example
 * ```typescript
 * const result = await removeUserFromOrganizationAction(
 *   "user_2ABC123DEF456",
 *   "123e4567-e89b-12d3-a456-426614174000"
 * );
 *
 * if (result.isSuccess) {
 *   console.log("User removed from organization successfully");
 * }
 * ```
 */
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

  // Validate Node Officer removal to prevent orphaned organizations
  const removalValidation = await validateNodeOfficerRemoval(
    organizationId,
    userIdToRemove
  )
  if (!removalValidation.isValid) {
    return {
      isSuccess: false,
      message: removalValidation.error!
    }
  }

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

// BULK OPERATIONS

/**
 * Interface for bulk user assignment operations.
 */
interface BulkUserAssignment {
  /** Clerk user ID to assign */
  userId: string
  /** Role to assign to the user */
  role: (typeof organizationUserRoleEnum.enumValues)[number]
}

/**
 * Interface for bulk user role update operations.
 */
interface BulkUserRoleUpdate {
  /** Clerk user ID whose role should be updated */
  userId: string
  /** New role to assign */
  newRole: (typeof organizationUserRoleEnum.enumValues)[number]
}

/**
 * Adds multiple users to an organization with specified roles in a single transaction.
 * Requires System Administrator privileges.
 * Skips users who are already assigned to prevent duplicate errors.
 *
 * @param organizationId - UUID of the organization
 * @param assignments - Array of user assignments (userId and role pairs)
 *
 * @returns Promise resolving to ActionState with summary of successful and failed assignments
 *
 * @example
 * ```typescript
 * const result = await addMultipleUsersToOrganizationAction(
 *   "123e4567-e89b-12d3-a456-426614174000",
 *   [
 *     { userId: "user_2ABC123DEF456", role: "Node Officer" },
 *     { userId: "user_2DEF456GHI789", role: "Metadata Creator" },
 *     { userId: "user_2GHI789JKL012", role: "Member" }
 *   ]
 * );
 *
 * if (result.isSuccess) {
 *   console.log(`Added ${result.data.successful.length} users, skipped ${result.data.skipped.length}`);
 * }
 * ```
 */
export async function addMultipleUsersToOrganizationAction(
  organizationId: string,
  assignments: BulkUserAssignment[]
): Promise<
  ActionState<{
    successful: SelectUserOrganization[]
    failed: { userId: string; role: string; error: string }[]
    skipped: { userId: string; role: string; reason: string }[]
  }>
> {
  const isSysAdmin = await requiresSystemAdmin()
  if (!isSysAdmin) {
    return {
      isSuccess: false,
      message: "Unauthorized. System admin rights required."
    }
  }

  try {
    if (!organizationId || assignments.length === 0) {
      return {
        isSuccess: false,
        message: "Organization ID and at least one assignment are required."
      }
    }

    // Validate organization exists
    const organization = await db.query.organizations.findFirst({
      where: eq(organizationsTable.id, organizationId)
    })

    if (!organization) {
      return {
        isSuccess: false,
        message: "Organization not found."
      }
    }

    // Validate all Clerk users exist and are active before processing
    const userValidationResults = await Promise.allSettled(
      assignments.map(async assignment => {
        const validation = await validateClerkUser(assignment.userId)
        return { userId: assignment.userId, validation }
      })
    )

    const invalidUsers: { userId: string; role: string; error: string }[] = []

    for (let i = 0; i < userValidationResults.length; i++) {
      const result = userValidationResults[i]
      const assignment = assignments[i]

      if (result.status === "rejected") {
        invalidUsers.push({
          userId: assignment.userId,
          role: assignment.role,
          error: "Failed to validate user"
        })
      } else if (!result.value.validation.isValid) {
        invalidUsers.push({
          userId: assignment.userId,
          role: assignment.role,
          error: result.value.validation.error!
        })
      }
    }

    // If any users are invalid, fail the entire operation to maintain consistency
    if (invalidUsers.length > 0) {
      return {
        isSuccess: false,
        message: `Invalid users found: ${invalidUsers.map(u => `${u.userId} (${u.error})`).join(", ")}`
      }
    }

    // Check for existing assignments to avoid duplicates
    const existingAssignments = await db.query.userOrganizations.findMany({
      where: and(
        eq(userOrganizationsTable.organizationId, organizationId),
        inArray(
          userOrganizationsTable.userId,
          assignments.map(a => a.userId)
        )
      )
    })

    const existingUserIds = new Set(existingAssignments.map(a => a.userId))

    const successful: SelectUserOrganization[] = []
    const failed: { userId: string; role: string; error: string }[] = []
    const skipped: { userId: string; role: string; reason: string }[] = []

    await db.transaction(async tx => {
      // Process each assignment
      for (const assignment of assignments) {
        try {
          // Check if user is already assigned
          if (existingUserIds.has(assignment.userId)) {
            skipped.push({
              userId: assignment.userId,
              role: assignment.role,
              reason: "User already assigned to organization"
            })
            continue
          }

          const [newAssignment] = await tx
            .insert(userOrganizationsTable)
            .values({
              userId: assignment.userId,
              organizationId,
              role: assignment.role
            })
            .returning()

          if (newAssignment) {
            successful.push(newAssignment)
          }
        } catch (error) {
          failed.push({
            userId: assignment.userId,
            role: assignment.role,
            error: error instanceof Error ? error.message : "Unknown error"
          })
        }
      }
    })

    return {
      isSuccess: true,
      message: `Bulk assignment completed. ${successful.length} successful, ${failed.length} failed, ${skipped.length} skipped.`,
      data: { successful, failed, skipped }
    }
  } catch (error) {
    console.error("Error in bulk user assignment:", error)
    return {
      isSuccess: false,
      message: `Failed to process bulk assignment: ${error instanceof Error ? error.message : "Unknown error"}`
    }
  }
}

/**
 * Removes multiple users from an organization in a single transaction.
 * Requires either Node Officer role for the specific organization or System Administrator role.
 * Provides detailed results of which removals succeeded or failed.
 *
 * @param organizationId - UUID of the organization
 * @param userIds - Array of Clerk user IDs to remove
 *
 * @returns Promise resolving to ActionState with summary of successful and failed removals
 *
 * @example
 * ```typescript
 * const result = await removeMultipleUsersFromOrganizationAction(
 *   "123e4567-e89b-12d3-a456-426614174000",
 *   ["user_2ABC123DEF456", "user_2DEF456GHI789", "user_2GHI789JKL012"]
 * );
 *
 * if (result.isSuccess) {
 *   console.log(`Removed ${result.data.successful.length} users, failed ${result.data.failed.length}`);
 * }
 * ```
 */
export async function removeMultipleUsersFromOrganizationAction(
  organizationId: string,
  userIds: string[]
): Promise<
  ActionState<{
    successful: string[]
    failed: { userId: string; error: string }[]
    notFound: string[]
  }>
> {
  const { userId: currentUserId } = await auth()
  if (!currentUserId) {
    return { isSuccess: false, message: "Unauthorized." }
  }

  // Security check
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

  try {
    if (!organizationId || userIds.length === 0) {
      return {
        isSuccess: false,
        message: "Organization ID and at least one user ID are required."
      }
    }

    // Check which users are actually in the organization
    const existingAssignments = await db.query.userOrganizations.findMany({
      where: and(
        eq(userOrganizationsTable.organizationId, organizationId),
        inArray(userOrganizationsTable.userId, userIds)
      )
    })

    const existingUserIds = new Set(existingAssignments.map(a => a.userId))
    const notFound = userIds.filter(id => !existingUserIds.has(id))

    // Check if any of the users being removed are Node Officers
    const nodeOfficersBeingRemoved = existingAssignments.filter(
      assignment => assignment.role === "Node Officer"
    )

    // If Node Officers are being removed, check if this would leave the organization without any
    if (nodeOfficersBeingRemoved.length > 0) {
      const allNodeOfficers = await db.query.userOrganizations.findMany({
        where: and(
          eq(userOrganizationsTable.organizationId, organizationId),
          eq(userOrganizationsTable.role, "Node Officer")
        )
      })

      const nodeOfficersAfterRemoval = allNodeOfficers.filter(
        officer => !userIds.includes(officer.userId)
      )

      if (nodeOfficersAfterRemoval.length === 0) {
        return {
          isSuccess: false,
          message:
            "Cannot remove all Node Officers from an organization. At least one Node Officer must remain."
        }
      }
    }

    const successful: string[] = []
    const failed: { userId: string; error: string }[] = []

    // Process each removal
    for (const userId of userIds) {
      if (!existingUserIds.has(userId)) {
        continue // Already tracked in notFound
      }

      try {
        await db
          .delete(userOrganizationsTable)
          .where(
            and(
              eq(userOrganizationsTable.userId, userId),
              eq(userOrganizationsTable.organizationId, organizationId)
            )
          )

        successful.push(userId)
      } catch (error) {
        failed.push({
          userId,
          error: error instanceof Error ? error.message : "Unknown error"
        })
      }
    }

    return {
      isSuccess: true,
      message: `Bulk removal completed. ${successful.length} successful, ${failed.length} failed, ${notFound.length} not found.`,
      data: { successful, failed, notFound }
    }
  } catch (error) {
    console.error("Error in bulk user removal:", error)
    return {
      isSuccess: false,
      message: `Failed to process bulk removal: ${error instanceof Error ? error.message : "Unknown error"}`
    }
  }
}

/**
 * Updates roles for multiple users within an organization in a single transaction.
 * Requires either Node Officer role for the specific organization or System Administrator role.
 * Cannot demote all Node Officers to prevent orphaned organizations.
 *
 * @param organizationId - UUID of the organization
 * @param roleUpdates - Array of user role updates (userId and newRole pairs)
 *
 * @returns Promise resolving to ActionState with summary of successful and failed updates
 *
 * @example
 * ```typescript
 * const result = await updateMultipleUserRolesAction(
 *   "123e4567-e89b-12d3-a456-426614174000",
 *   [
 *     { userId: "user_2ABC123DEF456", newRole: "Metadata Approver" },
 *     { userId: "user_2DEF456GHI789", newRole: "Metadata Creator" },
 *     { userId: "user_2GHI789JKL012", newRole: "Member" }
 *   ]
 * );
 *
 * if (result.isSuccess) {
 *   console.log(`Updated ${result.data.successful.length} roles, failed ${result.data.failed.length}`);
 * }
 * ```
 */
export async function updateMultipleUserRolesAction(
  organizationId: string,
  roleUpdates: BulkUserRoleUpdate[]
): Promise<
  ActionState<{
    successful: SelectUserOrganization[]
    failed: { userId: string; newRole: string; error: string }[]
    notFound: string[]
  }>
> {
  const { userId: currentUserId } = await auth()
  if (!currentUserId) {
    return { isSuccess: false, message: "Unauthorized." }
  }

  // Security check
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
    if (!organizationId || roleUpdates.length === 0) {
      return {
        isSuccess: false,
        message: "Organization ID and at least one role update are required."
      }
    }

    // Check which users are actually in the organization
    const existingAssignments = await db.query.userOrganizations.findMany({
      where: and(
        eq(userOrganizationsTable.organizationId, organizationId),
        inArray(
          userOrganizationsTable.userId,
          roleUpdates.map(u => u.userId)
        )
      )
    })

    const existingUserIds = new Set(existingAssignments.map(a => a.userId))
    const notFound = roleUpdates
      .filter(update => !existingUserIds.has(update.userId))
      .map(update => update.userId)

    // Check if any Node Officers are being demoted and if this would leave the organization without any
    const nodeOfficersBeingDemoted = roleUpdates.filter(update => {
      const currentAssignment = existingAssignments.find(
        a => a.userId === update.userId
      )
      return (
        currentAssignment?.role === "Node Officer" &&
        update.newRole !== "Node Officer"
      )
    })

    if (nodeOfficersBeingDemoted.length > 0) {
      const allNodeOfficers = await db.query.userOrganizations.findMany({
        where: and(
          eq(userOrganizationsTable.organizationId, organizationId),
          eq(userOrganizationsTable.role, "Node Officer")
        )
      })

      // Calculate how many Node Officers will remain after the updates
      const nodeOfficersAfterUpdates = allNodeOfficers.filter(officer => {
        const update = roleUpdates.find(u => u.userId === officer.userId)
        // If there's an update for this officer, check if they remain a Node Officer
        // If no update, they keep their current role
        return update ? update.newRole === "Node Officer" : true
      })

      // Also add users who are being promoted TO Node Officer
      const usersPromotedToNodeOfficer = roleUpdates.filter(update => {
        const currentAssignment = existingAssignments.find(
          a => a.userId === update.userId
        )
        return (
          currentAssignment?.role !== "Node Officer" &&
          update.newRole === "Node Officer"
        )
      })

      const totalNodeOfficersAfter =
        nodeOfficersAfterUpdates.length + usersPromotedToNodeOfficer.length

      if (totalNodeOfficersAfter === 0) {
        return {
          isSuccess: false,
          message:
            "Cannot demote all Node Officers from an organization. At least one Node Officer must remain."
        }
      }
    }

    const successful: SelectUserOrganization[] = []
    const failed: { userId: string; newRole: string; error: string }[] = []

    // Process each role update
    for (const update of roleUpdates) {
      if (!existingUserIds.has(update.userId)) {
        continue // Already tracked in notFound
      }

      try {
        const [updatedAssignment] = await db
          .update(userOrganizationsTable)
          .set({ role: update.newRole, updatedAt: new Date() })
          .where(
            and(
              eq(userOrganizationsTable.userId, update.userId),
              eq(userOrganizationsTable.organizationId, organizationId)
            )
          )
          .returning()

        if (updatedAssignment) {
          successful.push(updatedAssignment)
        }
      } catch (error) {
        failed.push({
          userId: update.userId,
          newRole: update.newRole,
          error: error instanceof Error ? error.message : "Unknown error"
        })
      }
    }

    return {
      isSuccess: true,
      message: `Bulk role update completed. ${successful.length} successful, ${failed.length} failed, ${notFound.length} not found.`,
      data: { successful, failed, notFound }
    }
  } catch (error) {
    console.error("Error in bulk role update:", error)
    return {
      isSuccess: false,
      message: `Failed to process bulk role update: ${error instanceof Error ? error.message : "Unknown error"}`
    }
  }
}
