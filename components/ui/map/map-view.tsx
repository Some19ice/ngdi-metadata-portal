"use client"

import "maplibre-gl/dist/maplibre-gl.css"
import maplibregl, { Map } from "maplibre-gl"
import React, { useRef, useState, useEffect, useMemo, useCallback } from "react"
import {
  useMapInstance,
  useMapStyles,
  useMapControls,
  useMapViewport
} from "@/hooks"
import { toast } from "sonner"
import {
  DEFAULT_FREE_STYLE,
  getAvailableMapStyles,
  logMapError,
  getFallbackStyle,
  styleRequiresApiKey
} from "@/lib/map-config"
import { preloadMapStyles } from "@/lib/map-loader"
import MapControls from "./map-controls"

// Define a type for our map styles
export interface MapStyle {
  id: string
  name: string
  url: string // URL to the MapLibre style JSON
}

// Define available base map styles with proper fallbacks
const defaultAvailableBaseStyles: MapStyle[] = getAvailableMapStyles()

// Define default controls configuration outside component to prevent re-creation
const DEFAULT_MAP_CONTROLS = {
  navigation: true,
  scale: true,
  fullscreen: true,
  geolocate: true
} as const

interface MapViewProps {
  initialOptions?: Omit<maplibregl.MapOptions, "container">
  className?: string
  initialStyleId?: string // ID of the initial style to load
  availableBaseStyles?: MapStyle[]
  onMapLoad?: (map: Map) => void
  onStyleChange?: (styleId: string) => void
  onError?: (error: Error) => void
  showControls?: boolean
  controlsPosition?: "side" | "overlay"
  onStyleChangeHandler?: (styleChangeHandler: (styleId: string) => void) => void
}

const defaultInitialOptions: Omit<maplibregl.MapOptions, "container"> = {
  center: [0, 0], // Default center (longitude, latitude)
  zoom: 1, // Default zoom level
  bearing: 0,
  pitch: 0
}

