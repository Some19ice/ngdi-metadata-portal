"use client"

import { useState, useEffect, useCallback } from "react"

export function StagewiseToolbar() {
  const [showToolbar, setShowToolbar] = useState(false)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    // Only show in development mode and client-side
    if (process.env.NODE_ENV === "development") {
      setShowToolbar(true)
    }
  }, [])

  // Don't render anything on server or if not in development
  if (!isClient || !showToolbar) {
    return null
  }

  return <StagewiseComponent />
}

// Separate component to handle the dynamic import
function StagewiseComponent() {
  const [ToolbarComponent, setToolbarComponent] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadToolbar = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const { StagewiseToolbar } = await import("@stagewise/toolbar-next")
      setToolbarComponent(StagewiseToolbar)
    } catch (error) {
      console.warn("Failed to load Stagewise toolbar:", error)
      setError("Failed to load development toolbar")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    // Add a small delay to ensure the component is fully mounted
    const timer = setTimeout(() => {
      loadToolbar()
    }, 100)

    return () => clearTimeout(timer)
  }, [loadToolbar])

  if (isLoading) {
    return null // Don't show loading state for dev toolbar
  }

  if (error || !ToolbarComponent) {
    return null // Silently fail for dev toolbar
  }

  const stagewiseConfig = {
    plugins: []
  }

  try {
    return <ToolbarComponent config={stagewiseConfig} />
  } catch (error) {
    console.warn("Error rendering Stagewise toolbar:", error)
    return null
  }
}
