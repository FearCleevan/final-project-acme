'use client'

import { FilterState } from '@/lib/types'
import { cn } from '@/lib/utils'

const CATEGORY_PILLS = [
  { label: 'All Pieces', value: 'all' },
  { label: 'Lighting', value: 'lighting' },
  { label: 'Glass & Chimneys', value: 'glass-chimneys' },
  { label: 'Hardware', value: 'hardware' },
  { label: 'Signs', value: 'signs' },
]

const selectClass =
  'h-[40px] pl-3 pr-8 bg-parchment-2 border border-ink-rule rounded-sm text-[13px] font-sans text-ink-iron appearance-none cursor-pointer focus:outline-none focus:border-brass-deep focus:ring-1 focus:ring-brass/20 transition-colors'

interface FilterBarProps {
  filters: FilterState
  onFiltersChange: (f: FilterState) => void
  count: number
  onRefineOpen: () => void
}

export default function FilterBar({ filters, onFiltersChange, count, onRefineOpen }: FilterBarProps) {
  const set = (patch: Partial<FilterState>) => onFiltersChange({ ...filters, ...patch })

  return (
    <div className="max-w-[1280px] mx-auto px-6">
      {/* Category pills */}
      <div
        className="flex items-center gap-2 py-5 overflow-x-auto scrollbar-none"
        role="group"
        aria-label="Filter by category"
      >
        {CATEGORY_PILLS.map(p => (
          <button
            key={p.value}
            onClick={() => set({ category: p.value })}
            className={cn(
              'flex-shrink-0 px-4 py-1.5 rounded-pill text-[12px] font-mono uppercase tracking-eyebrow transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass',
              filters.category === p.value
                ? 'bg-ink-iron text-parchment'
                : 'border border-ink-rule text-ink-soft hover:border-ink-iron hover:text-ink-iron'
            )}
            aria-pressed={filters.category === p.value}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Dropdowns row */}
      <div className="flex flex-wrap items-center gap-3 pb-5 border-b border-ink-rule">
        {/* Burner size */}
        <div className="relative">
          <label htmlFor="filter-burner" className="sr-only">Burner size</label>
          <select
            id="filter-burner"
            value={filters.burnerSize}
            onChange={e => set({ burnerSize: e.target.value })}
            className={selectClass}
          >
            <option value="">BURNER — Any size</option>
            <option value="No. 1">No. 1</option>
            <option value="No. 2">No. 2</option>
            <option value="No. 3">No. 3</option>
            <option value="Universal">Universal</option>
          </select>
          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-soft text-[10px]">▾</span>
        </div>

        {/* Material */}
        <div className="relative">
          <label htmlFor="filter-material" className="sr-only">Material</label>
          <select
            id="filter-material"
            value={filters.material}
            onChange={e => set({ material: e.target.value })}
            className={selectClass}
          >
            <option value="">MATERIAL — Any</option>
            <option value="Brass">Brass</option>
            <option value="Nickel">Nickel</option>
            <option value="Glass">Glass</option>
            <option value="Porcelain">Porcelain</option>
            <option value="Iron">Iron</option>
          </select>
          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-soft text-[10px]">▾</span>
        </div>

        {/* Sort */}
        <div className="relative">
          <label htmlFor="filter-sort" className="sr-only">Sort by</label>
          <select
            id="filter-sort"
            value={filters.sortBy}
            onChange={e => set({ sortBy: e.target.value as FilterState['sortBy'] })}
            className={selectClass}
          >
            <option value="curator">SORT — Curator&apos;s order</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
            <option value="newest">Newest first</option>
          </select>
          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-soft text-[10px]">▾</span>
        </div>

        {/* Spacer + count + refine */}
        <div className="ml-auto flex items-center gap-4">
          <span className="text-[11px] font-mono uppercase tracking-eyebrow text-brass-deep">
            {count} {count === 1 ? 'piece' : 'pieces'}
          </span>
          <button
            onClick={onRefineOpen}
            className="h-[40px] px-4 border border-ink-rule rounded-sm text-[12px] font-mono uppercase tracking-eyebrow text-ink-iron hover:border-ink-iron hover:bg-parchment-2 transition-colors"
          >
            Refine ↓
          </button>
        </div>
      </div>
    </div>
  )
}
