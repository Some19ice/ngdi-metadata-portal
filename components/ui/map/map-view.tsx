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
  initialStyleId = "satellite", // Default to satellite style
  availableBaseStyles = defaultAvailableBaseStyles,
  onMapLoad,
  onStyleChange,
  onError,
  showControls = true,
  controlsPosition = "side",
  onStyleChangeHandler
}: MapViewProps) {
  const [map, setMap] = useState<Map | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [activeStyleId, setActiveStyleId] = useState<string>("")
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const [isContainerReady, setIsContainerReady] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [mapLibreError, setMapLibreError] = useState<string | null>(null)

  // Set container ready when ref is attached and check MapLibre
  useEffect(() => {
    // Check if MapLibre GL JS is available
    try {
      if (!maplibregl || !maplibregl.Map) {
        setMapLibreError("MapLibre GL JS is not properly loaded")
        return
      }

      if (mapContainerRef.current) {
        setIsContainerReady(true)
        setMapLibreError(null)
      }
    } catch (error) {
      setMapLibreError(`MapLibre GL JS error: ${error}`)
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
  const {
    map: mapInstance,
    isLoaded: mapLoaded,
    error
  } = useMapInstance({
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
      if (mapInstance && fallbackStyle) {
        try {
          mapInstance.setStyle(fallbackStyle.url)
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
    [onError, mapInstance]
  )

  // Handle style changes with smooth transition
  const handleStyleChange = useCallback(
    (styleId: string) => {
      if (!mapInstance || !mapLoaded) return

      const style = validatedStyles.find(s => s.id === styleId)
      if (!style?.url) {
        console.warn(`Style not found: ${styleId}`)
        return
      }

      // Add fade transition before changing style
      const mapContainer = mapInstance.getContainer()
      mapContainer.style.transition = "opacity 0.3s ease-in-out"
      mapContainer.style.opacity = "0.7"

      // Store current view state
      const center = mapInstance.getCenter()
      const zoom = mapInstance.getZoom()
      const bearing = mapInstance.getBearing()
      const pitch = mapInstance.getPitch()

      // Change style
      mapInstance.once("style.load", () => {
        // Restore view state
        mapInstance.jumpTo({
          center,
          zoom,
          bearing,
          pitch
        })

        // Fade back in
        setTimeout(() => {
          mapContainer.style.opacity = "1"
          setTimeout(() => {
            mapContainer.style.transition = ""
          }, 300)
        }, 100)

        setActiveStyleId(styleId)
        onStyleChange?.(styleId)
      })

      try {
        mapInstance.setStyle(style.url)
      } catch (error) {
        console.error("Error changing map style:", error)
        logMapError(error, "handleStyleChange")
        // Reset opacity on error
        mapContainer.style.opacity = "1"
        mapContainer.style.transition = ""
      }
    },
    [mapInstance, mapLoaded, validatedStyles, onStyleChange]
  )

  // Update map state when instance is ready
  useEffect(() => {
    if (mapInstance) {
      setMap(mapInstance)
    }
  }, [mapInstance])

  // Update loaded state
  useEffect(() => {
    if (mapLoaded) {
      setIsLoaded(true)
    }
  }, [mapLoaded])

  // Notify parent when map is loaded
  useEffect(() => {
    if (map && mapLoaded && !isInitialized) {
      setIsInitialized(true)
      onMapLoad?.(map)
    }
  }, [map, mapLoaded, isInitialized, onMapLoad])

  // Expose the style change handler to parent components
  useEffect(() => {
    if (onStyleChangeHandler) {
      onStyleChangeHandler(handleStyleChange)
    }
  }, [onStyleChangeHandler, handleStyleChange])

  // Set up map controls with default configuration
  // Note: The hook doesn't support custom positions for default controls directly
  // The positions are hardcoded in the hook implementation
  useMapControls({
    map: mapInstance,
    defaultControls: DEFAULT_MAP_CONTROLS
  })

  // Set up map viewport
  useMapViewport({
    map: mapInstance,
    initialViewport: {
      center: mergedInitialOptions.center as maplibregl.LngLatLike,
      zoom: mergedInitialOptions.zoom as number,
      bearing: mergedInitialOptions.bearing,
      pitch: mergedInitialOptions.pitch
    }
  })

  // Expose the map instance and style change handler to parent components
  useEffect(() => {
    if (mapInstance && isInitialized && onStyleChange) {
      // Make the style change handler available to parent components
      onStyleChange(activeStyleId)
    }
  }, [mapInstance, isInitialized, activeStyleId, onStyleChange])

  // Ensure map resizes to fill container when loaded
  useEffect(() => {
    if (mapInstance && mapLoaded) {
      // Small delay to ensure container dimensions are available
      const resizeTimer = setTimeout(() => {
        mapInstance.resize()
      }, 100)

      return () => clearTimeout(resizeTimer)
    }
  }, [mapInstance, mapLoaded])

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

      {mapLibreError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-50 border border-red-200 p-4 text-center z-20">
          <div className="max-w-md space-y-3">
            <div className="text-red-600 font-semibold">
              MapLibre GL JS Error
            </div>
            <div className="text-sm text-red-700">{mapLibreError}</div>
            <div className="text-xs text-gray-600">
              This indicates an issue with the MapLibre GL JS library loading.
              Please check the browser console for more details.
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      )}

      {showControls && controlsPosition === "overlay" && (
        <MapControls
          map={mapInstance}
          isLoaded={mapLoaded}
          validatedStyles={validatedStyles}
          activeStyleId={activeStyleId}
          handleStyleChange={handleStyleChange}
          className="absolute top-4 right-4 z-20"
        />
      )}

      {showControls && controlsPosition === "side" && (
        <MapControls
          map={mapInstance}
          isLoaded={mapLoaded}
          validatedStyles={validatedStyles}
          activeStyleId={activeStyleId}
          handleStyleChange={handleStyleChange}
          className="absolute top-4 left-4 z-20"
        />
      )}

      {!mapLoaded && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-200/50 z-10">
          <div className="text-center space-y-2">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-sm font-medium">Loading Map...</p>
            {isApiKeyMissing && (
              <p className="text-xs text-amber-600 max-w-sm">
                Note: Some map styles may be unavailable due to missing MapTiler
                API key.
              </p>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-200/80 p-4 text-center z-10">
          <div className="max-w-md space-y-3">
            <div className="text-red-600 font-semibold">Failed to load map</div>
            <div className="text-sm text-gray-700">{error.message}</div>

            {isApiKeyMissing && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                <p className="text-amber-700 font-medium text-sm">
                  MapTiler API Key Missing
                </p>
                <p className="text-xs text-amber-600 mt-1">
                  Some map styles require a MapTiler API key. Please set the
                  NEXT_PUBLIC_MAPTILER_API_KEY environment variable.
                </p>
                <p className="text-xs text-amber-600 mt-2">
                  Get your free API key at:{" "}
                  <a
                    href="https://cloud.maptiler.com/account/keys/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    MapTiler Cloud
                  </a>
                </p>
              </div>
            )}

            <div className="text-xs text-gray-500 space-y-1">
              <p>
                Please check your internet connection and try refreshing the
                page.
              </p>
              <p>Using fallback map configuration.</p>
            </div>

            <button
              onClick={() => window.location.reload()}
              className="px-3 py-1 bg-primary text-primary-foreground text-sm rounded hover:bg-primary/90 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
