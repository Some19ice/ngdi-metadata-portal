"use server"

import { clerkClient, type User, type EmailAddress } from "@clerk/nextjs/server"
import { ActionState } from "@/types"
import { db } from "@/db/db"
import {
  rolesTable,
  userRolesTable,
  roleEnum,
  userOrganizationsTable,
  organizationsTable
} from "@/db/schema"
import { and, eq, inArray, like, or } from "drizzle-orm"
import { requiresRole, hasPermission, getUserRoles } from "@/lib/rbac"
import { auth } from "@clerk/nextjs/server"
import { createNotificationAction } from "@/actions/notifications-actions"

// Define a more specific type for the user data we expect from Clerk
// This can be expanded as needed based on the data you want to use
export interface ClerkUser {
  id: string
  firstName: string | null
  lastName: string | null
  emailAddress: string // Assuming primary email is what we want
  username: string | null
  imageUrl: string
  createdAt: number // Clerk typically provides this as a Unix timestamp
  databaseRole?: (typeof roleEnum.enumValues)[number] | null // Added to store role from our DB
  // Add other fields as necessary, e.g., publicMetadata, roles, etc.
}

export interface GetUsersOptions {
  query?: string
  roleFilter?: (typeof roleEnum.enumValues)[number]
  sortBy?: "name" | "email" | "createdAt" | "role"
  sortOrder?: "asc" | "desc"
  page?: number
  limit?: number
}

export async function getUsersAction(options: GetUsersOptions = {}): Promise<
  ActionState<{
    users: ClerkUser[]
    totalCount: number
    page: number
    totalPages: number
    limit: number
  }>
> {
  try {
    const authState = await auth()
    if (
      !authState.userId ||
      !(await hasPermission(authState.userId, "view", "users"))
    ) {
      return {
        isSuccess: false,
        message: "Unauthorized: Missing permission to view users."
      }
    }

    const {
      query = "",
      roleFilter,
      sortBy = "createdAt",
      sortOrder = "desc",
      page = 1,
      limit = 20
    } = options

    const client = await clerkClient()

    // First get total count for pagination info
    const totalUsersResponse = await client.users.getCount()
    const totalCount = totalUsersResponse || 0

    // Fetch users from Clerk with pagination
    const paginatedUsers = await client.users.getUserList({
      limit: limit,
      offset: (page - 1) * limit,
      orderBy: sortBy === "createdAt" ? "created_at" : undefined
      // For other sorting, we'll sort in memory after fetching
    })

    let clerkUsers = paginatedUsers.data

    if (!clerkUsers || clerkUsers.length === 0) {
      return {
        isSuccess: true,
        message: "No users found in Clerk.",
        data: {
          users: [],
          totalCount: 0,
          page,
          totalPages: 0,
          limit
        }
      }
    }

    // Fetch all user-role assignments from our database
    const userRoleAssignments = await db
      .select({
        userId: userRolesTable.userId,
        roleName: rolesTable.name
      })
      .from(userRolesTable)
      .innerJoin(rolesTable, eq(userRolesTable.roleId, rolesTable.id))
      .where(roleFilter ? eq(rolesTable.name, roleFilter) : undefined)

    const userRolesMap = new Map<string, (typeof roleEnum.enumValues)[number]>()
    userRoleAssignments.forEach(assignment => {
      userRolesMap.set(assignment.userId, assignment.roleName)
    })

    // If we're filtering by role and already fetched role assignments,
    // filter clerk users to only include those with matching roles
    if (roleFilter) {
      const userIdsWithRole = [...userRolesMap.entries()]
        .filter(([_, role]) => role === roleFilter)
        .map(([userId, _]) => userId)

      clerkUsers = clerkUsers.filter(user => userIdsWithRole.includes(user.id))
    }

    let formattedUsers: ClerkUser[] = clerkUsers.map((user: User) => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      emailAddress:
        user.emailAddresses.find(
          (e: EmailAddress) => e.id === user.primaryEmailAddressId
        )?.emailAddress ||
        user.emailAddresses[0]?.emailAddress ||
        "N/A",
      username: user.username,
      imageUrl: user.imageUrl,
      createdAt: user.createdAt,
      databaseRole: userRolesMap.get(user.id) || null
    }))

    // Apply search filter if query is provided
    if (query) {
      const lowerQuery = query.toLowerCase()
      formattedUsers = formattedUsers.filter(
        user =>
          (user.firstName?.toLowerCase() || "").includes(lowerQuery) ||
          (user.lastName?.toLowerCase() || "").includes(lowerQuery) ||
          user.emailAddress.toLowerCase().includes(lowerQuery) ||
          (user.username?.toLowerCase() || "").includes(lowerQuery)
      )
    }

    // Apply sorting (Clerk only sorts by createdAt, we handle other sorting here)
    if (sortBy !== "createdAt") {
      formattedUsers.sort((a, b) => {
        let valueA, valueB

        switch (sortBy) {
          case "name":
            valueA = `${a.firstName || ""} ${a.lastName || ""}`
              .trim()
              .toLowerCase()
            valueB = `${b.firstName || ""} ${b.lastName || ""}`
              .trim()
              .toLowerCase()
            break
          case "email":
            valueA = a.emailAddress.toLowerCase()
            valueB = b.emailAddress.toLowerCase()
            break
          case "role":
            valueA = a.databaseRole || ""
            valueB = b.databaseRole || ""
            break
          default:
            return 0
        }

        if (sortOrder === "asc") {
          return valueA < valueB ? -1 : valueA > valueB ? 1 : 0
        } else {
          return valueA > valueB ? -1 : valueA < valueB ? 1 : 0
        }
      })
    } else if (sortOrder === "asc") {
      // If using createdAt sort from Clerk but in ascending order, we need to reverse
      formattedUsers.reverse()
    }

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit)

    return {
      isSuccess: true,
      message: "Users retrieved successfully.",
      data: {
        users: formattedUsers,
        totalCount,
        page,
        totalPages,
        limit
      }
    }
  } catch (error) {
    console.error("Error getting users with roles:", error)
    let errorMessage = "Failed to get users."
    if (error instanceof Error) {
      errorMessage = error.message
    }
    return { isSuccess: false, message: errorMessage }
  }
}

