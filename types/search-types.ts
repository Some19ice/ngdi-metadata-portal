import { SelectMetadataRecord, SelectOrganization } from "@/db/schema"

// Base search parameters
export interface BaseSearchParams {
  query?: string
  limit?: number
  offset?: number
  page?: number
  pageSize?: number
  sortBy?: "relevance" | "date" | "title" | "updated" | "createdAt" | "status"
  sortOrder?: "asc" | "desc"
}

// Metadata-specific search filters
export interface MetadataSearchFilters extends BaseSearchParams {
  // Content filters
  dataTypes?: string[]
  frameworkTypes?: string[]
  organizations?: string[]
  organizationIds?: string[]
  topicCategories?: string[]
  keywords?: string[]
  status?: SelectMetadataRecord["status"][]

  // Temporal filters
  temporalRange?: {
    start?: string // ISO date string
    end?: string // ISO date string
  }

  // Legacy support for individual date fields
  startDate?: string
  endDate?: string
  temporalExtentStartDate?: string
  temporalExtentEndDate?: string

  // Spatial filters
  spatialBounds?: {
    north: number
    south: number
    east: number
    west: number
  }

  // Legacy bbox support
  bbox_north?: string
  bbox_south?: string
  bbox_east?: string
  bbox_west?: string
  useSpatialSearch?: boolean

  // User/Permission filters
  creatorUserId?: string
  canViewDrafts?: boolean
}

// Search facet interface
export interface SearchFacet {
  value: string
  count: number
  label?: string
}

// Search facets collection
export interface SearchFacets {
  dataTypes: SearchFacet[]
  frameworkTypes: SearchFacet[]
  organizations: SearchFacet[]
  topicCategories: SearchFacet[]
  years: SearchFacet[]
  statuses?: SearchFacet[]
}

// Enhanced metadata record for search results
export interface MetadataSearchRecord extends SelectMetadataRecord {
  organization?: {
    id: string
    name: string
  } | null
  relevanceScore?: number
  highlightedFields?: {
    title?: string
    abstract?: string
    keywords?: string[]
  }
}

// Search result interface
export interface MetadataSearchResult {
  records: MetadataSearchRecord[]
  totalCount: number
  totalPages?: number
  currentPage?: number
  pageSize?: number
  facets?: SearchFacets
  searchTime?: number
  appliedFilters?: Partial<MetadataSearchFilters>
}

// Search suggestion interface
export interface SearchSuggestion {
  id: string
  title: string
  type: "record" | "keyword" | "organization" | "category"
  relevance?: number
}

// Search analytics interface
export interface SearchAnalytics {
  query: string
  filters: Partial<MetadataSearchFilters>
  resultsCount: number
  searchTime: number
  userId?: string
  sessionId?: string
  timestamp: Date
}

// Search validation result
export interface SearchValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  normalizedFilters?: MetadataSearchFilters
}

// Search autocomplete interface
export interface SearchAutocomplete {
  query: string
  suggestions: SearchSuggestion[]
  categories: {
    records: SearchSuggestion[]
    keywords: SearchSuggestion[]
    organizations: SearchSuggestion[]
    categories: SearchSuggestion[]
  }
}

// Map-specific search interfaces
export interface MapSearchParams extends MetadataSearchFilters {
  viewport?: {
    center: [number, number] // [lat, lng]
    zoom: number
    bounds?: {
      north: number
      south: number
      east: number
      west: number
    }
  }
  includeGeometry?: boolean
  clusterResults?: boolean
}

export interface MapSearchResult {
  records: (MetadataSearchRecord & {
    geometry?: any
    center?: [number, number]
  })[]
  clusters?: {
    center: [number, number]
    count: number
    bounds: {
      north: number
      south: number
      east: number
      west: number
    }
  }[]
  totalCount: number
  facets?: SearchFacets
}

// Export utility types
export type SortDirection = "asc" | "desc"
export type SortField =
  | "relevance"
  | "date"
  | "title"
  | "updated"
  | "createdAt"
  | "status"
export type SearchMode = "simple" | "advanced" | "faceted" | "spatial"
export type SearchScope =
  | "all"
  | "published"
  | "drafts"
  | "my_records"
  | "organization"

// Search context for different views
export interface SearchContext {
  mode: SearchMode
  scope: SearchScope
  allowedStatuses: SelectMetadataRecord["status"][]
  defaultSort: SortField
  maxResults: number
}

// Advanced search builder interface
export interface AdvancedSearchQuery {
  fields: {
    title?: string
    abstract?: string
    keywords?: string[]
    purpose?: string
  }
  operators: {
    titleOperator?: "contains" | "exact" | "startsWith" | "endsWith"
    abstractOperator?: "contains" | "exact"
    keywordOperator?: "any" | "all" | "none"
  }
  filters: MetadataSearchFilters
  logic?: "and" | "or"
}
