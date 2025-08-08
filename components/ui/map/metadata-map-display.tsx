"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Map } from "maplibre-gl"
import { toast } from "sonner"
import MapView from "./map-view"
import LayerControlPanel from "./layer-control-panel"
import { MapStyle } from "./map-view"
import { useMapMarkers, useMapViewport, MarkerData } from "@/hooks"
import { useMapLayers } from "@/lib/hooks/use-map-layers"
import { useMapClustering } from "@/lib/hooks/use-map-clustering"
import ClusterMarker from "./cluster-marker"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Layers, ZoomIn, ZoomOut, Home, Info, Grid3X3 } from "lucide-react"
import {
  MetadataRecord,
  hasValidSpatialBounds,
  getRecordCenter,
  getRecordBounds,
  recordToGeoJSON,
  recordsToGeoJSON,
  calculateBoundsForRecords
} from "@/lib/map-utils"
import { getAvailableMapStyles, logMapError } from "@/lib/map-config"
import {
  createSafeClusterMarker,
  createSafeMarkerElement,
  MapEventManager
} from "@/lib/map-security"

interface MetadataMapDisplayProps {
  records: MetadataRecord[]
  className?: string
  onRecordClick?: (record: MetadataRecord) => void
  showBoundingBoxes?: boolean
  onMapLoad?: (map: Map) => void
}

