"use server"

import { SelectOrganization, SelectMetadataRecord } from "@/db/schema"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { hasPermission } from "@/lib/rbac"
import { MetadataFormValues } from "@/lib/validators/metadata-validator"
import MultiStepMetadataFormClient from "./multi-step-metadata-form-client"

interface MultiStepMetadataFormLoaderProps {
  existingRecordId?: string | null
  initialData?: Partial<SelectMetadataRecord> | null
}

export default async function MultiStepMetadataFormLoader({
  existingRecordId,
  initialData
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
      currentUserId={userId}
      existingRecordId={existingRecordId}
      initialData={initialData}
    />
  )
}
