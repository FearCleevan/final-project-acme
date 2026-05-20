'use client'

import { useState, useMemo } from 'react'
import { mockProducts } from '@/lib/mockData'
import { FilterState } from '@/lib/types'
import CatalogHeader from '@/components/catalog/CatalogHeader'
import FilterBar from '@/components/catalog/FilterBar'
import FilterSidebar from '@/components/catalog/FilterSidebar'
import ProductGrid from '@/components/catalog/ProductGrid'

const defaultFilters: FilterState = {
  category: 'all',
  burnerSize: '',
  material: '',
  sortBy: 'curator',
}

export default function CatalogPage() {
  const [filters, setFilters] = useState<FilterState>(defaultFilters)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const filteredProducts = useMemo(() => {
    let items = [...mockProducts]

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
        /* mock data has no date — reverse the array as a proxy for "newest" */
        items.reverse()
        break
    }

    return items
  }, [filters])

  const handleFiltersChange = (f: FilterState) => {
    setFilters(f)
  }

  return (
    <div className="min-h-screen">
      <CatalogHeader />

      <FilterBar
        filters={filters}
        onFiltersChange={handleFiltersChange}
        count={filteredProducts.length}
        onRefineOpen={() => setSidebarOpen(true)}
      />

      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <ProductGrid products={filteredProducts} />
      </div>

      <FilterSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        filters={filters}
        onFiltersChange={f => {
          handleFiltersChange(f)
        }}
        count={filteredProducts.length}
      />
    </div>
  )
}
