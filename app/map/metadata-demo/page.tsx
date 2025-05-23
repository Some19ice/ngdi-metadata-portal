"use server"

import { Suspense } from "react"
import { getMetadataRecordsWithSpatialBoundsAction } from "@/actions/db/metadata-records-actions"
import { transformDatabaseRecordsToMapRecords } from "@/lib/map-utils"
import MetadataMapDemoClient from "./_components/metadata-map-demo-client"
import { Loader2 } from "lucide-react"

export default async function MetadataMapDemoPage() {
  return (
    <Suspense fallback={<MetadataMapDemoSkeleton />}>
      <MetadataMapDemoFetcher />
    </Suspense>
  )
}

async function MetadataMapDemoFetcher() {
  const result = await getMetadataRecordsWithSpatialBoundsAction()

  if (!result.isSuccess) {
    return <MetadataMapDemoClient initialRecords={[]} error={result.message} />
  }

  const mapRecords = transformDatabaseRecordsToMapRecords(result.data)

  return <MetadataMapDemoClient initialRecords={mapRecords} />
}

function MetadataMapDemoSkeleton() {
  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading metadata records...</p>
        </div>
      </div>
    </div>
  )
}
