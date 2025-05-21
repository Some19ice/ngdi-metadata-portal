"use server"

import { getNotificationsForUserAction } from "@/actions/notifications-actions"
import NotificationsList from "./notifications-list"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

// We might add pagination later, but for now, fetch all notifications for the user.

export default async function NotificationsListFetcher() {
  const authResult = await auth()
  const userId = authResult.userId

  if (!userId) {
    // This should ideally be caught by the page-level auth check,
    // but as a safeguard:
    redirect("/login")
  }

  const result = await getNotificationsForUserAction()

  if (!result.isSuccess || !result.data || !result.data.notifications) {
    return (
      <div className="text-center py-10">
        <p className="text-lg text-muted-foreground">
          Could not load notifications. {result.message}
        </p>
      </div>
    )
  }

  if (result.data.notifications.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-lg text-muted-foreground">
          You have no notifications.
        </p>
      </div>
    )
  }

  return (
    <NotificationsList
      notifications={result.data.notifications}
      currentUserId={userId}
    />
  )
}
