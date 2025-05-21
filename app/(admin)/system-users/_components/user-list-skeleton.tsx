"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface UserListSkeletonProps {
  className?: string
  count?: number
}

export default function UserListSkeleton({
  className,
  count = 8
}: UserListSkeletonProps) {
  return (
    <div className={className}>
      {/* Skeleton for search and filter */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">
            <Skeleton className="h-4 w-40" />
          </CardTitle>
          <Skeleton className="h-3 w-28" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <div className="flex space-x-2">
              <Skeleton className="h-10 w-10" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Skeleton for user table */}
      <div className="rounded-lg border shadow-sm">
        <div className="p-4">
          <div className="flex items-center">
            <Skeleton className="mr-2 h-4 w-4" />
            <Skeleton className="mr-4 h-4 w-[60px]" />
            <Skeleton className="mr-4 h-4 w-[80px]" />
            <Skeleton className="mr-4 h-4 w-[100px]" />
            <Skeleton className="mr-4 h-4 w-[60px]" />
            <Skeleton className="mr-4 h-4 w-[80px]" />
            <Skeleton className="ml-auto h-4 w-[60px]" />
          </div>

          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="mt-4 flex items-center">
              <Skeleton className="mr-2 h-4 w-4" />
              <Skeleton className="mr-4 h-10 w-10 rounded-full" />
              <div className="mr-4 w-[80px]">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="mt-1 h-3 w-3/4" />
              </div>
              <Skeleton className="mr-4 h-4 w-[150px]" />
              <div className="mr-4 w-[60px]">
                <Skeleton className="h-5 w-full rounded-full" />
              </div>
              <Skeleton className="mr-4 h-4 w-[80px]" />
              <Skeleton className="ml-auto h-8 w-8 rounded-md" />
            </div>
          ))}
        </div>
      </div>

      {/* Skeleton for pagination */}
      <div className="mt-4 flex items-center justify-center space-x-1">
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-8 w-8" />
      </div>
    </div>
  )
}
