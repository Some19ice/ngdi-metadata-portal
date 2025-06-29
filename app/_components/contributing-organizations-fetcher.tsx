"use server"

import { getPublicOrganizationsAction } from "@/actions/db/organizations-actions"
import { ContributingOrganizations } from "./contributing-organizations"

export async function ContributingOrganizationsFetcher() {
  const { data: organizations } = await getPublicOrganizationsAction()

  return <ContributingOrganizations organizations={organizations || []} />
}
