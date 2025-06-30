"use server"

import { Suspense } from "react"
import { geocodeLocationAction } from "@/actions/map-actions"
import { MapPin } from "lucide-react"
import MapClientWrapper from "./_components/map-client-wrapper"
import MapLoadingSkeleton from "./_components/map-loading-skeleton"

interface SearchParams {
  location?: string
  center?: string
  search?: string
  zoom?: string
}

interface MapPageProps {
  searchParams: Promise<SearchParams>
}

// Create a separate component for the header overlay with proper timing
function MapHeaderOverlay({
  locationParam,
  searchParam
}: {
  locationParam?: string
  searchParam?: string
}) {
  return (
    <div className="absolute top-4 left-4 z-30 flex items-center gap-2 rounded-md bg-background/90 backdrop-blur-sm px-3 py-2 text-sm shadow-lg border border-gray-200/50 animate-in fade-in-0 slide-in-from-top-2 duration-500 delay-700">
      <MapPin className="h-4 w-4 text-primary" />
      <span className="font-medium">
        {locationParam ? locationParam : `Search: ${searchParam}`}
      </span>
    </div>
  )
}

export default async function MapPage({
  searchParams: searchParamsPromise
}: MapPageProps) {
  const searchParams = await searchParamsPromise

  const locationParam = searchParams?.location
  const centerParam = searchParams?.center
  const searchParam = searchParams?.search
  const zoomParam = searchParams?.zoom

  // Parse center coordinates if provided
  let initialCenter: [number, number] | undefined
  if (centerParam) {
    const coords = centerParam.split(",").map(coord => parseFloat(coord.trim()))
    if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
      initialCenter = [coords[0], coords[1]]
    }
  }

  // Parse zoom level
  const initialZoom = zoomParam ? parseInt(zoomParam, 10) : undefined

  // Handle search parameter
  let searchResults = null

  if (searchParam) {
    try {
      const result = await geocodeLocationAction({
        searchText: searchParam,
        autocomplete: false,
        limit: 10,
        country: "NG"
      })

      if (result.isSuccess && result.data.length > 0) {
        searchResults = result.data
        // If no specific center is provided, center on the first search result
        if (!initialCenter && searchResults.length > 0) {
          initialCenter = searchResults[0].center
        }
      }
    } catch (error) {
      // Handle search error
    }
  }

  return (
    <div className="relative w-full h-full">
      {/* Map - render first for proper loading order */}
      <Suspense fallback={<MapLoadingSkeleton />}>
        <MapClientWrapper
          initialCenter={initialCenter}
          initialZoom={initialZoom}
          searchResults={searchResults}
          highlightedLocation={locationParam}
        />
      </Suspense>

      {/* Header overlay - render after map with delay and proper z-index */}
      {(locationParam || searchParam) && (
        <MapHeaderOverlay
          locationParam={locationParam}
          searchParam={searchParam}
        />
      )}
    </div>
  )
}
