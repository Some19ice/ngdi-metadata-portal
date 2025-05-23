"use client"

import { useRef, useEffect, useState } from "react"

/**
 * Custom hook to manage Leaflet map component keys and prevent re-initialization errors
 * This is particularly useful in React development mode where components may mount/unmount frequently
 */
export function useLeafletMapKey(prefix: string = "leaflet-map") {
  const keyRef = useRef(`${prefix}-${Date.now()}-${Math.random()}`)

  // Return a stable key that won't change during the component's lifecycle
  return keyRef.current
}

/**
 * Hook to track map initialization state and provide error recovery
 */
export function useMapInitialization() {
  const [isInitialized, setIsInitialized] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const handleMapReady = () => {
    setIsInitialized(true)
    setHasError(false)
    setError(null)
  }

  const handleMapError = (err: Error) => {
    setHasError(true)
    setError(err)
    setIsInitialized(false)
  }

  const resetError = () => {
    setHasError(false)
    setError(null)
  }

  return {
    isInitialized,
    hasError,
    error,
    handleMapReady,
    handleMapError,
    resetError
  }
}

/**
 * Hook to safely handle Leaflet map container cleanup
 * Helps prevent "Map container is already initialized" errors
 */
export function useMapCleanup() {
  const cleanupRef = useRef<(() => void) | null>(null)

  const registerCleanup = (cleanupFn: () => void) => {
    cleanupRef.current = cleanupFn
  }

  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        try {
          cleanupRef.current()
        } catch (error) {
          console.warn("Error during map cleanup:", error)
        }
      }
    }
  }, [])

  return { registerCleanup }
}
