/**
 * Map configuration utilities for handling MapTiler API key and map styles
 */

import { MapStyle } from "@/components/ui/map/map-view"

// Satellite style object that can be used directly with MapLibre
export const SATELLITE_STYLE_OBJECT = {
  version: 8 as const,
  sources: {
    "esri-satellite": {
      type: "raster" as const,
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
      ],
      tileSize: 256,
      attribution:
        "© Esri, Maxar, Earthstar Geographics, and the GIS User Community"
    }
  },
  layers: [
    {
      id: "satellite-tiles",
      type: "raster" as const,
      source: "esri-satellite",
      minzoom: 0,
      maxzoom: 18
    }
  ]
}

// Streets style object using OpenStreetMap tiles
export const STREETS_STYLE_OBJECT = {
  version: 8 as const,
  sources: {
    "osm-raster": {
      type: "raster" as const,
      tiles: [
        "https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      ],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors"
    }
  },
  layers: [
    {
      id: "osm-tiles",
      type: "raster" as const,
      source: "osm-raster",
      minzoom: 0,
      maxzoom: 19
    }
  ]
}

// Terrain style object using OpenTopoMap
export const TERRAIN_STYLE_OBJECT = {
  version: 8 as const,
  sources: {
    "topo-raster": {
      type: "raster" as const,
      tiles: [
        "https://tile.opentopomap.org/{z}/{x}/{y}.png"
      ],
      tileSize: 256,
      attribution: "© OpenTopoMap (CC-BY-SA)"
    }
  },
  layers: [
    {
      id: "topo-tiles",
      type: "raster" as const,
      source: "topo-raster",
      minzoom: 0,
      maxzoom: 17
    }
  ]
}

// Default free satellite style using Esri World Imagery
export const DEFAULT_FREE_STYLE: MapStyle = {
  id: "satellite",
  name: "Satellite",
  url: SATELLITE_STYLE_OBJECT as any // Use actual satellite imagery
}

// MapTiler style definitions that require an API key
export const MAPTILER_STYLES: MapStyle[] = [
  {
    id: "satellite",
    name: "Satellite",
    url: "https://api.maptiler.com/maps/hybrid/style.json?key=${apiKey}"
  },
  {
    id: "streets-v2",
    name: "Streets",
    url: "https://api.maptiler.com/maps/streets-v2/style.json?key=${apiKey}"
  },
  {
    id: "terrain",
    name: "Terrain",
    url: "https://api.maptiler.com/maps/topo-v2/style.json?key=${apiKey}"
  }
]

// Fallback style definitions using free map services
export const FALLBACK_STYLES: MapStyle[] = [
  {
    id: "fallback-satellite",
    name: "Satellite",
    url: SATELLITE_STYLE_OBJECT as any
  },
  {
    id: "fallback-streets",
    name: "Streets",
    url: STREETS_STYLE_OBJECT as any
  },
  {
    id: "fallback-terrain",
    name: "Terrain",
    url: TERRAIN_STYLE_OBJECT as any
  }
]

/**
 * Validates the MapTiler API key
 * @returns Object containing validation result and message
 */
export function validateMapTilerApiKey(): {
  isValid: boolean
  message: string
  apiKey: string | null
} {
  const apiKey = process.env.NEXT_PUBLIC_MAPTILER_API_KEY

  if (!apiKey) {
    return {
      isValid: false,
      message:
        "MapTiler API key is missing. Some map styles will not be available.",
      apiKey: null
    }
  }

  // Basic validation - check if it's a non-empty string
  // Note: We can't fully validate the key without making an API call
  if (typeof apiKey !== "string" || apiKey.trim() === "") {
    return {
      isValid: false,
      message:
        "MapTiler API key is invalid. Some map styles will not be available.",
      apiKey: null
    }
  }

  return {
    isValid: true,
    message: "MapTiler API key is valid.",
    apiKey
  }
}

/**
 * Gets available map styles with proper API key handling
 * @param customStyles Additional custom styles to include
 * @returns Array of available map styles with proper URLs
 */
export function getAvailableMapStyles(
  customStyles: MapStyle[] = []
): MapStyle[] {
  const { isValid, apiKey } = validateMapTilerApiKey()
  const styles: MapStyle[] = []

  // Always include the default free satellite style first
  styles.push(DEFAULT_FREE_STYLE)

  // Add MapTiler styles with API key if valid, or use fallback styles if not
  if (isValid && apiKey) {
    const maptilerStyles = MAPTILER_STYLES.map(style => ({
      ...style,
      url: style.url.replace("${apiKey}", apiKey)
    }))
    // Filter out satellite since we already have it as default, add others
    const otherStyles = maptilerStyles.filter(style => style.id !== "satellite")
    styles.push(...otherStyles)
  } else {
    // If API key is invalid, add free alternatives with different style objects
    styles.push({
      id: "streets",
      name: "Streets",
      url: STREETS_STYLE_OBJECT as any
    })
    styles.push({
      id: "terrain",
      name: "Terrain",
      url: TERRAIN_STYLE_OBJECT as any
    })
  }

  // Add any custom styles (though typically base styles are managed here)
  styles.push(...customStyles)

  // Ensure there's always at least one style, even if customStyles is empty and API key is invalid
  if (styles.length === 0) {
    styles.push({
      id: "ultra-fallback",
      name: "Satellite",
      url: SATELLITE_STYLE_OBJECT as any // Use satellite as absolute fallback
    })
  }

  return styles
}

/**
 * Logs map-related errors with consistent formatting
 * @param error The error object or any value
 * @param context Additional context about where the error occurred
 */
export function logMapError(error: any, context: string): void {
  console.error(`[Map Error] ${context}:`)

  // Log the error with detailed information
  if (error instanceof Error) {
    console.error("Error message:", error.message)
    console.error("Error stack:", error.stack)
    console.error("Full error object:", error)
  } else if (error && typeof error === "object") {
    // For MapLibre errors which might be objects
    console.error("Error object:", JSON.stringify(error, null, 2))
    console.error("Error keys:", Object.keys(error))
    if (error.error) {
      console.error("Nested error:", error.error)
    }
    if (error.message) {
      console.error("Error message:", error.message)
    }
  } else {
    console.error("Error value:", error)
    console.error("Error type:", typeof error)
  }

  // Check if it might be an API key issue
  const { isValid } = validateMapTilerApiKey()
  if (!isValid) {
    console.warn(
      "[Map Error] Note: MapTiler API key is missing/invalid. This might be related."
    )
  }
}

/**
 * Checks if a style requires a MapTiler API key
 * @param styleId The style ID to check
 * @returns True if the style requires an API key
 */
export function styleRequiresApiKey(styleId: string): boolean {
  return MAPTILER_STYLES.some(style => style.id === styleId)
}

/**
 * Gets a fallback style when the requested style is unavailable
 * @param requestedStyleId The style ID that was requested
 * @returns A fallback style that should work
 */
export function getFallbackStyle(requestedStyleId: string): MapStyle {
  // Find matching fallback style by original style ID
  const styleIndex = MAPTILER_STYLES.findIndex(s => s.id === requestedStyleId)

  if (styleIndex >= 0 && styleIndex < FALLBACK_STYLES.length) {
    // Return the corresponding fallback style
    return FALLBACK_STYLES[styleIndex]
  }

  // If no matching style found, use the first fallback
  return (
    FALLBACK_STYLES[0] || {
      id: "ultra-fallback",
      name: "Satellite",
      url: SATELLITE_STYLE_OBJECT as any
    }
  )
}
