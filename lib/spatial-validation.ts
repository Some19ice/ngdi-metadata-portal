/**
 * Spatial Coordinate Validation Utilities
 * Task 49.5: Enhanced coordinate validation for NGDI Metadata Portal
 */

/**
 * Validates latitude values are within valid geographic bounds
 */
export function isValidLatitude(lat: number): boolean {
  return lat >= -90 && lat <= 90
}

/**
 * Validates longitude values are within valid geographic bounds
 */
export function isValidLongitude(lng: number): boolean {
  return lng >= -180 && lng <= 180
}

/**
 * Validates a coordinate pair (lat, lng)
 */
export function isValidCoordinate(lat: number, lng: number): boolean {
  return isValidLatitude(lat) && isValidLongitude(lng)
}

/**
 * Validates bounding box coordinates make logical sense
 */
export function isValidBoundingBox(
  west: number,
  east: number,
  north: number,
  south: number
): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  // Check individual coordinate validity
  if (!isValidLongitude(west)) {
    errors.push("West longitude must be between -180 and 180")
  }
  if (!isValidLongitude(east)) {
    errors.push("East longitude must be between -180 and 180")
  }
  if (!isValidLatitude(north)) {
    errors.push("North latitude must be between -90 and 90")
  }
  if (!isValidLatitude(south)) {
    errors.push("South latitude must be between -90 and 90")
  }

  // Check logical relationships
  if (west >= east) {
    errors.push("West longitude must be less than east longitude")
  }
  if (south >= north) {
    errors.push("South latitude must be less than north latitude")
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Validates vertical extent values
 */
export function isValidVerticalExtent(
  min: number,
  max: number
): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  if (min >= max) {
    errors.push("Minimum elevation must be less than maximum elevation")
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Normalizes longitude to be within -180 to 180 range
 */
export function normalizeLongitude(lng: number): number {
  let normalized = lng % 360
  if (normalized > 180) {
    normalized -= 360
  } else if (normalized < -180) {
    normalized += 360
  }
  return normalized
}

/**
 * Calculates the distance between two coordinates in kilometers using Haversine formula
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1)
  const dLng = toRadians(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Converts degrees to radians
 */
function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180
}

/**
 * Calculates bounding box area in square kilometers
 */
export function calculateBoundingBoxArea(
  west: number,
  east: number,
  north: number,
  south: number
): number {
  if (!isValidBoundingBox(west, east, north, south).isValid) {
    throw new Error("Invalid bounding box coordinates")
  }

  // Calculate the area using spherical geometry approximation
  const deltaLat = north - south
  const deltaLng = east - west
  const avgLat = (north + south) / 2

  const latDistance = deltaLat * 111 // Approximately 111 km per degree latitude
  const lngDistance = deltaLng * 111 * Math.cos(toRadians(avgLat))

  return latDistance * lngDistance
}

/**
 * Validates if coordinates are within Nigeria's approximate bounds
 */
export function isWithinNigeria(lat: number, lng: number): boolean {
  // Nigeria's approximate bounding box
  const NIGERIA_BOUNDS = {
    north: 13.9,
    south: 4.3,
    west: 2.7,
    east: 14.7
  }

  return (
    lat >= NIGERIA_BOUNDS.south &&
    lat <= NIGERIA_BOUNDS.north &&
    lng >= NIGERIA_BOUNDS.west &&
    lng <= NIGERIA_BOUNDS.east
  )
}

/**
 * Common coordinate reference systems used in Nigeria
 */
export const NIGERIA_CRS = {
  WGS84: "EPSG:4326",
  UTM_ZONE_31N: "EPSG:32631", // Western Nigeria
  UTM_ZONE_32N: "EPSG:32632", // Central Nigeria
  UTM_ZONE_33N: "EPSG:32633", // Eastern Nigeria
  MINNA_DATUM: "EPSG:4307",
  NIGERIA_WEST_BELT: "EPSG:26391",
  NIGERIA_MID_BELT: "EPSG:26392",
  NIGERIA_EAST_BELT: "EPSG:26393"
}

/**
 * Suggests appropriate CRS based on longitude for Nigeria
 */
export function suggestNigeriaCRS(lng: number): string {
  if (lng < 6) {
    return NIGERIA_CRS.UTM_ZONE_31N // Western Nigeria
  } else if (lng < 12) {
    return NIGERIA_CRS.UTM_ZONE_32N // Central Nigeria
  } else {
    return NIGERIA_CRS.UTM_ZONE_33N // Eastern Nigeria
  }
}
