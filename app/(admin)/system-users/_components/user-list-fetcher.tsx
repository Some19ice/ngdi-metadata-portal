"use server"

import { GetUsersOptions, getUsersAction } from "@/actions/clerk-actions"
import UserList from "./user-list"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal } from "lucide-react"
import SearchAndFilter from "./search-and-filter"
import Pagination from "./pagination"

interface UserListFetcherProps {
  className?: string
  searchParams?: Promise<{
    query?: string
    role?: string
    sortBy?: string
    sortOrder?: string
    page?: string
  }>
}

export default async function UserListFetcher({
  className,
  searchParams = Promise.resolve({})
}: UserListFetcherProps) {
  // Await the searchParams promise
  const params = await searchParams

  // Convert and validate search params
  const options: GetUsersOptions = {
    query: params.query || "",
    roleFilter: params.role as any, // Type cast as the roleEnum value
    sortBy: (params.sortBy || "createdAt") as any,
    sortOrder: (params.sortOrder || "desc") as any,
    page: params.page ? parseInt(params.page, 10) : 1,
    limit: 10
  }

  const result = await getUsersAction(options)

  if (!result.isSuccess || !result.data) {
    return (
      <Alert variant="destructive" className={className}>
        <Terminal className="h-4 w-4" />
        <AlertTitle>Error Fetching Users</AlertTitle>
        <AlertDescription>
          {result.message || "An unexpected error occurred."}
        </AlertDescription>
      </Alert>
    )
  }

  const { users, page, totalPages, totalCount } = result.data

  return (
    <div className={className}>
      <SearchAndFilter currentOptions={options} totalResults={totalCount} />
      <UserList users={users} className="mt-4" />
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
