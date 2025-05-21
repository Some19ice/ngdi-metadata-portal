"use server"

import { clerkClient, type User, type EmailAddress } from "@clerk/nextjs/server"
import { ActionState } from "@/types"
import { db } from "@/db/db"
import { rolesTable, userRolesTable, roleEnum } from "@/db/schema"
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
