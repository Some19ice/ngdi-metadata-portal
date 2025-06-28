"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  SearchIcon,
  MapPin,
  FileText,
  Newspaper,
  BookOpen,
  Loader2,
  Clock,
  TrendingUp,
  X,
  Zap,
  Filter
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage
} from "@/components/ui/form"
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

import { useSearchOptimization } from "@/lib/hooks/use-search-optimization"
import { searchMetadataRecordsAction } from "@/actions/db/metadata-records-actions"
import { geocodeLocationAction } from "@/actions/map-actions"

const searchFormSchema = z.object({
  q: z
    .string()
    .min(1, "Please enter a search term")
    .min(2, "Search term must be at least 2 characters")
    .max(200, "Search term cannot exceed 200 characters")
    .transform(val => val.trim()),
  type: z.enum(["auto", "location", "metadata", "news", "docs"]).default("auto")
})

type SearchFormValues = z.infer<typeof searchFormSchema>

interface SearchSuggestion {
  id: string
  type: "recent" | "trending" | "metadata" | "location" | "suggestion"
  query: string
  title: string
  subtitle?: string
  count?: number
  timestamp?: number
}

interface EnhancedCentralSearchFormProps {
  initialQuery?: string
  initialType?: string
  showSuggestions?: boolean
  placeholder?: string
  size?: "sm" | "md" | "lg"
  onSearch?: (query: string, type: string) => void
}

