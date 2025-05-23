"use server"

import { db } from "@/db/db"
import { userRolesTable, rolesTable, SelectRole, roleEnum } from "@/db/schema"
import { ActionState } from "@/types"
import { auth } from "@clerk/nextjs/server"
import { requiresSystemAdmin } from "@/lib/rbac"
import { and, eq, inArray } from "drizzle-orm"
import { clerkClient, EmailAddress } from "@clerk/nextjs/server"

interface ClerkUser {
  id: string
  firstName: string | null
  lastName: string | null
  email: string
  imageUrl: string
}

export async function updateUserRolesAction(
  userId: string,
  roleIds: number[]
): Promise<ActionState<void>> {
  const authResult = await auth()
  if (!authResult.userId) {
    return { isSuccess: false, message: "User not authenticated." }
  }

  const adminCheck = await requiresSystemAdmin()
  if (!adminCheck.isAllowed) {
    return {
      isSuccess: false,
      message:
        adminCheck.message ||
        "User does not have permission to update user roles."
    }
  }

  try {
    if (roleIds.length > 0) {
      const existingRoles = await db
        .select({ id: rolesTable.id })
        .from(rolesTable)
        .where(inArray(rolesTable.id, roleIds))

      if (existingRoles.length !== roleIds.length) {
        const notFoundRoleIds = roleIds.filter(
          id => !existingRoles.find(r => r.id === id)
        )
        return {
          isSuccess: false,
          message: `Invalid role IDs provided: ${notFoundRoleIds.join(", ")}`
        }
      }
    }

    await db.transaction(async tx => {
      await tx.delete(userRolesTable).where(eq(userRolesTable.userId, userId))
      if (roleIds.length > 0) {
        const newRolesData = roleIds.map(roleId => ({
          userId: userId,
          roleId: roleId
        }))
        await tx.insert(userRolesTable).values(newRolesData)
      }
    })

    return {
      isSuccess: true,
      message: "User roles updated successfully.",
      data: undefined
    }
  } catch (error) {
    console.error("Error updating user roles:", error)
    return { isSuccess: false, message: "Failed to update user roles." }
  }
}

export async function getUserWithRolesAction(
  targetUserId: string
): Promise<ActionState<{ user: ClerkUser; roles: SelectRole[] }>> {
  const authResult = await auth()
  if (!authResult.userId) {
    return { isSuccess: false, message: "User not authenticated." }
  }

  if (targetUserId !== authResult.userId) {
    const adminCheck = await requiresSystemAdmin()
    if (!adminCheck.isAllowed) {
      return {
        isSuccess: false,
        message:
          adminCheck.message ||
          "User does not have permission to view other users' roles."
      }
    }
  }

  try {
    const clerk = await clerkClient()
    const clerkUser = await clerk.users.getUser(targetUserId)
    if (!clerkUser) {
      return { isSuccess: false, message: "Clerk user not found." }
    }

    const userRoles = await db
      .select({
        id: rolesTable.id,
        name: rolesTable.name,
        description: rolesTable.description,
        createdAt: rolesTable.createdAt,
        updatedAt: rolesTable.updatedAt
      })
      .from(userRolesTable)
      .innerJoin(rolesTable, eq(userRolesTable.roleId, rolesTable.id))
      .where(eq(userRolesTable.userId, targetUserId))

    const simplifiedClerkUser: ClerkUser = {
      id: clerkUser.id,
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
      email:
        clerkUser.emailAddresses.find(
          (e: EmailAddress) => e.id === clerkUser.primaryEmailAddressId
        )?.emailAddress || "No primary email",
      imageUrl: clerkUser.imageUrl
    }

    return {
      isSuccess: true,
      message: "User and roles retrieved successfully.",
      data: { user: simplifiedClerkUser, roles: userRoles }
    }
  } catch (error) {
    console.error("Error retrieving user with roles:", error)
    if (
      error &&
      typeof error === "object" &&
      "status" in error &&
      error.status === 404
    ) {
      return { isSuccess: false, message: "Clerk user not found." }
    }
    if (
      error instanceof Error &&
      (error.message.toLowerCase().includes("clerk") ||
        error.message.toLowerCase().includes("fetch_error"))
    ) {
      return { isSuccess: false, message: `Clerk API error: ${error.message}` }
    }
    return { isSuccess: false, message: "Failed to retrieve user and roles." }
  }
}

export async function getRoleByNameAction(
  roleName: (typeof roleEnum.enumValues)[number]
): Promise<ActionState<SelectRole | null>> {
  const authResult = await auth()
  if (!authResult.userId) {
    return { isSuccess: false, message: "User not authenticated." }
  }

  try {
    const role = await db.query.roles.findFirst({
      where: eq(rolesTable.name, roleName)
    })

    if (!role) {
      return {
        isSuccess: true,
        message: `Role '${roleName}' not found.`,
        data: null
      }
    }

    return {
      isSuccess: true,
      message: "Role retrieved successfully.",
      data: role
    }
  } catch (error) {
    console.error("Error getting role by name:", error)
    return { isSuccess: false, message: "Failed to retrieve role by name." }
  }
}
