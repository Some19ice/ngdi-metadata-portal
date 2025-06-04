"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Map } from "maplibre-gl"
import { toast } from "sonner"
import MapView from "./map-view"
import LayerControlPanel from "./layer-control-panel"
import GISServicePanel from "./gis-service-panel"
import { MapStyle } from "./map-view"
import { useMapMarkers, useMapViewport, MarkerData } from "@/hooks"
import { useMapLayers } from "@/lib/hooks/use-map-layers"
import { useGISServices } from "@/lib/hooks/use-gis-services"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Layers, ZoomIn, ZoomOut, Home, Info, Database } from "lucide-react"
import {
  MetadataRecord,
  hasValidSpatialBounds,
  getRecordCenter,
  getRecordBounds,
  recordToGeoJSON,
  recordsToGeoJSON,
  calculateBoundsForRecords
} from "@/lib/map-utils"
import {
  getAvailableMapStyles,
  logMapError,
  DEFAULT_FREE_STYLE
} from "@/lib/map-config"

export interface EnhancedMetadataMapDisplayProps {
  records: MetadataRecord[]
  className?: string
  onRecordClick?: (record: MetadataRecord) => void
  showBoundingBoxes?: boolean
  enableClustering?: boolean
  clusterRadius?: number
  maxZoom?: number
  showGISServicePanel?: boolean
}

