"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, X, Loader2, MapPin, FileText, Zap } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useRef, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
import { useDebounce } from "@/lib/hooks/use-debounce"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"

interface LocationSuggestion {
  id: string
  place_name: string
  center: [number, number]
}

interface MetadataSuggestion {
  id: string
  title: string
  description?: string
}

export interface SearchPageSearchBarProps {
  initialQuery?: string
  initialType?: string
  size?: "sm" | "md" | "lg"
  showTypeSelector?: boolean
  className?: string
}

export default function SearchPageSearchBar({
  initialQuery = "",
  initialType = "auto",
  size = "md",
  showTypeSelector = true,
  className
}: SearchPageSearchBarProps) {
  const [searchTerm, setSearchTerm] = useState(initialQuery)
  const [searchType, setSearchType] = useState(initialType)
  const [isFocused, setIsFocused] = useState(false)
  const [locationSuggestions, setLocationSuggestions] = useState<
    LocationSuggestion[]
  >([])
  const [metadataSuggestions, setMetadataSuggestions] = useState<
    MetadataSuggestion[]
  >([])
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  // Update search term when URL changes
  useEffect(() => {
    const urlQuery = searchParams.get("q")
    const urlType = searchParams.get("type")
    if (urlQuery && urlQuery !== searchTerm) {
      setSearchTerm(urlQuery)
    }
    if (urlType && urlType !== searchType) {
      setSearchType(urlType)
    }
  }, [searchParams])

  const fetchSuggestions = useCallback(async () => {
    if (debouncedSearchTerm.length < 2) {
      setLocationSuggestions([])
      setMetadataSuggestions([])
      return
    }

    setIsLoading(true)
    try {
      const promises = []

      // Fetch location suggestions if type is location or auto
      if (searchType === "location" || searchType === "auto") {
        promises.push(
          fetch(`/api/map/geocode?q=${encodeURIComponent(debouncedSearchTerm)}`)
            .then(res => res.json())
            .then(data => ({ type: "location", data: data.features || [] }))
            .catch(() => ({ type: "location", data: [] }))
        )
      }

      // Fetch metadata suggestions if type is metadata or auto
      if (searchType === "metadata" || searchType === "auto") {
        promises.push(
          fetch(
            `/api/search/metadata-suggestions?q=${encodeURIComponent(debouncedSearchTerm)}`
          )
            .then(res => res.json())
            .then(data => ({ type: "metadata", data: data.suggestions || [] }))
            .catch(() => ({ type: "metadata", data: [] }))
        )
      }

      const results = await Promise.all(promises)

      results.forEach(result => {
        if (result.type === "location") {
          setLocationSuggestions(result.data.slice(0, 5))
        } else if (result.type === "metadata") {
          setMetadataSuggestions(result.data.slice(0, 5))
        }
      })
    } catch (error) {
      console.error("Suggestions error:", error)
      setLocationSuggestions([])
      setMetadataSuggestions([])
    } finally {
      setIsLoading(false)
    }
  }, [debouncedSearchTerm, searchType])

  useEffect(() => {
    fetchSuggestions()
  }, [fetchSuggestions])

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (searchTerm.trim()) {
      const params = new URLSearchParams()
      params.set("q", searchTerm.trim())
      if (searchType !== "auto") {
        params.set("type", searchType)
      }
      router.push(`/search?${params.toString()}`)
      inputRef.current?.blur()
      setLocationSuggestions([])
      setMetadataSuggestions([])
    }
  }

  const handleLocationSuggestionClick = (suggestion: LocationSuggestion) => {
    setSearchTerm(suggestion.place_name)
    setLocationSuggestions([])
    setMetadataSuggestions([])

    const params = new URLSearchParams()
    params.set("q", suggestion.place_name)
    params.set("type", "location")

    router.push(`/search?${params.toString()}`)
    inputRef.current?.blur()
  }

  const handleMetadataSuggestionClick = (suggestion: MetadataSuggestion) => {
    setSearchTerm(suggestion.title)
    setLocationSuggestions([])
    setMetadataSuggestions([])

    const params = new URLSearchParams()
    params.set("q", suggestion.title)
    params.set("type", "metadata")

    router.push(`/search?${params.toString()}`)
    inputRef.current?.blur()
  }

  const clearSearch = () => {
    setSearchTerm("")
    setLocationSuggestions([])
    setMetadataSuggestions([])
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
        setLocationSuggestions([])
        setMetadataSuggestions([])
        setIsFocused(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Size classes
  const sizeClasses = {
    sm: {
      container: "w-full max-w-md",
      input: "h-9 text-sm",
      select: "h-9"
    },
    md: {
      container: "w-full max-w-2xl",
      input: "h-11",
      select: "h-11"
    },
    lg: {
      container: "w-full max-w-4xl",
      input: "h-14 text-lg",
      select: "h-14"
    }
  }

  const currentSize = sizeClasses[size]
  const hasSuggestions =
    locationSuggestions.length > 0 || metadataSuggestions.length > 0

  const getSearchTypePlaceholder = () => {
    switch (searchType) {
      case "location":
        return "Search locations in Nigeria..."
      case "metadata":
        return "Search datasets and metadata..."
      default:
        return "Search locations, datasets, and more..."
    }
  }

  return (
    <div
      className={cn("relative group", currentSize.container, className)}
      ref={containerRef}
    >
      <form
        onSubmit={handleSearch}
        className="relative flex items-center gap-2"
      >
        <div
          className={cn(
            "relative flex items-center transition-all duration-300 ease-out flex-1",
            size === "lg" ? "rounded-2xl" : "rounded-full",
            "border bg-background/50 backdrop-blur-sm",
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
            placeholder={getSearchTypePlaceholder()}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
              setTimeout(() => {
                if (
                  document.activeElement?.closest(".suggestions-container") ===
                  null
                ) {
                  setIsFocused(false)
                }
              }, 150)
            }}
            className={cn(
              "border-0 bg-transparent pl-10 pr-16 placeholder:text-muted-foreground/70",
              "focus-visible:ring-0 focus-visible:ring-offset-0",
              "transition-all duration-200",
              currentSize.input
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

            {size !== "sm" && (
              <div
                className={cn(
                  "hidden items-center space-x-1 rounded border bg-muted/50 px-2 py-1 text-xs text-muted-foreground transition-opacity duration-200 sm:flex",
                  (isFocused || searchTerm) && "opacity-0"
                )}
              >
                <kbd className="font-mono">⌘</kbd>
                <kbd className="font-mono">K</kbd>
              </div>
            )}
          </div>
        </div>

        {/* Search Type Selector */}
        {showTypeSelector && (
          <Select value={searchType} onValueChange={setSearchType}>
            <SelectTrigger className={cn("w-[140px]", currentSize.select)}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  <span>All</span>
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
            </SelectContent>
          </Select>
        )}

        <button type="submit" className="sr-only">
          Search
        </button>
      </form>

      {/* Suggestions Panel */}
      {isFocused && (debouncedSearchTerm.length > 1 || isLoading) && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 suggestions-container">
          <div className="rounded-lg border bg-background/95 backdrop-blur-sm shadow-xl overflow-hidden">
            {isLoading && !hasSuggestions && (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}

            {!isLoading &&
              !hasSuggestions &&
              debouncedSearchTerm.length > 1 && (
                <div className="p-4 text-sm text-center text-muted-foreground">
                  No results for "{debouncedSearchTerm}"
                </div>
              )}

            {/* Location Suggestions */}
            {locationSuggestions.length > 0 && (
              <div>
                <div className="px-4 py-2 text-xs font-medium text-muted-foreground bg-muted/20 border-b">
                  Locations
                </div>
                <ul>
                  {locationSuggestions.map(suggestion => (
                    <li
                      key={suggestion.id}
                      className="flex items-center px-4 py-2 text-sm cursor-pointer hover:bg-muted/50"
                      onMouseDown={e => {
                        e.preventDefault()
                        handleLocationSuggestionClick(suggestion)
                      }}
                    >
                      <MapPin className="mr-3 h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="truncate">{suggestion.place_name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Metadata Suggestions */}
            {metadataSuggestions.length > 0 && (
              <div>
                <div className="px-4 py-2 text-xs font-medium text-muted-foreground bg-muted/20 border-b">
                  Datasets
                </div>
                <ul>
                  {metadataSuggestions.map(suggestion => (
                    <li
                      key={suggestion.id}
                      className="flex items-center px-4 py-2 text-sm cursor-pointer hover:bg-muted/50"
                      onMouseDown={e => {
                        e.preventDefault()
                        handleMetadataSuggestionClick(suggestion)
                      }}
                    >
                      <FileText className="mr-3 h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate">{suggestion.title}</div>
                        {suggestion.description && (
                          <div className="text-xs text-muted-foreground truncate">
                            {suggestion.description}
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="border-t border-border/50 px-4 py-2 text-xs text-muted-foreground bg-muted/20">
              Press Enter to search for "{searchTerm}"
            </div>
          </div>
        </div>
      )}

      {/* Animated search ring effect */}
      <div
        className={cn(
          "absolute inset-0 transition-all duration-300 pointer-events-none",
          size === "lg" ? "rounded-2xl" : "rounded-full",
          "bg-gradient-to-r from-primary/10 via-transparent to-primary/10",
          isFocused ? "opacity-100 scale-105 blur-sm" : "opacity-0 scale-100"
        )}
      />
    </div>
  )
}
