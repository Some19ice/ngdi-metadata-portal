"use client"

import { useState, useEffect, useRef } from "react"
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
  Loader2,
  Clock,
  TrendingUp,
  X,
  Filter,
  ChevronDown
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

import { useOptimizedSearch } from "@/lib/hooks/use-optimized-search"
import { searchMetadataRecordsAction } from "@/actions/db/metadata-records-actions"
import { geocodeLocationAction } from "@/actions/map-actions"

const searchFormSchema = z.object({
  query: z.string().min(1, "Please enter a search query"),
  type: z.enum(["auto", "metadata", "location"])
})

type SearchFormData = z.infer<typeof searchFormSchema>

interface SearchSuggestion {
  id: string
  type: "metadata" | "location" | "recent" | "trending"
  title: string
  subtitle?: string
  icon: React.ReactNode
}

interface OptimizedSearchFormProps {
  initialQuery?: string
  initialType?: string
  size?: "sm" | "md" | "lg"
  showSuggestions?: boolean
  className?: string
}

export function OptimizedSearchForm({
  initialQuery = "",
  initialType = "auto",
  size = "md",
  showSuggestions = false,
  className
}: OptimizedSearchFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showDropdown, setShowDropdown] = useState(false)
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const formRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const form = useForm<SearchFormData>({
    resolver: zodResolver(searchFormSchema),
    defaultValues: {
      query: initialQuery,
      type: initialType as any
    }
  })

  // Setup optimized search hooks
  const metadataSearch = useOptimizedSearch(async (query: string) => {
    const result = await searchMetadataRecordsAction({
      query,
      page: 1,
      pageSize: 5
    })
    return result.isSuccess ? result.data : null
  }, 200)

  const locationSearch = useOptimizedSearch(async (query: string) => {
    const result = await geocodeLocationAction({
      searchText: query,
      limit: 5,
      autocomplete: true,
      country: "NG"
    })
    return result.isSuccess ? result.data : null
  }, 200)

  // Load recent searches from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("ngdi-recent-searches")
      if (stored) {
        try {
          setRecentSearches(JSON.parse(stored))
        } catch {
          // Ignore invalid JSON
        }
      }
    }
  }, [])

  // Watch query changes and fetch suggestions
  const watchedQuery = form.watch("query")
  useEffect(() => {
    if (!showSuggestions) return

    const query = watchedQuery?.trim()
    if (!query || query.length < 2) {
      setSuggestions([])
      return
    }

    // Fetch suggestions from both metadata and location services
    const fetchSuggestions = async () => {
      const [metadataData, locationData] = await Promise.all([
        metadataSearch.debouncedSearch(query),
        locationSearch.debouncedSearch(query)
      ])

      const newSuggestions: SearchSuggestion[] = []

      // Add metadata suggestions
      if (metadataData?.records) {
        metadataData.records.slice(0, 3).forEach((record, index) => {
          newSuggestions.push({
            id: `metadata-${record.id}`,
            type: "metadata",
            title: record.title,
            subtitle: record.organization?.name || "Dataset",
            icon: <FileText className="h-4 w-4" />
          })
        })
      }

      // Add location suggestions
      if (locationData && Array.isArray(locationData)) {
        locationData.slice(0, 3).forEach((location, index) => {
          newSuggestions.push({
            id: `location-${index}`,
            type: "location",
            title: location.place_name || location.text || "Location",
            subtitle: "Nigeria",
            icon: <MapPin className="h-4 w-4" />
          })
        })
      }

      setSuggestions(newSuggestions)
    }

    fetchSuggestions()
  }, [watchedQuery, showSuggestions, metadataSearch, locationSearch])

  // Handle form submission
  const onSubmit = (data: SearchFormData) => {
    const query = data.query.trim()
    if (!query) return

    // Save to recent searches
    if (typeof window !== "undefined") {
      const updated = [query, ...recentSearches.filter(s => s !== query)].slice(
        0,
        10
      )
      setRecentSearches(updated)
      localStorage.setItem("ngdi-recent-searches", JSON.stringify(updated))
    }

    // Navigate to search results
    const params = new URLSearchParams()
    params.set("q", query)
    if (data.type !== "auto") {
      params.set("type", data.type)
    }

    router.push(`/search?${params.toString()}`)
    setShowDropdown(false)
  }

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    form.setValue("query", suggestion.title)
    if (suggestion.type === "metadata") {
      form.setValue("type", "metadata")
    } else if (suggestion.type === "location") {
      form.setValue("type", "location")
    }
    setShowDropdown(false)
    onSubmit(form.getValues())
  }

  // Handle recent search click
  const handleRecentSearchClick = (query: string) => {
    form.setValue("query", query)
    setShowDropdown(false)
    onSubmit({ query, type: "auto" })
  }

  // Size classes
  const sizeClasses = {
    sm: {
      container: "max-w-md",
      input: "h-9 text-sm",
      button: "h-9 px-3"
    },
    md: {
      container: "max-w-lg",
      input: "h-11",
      button: "h-11 px-4"
    },
    lg: {
      container: "max-w-2xl",
      input: "h-14 text-lg",
      button: "h-14 px-6"
    }
  }

  const currentSize = sizeClasses[size]
  const isLoading = metadataSearch.isLoading || locationSearch.isLoading

  // Map size to valid Button sizes
  const buttonSize = size === "md" ? "default" : size === "lg" ? "lg" : "sm"

  return (
    <div
      className={cn("relative w-full", currentSize.container, className)}
      ref={formRef}
    >
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="relative">
          <div className="flex gap-2">
            {/* Search Input */}
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                {...form.register("query")}
                placeholder="Search datasets, locations, or explore Nigeria's geospatial data..."
                className={cn(
                  "pl-10 pr-10 border-2 focus:border-primary",
                  currentSize.input
                )}
                onFocus={() => setShowDropdown(showSuggestions)}
                onBlur={() => {
                  // Delay hiding to allow clicks on suggestions
                  setTimeout(() => setShowDropdown(false), 200)
                }}
                autoComplete="off"
              />
              {isLoading && (
                <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
              )}
            </div>

            {/* Search Type Select */}
            <Select
              value={form.watch("type")}
              onValueChange={value => form.setValue("type", value as any)}
            >
              <SelectTrigger className={cn("w-32", currentSize.button)}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Smart</SelectItem>
                <SelectItem value="metadata">Datasets</SelectItem>
                <SelectItem value="location">Locations</SelectItem>
              </SelectContent>
            </Select>

            {/* Search Button */}
            <Button
              type="submit"
              size={buttonSize}
              className={currentSize.button}
            >
              <SearchIcon className="h-4 w-4" />
              <span className="sr-only">Search</span>
            </Button>
          </div>

          {/* Search Suggestions Dropdown */}
          {showDropdown && showSuggestions && (
            <Card className="absolute top-full left-0 right-0 z-50 mt-2 border shadow-lg">
              <CardContent className="p-0">
                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <div className="p-3 border-b">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                      <Clock className="h-3 w-3" />
                      Recent Searches
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {recentSearches.slice(0, 5).map((search, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="cursor-pointer hover:bg-secondary/80"
                          onClick={() => handleRecentSearchClick(search)}
                        >
                          {search}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Live Suggestions */}
                {suggestions.length > 0 && (
                  <div className="p-2">
                    <div className="text-xs text-muted-foreground mb-2 px-2">
                      Suggestions
                    </div>
                    {suggestions.map(suggestion => (
                      <div
                        key={suggestion.id}
                        className="flex items-center gap-3 p-2 rounded-md hover:bg-muted cursor-pointer"
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        {suggestion.icon}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">
                            {suggestion.title}
                          </div>
                          {suggestion.subtitle && (
                            <div className="text-xs text-muted-foreground truncate">
                              {suggestion.subtitle}
                            </div>
                          )}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {suggestion.type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}

                {/* No suggestions */}
                {watchedQuery &&
                  watchedQuery.length >= 2 &&
                  suggestions.length === 0 &&
                  !isLoading && (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No suggestions found. Press Enter to search.
                    </div>
                  )}

                {/* Loading state */}
                {isLoading && (
                  <div className="p-4 text-center">
                    <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                    <div className="text-sm text-muted-foreground mt-2">
                      Loading suggestions...
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Error Display */}
        {form.formState.errors.query && (
          <p className="text-sm text-destructive">
            {form.formState.errors.query.message}
          </p>
        )}
      </form>
    </div>
  )
}
