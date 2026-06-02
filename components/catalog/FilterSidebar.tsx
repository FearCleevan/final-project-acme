'use client'

import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { BiX } from 'react-icons/bi'
import { FilterState } from '@/lib/types'
import { cn } from '@/lib/utils'

const PIECE_TYPES = [
  { label: 'Oil Lamp Chimneys',       value: 'oil-lamp-chimneys' },
  { label: 'Oil Lamp Shades',         value: 'oil-lamp-shades' },
  { label: 'Pressure Lamps',          value: 'oil-lamp-pressure-lamps' },
  { label: 'Spreaders & Hardware',    value: 'oil-lamp-spreaders' },
  { label: 'Wicks',                   value: 'oil-lamp-wicks' },
  { label: 'Books & Guides',          value: 'oil-lamp-books' },
  { label: 'Signs',                   value: 'signs' },
]

const BURNER_SIZES = [
  { label: 'No. 1', value: 'No. 1' },
  { label: 'No. 2', value: 'No. 2' },
  { label: 'No. 3', value: 'No. 3' },
  { label: 'Universal', value: 'Universal' },
]

const MATERIALS = [
  { label: 'Brass', value: 'Brass' },
  { label: 'Nickel', value: 'Nickel' },
  { label: 'Glass', value: 'Glass' },
  { label: 'Porcelain', value: 'Porcelain' },
  { label: 'Iron', value: 'Iron' },
  { label: 'Cotton', value: 'Cotton' },
]

const SORT_OPTIONS = [
  { label: "Curator's order", value: 'curator' },
  { label: 'Price: low to high', value: 'price-asc' },
  { label: 'Price: high to low', value: 'price-desc' },
  { label: 'Newest first', value: 'newest' },
]

interface FilterSidebarProps {
  isOpen: boolean
  onClose: () => void
  filters: FilterState
  onFiltersChange: (f: FilterState) => void
  count: number
}

function CheckRow({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer group">
      <span
        className={cn(
          'w-4 h-4 shrink-0 rounded-sm border transition-colors',
          checked
            ? 'bg-ink-iron border-ink-iron'
            : 'border-ink-rule group-hover:border-ink-iron'
        )}
        aria-hidden="true"
      >
        {checked && (
          <svg viewBox="0 0 16 16" fill="none" className="w-full h-full">
            <path d="M3 8l3.5 3.5L13 5" stroke="#FAF5EC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="sr-only"
      />
      <span className="text-[13px] font-sans text-ink-iron">{label}</span>
    </label>
  )
}

export default function FilterSidebar({ isOpen, onClose, filters, onFiltersChange, count }: FilterSidebarProps) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const set = (patch: Partial<FilterState>) => onFiltersChange({ ...filters, ...patch })

  useEffect(() => {
    if (isOpen) closeRef.current?.focus()
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-ink-charcoal/40"
            onClick={onClose}
            aria-hidden="true"
          />

          <motion.aside
            key="sidebar"
            role="dialog"
            aria-modal="true"
            aria-label="Refine catalog"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.3, ease: [0.32, 0, 0.08, 1] }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full sm:w-85 bg-parchment shadow-search-overlay flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-ink-rule">
              <div>
                <h2 className="font-serif text-[20px] font-medium text-ink-charcoal">
                  Refine the catalog
                </h2>
                <p className="text-[10px] font-mono uppercase tracking-eyebrow text-brass-deep mt-0.5">
                  {count} {count === 1 ? 'piece' : 'pieces'} shown
                </p>
              </div>
              <button
                ref={closeRef}
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-parchment-2 transition-colors"
                aria-label="Close filters"
              >
                <BiX size={22} />
              </button>
            </div>

            {/* Filter groups */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-7">

              {/* Piece type */}
              <div>
                <p className="text-[10px] font-mono uppercase tracking-eyebrow text-ink-soft mb-3">
                  Piece Type
                </p>
                <div className="space-y-2.5">
                  {PIECE_TYPES.map(t => (
                    <CheckRow
                      key={t.value}
                      label={t.label}
                      checked={filters.category === t.value}
                      onChange={v => set({ category: v ? t.value : 'all' })}
                    />
                  ))}
                </div>
              </div>

              {/* Burner size */}
              <div>
                <p className="text-[10px] font-mono uppercase tracking-eyebrow text-ink-soft mb-3">
                  Fits / Burner Size
                </p>
                <div className="space-y-2.5">
                  {BURNER_SIZES.map(b => (
                    <CheckRow
                      key={b.value}
                      label={b.label}
                      checked={filters.burnerSize === b.value}
                      onChange={v => set({ burnerSize: v ? b.value : '' })}
                    />
                  ))}
                </div>
              </div>

              {/* Material */}
              <div>
                <p className="text-[10px] font-mono uppercase tracking-eyebrow text-ink-soft mb-3">
                  Material
                </p>
                <div className="space-y-2.5">
                  {MATERIALS.map(m => (
                    <CheckRow
                      key={m.value}
                      label={m.label}
                      checked={filters.material === m.value}
                      onChange={v => set({ material: v ? m.value : '' })}
                    />
                  ))}
                </div>
              </div>

              {/* In stock toggle */}
              <div className="flex items-center justify-between py-3 border-t border-ink-rule">
                <p className="text-[10px] font-mono uppercase tracking-eyebrow text-ink-soft">
                  In Stock Only
                </p>
                <button
                  role="switch"
                  aria-checked={!!filters.burnerSize}
                  onClick={() => {/* handled via other filters */}}
                  className="w-10 h-6 rounded-pill bg-parchment-3 border border-ink-rule relative transition-colors hover:border-ink-iron"
                >
                  <span className="absolute left-1 top-1 w-4 h-4 rounded-full bg-ink-soft transition-transform" />
                </button>
              </div>

              {/* Sort */}
              <div>
                <p className="text-[10px] font-mono uppercase tracking-eyebrow text-ink-soft mb-3">
                  Curator&apos;s order
                </p>
                <div className="space-y-2.5">
                  {SORT_OPTIONS.map(s => (
                    <label key={s.value} className="flex items-center gap-3 cursor-pointer group">
                      <span
                        className={cn(
                          'w-4 h-4 shrink-0 rounded-full border transition-colors flex items-center justify-center',
                          filters.sortBy === s.value
                            ? 'border-ink-iron'
                            : 'border-ink-rule group-hover:border-ink-iron'
                        )}
                      >
                        {filters.sortBy === s.value && (
                          <span className="w-2 h-2 rounded-full bg-ink-iron" />
                        )}
                      </span>
                      <input
                        type="radio"
                        name="sort"
                        value={s.value}
                        checked={filters.sortBy === s.value}
                        onChange={() => set({ sortBy: s.value as FilterState['sortBy'] })}
                        className="sr-only"
                      />
                      <span className="text-[13px] font-sans text-ink-iron">{s.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Sticky CTA */}
            <div className="sticky bottom-0 px-6 py-4 border-t border-ink-rule bg-parchment">
              <button
                onClick={onClose}
                className="w-full h-13 bg-green-brand text-[#F5F1E6] rounded-btn font-sans font-semibold text-[15px] hover:bg-green-deep hover:shadow-cta-hover transition-all"
              >
                Show {count} {count === 1 ? 'piece' : 'pieces'}
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
