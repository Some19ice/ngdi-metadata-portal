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
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover"
import {
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  X,
  Calendar,
  Map,
  Building,
  Tag,
  Grid3X3,
  List,
  MapIcon
} from "lucide-react"
import { cn } from "@/lib/utils"

interface SearchFacets {
  dataTypes: { value: string; count: number }[]
  organizations: { value: string; count: number }[]
  topicCategories: { value: string; count: number }[]
  frameworkTypes: { value: string; count: number }[]
  years: { value: string; count: number }[]
}

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
  spatialBounds: {
    north: number | null
    south: number | null
    east: number | null
    west: number | null
  } | null
  sortBy: "relevance" | "date" | "title" | "updated"
  sortOrder: "asc" | "desc"
}

interface Suggestion {
  text: string
  type: "query" | "organization" | "category"
  count?: number
}

const defaultFilters: SearchFilters = {
  query: "",
  dataTypes: [],
  organizations: [],
  topicCategories: [],
  frameworkTypes: [],
  temporalRange: { start: null, end: null },
  spatialBounds: null,
  sortBy: "relevance",
  sortOrder: "desc"
}

// Mock data - in real implementation, this would come from API
const mockFacets: SearchFacets = {
  dataTypes: [
    { value: "Vector", count: 45 },
    { value: "Raster", count: 32 },
    { value: "Table", count: 18 },
    { value: "Point Cloud", count: 12 }
  ],
  organizations: [
    { value: "Department of Geography", count: 28 },
    { value: "Transport Authority", count: 22 },
    { value: "Census Bureau", count: 19 },
    { value: "Environmental Agency", count: 16 }
  ],
  topicCategories: [
    { value: "Environment", count: 34 },
    { value: "Transportation", count: 26 },
    { value: "Planning/Cadastre", count: 21 },
    { value: "Boundaries", count: 18 }
  ],
  frameworkTypes: [
    { value: "Fundamental", count: 42 },
    { value: "Framework", count: 31 },
    { value: "Thematic", count: 24 }
  ],
  years: [
    { value: "2023", count: 45 },
    { value: "2022", count: 38 },
    { value: "2021", count: 32 },
    { value: "2020", count: 28 }
  ]
}

const mockSuggestions: Suggestion[] = [
  { text: "land cover", type: "query", count: 12 },
  { text: "transportation network", type: "query", count: 8 },
  { text: "population density", type: "query", count: 6 },
  { text: "Lagos State", type: "organization", count: 15 },
  { text: "Environmental data", type: "category", count: 34 }
]

