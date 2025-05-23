"use client"

import { useState, useEffect, useRef } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { GeocodingFeature } from "@/types"
import { geocodeLocationAction } from "@/actions/map-actions"

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
  const searchLocations = async (
    query: string
  ): Promise<GeocodingFeature[]> => {
    const result = await geocodeLocationAction({
      searchText: query,
      autocomplete: true,
      limit: 5,
      country: "NG" // Bias towards Nigeria
    })

    if (result.isSuccess) {
      return result.data
    } else {
      console.error("Geocoding error:", result.message)
      return []
    }
  }

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchTerm(value)

    if (value.length > 2) {
      setIsLoading(true)
      try {
        const results = await searchLocations(value)
        setSuggestions(results)
        setShowSuggestions(true)
      } catch (error) {
        console.error("Error fetching suggestions:", error)
        setSuggestions([])
      } finally {
        setIsLoading(false)
      }
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (searchTerm.trim()) {
      // For manual search, try to get the first result from geocoding
      setIsLoading(true)
      try {
        const results = await searchLocations(searchTerm)
        if (results.length > 0) {
          onLocationSelect(results[0])
        } else {
          onSearch(searchTerm)
        }
      } catch (error) {
        console.error("Error performing search:", error)
        onSearch(searchTerm)
      } finally {
        setIsLoading(false)
      }
      setShowSuggestions(false)
    }
  }

  const handleSuggestionClick = (suggestion: GeocodingFeature) => {
    setSearchTerm(suggestion.place_name)
    onLocationSelect(suggestion)
    setShowSuggestions(false)
  }

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <form onSubmit={handleSubmit} className="flex w-full">
        <div className="relative flex-grow">
          <Input
            type="text"
            placeholder="Search locations..."
            value={searchTerm}
            onChange={handleInputChange}
            className="pr-10"
          />
          {isLoading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
            </div>
          )}
        </div>
        <Button type="submit" className="ml-2" disabled={isLoading}>
          <Search className="h-4 w-4" />
        </Button>
      </form>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg border">
          <ul className="max-h-60 overflow-auto py-1 text-sm">
            {suggestions.map(suggestion => (
              <li
                key={suggestion.id}
                className="cursor-pointer px-4 py-2 hover:bg-gray-100"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                {suggestion.place_name}
              </li>
            ))}
          </ul>
        </div>
      )}

      {showSuggestions &&
        suggestions.length === 0 &&
        !isLoading &&
        searchTerm.length > 2 && (
          <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg border">
            <div className="px-4 py-2 text-sm text-gray-500">
              No locations found
            </div>
          </div>
        )}
    </div>
  )
}
