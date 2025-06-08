"use server"

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"

// Try multiple environment variable names for the API key
const MAPTILER_API_KEY =
  process.env.MAPTILER_API_KEY_SERVER ||
  process.env.MAPTILER_API_KEY ||
  process.env.NEXT_PUBLIC_MAPTILER_API_KEY

const MAPTILER_GEOCODING_API_URL = "https://api.maptiler.com/geocoding"

export async function GET(request: NextRequest) {
  try {
    // Optional: Add authentication check
    // const { userId } = await auth()
    // if (!userId) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    // }

    if (!MAPTILER_API_KEY) {
      console.error(
        "MapTiler API key is not configured in environment variables"
      )
      return NextResponse.json(
        {
          error: "MapTiler API key is not configured",
          features: [] // Return empty features array as fallback
        },
        { status: 500 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const searchText = searchParams.get("q")

    if (!searchText || searchText.trim().length < 2) {
      return NextResponse.json(
        {
          error: "Search term too short",
          features: []
        },
        { status: 400 }
      )
    }

    // Build query parameters
    const queryParams = new URLSearchParams({
      key: MAPTILER_API_KEY,
      autocomplete: searchParams.get("autocomplete") || "true",
      limit: searchParams.get("limit") || "5"
    })

    // Add optional parameters
    const country = searchParams.get("country")
    if (country) queryParams.append("country", country)

    const bbox = searchParams.get("bbox")
    if (bbox) queryParams.append("bbox", bbox)

    const proximity = searchParams.get("proximity")
    if (proximity) queryParams.append("proximity", proximity)

    // Make request to MapTiler
    const maptilerUrl = `${MAPTILER_GEOCODING_API_URL}/${encodeURIComponent(searchText)}.json?${queryParams.toString()}`

    console.log(
      "Fetching from MapTiler:",
      maptilerUrl.replace(MAPTILER_API_KEY, "***")
    )

    const response = await fetch(maptilerUrl)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("MapTiler Geocoding API Error:", {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      })

      // Return a fallback response instead of throwing
      return NextResponse.json(
        {
          error: `Geocoding service unavailable: ${response.statusText}`,
          features: []
        },
        { status: response.status }
      )
    }

    const data = await response.json()

    // Ensure we always return a features array
    if (!data.features) {
      data.features = []
    }

    // Add cache headers for better performance
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400"
      }
    })
  } catch (error) {
    console.error("Geocoding proxy error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        features: [] // Always return features array
      },
      { status: 500 }
    )
  }
}
