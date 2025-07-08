/*
<ai_context>
This client component provides the sidebar for the app with proper RBAC and organization context.
</ai_context>
*/

"use client"

import {
  BarChart3,
  Building2,
  FileText,
  Home,
  Map,
  Settings,
  ShieldCheck,
  Users,
  Bell,
  Search,
  Plus,
  Eye,
  UserCheck,
  ClipboardList,
  Shield,
  Settings2,
  BookOpen,
  HelpCircle,
  Phone,
  FileIcon,
  Newspaper,
  Calendar,
  DollarSign,
  UserPlus,
  CircleAlert
} from "lucide-react"
import * as React from "react"
import { usePathname } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { getUserRoles } from "@/actions/db/user-roles-actions"
import { useEffect, useState } from "react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail
} from "@/components/ui/sidebar"
import { NavMain } from "@/components/sidebar/nav-main"
import { NavUser } from "@/components/sidebar/nav-user"
import { TeamSwitcher } from "@/components/sidebar/team-switcher"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { GlobalRole, OrgRole } from "@/types"

interface NavigationItem {
  title: string
  url: string
  icon?: React.ComponentType<{ className?: string }>
  isActive?: boolean
  badge?: string
  requiredRoles?: GlobalRole[]
  requiredOrgRoles?: OrgRole[]
  excludeRoles?: GlobalRole[]
  items?: Array<{
    title: string
    url: string
    badge?: string
    requiredRoles?: GlobalRole[]
    requiredOrgRoles?: OrgRole[]
  }>
}

const navigationConfig: NavigationItem[] = [
  {
    title: "Home",
    url: "/",
    icon: Home,
    items: []
  },
  {
    title: "Metadata",
    url: "/metadata",
    icon: FileText,
    items: [
      { title: "Browse", url: "/metadata" },
      { title: "Search", url: "/metadata/search" },
      {
        title: "Create",
        url: "/metadata/create",
        requiredRoles: [
          "Metadata Creator",
          "Node Officer",
          "System Administrator"
        ]
      }
    ]
  },
  {
    title: "Map",
    url: "/map",
    icon: Map,
    items: [
      { title: "Interactive Map", url: "/map" },
      { title: "Metadata Demo", url: "/map/metadata-demo" },
      { title: "GIS Services", url: "/map/gis-services" }
    ]
  },
  {
    title: "Search",
    url: "/search",
    icon: Search,
    items: []
  },
  {
    title: "Node Officer",
    url: "/officer-dashboard",
    icon: Building2,
    requiredOrgRoles: ["Node Officer"],
    items: [
      { title: "Dashboard", url: "/officer-dashboard" },
      { title: "Organization Users", url: "/organization-users" }
    ]
  },
  {
    title: "Admin",
    url: "/admin",
    icon: ShieldCheck,
    requiredRoles: ["System Administrator"],
    items: [
      { title: "Dashboard", url: "/admin/dashboard" },
      { title: "Users", url: "/admin/users" },
      { title: "Organizations", url: "/admin/organizations" },
      { title: "Metadata Oversight", url: "/admin/metadata-oversight" },
      { title: "System Settings", url: "/admin/system-settings" },
      { title: "Audit Logs", url: "/admin/audit-logs" }
    ]
  },
  {
    title: "Notifications",
    url: "/notifications",
    icon: Bell,
    items: []
  },
  {
    title: "About",
    url: "/about",
    icon: HelpCircle,
    items: []
  },
  {
    title: "Contact",
    url: "/contact",
    icon: Phone,
    items: []
  }
]

// Hook to get filtered navigation items based on user roles
function useFilteredNavigation() {
  const { user } = useUser()
  const [userRoles, setUserRoles] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const pathname = usePathname()

  // For now, we'll simplify and not use organization context in the main navigation
  // This will be handled by individual components that need organization context
  const orgRole = null // Placeholder for organization role
  const orgLoading = false

  useEffect(() => {
    const loadUserRoles = async () => {
      if (!user?.id) {
        setIsLoading(false)
        return
      }

      try {
        const result = await getUserRoles(user.id)
        if (result.isSuccess) {
          setUserRoles(result.data || [])
        }
      } catch (error) {
        console.error("Error loading user roles:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadUserRoles()
  }, [user?.id])

  const filteredNavigation = React.useMemo(() => {
    if (isLoading || orgLoading) return []

    return navigationConfig
      .filter(item => {
        // Check if item should be excluded based on roles
        if (
          item.excludeRoles &&
          item.excludeRoles.some(role => userRoles.includes(role))
        ) {
          return false
        }

        // Check global role requirements
        if (item.requiredRoles && item.requiredRoles.length > 0) {
          const hasRequiredRole = item.requiredRoles.some(role =>
            userRoles.includes(role)
          )
          if (!hasRequiredRole) return false
        }

        // For now, hide org-specific items since organization context causes issues
        if (item.requiredOrgRoles && item.requiredOrgRoles.length > 0) {
          return false
        }

        return true
      })
      .map(item => ({
        ...item,
        isActive:
          pathname === item.url ||
          (item.url !== "/" && pathname.startsWith(item.url)),
        items: item.items?.filter(subItem => {
          // Filter subitems based on roles
          if (subItem.requiredRoles && subItem.requiredRoles.length > 0) {
            const hasRequiredRole = subItem.requiredRoles.some(role =>
              userRoles.includes(role)
            )
            if (!hasRequiredRole) return false
          }

          // Hide org-specific subitems for now
          if (subItem.requiredOrgRoles && subItem.requiredOrgRoles.length > 0) {
            return false
          }

          return true
        })
      }))
  }, [userRoles, orgRole, pathname, isLoading, orgLoading])

  return {
    navigation: filteredNavigation,
    isLoading: isLoading || orgLoading,
    userRoles,
    orgRole
  }
}

// Loading skeleton for navigation
function NavigationSkeleton() {
  return (
    <div className="space-y-2 p-2">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-9 w-full" />
          <div className="ml-4 space-y-1">
            <Skeleton className="h-7 w-3/4" />
            <Skeleton className="h-7 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { navigation, isLoading, userRoles, orgRole } = useFilteredNavigation()

  return (
    <Sidebar collapsible="icon" variant="sidebar" {...props}>
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent>
        {isLoading ? <NavigationSkeleton /> : <NavMain items={navigation} />}
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
        {process.env.NODE_ENV === "development" && (
          <div className="p-2 text-xs text-muted-foreground">
            <div>Roles: {userRoles.join(", ") || "None"}</div>
            {orgRole && <div>Org Role: {orgRole}</div>}
          </div>
        )}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
