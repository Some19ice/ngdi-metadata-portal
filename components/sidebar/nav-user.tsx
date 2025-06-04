/*
<ai_context>
This client component provides user information for the sidebar.
</ai_context>
*/

"use client"

import { SidebarMenu, SidebarMenuItem } from "@/components/ui/sidebar"
import { useUser } from "@clerk/nextjs"
import { Skeleton } from "@/components/ui/skeleton"
import { useEffect, useState } from "react"

export function NavUser() {
  const { user, isLoaded } = useUser()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || !isLoaded) {
    return (
      <SidebarMenu>
        <SidebarMenuItem className="flex items-center gap-2 font-medium">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  if (!user) {
    return null
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem className="flex items-center gap-2 font-medium">
        {user?.fullName || "User"}
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
