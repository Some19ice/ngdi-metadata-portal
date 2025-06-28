"use server"

import { Suspense } from "react"
import { notFound, redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import { hasPermission } from "@/lib/rbac"
import UserDetailsContent from "./_components/user-details-content"
import UserDetailsSkeleton from "./_components/user-details-skeleton"

interface UserDetailPageProps {
  params: Promise<{ userId: string }>
}

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  // Check authentication
  const { userId: currentUserId } = await auth()
  if (!currentUserId) {
    redirect("/login")
  }

  // Check permissions - only admins should access user details
  const hasUserPermission = await hasPermission(currentUserId, "view", "users")
  if (!hasUserPermission) {
    redirect("/unauthorized")
  }

  const { userId } = await params

  if (!userId) {
    notFound()
  }

  return (
    <div className="container mx-auto py-6">
      <Suspense fallback={<UserDetailsSkeleton />}>
        <UserDetailsContent userId={userId} />
      </Suspense>
    </div>
  )
}
