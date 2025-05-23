/**
 * ArcGIS Service Client
 * Provides utilities for working with ArcGIS REST services
 */

import { toast } from "sonner"

// Types for ArcGIS services
export interface ArcGISServiceInfo {
  name: string
  type:
    | "MapServer"
    | "FeatureServer"
    | "ImageServer"
    | "VectorTileServer"
    | string
  url: string
  description?: string
  copyrightText?: string
  capabilities?: string[]
  supportedOperations?: string[]
}

export interface ArcGISLayerInfo {
  id: number
  name: string
  type: string
  geometryType?: string
  minScale?: number
  maxScale?: number
  defaultVisibility?: boolean
  extent?: {
    xmin: number
    ymin: number
    xmax: number
    ymax: number
    spatialReference: {
      wkid: number
    }
  }
}

export interface ArcGISServiceResponse {
  currentVersion: number
  serviceDescription: string
  mapName: string
  description: string
  copyrightText: string
  supportedImageFormatTypes: string
  layers: ArcGISLayerInfo[]
  tables: any[]
  spatialReference: {
    wkid: number
    latestWkid?: number
  }
  singleFusedMapCache: boolean
  initialExtent: {
    xmin: number
    ymin: number
    xmax: number
    ymax: number
    spatialReference: {
      wkid: number
    }
  }
  fullExtent: {
    xmin: number
    ymin: number
    xmax: number
    ymax: number
    spatialReference: {
      wkid: number
    }
  }
  minScale: number
  maxScale: number
  units: string
  supportedExtensions: string
  documentInfo?: {
    Title: string
    Author: string
    Comments: string
    Subject: string
    Category: string
    Keywords: string
  }
}

/**
 * Validates an ArcGIS service URL
 * @param url The URL to validate
 * @returns Promise resolving to validation result
 */
export async function validateArcGISService(url: string): Promise<{
  isValid: boolean
  service?: ArcGISServiceInfo
  error?: string
}> {
  try {
    // Ensure URL ends with /rest/services or similar
    if (!url.includes("/rest/services")) {
      // Try to fix the URL if it's a partial URL
      if (url.includes("arcgis.com") && !url.includes("/rest/")) {
        url = `${url.replace(/\/$/, "")}/rest/services`
      }
    }

    // Add JSON format parameter if not present
    if (!url.includes("f=json")) {
      url = `${url}${url.includes("?") ? "&" : "?"}f=json`
    }

    // Create AbortController for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        },
        signal: controller.signal,
        mode: "cors" // Explicitly specify CORS mode
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        return {
          isValid: false,
          error: `Service returned status ${response.status}: ${response.statusText}`
        }
      }

      const data = await response.json()

      // Check if this is a valid ArcGIS service
      if (!data.serviceDescription && !data.services) {
        return {
          isValid: false,
          error: "Not a valid ArcGIS service"
        }
      }

      // Extract service info
      const serviceInfo: ArcGISServiceInfo = {
        name: data.mapName || data.name || "ArcGIS Service",
        type: url.includes("MapServer")
          ? "MapServer"
          : url.includes("FeatureServer")
            ? "FeatureServer"
            : url.includes("ImageServer")
              ? "ImageServer"
              : url.includes("VectorTileServer")
                ? "VectorTileServer"
                : "Unknown",
        url: url.replace(/\?f=json$/, ""),
        description: data.serviceDescription || data.description,
        copyrightText: data.copyrightText,
        capabilities: data.capabilities?.split(",") || []
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
    console.error("Error validating ArcGIS service:", error)

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
