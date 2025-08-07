"use client"

import { useState, Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Search,
  SlidersHorizontal,
  Grid3X3,
  List,
  Map,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  Clock,
  MapPin,
  FileText,
  Loader2
} from "lucide-react"
import { useUnifiedSearch } from "@/lib/hooks/use-unified-search"
import { MetadataSearchFilters } from "@/types"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "@/components/ui/collapsible"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Skeleton,
  DatasetCardSkeleton
} from "@/components/utilities/loading-skeleton"

interface ViewMode {
  id: "grid" | "list" | "map"
  label: string
  icon: any
}

const VIEW_MODES: ViewMode[] = [
  { id: "grid", label: "Grid", icon: Grid3X3 },
  { id: "list", label: "List", icon: List },
  { id: "map", label: "Map", icon: Map }
]

const SORT_OPTIONS = [
  { value: "relevance", label: "Relevance" },
  { value: "date", label: "Date Created" },
  { value: "title", label: "Title" },
  { value: "updated", label: "Last Updated" }
]

export default function SimplifiedMetadataSearch() {
  const {
    filters,
    results,
    isLoading,
    error,
    updateFilter,
    clearFilter,
    clearAllFilters,
    hasActiveFilters,
    activeFilterCount
  } = useUnifiedSearch()

  // Local UI state
  const [viewMode, setViewMode] = useState<"grid" | "list" | "map">("grid")
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [facetsOpen, setFacetsOpen] = useState({
    dataTypes: true,
    organizations: false,
    topicCategories: false,
    frameworkTypes: false
  })

  // Handle search input
  const handleSearchChange = (value: string) => {
    updateFilter("query", value)
  }

  // Handle facet toggle
  const toggleFacet = (category: keyof typeof facetsOpen, value: string) => {
    const current =
      (filters[category as keyof MetadataSearchFilters] as string[]) || []
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value]

    updateFilter(category as keyof MetadataSearchFilters, updated)
  }

  // Get active filter badges
  const getActiveFilters = () => {
    const active: Array<{ key: string; label: string; value: string }> = []

    if (filters.query) {
      active.push({ key: "query", label: "Search", value: filters.query })
    }

    if (filters.dataTypes?.length) {
      filters.dataTypes.forEach(type =>
        active.push({ key: "dataTypes", label: "Data Type", value: type })
      )
    }

    if (filters.organizations?.length) {
      filters.organizations.forEach(org =>
        active.push({ key: "organizations", label: "Organization", value: org })
      )
    }

    if (filters.topicCategories?.length) {
      filters.topicCategories.forEach(topic =>
        active.push({ key: "topicCategories", label: "Topic", value: topic })
      )
    }

    if (filters.frameworkTypes?.length) {
      filters.frameworkTypes.forEach(framework =>
        active.push({
          key: "frameworkTypes",
          label: "Framework",
          value: framework
        })
      )
    }

    return active
  }

  const activeFilters = getActiveFilters()

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Search Header */}
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Search Metadata</h1>
          <div className="flex items-center gap-2">
            {VIEW_MODES.map(mode => {
              const Icon = mode.icon
              return (
                <Button
                  key={mode.id}
                  variant={viewMode === mode.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode(mode.id)}
                >
                  <Icon className="h-4 w-4" />
                  <span className="sr-only">{mode.label}</span>
                </Button>
              )
            })}
          </div>
        </div>

        {/* Main Search Bar */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search datasets, maps, services..."
              value={filters.query || ""}
              onChange={e => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="px-3"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="sr-only">Advanced Search</span>
          </Button>
        </div>

        {/* Active Filters */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Active filters:
            </span>
            {activeFilters.map((filter, index) => (
              <Badge
                key={`${filter.key}-${filter.value}-${index}`}
                variant="secondary"
                className="text-xs"
              >
                {filter.label}: {filter.value}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 ml-1"
                  onClick={() => {
                    if (filter.key === "query") {
                      clearFilter("query")
                    } else {
                      const current = filters[
                        filter.key as keyof MetadataSearchFilters
                      ] as string[]
                      const updated = current.filter(v => v !== filter.value)
                      updateFilter(
                        filter.key as keyof MetadataSearchFilters,
                        updated
                      )
                    }
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
            {activeFilters.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="text-xs text-muted-foreground"
              >
                Clear all
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filters
                </h3>
                {hasActiveFilters && (
                  <Badge variant="secondary" className="text-xs">
                    {activeFilterCount}
                  </Badge>
                )}
              </div>

              <Separator />

              {/* Sort Options */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Sort by</Label>
                <Select
                  value={filters.sortBy || "relevance"}
                  onValueChange={value => updateFilter("sortBy", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Facet Sections - These would be populated from search results */}
              {results?.facets && (
                <>
                  {/* Data Types */}
                  {results.facets.dataTypes.length > 0 && (
                    <FacetSection
                      title="Data Types"
                      items={results.facets.dataTypes}
                      selectedValues={filters.dataTypes || []}
                      onToggle={value => toggleFacet("dataTypes", value)}
                      isOpen={facetsOpen.dataTypes}
                      onToggleOpen={() =>
                        setFacetsOpen(prev => ({
                          ...prev,
                          dataTypes: !prev.dataTypes
                        }))
                      }
                    />
                  )}

                  {/* Organizations */}
                  {results.facets.organizations.length > 0 && (
                    <FacetSection
                      title="Organizations"
                      items={results.facets.organizations}
                      selectedValues={filters.organizations || []}
                      onToggle={value => toggleFacet("organizations", value)}
                      isOpen={facetsOpen.organizations}
                      onToggleOpen={() =>
                        setFacetsOpen(prev => ({
                          ...prev,
                          organizations: !prev.organizations
                        }))
                      }
                    />
                  )}

                  {/* Topic Categories */}
                  {results.facets.topicCategories.length > 0 && (
                    <FacetSection
                      title="Topic Categories"
                      items={results.facets.topicCategories}
                      selectedValues={filters.topicCategories || []}
                      onToggle={value => toggleFacet("topicCategories", value)}
                      isOpen={facetsOpen.topicCategories}
                      onToggleOpen={() =>
                        setFacetsOpen(prev => ({
                          ...prev,
                          topicCategories: !prev.topicCategories
                        }))
                      }
                    />
                  )}

                  {/* Framework Types */}
                  {results.facets.frameworkTypes.length > 0 && (
                    <FacetSection
                      title="Framework Types"
                      items={results.facets.frameworkTypes}
                      selectedValues={filters.frameworkTypes || []}
                      onToggle={value => toggleFacet("frameworkTypes", value)}
                      isOpen={facetsOpen.frameworkTypes}
                      onToggleOpen={() =>
                        setFacetsOpen(prev => ({
                          ...prev,
                          frameworkTypes: !prev.frameworkTypes
                        }))
                      }
                    />
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Results Area */}
        <div className="lg:col-span-3 space-y-4">
          {/* Results Header */}
          {(results || isLoading) && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {isLoading
                  ? "Searching..."
                  : results
                    ? `${results.totalCount} result${results.totalCount !== 1 ? "s" : ""} found`
                    : null}
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <Card className="border-destructive">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-destructive">
                  <X className="h-4 w-4" />
                  <span>Search Error: {error}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <DatasetCardSkeleton key={index} className="h-32" />
              ))}
            </div>
          )}

          {/* Results */}
          {results && !isLoading && (
            <Suspense fallback={<DatasetCardSkeleton className="h-64" />}>
              <SearchResults results={results} viewMode={viewMode} />
            </Suspense>
          )}

          {/* Empty State */}
          {!results && !isLoading && !error && filters.query && (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No results found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search terms or filters
                </p>
                <Button variant="outline" onClick={clearAllFilters}>
                  Clear all filters
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Initial State */}
          {!results && !isLoading && !error && !filters.query && (
            <Card>
              <CardContent className="p-8 text-center">
                <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  Start your search
                </h3>
                <p className="text-muted-foreground">
                  Enter keywords to search for datasets, maps, and services
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

// Facet Section Component
interface FacetSectionProps {
  title: string
  items: Array<{ value: string; count: number }>
  selectedValues: string[]
  onToggle: (value: string) => void
  isOpen: boolean
  onToggleOpen: () => void
}

function FacetSection({
  title,
  items,
  selectedValues,
  onToggle,
  isOpen,
  onToggleOpen
}: FacetSectionProps) {
  return (
    <Collapsible open={isOpen} onOpenChange={onToggleOpen}>
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
      <CollapsibleContent className="space-y-2 mt-2">
        {items.slice(0, 10).map(item => (
          <div key={item.value} className="flex items-center space-x-2">
            <Checkbox
              id={`${title}-${item.value}`}
              checked={selectedValues.includes(item.value)}
              onCheckedChange={() => onToggle(item.value)}
            />
            <Label
              htmlFor={`${title}-${item.value}`}
              className="text-sm cursor-pointer flex-1 flex items-center justify-between"
            >
              <span>{item.value}</span>
              <span className="text-muted-foreground">({item.count})</span>
            </Label>
          </div>
        ))}
        {items.length > 10 && (
          <Button variant="ghost" size="sm" className="w-full text-xs">
            Show {items.length - 10} more
          </Button>
        )}
      </CollapsibleContent>
    </Collapsible>
  )
}

// Search Results Component
interface SearchResultsProps {
  results: any // TODO: Type this properly
  viewMode: "grid" | "list" | "map"
}

function SearchResults({ results, viewMode }: SearchResultsProps) {
  if (!results?.records?.length) {
    return null
  }

  if (viewMode === "map") {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="h-96 bg-muted rounded-md flex items-center justify-center">
            <div className="text-center">
              <Map className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">Map view coming soon</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div
      className={
        viewMode === "grid"
          ? "grid grid-cols-1 md:grid-cols-2 gap-4"
          : "space-y-4"
      }
    >
      {results.records.map((record: any) => (
        <SearchResultCard key={record.id} record={record} viewMode={viewMode} />
      ))}
    </div>
  )
}

// Search Result Card Component
interface SearchResultCardProps {
  record: any
  viewMode: "grid" | "list"
}

function SearchResultCard({ record, viewMode }: SearchResultCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className={viewMode === "list" ? "flex gap-4" : "space-y-3"}>
          <div className="flex-1 space-y-2">
            <h3 className="font-semibold text-lg leading-tight">
              {record.title}
            </h3>

            {record.abstract && (
              <p className="text-sm text-muted-foreground line-clamp-3">
                {record.abstract}
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              {record.dataType && (
                <Badge variant="outline" className="text-xs">
                  {record.dataType}
                </Badge>
              )}
              {record.organization?.name && (
                <Badge variant="secondary" className="text-xs">
                  {record.organization.name}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(record.createdAt).toLocaleDateString()}
              </div>
              {record.spatialCoverage && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {record.spatialCoverage}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
