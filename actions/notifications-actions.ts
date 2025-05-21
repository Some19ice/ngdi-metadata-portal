"use server"

import { db } from "@/db/db"
import {
  notificationsTable,
  InsertNotification,
  SelectNotification,
  notificationTypeEnum
} from "@/db/schema/notifications-schema"
import { ActionState } from "@/types"
import { auth } from "@clerk/nextjs/server"
import { eq, desc, and, sql } from "drizzle-orm"

// --- Create Notification Action ---
// This action is more of an internal utility, typically called by other server actions
// when an event that warrants a notification occurs.
export async function createNotificationAction(
  notificationData: Omit<InsertNotification, "id" | "createdAt" | "updatedAt">
): Promise<ActionState<SelectNotification>> {
  // No specific permission check here as this is an internal action.
  // The calling action should have its own permission checks.
  // We do ensure a recipientUserId is provided.
  if (!notificationData.recipientUserId) {
    return {
      isSuccess: false,
      message: "Recipient user ID is required to create a notification."
    }
  }

  try {
    const [newNotification] = await db
      .insert(notificationsTable)
      .values(notificationData)
      .returning()

    if (!newNotification) {
      return { isSuccess: false, message: "Failed to create notification." }
    }

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

// --- Get Notifications For User Action ---
interface GetNotificationsParams {
  limit?: number
  offset?: number
  status?: "read" | "unread" | "all"
}

export async function getNotificationsForUserAction(
  params: GetNotificationsParams = {}
): Promise<
  ActionState<{ notifications: SelectNotification[]; totalCount: number }>
> {
  const { userId: currentUserId } = await auth()
  if (!currentUserId) {
    return { isSuccess: false, message: "User not authenticated." }
  }

  const { limit = 10, offset = 0, status = "all" } = params

  try {
    let condition = eq(notificationsTable.recipientUserId, currentUserId)

    if (status === "read") {
      condition = and(condition, eq(notificationsTable.isRead, true))
    } else if (status === "unread") {
      condition = and(condition, eq(notificationsTable.isRead, false))
    }

    const notifications = await db
      .select()
      .from(notificationsTable)
      .where(condition)
      .orderBy(desc(notificationsTable.createdAt))
      .limit(limit)
      .offset(offset)

    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(notificationsTable)
      .where(condition)

    const totalCount = totalResult[0]?.count || 0

    return {
      isSuccess: true,
      message: "Notifications retrieved successfully.",
      data: { notifications, totalCount }
    }
  } catch (error) {
    console.error("Error getting notifications:", error)
    return { isSuccess: false, message: "Failed to retrieve notifications." }
  }
}

// --- Mark Notification As Read Action ---
export async function markNotificationAsReadAction(
  notificationId: string
): Promise<ActionState<SelectNotification>> {
  const { userId: currentUserId } = await auth()
  if (!currentUserId) {
    return { isSuccess: false, message: "User not authenticated." }
  }

  try {
    const [notification] = await db
      .select()
      .from(notificationsTable)
      .where(eq(notificationsTable.id, notificationId))

    if (!notification) {
      return { isSuccess: false, message: "Notification not found." }
    }

    if (notification.recipientUserId !== currentUserId) {
      return {
        isSuccess: false,
        message: "Forbidden: You cannot mark this notification as read."
      }
    }

    if (notification.isRead) {
      return {
        isSuccess: true,
        message: "Notification already marked as read.",
        data: notification
      }
    }

    const [updatedNotification] = await db
      .update(notificationsTable)
      .set({ isRead: true, updatedAt: new Date() })
      .where(eq(notificationsTable.id, notificationId))
      .returning()

    return {
      isSuccess: true,
      message: "Notification marked as read.",
      data: updatedNotification
    }
  } catch (error) {
    console.error("Error marking notification as read:", error)
    return {
      isSuccess: false,
      message: "Failed to mark notification as read."
    }
  }
}

// --- Mark All Notifications As Read Action ---
export async function markAllNotificationsAsReadAction(): Promise<
  ActionState<{ count: number }>
> {
  const { userId: currentUserId } = await auth()
  if (!currentUserId) {
    return { isSuccess: false, message: "User not authenticated." }
  }

  try {
    const result = await db
      .update(notificationsTable)
      .set({ isRead: true, updatedAt: new Date() })
      .where(
        and(
          eq(notificationsTable.recipientUserId, currentUserId),
          eq(notificationsTable.isRead, false)
        )
      )
      .returning({ id: notificationsTable.id }) // Only need to know how many were updated

    return {
      isSuccess: true,
      message: `${result.length} notifications marked as read.`,
      data: { count: result.length }
    }
  } catch (error) {
    console.error("Error marking all notifications as read:", error)
    return {
      isSuccess: false,
      message: "Failed to mark all notifications as read."
    }
  }
}
