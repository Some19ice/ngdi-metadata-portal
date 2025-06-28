import { useSearchOptimization } from "./use-search-optimization"

/**
 * A simplified wrapper around useSearchOptimization that provides a debouncedSearch method.
 * This hook is specifically designed for the optimized search form component.
 */
export function useOptimizedSearch<T>(
  searchFunction: (query: string) => Promise<T>,
  debounceDelay: number = 300
) {
  const searchHook = useSearchOptimization(searchFunction, {
    debounceDelay,
    cacheExpiry: 5 * 60 * 1000, // 5 minutes
    maxCacheSize: 50,
    enablePrefetch: true
  })

  return {
    // Provide the expected debouncedSearch method
    debouncedSearch: searchHook.search,

    // Also expose other useful methods and state
    ...searchHook
  }
}
