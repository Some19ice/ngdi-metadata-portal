"use client"

import { Skeleton } from "@/components/ui/skeleton"

export default function OrganizationUserListSkeleton() {
  return (
    <div className="space-y-4">
      <div className="mb-6 flex items-center justify-between">
        <Skeleton className="h-8 w-1/3" /> {/* Search input skeleton */}
        <Skeleton className="h-10 w-28" /> {/* Add user button skeleton */}
      </div>
      <div className="rounded-md border">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between border-b p-4 last:border-b-0"
          >
            <div className="flex items-center space-x-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div>
                <Skeleton className="h-5 w-32" />
                <Skeleton className="mt-1 h-4 w-48" />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Skeleton className="h-5 w-20" /> {/* Role skeleton */}
              <Skeleton className="h-8 w-8 rounded-md" />{" "}
              {/* Actions menu skeleton */}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
