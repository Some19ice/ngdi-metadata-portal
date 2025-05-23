"use client"

import { useEffect, useRef, useMemo } from "react"
import {
  Map,
  IControl,
  NavigationControl,
  ScaleControl,
  FullscreenControl,
  GeolocateControl,
  Marker
} from "maplibre-gl"

export type ControlPosition =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"

export interface MapControl {
  id: string
  control: IControl
  position: ControlPosition
}

interface UseMapControlsOptions {
  map: Map | null
  controls?: MapControl[]
  defaultControls?: {
    navigation?: boolean
    scale?: boolean
    fullscreen?: boolean
    geolocate?: boolean
  }
}

/**
 * Hook to manage map controls
 *
 * @param options Configuration options for map controls
 * @returns Object containing methods to add and remove controls
 */
export function useMapControls({
  map,
  controls = [],
  defaultControls = {
    navigation: true,
    scale: true,
    fullscreen: false,
    geolocate: false
  }
}: UseMapControlsOptions) {
  const geolocateMarkerRef = useRef<Marker | null>(null)

  // Memoize defaultControls to prevent infinite re-renders
  const memoizedDefaultControls = useMemo(
    () => defaultControls,
    [
      defaultControls?.navigation,
      defaultControls?.scale,
      defaultControls?.fullscreen,
      defaultControls?.geolocate
    ]
  )

  // Memoize controls array to prevent infinite re-renders
  const memoizedControls = useMemo(() => controls, [controls])

  // Array to store custom cleanup functions from default controls
  const customCleanupFunctions: (() => void)[] = []

  // Add default controls if specified
  useEffect(() => {
    if (!map) return

    const addedControls: { id: string; control: IControl }[] = []
    // Reset custom cleanup functions for this effect run
    customCleanupFunctions.length = 0

    // Add navigation control
    if (memoizedDefaultControls.navigation) {
      const navigationControl = new NavigationControl({ visualizePitch: true })
      map.addControl(navigationControl, "top-right")
      addedControls.push({ id: "navigation", control: navigationControl })
    }

    // Add scale control
    if (memoizedDefaultControls.scale) {
      const scaleControl = new ScaleControl({
        maxWidth: 100,
        unit: "metric"
      })
      map.addControl(scaleControl, "bottom-left")
      addedControls.push({ id: "scale", control: scaleControl })
    }

    // Add fullscreen control
    if (memoizedDefaultControls.fullscreen) {
      const fullscreenControl = new FullscreenControl()
      map.addControl(fullscreenControl, "top-right")
      addedControls.push({ id: "fullscreen", control: fullscreenControl })
    }

    // Add geolocate control
    if (memoizedDefaultControls.geolocate) {
      const geolocateControl = new GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true
        },
        trackUserLocation: false,
        showAccuracyCircle: false,
        showUserLocation: false // Disable built-in user location dot
      })

      // Store the last known position to recreate marker after style changes
      let lastKnownPosition: [number, number] | null = null

      // Function to create/recreate the marker
      const createLocationMarker = (lng: number, lat: number) => {
        // Remove existing marker
        if (geolocateMarkerRef.current) {
          geolocateMarkerRef.current.remove()
          geolocateMarkerRef.current = null
        }

        // Create new marker
        const marker = new Marker({
          color: "#FF0000",
          scale: 1.5
        })
          .setLngLat([lng, lat])
          .addTo(map!)

        geolocateMarkerRef.current = marker
        lastKnownPosition = [lng, lat]
      }

      // Event listener for successful geolocation
      geolocateControl.on("geolocate", (e: any) => {
        if (e.coords) {
          const { longitude, latitude } = e.coords

          // Wait for any zoom/pan animations to complete
          setTimeout(() => {
            createLocationMarker(longitude, latitude)
          }, 500) // Increased delay to wait for animations
        }
      })

      // Recreate marker after style changes if we have a last known position
      const recreateMarkerAfterStyleChange = () => {
        if (lastKnownPosition && map.isStyleLoaded()) {
          setTimeout(() => {
            if (lastKnownPosition) {
              createLocationMarker(lastKnownPosition[0], lastKnownPosition[1])
            }
          }, 200)
        }
      }

      // Listen for style changes to recreate marker
      map.on("styledata", recreateMarkerAfterStyleChange)

      // Event listener for geolocate error
      geolocateControl.on("error", () => {
        if (geolocateMarkerRef.current) {
          geolocateMarkerRef.current.remove()
          geolocateMarkerRef.current = null
        }
        lastKnownPosition = null
      })

      map.addControl(geolocateControl, "top-left")
      addedControls.push({ id: "geolocate", control: geolocateControl })

      // Store cleanup function for style listener
      const cleanupStyleListener = () => {
        // Check if map is still valid and style listener is attached
        if (map && map.getStyle() && map.listens("styledata")) {
          map.off("styledata", recreateMarkerAfterStyleChange)
        }
      }
      // Store this custom cleanup to be called directly
      customCleanupFunctions.push(cleanupStyleListener)
    }

    // Cleanup function to remove controls
    return () => {
      addedControls.forEach(({ control }) => {
        // Ensure map is still valid and control is a real map control
        if (
          map &&
          map.getStyle() &&
          typeof control.onAdd === "function" &&
          typeof control.onRemove === "function"
        ) {
          try {
            map.removeControl(control)
          } catch (e) {
            // Log if a specific control removal fails, but don't break the loop
            console.warn(`Failed to remove control:`, control, e)
          }
        }
      })
      // Call custom cleanup functions
      customCleanupFunctions.forEach(cleanup => cleanup())
      // No need to clear customCleanupFunctions here as it's reset at the start of the effect

      // Also remove the geolocate marker on cleanup
      if (geolocateMarkerRef.current) {
        geolocateMarkerRef.current.remove()
        geolocateMarkerRef.current = null
      }
    }
  }, [map, memoizedDefaultControls])

  // Add custom controls
  useEffect(() => {
    if (!map) return

    // Add all custom controls
    memoizedControls.forEach(({ control, position }) => {
      map.addControl(control, position)
    })

    // Cleanup function to remove controls
    return () => {
      memoizedControls.forEach(({ control }) => {
        // Ensure map is still valid before trying to remove control
        if (map && map.getStyle()) {
          map.removeControl(control)
        }
      })
    }
  }, [map, memoizedControls])

  // Function to add a control
  const addControl = (control: IControl, position: ControlPosition) => {
    if (map) {
      map.addControl(control, position)
    }
  }

  // Function to remove a control
  const removeControl = (control: IControl) => {
    if (map) {
      map.removeControl(control)
    }
  }

  return {
    addControl,
    removeControl
  }
}
