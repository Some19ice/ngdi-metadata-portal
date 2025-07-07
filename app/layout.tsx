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
import { ErrorBoundary } from "@/components/utilities/error-boundary"
import { cn } from "@/lib/utils"
import { ClerkProvider } from "@clerk/nextjs"
import { auth } from "@clerk/nextjs/server"
import type { Metadata } from "next"
import "./globals.css"
import { PageLayoutSwitcher } from "@/components/layout/page-layout-switcher"
import { Suspense } from "react"
import { headers } from "next/headers"
import Link from "next/link"

// Ensure this layout is evaluated per-request so we can reliably detect the pathname
export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "NGDI Portal - National Geospatial Data Infrastructure",
  description:
    "Discover, access, and utilize comprehensive geospatial metadata for informed decision-making and research across Nigeria. The official portal for Nigeria's National Geospatial Data Infrastructure.",
  keywords: [
    "Nigeria",
    "geospatial",
    "GIS",
    "metadata",
    "NGDI",
    "mapping",
    "spatial data"
  ],
  authors: [{ name: "NGDI Portal Team" }],
  openGraph: {
    title: "NGDI Portal - Nigeria's Geospatial Data Hub",
    description:
      "Explore Nigeria's comprehensive geospatial data infrastructure with advanced search, interactive mapping, and standardized metadata.",
    url: "https://ngdi-portal.gov.ng",
    siteName: "NGDI Portal",
    locale: "en_NG",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "NGDI Portal - Nigeria's Geospatial Data Hub",
    description:
      "Discover, access, and utilize Nigeria's geospatial data resources."
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1
    }
  }
}

// Simple skeleton fallback for MainHeader during suspense/hydration
function MainHeaderFallback() {
  return (
    <div
      className="h-[calc(var(--banner-height)+var(--header-height))] w-full bg-background/60 border-b border-border/40 animate-pulse"
      aria-hidden="true"
    />
  )
}

// Landing page header component (simplified)
function LandingHeader() {
  return (
    <div className="absolute top-0 left-0 right-0 z-50">
      <div className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <div className="text-white font-bold text-xl">NGDI Portal</div>
            <div className="hidden md:flex space-x-6">
              <Link
                href="/about"
                className="text-white/90 hover:text-white transition-colors"
              >
                About
              </Link>
              <Link
                href="/metadata/search"
                className="text-white/90 hover:text-white transition-colors"
              >
                Search
              </Link>
              <Link
                href="/map"
                className="text-white/90 hover:text-white transition-colors"
              >
                Map
              </Link>
              <Link
                href="/docs"
                className="text-white/90 hover:text-white transition-colors"
              >
                Documentation
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              href="/login"
              className="text-white/90 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="bg-white text-slate-900 px-4 py-2 rounded-lg font-semibold hover:bg-white/90 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </nav>
      </div>
    </div>
  )
}

export default async function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  // Get the current pathname to determine if we're on the landing page
  const pathname = (await headers()).get("x-pathname") ?? "__unknown__"

  const isLandingPage = pathname === "/"

  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body
          className={cn(
            "bg-background min-h-screen w-full scroll-smooth antialiased"
          )}
        >
          <ErrorBoundary>
            <Providers
              attribute="class"
              defaultTheme="light"
              enableSystem={false}
              disableTransitionOnChange
            >
              <PostHogUserIdentify />
              <PostHogPageview />

              <PageLayoutSwitcher initialIsLanding={isLandingPage}>
                <div suppressHydrationWarning>{children}</div>
              </PageLayoutSwitcher>

              <TailwindIndicator />
              <Toaster />
              <StagewiseToolbar />
            </Providers>
          </ErrorBoundary>
        </body>
      </html>
    </ClerkProvider>
  )
}
