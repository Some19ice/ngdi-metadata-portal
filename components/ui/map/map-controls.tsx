"use client"

import { Map } from "maplibre-gl"
import { GeocodingFeature } from "@/types"
import MapSearchInput from "@/app/map/_components/map-search-input"
import { toast } from "sonner"
import { MapStyle } from "./map-view"

interface MapControlsProps {
  map: Map | null
  isLoaded: boolean
  validatedStyles: MapStyle[]
  activeStyleId: string
  handleStyleChange: (styleId: string) => void
  className?: string
}

export default function MapControls({
  map,
  isLoaded,
  validatedStyles,
  activeStyleId,
  handleStyleChange,
  className
}: MapControlsProps) {
  const handleManualSearch = (searchTerm: string) => {
    // This is a fallback if no suggestion is selected
    toast.info(`Performing general search for: ${searchTerm}`)
  }

  const handleLocationSelect = (location: GeocodingFeature) => {
    if (map && location.center) {
      map.flyTo({
        center: location.center,
        zoom: 14, // Zoom to a reasonable level for a selected location
        essential: true
      })
      toast.success(`Moved to: ${location.place_name}`)
    }
  }

  if (!isLoaded) return null

  return (
    <div className={className}>
      <MapSearchInput
        onSearch={handleManualSearch}
        onLocationSelect={handleLocationSelect}
        className="mb-4"
      />

      <div className="bg-white p-2 shadow-md rounded-md">
        <div className="font-medium mb-1">Base Layers</div>
        <div className="space-y-1 text-sm">
          {validatedStyles.map(style => (
            <div
              key={style.id}
              className={`cursor-pointer p-1 hover:bg-gray-100 rounded ${activeStyleId === style.id ? "font-medium bg-gray-50" : ""}`}
              onClick={() => handleStyleChange(style.id)}
            >
              {style.name}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
