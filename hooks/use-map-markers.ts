"use client"

import { useCallback, useEffect, useRef, useMemo } from "react"
import { Marker, Popup } from "maplibre-gl"
import type { Map } from "maplibre-gl"
import {
  createSafeMarkerElement,
  createSafeClusterMarker,
  createSafeIndividualMarker,
  createSafeSearchMarker,
  createSafePopupContent,
  MapEventManager,
  type MarkerElementOptions
} from "@/lib/map-security"

export interface MarkerData {
  id: string
  coordinates: [number, number]
  title: string
  description?: string
  category?: string
  metadata?: Record<string, any>
  isSelected?: boolean
}

export interface ClusterData {
  id: string
  coordinates: [number, number]
  count: number
  items: MarkerData[]
  isExpanded?: boolean
}

export interface SearchResultData {
  id: string
  coordinates: [number, number]
  placeName: string
  confidence?: number
}

interface UseMapMarkersOptions {
  onMarkerClick?: (marker: MarkerData) => void
  onClusterClick?: (cluster: ClusterData) => void
  onSearchResultClick?: (result: SearchResultData) => void
  enablePopups?: boolean
  enableClustering?: boolean
  clusterRadius?: number
  maxZoom?: number
}

interface UseMapMarkersReturn {
  markers: Marker[]
  clusters: Marker[]
  searchMarkers: Marker[]
  addMarkers: (data: MarkerData[]) => void
  addClusters: (data: ClusterData[]) => void
  addSearchResults: (data: SearchResultData[]) => void
  removeMarkers: (ids: string[]) => void
  removeClusters: (ids: string[]) => void
  removeSearchResults: (ids: string[]) => void
  clearAllMarkers: () => void
  clearSearchResults: () => void
  updateMarkerSelection: (selectedIds: string[]) => void
  focusMarker: (id: string) => void
}

