"use server"

import { Suspense } from "react"
import MetadataListFetcher from "./_components/metadata-list-fetcher"
import MetadataListSkeleton from "./_components/metadata-list-skeleton"
// Public browse page: remove hard auth redirect. Auth-only features handled inside client components.

export default async function MetadataPage() {
  // The MetadataListFetcher will handle role-based data fetching.
  // For now, it can default to fetching metadata created by the current user.

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Metadata Records
          </h1>
          <p className="text-muted-foreground">
            Browse, manage, and create new metadata records.
          </p>
        </div>
      </div>
      <Suspense fallback={<MetadataListSkeleton />}>
        <MetadataListFetcher />
      </Suspense>
    </div>
  )
}
