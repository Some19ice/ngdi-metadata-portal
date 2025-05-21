"use server"

import { getOrganizationsAction } from "@/actions/db/organizations-actions"
import OrganizationList from "./organization-list"

export async function OrganizationListFetcher() {
  const result = await getOrganizationsAction({ limit: 50 })

  if (!result.isSuccess || !result.data) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-700">
        <p>
          Error fetching organizations: {result.message || "Unknown error."}
        </p>
      </div>
    )
  }

  return <OrganizationList organizations={result.data} />
}
