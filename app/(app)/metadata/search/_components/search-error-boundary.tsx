"use client"

import React, { Component, ErrorInfo, ReactNode } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, RefreshCw, Home, Bug } from "lucide-react"

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

class SearchErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)

    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to console and external service
    console.error("Search Error Boundary caught an error:", error, errorInfo)

    // Update state with error info
    this.setState({
      error,
      errorInfo
    })

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // In production, you might want to log this to an error reporting service
    if (process.env.NODE_ENV === "production") {
      // Example: logErrorToService(error, errorInfo)
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  handleGoHome = () => {
    window.location.href = "/"
  }

  handleReportError = () => {
    // In a real app, this would open a modal or redirect to a feedback form
    const errorDetails = {
      message: this.state.error?.message,
      stack: this.state.error?.stack,
      componentStack: this.state.errorInfo?.componentStack
    }

    console.log("Error details for reporting:", errorDetails)

    // For now, just copy to clipboard
    navigator.clipboard
      .writeText(JSON.stringify(errorDetails, null, 2))
      .then(() => alert("Error details copied to clipboard"))
      .catch(() => alert("Unable to copy error details"))
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <div className="min-h-[400px] flex items-center justify-center p-4">
          <Card className="max-w-lg w-full">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                <span>Search Error</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Something went wrong while loading the search interface. This
                  is likely a temporary issue.
                </AlertDescription>
              </Alert>

              {/* Error details in development */}
              {process.env.NODE_ENV === "development" && this.state.error && (
                <div className="space-y-2">
                  <details className="bg-gray-50 p-3 rounded-md">
                    <summary className="cursor-pointer text-sm font-medium">
                      Error Details (Development)
                    </summary>
                    <div className="mt-2 text-xs font-mono bg-white p-2 rounded border overflow-auto max-h-32">
                      <div className="text-red-600 font-bold">
                        {this.state.error.name}: {this.state.error.message}
                      </div>
                      {this.state.error.stack && (
                        <pre className="mt-1 text-gray-600 whitespace-pre-wrap">
                          {this.state.error.stack}
                        </pre>
                      )}
                    </div>
                  </details>

                  {this.state.errorInfo?.componentStack && (
                    <details className="bg-gray-50 p-3 rounded-md">
                      <summary className="cursor-pointer text-sm font-medium">
                        Component Stack
                      </summary>
                      <pre className="mt-2 text-xs font-mono bg-white p-2 rounded border overflow-auto max-h-32 whitespace-pre-wrap">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={this.handleRetry}
                  className="flex-1"
                  variant="default"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>

                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="flex-1"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Go Home
                </Button>
              </div>

              {/* Report error button */}
              <Button
                onClick={this.handleReportError}
                variant="ghost"
                size="sm"
                className="w-full text-xs"
              >
                <Bug className="h-3 w-3 mr-1" />
                Report this error
              </Button>

              <div className="text-xs text-gray-500 text-center">
                If this problem persists, please contact support with the error
                details above.
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

export default SearchErrorBoundary

// Hook for functional components to handle errors
export const useSearchErrorHandler = () => {
  const handleError = (error: Error, context?: string) => {
    console.error(`Search error${context ? ` in ${context}` : ""}:`, error)

    // In production, log to error service
    if (process.env.NODE_ENV === "production") {
      // logErrorToService(error, { context })
    }
  }

  const wrapAsync = <T extends any[], R>(
    asyncFn: (...args: T) => Promise<R>,
    context?: string
  ) => {
    return async (...args: T): Promise<R | null> => {
      try {
        return await asyncFn(...args)
      } catch (error) {
        handleError(error as Error, context)
        return null
      }
    }
  }

  return { handleError, wrapAsync }
}
