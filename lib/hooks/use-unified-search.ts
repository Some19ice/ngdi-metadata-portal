import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { MetadataSearchFilters, MetadataSearchResult } from "@/types"
import {
  parseSearchParams,
  filtersToSearchParams,
  generateSearchUrl,
  normalizeFilters
} from "@/lib/utils/search-params-utils"
import {
  trackSearch,
  getSessionId,
  sanitizeQuery,
  sanitizeFilters
} from "@/lib/analytics/search-analytics"

/**
 * Threshold for determining meaningful search filters.
 * Represents the typical number of default filter properties (sortBy, sortOrder, limit, page)
 * that don't constitute actual search criteria. When the filter count exceeds this threshold,
 * it indicates the presence of meaningful search filters that warrant performing a search.
 */
const DEFAULT_FILTER_PROPERTIES_COUNT = 4

interface UseUnifiedSearchOptions {
  debounceMs?: number
  autoSearch?: boolean
  updateUrl?: boolean
  basePath?: string
}

interface UseUnifiedSearchReturn {
  // State
  filters: MetadataSearchFilters
  results: MetadataSearchResult | null
  isLoading: boolean
  error: string | null

  // Actions
  updateFilter: (key: keyof MetadataSearchFilters, value: any) => void
  updateFilters: (newFilters: Partial<MetadataSearchFilters>) => void
  clearFilter: (key: keyof MetadataSearchFilters) => void
  clearAllFilters: () => void
  search: (customFilters?: Partial<MetadataSearchFilters>) => Promise<void>
  reset: () => void

  // Computed
  hasActiveFilters: boolean
  activeFilterCount: number
  canSearch: boolean
}

/**
 * Unified search hook that manages all search state and URL synchronization
 */
