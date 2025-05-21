"use server"

import { db } from "@/db/db"
import { rolesTable, SelectRole } from "@/db/schema"
import { ActionState } from "@/types"
import { hasPermission } from "@/lib/rbac"
import { auth } from "@clerk/nextjs/server"

/**
 * Fetches all available roles from the database.
 */
export async function getRolesAction(): Promise<ActionState<SelectRole[]>> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { isSuccess: false, message: "Unauthorized: User not logged in." }
    }

    const canManageRoles = await hasPermission(userId, "manage", "roles")
    if (!canManageRoles) {
      return {
        isSuccess: false,
        message: "Forbidden: You do not have permission to manage roles."
      }
    }

    const roles = await db.select().from(rolesTable).orderBy(rolesTable.name)

    if (!roles || roles.length === 0) {
      // Check if roles array is empty too
      return {
        isSuccess: false,
        message: "No roles found in the database."
      }
    }

    return {
      isSuccess: true,
      message: "Roles retrieved successfully",
      data: roles
    }
  } catch (error) {
    console.error("Error getting roles:", error)
    let errorMessage = "Failed to get roles."
    if (error instanceof Error) {
      errorMessage = error.message
    }
    return { isSuccess: false, message: errorMessage }
  }
}
