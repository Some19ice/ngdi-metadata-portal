"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  showFirstLast?: boolean
  showPrevNext?: boolean
  maxVisiblePages?: number
  disabled?: boolean
  className?: string
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  showFirstLast = true,
  showPrevNext = true,
  maxVisiblePages = 5,
  disabled = false,
  className
}: PaginationProps) {
  const getVisiblePages = () => {
    if (totalPages <= maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    const half = Math.floor(maxVisiblePages / 2)
    let start = Math.max(1, currentPage - half)
    let end = Math.min(totalPages, start + maxVisiblePages - 1)

    if (end - start + 1 < maxVisiblePages) {
      start = Math.max(1, end - maxVisiblePages + 1)
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  }

  const visiblePages = getVisiblePages()
  const showStartEllipsis = visiblePages[0] > 2
  const showEndEllipsis = visiblePages[visiblePages.length - 1] < totalPages - 1

  if (totalPages <= 1) {
    return null
  }

  return (
    <nav
      role="navigation"
      aria-label="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
    >
      <div className="flex flex-row items-center space-x-1">
        {/* First page */}
        {showFirstLast && currentPage > 1 && (
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(1)}
            disabled={disabled}
            aria-label="Go to first page"
          >
            1
          </Button>
        )}

        {/* Previous page */}
        {showPrevNext && (
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={disabled || currentPage <= 1}
            aria-label="Go to previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}

        {/* Start ellipsis */}
        {showStartEllipsis && (
          <Button variant="outline" size="icon" disabled>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        )}

        {/* Visible page numbers */}
        {visiblePages.map(page => (
          <Button
            key={page}
            variant={page === currentPage ? "default" : "outline"}
            size="icon"
            onClick={() => onPageChange(page)}
            disabled={disabled}
            aria-label={`Go to page ${page}`}
            aria-current={page === currentPage ? "page" : undefined}
          >
            {page}
          </Button>
        ))}

        {/* End ellipsis */}
        {showEndEllipsis && (
          <Button variant="outline" size="icon" disabled>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        )}

        {/* Next page */}
        {showPrevNext && (
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={disabled || currentPage >= totalPages}
            aria-label="Go to next page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}

        {/* Last page */}
        {showFirstLast && currentPage < totalPages && (
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(totalPages)}
            disabled={disabled}
            aria-label="Go to last page"
          >
            {totalPages}
          </Button>
        )}
      </div>
    </nav>
  )
}

// Simple pagination info component
export interface PaginationInfoProps {
  currentPage: number
  pageSize: number
  totalItems: number
  className?: string
}

export function PaginationInfo({
  currentPage,
  pageSize,
  totalItems,
  className
}: PaginationInfoProps) {
  const startItem = (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalItems)

  return (
    <div className={cn("text-sm text-muted-foreground", className)}>
      Showing {startItem} to {endItem} of {totalItems} results
    </div>
  )
}

// Combined pagination with info
export interface PaginationWithInfoProps extends PaginationProps {
  pageSize: number
  totalItems: number
  showInfo?: boolean
  infoPosition?: "top" | "bottom"
}

export function PaginationWithInfo({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  showInfo = true,
  infoPosition = "bottom",
  className,
  ...paginationProps
}: PaginationWithInfoProps) {
  const paginationComponent = (
    <Pagination
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={onPageChange}
      className={className}
      {...paginationProps}
    />
  )

  const infoComponent = showInfo && (
    <PaginationInfo
      currentPage={currentPage}
      pageSize={pageSize}
      totalItems={totalItems}
    />
  )

  if (!showInfo) {
    return paginationComponent
  }

  return (
    <div className="space-y-4">
      {infoPosition === "top" && infoComponent}
      {paginationComponent}
      {infoPosition === "bottom" && infoComponent}
    </div>
  )
}

// Page size selector component
export interface PageSizeSelectorProps {
  pageSize: number
  onPageSizeChange: (size: number) => void
  options?: number[]
  disabled?: boolean
  className?: string
}

export function PageSizeSelector({
  pageSize,
  onPageSizeChange,
  options = [10, 20, 50, 100],
  disabled = false,
  className
}: PageSizeSelectorProps) {
  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <span className="text-sm text-muted-foreground">Show</span>
      <select
        value={pageSize}
        onChange={e => onPageSizeChange(Number(e.target.value))}
        disabled={disabled}
        className="rounded border bg-background px-2 py-1 text-sm"
      >
        {options.map(size => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
      </select>
      <span className="text-sm text-muted-foreground">per page</span>
    </div>
  )
}
