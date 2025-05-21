"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from "lucide-react"

interface PaginationProps {
  currentPage: number
  totalPages: number
  className?: string
}

export default function Pagination({
  currentPage,
  totalPages,
  className
}: PaginationProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function createPageUrl(page: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", page.toString())
    return `/organizations?${params.toString()}`
  }

  function goToPage(page: number) {
    if (page < 1 || page > totalPages) return
    router.push(createPageUrl(page))
  }

  // Calculate which page numbers to show
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1)
  let displayedPages: (number | null)[] = []

  if (totalPages <= 7) {
    // Show all pages if 7 or fewer
    displayedPages = pageNumbers
  } else {
    // Always show first and last page
    // Show ellipsis (...) for skipped pages
    if (currentPage <= 3) {
      // Current page is close to the start
      displayedPages = [...pageNumbers.slice(0, 5), null, totalPages]
    } else if (currentPage >= totalPages - 2) {
      // Current page is close to the end
      displayedPages = [1, null, ...pageNumbers.slice(totalPages - 5)]
    } else {
      // Current page is in the middle
      displayedPages = [
        1,
        null,
        currentPage - 1,
        currentPage,
        currentPage + 1,
        null,
        totalPages
      ]
    }
  }

  if (totalPages <= 1) {
    return null // Don't show pagination for single page
  }

  return (
    <div
      className={`flex items-center justify-center space-x-1 ${
        className || ""
      }`}
    >
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        disabled={currentPage === 1}
        onClick={() => goToPage(1)}
      >
        <ChevronsLeft className="h-4 w-4" />
        <span className="sr-only">First page</span>
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        disabled={currentPage === 1}
        onClick={() => goToPage(currentPage - 1)}
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="sr-only">Previous page</span>
      </Button>

      {displayedPages.map((page, i) =>
        page === null ? (
          <span
            key={`ellipsis-${i}`}
            className="flex h-8 w-8 items-center justify-center text-sm"
          >
            ...
          </span>
        ) : (
          <Button
            key={page}
            variant={currentPage === page ? "default" : "outline"}
            className="h-8 w-8"
            onClick={() => goToPage(page)}
          >
            {page}
          </Button>
        )
      )}

      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        disabled={currentPage === totalPages}
        onClick={() => goToPage(currentPage + 1)}
      >
        <ChevronRight className="h-4 w-4" />
        <span className="sr-only">Next page</span>
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        disabled={currentPage === totalPages}
        onClick={() => goToPage(totalPages)}
      >
        <ChevronsRight className="h-4 w-4" />
        <span className="sr-only">Last page</span>
      </Button>
    </div>
  )
}
