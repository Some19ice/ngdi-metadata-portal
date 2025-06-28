"use server"

import { SelectOrganization, SelectMetadataRecord } from "@/db/schema"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { hasPermission } from "@/lib/rbac"
import { MetadataFormValues } from "@/lib/validators/metadata-validator"
import MultiStepMetadataFormClient from "./multi-step-metadata-form-client"
import { getCurrentUserOrganizationAction } from "@/actions/db/user-organizations-actions"

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

  // Get user's current organization context
  const currentOrgResult = await getCurrentUserOrganizationAction()
  const currentOrganization =
    currentOrgResult.isSuccess && currentOrgResult.data
      ? currentOrgResult.data.organization
      : null
  const userRole =
    currentOrgResult.isSuccess && currentOrgResult.data
      ? currentOrgResult.data.userRole
      : null

  // Check if user can create metadata based on their role
  const canCreateMetadata = await hasPermission(userId, "create", "metadata")
  const canCreateInOrg =
    userRole === "Metadata Creator" || userRole === "Node Officer"

  if (!canCreateMetadata && !canCreateInOrg) {
    redirect("/metadata?error=unauthorized")
  }

  // Additional server-side data fetching can happen here
  // For example, fetch metadata standards, controlled vocabularies, etc.

  return (
    <MultiStepMetadataFormClient
      currentUserId={userId}
      existingRecordId={existingRecordId}
      initialData={initialData}
      defaultOrganizationId={currentOrganization?.id}
      userRole={userRole}
    />
  )
}