export default function MetadataMapDisplay({
  records,
  className = "h-[500px] w-full",
  onRecordClick,
  showBoundingBoxes = true,
  onMapLoad
}: MetadataMapDisplayProps) {
  const [mapInstance, setMapInstance] = useState<Map | null>(null)
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null)
  const [isMapLoaded, setIsMapLoaded] = useState(false)
  const [enableClustering, setEnableClustering] = useState<boolean>(true)
  const [showBounds, setShowBounds] = useState<boolean>(() => {
    if (typeof window === "undefined") return showBoundingBoxes
    const v = localStorage.getItem("mapShowBounds")
    return v === null ? showBoundingBoxes : v === "1"
  })
  // Store the internal style change handler from MapView
  const [internalStyleChangeHandler, setInternalStyleChangeHandler] = useState<
    ((styleId: string) => void) | null
  >(null)

  // Use our centralized map configuration utility to get available styles
  const availableBaseStyles: MapStyle[] = useMemo(
    () => getAvailableMapStyles(),
    []
  )

  // Initialize with the first available style or fallback to "streets"
  const initialStyleId = useMemo(
    () => availableBaseStyles[0]?.id || "streets",
    [availableBaseStyles]
  )

  const [activeStyleId, setActiveStyleId] = useState<string>(initialStyleId)

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

  // Handle map load
  const handleMapLoad = useCallback(
    (map: Map) => {
      setMapInstance(map)
      setIsMapLoaded(true)
      onMapLoad?.(map)
    },
    [onMapLoad]
  )

  // Set up map layers
  const { addLayer, removeLayer, updateLayerSource, toggleLayerVisibility } =
    useMapLayers({
      map: mapInstance,
      initialLayers: []
    })

  // PERFORMANCE FIX: Simple throttle utility to avoid lodash dependency issues
  const throttle = useCallback(
    <T extends (...args: any[]) => void>(func: T, wait: number): T => {
      let timeout: NodeJS.Timeout | null = null
      return ((...args: any[]) => {
        if (timeout) clearTimeout(timeout)
        timeout = setTimeout(() => func.apply(null, args), wait)
      }) as T
    },
    []
  )

  // Set up map clustering
  const { clusters, expandCluster, getClusterLeaves } = useMapClustering({
    map: mapInstance,
    records,
    onRecordClick,
    clusterRadius: 80,
    minZoom: 0,
    maxZoom: 12
  })

  // Set up map viewport first to get fitBounds
  const { flyTo, fitBounds } = useMapViewport({
    map: mapInstance,
    initialViewport: {
      center: [8.6775, 9.0778] as [number, number], // Nigeria
      zoom: 5
    }
  })

  // PERFORMANCE FIX: Memoize marker data to prevent unnecessary re-renders
  const markerDataArray = useMemo(() => {
    return records
      .filter(hasValidSpatialBounds)
      .map(record => {
        const center = getRecordCenter(record)
        if (!center) return null
        return {
          id: record.id,
          coordinates: center,
          title: record.title,
          description: record.description || ""
        }
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
  }, [records])

  // PERFORMANCE FIX: Memoize marker click handler
  const handleMarkerClick = useCallback(
    (markerData: any) => {
      const record = records.find(r => r.id === markerData.id)
      if (record) {
        setSelectedRecordId(markerData.id)
        onRecordClick?.(record)
        const bounds = getRecordBounds(record)
        if (bounds) {
          fitBounds(bounds, { padding: 200, maxZoom: 15 })
        }
      }
    },
    [records, onRecordClick, fitBounds, setSelectedRecordId]
  )

  // PERFORMANCE FIX: Memoize cluster click handler
  const handleClusterClick = useCallback(
    (clusterData: any) => {
      expandCluster(parseInt(clusterData.id.replace("cluster-", "")))
    },
    [expandCluster]
  )

  // PERFORMANCE FIX: Memoize markers configuration
  const markersConfig = useMemo(
    () => ({
      onMarkerClick: handleMarkerClick,
      onClusterClick: handleClusterClick,
      enablePopups: true,
      enableClustering
    }),
    [handleMarkerClick, handleClusterClick, enableClustering]
  )

  // Set up map markers using the declarative hook
  const { addMarkers, addClusters, clearAllMarkers, markers } = useMapMarkers(
    mapInstance,
    markersConfig
  )

  // PERFORMANCE FIX: Memoize GeoJSON data to prevent recreation
  const recordsGeoJSON = useMemo(() => {
    return recordsToGeoJSON(records)
  }, [records])

  // Unified bounding box layer management - handles initial creation, style changes, and data updates
  useEffect(() => {
    if (!mapInstance || !isMapLoaded || !showBoundingBoxes) return

    // Only proceed if the map style is fully loaded
    if (!mapInstance.isStyleLoaded()) return

    try {
      // Check if the source already exists
      const existingSource = mapInstance.getSource("metadata-bounds")

      if (existingSource) {
        // Update existing source data
        if ("setData" in existingSource) {
          ;(existingSource as any).setData(recordsGeoJSON)
        }
      } else {
        // Add source and layer for bounding boxes
        addLayer({
          id: "metadata-bounds",
          source: {
            type: "geojson",
            data: recordsGeoJSON
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
      }

      // Apply persisted visibility
      try {
        const persisted =
          typeof window !== "undefined" && localStorage.getItem("mapShowBounds")
        const shouldShow = persisted === null ? true : persisted === "1"
        const visibility = shouldShow ? "visible" : "none"
        if (mapInstance.getLayer("metadata-bounds")) {
          mapInstance.setLayoutProperty(
            "metadata-bounds",
            "visibility",
            visibility
          )
        }
        if (mapInstance.getLayer("metadata-bounds-outline")) {
          mapInstance.setLayoutProperty(
            "metadata-bounds-outline",
            "visibility",
            visibility
          )
        }
      } catch {}

      // Apply filters based on selected record
      if (selectedRecordId) {
        // Add a conditional filter to highlight the selected record
        if (mapInstance.getLayer("metadata-bounds")) {
          mapInstance.setFilter("metadata-bounds", [
            "==",
            ["get", "id"],
            selectedRecordId
          ])
        }
        if (mapInstance.getLayer("metadata-bounds-outline")) {
          mapInstance.setFilter("metadata-bounds-outline", [
            "==",
            ["get", "id"],
            selectedRecordId
          ])
        }
      } else {
        // Reset filter to show all records
        if (mapInstance.getLayer("metadata-bounds")) {
          mapInstance.setFilter("metadata-bounds", null)
        }
        if (mapInstance.getLayer("metadata-bounds-outline")) {
          mapInstance.setFilter("metadata-bounds-outline", null)
        }
      }
    } catch (err) {
      // Use our centralized error logging
      logMapError(
        err instanceof Error ? err : new Error(String(err)),
        "Bounding Box Layers"
      )
      toast.error(
        "Error displaying bounding boxes. Using fallback configuration."
      )
    }

    // Cleanup function
    return () => {
      if (!mapInstance) return

      // Remove layers and source if they exist
      try {
        if (mapInstance.getLayer("metadata-bounds-outline")) {
          removeLayer("metadata-bounds-outline", false)
        }
        if (mapInstance.getLayer("metadata-bounds")) {
          removeLayer("metadata-bounds", true)
        }
      } catch (err) {
        // Use our centralized error logging
        logMapError(
          err instanceof Error ? err : new Error(String(err)),
          "Removing Bounding Box Layers"
        )
      }
    }
  }, [
    mapInstance,
    isMapLoaded,
    recordsGeoJSON, // Use memoized GeoJSON
    showBoundingBoxes,
    selectedRecordId,
    addLayer,
    removeLayer,
    activeStyleId // Keep activeStyleId in dependency array to re-run when style changes
  ])

  // PERFORMANCE FIX: Throttle marker updates to prevent excessive re-renders
  const throttledUpdateMarkers = useCallback(
    throttle(() => {
      if (!mapInstance || !isMapLoaded) return

      // Clear existing markers
      clearAllMarkers()

      // Add individual markers
      addMarkers(markerDataArray)

      // Add clusters if clustering is enabled
      if (enableClustering && clusters.length > 0) {
        const clusterMarkers = clusters
          .filter((cluster: any) => cluster.properties.cluster)
          .map((cluster: any) => ({
            id: `cluster-${cluster.properties.cluster_id}`,
            coordinates: cluster.geometry.coordinates as [number, number],
            count: cluster.properties.point_count || 0,
            items: [] // We don't need individual items for display
          }))

        addClusters(clusterMarkers)
      }
    }, 100), // Throttle to 100ms
    [
      mapInstance,
      isMapLoaded,
      markerDataArray,
      clusters,
      enableClustering,
      addMarkers,
      addClusters,
      clearAllMarkers
    ]
  )

  // Update markers when data changes
  useEffect(() => {
    throttledUpdateMarkers()
  }, [throttledUpdateMarkers])

  // Fit map to bounds of all records when records change
  useEffect(() => {
    if (
      !mapInstance ||
      !isMapLoaded ||
      records.length === 0 ||
      !mapInstance.isStyleLoaded()
    )
      return

    const validRecords = records.filter(hasValidSpatialBounds)
    if (validRecords.length === 0) {
      // Only show toast if there were records initially but none are valid for map display
      if (records.length > 0) {
        toast.info(
          "No records with valid spatial information to display markers."
        )
      }
      return
    }

    const bounds = calculateBoundsForRecords(validRecords)
    if (bounds) {
      fitBounds(bounds, { padding: 50 })
    }
  }, [mapInstance, isMapLoaded, records, fitBounds])

  // Marker click handling is now managed by the useMapMarkers hook via onMarkerClick and onClusterClick callbacks

  // Reset view to show all records
  const handleResetView = useCallback(() => {
    if (!mapInstance || !records.length) return

    // Calculate bounds that encompass all records with valid coordinates
    const bounds = calculateBoundsForRecords(records)
    if (bounds) {
      fitBounds(bounds, { padding: 50 })
    }
  }, [mapInstance, records, fitBounds])

  // Toggle bounding boxes visibility
  const handleToggleBoundingBoxes = useCallback(() => {
    if (!mapInstance) return

    toggleLayerVisibility("metadata-bounds")
    toggleLayerVisibility("metadata-bounds-outline")
    setShowBounds(prev => {
      const next = !prev
      if (typeof window !== "undefined") {
        localStorage.setItem("mapShowBounds", next ? "1" : "0")
      }
      return next
    })
  }, [mapInstance, toggleLayerVisibility])

  return (
    <Card className={className}>
      <CardContent className="p-0 relative" style={{ minHeight: "500px" }}>
        <MapView
          initialOptions={{
            center: [8.6775, 9.0778], // Nigeria
            zoom: 5
          }}
          initialStyleId={initialStyleId}
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

        {/* Map Controls */}
        <div className="absolute bottom-4 right-4 flex flex-col space-y-2 z-10">
          <Button
            variant="secondary"
            size="icon"
            onClick={handleResetView}
            title="Reset view"
          >
            <Home className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            onClick={() => mapInstance?.zoomIn()}
            title="Zoom in"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            onClick={() => mapInstance?.zoomOut()}
            title="Zoom out"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            variant={enableClustering ? "default" : "secondary"}
            size="icon"
            onClick={() => setEnableClustering(!enableClustering)}
            title={`${enableClustering ? "Disable" : "Enable"} marker clustering`}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          {showBoundingBoxes && (
            <Button
              variant="secondary"
              size="icon"
              onClick={handleToggleBoundingBoxes}
              title="Toggle bounding boxes"
            >
              <Layers className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