export default function EnhancedMetadataMapDisplay({
  records,
  className = "h-[500px] w-full",
  onRecordClick,
  showBoundingBoxes = true,
  enableClustering = true,
  clusterRadius = 50,
  maxZoom = 16,
  showGISServicePanel = true
}: EnhancedMetadataMapDisplayProps) {
  const [mapInstance, setMapInstance] = useState<Map | null>(null)
  const [activeStyleId, setActiveStyleId] = useState<string>(
    DEFAULT_FREE_STYLE.id
  )
  const [isMapLoaded, setIsMapLoaded] = useState(false)
  const [showBounds, setShowBounds] = useState(showBoundingBoxes)
  // Store the internal style change handler from MapView
  const [internalStyleChangeHandler, setInternalStyleChangeHandler] = useState<
    ((styleId: string) => void) | null
  >(null)

  // Get available map styles
  const availableBaseStyles: MapStyle[] = useMemo(
    () => getAvailableMapStyles(),
    []
  )

  // Update activeStyleId to use the first available style if it's not in the available styles
  useEffect(() => {
    if (
      availableBaseStyles.length > 0 &&
      !availableBaseStyles.find(s => s.id === activeStyleId)
    ) {
      setActiveStyleId(availableBaseStyles[0].id)
    }
  }, [availableBaseStyles, activeStyleId])

  // Prepare marker data for the useMapMarkers hook
  const markerDataArray: MarkerData[] = useMemo(() => {
    // Only run this on the client side
    if (typeof window === "undefined") return []

    return records
      .filter(hasValidSpatialBounds)
      .map(record => {
        const center = getRecordCenter(record)
        if (!center) return null

        return {
          id: record.id,
          lngLat: center as [number, number],
          popupContent: `
          <div class="p-2">
            <h3 class="font-medium text-sm">${record.title}</h3>
            ${record.abstract ? `<p class="text-xs mt-1 text-gray-600">${record.abstract.substring(0, 100)}${record.abstract.length > 100 ? "..." : ""}</p>` : ""}
            <button class="text-blue-500 hover:text-blue-700 text-xs mt-2" onclick="window.dispatchEvent(new CustomEvent('recordClick', {detail: '${record.id}'}))">View Details</button>
          </div>
        `
        }
      })
      .filter(Boolean) as MarkerData[]
  }, [records, onRecordClick])

  // Listen for custom record click events
  useEffect(() => {
    const handleRecordClick = (event: CustomEvent) => {
      const recordId = event.detail
      const record = records.find(r => r.id === recordId)
      if (record && onRecordClick) {
        onRecordClick(record)
      }
    }

    window.addEventListener("recordClick", handleRecordClick as EventListener)
    return () => {
      window.removeEventListener(
        "recordClick",
        handleRecordClick as EventListener
      )
    }
  }, [records, onRecordClick])

  // Calculate initial viewport based on records
  const initialViewport = useMemo(() => {
    const bounds = calculateBoundsForRecords(records)

    if (bounds) {
      const center = bounds.getCenter().toArray()
      return {
        center: center as [number, number],
        zoom: 5
      }
    }

    // Default to Nigeria if no records with bounds
    return {
      center: [8.6775, 9.0778] as [number, number],
      zoom: 5
    }
  }, [records])

  // Handle map load
  const handleMapLoad = useCallback((map: Map) => {
    setMapInstance(map)
    setIsMapLoaded(true)
  }, [])

  // Set up map layers
  const { addLayer, removeLayer, updateLayerSource, toggleLayerVisibility } =
    useMapLayers({
      map: mapInstance,
      initialLayers: []
    })

  // Handle style change from LayerControlPanel - forward to MapView's internal handler
  const handleStyleChange = useCallback(
    (styleId: string) => {
      if (internalStyleChangeHandler) {
        // Use MapView's internal style change handler
        internalStyleChangeHandler(styleId)
      } else {
        // Fallback: update local state if internal handler not available yet
        setActiveStyleId(styleId)
      }
    },
    [internalStyleChangeHandler]
  )

  // Handle style change from MapView (when style actually changes)
  const handleStyleChangeFromMapView = useCallback((styleId: string) => {
    setActiveStyleId(styleId)
  }, [])

  // Store the internal style change handler when MapView provides it
  const handleStyleChangeHandlerRef = useCallback(
    (handler: (styleId: string) => void) => {
      setInternalStyleChangeHandler(() => handler)
    },
    []
  )

  // Add GeoJSON source and layer for bounding boxes
  useEffect(() => {
    if (!mapInstance || !isMapLoaded || records.length === 0) return

    try {
      // Check if the source already exists
      const existingSource = mapInstance.getSource("metadata-bounds")

      if (existingSource) {
        // Update existing source data
        if ("setData" in existingSource) {
          ;(existingSource as any).setData(recordsToGeoJSON(records))
        }
      } else {
        // Add source and layer for bounding boxes
        addLayer({
          id: "metadata-bounds",
          source: {
            type: "geojson",
            data: recordsToGeoJSON(records)
          },
          layer: {
            type: "fill",
            paint: {
              "fill-color": "#3b82f6",
              "fill-opacity": 0.2,
              "fill-outline-color": "#2563eb"
            }
          }
        })

        // Add outline layer
        addLayer({
          id: "metadata-bounds-outline",
          source: "metadata-bounds",
          layer: {
            type: "line",
            paint: {
              "line-color": "#2563eb",
              "line-width": 2
            }
          }
        })

        // Set initial visibility based on showBounds
        if (!showBounds) {
          toggleLayerVisibility("metadata-bounds", false)
          toggleLayerVisibility("metadata-bounds-outline", false)
        }
      }
    } catch (error) {
      console.error("Error adding bounding box layers:", error)
      logMapError(
        error instanceof Error ? error : new Error(String(error)),
        "Adding Bounding Box Layers"
      )
    }
  }, [
    mapInstance,
    isMapLoaded,
    records,
    addLayer,
    showBounds,
    toggleLayerVisibility
  ])

  // Toggle bounding boxes visibility
  const handleToggleBoundingBoxes = useCallback(() => {
    if (!mapInstance) return

    setShowBounds(prev => !prev)
    toggleLayerVisibility("metadata-bounds")
    toggleLayerVisibility("metadata-bounds-outline")
  }, [mapInstance, toggleLayerVisibility])

  return (
    <Card className={className}>
      <CardContent className="p-0 relative" style={{ minHeight: "500px" }}>
        <MapView
          initialOptions={{
            center: initialViewport.center,
            zoom: initialViewport.zoom
          }}
          initialStyleId={activeStyleId}
          availableBaseStyles={availableBaseStyles}
          className="h-full w-full rounded-md"
          onMapLoad={handleMapLoad}
          onStyleChange={handleStyleChangeFromMapView}
          onStyleChangeHandler={handleStyleChangeHandlerRef}
          showControls={false}
        />

        <LayerControlPanel
          availableStyles={availableBaseStyles}
          activeStyleId={activeStyleId}
          onStyleChange={handleStyleChange}
          position="top-left"
        />

        {showGISServicePanel && isMapLoaded && (
          <GISServicePanel map={mapInstance} position="top-right" />
        )}

        <div className="absolute bottom-4 right-4 flex flex-col gap-2">
          <Button
            variant="outline"
            size="icon"
            className="bg-white"
            onClick={handleToggleBoundingBoxes}
            title={showBounds ? "Hide bounding boxes" : "Show bounding boxes"}
          >
            <Layers className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
