"use client"

import React, { createContext, useContext, useState, useCallback } from "react"
import { Map } from "maplibre-gl"
import { MapStyle } from "@/components/ui/map/map-view"
import { getAvailableMapStyles } from "@/lib/map-config"
import { toast } from "sonner"

interface MapContextType {
  map: Map | null
  isLoaded: boolean
  activeStyleId: string
  validatedStyles: MapStyle[]
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

export function MapProvider({ children }: { children: React.ReactNode }) {
  const [map, setMap] = useState<Map | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [activeStyleId, setActiveStyleId] = useState("")
  const validatedStyles = getAvailableMapStyles()

  const handleStyleChange = useCallback(
    (styleId: string) => {
      setActiveStyleId(styleId)

      if (map) {
        const style = validatedStyles.find(s => s.id === styleId)
        if (style?.url) {
          try {
            map.setStyle(style.url)
            toast.success(`Switched to ${style.name} style`)
          } catch (error) {
            console.error("Error changing map style:", error)
            toast.error(`Failed to switch to ${style.name} style`)
          }
        } else {
          console.warn(`Style not found: ${styleId}`)
          toast.error("Style not found")
        }
      }
    },
    [map, validatedStyles]
  )

  return (
    <MapContext.Provider
      value={{
        map,
        isLoaded,
        activeStyleId,
        validatedStyles,
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
