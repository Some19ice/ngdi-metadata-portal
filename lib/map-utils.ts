/**
 * Utility functions for working with maps and spatial data
 */

import { LngLatBounds } from "maplibre-gl"
import { SelectMetadataRecord } from "@/db/schema"

export interface MetadataRecord {
  id: string
  title: string
  northBoundLatitude?: string | null
  southBoundLatitude?: string | null
  eastBoundLongitude?: string | null
  westBoundLongitude?: string | null
  description?: string | null
  [key: string]: any
}

/**
 * Transform a database metadata record to the MetadataRecord interface expected by map components
 */
export function transformDatabaseRecordToMapRecord(
  dbRecord: SelectMetadataRecord
): MetadataRecord | null {
  // Extract spatial bounds from the spatialInfo JSONB field
  const spatialInfo = dbRecord.spatialInfo as any
  const boundingBox = spatialInfo?.boundingBox

  if (!boundingBox) {
    return null // No spatial bounds available
  }

  const {
    northBoundingCoordinate,
    southBoundingCoordinate,
    eastBoundingCoordinate,
    westBoundingCoordinate
  } = boundingBox

  // Validate that all coordinates exist
  if (
    northBoundingCoordinate == null ||
    southBoundingCoordinate == null ||
    eastBoundingCoordinate == null ||
    westBoundingCoordinate == null
  ) {
    return null
  }

  return {
    id: dbRecord.id,
    title: dbRecord.title,
    northBoundLatitude: String(northBoundingCoordinate),
    southBoundLatitude: String(southBoundingCoordinate),
    eastBoundLongitude: String(eastBoundingCoordinate),
    westBoundLongitude: String(westBoundingCoordinate),
    description: dbRecord.abstract,
    // Include additional metadata for potential use
    dataType: dbRecord.dataType,
    status: dbRecord.status,
    keywords: dbRecord.keywords,
    organization: (dbRecord as any).organization,
    createdAt: dbRecord.createdAt,
    updatedAt: dbRecord.updatedAt
  }
}

/**
 * Transform multiple database records to map records, filtering out those without spatial bounds
 */
export function transformDatabaseRecordsToMapRecords(
  dbRecords: SelectMetadataRecord[]
): MetadataRecord[] {
  return dbRecords
    .map(transformDatabaseRecordToMapRecord)
    .filter((record): record is MetadataRecord => record !== null)
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
