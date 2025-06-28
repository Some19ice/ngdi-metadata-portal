"use server"

import { Suspense } from "react"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { hasPermission } from "@/lib/rbac"
import OrganizationListFetcher from "@/app/(admin)/organizations/_components/enhanced/organization-list-fetcher"
import OrganizationListSkeleton from "@/app/(admin)/organizations/_components/enhanced/organization-list-skeleton"
import CreateOrganizationDialog from "@/app/(admin)/organizations/_components/create-organization-dialog"

interface OrganizationsPageProps {
  searchParams: Promise<{
    q?: string
    status?: string
    sortBy?: string
    sortOrder?: string
    page?: string
  }>
}

export default async function AdminOrganizationsPage({
  searchParams
}: OrganizationsPageProps) {
  const { userId } = await auth()
  if (!userId) {
    redirect("/login")
  }

  const canAccessAdminDashboard = await hasPermission(
    userId,
    "access",
    "admin_dashboard"
  )

  if (!canAccessAdminDashboard) {
    redirect("/unauthorized")
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Organization Management
          </h1>
          <p className="text-muted-foreground">
            Manage organizations and their node officers
          </p>
        </div>

        {(await hasPermission(userId, "manage", "organizations")) && (
          <CreateOrganizationDialog />
        )}
      </div>

      <Suspense fallback={<OrganizationListSkeleton />}>
        <OrganizationListFetcher searchParams={searchParams} />
      </Suspense>
    </div>
  )
}
