/**
 * GIS Service Factory
 * Provides a unified interface for working with different GIS service types
 */

import { validateArcGISService, type ArcGISServiceInfo } from "./arcgis-service"
import {
  validateWMSService,
  validateWFSService,
  type OGCServiceInfo
} from "./ogc-service"
import { toast } from "sonner"

// Union type for all service types
export type GISServiceInfo = ArcGISServiceInfo | OGCServiceInfo

// Service detection result
export interface ServiceDetectionResult {
  isValid: boolean
  serviceType?: string
  service?: GISServiceInfo
  error?: string
}

export interface ServiceDetectionOptions {
  signal?: AbortSignal
  timeout?: number
}

/**
 * Detects the type of GIS service from a URL with timeout and abort signal support
 * @param url The URL to check
 * @param options Options including signal and timeout
 * @returns Promise resolving to service detection result
 */
export async function detectGISServiceType(
  url: string,
  options: ServiceDetectionOptions = {}
): Promise<ServiceDetectionResult> {
  const { signal, timeout = 8000 } = options

  try {
    // Create timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error("Service detection timeout"))
      }, timeout)

      // Cancel timeout if signal is aborted
      signal?.addEventListener("abort", () => {
        clearTimeout(timeoutId)
        reject(new Error("Service detection aborted"))
      })
    })

    // Check URL patterns to guess service type
    if (
      url.includes("arcgis.com") ||
      url.includes("/rest/services") ||
      url.includes("MapServer") ||
      url.includes("FeatureServer")
    ) {
      // Likely an ArcGIS service
      return await Promise.race([
        validateArcGISService(url, { signal }),
        timeoutPromise
      ])
    } else if (
      url.includes("SERVICE=WMS") ||
      url.includes("service=wms") ||
      url.includes("wms") ||
      url.toLowerCase().includes("geoserver/wms")
    ) {
      // Likely a WMS service
      return await Promise.race([
        validateWMSService(url, { signal }),
        timeoutPromise
      ])
    } else if (
      url.includes("SERVICE=WFS") ||
      url.includes("service=wfs") ||
      url.includes("wfs") ||
      url.toLowerCase().includes("geoserver/wfs")
    ) {
      // Likely a WFS service
      return await Promise.race([
        validateWFSService(url, { signal }),
        timeoutPromise
      ])
    } else {
      // Try each service type in sequence with individual timeouts
      const individualTimeout = Math.floor(timeout / 3)

      // Try ArcGIS first
      try {
        const arcgisResult = await Promise.race([
          validateArcGISService(url, { signal }),
          new Promise<ServiceDetectionResult>((_, reject) =>
            setTimeout(
              () => reject(new Error("ArcGIS validation timeout")),
              individualTimeout
            )
          )
        ])

        if (arcgisResult.isValid) {
          return {
            ...arcgisResult,
            serviceType: "ArcGIS"
          }
        }
      } catch (error) {
        if (signal?.aborted) throw error
        // Continue to next service type
      }

      // Try WMS next
      try {
        const wmsResult = await Promise.race([
          validateWMSService(url, { signal }),
          new Promise<ServiceDetectionResult>((_, reject) =>
            setTimeout(
              () => reject(new Error("WMS validation timeout")),
              individualTimeout
            )
          )
        ])

        if (wmsResult.isValid) {
          return {
            ...wmsResult,
            serviceType: "WMS"
          }
        }
      } catch (error) {
        if (signal?.aborted) throw error
        // Continue to next service type
      }

      // Try WFS last
      try {
        const wfsResult = await Promise.race([
          validateWFSService(url, { signal }),
          new Promise<ServiceDetectionResult>((_, reject) =>
            setTimeout(
              () => reject(new Error("WFS validation timeout")),
              individualTimeout
            )
          )
        ])

        if (wfsResult.isValid) {
          return {
            ...wfsResult,
            serviceType: "WFS"
          }
        }
      } catch (error) {
        if (signal?.aborted) throw error
        // No valid service found
      }

      // No valid service found
      return {
        isValid: false,
        error: "Could not detect a valid GIS service at this URL"
      }
    }
  } catch (error) {
    console.error("Error detecting GIS service type:", error)

    if (error instanceof Error) {
      if (error.name === "AbortError" || error.message.includes("aborted")) {
        return {
          isValid: false,
          error: "Service detection was cancelled"
        }
      }

      if (error.message.includes("timeout")) {
        return {
          isValid: false,
          error: "Service detection timed out"
        }
      }
    }

    return {
      isValid: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }
  }
}

