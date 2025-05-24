"use client"

import { useState, useEffect, useRef } from "react"
import {
  Map as MapLibre,
  Marker,
  MarkerOptions,
  Popup,
  LngLatLike
} from "maplibre-gl"

export interface MarkerData {
  id: string
  lngLat: LngLatLike
  options?: MarkerOptions
  popupContent?: string | HTMLElement
  popupOptions?: {
    offset?: number
    closeButton?: boolean
    closeOnClick?: boolean
  }
}

interface UseMapMarkersOptions {
  map: MapLibre | null
  markers?: MarkerData[]
}

/**
 * Hook to manage map markers and popups
 *
 * @param options Configuration options for markers
 * @returns Object containing methods to add, remove, and update markers
 */
export function useMapMarkers({ map, markers = [] }: UseMapMarkersOptions) {
  const [activeMarkers, setActiveMarkers] = useState<MarkerData[]>(markers)
  // Use JavaScript's built-in Map object to store markers
  const markerInstancesRef = useRef<Map<string, Marker>>(new Map())

  // Update markers when the map or markers array changes
  useEffect(() => {
    if (!map) return

    const newMarkerInstances = new Map<string, Marker>()
    const currentPropMarkerIds = new Set(markers.map(m => m.id))

    // Process markers from the prop
    markers.forEach(currentMarkerDataFromProp => {
      const {
        id,
        lngLat,
        options = {},
        popupContent,
        popupOptions = {}
      } = currentMarkerDataFromProp

      let existingMarkerInstance = markerInstancesRef.current.get(id)
      const previousMarkerStateData = activeMarkers.find(m => m.id === id)

      let recreationNeeded = false
      if (existingMarkerInstance && previousMarkerStateData) {
        // Check if popup content changed
        const popupChanged =
          popupContent !== previousMarkerStateData.popupContent
        // Check if options changed (simple stringify compare for non-element options)
        // Note: if options include an 'element', this comparison might not be robust
        // or always trigger recreation if element is a new instance each time.
        // For custom elements, managing their update or replacement is key.
        let optionsChanged = false
        const prevOptions = previousMarkerStateData.options || {}
        if (options.element !== prevOptions.element) {
          optionsChanged = true
        } else {
          const { element: currentElement, ...restCurrentOptions } = options
          const { element: prevElement, ...restPrevOptions } = prevOptions
          if (
            JSON.stringify(restCurrentOptions) !==
            JSON.stringify(restPrevOptions)
          ) {
            optionsChanged = true
          }
        }

        if (popupChanged || optionsChanged) {
          recreationNeeded = true
        }
      }

      if (existingMarkerInstance && recreationNeeded) {
        existingMarkerInstance.remove()
        markerInstancesRef.current.delete(id)
        existingMarkerInstance = undefined // Force re-creation
      }

      if (existingMarkerInstance) {
        // Update LngLat if different
        const currentMapLngLat = existingMarkerInstance.getLngLat()

        // Normalize lngLat to get lng/lat values
        let targetLng: number, targetLat: number
        if (Array.isArray(lngLat)) {
          ;[targetLng, targetLat] = lngLat
        } else if (
          typeof lngLat === "object" &&
          "lng" in lngLat &&
          "lat" in lngLat
        ) {
          targetLng = lngLat.lng
          targetLat = lngLat.lat
        } else if (
          typeof lngLat === "object" &&
          "lon" in lngLat &&
          "lat" in lngLat
        ) {
          targetLng = (lngLat as any).lon
          targetLat = lngLat.lat
        } else {
          // Fallback - let MapLibre handle the conversion
          existingMarkerInstance.setLngLat(lngLat)
          targetLng = currentMapLngLat.lng
          targetLat = currentMapLngLat.lat
        }

        if (
          currentMapLngLat.lng !== targetLng ||
          currentMapLngLat.lat !== targetLat
        ) {
          existingMarkerInstance.setLngLat(lngLat)
        }
        // If popupContent is now undefined but popup exists, remove it
        if (!popupContent && existingMarkerInstance.getPopup()) {
          existingMarkerInstance.setPopup(undefined) // Removes the popup
        } else if (popupContent && !recreationNeeded) {
          // Update existing popup if not recreating
          let popup = existingMarkerInstance.getPopup()
          if (!popup) {
            popup = new Popup({
              offset: popupOptions.offset ?? 25,
              closeButton: popupOptions.closeButton ?? true,
              closeOnClick: popupOptions.closeOnClick ?? true
            })
            existingMarkerInstance.setPopup(popup)
          }
          if (typeof popupContent === "string") {
            popup.setHTML(popupContent)
          } else {
            popup.setDOMContent(popupContent)
          }
        }
        newMarkerInstances.set(id, existingMarkerInstance)
      } else {
        // Create new marker
        const newMarker = new Marker(options).setLngLat(lngLat).addTo(map)
        if (popupContent) {
          const popup = new Popup({
            offset: popupOptions.offset ?? 25,
            closeButton: popupOptions.closeButton ?? true,
            closeOnClick: popupOptions.closeOnClick ?? true
          })
          if (typeof popupContent === "string") {
            popup.setHTML(popupContent)
          } else {
            popup.setDOMContent(popupContent)
          }
          newMarker.setPopup(popup)
        }
        newMarkerInstances.set(id, newMarker)
      }
    })

    // Remove markers that are in the old ref but not in the current props
    markerInstancesRef.current.forEach((marker, id) => {
      if (!currentPropMarkerIds.has(id)) {
        marker.remove()
      }
    })

    markerInstancesRef.current = newMarkerInstances
    setActiveMarkers(markers)

    // Cleanup function for this useEffect
    return () => {
      // When the effect re-runs with a new map instance or unmounts,
      // remove all markers managed by this hook instance.
      markerInstancesRef.current.forEach(marker => {
        marker.remove()
      })
      markerInstancesRef.current.clear()
      // Note: The logic within the effect already handles removing markers
      // that are no longer in the `markers` prop array. This cleanup
      // is more for when the `map` prop itself changes or the component unmounts.
    }
    // Dependency on activeMarkers is to ensure we can compare previous prop data (now in activeMarkers)
    // with new prop data (markers).
  }, [map, markers, activeMarkers])

  // Function to add a marker
  const addMarker = (markerData: MarkerData) => {
    if (!map) return null

    const {
      id,
      lngLat,
      options = {},
      popupContent,
      popupOptions = {}
    } = markerData

    // Create marker
    const marker = new Marker(options).setLngLat(lngLat).addTo(map)

    // Add popup if content is provided
    if (popupContent) {
      const popup = new Popup({
        offset: popupOptions.offset ?? 25,
        closeButton: popupOptions.closeButton ?? true,
        closeOnClick: popupOptions.closeOnClick ?? true
      })

      if (typeof popupContent === "string") {
        popup.setHTML(popupContent)
      } else {
        popup.setDOMContent(popupContent)
      }

      marker.setPopup(popup)
    }

    // Store marker instance
    markerInstancesRef.current.set(id, marker)

    // Update state
    setActiveMarkers(prev => [...prev, markerData])

    return marker
  }

  // Function to remove a marker
  const removeMarker = (id: string) => {
    const marker = markerInstancesRef.current.get(id)
    if (marker) {
      marker.remove()
      markerInstancesRef.current.delete(id)
      setActiveMarkers(prev => prev.filter(m => m.id !== id))
    }
  }

  // Function to update a marker
  const updateMarker = (
    id: string,
    updates: Partial<Omit<MarkerData, "id">>
  ) => {
    const marker = markerInstancesRef.current.get(id)
    if (!marker) return

    // Update position if provided
    if (updates.lngLat) {
      marker.setLngLat(updates.lngLat)
    }

    // Update popup if provided
    if (updates.popupContent) {
      const popupOptions = {
        offset: updates.popupOptions?.offset ?? 25,
        closeButton: updates.popupOptions?.closeButton ?? true,
        closeOnClick: updates.popupOptions?.closeOnClick ?? true
      }

      const popup = new Popup(popupOptions)

      if (typeof updates.popupContent === "string") {
        popup.setHTML(updates.popupContent)
      } else {
        popup.setDOMContent(updates.popupContent)
      }

      marker.setPopup(popup)
    }

    // Update state
    setActiveMarkers(prev =>
      prev.map(m => (m.id === id ? { ...m, ...updates } : m))
    )
  }

  return {
    markers: activeMarkers,
    addMarker,
    removeMarker,
    updateMarker,
    markerInstances: markerInstancesRef.current
  }
}
