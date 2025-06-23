"use server"

import { ActionState, GeocodingResponse, GeocodingFeature } from "@/types"
import { getBaseUrl } from "@/lib/utils"

interface GeocodeParams {
  searchText: string
  autocomplete?: boolean
  limit?: number
  country?: string // Optional: limit search to specific countries (e.g., "US,CA")
  bbox?: [number, number, number, number] // Optional: limit search to a bounding box [minLng, minLat, maxLng, maxLat]
  proximity?: [number, number] // Optional: bias results towards a location [lng, lat]
}

export async function geocodeLocationAction(
  params: GeocodeParams
): Promise<ActionState<GeocodingFeature[]>> {
  const { searchText, autocomplete = true, limit = 5, ...otherParams } = params

  if (!searchText || searchText.trim().length < 2) {
    // Don't search for very short strings to avoid excessive API calls
    return {
      isSuccess: true,
      message: "Search term too short.",
      data: []
    }
  }

  try {
    // Build query parameters for our proxy
    const queryParams = new URLSearchParams({
      q: searchText,
      autocomplete: String(autocomplete),
      limit: String(limit)
    })

    Object.entries(otherParams).forEach(([key, value]) => {
      if (value !== undefined) {
        if (Array.isArray(value)) {
          queryParams.append(key, value.join(","))
        } else {
          queryParams.append(key, String(value))
        }
      }
    })

    // Use the helper to get the base URL
    const baseUrl = getBaseUrl()
    const url = `${baseUrl}/api/map/geocode?${queryParams.toString()}`

    console.log("Geocoding action:", {
      searchText: searchText.substring(0, 50),
      baseUrl,
      fullUrl: url,
      timestamp: new Date().toISOString()
    })

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      },
      // Don't cache server-side requests
      cache: "no-store"
    })

    console.log("Geocoding response status:", {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      url: response.url
    })

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: "Unknown error" }))
      console.error("Geocoding API Error:", {
        status: response.status,
        statusText: response.statusText,
        errorData,
        url: response.url
      })

      // If we get a response with fallback data, still return success
      if (errorData.features && Array.isArray(errorData.features)) {
        return {
          isSuccess: true,
          message:
            errorData.warning ||
            errorData.error ||
            "Using fallback geocoding data",
          data: errorData.features
        }
      }

      throw new Error(
        errorData.error ||
          `Failed to fetch geocoding data: ${response.status} ${response.statusText}`
      )
    }

    const data: GeocodingResponse = await response.json()

    console.log("Geocoding success:", {
      featuresCount: data.features?.length || 0,
      hasFeatures: !!data.features,
      query: data.query,
      attribution: data.attribution
    })

    return {
      isSuccess: true,
      message: data.features?.length
        ? `Found ${data.features.length} location${data.features.length > 1 ? "s" : ""}`
        : "No locations found",
      data: data.features || []
    }
  } catch (error) {
    console.error("Error in geocodeLocationAction:", {
      error: error instanceof Error ? error.message : String(error),
      searchText: searchText.substring(0, 50),
      timestamp: new Date().toISOString(),
      stack: error instanceof Error ? error.stack : undefined
    })

    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred"

    return {
      isSuccess: false,
      message: `Geocoding failed: ${errorMessage}`
    }
  }
}
