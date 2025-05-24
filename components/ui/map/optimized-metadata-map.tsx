"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { Map } from "maplibre-gl"
import { toast } from "sonner"
import MapView from "./map-view"
import { MapStyle } from "./map-view"
import OptimizedMarkerCluster from "./optimized-marker-cluster"
import {
  MetadataRecord,
  hasValidSpatialBounds,
  getRecordCenter,
  calculateBoundsForRecords
} from "@/lib/map-utils"
import { getAvailableMapStyles } from "@/lib/map-config"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Layers, ZoomIn, ZoomOut, Home, Settings } from "lucide-react"

interface OptimizedMetadataMapProps {
  records: MetadataRecord[]
  className?: string
  onRecordClick?: (record: MetadataRecord) => void
  showBoundingBoxes?: boolean
  enableClustering?: boolean
  clusterRadius?: number
  maxZoom?: number
  performanceMode?: "auto" | "high" | "balanced" | "quality"
}

interface MarkerData {
  id: string
  position: [number, number]
  data: MetadataRecord
  popupContent?: React.ReactNode
}

export default function OptimizedMetadataMap({
  records,
  className = "h-[500px] w-full",
  onRecordClick,
  showBoundingBoxes = true,
  enableClustering = true,
  clusterRadius = 50,
  maxZoom = 16,
  performanceMode = "auto"
}: OptimizedMetadataMapProps) {
  const [mapInstance, setMapInstance] = useState<Map | null>(null)
  const [activeStyleId, setActiveStyleId] = useState<string>("streets")
  const [isMapLoaded, setIsMapLoaded] = useState(false)
  const [showPerformanceStats, setShowPerformanceStats] = useState(false)
  const performanceStartTime = useRef<number>(performance.now())

  // Get available map styles
  const availableBaseStyles: MapStyle[] = useMemo(
    () => getAvailableMapStyles(),
    []
  )

  // Prepare marker data for clustering
  const markerData = useMemo(() => {
    return records
      .filter(hasValidSpatialBounds)
      .map(record => {
        const center = getRecordCenter(record)
        if (!center) return null

        const [lng, lat] = center
        return {
          id: record.id,
          position: [lng, lat] as [number, number],
          data: record
        }
      })
      .filter(Boolean) as Array<{
      id: string
      position: [number, number]
      data: MetadataRecord
    }>
  }, [records])

  // Determine optimal settings based on performance mode and data size
  const optimizedSettings = useMemo(() => {
    const dataSize = markerData.length

    let settings = {
      enableClustering: enableClustering,
      clusterRadius: clusterRadius,
      maxZoom: maxZoom,
      renderBounds: showBoundingBoxes
    }

    // Auto-adjust based on performance mode and data size
    if (performanceMode === "auto") {
      if (dataSize > 1000) {
        settings.enableClustering = true
        settings.clusterRadius = Math.max(60, clusterRadius)
        settings.renderBounds = false
      } else if (dataSize > 500) {
        settings.enableClustering = true
        settings.clusterRadius = Math.max(50, clusterRadius)
      }
    } else if (performanceMode === "high") {
      settings.enableClustering = dataSize > 100
      settings.clusterRadius = Math.max(70, clusterRadius)
      settings.renderBounds = false
    } else if (performanceMode === "quality") {
      settings.renderBounds = showBoundingBoxes
      settings.clusterRadius = Math.min(30, clusterRadius)
    }

    return settings
  }, [
    markerData.length,
    performanceMode,
    enableClustering,
    clusterRadius,
    maxZoom,
    showBoundingBoxes
  ])

  // Calculate initial viewport based on records
  const initialViewport = useMemo(() => {
    const bounds = calculateBoundsForRecords(records)

    if (bounds) {
      const center = bounds.getCenter().toArray()
      return {
        center: center as [number, number],
        zoom: 5,
        bounds: {
          west: bounds.getWest(),
          east: bounds.getEast(),
          south: bounds.getSouth(),
          north: bounds.getNorth()
        }
      }
    }

    // Default to Nigeria if no records with bounds
    return {
      center: [8.6775, 9.0778] as [number, number],
      zoom: 5,
      bounds: {
        north: 14.0,
        south: 4.0,
        east: 14.0,
        west: 3.0
      }
    }
  }, [records])

  // Handle style change
  const handleStyleChange = useCallback((styleId: string) => {
    setActiveStyleId(styleId)
  }, [])

  // Handle map load with performance tracking
  const handleMapLoad = useCallback(
    (map: Map) => {
      const loadTime = performance.now() - performanceStartTime.current
      setMapInstance(map)
      setIsMapLoaded(true)

      if (loadTime > 2000) {
        toast.warning(
          `Map loaded in ${(loadTime / 1000).toFixed(1)}s. Consider optimizing for better performance.`
        )
      }

      console.log(
        `Map loaded with ${markerData.length} markers in ${loadTime.toFixed(2)}ms`
      )
    },
    [markerData.length]
  )

  // Handle marker click
  const handleMarkerClick = useCallback(
    (marker: MarkerData) => {
      if (onRecordClick) {
        onRecordClick(marker.data)
      }
    },
    [onRecordClick]
  )

  // Handle cluster click - zoom to cluster bounds
  const handleClusterClick = useCallback(
    (cluster: any) => {
      if (mapInstance && cluster.bounds) {
        mapInstance.fitBounds(cluster.bounds, {
          padding: 50,
          maxZoom: 15
        })
      }
    },
    [mapInstance]
  )

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    if (mapInstance) {
      mapInstance.zoomIn()
    }
  }, [mapInstance])

  const handleZoomOut = useCallback(() => {
    if (mapInstance) {
      mapInstance.zoomOut()
    }
  }, [mapInstance])

  const handleResetView = useCallback(() => {
    if (mapInstance) {
      mapInstance.flyTo({
        center: initialViewport.center,
        zoom: initialViewport.zoom,
        duration: 1000
      })
    }
  }, [mapInstance, initialViewport])

  // Performance monitoring effect
  useEffect(() => {
    performanceStartTime.current = performance.now()
  }, [])

  return (
    <div className={`relative ${className}`}>
      {/* Map Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <Card className="p-2">
          <div className="flex flex-col gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomIn}
              title="Zoom In"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomOut}
              title="Zoom Out"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetView}
              title="Reset View"
            >
              <Home className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPerformanceStats(!showPerformanceStats)}
              title="Performance Stats"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      </div>

      {/* Performance Stats */}
      {showPerformanceStats && (
        <div className="absolute top-4 left-4 z-10 bg-black/80 text-white p-3 rounded-lg text-xs font-mono max-w-xs">
          <h4 className="font-bold mb-2">Performance Stats</h4>
          <div className="space-y-1">
            <div>Records: {records.length}</div>
            <div>Markers: {markerData.length}</div>
            <div>
              Clustering: {optimizedSettings.enableClustering ? "ON" : "OFF"}
            </div>
            <div>Mode: {performanceMode}</div>
            <div>Cluster Radius: {optimizedSettings.clusterRadius}px</div>
          </div>
        </div>
      )}

      {/* Map Component */}
      <MapView
        initialOptions={{
          center: initialViewport.center,
          zoom: initialViewport.zoom
        }}
        className={className}
        initialStyleId={activeStyleId}
        availableBaseStyles={availableBaseStyles}
        onMapLoad={handleMapLoad}
        onStyleChange={handleStyleChange}
      />

      {/* Marker Clustering */}
      {isMapLoaded && optimizedSettings.enableClustering && (
        <OptimizedMarkerCluster
          map={mapInstance}
          markers={markerData}
          clusterRadius={optimizedSettings.clusterRadius}
          maxZoom={optimizedSettings.maxZoom}
          onMarkerClick={handleMarkerClick}
          onClusterClick={handleClusterClick}
        />
      )}

      {/* Data Summary */}
      <div className="absolute bottom-4 left-4 z-10">
        <Card className="p-2 bg-white/90 backdrop-blur-sm">
          <CardContent className="p-0">
            <div className="text-xs text-gray-600">
              Showing {markerData.length} of {records.length} records
              {optimizedSettings.enableClustering && (
                <span className="block">Clustering enabled</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
