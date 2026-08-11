import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from './Button'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  if (totalPages <= 1) return null

  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1).filter(
    (page) => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1
  )

  return (
    <nav className="mt-8 flex items-center justify-center gap-2" aria-label="Phân trang">
      <Button
        variant="pagination"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        aria-label="Trang trước"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {pageNumbers.map((page, index) => {
        const previous = pageNumbers[index - 1]
        const isCurrent = page === currentPage
        return (
          <span className="flex items-center gap-2" key={page}>
            {previous && page - previous > 1 && (
              <span className="px-1 text-xs text-slate-400">…</span>
            )}
            <Button
              variant="pagination"
              className={
                isCurrent
                  ? '!border-orange-500 !bg-orange-500 !text-white hover:!bg-orange-600 hover:!text-white'
                  : ''
              }
              onClick={() => onPageChange(page)}
            >
              {page}
            </Button>
          </span>
        )
      })}

      <Button
        variant="pagination"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        aria-label="Trang sau"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </nav>
  )
}
