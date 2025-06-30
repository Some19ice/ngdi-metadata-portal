"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle
} from "@/components/ui/navigation-menu"

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/search", label: "Search" },
  {
    href: "/map",
    label: "Map",
    subLinks: [{ href: "/map", label: "Main Map" }]
  },
  { href: "/about", label: "About" },
  { href: "/committee", label: "Committee" },
  { href: "/publications", label: "Publications" },
  { href: "/news", label: "News" }
]

export default function NavigationLinks() {
  const pathname = usePathname()

  return (
    <NavigationMenu>
      <NavigationMenuList className="gap-1">
        {navLinks.map((link, index) => {
          // Check if the link has sublinks
          const hasSubLinks = link.subLinks && link.subLinks.length > 0

          // Check if current path matches this link or any of its sublinks
          const isActive = hasSubLinks
            ? pathname === link.href ||
              link.subLinks.some(subLink => pathname === subLink.href)
            : pathname === link.href

          return (
            <NavigationMenuItem key={link.href} className="relative">
              {hasSubLinks ? (
                <>
                  <NavigationMenuTrigger
                    className={cn(
                      "group relative px-4 py-2 text-sm font-medium transition-all duration-200",
                      "hover:text-primary hover:bg-accent/50 rounded-lg",
                      "data-[state=open]:bg-accent/80 data-[state=open]:text-primary",
                      isActive
                        ? "text-primary bg-accent/30"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <span className="relative z-10">{link.label}</span>

                    {/* Active indicator */}
                    {isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg animate-pulse" />
                    )}

                    {/* Hover effect background */}
                    <div className="absolute inset-0 bg-gradient-to-r from-accent/0 via-accent/20 to-accent/0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </NavigationMenuTrigger>

                  <NavigationMenuContent className="overflow-hidden">
                    <div className="bg-gradient-to-b from-background to-background/95 backdrop-blur-md border border-border/50 rounded-lg shadow-xl">
                      <ul className="grid w-[220px] gap-1 p-3">
                        {link.subLinks.map((subLink, subIndex) => (
                          <li key={subLink.href}>
                            <NavigationMenuLink asChild>
                              <Link
                                href={subLink.href}
                                className={cn(
                                  "group relative block select-none rounded-lg p-3 leading-none no-underline outline-none transition-all duration-200",
                                  "hover:bg-accent/60 hover:text-accent-foreground hover:scale-[1.02]",
                                  "focus:bg-accent focus:text-accent-foreground focus:scale-[1.02]",
                                  pathname === subLink.href
                                    ? "bg-accent text-accent-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                                )}
                              >
                                <div className="relative z-10">
                                  <div className="text-sm font-medium leading-none">
                                    {subLink.label}
                                  </div>
                                </div>

                                {/* Hover gradient effect */}
                                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

                                {/* Active indicator */}
                                {pathname === subLink.href && (
                                  <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-4 bg-primary rounded-full" />
                                )}
                              </Link>
                            </NavigationMenuLink>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </NavigationMenuContent>
                </>
              ) : (
                <Link
                  href={link.href}
                  className={cn(
                    "group relative inline-flex items-center justify-center px-4 py-2 text-sm font-medium transition-all duration-200",
                    "hover:text-primary hover:bg-accent/50 rounded-lg",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
                    pathname === link.href
                      ? "text-primary bg-accent/30"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span className="relative z-10">{link.label}</span>

                  {/* Active indicator */}
                  {pathname === link.href && (
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg animate-pulse" />
                  )}

                  {/* Hover effect background */}
                  <div className="absolute inset-0 bg-gradient-to-r from-accent/0 via-accent/20 to-accent/0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {/* Bottom border indicator for active state */}
                  {pathname === link.href && (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent rounded-full" />
                  )}
                </Link>
              )}
            </NavigationMenuItem>
          )
        })}
      </NavigationMenuList>
    </NavigationMenu>
  )
}
