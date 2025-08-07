"use server"

/**
 * IMPORTANT: This module requires the NOTIFICATION_SYSTEM_TOKEN environment variable
 * to be set for internal system notification creation. This token should be a secure
 * random string used to authorize system-generated notifications.
 *
 * Add to your .env.local file:
 * NOTIFICATION_SYSTEM_TOKEN=your_secure_random_token_here
 */

import { db } from "@/db/db"
import {
  notificationsTable,
  type InsertNotification,
  type SelectNotification,
  notificationTypeEnum,
  notificationPriorityEnum
} from "@/db/schema"
import { ActionState } from "@/types"
import { auth } from "@clerk/nextjs/server"
import { and, eq, desc, gte, isNull, or, count } from "drizzle-orm"
import { isNodeOfficerForOrg } from "@/lib/rbac"

// Pagination validation constants
const MIN_PAGE = 1
const DEFAULT_PAGE = 1
const MIN_PAGE_SIZE = 1
const MAX_PAGE_SIZE = 100
const DEFAULT_PAGE_SIZE = 20

/**
 * Validates and sanitizes the page parameter
 * @param page - The page number to validate
 * @returns A valid page number (minimum 1)
 */
function validatePaginationPage(page: number): number {
  if (!Number.isInteger(page) || page < MIN_PAGE) {
    return DEFAULT_PAGE
  }
  return page
}

/**
 * Validates and sanitizes the pageSize parameter
 * @param pageSize - The page size to validate
 * @returns A valid page size within acceptable bounds
 */
function validatePaginationPageSize(pageSize: number): number {
  if (
    !Number.isInteger(pageSize) ||
    pageSize < MIN_PAGE_SIZE ||
    pageSize > MAX_PAGE_SIZE
  ) {
    return DEFAULT_PAGE_SIZE
  }
  return pageSize
}

export interface NotificationFilters {
  isRead?: boolean
  priority?: (typeof notificationPriorityEnum.enumValues)[number]
  type?: (typeof notificationTypeEnum.enumValues)[number]
}

export interface PaginatedNotifications {
  notifications: SelectNotification[]
  total: number
  hasMore: boolean
  page: number
  pageSize: number
}

// Get notifications for a user with pagination
export async function getNotificationsAction(
  organizationId: string,
  page: number = 1,
  pageSize: number = 20,
  filters: NotificationFilters = {}
): Promise<ActionState<PaginatedNotifications>> {
  const { userId } = await auth()
  if (!userId) {
    return {
      isSuccess: false,
      message: "Unauthorized: User not logged in."
    }
  }

  // Check if user is Node Officer for the organization
  const isNO = await isNodeOfficerForOrg(userId, organizationId)
  if (!isNO) {
    return {
      isSuccess: false,
      message: "Forbidden: You are not a Node Officer for this organization."
    }
  }

  // Validate pagination parameters
  const validatedPage = validatePaginationPage(page)
  const validatedPageSize = validatePaginationPageSize(pageSize)

  try {
    const offset = (validatedPage - 1) * validatedPageSize

    // Build where conditions
    const conditions = [
      eq(notificationsTable.userId, userId),
      eq(notificationsTable.organizationId, organizationId),
      // Only show non-expired notifications
      or(
        isNull(notificationsTable.expiresAt),
        gte(notificationsTable.expiresAt, new Date())
      )
    ]

    if (filters.isRead !== undefined) {
      conditions.push(eq(notificationsTable.isRead, filters.isRead))
    }
    if (filters.priority) {
      conditions.push(eq(notificationsTable.priority, filters.priority))
    }
    if (filters.type) {
      conditions.push(eq(notificationsTable.type, filters.type))
    }

    // Get total count
    const totalResult = await db
      .select({ count: count() })
      .from(notificationsTable)
      .where(and(...conditions))

    const total = totalResult[0]?.count || 0

    // Get paginated notifications
    const notifications = await db
      .select()
      .from(notificationsTable)
      .where(and(...conditions))
      .orderBy(desc(notificationsTable.createdAt))
      .limit(validatedPageSize)
      .offset(offset)

    const hasMore = offset + notifications.length < total

    return {
      isSuccess: true,
      message: "Notifications retrieved successfully.",
      data: {
        notifications,
        total,
        hasMore,
        page: validatedPage,
        pageSize: validatedPageSize
      }
    }
  } catch (error) {
    console.error("Error getting notifications:", error)
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error"
    return {
      isSuccess: false,
      message: `Failed to retrieve notifications: ${errorMessage}`
    }
  }
}

// System context for internal notification creation
export interface SystemNotificationContext {
  isSystemCall: true
  systemToken: string
}

