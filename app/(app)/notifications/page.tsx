"use server"

import { Suspense } from "react"
import NotificationsListFetcher from "./_components/notifications-list-fetcher"
import NotificationsListSkeleton from "./_components/notifications-list-skeleton"
import { Button } from "@/components/ui/button"
import { markAllNotificationsAsReadAction } from "@/actions/notifications-actions"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

// Helper server action to be called from a form
async function handleMarkAllRead() {
  "use server"
  const authResult = await auth()
  const userId = authResult.userId
  if (!userId) {
    // This should ideally not happen if page access is protected
    console.error("User not authenticated to mark all notifications as read.")
    return
  }
  const result = await markAllNotificationsAsReadAction()
  if (result.isSuccess) {
    revalidatePath("/notifications") // Revalidate to show updated read status
  } else {
    console.error("Failed to mark all notifications as read:", result.message)
    // Optionally, you could redirect with an error query param or use a toast notification system
  }
}

export default async function NotificationsPage() {
  const authResult = await auth()
  const userId = authResult.userId

  if (!userId) {
    redirect("/login") // Or your appropriate login page
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Notifications</h1>
        <form action={handleMarkAllRead}>
          <Button type="submit" variant="outline">
            Mark all as Read
          </Button>
        </form>
      </div>

      <Suspense fallback={<NotificationsListSkeleton />}>
        <NotificationsListFetcher />
      </Suspense>
    </div>
  )
}
