"use server"

import { Suspense } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { notFound, redirect } from "next/navigation"
import CentralSearchForm from "./_components/central-search-form"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface SearchParams {
  q?: string
  type?: string
  page?: string
  // Include all possible metadata search params
  query?: string
  temporalExtentStartDate?: string
  temporalExtentEndDate?: string
  frameworkType?: string
  datasetType?: string
  useSpatialSearch?: string
  bbox_north?: string
  bbox_south?: string
  bbox_east?: string
  bbox_west?: string
  sortBy?: string
  sortOrder?: string
}

interface SearchPageProps {
  searchParams: Promise<SearchParams>
}

export default async function SearchPage({
  searchParams: searchParamsPromise
}: SearchPageProps) {
  const searchParams = await searchParamsPromise

  // Support both 'q' (from global search) and 'query' (from metadata search)
  const query = searchParams?.q || searchParams?.query || ""
  const type = searchParams?.type || "metadata" // Default to metadata if not specified
  const page = searchParams?.page || "1"

  // Check if this is a direct metadata search with detailed params
  if (
    type === "metadata" &&
    (searchParams?.temporalExtentStartDate ||
      searchParams?.temporalExtentEndDate ||
      searchParams?.frameworkType ||
      searchParams?.datasetType ||
      searchParams?.useSpatialSearch)
  ) {
    // Remap q to query for metadata search
    const metadataParams = new URLSearchParams()

    if (query) {
      metadataParams.set("query", query)
    }

    // Forward all metadata-specific params
    if (searchParams.temporalExtentStartDate) {
      metadataParams.set(
        "temporalExtentStartDate",
        searchParams.temporalExtentStartDate
      )
    }
    if (searchParams.temporalExtentEndDate) {
      metadataParams.set(
        "temporalExtentEndDate",
        searchParams.temporalExtentEndDate
      )
    }
    if (searchParams.frameworkType) {
      metadataParams.set("frameworkType", searchParams.frameworkType)
    }
    if (searchParams.datasetType) {
      metadataParams.set("datasetType", searchParams.datasetType)
    }
    if (searchParams.useSpatialSearch) {
      metadataParams.set("useSpatialSearch", searchParams.useSpatialSearch)
    }
    if (searchParams.bbox_north) {
      metadataParams.set("bbox_north", searchParams.bbox_north)
    }
    if (searchParams.bbox_south) {
      metadataParams.set("bbox_south", searchParams.bbox_south)
    }
    if (searchParams.bbox_east) {
      metadataParams.set("bbox_east", searchParams.bbox_east)
    }
    if (searchParams.bbox_west) {
      metadataParams.set("bbox_west", searchParams.bbox_west)
    }
    if (searchParams.sortBy) {
      metadataParams.set("sortBy", searchParams.sortBy)
    }
    if (searchParams.sortOrder) {
      metadataParams.set("sortOrder", searchParams.sortOrder)
    }
    if (page !== "1") {
      metadataParams.set("page", page)
    }

    const searchUrl = `/metadata/search?${metadataParams.toString()}`
    return redirect(searchUrl)
  }

  if (!query) {
    // If no query is provided, show the search form
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Search</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Enter a search term to find metadata records, publications, news,
              and more.
            </p>
            <CentralSearchForm />
          </CardContent>
        </Card>
      </div>
    )
  }

  // Direct redirects for specific types
  if (type === "metadata") {
    return redirect(
      `/metadata/search?query=${encodeURIComponent(query)}&page=${page}`
    )
  } else if (type === "news") {
    return redirect(`/news?query=${encodeURIComponent(query)}&page=${page}`)
  } else if (type === "docs") {
    return redirect(`/docs?query=${encodeURIComponent(query)}&page=${page}`)
  }

  // If we get here, show tabbed interface with links instead of redirects
  const metadataUrl = `/metadata/search?query=${encodeURIComponent(query)}&page=${page}`
  const newsUrl = `/news?query=${encodeURIComponent(query)}&page=${page}`
  const docsUrl = `/docs?query=${encodeURIComponent(query)}&page=${page}`

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Search Results for "{query}"</CardTitle>
        </CardHeader>
        <CardContent>
          <CentralSearchForm initialQuery={query} initialType={type} />

          <div className="mt-6">
            <Tabs defaultValue="metadata" className="w-full">
              <TabsList className="w-full grid grid-cols-3">
                <TabsTrigger value="metadata">Metadata</TabsTrigger>
                <TabsTrigger value="news">News</TabsTrigger>
                <TabsTrigger value="docs">Documentation</TabsTrigger>
              </TabsList>
              <TabsContent value="metadata" className="py-4">
                <div className="text-center">
                  <Link href={metadataUrl}>
                    <Button>View Metadata Search Results</Button>
                  </Link>
                </div>
              </TabsContent>
              <TabsContent value="news" className="py-4">
                <div className="text-center">
                  <Link href={newsUrl}>
                    <Button>View News Search Results</Button>
                  </Link>
                </div>
              </TabsContent>
              <TabsContent value="docs" className="py-4">
                <div className="text-center">
                  <Link href={docsUrl}>
                    <Button>View Documentation Search Results</Button>
                  </Link>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
