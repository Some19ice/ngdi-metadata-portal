"use client"

import React, { Component, ReactNode, ErrorInfo } from "react"
import { AlertCircle, RefreshCw, Home, Bug } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  resetKeys?: Array<string | number>
  resetOnPropsChange?: boolean
  isolate?: boolean
  level?: "page" | "section" | "component"
  showDetails?: boolean
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  errorCount: number
  lastErrorTime: number
}

export class MapErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: NodeJS.Timeout | null = null
  private readonly ERROR_RESET_TIME = 5000 // 5 seconds
  private readonly MAX_ERROR_COUNT = 3

  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
      lastErrorTime: 0
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      lastErrorTime: Date.now()
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError } = this.props
    const { errorCount, lastErrorTime } = this.state

    // Track error frequency
    const now = Date.now()
    const timeSinceLastError = now - lastErrorTime
    const newErrorCount =
      timeSinceLastError < this.ERROR_RESET_TIME ? errorCount + 1 : 1

    // Log error details
    console.error("Map Error Boundary caught an error:", {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorCount: newErrorCount,
      level: this.props.level || "component"
    })

    // Update state with error info
    this.setState({
      errorInfo,
      errorCount: newErrorCount
    })

    // Call custom error handler
    if (onError) {
      onError(error, errorInfo)
    }

    // Track in PostHog if available
    if (typeof window !== "undefined" && (window as any).posthog) {
      ;(window as any).posthog.capture("map_error_boundary_triggered", {
        error_message: error.message,
        error_stack: error.stack,
        component_stack: errorInfo.componentStack,
        error_count: newErrorCount,
        level: this.props.level || "component"
      })
    }

    // Auto-reset after delay if not too many errors
    if (newErrorCount < this.MAX_ERROR_COUNT) {
      this.scheduleReset()
    }
  }

  componentDidUpdate(prevProps: Props) {
    const { resetKeys, resetOnPropsChange } = this.props
    const { hasError } = this.state

    if (hasError) {
      // Reset on prop changes if enabled
      if (resetOnPropsChange && prevProps.children !== this.props.children) {
        this.resetErrorBoundary()
      }

      // Reset if resetKeys changed
      if (resetKeys && prevProps.resetKeys) {
        const hasResetKeyChanged = resetKeys.some(
          (key, index) => key !== prevProps.resetKeys![index]
        )
        if (hasResetKeyChanged) {
          this.resetErrorBoundary()
        }
      }
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId)
    }
  }

  scheduleReset = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId)
    }

    this.resetTimeoutId = setTimeout(() => {
      this.resetErrorBoundary()
    }, this.ERROR_RESET_TIME)
  }

  resetErrorBoundary = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId)
      this.resetTimeoutId = null
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = "/"
  }

  handleReportBug = () => {
    const { error, errorInfo } = this.state
    const errorDetails = {
      message: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    }

    // Copy error details to clipboard
    navigator.clipboard.writeText(JSON.stringify(errorDetails, null, 2))

    // Show toast or alert
    alert(
      "Error details copied to clipboard. Please include them in your bug report."
    )

    // Open bug report page/form
    window.open("/contact?type=bug", "_blank")
  }

  render() {
    const { hasError, error, errorInfo, errorCount } = this.state
    const {
      children,
      fallback,
      isolate,
      level = "component",
      showDetails = false
    } = this.props

    if (hasError && error) {
      // Use custom fallback if provided
      if (fallback) {
        return <>{fallback}</>
      }

      const isRecurringError = errorCount >= this.MAX_ERROR_COUNT
      const errorLevel =
        level === "page"
          ? "Page"
          : level === "section"
            ? "Section"
            : "Component"

      return (
        <div className={`${isolate ? "error-boundary-isolated" : ""} p-4`}>
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                {errorLevel} Error
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertTitle>Something went wrong</AlertTitle>
                <AlertDescription>
                  {isRecurringError
                    ? "This component is experiencing repeated errors. Please try reloading the page."
                    : "An unexpected error occurred. The component will try to recover automatically."}
                </AlertDescription>
              </Alert>

              {showDetails && (
                <div className="space-y-2">
                  <details className="cursor-pointer">
                    <summary className="font-medium text-sm">
                      Error Details
                    </summary>
                    <div className="mt-2 space-y-2">
                      <div className="p-3 bg-muted rounded-md">
                        <p className="text-sm font-mono break-all">
                          {error.message}
                        </p>
                      </div>
                      {error.stack && (
                        <div className="p-3 bg-muted rounded-md max-h-40 overflow-auto">
                          <pre className="text-xs">{error.stack}</pre>
                        </div>
                      )}
                    </div>
                  </details>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {!isRecurringError && (
                  <Button
                    onClick={this.resetErrorBoundary}
                    variant="default"
                    size="sm"
                    className="gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Try Again
                  </Button>
                )}

                <Button
                  onClick={this.handleReload}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Reload Page
                </Button>

                {level === "page" && (
                  <Button
                    onClick={this.handleGoHome}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <Home className="h-4 w-4" />
                    Go Home
                  </Button>
                )}

                <Button
                  onClick={this.handleReportBug}
                  variant="ghost"
                  size="sm"
                  className="gap-2"
                >
                  <Bug className="h-4 w-4" />
                  Report Issue
                </Button>
              </div>

              {!isRecurringError && errorCount > 1 && (
                <p className="text-sm text-muted-foreground">
                  Error occurred {errorCount} times. Will stop auto-recovery
                  after {this.MAX_ERROR_COUNT} attempts.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )
    }

    return <>{children}</>
  }
}

// Convenience wrapper for functional components
export function withMapErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, "children">
) {
  const WrappedComponent = (props: P) => (
    <MapErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </MapErrorBoundary>
  )

  WrappedComponent.displayName = `withMapErrorBoundary(${Component.displayName || Component.name})`

  return WrappedComponent
}
