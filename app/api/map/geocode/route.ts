"use server"

import { NextRequest, NextResponse } from "next/server"
import { applyRateLimit, RATE_LIMIT_CONFIGS } from "@/lib/rate-limiter"

// Try multiple environment variable names for the API key
const MAPTILER_API_KEY =
  process.env.MAPTILER_API_KEY_SERVER ||
  process.env.MAPTILER_API_KEY ||
  process.env.NEXT_PUBLIC_MAPTILER_API_KEY

const MAPTILER_GEOCODING_API_URL = "https://api.maptiler.com/geocoding"

// Enhanced fallback geocoding data for Nigeria with comprehensive location coverage
const NIGERIA_MAJOR_CITIES = [
  {
    id: "nigeria.lagos",
    place_name: "Lagos, Lagos State, Nigeria",
    center: [3.3792, 6.5244],
    properties: { country: "Nigeria", state: "Lagos", type: "city" },
    type: "Feature",
    place_type: ["city"],
    text: "Lagos"
  },
  {
    id: "nigeria.abuja",
    place_name: "Abuja, Federal Capital Territory, Nigeria",
    center: [7.4951, 9.0579],
    properties: {
      country: "Nigeria",
      state: "Federal Capital Territory",
      type: "city"
    },
    type: "Feature",
    place_type: ["city"],
    text: "Abuja"
  },
  {
    id: "nigeria.kano",
    place_name: "Kano, Kano State, Nigeria",
    center: [8.5171, 12.0022],
    properties: { country: "Nigeria", state: "Kano", type: "city" },
    type: "Feature",
    place_type: ["city"],
    text: "Kano"
  },
  {
    id: "nigeria.ibadan",
    place_name: "Ibadan, Oyo State, Nigeria",
    center: [3.947, 7.3775],
    properties: { country: "Nigeria", state: "Oyo", type: "city" },
    type: "Feature",
    place_type: ["city"],
    text: "Ibadan"
  },
  {
    id: "nigeria.port-harcourt",
    place_name: "Port Harcourt, Rivers State, Nigeria",
    center: [7.0134, 4.8156],
    properties: { country: "Nigeria", state: "Rivers", type: "city" },
    type: "Feature",
    place_type: ["city"],
    text: "Port Harcourt"
  },
  {
    id: "nigeria.benin-city",
    place_name: "Benin City, Edo State, Nigeria",
    center: [5.6037, 6.335],
    properties: { country: "Nigeria", state: "Edo", type: "city" },
    type: "Feature",
    place_type: ["city"],
    text: "Benin City"
  },
  {
    id: "nigeria.kaduna",
    place_name: "Kaduna, Kaduna State, Nigeria",
    center: [7.4386, 10.5105],
    properties: { country: "Nigeria", state: "Kaduna", type: "city" },
    type: "Feature",
    place_type: ["city"],
    text: "Kaduna"
  },
  {
    id: "nigeria.jos",
    place_name: "Jos, Plateau State, Nigeria",
    center: [8.8965, 9.9285],
    properties: { country: "Nigeria", state: "Plateau", type: "city" },
    type: "Feature",
    place_type: ["city"],
    text: "Jos"
  },
  {
    id: "nigeria.maiduguri",
    place_name: "Maiduguri, Borno State, Nigeria",
    center: [13.0844, 11.8462],
    properties: { country: "Nigeria", state: "Borno", type: "city" },
    type: "Feature",
    place_type: ["city"],
    text: "Maiduguri"
  },
  {
    id: "nigeria.enugu",
    place_name: "Enugu, Enugu State, Nigeria",
    center: [7.5248, 6.4422],
    properties: { country: "Nigeria", state: "Enugu", type: "city" },
    type: "Feature",
    place_type: ["city"],
    text: "Enugu"
  }
]

