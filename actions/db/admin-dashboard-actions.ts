"use server"

import { db } from "@/db/db"
import {
  metadataRecordsTable,
  organizationsTable,
  profilesTable
} from "@/db/schema"
import type { ActionState } from "@/types"
import type {
  DashboardStats,
  KpiChartData,
  MetadataStats,
  UserStats
} from "@/types/admin-dashboard-types"
import { auth } from "@clerk/nextjs/server"
import { count, eq, sql } from "drizzle-orm"
import { subDays, format } from "date-fns"
import { hasPermission } from "@/lib/rbac"

// Helper function to check for admin privileges
async function isAdmin(): Promise<boolean> {
  const { userId } = await auth()
  if (!userId) return false
  return hasPermission(userId, "access", "admin_dashboard")
}

/**
 * Get dashboard statistics for the admin dashboard
 */
export async function getDashboardStatsAction(): Promise<
  ActionState<DashboardStats>
> {
  if (!(await isAdmin())) {
    return {
      isSuccess: false,
      message: "Unauthorized: Admin access required."
    }
  }

  try {
    // User Stats
    const [userCountResult] = await db
      .select({ value: count() })
      .from(profilesTable)
    const userStats: UserStats = {
      total: userCountResult?.value || 0
      // byRole breakdown could be implemented in the future
    }

    // Organization Stats
    const [orgCountResult] = await db
      .select({ value: count() })
      .from(organizationsTable)
    const organizationCount = orgCountResult?.value || 0

    // Metadata Stats
    // This assumes metadataRecordsTable has a 'status' column of a known enum type
    const possibleStatuses = [
      "Published",
      "Approved",
      "Pending Validation",
      "Draft",
      "Needs Revision"
    ]
    const metadataStatusCounts: MetadataStats["byStatus"] = {
      published: 0,
      approved: 0,
      pendingValidation: 0,
      draft: 0,
      needsRevision: 0
    }
    let totalMetadata = 0

    // Convert status to property name mapping
    const statusToProperty: Record<string, keyof MetadataStats["byStatus"]> = {
      Published: "published",
      Approved: "approved",
      "Pending Validation": "pendingValidation",
      Draft: "draft",
      "Needs Revision": "needsRevision"
    }

    const metadataCountsByStatus = await db
      .select({
        status: metadataRecordsTable.status,
        value: count()
      })
      .from(metadataRecordsTable)
      .groupBy(metadataRecordsTable.status)

    metadataCountsByStatus.forEach(row => {
      if (row.status && possibleStatuses.includes(row.status)) {
        const propertyName = statusToProperty[row.status]
        if (propertyName) {
          metadataStatusCounts[propertyName] = row.value
        }
      }
      totalMetadata += row.value
    })

    const metadataStats: MetadataStats = {
      total: totalMetadata,
      byStatus: metadataStatusCounts
    }

    const dashboardStats: DashboardStats = {
      userStats,
      organizationCount,
      metadataStats
    }

    return {
      isSuccess: true,
      message: "Dashboard statistics retrieved successfully.",
      data: dashboardStats
    }
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    return {
      isSuccess: false,
      message:
        "Failed to retrieve dashboard statistics. " +
        (error instanceof Error ? error.message : String(error))
    }
  }
}

// Common function to fill missing dates for KPI charts
function fillMissingDates(
  kpiData: { date: string; value: number }[],
  startDate: Date,
  timePeriodDays: number
): KpiChartData {
  const filledData: KpiChartData = []
  let currentDate = new Date(startDate)
  currentDate.setUTCHours(0, 0, 0, 0)

  const dataMap = new Map(kpiData.map(item => [item.date, item.value]))

  for (let i = 0; i <= timePeriodDays; i++) {
    const dateStr = format(currentDate, "yyyy-MM-dd")
    filledData.push({
      date: dateStr,
      value: dataMap.get(dateStr) || 0
    })
    currentDate.setDate(currentDate.getDate() + 1)
  }
  return filledData
}

/**
 * Get new user registrations data for KPI chart
 */