// Create a new notification with authorization checks
export async function createNotificationAction(
  notification: Omit<InsertNotification, "id" | "createdAt" | "updatedAt">,
  systemContext?: SystemNotificationContext
): Promise<ActionState<SelectNotification>> {
  // Validate system context for internal calls
  if (systemContext?.isSystemCall) {
    const expectedSystemToken = process.env.NOTIFICATION_SYSTEM_TOKEN
    if (
      !expectedSystemToken ||
      systemContext.systemToken !== expectedSystemToken
    ) {
      return {
        isSuccess: false,
        message: "Unauthorized: Invalid system token for notification creation."
      }
    }
  } else {
    // For non-system calls, require user authentication and authorization
    const { userId } = await auth()
    if (!userId) {
      return {
        isSuccess: false,
        message: "Unauthorized: User not logged in."
      }
    }

    // Verify the user has permission to create notifications for the target organization
    if (notification.organizationId) {
      const isNO = await isNodeOfficerForOrg(
        userId,
        notification.organizationId
      )
      if (!isNO) {
        return {
          isSuccess: false,
          message:
            "Forbidden: You are not authorized to create notifications for this organization."
        }
      }
    }

    // Ensure the notification is for the authenticated user or they have proper permissions
    if (notification.userId !== userId) {
      // Only Node Officers can create notifications for other users in their organization
      if (!notification.organizationId) {
        return {
          isSuccess: false,
          message:
            "Forbidden: Cannot create notifications for other users without organization context."
        }
      }

      const isNO = await isNodeOfficerForOrg(
        userId,
        notification.organizationId
      )
      if (!isNO) {
        return {
          isSuccess: false,
          message:
            "Forbidden: Only Node Officers can create notifications for other users."
        }
      }
    }
  }

  try {
    const [newNotification] = await db
      .insert(notificationsTable)
      .values(notification)
      .returning()

    return {
      isSuccess: true,
      message: "Notification created successfully.",
      data: newNotification
    }
  } catch (error) {
    console.error("Error creating notification:", error)
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error"
    return {
      isSuccess: false,
      message: `Failed to create notification: ${errorMessage}`
    }
  }
}

// Mark notification as read
export async function markNotificationAsReadAction(
  notificationId: string
): Promise<ActionState<SelectNotification>> {
  const { userId } = await auth()
  if (!userId) {
    return {
      isSuccess: false,
      message: "Unauthorized: User not logged in."
    }
  }

  try {
    const [updatedNotification] = await db
      .update(notificationsTable)
      .set({
        isRead: true,
        readAt: new Date(),
        updatedAt: new Date()
      })
      .where(
        and(
          eq(notificationsTable.id, notificationId),
          eq(notificationsTable.userId, userId)
        )
      )
      .returning()

    if (!updatedNotification) {
      return {
        isSuccess: false,
        message: "Notification not found or access denied."
      }
    }

    return {
      isSuccess: true,
      message: "Notification marked as read.",
      data: updatedNotification
    }
  } catch (error) {
    console.error("Error marking notification as read:", error)
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error"
    return {
      isSuccess: false,
      message: `Failed to mark notification as read: ${errorMessage}`
    }
  }
}

// Mark all notifications as read for a user in an organization
export async function markAllNotificationsAsReadAction(
  organizationId: string
): Promise<ActionState<{ updatedCount: number }>> {
  const { userId } = await auth()
  if (!userId) {
    return {
      isSuccess: false,
      message: "Unauthorized: User not logged in."
    }
  }

  // Check if user is Node Officer for the organization
  const isNO = await isNodeOfficerForOrg(userId, organizationId)
  if (!isNO) {
    return {
      isSuccess: false,
      message: "Forbidden: You are not a Node Officer for this organization."
    }
  }

  try {
    const result = await db
      .update(notificationsTable)
      .set({
        isRead: true,
        readAt: new Date(),
        updatedAt: new Date()
      })
      .where(
        and(
          eq(notificationsTable.userId, userId),
          eq(notificationsTable.organizationId, organizationId),
          eq(notificationsTable.isRead, false)
        )
      )
      .returning({ id: notificationsTable.id })

    return {
      isSuccess: true,
      message: "All notifications marked as read.",
      data: { updatedCount: result.length }
    }
  } catch (error) {
    console.error("Error marking all notifications as read:", error)
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error"
    return {
      isSuccess: false,
      message: `Failed to mark all notifications as read: ${errorMessage}`
    }
  }
}

// Delete notification
export async function deleteNotificationAction(
  notificationId: string
): Promise<ActionState<void>> {
  const { userId } = await auth()
  if (!userId) {
    return {
      isSuccess: false,
      message: "Unauthorized: User not logged in."
    }
  }

  try {
    const result = await db
      .delete(notificationsTable)
      .where(
        and(
          eq(notificationsTable.id, notificationId),
          eq(notificationsTable.userId, userId)
        )
      )
      .returning({ id: notificationsTable.id })

    if (result.length === 0) {
      return {
        isSuccess: false,
        message: "Notification not found or access denied."
      }
    }

    return {
      isSuccess: true,
      message: "Notification deleted successfully.",
      data: undefined
    }
  } catch (error) {
    console.error("Error deleting notification:", error)
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error"
    return {
      isSuccess: false,
      message: `Failed to delete notification: ${errorMessage}`
    }
  }
}