export async function updateUserRoleAction(
  targetUserId: string,
  newRoleName: (typeof roleEnum.enumValues)[number] // Ensure roleName is one of the enum values
): Promise<ActionState<void>> {
  try {
    const authState = await auth() // Get current user's auth state
    if (!authState.userId) {
      return {
        isSuccess: false,
        message: "Unauthorized: User not authenticated."
      }
    }

    // 1. RBAC Check: Ensure current user has permission to manage users/roles.
    const canManageUsers = await hasPermission(
      authState.userId,
      "manage",
      "users"
    )
    if (!canManageUsers) {
      return {
        isSuccess: false,
        message: "Unauthorized: Missing permission to manage user roles."
      }
    }

    // Prevent System Administrator from changing their own role to a non-System Administrator role via this UI.
    if (
      authState.userId === targetUserId &&
      newRoleName !== "System Administrator"
    ) {
      // Fetch current user's roles from DB directly to be certain
      const dbUserRoles = await getUserRoles(authState.userId)
      if (dbUserRoles.includes("System Administrator")) {
        return {
          isSuccess: false,
          message:
            "System Administrators cannot change their own role to a non-System Administrator role through this interface."
        }
      }
    }

    // 2. Validate Role: Already typed by `newRoleName` parameter against `roleEnum.enumValues`.

    // 3. Get Role ID from rolesTable
    const roleEntry = await db
      .select({ id: rolesTable.id })
      .from(rolesTable)
      .where(eq(rolesTable.name, newRoleName))
      .limit(1)

    if (!roleEntry || roleEntry.length === 0) {
      return {
        isSuccess: false,
        message: `Role '${newRoleName}' not found in the database.`
      }
    }
    const newRoleId = roleEntry[0].id

    // Start a transaction for database operations
    await db.transaction(async tx => {
      // 4. Update userRolesTable: Remove existing roles for the user, then insert the new one.
      await tx
        .delete(userRolesTable)
        .where(eq(userRolesTable.userId, targetUserId))

      await tx.insert(userRolesTable).values({
        userId: targetUserId,
        roleId: newRoleId
      })

      // 5. Update Clerk Metadata
      const client = await clerkClient()
      await client.users.updateUserMetadata(targetUserId, {
        publicMetadata: {
          role: newRoleName // Store the string name of the role
        }
      })
    })

    // Send notification to the user whose role was changed
    const notificationTitle = "Role Updated"
    const notificationMessage = `Your system role has been updated to: ${newRoleName}.`
    await createNotificationAction({
      recipientUserId: targetUserId,
      type: "NewRoleAssignment", // Use the enum value directly
      title: notificationTitle,
      message: notificationMessage,
      link: "/app/profile" // Example link, adjust as needed
    })

    return {
      isSuccess: true,
      message: "User role updated successfully in database and Clerk metadata.",
      data: undefined
    }
  } catch (error) {
    console.error(`Error updating role for user ${targetUserId}:`, error)
    let errMsg = "Failed to update user role."
    if (error instanceof Error) {
      errMsg = error.message
    }
    return { isSuccess: false, message: errMsg }
  }
}

