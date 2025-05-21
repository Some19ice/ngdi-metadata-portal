"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface OrganizationListSkeletonProps {
  className?: string
  count?: number
}

export default function OrganizationListSkeleton({
  className,
  count = 5
}: OrganizationListSkeletonProps) {
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

      {/* Skeleton for organization data table */}
      <div className="rounded-md border">
        <div className="grid gap-3 p-4">
          <div className="flex items-center">
            <Skeleton className="mr-2 h-4 w-4" />
            <Skeleton className="h-4 w-[120px]" />
            <Skeleton className="mx-2 h-4 w-[80px]" />
            <Skeleton className="mx-2 h-4 w-[100px]" />
            <Skeleton className="mx-2 h-4 w-[80px]" />
            <Skeleton className="mx-2 h-4 w-[100px]" />
            <Skeleton className="mx-2 h-4 w-[80px]" />
            <Skeleton className="ml-auto h-4 w-[60px]" />
          </div>

          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="flex items-center py-3">
              <Skeleton className="mr-2 h-4 w-4" />
              <Skeleton className="h-5 w-[150px]" />
              <Skeleton className="mx-2 h-5 w-[80px]" />
              <Skeleton className="mx-2 h-5 w-[120px]" />
              <Skeleton className="mx-2 h-5 w-[50px]" />
              <Skeleton className="mx-2 h-5 w-[120px]" />
              <Skeleton className="mx-2 h-5 w-[80px]" />
              <Skeleton className="ml-auto h-8 w-8 rounded-full" />
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
        <Skeleton className="h-8 w-8" />
      </div>
    </div>
  )
}
