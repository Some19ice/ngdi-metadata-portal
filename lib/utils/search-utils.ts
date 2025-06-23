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
export function transformToMetadataParams(
  params: SearchParams
): URLSearchParams {
  const metadataParams = new URLSearchParams()

  // Map central search 'q' to metadata search 'query' for consistency
  if (params.q) {
    metadataParams.set("query", params.q)
  }

  // Handle pagination
  if (params.page && params.page !== "1") {
    metadataParams.set("page", params.page)
  }

  // Map all metadata-specific parameters, handling both naming conventions
  const paramMappings: Array<[string, string]> = [
    ["organization", "organization"],
    ["dataType", "dataType"],
    ["topicCategory", "topicCategory"],
    ["startDate", "temporalExtentStartDate"],
    ["endDate", "temporalExtentEndDate"],
    ["temporalExtentStartDate", "temporalExtentStartDate"],
    ["temporalExtentEndDate", "temporalExtentEndDate"],
    ["frameworkType", "frameworkType"],
    ["datasetType", "datasetType"],
    ["useSpatialSearch", "useSpatialSearch"],
    ["bbox_north", "bbox_north"],
    ["bbox_south", "bbox_south"],
    ["bbox_east", "bbox_east"],
    ["bbox_west", "bbox_west"],
    ["bbox", "bbox"],
    ["sortBy", "sortBy"],
    ["sortOrder", "sortOrder"]
  ]

  paramMappings.forEach(([sourceKey, targetKey]) => {
    const value = params[sourceKey as keyof SearchParams]
    if (value && value !== "") {
      metadataParams.set(targetKey, value)
    }
  })

  return metadataParams
}

/**
 * Builds a metadata search URL with proper parameter transformation
 */
export function buildMetadataSearchUrl(params: SearchParams): string {
  const transformedParams = transformToMetadataParams(params)
  const baseUrl = "/(app)/metadata/search"
  const queryString = transformedParams.toString()
  return queryString ? `${baseUrl}?${queryString}` : baseUrl
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
