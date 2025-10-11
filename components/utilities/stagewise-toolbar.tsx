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

      // Dynamic import with type assertion to avoid build-time module resolution
      const toolbarModule = await import("@stagewise/toolbar-next" as any)
      const { StagewiseToolbar } = toolbarModule
      setToolbarComponent(() => StagewiseToolbar)
    } catch (error) {
      console.warn("Failed to load Stagewise toolbar:", error)
      // Don't show error in production builds where the module doesn't exist
      if (process.env.NODE_ENV === "development") {
        setError("Failed to load development toolbar")
      }
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

  // Create a more comprehensive config
  const stagewiseConfig = {
    plugins: [],
    environment: process.env.NODE_ENV,
    enabled: true
  }

  try {
    // Wrap the component in an error boundary-like try-catch
    return (
      <div style={{ position: "fixed", zIndex: 999999 }}>
        <ToolbarComponent
          config={stagewiseConfig}
          onError={(err: any) => {
            console.warn("Stagewise toolbar error:", err)
            setError("Toolbar error")
          }}
        />
      </div>
    )
  } catch (renderError) {
    console.warn("Error rendering Stagewise toolbar:", renderError)
    // Return null instead of crashing the app
    return null
  }
}