export function EnhancedCentralSearchForm({
  initialQuery = "",
  initialType = "auto",
  showSuggestions = true,
  placeholder,
  size = "lg",
  onSearch
}: EnhancedCentralSearchFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Form state
  const [isSearching, setIsSearching] = useState(false)
  const [showSuggestionPanel, setShowSuggestionPanel] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])

  // Refs
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsPanelRef = useRef<HTMLDivElement>(null)

  // Initialize form
  const form = useForm<SearchFormValues>({
    resolver: zodResolver(searchFormSchema),
    defaultValues: {
      q: initialQuery || searchParams.get("q") || "",
      type: (searchParams.get("type") as any) || (initialType as any)
    }
  })

  const currentQuery = form.watch("q")
  const currentType = form.watch("type")

  // Search optimization hooks
  const metadataSearch = useSearchOptimization(
    async (query: string) => {
      const result = await searchMetadataRecordsAction({
        query,
        page: 1,
        pageSize: 5
      })
      return result.isSuccess ? result.data : null
    },
    {
      debounceDelay: 300,
      cacheExpiry: 5 * 60 * 1000,
      enablePrefetch: true
    }
  )

  const locationSearch = useSearchOptimization(
    async (query: string) => {
      const result = await geocodeLocationAction({
        searchText: query,
        limit: 5,
        autocomplete: true,
        country: "NG"
      })
      return result.isSuccess ? result.data : null
    },
    {
      debounceDelay: 300,
      cacheExpiry: 10 * 60 * 1000,
      enablePrefetch: true
    }
  )

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("ngdi-recent-searches")
      if (stored) {
        setRecentSearches(JSON.parse(stored))
      }
    } catch (error) {
      console.debug("Failed to load recent searches:", error)
    }
  }, [])

  // Real-time search suggestions
  useEffect(() => {
    if (currentQuery.length >= 2 && showSuggestions) {
      if (currentType === "metadata" || currentType === "auto") {
        metadataSearch.search(currentQuery)
      }
      if (currentType === "location" || currentType === "auto") {
        locationSearch.search(currentQuery)
      }
    }
  }, [currentQuery, currentType, showSuggestions])

  // Handle form submission
  async function onSubmit(values: SearchFormValues) {
    try {
      setIsSearching(true)

      if (!values.q || values.q.trim().length === 0) {
        toast({
          title: "Invalid Search",
          description: "Please enter a valid search term",
          variant: "destructive"
        })
        return
      }

      // Add to recent searches
      const updatedRecent = [
        values.q,
        ...recentSearches.filter(s => s !== values.q)
      ].slice(0, 10)

      setRecentSearches(updatedRecent)
      localStorage.setItem(
        "ngdi-recent-searches",
        JSON.stringify(updatedRecent)
      )

      // Hide suggestions panel
      setShowSuggestionPanel(false)

      // Custom search handler
      if (onSearch) {
        onSearch(values.q, values.type)
        return
      }

      // Navigate to search results
      const params = new URLSearchParams()
      params.set("q", values.q.trim())
      if (values.type !== "auto") {
        params.set("type", values.type)
      }

      router.push(`/search?${params.toString()}`)
    } catch (error) {
      console.error("Search error:", error)
      toast({
        title: "Search Error",
        description: "An error occurred while searching. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSearching(false)
    }
  }

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
    form.setValue("q", suggestion.query)
    setShowSuggestionPanel(false)

    // Auto-submit if it's a direct match
    if (suggestion.type === "metadata" || suggestion.type === "location") {
      form.handleSubmit(onSubmit)()
    }
  }

  // Generate intelligent suggestions
  const suggestions = useMemo(() => {
    const allSuggestions: SearchSuggestion[] = []

    // Recent searches
    if (currentQuery.length === 0) {
      recentSearches.slice(0, 5).forEach((search, index) => {
        allSuggestions.push({
          id: `recent-${index}`,
          type: "recent",
          query: search,
          title: search,
          subtitle: "Recent search",
          timestamp: Date.now() - index * 60000 // Mock timestamps
        })
      })
    }

    // Metadata suggestions
    if (metadataSearch.data?.records && currentQuery.length >= 2) {
      metadataSearch.data.records
        .slice(0, 3)
        .forEach((record: any, index: number) => {
          allSuggestions.push({
            id: `metadata-${index}`,
            type: "metadata",
            query: record.title,
            title: record.title,
            subtitle: `Dataset • ${record.organization || "Unknown"}`,
            count: 1
          })
        })
    }

    // Location suggestions
    if (locationSearch.data && currentQuery.length >= 2) {
      locationSearch.data.slice(0, 3).forEach((feature: any, index: number) => {
        allSuggestions.push({
          id: `location-${index}`,
          type: "location",
          query: feature.properties?.display_name || feature.properties?.name,
          title: feature.properties?.display_name || feature.properties?.name,
          subtitle: `Location • ${feature.properties?.state || "Nigeria"}`,
          count: 1
        })
      })
    }

    // Cached suggestions
    if (currentQuery.length >= 1) {
      const cachedSuggestions = metadataSearch.getSearchSuggestions(
        currentQuery,
        3
      )
      cachedSuggestions.forEach((suggestion, index) => {
        allSuggestions.push({
          id: `cached-${index}`,
          type: "suggestion",
          query: suggestion,
          title: suggestion,
          subtitle: "Suggestion"
        })
      })
    }

    return allSuggestions.slice(0, 8)
  }, [
    currentQuery,
    metadataSearch.data,
    locationSearch.data,
    recentSearches,
    metadataSearch
  ])

  // Get form size classes
  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return "text-sm"
      case "md":
        return "text-base"
      case "lg":
      default:
        return "text-lg"
    }
  }

  const getSearchTypeIcon = (type: string) => {
    switch (type) {
      case "location":
        return <MapPin className="h-4 w-4" />
      case "metadata":
        return <FileText className="h-4 w-4" />
      case "news":
        return <Newspaper className="h-4 w-4" />
      case "docs":
        return <BookOpen className="h-4 w-4" />
      default:
        return <SearchIcon className="h-4 w-4" />
    }
  }

  const getSearchTypePlaceholder = (type: string) => {
    if (placeholder) return placeholder

    switch (type) {
      case "location":
        return "Search for cities, states, regions..."
      case "metadata":
        return "Search datasets, maps, services..."
      case "news":
        return "Search news and announcements..."
      case "docs":
        return "Search documentation and guides..."
      default:
        return "Search locations, datasets, and more..."
    }
  }

  const getSuggestionIcon = (type: SearchSuggestion["type"]) => {
    switch (type) {
      case "recent":
        return <Clock className="h-4 w-4 text-muted-foreground" />
      case "trending":
        return <TrendingUp className="h-4 w-4 text-orange-500" />
      case "metadata":
        return <FileText className="h-4 w-4 text-blue-500" />
      case "location":
        return <MapPin className="h-4 w-4 text-green-500" />
      default:
        return <SearchIcon className="h-4 w-4 text-muted-foreground" />
    }
  }

  const isLoading =
    metadataSearch.isLoading || locationSearch.isLoading || isSearching

  return (
    <div className="relative w-full">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search Input with Suggestions */}
            <div className="relative flex-1">
              <FormField
                control={form.control}
                name="q"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="relative">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                          placeholder={getSearchTypePlaceholder(currentType)}
                          {...field}
                          ref={element => {
                            // Merge the form ref with our custom ref
                            field.ref(element)
                            if (inputRef.current !== element) {
                              ;(
                                inputRef as React.MutableRefObject<HTMLInputElement | null>
                              ).current = element
                            }
                          }}
                          className={cn(
                            "pl-10 pr-10",
                            getSizeClasses(),
                            size === "lg" && "h-12",
                            size === "md" && "h-10",
                            size === "sm" && "h-9"
                          )}
                          disabled={isSearching}
                          autoComplete="off"
                          spellCheck="false"
                          onFocus={() => setShowSuggestionPanel(true)}
                          onBlur={e => {
                            // Delay hiding to allow clicking suggestions
                            setTimeout(() => {
                              if (
                                !suggestionsPanelRef.current?.contains(
                                  document.activeElement
                                )
                              ) {
                                setShowSuggestionPanel(false)
                              }
                            }, 150)
                          }}
                        />

                        {/* Loading indicator */}
                        {isLoading && (
                          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                        )}

                        {/* Clear button */}
                        {field.value && !isLoading && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted"
                            onClick={() => {
                              form.setValue("q", "")
                              inputRef.current?.focus()
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Suggestions Panel */}
              {showSuggestions && showSuggestionPanel && (
                <Card
                  ref={suggestionsPanelRef}
                  className="absolute top-full left-0 right-0 z-50 mt-1 max-h-96 overflow-y-auto"
                >
                  <CardContent className="p-0">
                    {suggestions.length > 0 ? (
                      <div className="py-2">
                        {suggestions.map((suggestion, index) => (
                          <button
                            key={suggestion.id}
                            type="button"
                            className="w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors flex items-center gap-3"
                            onClick={() => handleSuggestionSelect(suggestion)}
                          >
                            {getSuggestionIcon(suggestion.type)}
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">
                                {suggestion.title}
                              </div>
                              {suggestion.subtitle && (
                                <div className="text-sm text-muted-foreground truncate">
                                  {suggestion.subtitle}
                                </div>
                              )}
                            </div>
                            {suggestion.count && (
                              <Badge variant="secondary" className="ml-2">
                                {suggestion.count}
                              </Badge>
                            )}
                          </button>
                        ))}
                      </div>
                    ) : currentQuery.length >= 2 ? (
                      <div className="p-4 text-center text-muted-foreground">
                        <SearchIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No suggestions found</p>
                      </div>
                    ) : (
                      <div className="p-4 text-center text-muted-foreground">
                        <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>Start typing to see suggestions</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Search Type Selector */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem className="w-full md:w-48">
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isSearching}
                    >
                      <SelectTrigger
                        className={cn(
                          size === "lg" && "h-12",
                          size === "md" && "h-10",
                          size === "sm" && "h-9"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          {getSearchTypeIcon(field.value)}
                          <SelectValue placeholder="Search in..." />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">
                          <div className="flex items-center gap-2">
                            <Zap className="h-4 w-4" />
                            <span>Smart Search</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="location">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span>Locations</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="metadata">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            <span>Datasets</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="news">
                          <div className="flex items-center gap-2">
                            <Newspaper className="h-4 w-4" />
                            <span>News</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="docs">
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4" />
                            <span>Documentation</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Search Button */}
            <Button
              type="submit"
              disabled={isSearching || !form.watch("q")?.trim()}
              className={cn(
                "min-w-24",
                size === "lg" && "h-12 px-8",
                size === "md" && "h-10 px-6",
                size === "sm" && "h-9 px-4"
              )}
            >
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <SearchIcon className="h-4 w-4 mr-2" />
                  Search
                </>
              )}
            </Button>
          </div>

          {/* Search Stats */}
          {(metadataSearch.data || locationSearch.data) && (
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {metadataSearch.data && (
                <span>
                  {metadataSearch.data.totalRecords.toLocaleString()} datasets
                </span>
              )}
              {locationSearch.data && (
                <span>{locationSearch.data.length} locations</span>
              )}
              {metadataSearch.isCached && (
                <Badge variant="outline" className="text-xs">
                  <Zap className="h-3 w-3 mr-1" />
                  Cached
                </Badge>
              )}
            </div>
          )}
        </form>
      </Form>
    </div>
  )
}
