"use client"

import { ColumnDef, Column, Row } from "@tanstack/react-table"
import {
  SelectMetadataRecord,
  SelectOrganization,
  metadataStatusEnum
} from "@/db/schema"
import {
  ArrowUpDown,
  MoreHorizontal,
  Eye,
  Send,
  CheckCircle2,
  XCircle,
  FilePenLine
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { updateMetadataRecordStatusAction } from "@/actions/db/metadata-records-actions"
import { DataTableColumnHeader } from "../../../../components/ui/data-table-column-header"

// Define a type for the data that will be displayed in the table
// It includes the SelectMetadataRecord and the optional organization
export type MetadataRecordWithOrganization = SelectMetadataRecord & {
  organization?: SelectOrganization | null
}

async function handleAction(
  action: () => Promise<any>,
  router: ReturnType<typeof useRouter>,
  successMessage: string,
  errorMessage: string
) {
  toast.loading("Processing action...")
  const result = await action()
  toast.dismiss()
  if (result.isSuccess) {
    toast.success(successMessage)
    router.refresh() // Refresh data on the page
  } else {
    toast.error(errorMessage + (result.message ? `: ${result.message}` : ""))
  }
}

interface ColumnProps {
  onSort: (sortBy: string, sortOrder: "asc" | "desc") => void
  currentSortBy: string
  currentSortOrder: "asc" | "desc"
}

export const columns = ({
  onSort,
  currentSortBy,
  currentSortOrder
}: ColumnProps): ColumnDef<MetadataRecordWithOrganization>[] => [
  {
    accessorKey: "title",
    header: ({ column }) => (
      <DataTableColumnHeader
        title="Title"
        columnId="title"
        onSort={onSort}
        currentSortBy={currentSortBy}
        currentSortOrder={currentSortOrder}
      />
    ),
    cell: ({ row }) => {
      const title = row.getValue("title") as string
      return <div className="font-medium">{title}</div>
    }
  },
  {
    accessorKey: "organization.name",
    header: ({ column }) => (
      <DataTableColumnHeader
        title="Organization"
        columnId="organizationName"
        onSort={onSort} // Note: Server action needs to support sorting by organization.name
        currentSortBy={currentSortBy}
        currentSortOrder={currentSortOrder}
      />
    ),
    cell: ({ row }) => {
      const organization = row.original.organization
      return organization ? organization.name : "N/A"
    }
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader
        title="Status"
        columnId="status"
        onSort={onSort}
        currentSortBy={currentSortBy}
        currentSortOrder={currentSortOrder}
      />
    ),
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      let badgeVariant:
        | "default"
        | "secondary"
        | "destructive"
        | "outline"
        | "warning"
        | "success" = "secondary"
      switch (status) {
        case "Published":
          badgeVariant = "success"
          break
        case "Approved":
          badgeVariant = "default" // Consider a distinct color if available, e.g., blue
          break
        case "Pending Validation":
          badgeVariant = "warning" // Yellow/Orange
          break
        case "Needs Revision":
          badgeVariant = "warning" // Yellow/Orange, perhaps slightly different shade or icon if possible
          break
        case "Draft":
          badgeVariant = "outline"
          break
        case "Archived":
          badgeVariant = "destructive"
          break
      }
      return <Badge variant={badgeVariant as any}>{status}</Badge>
    }
  },
  {
    accessorKey: "updatedAt",
    header: ({ column }) => (
      <DataTableColumnHeader
        title="Last Updated"
        columnId="updatedAt"
        onSort={onSort}
        currentSortBy={currentSortBy}
        currentSortOrder={currentSortOrder}
      />
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue("updatedAt"))
      return (
        <div className="text-sm text-muted-foreground">
          {date.toLocaleDateString()}
        </div>
      )
    }
  },
  {
    id: "actions",
    header: () => <div className="text-right">Actions</div>,
    cell: function ActionsCell({
      row
    }: {
      row: Row<MetadataRecordWithOrganization>
    }) {
      const record = row.original
      const router = useRouter()

      return (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link href={`/metadata/${record.id}`}>
                  <Eye className="mr-2 h-4 w-4" /> View Record
                </Link>
              </DropdownMenuItem>

              {(record.status === "Draft" ||
                record.status === "Needs Revision") && (
                <DropdownMenuItem
                  onClick={() =>
                    handleAction(
                      () =>
                        updateMetadataRecordStatusAction(
                          record.id,
                          metadataStatusEnum.enumValues[2] // "Pending Validation"
                        ),
                      router,
                      "Record submitted for validation successfully.",
                      "Failed to submit record for validation."
                    )
                  }
                >
                  <Send className="mr-2 h-4 w-4" /> Submit for Validation
                </DropdownMenuItem>
              )}

              {record.status === "Needs Revision" && (
                <DropdownMenuItem
                  onClick={() => {
                    // For now, resubmit without notes. Dialog can be added later.
                    handleAction(
                      () =>
                        updateMetadataRecordStatusAction(
                          record.id,
                          metadataStatusEnum.enumValues[2] // "Pending Validation"
                        ),
                      router,
                      "Record resubmitted successfully.",
                      "Failed to resubmit record."
                    )
                  }}
                >
                  <FilePenLine className="mr-2 h-4 w-4" /> Resubmit Revision
                </DropdownMenuItem>
              )}

              {record.status === "Pending Validation" && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      // For now, approve without notes. Dialog can be added later.
                      handleAction(
                        () =>
                          updateMetadataRecordStatusAction(
                            record.id,
                            metadataStatusEnum.enumValues[3] // "Approved"
                          ),
                        router,
                        "Record approved successfully.",
                        "Failed to approve record."
                      )
                    }}
                    className="text-green-600 hover:!text-green-700 focus:!bg-green-100 focus:!text-green-700"
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" /> Approve
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      const reason = prompt(
                        "Please provide a reason for rejection (this will be logged):"
                      )
                      if (reason !== null && reason.trim() !== "") {
                        handleAction(
                          () =>
                            updateMetadataRecordStatusAction(
                              record.id,
                              metadataStatusEnum.enumValues[4], // "Needs Revision"
                              reason // Pass the reason as notes
                            ),
                          router,
                          "Record status set to 'Needs Revision'.",
                          "Failed to set record status to 'Needs Revision'."
                        )
                      } else if (reason !== null) {
                        toast.error("Rejection reason cannot be empty.")
                      }
                    }}
                    className="text-red-600 hover:!text-red-700 focus:!bg-red-100 focus:!text-red-700"
                  >
                    <XCircle className="mr-2 h-4 w-4" /> Set to Needs Revision
                  </DropdownMenuItem>
                </>
              )}
              {/* TODO: Add Edit/Delete options here based on status and permissions */}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    }
  }
]