/**
 * Creates a new user account and assigns them to an organization with a specific role.
 * Used for hierarchical account creation:
 * - System Admin creates Node Officer accounts
 * - Node Officers create Metadata Creator and Approver accounts
 */
export async function createUserForOrganizationAction(params: {
  email: string
  firstName: string
  lastName: string
  password: string
  organizationId: string
  role: "Node Officer" | "Metadata Creator" | "Metadata Approver"
  sendWelcomeEmail?: boolean
}): Promise<ActionState<{ userId: string; email: string }>> {
  try {
    const authState = await auth()
    if (!authState.userId) {
      return {
        isSuccess: false,
        message: "Unauthorized: User not authenticated."
      }
    }

    // Check permissions based on role being created
    if (params.role === "Node Officer") {
      // Only System Admin can create Node Officer accounts
      const isSystemAdmin = await hasPermission(
        authState.userId,
        "manage",
        "organizations"
      )
      if (!isSystemAdmin) {
        return {
          isSuccess: false,
          message:
            "Only System Administrators can create Node Officer accounts."
        }
      }
    } else {
      // Node Officers can create Metadata Creator and Approver accounts for their organization
      const isNodeOfficerForOrg = await db.query.userOrganizations.findFirst({
        where: and(
          eq(userOrganizationsTable.userId, authState.userId),
          eq(userOrganizationsTable.organizationId, params.organizationId),
          eq(userOrganizationsTable.role, "Node Officer")
        )
      })

      if (!isNodeOfficerForOrg) {
        return {
          isSuccess: false,
          message:
            "Only Node Officers can create accounts for their organization members."
        }
      }
    }

    // Verify organization exists
    const organization = await db.query.organizations.findFirst({
      where: eq(organizationsTable.id, params.organizationId)
    })

    if (!organization) {
      return {
        isSuccess: false,
        message: "Organization not found."
      }
    }

    // Create Clerk user
    const client = await clerkClient()

    try {
      const clerkUser = await client.users.createUser({
        emailAddress: [params.email],
        password: params.password,
        firstName: params.firstName,
        lastName: params.lastName,
        publicMetadata: {
          organizationId: params.organizationId,
          organizationName: organization.name,
          role: params.role
        }
      })

      // Add user to organization with specified role
      await db.insert(userOrganizationsTable).values({
        userId: clerkUser.id,
        organizationId: params.organizationId,
        role: params.role
      })

      // If creating a Node Officer, also assign the global Node Officer role
      if (params.role === "Node Officer") {
        const nodeOfficerRole = await db.query.roles.findFirst({
          where: eq(rolesTable.name, "Node Officer")
        })

        if (nodeOfficerRole) {
          await db.insert(userRolesTable).values({
            userId: clerkUser.id,
            roleId: nodeOfficerRole.id
          })
        }
      }

      // Send welcome email with credentials if requested
      if (params.sendWelcomeEmail) {
        await createNotificationAction({
          recipientUserId: clerkUser.id,
          type: "NewRoleAssignment",
          title: `Welcome to ${organization.name}`,
          message: `You have been added as a ${params.role} for ${organization.name}. Please log in with your provided credentials to access the system.`,
          link: "/login"
        })
      }

      // Notify the creating user
      await createNotificationAction({
        recipientUserId: authState.userId,
        type: "Other",
        title: "User Account Created",
        message: `Successfully created account for ${params.firstName} ${params.lastName} as ${params.role} in ${organization.name}.`,
        link: `/organization-users?orgId=${params.organizationId}`
      })

      return {
        isSuccess: true,
        message: `User account created successfully.`,
        data: {
          userId: clerkUser.id,
          email: params.email
        }
      }
    } catch (clerkError: any) {
      // Handle Clerk-specific errors
      if (clerkError.errors) {
        const errorMessages = clerkError.errors
          .map((e: any) => e.message)
          .join(", ")
        return {
          isSuccess: false,
          message: `Failed to create user: ${errorMessages}`
        }
      }
      throw clerkError
    }
  } catch (error) {
    console.error("Error creating user for organization:", error)
    return {
      isSuccess: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to create user account."
    }
  }
}

