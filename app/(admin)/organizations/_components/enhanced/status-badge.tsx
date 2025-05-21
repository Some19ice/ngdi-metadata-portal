"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { organizationStatusEnum } from "@/db/schema/organizations-schema"

type StatusBadgeProps = {
  status: (typeof organizationStatusEnum.enumValues)[number]
  className?: string
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const statusColorMap: Record<string, string> = {
    active: "bg-green-100 text-green-700 hover:bg-green-100 border-green-200",
    inactive: "bg-red-100 text-red-700 hover:bg-red-100 border-red-200",
    pending_approval:
      "bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-yellow-200"
  }

  const displayText = status
    .replace(/_/g, " ")
    .replace(/\b\w/g, l => l.toUpperCase())

  return (
    <Badge
      variant="outline"
      className={cn(
        statusColorMap[status] || "bg-gray-100 text-gray-700",
        className
      )}
    >
      {displayText}
    </Badge>
  )
}
