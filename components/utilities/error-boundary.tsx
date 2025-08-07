"use client"

import React, { Component, ErrorInfo, ReactNode } from "react"
import { AlertTriangle, RefreshCw, Home, Bug } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  level?: "page" | "section" | "component"
  showErrorDetails?: boolean
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  }

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo)

    this.setState({
      error,
      errorInfo
    })

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // Log error to external service
    this.logErrorToService(error, errorInfo)
  }

  private logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    try {
      // Here you would integrate with your error reporting service
      // For example: Sentry, LogRocket, Bugsnag, etc.
      const errorData = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        level: this.props.level || "component"
      }

      // For now, we'll just log to console
      // In production, replace with your error service
      console.error("Error logged:", errorData)

      // Example: window.errorService?.captureException(error, { extra: errorData })
    } catch (logError) {
      console.error("Failed to log error:", logError)
    }
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  private handleReload = () => {
    window.location.reload()
  }

  private handleGoHome = () => {
    window.location.href = "/"
  }

  public render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default fallback UI based on level
      return this.renderDefaultFallback()
    }

    return this.props.children
  }

  private renderDefaultFallback() {
    const { level = "component", showErrorDetails = false } = this.props
    const { error, errorInfo } = this.state

    // Page-level error
    if (level === "page") {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <Card className="w-full max-w-lg">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle className="text-xl font-semibold text-gray-900">
                Oops! Something went wrong
              </CardTitle>
              <CardDescription>
                We apologize for the inconvenience. The page encountered an
                unexpected error.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {showErrorDetails && error && (
                <Alert variant="destructive">
                  <Bug className="h-4 w-4" />
                  <AlertTitle>Error Details</AlertTitle>
                  <AlertDescription className="mt-2 text-xs font-mono">
                    {error.message}
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex flex-col sm:flex-row gap-2">
                <Button onClick={this.handleRetry} className="flex-1">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
                <Button
                  variant="outline"
                  onClick={this.handleReload}
                  className="flex-1"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reload Page
                </Button>
                <Button
                  variant="outline"
                  onClick={this.handleGoHome}
                  className="flex-1"
                >
                  <Home className="mr-2 h-4 w-4" />
                  Go Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    // Section-level error
    if (level === "section") {
      return (
        <div className="py-8">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Section Error</AlertTitle>
            <AlertDescription className="mt-2">
              This section failed to load properly. You can try refreshing this
              section or continue using other parts of the application.
              {showErrorDetails && error && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm font-medium">
                    Error Details
                  </summary>
                  <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                    {error.message}
                  </pre>
                </details>
              )}
              <div className="mt-4 flex gap-2">
                <Button size="sm" onClick={this.handleRetry}>
                  <RefreshCw className="mr-2 h-3 w-3" />
                  Retry
                </Button>
                <Button size="sm" variant="outline" onClick={this.handleReload}>
                  Reload Page
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      )
    }

    // Component-level error (default)
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-red-400" />
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-red-800">
              Component Error
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <p>This component failed to render properly.</p>

              {showErrorDetails && error && (
                <details className="mt-2">
                  <summary className="cursor-pointer font-medium">
                    Show Details
                  </summary>
                  <pre className="mt-1 text-xs bg-red-100 p-2 rounded overflow-auto">
                    {error.message}
                  </pre>
                </details>
              )}
            </div>
            <div className="mt-3">
              <Button
                size="sm"
                variant="outline"
                onClick={this.handleRetry}
                className="text-red-700 border-red-300 hover:bg-red-100"
              >
                <RefreshCw className="mr-1 h-3 w-3" />
                Retry
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default ErrorBoundary

// Hook for functional components to trigger error boundaries
export function useErrorHandler() {
  return (error: Error, errorInfo?: any) => {
    console.error("Error caught by useErrorHandler:", error, errorInfo)
    // Force re-render by throwing error
    throw error
  }
}

// HOC for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, "children">
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`

  return WrappedComponent
}