export default function EnhancedMetadataSearch() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [filters, setFilters] = useState<SearchFilters>(defaultFilters)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "list" | "map">("grid")
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [facetsOpen, setFacetsOpen] = useState({
    dataTypes: true,
    organizations: false,
    topicCategories: false,
    frameworkTypes: false
  })

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
      spatialBounds: null, // TODO: Parse spatial bounds from params
      sortBy: (params.get("sortBy") as any) || "relevance",
      sortOrder: (params.get("sortOrder") as any) || "desc"
    })
  }, [searchParams])

  // Update suggestions based on query
  useEffect(() => {
    if (filters.query.length > 2) {
      // In real implementation, this would be an API call
      const filtered = mockSuggestions.filter(s =>
        s.text.toLowerCase().includes(filters.query.toLowerCase())
      )
      setSuggestions(filtered)
      setShowSuggestions(true)
    } else {
      setShowSuggestions(false)
    }
  }, [filters.query])

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
      (filters.temporalRange.end ? 1 : 0) +
      (filters.spatialBounds ? 1 : 0)
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
          {items.map(item => (
            <div key={item.value} className="flex items-center space-x-2">
              <Checkbox
                id={`${category}-${item.value}`}
                checked={filters[category].includes(item.value)}
                onCheckedChange={() => toggleFilter(category, item.value)}
              />
              <Label
                htmlFor={`${category}-${item.value}`}
                className="text-sm flex-1 cursor-pointer flex justify-between"
              >
                <span>{item.value}</span>
                <span className="text-muted-foreground">({item.count})</span>
              </Label>
            </div>
          ))}
        </CollapsibleContent>
      </Collapsible>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Enhanced Metadata Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Main Search Input */}
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search for datasets, keywords, or locations..."
                value={filters.query}
                onChange={e => updateFilters({ query: e.target.value })}
                className="pl-10 pr-4"
                onFocus={() =>
                  filters.query.length > 2 && setShowSuggestions(true)
                }
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              />
            </div>

            {/* Search Suggestions */}
            {showSuggestions && suggestions.length > 0 && (
              <Card className="absolute top-full mt-1 w-full z-50 shadow-lg">
                <CardContent className="p-2">
                  <Command>
                    <CommandList>
                      <CommandGroup>
                        {suggestions.map((suggestion, index) => (
                          <CommandItem
                            key={index}
                            onSelect={() => {
                              updateFilters({ query: suggestion.text })
                              setShowSuggestions(false)
                            }}
                            className="cursor-pointer"
                          >
                            <div className="flex justify-between w-full">
                              <span>{suggestion.text}</span>
                              <div className="flex items-center gap-2">
                                {suggestion.type === "organization" && (
                                  <Building className="h-3 w-3" />
                                )}
                                {suggestion.type === "category" && (
                                  <Tag className="h-3 w-3" />
                                )}
                                {suggestion.count && (
                                  <span className="text-xs text-muted-foreground">
                                    {suggestion.count}
                                  </span>
                                )}
                              </div>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Quick Filters & Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              Advanced Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>

            {activeFilterCount > 0 && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            )}

            <div className="ml-auto flex items-center gap-2">
              <Select
                value={filters.sortBy}
                onValueChange={(value: any) => updateFilters({ sortBy: value })}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">Relevance</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                  <SelectItem value="updated">Last Updated</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex border rounded-md">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="rounded-r-none"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="rounded-none"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "map" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("map")}
                  className="rounded-l-none"
                >
                  <MapIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Active Filters Display */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-2">
              {filters.dataTypes.map(type => (
                <Badge key={type} variant="secondary" className="gap-1">
                  {type}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => toggleFilter("dataTypes", type)}
                  />
                </Badge>
              ))}
              {filters.organizations.map(org => (
                <Badge key={org} variant="secondary" className="gap-1">
                  {org}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => toggleFilter("organizations", org)}
                  />
                </Badge>
              ))}
              {filters.topicCategories.map(cat => (
                <Badge key={cat} variant="secondary" className="gap-1">
                  {cat}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => toggleFilter("topicCategories", cat)}
                  />
                </Badge>
              ))}
              {filters.frameworkTypes.map(type => (
                <Badge key={type} variant="secondary" className="gap-1">
                  {type}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => toggleFilter("frameworkTypes", type)}
                  />
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Advanced Filters Panel */}
      {showAdvanced && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Faceted Filters */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-base">Filter By</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FacetSection
                title="Data Types"
                items={mockFacets.dataTypes}
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
                items={mockFacets.organizations}
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
                items={mockFacets.topicCategories}
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
                items={mockFacets.frameworkTypes}
                category="frameworkTypes"
                isOpen={facetsOpen.frameworkTypes}
                onToggle={() =>
                  setFacetsOpen(prev => ({
                    ...prev,
                    frameworkTypes: !prev.frameworkTypes
                  }))
                }
              />

              <Separator />

              {/* Temporal Range */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Temporal Range
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="date"
                    placeholder="Start date"
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
                  <Input
                    type="date"
                    placeholder="End date"
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

              <Separator />

              {/* Spatial Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Map className="h-4 w-4" />
                  Spatial Filter
                </Label>
                <Button variant="outline" size="sm" className="w-full">
                  Draw on Map
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Search Results Area */}
          <div className="lg:col-span-3">
            <Card>
              <CardContent className="p-6">
                <div className="text-center text-muted-foreground">
                  Search results will appear here...
                  <br />
                  <small>Current view mode: {viewMode}</small>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
