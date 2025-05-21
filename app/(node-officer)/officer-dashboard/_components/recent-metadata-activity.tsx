"use server"

import Link from "next/link"
import { getRecentOrgMetadataActivityAction } from "@/actions/db/metadata-records-actions"
import { SelectMetadataRecord, SelectOrganization } from "@/db/schema"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Clock, AlertTriangle, Edit, PlusSquare } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"

interface RecentMetadataActivityProps {
  organization: SelectOrganization
  limit?: number
}

export async function RecentMetadataActivity({
  organization,
  limit = 5
}: RecentMetadataActivityProps) {
  const result = await getRecentOrgMetadataActivityAction(
    organization.id,
    limit
  )

  if (!result.isSuccess || !result.data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="mr-2 h-5 w-5" /> Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive" className="mt-0">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error Loading Recent Activity</AlertTitle>
            <AlertDescription>
              {result.message || "Could not load recent metadata activity."}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (result.data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="mr-2 h-5 w-5" /> Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No recent metadata activity found for {organization.name}.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Clock className="mr-2 h-5 w-5" /> Recent Activity
        </CardTitle>
        <CardDescription>
          Last {result.data.length} updated/created records in{" "}
          {organization.name}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {result.data.map((record: SelectMetadataRecord) => (
            <li
              key={record.id}
              className="text-sm border-b pb-2 last:border-b-0 last:pb-0"
            >
              <div className="flex justify-between items-start">
                <Link
                  href={`/app/metadata/${record.id}`}
                  className="font-medium hover:underline truncate flex-grow mr-2"
                  title={record.title}
                >
                  {record.title}
                </Link>
                <Badge
                  variant={
                    record.status === "Published" ? "default" : "secondary"
                  }
                >
                  {record.status}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground mt-1 space-x-2">
                <span>
                  Updated{" "}
                  {formatDistanceToNow(new Date(record.updatedAt), {
                    addSuffix: true
                  })}
                </span>
                {/* Add creator info here if available and desired */}
                {/* record.creator?.firstName ? `by ${record.creator.firstName}` : '' */}
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
