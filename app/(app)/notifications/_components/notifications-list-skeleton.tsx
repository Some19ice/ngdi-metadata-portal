"use client"

import { Skeleton } from "@/components/ui/skeleton"

export default function NotificationsListSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="p-4 border rounded-lg flex items-start space-x-4"
        >
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-1/4 mt-1" />
          </div>
          <Skeleton className="h-6 w-20" />{" "}
          {/* Placeholder for action button */}
        </div>
      ))}
    </div>
  )
}