/**
 * Creates multiple user accounts for an organization in bulk.
 * Only Node Officers can use this for their organization.
 */
export async function createBulkUsersForOrganizationAction(params: {
  organizationId: string
  users: Array<{
    email: string
    firstName: string
    lastName: string
    role: "Metadata Creator" | "Metadata Approver"
  }>
  sendWelcomeEmails?: boolean
}): Promise<
  ActionState<{
    created: Array<{ email: string; userId: string }>
    failed: Array<{ email: string; error: string }>
  }>
> {
  try {
    const authState = await auth()
    if (!authState.userId) {
      return {
        isSuccess: false,
        message: "Unauthorized: User not authenticated."
      }
    }

    // Verify user is Node Officer for this organization
    const isNodeOfficerForOrg = await db.query.userOrganizations.findFirst({
      where: and(
        eq(userOrganizationsTable.userId, authState.userId),
        eq(userOrganizationsTable.organizationId, params.organizationId),
        eq(userOrganizationsTable.role, "Node Officer")
      )
    })

    if (!isNodeOfficerForOrg) {
      return {
        isSuccess: false,
        message:
          "Only Node Officers can create bulk accounts for their organization."
      }
    }

    const created: Array<{ email: string; userId: string }> = []
    const failed: Array<{ email: string; error: string }> = []
    const client = await clerkClient()

    for (const userData of params.users) {
      try {
        // Generate a secure temporary password
        const tempPassword = generateSecurePassword()

        const clerkUser = await client.users.createUser({
          emailAddress: [userData.email],
          password: tempPassword,
          firstName: userData.firstName,
          lastName: userData.lastName,
          publicMetadata: {
            organizationId: params.organizationId,
            role: userData.role
          }
        })

        // Add to organization
        await db.insert(userOrganizationsTable).values({
          userId: clerkUser.id,
          organizationId: params.organizationId,
          role: userData.role
        })

        created.push({
          email: userData.email,
          userId: clerkUser.id
        })

        // Send welcome email with temporary password
        if (params.sendWelcomeEmails) {
          // In production, this would send an actual email
          // For now, create a notification
          await createNotificationAction({
            recipientUserId: clerkUser.id,
            type: "NewRoleAssignment",
            title: "Welcome to NGDI Portal",
            message: `You have been added as a ${userData.role}. Your temporary password is: ${tempPassword}. Please change it upon first login.`,
            link: "/login"
          })
        }
      } catch (error: any) {
        failed.push({
          email: userData.email,
          error: error.message || "Unknown error"
        })
      }
    }

    return {
      isSuccess: true,
      message: `Created ${created.length} users successfully. ${failed.length} failed.`,
      data: { created, failed }
    }
  } catch (error) {
    console.error("Error creating bulk users:", error)
    return {
      isSuccess: false,
      message:
        error instanceof Error ? error.message : "Failed to create bulk users."
    }
  }
}

/**
 * Generates a secure temporary password
 */
function generateSecurePassword(): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*"
  let password = ""
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}
