"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Pagination } from "@/components/ui/pagination"
import { SelectAuditLog } from "@/db/schema"
import { useRouter, useSearchParams } from "next/navigation"
import { format } from "date-fns"

interface AuditLogsTableProps {
  auditLogs: SelectAuditLog[]
  totalCount: number
  currentPage: number
  pageSize: number
  totalPages: number
}

export default function AuditLogsTable({
  auditLogs,
  totalCount,
  currentPage,
  pageSize,
  totalPages
}: AuditLogsTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", page.toString())
    router.push(`?${params.toString()}`)
  }

  const getPaginationItems = () => {
    const items = []
    const maxPagesToShow = 5 // Show 2 pages before and after current, plus current

    if (totalPages <= maxPagesToShow + 2) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        items.push(i)
      }
    } else {
      items.push(1) // Always show first page

      let start = Math.max(
        2,
        currentPage - Math.floor((maxPagesToShow - 3) / 2)
      )
      let end = Math.min(
        totalPages - 1,
        currentPage + Math.ceil((maxPagesToShow - 3) / 2)
      )

      if (currentPage - 1 <= Math.floor((maxPagesToShow - 3) / 2) + 1) {
        end = maxPagesToShow - 1
        start = 2
      }

      if (
        totalPages - currentPage <=
        Math.floor((maxPagesToShow - 3) / 2) + 1
      ) {
        start = totalPages - (maxPagesToShow - 2)
        end = totalPages - 1
      }

      if (start > 2) {
        items.push("ellipsis-start")
      }

      for (let i = start; i <= end; i++) {
        items.push(i)
      }

      if (end < totalPages - 1) {
        items.push("ellipsis-end")
      }

      items.push(totalPages) // Always show last page
    }
    return items
  }

  return (
    <div className="space-y-4">
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Action Category</TableHead>
              <TableHead>Action Type</TableHead>
              <TableHead>Target Entity</TableHead>
              <TableHead>Target ID</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {auditLogs.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  No audit logs found.
                </TableCell>
              </TableRow>
            )}
            {auditLogs.map(log => (
              <TableRow key={log.id}>
                <TableCell>
                  {format(new Date(log.timestamp), "yyyy-MM-dd HH:mm:ss")}
                </TableCell>
                <TableCell>{log.userId || "System"}</TableCell>
                <TableCell>
                  <Badge variant="outline">{log.actionCategory}</Badge>
                </TableCell>
                <TableCell>{log.actionType}</TableCell>
                <TableCell>{log.targetEntityType || "N/A"}</TableCell>
                <TableCell className="truncate max-w-xs">
                  {log.targetEntityId || "N/A"}
                </TableCell>
                <TableCell className="truncate max-w-md">
                  {typeof log.details === "string"
                    ? log.details
                    : JSON.stringify(log.details)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  )
}
