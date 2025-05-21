/**
 * Utility functions for working with maps and spatial data
 */

import { LngLatBounds } from "maplibre-gl"

export interface MetadataRecord {
  id: string
  title: string
  northBoundLatitude?: string | null
  southBoundLatitude?: string | null
  eastBoundLongitude?: string | null
  westBoundLongitude?: string | null
  [key: string]: any
}

/**
 * Check if a metadata record has valid spatial bounds
 */
export function hasValidSpatialBounds(record: MetadataRecord): boolean {
  const hasNorth = !!record.northBoundLatitude
  const hasSouth = !!record.southBoundLatitude
  const hasEast = !!record.eastBoundLongitude
  const hasWest = !!record.westBoundLongitude

  return hasNorth && hasSouth && hasEast && hasWest
}

/**
 * Get the center point of a metadata record's bounding box
 */
export function getRecordCenter(
  record: MetadataRecord
): [number, number] | null {
  if (!hasValidSpatialBounds(record)) return null

  const north = parseFloat(record.northBoundLatitude || "0")
  const south = parseFloat(record.southBoundLatitude || "0")
  const east = parseFloat(record.eastBoundLongitude || "0")
  const west = parseFloat(record.westBoundLongitude || "0")

  // Use center of bounding box
  const centerLat = (north + south) / 2
  const centerLng = (east + west) / 2

  return [centerLng, centerLat]
}

/**
 * Get the bounding box of a metadata record
 */
export function getRecordBounds(record: MetadataRecord): LngLatBounds | null {
  if (!hasValidSpatialBounds(record)) return null

  const north = parseFloat(record.northBoundLatitude || "0")
  const south = parseFloat(record.southBoundLatitude || "0")
  const east = parseFloat(record.eastBoundLongitude || "0")
  const west = parseFloat(record.westBoundLongitude || "0")

  return new LngLatBounds([west, south], [east, north])
}

/**
 * Convert a metadata record to a GeoJSON Feature
 */
export function recordToGeoJSON(
  record: MetadataRecord
): GeoJSON.Feature | null {
  if (!hasValidSpatialBounds(record)) return null

  const north = parseFloat(record.northBoundLatitude || "0")
  const south = parseFloat(record.southBoundLatitude || "0")
  const east = parseFloat(record.eastBoundLongitude || "0")
  const west = parseFloat(record.westBoundLongitude || "0")

  // Create a polygon feature for the bounding box
  return {
    type: "Feature",
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [west, north],
          [east, north],
          [east, south],
          [west, south],
          [west, north] // Close the polygon
        ]
      ]
    },
    properties: {
      id: record.id,
      title: record.title,
      ...record
    }
  }
}

/**
 * Convert multiple metadata records to a GeoJSON FeatureCollection
 */
export function recordsToGeoJSON(
  records: MetadataRecord[]
): GeoJSON.FeatureCollection {
  const features = records
    .map(recordToGeoJSON)
    .filter((feature): feature is GeoJSON.Feature => feature !== null)

  return {
    type: "FeatureCollection",
    features
  }
}

/**
 * Calculate bounds that encompass all records
 */
export function calculateBoundsForRecords(
  records: MetadataRecord[]
): LngLatBounds | null {
  const validRecords = records.filter(hasValidSpatialBounds)

  if (validRecords.length === 0) return null

  // Start with the bounds of the first record
  const firstBounds = getRecordBounds(validRecords[0])
  if (!firstBounds) return null

  // Extend bounds to include all other records
  return validRecords.slice(1).reduce((bounds, record) => {
    const recordBounds = getRecordBounds(record)
    if (recordBounds) {
      bounds.extend(recordBounds)
    }
    return bounds
  }, firstBounds)
}

/**
 * Format coordinates for display
 */
export function formatCoordinates(lat: number, lng: number): string {
  const latDir = lat >= 0 ? "N" : "S"
  const lngDir = lng >= 0 ? "E" : "W"

  return `${Math.abs(lat).toFixed(4)}° ${latDir}, ${Math.abs(lng).toFixed(4)}° ${lngDir}`
}