export function useMapMarkers(
  map: Map | null,
  options: UseMapMarkersOptions = {}
): UseMapMarkersReturn {
  const {
    onMarkerClick,
    onClusterClick,
    onSearchResultClick,
    enablePopups = true,
    enableClustering = true,
    clusterRadius = 50,
    maxZoom = 15
  } = options

  // Store markers and their associated data
  const markersRef = useRef<
    globalThis.Map<string, { marker: Marker; data: MarkerData }>
  >(new globalThis.Map())
  const clustersRef = useRef<
    globalThis.Map<string, { marker: Marker; data: ClusterData }>
  >(new globalThis.Map())
  const searchMarkersRef = useRef<
    globalThis.Map<string, { marker: Marker; data: SearchResultData }>
  >(new globalThis.Map())
  const popupsRef = useRef<globalThis.Map<string, Popup>>(new globalThis.Map())

  // Event manager for cleanup
  const eventManagerRef = useRef<MapEventManager>(new MapEventManager())

  // Memoized marker arrays for return
  const markers = useMemo(
    () => Array.from(markersRef.current.values()).map(item => item.marker),
    [markersRef.current.size]
  )

  const clusters = useMemo(
    () => Array.from(clustersRef.current.values()).map(item => item.marker),
    [clustersRef.current.size]
  )

  const searchMarkers = useMemo(
    () =>
      Array.from(searchMarkersRef.current.values()).map(item => item.marker),
    [searchMarkersRef.current.size]
  )

  // Create secure marker element
  const createMarkerElement = useCallback(
    (data: MarkerData, options?: MarkerElementOptions): HTMLElement => {
      return createSafeIndividualMarker(
        { id: data.id, title: data.title },
        {
          ...options,
          variant: data.isSelected
            ? "selected"
            : data.category === "featured"
              ? "primary"
              : "secondary"
        }
      )
    },
    []
  )

  // Create secure cluster element
  const createClusterElement = useCallback((data: ClusterData): HTMLElement => {
    return createSafeClusterMarker({
      count: data.count,
      isExpanded: data.isExpanded,
      className: `cluster-marker-${data.count > 100 ? "large" : data.count > 10 ? "medium" : "small"}`
    })
  }, [])

  // Create secure search result element
  const createSearchElement = useCallback(
    (data: SearchResultData, index: number): HTMLElement => {
      return createSafeSearchMarker(index, data.placeName, data.coordinates)
    },
    []
  )

  // Create secure popup content
  const createPopupElement = useCallback(
    (data: MarkerData | ClusterData): HTMLElement => {
      if ("count" in data) {
        // Cluster popup
        return createSafePopupContent({
          title: `Cluster of ${data.count} records`,
          description: `Click to expand and view individual records`,
          coordinates: data.coordinates
        })
      } else {
        // Individual marker popup
        return createSafePopupContent({
          title: data.title,
          description: data.description,
          coordinates: data.coordinates,
          metadata: data.metadata
        })
      }
    },
    []
  )

  // Add individual markers
  const addMarkers = useCallback(
    (data: MarkerData[]) => {
      if (!map) return

      data.forEach(markerData => {
        // Remove existing marker if it exists
        const existing = markersRef.current.get(markerData.id)
        if (existing) {
          eventManagerRef.current.removeMarkerHandler(existing.marker)
          existing.marker.remove()
        }

        // Create secure marker element
        const element = createMarkerElement(markerData)

        // Create marker
        const marker = new Marker({ element })
          .setLngLat(markerData.coordinates)
          .addTo(map)

        // Add click handler securely
        const handleClick = () => {
          onMarkerClick?.(markerData)

          // Show popup if enabled
          if (enablePopups) {
            const popupContent = createPopupElement(markerData)
            const popup = new Popup({
              closeButton: true,
              closeOnClick: false,
              maxWidth: "300px"
            })
              .setDOMContent(popupContent)
              .setLngLat(markerData.coordinates)
              .addTo(map)

            // Store popup for cleanup
            const existingPopup = popupsRef.current.get(markerData.id)
            if (existingPopup) {
              existingPopup.remove()
            }
            popupsRef.current.set(markerData.id, popup)
          }
        }

        // Add keyboard support
        const handleKeyDown = (e: KeyboardEvent) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            handleClick()
          }
        }

        eventManagerRef.current.addElementListener(
          element,
          "click",
          handleClick
        )
        eventManagerRef.current.addElementListener(
          element,
          "keydown",
          handleKeyDown as any
        )

        // Store marker with data
        markersRef.current.set(markerData.id, { marker, data: markerData })
      })
    },
    [map, createMarkerElement, createPopupElement, onMarkerClick, enablePopups]
  )

  // Add cluster markers
  const addClusters = useCallback(
    (data: ClusterData[]) => {
      if (!map || !enableClustering) return

      data.forEach(clusterData => {
        // Remove existing cluster if it exists
        const existing = clustersRef.current.get(clusterData.id)
        if (existing) {
          eventManagerRef.current.removeMarkerHandler(existing.marker)
          existing.marker.remove()
        }

        // Create secure cluster element
        const element = createClusterElement(clusterData)

        // Create cluster marker
        const marker = new Marker({ element })
          .setLngLat(clusterData.coordinates)
          .addTo(map)

        // Add click handler
        const handleClick = () => {
          onClusterClick?.(clusterData)

          if (enablePopups) {
            const popupContent = createPopupElement(clusterData)
            const popup = new Popup({
              closeButton: true,
              closeOnClick: false
            })
              .setDOMContent(popupContent)
              .setLngLat(clusterData.coordinates)
              .addTo(map)

            const existingPopup = popupsRef.current.get(clusterData.id)
            if (existingPopup) {
              existingPopup.remove()
            }
            popupsRef.current.set(clusterData.id, popup)
          }
        }

        const handleKeyDown = (e: KeyboardEvent) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            handleClick()
          }
        }

        eventManagerRef.current.addElementListener(
          element,
          "click",
          handleClick
        )
        eventManagerRef.current.addElementListener(
          element,
          "keydown",
          handleKeyDown as any
        )

        // Store cluster with data
        clustersRef.current.set(clusterData.id, { marker, data: clusterData })
      })
    },
    [
      map,
      enableClustering,
      createClusterElement,
      createPopupElement,
      onClusterClick,
      enablePopups
    ]
  )

  // Add search result markers
  const addSearchResults = useCallback(
    (data: SearchResultData[]) => {
      if (!map) return

      data.forEach((resultData, index) => {
        // Remove existing result if it exists
        const existing = searchMarkersRef.current.get(resultData.id)
        if (existing) {
          eventManagerRef.current.removeMarkerHandler(existing.marker)
          existing.marker.remove()
        }

        // Create secure search element
        const element = createSearchElement(resultData, index)

        // Create search marker
        const marker = new Marker({ element })
          .setLngLat(resultData.coordinates)
          .addTo(map)

        // Add click handler
        const handleClick = () => {
          onSearchResultClick?.(resultData)
        }

        const handleKeyDown = (e: KeyboardEvent) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            handleClick()
          }
        }

        eventManagerRef.current.addElementListener(
          element,
          "click",
          handleClick
        )
        eventManagerRef.current.addElementListener(
          element,
          "keydown",
          handleKeyDown as any
        )

        // Store search marker with data
        searchMarkersRef.current.set(resultData.id, {
          marker,
          data: resultData
        })
      })
    },
    [map, createSearchElement, onSearchResultClick]
  )

  // Remove specific markers
  const removeMarkers = useCallback((ids: string[]) => {
    ids.forEach(id => {
      const item = markersRef.current.get(id)
      if (item) {
        eventManagerRef.current.removeMarkerHandler(item.marker)
        item.marker.remove()
        markersRef.current.delete(id)

        // Remove associated popup
        const popup = popupsRef.current.get(id)
        if (popup) {
          popup.remove()
          popupsRef.current.delete(id)
        }
      }
    })
  }, [])

  // Remove specific clusters
  const removeClusters = useCallback((ids: string[]) => {
    ids.forEach(id => {
      const item = clustersRef.current.get(id)
      if (item) {
        eventManagerRef.current.removeMarkerHandler(item.marker)
        item.marker.remove()
        clustersRef.current.delete(id)

        // Remove associated popup
        const popup = popupsRef.current.get(id)
        if (popup) {
          popup.remove()
          popupsRef.current.delete(id)
        }
      }
    })
  }, [])

  // Remove specific search results
  const removeSearchResults = useCallback((ids: string[]) => {
    ids.forEach(id => {
      const item = searchMarkersRef.current.get(id)
      if (item) {
        eventManagerRef.current.removeMarkerHandler(item.marker)
        item.marker.remove()
        searchMarkersRef.current.delete(id)
      }
    })
  }, [])

  // Clear all markers
  const clearAllMarkers = useCallback(() => {
    // Clear markers
    markersRef.current.forEach(({ marker }) => {
      eventManagerRef.current.removeMarkerHandler(marker)
      marker.remove()
    })
    markersRef.current.clear()

    // Clear clusters
    clustersRef.current.forEach(({ marker }) => {
      eventManagerRef.current.removeMarkerHandler(marker)
      marker.remove()
    })
    clustersRef.current.clear()

    // Clear popups
    popupsRef.current.forEach(popup => popup.remove())
    popupsRef.current.clear()
  }, [])

  // Clear search results only
  const clearSearchResults = useCallback(() => {
    searchMarkersRef.current.forEach(({ marker }) => {
      eventManagerRef.current.removeMarkerHandler(marker)
      marker.remove()
    })
    searchMarkersRef.current.clear()
  }, [])

  // Update marker selection state
  const updateMarkerSelection = useCallback(
    (selectedIds: string[]) => {
      markersRef.current.forEach(({ marker, data }, id) => {
        const isSelected = selectedIds.includes(id)
        if (data.isSelected !== isSelected) {
          // Update data
          data.isSelected = isSelected

          // Update marker element
          const newElement = createMarkerElement(data)
          const oldElement = marker.getElement()

          if (oldElement?.parentNode) {
            oldElement.parentNode.replaceChild(newElement, oldElement)
          }
        }
      })
    },
    [createMarkerElement]
  )

  // Focus on specific marker
  const focusMarker = useCallback(
    (id: string) => {
      const item = markersRef.current.get(id)
      if (item && map) {
        map.flyTo({
          center: item.data.coordinates,
          zoom: Math.max(map.getZoom(), 15),
          duration: 1000
        })

        // Trigger click to show popup
        const element = item.marker.getElement()
        if (element) {
          element.click()
        }
      }
    },
    [map]
  )

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAllMarkers()
      clearSearchResults()
      eventManagerRef.current.cleanup()
    }
  }, [clearAllMarkers, clearSearchResults])

  return {
    markers,
    clusters,
    searchMarkers,
    addMarkers,
    addClusters,
    addSearchResults,
    removeMarkers,
    removeClusters,
    removeSearchResults,
    clearAllMarkers,
    clearSearchResults,
    updateMarkerSelection,
    focusMarker
  }
}
