"use client"

import dynamic from "next/dynamic"
import { useSearchParams } from "next/navigation"
import { useEffect, useState, useCallback } from "react"
import MapLoadingSkeleton from "./map-loading-skeleton"
import { GeocodingFeature } from "@/types"

// Lazy load the map wrapper component and show skeleton while loading.
const MapWrapper = dynamic(() => import("./map-wrapper"), {
  ssr: false,
  loading: () => <MapLoadingSkeleton />
})

interface MapClientWrapperProps {
  initialCenter?: [number, number]
  initialZoom?: number
  searchResults?: GeocodingFeature[] | null
  highlightedLocation?: string
}

// Use client-side fetch for geocoding instead of server actions (server actions cannot be called from client components)
async function fetchGeocode(
  searchText: string,
  limit: number = 10
): Promise<GeocodingFeature[]> {
  try {
    const params = new URLSearchParams({
      q: searchText,
      autocomplete: "false",
      limit: String(limit),
      country: "NG"
    })

    const res = await fetch(`/api/map/geocode?${params.toString()}`, {
      method: "GET",
      cache: "no-store"
    })

    if (!res.ok) return []

    const data = await res.json()
    return Array.isArray(data?.features)
      ? (data.features as GeocodingFeature[])
      : []
  } catch (err) {
    console.error("Client geocode fetch error:", err)
    return []
  }
}

export default function MapClientWrapper(props: MapClientWrapperProps) {
  const searchParams = useSearchParams()
  const [currentProps, setCurrentProps] = useState(props)
  const [isUpdating, setIsUpdating] = useState(false)

  const updateMapFromParams = useCallback(async () => {
    const locationParam = searchParams.get("location")
    const centerParam = searchParams.get("center")
    const searchParam = searchParams.get("search")
    const zoomParam = searchParams.get("zoom")

    // Parse center coordinates if provided
    let newCenter: [number, number] | undefined = props.initialCenter
    if (centerParam) {
      const coords = centerParam
        .split(",")
        .map(coord => parseFloat(coord.trim()))
      if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
        newCenter = [coords[0], coords[1]]
      }
    }

    // Parse zoom level
    const newZoom = zoomParam ? parseInt(zoomParam, 10) : props.initialZoom

    // Handle search parameter
    let newSearchResults = props.searchResults

    if (searchParam) {
      setIsUpdating(true)
      try {
        const result = await fetchGeocode(searchParam, 10)

        if (result.length > 0) {
          // If a specific location is provided, try to match it exactly
          if (locationParam) {
            const matched = result.filter(r => r.place_name === locationParam)
            newSearchResults = matched.length > 0 ? matched : [result[0]]
          } else {
            newSearchResults = result
          }

          // If no specific center is provided, center on the first (matched) result
          if (!newCenter && newSearchResults.length > 0) {
            newCenter = newSearchResults[0].center
          }
        }
      } catch (error) {
        console.error("Error geocoding search parameter:", error)
      } finally {
        setIsUpdating(false)
      }
    }

    // Update props if anything changed
    setCurrentProps({
      initialCenter: newCenter,
      initialZoom: newZoom,
      searchResults: newSearchResults,
      highlightedLocation: locationParam || props.highlightedLocation
    })
  }, [searchParams, props])

  useEffect(() => {
    updateMapFromParams()
  }, [updateMapFromParams])

  // Show loading state during updates if needed
  if (isUpdating) {
    return <MapLoadingSkeleton />
  }

  return <MapWrapper {...currentProps} />
}
