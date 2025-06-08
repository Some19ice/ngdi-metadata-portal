"use client"

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect
} from "react"
import { Map } from "maplibre-gl"
import { MapStyle } from "@/components/ui/map/map-view"
import { getAvailableMapStyles } from "@/lib/map-config"
import { toast } from "sonner"

interface MapContextType {
  map: Map | null
  isLoaded: boolean
  activeStyleId: string
  validatedStyles: MapStyle[]
  isStyleChanging: boolean
  handleStyleChange: (styleId: string) => void
  setMap: (map: Map | null) => void
  setIsLoaded: (isLoaded: boolean) => void
  setActiveStyleId: (styleId: string) => void
}

const MapContext = createContext<MapContextType | undefined>(undefined)

export function useMapContext() {
  const context = useContext(MapContext)
  if (context === undefined) {
    throw new Error("useMapContext must be used within a MapProvider")
  }
  return context
}

// Debounce utility for style changes
function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): T {
  let timeout: NodeJS.Timeout | null = null
  return ((...args: any[]) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func.apply(null, args), wait)
  }) as T
}

export function MapProvider({ children }: { children: React.ReactNode }) {
  const [map, setMap] = useState<Map | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [activeStyleId, setActiveStyleId] = useState("")
  const [isStyleChanging, setIsStyleChanging] = useState(false)
  const validatedStyles = getAvailableMapStyles()

  // Track current style change to prevent race conditions
  const currentStyleChangeRef = useRef<string | null>(null)
  const styleChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (styleChangeTimeoutRef.current) {
        clearTimeout(styleChangeTimeoutRef.current)
      }
    }
  }, [])

  const handleStyleChangeInternal = useCallback(
    async (styleId: string) => {
      // Prevent concurrent style changes
      if (isStyleChanging || currentStyleChangeRef.current === styleId) {
        return
      }

      if (!map) {
        console.warn("Cannot change style: map not initialized")
        return
      }

      const style = validatedStyles.find(s => s.id === styleId)
      if (!style?.url) {
        console.warn(`Style not found: ${styleId}`)
        toast.error("Style not found")
        return
      }

      try {
        setIsStyleChanging(true)
        currentStyleChangeRef.current = styleId

        // Wait for any pending operations to complete
        if (map.isStyleLoaded && !map.isStyleLoaded()) {
          // Wait for current style to finish loading
          await new Promise<void>(resolve => {
            const checkStyle = () => {
              if (map.isStyleLoaded()) {
                resolve()
              } else {
                setTimeout(checkStyle, 100)
              }
            }
            checkStyle()
          })
        }

        // Proceed with style change
        map.setStyle(style.url)

        // Wait for new style to load
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error("Style load timeout"))
          }, 10000) // 10 second timeout

          const onStyleLoad = () => {
            clearTimeout(timeout)
            map.off("styledata", onStyleLoad)
            map.off("error", onError)
            resolve()
          }

          const onError = (error: any) => {
            clearTimeout(timeout)
            map.off("styledata", onStyleLoad)
            map.off("error", onError)
            reject(error)
          }

          map.on("styledata", onStyleLoad)
          map.on("error", onError)
        })

        // Update state only if this is still the current style change
        if (currentStyleChangeRef.current === styleId) {
          setActiveStyleId(styleId)
          toast.success(`Switched to ${style.name} style`)
        }
      } catch (error) {
        console.error("Error changing map style:", error)

        // Only show error if this was the most recent style change
        if (currentStyleChangeRef.current === styleId) {
          toast.error(`Failed to switch to ${style.name} style`)
        }
      } finally {
        // Clean up only if this was the most recent style change
        if (currentStyleChangeRef.current === styleId) {
          setIsStyleChanging(false)
          currentStyleChangeRef.current = null
        }
      }
    },
    [map, validatedStyles, isStyleChanging]
  )

  // Debounced style change to prevent rapid successive calls
  const handleStyleChange = useCallback(
    debounce(handleStyleChangeInternal, 300),
    [handleStyleChangeInternal]
  )

  // Reset style changing state when map changes
  useEffect(() => {
    if (!map) {
      setIsStyleChanging(false)
      currentStyleChangeRef.current = null
    }
  }, [map])

  return (
    <MapContext.Provider
      value={{
        map,
        isLoaded,
        activeStyleId,
        validatedStyles,
        isStyleChanging,
        handleStyleChange,
        setMap,
        setIsLoaded,
        setActiveStyleId
      }}
    >
      {children}
    </MapContext.Provider>
  )
}
