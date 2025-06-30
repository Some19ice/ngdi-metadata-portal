/*
<ai_context>
This client component provides the sidebar for the app.
</ai_context>
*/

"use client"

import {
  BarChart3,
  Building2,
  FileText,
  FolderSync,
  Home,
  Laptop2,
  LayersIcon,
  Lightbulb,
  Map,
  Settings,
  ShieldCheck,
  Users
} from "lucide-react"
import * as React from "react"
import { usePathname } from "next/navigation"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail
} from "@/components/ui/sidebar"
import { NavMain } from "./nav-main"
import { NavUser } from "./nav-user"
import { TeamSwitcher } from "./team-switcher"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()

  // Define navigation items based on NGDI Portal requirements
  const navItems = [
    {
      title: "Dashboard",
      url: "/",
      icon: Home,
      isActive: pathname === "/",
      items: []
    },
    {
      title: "Metadata",
      url: "/metadata",
      icon: FileText,
      isActive: pathname.includes("/metadata"),
      items: [
        { title: "My Metadata", url: "/metadata" },
        { title: "Create New", url: "/metadata/create" },
        { title: "Search", url: "/metadata/search" }
      ]
    },
    {
      title: "Map Visualization",
      url: "/map",
      icon: Map,
      isActive: pathname.includes("/map"),
      items: [{ title: "Main Map", url: "/map" }]
    }
  ]

  // Admin-specific navigation
  const adminNavItems = [
    {
      title: "Admin",
      url: "/dashboard",
      icon: ShieldCheck,
      isActive:
        pathname.includes("/dashboard") ||
        pathname.includes("/admin/users") ||
        pathname.includes("/admin/organizations") ||
        pathname.includes("/metadata-oversight") ||
        pathname.includes("/system-settings") ||
        pathname.includes("/audit-logs"),
      items: [
        { title: "Dashboard", url: "/dashboard" },
        { title: "Users", url: "/admin/users" },
        { title: "Organizations", url: "/admin/organizations" },
        { title: "Metadata Oversight", url: "/metadata-oversight" },
        { title: "System Settings", url: "/system-settings" },
        { title: "Audit Logs", url: "/audit-logs" }
      ]
    }
  ]

  // Node Officer specific navigation
  const nodeOfficerNavItems = [
    {
      title: "Node Officer",
      url: "/officer-dashboard",
      icon: Building2,
      isActive:
        pathname.includes("/officer-dashboard") ||
        pathname.includes("/organization-users"),
      items: [
        { title: "Dashboard", url: "/officer-dashboard" },
        { title: "Users", url: "/organization-users" }
      ]
    }
  ]

  // Combine navigation items based on user role - in a real app, this would check user permissions
  // For now, we'll include all items for demonstration purposes
  const allNavItems = [...navItems, ...adminNavItems, ...nodeOfficerNavItems]

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={allNavItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
