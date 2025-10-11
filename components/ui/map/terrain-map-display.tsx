"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { Map } from "maplibre-gl"
import { toast } from "sonner"
import MapView from "./map-view"
import LayerControlPanel from "./layer-control-panel"
import { MapStyle } from "./map-view"
import {
  useMapInstance,
  useMapStyles,
  useMapControls,
  useMapViewport
} from "@/hooks"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Layers, ZoomIn, ZoomOut, Home, Mountain, Compass } from "lucide-react"
import { getAvailableMapStyles, validateMapTilerApiKey } from "@/lib/map-config"

interface TerrainMapDisplayProps {
  className?: string
  initialCenter?: [number, number]
  initialZoom?: number
  initialPitch?: number
  initialBearing?: number
}

export default function TerrainMapDisplay({
  className = "h-[500px] w-full",
  initialCenter = [8.6775, 9.0778], // Nigeria
  initialZoom = 10,
  initialPitch = 60,
  initialBearing = 30
}: TerrainMapDisplayProps) {
  const mapRef = useRef<Map | null>(null)
  const [activeStyleId, setActiveStyleId] = useState<string>("terrain")
  const [is3DEnabled, setIs3DEnabled] = useState(true)
  const [isMapLoaded, setIsMapLoaded] = useState(false)
  // Store the internal style change handler from MapView
  const [internalStyleChangeHandler, setInternalStyleChangeHandler] = useState<
    ((styleId: string) => void) | null
  >(null)

  // Check if MapTiler API key is valid
  const { isValid: isApiKeyValid, apiKey } = validateMapTilerApiKey()

  // Get available map styles
  const availableBaseStyles: MapStyle[] = useMemo(
    () => getAvailableMapStyles(),
    []
  )

  // Filter to only show terrain-related styles
  const terrainStyles = useMemo(() => {
    // Make sure we're on the client side
    if (typeof window === "undefined") return []

    return availableBaseStyles.filter(
      style =>
        style.id === "terrain" ||
        style.id === "streets" ||
        style.id === "outdoor-v2"
    )
  }, [availableBaseStyles])

  // Handle style change from LayerControlPanel - forward to MapView's internal handler
  const handleStyleChange = useCallback(
    (styleId: string) => {
      if (internalStyleChangeHandler) {
        // Use MapView's internal style change handler
        internalStyleChangeHandler(styleId)
      } else {
        // Fallback: update local state if internal handler not available yet
        setActiveStyleId(styleId)
      }
    },
    [internalStyleChangeHandler]
  )

  // Handle style change from MapView (when style actually changes)
  const handleStyleChangeFromMapView = useCallback((styleId: string) => {
    setActiveStyleId(styleId)
  }, [])

  // Store the internal style change handler when MapView provides it
  const handleStyleChangeHandlerRef = useCallback(
    (handler: (styleId: string) => void) => {
      setInternalStyleChangeHandler(() => handler)
    },
    []
  )

  // Handle map load
  const handleMapLoad = useCallback(
    (map: Map) => {
      mapRef.current = map
      setIsMapLoaded(true)

      // If API key is valid, try to add terrain
      if (isApiKeyValid && apiKey) {
        try {
          // Add raster-dem terrain source and enable terrain
          if (!map.getSource("terrain-dem")) {
            map.addSource("terrain-dem", {
              type: "raster-dem",
              url: `https://api.maptiler.com/tiles/terrain-rgb/tiles.json?key=${apiKey}`,
              tileSize: 256
            } as any)
          }

          // Some styles need exaggeration set after style is loaded
          if (map.isStyleLoaded()) {
            map.setTerrain({ source: "terrain-dem", exaggeration: 1.2 } as any)
            map.setPitch(initialPitch)
            map.setBearing(initialBearing)
          } else {
            map.once("style.load", () => {
              map.setTerrain({
                source: "terrain-dem",
                exaggeration: 1.2
              } as any)
              map.setPitch(initialPitch)
              map.setBearing(initialBearing)
            })
          }

          toast.success("3D terrain view enabled")
        } catch (err) {
          toast.error("Failed to enable 3D terrain view")
          console.error("Error enabling terrain:", err)
        }
      } else {
        toast.info("API key required for 3D terrain features")
      }
    },
    [isApiKeyValid, apiKey, initialPitch, initialBearing]
  )

  // Toggle 3D view
  const toggle3DView = useCallback(() => {
    if (!mapRef.current) return

    if (is3DEnabled) {
      // Disable 3D view
      mapRef.current.setPitch(0)
      mapRef.current.setBearing(0)
      try {
        mapRef.current.setTerrain(undefined as any)
      } catch {}
      setIs3DEnabled(false)
    } else {
      // Enable 3D view
      try {
        mapRef.current.setTerrain({
          source: "terrain-dem",
          exaggeration: 1.2
        } as any)
      } catch {}
      mapRef.current.setPitch(initialPitch)
      mapRef.current.setBearing(initialBearing)
      setIs3DEnabled(true)
    }
  }, [is3DEnabled, initialPitch, initialBearing])

  // Reset view
  const resetView = useCallback(() => {
    if (!mapRef.current) return

    mapRef.current.flyTo({
      center: initialCenter,
      zoom: initialZoom,
      pitch: is3DEnabled ? initialPitch : 0,
      bearing: is3DEnabled ? initialBearing : 0
    })
  }, [initialCenter, initialZoom, initialPitch, initialBearing, is3DEnabled])

  return (
    <Card className={className}>
      <CardContent className="p-0 relative" style={{ minHeight: "500px" }}>
        <MapView
          initialOptions={{
            center: initialCenter,
            zoom: initialZoom,
            pitch: initialPitch,
            bearing: initialBearing
          }}
          initialStyleId={activeStyleId}
          availableBaseStyles={terrainStyles}
          className="h-full w-full rounded-md"
          onMapLoad={handleMapLoad}
          onStyleChange={handleStyleChangeFromMapView}
          onStyleChangeHandler={handleStyleChangeHandlerRef}
          showControls={false}
        />
        <LayerControlPanel
          availableStyles={terrainStyles}
          activeStyleId={activeStyleId}
          onStyleChange={handleStyleChange}
          position="top-left"
          title="Terrain Styles"
        />

        {/* Map Controls */}
        <div className="absolute bottom-4 right-4 flex flex-col space-y-2 z-10">
          <Button
            variant="secondary"
            size="icon"
            onClick={resetView}
            title="Reset view"
          >
            <Home className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            onClick={() => mapRef.current?.zoomIn()}
            title="Zoom in"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            onClick={() => mapRef.current?.zoomOut()}
            title="Zoom out"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            variant={is3DEnabled ? "default" : "secondary"}
            size="icon"
            onClick={toggle3DView}
            title={is3DEnabled ? "Disable 3D view" : "Enable 3D view"}
            disabled={!isApiKeyValid}
          >
            {is3DEnabled ? (
              <Mountain className="h-4 w-4" />
            ) : (
              <Compass className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* API Key Missing Overlay */}
        {!isApiKeyValid && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-md z-20">
            <div className="bg-white p-6 max-w-md rounded-lg shadow-lg text-center">
              <Mountain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                MapTiler API Key Required
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                3D terrain visualization requires a valid MapTiler API key.
                Please add your API key to the .env.local file.
              </p>
              <Button variant="outline" size="sm" asChild>
                <a
                  href="https://www.maptiler.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs"
                >
                  Get MapTiler API Key
                </a>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
