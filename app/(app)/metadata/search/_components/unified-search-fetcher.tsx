"use server"

import {
  searchMetadataRecordsAction,
  MetadataRecordWithOrganization
} from "@/actions/db/metadata-records-actions"
import MetadataSearchResultsList from "./metadata-search-results-list"
import IntegratedSearchMapView from "./integrated-search-map-view"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface UnifiedSearchFetcherProps {
  query: string
  startDate?: string
  endDate?: string
  frameworkType?: string
  datasetType?: string
  useSpatialSearch?: boolean
  bbox_north?: string
  bbox_south?: string
  bbox_east?: string
  bbox_west?: string
  sortBy: string
  sortOrder: "asc" | "desc"
  page: number
  pageSize: number
  viewMode?: "list" | "map"
}

export default async function UnifiedSearchFetcher({
  query,
  startDate,
  endDate,
  frameworkType,
  datasetType,
  useSpatialSearch = false,
  bbox_north,
  bbox_south,
  bbox_east,
  bbox_west,
  sortBy,
  sortOrder,
  page,
  pageSize,
  viewMode = "list"
}: UnifiedSearchFetcherProps) {
  const shouldFetch =
    query.trim() !== "" ||
    startDate ||
    endDate ||
    frameworkType ||
    datasetType ||
    useSpatialSearch

  if (!shouldFetch) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Search Results</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="border-l-sky-500 border-l-4">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Ready to Search</AlertTitle>
            <AlertDescription>
              Enter a search term or select filters to find metadata records.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  // Only add spatial search parameters if useSpatialSearch is true
  const spatialParams = useSpatialSearch
    ? {
        bbox_north,
        bbox_south,
        bbox_east,
        bbox_west
      }
    : {}

  // Construct search parameters for the action
  const searchActionParams = {
    query,
    temporalExtentStartDate: startDate,
    temporalExtentEndDate: endDate,
    frameworkType,
    datasetType,
    ...spatialParams,
    sortBy,
    sortOrder,
    page,
    pageSize
  }

  const {
    data: searchResults,
    message,
    isSuccess
  } = await searchMetadataRecordsAction(searchActionParams)

  if (!isSuccess) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Search Results</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Error Fetching Results</AlertTitle>
            <AlertDescription>
              {message || "An unexpected error occurred."}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  const commonProps = {
    initialResults: searchResults?.records || [],
    totalRecords: searchResults?.totalRecords || 0,
    totalPages: searchResults?.totalPages || 0,
    currentPage: searchResults?.currentPage || 1,
    pageSize: searchResults?.pageSize || pageSize
  }

  // Render based on view mode
  if (viewMode === "map") {
    const searchParams = {
      query,
      temporalExtentStartDate: startDate,
      temporalExtentEndDate: endDate,
      frameworkType,
      datasetType,
      useSpatialSearch,
      bbox_north,
      bbox_south,
      bbox_east,
      bbox_west,
      sortBy,
      sortOrder
    }

    return (
      <IntegratedSearchMapView {...commonProps} searchParams={searchParams} />
    )
  }

  // Default to list view
  return <MetadataSearchResultsList {...commonProps} query={query} />
}
