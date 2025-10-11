"use server"

import { Suspense } from "react"
import { redirect } from "next/navigation"
import SearchErrorBoundary from "./_components/search-error-boundary"
import SimplifiedMetadataSearch from "./_components/simplified-metadata-search"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { parseSearchParams } from "@/lib/utils/search-params-utils"

interface SearchParams {
  // Support both old and new parameter names for backward compatibility
  [key: string]: string | undefined
}

interface SearchPageProps {
  searchParams: Promise<SearchParams>
}

// Loading skeleton for the search interface
function SearchLoadingSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar skeleton */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-20" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-4 w-24" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-16" />
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Results skeleton */}
        <div className="lg:col-span-3 space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="p-4">
                <div className="space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <div className="flex space-x-2">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Generate metadata for the search page
 */
export async function generateMetadata({
  searchParams
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const urlSearchParams = new URLSearchParams(params as Record<string, string>)
  const filters = parseSearchParams(urlSearchParams)

  let title = "Search Metadata - NGDI Portal"
  let description =
    "Search and discover geospatial datasets, maps, and services in Nigeria's National Geospatial Data Infrastructure portal."

  if (filters.query) {
    title = `Search Results for "${filters.query}" - NGDI Portal`
    description = `Search results for "${filters.query}" in Nigeria's geospatial data catalog. Find datasets, maps, and services.`
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website"
    },
    robots: {
      index: false, // Don't index search result pages
      follow: true
    }
  }
}

/**
 * Main metadata search page component
 */
export default async function MetadataSearchPage({
  searchParams
}: SearchPageProps) {
  const params = await searchParams

  // Handle legacy redirects if needed
  // For example, if someone uses old parameter names, we could redirect to new ones
  // This is optional and depends on your backward compatibility strategy

  return (
    <SearchErrorBoundary>
      <Suspense fallback={<SearchLoadingSkeleton />}>
        <SimplifiedMetadataSearch />
      </Suspense>
    </SearchErrorBoundary>
  )
}
