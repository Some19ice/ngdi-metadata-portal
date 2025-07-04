/*
<ai_context>
This client component provides a team/organization switcher for the sidebar.
</ai_context>
*/

"use client"

import * as React from "react"
import { Building2, ChevronsUpDown, Check, Plus, MapPin } from "lucide-react"
import { useUser } from "@clerk/nextjs"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

// Hook to safely get organization context
function useSafeOrganization() {
  const [organizationData, setOrganizationData] = React.useState<{
    organization: any | null
    userRole: string | null
    isLoading: boolean
    error: string | null
  }>({
    organization: null,
    userRole: null,
    isLoading: false,
    error: null
  })

  React.useEffect(() => {
    // For now, we'll handle organization context loading here
    // In a real implementation, this would connect to the organization provider
    // For now, we'll just set default values to prevent errors
    setOrganizationData({
      organization: null,
      userRole: null,
      isLoading: false,
      error: null
    })
  }, [])

  return organizationData
}

export function TeamSwitcher() {
  const { isMobile } = useSidebar()
  const { user } = useUser()
  const { organization, userRole, isLoading, error } = useSafeOrganization()

  if (isLoading) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <Skeleton className="h-8 w-full" />
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  if (error) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            size="lg"
            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          >
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <Building2 className="size-4" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">Personal</span>
              <span className="truncate text-xs">Individual Account</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Building2 className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {organization?.name || user?.firstName || "Personal"}
                </span>
                <span className="truncate text-xs">
                  {organization?.name
                    ? `${userRole || "Member"}`
                    : "Individual Account"}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="start"
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Current Context
            </DropdownMenuLabel>
            <DropdownMenuItem className="gap-2 p-2">
              <div className="flex size-6 items-center justify-center rounded-sm border">
                <Building2 className="size-4 shrink-0" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {organization?.name || user?.firstName || "Personal"}
                </span>
                <span className="truncate text-xs">
                  {organization?.name
                    ? `${userRole || "Member"}`
                    : "Individual Account"}
                </span>
              </div>
              <Check className="ml-auto size-4" />
            </DropdownMenuItem>

            {organization && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="gap-2 p-2">
                  <div className="flex size-6 items-center justify-center rounded-sm border bg-background">
                    <MapPin className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      Organization Details
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      View organization info
                    </span>
                  </div>
                </DropdownMenuItem>
              </>
            )}

            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 p-2">
              <div className="flex size-6 items-center justify-center rounded-sm border bg-background">
                <Plus className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  Join Organization
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  Request to join an organization
                </span>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
