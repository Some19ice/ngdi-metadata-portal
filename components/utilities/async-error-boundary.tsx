"use client"

import { useState, useEffect } from "react"
import ErrorBoundary from "./error-boundary"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertTriangle, RefreshCw, Wifi, WifiOff } from "lucide-react"

interface AsyncErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  loadingFallback?: React.ReactNode
  onRetry?: () => void | Promise<void>
  retryCount?: number
  showRetryButton?: boolean
}

interface AsyncErrorState {
  hasError: boolean
  error: Error | null
  isRetrying: boolean
  retryAttempts: number
  isOnline: boolean
}

export default function AsyncErrorBoundary({
  children,
  fallback,
  loadingFallback,
  onRetry,
  retryCount = 3,
  showRetryButton = true
}: AsyncErrorBoundaryProps) {
  const [asyncState, setAsyncState] = useState<AsyncErrorState>({
    hasError: false,
    error: null,
    isRetrying: false,
    retryAttempts: 0,
    isOnline: navigator.onLine
  })

  // Monitor online status
  useEffect(() => {
    const handleOnline = () =>
      setAsyncState(prev => ({ ...prev, isOnline: true }))
    const handleOffline = () =>
      setAsyncState(prev => ({ ...prev, isOnline: false }))

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  const handleAsyncError = (error: Error) => {
    setAsyncState(prev => ({
      ...prev,
      hasError: true,
      error,
      isRetrying: false
    }))
  }

  const handleRetry = async () => {
    if (asyncState.retryAttempts >= retryCount) {
      return
    }

    setAsyncState(prev => ({
      ...prev,
      isRetrying: true,
      retryAttempts: prev.retryAttempts + 1
    }))

    try {
      if (onRetry) {
        await onRetry()
      }

      setAsyncState(prev => ({
        ...prev,
        hasError: false,
        error: null,
        isRetrying: false
      }))
    } catch (error) {
      handleAsyncError(error as Error)
    }
  }

  const renderAsyncErrorFallback = () => {
    const { error, isRetrying, retryAttempts, isOnline } = asyncState

    // Network error
    if (!isOnline) {
      return (
        <Alert variant="destructive">
          <WifiOff className="h-4 w-4" />
          <AlertTitle>No Internet Connection</AlertTitle>
          <AlertDescription>
            Please check your internet connection and try again.
            <div className="mt-3">
              <Button
                size="sm"
                variant="outline"
                onClick={handleRetry}
                disabled={isRetrying}
              >
                <RefreshCw
                  className={`mr-2 h-3 w-3 ${isRetrying ? "animate-spin" : ""}`}
                />
                {isRetrying ? "Checking..." : "Try Again"}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )
    }

    // API/Data loading error
    if (error) {
      const isNetworkError =
        error.message.includes("fetch") || error.message.includes("network")
      const isTimeoutError = error.message.includes("timeout")
      const canRetry = retryAttempts < retryCount && showRetryButton

      return (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>
            {isNetworkError
              ? "Network Error"
              : isTimeoutError
                ? "Request Timeout"
                : "Loading Error"}
          </AlertTitle>
          <AlertDescription>
            {isNetworkError &&
              "Unable to connect to the server. Please check your connection."}
            {isTimeoutError &&
              "The request took too long to complete. Please try again."}
            {!isNetworkError &&
              !isTimeoutError &&
              (error.message || "Failed to load data.")}

            {canRetry && (
              <div className="mt-3 flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRetry}
                  disabled={isRetrying}
                >
                  <RefreshCw
                    className={`mr-2 h-3 w-3 ${isRetrying ? "animate-spin" : ""}`}
                  />
                  {isRetrying
                    ? "Retrying..."
                    : `Retry (${retryCount - retryAttempts} left)`}
                </Button>
                {isOnline && (
                  <div className="flex items-center text-sm text-green-600">
                    <Wifi className="mr-1 h-3 w-3" />
                    Online
                  </div>
                )}
              </div>
            )}

            {!canRetry && retryAttempts >= retryCount && (
              <div className="mt-3 text-sm text-muted-foreground">
                Maximum retry attempts reached. Please refresh the page or
                contact support if the problem persists.
              </div>
            )}
          </AlertDescription>
        </Alert>
      )
    }

    return null
  }

  if (asyncState.isRetrying && loadingFallback) {
    return <>{loadingFallback}</>
  }

  if (asyncState.isRetrying) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    )
  }

  if (asyncState.hasError) {
    if (fallback) {
      return <>{fallback}</>
    }
    return renderAsyncErrorFallback()
  }

  return (
    <ErrorBoundary
      level="component"
      onError={handleAsyncError}
      fallback={asyncState.hasError ? renderAsyncErrorFallback() : undefined}
    >
      {children}
    </ErrorBoundary>
  )
}

// Hook for handling async errors in components
export function useAsyncError() {
  const [error, setError] = useState<Error | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const executeAsync = async <T,>(
    asyncFn: () => Promise<T>
  ): Promise<T | null> => {
    try {
      setIsLoading(true)
      setError(null)
      const result = await asyncFn()
      return result
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Unknown error occurred")
      setError(error)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const clearError = () => setError(null)

  return {
    error,
    isLoading,
    executeAsync,
    clearError,
    hasError: !!error
  }
}