export default function MapView({
  initialOptions = {},
  className = "h-[700px] w-full",
  initialStyleId = defaultAvailableBaseStyles[0].id, // Default to the first style
  availableBaseStyles = defaultAvailableBaseStyles,
  onMapLoad,
  onStyleChange,
  onError,
  showControls = true,
  controlsPosition = "side",
  onStyleChangeHandler
}: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const [isContainerReady, setIsContainerReady] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  // Set container ready when ref is attached
  useEffect(() => {
    if (mapContainerRef.current) {
      setIsContainerReady(true)
    }
  }, [])

  // Validate map styles and handle missing API keys
  const validatedStyles = useMemo(() => {
    return availableBaseStyles.map(style => {
      if (!style.url) {
        // Log warning for missing URLs and provide fallback
        if (styleRequiresApiKey(style.id)) {
          logMapError(
            new Error(`Map style '${style.id}' has no URL`),
            "Style Validation"
          )
          // Return the style with the fallback URL
          return getFallbackStyle(style.id)
        }
      }
      return style
    })
  }, [availableBaseStyles])

  // Find the active style URL based on initialStyleId with fallback
  const activeStyleUrl = useMemo(() => {
    const activeStyle = validatedStyles.find(s => s.id === initialStyleId)

    // If the active style is missing or has no URL, use the fallback style
    if (!activeStyle?.url) {
      const fallbackStyle = getFallbackStyle(initialStyleId)
      toast.warning(
        `Map style '${initialStyleId}' is unavailable. Using '${fallbackStyle.name}' instead.`
      )
      return fallbackStyle.url
    }

    return activeStyle.url
  }, [validatedStyles, initialStyleId])

  // Prepare initial options - memoize to prevent constant re-creation
  const mergedInitialOptions = useMemo(() => {
    return {
      ...defaultInitialOptions,
      ...initialOptions,
      style: activeStyleUrl
    }
  }, [initialOptions, activeStyleUrl])

  const handleMapLoad = useCallback(
    (mapInstance: Map) => {
      setIsInitialized(true)

      // Preload other available styles for faster switching
      preloadMapStyles(
        validatedStyles.filter(style => style.url !== activeStyleUrl)
      )

      if (onMapLoad) onMapLoad(mapInstance)
    },
    [onMapLoad, validatedStyles, activeStyleUrl]
  )

  const handleMapError = useCallback(
    (err: Error) => {
      // Use our centralized error logging
      logMapError(err, "Map Initialization")

      // Show user-friendly error message
      toast.error("Failed to initialize map. Using fallback configuration.")

      // Call the parent's error handler if provided
      if (onError) onError(err)
    },
    [onError]
  )

  // Initialize map instance - only when container is ready
  const { map, isLoaded, error } = useMapInstance({
    container:
      isContainerReady && mapContainerRef.current
        ? mapContainerRef.current
        : null!,
    initialOptions: mergedInitialOptions,
    onLoad: handleMapLoad,
    onError: handleMapError
  })

  const handleStyleError = useCallback(
    (err: Error, styleId: string) => {
      // Use our centralized error logging
      logMapError(err, `Style Loading: ${styleId}`)

      // Get a fallback style
      const fallbackStyle = getFallbackStyle(styleId)

      // Show user-friendly error with fallback information
      toast.error(
        `Failed to load map style: ${styleId}. Falling back to ${fallbackStyle.name}.`,
        { duration: 5000 }
      )

      // Call the parent's error handler if provided
      if (onError) onError(err)

      // Attempt to switch to the fallback style if we have a map instance
      if (map && fallbackStyle) {
        try {
          map.setStyle(fallbackStyle.url)
        } catch (fallbackErr) {
          // If even the fallback fails, log it but don't show another toast
          logMapError(
            fallbackErr instanceof Error
              ? fallbackErr
              : new Error(String(fallbackErr)),
            "Fallback Style Loading"
          )
        }
      }
    },
    [onError, map]
  )

  // Set up map styles
  const { activeStyleId, handleStyleChange } = useMapStyles({
    map,
    availableStyles: validatedStyles,
    initialStyleId,
    onStyleChange,
    onStyleError: handleStyleError
  })

  // Expose the style change handler to parent components if needed
  useEffect(() => {
    if (onStyleChangeHandler) {
      onStyleChangeHandler(handleStyleChange)
    }
  }, [handleStyleChange, onStyleChangeHandler])

  // Set up map controls with default configuration
  // Note: The hook doesn't support custom positions for default controls directly
  // The positions are hardcoded in the hook implementation
  useMapControls({
    map,
    defaultControls: DEFAULT_MAP_CONTROLS
  })

  // Set up map viewport
  useMapViewport({
    map,
    initialViewport: {
      center: mergedInitialOptions.center as maplibregl.LngLatLike,
      zoom: mergedInitialOptions.zoom as number,
      bearing: mergedInitialOptions.bearing,
      pitch: mergedInitialOptions.pitch
    }
  })

  // Expose the map instance and style change handler to parent components
  useEffect(() => {
    if (map && isInitialized && onStyleChange) {
      // Make the style change handler available to parent components
      onStyleChange(activeStyleId)
    }
  }, [map, isInitialized, activeStyleId, onStyleChange])

  // Ensure map resizes to fill container when loaded
  useEffect(() => {
    if (map && isLoaded) {
      // Small delay to ensure container dimensions are available
      const resizeTimer = setTimeout(() => {
        map.resize()
      }, 100)

      return () => clearTimeout(resizeTimer)
    }
  }, [map, isLoaded])

  // Check if the API key is missing and we're trying to use a style that requires it
  const isApiKeyMissing = useMemo(() => {
    // If we have an active style URL, the API key is either not needed or is present
    if (activeStyleUrl && activeStyleUrl !== DEFAULT_FREE_STYLE.url) {
      return false
    }

    // If the initial style requires an API key but we're using the fallback,
    // it suggests the API key is missing
    return styleRequiresApiKey(initialStyleId)
  }, [activeStyleUrl, initialStyleId])

  return (
    <div className={`relative ${className}`}>
      <div ref={mapContainerRef} className="h-full w-full" />

      {showControls && controlsPosition === "overlay" && (
        <MapControls
          map={map}
          isLoaded={isLoaded}
          validatedStyles={validatedStyles}
          activeStyleId={activeStyleId}
          handleStyleChange={handleStyleChange}
          className="absolute top-4 right-4 z-20"
        />
      )}

      {showControls && controlsPosition === "side" && (
        <MapControls
          map={map}
          isLoaded={isLoaded}
          validatedStyles={validatedStyles}
          activeStyleId={activeStyleId}
          handleStyleChange={handleStyleChange}
          className="absolute top-4 left-4 z-20"
        />
      )}

      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-200/50 z-10">
          <div className="text-center">
            <p className="mb-2">Loading Map...</p>
            {isApiKeyMissing && (
              <p className="text-xs text-amber-600">
                Note: Some map styles may be unavailable due to missing API key.
              </p>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-200/80 p-4 text-center z-10">
          <p className="text-red-600 font-semibold mb-2">Failed to load map</p>
          <p className="text-sm text-gray-700">{error.message}</p>
          <div className="text-xs text-gray-500 mt-4 space-y-1">
            <p>Please check your internet connection and try again.</p>
            {isApiKeyMissing && (
              <div className="p-2 bg-amber-50 border border-amber-200 rounded-md mt-2">
                <p className="text-amber-700 font-medium">
                  MapTiler API Key Missing
                </p>
                <p className="text-xs text-amber-600 mt-1">
                  Some map styles require a MapTiler API key. Check the
                  documentation for setup instructions.
                </p>
              </div>
            )}
            <p className="mt-2">Using fallback map configuration.</p>
          </div>
        </div>
      )}
    </div>
  )
}
