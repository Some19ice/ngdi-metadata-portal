import { useState, useEffect, useCallback, useRef } from "react"
import {
  MetadataSearchFilters,
  MetadataSearchResult,
  SearchSuggestion
} from "@/types"

interface UseDebouncedSearchOptions {
  debounceMs?: number
  minQueryLength?: number
  cacheResults?: boolean
  enableSuggestions?: boolean
  suggestionDebounceMs?: number
}

interface SearchCache {
  [key: string]: {
    result: MetadataSearchResult
    timestamp: number
  }
}

interface SuggestionCache {
  [key: string]: {
    suggestions: SearchSuggestion[]
    timestamp: number
  }
}

export function useDebouncedSearch(options: UseDebouncedSearchOptions = {}) {
  const {
    debounceMs = 500,
    minQueryLength = 2,
    cacheResults = true,
    enableSuggestions = true,
    suggestionDebounceMs = 300
  } = options

  // State
  const [searchResults, setSearchResults] =
    useState<MetadataSearchResult | null>(null)
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTime, setSearchTime] = useState<number>(0)

  // Refs for cleanup and caching
  const searchTimeoutRef = useRef<NodeJS.Timeout>()
  const suggestionTimeoutRef = useRef<NodeJS.Timeout>()
  const searchCacheRef = useRef<SearchCache>({})
  const suggestionCacheRef = useRef<SuggestionCache>({})
  const abortControllerRef = useRef<AbortController>()
  const lastSearchRef = useRef<string>()

  // Cache management
  const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

  const getCacheKey = useCallback((filters: MetadataSearchFilters): string => {
    return JSON.stringify(filters, Object.keys(filters).sort())
  }, [])

  const getCachedResult = useCallback(
    (key: string): MetadataSearchResult | null => {
      if (!cacheResults) return null

      const cached = searchCacheRef.current[key]
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.result
      }

      // Clean up expired cache entries
      if (cached) {
        delete searchCacheRef.current[key]
      }

      return null
    },
    [cacheResults]
  )

  const setCachedResult = useCallback(
    (key: string, result: MetadataSearchResult): void => {
      if (!cacheResults) return

      searchCacheRef.current[key] = {
        result,
        timestamp: Date.now()
      }
    },
    [cacheResults]
  )

  const getCachedSuggestions = useCallback(
    (query: string): SearchSuggestion[] | null => {
      if (!enableSuggestions) return null

      const cached = suggestionCacheRef.current[query]
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.suggestions
      }

      // Clean up expired cache entries
      if (cached) {
        delete suggestionCacheRef.current[query]
      }

      return null
    },
    [enableSuggestions]
  )

  const setCachedSuggestions = useCallback(
    (query: string, suggestions: SearchSuggestion[]): void => {
      if (!enableSuggestions) return

      suggestionCacheRef.current[query] = {
        suggestions,
        timestamp: Date.now()
      }
    },
    [enableSuggestions]
  )

  // Search function
  const performSearch = useCallback(
    async (filters: MetadataSearchFilters): Promise<void> => {
      const startTime = Date.now()

      try {
        // Cancel previous request
        if (abortControllerRef.current) {
          abortControllerRef.current.abort()
        }

        // Create new abort controller
        abortControllerRef.current = new AbortController()

        // Check cache first
        const cacheKey = getCacheKey(filters)
        const cachedResult = getCachedResult(cacheKey)

        if (cachedResult) {
          setSearchResults(cachedResult)
          setSearchTime(Date.now() - startTime)
          setIsLoading(false)
          setError(null)
          return
        }

        setIsLoading(true)
        setError(null)

        // Make API call to unified search
        const response = await fetch("/api/search/metadata", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(filters),
          signal: abortControllerRef.current.signal
        })

        if (!response.ok) {
          throw new Error(`Search failed: ${response.statusText}`)
        }

        const result = await response.json()

        if (result.isSuccess) {
          setSearchResults(result.data)
          setCachedResult(cacheKey, result.data)
          setError(null)
        } else {
          setError(result.message || "Search failed")
          setSearchResults(null)
        }

        setSearchTime(Date.now() - startTime)
      } catch (error: any) {
        if (error.name !== "AbortError") {
          console.error("Search error:", error)
          setError(error.message || "Search failed")
          setSearchResults(null)
        }
      } finally {
        setIsLoading(false)
      }
    },
    [getCacheKey, getCachedResult, setCachedResult]
  )

  // Suggestions function
  const performSuggestionSearch = useCallback(
    async (query: string): Promise<void> => {
      if (!enableSuggestions || query.length < minQueryLength) {
        setSuggestions([])
        return
      }

      try {
        // Check cache first
        const cachedSuggestions = getCachedSuggestions(query)
        if (cachedSuggestions) {
          setSuggestions(cachedSuggestions)
          setIsLoadingSuggestions(false)
          return
        }

        setIsLoadingSuggestions(true)

        const response = await fetch(
          `/api/search/suggestions?q=${encodeURIComponent(query)}`
        )

        if (!response.ok) {
          throw new Error("Suggestions failed")
        }

        const result = await response.json()

        if (result.isSuccess) {
          setSuggestions(result.data)
          setCachedSuggestions(query, result.data)
        } else {
          setSuggestions([])
        }
      } catch (error) {
        console.error("Suggestions error:", error)
        setSuggestions([])
      } finally {
        setIsLoadingSuggestions(false)
      }
    },
    [
      enableSuggestions,
      minQueryLength,
      getCachedSuggestions,
      setCachedSuggestions
    ]
  )

  // Debounced search
  const debouncedSearch = useCallback(
    (filters: MetadataSearchFilters) => {
      // Cancel previous timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }

      // Set new timeout
      searchTimeoutRef.current = setTimeout(() => {
        performSearch(filters)
      }, debounceMs)
    },
    [performSearch, debounceMs]
  )

  // Debounced suggestions
  const debouncedSuggestions = useCallback(
    (query: string) => {
      // Cancel previous timeout
      if (suggestionTimeoutRef.current) {
        clearTimeout(suggestionTimeoutRef.current)
      }

      // Set new timeout
      suggestionTimeoutRef.current = setTimeout(() => {
        performSuggestionSearch(query)
      }, suggestionDebounceMs)
    },
    [performSuggestionSearch, suggestionDebounceMs]
  )

  // Search function for components to call
  const search = useCallback(
    (filters: MetadataSearchFilters) => {
      const currentQuery = filters.query || ""

      // Immediate search for cached results or when query is empty
      if (!currentQuery || currentQuery.length < minQueryLength) {
        if (searchTimeoutRef.current) {
          clearTimeout(searchTimeoutRef.current)
        }
        performSearch(filters)
      } else {
        debouncedSearch(filters)
      }

      // Handle suggestions separately
      if (enableSuggestions && currentQuery !== lastSearchRef.current) {
        lastSearchRef.current = currentQuery
        debouncedSuggestions(currentQuery)
      }
    },
    [
      performSearch,
      debouncedSearch,
      debouncedSuggestions,
      minQueryLength,
      enableSuggestions
    ]
  )

  // Immediate search (bypass debouncing)
  const searchImmediate = useCallback(
    (filters: MetadataSearchFilters) => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
      performSearch(filters)
    },
    [performSearch]
  )

  // Clear cache
  const clearCache = useCallback(() => {
    searchCacheRef.current = {}
    suggestionCacheRef.current = {}
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
      if (suggestionTimeoutRef.current) {
        clearTimeout(suggestionTimeoutRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  return {
    // State
    searchResults,
    suggestions,
    isLoading,
    isLoadingSuggestions,
    error,
    searchTime,

    // Actions
    search,
    searchImmediate,
    clearCache,

    // Cache stats (for debugging)
    getCacheStats: useCallback(
      () => ({
        searchCacheSize: Object.keys(searchCacheRef.current).length,
        suggestionCacheSize: Object.keys(suggestionCacheRef.current).length,
        oldestSearchEntry: Math.min(
          ...Object.values(searchCacheRef.current).map(v => v.timestamp)
        ),
        oldestSuggestionEntry: Math.min(
          ...Object.values(suggestionCacheRef.current).map(v => v.timestamp)
        )
      }),
      []
    )
  }
}

// Hook for managing search state across components
export function useSearchState() {
  const [filters, setFilters] = useState<MetadataSearchFilters>({})
  const [activeFilters, setActiveFilters] = useState<string[]>([])

  const updateFilter = useCallback(
    (key: keyof MetadataSearchFilters, value: any) => {
      setFilters(prev => {
        const newFilters = { ...prev }

        if (
          value === undefined ||
          value === null ||
          value === "" ||
          (Array.isArray(value) && value.length === 0)
        ) {
          delete newFilters[key]
        } else {
          newFilters[key] = value
        }

        return newFilters
      })
    },
    []
  )

  const clearFilter = useCallback((key: keyof MetadataSearchFilters) => {
    setFilters(prev => {
      const newFilters = { ...prev }
      delete newFilters[key]
      return newFilters
    })
  }, [])

  const clearAllFilters = useCallback(() => {
    setFilters({})
    setActiveFilters([])
  }, [])

  // Calculate active filters for display
  useEffect(() => {
    const active = Object.keys(filters).filter(key => {
      const value = filters[key as keyof MetadataSearchFilters]
      return (
        value !== undefined &&
        value !== null &&
        value !== "" &&
        !(Array.isArray(value) && value.length === 0)
      )
    })
    setActiveFilters(active)
  }, [filters])

  return {
    filters,
    activeFilters,
    updateFilter,
    clearFilter,
    clearAllFilters,
    setFilters
  }
}
