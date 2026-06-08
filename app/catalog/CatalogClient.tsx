'use client'

import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Product, FilterState } from '@/lib/types'
import CatalogHeader from '@/components/catalog/CatalogHeader'
import CatalogSidebar from '@/components/catalog/CatalogSidebar'
import FilterSidebar from '@/components/catalog/FilterSidebar'
import ProductGrid from '@/components/catalog/ProductGrid'

function buildDefaults(category = 'all'): FilterState {
  return { category, burnerSize: '', material: '', sortBy: 'curator' }
}

export default function CatalogClient({
  products,
  title,
  crumbs,
}: {
  products: Product[]
  title?: string
  crumbs?: { label: string; href?: string }[]
}) {
  const searchParams = useSearchParams()
  const categoryFromUrl = searchParams.get('category') || 'all'

  const [filters, setFilters] = useState<FilterState>(() => buildDefaults(categoryFromUrl))

  useEffect(() => {
    setFilters(prev => ({ ...prev, category: categoryFromUrl }))
  }, [categoryFromUrl])
  const [drawerOpen, setDrawerOpen] = useState(false)

  const filteredProducts = useMemo(() => {
    let items = [...products]

    if (filters.category !== 'all') {
      items = items.filter(p => p.category === filters.category)
    }
    if (filters.burnerSize) {
      items = items.filter(p => p.burnerSize === filters.burnerSize)
    }
    if (filters.material) {
      items = items.filter(p =>
        p.material.toLowerCase().includes(filters.material.toLowerCase())
      )
    }

    switch (filters.sortBy) {
      case 'price-asc':
        items.sort((a, b) => a.price - b.price)
        break
      case 'price-desc':
        items.sort((a, b) => b.price - a.price)
        break
      case 'newest':
        items.reverse()
        break
    }

    return items
  }, [filters, products])

  return (
    <div className="min-h-screen bg-parchment">
      <CatalogHeader title={title} crumbs={crumbs} />

      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="flex gap-10 items-start">

          {/* ── Left sidebar — desktop only ─────────────────────── */}
          <div className="hidden lg:block w-52 shrink-0 sticky top-24">
            <CatalogSidebar
              filters={filters}
              onFiltersChange={setFilters}
              count={filteredProducts.length}
            />
          </div>

          {/* ── Main content ────────────────────────────────────── */}
          <div className="flex-1 min-w-0">

            {/* Mobile top bar — count + filter trigger */}
            <div className="lg:hidden flex items-center justify-between mb-5 pb-4 border-b border-ink-rule">
              <span className="text-[11px] font-mono uppercase tracking-eyebrow text-ink-soft">
                {filteredProducts.length} {filteredProducts.length === 1 ? 'piece' : 'pieces'}
              </span>
              <button
                onClick={() => setDrawerOpen(true)}
                className="h-9 px-4 border border-ink-rule rounded-sm text-[11px] font-mono uppercase tracking-eyebrow text-ink-iron hover:border-ink-iron hover:bg-parchment-2 transition-colors"
              >
                Filters ↓
              </button>
            </div>

            <ProductGrid products={filteredProducts} />
          </div>
        </div>
      </div>

      {/* Mobile filter drawer */}
      <FilterSidebar
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        filters={filters}
        onFiltersChange={setFilters}
        count={filteredProducts.length}
      />
    </div>
  )
}
