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
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Provide a consistent loading state during hydration
  if (!isClient) {
    return (
      <NextThemesProvider {...props}>
        <TooltipProvider>
          <div suppressHydrationWarning>{children}</div>
        </TooltipProvider>
      </NextThemesProvider>
    )
  }

  return (
    <NextThemesProvider {...props}>
      <TooltipProvider>
        <CSPostHogProvider>
          <OrganizationProvider>{children}</OrganizationProvider>
        </CSPostHogProvider>
      </TooltipProvider>
    </NextThemesProvider>
  )
}
