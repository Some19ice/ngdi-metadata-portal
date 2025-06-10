"use client"

import { useMemo, useRef } from "react"

/**
 * Custom hook to generate stable map keys for Leaflet MapContainer components
 * This helps prevent unnecessary re-renders and maintains map state
 */
export function useLeafletMapKey(baseKey: string): string {
  const instanceIdRef = useRef<string | undefined>(undefined)

  return useMemo(() => {
    if (!instanceIdRef.current) {
      // Generate a unique ID only once for this component instance
      instanceIdRef.current = Math.random().toString(36).substring(2, 11)
    }
    return `leaflet-map-${baseKey}-${instanceIdRef.current}`
  }, [baseKey])
}
