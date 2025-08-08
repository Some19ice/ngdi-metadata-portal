"use client"

import { useEffect, useState, useRef } from "react"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { Undo2 } from "lucide-react"
import { MapErrorBoundary } from "./map-error-boundary"

// Define the props for the component
interface BoundingBoxSelectorProps {
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

// Dynamically import the MapLibre-based bbox map to avoid SSR issues
const BoundingBoxMap = dynamic(() => import("./bounding-box-map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-80 bg-gray-100 animate-pulse rounded-md flex items-center justify-center text-muted-foreground">
      Loading map...
    </div>
  )
})

export default function BoundingBoxSelector({
  onBoundsChange,
  initialBounds
}: BoundingBoxSelectorProps) {
  const [bounds, setBounds] = useState<{
    north: number
    south: number
    east: number
    west: number
  } | null>(initialBounds || null)

  // Create a unique key for the map component to prevent re-initialization issues
  const mapKeyRef = useRef(`bbox-selector-${Date.now()}-${Math.random()}`)

  // Handle local bound changes
  const handleBoundsChange = (
    newBounds: {
      north: number
      south: number
      east: number
      west: number
    } | null
  ) => {
    setBounds(newBounds)
    if (onBoundsChange) {
      onBoundsChange(newBounds)
    }
  }

  // Reset bounds
  const resetBounds = () => {
    setBounds(null)
    if (onBoundsChange) {
      onBoundsChange(null)
    }
  }

  // Update bounds when initialBounds prop changes
  useEffect(() => {
    setBounds(initialBounds || null)
  }, [initialBounds])

  return (
    <div className="relative w-full rounded-md overflow-hidden">
      <div className="absolute z-10 top-2 right-2">
        <Button
          variant="outline"
          size="sm"
          className="bg-white"
          onClick={resetBounds}
          title="Reset bounding box"
        >
          <Undo2 className="h-4 w-4" />
        </Button>
      </div>
      <MapErrorBoundary>
        <BoundingBoxMap
          key={mapKeyRef.current}
          onBoundsChange={handleBoundsChange}
          initialBounds={initialBounds}
        />
      </MapErrorBoundary>
      <div className="text-xs text-muted-foreground mt-2">
        Click and drag on the map to define a search bounding box.
      </div>
    </div>
  )
}
