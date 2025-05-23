"use client"

import React, { Component, ErrorInfo, ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw, AlertTriangle } from "lucide-react"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

class MapErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error for debugging
    console.error("Map Error Boundary caught an error:", error, errorInfo)

    // Check if this is the specific Leaflet initialization error
    if (error.message.includes("Map container is already initialized")) {
      console.warn(
        "Leaflet map container re-initialization detected. This is likely due to React Strict Mode in development."
      )
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default fallback UI
      return (
        <div className="w-full h-80 bg-gray-50 border border-gray-200 rounded-md flex items-center justify-center">
          <div className="text-center p-6">
            <AlertTriangle className="mx-auto h-12 w-12 text-amber-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Map Loading Error
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {this.state.error?.message.includes(
                "Map container is already initialized"
              )
                ? "The map is being reloaded. This can happen during development."
                : "There was an error loading the map component."}
            </p>
            <Button onClick={this.handleRetry} variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default MapErrorBoundary
