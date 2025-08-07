import { MetadataSearchFilters } from "@/types"

/**
 * Standard search parameter names used across the application
 */
export const SEARCH_PARAM_NAMES = {
  // Core search
  query: "q", // Standardize to 'q' for consistency with global search
  page: "page",
  limit: "limit",
  sortBy: "sort",
  sortOrder: "order",

  // Filters
  dataTypes: "types",
  organizations: "orgs",
  organizationIds: "orgIds",
  topicCategories: "topics",
  frameworkTypes: "frameworks",
  keywords: "keywords",
  status: "status",

  // Temporal
  startDate: "from",
  endDate: "to",
  temporalExtentStartDate: "tempFrom",
  temporalExtentEndDate: "tempTo",

  // Spatial
  bboxNorth: "n",
  bboxSouth: "s",
  bboxEast: "e",
  bboxWest: "w",
  useSpatialSearch: "spatial",

  // User
  creatorUserId: "creator"
} as const

/**
 * Parse URL search params into MetadataSearchFilters using standardized parameter names
 */
export function parseSearchParams(
  searchParams: URLSearchParams
): MetadataSearchFilters {
  const filters: MetadataSearchFilters = {}

  // Text search - support both 'q' and 'query' for backward compatibility
  const query =
    searchParams.get(SEARCH_PARAM_NAMES.query) || searchParams.get("query")
  if (query?.trim()) {
    filters.query = query.trim()
  }

  // Array filters
  const arrayFilters = [
    { param: SEARCH_PARAM_NAMES.dataTypes, field: "dataTypes" as const },
    {
      param: SEARCH_PARAM_NAMES.organizations,
      field: "organizations" as const
    },
    {
      param: SEARCH_PARAM_NAMES.organizationIds,
      field: "organizationIds" as const
    },
    {
      param: SEARCH_PARAM_NAMES.topicCategories,
      field: "topicCategories" as const
    },
    {
      param: SEARCH_PARAM_NAMES.frameworkTypes,
      field: "frameworkTypes" as const
    },
    { param: SEARCH_PARAM_NAMES.keywords, field: "keywords" as const }
  ]

  arrayFilters.forEach(({ param, field }) => {
    const value = searchParams.get(param)
    if (value) {
      const items = value
        .split(",")
        .filter(Boolean)
        .map(s => s.trim())
      if (items.length > 0) {
        filters[field] = items
      }
    }
  })

  // Status filter
  const status = searchParams.get(SEARCH_PARAM_NAMES.status)
  if (status) {
    const statuses = status
      .split(",")
      .filter(Boolean)
      .map(s => s.trim())
    if (statuses.length > 0) {
      filters.status = statuses as any
    }
  }

  // Date filters with validation
  const dateFilters = [
    { param: SEARCH_PARAM_NAMES.startDate, field: "startDate" as const },
    { param: SEARCH_PARAM_NAMES.endDate, field: "endDate" as const },
    {
      param: SEARCH_PARAM_NAMES.temporalExtentStartDate,
      field: "temporalExtentStartDate" as const
    },
    {
      param: SEARCH_PARAM_NAMES.temporalExtentEndDate,
      field: "temporalExtentEndDate" as const
    }
  ]

  dateFilters.forEach(({ param, field }) => {
    const value = searchParams.get(param)
    if (value) {
      try {
        const date = new Date(value)
        if (!isNaN(date.getTime())) {
          filters[field] = value
        }
      } catch (e) {
        console.warn(`Invalid ${field}:`, value)
      }
    }
  })

  // Spatial bounds with validation
  const north = searchParams.get(SEARCH_PARAM_NAMES.bboxNorth)
  const south = searchParams.get(SEARCH_PARAM_NAMES.bboxSouth)
  const east = searchParams.get(SEARCH_PARAM_NAMES.bboxEast)
  const west = searchParams.get(SEARCH_PARAM_NAMES.bboxWest)

  if (north && south && east && west) {
    try {
      const bounds = {
        north: parseFloat(north),
        south: parseFloat(south),
        east: parseFloat(east),
        west: parseFloat(west)
      }

      if (
        Object.values(bounds).every(v => !isNaN(v)) &&
        bounds.north > bounds.south &&
        bounds.east > bounds.west &&
        bounds.north >= -90 &&
        bounds.north <= 90 &&
        bounds.south >= -90 &&
        bounds.south <= 90 &&
        bounds.east >= -180 &&
        bounds.east <= 180 &&
        bounds.west >= -180 &&
        bounds.west <= 180
      ) {
        filters.spatialBounds = bounds
      }
    } catch (e) {
      console.warn("Invalid bbox parameters")
    }
  }

  // Boolean flags
  if (searchParams.get(SEARCH_PARAM_NAMES.useSpatialSearch) === "true") {
    filters.useSpatialSearch = true
  }

  // User filter
  const creatorUserId = searchParams.get(SEARCH_PARAM_NAMES.creatorUserId)
  if (creatorUserId) {
    filters.creatorUserId = creatorUserId
  }

  // Pagination with validation
  const limit = searchParams.get(SEARCH_PARAM_NAMES.limit)
  if (limit) {
    const parsed = parseInt(limit, 10)
    if (!isNaN(parsed) && parsed > 0 && parsed <= 100) {
      filters.limit = parsed
    }
  }

  const page = searchParams.get(SEARCH_PARAM_NAMES.page)
  if (page) {
    const parsed = parseInt(page, 10)
    if (!isNaN(parsed) && parsed > 0) {
      filters.page = parsed
    }
  }

  // Sorting with validation
  const sortBy = searchParams.get(SEARCH_PARAM_NAMES.sortBy)
  if (sortBy) {
    const validSorts = [
      "relevance",
      "date",
      "title",
      "updated",
      "createdAt",
      "status"
    ]
    if (validSorts.includes(sortBy)) {
      filters.sortBy = sortBy as any
    }
  }

  const sortOrder = searchParams.get(SEARCH_PARAM_NAMES.sortOrder)
  if (sortOrder && ["asc", "desc"].includes(sortOrder)) {
    filters.sortOrder = sortOrder as any
  }

  return filters
}

