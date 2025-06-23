"use client"

import { Input } from "@/components/ui/input"
import { SearchIcon, MapPin, FileText, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { geocodeLocationAction } from "@/actions/map-actions"
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

export default function GlobalSearchBar() {
  const [query, setQuery] = useState("")
  const [searchType, setSearchType] = useState<
    "auto" | "metadata" | "location"
  >("auto")
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

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

      // Check for coordinate patterns
      if (/^-?\d+\.?\d*\s*,\s*-?\d+\.?\d*$/.test(searchQuery.trim())) {
        return "location"
      }

      // Check for bbox pattern
      if (
        /^-?\d+\.?\d*\s*,\s*-?\d+\.?\d*\s*,\s*-?\d+\.?\d*\s*,\s*-?\d+\.?\d*$/.test(
          searchQuery.trim()
        )
      ) {
        return "location"
      }

      // Score based on keyword presence
      const locationScore = locationKeywords.filter(keyword =>
        lowerQuery.includes(keyword)
      ).length

      const metadataScore = metadataKeywords.filter(keyword =>
        lowerQuery.includes(keyword)
      ).length

      // If query contains location-specific terms, prefer location search
      if (locationScore > metadataScore) {
        return "location"
      }

      // Default to metadata search
      return "metadata"
    },
    []
  )

  // Fetch suggestions based on query
  const fetchSuggestions = async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setSuggestions([])
      return
    }

    setIsLoadingSuggestions(true)
    const suggestions: SearchSuggestion[] = []

    try {
      // Get location suggestions
      if (searchType === "auto" || searchType === "location") {
        console.log("Fetching location suggestions for:", searchQuery)

        const locationResult = await geocodeLocationAction({
          searchText: searchQuery,
          autocomplete: true,
          limit: 3,
          country: "NG"
        })

        console.log("Location suggestion result:", {
          isSuccess: locationResult.isSuccess,
          message: locationResult.message,
          dataLength: locationResult.data?.length || 0
        })

        if (locationResult.isSuccess && locationResult.data) {
          const locationSuggestions = locationResult.data
            .slice(0, 3)
            .map(feature => ({
              type: "location" as const,
              data: feature,
              displayText: feature.place_name,
              icon: <MapPin className="h-4 w-4 text-blue-600" />
            }))
          suggestions.push(...locationSuggestions)
        } else if (!locationResult.isSuccess) {
          console.error("Location suggestions failed:", locationResult.message)
          // Still try to show metadata suggestions
        }
      }

      // Add mock metadata suggestions (replace with real API call)
      if (searchType === "auto" || searchType === "metadata") {
        const metadataSuggestions = [
          { title: `"${searchQuery}" in titles`, query: searchQuery },
          { title: `"${searchQuery}" in keywords`, query: searchQuery },
          { title: `"${searchQuery}" in descriptions`, query: searchQuery }
        ].map(item => ({
          type: "metadata" as const,
          data: item,
          displayText: item.title,
          icon: <FileText className="h-4 w-4 text-green-600" />
        }))
        suggestions.push(...metadataSuggestions)
      }

      setSuggestions(suggestions)
    } catch (error) {
      console.error("Error fetching suggestions:", error)
      setSuggestions([])

      // Show user-friendly error message
      if (typeof window !== "undefined" && window.posthog) {
        window.posthog.capture("search_suggestions_error", {
          error_message: error instanceof Error ? error.message : String(error),
          search_query: searchQuery.substring(0, 50)
        })
      }
    }

    setIsLoadingSuggestions(false)
  }

  // Handle search submission
  const handleSearch = async (
    searchQuery: string = query,
    selectedSuggestion?: SearchSuggestion
  ) => {
    if (!searchQuery.trim()) return

    setIsLoading(true)
    setShowSuggestions(false)

    // Determine final search type
    let finalSearchType = searchType
    if (searchType === "auto") {
      finalSearchType =
        selectedSuggestion?.type || detectSearchType(searchQuery)
    }

    // Track search analytics
    if (typeof window !== "undefined" && window.posthog) {
      window.posthog.capture("global_search_initiated", {
        search_type: finalSearchType,
        query_length: searchQuery.length,
        has_suggestion: !!selectedSuggestion,
        suggestion_type: selectedSuggestion?.type,
        search_interface: "global_header",
        query_preview: searchQuery.substring(0, 50) // First 50 chars for privacy
      })
    }

    // Route based on search type
    if (
      finalSearchType === "location" ||
      selectedSuggestion?.type === "location"
    ) {
      if (selectedSuggestion?.type === "location") {
        const locationData = selectedSuggestion.data as GeocodingFeature
        const [longitude, latitude] = locationData.center
        router.push(
          `/map?location=${encodeURIComponent(locationData.place_name)}&center=${longitude},${latitude}&zoom=12`
        )
      } else {
        // Try to geocode the query
        try {
          const result = await geocodeLocationAction({
            searchText: searchQuery,
            autocomplete: false,
            limit: 1,
            country: "NG"
          })
          if (result.isSuccess && result.data && result.data.length > 0) {
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
      }
    } else {
      // Metadata search
      router.push(`/search?q=${encodeURIComponent(searchQuery)}&type=metadata`)
    }

    setIsLoading(false)
  }

  // Handle input change with debounced suggestions
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query && showSuggestions) {
        fetchSuggestions(query)
      } else {
        setSuggestions([])
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query, searchType, showSuggestions])

  // Handle click outside to close suggestions and keyboard shortcuts
  useEffect(() => {
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
      // Ctrl/Cmd + K to focus search
      if ((event.ctrlKey || event.metaKey) && event.key === "k") {
        event.preventDefault()
        inputRef.current?.focus()
      }
      // Escape to close suggestions
      if (event.key === "Escape") {
        setShowSuggestions(false)
        inputRef.current?.blur()
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSearch()
  }

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    // Track suggestion click analytics
    if (typeof window !== "undefined" && window.posthog) {
      window.posthog.capture("search_suggestion_clicked", {
        suggestion_type: suggestion.type,
        suggestion_text: suggestion.displayText.substring(0, 50),
        search_interface: "global_header"
      })
    }

    const queryText =
      suggestion.type === "location"
        ? (suggestion.data as GeocodingFeature).place_name
        : suggestion.displayText
    setQuery(queryText)
    handleSearch(queryText, suggestion)
  }

  const handleInputFocus = () => {
    setShowSuggestions(true)
    if (query) {
      fetchSuggestions(query)
    }
  }

  return (
    <div className="relative w-full max-w-lg">
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex rounded-lg border border-input bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
          {/* Search Type Selector - Hidden on mobile */}
          <Select
            value={searchType}
            onValueChange={(value: "auto" | "metadata" | "location") =>
              setSearchType(value)
            }
          >
            <SelectTrigger className="hidden sm:flex w-24 border-0 border-r focus:ring-0 rounded-l-lg rounded-r-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">Auto</SelectItem>
              <SelectItem value="metadata">Data</SelectItem>
              <SelectItem value="location">Places</SelectItem>
            </SelectContent>
          </Select>

          {/* Search Input */}
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              type="text"
              placeholder={
                searchType === "location"
                  ? "Search locations, coordinates..."
                  : searchType === "metadata"
                    ? "Search datasets, keywords..."
                    : "Search data, locations, or enter coordinates..."
              }
              value={query}
              onChange={e => setQuery(e.target.value)}
              onFocus={handleInputFocus}
              className="border-0 focus-visible:ring-0 sm:rounded-none rounded-lg pr-20"
            />

            {/* Keyboard shortcut hint */}
            {!query && !showSuggestions && (
              <div className="absolute right-12 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
                <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">⌘</kbd>
                <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">K</kbd>
              </div>
            )}

            {/* Search Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-accent rounded-sm disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <SearchIcon className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Suggestions Dropdown */}
      {showSuggestions && (suggestions.length > 0 || isLoadingSuggestions) && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-md shadow-lg z-50 max-h-64 overflow-y-auto"
        >
          {isLoadingSuggestions ? (
            <div className="p-3">
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          ) : (
            <div className="py-1">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  className="w-full px-3 py-2 text-left hover:bg-accent flex items-center gap-2 text-sm"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion.icon}
                  <span className="truncate">{suggestion.displayText}</span>
                  <span className="ml-auto text-xs text-muted-foreground capitalize">
                    {suggestion.type}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
