"use client" // StatCard itself doesn't need server/client, but consumers might. Defaulting to client for broader use.

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertTriangle } from "lucide-react"
import * as React from "react"

export interface StatCardProps {
  title: string
  value?: string | number | null
  icon: React.ElementType
  isLoading?: boolean
  error?: string | null
  description?: string
  href?: string
}

export default function StatCard({
  title,
  value,
  icon: Icon,
  isLoading,
  error,
  description,
  href
}: StatCardProps) {
  const cardContent = (
    <Card className={error ? "border-destructive" : ""}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {isLoading ? (
          <Icon className="h-4 w-4 text-muted-foreground" />
        ) : error ? (
          <AlertTriangle className="h-4 w-4 text-destructive" />
        ) : (
          <Icon className="h-4 w-4 text-muted-foreground" />
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <>
            <Skeleton className="h-8 w-20" />
            {description && <Skeleton className="h-4 w-full mt-1" />}
          </>
        ) : error ? (
          <>
            <div className="text-xs text-destructive truncate" title={error}>
              {error}
            </div>
            {description && (
              <p
                className="text-xs text-muted-foreground mt-1 truncate"
                title={description}
              >
                {description}
              </p>
            )}
          </>
        ) : (
          <>
            <div className="text-2xl font-bold">{value ?? "0"}</div>
            {description && (
              <p
                className="text-xs text-muted-foreground mt-1 truncate"
                title={description}
              >
                {description}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )

  if (href) {
    return (
      <Link
        href={href}
        className="block hover:shadow-lg transition-shadow duration-200 rounded-lg"
      >
        {cardContent}
      </Link>
    )
  }

  return cardContent
}
