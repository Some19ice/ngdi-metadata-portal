"use server"

import { Suspense } from "react"
import ViewMetadataRecordFetcher from "./_components/view-metadata-record-fetcher"
import ViewMetadataRecordSkeleton from "./_components/view-metadata-record-skeleton"

// @ts-ignore - Workaround for Next.js types
export default async function ViewMetadataRecordPage({ params }: any) {
  const awaitedParams = await params
  const recordId = awaitedParams?.recordId

  return (
    <div className="container mx-auto py-8">
      <Suspense fallback={<ViewMetadataRecordSkeleton className="w-full" />}>
        <ViewMetadataRecordFetcher recordId={recordId} />
      </Suspense>
    </div>
  )
}
