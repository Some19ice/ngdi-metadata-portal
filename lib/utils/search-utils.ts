export interface SearchParams {
  q?: string
  type?: string
  page?: string
  error?: string
  // Metadata search specific params
  organization?: string
  dataType?: string
  topicCategory?: string
  startDate?: string
  endDate?: string
  bbox?: string
  temporalExtentStartDate?: string
  temporalExtentEndDate?: string
  frameworkType?: string
  datasetType?: string
  useSpatialSearch?: string
  bbox_north?: string
  bbox_south?: string
  bbox_east?: string
  bbox_west?: string
  sortBy?: string
  sortOrder?: string
}

/**
 * Valid search types for the application
 */
export const VALID_SEARCH_TYPES = ["auto", "metadata", "location"] as const
export type SearchType = (typeof VALID_SEARCH_TYPES)[number]

/**
 * Checks if a search type is valid
 */
export function isValidSearchType(type: string): type is SearchType {
  return VALID_SEARCH_TYPES.includes(type as SearchType)
}

/**
 * Gets a human-readable name for a search type
 */
export function getSearchTypeName(type: string): string {
  const typeMap: Record<SearchType, string> = {
    auto: "All Results",
    metadata: "Datasets",
    location: "Locations"
  }

  return typeMap[type as SearchType] || "Unknown"
}

/**
 * Transforms search parameters for metadata search, standardizing parameter names
 */
// Deprecated: use filtersToSearchParams/generateSearchUrl in search-params-utils
export function transformToMetadataParams(
  params: SearchParams
): URLSearchParams {
  const url = new URLSearchParams()
  if (params.q) url.set("q", params.q)
  if (params.page && params.page !== "1") url.set("page", params.page)
  return url
}

/**
 * Builds a metadata search URL with proper parameter transformation
 */
// Delegate to canonical generator in search-params-utils to avoid duplication
export function buildMetadataSearchUrl(params: SearchParams): string {
  try {
    const { generateSearchUrl } = require("@/lib/utils/search-params-utils")
    // Map older shape to canonical filters
    const filters = {
      query: params.q,
      page: params.page ? parseInt(params.page, 10) : undefined
    }
    return generateSearchUrl(filters as any, "/metadata/search")
  } catch {
    const baseUrl = "/metadata/search"
    const query = params.q ? `?q=${encodeURIComponent(params.q)}` : ""
    return `${baseUrl}${query}`
  }
}

/**
 * Validates search parameters and returns sanitized values
 */
export function validateSearchParams(params: SearchParams) {
  const query = params.q?.trim() || ""
  const searchType = params.type || "auto"
  const page = Math.max(1, parseInt(params.page || "1", 10))
  const error = params.error?.trim() || null

  return {
    query,
    searchType,
    page,
    error,
    rawParams: params
  }
}

/**
 * Gets appropriate search type based on query content and user selection
 */
export function determineSearchType(
  query: string,
  requestedType: string
): string {
  if (requestedType && requestedType !== "auto") {
    return requestedType
  }

  // Simple heuristics for auto-detection
  if (!query) return "auto"

  // Check if query looks like coordinates
  const coordPattern = /^-?\d+\.?\d*\s*,\s*-?\d+\.?\d*$/
  if (coordPattern.test(query.trim())) {
    return "location"
  }

  // Check for common location terms
  const locationTerms = ["state", "lga", "city", "town", "village", "region"]
  const queryLower = query.toLowerCase()
  if (locationTerms.some(term => queryLower.includes(term))) {
    return "location"
  }

  // Default to showing both
  return "auto"
}
