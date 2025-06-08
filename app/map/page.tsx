"use server"

import { Suspense } from "react"
import { geocodeLocationAction } from "@/actions/map-actions"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, Search, Loader2 } from "lucide-react"
import MapClientWrapper from "./_components/map-client-wrapper"

interface SearchParams {
  location?: string
  center?: string
  search?: string
  zoom?: string
}

interface MapPageProps {
  searchParams: Promise<SearchParams>
}

function MapLoadingSkeleton() {
  return (
    <div className="w-full h-screen bg-gray-100 animate-pulse flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin mx-auto text-gray-400" />
        <p className="text-gray-600 font-medium">Loading map...</p>
      </div>
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
  let searchError = null

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
      } else {
        searchError = `No locations found for "${searchParam}"`
      }
    } catch (error) {
      searchError = `Search failed: ${error instanceof Error ? error.message : "Unknown error"}`
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Interactive Map</h1>
          {(locationParam || searchParam) && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span className="text-sm">
                {locationParam || `Search: ${searchParam}`}
              </span>
            </div>
          )}
        </div>

        {/* Search Results Info */}
        {searchParam && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Location Search Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              {searchError && (
                <Alert>
                  <AlertDescription>{searchError}</AlertDescription>
                </Alert>
              )}

              {searchResults && searchResults.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Found {searchResults.length} location
                    {searchResults.length !== 1 ? "s" : ""} for "{searchParam}"
                  </p>
                  <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                    {searchResults.slice(0, 6).map((location, index) => (
                      <div
                        key={location.id || index}
                        className="text-sm p-2 bg-gray-50 dark:bg-gray-800 rounded"
                      >
                        <div className="font-medium">{location.place_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {location.center[1].toFixed(4)},{" "}
                          {location.center[0].toFixed(4)}
                        </div>
                      </div>
                    ))}
                  </div>
                  {searchResults.length > 6 && (
                    <p className="text-xs text-muted-foreground">
                      ...and {searchResults.length - 6} more locations shown on
                      the map
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Map Component */}
        <Suspense fallback={<MapLoadingSkeleton />}>
          <MapClientWrapper
            initialCenter={initialCenter}
            initialZoom={initialZoom}
            searchResults={searchResults}
            highlightedLocation={locationParam}
          />
        </Suspense>
      </div>
    </div>
  )
}
