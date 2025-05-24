"use client"

import { useState, useEffect, useCallback } from "react"
import { Map, GeoJSONSource } from "maplibre-gl"

// Helper function to determine the source ID
const getResolvedSourceId = (
  layerId: string, // This is layerConfig.id
  sourceDefinition?: string | any, // This is layerConfig.source - using any since MapLibre doesn't export AnySourceData
  explicitSourceId?: string // This is layerConfig.sourceId
): string => {
  if (explicitSourceId) {
    return explicitSourceId
  }
  if (typeof sourceDefinition === "string") {
    return sourceDefinition // Source is a URL string, use as ID
  }
  // Check if sourceDefinition is an object and has an 'id' property of type string
  if (
    typeof sourceDefinition === "object" &&
    sourceDefinition !== null &&
    "id" in sourceDefinition && // Check if 'id' key exists
    typeof (sourceDefinition as { id?: unknown }).id === "string" // Check if 'id' value is string
  ) {
    return (sourceDefinition as { id: string }).id
  }
  return layerId + "-source" // Default fallback for object sources without explicitSourceId or internal id
}

export interface MapLayerConfig {
  id: string
  source?: string | any // Using any since MapLibre doesn't export AnySourceData
  sourceId?: string
  layer: Omit<any, "id" | "source"> // Using any since MapLibre doesn't export AnyLayer
  beforeId?: string
}

interface UseMapLayersOptions {
  map: Map | null
  initialLayers?: MapLayerConfig[]
}

/**
 * Hook to manage map sources and layers
 *
 * @param options Configuration options for map layers
 * @returns Object containing methods to add, remove, and update layers
 */
export function useMapLayers({ map, initialLayers = [] }: UseMapLayersOptions) {
  const [layers, setLayers] = useState<MapLayerConfig[]>(initialLayers)

  // Add initial layers when map is loaded
  useEffect(() => {
    if (!map || !map.isStyleLoaded()) return

    // Add all initial layers
    initialLayers.forEach(layerConfig => {
      const {
        id,
        source,
        sourceId: explicitSourceIdFromConfig,
        layer,
        beforeId
      } = layerConfig
      const actualSourceId = getResolvedSourceId(
        id,
        source,
        explicitSourceIdFromConfig
      )

      // Add source if provided and is an object
      if (source && typeof source !== "string") {
        if (!map.getSource(actualSourceId)) {
          map.addSource(actualSourceId, source) // 'source' is the source object
        }
      }

      // Add layer
      if (!map.getLayer(id)) {
        map.addLayer(
          {
            id,
            source: actualSourceId, // Use the resolved ID for the layer's source property
            ...layer
          } as any,
          beforeId
        )
      }
    })
  }, [map, initialLayers])

  // Function to add a layer
  const addLayer = useCallback(
    (layerConfig: MapLayerConfig) => {
      if (!map || !map.isStyleLoaded()) return

      const {
        id,
        source,
        sourceId: explicitSourceIdFromConfig,
        layer,
        beforeId
      } = layerConfig
      const actualSourceId = getResolvedSourceId(
        id,
        source,
        explicitSourceIdFromConfig
      )

      // Add source if provided and is an object
      if (source && typeof source !== "string") {
        if (!map.getSource(actualSourceId)) {
          map.addSource(actualSourceId, source) // 'source' is the source object
        }
      }

      // Add layer
      if (!map.getLayer(id)) {
        map.addLayer(
          {
            id,
            source: actualSourceId, // Use the resolved ID for the layer's source property
            ...layer
          } as any,
          beforeId
        )
      }

      setLayers(prev => [...prev, layerConfig])
    },
    [map]
  )

  // Function to remove a layer
  const removeLayer = useCallback(
    (id: string, removeSource = false) => {
      if (!map || !map.isStyleLoaded()) return

      // Find the layer
      const layer = layers.find(l => l.id === id)
      if (!layer) return

      // Remove layer if it exists
      if (map.getLayer(id)) {
        map.removeLayer(id)
      }

      // Remove source if requested and it exists
      if (removeSource) {
        const actualSourceId = getResolvedSourceId(
          layer.id,
          layer.source,
          layer.sourceId
        )

        if (map.getSource(actualSourceId)) {
          map.removeSource(actualSourceId)
        }
      }

      setLayers(prev => prev.filter(l => l.id !== id))
    },
    [map, layers]
  )

  // Function to update a layer's source data
  const updateLayerSource = useCallback(
    (id: string, sourceData: GeoJSON.FeatureCollection) => {
      if (!map || !map.isStyleLoaded()) return

      // Find the layer
      const layer = layers.find(l => l.id === id)
      if (!layer) return

      // Get source ID
      const actualSourceId = getResolvedSourceId(
        layer.id,
        layer.source,
        layer.sourceId
      )

      // Update source data if it exists
      const sourceInstance = map.getSource(actualSourceId) as GeoJSONSource
      if (sourceInstance && sourceInstance.setData) {
        sourceInstance.setData(sourceData)
      }
    },
    [map, layers]
  )

  // Function to toggle layer visibility
  const toggleLayerVisibility = useCallback(
    (id: string, visible?: boolean) => {
      if (!map || !map.isStyleLoaded()) return

      if (map.getLayer(id)) {
        const currentVisibility = map.getLayoutProperty(id, "visibility")
        const newVisibility =
          visible !== undefined
            ? visible
              ? "visible"
              : "none"
            : currentVisibility === "visible"
              ? "none"
              : "visible"

        map.setLayoutProperty(id, "visibility", newVisibility)
      }
    },
    [map]
  )

  return {
    layers,
    addLayer,
    removeLayer,
    updateLayerSource,
    toggleLayerVisibility
  }
}
