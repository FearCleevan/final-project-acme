'use client'

import { FilterState } from '@/lib/types'
import { cn } from '@/lib/utils'

const CATEGORIES = [
  { label: 'All Items',            value: 'all' },
  { label: 'Oil Lamp Chimneys',    value: 'oil-lamp-chimneys' },
  { label: 'Oil Lamp Shades',      value: 'oil-lamp-shades' },
  { label: 'Pressure Lamps',       value: 'oil-lamp-pressure-lamps' },
  { label: 'Spreaders & Hardware', value: 'oil-lamp-spreaders' },
  { label: 'Wicks',                value: 'oil-lamp-wicks' },
  { label: 'Books & Guides',       value: 'oil-lamp-books' },
  { label: 'Advertising Signs',    value: 'signs' },
]

const SORT_OPTIONS = [
  { label: "Curator's order", value: 'curator' },
  { label: 'Price: low to high',  value: 'price-asc' },
  { label: 'Price: high to low',  value: 'price-desc' },
  { label: 'Newest first',        value: 'newest' },
]

const defaultFilters: FilterState = {
  category: 'all',
  burnerSize: '',
  material: '',
  sortBy: 'curator',
}

interface CatalogSidebarProps {
  filters: FilterState
  onFiltersChange: (f: FilterState) => void
  count: number
}

export default function CatalogSidebar({ filters, onFiltersChange, count }: CatalogSidebarProps) {
  const set = (patch: Partial<FilterState>) => onFiltersChange({ ...filters, ...patch })

  const isFiltered =
    filters.category !== 'all' ||
    filters.burnerSize !== '' ||
    filters.material !== '' ||
    filters.sortBy !== 'curator'

  return (
    <aside className="space-y-7">

      {/* Count */}
      <p className="text-[11px] font-mono uppercase tracking-eyebrow text-ink-soft">
        {count} {count === 1 ? 'piece' : 'pieces'}
      </p>

      {/* Categories */}
      <div>
        <p className="text-[10px] font-mono uppercase tracking-eyebrow text-ink-soft mb-2">
          Browse by Type
        </p>
        <ul>
          {CATEGORIES.map(cat => (
            <li key={cat.value}>
              <button
                onClick={() => set({ category: cat.value })}
                className={cn(
                  'w-full text-left px-3 py-2 text-[14px] font-sans border-l-2 transition-colors',
                  filters.category === cat.value
                    ? 'border-brass-deep text-ink-charcoal font-semibold bg-parchment-2'
                    : 'border-transparent text-ink-soft hover:text-ink-iron hover:border-ink-rule hover:bg-parchment-2'
                )}
              >
                {cat.label}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="border-t border-ink-rule" />

      {/* Sort */}
      <div>
        <p className="text-[10px] font-mono uppercase tracking-eyebrow text-ink-soft mb-2">
          Sort
        </p>
        <ul>
          {SORT_OPTIONS.map(s => (
            <li key={s.value}>
              <button
                onClick={() => set({ sortBy: s.value as FilterState['sortBy'] })}
                className={cn(
                  'w-full text-left px-3 py-1.5 text-[13px] font-sans transition-colors',
                  filters.sortBy === s.value
                    ? 'text-ink-charcoal font-semibold'
                    : 'text-ink-soft hover:text-ink-iron'
                )}
              >
                {s.label}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Clear filters */}
      {isFiltered && (
        <>
          <div className="border-t border-ink-rule" />
          <button
            onClick={() => onFiltersChange(defaultFilters)}
            className="text-[11px] font-mono uppercase tracking-eyebrow text-brass-deep hover:text-brass transition-colors px-3"
          >
            Clear filters ×
          </button>
        </>
      )}

    </aside>
  )
}
