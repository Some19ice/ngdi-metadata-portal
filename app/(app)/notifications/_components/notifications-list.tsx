"use client"

import { SelectNotification } from "@/db/schema"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { markNotificationAsReadAction } from "@/actions/notifications-actions"
import { useRouter } from "next/navigation"
import { format, formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"
import { AlertTriangle, BellRing, CheckCircle, Info } from "lucide-react"
import Link from "next/link"

interface NotificationsListProps {
  notifications: SelectNotification[]
  currentUserId: string
}

// Helper to get an icon based on notification type
function getNotificationIcon(type: SelectNotification["type"]) {
  switch (type) {
    case "record_published":
      return <Info className="h-5 w-5 text-blue-500" />
    case "role_assigned":
      return <CheckCircle className="h-5 w-5 text-green-500" />
    case "system_update":
      return <AlertTriangle className="h-5 w-5 text-red-500" />
    default:
      return <BellRing className="h-5 w-5 text-gray-500" />
  }
}

export default function NotificationsList({
  notifications,
  currentUserId
}: NotificationsListProps) {
  const router = useRouter()

  const handleMarkAsRead = async (notificationId: string) => {
    // Optimistic UI update could be added here if desired
    const result = await markNotificationAsReadAction(notificationId)
    if (result.isSuccess) {
      router.refresh() // Re-fetch data to update the list
    } else {
      // Handle error - perhaps show a toast
      console.error("Failed to mark notification as read:", result.message)
      alert(`Error: ${result.message}`)
    }
  }

  return (
    <div className="space-y-4">
      {notifications.map(notification => (
        <div
          key={notification.id}
          className={cn(
            "p-4 border rounded-lg flex items-start space-x-4",
            !notification.isRead && "bg-primary/5 border-primary/20"
          )}
        >
          <div className="flex-shrink-0 mt-1">
            {getNotificationIcon(notification.type)}
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex justify-between items-start">
              <h3 className="font-semibold text-sm md:text-base">
                {notification.title}
              </h3>
              <p className="text-xs text-muted-foreground whitespace-nowrap">
                {formatDistanceToNow(new Date(notification.createdAt), {
                  addSuffix: true
                })}
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              {notification.message}
            </p>
            {notification.actionUrl && (
              <Link href={notification.actionUrl} passHref legacyBehavior>
                <a className="text-xs text-blue-600 hover:underline">
                  View Details
                </a>
              </Link>
            )}
          </div>
          {!notification.isRead && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleMarkAsRead(notification.id)}
              className="ml-auto self-center flex-shrink-0"
            >
              Mark as Read
            </Button>
          )}
          {notification.isRead && (
            <Badge
              variant="secondary"
              className="ml-auto self-center flex-shrink-0 whitespace-nowrap"
            >
              Read - {format(new Date(notification.updatedAt), "MMM d, HH:mm")}
            </Badge>
          )}
        </div>
      ))}
    </div>
  )
}
