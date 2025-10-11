"use client"

import React, {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState
} from "react"
import {
  useRouter,
  useSearchParams as useNextSearchParams,
  usePathname
} from "next/navigation"
import { MetadataSearchFilters } from "@/types"
import {
  parseSearchParams,
  filtersToSearchParams,
  generateSearchUrl
} from "@/lib/utils/search-params-utils"

interface SearchParamsContextType {
  filters: MetadataSearchFilters
  updateFilters: (updates: Partial<MetadataSearchFilters>) => void
  updateFilter: (key: keyof MetadataSearchFilters, value: any) => void
  clearFilter: (key: keyof MetadataSearchFilters) => void
  clearAllFilters: () => void
  resetToInitial: () => void
  generateUrl: (newFilters?: Partial<MetadataSearchFilters>) => string
  isLoading: boolean
}

const SearchParamsContext = createContext<SearchParamsContextType | undefined>(
  undefined
)

export function useMetadataSearchParams() {
  const context = useContext(SearchParamsContext)
  if (!context) {
    throw new Error(
      "useMetadataSearchParams must be used within a SearchParamsProvider"
    )
  }
  return context
}

interface SearchParamsProviderProps {
  children: React.ReactNode
  initialFilters: MetadataSearchFilters
}

export default function SearchParamsProvider({
  children,
  initialFilters
}: SearchParamsProviderProps) {
  const router = useRouter()
  const searchParams = useNextSearchParams()
  const pathname = usePathname()

  const [filters, setFilters] = useState<MetadataSearchFilters>(initialFilters)
  const [isLoading, setIsLoading] = useState(false)

  // Sync with URL changes (for browser navigation)
  useEffect(() => {
    const urlFilters = parseSearchParams(searchParams)
    setFilters(urlFilters)
  }, [searchParams])

  /**
   * Generate URL for the current path with given filters
   */
  const generateUrl = useCallback(
    (newFilters?: Partial<MetadataSearchFilters>) => {
      const finalFilters = newFilters ? { ...filters, ...newFilters } : filters
      return generateSearchUrl(finalFilters, pathname)
    },
    [filters, pathname]
  )

  /**
   * Update multiple filters at once
   */
  const updateFilters = useCallback(
    (updates: Partial<MetadataSearchFilters>) => {
      const newFilters = { ...filters, ...updates }

      // Clean up empty values
      Object.keys(newFilters).forEach(key => {
        const value = newFilters[key as keyof MetadataSearchFilters]
        if (
          value === undefined ||
          value === null ||
          value === "" ||
          (Array.isArray(value) && value.length === 0)
        ) {
          delete newFilters[key as keyof MetadataSearchFilters]
        }
      })

      setIsLoading(true)
      const url = generateSearchUrl(newFilters, pathname)
      router.push(url)
      // isLoading will be set to false when the URL change triggers the useEffect
    },
    [filters, pathname, router]
  )

  /**
   * Update a single filter
   */
  const updateFilter = useCallback(
    (key: keyof MetadataSearchFilters, value: any) => {
      updateFilters({ [key]: value })
    },
    [updateFilters]
  )

  /**
   * Clear a specific filter
   */
  const clearFilter = useCallback(
    (key: keyof MetadataSearchFilters) => {
      const newFilters = { ...filters }
      delete newFilters[key]
      updateFilters(newFilters)
    },
    [filters, updateFilters]
  )

  /**
   * Clear all filters
   */
  const clearAllFilters = useCallback(() => {
    setIsLoading(true)
    router.push(pathname)
  }, [pathname, router])

  /**
   * Reset to initial filters
   */
  const resetToInitial = useCallback(() => {
    updateFilters(initialFilters)
  }, [initialFilters, updateFilters])

  // Reset loading state when filters change
  useEffect(() => {
    setIsLoading(false)
  }, [filters])

  const contextValue: SearchParamsContextType = {
    filters,
    updateFilters,
    updateFilter,
    clearFilter,
    clearAllFilters,
    resetToInitial,
    generateUrl,
    isLoading
  }

  return (
    <SearchParamsContext.Provider value={contextValue}>
      {children}
    </SearchParamsContext.Provider>
  )
}
