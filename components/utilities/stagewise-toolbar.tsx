"use client"

import { useState, useEffect } from "react"

export function StagewiseToolbar() {
  const [showToolbar, setShowToolbar] = useState(false)

  useEffect(() => {
    // Only show in development mode and client-side
    if (
      process.env.NODE_ENV === "development" &&
      typeof window !== "undefined"
    ) {
      setShowToolbar(true)
    }
  }, [])

  if (!showToolbar) {
    return null
  }

  // Dynamic import and render the component
  const StagewiseComponent = () => {
    const [ToolbarComponent, setToolbarComponent] = useState<any>(null)

    useEffect(() => {
      const loadToolbar = async () => {
        try {
          const { StagewiseToolbar } = await import("@stagewise/toolbar-next")
          setToolbarComponent(() => StagewiseToolbar)
        } catch (error) {
          console.warn("Failed to load Stagewise toolbar:", error)
        }
      }

      loadToolbar()
    }, [])

    if (!ToolbarComponent) {
      return null
    }

    const stagewiseConfig = {
      plugins: []
    }

    return <ToolbarComponent config={stagewiseConfig} />
  }

  return <StagewiseComponent />
} 