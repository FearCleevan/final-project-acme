'use client'

import { BiChevronLeft, BiChevronRight } from 'react-icons/bi'
import { cn } from '@/lib/utils'

interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (p: number) => void
  totalItems: number
  pageSize: number
}

export default function Pagination({ page, totalPages, onPageChange, totalItems, pageSize }: PaginationProps) {
  const from = Math.min((page - 1) * pageSize + 1, totalItems)
  const to   = Math.min(page * pageSize, totalItems)

  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between px-1 pt-4 border-t border-(--admin-border)">
      <p className="text-[12px] text-(--admin-text-muted)">
        {from}–{to} of {totalItems}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className={cn(
            'w-7 h-7 flex items-center justify-center rounded-md border border-(--admin-border) text-(--admin-text-soft) transition-colors',
            page <= 1
              ? 'opacity-40 cursor-not-allowed'
              : 'hover:bg-(--admin-surface-2) hover:text-(--admin-text)'
          )}
          aria-label="Previous page"
        >
          <BiChevronLeft size={16} />
        </button>

        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
          const p = totalPages <= 5
            ? i + 1
            : page <= 3
              ? i + 1
              : page >= totalPages - 2
                ? totalPages - 4 + i
                : page - 2 + i
          return (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={cn(
                'w-7 h-7 flex items-center justify-center rounded-md text-[12px] transition-colors',
                p === page
                  ? 'bg-(--admin-accent) text-(--admin-accent-text)'
                  : 'text-(--admin-text-soft) hover:bg-(--admin-surface-2) hover:text-(--admin-text)'
              )}
            >
              {p}
            </button>
          )
        })}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className={cn(
            'w-7 h-7 flex items-center justify-center rounded-md border border-(--admin-border) text-(--admin-text-soft) transition-colors',
            page >= totalPages
              ? 'opacity-40 cursor-not-allowed'
              : 'hover:bg-(--admin-surface-2) hover:text-(--admin-text)'
          )}
          aria-label="Next page"
        >
          <BiChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}
