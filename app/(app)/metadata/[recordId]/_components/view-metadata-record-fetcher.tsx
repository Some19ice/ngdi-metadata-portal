"use server"

import { getMetadataRecordByIdAction } from "@/actions/db/metadata-records-actions"
import ViewMetadataRecordClient from "./view-metadata-record"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal } from "lucide-react"
import { redirect } from "next/navigation"

interface ViewMetadataRecordFetcherProps {
  recordId: string
}

export default async function ViewMetadataRecordFetcher({
  recordId
}: ViewMetadataRecordFetcherProps) {
  if (!recordId) {
    // This case should ideally be caught by routing or page structure
    console.error("ViewMetadataRecordFetcher: recordId is missing.")
    redirect("/metadata") // Or a more appropriate error page
  }

  const result = await getMetadataRecordByIdAction(recordId)

  if (!result.isSuccess) {
    return (
      <Alert variant="destructive">
        <Terminal className="h-4 w-4" />
        <AlertTitle>Error Fetching Metadata Record</AlertTitle>
        <AlertDescription>
          {result.message || "An unexpected error occurred."}
          {result.message?.includes("not found") && (
            <p className="mt-2 text-sm">
              The record may have been deleted or the ID is incorrect.
            </p>
          )}
        </AlertDescription>
      </Alert>
    )
  }

  if (!result.data) {
    // This case handles if isSuccess is true but data is null (e.g. record not found by ID but no specific error message)
    return (
      <Alert variant="destructive">
        <Terminal className="h-4 w-4" />
        <AlertTitle>Metadata Record Not Found</AlertTitle>
        <AlertDescription>
          The requested metadata record could not be found. It may have been
          deleted or the ID is incorrect.
        </AlertDescription>
      </Alert>
    )
  }

  return <ViewMetadataRecordClient record={result.data} />
}
