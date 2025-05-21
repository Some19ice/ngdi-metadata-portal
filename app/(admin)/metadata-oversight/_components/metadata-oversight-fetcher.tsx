"use server"

import { searchMetadataRecordsAction } from "@/actions/db/metadata-records-actions"
import MetadataRecordsTable from "./metadata-records-table"
import { SelectMetadataRecord } from "@/db/schema"

export default async function MetadataOversightFetcher({
  status = "all"
}: {
  status?: string
}) {
  // Only filter by status if it's not "all"
  const statusFilter = status !== "all" ? status : undefined

  const result = await searchMetadataRecordsAction({
    status: statusFilter as any // The type will be properly checked in the action
  })

  if (!result.isSuccess || !result.data) {
    return (
      <div className="p-8 text-center">
        <p className="text-destructive">
          Error loading metadata records: {result.message}
        </p>
      </div>
    )
  }

  if (result.data.records.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">
          No records found with status: {status}
        </p>
      </div>
    )
  }

  return <MetadataRecordsTable records={result.data.records} />
}
