"use client"

import { SelectMetadataRecord } from "@/db/schema"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"
import { EyeIcon, Edit2, MoreHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"

type MetadataRecordWithOrganization = SelectMetadataRecord & {
  organization?: {
    id: string
    name: string
  } | null
}

export default function MetadataRecordsTable({
  records
}: {
  records: MetadataRecordWithOrganization[]
}) {
  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Organization</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last Updated</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map(record => (
            <TableRow key={record.id}>
              <TableCell className="font-medium">
                <Link
                  href={`/metadata/${record.id}`}
                  className="hover:text-primary hover:underline"
                >
                  {record.title}
                </Link>
              </TableCell>
              <TableCell>
                {record.organization?.name || "Unknown Organization"}
              </TableCell>
              <TableCell>
                <StatusBadge status={record.status} />
              </TableCell>
              <TableCell>
                {record.updatedAt
                  ? formatDistanceToNow(new Date(record.updatedAt), {
                      addSuffix: true
                    })
                  : "Unknown"}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end space-x-2">
                  <Link href={`/metadata/${record.id}`}>
                    <Button variant="ghost" size="icon">
                      <EyeIcon className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href={`/metadata/${record.id}/edit`}>
                    <Button variant="ghost" size="icon">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Approve</DropdownMenuItem>
                      <DropdownMenuItem>Reject</DropdownMenuItem>
                      <DropdownMenuItem>Request Revisions</DropdownMenuItem>
                      <DropdownMenuItem>Publish</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function StatusBadge({ status }: { status: SelectMetadataRecord["status"] }) {
  const getVariant = () => {
    switch (status) {
      case "Published":
        return "success"
      case "Approved":
        return "default"
      case "Pending Validation":
        return "warning"
      case "Needs Revision":
        return "destructive"
      case "Draft":
        return "secondary"
      default:
        return "outline"
    }
  }

  return <Badge variant={getVariant() as any}>{status}</Badge>
}
