"use server"

import { Suspense } from "react"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { hasPermission } from "@/lib/rbac"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import OrganizationListFetcher from "./_components/enhanced/organization-list-fetcher"
import OrganizationListSkeleton from "./_components/enhanced/organization-list-skeleton"

interface OrganizationsPageProps {
  searchParams: Promise<{
    q?: string
    status?: string
    sortBy?: string
    sortOrder?: string
    page?: string
  }>
}

export default async function OrganizationsPage({
  searchParams
}: OrganizationsPageProps) {
  const { userId } = await auth()

  if (!userId || !(await hasPermission(userId, "view", "organizations"))) {
    redirect("/")
  }

  return (
    <div className="space-y-6 p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Organization Management
          </h1>
          <p className="text-muted-foreground">
            Manage organizations and their node officers
          </p>
        </div>

        {(await hasPermission(userId, "create", "organizations")) && (
          <Button className="ml-auto">
            <Plus className="mr-2 h-4 w-4" />
            Add Organization
          </Button>
        )}
      </div>

      <Suspense fallback={<OrganizationListSkeleton />}>
        <OrganizationListFetcher className="mt-4" searchParams={searchParams} />
      </Suspense>
    </div>
  )
}
