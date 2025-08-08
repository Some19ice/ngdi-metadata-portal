"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import {
  Crosshair,
  Copy,
  Expand,
  Minimize,
  PanelLeftClose,
  PanelLeftOpen,
  Loader2,
  RotateCcw,
  Compass,
  Layers,
  Ruler,
  Navigation,
  MapPin,
  Download,
  Share2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider
} from "@/components/ui/tooltip"
import { toast } from "sonner"
import { Map, Marker } from "maplibre-gl"
import { createSafeSearchMarker } from "@/lib/map-security"

interface MapFabGroupProps {
  map: Map | null
  isMobile: boolean
  onToggleDrawer?: () => void
  drawerOpen?: boolean
  onClearSearchResults?: () => void
  onToggleSidebar?: () => void
  sidebarCollapsed?: boolean
}

export default function MapFabGroup({
  map,
  isMobile,
  onToggleDrawer,
  drawerOpen,
  onClearSearchResults,
  onToggleSidebar,
  sidebarCollapsed
}: MapFabGroupProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [locating, setLocating] = useState(false)
  const [isGroupExpanded, setIsGroupExpanded] = useState(false)
  const [bearingNorth, setBearingNorth] = useState(0)
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const handler = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener("fullscreenchange", handler)
    return () => document.removeEventListener("fullscreenchange", handler)
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const listener = () => setReducedMotion(mq.matches)
    listener()
    mq.addEventListener?.("change", listener)
    return () => mq.removeEventListener?.("change", listener)
  }, [])

  // Track map bearing for compass with throttling
  const bearingUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const updateBearing = useCallback(() => {
    if (!map) return
    // Throttle bearing updates to prevent excessive re-renders
    if (bearingUpdateTimeoutRef.current) {
      clearTimeout(bearingUpdateTimeoutRef.current)
    }
    bearingUpdateTimeoutRef.current = setTimeout(() => {
      const bearing = Math.round(map.getBearing())
      setBearingNorth(prev => (prev !== bearing ? bearing : prev))
    }, 100) // Update at most every 100ms
  }, [map])

  useEffect(() => {
    if (!map) return
    map.on("rotate", updateBearing)
    // Set initial bearing
    updateBearing()
    return () => {
      map.off("rotate", updateBearing)
      if (bearingUpdateTimeoutRef.current) {
        clearTimeout(bearingUpdateTimeoutRef.current)
      }
    }
  }, [map])

  const copyCenter = useCallback(() => {
    if (!map) return
    const center = map.getCenter()
    const zoom = map.getZoom()
    const coords = `${center.lat.toFixed(6)}, ${center.lng.toFixed(6)}`
    navigator.clipboard.writeText(coords)
    toast.success("Coordinates copied", {
      description: `📍 ${coords} (zoom: ${zoom.toFixed(1)})`
    })
  }, [map])

  const locateUser = useCallback(() => {
    if (!map || locating) return

    setLocating(true)
    onClearSearchResults?.()

    navigator.geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude } = position.coords

        // Remove existing user location markers
        const existingUserMarkers = document.querySelectorAll(
          ".user-location-marker"
        )
        existingUserMarkers.forEach(marker => {
          const mapMarker = (marker as any).__maplibreMarker
          if (mapMarker) {
            mapMarker.remove()
          }
          marker.remove()
        })

        // Create new marker
        const locationMarker = createSafeSearchMarker(0, "Your Location", [
          longitude,
          latitude
        ])

        locationMarker.classList.add("user-location-marker")

        const markerHead = locationMarker.querySelector(".search-marker-head")
        if (markerHead) {
          markerHead.classList.remove("bg-blue-600")
          markerHead.classList.add("bg-green-600")
          markerHead.textContent = "📍"
        }

        const markerTail = locationMarker.querySelector(".search-marker-tail")
        if (markerTail instanceof HTMLElement) {
          markerTail.style.borderTopColor = "#16a34a"
        }

        const markerPulse = locationMarker.querySelector(".search-marker-pulse")
        if (markerPulse) {
          markerPulse.classList.remove("bg-blue-600/30")
          markerPulse.classList.add("bg-green-600/30")
        }

        const mapMarker = new Marker({ element: locationMarker })
          .setLngLat([longitude, latitude])
          .addTo(map)

        ;(locationMarker as any).__maplibreMarker = mapMarker

        map.flyTo({
          center: [longitude, latitude],
          zoom: 15,
          duration: reducedMotion ? 0 : 2500,
          essential: true,
          easing: t => {
            return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
          }
        })

        setLocating(false)
        toast.success("Location found", {
          description: `📍 ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
        })
      },
      error => {
        setLocating(false)
        let message = "Unable to get your location"
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = "Location access denied"
            break
          case error.POSITION_UNAVAILABLE:
            message = "Location information unavailable"
            break
          case error.TIMEOUT:
            message = "Location request timed out"
            break
        }
        toast.error(message)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    )
  }, [map, locating, onClearSearchResults])

  const toggleFullscreen = useCallback(() => {
    if (!map) return
    const container = map.getContainer()
    if (!document.fullscreenElement) {
      container.requestFullscreen().catch(() => {
        toast.error("Failed to enter full screen")
      })
    } else {
      document.exitFullscreen().catch(() => {
        toast.error("Failed to exit full screen")
      })
    }
  }, [map])

  const resetMapBearing = useCallback(() => {
    if (!map) return
    map.easeTo({
      bearing: 0,
      pitch: 0,
      duration: 1000
    })
    toast.success("Map reset to north")
  }, [map])

  const refreshMap = useCallback(() => {
    if (!map) return
    map.getStyle()
    toast.success("Map refreshed")
  }, [map])

  const shareLocation = useCallback(() => {
    if (!map) return
    const center = map.getCenter()
    const zoom = map.getZoom()
    const url = `${window.location.origin}/map?center=${center.lng.toFixed(6)},${center.lat.toFixed(6)}&zoom=${zoom.toFixed(1)}`

    if (navigator.share) {
      navigator
        .share({
          title: "Map Location",
          text: "Check out this location",
          url
        })
        .catch(() => {
          navigator.clipboard.writeText(url)
          toast.success("Location URL copied to clipboard")
        })
    } else {
      navigator.clipboard.writeText(url)
      toast.success("Location URL copied to clipboard")
    }
  }, [map])

  const downloadMapView = useCallback(() => {
    if (!map) return
    const canvas = map.getCanvas()
    const link = document.createElement("a")
    link.download = `map-${Date.now()}.png`
    link.href = canvas.toDataURL()
    link.click()
    toast.success("Map screenshot downloaded")
  }, [map])

  // Enhanced FAB styling with glass morphism effect
  const primaryFabClass =
    "w-12 h-12 rounded-full backdrop-blur-md bg-white/90 hover:bg-white shadow-lg hover:shadow-xl ring-1 ring-black/10 hover:ring-black/20 transition-all duration-200 transform hover:scale-105"
  const secondaryFabClass =
    "w-10 h-10 rounded-full backdrop-blur-md bg-white/80 hover:bg-white/90 shadow-md hover:shadow-lg ring-1 ring-black/5 hover:ring-black/10 transition-all duration-200 transform hover:scale-105"

  // Stable toggler to avoid triggering re-renders when spread into memoized arrays
  const toggleGroupExpanded = useCallback(() => {
    // Functional update ensures we always toggle based on latest state
    setIsGroupExpanded(prev => !prev)
  }, [])

  const primaryTools = useMemo(
    () => [
      {
        icon: locating ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Crosshair className="h-5 w-5" />
        ),
        onClick: locateUser,
        tooltip: "Locate me",
        disabled: locating,
        variant: "primary" as const
      },
      {
        icon: isGroupExpanded ? (
          <Minimize className="h-4 w-4" />
        ) : (
          <Layers className="h-4 w-4" />
        ),
        onClick: toggleGroupExpanded,
        tooltip: isGroupExpanded ? "Show less tools" : "Show more tools",
        variant: "primary" as const
      }
    ],
    [locating, isGroupExpanded]
  )

  const secondaryTools = useMemo(
    () => [
      {
        icon: <Copy className="h-4 w-4" />,
        onClick: copyCenter,
        tooltip: "Copy coordinates"
      },
      {
        icon: isFullscreen ? (
          <Minimize className="h-4 w-4" />
        ) : (
          <Expand className="h-4 w-4" />
        ),
        onClick: toggleFullscreen,
        tooltip: isFullscreen ? "Exit full screen" : "Full screen"
      },
      {
        icon: (
          <Compass
            className="h-4 w-4"
            style={{ transform: `rotate(${bearingNorth}deg)` }}
          />
        ),
        onClick: resetMapBearing,
        tooltip: bearingNorth === 0 ? "North aligned" : "Reset to north"
      },
      {
        icon: <RotateCcw className="h-4 w-4" />,
        onClick: refreshMap,
        tooltip: "Refresh map"
      },
      {
        icon: <Share2 className="h-4 w-4" />,
        onClick: shareLocation,
        tooltip: "Share location"
      },
      {
        icon: <Download className="h-4 w-4" />,
        onClick: downloadMapView,
        tooltip: "Download screenshot"
      }
    ],
    [isFullscreen, bearingNorth]
  )

  return (
    <TooltipProvider delayDuration={300} skipDelayDuration={0}>
      <div
        className="absolute z-20"
        style={{ bottom: isMobile ? "4rem" : "1rem", right: "1rem" }}
      >
        {/* Expanded secondary tools */}
        {isGroupExpanded && (
          <div className="flex flex-col gap-2 mb-3 animate-in slide-in-from-bottom-2 duration-300">
            {secondaryTools.map((tool, index) => (
              <Tooltip key={`secondary-${index}`} delayDuration={300}>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className={secondaryFabClass}
                    onClick={tool.onClick}
                    style={{
                      animationDelay: `${index * 50}ms`
                    }}
                  >
                    {tool.icon}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">{tool.tooltip}</TooltipContent>
              </Tooltip>
            ))}
          </div>
        )}

        {/* Primary tools always visible */}
        <div className="flex flex-col gap-3">
          {/* Mobile Drawer Toggle */}
          {onToggleDrawer && isMobile && (
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className={primaryFabClass}
                  onClick={onToggleDrawer}
                >
                  {drawerOpen ? (
                    <PanelLeftClose className="h-5 w-5" />
                  ) : (
                    <PanelLeftOpen className="h-5 w-5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                {drawerOpen ? "Close controls" : "Open controls"}
              </TooltipContent>
            </Tooltip>
          )}

          {/* Desktop Sidebar Toggle */}
          {onToggleSidebar && !isMobile && sidebarCollapsed && (
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className={primaryFabClass}
                  onClick={onToggleSidebar}
                >
                  <PanelLeftOpen className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">Show sidebar</TooltipContent>
            </Tooltip>
          )}

          {/* Primary action buttons */}
          {primaryTools.map((tool, index) => (
            <Tooltip key={`primary-${index}`} delayDuration={300}>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className={
                    tool.variant === "primary"
                      ? primaryFabClass
                      : secondaryFabClass
                  }
                  onClick={tool.onClick}
                  disabled={tool.disabled}
                >
                  {tool.icon}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">{tool.tooltip}</TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>
    </TooltipProvider>
  )
}
