"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Search, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { GeocodingFeature } from "@/types"
import { sanitizeSearchInput } from "@/lib/validators/map-validators"
import { toast } from "sonner"
import { useDebounce } from "@/lib/hooks/use-debounce"
import { useRouter, usePathname } from "next/navigation"

interface MapSearchInputProps {
  onSearch: (searchTerm: string) => void
  onLocationSelect: (location: GeocodingFeature) => void
  className?: string
}

export default function MapSearchInput({
  onSearch,
  onLocationSelect,
  className
}: MapSearchInputProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [suggestions, setSuggestions] = useState<GeocodingFeature[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  // Debounce search term
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  // Handle clicks outside of the component to close suggestions
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Real geocoding function using the action
  const searchLocations = useCallback(
    async (query: string): Promise<GeocodingFeature[]> => {
      // Cancel previous request if exists
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController()

      try {
        console.log("Map search: searching for", query)

        const params = new URLSearchParams({
          q: query,
          autocomplete: "true",
          limit: "5",
          country: "NG"
        })

        const res = await fetch(`/api/map/geocode?${params.toString()}`, {
          method: "GET",
          signal: abortControllerRef.current.signal,
          cache: "no-store"
        })

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}))
          console.error(
            "Map geocoding error:",
            errorData?.error || res.statusText
          )
          if (!abortControllerRef.current.signal.aborted) {
            toast.error(
              errorData?.warning || "Search failed. Please try again."
            )
          }
          return errorData.features || []
        }

        const data = await res.json()
        console.log("Map search result features:", data.features?.length || 0)
        return data.features as GeocodingFeature[]
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          // Request was cancelled, ignore
          return []
        }
        console.error("Map search error:", error)
        if (!abortControllerRef.current.signal.aborted) {
          toast.error(
            "Search failed. Please check your connection and try again."
          )
        }
        throw error
      }
    },
    []
  )

  // Perform search when debounced term changes
  useEffect(() => {
    if (debouncedSearchTerm.length > 2) {
      setIsLoading(true)
      searchLocations(debouncedSearchTerm)
        .then(results => {
          setSuggestions(results)
          setShowSuggestions(true)
        })
        .catch(error => {
          console.error("Error fetching suggestions:", error)
          setSuggestions([])
        })
        .finally(() => {
          setIsLoading(false)
        })
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }, [debouncedSearchTerm, searchLocations])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const sanitized = sanitizeSearchInput(value)

    if (value !== sanitized) {
      toast.warning("Some characters were removed from your search")
    }

    setSearchTerm(sanitized)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = searchTerm.trim()

    if (trimmed.length < 2) {
      toast.error("Please enter at least 2 characters to search")
      return
    }

    if (trimmed) {
      // For manual search, try to get the first result from geocoding
      setIsLoading(true)
      try {
        const results = await searchLocations(trimmed)
        if (results.length > 0) {
          onLocationSelect(results[0])
          toast.success(
            `Found ${results.length} location${results.length > 1 ? "s" : ""}`
          )
        } else {
          onSearch(trimmed)
          toast.info("No exact matches found")
        }
      } catch (error) {
        console.error("Error performing search:", error)
        onSearch(trimmed)
      } finally {
        setIsLoading(false)
      }
      setShowSuggestions(false)
    }
  }

  const handleSuggestionClick = (suggestion: GeocodingFeature) => {
    setSearchTerm(suggestion.place_name)
    setShowSuggestions(false)
    toast.success(`Selected: ${suggestion.place_name}`)

    // Update the URL so the map page can react
    const [lng, lat] = suggestion.center
    const params = new URLSearchParams({
      search: suggestion.place_name,
      location: suggestion.place_name,
      center: `${lng},${lat}`,
      zoom: "13"
    })

    if (pathname !== "/map") {
      router.push(`/map?${params.toString()}`)
    } else {
      // Update the URL without triggering a full route reload
      window.history.replaceState(null, "", `/map?${params.toString()}`)
    }

    // Still call the callback for in-map state update
    onLocationSelect(suggestion)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setShowSuggestions(false)
    }
  }

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <form onSubmit={handleSubmit} className="flex w-full">
        <div className="relative flex-grow">
          <Input
            type="text"
            placeholder="Search locations in Nigeria..."
            value={searchTerm}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            className="pr-10"
            aria-label="Search locations"
            aria-autocomplete="list"
            aria-controls="search-suggestions"
            aria-expanded={showSuggestions}
            maxLength={200}
          />
          {isLoading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            </div>
          )}
        </div>
        <Button
          type="submit"
          className="ml-2"
          disabled={isLoading || searchTerm.trim().length < 2}
          aria-label="Search"
        >
          <Search className="h-4 w-4" />
        </Button>
      </form>

      {showSuggestions && suggestions.length > 0 && (
        <div
          id="search-suggestions"
          className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg border"
          role="listbox"
        >
          <ul className="max-h-60 overflow-auto py-1 text-sm">
            {suggestions.map((suggestion, index) => (
              <li
                key={suggestion.id}
                className="cursor-pointer px-4 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                onClick={() => handleSuggestionClick(suggestion)}
                onKeyDown={e => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    handleSuggestionClick(suggestion)
                  }
                }}
                role="option"
                aria-selected={false}
                tabIndex={0}
              >
                <div className="font-medium">{suggestion.place_name}</div>
                <div className="text-xs text-gray-500">
                  {suggestion.center[1].toFixed(4)},{" "}
                  {suggestion.center[0].toFixed(4)}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {showSuggestions &&
        suggestions.length === 0 &&
        !isLoading &&
        debouncedSearchTerm.length > 2 && (
          <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg border">
            <div className="px-4 py-2 text-sm text-gray-500">
              No locations found for "{debouncedSearchTerm}"
            </div>
          </div>
        )}
    </div>
  )
}
