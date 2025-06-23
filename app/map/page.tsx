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
      {/* Header overlay (kept minimal, disappears on mobile if needed) */}
      {(locationParam || searchParam) && (
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2 rounded-md bg-background/80 backdrop-blur-sm px-3 py-1 text-sm shadow">
          <MapPin className="h-4 w-4 text-primary" />
          <span>
            {locationParam ? locationParam : `Search: ${searchParam}`}
          </span>
        </div>
      )}

      {/* Map */}
      <Suspense fallback={<MapLoadingSkeleton />}>
        <MapClientWrapper
          initialCenter={initialCenter}
          initialZoom={initialZoom}
          searchResults={searchResults}
          highlightedLocation={locationParam}
        />
      </Suspense>
    </div>
  )
}
