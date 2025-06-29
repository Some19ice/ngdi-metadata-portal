"use server"

import { Suspense } from "react"
import Link from "next/link"
import {
  FileText,
  MapPin,
  AlertCircle,
  ExternalLink,
  Search,
  Zap,
  TrendingUp,
  Clock
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import SearchPageSearchBarWrapper from "./_components/search-page-search-bar-wrapper"
import InlineMetadataResults from "./_components/inline-metadata-results"
import InlineLocationResults from "./_components/inline-location-results"
import { MetadataResultsSkeleton } from "./_components/metadata-results-skeleton"

import { searchMetadataRecordsAction } from "@/actions/db/metadata-records-actions"
import { geocodeLocationAction } from "@/actions/map-actions"
import { SEARCH_RESULTS_PAGE_SIZE } from "@/lib/constants"

interface SearchPageProps {
  searchParams: Promise<{
    q?: string
    type?: string
    page?: string
  }>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams
  const query = params.q || ""
  const type = params.type || "auto"
  const page = parseInt(params.page || "1", 10)

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {!query ? (
        <EmptySearchState />
      ) : (
        <div className="space-y-8">
          {/* Enhanced Search Form */}
          <div className="mb-8">
            <SearchPageSearchBarWrapper
              initialQuery={query}
              initialType={type}
              size="md"
              showTypeSelector={true}
            />
          </div>

          {/* Search Results */}
          <Suspense fallback={<SearchResultsSkeleton />}>
            <SearchResults query={query} type={type} page={page} />
          </Suspense>
        </div>
      )}
    </div>
  )
}

