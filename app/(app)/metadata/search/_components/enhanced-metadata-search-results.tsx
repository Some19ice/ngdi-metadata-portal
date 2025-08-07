"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from "@/components/ui/pagination"
import {
  Loader2,
  Building,
  Calendar,
  FileText,
  MapPin,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Grid3X3,
  List,
  MapIcon,
  Clock
} from "lucide-react"
import { MetadataSearchResult, MetadataSearchRecord } from "@/types"

interface EnhancedMetadataSearchResultsProps {
  searchResults: MetadataSearchResult | null
  isLoading: boolean
  error: string | null
  viewMode: "grid" | "list" | "map"
  onPageChange?: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  onRetry?: () => void
}

// Loading skeleton component
const ResultsSkeleton = ({
  viewMode
}: {
  viewMode: "grid" | "list" | "map"
}) => {
  const skeletonCount = viewMode === "grid" ? 6 : 4

  return (
    <div
      className={`space-y-4 ${viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : ""}`}
    >
      {Array.from({ length: skeletonCount }).map((_, index) => (
        <Card key={index} className="p-4">
          <div className="space-y-3">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <div className="flex space-x-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-24" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

// Empty state component
const EmptyState = ({
  hasFilters,
  onClearFilters
}: {
  hasFilters: boolean
  onClearFilters?: () => void
}) => (
  <Card>
    <CardContent className="flex flex-col items-center justify-center py-16">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
          <FileText className="h-8 w-8 text-gray-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {hasFilters ? "No results found" : "Start your search"}
          </h3>
          <p className="text-gray-500 mt-1">
            {hasFilters
              ? "Try adjusting your search criteria or clearing some filters"
              : "Enter a search term or select filters to find metadata records"}
          </p>
        </div>
        {hasFilters && onClearFilters && (
          <Button variant="outline" onClick={onClearFilters}>
            Clear all filters
          </Button>
        )}
      </div>
    </CardContent>
  </Card>
)

// Error state component
const ErrorState = ({
  error,
  onRetry
}: {
  error: string
  onRetry?: () => void
}) => (
  <Alert variant="destructive">
    <AlertCircle className="h-4 w-4" />
    <AlertDescription className="flex items-center justify-between">
      <span>{error}</span>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      )}
    </AlertDescription>
  </Alert>
)

// Individual result card component
const ResultCard = ({
  record,
  viewMode
}: {
  record: MetadataSearchRecord
  viewMode: "grid" | "list" | "map"
}) => {
  const router = useRouter()

  const handleClick = () => {
    router.push(`/metadata/${record.id}`)
  }

  const formatDate = (dateInput: string | Date) => {
    try {
      const date =
        typeof dateInput === "string" ? new Date(dateInput) : dateInput
      return date.toLocaleDateString()
    } catch {
      return "Invalid date"
    }
  }

  return (
    <Card
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={handleClick}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Title and Abstract */}
          <div>
            <h4 className="font-semibold text-blue-600 hover:text-blue-800 text-lg line-clamp-2">
              {record.title}
              <ExternalLink className="inline h-4 w-4 ml-1 opacity-50" />
            </h4>
            {record.abstract && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-3">
                {record.abstract}
              </p>
            )}
          </div>

          {/* Metadata badges */}
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
                {formatDate(record.productionDate)}
              </Badge>
            )}
            {record.status && (
              <Badge
                variant={record.status === "Published" ? "default" : "outline"}
                className={
                  record.status === "Published"
                    ? "bg-green-100 text-green-800"
                    : record.status === "Draft"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-gray-100 text-gray-800"
                }
              >
                {record.status}
              </Badge>
            )}
          </div>

          {/* Spatial extent indicator */}
          {(record.boundingBoxNorth ||
            record.boundingBoxSouth ||
            record.boundingBoxEast ||
            record.boundingBoxWest) && (
            <div className="flex items-center text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 mr-1" />
              <span>Spatial data available</span>
            </div>
          )}

          {/* Keywords */}
          {record.keywords && record.keywords.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {record.keywords.slice(0, 5).map((keyword, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {keyword}
                </Badge>
              ))}
              {record.keywords.length > 5 && (
                <Badge variant="outline" className="text-xs">
                  +{record.keywords.length - 5} more
                </Badge>
              )}
            </div>
          )}

          {/* Last updated */}
          {record.updatedAt && (
            <div className="flex items-center text-xs text-muted-foreground">
              <Clock className="h-3 w-3 mr-1" />
              <span>Updated {formatDate(record.updatedAt)}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Pagination component
const SearchPagination = ({
  currentPage,
  totalPages,
  onPageChange
}: {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}) => {
  if (totalPages <= 1) return null

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            className={
              currentPage <= 1
                ? "pointer-events-none opacity-50"
                : "cursor-pointer"
            }
          />
        </PaginationItem>

        {/* Page numbers */}
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          const page = i + Math.max(1, currentPage - 2)
          if (page > totalPages) return null

          return (
            <PaginationItem key={page}>
              <PaginationLink
                onClick={() => onPageChange(page)}
                isActive={page === currentPage}
                className="cursor-pointer"
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          )
        })}

        {totalPages > 5 && currentPage < totalPages - 2 && (
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
        )}

        <PaginationItem>
          <PaginationNext
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            className={
              currentPage >= totalPages
                ? "pointer-events-none opacity-50"
                : "cursor-pointer"
            }
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}

