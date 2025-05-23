"use client"

import { useState, useCallback, useRef } from "react"
import { Map } from "maplibre-gl"
import MapView from "@/components/ui/map/map-view"
import MapControls from "@/components/ui/map/map-controls"
import { MapStyle } from "@/components/ui/map/map-view"
import { getAvailableMapStyles } from "@/lib/map-config"
import { MapProvider } from "@/contexts/map-context"

// Nigeria coordinates
const NIGERIA_COORDINATES: [number, number] = [8.6753, 9.082]

export default function MapWrapper() {
  const [map, setMap] = useState<Map | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [activeStyleId, setActiveStyleId] = useState("")
  const mapViewStyleChangeRef = useRef<((styleId: string) => void) | null>(null)
  const validatedStyles = getAvailableMapStyles()

  const handleMapLoad = useCallback((mapInstance: Map) => {
    setMap(mapInstance)
    setIsLoaded(true)
  }, [])

  const handleStyleChange = useCallback((styleId: string) => {
    setActiveStyleId(styleId)
  }, [])

  // This will be called by MapView to provide us with its internal style change handler
  const handleMapViewStyleChange = useCallback(
    (styleChangeHandler: (styleId: string) => void) => {
      mapViewStyleChangeRef.current = styleChangeHandler
    },
    []
  )

  // This is what MapControls will call - it delegates to MapView's internal handler
  const handleControlStyleChange = useCallback((styleId: string) => {
    if (mapViewStyleChangeRef.current) {
      mapViewStyleChangeRef.current(styleId)
    }
  }, [])

  return (
    <MapProvider>
      <div className="flex flex-col md:flex-row w-full gap-4">
        <div className="md:w-3/4">
          <MapView
            className="h-[800px] w-full rounded-md shadow-lg"
            showControls={false}
            initialOptions={{
              zoom: 6,
              center: NIGERIA_COORDINATES
            }}
            onMapLoad={handleMapLoad}
            onStyleChange={handleStyleChange}
            onStyleChangeHandler={handleMapViewStyleChange}
          />
        </div>

        <div className="md:w-1/4">
          <div className="bg-white p-4 rounded-md shadow-md">
            <h2 className="text-lg font-semibold mb-4">Map Controls</h2>
            <MapControls
              map={map}
              isLoaded={isLoaded}
              validatedStyles={validatedStyles}
              activeStyleId={activeStyleId}
              handleStyleChange={handleControlStyleChange}
            />
          </div>
        </div>
      </div>
    </MapProvider>
  )
}
