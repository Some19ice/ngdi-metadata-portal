/*
<ai_context>
This client component provides a main navigation for the sidebar with improved role-based filtering and UX.
</ai_context>
*/

"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem
} from "@/components/ui/sidebar"
import { ChevronRight, type LucideIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface NavigationItem {
  title: string
  url: string
  icon?: React.ComponentType<{ className?: string }>
  isActive?: boolean
  badge?: string
  items?: Array<{
    title: string
    url: string
    badge?: string
  }>
}

export function NavMain({ items }: { items: NavigationItem[] }) {
  const pathname = usePathname()

  if (items.length === 0) {
    return (
      <SidebarGroup>
        <SidebarGroupLabel>Platform</SidebarGroupLabel>
        <div className="px-3 py-2 text-sm text-muted-foreground">
          Loading navigation...
        </div>
      </SidebarGroup>
    )
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map(item => {
          const hasSubItems = item.items && item.items.length > 0
          const isCurrentPage = pathname === item.url
          const isInSection = pathname.startsWith(item.url) && item.url !== "/"

          return (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={item.isActive || isCurrentPage || isInSection}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                    tooltip={item.title}
                    aria-expanded={isCurrentPage || isInSection}
                    aria-label={`${item.title} navigation section`}
                    className={cn(
                      "transition-colors duration-200",
                      (isCurrentPage || isInSection) &&
                        "bg-sidebar-accent text-sidebar-accent-foreground"
                    )}
                    asChild={!hasSubItems}
                  >
                    {hasSubItems ? (
                      <div className="flex w-full items-center">
                        {item.icon && <item.icon className="mr-2 h-4 w-4" />}
                        <span className="flex-1">{item.title}</span>
                        {item.badge && (
                          <Badge
                            variant="secondary"
                            className="ml-auto mr-2 text-xs"
                          >
                            {item.badge}
                          </Badge>
                        )}
                        <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </div>
                    ) : (
                      <Link
                        href={item.url}
                        className="flex w-full items-center"
                      >
                        {item.icon && <item.icon className="mr-2 h-4 w-4" />}
                        <span className="flex-1">{item.title}</span>
                        {item.badge && (
                          <Badge
                            variant="secondary"
                            className="ml-auto text-xs"
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </Link>
                    )}
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                {hasSubItems && (
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items?.map(subItem => {
                        const isCurrentSubPage = pathname === subItem.url
                        return (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton
                              asChild
                              className={cn(
                                "transition-colors duration-200",
                                isCurrentSubPage &&
                                  "bg-sidebar-accent text-sidebar-accent-foreground"
                              )}
                            >
                              <Link
                                href={subItem.url}
                                className="flex w-full items-center"
                              >
                                <span className="flex-1">{subItem.title}</span>
                                {subItem.badge && (
                                  <Badge
                                    variant="secondary"
                                    className="ml-auto text-xs"
                                  >
                                    {subItem.badge}
                                  </Badge>
                                )}
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        )
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                )}
              </SidebarMenuItem>
            </Collapsible>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
