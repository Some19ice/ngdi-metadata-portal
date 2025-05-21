"use server"

import { getOrganizationUsersForNOAction } from "@/actions/db/node-officer-actions"
import OrganizationUserListClient from "./organization-user-list" // Client component
import { OrganizationUser } from "@/actions/db/node-officer-actions" // Import the type

interface OrganizationUserListFetcherProps {
  orgId: string
}

export default async function OrganizationUserListFetcher({
  orgId
}: OrganizationUserListFetcherProps) {
  if (!orgId) {
    // This case should ideally be handled by the page component before calling this fetcher.
    return <p className="text-red-500">Organization ID is required.</p>
  }

  const usersState = await getOrganizationUsersForNOAction(orgId)

  if (!usersState.isSuccess) {
    return (
      <div className="rounded-md border border-red-300 bg-red-50 p-6 text-center">
        <p className="font-semibold text-red-700">Error Loading Users</p>
        <p className="mt-2 text-sm text-red-600">{usersState.message}</p>
      </div>
    )
  }

  // Ensure data is an array, default to empty if undefined/null
  const users: OrganizationUser[] = usersState.data || []

  return <OrganizationUserListClient initialUsers={users} orgId={orgId} />
}