/**
 * Creates a MapLibre source configuration for a GIS service
 * @param service The GIS service info
 * @returns Source configuration for MapLibre
 */
export function createMapLibreSource(service: GISServiceInfo): any {
  // Handle different service types
  if ("type" in service) {
    switch (service.type) {
      case "MapServer":
        return {
          type: "raster",
          tiles: [
            `${service.url}/export?bbox={bbox-epsg-3857}&bboxSR=3857&imageSR=3857&size=256,256&dpi=96&format=png&transparent=true&f=image`
          ],
          tileSize: 256
        }

      case "FeatureServer":
        return {
          type: "geojson",
          data: `${service.url}/query?where=1%3D1&outFields=*&f=geojson`
        }

      case "VectorTileServer":
        return {
          type: "vector",
          tiles: [`${service.url}/tile/{z}/{y}/{x}.pbf`]
        }

      case "WMS":
        return {
          type: "raster",
          tiles: [
            `${service.url}?SERVICE=WMS&VERSION=${"version" in service ? service.version || "1.3.0" : "1.3.0"}&REQUEST=GetMap&BBOX={bbox-epsg-3857}&CRS=EPSG:3857&WIDTH=256&HEIGHT=256&LAYERS=${("layers" in service && service.layers?.[0]?.name) || ""}&STYLES=&FORMAT=image/png&TRANSPARENT=TRUE`
          ],
          tileSize: 256
        }

      case "WFS":
        return {
          type: "geojson",
          data: `${service.url}?SERVICE=WFS&VERSION=${"version" in service ? service.version || "2.0.0" : "2.0.0"}&REQUEST=GetFeature&TYPENAMES=${("layers" in service && service.layers?.[0]?.name) || ""}&OUTPUTFORMAT=application/json`
        }

      default:
        console.warn(`Unsupported service type: ${service.type}`)
        return null
    }
  }

  return null
}

/**
 * Creates a MapLibre layer configuration for a GIS service
 * @param service The GIS service info
 * @param sourceId The source ID to reference
 * @param layerId The layer ID to use
 * @returns Layer configuration for MapLibre
 */
export function createMapLibreLayer(
  service: GISServiceInfo,
  sourceId: string,
  layerId: string
): any {
  // Handle different service types
  if ("type" in service) {
    switch (service.type) {
      case "MapServer":
      case "WMS":
        return {
          id: layerId,
          type: "raster",
          source: sourceId,
          paint: {}
        }

      case "FeatureServer":
      case "WFS":
        // For feature services, we need to determine the geometry type
        // This is a simplified approach - in a real implementation, you'd inspect the actual data
        return {
          id: layerId,
          type: "circle", // Default to circle, could be line or fill based on geometry type
          source: sourceId,
          paint: {
            "circle-radius": 5,
            "circle-color": "#3b82f6",
            "circle-opacity": 0.8
          }
        }

      case "VectorTileServer":
        // For vector tiles, we need to know the source layer name
        // This is a simplified approach
        return {
          id: layerId,
          type: "fill",
          source: sourceId,
          "source-layer": "default", // Would need to be determined from the service
          paint: {
            "fill-color": "#3b82f6",
            "fill-opacity": 0.5,
            "fill-outline-color": "#2563eb"
          }
        }

      default:
        console.warn(`Unsupported service type: ${service.type}`)
        return null
    }
  }

  return null
}
