/*
<ai_context>
This client component provides user navigation and profile management for the sidebar.
</ai_context>
*/

"use client"

import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Sparkles,
  User,
  Settings,
  Shield,
  UserCheck
} from "lucide-react"
import { useUser, useClerk } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
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
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  getCurrentUserPermissionsAction,
  UserPermissions
} from "@/actions/user-permissions-actions"

export function NavUser() {
  const { isMobile } = useSidebar()
  const { user, isLoaded } = useUser()
  const { signOut } = useClerk()
  const router = useRouter()
  const [permissions, setPermissions] = useState<UserPermissions>({
    canAccessAdmin: false,
    canAccessBilling: false,
    isSystemAdmin: false,
    isPro: false
  })
  const [permissionsLoaded, setPermissionsLoaded] = useState(false)

  // Fetch user permissions when component mounts and user is loaded
  useEffect(() => {
    if (isLoaded && user) {
      const fetchPermissions = async () => {
        try {
          const result = await getCurrentUserPermissionsAction()
          if (result.isSuccess && result.data) {
            setPermissions(result.data)
          }
        } catch (error) {
          console.error("Failed to fetch user permissions:", error)
        } finally {
          setPermissionsLoaded(true)
        }
      }

      fetchPermissions()
    } else if (isLoaded && !user) {
      // User is not authenticated, set permissions to false
      setPermissions({
        canAccessAdmin: false,
        canAccessBilling: false,
        isSystemAdmin: false,
        isPro: false
      })
      setPermissionsLoaded(true)
    }
  }, [isLoaded, user])

  if (!isLoaded || !permissionsLoaded) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton>
            <Skeleton className="h-8 w-8 rounded-lg" />
            <div className="flex flex-col gap-0.5 leading-none">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  if (!user) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            onClick={() => router.push("/login")}
            className="cursor-pointer"
          >
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <User className="size-4" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">Sign In</span>
              <span className="truncate text-xs">Access your account</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  const userName =
    user.fullName || `${user.firstName} ${user.lastName}`.trim() || "User"
  const userEmail = user.primaryEmailAddress?.emailAddress || "No email"
  const userInitials =
    user.firstName?.[0]?.toUpperCase() ||
    user.lastName?.[0]?.toUpperCase() ||
    "U"

  const handleSignOut = async () => {
    await signOut()
    router.push("/")
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
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user.imageUrl} alt={userName} />
                <AvatarFallback className="rounded-lg">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{userName}</span>
                <span className="truncate text-xs">{userEmail}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.imageUrl} alt={userName} />
                  <AvatarFallback className="rounded-lg">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{userName}</span>
                  <span className="truncate text-xs">{userEmail}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={() => router.push("/profile")}
                className="cursor-pointer"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push("/settings")}
                className="cursor-pointer"
              >
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push("/notifications")}
                className="cursor-pointer"
              >
                <Bell className="mr-2 h-4 w-4" />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>

            {/* Conditionally render Billing and Admin based on permissions */}
            {(permissions.canAccessBilling || permissions.canAccessAdmin) && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  {permissions.canAccessBilling && (
                    <DropdownMenuItem
                      onClick={() => router.push("/billing")}
                      className="cursor-pointer"
                    >
                      <CreditCard className="mr-2 h-4 w-4" />
                      Billing
                      {permissions.isPro && (
                        <Badge variant="outline" className="ml-auto text-xs">
                          Pro
                        </Badge>
                      )}
                    </DropdownMenuItem>
                  )}
                  {permissions.canAccessAdmin && (
                    <DropdownMenuItem
                      onClick={() => router.push("/admin")}
                      className="cursor-pointer"
                    >
                      <Shield className="mr-2 h-4 w-4" />
                      Admin
                    </DropdownMenuItem>
                  )}
                </DropdownMenuGroup>
              </>
            )}

            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="cursor-pointer text-red-600 focus:text-red-600"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
