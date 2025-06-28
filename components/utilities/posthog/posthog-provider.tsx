/*
<ai_context>
This client component provides the PostHog provider for the app.
</ai_context>
*/

"use client"

import posthog from "posthog-js"
import { PostHogProvider } from "posthog-js/react"
import { useEffect, useState } from "react"

export function CSPostHogProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      process.env.NEXT_PUBLIC_POSTHOG_KEY &&
      process.env.NEXT_PUBLIC_POSTHOG_HOST
    ) {
      try {
        // Check if PostHog is already initialized by checking its config
        if (!posthog.__loaded) {
          posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
            api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
            person_profiles: "identified_only",
            // Prevent loading issues
            loaded: () => {
              setIsInitialized(true)
            }
          })
        } else {
          setIsInitialized(true)
        }
      } catch (error) {
        console.warn("Failed to initialize PostHog:", error)
        setIsInitialized(true) // Continue without PostHog
      }
    } else {
      setIsInitialized(true)
    }
  }, [])

  // Render children immediately but with PostHog context only when ready
  if (!isInitialized) {
    return <div suppressHydrationWarning>{children}</div>
  }

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>
}
