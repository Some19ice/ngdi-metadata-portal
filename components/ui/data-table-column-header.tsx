"use client"

import { Column } from "@tanstack/react-table"
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface DataTableColumnHeaderProps<TData, TValue>
  extends React.HTMLAttributes<HTMLDivElement> {
  // column: Column<TData, TValue> // Not needed if we pass sorting state directly
  title: string
  columnId: string
  onSort: (columnId: string, sortOrder: "asc" | "desc") => void
  currentSortBy: string
  currentSortOrder: "asc" | "desc"
  className?: string
}

export function DataTableColumnHeader<TData, TValue>({
  title,
  columnId,
  onSort,
  currentSortBy,
  currentSortOrder,
  className
}: DataTableColumnHeaderProps<TData, TValue>) {
  const isSorted = currentSortBy === columnId
  const sortIcon = isSorted ? (
    currentSortOrder === "asc" ? (
      <ArrowUp className="ml-2 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4" />
    )
  ) : (
    <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
  )

  const handleSortClick = () => {
    if (isSorted) {
      onSort(columnId, currentSortOrder === "asc" ? "desc" : "asc")
    } else {
      onSort(columnId, "asc") // Default to ascending when sorting a new column
    }
  }

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleSortClick}
        className="-ml-3 h-8 data-[state=open]:bg-accent"
      >
        <span>{title}</span>
        {sortIcon}
      </Button>
    </div>
  )
}
