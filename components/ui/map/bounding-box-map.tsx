"use client"

import { useEffect, useState } from "react"
import { MapContainer, TileLayer, Rectangle, useMap } from "react-leaflet"
import L from "leaflet"

// Import Leaflet CSS
import "leaflet/dist/leaflet.css"

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

  // Set up event listeners
  useEffect(() => {
    function handleMouseDown(e: L.LeafletMouseEvent) {
      if (!drawing) {
        setDrawing(true)
        setStartPoint(e.latlng)
        setBounds(null)
      }
    }

    function handleMouseMove(e: L.LeafletMouseEvent) {
      if (drawing && startPoint) {
        const newBounds = L.latLngBounds(startPoint, e.latlng)
        setBounds(newBounds)
      }
    }

    function handleMouseUp(e: L.LeafletMouseEvent) {
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
    }

    map.on("mousedown", handleMouseDown)
    map.on("mousemove", handleMouseMove)
    map.on("mouseup", handleMouseUp)

    return () => {
      map.off("mousedown", handleMouseDown)
      map.off("mousemove", handleMouseMove)
      map.off("mouseup", handleMouseUp)
    }
  }, [drawing, startPoint, map, onBoundsChange])

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
  return (
    <div className="w-full h-80">
      <MapContainer
        center={[20, 0]} // Default center at equator
        zoom={2}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
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
