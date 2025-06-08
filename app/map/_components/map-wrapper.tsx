"use client"

import "maplibre-gl/dist/maplibre-gl.css"
import { useState, useCallback, useRef, useEffect, memo } from "react"
import { Map, Marker, Popup, LngLatBounds } from "maplibre-gl"
import dynamic from "next/dynamic"
import { MapErrorBoundary } from "@/components/ui/map/map-error-boundary"
import { MapStyle } from "@/components/ui/map/map-view"
import { getAvailableMapStyles } from "@/lib/map-config"
import { MapProvider } from "@/contexts/map-context"
import { GeocodingFeature } from "@/types"
import {
  createSafeSearchMarker,
  createSafePopupContent,
  MapEventManager
} from "@/lib/map-security"
import MapSearchInput from "./map-search-input"
import { toast } from "sonner"

// Lazy load heavy components
const MapView = dynamic(() => import("@/components/ui/map/map-view"), {
  ssr: false
})

const MapControls = dynamic(() => import("@/components/ui/map/map-controls"), {
  ssr: false
})

// Nigeria coordinates
const NIGERIA_COORDINATES: [number, number] = [8.6753, 9.082]

interface MapWrapperProps {
  initialCenter?: [number, number]
  initialZoom?: number
  searchResults?: GeocodingFeature[] | null
  highlightedLocation?: string
}

// Memoized control panel component
const MapControlPanel = memo(
  ({
    map,
    isLoaded,
    validatedStyles,
    activeStyleId,
    handleControlStyleChange,
    handleSearchQuery,
    handleLocationSelect,
    copyCoordinates,
    currentSearchResults
  }: {
    map: Map | null
    isLoaded: boolean
    validatedStyles: MapStyle[]
    activeStyleId: string
    handleControlStyleChange: (styleId: string) => void
    handleSearchQuery: (query: string) => void
    handleLocationSelect: (location: GeocodingFeature) => void
    copyCoordinates: () => void
    currentSearchResults: GeocodingFeature[]
  }) => {
    return (
      <div className="p-6 space-y-6">
        {/* Smart Map Hub Header */}
        <div className="text-center">
          <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Smart Map Hub
          </h2>
          <p className="text-sm text-gray-600 mt-1">AI-powered navigation</p>

          <div className="flex items-center justify-center gap-2 mt-3">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs font-medium text-green-700">
              Connected
            </span>
          </div>
        </div>

        {/* Enhanced Search Input */}
        <div>
          <MapSearchInput
            onSearch={handleSearchQuery}
            onLocationSelect={handleLocationSelect}
            className="w-full"
          />
        </div>

        {/* Live Statistics Dashboard */}
        <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-gray-200">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            Live Statistics
          </h3>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-blue-50 p-2 rounded-lg">
              <p className="text-blue-600 font-medium">Zoom</p>
              <p className="text-lg font-bold text-blue-800">
                {map ? Math.round(map.getZoom() * 10) / 10 : "--"}
              </p>
            </div>
            <div className="bg-purple-50 p-2 rounded-lg">
              <p className="text-purple-600 font-medium">Bearing</p>
              <p className="text-lg font-bold text-purple-800">
                {map ? Math.round(map.getBearing()) : 0}°
              </p>
            </div>
            <div className="bg-green-50 p-2 rounded-lg col-span-2">
              <p className="text-green-600 font-medium">Current Center</p>
              <p
                className="text-sm font-mono text-green-800 cursor-pointer hover:bg-green-100 p-1 rounded transition-colors"
                onClick={copyCoordinates}
                title="Click to copy coordinates"
              >
                {map
                  ? `${map.getCenter().lat.toFixed(4)}, ${map.getCenter().lng.toFixed(4)}`
                  : "Loading..."}
              </p>
            </div>
          </div>
        </div>

        {/* Smart Recommendations */}
        {isLoaded && map && (
          <div className="bg-amber-50 rounded-xl p-3 border border-amber-200">
            <h4 className="text-sm font-medium text-amber-800 mb-2 flex items-center gap-2">
              💡 Smart Suggestion
            </h4>
            <p className="text-xs text-amber-700">
              {map.getZoom() > 12
                ? "Perfect zoom for street-level exploration!"
                : map.getZoom() < 6
                  ? "Try zooming in for more detail"
                  : "Optimal zoom level for overview navigation"}
            </p>
          </div>
        )}

        {/* Map Controls */}
        <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-gray-200">
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
            Map Controls
          </h4>
          <MapControls
            map={map}
            isLoaded={isLoaded}
            validatedStyles={validatedStyles}
            activeStyleId={activeStyleId}
            handleStyleChange={handleControlStyleChange}
            showLocationSearch={false}
            className="bg-transparent"
          />
        </div>

        {/* Search Results Panel */}
        {currentSearchResults && currentSearchResults.length > 0 && (
          <SearchResultsPanel
            searchResults={currentSearchResults}
            onLocationClick={location => {
              if (map) {
                map.flyTo({
                  center: location.center,
                  zoom: 12,
                  duration: 1000
                })
              }
            }}
          />
        )}
      </div>
    )
  }
)

