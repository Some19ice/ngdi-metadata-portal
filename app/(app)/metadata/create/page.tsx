"use server"

import { Suspense } from "react"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { getOrganizationsAction } from "@/actions/db/organizations-actions"
import { getManagedOrganizationsAction } from "@/actions/db/organizations-actions"
import { SelectOrganization } from "@/db/schema"
import { hasPermission } from "@/lib/rbac"
import MultiStepMetadataFormLoader from "./_components/multi-step-metadata-form-loader"

export default async function CreateMetadataPage() {
  const authData = await auth()
  const userId = authData.userId

  if (!userId) {
    redirect("/login")
  }

  let availableOrganizations: SelectOrganization[] = []
  const isAdmin = await hasPermission(userId, "manage", "organizations")

  if (isAdmin) {
    const orgsAction = await getOrganizationsAction()
    if (orgsAction.isSuccess && orgsAction.data) {
      availableOrganizations = orgsAction.data
    }
  } else {
    const managedOrgsAction = await getManagedOrganizationsAction()
    if (managedOrgsAction.isSuccess && managedOrgsAction.data) {
      availableOrganizations = managedOrgsAction.data
    }
  }

  const canCreateGlobal = await hasPermission(userId, "create", "metadata")

  if (availableOrganizations.length === 0 && !canCreateGlobal && !isAdmin) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold">Cannot Create Metadata Record</h1>
        <p className="text-muted-foreground mt-2">
          You are not currently authorized to create metadata records for any
          organization, or no organizations are available for you to select.
          Please contact an administrator.
        </p>
      </div>
    )
  }
  // If canCreateGlobal is true, even with no specific availableOrganizations (e.g. user is creator but not NO),
  // the form should ideally allow selecting an organization if the system supports it.
  // Or, if it's an admin, they can select from all orgs (fetched by getOrganizationsAction if isAdmin path was taken).
  // If availableOrganizations is empty but canCreateGlobal is true, the form loader will need to handle this.

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Create New Metadata Record
        </h1>
        <p className="text-muted-foreground">
          Fill in the details below to register a new geospatial metadata
          record. You can save your progress as a draft at any time.
        </p>
      </div>
      <Suspense fallback={<CreateFormSkeleton />}>
        <MultiStepMetadataFormLoader
          availableOrganizations={availableOrganizations}
        />
      </Suspense>
    </div>
  )
}

function CreateFormSkeleton() {
  return (
    <div className="space-y-6">
      {/* Step indicator skeleton */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex flex-col items-center w-full relative">
              <div className="w-10 h-10 rounded-full bg-muted animate-pulse"></div>
              <div className="mt-2 h-4 w-16 bg-muted rounded animate-pulse"></div>
              {i < 5 && (
                <div className="absolute top-5 left-1/2 w-full h-0.5 bg-muted"></div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Form content skeleton */}
      <div className="p-6 border rounded-lg shadow-sm bg-card">
        <div className="h-8 w-1/3 bg-muted rounded animate-pulse mb-6"></div>
        <div className="space-y-6">
          {[...Array(4)].map((_, fieldIndex) => (
            <div key={fieldIndex} className="space-y-2">
              <div className="h-4 w-1/4 bg-muted rounded animate-pulse"></div>
              <div className="h-10 w-full bg-muted rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Button area skeleton */}
      <div className="flex justify-between items-center pt-6">
        <div className="h-10 w-24 bg-muted rounded animate-pulse"></div>
        <div className="flex gap-3">
          <div className="h-10 w-28 bg-muted rounded animate-pulse"></div>
          <div className="h-10 w-24 bg-primary/70 rounded animate-pulse"></div>
        </div>
      </div>
    </div>
  )
}
