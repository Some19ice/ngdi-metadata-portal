"use server"

import { Suspense } from "react"
import UserListFetcher from "./_components/user-list-fetcher"
import UserListSkeleton from "./_components/user-list-skeleton"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { hasPermission } from "@/lib/rbac"
import { Button } from "@/components/ui/button"
import { UserPlus } from "lucide-react"

interface AdminUsersPageProps {
  searchParams: Promise<{
    query?: string
    role?: string
    sortBy?: string
    sortOrder?: string
    page?: string
  }>
}

export default async function AdminUsersPage({
  searchParams
}: AdminUsersPageProps) {
  const { userId } = await auth()

  if (!userId || !(await hasPermission(userId, "view", "users"))) {
    redirect("/")
  }

  return (
    <div className="space-y-6 p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            Manage system users and their roles
          </p>
        </div>

        {(await hasPermission(userId, "invite", "users")) && (
          <Button className="ml-auto">
            <UserPlus className="mr-2 h-4 w-4" />
            Invite User
          </Button>
        )}
      </div>

      <Suspense fallback={<UserListSkeleton className="mt-4" count={8} />}>
        <UserListFetcher className="mt-4" searchParams={searchParams} />
      </Suspense>
    </div>
  )
}
