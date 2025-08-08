"use client"

import "maplibre-gl/dist/maplibre-gl.css"
import { useState, useCallback, useRef, useEffect, memo } from "react"
import { Map, Marker, Popup, LngLatBounds, ScaleControl } from "maplibre-gl"
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
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import {
  Menu,
  ChevronsLeft,
  ChevronsRight,
  ZoomIn,
  ZoomOut,
  Compass,
  Home,
  MapPin
} from "lucide-react"
import MapFabGroup from "./map-fab-group"
import { useRouter, usePathname } from "next/navigation"

// Lazy load heavy components
const MapView = dynamic(() => import("@/components/ui/map/map-view"), {
  ssr: false
})

const MapControls = dynamic(() => import("@/components/ui/map/map-controls"), {
  ssr: false
})

// Lazy-load drawing tools (heavy)
const MapDrawingTools = dynamic(
  () => import("@/components/ui/map/map-drawing-tools"),
  { ssr: false }
)
// Nigeria coordinates
const NIGERIA_COORDINATES: [number, number] = [8.6753, 9.082]

interface MapWrapperProps {
  initialCenter?: [number, number]
  initialZoom?: number
  searchResults?: GeocodingFeature[] | null
  highlightedLocation?: string
}

// Location Header Overlay Component
const MapHeaderOverlay = memo(
  ({
    currentSearchResults,
    highlightedLocation
  }: {
    currentSearchResults: GeocodingFeature[]
    highlightedLocation?: string
  }) => {
    // Determine the display title from current search results or highlighted location
    const displayTitle =
      currentSearchResults && currentSearchResults.length > 0
        ? currentSearchResults[0].place_name
        : highlightedLocation

    // Only show if there's something to display
    if (!displayTitle) return null

    return (
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-30 flex items-center gap-2 rounded-md bg-background/90 backdrop-blur-sm px-3 py-2 text-sm shadow-lg border border-gray-200/50 animate-in fade-in-0 slide-in-from-top-2 duration-500 delay-700">
        <MapPin className="h-4 w-4 text-primary" />
        <span className="font-medium">{displayTitle}</span>
      </div>
    )
  }
)

