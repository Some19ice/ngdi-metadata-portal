import { useState, useCallback, useEffect } from "react"
import { Map, LngLatBounds } from "maplibre-gl"
import mapboxgl from "maplibre-gl"

interface SpatialSearchOptions {
  map: Map | null
  onBoundsChange?: (
    bounds: {
      north: number
      south: number
      east: number
      west: number
    } | null
  ) => void
  enabled?: boolean
}

interface UseSpatialSearchReturn {
  isDrawingEnabled: boolean
  drawingBounds: LngLatBounds | null
  enableDrawing: () => void
  disableDrawing: () => void
  clearBounds: () => void
  getCurrentBounds: () => {
    north: number
    south: number
    east: number
    west: number
  } | null
}

export function useSpatialSearch({
  map,
  onBoundsChange,
  enabled = false
}: SpatialSearchOptions): UseSpatialSearchReturn {
  const [isDrawingEnabled, setIsDrawingEnabled] = useState(false)
  const [drawingBounds, setDrawingBounds] = useState<LngLatBounds | null>(null)
  const [drawingStartPoint, setDrawingStartPoint] = useState<{
    lng: number
    lat: number
  } | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)

  // Clear any existing spatial search layers and sources
  const clearSpatialLayers = useCallback(() => {
    if (!map) return

    try {
      // Remove layer if it exists
      if (map.getLayer("spatial-search-area")) {
        map.removeLayer("spatial-search-area")
      }
      if (map.getLayer("spatial-search-outline")) {
        map.removeLayer("spatial-search-outline")
      }

      // Remove source if it exists
      if (map.getSource("spatial-search")) {
        map.removeSource("spatial-search")
      }
    } catch (error) {
      // Ignore errors - layers/sources might not exist
    }
  }, [map])

  // Add spatial search visualization to map
  const addSpatialSearchLayer = useCallback(
    (bounds: LngLatBounds) => {
      if (!map) return

      clearSpatialLayers()

      const sw = bounds.getSouthWest()
      const ne = bounds.getNorthEast()

      const boundsGeoJSON = {
        type: "Feature" as const,
        properties: {},
        geometry: {
          type: "Polygon" as const,
          coordinates: [
            [
              [sw.lng, sw.lat],
              [ne.lng, sw.lat],
              [ne.lng, ne.lat],
              [sw.lng, ne.lat],
              [sw.lng, sw.lat]
            ]
          ]
        }
      }

      try {
        // Add source
        map.addSource("spatial-search", {
          type: "geojson",
          data: boundsGeoJSON
        })

        // Add fill layer
        map.addLayer({
          id: "spatial-search-area",
          type: "fill",
          source: "spatial-search",
          paint: {
            "fill-color": "#3b82f6",
            "fill-opacity": 0.2
          }
        })

        // Add outline layer
        map.addLayer({
          id: "spatial-search-outline",
          type: "line",
          source: "spatial-search",
          paint: {
            "line-color": "#3b82f6",
            "line-width": 3,
            "line-dasharray": [2, 2]
          }
        })
      } catch (error) {
        console.error("Error adding spatial search layer:", error)
      }
    },
    [map, clearSpatialLayers]
  )

  // Enable drawing mode
  const enableDrawing = useCallback(() => {
    if (!map) return

    setIsDrawingEnabled(true)
    map.getCanvas().style.cursor = "crosshair"
  }, [map])

  // Disable drawing mode
  const disableDrawing = useCallback(() => {
    if (!map) return

    setIsDrawingEnabled(false)
    setIsDrawing(false)
    setDrawingStartPoint(null)
    map.getCanvas().style.cursor = ""
  }, [map])

  // Clear bounds and layers
  const clearBounds = useCallback(() => {
    setDrawingBounds(null)
    clearSpatialLayers()
    onBoundsChange?.(null)
  }, [clearSpatialLayers, onBoundsChange])

  // Get current bounds as plain object
  const getCurrentBounds = useCallback(() => {
    if (!drawingBounds) return null

    const sw = drawingBounds.getSouthWest()
    const ne = drawingBounds.getNorthEast()

    return {
      north: ne.lat,
      south: sw.lat,
      east: ne.lng,
      west: sw.lng
    }
  }, [drawingBounds])

  // Handle mouse events for drawing
  useEffect(() => {
    if (!map || !isDrawingEnabled) return

    const handleMouseDown = (e: mapboxgl.MapMouseEvent) => {
      if (!isDrawingEnabled) return

      setIsDrawing(true)
      setDrawingStartPoint({ lng: e.lngLat.lng, lat: e.lngLat.lat })

      // Prevent map panning during drawing
      map.dragPan.disable()
    }

    const handleMouseMove = (e: mapboxgl.MapMouseEvent) => {
      if (!isDrawing || !drawingStartPoint) return

      const currentPoint = { lng: e.lngLat.lng, lat: e.lngLat.lat }

      const newBounds = new LngLatBounds([
        [
          Math.min(drawingStartPoint.lng, currentPoint.lng),
          Math.min(drawingStartPoint.lat, currentPoint.lat)
        ],
        [
          Math.max(drawingStartPoint.lng, currentPoint.lng),
          Math.max(drawingStartPoint.lat, currentPoint.lat)
        ]
      ])

      setDrawingBounds(newBounds)
      addSpatialSearchLayer(newBounds)
    }

    const handleMouseUp = (e: mapboxgl.MapMouseEvent) => {
      if (!isDrawing || !drawingStartPoint) return

      const currentPoint = { lng: e.lngLat.lng, lat: e.lngLat.lat }

      const finalBounds = new LngLatBounds([
        [
          Math.min(drawingStartPoint.lng, currentPoint.lng),
          Math.min(drawingStartPoint.lat, currentPoint.lat)
        ],
        [
          Math.max(drawingStartPoint.lng, currentPoint.lng),
          Math.max(drawingStartPoint.lat, currentPoint.lat)
        ]
      ])

      setDrawingBounds(finalBounds)
      setIsDrawing(false)
      setDrawingStartPoint(null)

      // Re-enable map panning
      map.dragPan.enable()

      // Disable drawing mode after completing a selection
      disableDrawing()

      // Notify parent of bounds change
      const sw = finalBounds.getSouthWest()
      const ne = finalBounds.getNorthEast()
      onBoundsChange?.({
        north: ne.lat,
        south: sw.lat,
        east: ne.lng,
        west: sw.lng
      })
    }

    map.on("mousedown", handleMouseDown)
    map.on("mousemove", handleMouseMove)
    map.on("mouseup", handleMouseUp)

    return () => {
      map.off("mousedown", handleMouseDown)
      map.off("mousemove", handleMouseMove)
      map.off("mouseup", handleMouseUp)

      // Re-enable panning if it was disabled
      if (!map.dragPan.isEnabled()) {
        map.dragPan.enable()
      }
    }
  }, [
    map,
    isDrawingEnabled,
    isDrawing,
    drawingStartPoint,
    addSpatialSearchLayer,
    disableDrawing,
    onBoundsChange
  ])

  // Clean up on unmount or when drawing is disabled
  useEffect(() => {
    if (!isDrawingEnabled) {
      clearSpatialLayers()
    }
  }, [isDrawingEnabled, clearSpatialLayers])

  return {
    isDrawingEnabled,
    drawingBounds,
    enableDrawing,
    disableDrawing,
    clearBounds,
    getCurrentBounds
  }
}
