"use client"

import dynamic from "next/dynamic"
import MapLoadingSkeleton from "./map-loading-skeleton"
import { GeocodingFeature } from "@/types"

// Lazy load the map wrapper component and show skeleton while loading.
const MapWrapper = dynamic(() => import("./map-wrapper"), {
  ssr: false,
  loading: () => <MapLoadingSkeleton />
})

interface MapClientWrapperProps {
  initialCenter?: [number, number]
  initialZoom?: number
  searchResults?: GeocodingFeature[] | null
  highlightedLocation?: string
}

export default function MapClientWrapper(props: MapClientWrapperProps) {
  return <MapWrapper {...props} />
}
