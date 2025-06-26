import { useState, useEffect, useRef, useCallback, useMemo } from "react"

// Search result cache interface
interface SearchCache<T> {
  [key: string]: {
    data: T
    timestamp: number
    expiry: number
  }
}

// Search optimization options
interface SearchOptimizationOptions {
  cacheExpiry?: number // milliseconds
  debounceDelay?: number // milliseconds
  maxCacheSize?: number
  enablePrefetch?: boolean
}

// Search state interface
interface SearchState<T> {
  data: T | null
  isLoading: boolean
  error: string | null
  lastQuery: string
  isCached: boolean
}

export function useSearchOptimization<T>(
  searchFunction: (query: string, ...args: any[]) => Promise<T>,
  options: SearchOptimizationOptions = {}
) {
  const {
    cacheExpiry = 5 * 60 * 1000, // 5 minutes
    debounceDelay = 300,
    maxCacheSize = 100,
    enablePrefetch = true
  } = options

  // State management
  const [searchState, setSearchState] = useState<SearchState<T>>({
    data: null,
    isLoading: false,
    error: null,
    lastQuery: "",
    isCached: false
  })

  // Cache and refs
  const cacheRef = useRef<SearchCache<T>>({})
  const abortControllerRef = useRef<AbortController | null>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const prefetchQueueRef = useRef<Set<string>>(new Set())

  // Cache management functions
  const getCachedResult = useCallback((query: string): T | null => {
    const cached = cacheRef.current[query]
    if (cached && Date.now() < cached.expiry) {
      return cached.data
    }
    // Clean up expired entry
    if (cached) {
      delete cacheRef.current[query]
    }
    return null
  }, [])

  const setCachedResult = useCallback(
    (query: string, data: T) => {
      // Manage cache size
      const cacheKeys = Object.keys(cacheRef.current)
      if (cacheKeys.length >= maxCacheSize) {
        // Remove oldest entries
        const sortedEntries = cacheKeys
          .map(key => ({ key, timestamp: cacheRef.current[key].timestamp }))
          .sort((a, b) => a.timestamp - b.timestamp)

        // Remove oldest 20%
        const toRemove = Math.ceil(cacheKeys.length * 0.2)
        for (let i = 0; i < toRemove; i++) {
          delete cacheRef.current[sortedEntries[i].key]
        }
      }

      cacheRef.current[query] = {
        data,
        timestamp: Date.now(),
        expiry: Date.now() + cacheExpiry
      }
    },
    [maxCacheSize, cacheExpiry]
  )

  // Optimized search function
  const executeSearch = useCallback(
    async (query: string, immediate = false, ...args: any[]) => {
      if (!query.trim()) {
        setSearchState({
          data: null,
          isLoading: false,
          error: null,
          lastQuery: "",
          isCached: false
        })
        return
      }

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      // Check cache first
      const cachedResult = getCachedResult(query)
      if (cachedResult) {
        setSearchState({
          data: cachedResult,
          isLoading: false,
          error: null,
          lastQuery: query,
          isCached: true
        })
        return cachedResult
      }

      // Handle debouncing
      if (!immediate && debounceDelay > 0) {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current)
        }

        return new Promise<T | null>(resolve => {
          debounceTimerRef.current = setTimeout(async () => {
            const result = await executeSearch(query, true, ...args)
            resolve(result || null)
          }, debounceDelay)
        })
      }

      // Set loading state
      setSearchState(prev => ({
        ...prev,
        isLoading: true,
        error: null,
        lastQuery: query,
        isCached: false
      }))

      try {
        // Create new abort controller
        abortControllerRef.current = new AbortController()

        // Execute search
        const result = await searchFunction(query, ...args)

        // Check if request was aborted
        if (abortControllerRef.current.signal.aborted) {
          return null
        }

        // Cache and set result
        setCachedResult(query, result)
        setSearchState({
          data: result,
          isLoading: false,
          error: null,
          lastQuery: query,
          isCached: false
        })

        return result
      } catch (error) {
        // Handle abortion gracefully
        if (error instanceof Error && error.name === "AbortError") {
          return null
        }

        const errorMessage =
          error instanceof Error ? error.message : "Search failed"
        setSearchState(prev => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
          isCached: false
        }))
        return null
      }
    },
    [searchFunction, getCachedResult, setCachedResult, debounceDelay]
  )

  // Prefetch functionality
  const prefetch = useCallback(
    async (queries: string[]) => {
      if (!enablePrefetch) return

      for (const query of queries) {
        if (
          query.trim() &&
          !getCachedResult(query) &&
          !prefetchQueueRef.current.has(query)
        ) {
          prefetchQueueRef.current.add(query)

          // Prefetch with low priority
          setTimeout(async () => {
            try {
              await executeSearch(query, true)
            } catch (error) {
              console.debug("Prefetch failed for query:", query, error)
            } finally {
              prefetchQueueRef.current.delete(query)
            }
          }, 100)
        }
      }
    },
    [enablePrefetch, getCachedResult, executeSearch]
  )

  // Generate search suggestions based on cache
  const getSearchSuggestions = useCallback(
    (currentQuery: string, limit = 5): string[] => {
      if (!currentQuery.trim()) return []

      const cacheKeys = Object.keys(cacheRef.current)
      const suggestions = cacheKeys
        .filter(
          key =>
            key.toLowerCase().includes(currentQuery.toLowerCase()) &&
            key !== currentQuery &&
            Date.now() < cacheRef.current[key].expiry
        )
        .sort(
          (a, b) =>
            cacheRef.current[b].timestamp - cacheRef.current[a].timestamp
        )
        .slice(0, limit)

      return suggestions
    },
    []
  )

  // Clear cache
  const clearCache = useCallback(() => {
    cacheRef.current = {}
  }, [])

  // Cancel ongoing search
  const cancelSearch = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    setSearchState(prev => ({ ...prev, isLoading: false }))
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelSearch()
    }
  }, [cancelSearch])

  // Memoized return object
  return useMemo(
    () => ({
      // State
      ...searchState,

      // Functions
      search: executeSearch,
      prefetch,
      getSearchSuggestions,
      clearCache,
      cancelSearch,

      // Utilities
      getCacheStats: () => ({
        size: Object.keys(cacheRef.current).length,
        maxSize: maxCacheSize,
        hitRate: searchState.isCached ? 1 : 0 // Simplified metric
      })
    }),
    [
      searchState,
      executeSearch,
      prefetch,
      getSearchSuggestions,
      clearCache,
      cancelSearch,
      maxCacheSize
    ]
  )
}
