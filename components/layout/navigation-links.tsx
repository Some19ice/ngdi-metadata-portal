"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronDown } from "lucide-react"
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
    subLinks: [
      { href: "/map", label: "Main Map" },
      { href: "/map/metadata-demo", label: "Metadata Map" }
    ]
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
      <NavigationMenuList>
        {navLinks.map(link => {
          // Check if the link has sublinks
          const hasSubLinks = link.subLinks && link.subLinks.length > 0

          // Check if current path matches this link or any of its sublinks
          const isActive = hasSubLinks
            ? pathname === link.href ||
              link.subLinks.some(subLink => pathname === subLink.href)
            : pathname === link.href

          return (
            <NavigationMenuItem key={link.href}>
              {hasSubLinks ? (
                <>
                  <NavigationMenuTrigger
                    className={cn(
                      "hover:text-primary text-sm font-medium transition-colors",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    {link.label}
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[200px] gap-3 p-4">
                      {link.subLinks.map(subLink => (
                        <li key={subLink.href}>
                          <NavigationMenuLink asChild>
                            <Link
                              href={subLink.href}
                              className={cn(
                                "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                                pathname === subLink.href
                                  ? "bg-accent text-accent-foreground"
                                  : "text-muted-foreground"
                              )}
                            >
                              <div className="text-sm font-medium leading-none">
                                {subLink.label}
                              </div>
                            </Link>
                          </NavigationMenuLink>
                        </li>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </>
              ) : (
                <Link
                  href={link.href}
                  className={cn(
                    navigationMenuTriggerStyle(),
                    "hover:text-primary text-sm font-medium transition-colors",
                    pathname === link.href
                      ? "text-primary"
                      : "text-muted-foreground"
                  )}
                >
                  {link.label}
                </Link>
              )}
            </NavigationMenuItem>
          )
        })}
      </NavigationMenuList>
    </NavigationMenu>
  )
}
