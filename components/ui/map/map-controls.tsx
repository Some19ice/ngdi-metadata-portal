"use client"

import React, { useState, useCallback, useRef, useEffect } from "react"
import { Map } from "maplibre-gl"
import {
  Layers,
  ZoomIn,
  ZoomOut,
  Compass,
  Maximize2,
  Home,
  ChevronDown,
  ChevronUp,
  Search,
  MapPin,
  Navigation
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "@/components/ui/collapsible"
import { Input } from "@/components/ui/input"
import { MapStyle } from "./map-view"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { announceToScreenReader } from "@/lib/map-security"

interface MapControlsProps {
  map: Map | null
  isLoaded: boolean
  validatedStyles: MapStyle[]
  activeStyleId: string
  handleStyleChange: (styleId: string) => void
  showLocationSearch?: boolean
  showResetNorth?: boolean
  showResetView?: boolean
  showFullscreen?: boolean
  className?: string
}

const MapControls = React.memo(function MapControls({
  map,
  isLoaded,
  validatedStyles,
  activeStyleId,
  handleStyleChange,
  showLocationSearch = true,
  showResetNorth = true,
  showResetView = true,
  showFullscreen = true,
  className
}: MapControlsProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const controlsRef = useRef<HTMLDivElement>(null)
  const updateUrlToCurrentView = useCallback(() => {
    if (!map) return
    const center = map.getCenter()
    const zoom = map.getZoom()
    const bearing = map.getBearing()
    const pitch = map.getPitch()
    const url = new URL(window.location.href)
    url.searchParams.set(
      "center",
      `${center.lng.toFixed(5)},${center.lat.toFixed(5)}`
    )
    url.searchParams.set("zoom", `${zoom.toFixed(2)}`)
    url.searchParams.set("bearing", `${Math.round(bearing)}`)
    url.searchParams.set("pitch", `${Math.round(pitch)}`)
    window.history.replaceState(
      {},
      "",
      `${url.pathname}?${url.searchParams.toString()}`
    )
  }, [map])

  const handleZoomIn = useCallback(() => {
    if (map) {
      const currentZoom = map.getZoom()
      map.zoomTo(currentZoom + 1, { duration: 300 })
      announceToScreenReader(
        `Zoomed in to level ${Math.round(currentZoom + 1)}`
      )
    }
  }, [map])

  const handleZoomOut = useCallback(() => {
    if (map) {
      const currentZoom = map.getZoom()
      map.zoomTo(currentZoom - 1, { duration: 300 })
      announceToScreenReader(
        `Zoomed out to level ${Math.round(currentZoom - 1)}`
      )
    }
  }, [map])

  const handleResetBearing = useCallback(() => {
    if (map) {
      map.rotateTo(0, { duration: 300 })
      announceToScreenReader("Map rotation reset to north")
    }
  }, [map])

  const handleResetView = useCallback(() => {
    if (map) {
      map.flyTo({
        center: [8.6753, 9.082], // Nigeria center
        zoom: 6,
        bearing: 0,
        pitch: 0,
        duration: 1000
      })
      announceToScreenReader("Map view reset to default")
    }
  }, [map])

  const handleFullscreen = useCallback(() => {
    const mapContainer = map?.getContainer()
    if (!mapContainer) return

    if (document.fullscreenElement) {
      document.exitFullscreen()
      announceToScreenReader("Exited fullscreen mode")
    } else {
      mapContainer.requestFullscreen()
      announceToScreenReader("Entered fullscreen mode")
    }
  }, [map])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!map || !isLoaded) return

      // Check if focus is within controls
      const isInControls = controlsRef.current?.contains(document.activeElement)

      // Global keyboard shortcuts (when not typing in input)
      if (!(document.activeElement instanceof HTMLInputElement)) {
        switch (e.key) {
          case "+":
          case "=":
            e.preventDefault()
            handleZoomIn()
            break
          case "-":
          case "_":
            e.preventDefault()
            handleZoomOut()
            break
          case "h":
          case "H":
            e.preventDefault()
            handleResetView()
            break
          case "n":
          case "N":
            e.preventDefault()
            handleResetBearing()
            break
          case "f":
          case "F":
            if (!e.ctrlKey && !e.metaKey) {
              e.preventDefault()
              handleFullscreen()
            }
            break
        }
      }

      // Navigation within controls
      if (isInControls && e.key === "Tab") {
        // Trap focus within expanded controls
        if (isExpanded) {
          const focusableElements = controlsRef.current?.querySelectorAll(
            'button, input, [tabindex]:not([tabindex="-1"])'
          )
          if (focusableElements && focusableElements.length > 0) {
            const firstElement = focusableElements[0] as HTMLElement
            const lastElement = focusableElements[
              focusableElements.length - 1
            ] as HTMLElement

            if (e.shiftKey && document.activeElement === firstElement) {
              e.preventDefault()
              lastElement.focus()
            } else if (!e.shiftKey && document.activeElement === lastElement) {
              e.preventDefault()
              firstElement.focus()
            }
          }
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [
    map,
    isLoaded,
    isExpanded,
    handleZoomIn,
    handleZoomOut,
    handleResetView,
    handleResetBearing,
    handleFullscreen
  ])

  const handleLocationSearch = useCallback(() => {
    if (searchQuery.trim()) {
      // This would integrate with your geocoding service
      toast.info(`Searching for: ${searchQuery}`)
      announceToScreenReader(`Searching for ${searchQuery}`)
      setSearchQuery("")
    }
  }, [searchQuery])

  const handleStyleSelect = useCallback(
    (styleId: string) => {
      handleStyleChange(styleId)
      const style = validatedStyles.find(s => s.id === styleId)
      if (style) {
        announceToScreenReader(`Map style changed to ${style.name}`)
      }
    },
    [handleStyleChange, validatedStyles]
  )

  return (
    <div
      ref={controlsRef}
      className={cn(
        "bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200",
        className
      )}
      role="toolbar"
      aria-label="Map controls"
      aria-orientation="vertical"
    >
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <div className="p-2 space-y-2">
          {/* Primary Controls - Always Visible */}
          <div
            className="flex flex-col gap-1"
            role="group"
            aria-label="Zoom controls"
          >
            <Button
              size="sm"
              variant="ghost"
              onClick={handleZoomIn}
              disabled={!isLoaded}
              className="w-full justify-start"
              title="Zoom in (Keyboard: +)"
              aria-label="Zoom in"
            >
              <ZoomIn className="h-4 w-4 mr-2" />
              Zoom In
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleZoomOut}
              disabled={!isLoaded}
              className="w-full justify-start"
              title="Zoom out (Keyboard: -)"
              aria-label="Zoom out"
            >
              <ZoomOut className="h-4 w-4 mr-2" />
              Zoom Out
            </Button>
          </div>

          <div className="h-px bg-gray-200" role="separator" />

          {/* Style Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                disabled={!isLoaded}
                className="w-full justify-start"
                aria-label="Change map style"
              >
                <Layers className="h-4 w-4 mr-2" />
                Map Style
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuLabel>Choose Style</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {validatedStyles.map(style => (
                <DropdownMenuItem
                  key={style.id}
                  onClick={() => handleStyleSelect(style.id)}
                  className={cn(
                    "cursor-pointer",
                    activeStyleId === style.id && "bg-accent"
                  )}
                  aria-current={activeStyleId === style.id ? "true" : undefined}
                >
                  <span className="flex items-center gap-2">
                    {activeStyleId === style.id && (
                      <div className="w-2 h-2 bg-primary rounded-full" />
                    )}
                    {style.name}
                  </span>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={updateUrlToCurrentView}
                disabled={!isLoaded || !map}
              >
                Update URL to current view
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <CollapsibleTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className="w-full justify-between"
              aria-expanded={isExpanded}
              aria-controls="advanced-controls"
            >
              <span className="flex items-center">
                <Navigation className="h-4 w-4 mr-2" />
                More Controls
              </span>
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
        </div>

        <CollapsibleContent id="advanced-controls">
          <div className="px-2 pb-2 space-y-2">
            <div className="h-px bg-gray-200" role="separator" />

            {/* Advanced Controls */}
            <div
              className="space-y-1"
              role="group"
              aria-label="Navigation controls"
            >
              {showResetNorth && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleResetBearing}
                  disabled={!isLoaded}
                  className="w-full justify-start"
                  title="Reset rotation (Keyboard: N)"
                  aria-label="Reset map rotation to north"
                >
                  <Compass className="h-4 w-4 mr-2" />
                  Reset North
                </Button>
              )}
              {showResetView && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleResetView}
                  disabled={!isLoaded}
                  className="w-full justify-start"
                  title="Reset view (Keyboard: H)"
                  aria-label="Reset map to default view"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Reset View
                </Button>
              )}
              {showFullscreen && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleFullscreen}
                  disabled={!isLoaded}
                  className="w-full justify-start"
                  title="Toggle fullscreen (Keyboard: F)"
                  aria-label="Toggle fullscreen mode"
                >
                  <Maximize2 className="h-4 w-4 mr-2" />
                  Fullscreen
                </Button>
              )}
            </div>

            {/* Location Search */}
            {showLocationSearch && (
              <>
                <div className="h-px bg-gray-200" role="separator" />
                <div className="space-y-2">
                  <label
                    htmlFor="map-search"
                    className="text-xs font-medium text-gray-700"
                  >
                    Search Location
                  </label>
                  <div className="flex gap-1">
                    <Input
                      id="map-search"
                      type="text"
                      placeholder="Enter location..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter") {
                          handleLocationSearch()
                        }
                      }}
                      disabled={!isLoaded}
                      className="text-xs h-8"
                      aria-label="Search for a location"
                    />
                    <Button
                      size="sm"
                      onClick={handleLocationSearch}
                      disabled={!isLoaded || !searchQuery.trim()}
                      className="h-8 px-2"
                      aria-label="Search"
                    >
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}

            {/* Keyboard Shortcuts Help */}
            <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-600">
              <p className="font-medium mb-1">Keyboard Shortcuts:</p>
              <ul className="space-y-0.5" role="list">
                <li>
                  <kbd>+</kbd> Zoom in
                </li>
                <li>
                  <kbd>-</kbd> Zoom out
                </li>
                <li>
                  <kbd>H</kbd> Home view
                </li>
                <li>
                  <kbd>N</kbd> Reset north
                </li>
                <li>
                  <kbd>F</kbd> Fullscreen
                </li>
              </ul>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
})

export default MapControls
