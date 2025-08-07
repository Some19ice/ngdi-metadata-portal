"use server"

import { Suspense } from "react"
import OrganizationUserListSkeleton from "./_components/organization-user-list-skeleton"
import OrganizationUserListFetcher from "./_components/organization-user-list-fetcher"
import { getOrganizationByIdAction } from "@/actions/db/organizations-actions"
import { UserManagementErrorBoundary } from "../_components/node-officer-error-boundary"

interface NodeOfficerUsersPageProps {
  searchParams: Promise<{
    orgId?: string
  }>
}

export default async function NodeOfficerUsersPage({
  searchParams
}: NodeOfficerUsersPageProps) {
  const params = await searchParams
  const { orgId } = params

  if (!orgId) {
    return (
      <div>
        <h1 className="mb-6 text-3xl font-bold tracking-tight text-slate-800">
          User Management
        </h1>
        <p className="text-red-600">
          Organization ID is missing. Please select an organization from the
          Node Officer dashboard or layout.
        </p>
      </div>
    )
  }

  // Fetch organization details to display its name
  const orgDetailsState = await getOrganizationByIdAction(orgId)
  const orgName =
    orgDetailsState.isSuccess && orgDetailsState.data
      ? orgDetailsState.data.name
      : "Selected Organization"

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-slate-800">
          User Management
        </h1>
        <p className="text-slate-600">
          Managing users for: <span className="font-semibold">{orgName}</span>
        </p>
        {/* <p className=\"text-xs text-slate-400\">(ID: {orgId})</p> */}
      </div>

      <UserManagementErrorBoundary organizationId={orgId}>
        <Suspense fallback={<OrganizationUserListSkeleton />}>
          <OrganizationUserListFetcher orgId={orgId} />
        </Suspense>
      </UserManagementErrorBoundary>
    </div>
  )
}

/*
// This fetcher component will be created in a separate file later
// in ./_components/organization-user-list-fetcher.tsx
async function OrganizationUserListFetcher({ orgId }: { orgId: string }) {
  const usersState = await getOrganizationUsersForNOAction(orgId)

  if (!usersState.isSuccess) {
    return <p className=\"text-red-600\">Error: {usersState.message}</p>
  }

  return <OrganizationUserList users={usersState.data || []} orgId={orgId} />
}
*/
