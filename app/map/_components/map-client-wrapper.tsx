"use client"

import dynamic from "next/dynamic"
import { Loader2 } from "lucide-react"
import { GeocodingFeature } from "@/types"

// Lazy load the map wrapper component
const MapWrapper = dynamic(() => import("./map-wrapper"), {
  ssr: false,
  loading: () => <MapLoadingSkeleton />
})

function MapLoadingSkeleton() {
  return (
    <div className="w-full h-screen bg-gray-100 animate-pulse flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin mx-auto text-gray-400" />
        <p className="text-gray-600 font-medium">Loading map...</p>
      </div>
    </div>
  )
}

interface MapClientWrapperProps {
  initialCenter?: [number, number]
  initialZoom?: number
  searchResults?: GeocodingFeature[] | null
  highlightedLocation?: string
}

export default function MapClientWrapper(props: MapClientWrapperProps) {
  return <MapWrapper {...props} />
}
