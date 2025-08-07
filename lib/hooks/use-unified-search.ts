import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { MetadataSearchFilters, MetadataSearchResult } from "@/types"
import {
  parseSearchParams,
  filtersToSearchParams,
  generateSearchUrl,
  normalizeFilters
} from "@/lib/utils/search-params-utils"

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

  // Core state
  const [filters, setFilters] = useState<MetadataSearchFilters>({})
  const [results, setResults] = useState<MetadataSearchResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  // Refs for cleanup and debouncing
  const debounceTimeoutRef = useRef<NodeJS.Timeout>()
  const abortControllerRef = useRef<AbortController>()
  const lastSearchFiltersRef = useRef<string>("")

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
        (normalized.query || Object.keys(normalized).length > 4)
      ) {
        performSearch(normalized)
      }
    }
  }, [searchParams, isInitialized, autoSearch])

  // Perform the actual search
  const performSearch = useCallback(
    async (searchFilters: MetadataSearchFilters) => {
      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController()

      // Skip search if no meaningful criteria
      if (
        !searchFilters.query?.trim() &&
        Object.keys(searchFilters).length <= 4
      ) {
        setResults(null)
        setIsLoading(false)
        setError(null)
        return
      }

      // Check if search criteria changed
      const searchKey = JSON.stringify(
        searchFilters,
        Object.keys(searchFilters).sort()
      )
      if (searchKey === lastSearchFiltersRef.current) {
        return // Skip duplicate search
      }
      lastSearchFiltersRef.current = searchKey

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
          throw new Error(`Search failed: ${response.statusText}`)
        }

        const result = await response.json()

        if (result.isSuccess) {
          setResults(result.data)
          setError(null)
        } else {
          throw new Error(result.message || "Search failed")
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("Search error:", err)
          setError(err.message || "Search failed")
          setResults(null)
        }
      } finally {
        setIsLoading(false)
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
      const currentPath = window.location.pathname + window.location.search

      if (newUrl !== currentPath) {
        router.push(newUrl)
      }
    },
    [updateUrl, basePath, router]
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
