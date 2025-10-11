"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, X, Loader2, MapPin } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useRef, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
import { useDebounce } from "@/lib/hooks/use-debounce"
import { MovingBorderWrapper } from "@/components/ui/moving-border"

interface Suggestion {
  id: string
  place_name: string
  center: [number, number]
}

export default function GlobalSearchBar() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isFocused, setIsFocused] = useState(false)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
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
        const response = await fetch(
          `/api/map/geocode?q=${encodeURIComponent(debouncedSearchTerm)}`
        )
        if (!response.ok) {
          throw new Error("Failed to fetch suggestions")
        }
        const data = await response.json()
        setSuggestions(data.features || [])
      } catch (error) {
        console.error("Geocoding error:", error)
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
      router.push(`/map?search=${encodeURIComponent(searchTerm.trim())}`)
      inputRef.current?.blur()
      setSuggestions([])
    }
  }

  const handleSuggestionClick = (suggestion: Suggestion) => {
    setSearchTerm(suggestion.place_name)
    setSuggestions([])

    const [lng, lat] = suggestion.center // GeoJSON center is [lng, lat]
    const params = new URLSearchParams({
      search: suggestion.place_name,
      location: suggestion.place_name,
      center: `${lng},${lat}`,
      zoom: "13"
    })

    router.push(`/map?${params.toString()}`)
    inputRef.current?.blur()
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
              placeholder="Search locations, metadata..."
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
                <kbd className="font-mono">K</kbd>
              </div>
            </div>
          </div>
          <button type="submit" className="sr-only">
            Search
          </button>
        </form>
      </MovingBorderWrapper>

      {isFocused && (debouncedSearchTerm.length > 1 || isLoading) && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 suggestions-container">
          <div className="rounded-lg border bg-background/95 backdrop-blur-sm shadow-xl overflow-hidden">
            {isLoading && suggestions.length === 0 && (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}
            {!isLoading &&
              suggestions.length === 0 &&
              debouncedSearchTerm.length > 1 && (
                <div className="p-4 text-sm text-center text-muted-foreground">
                  No results for "{debouncedSearchTerm}"
                </div>
              )}
            {suggestions.length > 0 && (
              <ul>
                {suggestions.map(suggestion => (
                  <li
                    key={suggestion.id}
                    className="flex items-center px-4 py-2 text-sm cursor-pointer hover:bg-muted/50"
                    onMouseDown={e => {
                      e.preventDefault()
                      handleSuggestionClick(suggestion)
                    }}
                  >
                    <MapPin className="mr-3 h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="truncate">{suggestion.place_name}</span>
                  </li>
                ))}
              </ul>
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
          "absolute inset-0 rounded-full transition-all duration-300 pointer-events-none",
          "bg-gradient-to-r from-primary/10 via-transparent to-primary/10",
          isFocused ? "opacity-100 scale-105 blur-sm" : "opacity-0 scale-100"
        )}
      />
    </div>
  )
}
