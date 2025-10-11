"use client"

import { usePathname } from "next/navigation"
import { Footer } from "@/components/layout/footer"
import { AppSidebar } from "@/components/sidebar/app-sidebar"
import MainHeader from "@/components/layout/main-header"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { Suspense } from "react"
import ErrorBoundary from "@/components/utilities/error-boundary"

function MainHeaderFallback() {
  return (
    <div className="h-[calc(var(--banner-height)+var(--header-height))] w-full bg-background/60 border-b border-border/40 animate-pulse" />
  )
}

export function PageLayoutSwitcher({
  children
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isLanding = pathname === "/"

  if (isLanding) {
    return (
      <div className="flex flex-col min-h-screen w-full">
        <ErrorBoundary>{children}</ErrorBoundary>
        <Footer className="w-full" />
      </div>
    )
  }

  return (
    <SidebarProvider>
      <div className="flex flex-col min-h-screen w-full">
        <div className="flex flex-1 w-full">
          <AppSidebar />
          <div className="flex flex-1 flex-col w-full">
            <Suspense fallback={<MainHeaderFallback />}>
              <MainHeader />
            </Suspense>
            <SidebarInset className="flex flex-1 flex-col w-full">
              <main className="flex-1 overflow-auto p-4 md:p-6 w-full">
                <ErrorBoundary>{children}</ErrorBoundary>
              </main>
            </SidebarInset>
          </div>
        </div>
        <Footer className="w-full" />
      </div>
    </SidebarProvider>
  )
}
