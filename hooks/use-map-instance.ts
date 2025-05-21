"use client"

import { useRef, useState, useEffect } from "react"
import maplibregl, { Map, MapOptions } from "maplibre-gl"
import { logMapError } from "@/lib/map-config"

interface UseMapInstanceOptions {
  container: HTMLElement | string
  initialOptions: Omit<MapOptions, "container">
  onLoad?: (map: Map) => void
  onError?: (error: Error) => void
}

/**
 * Hook to manage a MapLibre GL JS map instance
 *
 * @param options Configuration options for the map instance
 * @returns Object containing the map instance and loading state
 */
export function useMapInstance({
  container,
  initialOptions,
  onLoad,
  onError
}: UseMapInstanceOptions) {
  const mapRef = useRef<Map | null>(null)
  const containerRef = useRef<HTMLElement | string | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    // Skip initialization if container is not available
    if (!container) return

    // Check if the container reference has changed
    const containerChanged = containerRef.current !== container

    // Clean up existing map if the container has changed
    if (mapRef.current && containerChanged) {
      console.log("Container reference changed, cleaning up existing map")
      mapRef.current.remove()
      mapRef.current = null
      setIsLoaded(false)
      setError(null)
    }

    // Don't re-initialize if we already have a map and the container hasn't changed
    if (mapRef.current && !containerChanged) return

    try {
      // Update our reference to the current container
      containerRef.current = container

      // Create new map instance
      const map = new Map({
        container,
        ...initialOptions
      })

      // Set up event handlers
      map.on("load", () => {
        setIsLoaded(true)
        if (onLoad) onLoad(map)
      })

      map.on("error", e => {
        const mapError = new Error(
          `Map error: ${e.error?.message || "Unknown error"}`
        )
        // Use our centralized error logging
        logMapError(mapError, "Map Runtime Error")
        setError(mapError)
        if (onError) onError(mapError)
      })

      // Store map reference
      mapRef.current = map

      // Cleanup function
      return () => {
        if (mapRef.current) {
          mapRef.current.remove()
          mapRef.current = null
          setIsLoaded(false)
          setError(null)
        }
      }
    } catch (err) {
      const initError =
        err instanceof Error ? err : new Error("Failed to initialize map")

      // Use our centralized error logging
      logMapError(initError, "Map Initialization")

      // Set error state
      setError(initError)

      // Call the error handler if provided
      if (onError) onError(initError)
    }
  }, [container, initialOptions, onLoad, onError])

  return {
    map: mapRef.current,
    isLoaded,
    error
  }
}
