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

  // Process records into marker data with performance optimization
  const markerData = useMemo(() => {
    const startTime = performance.now()

    const markers: MarkerData[] = records
      .filter(record => hasValidSpatialBounds(record))
      .map(record => {
        const center = getRecordCenter(record)
        return {
          id: record.id,
          position: [center.lng, center.lat] as [number, number],
          data: record,
          popupContent: (
            <div className="p-2 max-w-xs">
              <h4 className="font-semibold text-sm mb-1">{record.title}</h4>
              <p className="text-xs text-gray-600 mb-2">{record.description}</p>
              <div className="text-xs">
                <div>Type: {record.datasetType}</div>
                <div>Framework: {record.frameworkType}</div>
              </div>
            </div>
          )
        }
      })

    const processingTime = performance.now() - startTime
    if (processingTime > 100) {
      console.warn(
        `Marker processing took ${processingTime.toFixed(2)}ms for ${records.length} records`
      )
    }

    return markers
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

  // Calculate initial viewport
  const initialViewport = useMemo(() => {
    if (markerData.length === 0) {
      return {
        center: [8.6775, 9.0778] as [number, number], // Nigeria center
        zoom: 6
      }
    }

    const bounds = calculateBoundsForRecords(
      records.filter(r => hasValidSpatialBounds(r))
    )
    if (bounds) {
      const center = [
        (bounds.west + bounds.east) / 2,
        (bounds.south + bounds.north) / 2
      ] as [number, number]

      // Calculate appropriate zoom level based on bounds size
      const latDiff = bounds.north - bounds.south
      const lngDiff = bounds.east - bounds.west
      const maxDiff = Math.max(latDiff, lngDiff)

      let zoom = 10
      if (maxDiff > 10) zoom = 4
      else if (maxDiff > 5) zoom = 5
      else if (maxDiff > 2) zoom = 6
      else if (maxDiff > 1) zoom = 7
      else if (maxDiff > 0.5) zoom = 8
      else if (maxDiff > 0.1) zoom = 9

      return { center, zoom }
    }

    return {
      center: [8.6775, 9.0778] as [number, number],
      zoom: 6
    }
  }, [markerData, records])

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
