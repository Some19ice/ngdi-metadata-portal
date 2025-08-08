"use client"

import React, { useCallback, useRef, useEffect } from "react"
import { Map, Marker, Popup, LngLatLike, PointLike } from "maplibre-gl"
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

// Pixel-accurate clustering using map projection
function clusterMarkersByPixels(
  map: Map,
  markers: MarkerData[],
  clusterRadiusPx: number,
  maxZoom: number
): (MarkerData | MarkerCluster)[] {
  const zoom = map.getZoom()
  if (zoom >= maxZoom) return markers

  const clusters: (MarkerData | MarkerCluster)[] = []
  const processed = new Set<string>()

  const projected = markers.map(m => ({
    id: m.id,
    pixel: map.project(m.position as LngLatLike),
    marker: m
  }))

  projected.forEach((item, idx) => {
    if (processed.has(item.id)) return

    const group: typeof projected = [item]
    processed.add(item.id)

    for (let j = idx + 1; j < projected.length; j++) {
      const other = projected[j]
      if (processed.has(other.id)) continue
      const dx = item.pixel.x - other.pixel.x
      const dy = item.pixel.y - other.pixel.y
      if (Math.hypot(dx, dy) <= clusterRadiusPx) {
        group.push(other)
        processed.add(other.id)
      }
    }

    if (group.length > 1) {
      let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity,
        sumX = 0,
        sumY = 0

      group.forEach(g => {
        minX = Math.min(minX, g.pixel.x)
        minY = Math.min(minY, g.pixel.y)
        maxX = Math.max(maxX, g.pixel.x)
        maxY = Math.max(maxY, g.pixel.y)
        sumX += g.pixel.x
        sumY += g.pixel.y
      })

      const centerPixel = { x: sumX / group.length, y: sumY / group.length }
      const centerLngLat = map.unproject(centerPixel as unknown as PointLike)
      const sw = map.unproject({ x: minX, y: maxY } as unknown as PointLike)
      const ne = map.unproject({ x: maxX, y: minY } as unknown as PointLike)

      clusters.push({
        id: `cluster-${item.id}`,
        position: [centerLngLat.lng, centerLngLat.lat],
        count: group.length,
        markers: group.map(g => g.marker),
        bounds: [
          [sw.lng, sw.lat],
          [ne.lng, ne.lat]
        ]
      })
    } else {
      clusters.push(item.marker)
    }
  })

  return clusters
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

  // Debounced update function for performance
  const updateMarkers = useCallback(
    debounce(() => {
      if (!map) return

      // Clear existing markers
      markersRef.current.forEach(marker => marker.remove())
      clustersRef.current.forEach(marker => marker.remove())
      markersRef.current.clear()
      clustersRef.current.clear()

      // Compute clusters for current zoom and add markers
      const clusteredData = clusterMarkersByPixels(
        map,
        markers,
        clusterRadius,
        maxZoom
      )

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
    [map, markers, clusterRadius, maxZoom, onMarkerClick, onClusterClick]
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
