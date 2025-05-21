"use client"

import { Skeleton } from "@/components/ui/skeleton"

interface ViewMetadataRecordSkeletonProps {
  className?: string
}

export default function ViewMetadataRecordSkeleton({
  className
}: ViewMetadataRecordSkeletonProps) {
  return (
    <div className={className}>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-1/3" />
          <div className="flex space-x-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>

        {[...Array(5)].map((_, sectionIndex) => (
          <div key={sectionIndex} className="space-y-4">
            <Skeleton className="h-6 w-1/4" />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {[...Array(4)].map((_, itemIndex) => (
                <div key={itemIndex} className="space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="mt-8 flex justify-end space-x-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    </div>
  )
}