// State coordinates mapping for fallback geocoding
const STATE_COORDINATES: Record<string, [number, number]> = {
  abia: [7.5248, 5.4527],
  adamawa: [12.3984, 9.3265],
  "akwa-ibom": [7.8561, 5.0515],
  anambra: [6.7795, 6.2209],
  bauchi: [10.3158, 10.2734],
  bayelsa: [6.2484, 4.7719],
  benue: [8.748, 7.1906],
  borno: [13.0844, 11.8462],
  "cross-river": [8.327, 5.875],
  delta: [6.1319, 5.6826],
  ebonyi: [8.1137, 6.2649],
  edo: [5.6037, 6.335],
  ekiti: [5.22, 7.7195],
  enugu: [7.5248, 6.4422],
  fct: [7.4951, 9.0579], // Federal Capital Territory (Abuja)
  gombe: [11.1689, 10.2904],
  imo: [7.0498, 5.4951],
  jigawa: [9.3529, 12.2277],
  kaduna: [7.4386, 10.5105],
  kano: [8.5171, 12.0022],
  katsina: [7.6177, 12.9908],
  kebbi: [4.1975, 12.4532],
  kogi: [6.7398, 7.8007],
  kwara: [4.5418, 8.9669],
  lagos: [3.3792, 6.5244],
  nasarawa: [8.5432, 8.5378],
  niger: [6.5569, 9.9312],
  ogun: [3.3502, 7.1608],
  ondo: [5.2058, 7.2526],
  osun: [4.5418, 7.5629],
  oyo: [3.947, 7.3775],
  plateau: [8.8965, 9.9285],
  rivers: [7.0134, 4.8156],
  sokoto: [5.2389, 13.0649],
  taraba: [9.7799, 7.873],
  yobe: [11.7466, 12.2939],
  zamfara: [6.2084, 12.1704]
}

