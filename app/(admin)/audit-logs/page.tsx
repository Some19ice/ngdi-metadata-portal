"use server"

import { Suspense } from "react"
import AuditLogsTableFetcher from "./_components/audit-logs-table-fetcher"
import { AuditLogsTableSkeleton } from "./_components/audit-logs-table-skeleton"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { DatePickerWithRange } from "@/components/ui/date-range-picker" // Assuming this exists or will be created
import {
  auditLogActionCategoryEnum,
  auditLogTargetEntityTypeEnum
} from "@/db/schema/audit-logs-schema"

export default async function AdminAuditLogsPage({
  searchParams
}: {
  searchParams: Promise<{
    query?: string
    actionCategory?: string
    actionType?: string
    userId?: string
    targetEntityType?: string
    targetEntityId?: string
    dateFrom?: string
    dateTo?: string
    page?: string
    pageSize?: string
  }>
}) {
  const params = await searchParams
  const currentPage = Number(params?.page) || 1
  const currentPageSize = Number(params?.pageSize) || 20

  // Define the enum values directly since we can't access .enumValues in a server component
  const actionCategories = [
    "Authentication",
    "UserManagement",
    "OrganizationManagement",
    "PermissionManagement",
    "SettingsManagement",
    "MetadataWorkflow",
    "SecurityEvent",
    "SystemEvent",
    "Other"
  ]

  const targetEntityTypes = [
    "User",
    "Organization",
    "Role",
    "Permission",
    "SystemSetting",
    "MetadataRecord",
    "System",
    "None"
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Audit Logs</h1>
        <p className="text-muted-foreground">
          Review system and user activities across the platform.
        </p>
      </div>

      {/* Filters Section */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 items-end">
        <Input
          placeholder="Search by User ID or Target ID..."
          defaultValue={params?.query || ""}
          // onChange={(e) => {/* handle filter change and update searchParams */}}
        />
        <Select
          defaultValue={params?.actionCategory || "all"}
          // onValueChange={(value) => {/* handle filter change */}}
        >
          <SelectTrigger>
            <SelectValue placeholder="Filter by Action Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {actionCategories.map(category => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          defaultValue={params?.targetEntityType || "all"}
          // onValueChange={(value) => {/* handle filter change */}}
        >
          <SelectTrigger>
            <SelectValue placeholder="Filter by Target Entity Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Entity Types</SelectItem>
            {targetEntityTypes.map(type => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div>
          <DatePickerWithRange
          // onUpdate={(values) => {/* handle date range change */}}
          // initialDateFrom={params?.dateFrom}
          // initialDateTo={params?.dateTo}
          // align="start"
          // locale="en-GB"
          // showCompare={false}
          />
        </div>
      </div>

      <Suspense
        key={`${params?.query}-${params?.actionCategory}-${params?.targetEntityType}-${params?.dateFrom}-${params?.dateTo}-${currentPage}-${currentPageSize}`}
        fallback={<AuditLogsTableSkeleton pageSize={currentPageSize} />}
      >
        <AuditLogsTableFetcher
          query={params?.query}
          actionCategory={
            params?.actionCategory === "all"
              ? undefined
              : (params?.actionCategory as any)
          }
          actionType={params?.actionType}
          userId={params?.userId}
          targetEntityType={
            params?.targetEntityType === "all"
              ? undefined
              : (params?.targetEntityType as any)
          }
          targetEntityId={params?.targetEntityId}
          dateFrom={params?.dateFrom}
          dateTo={params?.dateTo}
          page={currentPage}
          pageSize={currentPageSize}
        />
      </Suspense>

      {/* Basic Pagination Placeholder - actual pagination will be in AuditLogsTableFetcher or its child */}
      {/* <div className="flex items-center justify-end space-x-2 py-4">
        <Button variant="outline" size="sm" disabled={currentPage <= 1}>
          Previous
        </Button>
        <Button variant="outline" size="sm" > 
          Next
        </Button>
      </div> */}
    </div>
  )
}
