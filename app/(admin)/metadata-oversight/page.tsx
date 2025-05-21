"use server"

import { Suspense } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import MetadataOversightSkeleton from "./_components/metadata-oversight-skeleton"
import MetadataOversightFetcher from "./_components/metadata-oversight-fetcher"

export default async function MetadataOversightPage() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">
          Metadata Oversight
        </h1>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            Export Data
          </Button>
          <Button variant="outline" size="sm">
            Bulk Actions
          </Button>
        </div>
      </div>

      <p className="text-muted-foreground">
        System-wide oversight of all metadata records across the NGDI Portal.
        Use the tabs below to filter by status.
      </p>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="all">
            All Records
            <Badge variant="secondary" className="ml-2">
              0
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="published">
            Published
            <Badge variant="secondary" className="ml-2">
              0
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approved
            <Badge variant="secondary" className="ml-2">
              0
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending Validation
            <Badge variant="secondary" className="ml-2">
              0
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="needs-revision">
            Needs Revision
            <Badge variant="secondary" className="ml-2">
              0
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="draft">
            Draft
            <Badge variant="secondary" className="ml-2">
              0
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="w-full border rounded-lg p-4">
          {" "}
          {/* Added w-full */}
          <Suspense fallback={<MetadataOversightSkeleton />}>
            <MetadataOversightFetcher status="all" />
          </Suspense>
        </TabsContent>

        <TabsContent value="published" className="w-full border rounded-lg p-4">
          {" "}
          {/* Added w-full */}
          <Suspense fallback={<MetadataOversightSkeleton />}>
            <MetadataOversightFetcher status="Published" />
          </Suspense>
        </TabsContent>

        <TabsContent value="approved" className="w-full border rounded-lg p-4">
          {" "}
          {/* Added w-full */}
          <Suspense fallback={<MetadataOversightSkeleton />}>
            <MetadataOversightFetcher status="Approved" />
          </Suspense>
        </TabsContent>

        <TabsContent value="pending" className="w-full border rounded-lg p-4">
          {" "}
          {/* Added w-full */}
          <Suspense fallback={<MetadataOversightSkeleton />}>
            <MetadataOversightFetcher status="Pending Validation" />
          </Suspense>
        </TabsContent>

        <TabsContent
          value="needs-revision"
          className="w-full border rounded-lg p-4"
        >
          {" "}
          {/* Added w-full */}
          <Suspense fallback={<MetadataOversightSkeleton />}>
            <MetadataOversightFetcher status="Needs Revision" />
          </Suspense>
        </TabsContent>

        <TabsContent value="draft" className="w-full border rounded-lg p-4">
          {" "}
          {/* Added w-full */}
          <Suspense fallback={<MetadataOversightSkeleton />}>
            <MetadataOversightFetcher status="Draft" />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  )
}
