"use client"

import { useEffect } from "react"
import {
  Map,
  IControl,
  NavigationControl,
  ScaleControl,
  FullscreenControl
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
    fullscreen: false
  }
}: UseMapControlsOptions) {
  // Add default controls if specified
  useEffect(() => {
    if (!map) return

    const addedControls: { id: string; control: IControl }[] = []

    // Add navigation control
    if (defaultControls.navigation) {
      const navigationControl = new NavigationControl({ visualizePitch: true })
      map.addControl(navigationControl, "top-right")
      addedControls.push({ id: "navigation", control: navigationControl })
    }

    // Add scale control
    if (defaultControls.scale) {
      const scaleControl = new ScaleControl({
        maxWidth: 100,
        unit: "metric"
      })
      map.addControl(scaleControl, "bottom-left")
      addedControls.push({ id: "scale", control: scaleControl })
    }

    // Add fullscreen control
    if (defaultControls.fullscreen) {
      const fullscreenControl = new FullscreenControl()
      map.addControl(fullscreenControl, "top-right")
      addedControls.push({ id: "fullscreen", control: fullscreenControl })
    }

    // Cleanup function to remove controls
    return () => {
      addedControls.forEach(({ control }) => {
        // Ensure map is still valid before trying to remove control
        if (map && map.getStyle()) {
          map.removeControl(control)
        }
      })
    }
  }, [map, defaultControls])

  // Add custom controls
  useEffect(() => {
    if (!map) return

    // Add all custom controls
    controls.forEach(({ control, position }) => {
      map.addControl(control, position)
    })

    // Cleanup function to remove controls
    return () => {
      controls.forEach(({ control }) => {
        // Ensure map is still valid before trying to remove control
        if (map && map.getStyle()) {
          map.removeControl(control)
        }
      })
    }
  }, [map, controls])

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