MapControlPanel.displayName = "MapControlPanel"

// Memoized search results panel
const SearchResultsPanel = memo(
  ({
    searchResults,
    onLocationClick
  }: {
    searchResults: GeocodingFeature[]
    onLocationClick: (location: GeocodingFeature) => void
  }) => {
    return (
      <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-gray-200">
        <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full" />
          Search Results ({searchResults.length})
        </h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {searchResults.map((location, index) => (
            <div
              key={location.id || index}
              className="p-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg cursor-pointer hover:from-blue-100 hover:to-purple-100 transition-all transform hover:scale-[1.02] border border-gray-200"
              onClick={() => onLocationClick(location)}
            >
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {location.place_name}
                  </p>
                  <p className="text-xs text-gray-500 font-mono">
                    {location.center[1].toFixed(4)},{" "}
                    {location.center[0].toFixed(4)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }
)

SearchResultsPanel.displayName = "SearchResultsPanel"

function MapWrapper({
  initialCenter = NIGERIA_COORDINATES,
  initialZoom = 6,
  searchResults,
  highlightedLocation
}: MapWrapperProps) {
  const [map, setMap] = useState<Map | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [activeStyleId, setActiveStyleId] = useState("")
  const [currentSearchResults, setCurrentSearchResults] = useState<
    GeocodingFeature[]
  >(searchResults || [])
  const validatedStyles = getAvailableMapStyles()
  const eventManagerRef = useRef<MapEventManager>(new MapEventManager())

  // Update search results when prop changes
  useEffect(() => {
    setCurrentSearchResults(searchResults || [])
  }, [searchResults])

  const handleMapLoad = useCallback((mapInstance: Map) => {
    setMap(mapInstance)
    setIsLoaded(true)

    // Set initial style ID from the map
    const currentStyle = mapInstance.getStyle()
    if (currentStyle && currentStyle.name) {
      setActiveStyleId(currentStyle.name)
    }
  }, [])

  const handleStyleChange = useCallback(
    (styleId: string) => {
      setActiveStyleId(styleId)

      // Apply the style change to the map
      if (map && isLoaded) {
        const selectedStyle = validatedStyles.find(
          style => style.id === styleId
        )
        if (selectedStyle && selectedStyle.url) {
          try {
            map.setStyle(selectedStyle.url)
            toast.success(`Map style changed to ${selectedStyle.name}`)
          } catch (error) {
            console.error("Failed to change map style:", error)
            toast.error("Failed to change map style")
          }
        }
      }
    },
    [map, isLoaded, validatedStyles]
  )

  const copyCoordinates = () => {
    if (map) {
      const center = map.getCenter()
      const coords = `${center.lat.toFixed(6)}, ${center.lng.toFixed(6)}`
      navigator.clipboard.writeText(coords).then(() => {
        toast.success("Coordinates copied to clipboard", {
          description: coords,
          duration: 2000
        })
      })
    }
  }

  // Handle search from MapSearchInput component
  const handleLocationSelect = useCallback(
    (location: GeocodingFeature) => {
      setCurrentSearchResults([location])
      if (map) {
        map.flyTo({
          center: location.center,
          zoom: 12,
          duration: 1000
        })
      }
    },
    [map]
  )

  const handleSearchQuery = useCallback((searchTerm: string) => {
    // This handles non-geocoded searches
    console.log("Search query:", searchTerm)
  }, [])

  // Add markers for search results when map is loaded - SECURE VERSION
  useEffect(() => {
    if (
      map &&
      isLoaded &&
      currentSearchResults &&
      currentSearchResults.length > 0 &&
      typeof Marker !== "undefined" &&
      typeof Popup !== "undefined" &&
      typeof LngLatBounds !== "undefined"
    ) {
      // Clear existing markers and event listeners
      const existingMarkers = document.querySelectorAll(".search-result-marker")
      existingMarkers.forEach(marker => {
        eventManagerRef.current.removeElementHandlers(marker as HTMLElement)
        marker.remove()
      })

      // Add new markers for search results using secure creation
      currentSearchResults.forEach((location, index) => {
        // Create secure marker element
        const markerElement = createSafeSearchMarker(
          index,
          location.place_name,
          location.center
        )

        // Add marker to map
        const marker = new Marker({
          element: markerElement,
          anchor: "center"
        })
          .setLngLat(location.center)
          .addTo(map)

        // Create secure popup content
        const popupContent = createSafePopupContent({
          title: location.place_name,
          coordinates: location.center
        })

        const popup = new Popup({
          offset: 25,
          closeButton: false
        }).setDOMContent(popupContent)

        // Add secure event listeners
        const showPopup = () => popup.addTo(map)
        const hidePopup = () => popup.remove()

        eventManagerRef.current.addElementListener(
          markerElement,
          "mouseenter",
          showPopup
        )
        eventManagerRef.current.addElementListener(
          markerElement,
          "mouseleave",
          hidePopup
        )
        eventManagerRef.current.addElementListener(
          markerElement,
          "click",
          showPopup
        )

        // Add keyboard support
        eventManagerRef.current.addElementListener(
          markerElement,
          "keydown",
          (e: Event) => {
            const keyEvent = e as KeyboardEvent
            if (keyEvent.key === "Enter" || keyEvent.key === " ") {
              keyEvent.preventDefault()
              showPopup()
            }
          }
        )
      })

      // If there's only one result or a highlighted location, zoom to it
      if (currentSearchResults.length === 1 || highlightedLocation) {
        const targetLocation = currentSearchResults[0]
        map.flyTo({
          center: targetLocation.center,
          zoom: Math.max(initialZoom || 6, 10),
          duration: 1000
        })
      } else if (
        currentSearchResults.length > 1 &&
        typeof LngLatBounds !== "undefined"
      ) {
        // Fit bounds to show all search results
        const bounds = new LngLatBounds()
        currentSearchResults.forEach(location => {
          bounds.extend(location.center)
        })
        map.fitBounds(bounds, {
          padding: 50,
          duration: 1000
        })
      }
    }
  }, [map, isLoaded, currentSearchResults, highlightedLocation, initialZoom])

  // Cleanup event listeners on unmount
  useEffect(() => {
    return () => {
      eventManagerRef.current.cleanup()
    }
  }, [])

  const handleMapError = (error: Error) => {
    console.error("Map error:", error)
    toast.error("Map error occurred", {
      description: error.message,
      duration: 4000
    })
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Smart Map Hub Sidebar */}
      <div className="w-80 bg-white shadow-lg border-r border-gray-200 overflow-y-auto">
        <MapControlPanel
          map={map}
          isLoaded={isLoaded}
          validatedStyles={validatedStyles}
          activeStyleId={activeStyleId}
          handleControlStyleChange={handleStyleChange}
          handleSearchQuery={handleSearchQuery}
          handleLocationSelect={handleLocationSelect}
          copyCoordinates={copyCoordinates}
          currentSearchResults={currentSearchResults}
        />
      </div>

      {/* Map Container */}
      <div className="flex-1 relative">
        <MapErrorBoundary onError={handleMapError}>
          <MapView
            initialOptions={{
              center: initialCenter,
              zoom: initialZoom
            }}
            onMapLoad={handleMapLoad}
            onStyleChange={setActiveStyleId}
            className="w-full h-full"
            showControls={false}
          />
        </MapErrorBoundary>
      </div>
    </div>
  )
}

export default memo(MapWrapper)
