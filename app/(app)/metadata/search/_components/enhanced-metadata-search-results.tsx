"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Building, Calendar, FileText } from "lucide-react"
import {
  searchMetadataRecordsAction,
  MetadataRecordWithOrganization
} from "@/actions/db/metadata-records-actions"

interface SearchFilters {
  query: string
  dataTypes: string[]
  organizations: string[]
  topicCategories: string[]
  frameworkTypes: string[]
  temporalRange: {
    start: string | null
    end: string | null
  }
  sortBy: "relevance" | "date" | "title" | "updated"
  sortOrder: "asc" | "desc"
}

interface EnhancedMetadataSearchResultsProps {
  filters: SearchFilters
  viewMode: "grid" | "list" | "map"
}

export default function EnhancedMetadataSearchResults({
  filters,
  viewMode
}: EnhancedMetadataSearchResultsProps) {
  const [results, setResults] = useState<MetadataRecordWithOrganization[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    performSearch()
  }, [filters])

  const shouldSearch = () => {
    return (
      filters.query.trim() !== "" ||
      filters.dataTypes.length > 0 ||
      filters.organizations.length > 0 ||
      filters.frameworkTypes.length > 0 ||
      filters.temporalRange.start ||
      filters.temporalRange.end
    )
  }

  const performSearch = async () => {
    if (!shouldSearch()) {
      setResults([])
      setTotalCount(0)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const searchParams = {
        query: filters.query || undefined,
        // Map organization names to IDs - for now we'll search by name in the query
        datasetType:
          filters.dataTypes.length > 0 ? filters.dataTypes[0] : undefined,
        frameworkType:
          filters.frameworkTypes.length > 0
            ? filters.frameworkTypes[0]
            : undefined,
        temporalExtentStartDate: filters.temporalRange.start || undefined,
        temporalExtentEndDate: filters.temporalRange.end || undefined,
        sortBy: filters.sortBy === "relevance" ? undefined : filters.sortBy,
        sortOrder: filters.sortOrder,
        page: 1,
        pageSize: 20
      }

      const response = await searchMetadataRecordsAction(searchParams)

      if (response.isSuccess && response.data) {
        setResults(response.data.records)
        setTotalCount(response.data.totalRecords)
      } else {
        setError(response.message || "Search failed")
      }
    } catch (err) {
      setError("An error occurred while searching")
      console.error("Search error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2 text-muted-foreground">Searching...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8 text-red-600">Error: {error}</div>
        </CardContent>
      </Card>
    )
  }

  if (!shouldSearch()) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground py-8">
            Enter a search term or select filters to find metadata records.
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>{totalCount} results found</span>
          <Badge variant="outline">View: {viewMode}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {results.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No results found. Try adjusting your search criteria.
          </div>
        ) : (
          <div className="space-y-4">
            {results.map(record => (
              <Card key={record.id} className="p-4">
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-blue-600 hover:text-blue-800 cursor-pointer text-lg">
                      {record.title}
                    </h4>
                    {record.abstract && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {record.abstract}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {record.dataType && (
                      <Badge variant="secondary">
                        <FileText className="h-3 w-3 mr-1" />
                        {record.dataType}
                      </Badge>
                    )}
                    {record.frameworkType && (
                      <Badge variant="outline">{record.frameworkType}</Badge>
                    )}
                    {record.organization?.name && (
                      <Badge variant="secondary">
                        <Building className="h-3 w-3 mr-1" />
                        {record.organization.name}
                      </Badge>
                    )}
                    {record.productionDate && (
                      <Badge variant="outline">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(record.productionDate).getFullYear()}
                      </Badge>
                    )}
                  </div>

                  {record.keywords && record.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {record.keywords.slice(0, 6).map((keyword, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                      {record.keywords.length > 6 && (
                        <Badge variant="outline" className="text-xs">
                          +{record.keywords.length - 6} more
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground">
                    Last updated:{" "}
                    {new Date(record.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
