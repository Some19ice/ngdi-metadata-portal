"use server"

import { ActionState, GeocodingResponse, GeocodingFeature } from "@/types"

const MAPTILER_API_KEY = process.env.NEXT_PUBLIC_MAPTILER_API_KEY
const MAPTILER_GEOCODING_API_URL = "https://api.maptiler.com/geocoding"

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
  if (!MAPTILER_API_KEY) {
    return {
      isSuccess: false,
      message: "MapTiler API key is not configured."
    }
  }

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
    const queryParams = new URLSearchParams({
      key: MAPTILER_API_KEY,
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

    const response = await fetch(
      `${MAPTILER_GEOCODING_API_URL}/${encodeURIComponent(searchText)}.json?${queryParams.toString()}`
    )

    if (!response.ok) {
      const errorData = await response.json()
      console.error("MapTiler Geocoding API Error:", errorData)
      throw new Error(
        `Failed to fetch geocoding data: ${response.status} ${response.statusText}`
      )
    }

    const data: GeocodingResponse = await response.json()

    return {
      isSuccess: true,
      message: "Geocoding successful",
      data: data.features
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
