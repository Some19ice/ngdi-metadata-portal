"use server"

import { auth } from "@clerk/nextjs/server"
import { hasPermission, checkUserRole } from "@/lib/rbac"
import { ActionState } from "@/types"

export interface UserPermissions {
  canAccessAdmin: boolean
  canAccessBilling: boolean
  isSystemAdmin: boolean
  isPro: boolean
}

/**
 * Get current user's permissions for UI rendering
 * This is specifically designed for client components that need to check permissions
 */
export async function getCurrentUserPermissionsAction(): Promise<
  ActionState<UserPermissions>
> {
  try {
    const authState = await auth()
    const userId = authState.userId

    if (!userId) {
      return {
        isSuccess: true,
        message: "User not authenticated",
        data: {
          canAccessAdmin: false,
          canAccessBilling: false,
          isSystemAdmin: false,
          isPro: false
        }
      }
    }

    // Check admin permissions
    const canAccessAdmin = await hasPermission(
      userId,
      "access",
      "admin_dashboard"
    )

    // Check if user is system administrator
    const isSystemAdmin = await checkUserRole(userId, "System Administrator")

    // For billing access, check if user has billing permissions or is system admin
    // You can adjust this logic based on your business requirements
    const canAccessBilling =
      (await hasPermission(userId, "manage", "billing")) || isSystemAdmin

    // For pro status, you can check for specific roles or subscription status
    // This is a placeholder - adjust based on your pro user logic
    const isPro = canAccessBilling || isSystemAdmin

    return {
      isSuccess: true,
      message: "Permissions retrieved successfully",
      data: {
        canAccessAdmin,
        canAccessBilling,
        isSystemAdmin,
        isPro
      }
    }
  } catch (error) {
    console.error("Error getting user permissions:", error)
    return {
      isSuccess: false,
      message: "Failed to get user permissions"
    }
  }
}
