/**
 * Map Library Loader - Optimized loading for map libraries
 * Provides conditional loading, caching, and performance optimizations
 */

import { MapStyle } from "@/components/ui/map/map-view"

// Map library types
export type MapLibraryType = "maplibre" | "leaflet"

// Cache for loaded libraries
const libraryCache = new Map<MapLibraryType, any>()
const styleCache = new Map<string, any>()

// Loading states
const loadingStates = new Map<string, Promise<any>>()

/**
 * Conditionally load MapLibre GL JS only when needed
 */
export async function loadMapLibre() {
  const cacheKey = "maplibre"

  // Return cached version if available
  if (libraryCache.has(cacheKey)) {
    return libraryCache.get(cacheKey)
  }

  // Return existing promise if already loading
  if (loadingStates.has(cacheKey)) {
    return loadingStates.get(cacheKey)
  }

  // Create loading promise
  const loadingPromise = import("maplibre-gl").then(module => {
    const maplibregl = module.default
    libraryCache.set(cacheKey, maplibregl)
    loadingStates.delete(cacheKey)
    return maplibregl
  })

  loadingStates.set(cacheKey, loadingPromise)
  return loadingPromise
}

/**
 * Conditionally load Leaflet only when needed
 */
export async function loadLeaflet() {
  const cacheKey = "leaflet"

  // Return cached version if available
  if (libraryCache.has(cacheKey)) {
    return libraryCache.get(cacheKey)
  }

  // Return existing promise if already loading
  if (loadingStates.has(cacheKey)) {
    return loadingStates.get(cacheKey)
  }

  // Create loading promise
  const loadingPromise = Promise.all([
    import("leaflet"),
    import("react-leaflet")
  ]).then(([leafletModule, reactLeafletModule]) => {
    const L = leafletModule.default
    const reactLeaflet = reactLeafletModule

    // Fix for default marker icon issue with webpack
    // @ts-ignore
    delete L.Icon.Default.prototype._getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl:
        "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png"
    })

    const result = { L, ...reactLeaflet }
    libraryCache.set(cacheKey, result)
    loadingStates.delete(cacheKey)
    return result
  })

  loadingStates.set(cacheKey, loadingPromise)
  return loadingPromise
}

/**
 * Preload map styles for better performance
 */
export async function preloadMapStyle(styleUrl: string): Promise<any> {
  if (styleCache.has(styleUrl)) {
    return styleCache.get(styleUrl)
  }

  if (loadingStates.has(styleUrl)) {
    return loadingStates.get(styleUrl)
  }

  const loadingPromise = fetch(styleUrl)
    .then(response => response.json())
    .then(style => {
      styleCache.set(styleUrl, style)
      loadingStates.delete(styleUrl)
      return style
    })
    .catch(error => {
      loadingStates.delete(styleUrl)
      console.warn(`Failed to preload style ${styleUrl}:`, error)
      return null
    })

  loadingStates.set(styleUrl, loadingPromise)
  return loadingPromise
}

/**
 * Preload multiple map styles
 */
export async function preloadMapStyles(styles: MapStyle[]): Promise<void> {
  const preloadPromises = styles
    .filter(style => style.url && !styleCache.has(style.url))
    .map(style => preloadMapStyle(style.url))

  await Promise.allSettled(preloadPromises)
}

/**
 * Clear caches (useful for memory management)
 */
export function clearMapCaches(): void {
  libraryCache.clear()
  styleCache.clear()
  // Don't clear loading states as they represent active operations
}

/**
 * Get cache statistics for debugging
 */
export function getMapCacheStats() {
  return {
    librariesCached: libraryCache.size,
    stylesCached: styleCache.size,
    activeLoading: loadingStates.size,
    cacheKeys: {
      libraries: Array.from(libraryCache.keys()),
      styles: Array.from(styleCache.keys()),
      loading: Array.from(loadingStates.keys())
    }
  }
}

/**
 * Determine which map library to use based on requirements
 */
export function getOptimalMapLibrary(requirements: {
  needs3D?: boolean
  needsDrawing?: boolean
  needsAdvancedStyling?: boolean
  datasetSize?: "small" | "medium" | "large"
}): MapLibraryType {
  const { needs3D, needsDrawing, needsAdvancedStyling, datasetSize } =
    requirements

  // Use MapLibre for 3D, advanced styling, or large datasets
  if (needs3D || needsAdvancedStyling || datasetSize === "large") {
    return "maplibre"
  }

  // Use Leaflet for simple 2D maps, especially with drawing
  if (needsDrawing || datasetSize === "small") {
    return "leaflet"
  }

  // Default to MapLibre for better performance
  return "maplibre"
}

/**
 * Progressive loading hook for map components
 */
export function useMapLibraryLoader(libraryType: MapLibraryType) {
  const [library, setLibrary] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<Error | null>(null)

  React.useEffect(() => {
    const loadLibrary = async () => {
      try {
        setLoading(true)
        setError(null)

        const lib =
          libraryType === "maplibre"
            ? await loadMapLibre()
            : await loadLeaflet()

        setLibrary(lib)
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to load map library")
        )
      } finally {
        setLoading(false)
      }
    }

    loadLibrary()
  }, [libraryType])

  return { library, loading, error }
}

// Import React for the hook
import React from "react"
