"use server"

import { Suspense } from "react"
import MetadataSearchForm from "./_components/metadata-search-form"
import UnifiedSearchFetcher from "./_components/unified-search-fetcher"
import MetadataSearchSkeleton from "./_components/metadata-search-skeleton"
import EnhancedMetadataSearch from "./_components/enhanced-metadata-search"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface SearchParams {
  query?: string
  temporalExtentStartDate?: string
  temporalExtentEndDate?: string
  frameworkType?: string
  datasetType?: string
  useSpatialSearch?: string
  bbox_north?: string
  bbox_south?: string
  bbox_east?: string
  bbox_west?: string
  sortBy?: string
  sortOrder?: string
  page?: string
}

interface SearchPageProps {
  searchParams: Promise<SearchParams>
}

const DEFAULT_PAGE_SIZE = 10

export default async function MetadataSearchPage({
  searchParams: searchParamsPromise
}: SearchPageProps) {
  const searchParams = await searchParamsPromise

  const query = searchParams?.query || ""
  const startDate = searchParams?.temporalExtentStartDate || ""
  const endDate = searchParams?.temporalExtentEndDate || ""
  const frameworkType = searchParams?.frameworkType || ""
  const datasetType = searchParams?.datasetType || ""
  const useSpatialSearch = searchParams?.useSpatialSearch === "true"
  const bbox_north = searchParams?.bbox_north || ""
  const bbox_south = searchParams?.bbox_south || ""
  const bbox_east = searchParams?.bbox_east || ""
  const bbox_west = searchParams?.bbox_west || ""
  const sortBy = searchParams?.sortBy || "updatedAt" // Default sort
  const sortOrder = searchParams?.sortOrder || "desc" // Default order
  const page = searchParams?.page || "1"

  // A key for the Suspense boundary based on all search params to force re-render on change
  const suspenseKey = `${query}-${startDate}-${endDate}-${frameworkType}-${datasetType}-${useSpatialSearch}-${bbox_north}-${bbox_south}-${bbox_east}-${bbox_west}-${sortBy}-${sortOrder}-${page}`

  const parsedPage = parseInt(page, 10)
  const currentPage = isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage

  const parsedSortOrder =
    sortOrder === "asc" || sortOrder === "desc" ? sortOrder : "desc"

  return (
    <div className="space-y-6">
      <Tabs defaultValue="enhanced" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="enhanced">Enhanced Search</TabsTrigger>
          <TabsTrigger value="basic">Basic Search</TabsTrigger>
        </TabsList>

        <TabsContent value="enhanced" className="space-y-6">
          <EnhancedMetadataSearch />
        </TabsContent>

        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Search Metadata Records</CardTitle>
            </CardHeader>
            <CardContent>
              <MetadataSearchForm
                initialQuery={query}
                initialStartDate={startDate}
                initialEndDate={endDate}
                initialFrameworkType={frameworkType}
                initialDatasetType={datasetType}
                initialUseSpatialSearch={useSpatialSearch}
                initialBboxNorth={bbox_north}
                initialBboxSouth={bbox_south}
                initialBboxEast={bbox_east}
                initialBboxWest={bbox_west}
              />
            </CardContent>
          </Card>

          {/* Conditionally render results section only if any search parameter is active */}
          {(query ||
            startDate ||
            endDate ||
            frameworkType ||
            datasetType ||
            useSpatialSearch) && (
            <Suspense key={suspenseKey} fallback={<MetadataSearchSkeleton />}>
              <UnifiedSearchFetcher
                query={query}
                startDate={startDate}
                endDate={endDate}
                frameworkType={frameworkType}
                datasetType={datasetType}
                useSpatialSearch={useSpatialSearch}
                bbox_north={bbox_north}
                bbox_south={bbox_south}
                bbox_east={bbox_east}
                bbox_west={bbox_west}
                sortBy={sortBy}
                sortOrder={parsedSortOrder}
                page={currentPage}
                pageSize={DEFAULT_PAGE_SIZE}
                viewMode="map"
              />
            </Suspense>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
