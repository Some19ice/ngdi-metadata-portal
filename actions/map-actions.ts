"use server"

import { ActionState, GeocodingFeature } from "@/types"
import { geocodeLocationShared } from "@/lib/gis-services/geocoding-service"

interface GeocodeParams {
  searchText: string
  autocomplete?: boolean
  limit?: number
  page?: number // Added for pagination
  pageSize?: number // Added for pagination
  country?: string // Optional: limit search to specific countries (e.g., "US,CA")
  bbox?: [number, number, number, number] // Optional: limit search to a bounding box [minLng, minLat, maxLng, maxLat]
  proximity?: [number, number] // Optional: bias results towards a location [lng, lat]
}

export async function geocodeLocationAction(
  params: GeocodeParams
): Promise<ActionState<GeocodingFeature[]>> {
  const {
    searchText,
    autocomplete = true,
    limit = 5,
    page = 1,
    pageSize = 10,
    ...otherParams
  } = params

  const actualLimit = pageSize // Use pageSize as the actual limit for the API call
  const offset = (page - 1) * actualLimit // Calculate offset

  if (!searchText || searchText.trim().length < 1) {
    return {
      isSuccess: true,
      message: "Search term is required.",
      data: []
    }
  }

  try {
    const data = await geocodeLocationShared({
      searchText,
      autocomplete,
      limit: actualLimit,
      offset,
      country: otherParams.country,
      bbox: Array.isArray(otherParams.bbox)
        ? otherParams.bbox.join(",")
        : otherParams.bbox,
      proximity: Array.isArray(otherParams.proximity)
        ? otherParams.proximity.join(",")
        : otherParams.proximity
    })
    return {
      isSuccess: true,
      message:
        data.warning ||
        (data.features?.length
          ? `Found ${data.features.length} location${data.features.length > 1 ? "s" : ""}`
          : "No locations found"),
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
