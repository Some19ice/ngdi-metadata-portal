"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import dynamic from "next/dynamic"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Map,
  List,
  Grid3X3,
  Search,
  Filter,
  MapPin,
  RotateCcw,
  Layers,
  ChevronLeft,
  ChevronRight,
  Square,
  MousePointer
} from "lucide-react"
import { cn } from "@/lib/utils"
import { MetadataRecord } from "@/lib/map-utils"
import { useSpatialSearch } from "@/lib/hooks/use-spatial-search"
import {
  MetadataRecordWithOrganization,
  PaginatedMetadataRecords
} from "@/actions/db/metadata-records-actions"

// Dynamically import map components to avoid SSR issues
const MetadataMapDisplay = dynamic(
  () => import("@/components/ui/map/metadata-map-display"),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[600px] w-full rounded-md" />
  }
)

const MetadataSearchForm = dynamic(() => import("./metadata-search-form"), {
  ssr: false,
  loading: () => <Skeleton className="h-[200px] w-full rounded-md" />
})

interface IntegratedSearchMapViewProps {
  initialResults: MetadataRecordWithOrganization[]
  totalRecords: number
  totalPages: number
  currentPage: number
  pageSize: number
  searchParams: {
    query?: string
    temporalExtentStartDate?: string
    temporalExtentEndDate?: string
    frameworkType?: string
    datasetType?: string
    useSpatialSearch?: boolean
    bbox_north?: string
    bbox_south?: string
    bbox_east?: string
    bbox_west?: string
    sortBy?: string
    sortOrder?: "asc" | "desc"
  }
}

type ViewMode = "map" | "list" | "split"

