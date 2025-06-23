import { Suspense } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, ExternalLink, Loader2, AlertCircle } from "lucide-react"
import Link from "next/link"
import { searchMetadataRecordsAction } from "@/actions/db/metadata-records-actions"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  transformToMetadataParams,
  type SearchParams
} from "@/lib/utils/search-utils"

interface InlineMetadataResultsProps {
  query: string
  page: number
  searchParams: SearchParams
  showTitle?: boolean
  maxResults?: number
}

export default function InlineMetadataResults({
  query,
  page,
  searchParams,
  showTitle = true,
  maxResults = 10
}: InlineMetadataResultsProps) {
  return (
    <Suspense fallback={<MetadataResultsSkeleton showTitle={showTitle} />}>
      <MetadataResultsFetcher
        query={query}
        page={page}
        searchParams={searchParams}
        showTitle={showTitle}
        maxResults={maxResults}
      />
    </Suspense>
  )
}

async function MetadataResultsFetcher({
  query,
  page,
  searchParams,
  showTitle,
  maxResults = 10
}: InlineMetadataResultsProps) {
  try {
    // Validate inputs
    if (!query?.trim()) {
      return (
        <Card>
          {showTitle && (
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Dataset Results
              </CardTitle>
            </CardHeader>
          )}
          <CardContent>
            <div className="text-center text-muted-foreground">
              Enter a search term to find datasets
            </div>
          </CardContent>
        </Card>
      )
    }

    // Transform search parameters to match metadata search expectations
    const metadataParams = transformToMetadataParams(searchParams)

    // Build search criteria from URL parameters with validation
    const searchCriteria = {
      query: query.trim(),
      organizationId: metadataParams.get("organization") || undefined,
      temporalExtentStartDate:
        metadataParams.get("temporalExtentStartDate") || undefined,
      temporalExtentEndDate:
        metadataParams.get("temporalExtentEndDate") || undefined,
      frameworkType: metadataParams.get("frameworkType") || undefined,
      datasetType: metadataParams.get("datasetType") || undefined,
      bbox_north: metadataParams.get("bbox_north") || undefined,
      bbox_south: metadataParams.get("bbox_south") || undefined,
      bbox_east: metadataParams.get("bbox_east") || undefined,
      bbox_west: metadataParams.get("bbox_west") || undefined,
      sortBy: metadataParams.get("sortBy") || "updatedAt",
      sortOrder: (metadataParams.get("sortOrder") as "asc" | "desc") || "desc",
      page: Math.max(1, page),
      pageSize: Math.min(Math.max(1, maxResults), 50) // Clamp between 1 and 50
    }

    const result = await searchMetadataRecordsAction(searchCriteria)

    if (!result.isSuccess) {
      return (
        <Card>
          {showTitle && (
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Dataset Results
              </CardTitle>
            </CardHeader>
          )}
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Failed to search datasets: {result.message}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )
    }

    const { records, totalRecords, totalPages } = result.data

    if (!records || records.length === 0) {
      return (
        <Card>
          {showTitle && (
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Dataset Results
              </CardTitle>
            </CardHeader>
          )}
          <CardContent>
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">
                No datasets found for "{query}"
              </p>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Try searching with different keywords or explore all metadata
                </p>
                <Button asChild variant="outline">
                  <Link href="/(app)/metadata/search">
                    <FileText className="h-4 w-4 mr-2" />
                    Browse All Datasets
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )
    }

    const metadataSearchUrl = `/(app)/metadata/search?${transformToMetadataParams(searchParams).toString()}`

    return (
      <Card>
        {showTitle && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2 justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Dataset Results ({totalRecords.toLocaleString()})
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href={metadataSearchUrl}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View All Results
                </Link>
              </Button>
            </CardTitle>
          </CardHeader>
        )}
        <CardContent className="space-y-4">
          {records.map(record => (
            <div
              key={record.id}
              className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3
                    className="font-medium mb-2 truncate"
                    title={record.title}
                  >
                    {record.title}
                  </h3>

                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {record.abstract || "No description available"}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-3">
                    {record.frameworkType && (
                      <Badge variant="secondary" className="text-xs">
                        {record.frameworkType}
                      </Badge>
                    )}
                    {record.dataType && (
                      <Badge variant="outline" className="text-xs">
                        {record.dataType}
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs capitalize">
                      {record.status}
                    </Badge>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    Updated {new Date(record.updatedAt).toLocaleDateString()}
                    {record.organization && ` • ${record.organization.name}`}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/(app)/metadata/${record.id}`}>
                      View Details
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {totalRecords > maxResults && (
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {records.length} of {totalRecords.toLocaleString()}{" "}
                  results
                </p>
                <Button asChild variant="outline" size="sm">
                  <Link href={metadataSearchUrl}>
                    View All {totalRecords.toLocaleString()} Results
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  } catch (error) {
    console.error("Error in MetadataResultsFetcher:", error)

    return (
      <Card>
        {showTitle && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Dataset Results
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              An unexpected error occurred while searching datasets. Please try
              again.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }
}

function MetadataResultsSkeleton({ showTitle }: { showTitle: boolean }) {
  return (
    <Card>
      {showTitle && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <Skeleton className="h-5 w-32" />
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="border rounded-lg p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-18" />
                </div>
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-8 w-24" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
