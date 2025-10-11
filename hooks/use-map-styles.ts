"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Map, StyleSpecification } from "maplibre-gl"
import { MapStyle } from "@/components/ui/map/map-view"
import {
  logMapError,
  getFallbackStyle,
  styleRequiresApiKey
} from "@/lib/map-config"

interface UseMapStylesOptions {
  map: Map | null
  availableStyles: MapStyle[]
  initialStyleId: string
  onStyleChange?: (styleId: string) => void
  onStyleError?: (error: Error, styleId: string) => void
}

/**
 * Hook to manage map styles and style switching
 *
 * @param options Configuration options for map styles
 * @returns Object containing active style ID and style change handler
 */
export function useMapStyles({
  map,
  availableStyles,
  initialStyleId,
  onStyleChange,
  onStyleError
}: UseMapStylesOptions) {
  const [activeStyleId, setActiveStyleId] = useState<string>(initialStyleId)
  const [isStyleActuallyLoaded, setIsStyleActuallyLoaded] = useState(false)
  // Ref to store the URL of the last style *successfully applied* to map.setStyle
  const lastAppliedStyleUrlRef = useRef<string | StyleSpecification | null>(
    null
  )

  // Effect to sync activeStyleId with initialStyleId prop
  useEffect(() => {
    if (initialStyleId !== activeStyleId) {
      setActiveStyleId(initialStyleId)
    }
  }, [initialStyleId, activeStyleId]) // Include activeStyleId to prevent potential loop if initialStyleId changes rapidly

  // Effect to apply the style to the map when activeStyleId changes
  useEffect(() => {
    if (!map || !activeStyleId) {
      // If map is not ready or no active style, ensure loaded is false
      // unless there was a previously loaded style.
      // This depends on whether we want 'isStyleLoaded' to reflect 'any style ever loaded'
      // or 'the current activeStyleId is loaded'. For now, let's assume the latter.
      setIsStyleActuallyLoaded(false)
      return
    }

    const styleToLoad = availableStyles.find(s => s.id === activeStyleId)

    if (!styleToLoad || !styleToLoad.url) {
      const error = new Error(
        `Style configuration or URL not found for style ID: ${activeStyleId}`
      )
      if (onStyleError) onStyleError(error, activeStyleId)
      setIsStyleActuallyLoaded(true) // Not stuck in loading if config is bad
      lastAppliedStyleUrlRef.current = null // Reset last applied style
      return
    }

    // If the style URL is the same as the last one applied and map says it's loaded, do nothing.
    // map.getStyle() can be heavy. Check map.isStyleLoaded() for general readiness.
    // Direct URL/style check is more robust than relying on map.getStyle().name
    const currentMapStyle = map.getStyle()

    // Compare current style with what we want to load
    const isSameStyle = (
      current: string | StyleSpecification | null,
      target: string | StyleSpecification
    ): boolean => {
      if (current === null) return false
      if (typeof current === "string" && typeof target === "string") {
        return current === target
      }
      if (typeof current === "object" && typeof target === "object") {
        return JSON.stringify(current) === JSON.stringify(target)
      }
      return false
    }

    if (
      isSameStyle(lastAppliedStyleUrlRef.current, styleToLoad.url) &&
      currentMapStyle && // Ensure there is a current style object
      map.isStyleLoaded() // And map says it's loaded
    ) {
      // If style is already what we want and loaded, ensure state reflects this and call onStyleChange
      if (!isStyleActuallyLoaded) setIsStyleActuallyLoaded(true)
      if (onStyleChange) onStyleChange(activeStyleId) // Notify change if prop provided
      return
    }

    setIsStyleActuallyLoaded(false) // Mark as loading

    const onStyleDataHandler = () => {
      if (map.isStyleLoaded()) {
        setIsStyleActuallyLoaded(true)
        lastAppliedStyleUrlRef.current = styleToLoad.url // Successfully loaded this URL

        // Ensure map resizes to fill container after style change
        setTimeout(() => {
          if (map && map.getContainer()) {
            map.resize()
          }
        }, 100)

        if (onStyleChange) {
          onStyleChange(activeStyleId)
        }
        map.off("styledata", onStyleDataHandler)
      }
    }

    // Store current viewport before changing style
    const currentCenter = map.getCenter()
    const currentZoom = map.getZoom()
    const currentBearing = map.getBearing()
    const currentPitch = map.getPitch()

    map.on("styledata", onStyleDataHandler)

    try {
      // Check if the style URL is valid before attempting to set it
      if (!styleToLoad.url) {
        throw new Error(`Style URL is missing for style ID: ${activeStyleId}`)
      }

      map.setStyle(styleToLoad.url, {
        diff: false // Disable diff to ensure clean style change
      })

      // Restore viewport after style change
      map.once("styledata", () => {
        if (map.isStyleLoaded()) {
          map.setCenter(currentCenter)
          map.setZoom(currentZoom)
          map.setBearing(currentBearing)
          map.setPitch(currentPitch)
        }
      })

      // Note: lastAppliedStyleUrlRef is set inside onStyleDataHandler upon successful load.
      // If setStyle throws synchronously, onStyleDataHandler might not be called.
    } catch (error) {
      // Use our centralized error logging
      logMapError(
        error instanceof Error ? error : new Error(String(error)),
        `Setting Style: ${activeStyleId}`
      )

      // Try to get a fallback style
      const fallbackStyle = getFallbackStyle(activeStyleId)

      // Call the error handler if provided
      if (onStyleError) {
        onStyleError(
          error instanceof Error ? error : new Error(String(error)),
          activeStyleId
        )
      }

      // If we have a fallback style and it's different from what we just tried
      if (
        fallbackStyle &&
        fallbackStyle.url &&
        fallbackStyle.url !== styleToLoad.url
      ) {
        try {
          // Try to apply the fallback style
          map.setStyle(fallbackStyle.url)
          // We'll let the onStyleDataHandler handle the rest if this succeeds
        } catch (fallbackError) {
          // If even the fallback fails, log it
          logMapError(
            fallbackError instanceof Error
              ? fallbackError
              : new Error(String(fallbackError)),
            "Fallback Style Application"
          )
        }
      }

      setIsStyleActuallyLoaded(true) // Not stuck in loading
      lastAppliedStyleUrlRef.current = null // Failed to set this style
      map.off("styledata", onStyleDataHandler) // Clean up listener on error
    }

    return () => {
      // Cleanup: remove the specific listener if the effect re-runs or component unmounts
      map.off("styledata", onStyleDataHandler)
    }
  }, [map, activeStyleId, availableStyles, onStyleChange, onStyleError]) // Removed isStyleActuallyLoaded to prevent infinite loops

  const handleStyleChange = useCallback(
    (newStyleId: string) => {
      if (newStyleId !== activeStyleId) {
        setActiveStyleId(newStyleId)
        // The effect above will handle applying the style and calling onStyleChange.
      }
    },
    [activeStyleId] // Dependency on activeStyleId to avoid stale closure if used in a condition
  )

  return {
    activeStyleId,
    isStyleLoaded: isStyleActuallyLoaded, // Expose the internal "actually loaded" state
    // isPendingStyleChange can be derived: !isStyleActuallyLoaded && (map might be trying to load activeStyleId)
    // For simplicity, let's say if it's not loaded, it's "pending" if a map exists and an activeStyleId is set.
    isPendingStyleChange: !!map && !!activeStyleId && !isStyleActuallyLoaded,
    handleStyleChange
  }
}
