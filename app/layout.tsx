/*
<ai_context>
The root server layout for the app.
</ai_context>
*/

import {
  createProfileAction,
  getProfileByUserIdAction
} from "@/actions/db/profiles-actions"
import MainHeader from "@/components/layout/main-header"
import { Toaster } from "@/components/ui/toaster"
import { PostHogPageview } from "@/components/utilities/posthog/posthog-pageview"
import { PostHogUserIdentify } from "@/components/utilities/posthog/posthog-user-identity"
import { Providers } from "@/components/utilities/providers"
import { TailwindIndicator } from "@/components/utilities/tailwind-indicator"
import { StagewiseToolbar } from "@/components/utilities/stagewise-toolbar"
import { cn } from "@/lib/utils"
import { ClerkProvider } from "@clerk/nextjs"
import { auth } from "@clerk/nextjs/server"
import type { Metadata } from "next"
// Temporarily remove Google font
// import { Inter } from "next/font/google"
import "./globals.css"
import Footer from "@/components/footer"
import { AppSidebar } from "@/components/sidebar/app-sidebar"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"

// Temporarily disable Google font
// const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "NGDI Portal",
  description: "National Geospatial Data Infrastructure Portal"
}

// ... existing imports

export default async function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  // ... existing code

  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body
          className={cn(
            "bg-background min-h-screen w-full scroll-smooth antialiased"
            // Temporarily disable Google font
            // inter.className
          )}
        >
          <Providers
            attribute="class"
            defaultTheme="light"
            enableSystem={false}
            disableTransitionOnChange
          >
            <PostHogUserIdentify />
            <PostHogPageview />

            <SidebarProvider>
              <div className="flex flex-col min-h-screen w-full">
                <div className="flex flex-1 w-full">
                  <AppSidebar />
                  <div className="flex flex-1 flex-col w-full">
                    <MainHeader />
                    <SidebarInset className="flex flex-1 flex-col w-full">
                      <main className="flex-1 overflow-auto p-4 md:p-6 w-full">
                        {children}
                      </main>
                    </SidebarInset>
                  </div>
                </div>
                <Footer className="w-full" />
              </div>
            </SidebarProvider>

            <TailwindIndicator />

            <Toaster />

            {/* Stagewise Toolbar - Development Only */}
            <StagewiseToolbar />
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  )
}
