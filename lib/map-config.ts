/**
 * Map configuration utilities for handling MapTiler API key and map styles
 */

import { MapStyle } from "@/components/ui/map/map-view"

// Default free style that doesn't require an API key
export const DEFAULT_FREE_STYLE: MapStyle = {
  id: "streets",
  name: "Streets",
  url: "https://demotiles.maplibre.org/style.json"
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

// Fallback style definitions with unique URLs for each style
export const FALLBACK_STYLES: MapStyle[] = [
  {
    id: "fallback-satellite",
    name: "Satellite",
    url: "https://demotiles.maplibre.org/style.json" // Base fallback
  },
  {
    id: "fallback-streets",
    name: "Streets",
    url: "https://api.maptiler.com/maps/openstreetmap/style.json?key=get_your_own_OpIi9ZULNHzrESv6T2vL" // Different fallback
  },
  {
    id: "fallback-terrain",
    name: "Terrain",
    url: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json" // Alternative free style
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

  // Always include the default free style first
  styles.push(DEFAULT_FREE_STYLE)

  // Add MapTiler styles with API key if valid, or use fallback styles if not
  if (isValid && apiKey) {
    const maptilerStyles = MAPTILER_STYLES.map(style => ({
      ...style,
      url: style.url.replace("${apiKey}", apiKey)
    }))
    styles.push(...maptilerStyles)
  } else {
    // If API key is invalid, use distinct fallback styles for each type
    styles.push(...FALLBACK_STYLES)
  }

  // Add any custom styles (though typically base styles are managed here)
  styles.push(...customStyles)

  // Ensure there's always at least one style, even if customStyles is empty and API key is invalid
  if (styles.length === 0) {
    styles.push({
      id: "ultra-fallback",
      name: "Basic Map",
      url: "https://demotiles.maplibre.org/style.json" // Absolute fallback
    })
  }

  return styles
}

/**
 * Logs map-related errors with consistent formatting
 * @param error The error object
 * @param context Additional context about where the error occurred
 */
export function logMapError(error: Error, context: string): void {
  console.error(`[Map Error] ${context}:`, error)

  // Check if it might be an API key issue
  const { isValid } = validateMapTilerApiKey()
  if (!isValid && error.message.includes("style")) {
    console.warn(
      "[Map Error] This may be related to a missing or invalid MapTiler API key."
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
      name: "Basic Map",
      url: "https://demotiles.maplibre.org/style.json"
    }
  )
}
