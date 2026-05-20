'use client'

import { useEffect, useRef, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { BiSearch, BiX } from 'react-icons/bi'
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
  { label: 'Lighting Fixtures', value: 'lighting' },
  { label: 'Glass & Chimneys', value: 'glass-chimneys' },
  { label: 'Burners & Wicks', value: 'hardware' },
  { label: 'Reproduction Signs', value: 'signs' },
]

const featured = mockProducts.filter(p => p.featured).slice(0, 4)

export default function SearchOverlay({ isOpen, onClose, query, onQueryChange }: SearchOverlayProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  const results = useMemo(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    return mockProducts
      .filter(
        p =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.shortDescription.toLowerCase().includes(q) ||
          (p.burnerSize?.toLowerCase() ?? '').includes(q)
      )
      .slice(0, 8)
  }, [query])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="search-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Search the catalog"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-50 bg-parchment/96 backdrop-blur-md overflow-y-auto"
        >
          <div className="max-w-200 mx-auto px-6 pt-8 pb-16">
            {/* Search bar */}
            <div className="flex items-center gap-4 border-b-2 border-ink-iron pb-4 mb-8">
              <BiSearch size={22} className="text-ink-soft shrink-0" aria-hidden="true" />
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={e => onQueryChange(e.target.value)}
                placeholder="Search the catalog — burner number, pattern, SKU…"
                className="flex-1 bg-transparent font-serif text-[22px] text-ink-charcoal placeholder:text-ink-soft/60 focus:outline-none"
                aria-label="Search query"
              />
              <button
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-parchment-2 transition-colors shrink-0"
                aria-label="Close search"
              >
                <BiX size={22} className="text-ink-iron" />
              </button>
            </div>

            {/* Category pills */}
            <div className="flex flex-wrap gap-2 mb-8" role="group" aria-label="Filter by category">
              {CATEGORY_PILLS.map(pill => (
                <Link
                  key={pill.value}
                  href={`/catalog?category=${pill.value}`}
                  onClick={onClose}
                  className="px-4 py-2 rounded-pill bg-ink-iron text-canvas-heading text-[12px] font-mono uppercase tracking-eyebrow hover:bg-ink-soft transition-colors"
                >
                  {pill.label}
                </Link>
              ))}
            </div>

            {/* Live results */}
            {query.trim() ? (
              results.length > 0 ? (
                <div>
                  <p className="eyebrow text-brass-deep mb-4">
                    {results.length} result{results.length !== 1 ? 's' : ''}
                  </p>
                  <ul className="space-y-0 divide-y divide-ink-rule">
                    {results.map((product, i) => (
                      <motion.li
                        key={product.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                      >
                        <Link
                          href={`/catalog/${product.slug}`}
                          onClick={onClose}
                          className="flex items-center gap-4 py-3 group"
                        >
                          <div className="w-10 h-12 shrink-0">
                            <PlateImage
                              src={product.images[0]}
                              alt={product.name}
                              aspectRatio="4/5"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-mono uppercase tracking-eyebrow text-brass-deep">
                              {product.sku}
                            </p>
                            <p className="font-serif text-[16px] text-ink-iron group-hover:text-brass-deep transition-colors truncate">
                              {product.name}
                            </p>
                          </div>
                          <p className="font-serif text-[16px] text-brass-deep shrink-0">
                            {formatPrice(product.price)}
                          </p>
                        </Link>
                      </motion.li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="font-serif italic text-[18px] text-ink-soft text-center mt-12">
                  Nothing in the catalog matches that yet.
                </p>
              )
            ) : (
              /* Featured row */
              <div>
                <p className="eyebrow text-brass-deep mb-4">Just in a collection</p>
                <div className="flex gap-4 overflow-x-auto pb-2 -mx-6 px-6">
                  {featured.map(product => (
                    <Link
                      key={product.id}
                      href={`/catalog/${product.slug}`}
                      onClick={onClose}
                      className="shrink-0 w-35 group"
                    >
                      <PlateImage
                        src={product.images[0]}
                        alt={product.name}
                        aspectRatio="4/5"
                        className="mb-2"
                      />
                      <p className="text-[10px] font-mono uppercase tracking-eyebrow text-brass-deep truncate">
                        {product.sku}
                      </p>
                      <p className="font-serif text-[13px] text-ink-iron group-hover:text-brass-deep transition-colors line-clamp-2">
                        {product.name}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
