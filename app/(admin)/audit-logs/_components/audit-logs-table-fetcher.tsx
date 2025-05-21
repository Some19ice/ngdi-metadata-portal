"use server"

import {
  getAuditLogsAction,
  GetAuditLogsParams
} from "@/actions/audit-log-actions"
import AuditLogsTable from "./audit-logs-table"
import { ITEMS_PER_PAGE } from "@/lib/constants"

interface AuditLogsTableFetcherProps extends GetAuditLogsParams {}

export default async function AuditLogsTableFetcher(
  props: AuditLogsTableFetcherProps
) {
  const {
    query,
    actionCategory,
    actionType,
    userId,
    targetEntityType,
    targetEntityId,
    dateFrom,
    dateTo,
    page,
    pageSize = ITEMS_PER_PAGE
  } = props

  const result = await getAuditLogsAction({
    query,
    actionCategory,
    actionType,
    userId,
    targetEntityType,
    targetEntityId,
    dateFrom,
    dateTo,
    page,
    pageSize
  })

  if (!result.isSuccess || !result.data) {
    return (
      <div className="text-red-500">
        Failed to load audit logs: {result.message}
      </div>
    )
  }

  const { logs: auditLogs, totalLogs: totalCount, totalPages } = result.data

  return (
    <AuditLogsTable
      auditLogs={auditLogs}
      totalCount={totalCount}
      currentPage={page || 1}
      pageSize={pageSize}
      totalPages={totalPages}
    />
  )
}