async function searchNigerianLocations(query: string, limit: number = 10) {
  try {
    // Import the Nigerian states/LGA data
    const { default: statesData } = await import(
      "@/lib/data/nigeria-states-lga.json"
    )

    const normalizedQuery = query.toLowerCase().trim()
    const matches: any[] = []

    // First, search major cities
    const cityMatches = NIGERIA_MAJOR_CITIES.filter(
      city =>
        city.place_name.toLowerCase().includes(normalizedQuery) ||
        city.text.toLowerCase().includes(normalizedQuery) ||
        city.properties.state?.toLowerCase().includes(normalizedQuery)
    )
    matches.push(...cityMatches)

    // Then search states
    for (const state of statesData) {
      const stateName = state.name.toLowerCase()
      const stateId = state.id.toLowerCase()

      if (
        stateName.includes(normalizedQuery) ||
        stateId.includes(normalizedQuery)
      ) {
        const coordinates = STATE_COORDINATES[state.id] || [7.0, 9.0] // Default center of Nigeria
        matches.push({
          id: `nigeria.state.${state.id}`,
          place_name: `${state.name} State, Nigeria`,
          center: coordinates,
          properties: {
            country: "Nigeria",
            state: state.name,
            type: "state",
            admin_level: 1
          },
          type: "Feature",
          place_type: ["region"],
          text: state.name
        })
      }

      // Search LGAs within states
      for (const lga of state.lgas) {
        const lgaName = lga.name.toLowerCase()
        const lgaId = lga.id.toLowerCase()

        if (
          lgaName.includes(normalizedQuery) ||
          lgaId.includes(normalizedQuery)
        ) {
          // Use state coordinates with slight offset for LGAs
          const stateCoords = STATE_COORDINATES[state.id] || [7.0, 9.0]
          const lgaCoords: [number, number] = [
            stateCoords[0] + (Math.random() - 0.5) * 0.5, // Random offset within state
            stateCoords[1] + (Math.random() - 0.5) * 0.5
          ]

          matches.push({
            id: `nigeria.lga.${state.id}.${lga.id}`,
            place_name: `${lga.name}, ${state.name} State, Nigeria`,
            center: lgaCoords,
            properties: {
              country: "Nigeria",
              state: state.name,
              lga: lga.name,
              type: "lga",
              admin_level: 2
            },
            type: "Feature",
            place_type: ["locality"],
            text: lga.name
          })
        }
      }
    }

    // Remove duplicates and sort by relevance
    const uniqueMatches = matches.filter(
      (match, index, self) => index === self.findIndex(m => m.id === match.id)
    )

    // Sort by relevance: exact matches first, then partial matches
    uniqueMatches.sort((a, b) => {
      const aExact = a.text.toLowerCase() === normalizedQuery
      const bExact = b.text.toLowerCase() === normalizedQuery
      if (aExact && !bExact) return -1
      if (!aExact && bExact) return 1

      // Then by type priority: major cities > states > LGAs
      const typePriority = { city: 3, state: 2, lga: 1 }
      const aPriority =
        typePriority[a.properties.type as keyof typeof typePriority] || 0
      const bPriority =
        typePriority[b.properties.type as keyof typeof typePriority] || 0

      return bPriority - aPriority
    })

    return {
      type: "FeatureCollection" as const,
      query: [query],
      features: uniqueMatches.slice(0, limit),
      attribution: "Nigerian geographic data with enhanced local coverage"
    }
  } catch (error) {
    console.error("Error searching Nigerian locations:", error)

    // Fallback to basic major cities search
    const normalizedQuery = query.toLowerCase().trim()
    const matches = NIGERIA_MAJOR_CITIES.filter(
      location =>
        location.place_name.toLowerCase().includes(normalizedQuery) ||
        location.text.toLowerCase().includes(normalizedQuery) ||
        location.properties.state?.toLowerCase().includes(normalizedQuery)
    ).slice(0, limit)

    return {
      type: "FeatureCollection" as const,
      query: [query],
      features: matches,
      attribution: "Fallback geocoding for Nigeria (major cities)"
    }
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
    if (process.env.NODE_ENV !== "production") {
      console.log("MapTiler API Key present?", !!MAPTILER_API_KEY)
    }

    const searchParams = request.nextUrl.searchParams
    const searchText = searchParams.get("q")

    // Removed the 2-character minimum restriction to allow single character searches
    if (!searchText || searchText.trim().length < 1) {
      return NextResponse.json(
        {
          error: "Search term is required",
          features: []
        },
        { status: 400 }
      )
    }

    // If no API key, return enhanced Nigerian location results immediately
    if (!MAPTILER_API_KEY) {
      console.warn(
        "MapTiler API key not found, using enhanced Nigerian location search"
      )
      const fallbackResult = await searchNigerianLocations(
        searchText,
        parseInt(searchParams.get("limit") || "10")
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

        // If API fails, return enhanced Nigerian location results
        const fallbackResult = await searchNigerianLocations(
          searchText,
          parseInt(searchParams.get("limit") || "10")
        )

        return NextResponse.json(
          {
            ...fallbackResult,
            warning:
              "Primary geocoding service unavailable, using enhanced Nigerian location data"
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

      // If MapTiler returns few or no results for Nigerian locations, supplement with local data
      if (data.features.length < 3 && country === "NG") {
        try {
          const nigerianResults = await searchNigerianLocations(searchText, 10)

          // Merge results, avoiding duplicates
          const existingNames = new Set(
            data.features.map((f: any) => f.place_name?.toLowerCase())
          )
          const additionalResults = nigerianResults.features.filter(
            (feature: any) =>
              !existingNames.has(feature.place_name?.toLowerCase())
          )

          data.features = [...data.features, ...additionalResults].slice(
            0,
            parseInt(searchParams.get("limit") || "10")
          )
          data.attribution = `${data.attribution || "MapTiler"} + Enhanced Nigerian location data`
        } catch (supplementError) {
          console.warn(
            "Failed to supplement with Nigerian data:",
            supplementError
          )
        }
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
        console.warn(
          "MapTiler request timed out, using enhanced Nigerian location search"
        )
      } else {
        console.error("MapTiler fetch error:", fetchError)
      }

      // Return enhanced Nigerian location results on any fetch error
      const fallbackResult = await searchNigerianLocations(
        searchText,
        parseInt(searchParams.get("limit") || "10")
      )

      return NextResponse.json(
        {
          ...fallbackResult,
          warning:
            "Primary geocoding service timeout, using enhanced Nigerian location data"
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

    // Even on complete failure, try to return Nigerian location results
    const searchText = request.nextUrl.searchParams.get("q") || ""
    if (searchText.length >= 1) {
      try {
        const fallbackResult = await searchNigerianLocations(searchText, 10)
        return NextResponse.json(
          {
            ...fallbackResult,
            error: "Geocoding service error, using Nigerian location data"
          },
          {
            status: 200,
            headers: {
              "Cache-Control": "no-cache"
            }
          }
        )
      } catch (fallbackError) {
        console.error("Even fallback search failed:", fallbackError)
      }
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
