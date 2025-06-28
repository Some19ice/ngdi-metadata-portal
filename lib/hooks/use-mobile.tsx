/*
<ai_context>
Hook to check if the user is on a mobile device.
</ai_context>
*/

import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  // Start with false to prevent hydration mismatches
  const [isMobile, setIsMobile] = React.useState<boolean>(false)
  const [isInitialized, setIsInitialized] = React.useState<boolean>(false)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }

    // Set initial value and mark as initialized
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    setIsInitialized(true)

    mql.addEventListener("change", onChange)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  // Return false during SSR and before initialization to prevent hydration mismatches
  return isInitialized ? isMobile : false
}
