"use client"

import { useState, useEffect, useRef } from "react"
import { Map } from "maplibre-gl"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { MapIcon, AlertCircle } from "lucide-react"

interface StylePreviewProps {
  styleId: string
  styleName: string
  styleUrl: string
  isAvailable: boolean
  center?: [number, number]
  zoom?: number
  className?: string
}

export default function StylePreview({
  styleId,
  styleName,
  styleUrl,
  isAvailable,
  center = [8.6775, 9.0778], // Nigeria
  zoom = 5,
  className = "h-40"
}: StylePreviewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<Map | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    // Don't run on server side
    if (typeof window === "undefined") return

    // Don't try to initialize if the style is not available or URL is empty
    if (!isAvailable || !styleUrl || !mapContainerRef.current) {
      return
    }

    try {
      // Initialize the map
      const map = new Map({
        container: mapContainerRef.current,
        style: styleUrl,
        center: center,
        zoom: zoom,
        attributionControl: false,
        interactive: false // Disable interactions for preview
      })

      // Set up event handlers
      map.on("load", () => {
        setIsLoaded(true)
      })

      map.on("error", e => {
        console.error(`Map error for style ${styleId}:`, e)
        setHasError(true)
      })

      // Store map reference
      mapRef.current = map

      // Cleanup function
      return () => {
        if (mapRef.current) {
          mapRef.current.remove()
          mapRef.current = null
        }
      }
    } catch (err) {
      console.error(`Error initializing map for style ${styleId}:`, err)
      setHasError(true)
    }
  }, [styleId, styleUrl, isAvailable, center, zoom])

  return (
    <Card className={`overflow-hidden ${!isAvailable ? "opacity-70" : ""}`}>
      <div className={`${className} relative`}>
        {isAvailable ? (
          <>
            <div
              ref={mapContainerRef}
              className={`w-full h-full ${!isLoaded ? "hidden" : ""}`}
            />
            {!isLoaded && !hasError && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <Skeleton className="h-full w-full" />
              </div>
            )}
            {hasError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 p-4 text-center">
                <AlertCircle className="h-8 w-8 text-amber-500 mb-2" />
                <p className="text-sm text-gray-500">Failed to load preview</p>
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 p-4 text-center">
            <MapIcon className="h-8 w-8 text-gray-400 mb-2" />
            <p className="text-sm text-gray-500">Preview unavailable</p>
            <p className="text-xs text-gray-400 mt-1">API key required</p>
          </div>
        )}

        {/* Style name overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
          <div className="flex justify-between items-center">
            <p className="text-white text-sm font-medium">{styleName}</p>
            {!isAvailable && (
              <Badge
                variant="outline"
                className="bg-black/50 text-white border-gray-600 text-xs"
              >
                API Key Required
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
