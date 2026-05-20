'use client'

import { useEffect, useRef, useMemo, useState, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { BiSearch, BiX, BiHistory, BiChevronRight } from 'react-icons/bi'
import { mockProducts } from '@/lib/mockData'
import { formatPrice } from '@/lib/utils'
import PlateImage from './PlateImage'
import Link from 'next/link'

interface SearchOverlayProps {
  isOpen: boolean
  onClose: () => void
  query: string
  onQueryChange: (q: string) => void
}

const CATEGORY_PILLS = [
  { label: 'Lighting Fixtures',  value: 'lighting' },
  { label: 'Glass & Chimneys',   value: 'glass-chimneys' },
  { label: 'Burners & Wicks',    value: 'hardware' },
  { label: 'Reproduction Signs', value: 'signs' },
]

const STORAGE_KEY = 'acme-search-recent'
const MAX_RECENT  = 5

const featured = mockProducts.filter(p => p.featured).slice(0, 4)

function loadRecent(): string[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') }
  catch { return [] }
}

function saveRecent(term: string) {
  const prev = loadRecent().filter(t => t !== term)
  localStorage.setItem(STORAGE_KEY, JSON.stringify([term, ...prev].slice(0, MAX_RECENT)))
}

function clearRecent() {
  localStorage.removeItem(STORAGE_KEY)
}

export default function SearchOverlay({ isOpen, onClose, query, onQueryChange }: SearchOverlayProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [recent, setRecent] = useState<string[]>([])

  useEffect(() => {
    if (isOpen) {
      setRecent(loadRecent())
      setTimeout(() => inputRef.current?.focus(), 60)
    }
  }, [isOpen])

  const results = useMemo(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    return mockProducts
      .filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.shortDescription.toLowerCase().includes(q) ||
        (p.burnerSize?.toLowerCase() ?? '').includes(q)
      )
      .slice(0, 7)
  }, [query])

  const handleResultClick = useCallback((term: string) => {
    if (term.trim()) { saveRecent(term.trim()); setRecent(loadRecent()) }
    onClose()
  }, [onClose])

  const handleRecentClick = useCallback((term: string) => {
    onQueryChange(term)
    inputRef.current?.focus()
  }, [onQueryChange])

  const handleRemoveRecent = useCallback((term: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const updated = loadRecent().filter(t => t !== term)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    setRecent(updated)
  }, [])

  const handleClearAll = useCallback(() => { clearRecent(); setRecent([]) }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && query.trim()) { saveRecent(query.trim()); setRecent(loadRecent()) }
  }, [query])

  /* Close button: clear query first if present, otherwise close drawer */
  const handleClose = useCallback(() => {
    if (query) { onQueryChange('') } else { onClose() }
  }, [query, onQueryChange, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Scrim */}
          <motion.div
            key="search-scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 z-40 bg-ink-charcoal/40"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Drawer — slides down from top */}
          <motion.div
            key="search-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Search the catalog"
            initial={{ y: '-100%' }}
            animate={{ y: 0 }}
            exit={{ y: '-100%' }}
            transition={{ duration: 0.32, ease: [0.32, 0, 0.08, 1] }}
            className="fixed top-0 left-0 right-0 z-50 bg-parchment shadow-[0_8px_32px_-4px_rgba(30,32,34,0.18)] max-h-[82vh] flex flex-col"
          >
            {/* ── Constrained column shared by bar + body ── */}
            <div className="max-w-215 mx-auto w-full px-5 sm:px-8 shrink-0">
              {/* Search bar */}
              <div className="flex items-center gap-3 h-16 border-b border-ink-rule">
                <BiSearch size={19} className="text-ink-soft shrink-0" aria-hidden="true" />
                <input
                  ref={inputRef}
                  type="search"
                  value={query}
                  onChange={e => onQueryChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search — burner number, SKU, pattern name…"
                  className="flex-1 bg-transparent font-serif text-[18px] sm:text-[20px] text-ink-charcoal placeholder:text-ink-soft/50 focus:outline-none"
                  aria-label="Search query"
                />
                {/* Single × — clears query if present, closes if empty */}
                <button
                  onClick={handleClose}
                  className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-parchment-2 transition-colors text-ink-iron shrink-0"
                  aria-label={query ? 'Clear search' : 'Close search'}
                >
                  <BiX size={20} />
                </button>
              </div>
            </div>

            {/* ── Scrollable body ── */}
            <div className="overflow-y-auto flex-1">
              <div className="max-w-215 mx-auto px-5 sm:px-8 py-5">

                {/* Category pills */}
                <div className="flex flex-wrap gap-2 mb-6" role="group" aria-label="Browse by category">
                  {CATEGORY_PILLS.map(pill => (
                    <Link
                      key={pill.value}
                      href={`/catalog?category=${pill.value}`}
                      onClick={() => handleResultClick('')}
                      className="px-3.5 py-1.5 rounded-pill bg-ink-iron text-canvas-heading text-[11px] font-mono uppercase tracking-eyebrow hover:bg-ink-soft transition-colors"
                    >
                      {pill.label}
                    </Link>
                  ))}
                </div>

                {/* ── Active query: live results ── */}
                {query.trim() ? (
                  results.length > 0 ? (
                    <div>
                      <p className="text-[10px] font-mono uppercase tracking-eyebrow text-brass-deep mb-3">
                        {results.length} result{results.length !== 1 ? 's' : ''}
                      </p>
                      <ul className="divide-y divide-ink-rule">
                        {results.map((product, i) => (
                          <motion.li
                            key={product.id}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.025 }}
                          >
                            <Link
                              href={`/catalog/${product.slug}`}
                              onClick={() => handleResultClick(query)}
                              className="flex items-center gap-4 py-3 group"
                            >
                              <div className="w-9 h-11 shrink-0">
                                <PlateImage src={product.images[0]} alt={product.name} aspectRatio="4/5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-mono uppercase tracking-eyebrow text-brass-deep">
                                  {product.sku}
                                </p>
                                <p className="font-serif text-[15px] text-ink-iron group-hover:text-brass-deep transition-colors truncate">
                                  {product.name}
                                </p>
                              </div>
                              <p className="font-serif text-[15px] text-brass-deep shrink-0">
                                {formatPrice(product.price)}
                              </p>
                              <BiChevronRight size={16} className="text-ink-soft shrink-0" aria-hidden="true" />
                            </Link>
                          </motion.li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p className="font-serif italic text-[16px] text-ink-soft text-center py-10">
                      Nothing in the catalog matches that yet.
                    </p>
                  )

                ) : (
                  /* ── Idle state ── */
                  <div className="flex flex-col gap-7">

                    {/* Recent searches */}
                    {recent.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-eyebrow text-ink-soft">
                            <BiHistory size={13} aria-hidden="true" />
                            Recent searches
                          </div>
                          <button
                            onClick={handleClearAll}
                            className="text-[10px] font-mono uppercase tracking-eyebrow text-ink-soft hover:text-error transition-colors"
                          >
                            Clear all
                          </button>
                        </div>
                        <ul className="flex flex-wrap gap-2">
                          {recent.map(term => (
                            <li key={term}>
                              <button
                                onClick={() => handleRecentClick(term)}
                                className="group flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-pill border border-ink-rule bg-parchment hover:border-brass-deep hover:bg-brass/5 transition-colors"
                              >
                                <span className="font-sans text-[12px] text-ink-iron group-hover:text-brass-deep transition-colors">
                                  {term}
                                </span>
                                <span
                                  role="button"
                                  tabIndex={0}
                                  onClick={(e) => handleRemoveRecent(term, e)}
                                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleRemoveRecent(term, e as unknown as React.MouseEvent) }}
                                  className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-ink-rule transition-colors text-ink-soft"
                                  aria-label={`Remove ${term} from recent searches`}
                                >
                                  <BiX size={11} />
                                </span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Just in a collection */}
                    <div>
                      <p className="text-[10px] font-mono uppercase tracking-eyebrow text-brass-deep mb-4">
                        Just in a collection
                      </p>
                      <div className="grid grid-cols-4 gap-4">
                        {featured.map(product => (
                          <Link
                            key={product.id}
                            href={`/catalog/${product.slug}`}
                            onClick={() => handleResultClick('')}
                            className="group"
                          >
                            <div className="mb-2 overflow-hidden rounded-sm">
                              <PlateImage
                                src={product.images[0]}
                                alt={product.name}
                                aspectRatio="4/5"
                                className="transition-transform duration-300 group-hover:scale-[1.03]"
                              />
                            </div>
                            <p className="text-[10px] font-mono uppercase tracking-eyebrow text-brass-deep truncate">
                              {product.sku}
                            </p>
                            <p className="font-serif text-[13px] text-ink-iron group-hover:text-brass-deep transition-colors line-clamp-2 leading-snug">
                              {product.name}
                            </p>
                          </Link>
                        ))}
                      </div>
                    </div>

                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
