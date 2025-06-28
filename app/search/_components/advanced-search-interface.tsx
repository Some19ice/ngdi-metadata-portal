"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import BoundingBoxSelector from "@/components/ui/map/bounding-box-selector"
import {
  Search,
  Filter,
  Save,
  History,
  Download,
  Share2,
  MapPin,
  Calendar,
  Layers,
  Building2,
  Tag,
  ChevronDown,
  ChevronUp,
  X,
  Plus,
  Settings,
  Star,
  Clock,
  TrendingUp,
  RotateCcw,
  Copy,
  ExternalLink
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"
import { useRouter, useSearchParams } from "next/navigation"

interface SearchFilter {
  id: string
  type: "text" | "select" | "multiselect" | "date" | "spatial" | "checkbox"
  label: string
  key: string
  value: any
  options?: Array<{ label: string; value: string; count?: number }>
  placeholder?: string
  description?: string
  required?: boolean
}

interface SavedSearch {
  id: string
  name: string
  description?: string
  filters: Record<string, any>
  created: Date
  lastUsed?: Date
  isPublic?: boolean
  tags?: string[]
}

interface AdvancedSearchInterfaceProps {
  onSearch: (filters: Record<string, any>) => void
  savedSearches?: SavedSearch[]
  onSaveSearch?: (search: Omit<SavedSearch, "id" | "created">) => void
  onDeleteSearch?: (id: string) => void
  initialFilters?: Record<string, any>
}

export default function AdvancedSearchInterface({
  onSearch,
  savedSearches = [],
  onSaveSearch,
  onDeleteSearch,
  initialFilters = {}
}: AdvancedSearchInterfaceProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [filters, setFilters] = useState<Record<string, any>>(initialFilters)
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    spatial: false,
    temporal: false,
    advanced: false
  })
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [searchName, setSearchName] = useState("")
  const [searchDescription, setSearchDescription] = useState("")
  const [searchTags, setSearchTags] = useState<string[]>([])
  const [currentTag, setCurrentTag] = useState("")

  // Define filter configurations
  const filterConfigs: SearchFilter[] = [
    {
      id: "query",
      type: "text",
      label: "Search Term",
      key: "query",
      value: filters.query || "",
      placeholder: "Enter keywords, titles, or descriptions...",
      description: "Search across titles, abstracts, and keywords"
    },
    {
      id: "dataType",
      type: "multiselect",
      label: "Data Type",
      key: "dataType",
      value: filters.dataType || [],
      options: [
        { label: "Vector", value: "vector", count: 456 },
        { label: "Raster", value: "raster", count: 234 },
        { label: "Tabular", value: "tabular", count: 123 },
        { label: "Web Service", value: "service", count: 89 },
        { label: "Document", value: "document", count: 67 }
      ]
    },
    {
      id: "organization",
      type: "select",
      label: "Organization",
      key: "organization",
      value: filters.organization || "",
      options: [
        { label: "All Organizations", value: "" },
        { label: "Federal Ministry of Environment", value: "fme", count: 234 },
        { label: "Nigerian Geological Survey", value: "ngs", count: 189 },
        { label: "NIMET", value: "nimet", count: 156 },
        { label: "National Bureau of Statistics", value: "nbs", count: 123 }
      ]
    },
    {
      id: "frameworkType",
      type: "multiselect",
      label: "Framework Type",
      key: "frameworkType",
      value: filters.frameworkType || [],
      options: [
        { label: "Administrative", value: "administrative", count: 345 },
        { label: "Statistical", value: "statistical", count: 234 },
        { label: "Legal", value: "legal", count: 123 },
        { label: "Cadastral", value: "cadastral", count: 89 }
      ]
    },
    {
      id: "keywords",
      type: "multiselect",
      label: "Topic Categories",
      key: "keywords",
      value: filters.keywords || [],
      options: [
        { label: "Environment", value: "environment", count: 234 },
        { label: "Population", value: "population", count: 189 },
        { label: "Infrastructure", value: "infrastructure", count: 156 },
        { label: "Agriculture", value: "agriculture", count: 123 },
        { label: "Health", value: "health", count: 98 }
      ]
    }
  ]

  const updateFilter = useCallback((key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }, [])

  const clearFilters = useCallback(() => {
    setFilters({})
  }, [])

  const handleSearch = useCallback(() => {
    // Remove empty filters
    const cleanedFilters = Object.entries(filters).reduce(
      (acc, [key, value]) => {
        if (value && (Array.isArray(value) ? value.length > 0 : true)) {
          acc[key] = value
        }
        return acc
      },
      {} as Record<string, any>
    )

    onSearch(cleanedFilters)

    // Update URL
    const params = new URLSearchParams()
    Object.entries(cleanedFilters).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        params.set(key, value.join(","))
      } else {
        params.set(key, value.toString())
      }
    })

    router.push(`?${params.toString()}`)
  }, [filters, onSearch, router])

  const handleSaveSearch = useCallback(() => {
    if (!searchName.trim()) {
      toast({
        title: "Search name required",
        description: "Please enter a name for your saved search",
        variant: "destructive"
      })
      return
    }

    const newSearch: Omit<SavedSearch, "id" | "created"> = {
      name: searchName.trim(),
      description: searchDescription.trim() || undefined,
      filters,
      tags: searchTags,
      isPublic: false
    }

    onSaveSearch?.(newSearch)
    setSaveDialogOpen(false)
    setSearchName("")
    setSearchDescription("")
    setSearchTags([])

    toast({
      title: "Search saved",
      description: `"${newSearch.name}" has been saved to your searches`
    })
  }, [searchName, searchDescription, filters, searchTags, onSaveSearch])

  const loadSavedSearch = useCallback((savedSearch: SavedSearch) => {
    setFilters(savedSearch.filters)
    toast({
      title: "Search loaded",
      description: `Loaded "${savedSearch.name}"`
    })
  }, [])

  const shareSearch = useCallback(() => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        params.set(key, value.join(","))
      } else {
        params.set(key, value.toString())
      }
    })

    const url = `${window.location.origin}/search?${params.toString()}`
    navigator.clipboard.writeText(url)

    toast({
      title: "Search URL copied",
      description: "Share this URL to let others use your search filters"
    })
  }, [filters])

  const addTag = useCallback(() => {
    if (currentTag.trim() && !searchTags.includes(currentTag.trim())) {
      setSearchTags(prev => [...prev, currentTag.trim()])
      setCurrentTag("")
    }
  }, [currentTag, searchTags])

  const removeTag = useCallback((tag: string) => {
    setSearchTags(prev => prev.filter(t => t !== tag))
  }, [])

  const FilterSection = ({
    title,
    icon,
    isExpanded,
    onToggle,
    children
  }: {
    title: string
    icon: React.ReactNode
    isExpanded: boolean
    onToggle: () => void
    children: React.ReactNode
  }) => (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-between p-4 h-auto">
          <div className="flex items-center gap-2">
            {icon}
            <span className="font-medium">{title}</span>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="px-4 pb-4 space-y-4">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  )

  const MultiSelectFilter = ({ config }: { config: SearchFilter }) => {
    const selectedValues = config.value || []

    return (
      <div className="space-y-2">
        <Label>{config.label}</Label>
        {config.description && (
          <p className="text-xs text-muted-foreground">{config.description}</p>
        )}
        <div className="space-y-2">
          {config.options?.map(option => (
            <div key={option.value} className="flex items-center space-x-2">
              <Checkbox
                id={`${config.id}-${option.value}`}
                checked={selectedValues.includes(option.value)}
                onCheckedChange={checked => {
                  const newValue = checked
                    ? [...selectedValues, option.value]
                    : selectedValues.filter((v: string) => v !== option.value)
                  updateFilter(config.key, newValue)
                }}
              />
              <Label
                htmlFor={`${config.id}-${option.value}`}
                className="flex-1 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span>{option.label}</span>
                  {option.count && (
                    <Badge variant="outline" className="ml-2">
                      {option.count.toLocaleString()}
                    </Badge>
                  )}
                </div>
              </Label>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const activeFilterCount = Object.values(filters).filter(
    value => value && (Array.isArray(value) ? value.length > 0 : true)
  ).length

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Advanced Search</h2>
          <p className="text-muted-foreground">
            Use filters to find exactly what you're looking for
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeFilterCount > 0 && (
            <Badge variant="secondary">
              {activeFilterCount} filter{activeFilterCount !== 1 ? "s" : ""}{" "}
              active
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
            disabled={activeFilterCount === 0}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Panel */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Search Filters</CardTitle>
                <div className="flex items-center gap-1">
                  <Dialog
                    open={saveDialogOpen}
                    onOpenChange={setSaveDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Save className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Save Search</DialogTitle>
                        <DialogDescription>
                          Save your current search filters for quick access
                          later
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="search-name">Search Name</Label>
                          <Input
                            id="search-name"
                            value={searchName}
                            onChange={e => setSearchName(e.target.value)}
                            placeholder="Enter a name for this search..."
                          />
                        </div>
                        <div>
                          <Label htmlFor="search-description">
                            Description (Optional)
                          </Label>
                          <Input
                            id="search-description"
                            value={searchDescription}
                            onChange={e => setSearchDescription(e.target.value)}
                            placeholder="Describe what this search is for..."
                          />
                        </div>
                        <div>
                          <Label>Tags</Label>
                          <div className="flex items-center gap-2 mt-1">
                            <Input
                              value={currentTag}
                              onChange={e => setCurrentTag(e.target.value)}
                              placeholder="Add a tag..."
                              onKeyDown={e => e.key === "Enter" && addTag()}
                            />
                            <Button size="sm" onClick={addTag}>
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          {searchTags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {searchTags.map(tag => (
                                <Badge key={tag} variant="secondary">
                                  {tag}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="ml-1 h-auto p-0"
                                    onClick={() => removeTag(tag)}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            onClick={() => setSaveDialogOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button onClick={handleSaveSearch}>
                            Save Search
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button variant="ghost" size="sm" onClick={shareSearch}>
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {/* Basic Filters */}
              <FilterSection
                title="Basic Search"
                icon={<Search className="h-4 w-4" />}
                isExpanded={expandedSections.basic}
                onToggle={() =>
                  setExpandedSections(prev => ({ ...prev, basic: !prev.basic }))
                }
              >
                <div>
                  <Label htmlFor="query">Search Term</Label>
                  <Input
                    id="query"
                    value={filters.query || ""}
                    onChange={e => updateFilter("query", e.target.value)}
                    placeholder="Enter keywords..."
                  />
                </div>

                {filterConfigs
                  .filter(config =>
                    ["dataType", "organization"].includes(config.id)
                  )
                  .map(config =>
                    config.type === "multiselect" ? (
                      <MultiSelectFilter key={config.id} config={config} />
                    ) : (
                      <div key={config.id}>
                        <Label>{config.label}</Label>
                        <Select
                          value={config.value}
                          onValueChange={value =>
                            updateFilter(config.key, value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={config.placeholder} />
                          </SelectTrigger>
                          <SelectContent>
                            {config.options?.map(option => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                <div className="flex items-center justify-between w-full">
                                  <span>{option.label}</span>
                                  {option.count && (
                                    <Badge variant="outline" className="ml-2">
                                      {option.count}
                                    </Badge>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )
                  )}
              </FilterSection>

              <Separator />

              {/* Spatial Filters */}
              <FilterSection
                title="Spatial Filters"
                icon={<MapPin className="h-4 w-4" />}
                isExpanded={expandedSections.spatial}
                onToggle={() =>
                  setExpandedSections(prev => ({
                    ...prev,
                    spatial: !prev.spatial
                  }))
                }
              >
                <div>
                  <Label>Geographic Area</Label>
                  <BoundingBoxSelector
                    initialBounds={filters.bbox}
                    onBoundsChange={bbox => updateFilter("bbox", bbox)}
                  />
                </div>
              </FilterSection>

              <Separator />

              {/* Temporal Filters */}
              <FilterSection
                title="Temporal Filters"
                icon={<Calendar className="h-4 w-4" />}
                isExpanded={expandedSections.temporal}
                onToggle={() =>
                  setExpandedSections(prev => ({
                    ...prev,
                    temporal: !prev.temporal
                  }))
                }
              >
                <div>
                  <Label>Date Range</Label>
                  <DateRangePicker
                    value={{
                      from: filters.startDate
                        ? new Date(filters.startDate)
                        : undefined,
                      to: filters.endDate
                        ? new Date(filters.endDate)
                        : undefined
                    }}
                    onChange={range => {
                      updateFilter(
                        "startDate",
                        range?.from?.toISOString() || ""
                      )
                      updateFilter("endDate", range?.to?.toISOString() || "")
                    }}
                  />
                </div>
              </FilterSection>

              <Separator />

              {/* Advanced Filters */}
              <FilterSection
                title="Advanced Filters"
                icon={<Settings className="h-4 w-4" />}
                isExpanded={expandedSections.advanced}
                onToggle={() =>
                  setExpandedSections(prev => ({
                    ...prev,
                    advanced: !prev.advanced
                  }))
                }
              >
                {filterConfigs
                  .filter(config =>
                    ["frameworkType", "keywords"].includes(config.id)
                  )
                  .map(config => (
                    <MultiSelectFilter key={config.id} config={config} />
                  ))}
              </FilterSection>

              {/* Search Actions */}
              <div className="p-4 space-y-2">
                <Button onClick={handleSearch} className="w-full" size="lg">
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="w-full"
                  disabled={activeFilterCount === 0}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Saved Searches */}
          {savedSearches.length > 0 && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Saved Searches
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {savedSearches.slice(0, 5).map(search => (
                  <div
                    key={search.id}
                    className="p-3 border rounded-lg hover:bg-accent/50 cursor-pointer"
                    onClick={() => loadSavedSearch(search)}
                  >
                    <div className="font-medium text-sm">{search.name}</div>
                    {search.description && (
                      <div className="text-xs text-muted-foreground line-clamp-2">
                        {search.description}
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <div className="text-xs text-muted-foreground">
                        {search.lastUsed ? (
                          <span>
                            Used{" "}
                            {new Date(search.lastUsed).toLocaleDateString()}
                          </span>
                        ) : (
                          <span>
                            Created{" "}
                            {new Date(search.created).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      {search.tags && search.tags.length > 0 && (
                        <div className="flex gap-1">
                          {search.tags.slice(0, 2).map(tag => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className="text-xs"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Search Results</CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                  <Button variant="outline" size="sm">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {activeFilterCount === 0 ? (
                <div className="text-center py-12">
                  <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    Start Your Search
                  </h3>
                  <p className="text-muted-foreground">
                    Use the filters on the left to find exactly what you're
                    looking for
                  </p>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="animate-pulse">
                    <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Searching...</h3>
                    <p className="text-muted-foreground">
                      Finding results that match your criteria
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
