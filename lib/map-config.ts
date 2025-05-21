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
    id: "terrain",
    name: "Terrain",
    url: "https://api.maptiler.com/maps/topo-v2/style.json?key=${apiKey}"
  },
  {
    id: "basic",
    name: "Basic",
    url: "https://api.maptiler.com/maps/basic-v2/style.json?key=${apiKey}"
  },
  {
    id: "streets-v2",
    name: "Streets v2",
    url: "https://api.maptiler.com/maps/streets-v2/style.json?key=${apiKey}"
  },
  {
    id: "outdoor-v2",
    name: "Outdoor",
    url: "https://api.maptiler.com/maps/outdoor-v2/style.json?key=${apiKey}"
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

  // Always include the free style that doesn't require an API key
  const styles: MapStyle[] = [DEFAULT_FREE_STYLE]

  // Add MapTiler styles with API key if valid
  if (isValid && apiKey) {
    const maptilerStyles = MAPTILER_STYLES.map(style => ({
      ...style,
      url: style.url.replace("${apiKey}", apiKey)
    }))
    styles.push(...maptilerStyles)
  }

  // Add any custom styles
  styles.push(...customStyles)

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
  return styleId !== DEFAULT_FREE_STYLE.id
}

/**
 * Gets a fallback style when the requested style is unavailable
 * @param requestedStyleId The style ID that was requested
 * @returns A fallback style that should work
 */
export function getFallbackStyle(requestedStyleId: string): MapStyle {
  // Always fall back to the free style that doesn't require an API key
  return DEFAULT_FREE_STYLE
}
