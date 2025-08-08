"use client"

import React, { memo, useCallback, useEffect, useState, useRef } from "react"
import {
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  Settings,
  Info,
  Keyboard,
  MousePointer
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import type { Map } from "maplibre-gl"

interface MapAccessibilityProps {
  map: Map | null
  className?: string
}

interface AccessibilitySettings {
  highContrast: boolean
  reducedMotion: boolean
  keyboardNavigation: boolean
  screenReaderMode: boolean
  audioFeedback: boolean
  focusIndicators: boolean
  simplifiedUI: boolean
  textSize: number
  announceChanges: boolean
}

const defaultSettings: AccessibilitySettings = {
  highContrast: false,
  reducedMotion: false,
  keyboardNavigation: true,
  screenReaderMode: false,
  audioFeedback: false,
  focusIndicators: true,
  simplifiedUI: false,
  textSize: 100,
  announceChanges: true
}

const MapAccessibility = memo(function MapAccessibility({
  map,
  className = ""
}: MapAccessibilityProps) {
  const [settings, setSettings] =
    useState<AccessibilitySettings>(defaultSettings)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const announcementRef = useRef<HTMLDivElement>(null)
  const lastAnnouncementRef = useRef<string>("")

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem("map-accessibility-settings")
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings)
        setSettings(prev => ({ ...prev, ...parsed }))
      }
    } catch (error) {
      console.warn("Failed to load accessibility settings:", error)
    }
  }, [])

  // Save settings to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem(
        "map-accessibility-settings",
        JSON.stringify(settings)
      )
    } catch (error) {
      console.warn("Failed to save accessibility settings:", error)
    }
  }, [settings])

  // Apply settings to map container (scoped) and avoid global document side effects
  useEffect(() => {
    if (!map) return

    const mapContainer = map.getContainer()
    if (!mapContainer) return

    // High contrast mode (scoped)
    mapContainer.style.filter = settings.highContrast
      ? "contrast(150%) brightness(110%)"
      : ""

    // Reduced motion (scoped to map only)
    try {
      if (settings.reducedMotion) {
        map.setLayoutProperty("*", "transition", { duration: 0 })
      }
    } catch {}

    // Text size (scoped via CSS variable on map container)
    mapContainer.style.setProperty("--map-text-scale", `${settings.textSize}%`)
    mapContainer.dataset.focusIndicators = settings.focusIndicators ? "1" : "0"
    mapContainer.dataset.simplifiedUi = settings.simplifiedUI ? "1" : "0"
  }, [map, settings])

  // Keyboard navigation setup
  useEffect(() => {
    if (!map || !settings.keyboardNavigation) return

    const mapContainer = map.getContainer()
    if (!mapContainer) return

    // Make map focusable
    mapContainer.setAttribute("tabindex", "0")
    mapContainer.setAttribute("role", "application")
    mapContainer.setAttribute(
      "aria-label",
      "Interactive map of Nigeria. Use arrow keys to pan, plus/minus to zoom."
    )

    const handleKeyDown = (e: KeyboardEvent) => {
      const step = e.shiftKey ? 50 : 20
      const zoomStep = e.shiftKey ? 2 : 1

      switch (e.key) {
        case "ArrowUp":
          e.preventDefault()
          map.panBy([0, -step])
          announceChange("Panned up")
          break
        case "ArrowDown":
          e.preventDefault()
          map.panBy([0, step])
          announceChange("Panned down")
          break
        case "ArrowLeft":
          e.preventDefault()
          map.panBy([-step, 0])
          announceChange("Panned left")
          break
        case "ArrowRight":
          e.preventDefault()
          map.panBy([step, 0])
          announceChange("Panned right")
          break
        case "=":
        case "+":
          e.preventDefault()
          map.zoomTo(map.getZoom() + zoomStep)
          announceChange(`Zoomed in to level ${Math.round(map.getZoom())}`)
          break
        case "-":
          e.preventDefault()
          map.zoomTo(map.getZoom() - zoomStep)
          announceChange(`Zoomed out to level ${Math.round(map.getZoom())}`)
          break
        case "Home":
          e.preventDefault()
          map.fitBounds([
            [2.6, 4.3], // Southwest
            [14.6, 13.9] // Northeast
          ])
          announceChange("Returned to default view of Nigeria")
          break
        case "?":
          e.preventDefault()
          setIsDialogOpen(true)
          break
      }
    }

    mapContainer.addEventListener("keydown", handleKeyDown)
    return () => mapContainer.removeEventListener("keydown", handleKeyDown)
  }, [map, settings.keyboardNavigation])

  // Screen reader announcements
  const announceChange = useCallback(
    (message: string) => {
      if (!settings.announceChanges || !announcementRef.current) return

      // Avoid duplicate announcements
      if (lastAnnouncementRef.current === message) return
      lastAnnouncementRef.current = message

      // Clear and set new announcement
      announcementRef.current.textContent = ""
      setTimeout(() => {
        if (announcementRef.current) {
          announcementRef.current.textContent = message
        }
      }, 100)

      // Audio feedback if enabled
      if (settings.audioFeedback) {
        // Simple audio feedback using Web Audio API
        try {
          const audioContext = new (window.AudioContext ||
            (window as any).webkitAudioContext)()
          const oscillator = audioContext.createOscillator()
          const gainNode = audioContext.createGain()

          oscillator.connect(gainNode)
          gainNode.connect(audioContext.destination)

          oscillator.frequency.value = 800
          oscillator.type = "sine"
          gainNode.gain.value = 0.1

          oscillator.start()
          oscillator.stop(audioContext.currentTime + 0.1)
        } catch (error) {
          // Audio feedback not available
        }
      }
    },
    [settings.announceChanges, settings.audioFeedback]
  )

  const updateSetting = useCallback(
    <K extends keyof AccessibilitySettings>(
      key: K,
      value: AccessibilitySettings[K]
    ) => {
      setSettings(prev => ({ ...prev, [key]: value }))
    },
    []
  )

  const resetSettings = useCallback(() => {
    setSettings(defaultSettings)
    announceChange("Accessibility settings reset to defaults")
  }, [announceChange])

  return (
    <TooltipProvider>
      <div className={`map-accessibility ${className}`}>
        {/* Screen reader announcements */}
        <div
          ref={announcementRef}
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        />

        {/* Accessibility control button */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              className="absolute top-4 left-4 z-20 bg-white/95 backdrop-blur-sm"
              aria-label="Open accessibility settings"
            >
              <Settings className="h-4 w-4 mr-2" />
              Accessibility
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Map Accessibility Settings</DialogTitle>
              <DialogDescription>
                Customize the map interface to meet your accessibility needs.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Visual Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Visual Settings
                  </CardTitle>
                  <CardDescription>
                    Adjust visual appearance for better visibility
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label
                        htmlFor="high-contrast"
                        className="text-sm font-medium"
                      >
                        High Contrast Mode
                      </label>
                      <p className="text-xs text-muted-foreground">
                        Increase contrast for better visibility
                      </p>
                    </div>
                    <Switch
                      id="high-contrast"
                      checked={settings.highContrast}
                      onCheckedChange={checked =>
                        updateSetting("highContrast", checked)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="text-size" className="text-sm font-medium">
                      Text Size: {settings.textSize}%
                    </label>
                    <Slider
                      id="text-size"
                      value={[settings.textSize]}
                      onValueChange={([value]: number[]) =>
                        updateSetting("textSize", value)
                      }
                      min={75}
                      max={150}
                      step={5}
                      className="w-full"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label
                        htmlFor="focus-indicators"
                        className="text-sm font-medium"
                      >
                        Enhanced Focus Indicators
                      </label>
                      <p className="text-xs text-muted-foreground">
                        Show clear focus outlines for keyboard navigation
                      </p>
                    </div>
                    <Switch
                      id="focus-indicators"
                      checked={settings.focusIndicators}
                      onCheckedChange={checked =>
                        updateSetting("focusIndicators", checked)
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Motion Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MousePointer className="h-4 w-4" />
                    Motion & Animation
                  </CardTitle>
                  <CardDescription>
                    Control motion and animation preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label
                        htmlFor="reduced-motion"
                        className="text-sm font-medium"
                      >
                        Reduced Motion
                      </label>
                      <p className="text-xs text-muted-foreground">
                        Minimize animations and transitions
                      </p>
                    </div>
                    <Switch
                      id="reduced-motion"
                      checked={settings.reducedMotion}
                      onCheckedChange={checked =>
                        updateSetting("reducedMotion", checked)
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Navigation Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Keyboard className="h-4 w-4" />
                    Navigation
                  </CardTitle>
                  <CardDescription>
                    Configure navigation methods
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label
                        htmlFor="keyboard-navigation"
                        className="text-sm font-medium"
                      >
                        Keyboard Navigation
                      </label>
                      <p className="text-xs text-muted-foreground">
                        Enable arrow keys to pan, +/- to zoom
                      </p>
                    </div>
                    <Switch
                      id="keyboard-navigation"
                      checked={settings.keyboardNavigation}
                      onCheckedChange={checked =>
                        updateSetting("keyboardNavigation", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label
                        htmlFor="simplified-ui"
                        className="text-sm font-medium"
                      >
                        Simplified Interface
                      </label>
                      <p className="text-xs text-muted-foreground">
                        Reduce visual clutter and complexity
                      </p>
                    </div>
                    <Switch
                      id="simplified-ui"
                      checked={settings.simplifiedUI}
                      onCheckedChange={checked =>
                        updateSetting("simplifiedUI", checked)
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Audio Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Volume2 className="h-4 w-4" />
                    Audio & Announcements
                  </CardTitle>
                  <CardDescription>
                    Configure audio feedback and screen reader support
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label
                        htmlFor="announce-changes"
                        className="text-sm font-medium"
                      >
                        Announce Map Changes
                      </label>
                      <p className="text-xs text-muted-foreground">
                        Screen reader announcements for map interactions
                      </p>
                    </div>
                    <Switch
                      id="announce-changes"
                      checked={settings.announceChanges}
                      onCheckedChange={checked =>
                        updateSetting("announceChanges", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label
                        htmlFor="audio-feedback"
                        className="text-sm font-medium"
                      >
                        Audio Feedback
                      </label>
                      <p className="text-xs text-muted-foreground">
                        Sound effects for map interactions
                      </p>
                    </div>
                    <Switch
                      id="audio-feedback"
                      checked={settings.audioFeedback}
                      onCheckedChange={checked =>
                        updateSetting("audioFeedback", checked)
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Keyboard Shortcuts Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Keyboard Shortcuts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Arrow Keys:</strong> Pan map
                    </div>
                    <div>
                      <strong>+/-:</strong> Zoom in/out
                    </div>
                    <div>
                      <strong>Home:</strong> Return to Nigeria view
                    </div>
                    <div>
                      <strong>?:</strong> Open this dialog
                    </div>
                    <div>
                      <strong>Shift + Arrow:</strong> Pan faster
                    </div>
                    <div>
                      <strong>Shift + +/-:</strong> Zoom faster
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Separator />

              {/* Reset button */}
              <div className="flex justify-between items-center">
                <Button variant="outline" onClick={resetSettings}>
                  Reset to Defaults
                </Button>
                <Button onClick={() => setIsDialogOpen(false)}>
                  Save & Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
})

export default MapAccessibility
