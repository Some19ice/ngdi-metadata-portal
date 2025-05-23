"use server"

import { db } from "@/db/db"
import {
  metadataRecordsTable,
  userOrganizationsTable,
  organizationsTable,
  metadataChangeLogsTable
} from "@/db/schema"
import { ActionState } from "@/types"
import { auth, clerkClient } from "@clerk/nextjs/server"
import { and, eq, gte, sql, desc, count, avg } from "drizzle-orm"
import { isNodeOfficerForOrg, hasPermission } from "@/lib/rbac"

export interface OrganizationAnalyticsData {
  metadataSubmissions: Array<{
    month: string
    submissions: number
    approvals: number
    rejections: number
  }>
  statusDistribution: Array<{
    status: string
    count: number
    color: string
  }>
  userActivity: Array<{
    userId: string
    userName: string
    submissions: number
    approvals: number
    lastActivity: string
  }>
  organizationMetrics: {
    totalRecords: number
    monthlyGrowth: number
    approvalRate: number
    avgProcessingTime: number
    activeUsers: number
  }
}

export async function getOrganizationAnalyticsAction(
  organizationId: string,
  timeRange: "1month" | "3months" | "6months" | "1year" = "6months"
): Promise<ActionState<OrganizationAnalyticsData>> {
  const { userId } = await auth()
  if (!userId) {
    return { isSuccess: false, message: "Unauthorized: User not logged in." }
  }

  // Check if user is Node Officer for this organization
  const isNO = await isNodeOfficerForOrg(userId, organizationId)
  if (!isNO) {
    return {
      isSuccess: false,
      message: "Forbidden: You are not a Node Officer for this organization."
    }
  }

  // Check permission to view analytics
  const canViewAnalytics = await hasPermission(
    userId,
    "view",
    "organization_analytics"
  )
  if (!canViewAnalytics) {
    return {
      isSuccess: false,
      message:
        "Forbidden: You do not have permission to view organization analytics."
    }
  }

  try {
    // Calculate date range
    const now = new Date()
    const monthsBack =
      timeRange === "1month"
        ? 1
        : timeRange === "3months"
          ? 3
          : timeRange === "6months"
            ? 6
            : 12
    const startDate = new Date(
      now.getFullYear(),
      now.getMonth() - monthsBack,
      1
    )

    // Get metadata submissions by month
    const submissionsQuery = await db
      .select({
        month: sql<string>`TO_CHAR(${metadataRecordsTable.createdAt}, 'YYYY-MM')`,
        submissions: count(),
        status: metadataRecordsTable.status
      })
      .from(metadataRecordsTable)
      .where(
        and(
          eq(metadataRecordsTable.organizationId, organizationId),
          gte(metadataRecordsTable.createdAt, startDate)
        )
      )
      .groupBy(
        sql`TO_CHAR(${metadataRecordsTable.createdAt}, 'YYYY-MM')`,
        metadataRecordsTable.status
      )
      .orderBy(sql`TO_CHAR(${metadataRecordsTable.createdAt}, 'YYYY-MM')`)

    // Process submissions data
    const submissionsByMonth = new Map<
      string,
      { submissions: number; approvals: number; rejections: number }
    >()

    submissionsQuery.forEach(row => {
      if (!submissionsByMonth.has(row.month)) {
        submissionsByMonth.set(row.month, {
          submissions: 0,
          approvals: 0,
          rejections: 0
        })
      }
      const monthData = submissionsByMonth.get(row.month)!

      if (row.status === "Approved" || row.status === "Published") {
        monthData.approvals += row.submissions
      } else if (row.status === "Needs Revision") {
        monthData.rejections += row.submissions
      }
      monthData.submissions += row.submissions
    })

    const metadataSubmissions = Array.from(submissionsByMonth.entries()).map(
      ([month, data]) => ({
        month,
        ...data
      })
    )

    // Get status distribution
    const statusQuery = await db
      .select({
        status: metadataRecordsTable.status,
        count: count()
      })
      .from(metadataRecordsTable)
      .where(eq(metadataRecordsTable.organizationId, organizationId))
      .groupBy(metadataRecordsTable.status)

    const statusColors = {
      Draft: "#94a3b8",
      "Pending Validation": "#f59e0b",
      "Needs Revision": "#ef4444",
      Approved: "#10b981",
      Published: "#059669",
      Archived: "#6b7280"
    }

    const statusDistribution = statusQuery.map(row => ({
      status: row.status,
      count: row.count,
      color: statusColors[row.status as keyof typeof statusColors] || "#6b7280"
    }))

    // Get user activity
    const userActivityQuery = await db
      .select({
        userId: metadataRecordsTable.creatorUserId,
        submissions: count(),
        lastActivity: sql<Date>`MAX(${metadataRecordsTable.updatedAt})`
      })
      .from(metadataRecordsTable)
      .where(
        and(
          eq(metadataRecordsTable.organizationId, organizationId),
          gte(metadataRecordsTable.createdAt, startDate)
        )
      )
      .groupBy(metadataRecordsTable.creatorUserId)
      .orderBy(desc(count()))

    // Get user names from Clerk
    const clerk = await clerkClient()
    const userIds = userActivityQuery.map(row => row.userId)
    const clerkUsers =
      userIds.length > 0
        ? await clerk.users.getUserList({
            userId: userIds,
            limit: userIds.length
          })
        : { data: [] }

    const userActivity = await Promise.all(
      userActivityQuery.map(async row => {
        const clerkUser = clerkUsers.data.find(u => u.id === row.userId)

        // Get approval count for this user
        const approvalQuery = await db
          .select({ count: count() })
          .from(metadataRecordsTable)
          .where(
            and(
              eq(metadataRecordsTable.creatorUserId, row.userId),
              eq(metadataRecordsTable.organizationId, organizationId),
              sql`${metadataRecordsTable.status} IN ('Approved', 'Published')`
            )
          )

        return {
          userId: row.userId,
          userName: clerkUser
            ? `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() ||
              "Unknown User"
            : "Unknown User",
          submissions: row.submissions,
          approvals: approvalQuery[0]?.count || 0,
          lastActivity: row.lastActivity.toISOString()
        }
      })
    )

    // Calculate organization metrics
    const totalRecordsQuery = await db
      .select({ count: count() })
      .from(metadataRecordsTable)
      .where(eq(metadataRecordsTable.organizationId, organizationId))

    const totalRecords = totalRecordsQuery[0]?.count || 0

    // Calculate monthly growth
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const lastMonthQuery = await db
      .select({ count: count() })
      .from(metadataRecordsTable)
      .where(
        and(
          eq(metadataRecordsTable.organizationId, organizationId),
          gte(metadataRecordsTable.createdAt, lastMonthStart),
          sql`${metadataRecordsTable.createdAt} < ${thisMonthStart}`
        )
      )

    const thisMonthQuery = await db
      .select({ count: count() })
      .from(metadataRecordsTable)
      .where(
        and(
          eq(metadataRecordsTable.organizationId, organizationId),
          gte(metadataRecordsTable.createdAt, thisMonthStart)
        )
      )

    const lastMonthCount = lastMonthQuery[0]?.count || 0
    const thisMonthCount = thisMonthQuery[0]?.count || 0
    const monthlyGrowth =
      lastMonthCount > 0
        ? ((thisMonthCount - lastMonthCount) / lastMonthCount) * 100
        : 0

    // Calculate approval rate
    const approvedQuery = await db
      .select({ count: count() })
      .from(metadataRecordsTable)
      .where(
        and(
          eq(metadataRecordsTable.organizationId, organizationId),
          sql`${metadataRecordsTable.status} IN ('Approved', 'Published')`
        )
      )

    const approvedCount = approvedQuery[0]?.count || 0
    const approvalRate =
      totalRecords > 0 ? (approvedCount / totalRecords) * 100 : 0

    // Calculate average processing time (simplified - from creation to approval)
    const processingTimeQuery = await db
      .select({
        avgDays: sql<number>`AVG(EXTRACT(DAY FROM (${metadataRecordsTable.updatedAt} - ${metadataRecordsTable.createdAt})))`
      })
      .from(metadataRecordsTable)
      .where(
        and(
          eq(metadataRecordsTable.organizationId, organizationId),
          sql`${metadataRecordsTable.status} IN ('Approved', 'Published')`
        )
      )

    const avgProcessingTime = Math.round(processingTimeQuery[0]?.avgDays || 0)

    // Count active users (users who created records in the last 30 days)
    const activeUsersQuery = await db
      .selectDistinct({ userId: metadataRecordsTable.creatorUserId })
      .from(metadataRecordsTable)
      .where(
        and(
          eq(metadataRecordsTable.organizationId, organizationId),
          gte(
            metadataRecordsTable.createdAt,
            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          )
        )
      )

    const activeUsers = activeUsersQuery.length

    const organizationMetrics = {
      totalRecords,
      monthlyGrowth,
      approvalRate,
      avgProcessingTime,
      activeUsers
    }

    return {
      isSuccess: true,
      message: "Organization analytics retrieved successfully.",
      data: {
        metadataSubmissions,
        statusDistribution,
        userActivity,
        organizationMetrics
      }
    }
  } catch (error) {
    console.error("Error getting organization analytics:", error)
    return {
      isSuccess: false,
      message: "Failed to retrieve organization analytics."
    }
  }
}

export async function exportOrganizationReportAction(
  organizationId: string,
  format: "json" | "csv" = "json"
): Promise<ActionState<{ downloadUrl: string; filename: string }>> {
  const { userId } = await auth()
  if (!userId) {
    return { isSuccess: false, message: "Unauthorized: User not logged in." }
  }

  // Check if user is Node Officer for this organization
  const isNO = await isNodeOfficerForOrg(userId, organizationId)
  if (!isNO) {
    return {
      isSuccess: false,
      message: "Forbidden: You are not a Node Officer for this organization."
    }
  }

  try {
    // Get organization details
    const orgQuery = await db
      .select({ name: organizationsTable.name })
      .from(organizationsTable)
      .where(eq(organizationsTable.id, organizationId))
      .limit(1)

    const orgName = orgQuery[0]?.name || "Unknown Organization"

    // Get analytics data
    const analyticsResult = await getOrganizationAnalyticsAction(
      organizationId,
      "1year"
    )

    if (!analyticsResult.isSuccess) {
      return {
        isSuccess: false,
        message: "Failed to generate report data."
      }
    }

    const timestamp = new Date().toISOString().split("T")[0]
    const filename = `${orgName.replace(/[^a-zA-Z0-9]/g, "_")}_report_${timestamp}.${format}`

    // In a real implementation, you would:
    // 1. Generate the file (JSON/CSV)
    // 2. Upload to cloud storage (S3, etc.)
    // 3. Return the download URL

    // For now, return a placeholder
    return {
      isSuccess: true,
      message: "Report generated successfully.",
      data: {
        downloadUrl: `/api/reports/download/${organizationId}/${filename}`,
        filename
      }
    }
  } catch (error) {
    console.error("Error exporting organization report:", error)
    return {
      isSuccess: false,
      message: "Failed to export organization report."
    }
  }
}
