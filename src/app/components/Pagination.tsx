"use client";

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"

interface PaginationProps {
  totalPages: number
  currentPage: number
}

export function Pagination({ totalPages, currentPage }: PaginationProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const createPageURL = (pageNumber: number | string) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', pageNumber.toString())
    return `${pathname}?${params.toString()}`
  }

  if (totalPages <= 1) return null

  // Generate page numbers to show
  const getVisiblePages = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    
    if (currentPage <= 3) return [1, 2, 3, 4, '...', totalPages]
    if (currentPage >= totalPages - 2) return [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
    
    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages]
  }

  const visiblePages = getVisiblePages()

  return (
    <div className="flex items-center justify-center gap-1 py-4">
      <Link
        href={createPageURL(currentPage - 1)}
        className={`h-9 w-9 flex items-center justify-center rounded-md border border-input bg-background/50 hover:bg-muted ${currentPage <= 1 ? 'pointer-events-none opacity-50' : ''}`}
      >
        <ChevronLeft className="h-4 w-4" />
      </Link>

      {visiblePages.map((page, index) => {
        if (page === '...') {
          return (
            <div key={`ellipsis-${index}`} className="h-9 w-9 flex items-center justify-center">
              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
            </div>
          )
        }

        const isCurrentPage = page === currentPage
        return (
          <Link
            key={page}
            href={createPageURL(page as number)}
            className={`h-9 w-9 flex items-center justify-center rounded-md text-sm font-medium transition-colors ${
              isCurrentPage 
                ? 'bg-primary text-primary-foreground shadow' 
                : 'border border-input bg-background/50 hover:bg-muted text-muted-foreground'
            }`}
          >
            {page}
          </Link>
        )
      })}

      <Link
        href={createPageURL(currentPage + 1)}
        className={`h-9 w-9 flex items-center justify-center rounded-md border border-input bg-background/50 hover:bg-muted ${currentPage >= totalPages ? 'pointer-events-none opacity-50' : ''}`}
      >
        <ChevronRight className="h-4 w-4" />
      </Link>
    </div>
  )
}
