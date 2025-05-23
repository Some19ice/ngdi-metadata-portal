"use client"

import { useState, useTransition } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import {
  Bell,
  CheckCircle,
  AlertTriangle,
  Info,
  Clock,
  MoreHorizontal,
  Eye,
  Trash2,
  Settings
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

interface Notification {
  id: string
  type:
    | "approval_required"
    | "user_added"
    | "deadline_approaching"
    | "system_update"
    | "record_published"
  title: string
  message: string
  createdAt: Date
  isRead: boolean
  priority: "low" | "medium" | "high"
  actionUrl?: string
  metadata?: {
    recordId?: string
    userId?: string
    organizationId?: string
  }
}

interface NotificationCenterProps {
  organizationId: string
  initialNotifications: Notification[]
}

export default function NotificationCenter({
  organizationId,
  initialNotifications
}: NotificationCenterProps) {
  const [notifications, setNotifications] = useState(initialNotifications)
  const [filter, setFilter] = useState<"all" | "unread" | "high">("all")
  const [isPending, startTransition] = useTransition()

  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case "unread":
        return !notification.isRead
      case "high":
        return notification.priority === "high"
      default:
        return true
    }
  })

  const unreadCount = notifications.filter(n => !n.isRead).length
  const highPriorityCount = notifications.filter(
    n => n.priority === "high" && !n.isRead
  ).length

  const markAsRead = async (notificationId: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === notificationId ? { ...n, isRead: true } : n))
    )
    // TODO: Implement API call to mark as read
  }

  const markAllAsRead = async () => {
    startTransition(async () => {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      toast.success("All notifications marked as read")
      // TODO: Implement API call to mark all as read
    })
  }

  const deleteNotification = async (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId))
    toast.success("Notification deleted")
    // TODO: Implement API call to delete notification
  }

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "approval_required":
        return <CheckCircle className="h-4 w-4 text-blue-500" />
      case "user_added":
        return <Info className="h-4 w-4 text-green-500" />
      case "deadline_approaching":
        return <AlertTriangle className="h-4 w-4 text-orange-500" />
      case "system_update":
        return <Settings className="h-4 w-4 text-purple-500" />
      case "record_published":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      default:
        return <Bell className="h-4 w-4 text-gray-500" />
    }
  }

  const getPriorityBadge = (priority: Notification["priority"]) => {
    switch (priority) {
      case "high":
        return <Badge variant="destructive">High</Badge>
      case "medium":
        return <Badge variant="secondary">Medium</Badge>
      case "low":
        return <Badge variant="outline">Low</Badge>
    }
  }

  const getTimeAgo = (date: Date) => {
    const now = new Date()
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    )

    if (diffInMinutes < 1) return "Just now"
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`

    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`

    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`

    return date.toLocaleDateString()
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadCount}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Stay updated with important organization activities
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Filter:{" "}
                  {filter === "all"
                    ? "All"
                    : filter === "unread"
                      ? "Unread"
                      : "High Priority"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Filter Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setFilter("all")}>
                  All Notifications
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter("unread")}>
                  Unread ({unreadCount})
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter("high")}>
                  High Priority ({highPriorityCount})
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={markAllAsRead}
                disabled={isPending}
              >
                Mark All Read
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {filter === "all"
                ? "No notifications yet"
                : `No ${filter} notifications`}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map(notification => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg border transition-colors ${
                    notification.isRead
                      ? "bg-background"
                      : "bg-muted/50 border-primary/20"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4
                            className={`text-sm font-medium ${
                              notification.isRead
                                ? "text-muted-foreground"
                                : "text-foreground"
                            }`}
                          >
                            {notification.title}
                          </h4>
                          {getPriorityBadge(notification.priority)}
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-primary rounded-full" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {getTimeAgo(notification.createdAt)}
                          </span>
                          {notification.actionUrl && (
                            <Link href={notification.actionUrl}>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => markAsRead(notification.id)}
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {!notification.isRead && (
                          <DropdownMenuItem
                            onClick={() => markAsRead(notification.id)}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Mark as Read
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => deleteNotification(notification.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
