"use client"

import { DataTable } from "@/components/ui/data-table"
import {
  MetadataRecordWithOrganization,
  columns
} from "./metadata-table-columns"
import { useState } from "react"

interface MyMetadataListProps {
  initialData: MetadataRecordWithOrganization[]
}

export default function MyMetadataList({ initialData }: MyMetadataListProps) {
  const [sortBy, setSortBy] = useState("updatedAt")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  const handleSort = (newSortBy: string, newSortOrder: "asc" | "desc") => {
    setSortBy(newSortBy)
    setSortOrder(newSortOrder)
    // Note: In a real implementation, you might want to trigger a server action
    // to re-fetch data with the new sort parameters
  }

  if (!initialData || initialData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-10">
        <p className="text-lg text-muted-foreground">
          You have not created any metadata records yet.
        </p>
        {/* Optionally, add a button/link to the create page */}
        {/* <Button asChild className="mt-4">
          <Link href="/metadata/create">Create New Metadata</Link>
        </Button> */}
      </div>
    )
  }

  const columnDefinitions = columns({
    onSort: handleSort,
    currentSortBy: sortBy,
    currentSortOrder: sortOrder
  })

  return (
    <div className="container mx-auto py-10">
      <DataTable columns={columnDefinitions} data={initialData} />
    </div>
  )
}
