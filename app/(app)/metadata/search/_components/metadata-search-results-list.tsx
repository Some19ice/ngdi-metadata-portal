"use client"

import {
  MetadataRecordWithOrganization,
  PaginatedMetadataRecords
} from "@/actions/db/metadata-records-actions"
import { DataTable } from "@/components/ui/data-table"
import { columns } from "@/app/(app)/metadata/_components/metadata-table-columns"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Map } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect, useCallback } from "react"

interface MetadataSearchResultsListProps {
  initialResults: MetadataRecordWithOrganization[]
  query?: string // For displaying "Results for ..."
  totalRecords: number
  totalPages: number
  currentPage: number
  pageSize: number
}

export default function MetadataSearchResultsList({
  initialResults,
  query,
  totalRecords,
  totalPages,
  currentPage,
  pageSize
}: MetadataSearchResultsListProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [data, setData] =
    useState<MetadataRecordWithOrganization[]>(initialResults)
  const [isLoading, setIsLoading] = useState(false) // Could be used for optimistic updates if needed

  // Update data when initialResults change (e.g., due to new search)
  useEffect(() => {
    setData(initialResults)
  }, [initialResults])

  // Create a new URLSearchParams object to manage URL updates
  const createQueryString = useCallback(
    (paramsToUpdate: Record<string, string>) => {
      const currentParams = new URLSearchParams(
        Array.from(searchParams.entries())
      )
      for (const [name, value] of Object.entries(paramsToUpdate)) {
        if (value) {
          currentParams.set(name, value)
        } else {
          currentParams.delete(name)
        }
      }
      return currentParams.toString()
    },
    [searchParams]
  )

  const handleSortChange = (sortBy: string, sortOrder: "asc" | "desc") => {
    const newParams = {
      sortBy: sortBy,
      sortOrder: sortOrder,
      page: "1" // Reset to first page on sort change
    }
    router.push(`${pathname}?${createQueryString(newParams)}`)
  }

  const handlePageChange = (newPage: number) => {
    router.push(
      `${pathname}?${createQueryString({ page: newPage.toString() })}`
    )
  }

  // Get current sort state from URL for DataTable
  const currentSortBy = searchParams.get("sortBy") || "updatedAt"
  const currentSortOrder =
    (searchParams.get("sortOrder") as "asc" | "desc") || "desc"

  const getFilterDescription = () => {
    let description = `Showing results for `
    const filters = []

    if (query) {
      filters.push(`"<strong>${query}</strong>"`)
    } else {
      filters.push("<strong>all records</strong>")
    }

    description += filters.join(", with ")
    description += `. Found ${initialResults.length} record(s).`

    return description
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Search Results</CardTitle>
        <CardDescription
          dangerouslySetInnerHTML={{ __html: getFilterDescription() }}
        />

        {/* Display active filters as badges */}
        {query && (
          <div className="flex flex-wrap gap-2 mt-2">
            {query && (
              <Badge variant="secondary" className="text-xs">
                Query: {query}
              </Badge>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {initialResults.length > 0 ? (
          <DataTable
            columns={columns({
              onSort: handleSortChange,
              currentSortBy,
              currentSortOrder
            })}
            data={data}
            isLoading={isLoading}
            pageCount={totalPages}
            rowCount={totalRecords}
            currentPage={currentPage}
            pageSize={pageSize}
            onPageChange={handlePageChange}
          />
        ) : (
          <p className="text-center text-muted-foreground">
            No records found matching your criteria.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
