"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import maplibregl, { Map, MapOptions } from "maplibre-gl"
import { logMapError } from "@/lib/map-config"

interface UseMapInstanceOptions {
  container: HTMLElement | string | null
  initialOptions: Omit<MapOptions, "container">
  onLoad?: (map: Map) => void
  onError?: (error: Error) => void
}

/**
 * Hook to manage a MapLibre GL JS map instance with proper cleanup
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
  const initialOptionsRef =
    useRef<Omit<MapOptions, "container">>(initialOptions)
  const isUnmountedRef = useRef(false)
  const cleanupFunctionsRef = useRef<Array<() => void>>([])

  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // Track component unmount to prevent state updates after cleanup
  useEffect(() => {
    isUnmountedRef.current = false
    return () => {
      isUnmountedRef.current = true
    }
  }, [])

  // Update initial options ref when they change meaningfully
  useEffect(() => {
    const hasChanged =
      JSON.stringify(initialOptionsRef.current) !==
      JSON.stringify(initialOptions)
    if (hasChanged) {
      initialOptionsRef.current = initialOptions
    }
  }, [initialOptions])

  // Enhanced cleanup function
  const performCleanup = useCallback(() => {
    // Execute all registered cleanup functions
    cleanupFunctionsRef.current.forEach(cleanup => {
      try {
        cleanup()
      } catch (error) {
        console.warn("Error during cleanup:", error)
      }
    })
    cleanupFunctionsRef.current = []

    // Clean up map instance
    if (mapRef.current) {
      try {
        // MapLibre requires specific event types for off(), so we remove the instance instead
        mapRef.current.remove()
      } catch (error) {
        console.warn("Error cleaning up map instance:", error)
      }
      mapRef.current = null
    }

    // Reset state only if component is still mounted
    if (!isUnmountedRef.current) {
      setIsLoaded(false)
      setError(null)
    }
  }, [])

  // Stable error handler
  const handleError = useCallback(
    (mapError: Error) => {
      if (isUnmountedRef.current) return

      logMapError(mapError, "Map Runtime Error")
      setError(mapError)
      if (onError) onError(mapError)
    },
    [onError]
  )

  // Stable load handler
  const handleLoad = useCallback(
    (map: Map) => {
      if (isUnmountedRef.current) return

      setIsLoaded(true)
      if (onLoad) onLoad(map)
    },
    [onLoad]
  )

  useEffect(() => {
    // Skip initialization if container is not available
    if (!container) {
      return
    }

    // Check if the container reference has changed
    const containerChanged = containerRef.current !== container

    // Clean up existing map if the container has changed
    if (mapRef.current && containerChanged) {
      console.log("Container reference changed, cleaning up existing map")
      performCleanup()
    }

    // Don't re-initialize if we already have a map and the container hasn't changed
    if (mapRef.current && !containerChanged) {
      return
    }

    try {
      // Update our reference to the current container
      containerRef.current = container

      // Create new map instance
      const map = new Map({
        container,
        ...initialOptionsRef.current
      })

      // Store map reference immediately
      mapRef.current = map

      // Set up event handlers with proper cleanup tracking
      const loadHandler = () => handleLoad(map)
      const errorHandler = (e: any) => {
        console.log("MapLibre error event:", e)
        logMapError(e, "MapLibre Error Event")

        const mapError = new Error(
          `Map error: ${e.error?.message || e.message || "Unknown error"}`
        )
        handleError(mapError)
      }

      map.on("load", loadHandler)
      map.on("error", errorHandler)

      // Register cleanup functions
      cleanupFunctionsRef.current.push(
        () => map.off("load", loadHandler),
        () => map.off("error", errorHandler)
      )

      // Cleanup function
      return performCleanup
    } catch (err) {
      const initError =
        err instanceof Error ? err : new Error("Failed to initialize map")

      // Use our centralized error logging
      logMapError(initError, "Map Initialization")

      // Set error state only if component is still mounted
      if (!isUnmountedRef.current) {
        setError(initError)
        // Call the error handler if provided
        handleError(initError)
      }
    }
  }, [container, handleLoad, handleError, performCleanup])

  // Cleanup on unmount
  useEffect(() => {
    return performCleanup
  }, [performCleanup])

  return {
    map: mapRef.current,
    isLoaded,
    error
  }
}