// Get notification counts
export async function getNotificationCountsAction(
  organizationId: string
): Promise<
  ActionState<{ total: number; unread: number; highPriority: number }>
> {
  const { userId } = await auth()
  if (!userId) {
    return {
      isSuccess: false,
      message: "Unauthorized: User not logged in."
    }
  }

  // Check if user is Node Officer for the organization
  const isNO = await isNodeOfficerForOrg(userId, organizationId)
  if (!isNO) {
    return {
      isSuccess: false,
      message: "Forbidden: You are not a Node Officer for this organization."
    }
  }

  try {
    const baseConditions = [
      eq(notificationsTable.userId, userId),
      eq(notificationsTable.organizationId, organizationId),
      or(
        isNull(notificationsTable.expiresAt),
        gte(notificationsTable.expiresAt, new Date())
      )
    ]

    // Get total count
    const totalResult = await db
      .select({ count: count() })
      .from(notificationsTable)
      .where(and(...baseConditions))

    // Get unread count
    const unreadResult = await db
      .select({ count: count() })
      .from(notificationsTable)
      .where(and(...baseConditions, eq(notificationsTable.isRead, false)))

    // Get high priority unread count
    const highPriorityResult = await db
      .select({ count: count() })
      .from(notificationsTable)
      .where(
        and(
          ...baseConditions,
          eq(notificationsTable.isRead, false),
          eq(notificationsTable.priority, "high")
        )
      )

    return {
      isSuccess: true,
      message: "Notification counts retrieved successfully.",
      data: {
        total: totalResult[0]?.count || 0,
        unread: unreadResult[0]?.count || 0,
        highPriority: highPriorityResult[0]?.count || 0
      }
    }
  } catch (error) {
    console.error("Error getting notification counts:", error)
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error"
    return {
      isSuccess: false,
      message: `Failed to retrieve notification counts: ${errorMessage}`
    }
  }
}

// Helper function to create notifications for specific events
export async function createApprovalRequiredNotificationAction(
  userId: string,
  organizationId: string,
  metadataRecordId: string,
  recordTitle: string
): Promise<ActionState<SelectNotification>> {
  const systemToken = process.env.NOTIFICATION_SYSTEM_TOKEN
  if (!systemToken) {
    return {
      isSuccess: false,
      message: "System configuration error: Missing notification system token."
    }
  }

  return createNotificationAction(
    {
      userId,
      organizationId,
      type: "approval_required",
      title: "New metadata record pending approval",
      message: `A new metadata record "${recordTitle}" has been submitted for validation`,
      priority: "high",
      actionUrl: `/app/metadata/${metadataRecordId}`,
      metadata: {
        recordId: metadataRecordId,
        organizationId
      }
    },
    {
      isSystemCall: true,
      systemToken
    }
  )
}

export async function createUserAddedNotificationAction(
  userId: string,
  organizationId: string,
  newUserName: string
): Promise<ActionState<SelectNotification>> {
  const systemToken = process.env.NOTIFICATION_SYSTEM_TOKEN
  if (!systemToken) {
    return {
      isSuccess: false,
      message: "System configuration error: Missing notification system token."
    }
  }

  return createNotificationAction(
    {
      userId,
      organizationId,
      type: "user_added",
      title: "New user added to organization",
      message: `${newUserName} has been added to your organization`,
      priority: "medium",
      actionUrl: `/app/(node-officer)/organization-users?orgId=${organizationId}`,
      metadata: {
        organizationId
      }
    },
    {
      isSystemCall: true,
      systemToken
    }
  )
}

export async function createDeadlineApproachingNotificationAction(
  userId: string,
  organizationId: string,
  pendingCount: number
): Promise<ActionState<SelectNotification>> {
  const systemToken = process.env.NOTIFICATION_SYSTEM_TOKEN
  if (!systemToken) {
    return {
      isSuccess: false,
      message: "System configuration error: Missing notification system token."
    }
  }

  return createNotificationAction(
    {
      userId,
      organizationId,
      type: "deadline_approaching",
      title: "Metadata review deadline approaching",
      message: `${pendingCount} metadata records have been pending review for over 7 days`,
      priority: "medium",
      actionUrl: `/app/metadata/search?organizationId=${organizationId}&status=Pending+Validation`,
      metadata: {
        organizationId,
        pendingCount
      }
    },
    {
      isSystemCall: true,
      systemToken
    }
  )
}
