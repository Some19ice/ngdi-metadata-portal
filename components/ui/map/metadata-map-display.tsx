"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Map } from "maplibre-gl"
import { toast } from "sonner"
import MapView from "./map-view"
import LayerControlPanel from "./layer-control-panel"
import { MapStyle } from "./map-view"
import {
  useMapLayers,
  useMapMarkers,
  useMapViewport,
  MarkerData
} from "@/hooks"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Layers, ZoomIn, ZoomOut, Home, Info } from "lucide-react"
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
}

export default function MetadataMapDisplay({
  records,
  className = "h-[500px] w-full",
  onRecordClick,
  showBoundingBoxes = true
}: MetadataMapDisplayProps) {
  const [mapInstance, setMapInstance] = useState<Map | null>(null)
  const [activeStyleId, setActiveStyleId] = useState<string>("streets")
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null)
  const [isMapLoaded, setIsMapLoaded] = useState(false)

  // Use our centralized map configuration utility to get available styles
  const availableBaseStyles: MapStyle[] = useMemo(
    () => getAvailableMapStyles(),
    []
  )

  // Handle style change
  const handleStyleChange = useCallback((styleId: string) => {
    setActiveStyleId(styleId)
  }, [])

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

  // Prepare marker data for the useMapMarkers hook
  const markerDataArray: MarkerData[] = useMemo(() => {
    // Only run this on the client side
    if (typeof window === "undefined") return []

    return records
      .filter(hasValidSpatialBounds)
      .map(record => {
        const center = getRecordCenter(record)
        if (!center) return null

        // Create a new DOM element for each marker.
        // useMapMarkers will use this element.
        const element = document.createElement("div")

        return {
          id: record.id,
          lngLat: center,
          options: { element }, // Pass the created element
          popupContent: `
            <div class="p-2">
              <h3 class="font-semibold text-sm">${record.title}</h3>
              <p class="text-xs text-gray-500 mt-1">Click marker label for details</p>
            </div>
          `,
          popupOptions: {
            closeButton: true,
            closeOnClick: false // Keep popup open if map is clicked
          }
        }
      })
      .filter(Boolean) as MarkerData[] // Filter out nulls and assert type
  }, [records])

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

  // Add bounding box layer when map is loaded
  useEffect(() => {
    if (!mapInstance || !isMapLoaded || !showBoundingBoxes) return

    // Track whether we've successfully added the layers
    let layersAdded = false

    // Function to add/update layers when style is loaded
    const addBoundingBoxLayers = () => {
      if (!mapInstance || !mapInstance.isStyleLoaded()) return

      try {
        // Check if the source already exists
        const existingSource = mapInstance.getSource("metadata-bounds")

        if (existingSource) {
          // Update existing source data
          if ("setData" in existingSource) {
            existingSource.setData(recordsToGeoJSON(records))
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

          // Set the flag to indicate layers were added
          layersAdded = true
        }

        // Style is selected, set selected record styling
        if (selectedRecordId) {
          // Add a conditional filter to highlight the selected record
          mapInstance.setFilter("metadata-bounds", [
            "==",
            ["get", "id"],
            selectedRecordId
          ])
          mapInstance.setFilter("metadata-bounds-outline", [
            "==",
            ["get", "id"],
            selectedRecordId
          ])
        } else {
          // Reset filter to show all records
          mapInstance.setFilter("metadata-bounds", null)
          mapInstance.setFilter("metadata-bounds-outline", null)
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
    }

    // Try to add layers immediately if style is loaded
    if (mapInstance.isStyleLoaded()) {
      addBoundingBoxLayers()
    }

    // Set up a listener for style data to handle style changes
    const handleStyleData = () => {
      if (mapInstance.isStyleLoaded() && !layersAdded) {
        addBoundingBoxLayers()
      }
    }

    mapInstance.on("styledata", handleStyleData)

    // Cleanup function
    return () => {
      if (!mapInstance) return

      // Remove event listener
      mapInstance.off("styledata", handleStyleData)

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
    activeStyleId // Add activeStyleId to dependency array
  ])

  // Update bounding box layer when records change
  useEffect(() => {
    if (!mapInstance || !isMapLoaded || !showBoundingBoxes) return

    // Make sure the style is loaded before trying to access sources
    if (!mapInstance.isStyleLoaded()) return

    // Check if the source exists before trying to update it
    try {
      // First check if the source exists to avoid errors
      if (mapInstance.getSource("metadata-bounds")) {
        const source = mapInstance.getSource("metadata-bounds")
        if (source && "setData" in source) {
          source.setData(recordsToGeoJSON(records))
        }
      }
    } catch (err) {
      // Use our centralized error logging
      logMapError(
        err instanceof Error ? err : new Error(String(err)),
        "Updating Map Source Data"
      )
    }
  }, [mapInstance, isMapLoaded, records, showBoundingBoxes])

  // Old marker useEffect (lines 250-338) is now removed.
  // useMapMarkers hook above handles marker creation/removal declaratively.

  // Handle marker click - This callback is passed to individual marker elements.
  const handleMarkerClick = useCallback(
    (recordId: string) => {
      const record = records.find(r => r.id === recordId)
      if (record) {
        setSelectedRecordId(recordId)
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
    [records, onRecordClick, fitBounds] // Include setSelectedRecordId if it was stable
  )

  // New useEffect for styling marker elements and attaching click handlers
  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return

    if (!mapInstance || !isMapLoaded || !markerInstances) return

    markerInstances.forEach((markerInstance, recordId) => {
      const record = records.find(r => r.id === recordId)
      if (!record) return

      const el = markerInstance.getElement()
      if (!el) return

      // Clear previous content and listeners to be safe, though useMapMarkers
      // should provide fresh elements if 'options.element' changes.
      el.innerHTML = ""

      // Apply base and selected styles
      el.className = "custom-marker" // Base class for common styling
      if (recordId === selectedRecordId) {
        el.classList.add("selected")
      }

      // Create custom marker content (e.g., dot and label)
      const dot = document.createElement("div")
      dot.className = "marker-dot"
      el.appendChild(dot)

      const label = document.createElement("div")
      label.className = "marker-label"
      label.textContent = record.title
      el.appendChild(label)

      // Manage click listener
      // Store the handler on the element to remove it correctly if this effect re-runs for the same element.
      // A more robust approach would be if useMapMarkers itself could take an onMarkerClick prop per marker.
      const existingHandler = (el as any)._clickHandler
      if (existingHandler) {
        el.removeEventListener("click", existingHandler)
      }

      const newClickHandler = (e: MouseEvent) => {
        e.stopPropagation() // Prevent map click when marker is clicked
        handleMarkerClick(recordId)
      }
      el.addEventListener("click", newClickHandler)
      ;(el as any)._clickHandler = newClickHandler // Store for removal
    })

    // Cleanup: Remove click listeners when the component unmounts or dependencies change
    // This is important if elements are not re-created by useMapMarkers on every data change.
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
    handleMarkerClick
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
          initialStyleId={activeStyleId}
          availableBaseStyles={availableBaseStyles}
          className="h-full w-full rounded-md"
          onMapLoad={handleMapLoad}
          onStyleChange={handleStyleChange}
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