export default function IntegratedSearchMapView({
  initialResults,
  totalRecords,
  totalPages,
  currentPage,
  pageSize,
  searchParams
}: IntegratedSearchMapViewProps) {
  const router = useRouter()
  const urlSearchParams = useSearchParams()

  const [viewMode, setViewMode] = useState<ViewMode>("split")
  const [selectedRecord, setSelectedRecord] =
    useState<MetadataRecordWithOrganization | null>(null)
  const [showSearchPanel, setShowSearchPanel] = useState(true)
  const [highlightedRecords, setHighlightedRecords] = useState<string[]>([])
  const [mapInstance, setMapInstance] = useState<any>(null)
  const [spatialSearchEnabled, setSpatialSearchEnabled] = useState(false)

  // Handle spatial search bounds changes
  const handleSpatialBoundsChange = useCallback(
    (
      bounds: {
        north: number
        south: number
        east: number
        west: number
      } | null
    ) => {
      if (bounds) {
        const params = new URLSearchParams(urlSearchParams)
        params.set("useSpatialSearch", "true")
        params.set("bbox_north", bounds.north.toString())
        params.set("bbox_south", bounds.south.toString())
        params.set("bbox_east", bounds.east.toString())
        params.set("bbox_west", bounds.west.toString())
        params.set("page", "1") // Reset to first page

        router.push(`/metadata/search?${params.toString()}`)
      }
    },
    [urlSearchParams, router]
  )

  // Set up spatial search
  const spatialSearch = useSpatialSearch({
    map: mapInstance,
    onBoundsChange: handleSpatialBoundsChange,
    enabled: spatialSearchEnabled
  })

  // Convert metadata records to map format
  const mapRecords: MetadataRecord[] = useMemo(() => {
    return initialResults.map(record => ({
      id: record.id,
      title: record.title,
      abstract: record.abstract || "",
      dataType: record.dataType,
      frameworkType: record.frameworkType || "",
      keywords: record.keywords || [],
      status: record.status,
      productionDate: record.productionDate
        ? new Date(record.productionDate).toISOString()
        : null,
      updatedAt: record.updatedAt,
      organizationId: record.organizationId,
      thumbnailUrl: record.thumbnailUrl,
      spatialInfo: record.spatialInfo,
      temporalInfo: record.temporalInfo,
      distributionInfo: record.distributionInfo,
      organization: record.organization
    }))
  }, [initialResults])

  // Handle record selection from map or list
  const handleRecordClick = useCallback(
    (record: MetadataRecord | MetadataRecordWithOrganization) => {
      const matchingRecord = initialResults.find(r => r.id === record.id)
      if (matchingRecord) {
        setSelectedRecord(matchingRecord)
        setHighlightedRecords([record.id])
      }
    },
    [initialResults]
  )

  // Handle clearing spatial search
  const handleClearSpatialSearch = useCallback(() => {
    const params = new URLSearchParams(urlSearchParams)
    params.delete("useSpatialSearch")
    params.delete("bbox_north")
    params.delete("bbox_south")
    params.delete("bbox_east")
    params.delete("bbox_west")
    params.set("page", "1")

    router.push(`/metadata/search?${params.toString()}`)
  }, [urlSearchParams, router])

  // Handle pagination
  const handlePageChange = useCallback(
    (page: number) => {
      const params = new URLSearchParams(urlSearchParams)
      params.set("page", page.toString())
      router.push(`/metadata/search?${params.toString()}`)
    },
    [urlSearchParams, router]
  )

  // Handle view record details
  const handleViewRecord = useCallback(
    (recordId: string) => {
      router.push(`/metadata/${recordId}`)
    },
    [router]
  )

  // Handle spatial search toggle
  const handleToggleSpatialSearch = useCallback(() => {
    if (spatialSearchEnabled) {
      setSpatialSearchEnabled(false)
      spatialSearch.disableDrawing()
    } else {
      setSpatialSearchEnabled(true)
      spatialSearch.enableDrawing()
    }
  }, [spatialSearchEnabled, spatialSearch])

  // Handle map instance change
  const handleMapInstanceChange = useCallback((map: any) => {
    setMapInstance(map)
  }, [])

  // Calculate grid columns based on view mode
  const gridCols = useMemo(() => {
    switch (viewMode) {
      case "map":
        return "grid-cols-1"
      case "list":
        return "grid-cols-1"
      case "split":
        return "grid-cols-1 lg:grid-cols-2"
      default:
        return "grid-cols-1 lg:grid-cols-2"
    }
  }, [viewMode])

  return (
    <div className="space-y-6">
      {/* Search Controls Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <CardTitle>Search Results</CardTitle>
              <Badge variant="secondary">
                {totalRecords} record{totalRecords !== 1 ? "s" : ""} found
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              {/* View Mode Toggle */}
              <div className="flex border rounded-md">
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="rounded-r-none"
                  title="List View"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "split" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("split")}
                  className="rounded-none"
                  title="Split View"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "map" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("map")}
                  className="rounded-l-none"
                  title="Map View"
                >
                  <Map className="h-4 w-4" />
                </Button>
              </div>

              {/* Spatial Search Toggle */}
              <Button
                variant={spatialSearchEnabled ? "default" : "outline"}
                size="sm"
                onClick={handleToggleSpatialSearch}
                title={
                  spatialSearchEnabled
                    ? "Disable Area Selection"
                    : "Draw Search Area"
                }
                disabled={!mapInstance}
              >
                {spatialSearchEnabled ? (
                  <MousePointer className="h-4 w-4" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
              </Button>

              {/* Search Panel Toggle */}
              <Button
                variant={showSearchPanel ? "default" : "outline"}
                size="sm"
                onClick={() => setShowSearchPanel(!showSearchPanel)}
                title="Toggle Search Panel"
              >
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Collapsible Search Form */}
        {showSearchPanel && (
          <CardContent className="pt-0">
            <MetadataSearchForm
              initialQuery={searchParams.query}
              initialStartDate={searchParams.temporalExtentStartDate}
              initialEndDate={searchParams.temporalExtentEndDate}
              initialFrameworkType={searchParams.frameworkType}
              initialDatasetType={searchParams.datasetType}
              initialUseSpatialSearch={searchParams.useSpatialSearch}
              initialBboxNorth={searchParams.bbox_north}
              initialBboxSouth={searchParams.bbox_south}
              initialBboxEast={searchParams.bbox_east}
              initialBboxWest={searchParams.bbox_west}
            />

            {/* Active Spatial Search Indicator */}
            {searchParams.useSpatialSearch && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-blue-700">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      Spatial Search Active
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearSpatialSearch}
                    className="text-blue-700 border-blue-300 hover:bg-blue-100"
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Clear
                  </Button>
                </div>
                <p className="text-xs text-blue-600 mt-1">
                  Showing records within the selected map area
                </p>
              </div>
            )}

            {/* Spatial Search Drawing Instructions */}
            {spatialSearchEnabled && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-center gap-2 text-green-700">
                  <Square className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    Draw Search Area Mode
                  </span>
                </div>
                <p className="text-xs text-green-600 mt-1">
                  Click and drag on the map to draw a search area
                </p>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Main Content Grid */}
      <div className={cn("grid gap-6", gridCols)}>
        {/* Map View */}
        {(viewMode === "map" || viewMode === "split") && (
          <Card className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Map View</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {mapRecords.length} locations
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[600px] w-full">
                <MetadataMapDisplay
                  records={mapRecords}
                  className="h-full w-full"
                  onRecordClick={handleRecordClick}
                  showBoundingBoxes={true}
                  onMapLoad={handleMapInstanceChange}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* List View */}
        {(viewMode === "list" || viewMode === "split") && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Search Results</CardTitle>
                <div className="flex items-center gap-2">
                  <select
                    className="text-sm border rounded px-2 py-1"
                    value={`${searchParams.sortBy || "updatedAt"}-${searchParams.sortOrder || "desc"}`}
                    onChange={e => {
                      const [sortBy, sortOrder] = e.target.value.split("-")
                      const params = new URLSearchParams(urlSearchParams)
                      params.set("sortBy", sortBy)
                      params.set("sortOrder", sortOrder)
                      router.push(`/metadata/search?${params.toString()}`)
                    }}
                  >
                    <option value="updatedAt-desc">Recently Updated</option>
                    <option value="updatedAt-asc">Oldest First</option>
                    <option value="title-asc">Title A-Z</option>
                    <option value="title-desc">Title Z-A</option>
                    <option value="productionDate-desc">Newest Data</option>
                    <option value="productionDate-asc">Oldest Data</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {initialResults.length === 0 ? (
                <div className="text-center py-12">
                  <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No results found
                  </h3>
                  <p className="text-gray-500">
                    Try adjusting your search criteria or filters
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {initialResults.map(record => (
                    <div
                      key={record.id}
                      className={cn(
                        "border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer",
                        highlightedRecords.includes(record.id) &&
                          "ring-2 ring-blue-500 bg-blue-50"
                      )}
                      onClick={() => handleRecordClick(record)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 mb-1">
                            {record.title}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                            {record.abstract}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>Type: {record.dataType}</span>
                            {record.organization && (
                              <span>Org: {record.organization.name}</span>
                            )}
                            <span>
                              Updated: {record.updatedAt.toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge variant="outline" className="text-xs">
                            {record.status}
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={e => {
                              e.stopPropagation()
                              handleViewRecord(record.id)
                            }}
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                  <div className="text-sm text-gray-600">
                    Showing {(currentPage - 1) * pageSize + 1} to{" "}
                    {Math.min(currentPage * pageSize, totalRecords)} of{" "}
                    {totalRecords} results
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage <= 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <span className="text-sm px-3 py-1 bg-gray-100 rounded">
                      {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage >= totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Selected Record Details Panel */}
      {selectedRecord && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Selected Record</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedRecord(null)}
              >
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium mb-2">{selectedRecord.title}</h3>
                <p className="text-sm text-gray-600 mb-4">
                  {selectedRecord.abstract}
                </p>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Type:</span>{" "}
                    {selectedRecord.dataType}
                  </div>
                  <div>
                    <span className="font-medium">Status:</span>{" "}
                    <Badge variant="outline">{selectedRecord.status}</Badge>
                  </div>
                  {selectedRecord.organization && (
                    <div>
                      <span className="font-medium">Organization:</span>{" "}
                      {selectedRecord.organization.name}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => handleViewRecord(selectedRecord.id)}
                  className="w-full"
                >
                  View Full Details
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    // Center map on this record
                    setHighlightedRecords([selectedRecord.id])
                  }}
                  className="w-full"
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Show on Map
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
