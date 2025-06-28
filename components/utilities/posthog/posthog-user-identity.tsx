/*
<ai_context>
This client component identifies users with PostHog.
</ai_context>
*/

"use client"

import { useUser } from "@clerk/nextjs"
import { usePostHog } from "posthog-js/react"
import { useEffect } from "react"

export function PostHogUserIdentify(): null {
  const { user, isLoaded } = useUser()
  const posthog = usePostHog()

  useEffect(() => {
    if (isLoaded && posthog) {
      if (user) {
        posthog.identify(user.id, {
          email: user.emailAddresses[0]?.emailAddress,
          name: user.fullName
        })
      } else {
        posthog.reset()
      }
    }
  }, [user, isLoaded, posthog])

  return null
}
