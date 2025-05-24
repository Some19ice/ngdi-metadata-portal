"use client"

import React, { useMemo, useCallback, useRef, useEffect } from "react"
import { Map, Marker, Popup } from "maplibre-gl"
import { MetadataRecord } from "@/lib/map-utils"

interface MarkerData {
  id: string
  position: [number, number]
  data: MetadataRecord
  popupContent?: React.ReactNode
}

interface OptimizedMarkerClusterProps {
  map: Map | null
  markers: MarkerData[]
  clusterRadius?: number
  maxZoom?: number
  onMarkerClick?: (marker: MarkerData) => void
  onClusterClick?: (cluster: MarkerCluster) => void
}

interface MarkerCluster {
  id: string
  position: [number, number]
  count: number
  markers: MarkerData[]
  bounds: [[number, number], [number, number]]
}

// Clustering algorithm optimized for performance
function clusterMarkers(
  markers: MarkerData[],
  zoom: number,
  clusterRadius: number = 50,
  maxZoom: number = 16
): (MarkerData | MarkerCluster)[] {
  // Don't cluster at high zoom levels
  if (zoom >= maxZoom) {
    return markers
  }

  const clusters: MarkerCluster[] = []
  const processed = new Set<string>()

  // Calculate pixel distance based on zoom level
  const pixelRadius = clusterRadius / Math.pow(2, zoom - 10)

  markers.forEach(marker => {
    if (processed.has(marker.id)) return

    const nearby: MarkerData[] = [marker]
    processed.add(marker.id)

    // Find nearby markers
    markers.forEach(otherMarker => {
      if (processed.has(otherMarker.id)) return

      const distance = getDistance(marker.position, otherMarker.position)
      if (distance <= pixelRadius) {
        nearby.push(otherMarker)
        processed.add(otherMarker.id)
      }
    })

    // Create cluster if multiple markers
    if (nearby.length > 1) {
      const bounds = getBounds(nearby.map(m => m.position))
      const center = getCenter(nearby.map(m => m.position))

      clusters.push({
        id: `cluster-${marker.id}`,
        position: center,
        count: nearby.length,
        markers: nearby,
        bounds
      })
    } else {
      // Single marker, return as-is
      clusters.push(marker as any)
    }
  })

  return clusters
}

// Optimized distance calculation
function getDistance(pos1: [number, number], pos2: [number, number]): number {
  const dx = pos1[0] - pos2[0]
  const dy = pos1[1] - pos2[1]
  return Math.sqrt(dx * dx + dy * dy)
}

// Calculate bounds for a set of positions
function getBounds(
  positions: [number, number][]
): [[number, number], [number, number]] {
  let minLng = Infinity,
    minLat = Infinity
  let maxLng = -Infinity,
    maxLat = -Infinity

  positions.forEach(([lng, lat]) => {
    minLng = Math.min(minLng, lng)
    maxLng = Math.max(maxLng, lng)
    minLat = Math.min(minLat, lat)
    maxLat = Math.max(maxLat, lat)
  })

  return [
    [minLng, minLat],
    [maxLng, maxLat]
  ]
}

// Calculate center point
function getCenter(positions: [number, number][]): [number, number] {
  const sum = positions.reduce(
    (acc, [lng, lat]) => [acc[0] + lng, acc[1] + lat],
    [0, 0]
  )
  return [sum[0] / positions.length, sum[1] / positions.length]
}

