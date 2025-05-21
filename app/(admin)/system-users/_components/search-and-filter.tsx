"use client"

import { useState, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { GetUsersOptions } from "@/actions/clerk-actions"
import { roleEnum } from "@/db/schema"
import { Filter, Search, SortAsc, SortDesc, X } from "lucide-react"

interface SearchAndFilterProps {
  currentOptions: GetUsersOptions
  totalResults: number
}

// Type safe role values
type RoleValue = (typeof roleEnum.enumValues)[number] | ""

export default function SearchAndFilter({
  currentOptions,
  totalResults
}: SearchAndFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  // Local state for form values
  const [query, setQuery] = useState(currentOptions.query || "")
  const [role, setRole] = useState<RoleValue>(
    (currentOptions.roleFilter as RoleValue) || ""
  )
  const [sortBy, setSortBy] = useState(currentOptions.sortBy || "createdAt")
  const [sortOrder, setSortOrder] = useState(currentOptions.sortOrder || "desc")

  // Update URL with new search params
  function applyFilters() {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString())

      // Only add params with values
      if (query) params.set("query", query)
      else params.delete("query")

      if (role) params.set("role", role)
      else params.delete("role")

      params.set("sortBy", sortBy)
      params.set("sortOrder", sortOrder)

      // Reset to page 1 when filtering
      params.set("page", "1")

      router.push(`/system-users?${params.toString()}`)
    })
  }

  // Clear all filters
  function clearFilters() {
    startTransition(() => {
      setQuery("")
      setRole("")
      setSortBy("createdAt")
      setSortOrder("desc")
      router.push("/system-users")
    })
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Filter Users</CardTitle>
        <CardDescription>
          {totalResults} user{totalResults !== 1 ? "s" : ""} found
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search users..."
                className="pl-8"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter") applyFilters()
                }}
              />
            </div>
          </div>

          <div>
            <Select
              value={role}
              onValueChange={value => setRole(value as RoleValue)}
            >
              <SelectTrigger>
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-roles">All Roles</SelectItem>
                {roleEnum.enumValues.map(roleValue => (
                  <SelectItem key={roleValue} value={roleValue}>
                    {roleValue}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Select
              value={sortBy}
              onValueChange={value => setSortBy(value as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">Date Created</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="role">Role</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Select
              value={sortOrder}
              onValueChange={value => setSortOrder(value as any)}
            >
              <SelectTrigger>
                {sortOrder === "asc" ? (
                  <SortAsc className="mr-2 h-4 w-4" />
                ) : (
                  <SortDesc className="mr-2 h-4 w-4" />
                )}
                <SelectValue placeholder="Sort order" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">Ascending</SelectItem>
                <SelectItem value="desc">Descending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
            disabled={isPending}
          >
            <X className="mr-2 h-4 w-4" />
            Clear Filters
          </Button>
          <Button size="sm" onClick={applyFilters} disabled={isPending}>
            <Filter className="mr-2 h-4 w-4" />
            Apply Filters
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
