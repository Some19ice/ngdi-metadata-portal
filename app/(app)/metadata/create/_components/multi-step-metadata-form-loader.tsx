"use server"

import { SelectOrganization } from "@/db/schema"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { hasPermission } from "@/lib/rbac"
import { MetadataRecordFormValues } from "@/lib/validators/metadata-validator"
import MultiStepMetadataFormClient from "./multi-step-metadata-form-client"

interface MultiStepMetadataFormLoaderProps {
  availableOrganizations: SelectOrganization[]
  existingRecord?: MetadataRecordFormValues & { id?: string }
  // We could also add additional server-fetched data like metadata standards, etc.
}

export default async function MultiStepMetadataFormLoader({
  availableOrganizations,
  existingRecord
}: MultiStepMetadataFormLoaderProps) {
  // Check permissions
  const { userId } = await auth()

  if (!userId) {
    redirect("/login")
  }

  const canCreateMetadata = await hasPermission(userId, "create", "metadata")

  if (!userId || !canCreateMetadata) {
    redirect("/metadata?error=unauthorized")
  }

  // Additional server-side data fetching can happen here
  // For example, fetch metadata standards, controlled vocabularies, etc.

  return (
    <MultiStepMetadataFormClient
      availableOrganizations={availableOrganizations}
      existingRecord={existingRecord}
    />
  )
}
