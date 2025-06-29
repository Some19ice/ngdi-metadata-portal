"use client"

import { Input } from "@/components/ui/input"
import { SearchIcon, MapPin, FileText, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { geocodeLocationAction } from "@/actions/map-actions"
import { searchMetadataSuggestionsAction } from "@/actions/db/metadata-records-actions"
import { GeocodingFeature } from "@/types"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

// PostHog type declaration
declare global {
  interface Window {
    posthog?: {
      capture: (event: string, properties?: any) => void
    }
  }
}

interface SearchSuggestion {
  type: "location" | "metadata"
  data: GeocodingFeature | { title: string; query: string }
  displayText: string
  icon: React.ReactNode
}

// Hydration-safe skeleton component
function SearchBarSkeleton() {
  return (
    <div className="relative w-full max-w-lg">
      <div className="flex rounded-lg border border-input bg-background">
        <div className="hidden sm:flex w-24 border-r">
          <Skeleton className="h-10 w-full rounded-l-lg rounded-r-none" />
        </div>
        <div className="flex-1 relative">
          <Skeleton className="h-10 w-full border-0 sm:rounded-none rounded-lg" />
        </div>
      </div>
    </div>
  )
}

export default function GlobalSearchBar() {
  const [query, setQuery] = useState("")
  const [searchType, setSearchType] = useState<
    "auto" | "metadata" | "location"
  >("auto")
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Hydration safety - mount detection
  useEffect(() => {
    setMounted(true)
  }, [])

  // Intelligent search type detection (memoized)
  const detectSearchType = useCallback(
    (searchQuery: string): "metadata" | "location" => {
      const locationKeywords = [
        "nigeria",
        "lagos",
        "abuja",
        "kano",
        "ibadan",
        "kaduna",
        "port harcourt",
        "benin",
        "maiduguri",
        "zaria",
        "aba",
        "jos",
        "ilorin",
        "oyo",
        "enugu",
        "abeokuta",
        "sokoto",
        "katsina",
        "bauchi",
        "cross river",
        "delta",
        "rivers",
        "anambra",
        "imo",
        "abia",
        "ebonyi",
        "benue",
        "plateau",
        "taraba",
        "adamawa",
        "borno",
        "yobe",
        "gombe",
        "bayelsa",
        "akwa ibom",
        "edo",
        "ondo",
        "ekiti",
        "osun",
        "ogun",
        "kwara",
        "kogi",
        "nasarawa",
        "niger",
        "kebbi",
        "zamfara",
        "jigawa",
        "city",
        "state",
        "lga",
        "ward",
        "coordinates",
        "latitude",
        "longitude",
        "bbox",
        "polygon",
        "geometry",
        "geospatial",
        "spatial",
        "geographic",
        "location",
        "place",
        "area",
        "region",
        "zone",
        "district",
        "locality",
        "settlement",
        "village",
        "town",
        "community",
        "boundary",
        "border",
        "extent"
      ]

      const metadataKeywords = [
        "dataset",
        "data",
        "metadata",
        "geospatial",
        "raster",
        "vector",
        "shapefile",
        "geotiff",
        "geopackage",
        "kml",
        "csv",
        "json",
        "xml",
        "api",
        "service",
        "wms",
        "wfs",
        "wcs",
        "ogc",
        "iso",
        "dublin core",
        "survey",
        "census",
        "population",
        "agriculture",
        "environment",
        "climate",
        "weather",
        "land use",
        "infrastructure",
        "transportation",
        "health",
        "education",
        "economic",
        "social",
        "demographic",
        "satellite",
        "imagery",
        "remote sensing",
        "gis",
        "mapping",
        "cartography",
        "topography",
        "elevation",
        "dem",
        "bathymetry"
      ]

      const lowerQuery = searchQuery.toLowerCase()

      // Count matches for each category
      const locationMatches = locationKeywords.filter(keyword =>
        lowerQuery.includes(keyword)
      ).length
      const metadataMatches = metadataKeywords.filter(keyword =>
        lowerQuery.includes(keyword)
      ).length

      // Check for coordinate patterns
      const coordinatePattern = /^-?\d+\.?\d*\s*,\s*-?\d+\.?\d*$/
      const bboxPattern =
        /^-?\d+\.?\d*\s*,\s*-?\d+\.?\d*\s*,\s*-?\d+\.?\d*\s*,\s*-?\d+\.?\d*$/

      if (coordinatePattern.test(lowerQuery) || bboxPattern.test(lowerQuery)) {
        return "location"
      }

      // Default to metadata if no clear winner
      return locationMatches > metadataMatches ? "location" : "metadata"
    },
    []
  )

  // Fetch suggestions based on search type and query
  const fetchSuggestions = async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSuggestions([])
      return
    }

    setIsLoadingSuggestions(true)
    const suggestions: SearchSuggestion[] = []

    try {
      // Determine search types to query
      const actualSearchType =
        searchType === "auto" ? detectSearchType(searchQuery) : searchType
      const shouldQueryLocation =
        searchType === "auto" || searchType === "location"
      const shouldQueryMetadata =
        searchType === "auto" || searchType === "metadata"

      // Fetch location suggestions
      if (shouldQueryLocation) {
        try {
          const locationResult = await geocodeLocationAction({
            searchText: searchQuery,
            limit: 3
          })
          if (locationResult.isSuccess && locationResult.data) {
            const locationSuggestions = locationResult.data
              .slice(0, 3)
              .map((feature: GeocodingFeature) => ({
                type: "location" as const,
                data: feature,
                displayText: feature.place_name,
                icon: <MapPin className="h-4 w-4 text-blue-600" />
              }))
            suggestions.push(...locationSuggestions)
          }
        } catch (error) {
          console.warn("Location suggestions failed:", error)
        }
      }

      // Fetch metadata suggestions
      if (shouldQueryMetadata) {
        try {
          const metadataResult = await searchMetadataSuggestionsAction({
            query: searchQuery,
            limit: 4
          })
          if (metadataResult.isSuccess && metadataResult.data) {
            const metadataSuggestions = metadataResult.data
              .slice(0, 4)
              .map(item => ({
                type: "metadata" as const,
                data: { title: item.title || "", query: searchQuery },
                displayText: item.title || "",
                icon: <FileText className="h-4 w-4 text-green-600" />
              }))
            suggestions.push(...metadataSuggestions)
          }
        } catch (error) {
          console.warn("Metadata suggestions failed:", error)
        }
      }

      // Sort suggestions: prioritize the detected/selected type first
      if (searchType === "auto") {
        suggestions.sort((a, b) => {
          if (a.type === actualSearchType && b.type !== actualSearchType)
            return -1
          if (b.type === actualSearchType && a.type !== actualSearchType)
            return 1
          return 0
        })
      }

      setSuggestions(suggestions)
    } catch (error) {
      console.error("Failed to fetch suggestions:", error)
      setSuggestions([])
    } finally {
      setIsLoadingSuggestions(false)
    }
  }

  // Search handling with PostHog analytics
  const handleSearch = async (
    searchQuery: string = query,
    selectedSuggestion?: SearchSuggestion
  ) => {
    if (!searchQuery.trim()) return

    setIsLoading(true)
    setShowSuggestions(false)

    // Track search analytics
    if (typeof window !== "undefined" && window.posthog) {
      window.posthog.capture("search_initiated", {
        query: searchQuery.substring(0, 100),
        search_type: searchType,
        has_suggestion: !!selectedSuggestion,
        search_interface: "global_header"
      })
    }

    // If a suggestion was selected, handle it accordingly
    if (selectedSuggestion) {
      if (selectedSuggestion.type === "location") {
        const locationData = selectedSuggestion.data as GeocodingFeature
        const [longitude, latitude] = locationData.center
        router.push(
          `/map?location=${encodeURIComponent(locationData.place_name)}&center=${longitude},${latitude}&zoom=12`
        )
      } else {
        router.push(
          `/search?q=${encodeURIComponent(selectedSuggestion.displayText)}&type=metadata`
        )
      }
    } else {
      // Determine search behavior based on type and query content
      const actualSearchType =
        searchType === "auto" ? detectSearchType(searchQuery) : searchType

      if (actualSearchType === "location") {
        // Handle coordinate search
        const coordinateMatch = searchQuery.match(
          /^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/
        )
        if (coordinateMatch) {
          const [, longitude, latitude] = coordinateMatch
          router.push(
            `/map?center=${longitude},${latitude}&zoom=12&search=${encodeURIComponent(searchQuery)}`
          )
          setIsLoading(false)
          return
        }

        // Handle bbox search
        const bboxMatch = searchQuery.match(
          /^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/
        )
        if (bboxMatch) {
          const [, minLng, minLat, maxLng, maxLat] = bboxMatch
          router.push(
            `/map?bbox=${minLng},${minLat},${maxLng},${maxLat}&search=${encodeURIComponent(searchQuery)}`
          )
          setIsLoading(false)
          return
        }

        // For location names, try geocoding then fallback
        try {
          const result = await geocodeLocationAction({
            searchText: searchQuery
          })
          if (result.isSuccess && result.data?.length > 0) {
            const firstResult = result.data[0]
            const [longitude, latitude] = firstResult.center
            router.push(
              `/map?location=${encodeURIComponent(firstResult.place_name)}&center=${longitude},${latitude}&zoom=12`
            )
          } else {
            // Fallback to search page with location type
            router.push(
              `/search?q=${encodeURIComponent(searchQuery)}&type=location`
            )
          }
        } catch (error) {
          router.push(
            `/search?q=${encodeURIComponent(searchQuery)}&type=location`
          )
        }
      } else {
        // Metadata search
        router.push(
          `/search?q=${encodeURIComponent(searchQuery)}&type=metadata`
        )
      }
    }

    setIsLoading(false)
  }

  // Handle input change with debounced suggestions
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query && showSuggestions && mounted) {
        fetchSuggestions(query)
      } else {
        setSuggestions([])
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query, searchType, showSuggestions, mounted, detectSearchType])

  // Handle click outside to close suggestions and keyboard shortcuts
  useEffect(() => {
    if (!mounted) return

    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      // Global search shortcut: Ctrl/Cmd + K
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault()
        inputRef.current?.focus()
        setShowSuggestions(true)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [mounted])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSearch(query)
  }

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.displayText)
    handleSearch(suggestion.displayText, suggestion)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)

    // Show suggestions when typing if we have at least 2 characters
    if (value.length >= 2) {
      setShowSuggestions(true)
    } else {
      setShowSuggestions(false)
    }
  }

  const handleInputFocus = () => {
    if (query.length >= 2) {
      setShowSuggestions(true)
    }
  }

  const handleSearchTypeChange = (value: "auto" | "metadata" | "location") => {
    setSearchType(value)
    // Refresh suggestions with new search type if we have a query
    if (query.length >= 2 && showSuggestions) {
      fetchSuggestions(query)
    }
  }

  // Show skeleton during hydration
  if (!mounted) {
    return <SearchBarSkeleton />
  }

  return (
    <div className="relative w-full max-w-lg" suppressHydrationWarning>
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex rounded-lg border border-input bg-background">
          {/* Search Type Selector - Hidden on mobile */}
          <div className="hidden sm:flex w-24 border-r">
            <Select
              value={searchType}
              onValueChange={handleSearchTypeChange}
              disabled={isLoading}
            >
              <SelectTrigger className="h-10 border-0 rounded-l-lg rounded-r-none text-xs px-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto</SelectItem>
                <SelectItem value="metadata">Data</SelectItem>
                <SelectItem value="location">Place</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Main Search Input */}
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              type="text"
              placeholder="Search datasets, locations, or coordinates..."
              value={query}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              disabled={isLoading}
              className="h-10 border-0 sm:rounded-none rounded-lg pl-3 sm:pl-3 pr-10"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : (
                <SearchIcon className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </div>
        </div>

        {/* Mobile Search Type Indicator */}
        <div className="sm:hidden mt-1 text-xs text-muted-foreground">
          Mode: {searchType === "auto" ? "Auto-detect" : searchType}
        </div>
      </form>

      {/* Suggestions Dropdown */}
      {showSuggestions && mounted && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-2 bg-background border rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto"
        >
          {isLoadingSuggestions ? (
            <div className="p-4 text-center">
              <Loader2 className="h-4 w-4 animate-spin mx-auto" />
              <p className="text-sm text-muted-foreground mt-2">Searching...</p>
            </div>
          ) : suggestions.length > 0 ? (
            <div className="py-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full text-left px-4 py-2 hover:bg-muted flex items-center gap-3 text-sm"
                  type="button"
                >
                  {suggestion.icon}
                  <span className="flex-1 truncate">
                    {suggestion.displayText}
                  </span>
                  <span
                    className={cn(
                      "text-xs px-2 py-1 rounded",
                      suggestion.type === "location"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-green-100 text-green-700"
                    )}
                  >
                    {suggestion.type === "location" ? "Place" : "Dataset"}
                  </span>
                </button>
              ))}
            </div>
          ) : query.length >= 2 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No suggestions found. Press Enter to search.
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