export default function OptimizedMarkerCluster({
  map,
  markers,
  clusterRadius = 50,
  maxZoom = 16,
  onMarkerClick,
  onClusterClick
}: OptimizedMarkerClusterProps) {
  const markersRef = useRef<globalThis.Map<string, Marker>>(
    new globalThis.Map()
  )
  const clustersRef = useRef<globalThis.Map<string, Marker>>(
    new globalThis.Map()
  )
  const currentZoom = useRef<number>(1)

  // Memoize clustered data based on zoom level
  const clusteredData = useMemo(() => {
    if (!map) return []

    const zoom = map.getZoom()
    currentZoom.current = zoom

    return clusterMarkers(markers, zoom, clusterRadius, maxZoom)
  }, [markers, map?.getZoom(), clusterRadius, maxZoom])

  // Debounced update function for performance
  const updateMarkers = useCallback(
    debounce(() => {
      if (!map) return

      // Clear existing markers
      markersRef.current.forEach(marker => marker.remove())
      clustersRef.current.forEach(marker => marker.remove())
      markersRef.current.clear()
      clustersRef.current.clear()

      // Add new markers/clusters
      clusteredData.forEach(item => {
        if ("count" in item) {
          // It's a cluster
          const clusterMarker = new Marker({
            element: createClusterElement(item.count)
          })
            .setLngLat(item.position)
            .addTo(map)

          clusterMarker.getElement().addEventListener("click", () => {
            onClusterClick?.(item)
          })

          clustersRef.current.set(item.id, clusterMarker)
        } else {
          // It's a single marker
          const markerElement = createMarkerElement()
          const marker = new Marker({ element: markerElement })
            .setLngLat(item.position)
            .addTo(map)

          // Add popup if content provided
          if (item.popupContent) {
            const popup = new Popup({ offset: 25 }).setHTML(
              renderPopupContent(item.popupContent)
            )
            marker.setPopup(popup)
          }

          marker.getElement().addEventListener("click", () => {
            onMarkerClick?.(item)
          })

          markersRef.current.set(item.id, marker)
        }
      })
    }, 100),
    [map, clusteredData, onMarkerClick, onClusterClick]
  )

  // Update markers when data changes
  useEffect(() => {
    updateMarkers()
  }, [updateMarkers])

  // Listen for zoom changes
  useEffect(() => {
    if (!map) return

    const handleZoomEnd = () => {
      updateMarkers()
    }

    map.on("zoomend", handleZoomEnd)
    return () => {
      map.off("zoomend", handleZoomEnd)
    }
  }, [map, updateMarkers])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      markersRef.current.forEach(marker => marker.remove())
      clustersRef.current.forEach(marker => marker.remove())
    }
  }, [])

  return null // This component doesn't render anything directly
}

// Create cluster marker element
function createClusterElement(count: number): HTMLElement {
  const el = document.createElement("div")
  el.className = "marker-cluster"
  el.style.cssText = `
    background: #3b82f6;
    border: 2px solid #ffffff;
    border-radius: 50%;
    color: white;
    font-weight: bold;
    text-align: center;
    font-size: 12px;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    transition: transform 0.2s ease;
  `

  // Size based on count
  const size = Math.min(40 + Math.log(count) * 5, 60)
  el.style.width = `${size}px`
  el.style.height = `${size}px`

  el.textContent = count.toString()

  // Hover effect
  el.addEventListener("mouseenter", () => {
    el.style.transform = "scale(1.1)"
  })
  el.addEventListener("mouseleave", () => {
    el.style.transform = "scale(1)"
  })

  return el
}

// Create single marker element
function createMarkerElement(): HTMLElement {
  const el = document.createElement("div")
  el.className = "marker-single"
  el.style.cssText = `
    background: #ef4444;
    border: 2px solid #ffffff;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    transition: transform 0.2s ease;
  `

  // Hover effect
  el.addEventListener("mouseenter", () => {
    el.style.transform = "scale(1.2)"
  })
  el.addEventListener("mouseleave", () => {
    el.style.transform = "scale(1)"
  })

  return el
}

// Render popup content to HTML string
function renderPopupContent(content: React.ReactNode): string {
  if (typeof content === "string") {
    return content
  }

  // For React components, you might want to use a more sophisticated approach
  // This is a simplified version
  return "<div>Metadata Record</div>"
}

// Debounce utility
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}
