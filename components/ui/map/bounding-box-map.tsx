"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { MapContainer, TileLayer, Rectangle, useMap } from "react-leaflet"
import L from "leaflet"
import { useLeafletMapKey } from "@/hooks"

// Import Leaflet CSS
import "leaflet/dist/leaflet.css"

// Fix for default marker icon issue with webpack
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png"
})

// Define the props for the component
interface BoundingBoxMapProps {
  onBoundsChange?: (
    bounds: {
      north: number
      south: number
      east: number
      west: number
    } | null
  ) => void
  initialBounds?: {
    north: number
    south: number
    east: number
    west: number
  } | null
}

// Helper component to handle drawing and dragging
function BoundingBoxDrawer({
  onBoundsChange,
  initialBounds
}: BoundingBoxMapProps) {
  const map = useMap()
  const [bounds, setBounds] = useState<L.LatLngBounds | null>(null)
  const [drawing, setDrawing] = useState<boolean>(false)
  const [startPoint, setStartPoint] = useState<L.LatLng | null>(null)

  // Initialize with initial bounds if provided
  useEffect(() => {
    if (initialBounds) {
      const southwest = L.latLng(initialBounds.south, initialBounds.west)
      const northeast = L.latLng(initialBounds.north, initialBounds.east)
      const initialLatLngBounds = L.latLngBounds(southwest, northeast)
      setBounds(initialLatLngBounds)

      // Fit the map to these bounds if valid
      if (initialLatLngBounds.isValid()) {
        map.fitBounds(initialLatLngBounds)
      }
    }
  }, [initialBounds, map])

  // Stable event handlers to prevent unnecessary re-renders
  const handleMouseDown = useCallback(
    (e: L.LeafletMouseEvent) => {
      if (!drawing) {
        setDrawing(true)
        setStartPoint(e.latlng)
        setBounds(null)
      }
    },
    [drawing]
  )

  const handleMouseMove = useCallback(
    (e: L.LeafletMouseEvent) => {
      if (drawing && startPoint) {
        const newBounds = L.latLngBounds(startPoint, e.latlng)
        setBounds(newBounds)
      }
    },
    [drawing, startPoint]
  )

  const handleMouseUp = useCallback(
    (e: L.LeafletMouseEvent) => {
      if (drawing && startPoint) {
        setDrawing(false)
        const newBounds = L.latLngBounds(startPoint, e.latlng)
        setBounds(newBounds)

        if (onBoundsChange && newBounds.isValid()) {
          onBoundsChange({
            north: newBounds.getNorth(),
            south: newBounds.getSouth(),
            east: newBounds.getEast(),
            west: newBounds.getWest()
          })
        }
      }
    },
    [drawing, startPoint, onBoundsChange]
  )

  // Set up event listeners
  useEffect(() => {
    map.on("mousedown", handleMouseDown)
    map.on("mousemove", handleMouseMove)
    map.on("mouseup", handleMouseUp)

    return () => {
      map.off("mousedown", handleMouseDown)
      map.off("mousemove", handleMouseMove)
      map.off("mouseup", handleMouseUp)
    }
  }, [map, handleMouseDown, handleMouseMove, handleMouseUp])

  // Report bounds changes to parent component
  useEffect(() => {
    if (bounds && bounds.isValid() && onBoundsChange) {
      onBoundsChange({
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest()
      })
    }
  }, [bounds, onBoundsChange])

  return bounds ? (
    <Rectangle
      bounds={bounds}
      pathOptions={{ color: "blue", weight: 2, opacity: 0.7, fillOpacity: 0.2 }}
    />
  ) : null
}

export default function BoundingBoxMap({
  onBoundsChange,
  initialBounds
}: BoundingBoxMapProps) {
  // Use the custom hook for stable map key generation
  const mapKey = useLeafletMapKey("bounding-box-map")

  // Create a stable key that only changes when initialBounds structure changes
  const boundsKey = initialBounds
    ? `${initialBounds.north}-${initialBounds.south}-${initialBounds.east}-${initialBounds.west}`
    : "no-bounds"

  // Error boundary state
  const [hasError, setHasError] = useState(false)

  // Reset error state when bounds change
  useEffect(() => {
    setHasError(false)
  }, [boundsKey])

  if (hasError) {
    return (
      <div className="w-full h-80 bg-gray-100 rounded-md flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p>Map failed to load</p>
          <button
            onClick={() => setHasError(false)}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-80">
      <MapContainer
        key={`${mapKey}-${boundsKey}`}
        center={[20, 0]} // Default center at equator
        zoom={2}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
        // Add error handling
        whenReady={() => {
          // Map is ready, no additional setup needed
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <BoundingBoxDrawer
          onBoundsChange={onBoundsChange}
          initialBounds={initialBounds}
        />
      </MapContainer>
    </div>
  )
}
