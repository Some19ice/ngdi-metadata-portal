"use server"

import { Suspense } from "react"
import { getNodeOfficerManagedOrganizationsAction } from "@/actions/db/user-organizations-actions"
import { getMetadataRecordCountsForOrgByStatusAction } from "@/actions/db/metadata-records-actions"
import { SelectOrganization, metadataStatusEnum } from "@/db/schema"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  LibrarySquare,
  AlertTriangle,
  Building,
  ListChecks,
  Edit3,
  CheckSquare,
  ChevronDownSquare,
  Clock,
  Users,
  PlusSquare
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import OrganizationSelector from "./_components/organization-selector"
import { RecentMetadataActivity } from "./_components/recent-metadata-activity"
import StatCard from "./_components/stat-card"
import { ManagedUsersStatFetcher } from "./_components/managed-users-stat-fetcher"

// StatCard similar to Admin Dashboard, but can be simpler or adapted
/*
async function StatCard({ ... }) { ... }
*/
// The StatCard component definition has been moved to _components/stat-card.tsx

interface OrgDashboardStatsProps {
  organization: SelectOrganization
}

// Define the expected type for items in result.data
interface StatusCount {
  status: (typeof metadataStatusEnum.enumValues)[number]
  count: number
}

async function OrgDashboardStatsFetcher({
  organization
}: OrgDashboardStatsProps) {
  const result = await getMetadataRecordCountsForOrgByStatusAction(
    organization.id
  )

  if (!result.isSuccess || !result.data) {
    return (
      <div className="col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>
            Error Loading Statistics for {organization.name}
          </AlertTitle>
          <AlertDescription>
            {result.message || "Failed to load details."}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const typedData: StatusCount[] = result.data as StatusCount[] // Type assertion if needed, or ensure action returns correctly typed data

  const totalRecords = typedData.reduce(
    (sum: number, item: StatusCount) => sum + item.count,
    0
  )
  const pendingValidationCount =
    typedData.find((s: StatusCount) => s.status === "Pending Validation")
      ?.count || 0
  const needsRevisionCount =
    typedData.find((s: StatusCount) => s.status === "Needs Revision")?.count ||
    0

  return (
    <>
      <StatCard
        title="Total Metadata Records"
        value={totalRecords}
        icon={LibrarySquare}
        description={`For ${organization.name}`}
      />
      <StatCard
        title="Pending Validation"
        value={pendingValidationCount}
        icon={ListChecks}
        description="Records awaiting your approval"
        href={`/app/metadata/search?organizationId=${organization.id}&status=Pending+Validation`}
      />
      <StatCard
        title="Needs Revision"
        value={needsRevisionCount}
        icon={Edit3}
        description="Records that require changes"
        href={`/app/metadata/search?organizationId=${organization.id}&status=Needs+Revision`}
      />
      {typedData
        .filter(
          (item: StatusCount) =>
            item.status !== "Pending Validation" &&
            item.status !== "Needs Revision"
        ) // Avoid duplicating cards above
        .map((item: StatusCount) => (
          <StatCard
            key={item.status}
            title={`${item.status} Records`}
            value={item.count}
            icon={
              item.status === "Approved" || item.status === "Published"
                ? CheckSquare
                : LibrarySquare
            }
            description={`Status of records in ${organization.name}`}
          />
        ))}
      <ManagedUsersStatFetcher organization={organization} />
    </>
  )
}

export default async function NodeOfficerDashboardPage({
  searchParams
}: {
  searchParams: { orgId?: string }
}) {
  const orgsResult = await getNodeOfficerManagedOrganizationsAction()

  if (!orgsResult.isSuccess) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error Accessing Organizations</AlertTitle>
        <AlertDescription>{orgsResult.message}</AlertDescription>
      </Alert>
    )
  }

  if (!orgsResult.data || orgsResult.data.length === 0) {
    return (
      <Alert>
        <Building className="h-4 w-4" />
        <AlertTitle>No Managed Organizations</AlertTitle>
        <AlertDescription>
          You are not currently assigned as a Node Officer for any organization.
          If you believe this is an error, please contact a system
          administrator.
        </AlertDescription>
      </Alert>
    )
  }

  const managedOrganizations = orgsResult.data
  let currentOrganization: SelectOrganization | undefined =
    managedOrganizations[0]

  if (managedOrganizations.length > 1) {
    if (searchParams.orgId) {
      currentOrganization = managedOrganizations.find(
        org => org.id === searchParams.orgId
      )
      // Fallback to the first org if the orgId from params is invalid or not managed by the user
      if (!currentOrganization) {
        console.warn(
          `Node Officer does not manage orgId: ${searchParams.orgId} or it is invalid. Defaulting to first managed org.`
        )
        currentOrganization = managedOrganizations[0]
      }
    } else {
      // If multiple orgs and no orgId in params, default to first one.
      // The selector will allow changing.
      currentOrganization = managedOrganizations[0]
    }
  }

  if (!currentOrganization) {
    // This case should ideally not be reached if managedOrganizations.length > 0
    // But as a safeguard:
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Organization Not Selected</AlertTitle>
        <AlertDescription>
          Could not determine the organization to display. Please select one if
          available or contact support.
        </AlertDescription>
      </Alert>
    )
  }

  // Key for Suspense should depend on the current organization ID
  const suspenseKey = `stats-${currentOrganization.id}`
  const recentActivityKey = `recent-activity-${currentOrganization.id}` // Key for recent activity

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Node Officer Dashboard
          </h1>
          <CardDescription className="mt-1">
            Overview for {currentOrganization.name}
          </CardDescription>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
          <Link
            href={`/app/metadata/create?organizationId=${currentOrganization.id}`}
          >
            <Button variant="default">
              <PlusSquare className="mr-2 h-4 w-4" /> Create New Record
            </Button>
          </Link>
          <Link
            href={`/app/metadata/search?organizationId=${currentOrganization.id}`}
          >
            <Button variant="outline">
              <LibrarySquare className="mr-2 h-4 w-4" /> View All Records for{" "}
              {currentOrganization.name}
            </Button>
          </Link>
        </div>
      </div>

      {managedOrganizations.length > 1 && (
        <OrganizationSelector
          organizations={managedOrganizations}
          currentOrgId={currentOrganization.id}
        />
      )}

      <section>
        <h2 className="text-xl font-semibold mb-3">
          Organization Statistics for {currentOrganization.name}
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <Suspense
            key={suspenseKey} // Use the key here
            fallback={
              <>
                <StatCard
                  title="Total Metadata Records"
                  icon={LibrarySquare}
                  isLoading
                  description={`For ${currentOrganization.name}`}
                />
                <StatCard
                  title="Pending Validation"
                  icon={ListChecks}
                  isLoading
                  description="Records awaiting your approval"
                />
                <StatCard
                  title="Needs Revision"
                  icon={Edit3}
                  isLoading
                  description="Records that require changes"
                />
                <StatCard
                  title="Published Records"
                  icon={CheckSquare}
                  isLoading
                  description={`Status of records in ${currentOrganization.name}`}
                />
                <StatCard
                  title="Managed Users"
                  icon={Users}
                  isLoading
                  description={`Creators & Approvers in ${currentOrganization.name}`}
                />
              </>
            }
          >
            <OrgDashboardStatsFetcher organization={currentOrganization} />
          </Suspense>
        </div>
      </section>

      <section>
        <Suspense key={recentActivityKey} fallback={<RecentActivitySkeleton />}>
          <RecentMetadataActivity organization={currentOrganization} />
        </Suspense>
      </section>

      {/* Placeholder for future sections like User Management and Reports */}
      <section>
        <h2 className="text-xl font-semibold mb-3">
          Manage Organization Users
        </h2>
        <Card>
          <CardContent className="pt-6">
            <Alert className="border-l-sky-500 border-l-4">
              <ChevronDownSquare className="h-4 w-4" />
              <AlertTitle>Coming Soon</AlertTitle>
              <AlertDescription>
                Functionality to manage Metadata Creators and Approvers for your
                organization will be available here.
                <Link
                  href={`/app/(node-officer)/organization-users?orgId=${currentOrganization.id}`}
                  className="block mt-2"
                >
                  <Button variant="default" size="sm">
                    Manage Users for {currentOrganization.name}
                  </Button>
                </Link>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-3">Reporting</h2>
        <Card>
          <CardContent className="pt-6">
            <Alert className="border-l-sky-500 border-l-4">
              <ChevronDownSquare className="h-4 w-4" />
              <AlertTitle>Coming Soon</AlertTitle>
              <AlertDescription>
                Basic reporting capabilities for your organization's metadata
                will be available here.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

function RecentActivitySkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Clock className="mr-2 h-5 w-5 text-muted-foreground" />
          <Skeleton className="h-6 w-40" />
        </CardTitle>
        <Skeleton className="h-4 w-60" />
      </CardHeader>
      <CardContent className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="text-sm border-b pb-2 last:border-b-0 last:pb-0"
          >
            <div className="flex justify-between items-start">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-5 w-20" />
            </div>
            <Skeleton className="h-4 w-1/2 mt-1" />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
