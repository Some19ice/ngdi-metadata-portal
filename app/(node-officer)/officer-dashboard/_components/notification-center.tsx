"use client"

import { useState, useTransition, useEffect, useCallback } from "react"
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
  Settings,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { SelectNotification } from "@/db/schema"
import {
  getNotificationsAction,
  markNotificationAsReadAction,
  markAllNotificationsAsReadAction,
  deleteNotificationAction,
  getNotificationCountsAction,
  type NotificationFilters
} from "@/actions/db/notifications-actions"

interface NotificationCenterProps {
  organizationId: string
  initialNotifications?: SelectNotification[]
}

export default function NotificationCenter({
  organizationId,
  initialNotifications = []
}: NotificationCenterProps) {
  const [notifications, setNotifications] =
    useState<SelectNotification[]>(initialNotifications)
  const [filter, setFilter] = useState<"all" | "unread" | "high">("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const [counts, setCounts] = useState({ total: 0, unread: 0, highPriority: 0 })
  const [isPending, startTransition] = useTransition()
  const [isLoading, setIsLoading] = useState(false)

  const pageSize = 10

  // Load notifications
  const loadNotifications = useCallback(
    async (page: number = 1, filterType: typeof filter = "all") => {
      setIsLoading(true)
      try {
        const filters: NotificationFilters = {}

        if (filterType === "unread") {
          filters.isRead = false
        } else if (filterType === "high") {
          filters.priority = "high"
          filters.isRead = false
        }

        const result = await getNotificationsAction(
          organizationId,
          page,
          pageSize,
          filters
        )

        if (result.isSuccess && result.data) {
          if (page === 1) {
            setNotifications(result.data.notifications)
          } else {
            setNotifications(prev => [
              ...prev,
              ...(result.data?.notifications || [])
            ])
          }
          setCurrentPage(page)
        } else {
          toast.error(result.message || "Failed to load notifications")
        }
      } catch (error) {
        toast.error("Failed to load notifications")
      } finally {
        setIsLoading(false)
      }
    },
    [organizationId]
  )

  // Load notification counts
  const loadCounts = useCallback(async () => {
    try {
      const result = await getNotificationCountsAction(organizationId)
      if (result.isSuccess && result.data) {
        setCounts(result.data)
      }
    } catch (error) {
      console.error("Failed to load notification counts:", error)
    }
  }, [organizationId])

  // Initial load
  useEffect(() => {
    loadNotifications(1, filter)
    loadCounts()
  }, [organizationId, filter, loadNotifications, loadCounts])

  const markAsRead = async (notificationId: string) => {
    startTransition(async () => {
      try {
        const result = await markNotificationAsReadAction(notificationId)
        if (result.isSuccess) {
          // Capture the notification before updating state
          const notificationToUpdate = notifications.find(
            n => n.id === notificationId
          )

          setNotifications(prev =>
            prev.map(n =>
              n.id === notificationId ? { ...n, isRead: true } : n
            )
          )
          // Update counts using the captured notification
          setCounts(prev => ({
            ...prev,
            unread: Math.max(0, prev.unread - 1),
            highPriority:
              notificationToUpdate?.priority === "high"
                ? Math.max(0, prev.highPriority - 1)
                : prev.highPriority
          }))
        } else {
          toast.error(result.message || "Failed to mark as read")
        }
      } catch (error) {
        toast.error("Failed to mark notification as read")
      }
    })
  }

  const markAllAsRead = async () => {
    startTransition(async () => {
      try {
        const result = await markAllNotificationsAsReadAction(organizationId)
        if (result.isSuccess) {
          setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
          setCounts(prev => ({ ...prev, unread: 0, highPriority: 0 }))
          toast.success("All notifications marked as read")
        } else {
          toast.error(result.message || "Failed to mark all as read")
        }
      } catch (error) {
        toast.error("Failed to mark all notifications as read")
      }
    })
  }

  const deleteNotification = async (notificationId: string) => {
    startTransition(async () => {
      try {
        const result = await deleteNotificationAction(notificationId)
        if (result.isSuccess) {
          const deletedNotification = notifications.find(
            n => n.id === notificationId
          )
          setNotifications(prev => prev.filter(n => n.id !== notificationId))
          // Update counts
          setCounts(prev => ({
            total: Math.max(0, prev.total - 1),
            unread: deletedNotification?.isRead
              ? prev.unread
              : Math.max(0, prev.unread - 1),
            highPriority:
              deletedNotification?.priority === "high" &&
              !deletedNotification?.isRead
                ? Math.max(0, prev.highPriority - 1)
                : prev.highPriority
          }))
          toast.success("Notification deleted")
        } else {
          toast.error(result.message || "Failed to delete notification")
        }
      } catch (error) {
        toast.error("Failed to delete notification")
      }
    })
  }

  const loadMore = () => {
    if (hasMore && !isLoading) {
      loadNotifications(currentPage + 1, filter)
    }
  }

  const getNotificationIcon = (type: SelectNotification["type"]) => {
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
      case "record_approved":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "record_rejected":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case "role_assigned":
        return <Info className="h-4 w-4 text-blue-500" />
      case "role_removed":
        return <Info className="h-4 w-4 text-orange-500" />
      case "organization_updated":
        return <Settings className="h-4 w-4 text-purple-500" />
      default:
        return <Bell className="h-4 w-4 text-gray-500" />
    }
  }

  const getPriorityBadge = (priority: SelectNotification["priority"]) => {
    switch (priority) {
      case "urgent":
        return <Badge variant="destructive">Urgent</Badge>
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
              {counts.unread > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {counts.unread}
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
                  All Notifications ({counts.total})
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter("unread")}>
                  Unread ({counts.unread})
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter("high")}>
                  High Priority ({counts.highPriority})
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {counts.unread > 0 && (
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
          {isLoading && notifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {filter === "all"
                ? "No notifications yet"
                : `No ${filter} notifications`}
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map(notification => (
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

              {/* Pagination Controls */}
              {hasMore && (
                <div className="text-center pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={loadMore}
                    disabled={isLoading || isPending}
                  >
                    {isLoading ? "Loading..." : "Load More"}
                  </Button>
                </div>
              )}

              {isLoading && notifications.length > 0 && (
                <div className="text-center py-2 text-muted-foreground text-sm">
                  Loading more notifications...
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
