"use client"

import React from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, X, Loader2, MapPin, FileText, Map } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useRef, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
import { useDebounce } from "@/lib/hooks/use-debounce"
import { MovingBorderWrapper } from "@/components/ui/moving-border"
import {
  SEARCH_PARAM_NAMES,
  generateSearchUrl
} from "@/lib/utils/search-params-utils"
import { MetadataSearchFilters } from "@/types"

interface Suggestion {
  id: string
  place_name: string
  center: [number, number]
}

interface MetadataSuggestion {
  id: string
  title: string
  type: "metadata"
}

type SearchSuggestion = Suggestion | MetadataSuggestion

export default function GlobalSearchBar() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isFocused, setIsFocused] = useState(false)
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (debouncedSearchTerm.length < 2) {
        setSuggestions([])
        return
      }

      setIsLoading(true)
      try {
        // Fetch both location and metadata suggestions in parallel
        const [locationResponse, metadataResponse] = await Promise.all([
          fetch(
            `/api/map/geocode?q=${encodeURIComponent(debouncedSearchTerm)}`
          ),
          fetch(
            `/api/search/metadata-suggestions?q=${encodeURIComponent(
              debouncedSearchTerm
            )}`
          )
        ])

        const locationData = locationResponse.ok
          ? await locationResponse.json()
          : { features: [] }

        const rawMetadata = metadataResponse.ok
          ? await metadataResponse.json()
          : { data: [] }

        // Normalize metadata suggestions and tag them for rendering
        const metadataSuggestions: MetadataSuggestion[] = Array.isArray(
          rawMetadata?.data
        )
          ? (rawMetadata.data as Array<{ id: string; title: string }>).map(
              s => ({
                id: s.id,
                title: s.title,
                type: "metadata"
              })
            )
          : []

        // Combine suggestions with priority: metadata first, then locations
        const allSuggestions: SearchSuggestion[] = [
          ...metadataSuggestions.slice(0, 3), // Limit metadata suggestions
          ...(locationData.features || []).slice(0, 4) // Limit location suggestions
        ]

        setSuggestions(allSuggestions)
      } catch (error) {
        console.error("Suggestions fetch error:", error)
        setSuggestions([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchSuggestions()
  }, [debouncedSearchTerm])

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (searchTerm.trim()) {
      // Default to metadata search
      handleMetadataSearch(searchTerm.trim())
    }
  }

  const handleMetadataSearch = (query: string) => {
    const searchFilters: MetadataSearchFilters = { query }
    const url = generateSearchUrl(searchFilters, "/metadata/search")
    router.push(url)
    inputRef.current?.blur()
    setSuggestions([])
  }

  const handleLocationSearch = (query: string) => {
    router.push(`/map?search=${encodeURIComponent(query)}`)
    inputRef.current?.blur()
    setSuggestions([])
  }

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    if ("type" in suggestion && suggestion.type === "metadata") {
      // Handle metadata suggestion
      setSearchTerm(suggestion.title)
      handleMetadataSearch(suggestion.title)
    } else {
      // Handle location suggestion
      const locationSuggestion = suggestion as Suggestion
      setSearchTerm(locationSuggestion.place_name)
      setSuggestions([])

      const [lng, lat] = locationSuggestion.center
      const params = new URLSearchParams({
        search: locationSuggestion.place_name,
        location: locationSuggestion.place_name,
        center: `${lng},${lat}`,
        zoom: "13"
      })

      router.push(`/map?${params.toString()}`)
      inputRef.current?.blur()
    }
  }

  const clearSearch = () => {
    setSearchTerm("")
    setSuggestions([])
    inputRef.current?.focus()
  }

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        inputRef.current?.focus()
      }
      if (e.key === "Escape" && isFocused) {
        inputRef.current?.blur()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isFocused])

  // Handle clicks outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setSuggestions([])
        setIsFocused(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const renderSuggestion = (suggestion: SearchSuggestion, index: number) => {
    const isMetadata = "type" in suggestion && suggestion.type === "metadata"
    const icon = isMetadata ? FileText : MapPin
    const title = isMetadata
      ? (suggestion as MetadataSuggestion).title
      : (suggestion as Suggestion).place_name

    return (
      <button
        key={suggestion.id}
        onClick={() => handleSuggestionClick(suggestion)}
        className={cn(
          "flex w-full items-center space-x-3 rounded-md p-2 text-left text-sm transition-colors",
          "hover:bg-muted/80 focus:bg-muted/80 focus:outline-none"
        )}
      >
        {React.createElement(icon, {
          className: cn(
            "h-4 w-4 flex-shrink-0",
            isMetadata ? "text-blue-500" : "text-green-500"
          )
        })}
        <div className="flex-1 min-w-0">
          <span className="truncate block">{title}</span>
          <span className="text-xs text-muted-foreground">
            {isMetadata ? "Metadata" : "Location"}
          </span>
        </div>
      </button>
    )
  }

  return (
    <div className="relative w-full md:w-64 lg:w-80 group" ref={containerRef}>
      <MovingBorderWrapper
        className="rounded-full"
        variant="box"
        dotSize={8}
        duration={6000}
      >
        <form onSubmit={handleSearch} className="relative flex items-center">
          <div
            className={cn(
              "relative flex items-center transition-all duration-300 ease-out w-full",
              "rounded-full border bg-background/50 backdrop-blur-sm",
              "hover:bg-background/80 hover:shadow-md hover:shadow-primary/5",
              isFocused
                ? "bg-background border-primary/40 shadow-lg shadow-primary/10 ring-2 ring-primary/20"
                : "border-border/60"
            )}
          >
            <Search
              className={cn(
                "absolute left-3 h-4 w-4 transition-all duration-200",
                isFocused || searchTerm
                  ? "text-primary"
                  : "text-muted-foreground group-hover:text-foreground"
              )}
            />

            <Input
              ref={inputRef}
              type="text"
              placeholder="Search metadata, locations..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => {
                setTimeout(() => {
                  if (
                    document.activeElement?.closest(
                      ".suggestions-container"
                    ) === null
                  ) {
                    setIsFocused(false)
                  }
                }, 150)
              }}
              className={cn(
                "border-0 bg-transparent pl-10 pr-16 text-sm placeholder:text-muted-foreground/70",
                "focus-visible:ring-0 focus-visible:ring-offset-0",
                "transition-all duration-200"
              )}
              autoComplete="off"
            />

            <div className="absolute right-2 flex items-center space-x-1">
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : (
                searchTerm && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={clearSearch}
                    className={cn(
                      "h-6 w-6 p-0 rounded-full transition-all duration-200",
                      "hover:bg-muted/80 hover:scale-110"
                    )}
                  >
                    <X className="h-3 w-3" />
                    <span className="sr-only">Clear search</span>
                  </Button>
                )
              )}

              <div
                className={cn(
                  "hidden items-center space-x-1 rounded border bg-muted/50 px-2 py-1 text-xs text-muted-foreground transition-opacity duration-200 sm:flex",
                  (isFocused || searchTerm) && "opacity-0"
                )}
              >
                <kbd className="font-mono">⌘</kbd>
                <span>K</span>
              </div>
            </div>
          </div>
        </form>
      </MovingBorderWrapper>

      {/* Suggestions dropdown */}
      {isFocused && suggestions.length > 0 && (
        <div
          className={cn(
            "suggestions-container absolute top-full left-0 z-50 mt-2 w-full",
            "rounded-md border bg-popover p-1 shadow-lg",
            "animate-in fade-in-0 zoom-in-95"
          )}
        >
          <div className="space-y-1">
            {suggestions.map((suggestion, index) =>
              renderSuggestion(suggestion, index)
            )}
          </div>

          {/* Quick action buttons */}
          {searchTerm.trim() && (
            <>
              <div className="mx-2 my-2 border-t" />
              <div className="grid grid-cols-2 gap-1 p-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleMetadataSearch(searchTerm.trim())}
                  className="justify-start h-8 text-xs"
                >
                  <FileText className="h-3 w-3 mr-2" />
                  Search Metadata
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleLocationSearch(searchTerm.trim())}
                  className="justify-start h-8 text-xs"
                >
                  <Map className="h-3 w-3 mr-2" />
                  Search Map
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