export async function getNewUserRegistrationsKpiAction(
  timePeriodDays: number = 30
): Promise<ActionState<KpiChartData>> {
  if (!(await isAdmin())) {
    return {
      isSuccess: false,
      message: "Unauthorized: Admin access required."
    }
  }

  try {
    const startDate = subDays(new Date(), timePeriodDays)
    const formattedStartDate = format(startDate, "yyyy-MM-dd")

    // SQL query to count users created per day within the time period
    const userRegistrations = await db
      .select({
        date: sql<string>`date(${profilesTable.createdAt})::text`,
        value: count()
      })
      .from(profilesTable)
      .where(sql`${profilesTable.createdAt} >= ${formattedStartDate}`)
      .groupBy(sql`date(${profilesTable.createdAt})`)
      .orderBy(sql`date(${profilesTable.createdAt})`)

    // Fill in any missing dates within the range
    const filledData = fillMissingDates(
      userRegistrations,
      startDate,
      timePeriodDays
    )

    return {
      isSuccess: true,
      message: "New user registrations KPI data retrieved successfully.",
      data: filledData
    }
  } catch (error) {
    console.error("Error fetching new user registrations KPI:", error)
    return {
      isSuccess: false,
      message:
        "Failed to retrieve new user registrations KPI data. " +
        (error instanceof Error ? error.message : String(error))
    }
  }
}

/**
 * Get metadata submissions data for KPI chart
 */
export async function getMetadataSubmissionsKpiAction(
  timePeriodDays: number = 30
): Promise<ActionState<KpiChartData>> {
  if (!(await isAdmin())) {
    return {
      isSuccess: false,
      message: "Unauthorized: Admin access required."
    }
  }

  try {
    const startDate = subDays(new Date(), timePeriodDays)
    const formattedStartDate = format(startDate, "yyyy-MM-dd")

    // SQL query to count metadata records created per day within the time period
    const metadataSubmissions = await db
      .select({
        date: sql<string>`date(${metadataRecordsTable.createdAt})::text`,
        value: count()
      })
      .from(metadataRecordsTable)
      .where(sql`${metadataRecordsTable.createdAt} >= ${formattedStartDate}`)
      .groupBy(sql`date(${metadataRecordsTable.createdAt})`)
      .orderBy(sql`date(${metadataRecordsTable.createdAt})`)

    // Fill in any missing dates within the range
    const filledData = fillMissingDates(
      metadataSubmissions,
      startDate,
      timePeriodDays
    )

    return {
      isSuccess: true,
      message: "Metadata submissions KPI data retrieved successfully.",
      data: filledData
    }
  } catch (error) {
    console.error("Error fetching metadata submissions KPI:", error)
    return {
      isSuccess: false,
      message:
        "Failed to retrieve metadata submissions KPI data. " +
        (error instanceof Error ? error.message : String(error))
    }
  }
}

/**
 * Get metadata status (published/approved) data for KPI chart
 */
export async function getMetadataStatusKpiAction(
  status: string,
  timePeriodDays: number = 30
): Promise<ActionState<KpiChartData>> {
  if (!(await isAdmin())) {
    return {
      isSuccess: false,
      message: "Unauthorized: Admin access required."
    }
  }

  // Validate the status parameter
  const validStatuses = ["published", "approved"]
  if (!validStatuses.includes(status.toLowerCase())) {
    return {
      isSuccess: false,
      message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`
    }
  }

  // Map lowercase status to the actual status value in the database
  const statusMap: Record<string, string> = {
    published: "Published",
    approved: "Approved"
  }
  const dbStatus = statusMap[status.toLowerCase()]

  try {
    const startDate = subDays(new Date(), timePeriodDays)
    const formattedStartDate = format(startDate, "yyyy-MM-dd")

    // SQL query to count metadata records with the specific status per day
    const metadataStatusData = await db
      .select({
        date: sql<string>`date(${metadataRecordsTable.updatedAt})::text`,
        value: count()
      })
      .from(metadataRecordsTable)
      .where(
        sql`${metadataRecordsTable.status} = ${dbStatus} AND ${metadataRecordsTable.updatedAt} >= ${formattedStartDate}`
      )
      .groupBy(sql`date(${metadataRecordsTable.updatedAt})`)
      .orderBy(sql`date(${metadataRecordsTable.updatedAt})`)

    // Fill in any missing dates within the range
    const filledData = fillMissingDates(
      metadataStatusData,
      startDate,
      timePeriodDays
    )

    return {
      isSuccess: true,
      message: `Metadata ${status} KPI data retrieved successfully.`,
      data: filledData
    }
  } catch (error) {
    console.error(`Error fetching metadata ${status} KPI:`, error)
    return {
      isSuccess: false,
      message:
        `Failed to retrieve metadata ${status} KPI data. ` +
        (error instanceof Error ? error.message : String(error))
    }
  }
}
