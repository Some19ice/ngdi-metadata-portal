"use client"

import { useEffect } from "react"

export function StagewiseToolbar() {
  useEffect(() => {
    // Only initialize in development mode
    if (process.env.NODE_ENV === "development") {
      const initStagewise = async () => {
        try {
          const { StagewiseToolbar } = await import("@stagewise/toolbar-next")

          const stagewiseConfig = {
            plugins: []
          }

          // Create a container for the toolbar if it doesn't exist
          let toolbarContainer = document.getElementById(
            "stagewise-toolbar-container"
          )
          if (!toolbarContainer) {
            toolbarContainer = document.createElement("div")
            toolbarContainer.id = "stagewise-toolbar-container"
            document.body.appendChild(toolbarContainer)
          }

          // Initialize the toolbar
          const { createRoot } = await import("react-dom/client")
          const root = createRoot(toolbarContainer)
          root.render(<StagewiseToolbar config={stagewiseConfig} />)
        } catch (error) {
          console.warn("Failed to initialize Stagewise toolbar:", error)
        }
      }

      initStagewise()
    }
  }, [])

  // This component doesn't render anything visible
  return null
}
