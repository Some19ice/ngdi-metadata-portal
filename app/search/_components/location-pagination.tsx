"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

interface LocationPaginationProps {
  query: string
  page: number
  hasMore: boolean
}

export function LocationPagination({
  query,
  page,
  hasMore
}: LocationPaginationProps) {
  const router = useRouter()

  const handleNextPage = () => {
    router.push(
      `/search?q=${encodeURIComponent(query)}&type=location&page=${page + 1}`
    )
  }

  const handlePrevPage = () => {
    if (page > 1) {
      router.push(
        `/search?q=${encodeURIComponent(query)}&type=location&page=${page - 1}`
      )
    }
  }

  return (
    <div className="pt-4 border-t flex justify-between items-center">
      <Button
        onClick={handlePrevPage}
        disabled={page <= 1}
        variant="outline"
        size="sm"
      >
        Previous
      </Button>
      <span className="text-sm text-muted-foreground">Page {page}</span>
      <Button
        onClick={handleNextPage}
        disabled={!hasMore}
        variant="outline"
        size="sm"
      >
        Next
      </Button>
    </div>
  )
}
