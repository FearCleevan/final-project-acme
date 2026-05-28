'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AdminProduct } from '@/lib/admin/types'
import PageHeader from '@/components/admin/shared/PageHeader'
import SectionCard from '@/components/admin/shared/SectionCard'
import SearchInput from '@/components/admin/shared/SearchInput'
import Badge from '@/components/admin/shared/Badge'
import { cn } from '@/lib/utils'
import { BiEditAlt, BiCheck, BiX } from 'react-icons/bi'

const LOW_STOCK_THRESHOLD = 5

type TabFilter = 'all' | 'low' | 'out'

const TABS: { label: string; value: TabFilter }[] = [
  { label: 'All',          value: 'all' },
  { label: 'Low Stock',    value: 'low' },
  { label: 'Out of Stock', value: 'out' },
]

function stockVariant(stock: number): 'green' | 'amber' | 'red' | 'neutral' {
  if (stock === 0) return 'red'
  if (stock <= LOW_STOCK_THRESHOLD) return 'amber'
  return 'green'
}

function stockLabel(stock: number): string {
  if (stock === 0) return 'Out of stock'
  if (stock <= LOW_STOCK_THRESHOLD) return 'Low stock'
  return 'In stock'
}

export default function InventoryPage() {
  const router = useRouter()

  const [baseProducts, setBaseProducts] = useState<AdminProduct[]>([])
  const [loading,      setLoading]      = useState(true)
  const [stocks,       setStocks]       = useState<Record<string, number>>({})
  const [editing,      setEditing]      = useState<string | null>(null)
  const [editVal,      setEditVal]      = useState('')
  const [tab,          setTab]          = useState<TabFilter>('all')
  const [search,       setSearch]       = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/admin/products')
      .then(r => r.ok ? r.json() : [])
      .then((data: AdminProduct[]) => {
        setBaseProducts(data)
        setStocks(Object.fromEntries(data.map(p => [p.id, p.stock])))
      })
      .finally(() => setLoading(false))
  }, [])

  const products = useMemo(() => {
    let list = baseProducts.map(p => ({ ...p, stock: stocks[p.id] ?? p.stock }))
    if (tab === 'low') list = list.filter(p => p.stock > 0 && p.stock <= LOW_STOCK_THRESHOLD)
    if (tab === 'out') list = list.filter(p => p.stock === 0)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(p =>
        p.title.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
      )
    }
    return list
  }, [baseProducts, stocks, tab, search])

  const tabCount = (v: TabFilter) => {
    const all = baseProducts.map(p => ({ ...p, stock: stocks[p.id] ?? p.stock }))
    if (v === 'all') return all.length
    if (v === 'low') return all.filter(p => p.stock > 0 && p.stock <= LOW_STOCK_THRESHOLD).length
    return all.filter(p => p.stock === 0).length
  }

  function startEdit(id: string, current: number) {
    setEditing(id)
    setEditVal(String(current))
    setTimeout(() => inputRef.current?.select(), 0)
  }

  function commitEdit(id: string) {
    const n = parseInt(editVal, 10)
    if (!isNaN(n) && n >= 0) setStocks(s => ({ ...s, [id]: n }))
    setEditing(null)
  }

  function cancelEdit() { setEditing(null) }

  const lowCount = tabCount('low')
  const outCount = tabCount('out')

  return (
    <div>
      <PageHeader
        title="Inventory"
        subtitle={loading ? 'Loading…' : `${baseProducts.length} SKUs · ${lowCount} low · ${outCount} out of stock`}
      />

      {/* Summary chips */}
      {!loading && (lowCount > 0 || outCount > 0) && (
        <div className="flex flex-wrap gap-2 mb-4">
          {outCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-(--admin-red-bg) border border-(--admin-red)/20">
              <span className="w-2 h-2 rounded-full bg-(--admin-red)" />
              <span className="text-[12px] text-(--admin-red)">
                {outCount} product{outCount !== 1 ? 's' : ''} out of stock
              </span>
            </div>
          )}
          {lowCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-(--admin-amber-bg) border border-(--admin-amber)/20">
              <span className="w-2 h-2 rounded-full bg-(--admin-amber)" />
              <span className="text-[12px] text-(--admin-amber)">
                {lowCount} product{lowCount !== 1 ? 's' : ''} low on stock (≤{LOW_STOCK_THRESHOLD})
              </span>
            </div>
          )}
        </div>
      )}

      <SectionCard noPadding>
        {/* Tabs + Search */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4 border-b border-(--admin-border)">
          <div className="flex items-center gap-1">
            {TABS.map(t => (
              <button
                key={t.value}
                onClick={() => setTab(t.value)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] transition-colors',
                  tab === t.value
                    ? 'bg-(--admin-accent) text-(--admin-accent-text)'
                    : 'text-(--admin-text-soft) hover:bg-(--admin-surface-2) hover:text-(--admin-text)'
                )}
              >
                {t.label}
                <span className={cn(
                  'text-[10px] px-1.5 py-0.5 rounded-full',
                  tab === t.value
                    ? 'bg-white/20 text-(--admin-accent-text)'
                    : 'bg-(--admin-border) text-(--admin-text-muted)'
                )}>
                  {tabCount(t.value)}
                </span>
              </button>
            ))}
          </div>
          <div className="sm:ml-auto">
            <SearchInput
              value={search}
              onChange={v => setSearch(v)}
              placeholder="Search title or SKU…"
              className="w-full sm:w-64"
            />
          </div>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="divide-y divide-(--admin-border)">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-3">
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-56 bg-(--admin-border) rounded animate-pulse" />
                  <div className="h-2.5 w-20 bg-(--admin-border) rounded animate-pulse" />
                </div>
                <div className="h-5 w-16 bg-(--admin-border) rounded-full animate-pulse" />
                <div className="h-3 w-8 bg-(--admin-border) rounded animate-pulse" />
              </div>
            ))}
          </div>
        )}

        {/* Mobile card list */}
        {!loading && <div className="sm:hidden divide-y divide-(--admin-border)">
          {products.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-[13px] text-(--admin-text-soft)">No products found</p>
              <p className="text-[11px] text-(--admin-text-muted) mt-1">Try adjusting your filters or search.</p>
            </div>
          ) : products.map(p => (
            <div
              key={p.id}
              className="px-4 py-3 hover:bg-(--admin-surface-2) transition-colors"
              style={
                p.stock === 0
                  ? { borderLeft: '3px solid var(--admin-text)' }
                  : p.stock <= LOW_STOCK_THRESHOLD
                    ? { borderLeft: '3px solid var(--admin-text-soft)' }
                    : { borderLeft: '3px solid transparent' }
              }
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <button
                  onClick={() => router.push(`/admin/products/${p.id}`)}
                  className="text-[13px] font-medium text-(--admin-text) hover:text-(--admin-accent) transition-colors text-left"
                >
                  {p.title}
                </button>
                <Badge label={stockLabel(p.stock)} variant={stockVariant(p.stock)} />
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] text-(--admin-text-muted)">{p.sku}</span>
                <div className="flex items-center gap-2">
                  {editing === p.id ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        ref={inputRef}
                        type="number"
                        min="0"
                        value={editVal}
                        onChange={e => setEditVal(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') commitEdit(p.id)
                          if (e.key === 'Escape') cancelEdit()
                        }}
                        className="w-16 h-7 px-2 text-[13px] text-(--admin-text) bg-(--admin-surface-2) border border-(--admin-accent) rounded focus:outline-none"
                      />
                      <button onClick={() => commitEdit(p.id)} className="text-(--admin-accent)"><BiCheck size={16} /></button>
                      <button onClick={cancelEdit} className="text-(--admin-text-muted)"><BiX size={16} /></button>
                    </div>
                  ) : (
                    <>
                      <span className={cn(
                        'text-[13px] font-semibold',
                        p.stock === 0 ? 'text-(--admin-red)' : p.stock <= LOW_STOCK_THRESHOLD ? 'text-(--admin-amber)' : 'text-(--admin-text)'
                      )}>
                        {p.stock}
                      </span>
                      <button
                        onClick={() => startEdit(p.id, p.stock)}
                        className="flex items-center gap-1 h-7 px-2.5 text-[11px] text-(--admin-text-muted) bg-(--admin-surface-2) border border-(--admin-border) rounded hover:bg-(--admin-border) transition-colors"
                      >
                        <BiEditAlt size={12} /> Adjust
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>}

        {/* Desktop table */}
        {!loading && <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-(--admin-border)">
                {['Product', 'SKU', 'Status', 'Stock', ''].map(h => (
                  <th key={h} className="px-5 py-3 text-[11px] font-medium uppercase tracking-wider text-(--admin-text-muted) whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center">
                    <p className="text-[13px] text-(--admin-text-soft)">No products found</p>
                    <p className="text-[11px] text-(--admin-text-muted) mt-1">Try adjusting your filters or search.</p>
                  </td>
                </tr>
              ) : products.map(p => (
                <tr
                  key={p.id}
                  className="border-b border-(--admin-border) last:border-0 hover:bg-(--admin-surface-2) transition-colors"
                  style={
                    p.stock === 0
                      ? { borderLeft: '3px solid var(--admin-text)' }
                      : p.stock <= LOW_STOCK_THRESHOLD
                        ? { borderLeft: '3px solid var(--admin-text-soft)' }
                        : { borderLeft: '3px solid transparent' }
                  }
                >
                  <td className="px-5 py-3">
                    <button
                      onClick={() => router.push(`/admin/products/${p.id}`)}
                      className="text-[13px] font-medium text-(--admin-text) hover:text-(--admin-accent) transition-colors text-left"
                    >
                      {p.title}
                    </button>
                    {p.collections.length > 0 && (
                      <p className="text-[11px] text-(--admin-text-muted) mt-0.5">{p.collections.join(', ')}</p>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-[12px] text-(--admin-text-soft)">{p.sku}</span>
                  </td>
                  <td className="px-5 py-3">
                    <Badge label={stockLabel(p.stock)} variant={stockVariant(p.stock)} />
                  </td>
                  <td className="px-5 py-3">
                    {editing === p.id ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          ref={inputRef}
                          type="number"
                          min="0"
                          value={editVal}
                          onChange={e => setEditVal(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') commitEdit(p.id)
                            if (e.key === 'Escape') cancelEdit()
                          }}
                          className="w-20 h-7 px-2 text-[13px] text-(--admin-text) bg-(--admin-surface-2) border border-(--admin-accent) rounded focus:outline-none"
                        />
                        <button onClick={() => commitEdit(p.id)} className="text-(--admin-accent) hover:opacity-70 transition-opacity"><BiCheck size={16} /></button>
                        <button onClick={cancelEdit} className="text-(--admin-text-muted) hover:text-(--admin-text) transition-colors"><BiX size={16} /></button>
                      </div>
                    ) : (
                      <span className={cn(
                        'text-[13px] font-semibold',
                        p.stock === 0 ? 'text-(--admin-red)' : p.stock <= LOW_STOCK_THRESHOLD ? 'text-(--admin-amber)' : 'text-(--admin-text)'
                      )}>
                        {p.stock}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {editing !== p.id && (
                      <button
                        onClick={() => startEdit(p.id, p.stock)}
                        className="flex items-center gap-1 h-7 px-2.5 text-[11px] text-(--admin-text-muted) bg-(--admin-surface-2) border border-(--admin-border) rounded hover:bg-(--admin-border) hover:text-(--admin-text) transition-colors"
                      >
                        <BiEditAlt size={12} /> Adjust
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>}

        <div className="px-5 py-3 border-t border-(--admin-border)">
          <p className="text-[11px] text-(--admin-text-muted)">
            Stock levels are pulled live from Shopify. Adjustments here are local — full inventory write API in next sprint.
          </p>
        </div>
      </SectionCard>
    </div>
  )
}
