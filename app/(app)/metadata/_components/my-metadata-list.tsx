"use client"

import { DataTable } from "@/components/ui/data-table"
import {
  MetadataRecordWithOrganization,
  columns
} from "./metadata-table-columns"

interface MyMetadataListProps {
  initialData: MetadataRecordWithOrganization[]
}

export default function MyMetadataList({ initialData }: MyMetadataListProps) {
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

  return (
    <div className="container mx-auto py-10">
      <DataTable columns={columns} data={initialData} />
    </div>
  )
}
