"use server"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Building2,
  Calendar,
  Edit,
  ExternalLink,
  Globe,
  Mail,
  MapPin,
  Phone,
  User,
  Users,
  BarChart3,
  FileText,
  Clock,
  TrendingUp
} from "lucide-react"
import {
  getOrganizationByIdAction,
  getOrganizationStatisticsAction
} from "@/actions/db/organizations-actions"
import StatusBadge from "../../../../(admin)/organizations/_components/enhanced/status-badge"
import { notFound } from "next/navigation"
import { clerkClient } from "@clerk/nextjs/server"

interface OrganizationDetailsProps {
  orgId: string
}

export default async function OrganizationDetails({
  orgId
}: OrganizationDetailsProps) {
  // Fetch organization data
  const orgResult = await getOrganizationByIdAction(orgId)
  if (!orgResult.isSuccess || !orgResult.data) {
    notFound()
  }

  const organization = orgResult.data

  // Fetch organization statistics
  const statsResult = await getOrganizationStatisticsAction(orgId)
  const stats = statsResult.isSuccess ? statsResult.data : null

  // Get Node Officer details if assigned
  let nodeOfficerDetails = null
  if (organization.nodeOfficerId) {
    try {
      const client = await clerkClient()
      const user = await client.users.getUser(organization.nodeOfficerId)
      nodeOfficerDetails = {
        name:
          `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Unknown",
        email: user.emailAddresses[0]?.emailAddress || "No email available"
      }
    } catch (error) {
      console.error("Error fetching node officer details:", error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Organization Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {organization.name}
              </h1>
              {organization.description && (
                <p className="text-gray-600 max-w-2xl">
                  {organization.description}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <StatusBadge status={organization.status} />
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalMembers || 0}</div>
            <p className="text-xs text-muted-foreground">Active members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Metadata Records
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.metadataMetrics.totalRecords || 0}
            </div>
            <p className="text-xs text-muted-foreground">Published records</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Contributors
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.activityMetrics.activeContributors || 0}
            </div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Health Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.healthScore.score || 0}
            </div>
            <p className="text-xs text-muted-foreground">Overall rating</p>
          </CardContent>
        </Card>
      </div>

      {/* Organization Details and Node Officer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Organization Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building2 className="h-5 w-5" />
              <span>Organization Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {organization.primaryContactEmail && (
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Contact Email
                  </p>
                  <p className="text-sm text-gray-900">
                    {organization.primaryContactEmail}
                  </p>
                </div>
              </div>
            )}

            {organization.primaryContactPhone && (
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Contact Phone
                  </p>
                  <p className="text-sm text-gray-900">
                    {organization.primaryContactPhone}
                  </p>
                </div>
              </div>
            )}

            {organization.websiteUrl && (
              <div className="flex items-center space-x-3">
                <Globe className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Website</p>
                  <a
                    href={organization.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                  >
                    {organization.websiteUrl}
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </div>
              </div>
            )}

            {organization.address && (
              <div className="flex items-center space-x-3">
                <MapPin className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Address</p>
                  <p className="text-sm text-gray-900">
                    {organization.address}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center space-x-3">
              <Calendar className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-700">Created</p>
                <p className="text-sm text-gray-900">
                  {new Date(organization.createdAt).toLocaleDateString(
                    "en-US",
                    {
                      year: "numeric",
                      month: "long",
                      day: "numeric"
                    }
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Node Officer Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Node Officer</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {nodeOfficerDetails ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {nodeOfficerDetails.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      {nodeOfficerDetails.email}
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full">
                  <Mail className="h-4 w-4 mr-2" />
                  Contact Node Officer
                </Button>
              </div>
            ) : (
              <div className="text-center py-6">
                <User className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">
                  No Node Officer assigned
                </p>
                <Button variant="outline" size="sm" className="mt-3">
                  Assign Node Officer
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Recent Activity</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="h-6 w-6 bg-green-100 rounded-full flex items-center justify-center">
                <User className="h-3 w-3 text-green-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900">
                    Organization created
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(organization.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <p className="text-sm text-gray-600">
                  Organization {organization.name} was created and is ready for
                  use
                </p>
              </div>
            </div>

            {organization.nodeOfficerId && (
              <div className="flex items-start space-x-3">
                <div className="h-6 w-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="h-3 w-3 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">
                      Node Officer assigned
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(organization.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <p className="text-sm text-gray-600">
                    {nodeOfficerDetails?.name} was assigned as Node Officer
                  </p>
                </div>
              </div>
            )}

            <div className="pt-2">
              <Button variant="outline" size="sm">
                View Full Activity Log
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