MapHeaderOverlay.displayName = "MapHeaderOverlay"

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
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="text-center border-b border-gray-100 pb-4">
          <h2 className="text-lg font-semibold text-gray-900">Map Controls</h2>
          <p className="text-sm text-gray-500 mt-1">Navigate and explore</p>
        </div>

        {/* Search Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Search Location
          </label>
          <MapSearchInput
            onSearch={handleSearchQuery}
            onLocationSelect={handleLocationSelect}
            className="w-full"
          />
        </div>

        {/* Map Style Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Map Style</label>
          <div className="grid grid-cols-2 gap-2">
            {validatedStyles.slice(0, 4).map(style => (
              <button
                key={style.id}
                onClick={() => handleControlStyleChange(style.id)}
                className={`p-2 text-xs rounded-lg border-2 transition-all ${
                  activeStyleId === style.id
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                }`}
                disabled={!style.url}
              >
                {style.name}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        {isLoaded && map && (
          <div className="bg-gray-50 rounded-lg p-3 space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Current View</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-500">Zoom:</span>
                <span className="ml-1 font-medium">
                  {Math.round(map.getZoom() * 10) / 10}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Bearing:</span>
                <span className="ml-1 font-medium">
                  {Math.round(map.getBearing())}°
                </span>
              </div>
            </div>
            <button
              onClick={copyCoordinates}
              className="w-full text-left text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 p-2 rounded transition-colors"
              title="Click to copy coordinates"
            >
              <span className="text-gray-500">Center:</span>
              <span className="ml-1 font-mono">
                {`${map.getCenter().lat.toFixed(4)}, ${map.getCenter().lng.toFixed(4)}`}
              </span>
            </button>
          </div>
        )}

        {/* Quick Actions */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Quick Actions
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => map?.zoomIn()}
              disabled={!isLoaded}
              className="flex items-center justify-center gap-2 p-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <ZoomIn className="h-4 w-4" />
              Zoom In
            </button>
            <button
              onClick={() => map?.zoomOut()}
              disabled={!isLoaded}
              className="flex items-center justify-center gap-2 p-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <ZoomOut className="h-4 w-4" />
              Zoom Out
            </button>
            <button
              onClick={() => map?.setBearing(0)}
              disabled={!isLoaded}
              className="flex items-center justify-center gap-2 p-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <Compass className="h-4 w-4" />
              Reset North
            </button>
            <button
              onClick={() =>
                map?.flyTo({
                  center: NIGERIA_COORDINATES,
                  zoom: 6,
                  duration: 2000
                })
              }
              disabled={!isLoaded}
              className="flex items-center justify-center gap-2 p-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <Home className="h-4 w-4" />
              Home View
            </button>
          </div>
        </div>

        {/* Search Results */}
        {currentSearchResults && currentSearchResults.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Search Results ({currentSearchResults.length})
            </label>
            <SearchResultsPanel
              searchResults={currentSearchResults}
              onLocationClick={handleLocationSelect}
            />
          </div>
        )}

        {/* Help Text */}
        <div className="text-xs text-gray-500 pt-2 border-t border-gray-100">
          <p>
            Use the floating buttons on the map for more actions like locate me
            and fullscreen.
          </p>
        </div>
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
  const [activeStyleId, setActiveStyleId] = useState(() => {
    if (typeof window === "undefined") return ""
    return localStorage.getItem("mapActiveStyleId") || ""
  })
  const [currentSearchResults, setCurrentSearchResults] = useState<
    GeocodingFeature[]
  >(searchResults || [])
  const validatedStyles = getAvailableMapStyles()
  const eventManagerRef = useRef<MapEventManager>(new MapEventManager())
  const router = useRouter()
  const pathname = usePathname()

  // Responsive detection (mobile screens under 1024px)
  const [isMobile, setIsMobile] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  useEffect(() => {
    const updateScreen = () => {
      if (typeof window !== "undefined") {
        setIsMobile(window.innerWidth < 1024)
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
        setReducedMotion(mq.matches)
      }
    }
    updateScreen()
    if (typeof window !== "undefined") {
      window.addEventListener("resize", updateScreen)
      return () => window.removeEventListener("resize", updateScreen)
    }
  }, [])

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("mapSidebarCollapsed") === "1"
    }
    return false
  })

  const [showDrawingTools, setShowDrawingTools] = useState(false)

  // Sync incoming `searchResults` prop to local state **only** when it changes in
  // a meaningful way. This prevents an infinite state update loop that occurred
  // when `searchResults` was `undefined` (no search) – the previous logic kept
  // writing a new empty array (`[]`) to state on every render, triggering the
  // "Maximum update depth exceeded" error.
  useEffect(() => {
    // Case 1: new search results provided
    if (searchResults && searchResults !== currentSearchResults) {
      setCurrentSearchResults(searchResults)

      // Auto-fly to the first result for a fresh search
      if (map && isLoaded && searchResults.length > 0) {
        const firstResult = searchResults[0]
        map.flyTo({
          center: firstResult.center,
          zoom: 13,
          duration: reducedMotion ? 0 : 1500,
          essential: true,
          easing: t => t * t * (3 - 2 * t)
        })
      }
      return
    }

    // Case 2: search cleared – only reset when we currently have results
    if (!searchResults && currentSearchResults.length > 0) {
      setCurrentSearchResults([])
    }
  }, [searchResults, currentSearchResults, map, isLoaded])

  // Handle initial center and zoom when map loads
  useEffect(() => {
    if (map && isLoaded) {
      // Apply bbox_* query params if present
      const url =
        typeof window !== "undefined" ? new URL(window.location.href) : null
      const bn = url?.searchParams.get("bbox_north")
      const bs = url?.searchParams.get("bbox_south")
      const be = url?.searchParams.get("bbox_east")
      const bw = url?.searchParams.get("bbox_west")
      if (bn && bs && be && bw) {
        const north = parseFloat(bn)
        const south = parseFloat(bs)
        const east = parseFloat(be)
        const west = parseFloat(bw)
        if (
          !Number.isNaN(north) &&
          !Number.isNaN(south) &&
          !Number.isNaN(east) &&
          !Number.isNaN(west) &&
          north > south &&
          east > west
        ) {
          map.fitBounds(
            [
              [west, south],
              [east, north]
            ],
            { padding: 40, duration: reducedMotion ? 0 : 600 }
          )
          return
        }
      }

      // Restore persisted view if available
      const stored =
        typeof window !== "undefined"
          ? localStorage.getItem("mapViewState")
          : null
      if (stored) {
        try {
          const { center, zoom, bearing, pitch } = JSON.parse(stored) as {
            center: [number, number]
            zoom: number
            bearing: number
            pitch: number
          }
          map.jumpTo({ center, zoom, bearing, pitch })
          return
        } catch {}
      }
      if (initialCenter) {
        map.flyTo({
          center: initialCenter,
          zoom: initialZoom || 6,
          duration: reducedMotion ? 0 : 1000
        })
      }
    }
  }, [map, isLoaded, initialCenter, initialZoom, reducedMotion])

  const handleMapLoad = useCallback((mapInstance: Map) => {
    setMap(mapInstance)
    setIsLoaded(true)

    // Add metric scale control bottom-left
    const scale = new ScaleControl({ maxWidth: 120, unit: "metric" })
    mapInstance.addControl(scale, "bottom-left")

    // Set initial style ID from the map
    const currentStyle = mapInstance.getStyle()
    if (currentStyle) {
      // Use name if available, otherwise fall back to the style id field.
      const derivedId =
        (currentStyle as any).name || (currentStyle as any).id || ""
      setActiveStyleId(derivedId)
    }

    // MapView controls are handled via props, not manually here
  }, [])

  // Persist map view on move/end
  useEffect(() => {
    if (!map) return
    const persist = () => {
      const center = map.getCenter()
      const view = {
        center: [center.lng, center.lat] as [number, number],
        zoom: map.getZoom(),
        bearing: map.getBearing(),
        pitch: map.getPitch()
      }
      if (typeof window !== "undefined") {
        localStorage.setItem("mapViewState", JSON.stringify(view))
      }
    }
    map.on("moveend", persist)
    return () => {
      map.off("moveend", persist)
    }
  }, [map])

  // Debounce style switching to avoid hammering the CDN when users click rapidly.
  const styleChangeTimeout = useRef<NodeJS.Timeout | null>(null)

  const handleStyleChange = useCallback(
    (styleId: string) => {
      // Clear previous pending change
      if (styleChangeTimeout.current) {
        clearTimeout(styleChangeTimeout.current)
      }

      styleChangeTimeout.current = setTimeout(() => {
        setActiveStyleId(styleId)
        if (typeof window !== "undefined") {
          localStorage.setItem("mapActiveStyleId", styleId)
        }

        if (map && isLoaded) {
          const selectedStyle = validatedStyles.find(s => s.id === styleId)
          if (selectedStyle?.url) {
            try {
              map.setStyle(selectedStyle.url)
              toast.success(`Map style changed to ${selectedStyle.name}`)
            } catch (error) {
              console.error("Failed to change map style:", error)
              toast.error("Failed to change map style")
            }
          }
        }
      }, 400) // 400 ms debounce
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

  // Clear user location markers
  const clearUserLocationMarkers = useCallback(() => {
    if (map) {
      const existingUserMarkers = document.querySelectorAll(
        ".user-location-marker"
      )
      existingUserMarkers.forEach(marker => {
        const mapMarker = (marker as any).__maplibreMarker
        if (mapMarker) {
          mapMarker.remove()
        }
      })
    }
  }, [map])

  // Helper to update URL params without full page refresh
  const updateUrlParams = useCallback(
    (params: Record<string, string | undefined>) => {
      const url = new URL(window.location.href)
      Object.entries(params).forEach(([key, value]) => {
        if (value === undefined) {
          url.searchParams.delete(key)
        } else {
          url.searchParams.set(key, value)
        }
      })

      router.replace(`${pathname}?${url.searchParams.toString()}`, {
        scroll: false
      })
    },
    [router, pathname]
  )

  // Handle search from MapSearchInput component
  const handleLocationSelect = useCallback(
    (location: GeocodingFeature) => {
      // Clear any existing user location markers when searching for new locations
      clearUserLocationMarkers()

      // Always show only the selected location
      setCurrentSearchResults([location])
      if (map) {
        map.flyTo({
          center: location.center,
          zoom: 13,
          duration: reducedMotion ? 0 : 1500,
          essential: true,
          easing: t => t * t * (3 - 2 * t)
        })
      }

      // Update URL params so other components react without refresh
      const [lng, lat] = location.center
      updateUrlParams({
        location: location.place_name,
        center: `${lng},${lat}`,
        search: location.place_name,
        zoom: "13"
      })
    },
    [map, clearUserLocationMarkers, updateUrlParams, reducedMotion]
  )

  // Handle search query from MapSearchInput
  const handleSearchQuery = useCallback(
    (searchTerm: string) => {
      // Clear user location markers when starting a new search
      clearUserLocationMarkers()
      // Note: The actual search logic is handled inside MapSearchInput component
      console.log("Search query:", searchTerm)
    },
    [clearUserLocationMarkers]
  )

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

        // Auto-show popup for highlighted location (with delay for proper loading)
        if (
          highlightedLocation &&
          location.place_name === highlightedLocation &&
          index === 0
        ) {
          // Delay popup showing to ensure map and sidebar are fully rendered
          setTimeout(() => {
            if (map && map.loaded()) {
              showPopup()
            }
          }, 1000) // 1 second delay to ensure everything is loaded
        }
      })
    }
  }, [map, isLoaded, currentSearchResults, highlightedLocation])

  // Cleanup event listeners on unmount
  useEffect(() => {
    return () => {
      eventManagerRef.current.cleanup()
    }
  }, [])

  // Cleanup styleChangeTimeout on unmount
  useEffect(() => {
    return () => {
      if (styleChangeTimeout.current) {
        clearTimeout(styleChangeTimeout.current)
      }
    }
  }, [])

  const handleMapError = (error: Error) => {
    console.error("Map error:", error)
    toast.error("Map error occurred", {
      description: error.message,
      duration: 4000
    })
  }

  const toggleSidebar = () => {
    setSidebarCollapsed(prev => {
      const next = !prev
      if (typeof window !== "undefined") {
        localStorage.setItem("mapSidebarCollapsed", next ? "1" : "0")
      }
      return next
    })
  }

  // Clear search results function
  const clearSearchResults = useCallback(() => {
    setCurrentSearchResults([])
  }, [])

  return (
    <div className="flex h-full bg-gray-50 gap-4">
      {/* Location Header Overlay */}
      <MapHeaderOverlay
        currentSearchResults={currentSearchResults}
        highlightedLocation={highlightedLocation}
      />

      {/* Desktop Sidebar */}
      <div
        className={`hidden lg:flex lg:flex-col bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden relative z-10 transition-all duration-300 ${sidebarCollapsed ? "w-0 opacity-0" : "w-80"}`}
      >
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
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
        {/* Collapse Toggle - only show when sidebar is visible */}
        {!sidebarCollapsed && (
          <button
            onClick={toggleSidebar}
            className="absolute -right-3 top-1/2 transform -translate-y-1/2 w-6 h-12 bg-white border border-gray-200 shadow-md flex items-center justify-center rounded-r-md hover:bg-gray-50 transition-colors"
            aria-label="Hide sidebar"
          >
            <ChevronsLeft className="h-4 w-4 text-gray-600" />
          </button>
        )}
      </div>

      {/* Mobile Drawer Trigger */}
      {isMobile && (
        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DrawerTrigger asChild>
            <Button
              size="icon"
              variant="secondary"
              className="fixed bottom-4 left-4 z-20 rounded-full shadow-lg lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </DrawerTrigger>
          <DrawerContent className="h-[85vh] p-0 overflow-hidden">
            <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
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
          </DrawerContent>
        </Drawer>
      )}

      {/* Map Container */}
      <div className="flex-1 relative overflow-hidden rounded-lg shadow-lg">
        <MapErrorBoundary onError={handleMapError}>
          <MapView
            initialOptions={{
              center: initialCenter,
              zoom: initialZoom
            }}
            initialStyleId={activeStyleId || validatedStyles[0]?.id}
            onMapLoad={handleMapLoad}
            onStyleChange={setActiveStyleId}
            className="w-full h-full"
            showControls={false}
          />
        </MapErrorBoundary>

        {map && isLoaded && showDrawingTools && (
          <MapDrawingTools map={map} className="pointer-events-auto" />
        )}

        {/* Toggle Drawing Tools */}
        <div className="absolute top-4 right-4 z-30">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setShowDrawingTools(v => !v)}
          >
            {showDrawingTools ? "Hide" : "Show"} Drawing Tools
          </Button>
        </div>
      </div>

      {/* Floating Action Buttons */}
      <MapFabGroup
        map={map}
        isMobile={isMobile}
        onToggleDrawer={() => setDrawerOpen(open => !open)}
        drawerOpen={drawerOpen}
        onClearSearchResults={clearSearchResults}
        onToggleSidebar={toggleSidebar}
        sidebarCollapsed={sidebarCollapsed}
      />
    </div>
  )
}

export default memo(MapWrapper)
