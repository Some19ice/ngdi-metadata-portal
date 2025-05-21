"use server"

import { getOrganizationsAdminAction } from "@/actions/db/organizations-actions"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal } from "lucide-react"
import OrganizationSearchAndFilter from "./search-and-filter"
import OrganizationDataTable from "./organization-data-table"
import Pagination from "./pagination"

interface OrganizationListFetcherProps {
  className?: string
  searchParams?: Promise<{
    q?: string
    status?: string
    sortBy?: string
    sortOrder?: string
    page?: string
  }>
}

export default async function OrganizationListFetcher({
  className,
  searchParams = Promise.resolve({})
}: OrganizationListFetcherProps) {
  // Convert search params to options
  const params = await searchParams
  const page = params.page ? parseInt(params.page, 10) : 1
  const options = {
    page,
    limit: 10,
    searchTerm: params.q || "",
    status: params.status as any,
    sortBy: (params.sortBy || "createdAt") as any,
    sortOrder: (params.sortOrder || "desc") as any
  }

  const result = await getOrganizationsAdminAction(options)

  if (!result.isSuccess || !result.data) {
    return (
      <Alert variant="destructive" className={className}>
        <Terminal className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {result.message || "Failed to load organizations"}
        </AlertDescription>
      </Alert>
    )
  }

  const { organizations, totalCount } = result.data
  const totalPages = Math.ceil(totalCount / options.limit)

  return (
    <div className={className}>
      <OrganizationSearchAndFilter totalOrganizations={totalCount} />
      <OrganizationDataTable organizations={organizations} className="mt-4" />
      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          className="mt-4"
        />
      )}
    </div>
  )
}
