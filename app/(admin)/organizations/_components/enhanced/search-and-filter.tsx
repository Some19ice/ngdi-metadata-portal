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
import { Filter, Search, SortAsc, SortDesc, X } from "lucide-react"
import { organizationStatusEnum } from "@/db/schema/organizations-schema"

interface SearchAndFilterProps {
  totalOrganizations: number
}

export default function OrganizationSearchAndFilter({
  totalOrganizations
}: SearchAndFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  // Local form state
  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "")
  const [status, setStatus] = useState(searchParams.get("status") || "")
  const [sortBy, setSortBy] = useState(
    searchParams.get("sortBy") || "createdAt"
  )
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(
    (searchParams.get("sortOrder") as "asc" | "desc") || "desc"
  )

  // Available options
  const statusOptions = [
    { value: "all-statuses", label: "All Statuses" },
    ...organizationStatusEnum.enumValues.map(status => ({
      value: status,
      label: status.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())
    }))
  ]

  const sortByOptions = [
    { value: "createdAt", label: "Date Created" },
    { value: "name", label: "Name" },
    { value: "status", label: "Status" },
    { value: "memberCount", label: "Member Count" }
  ]

  function toggleSortOrder() {
    const newOrder = sortOrder === "asc" ? "desc" : "asc"
    setSortOrder(newOrder)
    applyFilters({ sortOrder: newOrder })
  }

  function applyFilters(overrides: Record<string, string> = {}) {
    startTransition(() => {
      // Create new URLSearchParams object
      const params = new URLSearchParams()

      // Add current values and overrides if they exist
      const searchValue = overrides.q !== undefined ? overrides.q : searchTerm
      if (searchValue) params.set("q", searchValue)

      const statusValue =
        overrides.status !== undefined ? overrides.status : status
      if (statusValue && statusValue !== "all-statuses") {
        params.set("status", statusValue)
      }

      const sortByValue =
        overrides.sortBy !== undefined ? overrides.sortBy : sortBy
      if (sortByValue) params.set("sortBy", sortByValue)

      const sortOrderValue =
        overrides.sortOrder !== undefined ? overrides.sortOrder : sortOrder
      if (sortOrderValue) params.set("sortOrder", sortOrderValue)

      // Keep current page unless the filter has changed
      if (
        overrides.q === undefined &&
        overrides.status === undefined &&
        searchParams.has("page")
      ) {
        params.set("page", searchParams.get("page")!)
      }

      // Navigate to the new URL
      router.push(`/organizations?${params.toString()}`)
    })
  }

  function clearFilters() {
    setSearchTerm("")
    setStatus("all-statuses")
    setSortBy("createdAt")
    setSortOrder("desc")
    router.push("/organizations")
  }

  const hasActiveFilters =
    searchTerm || status || sortBy !== "createdAt" || sortOrder !== "desc"

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Search Organizations</CardTitle>
            <CardDescription>
              {totalOrganizations}{" "}
              {totalOrganizations === 1 ? "organization" : "organizations"}{" "}
              found
            </CardDescription>
          </div>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-8"
            >
              <X className="mr-2 h-4 w-4" />
              Clear filters
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search organizations..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              onKeyDown={e =>
                e.key === "Enter" && applyFilters({ q: searchTerm })
              }
              className="w-full"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select
              value={status}
              onValueChange={value => {
                setStatus(value)
                applyFilters({ status: value })
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Select
              value={sortBy}
              onValueChange={value => {
                setSortBy(value)
                applyFilters({ sortBy: value })
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {sortByOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={toggleSortOrder}
              className="h-10 w-10"
            >
              {sortOrder === "asc" ? (
                <SortAsc className="h-4 w-4" />
              ) : (
                <SortDesc className="h-4 w-4" />
              )}
              <span className="sr-only">
                {sortOrder === "asc" ? "Sort descending" : "Sort ascending"}
              </span>
            </Button>
            <Button
              variant="default"
              disabled={isPending}
              onClick={() => applyFilters()}
              className="w-full"
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
