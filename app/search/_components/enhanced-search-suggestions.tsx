"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  MapPin,
  FileText,
  Clock,
  TrendingUp,
  Search,
  Star,
  ChevronRight,
  History
} from "lucide-react"
import { cn } from "@/lib/utils"
import { geocodeLocationAction } from "@/actions/map-actions"
import { searchMetadataRecordsAction } from "@/actions/db/metadata-records-actions"

interface SearchSuggestion {
  id: string
  type: "location" | "metadata" | "recent" | "trending" | "saved"
  title: string
  subtitle?: string
  icon: React.ReactNode
  metadata?: {
    count?: number
    relevance?: number
    category?: string
    coordinates?: [number, number]
  }
  action?: () => void
}

interface EnhancedSearchSuggestionsProps {
  query: string
  isVisible: boolean
  onSuggestionSelect: (suggestion: SearchSuggestion) => void
  onClose: () => void
  recentSearches?: string[]
  savedSearches?: Array<{ id: string; name: string; query: string }>
}

export default function EnhancedSearchSuggestions({
  query,
  isVisible,
  onSuggestionSelect,
  onClose,
  recentSearches = [],
  savedSearches = []
}: EnhancedSearchSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)

  // Trending searches (could come from analytics)
  const trendingSearches = [
    { query: "population data", count: 1250 },
    { query: "land use maps", count: 890 },
    { query: "Lagos state", count: 756 },
    { query: "elevation data", count: 634 },
    { query: "transportation networks", count: 523 }
  ]

  const fetchSuggestions = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setSuggestions([])
      return
    }

    setIsLoading(true)
    const newSuggestions: SearchSuggestion[] = []

    try {
      // Parallel fetch for better performance
      const [locationResults, metadataResults] = await Promise.allSettled([
        geocodeLocationAction({
          searchText: searchQuery,
          limit: 3,
          autocomplete: true,
          country: "NG"
        }),
        searchMetadataRecordsAction({
          query: searchQuery,
          page: 1,
          pageSize: 3
        })
      ])

      // Process location suggestions
      if (
        locationResults.status === "fulfilled" &&
        locationResults.value.isSuccess
      ) {
        locationResults.value.data.forEach((location, index) => {
          newSuggestions.push({
            id: `location-${index}`,
            type: "location",
            title: location.place_name || location.text || "Unknown Location",
            subtitle: location.context?.map(c => c.text).join(", ") || "",
            icon: <MapPin className="h-4 w-4 text-blue-500" />,
            metadata: {
              coordinates: location.center as [number, number],
              category: "Location"
            }
          })
        })
      }

      // Process metadata suggestions
      if (
        metadataResults.status === "fulfilled" &&
        metadataResults.value.isSuccess
      ) {
        metadataResults.value.data.records.forEach((record, index) => {
          newSuggestions.push({
            id: `metadata-${index}`,
            type: "metadata",
            title: record.title,
            subtitle: record.abstract?.substring(0, 100) + "..." || "",
            icon: <FileText className="h-4 w-4 text-green-500" />,
            metadata: {
              category: record.dataType || "Dataset",
              count: metadataResults.value.data.totalRecords
            }
          })
        })
      }

      setSuggestions(newSuggestions)
    } catch (error) {
      console.error("Error fetching suggestions:", error)
      setSuggestions([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (query) {
      const timeoutId = setTimeout(() => fetchSuggestions(query), 300)
      return () => clearTimeout(timeoutId)
    } else {
      setSuggestions([])
    }
  }, [query, fetchSuggestions])

  // Build suggestions list based on query state
  const buildSuggestionsList = useCallback(() => {
    const suggestionsList: SearchSuggestion[] = []

    if (!query) {
      // Show recent searches when no query
      if (recentSearches.length > 0) {
        suggestionsList.push(
          ...recentSearches.slice(0, 5).map((search, index) => ({
            id: `recent-${index}`,
            type: "recent" as const,
            title: search,
            subtitle: "Recent search",
            icon: <Clock className="h-4 w-4 text-gray-500" />
          }))
        )
      }

      // Show saved searches
      if (savedSearches.length > 0) {
        suggestionsList.push(
          ...savedSearches.slice(0, 3).map(search => ({
            id: `saved-${search.id}`,
            type: "saved" as const,
            title: search.name,
            subtitle: search.query,
            icon: <Star className="h-4 w-4 text-yellow-500" />
          }))
        )
      }

      // Show trending searches
      suggestionsList.push(
        ...trendingSearches.slice(0, 5).map((trending, index) => ({
          id: `trending-${index}`,
          type: "trending" as const,
          title: trending.query,
          subtitle: `${trending.count.toLocaleString()} searches`,
          icon: <TrendingUp className="h-4 w-4 text-red-500" />
        }))
      )
    } else {
      // Show search results when there's a query
      suggestionsList.push(...suggestions)
    }

    return suggestionsList
  }, [query, suggestions, recentSearches, savedSearches])

  const allSuggestions = buildSuggestionsList()

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isVisible) return

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault()
          setSelectedIndex(prev =>
            Math.min(prev + 1, allSuggestions.length - 1)
          )
          break
        case "ArrowUp":
          e.preventDefault()
          setSelectedIndex(prev => Math.max(prev - 1, -1))
          break
        case "Enter":
          e.preventDefault()
          if (selectedIndex >= 0 && allSuggestions[selectedIndex]) {
            onSuggestionSelect(allSuggestions[selectedIndex])
          }
          break
        case "Escape":
          e.preventDefault()
          onClose()
          break
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isVisible, selectedIndex, allSuggestions, onSuggestionSelect, onClose])

  if (!isVisible) return null

  const groupedSuggestions = allSuggestions.reduce(
    (groups, suggestion) => {
      const group = groups[suggestion.type] || []
      group.push(suggestion)
      groups[suggestion.type] = group
      return groups
    },
    {} as Record<string, SearchSuggestion[]>
  )

  const SuggestionGroup = ({
    title,
    suggestions: groupSuggestions,
    icon
  }: {
    title: string
    suggestions: SearchSuggestion[]
    icon: React.ReactNode
  }) => (
    <div className="space-y-1">
      <div className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-muted-foreground">
        {icon}
        {title}
      </div>
      {groupSuggestions.map((suggestion, index) => {
        const globalIndex = allSuggestions.indexOf(suggestion)
        return (
          <Button
            key={suggestion.id}
            variant="ghost"
            className={cn(
              "w-full justify-start h-auto p-3 text-left",
              globalIndex === selectedIndex && "bg-accent"
            )}
            onClick={() => onSuggestionSelect(suggestion)}
          >
            <div className="flex items-start gap-3 w-full">
              {suggestion.icon}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{suggestion.title}</div>
                {suggestion.subtitle && (
                  <div className="text-xs text-muted-foreground line-clamp-1">
                    {suggestion.subtitle}
                  </div>
                )}
              </div>
              {suggestion.metadata?.count && (
                <Badge variant="secondary" className="text-xs">
                  {suggestion.metadata.count.toLocaleString()}
                </Badge>
              )}
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </Button>
        )
      })}
    </div>
  )

  return (
    <Card
      ref={containerRef}
      className="absolute top-full left-0 right-0 mt-1 z-50 max-h-96 overflow-auto shadow-lg border-2"
    >
      <CardContent className="p-0">
        {isLoading && (
          <div className="flex items-center justify-center p-4">
            <Search className="h-4 w-4 animate-spin mr-2" />
            <span className="text-sm text-muted-foreground">Searching...</span>
          </div>
        )}

        {!isLoading && allSuggestions.length === 0 && query && (
          <div className="p-4 text-center text-muted-foreground">
            <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No suggestions found for "{query}"</p>
          </div>
        )}

        {!isLoading && allSuggestions.length > 0 && (
          <div className="space-y-2 py-2">
            {groupedSuggestions.recent && (
              <>
                <SuggestionGroup
                  title="Recent Searches"
                  suggestions={groupedSuggestions.recent}
                  icon={<History className="h-4 w-4" />}
                />
                <Separator />
              </>
            )}

            {groupedSuggestions.saved && (
              <>
                <SuggestionGroup
                  title="Saved Searches"
                  suggestions={groupedSuggestions.saved}
                  icon={<Star className="h-4 w-4" />}
                />
                <Separator />
              </>
            )}

            {groupedSuggestions.location && (
              <>
                <SuggestionGroup
                  title="Locations"
                  suggestions={groupedSuggestions.location}
                  icon={<MapPin className="h-4 w-4" />}
                />
                <Separator />
              </>
            )}

            {groupedSuggestions.metadata && (
              <>
                <SuggestionGroup
                  title="Datasets"
                  suggestions={groupedSuggestions.metadata}
                  icon={<FileText className="h-4 w-4" />}
                />
                <Separator />
              </>
            )}

            {groupedSuggestions.trending && (
              <SuggestionGroup
                title="Trending Searches"
                suggestions={groupedSuggestions.trending}
                icon={<TrendingUp className="h-4 w-4" />}
              />
            )}
          </div>
        )}

        {!query && allSuggestions.length === 0 && (
          <div className="p-4 text-center text-muted-foreground">
            <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Start typing to search...</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