function EmptySearchState() {
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="text-center py-12">
        <div className="mb-8">
          <Search className="h-16 w-16 mx-auto mb-6 text-primary" />
          <h1 className="text-4xl font-bold mb-4">
            Search Nigeria's Geospatial Data
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover datasets, explore locations, and find the geospatial
            information you need for research, planning, and development.
          </p>
        </div>

        {/* Enhanced Search Form */}
        <div className="mb-12">
          <SearchPageSearchBarWrapper size="lg" showTypeSelector={true} />
        </div>

        {/* Search Suggestions */}
        <Suspense fallback={<SearchSuggestionsSkeleton />}>
          <PopularSearches />
        </Suspense>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="text-center hover:shadow-lg transition-shadow">
          <CardHeader>
            <FileText className="h-12 w-12 mx-auto mb-4 text-blue-500" />
            <CardTitle>Browse Datasets</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Explore our catalog of Nigerian geospatial datasets
            </p>
            <Button asChild className="w-full">
              <Link href="/metadata">Browse Catalog</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="text-center hover:shadow-lg transition-shadow">
          <CardHeader>
            <MapPin className="h-12 w-12 mx-auto mb-4 text-green-500" />
            <CardTitle>Explore Map</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Visualize data and explore Nigeria interactively
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/map">Open Map</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="text-center hover:shadow-lg transition-shadow">
          <CardHeader>
            <Search className="h-12 w-12 mx-auto mb-4 text-purple-500" />
            <CardTitle>Advanced Search</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Use filters and facets for precise searches
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/metadata/search">Advanced Search</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

async function SearchResults({
  query,
  type,
  page
}: {
  query: string
  type: string
  page: number
}) {
  try {
    // For auto search, perform parallel searches
    if (type === "auto") {
      const [metadataResult, locationResult] = await Promise.allSettled([
        searchMetadataRecordsAction({
          query,
          page,
          pageSize: 20
        }),
        geocodeLocationAction({
          searchText: query,
          limit: 10,
          autocomplete: false,
          country: "NG"
        })
      ])

      const metadataData =
        metadataResult.status === "fulfilled" && metadataResult.value.isSuccess
          ? metadataResult.value.data
          : null

      const locationData =
        locationResult.status === "fulfilled" && locationResult.value.isSuccess
          ? locationResult.value.data
          : null

      // Determine which tab to show by default
      const hasMetadata = metadataData && metadataData.records.length > 0
      const hasLocations = locationData && locationData.length > 0
      const defaultTab = hasMetadata
        ? "all"
        : hasLocations
          ? "locations"
          : "all"

      return (
        <div className="space-y-6">
          {/* Search Summary */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">
                  Search results for "{query}"
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    <Zap className="h-3 w-3 mr-1" />
                    Smart Search
                  </Badge>
                  {hasMetadata && (
                    <Badge variant="outline">
                      {metadataData.totalRecords} datasets
                    </Badge>
                  )}
                  {hasLocations && (
                    <Badge variant="outline">
                      {locationData.length} locations
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results Tabs */}
          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList>
              <TabsTrigger value="all">
                <Search className="h-4 w-4 mr-2" />
                All Results
              </TabsTrigger>
              <TabsTrigger value="metadata">
                <FileText className="h-4 w-4 mr-2" />
                Datasets
                {hasMetadata && (
                  <Badge variant="outline" className="ml-2">
                    {metadataData.totalRecords}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="locations">
                <MapPin className="h-4 w-4 mr-2" />
                Locations
                {hasLocations && (
                  <Badge variant="outline" className="ml-2">
                    {locationData.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-6">
              <div className="grid gap-8">
                {/* Metadata Results */}
                {hasMetadata && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <FileText className="h-5 w-5 text-blue-500" />
                      <h2 className="text-lg font-semibold">Datasets</h2>
                      <Badge variant="outline">
                        {metadataData.totalRecords}
                      </Badge>
                    </div>
                    <InlineMetadataResults
                      query={query}
                      page={1}
                      searchParams={{}}
                      maxResults={SEARCH_RESULTS_PAGE_SIZE}
                    />
                    {metadataData.totalRecords > 20 && (
                      <div className="mt-4 text-center">
                        <Button asChild variant="outline">
                          <Link
                            href={`/metadata/search?q=${encodeURIComponent(query)}`}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            View All Datasets
                            <ExternalLink className="h-4 w-4 ml-2" />
                          </Link>
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* Location Results */}
                {hasLocations && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <MapPin className="h-5 w-5 text-green-500" />
                      <h2 className="text-lg font-semibold">Locations</h2>
                      <Badge variant="outline">{locationData.length}</Badge>
                    </div>
                    <InlineLocationResults
                      query={query}
                      maxResults={SEARCH_RESULTS_PAGE_SIZE}
                      page={page}
                      pageSize={SEARCH_RESULTS_PAGE_SIZE}
                    />
                    {locationData.length >= 10 && (
                      <div className="mt-4 text-center">
                        <Button asChild variant="outline">
                          <Link
                            href={`/map?search=${encodeURIComponent(query)}`}
                          >
                            <MapPin className="h-4 w-4 mr-2" />
                            Explore on Map
                            <ExternalLink className="h-4 w-4 ml-2" />
                          </Link>
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* No Results */}
                {!hasMetadata && !hasLocations && <NoResults query={query} />}
              </div>
            </TabsContent>

            <TabsContent value="metadata" className="mt-6">
              {hasMetadata ? (
                <InlineMetadataResults
                  query={query}
                  page={1}
                  searchParams={{}}
                  maxResults={20}
                />
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">
                    No datasets found
                  </h3>
                  <p className="text-muted-foreground">
                    Try adjusting your search terms or browse our catalog.
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="locations" className="mt-6">
              {hasLocations ? (
                <InlineLocationResults query={query} maxResults={20} />
              ) : (
                <div className="text-center py-12">
                  <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">
                    No locations found
                  </h3>
                  <p className="text-muted-foreground">
                    Try searching for cities, states, or landmarks in Nigeria.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      )
    }

    // Handle specific search types
    if (type === "metadata") {
      const result = await searchMetadataRecordsAction({
        query,
        page,
        pageSize: 20
      })

      if (!result.isSuccess || !result.data) {
        return (
          <ErrorState message={result.message || "Failed to search datasets"} />
        )
      }

      return (
        <div className="space-y-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">
                  Found {result.data.totalRecords.toLocaleString()} datasets
                </div>
                <Badge variant="secondary">
                  <FileText className="h-3 w-3 mr-1" />
                  Datasets Only
                </Badge>
              </div>
            </CardContent>
          </Card>
          <InlineMetadataResults
            query={query}
            page={page}
            searchParams={{}}
            maxResults={20}
          />
        </div>
      )
    }

    if (type === "location") {
      const result = await geocodeLocationAction({
        searchText: query,
        limit: 20,
        autocomplete: false,
        country: "NG"
      })

      if (!result.isSuccess || !result.data) {
        return (
          <ErrorState
            message={result.message || "Failed to search locations"}
          />
        )
      }

      return (
        <div className="space-y-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">
                  Found {result.data.length} locations
                </div>
                <Badge variant="secondary">
                  <MapPin className="h-3 w-3 mr-1" />
                  Locations Only
                </Badge>
              </div>
            </CardContent>
          </Card>
          <InlineLocationResults query={query} maxResults={20} />
        </div>
      )
    }

    return <NoResults query={query} />
  } catch (error) {
    console.error("Search error:", error)
    return <ErrorState message="An error occurred while searching" />
  }
}

function PopularSearches() {
  const popularQueries = [
    { query: "Lagos", type: "location", icon: MapPin },
    { query: "Land use", type: "metadata", icon: FileText },
    { query: "Population data", type: "metadata", icon: FileText },
    { query: "Abuja", type: "location", icon: MapPin },
    { query: "Transportation", type: "metadata", icon: FileText },
    { query: "Rivers State", type: "location", icon: MapPin }
  ]

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <TrendingUp className="h-5 w-5" />
        Popular Searches
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {popularQueries.map((item, index) => {
          const Icon = item.icon
          return (
            <Button
              key={index}
              asChild
              variant="outline"
              className="justify-start h-auto p-3"
            >
              <Link
                href={`/search?q=${encodeURIComponent(item.query)}&type=${item.type}`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {item.query}
              </Link>
            </Button>
          )
        })}
      </div>
    </div>
  )
}

// Loading skeletons and error states
function SearchResultsSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="h-4 w-32 bg-muted rounded animate-pulse" />
            <div className="h-6 w-24 bg-muted rounded animate-pulse" />
          </div>
        </CardContent>
      </Card>
      <MetadataResultsSkeleton />
    </div>
  )
}

function SearchSuggestionsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-12 bg-muted rounded animate-pulse" />
      ))}
    </div>
  )
}

function NoResults({ query }: { query: string }) {
  return (
    <div className="text-center py-16">
      <AlertCircle className="h-16 w-16 mx-auto mb-6 text-muted-foreground" />
      <h2 className="text-2xl font-semibold mb-4">No results found</h2>
      <p className="text-muted-foreground mb-8 max-w-md mx-auto">
        We couldn't find any results for "{query}". Try adjusting your search
        terms or explore our popular datasets.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button asChild variant="outline">
          <Link href="/metadata">
            <FileText className="h-4 w-4 mr-2" />
            Browse Datasets
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/map">
            <MapPin className="h-4 w-4 mr-2" />
            Explore Map
          </Link>
        </Button>
      </div>
    </div>
  )
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="text-center py-16">
      <AlertCircle className="h-16 w-16 mx-auto mb-6 text-destructive" />
      <h2 className="text-2xl font-semibold mb-4">Search Error</h2>
      <p className="text-muted-foreground mb-8">{message}</p>
      <Button asChild variant="outline">
        <Link href="/search">
          <Search className="h-4 w-4 mr-2" />
          Try Again
        </Link>
      </Button>
    </div>
  )
}
