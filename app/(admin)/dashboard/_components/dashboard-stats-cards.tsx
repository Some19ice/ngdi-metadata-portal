"use server"

import { getDashboardStatsAction } from "@/actions/db/admin-dashboard-actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  AlertTriangle,
  Building,
  CheckSquare,
  ClipboardCheck,
  FileText,
  PenBox,
  Users
} from "lucide-react"

function StatCard({
  title,
  value,
  icon: Icon,
  description
}: {
  title: string
  value: string | number
  icon: React.ElementType
  description?: string
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  )
}

export default async function DashboardStatsCards() {
  const result = await getDashboardStatsAction()

  if (!result.isSuccess || !result.data) {
    return (
      <div className="col-span-full">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Loading Dashboard Stats</AlertTitle>
          <AlertDescription>
            {result.message || "Failed to load statistics."}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const { userStats, organizationCount, metadataStats } = result.data

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <StatCard
        title="Total Users"
        value={userStats.total}
        icon={Users}
        description="Registered platform users"
      />
      <StatCard
        title="Total Organizations"
        value={organizationCount}
        icon={Building}
        description="Registered organizations/nodes"
      />
      <StatCard
        title="Total Metadata Records"
        value={metadataStats.total}
        icon={FileText}
        description="All metadata records in the system"
      />
      <StatCard
        title="Published Records"
        value={metadataStats.byStatus.published}
        icon={CheckSquare}
        description="Records published and publicly available"
      />
      <StatCard
        title="Approved Records"
        value={metadataStats.byStatus.approved}
        icon={ClipboardCheck}
        description="Records approved by Node Officers"
      />
      <StatCard
        title="Pending Validation"
        value={metadataStats.byStatus.pendingValidation}
        icon={AlertTriangle}
        description="Records awaiting Node Officer review"
      />
      <StatCard
        title="Draft Records"
        value={metadataStats.byStatus.draft}
        icon={FileText}
        description="Records in draft status"
      />
      <StatCard
        title="Needs Revision"
        value={metadataStats.byStatus.needsRevision}
        icon={PenBox}
        description="Records that require changes"
      />
    </div>
  )
}
