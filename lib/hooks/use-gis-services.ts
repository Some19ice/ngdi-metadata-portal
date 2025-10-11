/**
 * Hook for managing GIS services in a MapLibre map
 */

import { useState, useCallback, useEffect, useRef } from "react"
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
import { useIsMounted, useAbortController } from "./use-map-performance"

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
  const isMounted = useIsMounted()
  const { createController } = useAbortController(10000) // 10 second timeout
  const pendingRequestsRef = useRef<Set<string>>(new Set())

  // Add a GIS service by URL with proper error handling and abort control
  const addServiceByUrl = useCallback(
    async (url: string, name?: string): Promise<boolean> => {
      if (!map || !map.isStyleLoaded()) {
        toast.error("Map is not ready")
        return false
      }

      // Prevent duplicate requests
      if (pendingRequestsRef.current.has(url)) {
        toast.warning("Service request already in progress")
        return false
      }

      // Generate a unique ID for this service
      const serviceId = `gis-service-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      pendingRequestsRef.current.add(url)

      // Add a placeholder while loading
      if (isMounted()) {
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
      }

      try {
        // Create abort controller for this request
        const controller = createController()

        // Detect service type with timeout and abort signal
        const result = await detectGISServiceType(url, {
          signal: controller.signal,
          timeout: 8000
        })

        // Check if component is still mounted
        if (!isMounted()) {
          return false
        }

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
          if (isMounted()) {
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
          }
          toast.error("Unsupported service type")
          return false
        }

        // Add the layer to the map
        await addLayer({
          id: layerId,
          sourceId: sourceId,
          source: source,
          layer: layer
        })

        // Update service layers state
        if (isMounted()) {
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
        }

        toast.success(`Added service: ${result.service?.name || "GIS Service"}`)
        return true
      } catch (error) {
        console.error("Error adding GIS service:", error)

        if (isMounted()) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error"
          const isAborted =
            error instanceof Error && error.name === "AbortError"

          setServiceLayers(prev =>
            prev.map(layer =>
              layer.id === serviceId
                ? {
                    ...layer,
                    isLoading: false,
                    error: isAborted ? "Request timeout" : errorMessage
                  }
                : layer
            )
          )

          if (!isAborted) {
            toast.error(`Failed to add service: ${errorMessage}`)
          } else {
            toast.error("Service request timed out")
          }
        }
        return false
      } finally {
        pendingRequestsRef.current.delete(url)
      }
    },
    [map, addLayer, isMounted, createController]
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
      if (isMounted()) {
        setServiceLayers(prev => prev.filter(layer => layer.id !== serviceId))
      }

      toast.success(`Removed service: ${service.name}`)
      return true
    },
    [serviceLayers, removeLayer, isMounted]
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
      if (isMounted()) {
        setServiceLayers(prev =>
          prev.map(layer =>
            layer.id === serviceId
              ? { ...layer, isVisible: !layer.isVisible }
              : layer
          )
        )
      }

      return true
    },
    [serviceLayers, toggleLayerVisibility, isMounted]
  )

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear any pending requests
      pendingRequestsRef.current.clear()
    }
  }, [])

  return {
    serviceLayers,
    addServiceByUrl,
    removeService,
    toggleServiceVisibility
  }
}
