"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import {
  Map,
  LngLatLike,
  LngLatBounds,
  CameraOptions,
  AnimationOptions
} from "maplibre-gl"

export interface Viewport {
  center: LngLatLike
  zoom: number
  bearing?: number
  pitch?: number
  bounds?: LngLatBounds
}

interface UseMapViewportOptions {
  map: Map | null
  initialViewport: Viewport
  onViewportChange?: (viewport: Viewport) => void
}

/**
 * Hook to manage map viewport (center, zoom, bearing, pitch)
 *
 * @param options Configuration options for viewport
 * @returns Object containing viewport state and methods to update it
 */
export function useMapViewport({
  map,
  initialViewport,
  onViewportChange
}: UseMapViewportOptions) {
  const [viewport, setViewport] = useState<Viewport>(initialViewport)
  const initialViewportSetRef = useRef(false)

  // Initialize viewport when map is loaded and handle move events
  useEffect(() => {
    if (!map) return

    // Set initial viewport only once
    if (!initialViewportSetRef.current) {
      if (initialViewport.bounds) {
        map.fitBounds(initialViewport.bounds, {
          padding: 50,
          maxZoom: initialViewport.zoom
        })
      } else {
        map.jumpTo({
          center: initialViewport.center,
          zoom: initialViewport.zoom,
          bearing: initialViewport.bearing || 0,
          pitch: initialViewport.pitch || 0
        })
      }
      initialViewportSetRef.current = true
    }

    // Listen for move events to update viewport state
    const handleMoveEnd = () => {
      if (!map) return

      const center = map.getCenter()
      const zoom = map.getZoom()
      const bearing = map.getBearing()
      const pitch = map.getPitch()
      const bounds = map.getBounds()

      const newViewport = {
        center,
        zoom,
        bearing,
        pitch,
        bounds
      }

      setViewport(newViewport)
      if (onViewportChange) onViewportChange(newViewport)
    }

    map.on("moveend", handleMoveEnd)

    return () => {
      // Check if map instance is still valid before calling off
      // This can be important if the map is destroyed before the cleanup runs
      if (map.getStyle()) {
        // getStyle is a way to check if map is still interactive
        map.off("moveend", handleMoveEnd)
      }
    }
  }, [map, onViewportChange]) // initialViewport removed from dependencies

  // Function to fly to a specific location
  const flyTo = useCallback(
    (
      options: CameraOptions & { bounds?: LngLatBounds },
      animationOptions?: AnimationOptions
    ) => {
      if (!map) return

      if (options.bounds) {
        map.fitBounds(options.bounds, {
          padding: 50,
          ...animationOptions
        })
      } else {
        map.flyTo({
          center: options.center,
          zoom: options.zoom,
          bearing: options.bearing,
          pitch: options.pitch,
          ...animationOptions
        })
      }
    },
    [map]
  )

  // Function to jump to a specific location (no animation)
  const jumpTo = useCallback(
    (options: CameraOptions) => {
      if (!map) return
      map.jumpTo(options)
    },
    [map]
  )

  // Function to ease to a specific location
  const easeTo = useCallback(
    (options: CameraOptions, animationOptions?: AnimationOptions) => {
      if (!map) return
      map.easeTo({
        ...options,
        ...animationOptions
      })
    },
    [map]
  )

  // Function to fit bounds
  const fitBounds = useCallback(
    (
      bounds: LngLatBounds,
      options?: { padding?: number; maxZoom?: number }
    ) => {
      if (!map) return
      map.fitBounds(bounds, {
        padding: options?.padding || 50,
        maxZoom: options?.maxZoom || 16
      })
    },
    [map]
  )

  return {
    viewport,
    flyTo,
    jumpTo,
    easeTo,
    fitBounds
  }
}
