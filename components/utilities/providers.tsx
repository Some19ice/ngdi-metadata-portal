/*
<ai_context>
This client component provides the providers for the app.
</ai_context>
*/

"use client"

import { TooltipProvider } from "@/components/ui/tooltip"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { type ThemeProviderProps } from "next-themes"
import { CSPostHogProvider } from "./posthog/posthog-provider"
import { OrganizationProvider } from "@/contexts/organization-context"
import { useState, useEffect } from "react"

export const Providers = ({ children, ...props }: ThemeProviderProps) => {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // During hydration, render a consistent skeleton to prevent mismatches
  if (!mounted) {
    return (
      <div suppressHydrationWarning>
        <NextThemesProvider
          {...props}
          attribute="class"
          defaultTheme="system"
          enableSystem
        >
          <TooltipProvider>
            <div className="min-h-screen bg-background text-foreground">
              {children}
            </div>
          </TooltipProvider>
        </NextThemesProvider>
      </div>
    )
  }

  return (
    <NextThemesProvider
      {...props}
      attribute="class"
      defaultTheme="system"
      enableSystem
    >
      <TooltipProvider>
        <CSPostHogProvider>
          <OrganizationProvider>{children}</OrganizationProvider>
        </CSPostHogProvider>
      </TooltipProvider>
    </NextThemesProvider>
  )
}
