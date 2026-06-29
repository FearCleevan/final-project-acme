'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { BiPlus, BiPencil, BiTrash, BiExport, BiImport, BiX, BiFile, BiRefresh, BiCopy, BiCheck } from 'react-icons/bi'
import { formatCurrency, collectionLabel } from '@/lib/admin/utils'
import { AdminCollection } from '@/lib/admin/types'
import Toast, { ToastType } from '@/components/admin/shared/Toast'
import { ProductStatus, AdminProduct } from '@/lib/admin/types'
import PageHeader from '@/components/admin/shared/PageHeader'
import SectionCard from '@/components/admin/shared/SectionCard'
import DataTable, { Column } from '@/components/admin/shared/DataTable'
import Badge, { productStatusVariant } from '@/components/admin/shared/Badge'
import SearchInput from '@/components/admin/shared/SearchInput'
import AdminSelect from '@/components/admin/shared/AdminSelect'
import Pagination from '@/components/admin/shared/Pagination'
import ConfirmModal from '@/components/admin/shared/ConfirmModal'
import { cn } from '@/lib/utils'

type TabFilter = 'all' | ProductStatus | 'complete' | 'incomplete'

const TABS: { label: string; value: TabFilter }[] = [
  { label: 'All',        value: 'all' },
  { label: 'Active',     value: 'active' },
  { label: 'Draft',      value: 'draft' },
  { label: 'Complete',   value: 'complete' },
  { label: 'Incomplete', value: 'incomplete' },
]

function isComplete(p: AdminProduct) {
  return p.price > 0 && !!p.images?.[0]
}

const PAGE_SIZES = [20, 30, 50, 100]

const CSV_HEADERS = [
  'Title', 'Short Description', 'SKU', 'Price', 'Compare-at Price',
  'Stock', 'Status', 'Collections', 'Tags', 'Vendor',
  'Material', 'Colour', 'Style', 'Brand', 'Vintage',
  'Burner Size', 'Fits', 'Power Source', 'Era',
  'Product Type', 'Condition', 'Edition',
  'Workshop', 'Bench Tester', 'Bench Test Date',
  'Net Weight',
]

function escapeCSV(v: unknown): string {
  const s = String(v ?? '').replace(/^[=+\-@\t\r]/, "'$&")
  return `"${s.replace(/"/g, '""')}"`
}

