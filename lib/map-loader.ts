/**
 * Dynamic map library loader
 * Conditionally loads MapLibre GL JS only when needed
 */

// Cache for loaded libraries to prevent re-loading
const libraryCache = new Map<string, any>()

export type MapLibraryType = "maplibre"

export interface MapLibraryLoader {
  load(): Promise<any>
  isLoaded(): boolean
  getLoadedLibrary(): any | null
}

/**
 * Conditionally load MapLibre GL JS only when needed
 */
export async function loadMapLibre() {
  const cacheKey = "maplibre"

  // Return cached version if available
  if (libraryCache.has(cacheKey)) {
    return libraryCache.get(cacheKey)
  }

  // Check if already loaded globally (e.g., via CDN)
  if (typeof window !== "undefined" && (window as any).maplibregl) {
    const maplibregl = (window as any).maplibregl
    libraryCache.set(cacheKey, maplibregl)
    return maplibregl
  }

  // Dynamic import with error handling
  try {
    const loadingPromise = import("maplibre-gl").then(module => {
      const maplibregl = module.default
      libraryCache.set(cacheKey, maplibregl)

      return maplibregl
    })

    return await loadingPromise
  } catch (error) {
    console.error("Failed to load MapLibre GL JS:", error)
    throw new Error("MapLibre GL JS could not be loaded")
  }
}

/**
 * Preload map styles for better performance
 */
export async function preloadMapStyles(styles: Array<{ url: string }>) {
  if (typeof window === "undefined") return

  // Preload style JSON files
  const preloadPromises = styles.map(async style => {
    try {
      const response = await fetch(style.url)
      if (response.ok) {
        const styleJson = await response.json()
        // Store in cache or process as needed
        return styleJson
      }
    } catch (error) {
      console.warn(`Failed to preload style: ${style.url}`, error)
    }
    return null
  })

  await Promise.allSettled(preloadPromises)
}

/**
 * Create map library loader instance
 */
export function createMapLibraryLoader(): MapLibraryLoader {
  const cacheKey = "maplibre"

  return {
    async load() {
      return await loadMapLibre()
    },

    isLoaded() {
      return libraryCache.has(cacheKey)
    },

    getLoadedLibrary() {
      return libraryCache.get(cacheKey) || null
    }
  }
}

/**
 * Get the optimal map library for the given requirements
 * @param requirements Map requirements
 * @returns The optimal map library type
 */
export function getOptimalMapLibrary(requirements: {
  supports3D?: boolean
  needsDrawing?: boolean
  needsVectorTiles?: boolean
  needsAdvancedStyling?: boolean
  maxDataPoints?: number
}): MapLibraryType {
  // Always return MapLibre since we've standardized on it
  return "maplibre"
}

/**
 * Load the appropriate map library based on requirements
 */
export async function loadOptimalMapLibrary(requirements: {
  supports3D?: boolean
  needsDrawing?: boolean
  needsVectorTiles?: boolean
  needsAdvancedStyling?: boolean
  maxDataPoints?: number
}): Promise<any> {
  return await loadMapLibre()
}

/**
 * Clean up cached libraries (useful for testing or memory management)
 */
export function clearLibraryCache(): void {
  libraryCache.clear()
}
