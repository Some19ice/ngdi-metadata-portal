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

  // Memoize clustering options to prevent unnecessary re-renders
  const clusteringOpts = useMemo(
    () => ({
      radius: 50,
      maxZoom: 16,
      minZoom: 0,
      extent: 512,
      nodeSize: 64
    }),
    []
  )

  // Set up map clustering
  const { clusters, expandCluster, getClusterLeaves } = useMapClustering({
    map: mapInstance,
    records,
    onRecordClick,
    clusterRadius: clusteringOpts.radius,
    minZoom: clusteringOpts.minZoom,
    maxZoom: clusteringOpts.maxZoom
  })

  // Prepare marker data for the useMapMarkers hook based on clustering state
  const markerDataArray: MarkerData[] = useMemo(() => {
    // Only run this on the client side
    if (typeof window === "undefined") return []

    if (enableClustering && clusters.length > 0) {
      // Use clustered data - convert to proper MarkerData format
      return clusters
        .filter(cluster => {
          // Only individual points for markers (check if cluster property exists and is false)
          const properties = cluster.properties as any
          return !("cluster" in properties) || !properties.cluster
        })
        .map(cluster => {
          const record = cluster.properties as MetadataRecord
          return {
            id: record.id || `point-${cluster.geometry.coordinates.join("-")}`,
            coordinates: cluster.geometry.coordinates as [number, number],
            title: record.title || "Metadata Record",
            description: record.description ?? undefined,
            category: "metadata",
            metadata: record
          }
        })
    } else {
      // Use individual markers (original behavior)
      return records
        .filter(hasValidSpatialBounds)
        .map(record => {
          const center = getRecordCenter(record)
          if (!center) return null

          return {
            id: record.id,
            coordinates: center,
            title: record.title,
            description: record.description ?? undefined,
            category: "metadata",
            metadata: record
          }
        })
        .filter(Boolean) as MarkerData[]
    }
  }, [records, clusters, enableClustering])

  // Set up map markers using the declarative hook
  const { addMarkers, addClusters, clearAllMarkers, markers } = useMapMarkers(
    mapInstance,
    {
      onMarkerClick: markerData => {
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
      onClusterClick: clusterData => {
        expandCluster(parseInt(clusterData.id.replace("cluster-", "")))
      },
      enablePopups: true,
      enableClustering
    }
  )

  // Set up map viewport
  const { flyTo, fitBounds } = useMapViewport({
    map: mapInstance,
    initialViewport: {
      center: [8.6775, 9.0778], // Nigeria
      zoom: 5
    }
  })

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
      }

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
    records,
    showBoundingBoxes,
    selectedRecordId,
    addLayer,
    removeLayer,
    activeStyleId // Keep activeStyleId in dependency array to re-run when style changes
  ])

  // Update markers when data changes
  useEffect(() => {
    if (!mapInstance || !isMapLoaded) return

    // Clear existing markers
    clearAllMarkers()

    // Add individual markers
    addMarkers(markerDataArray)

    // Add clusters if clustering is enabled
    if (enableClustering && clusters.length > 0) {
      const clusterMarkers = clusters
        .filter(cluster => cluster.properties.cluster)
        .map(cluster => ({
          id: `cluster-${cluster.properties.cluster_id}`,
          coordinates: cluster.geometry.coordinates as [number, number],
          count: cluster.properties.point_count || 0,
          items: [] // We don't need individual items for display
        }))

      addClusters(clusterMarkers)
    }
  }, [
    mapInstance,
    isMapLoaded,
    markerDataArray,
    clusters,
    enableClustering,
    addMarkers,
    addClusters,
    clearAllMarkers
  ])

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
