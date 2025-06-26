import { useState, useEffect, useCallback, useRef } from "react"

// Simple search cache for client-side optimization
interface SearchCacheItem<T> {
  data: T
  timestamp: number
  expiry: number
}

interface SearchCache<T> {
  [key: string]: SearchCacheItem<T>
}

interface UseSearchCacheOptions {
  cacheDuration?: number // milliseconds
  maxCacheSize?: number
}

export function useSearchCache<T>(options: UseSearchCacheOptions = {}) {
  const {
    cacheDuration = 5 * 60 * 1000, // 5 minutes default
    maxCacheSize = 20
  } = options

  const [cache, setCache] = useState<SearchCache<T>>({})
  const cacheRef = useRef<SearchCache<T>>({})

  // Update ref when cache changes
  useEffect(() => {
    cacheRef.current = cache
  }, [cache])

  const getCacheKey = useCallback(
    (query: string, params?: Record<string, any>): string => {
      const paramString = params ? JSON.stringify(params) : ""
      return `${query.toLowerCase().trim()}${paramString}`
    },
    []
  )

  const isExpired = useCallback((item: SearchCacheItem<T>): boolean => {
    return Date.now() > item.expiry
  }, [])

  const cleanCache = useCallback(() => {
    setCache(prevCache => {
      const now = Date.now()
      const validEntries: SearchCache<T> = {}

      Object.entries(prevCache).forEach(([key, item]) => {
        if (now <= item.expiry) {
          validEntries[key] = item
        }
      })

      return validEntries
    })
  }, [])

  const limitCacheSize = useCallback(
    (newCache: SearchCache<T>) => {
      const entries = Object.entries(newCache)
      if (entries.length <= maxCacheSize) return newCache

      // Keep most recent entries
      const sortedEntries = entries.sort(
        ([, a], [, b]) => b.timestamp - a.timestamp
      )
      const limitedEntries = sortedEntries.slice(0, maxCacheSize)

      return Object.fromEntries(limitedEntries)
    },
    [maxCacheSize]
  )

  const getCachedData = useCallback(
    (query: string, params?: Record<string, any>): T | null => {
      const key = getCacheKey(query, params)
      const item = cacheRef.current[key]

      if (!item || isExpired(item)) {
        return null
      }

      return item.data
    },
    [getCacheKey, isExpired]
  )

  const setCachedData = useCallback(
    (query: string, data: T, params?: Record<string, any>): void => {
      const key = getCacheKey(query, params)
      const now = Date.now()

      setCache(prevCache => {
        const newCache = {
          ...prevCache,
          [key]: {
            data,
            timestamp: now,
            expiry: now + cacheDuration
          }
        }

        return limitCacheSize(newCache)
      })
    },
    [getCacheKey, cacheDuration, limitCacheSize]
  )

  const clearCache = useCallback(() => {
    setCache({})
  }, [])

  // Clean expired items periodically
  useEffect(() => {
    const interval = setInterval(cleanCache, 60000) // Clean every minute
    return () => clearInterval(interval)
  }, [cleanCache])

  return {
    getCachedData,
    setCachedData,
    clearCache,
    cacheSize: Object.keys(cache).length
  }
}

// Hook for debounced search with caching
export function useOptimizedSearch<T>(
  searchFunction: (query: string, ...args: any[]) => Promise<T>,
  options: {
    debounceMs?: number
    cacheOptions?: UseSearchCacheOptions
  } = {}
) {
  const { debounceMs = 300, cacheOptions = {} } = options

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const debounceRef = useRef<NodeJS.Timeout>()
  const abortControllerRef = useRef<AbortController>()

  const { getCachedData, setCachedData } = useSearchCache<T>(cacheOptions)

  const executeSearch = useCallback(
    async (query: string, ...args: any[]): Promise<T | null> => {
      if (!query.trim()) return null

      // Check cache first
      const cachedResult = getCachedData(query, { args })
      if (cachedResult) {
        return cachedResult
      }

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController()

      setIsLoading(true)
      setError(null)

      try {
        const result = await searchFunction(query, ...args)

        // Cache the result
        setCachedData(query, result, { args })

        setIsLoading(false)
        return result
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return null // Ignore aborted requests
        }

        setError(err instanceof Error ? err.message : "Search failed")
        setIsLoading(false)
        return null
      }
    },
    [searchFunction, getCachedData, setCachedData]
  )

  const debouncedSearch = useCallback(
    (query: string, ...args: any[]): Promise<T | null> => {
      return new Promise(resolve => {
        if (debounceRef.current) {
          clearTimeout(debounceRef.current)
        }

        debounceRef.current = setTimeout(async () => {
          const result = await executeSearch(query, ...args)
          resolve(result)
        }, debounceMs)
      })
    },
    [executeSearch, debounceMs]
  )

  const immediateSearch = useCallback(
    async (query: string, ...args: any[]): Promise<T | null> => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
      return executeSearch(query, ...args)
    },
    [executeSearch]
  )

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    debouncedSearch,
    immediateSearch,
    isLoading,
    error
  }
}
