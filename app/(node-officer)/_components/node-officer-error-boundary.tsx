"use client"

import ErrorBoundary from "@/components/utilities/error-boundary"
import AsyncErrorBoundary from "@/components/utilities/async-error-boundary"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { ShieldAlert, RefreshCw, User, Building } from "lucide-react"
import Link from "next/link"

interface NodeOfficerErrorBoundaryProps {
  children: React.ReactNode
  organizationId?: string
  feature?: "dashboard" | "users" | "approval" | "analytics"
  level?: "page" | "section" | "component"
}

export default function NodeOfficerErrorBoundary({
  children,
  organizationId,
  feature,
  level = "section"
}: NodeOfficerErrorBoundaryProps) {
  const handleError = (error: Error, errorInfo: any) => {
    // Log specific node officer errors
    console.error(`Node Officer ${feature} Error:`, {
      error: error.message,
      stack: error.stack,
      organizationId,
      feature,
      level,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString()
    })

    // You could send this to an error tracking service
    // Example: trackNodeOfficerError({ error, organizationId, feature })
  }

  const renderCustomFallback = () => {
    if (level === "page") {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
          <div className="text-center max-w-md">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <ShieldAlert className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Node Officer Dashboard Error
            </h1>
            <p className="text-gray-600 mb-6">
              There was an issue loading the Node Officer dashboard. This might
              be due to a permissions issue or a temporary server problem.
            </p>
            <div className="space-y-3">
              <Button asChild className="w-full">
                <Link
                  href={`/app/(node-officer)/officer-dashboard${organizationId ? `?orgId=${organizationId}` : ""}`}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reload Dashboard
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href="/app">
                  <Building className="mr-2 h-4 w-4" />
                  Return to Main App
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return (
      <Alert variant="destructive">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>
          {feature === "dashboard" && "Dashboard Error"}
          {feature === "users" && "User Management Error"}
          {feature === "approval" && "Approval Queue Error"}
          {feature === "analytics" && "Analytics Error"}
          {!feature && "Node Officer Error"}
        </AlertTitle>
        <AlertDescription>
          <div className="space-y-2">
            <p>
              {feature === "dashboard" &&
                "Unable to load the dashboard. This could be a permissions or data loading issue."}
              {feature === "users" &&
                "Unable to load user management features. Please check your permissions."}
              {feature === "approval" &&
                "Unable to load the metadata approval queue. Please try again."}
              {feature === "analytics" &&
                "Unable to load analytics data. The reporting service may be temporarily unavailable."}
              {!feature && "An error occurred in the Node Officer interface."}
            </p>

            <div className="flex gap-2 mt-3">
              <Button size="sm" onClick={() => window.location.reload()}>
                <RefreshCw className="mr-2 h-3 w-3" />
                Reload
              </Button>

              {organizationId && (
                <Button size="sm" variant="outline" asChild>
                  <Link
                    href={`/app/(node-officer)/officer-dashboard?orgId=${organizationId}`}
                  >
                    <Building className="mr-2 h-3 w-3" />
                    Dashboard
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <ErrorBoundary
      level={level}
      onError={handleError}
      fallback={renderCustomFallback()}
      showErrorDetails={process.env.NODE_ENV === "development"}
    >
      <AsyncErrorBoundary
        onRetry={() => window.location.reload()}
        retryCount={2}
      >
        {children}
      </AsyncErrorBoundary>
    </ErrorBoundary>
  )
}

// Specialized error boundaries for specific features
export function DashboardErrorBoundary({
  children,
  organizationId
}: {
  children: React.ReactNode
  organizationId?: string
}) {
  return (
    <NodeOfficerErrorBoundary
      organizationId={organizationId}
      feature="dashboard"
      level="section"
    >
      {children}
    </NodeOfficerErrorBoundary>
  )
}

export function UserManagementErrorBoundary({
  children,
  organizationId
}: {
  children: React.ReactNode
  organizationId?: string
}) {
  return (
    <NodeOfficerErrorBoundary
      organizationId={organizationId}
      feature="users"
      level="section"
    >
      {children}
    </NodeOfficerErrorBoundary>
  )
}

export function ApprovalQueueErrorBoundary({
  children,
  organizationId
}: {
  children: React.ReactNode
  organizationId?: string
}) {
  return (
    <NodeOfficerErrorBoundary
      organizationId={organizationId}
      feature="approval"
      level="component"
    >
      {children}
    </NodeOfficerErrorBoundary>
  )
}

export function AnalyticsErrorBoundary({
  children,
  organizationId
}: {
  children: React.ReactNode
  organizationId?: string
}) {
  return (
    <NodeOfficerErrorBoundary
      organizationId={organizationId}
      feature="analytics"
      level="component"
    >
      {children}
    </NodeOfficerErrorBoundary>
  )
}
