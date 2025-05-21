"use client"

import { Suspense, useState, useCallback, useMemo } from "react"
import { Map } from "maplibre-gl"
import { toast } from "sonner"
import MapView from "@/components/ui/map/map-view"
import LayerControlPanel from "@/components/ui/map/layer-control-panel"
import type { MapStyle } from "@/components/ui/map/map-view"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import {
  getAvailableMapStyles,
  validateMapTilerApiKey,
  logMapError
} from "@/lib/map-config"

// Basic skeleton for loading state
function MapSkeleton() {
  return (
    <div className="h-[700px] w-full animate-pulse bg-gray-200 rounded-md">
      Loading Map...
    </div>
  )
}

export default function MapPage() {
  // Define initial map center and zoom for Nigeria
  const initialMapOptions = useMemo(
    () => ({
      center: [8.6775, 9.0778] as [number, number], // Nigeria - explicitly typed as [number, number] for maplibre
      zoom: 6
    }),
    []
  )

  // Get available map styles with proper API key validation
  const { isValid: isApiKeyValid, apiKey } = validateMapTilerApiKey()

  // Use our centralized map configuration utility to get available styles
  const availableBaseStyles: MapStyle[] = useMemo(
    () => getAvailableMapStyles(),
    []
  )

  const initialStyleId = availableBaseStyles[0].id
  const [activeStyleId, setActiveStyleId] = useState<string>(initialStyleId)
  const [mapInstance, setMapInstance] = useState<Map | null>(null)

  // Handle style change
  const handleStyleChange = useCallback((styleId: string) => {
    setActiveStyleId(styleId)
  }, [])

  // Handle map load
  const handleMapLoad = useCallback((map: Map) => {
    setMapInstance(map)
    toast.success("Map loaded successfully")
  }, [])

  // Handle map error with improved logging
  const handleMapError = useCallback((error: Error) => {
    // Use our centralized error logging
    logMapError(error, "Map Page Error")

    // Show a more informative error message
    toast.error(
      "There was an error loading the map. Using fallback configuration.",
      {
        description: "Some map features may be limited.",
        duration: 5000
      }
    )
  }, [])

  // Check if API key is missing using our validation utility
  const isMissingApiKey = !isApiKeyValid

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Interactive Map</CardTitle>
          <CardDescription>
            Explore geographic data with multiple base layers
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isMissingApiKey && (
            <Alert variant="warning" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>MapTiler API Key Issue</AlertTitle>
              <AlertDescription>
                <p>
                  Some map styles are unavailable because the MapTiler API key
                  is missing or invalid. The map will use a free style instead.
                </p>
                <p className="text-xs mt-2">
                  To fix this issue, add a valid MapTiler API key to your
                  .env.local file:
                  <code className="block bg-gray-100 p-1 mt-1 rounded text-xs">
                    NEXT_PUBLIC_MAPTILER_API_KEY=your_api_key_here
                  </code>
                </p>
              </AlertDescription>
            </Alert>
          )}

          <Suspense fallback={<MapSkeleton />}>
            <div className="relative">
              <MapView
                initialOptions={initialMapOptions}
                initialStyleId={activeStyleId}
                availableBaseStyles={availableBaseStyles}
                className="h-[700px] w-full rounded-md shadow-lg"
                onMapLoad={handleMapLoad}
                onStyleChange={handleStyleChange}
                onError={handleMapError}
              />
              <LayerControlPanel
                availableStyles={availableBaseStyles}
                activeStyleId={activeStyleId}
                onStyleChange={handleStyleChange}
                position="top-right"
              />
            </div>
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
