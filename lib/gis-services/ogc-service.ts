/**
 * OGC Service Client
 * Provides utilities for working with OGC services (WMS, WFS, etc.)
 */

import { toast } from "sonner"
import { parseStringPromise } from "xml2js"

// Types for OGC services
export interface OGCServiceInfo {
  name: string
  type: "WMS" | "WFS" | "WMTS" | string
  url: string
  version?: string
  title?: string
  abstract?: string
  layers?: OGCLayerInfo[]
  capabilities?: string[]
}

export interface OGCLayerInfo {
  name: string
  title: string
  abstract?: string
  crs?: string[]
  bbox?: {
    minx: number
    miny: number
    maxx: number
    maxy: number
    crs: string
  }
  styles?: {
    name: string
    title: string
    legendUrl?: string
  }[]
}

/**
 * Validates a WMS service URL
 * @param url The URL to validate
 * @returns Promise resolving to validation result
 */
export async function validateWMSService(url: string): Promise<{
  isValid: boolean
  service?: OGCServiceInfo
  error?: string
}> {
  try {
    // Ensure URL has GetCapabilities request
    if (!url.includes("GetCapabilities")) {
      // Add GetCapabilities parameters
      const separator = url.includes("?") ? "&" : "?"
      url = `${url}${separator}SERVICE=WMS&REQUEST=GetCapabilities`
    }

    // Create AbortController for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    try {
      const response = await fetch(url, {
        method: "GET",
        signal: controller.signal,
        mode: "cors"
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        return {
          isValid: false,
          error: `Service returned status ${response.status}: ${response.statusText}`
        }
      }

      const text = await response.text()

      // Parse XML response
      const result = await parseStringPromise(text, {
        explicitArray: false,
        mergeAttrs: true
      })

      // Check if this is a valid WMS service
      if (!result.WMS_Capabilities && !result.WMT_MS_Capabilities) {
        return {
          isValid: false,
          error: "Not a valid WMS service"
        }
      }

      const capabilities = result.WMS_Capabilities || result.WMT_MS_Capabilities
      const service = capabilities.Service
      const capability = capabilities.Capability

      // Extract layers
      const extractLayers = (layerObj: any): OGCLayerInfo[] => {
        if (!layerObj) return []

        const layers: OGCLayerInfo[] = []

        // Handle single layer
        if (layerObj.Layer && !Array.isArray(layerObj.Layer)) {
          const layer = layerObj.Layer
          layers.push({
            name: layer.Name || "",
            title: layer.Title || "",
            abstract: layer.Abstract || "",
            crs: layer.CRS || layer.SRS || []
          })
        }

        // Handle layer array
        if (layerObj.Layer && Array.isArray(layerObj.Layer)) {
          layerObj.Layer.forEach((layer: any) => {
            layers.push({
              name: layer.Name || "",
              title: layer.Title || "",
              abstract: layer.Abstract || "",
              crs: layer.CRS || layer.SRS || []
            })

            // Recursively add nested layers
            if (layer.Layer) {
              layers.push(...extractLayers(layer))
            }
          })
        }

        return layers
      }

      // Extract service info
      const serviceInfo: OGCServiceInfo = {
        name: service.Name || service.Title || "WMS Service",
        type: "WMS",
        url: url.split("?")[0], // Base URL without parameters
        version: capabilities.version,
        title: service.Title,
        abstract: service.Abstract,
        layers: extractLayers(capability.Layer),
        capabilities: ["GetMap", "GetCapabilities"]
      }

      return {
        isValid: true,
        service: serviceInfo
      }
    } catch (fetchError) {
      clearTimeout(timeoutId)

      // Handle specific CORS and network errors
      if (fetchError instanceof Error) {
        if (fetchError.name === "AbortError") {
          return {
            isValid: false,
            error: "Request timed out after 10 seconds"
          }
        } else if (
          fetchError.message.includes("CORS") ||
          fetchError.message.includes("Network")
        ) {
          return {
            isValid: false,
            error:
              "Unable to access service due to CORS policy or network restrictions. The service URL appears to be valid but cannot be validated from the browser."
          }
        }
      }
      throw fetchError // Re-throw if not a known error type
    }
  } catch (error) {
    console.error("Error validating WMS service:", error)

    // Provide more helpful error messages
    let errorMessage = "Unknown error"
    if (error instanceof Error) {
      if (error.message.includes("Failed to fetch")) {
        errorMessage =
          "Unable to connect to the service. This may be due to CORS restrictions or the service being unavailable."
      } else if (error.message.includes("NetworkError")) {
        errorMessage =
          "Network error occurred while trying to validate the service."
      } else {
        errorMessage = error.message
      }
    }

    return {
      isValid: false,
      error: errorMessage
    }
  }
}

/**
 * Validates a WFS service URL
 * @param url The URL to validate
 * @returns Promise resolving to validation result
 */
export async function validateWFSService(url: string): Promise<{
  isValid: boolean
  service?: OGCServiceInfo
  error?: string
}> {
  try {
    // Ensure URL has GetCapabilities request
    if (!url.includes("GetCapabilities")) {
      // Add GetCapabilities parameters
      const separator = url.includes("?") ? "&" : "?"
      url = `${url}${separator}SERVICE=WFS&REQUEST=GetCapabilities`
    }

    // Create AbortController for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    try {
      const response = await fetch(url, {
        method: "GET",
        signal: controller.signal,
        mode: "cors"
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        return {
          isValid: false,
          error: `Service returned status ${response.status}: ${response.statusText}`
        }
      }

      const text = await response.text()

      // Parse XML response
      const result = await parseStringPromise(text, {
        explicitArray: false,
        mergeAttrs: true
      })

      // Check if this is a valid WFS service
      if (!result.WFS_Capabilities) {
        return {
          isValid: false,
          error: "Not a valid WFS service"
        }
      }

      const capabilities = result.WFS_Capabilities
      const service = capabilities.ServiceIdentification || capabilities.Service

      // Extract service info
      const serviceInfo: OGCServiceInfo = {
        name: service.Name || service.Title || "WFS Service",
        type: "WFS",
        url: url.split("?")[0], // Base URL without parameters
        version: capabilities.version,
        title: service.Title,
        abstract: service.Abstract,
        capabilities: ["GetFeature", "GetCapabilities"]
      }

      return {
        isValid: true,
        service: serviceInfo
      }
    } catch (fetchError) {
      clearTimeout(timeoutId)

      // Handle specific CORS and network errors
      if (fetchError instanceof Error) {
        if (fetchError.name === "AbortError") {
          return {
            isValid: false,
            error: "Request timed out after 10 seconds"
          }
        } else if (
          fetchError.message.includes("CORS") ||
          fetchError.message.includes("Network")
        ) {
          return {
            isValid: false,
            error:
              "Unable to access service due to CORS policy or network restrictions. The service URL appears to be valid but cannot be validated from the browser."
          }
        }
      }
      throw fetchError // Re-throw if not a known error type
    }
  } catch (error) {
    console.error("Error validating WFS service:", error)

    // Provide more helpful error messages
    let errorMessage = "Unknown error"
    if (error instanceof Error) {
      if (error.message.includes("Failed to fetch")) {
        errorMessage =
          "Unable to connect to the service. This may be due to CORS restrictions or the service being unavailable."
      } else if (error.message.includes("NetworkError")) {
        errorMessage =
          "Network error occurred while trying to validate the service."
      } else {
        errorMessage = error.message
      }
    }

    return {
      isValid: false,
      error: errorMessage
    }
  }
}
