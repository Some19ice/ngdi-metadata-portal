/*
<ai_context>
This client component tracks pageviews with PostHog.
</ai_context>
*/

"use client"

import { usePathname, useSearchParams } from "next/navigation"
import { useEffect, Suspense } from "react"
import { usePostHog } from "posthog-js/react"

function PostHogPageviewInner(): null {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const posthog = usePostHog()

  useEffect(() => {
    if (pathname && posthog) {
      let url = window.origin + pathname
      if (searchParams && searchParams.toString()) {
        url = url + `?${searchParams.toString()}`
      }
      posthog.capture("$pageview", {
        $current_url: url
      })
    }
  }, [pathname, searchParams, posthog])

  return null
}

export function PostHogPageview(): JSX.Element {
  return (
    <Suspense fallback={null}>
      <PostHogPageviewInner />
    </Suspense>
  )
}
