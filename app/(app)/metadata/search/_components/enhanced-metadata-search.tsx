/**
 * @deprecated This component has been replaced by simplified-metadata-search.tsx
 * as part of the search parameter standardization migration.
 *
 * This file can be safely removed once all references are confirmed to be removed.
 *
 * Migration completed: Phase 2 - Component Updates
 * - Uses new unified search utilities
 * - Standardized parameter names
 * - Simplified state management
 *
 * @see app/(app)/metadata/search/_components/simplified-metadata-search.tsx
 * @see lib/utils/search-params-utils.ts
 * @see lib/hooks/use-unified-search.ts
 */

"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "@/components/ui/collapsible"
import {
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  X,
  Calendar,
  Map,
  Grid3X3,
  List,
  MapIcon,
  Loader2,
  Clock,
  Zap
} from "lucide-react"
import { MetadataSearchFilters, SearchFacets } from "@/types"
import { useDebouncedSearch, useSearchState } from "@/lib/hooks"
import EnhancedMetadataSearchResults from "./enhanced-metadata-search-results"
import { getSearchFacets } from "./enhanced-search-facets"

interface FacetsState {
  dataTypes: boolean
  organizations: boolean
  topicCategories: boolean
  frameworkTypes: boolean
}

export default function EnhancedMetadataSearch() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Use the new search state hook
  const { filters, updateFilter, clearAllFilters, activeFilters } =
    useSearchState()

  // Use the new debounced search hook
  const {
    searchResults,
    suggestions,
    isLoading,
    isLoadingSuggestions,
    error,
    searchTime,
    search,
    searchImmediate,
    clearCache
  } = useDebouncedSearch({
    debounceMs: 500,
    minQueryLength: 2,
    cacheResults: true,
    enableSuggestions: true,
    suggestionDebounceMs: 300
  })

  // Local UI state
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "list" | "map">("grid")
  const [facetsOpen, setFacetsOpen] = useState<FacetsState>({
    dataTypes: true,
    organizations: false,
    topicCategories: false,
    frameworkTypes: false
  })
  const [showSuggestions, setShowSuggestions] = useState(false)

  // Initialize filters from URL params
  useEffect(() => {
    const params = new URLSearchParams(searchParams)
    const urlFilters: MetadataSearchFilters = {}

    if (params.get("query")) urlFilters.query = params.get("query") || undefined
    if (params.get("dataTypes"))
      urlFilters.dataTypes = params.get("dataTypes")?.split(",").filter(Boolean)
    if (params.get("organizations"))
      urlFilters.organizations = params
        .get("organizations")
        ?.split(",")
        .filter(Boolean)
    if (params.get("topicCategories"))
      urlFilters.topicCategories = params
        .get("topicCategories")
        ?.split(",")
        .filter(Boolean)
    if (params.get("frameworkTypes"))
      urlFilters.frameworkTypes = params
        .get("frameworkTypes")
        ?.split(",")
        .filter(Boolean)
    if (params.get("startDate"))
      urlFilters.startDate = params.get("startDate") || undefined
    if (params.get("endDate"))
      urlFilters.endDate = params.get("endDate") || undefined
    if (params.get("sortBy")) urlFilters.sortBy = params.get("sortBy") as any
    if (params.get("sortOrder"))
      urlFilters.sortOrder = params.get("sortOrder") as any

    // Update filters and trigger search
    Object.keys(urlFilters).forEach(key => {
      updateFilter(
        key as keyof MetadataSearchFilters,
        urlFilters[key as keyof MetadataSearchFilters]
      )
    })

    // Trigger initial search if there are URL parameters
    if (Object.keys(urlFilters).length > 0) {
      search(urlFilters)
    }
  }, [searchParams])

  // Update URL when filters change
  const updateURL = useCallback(
    (newFilters: MetadataSearchFilters) => {
      const params = new URLSearchParams()

      if (newFilters.query) params.set("query", newFilters.query)
      if (newFilters.dataTypes?.length)
        params.set("dataTypes", newFilters.dataTypes.join(","))
      if (newFilters.organizations?.length)
        params.set("organizations", newFilters.organizations.join(","))
      if (newFilters.topicCategories?.length)
        params.set("topicCategories", newFilters.topicCategories.join(","))
      if (newFilters.frameworkTypes?.length)
        params.set("frameworkTypes", newFilters.frameworkTypes.join(","))
      if (newFilters.startDate) params.set("startDate", newFilters.startDate)
      if (newFilters.endDate) params.set("endDate", newFilters.endDate)
      if (newFilters.sortBy && newFilters.sortBy !== "relevance")
        params.set("sortBy", newFilters.sortBy)
      if (newFilters.sortOrder && newFilters.sortOrder !== "desc")
        params.set("sortOrder", newFilters.sortOrder)

      const newURL = `/metadata/search${params.toString() ? `?${params.toString()}` : ""}`
      router.push(newURL)
    },
    [router]
  )

  // Handle filter updates
  const handleFilterUpdate = useCallback(
    (key: keyof MetadataSearchFilters, value: any) => {
      updateFilter(key, value)

      const newFilters = { ...filters, [key]: value }
      updateURL(newFilters)
      search(newFilters)
    },
    [filters, updateFilter, updateURL, search]
  )

  // Handle multi-select filter toggles
  const toggleFilter = useCallback(
    (
      category:
        | "dataTypes"
        | "organizations"
        | "topicCategories"
        | "frameworkTypes",
      value: string
    ) => {
      const current = (filters[category] as string[]) || []
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value]

      handleFilterUpdate(category, updated)
    },
    [filters, handleFilterUpdate]
  )

  // Handle suggestions selection
  const handleSuggestionSelect = useCallback(
    (suggestion: any) => {
      if (suggestion.type === "record") {
        router.push(`/metadata/${suggestion.id}`)
      } else {
        handleFilterUpdate("query", suggestion.title)
      }
      setShowSuggestions(false)
    },
    [router, handleFilterUpdate]
  )

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    clearAllFilters()
    clearCache()
    router.push("/metadata/search")
  }, [clearAllFilters, clearCache, router])

  // Active filter count
  const activeFilterCount = useMemo(() => {
    return activeFilters.length
  }, [activeFilters])

  // Facet section component
  const FacetSection = ({
    title,
    items,
    category,
    isOpen,
    onToggle
  }: {
    title: string
    items?: { value: string; count: number }[]
    category:
      | "dataTypes"
      | "organizations"
      | "topicCategories"
      | "frameworkTypes"
    isOpen: boolean
    onToggle: () => void
  }) => (
    <div className="space-y-2">
      <Collapsible open={isOpen} onOpenChange={onToggle}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-0 h-auto">
            <span className="font-medium text-sm">{title}</span>
            {isOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2">
          {items && items.length > 0 ? (
            items.map(item => (
              <div key={item.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`${category}-${item.value}`}
                  checked={((filters[category] as string[]) || []).includes(
                    item.value
                  )}
                  onCheckedChange={() => toggleFilter(category, item.value)}
                />
                <Label
                  htmlFor={`${category}-${item.value}`}
                  className="flex-1 text-sm cursor-pointer"
                >
                  {item.value}
                </Label>
                <Badge variant="outline" className="text-xs">
                  {item.count}
                </Badge>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              No options available
            </p>
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  )

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Search and Filters Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Main Search */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Search className="h-5 w-5" />
                <span>Search</span>
                {searchTime > 0 && (
                  <Badge
                    variant="outline"
                    className="flex items-center space-x-1"
                  >
                    <Clock className="h-3 w-3" />
                    <span>{searchTime}ms</span>
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Input
                  placeholder="Search datasets..."
                  value={filters.query || ""}
                  onChange={e => {
                    handleFilterUpdate("query", e.target.value)
                    setShowSuggestions(true)
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  className="pr-10"
                />
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />

                {/* Search suggestions dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={`${suggestion.type}-${suggestion.id}-${index}`}
                        className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center space-x-2"
                        onClick={() => handleSuggestionSelect(suggestion)}
                      >
                        <span className="text-sm">{suggestion.title}</span>
                        <Badge variant="outline" className="text-xs">
                          {suggestion.type}
                        </Badge>
                      </button>
                    ))}
                  </div>
                )}

                {/* Loading indicator for suggestions */}
                {isLoadingSuggestions && (
                  <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  </div>
                )}
              </div>

              {/* Performance indicators */}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center space-x-1">
                  <Zap className="h-3 w-3" />
                  <span>Debounced search</span>
                </span>
                {error && <span className="text-red-500">{error}</span>}
              </div>
            </CardContent>
          </Card>

          {/* Filters */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Filter className="h-5 w-5" />
                  <span>Filters</span>
                  {activeFilterCount > 0 && (
                    <Badge variant="secondary">{activeFilterCount}</Badge>
                  )}
                </CardTitle>
                {activeFilterCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearFilters}
                    className="text-xs"
                  >
                    Clear all
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Use facets from search results if available */}
              {searchResults?.facets && (
                <>
                  <FacetSection
                    title="Data Types"
                    items={searchResults.facets.dataTypes}
                    category="dataTypes"
                    isOpen={facetsOpen.dataTypes}
                    onToggle={() =>
                      setFacetsOpen(prev => ({
                        ...prev,
                        dataTypes: !prev.dataTypes
                      }))
                    }
                  />
                  <Separator />
                  <FacetSection
                    title="Organizations"
                    items={searchResults.facets.organizations}
                    category="organizations"
                    isOpen={facetsOpen.organizations}
                    onToggle={() =>
                      setFacetsOpen(prev => ({
                        ...prev,
                        organizations: !prev.organizations
                      }))
                    }
                  />
                  <Separator />
                  <FacetSection
                    title="Topic Categories"
                    items={searchResults.facets.topicCategories}
                    category="topicCategories"
                    isOpen={facetsOpen.topicCategories}
                    onToggle={() =>
                      setFacetsOpen(prev => ({
                        ...prev,
                        topicCategories: !prev.topicCategories
                      }))
                    }
                  />
                  <Separator />
                  <FacetSection
                    title="Framework Types"
                    items={searchResults.facets.frameworkTypes}
                    category="frameworkTypes"
                    isOpen={facetsOpen.frameworkTypes}
                    onToggle={() =>
                      setFacetsOpen(prev => ({
                        ...prev,
                        frameworkTypes: !prev.frameworkTypes
                      }))
                    }
                  />
                </>
              )}

              {/* Temporal Range */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>Date Range</span>
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="date"
                    placeholder="Start date"
                    value={filters.startDate || ""}
                    onChange={e =>
                      handleFilterUpdate("startDate", e.target.value)
                    }
                  />
                  <Input
                    type="date"
                    placeholder="End date"
                    value={filters.endDate || ""}
                    onChange={e =>
                      handleFilterUpdate("endDate", e.target.value)
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results Section */}
        <div className="lg:col-span-3 space-y-6">
          {/* Toolbar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-lg font-semibold">
                Search Results
                {searchResults && (
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    ({searchResults.totalCount} found)
                  </span>
                )}
              </h2>
              {isLoading && (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">
                    Searching...
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {/* Sort controls */}
              <Select
                value={filters.sortBy || "relevance"}
                onValueChange={value => handleFilterUpdate("sortBy", value)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">Relevance</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                  <SelectItem value="updated">Updated</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.sortOrder || "desc"}
                onValueChange={value => handleFilterUpdate("sortOrder", value)}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Desc</SelectItem>
                  <SelectItem value="asc">Asc</SelectItem>
                </SelectContent>
              </Select>

              {/* View mode toggle */}
              <div className="flex border rounded-md">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "map" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("map")}
                >
                  <MapIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Results */}
          <EnhancedMetadataSearchResults
            searchResults={searchResults}
            isLoading={isLoading}
            error={error}
            viewMode={viewMode}
            onPageChange={page => handleFilterUpdate("page", page)}
            onPageSizeChange={pageSize =>
              handleFilterUpdate("pageSize", pageSize)
            }
          />
        </div>
      </div>

      {/* Click outside to close suggestions */}
      {showSuggestions && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowSuggestions(false)}
        />
      )}
    </div>
  )
}
