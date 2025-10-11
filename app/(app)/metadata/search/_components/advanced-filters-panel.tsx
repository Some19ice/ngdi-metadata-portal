"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Calendar, MapPin, X } from "lucide-react"
import { MetadataSearchFilters } from "@/types"
import { Separator } from "@/components/ui/separator"
import dynamic from "next/dynamic"
import { useState } from "react"

// Dynamically import map component to avoid SSR issues
const BoundingBoxSelector = dynamic(
  () => import("@/components/ui/map/bounding-box-selector"),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 bg-muted rounded-md flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading map...</p>
      </div>
    )
  }
)

interface AdvancedFiltersPanelProps {
  filters: MetadataSearchFilters
  onUpdateFilter: (key: keyof MetadataSearchFilters, value: any) => void
  onClearFilter: (key: keyof MetadataSearchFilters) => void
}

export function AdvancedFiltersPanel({
  filters,
  onUpdateFilter,
  onClearFilter
}: AdvancedFiltersPanelProps) {
  const [showSpatialMap, setShowSpatialMap] = useState(false)

  const handleDateChange = (field: "startDate" | "endDate", value: string) => {
    onUpdateFilter(field, value)
  }

  const handleBoundsChange = (
    bounds: {
      north: number
      south: number
      east: number
      west: number
    } | null
  ) => {
    if (bounds) {
      onUpdateFilter("spatialBounds", bounds)
    } else {
      onClearFilter("spatialBounds")
    }
  }

  const clearTemporalFilters = () => {
    onClearFilter("startDate")
    onClearFilter("endDate")
  }

  const clearSpatialFilters = () => {
    onClearFilter("spatialBounds")
    setShowSpatialMap(false)
  }

  const hasTemporalFilters = filters.startDate || filters.endDate
  const hasSpatialFilters = filters.spatialBounds

  return (
    <div className="space-y-4">
      {/* Temporal Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Temporal Extent
            </CardTitle>
            {hasTemporalFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearTemporalFilters}
                className="h-auto p-1"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="startDate" className="text-xs">
              From Date
            </Label>
            <Input
              id="startDate"
              type="date"
              value={filters.startDate || ""}
              onChange={e => handleDateChange("startDate", e.target.value)}
              className="h-9"
            />
            <p className="text-xs text-muted-foreground">
              Records with coverage ending on or after this date
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="endDate" className="text-xs">
              To Date
            </Label>
            <Input
              id="endDate"
              type="date"
              value={filters.endDate || ""}
              onChange={e => handleDateChange("endDate", e.target.value)}
              className="h-9"
            />
            <p className="text-xs text-muted-foreground">
              Records with coverage starting on or before this date
            </p>
          </div>

          {hasTemporalFilters && (
            <div className="pt-2">
              <div className="text-xs bg-muted p-2 rounded-md">
                <p className="font-medium mb-1">Active Date Range:</p>
                <p>
                  {filters.startDate && (
                    <>
                      From: {new Date(filters.startDate).toLocaleDateString()}
                    </>
                  )}
                  {filters.startDate && filters.endDate && " "}
                  {filters.endDate && (
                    <>To: {new Date(filters.endDate).toLocaleDateString()}</>
                  )}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Spatial Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Spatial Extent
            </CardTitle>
            {hasSpatialFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSpatialFilters}
                className="h-auto p-1"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Button
              variant={showSpatialMap ? "default" : "outline"}
              size="sm"
              onClick={() => setShowSpatialMap(!showSpatialMap)}
              className="w-full"
            >
              {showSpatialMap ? "Hide" : "Show"} Bounding Box Selector
            </Button>
          </div>

          {showSpatialMap && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Draw a rectangle on the map to filter results by geographic area
              </p>
              <BoundingBoxSelector
                initialBounds={filters.spatialBounds}
                onBoundsChange={handleBoundsChange}
              />
            </div>
          )}

          {hasSpatialFilters && filters.spatialBounds && (
            <div className="pt-2">
              <div className="text-xs bg-muted p-2 rounded-md space-y-1">
                <p className="font-medium mb-1">Active Bounding Box:</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-muted-foreground">North:</span>{" "}
                    {filters.spatialBounds.north.toFixed(4)}°
                  </div>
                  <div>
                    <span className="text-muted-foreground">South:</span>{" "}
                    {filters.spatialBounds.south.toFixed(4)}°
                  </div>
                  <div>
                    <span className="text-muted-foreground">East:</span>{" "}
                    {filters.spatialBounds.east.toFixed(4)}°
                  </div>
                  <div>
                    <span className="text-muted-foreground">West:</span>{" "}
                    {filters.spatialBounds.west.toFixed(4)}°
                  </div>
                </div>
              </div>
            </div>
          )}

          {!hasSpatialFilters && !showSpatialMap && (
            <p className="text-xs text-muted-foreground text-center py-4">
              No spatial filter applied. Click above to define a bounding box.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
