"use server"

import { Suspense } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import CentralSearchForm from "./_components/central-search-form"
import InlineMetadataResults from "./_components/inline-metadata-results"
import InlineLocationResults from "./_components/inline-location-results"
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { isValidSearchType, getSearchTypeName } from "@/lib/utils/search-utils"
import { Skeleton } from "@/components/ui/skeleton"
import { searchMetadataRecordsAction } from "@/actions/db/metadata-records-actions"

interface SearchPageProps {
  searchParams: Promise<{
    q?: string
    type?: string
  }>
}

// Search validation schema
function validateSearchParams(params: {
  q?: string
  type?: string
}):
  | { error: string; query?: never; type?: never }
  | { error?: never; query: string; type: string } {
  const query = params.q?.trim()
  const type = params.type?.trim()

  // Validate query
  if (!query || query.length === 0) {
    return { error: "Please enter a search term" }
  }

  if (query.length < 2) {
    return { error: "Search term must be at least 2 characters long" }
  }

  if (query.length > 100) {
    return { error: "Search term cannot exceed 100 characters" }
  }

  // Validate type - use type or default to auto
  const validatedType = type && isValidSearchType(type) ? type : "auto"

  return {
    query,
    type: validatedType
  }
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams
  const validation = validateSearchParams(params)

  // Show error if validation failed
  if (validation.error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold">Search NGDI Portal</h1>
            <p className="text-muted-foreground mt-2">
              Find locations, datasets, and geospatial information
            </p>
          </div>

          <CentralSearchForm
            initialQuery={params.q || ""}
            initialType={params.type || "auto"}
          />

          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Invalid Search</AlertTitle>
            <AlertDescription>{validation.error}</AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  const { query, type } = validation

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Search NGDI Portal</h1>
          <p className="text-muted-foreground mt-2">
            Find locations, datasets, and geospatial information
          </p>
        </div>

        <CentralSearchForm initialQuery={query} initialType={type} />

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              Search Results for "{query}"
            </h2>
            <div className="text-sm text-muted-foreground">
              Searching in: {getSearchTypeName(type)}
            </div>
          </div>

          <Suspense fallback={<SearchResultsSkeleton />}>
            <SearchResults query={query} type={type} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}

// Search Results Component
function SearchResults({ query, type }: { query: string; type: string }) {
  try {
    if (type === "auto") {
      // For auto search, show both location and metadata results in tabs
      return (
        <Tabs defaultValue="metadata" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="metadata" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Datasets
            </TabsTrigger>
            <TabsTrigger value="location" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Locations
            </TabsTrigger>
          </TabsList>

          <TabsContent value="metadata" className="space-y-4">
            <Suspense fallback={<MetadataResultsSkeleton />}>
              <InlineMetadataResults
                query={query}
                page={1}
                searchParams={{ q: query }}
                showTitle={false}
                maxResults={20}
              />
            </Suspense>
          </TabsContent>

          <TabsContent value="location" className="space-y-4">
            <Suspense fallback={<LocationResultsSkeleton />}>
              <InlineLocationResults
                query={query}
                showTitle={false}
                maxResults={5}
              />
            </Suspense>
          </TabsContent>
        </Tabs>
      )
    } else if (type === "metadata") {
      return (
        <Suspense fallback={<MetadataResultsSkeleton />}>
          <InlineMetadataResults
            query={query}
            page={1}
            searchParams={{ q: query }}
            showTitle={true}
            maxResults={20}
          />
        </Suspense>
      )
    } else if (type === "location") {
      return (
        <Suspense fallback={<LocationResultsSkeleton />}>
          <InlineLocationResults
            query={query}
            showTitle={true}
            maxResults={10}
          />
        </Suspense>
      )
    } else {
      // For news and docs, show placeholder
      return (
        <Card className="p-8 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            Search Type Not Implemented
          </h3>
          <p className="text-muted-foreground">
            {getSearchTypeName(type)} search is not yet available. Please try
            searching for datasets or locations instead.
          </p>
        </Card>
      )
    }
  } catch (error) {
    console.error("Search results error:", error)
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Search Error</AlertTitle>
        <AlertDescription>
          An error occurred while searching. Please try again or contact support
          if the problem persists.
        </AlertDescription>
      </Alert>
    )
  }
}

// Loading Skeletons
function SearchResultsSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <div className="grid gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="p-4">
            <div className="space-y-3">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

function MetadataResultsSkeleton() {
  return (
    <div className="grid gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="p-4">
          <div className="space-y-3">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </Card>
      ))}
    </div>
  )
}

function LocationResultsSkeleton() {
  return (
    <div className="grid gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="p-4">
          <div className="flex items-start gap-3">
            <Skeleton className="h-5 w-5 mt-0.5" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
