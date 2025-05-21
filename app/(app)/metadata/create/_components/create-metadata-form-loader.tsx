"use server"

import { SelectOrganization } from "@/db/schema"
// import { getMetadataStandardsAction } from "@/actions/db/metadata-standards-actions"; // Example for later
import CreateMetadataFormClient from "./create-metadata-form-client" // This client component will contain the actual form

interface CreateMetadataFormLoaderProps {
  availableOrganizations: SelectOrganization[]
  // We could also pass other pre-fetched data like metadata standards, controlled vocabularies, etc.
}

export default async function CreateMetadataFormLoader({
  availableOrganizations
}: CreateMetadataFormLoaderProps) {
  // Fetch any additional server-side data needed for the form here.
  // For example, a list of metadata standards:
  // const standardsAction = await getMetadataStandardsAction();
  // const metadataStandards = standardsAction.isSuccess && standardsAction.data ? standardsAction.data : [];

  // Then pass everything to the client form component.
  return (
    <CreateMetadataFormClient
      availableOrganizations={availableOrganizations}
      // metadataStandards={metadataStandards}
    />
  )
}
