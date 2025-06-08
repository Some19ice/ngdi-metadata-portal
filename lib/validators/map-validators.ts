import { z } from "zod"

// Coordinate validation schemas
export const latitudeSchema = z.number().min(-90).max(90)
export const longitudeSchema = z.number().min(-180).max(180)

export const coordinateSchema = z.tuple([longitudeSchema, latitudeSchema])

export const boundingBoxSchema = z
  .object({
    north: latitudeSchema,
    south: latitudeSchema,
    east: longitudeSchema,
    west: longitudeSchema
  })
  .refine(data => data.north > data.south, {
    message: "North bound must be greater than south bound"
  })
  .refine(
    data => {
      // Handle antimeridian crossing
      return true // Allow east < west for antimeridian crossing
    },
    {
      message: "Invalid bounding box"
    }
  )

// Search input validation
export const searchQuerySchema = z
  .string()
  .min(2, "Search query must be at least 2 characters")
  .max(200, "Search query must be less than 200 characters")
  .regex(/^[a-zA-Z0-9\s\-.,'"]+$/, "Search query contains invalid characters")
  .transform(val => val.trim())

// Geocoding parameters validation
export const geocodingParamsSchema = z.object({
  searchText: searchQuerySchema,
  autocomplete: z.boolean().optional().default(true),
  limit: z.number().int().min(1).max(20).optional().default(5),
  country: z
    .string()
    .regex(/^[A-Z]{2}(,[A-Z]{2})*$/)
    .optional(),
  bbox: z
    .tuple([longitudeSchema, latitudeSchema, longitudeSchema, latitudeSchema])
    .optional(),
  proximity: coordinateSchema.optional()
})

// Map style validation
export const mapStyleIdSchema = z
  .string()
  .regex(/^[a-z0-9\-]+$/, "Invalid style ID format")

// GIS service URL validation
export const gisServiceUrlSchema = z
  .string()
  .url("Invalid URL format")
  .refine(url => {
    try {
      const parsed = new URL(url)
      // Allow only HTTPS in production
      if (
        process.env.NODE_ENV === "production" &&
        parsed.protocol !== "https:"
      ) {
        return false
      }
      // Check for common GIS service patterns
      const validPatterns = [
        /\/rest\/services\//i, // ArcGIS
        /\/wms/i, // WMS
        /\/wfs/i, // WFS
        /\/wmts/i, // WMTS
        /\/tiles\//i // Tile services
      ]
      return validPatterns.some(pattern => pattern.test(url))
    } catch {
      return false
    }
  }, "Invalid GIS service URL")

// Sanitization helpers
export function sanitizeSearchInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, "") // Remove potential HTML tags
    .replace(/\s+/g, " ") // Normalize whitespace
    .slice(0, 200) // Enforce max length
}

export function sanitizeCoordinate(coord: number, isLatitude: boolean): number {
  if (isLatitude) {
    return Math.max(-90, Math.min(90, coord))
  } else {
    return Math.max(-180, Math.min(180, coord))
  }
}

export function validateAndSanitizeBounds(bounds: any): {
  isValid: boolean
  sanitized?: {
    north: number
    south: number
    east: number
    west: number
  }
  error?: string
} {
  try {
    const parsed = boundingBoxSchema.parse(bounds)
    return {
      isValid: true,
      sanitized: parsed
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        error: error.errors[0]?.message || "Invalid bounds"
      }
    }
    return {
      isValid: false,
      error: "Invalid bounds format"
    }
  }
}

// Rate limiting helper
export class RateLimiter {
  private requests: Map<string, number[]> = new Map()

  constructor(
    private maxRequests: number,
    private windowMs: number
  ) {}

  isAllowed(key: string): boolean {
    const now = Date.now()
    const requests = this.requests.get(key) || []

    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < this.windowMs)

    if (validRequests.length >= this.maxRequests) {
      return false
    }

    validRequests.push(now)
    this.requests.set(key, validRequests)

    // Cleanup old entries periodically
    if (Math.random() < 0.01) {
      this.cleanup()
    }

    return true
  }

  private cleanup() {
    const now = Date.now()
    for (const [key, requests] of this.requests.entries()) {
      const validRequests = requests.filter(time => now - time < this.windowMs)
      if (validRequests.length === 0) {
        this.requests.delete(key)
      } else {
        this.requests.set(key, validRequests)
      }
    }
  }
}

// Create rate limiter instances
export const searchRateLimiter = new RateLimiter(10, 60000) // 10 requests per minute
export const geocodingRateLimiter = new RateLimiter(30, 60000) // 30 requests per minute
