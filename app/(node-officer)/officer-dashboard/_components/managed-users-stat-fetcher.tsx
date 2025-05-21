"use server"

import Link from "next/link"
import { getOrganizationUsersForNOAction } from "@/actions/db/node-officer-actions"
import { SelectOrganization } from "@/db/schema"
import StatCard from "./stat-card"
import { Users } from "lucide-react"

interface ManagedUsersStatFetcherProps {
  organization: SelectOrganization
}

export async function ManagedUsersStatFetcher({
  organization
}: ManagedUsersStatFetcherProps) {
  const result = await getOrganizationUsersForNOAction(organization.id)

  if (!result.isSuccess || !result.data) {
    return (
      <StatCard
        title="Managed Users"
        icon={Users}
        error={result.message || "Failed to load user counts."}
        description={`For ${organization.name}`}
        href={`/app/(node-officer)/organization-users?orgId=${organization.id}`}
      />
    )
  }

  const managedUserCount =
    (result.data.counts.metadataCreator || 0) +
    (result.data.counts.metadataApprover || 0)

  return (
    <StatCard
      title="Managed Users"
      value={managedUserCount}
      icon={Users}
      description={`Creators & Approvers in ${organization.name}`}
      href={`/app/(node-officer)/organization-users?orgId=${organization.id}`}
    />
  )
}