export function useUnifiedSearch(
  options: UseUnifiedSearchOptions = {}
): UseUnifiedSearchReturn {
  const {
    debounceMs = 500,
    autoSearch = true,
    updateUrl = true,
    basePath = "/metadata/search"
  } = options

  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  // Core state
  const [filters, setFilters] = useState<MetadataSearchFilters>({})
  const [results, setResults] = useState<MetadataSearchResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  // Refs for cleanup and debouncing
  const debounceTimeoutRef = useRef<NodeJS.Timeout>(undefined)
  const abortControllerRef = useRef<AbortController>(undefined)
  const lastSearchFiltersRef = useRef<string>("")
  const retryCountRef = useRef<number>(0)
  const maxRetries = 3
  const retryDelays = [1000, 2000, 3000] // Progressive delays in ms

  // Initialize filters from URL on mount
  useEffect(() => {
    if (!isInitialized) {
      const urlFilters = parseSearchParams(searchParams)
      const normalized = normalizeFilters(urlFilters)
      setFilters(normalized)
      setIsInitialized(true)

      // Auto search if there are meaningful filters
      if (
        autoSearch &&
        (normalized.query ||
          Object.keys(normalized).length > DEFAULT_FILTER_PROPERTIES_COUNT)
      ) {
        performSearch(normalized)
      }
    }
  }, [searchParams, isInitialized, autoSearch])

  // Determine if an error is retryable
  const isRetryableError = (error: any): boolean => {
    // Network errors are retryable
    if (error instanceof TypeError && error.message.includes("fetch")) {
      return true
    }

    // Timeout errors are retryable
    if (error.name === "TimeoutError") {
      return true
    }

    // HTTP 5xx errors are retryable
    if (error.message && /5\d{2}/.test(error.message)) {
      return true
    }

    // Rate limit errors might be retryable
    if (error.message && error.message.includes("429")) {
      return true
    }

    return false
  }

  // Categorize errors for better user messaging
  const categorizeError = (error: any): string => {
    if (error.name === "AbortError") {
      return "Search was cancelled"
    }

    if (error instanceof TypeError && error.message.includes("fetch")) {
      return "Network error. Please check your connection and try again."
    }

    if (error.message?.includes("429")) {
      return "Too many requests. Please wait a moment and try again."
    }

    if (error.message?.includes("401") || error.message?.includes("403")) {
      return "Authentication error. Please refresh the page and try again."
    }

    if (error.message?.includes("500")) {
      return "Server error. Our team has been notified. Please try again later."
    }

    if (error.message?.includes("timeout")) {
      return "Search timed out. Try refining your search criteria."
    }

    // Extract meaningful error message if available
    if (error.message && !error.message.includes("Search failed:")) {
      return error.message
    }

    return "Search failed. Please try again or contact support if the problem persists."
  }

  // Perform the actual search with retry logic
  const performSearch = useCallback(
    async (searchFilters: MetadataSearchFilters, retryCount = 0) => {
      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController()

      // Skip search if no meaningful criteria
      if (
        !searchFilters.query?.trim() &&
        Object.keys(searchFilters).length <= DEFAULT_FILTER_PROPERTIES_COUNT
      ) {
        setResults(null)
        setIsLoading(false)
        setError(null)
        retryCountRef.current = 0
        return
      }

      // Check if search criteria changed
      const searchKey = JSON.stringify(
        searchFilters,
        Object.keys(searchFilters).sort()
      )
      if (searchKey === lastSearchFiltersRef.current && retryCount === 0) {
        return // Skip duplicate search (but allow retries)
      }

      if (retryCount === 0) {
        lastSearchFiltersRef.current = searchKey
        retryCountRef.current = 0
      }

      let willRetry = false
      const searchStartTime = Date.now()

      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch("/api/search/metadata", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(searchFilters),
          signal: abortControllerRef.current.signal
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          const error = new Error(
            errorData.message ||
              `HTTP ${response.status}: ${response.statusText}`
          )
          ;(error as any).status = response.status
          throw error
        }

        const result = await response.json()

        if (result.isSuccess) {
          setResults(result.data)
          setError(null)
          retryCountRef.current = 0 // Reset retry count on success

          // Track successful search (non-blocking)
          const searchTime = Date.now() - searchStartTime
          trackSearch({
            query: sanitizeQuery(searchFilters.query || ""),
            filters: sanitizeFilters(searchFilters),
            resultsCount: result.data.totalCount || 0,
            searchTime,
            sessionId: getSessionId()
          }).catch(() => {
            // Silently fail - analytics shouldn't break search
          })
        } else {
          throw new Error(result.message || "Search failed")
        }
      } catch (err: unknown) {
        // Type guard to check if error has name property (for AbortError check)
        const hasName =
          err instanceof Error ||
          (typeof err === "object" && err !== null && "name" in err)
        const errorName = hasName ? (err as { name: string }).name : ""

        if (errorName === "AbortError") {
          return // Don't show error for aborted requests
        }

        console.error(
          "Search error:",
          err,
          `(attempt ${retryCount + 1}/${maxRetries + 1})`
        )

        // Determine if we should retry
        const shouldRetry = retryCount < maxRetries && isRetryableError(err)

        if (shouldRetry) {
          willRetry = true
          // Wait before retrying
          const delay =
            retryDelays[retryCount] || retryDelays[retryDelays.length - 1]
          console.log(`Retrying search in ${delay}ms...`)

          setTimeout(() => {
            performSearch(searchFilters, retryCount + 1)
          }, delay)

          // Show user-friendly message about retry
          setError(
            `Search failed. Retrying... (attempt ${retryCount + 1}/${maxRetries})`
          )
        } else {
          // Final error - no more retries
          const errorMessage = categorizeError(err)
          setError(errorMessage)
          setResults(null)
          retryCountRef.current = 0
        }
      } finally {
        // Only set loading to false if we're not retrying
        if (!willRetry) {
          setIsLoading(false)
        }
      }
    },
    []
  )

  // Debounced search wrapper
  const debouncedSearch = useCallback(
    (searchFilters: MetadataSearchFilters) => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }

      debounceTimeoutRef.current = setTimeout(() => {
        performSearch(searchFilters)
      }, debounceMs)
    },
    [performSearch, debounceMs]
  )

  // Update URL when filters change
  const updateUrlIfNeeded = useCallback(
    (newFilters: MetadataSearchFilters) => {
      if (!updateUrl) return

      const newUrl = generateSearchUrl(newFilters, basePath)
      const currentPath =
        pathname +
        (searchParams.toString() ? "?" + searchParams.toString() : "")

      if (newUrl !== currentPath) {
        router.push(newUrl)
      }
    },
    [updateUrl, basePath, router, pathname, searchParams]
  )

  // Update a single filter
  const updateFilter = useCallback(
    (key: keyof MetadataSearchFilters, value: any) => {
      setFilters(prev => {
        const newFilters = normalizeFilters({ ...prev, [key]: value })

        // Update URL and trigger search
        updateUrlIfNeeded(newFilters)
        if (autoSearch) {
          debouncedSearch(newFilters)
        }

        return newFilters
      })
    },
    [updateUrlIfNeeded, autoSearch, debouncedSearch]
  )

  // Update multiple filters at once
  const updateFilters = useCallback(
    (newFilters: Partial<MetadataSearchFilters>) => {
      setFilters(prev => {
        const updated = normalizeFilters({ ...prev, ...newFilters })

        // Update URL and trigger search
        updateUrlIfNeeded(updated)
        if (autoSearch) {
          debouncedSearch(updated)
        }

        return updated
      })
    },
    [updateUrlIfNeeded, autoSearch, debouncedSearch]
  )

  // Clear a single filter
  const clearFilter = useCallback(
    (key: keyof MetadataSearchFilters) => {
      setFilters(prev => {
        const newFilters = { ...prev }
        delete newFilters[key]
        const normalized = normalizeFilters(newFilters)

        // Update URL and trigger search
        updateUrlIfNeeded(normalized)
        if (autoSearch) {
          debouncedSearch(normalized)
        }

        return normalized
      })
    },
    [updateUrlIfNeeded, autoSearch, debouncedSearch]
  )

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    const emptyFilters = normalizeFilters({})
    setFilters(emptyFilters)
    setResults(null)
    setError(null)

    if (updateUrl) {
      router.push(basePath)
    }
  }, [updateUrl, basePath, router])

  // Manual search trigger
  const search = useCallback(
    async (customFilters?: Partial<MetadataSearchFilters>) => {
      const searchFilters = customFilters
        ? normalizeFilters({ ...filters, ...customFilters })
        : filters

      if (customFilters) {
        setFilters(searchFilters)
        updateUrlIfNeeded(searchFilters)
      }

      await performSearch(searchFilters)
    },
    [filters, performSearch, updateUrlIfNeeded]
  )

  // Reset everything
  const reset = useCallback(() => {
    // Cancel any pending searches
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Reset state
    setFilters(normalizeFilters({}))
    setResults(null)
    setError(null)
    setIsLoading(false)
    lastSearchFiltersRef.current = ""

    // Reset URL
    if (updateUrl) {
      router.push(basePath)
    }
  }, [updateUrl, basePath, router])

  // Computed values
  const hasActiveFilters = Object.keys(filters).some(key => {
    const value = filters[key as keyof MetadataSearchFilters]
    if (key === "sortBy" && value === "relevance") return false
    if (key === "sortOrder" && value === "desc") return false
    if (key === "limit" && value === 20) return false
    if (key === "page" && value === 1) return false
    return value !== undefined && value !== null && value !== ""
  })

  const activeFilterCount = Object.keys(filters).filter(key => {
    const value = filters[key as keyof MetadataSearchFilters]
    if (key === "sortBy" && value === "relevance") return false
    if (key === "sortOrder" && value === "desc") return false
    if (key === "limit" && value === 20) return false
    if (key === "page" && value === 1) return false
    return value !== undefined && value !== null && value !== ""
  }).length

  const canSearch = !!filters.query?.trim() || hasActiveFilters

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  return {
    // State
    filters,
    results,
    isLoading,
    error,

    // Actions
    updateFilter,
    updateFilters,
    clearFilter,
    clearAllFilters,
    search,
    reset,

    // Computed
    hasActiveFilters,
    activeFilterCount,
    canSearch
  }
}