export default function EnhancedMetadataSearchResults({
  searchResults,
  isLoading,
  error,
  viewMode,
  onPageChange,
  onPageSizeChange,
  onRetry
}: EnhancedMetadataSearchResultsProps) {
  const router = useRouter()

  // Handle loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Searching...</span>
            </CardTitle>
          </CardHeader>
        </Card>
        <ResultsSkeleton viewMode={viewMode} />
      </div>
    )
  }

  // Handle error state
  if (error) {
    return (
      <div className="space-y-4">
        <ErrorState error={error} onRetry={onRetry} />
        <EmptyState hasFilters={false} />
      </div>
    )
  }

  // Handle no search performed yet
  if (!searchResults) {
    return <EmptyState hasFilters={false} />
  }

  // Handle no results
  if (searchResults.records.length === 0) {
    return <EmptyState hasFilters={true} />
  }

  const currentPage = searchResults.currentPage || 1
  const totalPages = Math.ceil(
    searchResults.totalCount / (searchResults.pageSize || 20)
  )

  return (
    <div className="space-y-6">
      {/* Results header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <span>
                {searchResults.totalCount.toLocaleString()} results found
              </span>
              {searchResults.searchTime && (
                <Badge variant="outline">{searchResults.searchTime}ms</Badge>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="flex items-center space-x-1">
                {viewMode === "grid" && <Grid3X3 className="h-3 w-3" />}
                {viewMode === "list" && <List className="h-3 w-3" />}
                {viewMode === "map" && <MapIcon className="h-3 w-3" />}
                <span>{viewMode} view</span>
              </Badge>
              {onPageSizeChange && (
                <select
                  className="text-sm border rounded px-2 py-1"
                  value={searchResults.pageSize || 20}
                  onChange={e => onPageSizeChange(parseInt(e.target.value))}
                >
                  <option value={10}>10 per page</option>
                  <option value={20}>20 per page</option>
                  <option value={50}>50 per page</option>
                </select>
              )}
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Results grid/list */}
      <div
        className={
          viewMode === "grid"
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            : "space-y-4"
        }
      >
        {searchResults.records.map(record => (
          <ResultCard key={record.id} record={record} viewMode={viewMode} />
        ))}
      </div>

      {/* Pagination */}
      {onPageChange && totalPages > 1 && (
        <div className="flex justify-center">
          <SearchPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </div>
      )}

      {/* Results summary */}
      <div className="text-center text-sm text-muted-foreground">
        Showing {(currentPage - 1) * (searchResults.pageSize || 20) + 1} to{" "}
        {Math.min(
          currentPage * (searchResults.pageSize || 20),
          searchResults.totalCount
        )}{" "}
        of {searchResults.totalCount} results
      </div>
    </div>
  )
}
