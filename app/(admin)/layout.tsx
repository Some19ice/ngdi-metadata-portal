"use server"

import { hasPermission } from "@/lib/rbac"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

export default async function AdminLayout({
  children
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()
  if (!userId) {
    // Not logged in, redirect to login or home
    redirect("/login") // Or login page
    return // Ensure redirect happens
  }

  const canAccessAdminDashboard = await hasPermission(
    userId,
    "access",
    "admin_dashboard"
  )

  if (!canAccessAdminDashboard) {
    // If not allowed, redirect to a generic page or the home page
    // You might want to show a specific unauthorized page later
    redirect("/unauthorized") // Or perhaps '/unauthorized'
  }

  // Override the padding from the root layout by providing a wrapper div
  // with no padding that will be used instead of the padding from SidebarInset
  return <div className="p-0 w-full h-full">{children}</div>
}
