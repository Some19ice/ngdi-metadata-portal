"use client"

import { useState, useCallback, useMemo } from "react"
import dynamic from "next/dynamic"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Map, MapPin, ExternalLink, ChevronRight } from "lucide-react"
import { MetadataSearchRecord } from "@/types"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

// Dynamically import map component to avoid SSR issues
const MetadataMapDisplay = dynamic(
  () => import("@/components/ui/map/metadata-map-display"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[600px] bg-muted rounded-md flex items-center justify-center">
        <div className="text-center">
          <Map className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Loading map...</p>
        </div>
      </div>
    )
  }
)

interface SearchResultsMapViewProps {
  records: MetadataSearchRecord[]
  className?: string
}

export function SearchResultsMapView({
  records,
  className
}: SearchResultsMapViewProps) {
  const router = useRouter()
  const [selectedRecord, setSelectedRecord] =
    useState<MetadataSearchRecord | null>(null)
  const [highlightedRecords, setHighlightedRecords] = useState<string[]>([])

  // Convert search records to map format
  const mapRecords = useMemo(() => {
    return records.map(record => ({
      id: record.id,
      title: record.title,
      abstract: record.abstract || "",
      dataType: record.dataType || "",
      frameworkType: record.frameworkType || "",
      keywords: record.keywords || [],
      status: record.status,
      productionDate: record.createdAt,
      updatedAt: record.updatedAt || record.createdAt,
      organizationId: record.organizationId || "",
      thumbnailUrl: record.thumbnailUrl || null,
      spatialInfo: record.spatialInfo,
      temporalInfo: record.temporalInfo,
      distributionInfo: record.distributionInfo,
      organization: record.organization
    }))
  }, [records])

  // Handle record selection from map
  const handleRecordClick = useCallback(
    (record: any) => {
      const matchingRecord = records.find(r => r.id === record.id)
      if (matchingRecord) {
        setSelectedRecord(matchingRecord)
        setHighlightedRecords([record.id])
      }
    },
    [records]
  )

  // Handle viewing full record details
  const handleViewRecord = useCallback(
    (recordId: string) => {
      router.push(`/metadata/${recordId}`)
    },
    [router]
  )

  // Handle clearing selection
  const handleClearSelection = useCallback(() => {
    setSelectedRecord(null)
    setHighlightedRecords([])
  }, [])

  return (
    <div className={cn("space-y-4", className)}>
      {/* Map Display */}
      <Card>
        <CardContent className="p-0">
          <div className="h-[600px] w-full">
            <MetadataMapDisplay
              records={mapRecords}
              className="h-full w-full rounded-lg"
              onRecordClick={handleRecordClick}
              showBoundingBoxes={true}
            />
          </div>
        </CardContent>
      </Card>

      {/* Selected Record Details Panel */}
      {selectedRecord && (
        <Card className="border-primary">
          <CardContent className="p-4">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold text-lg">
                      {selectedRecord.title}
                    </h3>
                  </div>

                  {selectedRecord.abstract && (
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {selectedRecord.abstract}
                    </p>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearSelection}
                  className="shrink-0"
                >
                  ×
                </Button>
              </div>

              {/* Metadata */}
              <div className="flex flex-wrap gap-2">
                {selectedRecord.dataType && (
                  <Badge variant="outline" className="text-xs">
                    {selectedRecord.dataType}
                  </Badge>
                )}
                {selectedRecord.organization?.name && (
                  <Badge variant="secondary" className="text-xs">
                    {selectedRecord.organization.name}
                  </Badge>
                )}
                {selectedRecord.status && (
                  <Badge variant="default" className="text-xs">
                    {selectedRecord.status}
                  </Badge>
                )}
              </div>

              {/* Location Information */}
              {(selectedRecord.geographicDescription ||
                selectedRecord.locationInfo) && (
                <div className="text-sm">
                  <span className="font-medium">Location: </span>
                  <span className="text-muted-foreground">
                    {selectedRecord.geographicDescription ||
                      (selectedRecord.locationInfo &&
                        [
                          selectedRecord.locationInfo.state,
                          selectedRecord.locationInfo.country
                        ]
                          .filter(Boolean)
                          .join(", ")) ||
                      "Location not specified"}
                  </span>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  onClick={() => handleViewRecord(selectedRecord.id)}
                  className="flex-1"
                  size="sm"
                >
                  View Full Details
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Map Statistics */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>
                Showing {records.length} record{records.length !== 1 ? "s" : ""}{" "}
                on map
              </span>
            </div>
            {records.length > 0 && (
              <div className="text-sm text-muted-foreground">
                Click on map markers to view details
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
