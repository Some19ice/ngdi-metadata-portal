"use client"

import { useState, useEffect, useMemo } from "react"
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
  Loader2
} from "lucide-react"
import { getSearchFacets, SearchFacets } from "./enhanced-search-facets"
import EnhancedMetadataSearchResults from "./enhanced-metadata-search-results"

interface SearchFilters {
  query: string
  dataTypes: string[]
  organizations: string[]
  topicCategories: string[]
  frameworkTypes: string[]
  temporalRange: {
    start: string | null
    end: string | null
  }
  sortBy: "relevance" | "date" | "title" | "updated"
  sortOrder: "asc" | "desc"
}

const defaultFilters: SearchFilters = {
  query: "",
  dataTypes: [],
  organizations: [],
  topicCategories: [],
  frameworkTypes: [],
  temporalRange: { start: null, end: null },
  sortBy: "relevance",
  sortOrder: "desc"
}

export default function EnhancedMetadataSearch() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [filters, setFilters] = useState<SearchFilters>(defaultFilters)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "list" | "map">("grid")
  const [facetsOpen, setFacetsOpen] = useState({
    dataTypes: true,
    organizations: false,
    topicCategories: false,
    frameworkTypes: false
  })

  // State for real data
  const [facets, setFacets] = useState<SearchFacets | null>(null)
  const [isLoadingFacets, setIsLoadingFacets] = useState(true)

  // Initialize filters from URL params
  useEffect(() => {
    const params = new URLSearchParams(searchParams)
    setFilters({
      query: params.get("query") || "",
      dataTypes: params.get("dataTypes")?.split(",").filter(Boolean) || [],
      organizations:
        params.get("organizations")?.split(",").filter(Boolean) || [],
      topicCategories:
        params.get("topicCategories")?.split(",").filter(Boolean) || [],
      frameworkTypes:
        params.get("frameworkTypes")?.split(",").filter(Boolean) || [],
      temporalRange: {
        start: params.get("startDate"),
        end: params.get("endDate")
      },
      sortBy: (params.get("sortBy") as any) || "relevance",
      sortOrder: (params.get("sortOrder") as any) || "desc"
    })
  }, [searchParams])

  // Load initial facets when component mounts
  useEffect(() => {
    loadFacets()
  }, [])

  const loadFacets = async () => {
    setIsLoadingFacets(true)
    try {
      const facetsData = await getSearchFacets()
      setFacets(facetsData)
    } catch (error) {
      console.error("Error loading facets:", error)
    } finally {
      setIsLoadingFacets(false)
    }
  }

  const updateFilters = (updates: Partial<SearchFilters>) => {
    const newFilters = { ...filters, ...updates }
    setFilters(newFilters)

    // Update URL
    const params = new URLSearchParams()
    if (newFilters.query) params.set("query", newFilters.query)
    if (newFilters.dataTypes.length)
      params.set("dataTypes", newFilters.dataTypes.join(","))
    if (newFilters.organizations.length)
      params.set("organizations", newFilters.organizations.join(","))
    if (newFilters.topicCategories.length)
      params.set("topicCategories", newFilters.topicCategories.join(","))
    if (newFilters.frameworkTypes.length)
      params.set("frameworkTypes", newFilters.frameworkTypes.join(","))
    if (newFilters.temporalRange.start)
      params.set("startDate", newFilters.temporalRange.start)
    if (newFilters.temporalRange.end)
      params.set("endDate", newFilters.temporalRange.end)
    if (newFilters.sortBy !== "relevance")
      params.set("sortBy", newFilters.sortBy)
    if (newFilters.sortOrder !== "desc")
      params.set("sortOrder", newFilters.sortOrder)

    router.push(`/metadata/search?${params.toString()}`)
  }

  const toggleFilter = (
    category: keyof Pick<
      SearchFilters,
      "dataTypes" | "organizations" | "topicCategories" | "frameworkTypes"
    >,
    value: string
  ) => {
    const current = filters[category]
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value]

    updateFilters({ [category]: updated })
  }

  const clearFilters = () => {
    updateFilters(defaultFilters)
  }

  const activeFilterCount = useMemo(() => {
    return (
      filters.dataTypes.length +
      filters.organizations.length +
      filters.topicCategories.length +
      filters.frameworkTypes.length +
      (filters.temporalRange.start ? 1 : 0) +
      (filters.temporalRange.end ? 1 : 0)
    )
  }, [filters])

  const FacetSection = ({
    title,
    items,
    category,
    isOpen,
    onToggle
  }: {
    title: string
    items: { value: string; count: number }[]
    category: keyof Pick<
      SearchFilters,
      "dataTypes" | "organizations" | "topicCategories" | "frameworkTypes"
    >
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
          {items?.length > 0 ? (
            items.map(item => (
              <div key={item.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`${category}-${item.value}`}
                  checked={filters[category].includes(item.value)}
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

  // Search suggestions (simplified - you could make this more sophisticated)
  const suggestions = useMemo(() => {
    if (!filters.query || filters.query.length < 2) return []

    const allKeywords = [
      ...(facets?.organizations.map(org => org.value) || []),
      ...(facets?.dataTypes.map(dt => dt.value) || []),
      ...(facets?.frameworkTypes.map(ft => ft.value) || []),
      ...(facets?.topicCategories.map(tc => tc.value) || [])
    ]

    return allKeywords
      .filter(item => item.toLowerCase().includes(filters.query.toLowerCase()))
      .slice(0, 5)
  }, [filters.query, facets])

  if (isLoadingFacets) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading search interface...</span>
          </div>
        </div>
      </div>
    )
  }

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
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Input
                  placeholder="Search datasets..."
                  value={filters.query}
                  onChange={e => updateFilters({ query: e.target.value })}
                  className="pr-10"
                />
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>

              {/* Search suggestions */}
              {suggestions.length > 0 && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    Suggestions:
                  </Label>
                  <div className="flex flex-wrap gap-1">
                    {suggestions.map(suggestion => (
                      <Button
                        key={suggestion}
                        variant="outline"
                        size="sm"
                        className="h-6 text-xs"
                        onClick={() => updateFilters({ query: suggestion })}
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Advanced Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full justify-between"
              >
                <span>Advanced Search</span>
                {showAdvanced ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>

              {/* Advanced Search Options */}
              {showAdvanced && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="start-date" className="text-xs">
                        Start Date
                      </Label>
                      <Input
                        id="start-date"
                        type="date"
                        value={filters.temporalRange.start || ""}
                        onChange={e =>
                          updateFilters({
                            temporalRange: {
                              ...filters.temporalRange,
                              start: e.target.value
                            }
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="end-date" className="text-xs">
                        End Date
                      </Label>
                      <Input
                        id="end-date"
                        type="date"
                        value={filters.temporalRange.end || ""}
                        onChange={e =>
                          updateFilters({
                            temporalRange: {
                              ...filters.temporalRange,
                              end: e.target.value
                            }
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Filter className="h-5 w-5" />
                  <span>Filters</span>
                  {activeFilterCount > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {activeFilterCount}
                    </Badge>
                  )}
                </div>
                {activeFilterCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="h-auto p-1"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FacetSection
                title="Data Types"
                items={facets?.dataTypes || []}
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
                items={facets?.organizations || []}
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
                items={facets?.topicCategories || []}
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
                items={facets?.frameworkTypes || []}
                category="frameworkTypes"
                isOpen={facetsOpen.frameworkTypes}
                onToggle={() =>
                  setFacetsOpen(prev => ({
                    ...prev,
                    frameworkTypes: !prev.frameworkTypes
                  }))
                }
              />
            </CardContent>
          </Card>
        </div>

        {/* Results Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* View Controls */}
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Label className="text-sm font-medium">View:</Label>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant={viewMode === "grid" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("grid")}
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("list")}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === "map" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("map")}
                    >
                      <MapIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Label className="text-sm">Sort by:</Label>
                  <Select
                    value={filters.sortBy}
                    onValueChange={value =>
                      updateFilters({ sortBy: value as any })
                    }
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
                    value={filters.sortOrder}
                    onValueChange={value =>
                      updateFilters({ sortOrder: value as any })
                    }
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desc">Desc</SelectItem>
                      <SelectItem value="asc">Asc</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Search Results */}
          <EnhancedMetadataSearchResults
            filters={filters}
            viewMode={viewMode}
          />
        </div>
      </div>
    </div>
  )
} 