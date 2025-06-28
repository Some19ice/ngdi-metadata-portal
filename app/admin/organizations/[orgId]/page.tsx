"use server"

import { Suspense } from "react"
import { notFound } from "next/navigation"
import { hasPermission } from "@/lib/rbac"
import { auth } from "@clerk/nextjs/server"
import {
  getOrganizationByIdAction,
  getOrganizationStatisticsAction
} from "@/actions/db/organizations-actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
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
import Link from "next/link"
import StatusBadge from "../../../(admin)/organizations/_components/enhanced/status-badge"
import OrganizationDetailsSkeleton from "./_components/organization-details-skeleton"

interface OrganizationDetailsPageProps {
  params: Promise<{ orgId: string }>
}

export default async function OrganizationDetailsPage({
  params
}: OrganizationDetailsPageProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/organizations">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Organizations
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Organization Details
            </h1>
            <p className="text-gray-600">
              View comprehensive organization information and statistics
            </p>
          </div>
        </div>

        <Suspense
          fallback={
            <div className="w-16 h-9 bg-gray-200 rounded animate-pulse" />
          }
        >
          <EditButtonWrapper params={params} />
        </Suspense>
      </div>

      {/* Content */}
      <Suspense fallback={<OrganizationDetailsSkeleton />}>
        <OrganizationDetailsFetcher params={params} />
      </Suspense>
    </div>
  )
}

async function EditButtonWrapper({
  params
}: {
  params: Promise<{ orgId: string }>
}) {
  const { orgId } = await params
  const { userId } = await auth()

  if (!userId) return null

  const canEdit = await hasPermission(userId, "manage", "organizations")

  if (!canEdit) return null

  return (
    <Button asChild>
      <Link href={`/admin/organizations/${orgId}/edit`}>
        <Edit className="mr-2 h-4 w-4" />
        Edit Organization
      </Link>
    </Button>
  )
}

async function OrganizationDetailsFetcher({
  params
}: {
  params: Promise<{ orgId: string }>
}) {
  const { userId } = await auth()
  if (!userId) {
    notFound()
  }

  const { orgId } = await params

  // Check permissions
  const canView = await hasPermission(userId, "view", "organizations")
  if (!canView) {
    notFound()
  }

  // Fetch organization data and statistics
  const [orgResult, statsResult] = await Promise.all([
    getOrganizationByIdAction(orgId),
    getOrganizationStatisticsAction(orgId)
  ])

  if (!orgResult.isSuccess || !orgResult.data) {
    notFound()
  }

  const organization = orgResult.data
  const statistics = statsResult.isSuccess ? statsResult.data : null

  return (
    <div className="space-y-6">
      {/* Basic Information Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Building2 className="h-5 w-5" />
              <span>Basic Information</span>
            </CardTitle>
            <StatusBadge status={organization.status} />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Organization Name and Description */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {organization.name}
            </h2>
            {organization.description && (
              <p className="mt-2 text-gray-600">{organization.description}</p>
            )}
          </div>

          <Separator />

          {/* Contact Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Primary Contact */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900 flex items-center">
                <User className="mr-2 h-4 w-4" />
                Primary Contact
              </h3>
              <div className="space-y-2 text-sm">
                {organization.primaryContactName && (
                  <div className="flex items-center text-gray-600">
                    <User className="mr-2 h-4 w-4 text-gray-400" />
                    {organization.primaryContactName}
                  </div>
                )}
                {organization.primaryContactEmail && (
                  <div className="flex items-center text-gray-600">
                    <Mail className="mr-2 h-4 w-4 text-gray-400" />
                    <a
                      href={`mailto:${organization.primaryContactEmail}`}
                      className="hover:text-blue-600 hover:underline"
                    >
                      {organization.primaryContactEmail}
                    </a>
                  </div>
                )}
                {organization.primaryContactPhone && (
                  <div className="flex items-center text-gray-600">
                    <Phone className="mr-2 h-4 w-4 text-gray-400" />
                    <a
                      href={`tel:${organization.primaryContactPhone}`}
                      className="hover:text-blue-600 hover:underline"
                    >
                      {organization.primaryContactPhone}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Organization Details */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900 flex items-center">
                <Building2 className="mr-2 h-4 w-4" />
                Organization Details
              </h3>
              <div className="space-y-2 text-sm">
                {organization.websiteUrl && (
                  <div className="flex items-center text-gray-600">
                    <Globe className="mr-2 h-4 w-4 text-gray-400" />
                    <a
                      href={organization.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-blue-600 hover:underline flex items-center"
                    >
                      {organization.websiteUrl}
                      <ExternalLink className="ml-1 h-3 w-3" />
                    </a>
                  </div>
                )}
                {organization.address && (
                  <div className="flex items-start text-gray-600">
                    <MapPin className="mr-2 h-4 w-4 text-gray-400 mt-0.5" />
                    <div>{organization.address}</div>
                  </div>
                )}
                <div className="flex items-center text-gray-600">
                  <Calendar className="mr-2 h-4 w-4 text-gray-400" />
                  Created{" "}
                  {new Date(organization.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      {statistics && (
        <>
          {/* Quick Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Total Members
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {statistics.totalMembers}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Metadata Records
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {statistics.metadataMetrics.totalRecords}
                    </p>
                  </div>
                  <FileText className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Health Score
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {statistics.healthScore.score}/100
                    </p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Active Contributors
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {statistics.activityMetrics.activeContributors}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Statistics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Members by Role */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Members by Role</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(statistics.membersByRole).map(
                    ([role, count]) => (
                      <div
                        key={role}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm font-medium text-gray-600">
                          {role}
                        </span>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Metadata Records by Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Metadata by Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(
                    statistics.metadataMetrics.recordsByStatus
                  ).map(([status, count]) => (
                    <div
                      key={status}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm font-medium text-gray-600 capitalize">
                        {status}
                      </span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>Recent Activity</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">
                      Last 7 days
                    </span>
                    <Badge variant="secondary">
                      {statistics.metadataMetrics.recentSubmissions.last7Days}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">
                      Last 30 days
                    </span>
                    <Badge variant="secondary">
                      {statistics.metadataMetrics.recentSubmissions.last30Days}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">
                      Last 90 days
                    </span>
                    <Badge variant="secondary">
                      {statistics.metadataMetrics.recentSubmissions.last90Days}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Health Factors */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Health Factors</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(statistics.healthScore.factors).map(
                    ([factor, score]) => (
                      <div key={factor} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-600 capitalize">
                            {factor.replace(/([A-Z])/g, " $1").toLowerCase()}
                          </span>
                          <span className="text-sm text-gray-900">
                            {Math.round(score)}/100
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${score}%` }}
                          />
                        </div>
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Show message if statistics couldn't be loaded */}
      {!statistics && (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-500">
              Detailed statistics are not available. This might be due to
              insufficient permissions or the organization having no activity
              yet.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
