"use server"

import { Suspense } from "react"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { hasPermission } from "@/lib/rbac"
import StatsSkeleton from "./_components/stats-skeleton"
import ChartSkeleton from "./_components/chart-skeleton"
import UserTrendsCharts from "./_components/user-trends-charts"
import MetadataTrendsCharts from "./_components/metadata-trends-charts"
import DashboardStatsCards from "./_components/dashboard-stats-cards"
import QuickLinks from "./_components/quick-links"

export default async function AdminDashboardPage() {
  const { userId } = await auth()

  if (!userId || !(await hasPermission(userId, "access", "admin_dashboard"))) {
    redirect("/")
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-medium tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of system metrics and administration tools
        </p>
      </div>

      <Suspense fallback={<StatsSkeleton />}>
        <DashboardStatsCards />
      </Suspense>

      <div className="grid gap-6 md:grid-cols-2">
        <Suspense fallback={<ChartSkeleton />}>
          <UserTrendsCharts />
        </Suspense>

        <Suspense fallback={<ChartSkeleton />}>
          <MetadataTrendsCharts />
        </Suspense>
      </div>

      <div>
        <h2 className="mb-4 text-xl font-medium tracking-tight">Quick Links</h2>
        <QuickLinks />
      </div>
    </div>
  )
}
