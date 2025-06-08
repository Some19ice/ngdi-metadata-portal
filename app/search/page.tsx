"use server"

import { Suspense } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { notFound, redirect } from "next/navigation"
import CentralSearchForm from "./_components/central-search-form"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  MapPin,
  FileText,
  AlertCircle,
  ExternalLink,
  Search
} from "lucide-react"
import { geocodeLocationAction } from "@/actions/map-actions"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

interface SearchParams {
  q?: string
  type?: string
  page?: string
  error?: string
  // Include all possible metadata search params for consistency
  organization?: string
  dataType?: string
  topicCategory?: string
  startDate?: string
  endDate?: string
  bbox?: string
}

interface SearchPageProps {
  searchParams: Promise<SearchParams>
}

export default async function SearchPage({
  searchParams: searchParamsPromise
}: SearchPageProps) {
  const searchParams = await searchParamsPromise

  const query = searchParams?.q
  const searchType = searchParams?.type || "auto"
  const error = searchParams?.error
  const currentPage = parseInt(searchParams?.page || "1", 10)

  // If no query, show the search form
  if (!query) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-4">Search Portal</h1>
            <p className="text-muted-foreground">
              Search for geospatial data, metadata records, and geographic
              locations
            </p>
          </div>

          <div className="mb-8">
            <CentralSearchForm />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Metadata Search
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Find datasets, surveys, maps, and other geospatial resources
                </p>
                <div className="space-y-2">
                  <Badge variant="secondary">Datasets</Badge>
                  <Badge variant="secondary">Maps</Badge>
                  <Badge variant="secondary">Surveys</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Location Search
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Search for places, coordinates, and geographic features
                </p>
                <div className="space-y-2">
                  <Badge variant="secondary">Cities & Towns</Badge>
                  <Badge variant="secondary">States & LGAs</Badge>
                  <Badge variant="secondary">Coordinates</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-6xl mx-auto">
        {/* Search Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <h1 className="text-2xl font-bold">Search Results</h1>
            <Badge variant="outline" className="capitalize">
              {searchType === "auto" ? "Smart Search" : searchType}
            </Badge>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Search className="h-4 w-4" />
            <span>
              Results for: <strong>"{query}"</strong>
            </span>
          </div>

          {/* Re-search form */}
          <div className="mt-4">
            <CentralSearchForm initialQuery={query} initialType={searchType} />
          </div>
        </div>

        {/* Error handling */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error === "no-results"
                ? "No results found for your search. Try different keywords or search terms."
                : "An error occurred while searching. Please try again."}
            </AlertDescription>
          </Alert>
        )}

        {/* Search Results */}
        <Suspense fallback={<SearchResultsSkeleton />}>
          <SearchResults
            query={query}
            searchType={searchType}
            page={currentPage}
            searchParams={searchParams}
          />
        </Suspense>
      </div>
    </div>
  )
}

async function SearchResults({
  query,
  searchType,
  page,
  searchParams
}: {
  query: string
  searchType: string
  page: number
  searchParams: SearchParams
}) {
  // Handle location search
  if (searchType === "location") {
    return <LocationSearchResults query={query} />
  }

  // Handle metadata search - redirect to existing metadata search
  if (searchType === "metadata") {
    const metadataSearchParams = new URLSearchParams()
    metadataSearchParams.set("q", query)
    if (page > 1) metadataSearchParams.set("page", page.toString())

    Object.entries(searchParams).forEach(([key, value]) => {
      if (value && key !== "type" && key !== "q" && key !== "page") {
        metadataSearchParams.set(key, value)
      }
    })

    redirect(`/(app)/metadata/search?${metadataSearchParams.toString()}`)
  }

  // Auto search - try both types
  if (searchType === "auto") {
    return (
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All Results</TabsTrigger>
          <TabsTrigger value="metadata">Datasets</TabsTrigger>
          <TabsTrigger value="locations">Places</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          <LocationSearchResults query={query} />
          <MetadataSearchCard
            query={query}
            page={page}
            searchParams={searchParams}
          />
        </TabsContent>

        <TabsContent value="metadata">
          <MetadataSearchCard
            query={query}
            page={page}
            searchParams={searchParams}
          />
        </TabsContent>

        <TabsContent value="locations">
          <LocationSearchResults query={query} />
        </TabsContent>
      </Tabs>
    )
  }

  // Default fallback - redirect to metadata search
  const metadataSearchParams = new URLSearchParams()
  metadataSearchParams.set("q", query)
  if (page > 1) metadataSearchParams.set("page", page.toString())

  Object.entries(searchParams).forEach(([key, value]) => {
    if (value && key !== "type" && key !== "q" && key !== "page") {
      metadataSearchParams.set(key, value)
    }
  })

  redirect(`/(app)/metadata/search?${metadataSearchParams.toString()}`)
}

async function LocationSearchResults({ query }: { query: string }) {
  try {
    const result = await geocodeLocationAction({
      searchText: query,
      autocomplete: false,
      limit: 10,
      country: "NG"
    })

    if (!result.isSuccess || !result.data || result.data.length === 0) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Location Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              No locations found for "{query}"
            </p>
          </CardContent>
        </Card>
      )
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Location Results ({result.data.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {result.data.map((location, index) => (
            <div
              key={index}
              className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-medium mb-1">{location.place_name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {location.properties?.category ||
                      location.place_type?.[0] ||
                      "Location"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Coordinates: {location.center[1].toFixed(4)},{" "}
                    {location.center[0].toFixed(4)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link
                      href={`/map?location=${encodeURIComponent(location.place_name)}&center=${location.center[0]},${location.center[1]}&zoom=12`}
                    >
                      <MapPin className="h-4 w-4 mr-1" />
                      View on Map
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    )
  } catch (error) {
    console.error("Error in location search:", error)
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Location Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to search locations. Please try again.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }
}

function MetadataSearchCard({
  query,
  page,
  searchParams
}: {
  query: string
  page: number
  searchParams: SearchParams
}) {
  const metadataSearchParams = new URLSearchParams()
  metadataSearchParams.set("q", query)
  if (page > 1) metadataSearchParams.set("page", page.toString())

  Object.entries(searchParams).forEach(([key, value]) => {
    if (value && key !== "type" && key !== "q" && key !== "page") {
      metadataSearchParams.set(key, value)
    }
  })

  const metadataSearchUrl = `/(app)/metadata/search?${metadataSearchParams.toString()}`

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Dataset Results
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">
            Search geospatial datasets, maps, and data services for "{query}"
          </p>
          <Button asChild>
            <Link href={metadataSearchUrl}>
              <FileText className="h-4 w-4 mr-2" />
              View Dataset Search Results
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function SearchResultsSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <div className="h-6 bg-muted rounded animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded animate-pulse" />
              <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
