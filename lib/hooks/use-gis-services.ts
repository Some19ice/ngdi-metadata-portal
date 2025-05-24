/**
 * Hook for managing GIS services in a MapLibre map
 */

import { useState, useCallback, useEffect } from "react"
import { Map } from "maplibre-gl"
import { toast } from "sonner"
import {
  detectGISServiceType,
  createMapLibreSource,
  createMapLibreLayer,
  type GISServiceInfo,
  type ServiceDetectionResult
} from "@/lib/gis-services/service-factory"
import { useMapLayers } from "./use-map-layers"

export interface GISServiceLayerConfig {
  id: string
  name: string
  serviceUrl: string
  serviceType?: string
  serviceInfo?: GISServiceInfo
  isVisible: boolean
  isLoading: boolean
  error?: string
}

interface UseGISServicesOptions {
  map: Map | null
}

export function useGISServices({ map }: UseGISServicesOptions) {
  const [serviceLayers, setServiceLayers] = useState<GISServiceLayerConfig[]>(
    []
  )
  const { addLayer, removeLayer, toggleLayerVisibility } = useMapLayers({ map })

  // Add a GIS service by URL
  const addServiceByUrl = useCallback(
    async (url: string, name?: string): Promise<boolean> => {
      if (!map || !map.isStyleLoaded()) {
        toast.error("Map is not ready")
        return false
      }

      // Generate a unique ID for this service
      const serviceId = `gis-service-${Date.now()}`

      // Add a placeholder while loading
      setServiceLayers(prev => [
        ...prev,
        {
          id: serviceId,
          name: name || "Loading service...",
          serviceUrl: url,
          isVisible: true,
          isLoading: true
        }
      ])

      try {
        // Detect service type
        const result = await detectGISServiceType(url)

        if (!result.isValid || !result.service) {
          setServiceLayers(prev =>
            prev.map(layer =>
              layer.id === serviceId
                ? {
                    ...layer,
                    isLoading: false,
                    error: result.error || "Invalid service"
                  }
                : layer
            )
          )
          toast.error(
            `Failed to add service: ${result.error || "Invalid service"}`
          )
          return false
        }

        // Create source and layer configurations
        const sourceId = `source-${serviceId}`
        const layerId = `layer-${serviceId}`

        const source = createMapLibreSource(result.service)
        const layer = createMapLibreLayer(result.service, sourceId, layerId)

        if (!source || !layer) {
          setServiceLayers(prev =>
            prev.map(layer =>
              layer.id === serviceId
                ? {
                    ...layer,
                    isLoading: false,
                    error: "Unsupported service type"
                  }
                : layer
            )
          )
          toast.error("Unsupported service type")
          return false
        }

        // Add the layer to the map
        addLayer({
          id: layerId,
          sourceId: sourceId,
          source: source,
          layer: layer
        })

        // Update service layers state
        setServiceLayers(prev =>
          prev.map(layer =>
            layer.id === serviceId
              ? {
                  ...layer,
                  name: name || result.service?.name || "GIS Service",
                  serviceType: result.serviceType,
                  serviceInfo: result.service,
                  isLoading: false
                }
              : layer
          )
        )

        toast.success(`Added service: ${result.service?.name || "GIS Service"}`)
        return true
      } catch (error) {
        console.error("Error adding GIS service:", error)

        setServiceLayers(prev =>
          prev.map(layer =>
            layer.id === serviceId
              ? {
                  ...layer,
                  isLoading: false,
                  error:
                    error instanceof Error ? error.message : "Unknown error"
                }
              : layer
          )
        )

        toast.error(
          `Failed to add service: ${error instanceof Error ? error.message : "Unknown error"}`
        )
        return false
      }
    },
    [map, addLayer]
  )

  // Remove a GIS service
  const removeService = useCallback(
    (serviceId: string) => {
      const service = serviceLayers.find(layer => layer.id === serviceId)

      if (!service) {
        return false
      }

      // Remove the layer from the map
      const layerId = `layer-${serviceId}`
      removeLayer(layerId)

      // Update service layers state
      setServiceLayers(prev => prev.filter(layer => layer.id !== serviceId))

      toast.success(`Removed service: ${service.name}`)
      return true
    },
    [serviceLayers, removeLayer]
  )

  // Toggle service visibility
  const toggleServiceVisibility = useCallback(
    (serviceId: string) => {
      const service = serviceLayers.find(layer => layer.id === serviceId)

      if (!service) {
        return false
      }

      // Toggle layer visibility
      const layerId = `layer-${serviceId}`
      toggleLayerVisibility(layerId)

      // Update service layers state
      setServiceLayers(prev =>
        prev.map(layer =>
          layer.id === serviceId
            ? { ...layer, isVisible: !layer.isVisible }
            : layer
        )
      )

      return true
    },
    [serviceLayers, toggleLayerVisibility]
  )

  return {
    serviceLayers,
    addServiceByUrl,
    removeService,
    toggleServiceVisibility
  }
}
