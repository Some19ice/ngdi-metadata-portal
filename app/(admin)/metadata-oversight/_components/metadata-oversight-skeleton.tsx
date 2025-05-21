"use client"

import { Skeleton } from "@/components/ui/skeleton"

export default function MetadataOversightSkeleton({
  rows = 5
}: {
  rows?: number
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between pb-4">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-8 w-28" />
      </div>

      <div className="rounded-md border">
        <div className="flex p-4 bg-muted/50">
          <Skeleton className="h-5 w-1/6" />
          <Skeleton className="h-5 w-1/4 ml-4" />
          <Skeleton className="h-5 w-1/5 ml-auto" />
          <Skeleton className="h-5 w-24 ml-4" />
        </div>

        {Array(rows)
          .fill(null)
          .map((_, i) => (
            <div key={i} className="flex items-center p-4 border-t">
              <Skeleton className="h-5 w-1/6" />
              <Skeleton className="h-5 w-1/3 ml-4" />
              <Skeleton className="h-5 w-28 ml-auto" />
              <Skeleton className="h-9 w-20 ml-4" />
            </div>
          ))}
      </div>

      <div className="flex items-center justify-end pt-4">
        <Skeleton className="h-9 w-36" />
      </div>
    </div>
  )
}
