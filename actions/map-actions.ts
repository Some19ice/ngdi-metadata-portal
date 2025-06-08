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

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      },
      // Don't cache server-side requests
      cache: "no-store"
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Geocoding API Error:", errorData)
      throw new Error(
        errorData.error ||
          `Failed to fetch geocoding data: ${response.status} ${response.statusText}`
      )
    }

    const data: GeocodingResponse = await response.json()

    return {
      isSuccess: true,
      message: "Geocoding successful",
      data: data.features || []
    }
  } catch (error) {
    console.error("Error in geocodeLocationAction:", error)
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred"
    return {
      isSuccess: false,
      message: `Geocoding failed: ${errorMessage}`
    }
  }
}
