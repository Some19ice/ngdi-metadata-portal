"use server"

import { NextRequest, NextResponse } from "next/server"
import { applyRateLimit, RATE_LIMIT_CONFIGS } from "@/lib/rate-limiter"

// Try multiple environment variable names for the API key
const MAPTILER_API_KEY =
  process.env.MAPTILER_API_KEY_SERVER ||
  process.env.MAPTILER_API_KEY ||
  process.env.NEXT_PUBLIC_MAPTILER_API_KEY

const MAPTILER_GEOCODING_API_URL = "https://api.maptiler.com/geocoding"

// Fallback geocoding data for Nigeria (basic locations)
const NIGERIA_FALLBACK_LOCATIONS = [
  {
    id: "nigeria.lagos",
    place_name: "Lagos, Nigeria",
    center: [3.3792, 6.5244],
    properties: { country: "Nigeria", state: "Lagos" },
    type: "Feature",
    place_type: ["city"],
    text: "Lagos"
  },
  {
    id: "nigeria.abuja",
    place_name: "Abuja, Nigeria",
    center: [7.4951, 9.0579],
    properties: { country: "Nigeria", state: "FCT" },
    type: "Feature",
    place_type: ["city"],
    text: "Abuja"
  },
  {
    id: "nigeria.kano",
    place_name: "Kano, Nigeria",
    center: [8.5171, 12.0022],
    properties: { country: "Nigeria", state: "Kano" },
    type: "Feature",
    place_type: ["city"],
    text: "Kano"
  },
  {
    id: "nigeria.ibadan",
    place_name: "Ibadan, Nigeria",
    center: [3.947, 7.3775],
    properties: { country: "Nigeria", state: "Oyo" },
    type: "Feature",
    place_type: ["city"],
    text: "Ibadan"
  },
  {
    id: "nigeria.port-harcourt",
    place_name: "Port Harcourt, Nigeria",
    center: [7.0134, 4.8156],
    properties: { country: "Nigeria", state: "Rivers" },
    type: "Feature",
    place_type: ["city"],
    text: "Port Harcourt"
  }
]

function searchFallbackLocations(query: string, limit: number = 5) {
  const normalizedQuery = query.toLowerCase().trim()

  const matches = NIGERIA_FALLBACK_LOCATIONS.filter(
    location =>
      location.place_name.toLowerCase().includes(normalizedQuery) ||
      location.text.toLowerCase().includes(normalizedQuery) ||
      location.properties.state?.toLowerCase().includes(normalizedQuery)
  ).slice(0, limit)

  return {
    type: "FeatureCollection" as const,
    query: [query],
    features: matches,
    attribution: "Fallback geocoding for Nigeria"
  }
}

export async function GET(request: NextRequest) {
  // ---------- Rate limiting ----------
  // Apply a lightweight rate-limit for search endpoints to protect MapTiler quota.
  const rateLimitResponse = await applyRateLimit(
    request,
    RATE_LIMIT_CONFIGS.search
  )
  if (rateLimitResponse) return rateLimitResponse

  try {
    // Log the API key status for debugging (without exposing the key)
    // (Avoid leaking key length in prod logs)
    if (process.env.NODE_ENV !== "production") {
      console.log("MapTiler API Key present?", !!MAPTILER_API_KEY)
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

    // If no API key, return fallback results immediately
    if (!MAPTILER_API_KEY) {
      console.warn("MapTiler API key not found, using fallback geocoding")
      const fallbackResult = searchFallbackLocations(
        searchText,
        parseInt(searchParams.get("limit") || "5")
      )

      return NextResponse.json(fallbackResult, {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600"
        }
      })
    }

    // Build query parameters for MapTiler
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

    // Make request to MapTiler with timeout
    const maptilerUrl = `${MAPTILER_GEOCODING_API_URL}/${encodeURIComponent(searchText)}.json?${queryParams.toString()}`

    console.log("Making request to MapTiler:", {
      url: maptilerUrl.replace(MAPTILER_API_KEY, "***"),
      searchText,
      timestamp: new Date().toISOString()
    })

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

    try {
      const response = await fetch(maptilerUrl, {
        signal: controller.signal,
        headers: {
          "User-Agent": "NGDI-Portal/1.0"
        }
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("MapTiler Geocoding API Error:", {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
          url: maptilerUrl.replace(MAPTILER_API_KEY, "***")
        })

        // If API fails, return fallback results
        const fallbackResult = searchFallbackLocations(
          searchText,
          parseInt(searchParams.get("limit") || "5")
        )

        return NextResponse.json(
          {
            ...fallbackResult,
            warning:
              "Primary geocoding service unavailable, using fallback results"
          },
          {
            status: 200,
            headers: {
              "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300"
            }
          }
        )
      }

      const data = await response.json()

      // Ensure we always return a features array
      if (!data.features) {
        data.features = []
      }

      console.log("MapTiler response:", {
        featuresCount: data.features?.length || 0,
        query: data.query,
        timestamp: new Date().toISOString()
      })

      // Return successful response with appropriate cache headers
      return NextResponse.json(data, {
        headers: {
          "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600"
        }
      })
    } catch (fetchError) {
      clearTimeout(timeoutId)

      if (fetchError instanceof Error && fetchError.name === "AbortError") {
        console.warn("MapTiler request timed out, using fallback")
      } else {
        console.error("MapTiler fetch error:", fetchError)
      }

      // Return fallback results on any fetch error
      const fallbackResult = searchFallbackLocations(
        searchText,
        parseInt(searchParams.get("limit") || "5")
      )

      return NextResponse.json(
        {
          ...fallbackResult,
          warning: "Primary geocoding service timeout, using fallback results"
        },
        {
          status: 200,
          headers: {
            "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300"
          }
        }
      )
    }
  } catch (error) {
    console.error("Geocoding proxy error:", error)

    // Even on complete failure, try to return fallback results
    const searchText = request.nextUrl.searchParams.get("q") || ""
    if (searchText.length >= 2) {
      const fallbackResult = searchFallbackLocations(searchText, 5)
      return NextResponse.json(
        {
          ...fallbackResult,
          error: "Geocoding service error, using fallback results"
        },
        {
          status: 200,
          headers: {
            "Cache-Control": "no-cache"
          }
        }
      )
    }

    return NextResponse.json(
      {
        error: "Internal server error",
        features: []
      },
      { status: 500 }
    )
  }
}
