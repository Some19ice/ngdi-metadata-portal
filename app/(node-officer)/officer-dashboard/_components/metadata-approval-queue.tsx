"use client"

import { useState, useTransition } from "react"
import { SelectMetadataRecord } from "@/db/schema"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import {
  CheckCircle,
  XCircle,
  Eye,
  MoreHorizontal,
  Clock,
  AlertTriangle,
  Filter,
  Search
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import {
  approveMetadataAction,
  rejectMetadataAction
} from "@/actions/db/metadata-workflow-actions"

interface MetadataApprovalQueueProps {
  initialRecords: SelectMetadataRecord[]
  organizationId: string
}

export default function MetadataApprovalQueue({
  initialRecords,
  organizationId
}: MetadataApprovalQueueProps) {
  const [records, setRecords] = useState(initialRecords)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("submittedAt")
  const [isPending, startTransition] = useTransition()

  const filteredRecords = records
    .filter(record => {
      const matchesSearch =
        record.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.abstract?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus =
        statusFilter === "all" || record.status === statusFilter
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "submittedAt":
          return (
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          )
        case "title":
          return a.title.localeCompare(b.title)
        case "priority":
          // Assuming priority logic: Pending Validation > Needs Revision > others
          const priorityOrder = { "Pending Validation": 3, "Needs Revision": 2 }
          return (
            (priorityOrder[b.status as keyof typeof priorityOrder] || 1) -
            (priorityOrder[a.status as keyof typeof priorityOrder] || 1)
          )
        default:
          return 0
      }
    })

  const handleApprove = async (recordId: string) => {
    startTransition(async () => {
      try {
        const result = await approveMetadataAction(recordId)
        if (result.isSuccess) {
          setRecords(prev => prev.filter(r => r.id !== recordId))
          toast.success("Metadata record approved successfully")
        } else {
          toast.error(result.message || "Failed to approve record")
        }
      } catch (error) {
        toast.error("An error occurred while approving the record")
      }
    })
  }

  const handleReject = async (
    recordId: string,
    reason: string = "Requires revision"
  ) => {
    startTransition(async () => {
      try {
        const result = await rejectMetadataAction(recordId, reason)
        if (result.isSuccess) {
          setRecords(prev =>
            prev.map(r =>
              r.id === recordId
                ? { ...r, status: "Needs Revision" as const }
                : r
            )
          )
          toast.success("Metadata record sent back for revision")
        } else {
          toast.error(result.message || "Failed to reject record")
        }
      } catch (error) {
        toast.error("An error occurred while rejecting the record")
      }
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Pending Validation":
        return (
          <Badge variant="secondary">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        )
      case "Needs Revision":
        return (
          <Badge variant="destructive">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Needs Revision
          </Badge>
        )
      case "Approved":
        return (
          <Badge variant="default">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getDaysAgo = (date: Date) => {
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - new Date(date).getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays === 1 ? "1 day ago" : `${diffDays} days ago`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          Metadata Approval Queue
        </CardTitle>
        <CardDescription>
          Review and approve metadata records submitted by your organization's
          creators
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by title or abstract..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Pending Validation">
                Pending Validation
              </SelectItem>
              <SelectItem value="Needs Revision">Needs Revision</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="submittedAt">Latest First</SelectItem>
              <SelectItem value="title">Title A-Z</SelectItem>
              <SelectItem value="priority">Priority</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Records Table */}
        {filteredRecords.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm || statusFilter !== "all"
              ? "No records match your filters"
              : "No records pending approval"}
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Creator</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.map(record => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{record.title}</div>
                        {record.abstract && (
                          <div className="text-sm text-muted-foreground truncate max-w-[300px]">
                            {record.abstract}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(record.status)}</TableCell>
                    <TableCell>
                      <div className="text-sm">{record.creatorUserId}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {getDaysAgo(record.updatedAt)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/app/metadata/${record.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            Review
                          </Button>
                        </Link>
                        {record.status === "Pending Validation" && (
                          <>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleApprove(record.id)}
                              disabled={isPending}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleReject(record.id, "Requires revision")
                                  }
                                  className="text-destructive"
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Request Revision
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
