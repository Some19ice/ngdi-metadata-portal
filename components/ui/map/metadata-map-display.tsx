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
    records,
    map: mapInstance,
    options: clusteringOpts
  })

  // Prepare marker data for the useMapMarkers hook based on clustering state
  const markerDataArray: MarkerData[] = useMemo(() => {
    // Only run this on the client side
    if (typeof window === "undefined") return []

    if (enableClustering && clusters.length > 0) {
      // Use clustered data
      return clusters.map(cluster => {
        const element = document.createElement("div")

        // Use ReactDOM.render to render the ClusterMarker component into the element
        const clusterId = cluster.properties.cluster_id
        const isCluster = cluster.properties.cluster

        return {
          id: isCluster
            ? `cluster-${clusterId}`
            : cluster.properties.record?.id || `point-${cluster.id}`,
          lngLat: cluster.geometry.coordinates as [number, number],
          options: {
            element,
            anchor: "center" as const
          },
          popupContent: isCluster
            ? `<div class="p-2">
                <h3 class="font-semibold text-sm">Cluster of ${cluster.properties.point_count} records</h3>
                <p class="text-xs text-gray-500 mt-1">Click to expand</p>
               </div>`
            : `<div class="p-2">
                <h3 class="font-semibold text-sm">${cluster.properties.record?.title || "Metadata Record"}</h3>
                <p class="text-xs text-gray-500 mt-1">Click marker for details</p>
               </div>`,
          popupOptions: {
            closeButton: true,
            closeOnClick: false
          },
          clusterData: cluster // Store cluster data for rendering
        }
      })
    } else {
      // Use individual markers (original behavior)
      return records
        .filter(hasValidSpatialBounds)
        .map(record => {
          const center = getRecordCenter(record)
          if (!center) return null

          const element = document.createElement("div")

          return {
            id: record.id,
            lngLat: center,
            options: { element },
            popupContent: `
              <div class="p-2">
                <h3 class="font-semibold text-sm">${record.title}</h3>
                <p class="text-xs text-gray-500 mt-1">Click marker label for details</p>
              </div>
            `,
            popupOptions: {
              closeButton: true,
              closeOnClick: false
            }
          }
        })
        .filter(Boolean) as MarkerData[]
    }
  }, [records, clusters, enableClustering])

  // Set up map markers using the declarative hook
  const { markerInstances } = useMapMarkers({
    map: mapInstance,
    markers: markerDataArray // Pass the derived marker data
  })

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

        // Add outline layer only after the fill layer is added
        setTimeout(() => {
          if (mapInstance.getLayer("metadata-bounds")) {
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
        }, 100)
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

  // Old marker useEffect (lines 250-338) is now removed.
  // useMapMarkers hook above handles marker creation/removal declaratively.

  // Handle marker click - supports both cluster and individual record clicks
  const handleMarkerClick = useCallback(
    (markerId: string) => {
      // Check if this is a cluster marker
      if (markerId.startsWith("cluster-")) {
        const clusterId = parseInt(markerId.replace("cluster-", ""))
        expandCluster(clusterId)
        return
      }

      // Handle individual record click
      const record = records.find(r => r.id === markerId)
      if (record) {
        setSelectedRecordId(markerId)
        if (onRecordClick) {
          onRecordClick(record)
        }
        // Optionally, fly to the record when its marker is clicked
        const bounds = getRecordBounds(record)
        if (bounds) {
          fitBounds(bounds, { padding: 200, maxZoom: 15 })
        }
      }
    },
    [records, onRecordClick, fitBounds, expandCluster]
  )

  // New useEffect for styling marker elements and attaching click handlers (supports clustering)
  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return

    if (!mapInstance || !isMapLoaded || !markerInstances) return

    markerInstances.forEach((markerInstance, markerId) => {
      const el = markerInstance.getElement()
      if (!el) return

      // Clear previous content and listeners
      el.innerHTML = ""

      // Find corresponding marker data for rendering
      const markerData = markerDataArray.find(m => m.id === markerId)
      if (!markerData) return

      // Check if this marker has cluster data
      const clusterData = (markerData as any).clusterData

      if (enableClustering && clusterData) {
        // Render cluster marker using our ClusterMarker component logic
        const isCluster = clusterData.properties.cluster
        const pointCount = clusterData.properties.point_count || 0

        if (isCluster) {
          // Cluster marker
          let size = 30
          let sizeClass = "small"
          let bgColor = "bg-blue-500"
          let textSize = "text-xs"

          if (pointCount >= 100) {
            size = 60
            sizeClass = "xlarge"
            bgColor = "bg-blue-800"
            textSize = "text-lg"
          } else if (pointCount >= 50) {
            size = 50
            sizeClass = "large"
            bgColor = "bg-blue-700"
            textSize = "text-base"
          } else if (pointCount >= 10) {
            size = 40
            sizeClass = "medium"
            bgColor = "bg-blue-600"
            textSize = "text-sm"
          }

          el.className =
            "cluster-marker cursor-pointer transform -translate-x-1/2 -translate-y-1/2 hover:scale-110 transition-transform duration-200"
          el.style.width = `${size}px`
          el.style.height = `${size}px`
          el.title = `${pointCount} metadata records (click to expand)`

          el.innerHTML = `
            <div class="relative w-full h-full rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white font-bold ${bgColor} ${textSize}">
              <span class="select-none">${pointCount}</span>
              <div class="absolute inset-0 rounded-full border-2 border-blue-400 animate-pulse opacity-50"></div>
            </div>
          `
        } else {
          // Individual point marker in clustering mode
          el.className =
            "individual-marker cursor-pointer transform -translate-x-1/2 -translate-y-1/2"
          el.title = clusterData.properties.record?.title || "Metadata Record"

          el.innerHTML = `
            <div class="relative">
              <div class="w-3 h-3 bg-blue-600 border-2 border-white rounded-full shadow-lg hover:scale-110 transition-transform duration-200"></div>
              <div class="absolute inset-0 w-3 h-3 bg-blue-600 rounded-full animate-ping opacity-75 hover:opacity-100"></div>
            </div>
          `
        }
      } else {
        // Individual marker (non-clustering mode)
        const record = records.find(r => r.id === markerId)
        if (!record) return

        el.className = "custom-marker" // Base class for common styling
        if (markerId === selectedRecordId) {
          el.classList.add("selected")
        }

        // Create custom marker content (original behavior)
        const dot = document.createElement("div")
        dot.className = "marker-dot"
        el.appendChild(dot)

        const label = document.createElement("div")
        label.className = "marker-label"
        label.textContent = record.title
        el.appendChild(label)
      }

      // Manage click listener
      const existingHandler = (el as any)._clickHandler
      if (existingHandler) {
        el.removeEventListener("click", existingHandler)
      }

      const newClickHandler = (e: MouseEvent) => {
        e.stopPropagation() // Prevent map click when marker is clicked
        handleMarkerClick(markerId)
      }
      el.addEventListener("click", newClickHandler)
      ;(el as any)._clickHandler = newClickHandler // Store for removal
    })

    // Cleanup: Remove click listeners when the component unmounts or dependencies change
    return () => {
      if (markerInstances) {
        markerInstances.forEach(markerInstance => {
          const el = markerInstance.getElement()
          const handler = (el as any)?._clickHandler
          if (el && handler) {
            el.removeEventListener("click", handler)
            delete (el as any)._clickHandler
          }
        })
      }
    }
  }, [
    mapInstance,
    isMapLoaded,
    markerInstances,
    selectedRecordId,
    records,
    handleMarkerClick,
    markerDataArray,
    enableClustering
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

  // handleMarkerClick is now defined above, within the new marker styling useEffect's scope or as a useCallback before it.
  // The existing handleMarkerClick (lines 341-350) has been effectively replaced/merged.

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