/**
 * Convert MetadataSearchFilters to URLSearchParams using standardized parameter names
 */
export function filtersToSearchParams(
  filters: MetadataSearchFilters
): URLSearchParams {
  const params = new URLSearchParams()

  // Text search
  if (filters.query?.trim()) {
    params.set(SEARCH_PARAM_NAMES.query, filters.query.trim())
  }

  // Array filters
  const arrayFilters = [
    { field: "dataTypes", param: SEARCH_PARAM_NAMES.dataTypes },
    { field: "organizations", param: SEARCH_PARAM_NAMES.organizations },
    { field: "organizationIds", param: SEARCH_PARAM_NAMES.organizationIds },
    { field: "topicCategories", param: SEARCH_PARAM_NAMES.topicCategories },
    { field: "frameworkTypes", param: SEARCH_PARAM_NAMES.frameworkTypes },
    { field: "keywords", param: SEARCH_PARAM_NAMES.keywords }
  ] as const

  arrayFilters.forEach(({ field, param }) => {
    const value = filters[field]
    if (value?.length) {
      params.set(param, value.join(","))
    }
  })

  // Status filter
  if (filters.status?.length) {
    params.set(SEARCH_PARAM_NAMES.status, filters.status.join(","))
  }

  // Date filters
  const dateFilters = [
    { field: "startDate", param: SEARCH_PARAM_NAMES.startDate },
    { field: "endDate", param: SEARCH_PARAM_NAMES.endDate },
    {
      field: "temporalExtentStartDate",
      param: SEARCH_PARAM_NAMES.temporalExtentStartDate
    },
    {
      field: "temporalExtentEndDate",
      param: SEARCH_PARAM_NAMES.temporalExtentEndDate
    }
  ] as const

  dateFilters.forEach(({ field, param }) => {
    const value = filters[field]
    if (value) {
      params.set(param, value)
    }
  })

  // Spatial bounds
  if (filters.spatialBounds) {
    params.set(
      SEARCH_PARAM_NAMES.bboxNorth,
      filters.spatialBounds.north.toString()
    )
    params.set(
      SEARCH_PARAM_NAMES.bboxSouth,
      filters.spatialBounds.south.toString()
    )
    params.set(
      SEARCH_PARAM_NAMES.bboxEast,
      filters.spatialBounds.east.toString()
    )
    params.set(
      SEARCH_PARAM_NAMES.bboxWest,
      filters.spatialBounds.west.toString()
    )
  }

  // Boolean flags
  if (filters.useSpatialSearch) {
    params.set(SEARCH_PARAM_NAMES.useSpatialSearch, "true")
  }

  // User filter
  if (filters.creatorUserId) {
    params.set(SEARCH_PARAM_NAMES.creatorUserId, filters.creatorUserId)
  }

  // Pagination
  if (filters.limit && filters.limit !== 20) {
    // Only include if different from default
    params.set(SEARCH_PARAM_NAMES.limit, filters.limit.toString())
  }

  if (filters.page && filters.page > 1) {
    // Only include if not first page
    params.set(SEARCH_PARAM_NAMES.page, filters.page.toString())
  }

  // Sorting
  if (filters.sortBy && filters.sortBy !== "relevance") {
    // Only include if not default
    params.set(SEARCH_PARAM_NAMES.sortBy, filters.sortBy)
  }

  if (filters.sortOrder && filters.sortOrder !== "desc") {
    // Only include if not default
    params.set(SEARCH_PARAM_NAMES.sortOrder, filters.sortOrder)
  }

  return params
}

/**
 * Generate a canonical URL for search with the given filters
 */
export function generateSearchUrl(
  filters: MetadataSearchFilters,
  basePath = "/metadata/search"
): string {
  const params = filtersToSearchParams(filters)
  const queryString = params.toString()
  return `${basePath}${queryString ? `?${queryString}` : ""}`
}

/**
 * Normalize filters by removing empty values and applying defaults
 */
export function normalizeFilters(
  filters: Partial<MetadataSearchFilters>
): MetadataSearchFilters {
  const normalized: MetadataSearchFilters = {}

  // Only include non-empty values
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      if (Array.isArray(value) && value.length === 0) {
        return // Skip empty arrays
      }
      // Use type assertion to handle the dynamic property assignment
      ;(normalized as any)[key] = value
    }
  })

  // Apply defaults
  if (!normalized.sortBy) {
    normalized.sortBy = "relevance"
  }

  if (!normalized.sortOrder) {
    normalized.sortOrder = "desc"
  }

  if (!normalized.limit) {
    normalized.limit = 20
  }

  if (!normalized.page) {
    normalized.page = 1
  }

  return normalized
}