function exportProductsCSV(products: AdminProduct[]) {
  const rows = products.map(p => [
    p.title, p.shortDescription, p.sku, p.price, p.compareAtPrice ?? '',
    p.stock, p.status, p.collections.join(';'), p.tags.join(';'), p.vendor,
    p.material, p.colour, p.style, p.brand, p.vintage,
    p.burnerSize, p.fits, p.powerSource, p.era,
    p.productType, p.condition, p.edition,
    p.workshop, p.benchTester, p.benchTestDate,
    p.netWeight,
  ].map(escapeCSV).join(','))

  const csv = [CSV_HEADERS.map(escapeCSV).join(','), ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `products-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

interface ParsedRow { [key: string]: string }

export default function ProductsPage() {
  const router = useRouter()

  const [products,     setProducts]     = useState<AdminProduct[]>([])
  const [collections,  setCollections]  = useState<AdminCollection[]>([])
  const [loading,      setLoading]      = useState(true)
  const [tab,          setTab]          = useState<TabFilter>('all')
  const [collection,   setCollection]   = useState('all')
  const [search,       setSearch]       = useState('')
  const [page,         setPage]         = useState(1)
  const [selectedIds,  setSelectedIds]  = useState<Set<string>>(new Set())
  const [deleteTarget, setDeleteTarget] = useState<string[] | null>(null)
  const [syncing,      setSyncing]      = useState(false)
  const [toast,        setToast]        = useState<{ message: string; type: ToastType } | null>(null)
  const [copiedId,     setCopiedId]     = useState<string | null>(null)
  const [quickFilter,  setQuickFilter]  = useState<'no-price' | 'no-image' | 'no-stock' | null>(null)
  const [pageSize,     setPageSize]     = useState(20)

  function copyTitle(id: string, title: string, e: React.MouseEvent) {
    e.stopPropagation()
    navigator.clipboard.writeText(title)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  async function handleSyncPublish() {
    setSyncing(true)
    try {
      const res = await fetch('/api/admin/products/sync-publish', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        setToast({ message: `Published ${data.published} of ${data.total} products to Online Store.`, type: 'success' })
        await loadProducts()
      } else {
        setToast({ message: data.error ?? 'Sync failed.', type: 'error' })
      }
    } catch {
      setToast({ message: 'Sync failed. Please try again.', type: 'error' })
    } finally {
      setSyncing(false)
    }
  }

  async function fetchWithRetry(url: string, retries = 3): Promise<Response | null> {
    for (let i = 1; i <= retries; i++) {
      try {
        const res = await fetch(url)
        if (res.ok) return res
        if (res.status === 401) return null  // auth failure — don't retry
      } catch { /* network error — fall through to retry */ }
      if (i < retries) await new Promise(r => setTimeout(r, i * 800))
    }
    return null
  }

  async function loadProducts() {
    setLoading(true)
    try {
      const [pRes, cRes] = await Promise.all([
        fetchWithRetry('/api/admin/products'),
        fetchWithRetry('/api/admin/collections'),
      ])
      if (pRes) setProducts(await pRes.json())
      if (cRes) setCollections(await cRes.json())
    } finally {
      setLoading(false)
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadProducts() }, [])

  // Import modal state
  const [showImport,     setShowImport]     = useState(false)
  const [importFile,     setImportFile]     = useState<File | null>(null)
  const [importRows,     setImportRows]     = useState<ParsedRow[]>([])
  const [importing,      setImporting]      = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [importTotal,    setImportTotal]    = useState(0)
  const [importDone,     setImportDone]     = useState(false)
  const [importResults,  setImportResults]  = useState<{ title: string; status: 'created'|'duplicate'|'error'; message: string }[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const filtered = useMemo(() => {
    let list = products
    if (tab === 'complete')        list = list.filter(p => isComplete(p))
    else if (tab === 'incomplete') list = list.filter(p => !isComplete(p))
    else if (tab !== 'all')        list = list.filter(p => p.status === tab)
    if (collection !== 'all') list = list.filter(p => p.collections.includes(collection))
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(p =>
        p.title.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
      )
    }
    if (quickFilter === 'no-price') list = list.filter(p => !p.price || p.price === 0)
    if (quickFilter === 'no-image') list = list.filter(p => !p.images?.length || !p.images[0])
    if (quickFilter === 'no-stock') list = list.filter(p => p.stock === 0)
    return list
  }, [tab, collection, search, quickFilter, products])

  const quickCount = (f: 'no-price' | 'no-image' | 'no-stock') => {
    if (f === 'no-price') return products.filter(p => !p.price || p.price === 0).length
    if (f === 'no-image') return products.filter(p => !p.images?.length || !p.images[0]).length
    return products.filter(p => p.stock === 0).length
  }

  const totalPages = Math.ceil(filtered.length / pageSize)
  const paginated  = filtered.slice((page - 1) * pageSize, page * pageSize)

  const tabCount = (v: TabFilter) => {
    if (v === 'all')        return products.length
    if (v === 'complete')   return products.filter(p => isComplete(p)).length
    if (v === 'incomplete') return products.filter(p => !isComplete(p)).length
    return products.filter(p => p.status === v).length
  }

  const handleTabChange = (v: TabFilter) => { setTab(v); setPage(1) }
  const handleSearch    = (v: string)    => { setSearch(v); setPage(1) }

  function parseImportRows(rows: ParsedRow[]) {
    return rows.map(r => ({
      title:            r['Title']?.trim() ?? '',
      shortDescription: r['Short Description']?.trim() ?? '',
      sku:              r['SKU']?.trim() ?? '',
      price:            parseFloat(r['Price'] ?? '0') || 0,
      compareAtPrice:   r['Compare-at Price']?.trim() ? parseFloat(r['Compare-at Price']) : null,
      stock:            parseInt(r['Stock'] ?? '0', 10) || 0,
      status:           (r['Status']?.trim() === 'active' ? 'active' : 'draft') as 'active' | 'draft',
      collections:      (r['Collections'] ?? '').split(';').map((s: string) => s.trim()).filter(Boolean),
      tags:             (r['Tags'] ?? '').split(';').map((s: string) => s.trim()).filter(Boolean),
      vendor:           r['Vendor']?.trim() ?? '',
      material:         r['Material']?.trim() ?? '',
      colour:           r['Colour']?.trim() ?? '',
      style:            r['Style']?.trim() ?? '',
      brand:            r['Brand']?.trim() ?? '',
      vintage:          r['Vintage']?.trim() ?? '',
      burnerSize:       r['Burner Size']?.trim() ?? '',
      fits:             r['Fits']?.trim() ?? '',
      powerSource:      r['Power Source']?.trim() ?? '',
      era:              r['Era']?.trim() ?? '',
      productType:      r['Product Type']?.trim() ?? '',
      condition:        r['Condition']?.trim() ?? '',
      edition:          r['Edition']?.trim() ?? '',
      workshop:         r['Workshop']?.trim() ?? '',
      benchTester:      r['Bench Tester']?.trim() ?? '',
      benchTestDate:    r['Bench Test Date']?.trim() ?? '',
      netWeight:        r['Net Weight']?.trim() ?? '',
    }))
  }

  function handleFileSelect(file: File | null) {
    if (!file) return
    setImportFile(file)
    setImportDone(false)
    setImportResults([])
    setImportProgress(0)
    const reader = new FileReader()
    reader.onload = e => {
      const text = e.target?.result as string
      const lines = text.trim().split(/\r?\n/)
      if (lines.length < 2) return
      const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim())
      const rows: ParsedRow[] = lines.slice(1).map(line => {
        const vals = line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/)
        const row: ParsedRow = {}
        headers.forEach((h, i) => {
          row[h] = (vals[i] ?? '').replace(/^"|"$/g, '').replace(/""/g, '"').trim()
        })
        return row
      }).filter(r => Object.values(r).some(v => v !== ''))
      setImportRows(rows)
    }
    reader.readAsText(file)
  }

  async function handleImportConfirm() {
    if (!importFile || importRows.length === 0) return
    const rows = parseImportRows(importRows)
    setImporting(true)
    setImportTotal(rows.length)
    setImportProgress(0)
    setImportResults([])

    const accumulated: { title: string; status: 'created' | 'duplicate' | 'error'; message: string; productId?: string }[] = []

    for (let i = 0; i < rows.length; i++) {
      try {
        const res = await fetch('/api/admin/products/import', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ rows: [rows[i]] }),
        })
        const [result] = await res.json()
        accumulated.push(res.ok ? result : { title: rows[i].title, status: 'error' as const, message: result?.error ?? 'Import failed' })
      } catch (err) {
        accumulated.push({ title: rows[i].title, status: 'error' as const, message: String(err) })
      }
      setImportProgress(Math.round(((i + 1) / rows.length) * 100))
      setImportResults([...accumulated])
    }

    setImportDone(true)
    setImporting(false)
    await loadProducts()
    const created = accumulated.filter(r => r.status === 'created').length
    if (created > 0) {
      setToast({ message: `${created} product${created !== 1 ? 's' : ''} imported to Shopify.`, type: 'success' })
    }
  }

  function closeImportModal() {
    if (importing) return
    setShowImport(false)
    setImportFile(null)
    setImportRows([])
    setImportDone(false)
    setImportResults([])
    setImportProgress(0)
  }

  const COLUMNS: Column<AdminProduct>[] = [
    {
      key: 'title',
      label: 'Product',
      sortable: true,
      render: row => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-(--admin-surface-2) border border-(--admin-border) shrink-0 flex items-center justify-center overflow-hidden">
            {row.images?.[0]
              ? <img src={row.images[0]} alt="" className="w-full h-full object-cover" />
              : <span className="text-[9px] text-(--admin-text-muted) text-center leading-tight px-0.5">{row.sku}</span>
            }
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-[13px] font-medium text-(--admin-text) truncate max-w-120">{row.title}</p>
              <button
                onClick={e => copyTitle(row.id, row.title, e)}
                className="shrink-0 text-(--admin-text-muted) hover:text-(--admin-text) transition-colors"
                title="Copy product name"
              >
                {copiedId === row.id
                  ? <BiCheck className="w-3.5 h-3.5 text-green-500" />
                  : <BiCopy className="w-3.5 h-3.5" />
                }
              </button>
            </div>
            <p className="text-[11px] text-(--admin-text-muted)">{row.sku}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'collections',
      label: 'Collection',
      render: row => (
        <span className="text-[12px] text-(--admin-text-soft)">
          {row.collections.map(c => collectionLabel(c)).join(', ') || '—'}
        </span>
      ),
    },
    {
      key: 'price',
      label: 'Price',
      sortable: true,
      render: row => (
        <span className="text-[13px] font-semibold text-(--admin-text)">{formatCurrency(row.price)}</span>
      ),
    },
    {
      key: 'stock',
      label: 'Stock',
      sortable: true,
      render: row => (
        <span className={cn(
          'text-[12px]',
          row.stock === 0 ? 'text-(--admin-red)' : row.stock <= 3 ? 'text-(--admin-amber)' : 'text-(--admin-text)'
        )}>
          {row.stock === 0 ? 'Out' : row.stock}
        </span>
      ),
    },
    {
      key: 'soldCount',
      label: 'Sold',
      sortable: true,
      render: row => (
        <span className={`text-[12px] font-mono ${row.soldCount > 0 ? 'text-(--admin-green)' : 'text-(--admin-text-muted)'}`}>
          {row.soldCount > 0 ? row.soldCount : '—'}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: row => <Badge label={row.status} variant={productStatusVariant(row.status)} />,
    },
    {
      key: 'id',
      label: '',
      render: row => (
        <div className="flex items-center gap-1 justify-end" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => router.push(`/admin/products/${row.id}`)}
            className="p-1.5 rounded-md text-(--admin-text-muted) hover:bg-(--admin-surface-2) hover:text-(--admin-text) transition-colors"
            aria-label="Edit product"
          >
            <BiPencil size={14} />
          </button>
          <button
            onClick={() => setDeleteTarget([row.id])}
            className="p-1.5 rounded-md text-(--admin-text-muted) hover:bg-(--admin-surface-2) hover:text-(--admin-red) transition-colors"
            aria-label="Delete product"
          >
            <BiTrash size={14} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Products"
        subtitle={loading ? 'Loading…' : `${products.length} products`}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={handleSyncPublish}
              disabled={syncing}
              title="Publish all active products to the Online Store channel"
              className="flex items-center gap-1.5 h-8 px-3 text-[12px] text-(--admin-text-soft) bg-(--admin-surface-2) border border-(--admin-border) rounded-md hover:bg-(--admin-border) transition-colors disabled:opacity-60"
            >
              <BiRefresh size={14} className={syncing ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">{syncing ? 'Syncing…' : 'Sync to Store'}</span>
            </button>
            <button
              onClick={() => exportProductsCSV(filtered)}
              className="flex items-center gap-1.5 h-8 px-3 text-[12px] text-(--admin-text-soft) bg-(--admin-surface-2) border border-(--admin-border) rounded-md hover:bg-(--admin-border) transition-colors"
              aria-label="Export CSV"
            >
              <BiExport size={14} /><span className="hidden sm:inline">Export CSV</span>
            </button>
            <button
              onClick={() => setShowImport(true)}
              className="flex items-center gap-1.5 h-8 px-3 text-[12px] text-(--admin-text-soft) bg-(--admin-surface-2) border border-(--admin-border) rounded-md hover:bg-(--admin-border) transition-colors"
              aria-label="Import CSV"
            >
              <BiImport size={14} /><span className="hidden sm:inline">Import CSV</span>
            </button>
            <button
              onClick={() => router.push('/admin/products/new')}
              className="flex items-center gap-1.5 h-8 px-3 text-[12px] font-medium bg-(--admin-accent) text-(--admin-accent-text) rounded-md hover:opacity-90 transition-opacity"
            >
              <BiPlus size={14} /><span className="hidden sm:inline">Add product</span><span className="sm:hidden">Add</span>
            </button>
          </div>
        }
      />

      <SectionCard noPadding>
        {/* Filters */}
        <div className="flex flex-col gap-3 px-4 sm:px-5 py-4 border-b border-(--admin-border)">
          <div className="flex items-center gap-1 flex-wrap">
            {TABS.map(t => {
              const isActive = tab === t.value
              const isCompleteTab   = t.value === 'complete'
              const isIncompleteTab = t.value === 'incomplete'
              return (
                <button
                  key={t.value}
                  onClick={() => handleTabChange(t.value)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] transition-colors',
                    isActive && isCompleteTab   ? 'bg-emerald-600 text-white' :
                    isActive && isIncompleteTab ? 'bg-amber-500 text-white' :
                    isActive                    ? 'bg-(--admin-accent) text-(--admin-accent-text)' :
                    isCompleteTab               ? 'text-emerald-700 hover:bg-emerald-50' :
                    isIncompleteTab             ? 'text-amber-700 hover:bg-amber-50' :
                    'text-(--admin-text-soft) hover:bg-(--admin-surface-2) hover:text-(--admin-text)'
                  )}
                >
                  {t.label}
                  <span className={cn(
                    'text-[10px] px-1.5 py-0.5 rounded-full',
                    isActive && isCompleteTab   ? 'bg-white/20 text-white' :
                    isActive && isIncompleteTab ? 'bg-white/20 text-white' :
                    isActive                    ? 'bg-white/20 text-(--admin-accent-text)' :
                    isCompleteTab               ? 'bg-emerald-100 text-emerald-700' :
                    isIncompleteTab             ? 'bg-amber-100 text-amber-700' :
                    'bg-(--admin-border) text-(--admin-text-muted)'
                  )}>
                    {tabCount(t.value)}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Quick filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] uppercase tracking-widest text-(--admin-text-muted) font-medium shrink-0">Needs attention:</span>
            {(
              [
                { value: 'no-price', label: 'No Price'  },
                { value: 'no-image', label: 'No Image'  },
                { value: 'no-stock', label: 'No Stock'  },
              ] as const
            ).map(({ value, label }) => {
              const count   = quickCount(value)
              const active  = quickFilter === value
              return (
                <button
                  key={value}
                  onClick={() => { setQuickFilter(active ? null : value); setPage(1) }}
                  className={cn(
                    'flex items-center gap-1.5 h-6 px-2.5 rounded-full text-[11px] font-medium border transition-colors',
                    active
                      ? 'bg-amber-500 border-amber-500 text-white'
                      : count > 0
                        ? 'border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100'
                        : 'border-(--admin-border) text-(--admin-text-muted) bg-(--admin-surface-2) opacity-50 pointer-events-none'
                  )}
                >
                  {label}
                  <span className={cn(
                    'text-[10px] px-1 py-px rounded-full',
                    active ? 'bg-white/30 text-white' : 'bg-amber-200 text-amber-800'
                  )}>
                    {count}
                  </span>
                </button>
              )
            })}
            {quickFilter && (
              <button
                onClick={() => { setQuickFilter(null); setPage(1) }}
                className="text-[11px] text-(--admin-text-muted) hover:text-(--admin-text) transition-colors ml-1"
              >
                ✕ Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <AdminSelect
              value={collection}
              onChange={v => { setCollection(v); setPage(1) }}
              className="w-40 sm:w-auto shrink-0"
              options={[
                { value: 'all', label: 'All collections' },
                ...collections.map(c => ({ value: c.handle, label: c.title })),
              ]}
            />
            <SearchInput
              value={search}
              onChange={handleSearch}
              placeholder="Search title or SKU…"
              className="flex-1 sm:flex-none sm:w-64"
            />
          </div>
        </div>

        {/* Bulk actions */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-3 px-5 py-2.5 bg-(--admin-surface-2) border-b border-(--admin-border)">
            <span className="text-[12px] text-(--admin-text-soft)">{selectedIds.size} selected</span>

            {/* Change Status */}
            <select
              defaultValue=""
              onChange={async e => {
                const newStatus = e.target.value as 'active' | 'draft'
                if (!newStatus) return
                e.target.value = ''
                const ids = Array.from(selectedIds)
                try {
                  const res = await fetch('/api/admin/products/bulk-status', {
                    method:  'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body:    JSON.stringify({ ids, status: newStatus }),
                  })
                  const results = await res.json()
                  if (!res.ok) throw new Error(results.error ?? 'Update failed')
                  const failed = results.filter((r: { ok: boolean }) => !r.ok).length
                  await loadProducts()
                  setSelectedIds(new Set())
                  if (failed > 0) {
                    setToast({ message: `${ids.length - failed} updated, ${failed} failed.`, type: 'error' })
                  } else {
                    setToast({ message: `${ids.length} product${ids.length !== 1 ? 's' : ''} set to ${newStatus}.`, type: 'success' })
                  }
                } catch (err) {
                  setToast({ message: String(err), type: 'error' })
                }
              }}
              className="h-7 px-2 pr-6 text-[11px] rounded-md border cursor-pointer appearance-none"
              style={{
                borderColor:      'var(--admin-border)',
                color:            'var(--admin-text-soft)',
                background:       'var(--admin-surface) url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'10\' height=\'6\'%3E%3Cpath d=\'M0 0l5 6 5-6z\' fill=\'%23999\'/%3E%3C/svg%3E") no-repeat right 8px center',
                backgroundSize:   '8px',
              }}
            >
              <option value="" disabled>Change status…</option>
              <option value="active">Set Active</option>
              <option value="draft">Set Draft</option>
            </select>

            <button
              onClick={() => setDeleteTarget(Array.from(selectedIds))}
              className="flex items-center gap-1.5 h-7 px-3 text-[11px] text-(--admin-red) bg-(--admin-red-bg) border border-(--admin-red)/20 rounded-md hover:opacity-80 transition-opacity"
            >
              <BiTrash size={12} /> Delete selected
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="ml-auto text-[11px] text-(--admin-text-muted) hover:text-(--admin-text) transition-colors"
            >
              Clear
            </button>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="divide-y divide-(--admin-border)">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3">
                <div className="w-4 h-4 rounded bg-(--admin-border) animate-pulse shrink-0" />
                <div className="w-10 h-10 rounded-md bg-(--admin-border) animate-pulse shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-48 bg-(--admin-border) rounded animate-pulse" />
                  <div className="h-2.5 w-20 bg-(--admin-border) rounded animate-pulse" />
                </div>
                <div className="h-3 w-24 bg-(--admin-border) rounded animate-pulse hidden sm:block" />
                <div className="h-3 w-14 bg-(--admin-border) rounded animate-pulse hidden sm:block" />
                <div className="h-3 w-10 bg-(--admin-border) rounded animate-pulse hidden sm:block" />
                <div className="h-5 w-14 bg-(--admin-border) rounded-full animate-pulse hidden sm:block" />
              </div>
            ))}
          </div>
        )}

        {/* Mobile card list */}
        {!loading && <div className="sm:hidden divide-y divide-(--admin-border)">
          {paginated.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-[13px] text-(--admin-text-soft)">No products found</p>
              <p className="text-[11px] text-(--admin-text-muted) mt-1">Try adjusting your filters or add a new product.</p>
            </div>
          ) : paginated.map(p => (
            <div
              key={p.id}
              onClick={() => router.push(`/admin/products/${p.id}`)}
              className="flex items-center gap-3 px-4 py-3 hover:bg-(--admin-surface-2) cursor-pointer transition-colors"
            >
              <div className="w-10 h-10 rounded-md bg-(--admin-surface-2) border border-(--admin-border) shrink-0 flex items-center justify-center overflow-hidden">
                {p.images?.[0]
                  ? <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
                  : <span className="text-[9px] text-(--admin-text-muted) text-center leading-tight px-0.5">{p.sku}</span>
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-(--admin-text) truncate">{p.title}</p>
                <p className="text-[11px] text-(--admin-text-muted)">{p.sku}</p>
              </div>
              <div className="text-right shrink-0 space-y-1">
                <p className="text-[13px] font-semibold text-(--admin-text)">{formatCurrency(p.price)}</p>
                <Badge label={p.status} variant={productStatusVariant(p.status)} />
              </div>
            </div>
          ))}
        </div>}

        {/* Desktop/tablet table */}
        {!loading && <div className="hidden sm:block">
          <DataTable
            columns={COLUMNS as unknown as Column<Record<string, unknown>>[]}
            data={paginated as unknown as Record<string, unknown>[]}
            keyField="id"
            selectable
            selectedIds={selectedIds}
            onSelectChange={setSelectedIds}
            onRowClick={row => router.push(`/admin/products/${row.id}`)}
            emptyMessage="No products found"
            emptyDescription="Try adjusting your filters or add a new product."
          />
        </div>}

        <div className="flex items-center justify-between px-5 pb-4 gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-(--admin-text-muted)">Rows per page</span>
            <div className="flex items-center gap-1">
              {PAGE_SIZES.map(size => (
                <button
                  key={size}
                  onClick={() => { setPageSize(size); setPage(1) }}
                  className={cn(
                    'w-8 h-7 text-[11px] font-medium rounded-md transition-colors',
                    pageSize === size
                      ? 'bg-(--admin-accent) text-(--admin-accent-text)'
                      : 'text-(--admin-text-muted) hover:bg-(--admin-surface-2) hover:text-(--admin-text)'
                  )}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalItems={filtered.length}
            pageSize={pageSize}
          />
        </div>
      </SectionCard>

      {/* Delete confirmation */}
      {deleteTarget && (
        <ConfirmModal
          isOpen
          title={deleteTarget.length === 1 ? 'Delete product?' : `Delete ${deleteTarget.length} products?`}
          message="This action cannot be undone. In Plan 1 this only affects your current session."
          confirmLabel="Delete"
          dangerous
          onConfirm={async () => {
            await Promise.all(
              (deleteTarget ?? []).map(id =>
                fetch(`/api/admin/products/${id}`, { method: 'DELETE' })
              )
            )
            setDeleteTarget(null)
            setSelectedIds(new Set())
            await loadProducts()
            setToast({ message: 'Product deleted from Shopify.', type: 'success' })
          }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* Import CSV modal */}
      {showImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={importing ? undefined : closeImportModal} aria-hidden="true" />
          <div
            className="relative w-full max-w-2xl rounded-lg shadow-xl border"
            style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--admin-border)' }}>
              <p className="text-[13px] font-semibold" style={{ color: 'var(--admin-text)' }}>Import Products (CSV)</p>
              <button onClick={closeImportModal} className="p-1 rounded-md hover:bg-(--admin-surface-2)" aria-label="Close">
                <BiX size={18} style={{ color: 'var(--admin-text-muted)' }} />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">

              {/* ── Done: results summary ── */}
              {importDone ? (
                <div className="space-y-3">
                  {(() => {
                    const created   = importResults.filter(r => r.status === 'created').length
                    const duplicate = importResults.filter(r => r.status === 'duplicate').length
                    const error     = importResults.filter(r => r.status === 'error').length
                    return (
                      <div className="flex gap-3 flex-wrap">
                        {created > 0 && (
                          <span className="text-[12px] px-2.5 py-1 rounded-full bg-(--admin-green-bg) text-(--admin-green) font-medium">
                            {created} created
                          </span>
                        )}
                        {duplicate > 0 && (
                          <span className="text-[12px] px-2.5 py-1 rounded-full bg-(--admin-amber-bg) text-amber-700 font-medium">
                            {duplicate} duplicate{duplicate !== 1 ? 's' : ''}
                          </span>
                        )}
                        {error > 0 && (
                          <span className="text-[12px] px-2.5 py-1 rounded-full bg-(--admin-red-bg) text-(--admin-red) font-medium">
                            {error} error{error !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    )
                  })()}

                  <div className="overflow-x-auto rounded-md border border-(--admin-border) max-h-72 overflow-y-auto">
                    <table className="w-full text-left text-[11px]">
                      <thead className="sticky top-0 bg-(--admin-surface-2) border-b border-(--admin-border)">
                        <tr>
                          <th className="px-3 py-2 text-(--admin-text-muted) uppercase tracking-wide">Product</th>
                          <th className="px-3 py-2 text-(--admin-text-muted) uppercase tracking-wide w-24">Result</th>
                          <th className="px-3 py-2 text-(--admin-text-muted) uppercase tracking-wide">Note</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importResults.map((r, i) => (
                          <tr key={i} className="border-b border-(--admin-border) last:border-0">
                            <td className="px-3 py-2 text-(--admin-text) truncate max-w-52">{r.title || '—'}</td>
                            <td className="px-3 py-2">
                              {r.status === 'created'   && <span className="text-(--admin-green) font-medium">Created</span>}
                              {r.status === 'duplicate' && <span className="text-amber-600 font-medium">Duplicate</span>}
                              {r.status === 'error'     && <span className="text-(--admin-red) font-medium">Error</span>}
                            </td>
                            <td className="px-3 py-2 text-(--admin-text-muted) truncate max-w-52">{r.message || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={closeImportModal}
                      className="h-9 px-5 text-[12px] font-medium rounded-md"
                      style={{ background: 'var(--admin-accent)', color: 'var(--admin-accent-text)' }}
                    >
                      Done
                    </button>
                  </div>
                </div>

              ) : importing ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[13px] font-medium text-(--admin-text)">
                      Importing into Shopify…
                    </p>
                    <span className="text-[12px] text-(--admin-text-muted) tabular-nums">
                      {importResults.length} of {importTotal} · {importProgress}%
                    </span>
                  </div>
                  <div className="w-full bg-(--admin-border) rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${importProgress}%`, background: 'var(--admin-accent)' }}
                    />
                  </div>
                  {importResults.length > 0 && (
                    <div className="overflow-y-auto max-h-52 rounded-md border border-(--admin-border)">
                      <table className="w-full text-left text-[11px]">
                        <tbody>
                          {importResults.map((r, i) => (
                            <tr key={i} className="border-b border-(--admin-border) last:border-0">
                              <td className="px-3 py-1.5 w-6 text-center">
                                {r.status === 'created'   && <span className="text-(--admin-green) font-bold">✓</span>}
                                {r.status === 'duplicate' && <span className="text-amber-600 font-bold">~</span>}
                                {r.status === 'error'     && <span className="text-(--admin-red) font-bold">✗</span>}
                              </td>
                              <td className="px-3 py-1.5 text-(--admin-text) truncate max-w-[180px]">{r.title || '—'}</td>
                              <td className="px-3 py-1.5 text-right whitespace-nowrap">
                                {r.status === 'created'   && <span className="text-(--admin-green)">Created</span>}
                                {r.status === 'duplicate' && <span className="text-amber-600">Duplicate</span>}
                                {r.status === 'error'     && <span className="text-(--admin-red)">{r.message || 'Error'}</span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

              ) : (
                <>
                  <div
                    className="border-2 border-dashed border-(--admin-border) rounded-md p-6 text-center cursor-pointer hover:border-(--admin-accent)/30 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={e => { e.preventDefault(); handleFileSelect(e.dataTransfer.files[0]) }}
                    onDragOver={e => e.preventDefault()}
                  >
                    <BiFile size={22} className="mx-auto mb-2 text-(--admin-text-muted)" />
                    {importFile
                      ? <p className="text-[13px] text-(--admin-text)">{importFile.name}</p>
                      : <p className="text-[12px] text-(--admin-text-soft)">Drop CSV here or click to select</p>
                    }
                    <p className="text-[10px] text-(--admin-text-muted) mt-1">
                      Use Export CSV first to get the correct column format. &quot;Scott No.&quot; column is ignored automatically.
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      className="hidden"
                      onChange={e => handleFileSelect(e.target.files?.[0] ?? null)}
                    />
                  </div>

                  {importRows.length > 0 && (
                    <div>
                      <p className="text-[11px] text-(--admin-text-muted) mb-2">
                        Preview — first {Math.min(importRows.length, 5)} of {importRows.length} row{importRows.length !== 1 ? 's' : ''}
                      </p>
                      <div className="overflow-x-auto rounded-md border border-(--admin-border)">
                        <table className="w-full text-left text-[11px]">
                          <thead>
                            <tr className="border-b border-(--admin-border) bg-(--admin-surface-2)">
                              {['Title', 'SKU', 'Status', 'Collections'].map(h => (
                                <th key={h} className="px-3 py-2 uppercase tracking-wide text-(--admin-text-muted) whitespace-nowrap">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {importRows.slice(0, 5).map((row, i) => (
                              <tr key={i} className="border-b border-(--admin-border) last:border-0">
                                <td className="px-3 py-2 text-(--admin-text) truncate max-w-40">{row['Title'] || '—'}</td>
                                <td className="px-3 py-2 text-(--admin-text-muted)">{row['SKU'] || '—'}</td>
                                <td className="px-3 py-2 text-(--admin-text-soft) capitalize">{row['Status'] || 'draft'}</td>
                                <td className="px-3 py-2 text-(--admin-text-muted) truncate max-w-32">{row['Collections'] || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={closeImportModal}
                      className="h-9 px-4 text-[12px] rounded-md border transition-colors hover:bg-(--admin-surface-2)"
                      style={{ borderColor: 'var(--admin-border)', color: 'var(--admin-text-soft)' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={!importFile || importRows.length === 0 || importing}
                      onClick={handleImportConfirm}
                      className="h-9 px-4 text-[12px] font-medium rounded-md transition-opacity hover:opacity-90 disabled:opacity-40"
                      style={{ background: 'var(--admin-accent)', color: 'var(--admin-accent-text)' }}
                    >
                      Import {importRows.length > 0 ? `${importRows.length} product${importRows.length !== 1 ? 's' : ''}` : ''}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}


      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}