import {
  createProfileAction,
  getProfileByUserIdAction
} from "@/actions/db/profiles-actions"
import { Toaster } from "@/components/ui/toaster"
import { PostHogPageview } from "@/components/utilities/posthog/posthog-pageview"
import { PostHogUserIdentify } from "@/components/utilities/posthog/posthog-user-identity"
import { Providers } from "@/components/utilities/providers"
import { TailwindIndicator } from "@/components/utilities/tailwind-indicator"

import { ErrorBoundary } from "@/components/utilities/error-boundary"
import { cn } from "@/lib/utils"
import { ClerkProvider } from "@clerk/nextjs"
import { auth } from "@clerk/nextjs/server"
import type { Metadata } from "next"
import "./globals.css"
import { PageLayoutSwitcher } from "@/components/layout/page-layout-switcher"

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
  authors: [{ name: "NGDI Metadata Portal Team" }],
  openGraph: {
    title: "NGDI Metadata Portal - Nigeria's Geospatial Data Hub",
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

export default async function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
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

              <PageLayoutSwitcher>
                <div>{children}</div>
              </PageLayoutSwitcher>

              <TailwindIndicator />
              <Toaster />
            </Providers>
          </ErrorBoundary>
        </body>
      </html>
    </ClerkProvider>
  )
}
