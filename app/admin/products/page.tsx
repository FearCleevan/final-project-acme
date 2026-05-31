'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { BiPlus, BiPencil, BiTrash, BiExport, BiImport, BiX, BiFile, BiCheck, BiRefresh } from 'react-icons/bi'
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
import ProductForm from '@/components/admin/forms/ProductForm'
import { cn } from '@/lib/utils'

type TabFilter = 'all' | ProductStatus

const TABS: { label: string; value: TabFilter }[] = [
  { label: 'All',    value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Draft',  value: 'draft' },
]

const PAGE_SIZE = 20

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

  async function loadProducts() {
    setLoading(true)
    try {
      const [pRes, cRes] = await Promise.all([
        fetch('/api/admin/products'),
        fetch('/api/admin/collections'),
      ])
      if (pRes.ok) setProducts(await pRes.json())
      if (cRes.ok) setCollections(await cRes.json())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadProducts() }, [])

  // Import modal state
  const [showImport,   setShowImport]   = useState(false)
  const [importFile,   setImportFile]   = useState<File | null>(null)
  const [importRows,   setImportRows]   = useState<ParsedRow[]>([])
  const [importDone,   setImportDone]   = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Add Product modal — stays mounted for draft persistence
  const [addModalOpen,   setAddModalOpen]   = useState(false)
  const [addSaving,      setAddSaving]      = useState(false)
  const [addSuccess,     setAddSuccess]     = useState(false)
  const [addFormKey,     setAddFormKey]     = useState(0)
  const [toast,          setToast]          = useState<{ message: string; type: ToastType } | null>(null)

  // Edit Product modal
  const [editModalOpen,  setEditModalOpen]  = useState(false)
  const [editProduct,    setEditProduct]    = useState<AdminProduct | null>(null)
  const [editSaving,     setEditSaving]     = useState(false)
  const [editSuccess,    setEditSuccess]    = useState(false)
  const [editFormKey,    setEditFormKey]    = useState(0)

  const filtered = useMemo(() => {
    let list = products
    if (tab !== 'all')        list = list.filter(p => p.status === tab)
    if (collection !== 'all') list = list.filter(p => p.collections.includes(collection))
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(p =>
        p.title.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
      )
    }
    return list
  }, [tab, collection, search, products])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const tabCount = (v: TabFilter) =>
    v === 'all' ? products.length : products.filter(p => p.status === v).length

  const handleTabChange = (v: TabFilter) => { setTab(v); setPage(1) }
  const handleSearch    = (v: string)    => { setSearch(v); setPage(1) }

  function handleFileSelect(file: File | null) {
    if (!file) return
    setImportFile(file)
    setImportDone(false)
    const reader = new FileReader()
    reader.onload = e => {
      const text = e.target?.result as string
      const lines = text.trim().split('\n')
      if (lines.length < 2) return
      const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim())
      const rows: ParsedRow[] = lines.slice(1, 6).map(line => {
        const vals = line.match(/(".*?"|[^,]+)/g) ?? []
        const row: ParsedRow = {}
        headers.forEach((h, i) => {
          row[h] = (vals[i] ?? '').replace(/^"|"$/g, '').trim()
        })
        return row
      })
      setImportRows(rows)
    }
    reader.readAsText(file)
  }

  function handleImportConfirm() {
    setImportDone(true)
  }

  function handleEditOpen(product: AdminProduct) {
    setEditProduct(product)
    setEditModalOpen(true)
    setEditSuccess(false)
  }

  function handleEditDiscard() {
    setEditModalOpen(false)
    setEditFormKey(k => k + 1)
  }

  async function handleEditSave(data: AdminProduct) {
    if (!editProduct) return
    setEditSaving(true)
    try {
      const res = await fetch(`/api/admin/products/${editProduct.id}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(data),
      })
      if (!res.ok) throw new Error(await res.text())
      setEditSuccess(true)
      setToast({ message: 'Product saved successfully.', type: 'success' })
      await loadProducts()
      setTimeout(() => {
        setEditSuccess(false)
        setEditModalOpen(false)
        setEditFormKey(k => k + 1)
      }, 1200)
    } catch (err) {
      console.error('Failed to update product:', err)
      setToast({ message: 'Failed to save product. Please try again.', type: 'error' })
    } finally {
      setEditSaving(false)
    }
  }

  async function handleAddSave(data: AdminProduct) {
    setAddSaving(true)
    try {
      const res = await fetch('/api/admin/products', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(data),
      })
      if (!res.ok) throw new Error(await res.text())
      setAddSuccess(true)
      setToast({ message: 'Product added to Shopify.', type: 'success' })
      await loadProducts()
      setTimeout(() => {
        setAddSuccess(false)
        setAddModalOpen(false)
        setAddFormKey(k => k + 1)
      }, 1200)
    } catch (err) {
      console.error('Failed to save product:', err)
      setToast({ message: 'Failed to add product. Please try again.', type: 'error' })
    } finally {
      setAddSaving(false)
    }
  }

  function handleAddDiscard() {
    setAddModalOpen(false)
    setAddFormKey(k => k + 1) // explicit discard — clear draft
  }

  function closeImportModal() {
    setShowImport(false)
    setImportFile(null)
    setImportRows([])
    setImportDone(false)
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
            <p className="text-[13px] font-medium text-(--admin-text) truncate max-w-56">{row.title}</p>
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
            onClick={() => handleEditOpen(row as unknown as AdminProduct)}
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
              onClick={() => setAddModalOpen(true)}
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
            {TABS.map(t => (
              <button
                key={t.value}
                onClick={() => handleTabChange(t.value)}
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
              onClick={() => handleEditOpen(p)}
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
            onRowClick={row => handleEditOpen(row as unknown as AdminProduct)}
            emptyMessage="No products found"
            emptyDescription="Try adjusting your filters or add a new product."
          />
        </div>}

        <div className="px-5 pb-4">
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalItems={filtered.length}
            pageSize={PAGE_SIZE}
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
          <div className="absolute inset-0 bg-black/40" onClick={closeImportModal} aria-hidden="true" />
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
              {importDone ? (
                <div className="py-8 text-center">
                  <p className="text-[14px] font-medium" style={{ color: 'var(--admin-green)' }}>
                    {importRows.length} product{importRows.length !== 1 ? 's' : ''} imported successfully.
                  </p>
                  <p className="text-[12px] mt-1" style={{ color: 'var(--admin-text-muted)' }}>
                    Plan 1: preview only — real import syncs to Shopify in Plan 2.
                  </p>
                  <button
                    onClick={closeImportModal}
                    className="mt-4 h-9 px-5 text-[12px] font-medium rounded-md"
                    style={{ background: 'var(--admin-accent)', color: 'var(--admin-accent-text)' }}
                  >
                    Done
                  </button>
                </div>
              ) : (
                <>
                  {/* Drop zone */}
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
                      Use Export CSV first to get the correct column format.
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      className="hidden"
                      onChange={e => handleFileSelect(e.target.files?.[0] ?? null)}
                    />
                  </div>

                  {/* Preview table */}
                  {importRows.length > 0 && (
                    <div>
                      <p className="text-[11px] text-(--admin-text-muted) mb-2">
                        Preview — first {importRows.length} row{importRows.length !== 1 ? 's' : ''}
                      </p>
                      <div className="overflow-x-auto rounded-md border border-(--admin-border)">
                        <table className="w-full text-left text-[11px]">
                          <thead>
                            <tr className="border-b border-(--admin-border) bg-(--admin-surface-2)">
                              {['Title', 'SKU', 'Price', 'Stock', 'Status'].map(h => (
                                <th key={h} className="px-3 py-2 uppercase tracking-wide text-(--admin-text-muted) whitespace-nowrap">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {importRows.map((row, i) => (
                              <tr key={i} className="border-b border-(--admin-border) last:border-0">
                                <td className="px-3 py-2 text-(--admin-text) truncate max-w-40">{row['Title'] || '—'}</td>
                                <td className="px-3 py-2 text-(--admin-text-muted)">{row['SKU'] || '—'}</td>
                                <td className="px-3 py-2 text-(--admin-text)">{row['Price'] || '—'}</td>
                                <td className="px-3 py-2 text-(--admin-text)">{row['Stock'] || '—'}</td>
                                <td className="px-3 py-2 text-(--admin-text-soft) capitalize">{row['Status'] || '—'}</td>
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
                      disabled={!importFile || importRows.length === 0}
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

      {/* ── Add Product Modal — always mounted for draft persistence ── */}
      <div
        className={cn(
          'fixed inset-0 z-50 flex items-start justify-center p-4 pt-6 transition-opacity duration-200',
          addModalOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
      >
        {/* Backdrop — covers full screen including sidebar */}
        <div className="absolute inset-0 bg-black/50" onClick={() => setAddModalOpen(false)} />

        {/* Dialog — wide to fit two-column layout */}
        <div className="relative w-full max-w-5xl max-h-[calc(100vh-3rem)] flex flex-col bg-(--admin-surface) border border-(--admin-border) rounded-xl shadow-2xl">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-(--admin-border) shrink-0">
            <p className="text-[15px] font-semibold text-(--admin-text)">New product</p>
            <button
              onClick={() => setAddModalOpen(false)}
              className="w-8 h-8 flex items-center justify-center rounded-md text-(--admin-text-muted) hover:bg-(--admin-surface-2) hover:text-(--admin-text) transition-colors"
            >
              <BiX size={18} />
            </button>
          </div>

          {/* Scrollable form body */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <ProductForm
              key={addFormKey}
              hideFooter
              formId="add-product-form"
              onSave={handleAddSave}
              onDiscard={handleAddDiscard}
            />
          </div>

          {/* Footer */}
          <div className="shrink-0 border-t border-(--admin-border) px-6 py-4 flex items-center justify-end gap-3">
            {addSuccess ? (
              <div className="flex items-center gap-2 text-(--admin-green)">
                <BiCheck size={16} />
                <span className="text-[13px] font-medium">Product saved</span>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleAddDiscard}
                  className="h-9 px-4 text-[12px] text-(--admin-text-soft) bg-(--admin-surface-2) border border-(--admin-border) rounded-md hover:bg-(--admin-border) transition-colors"
                >
                  Discard
                </button>
                <button
                  form="add-product-form"
                  type="submit"
                  disabled={addSaving}
                  className="h-9 px-5 text-[12px] font-medium bg-(--admin-accent) text-(--admin-accent-text) rounded-md hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center gap-2"
                >
                  {addSaving ? (
                    <>
                      <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Saving…
                    </>
                  ) : 'Save product'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Edit Product Modal ── */}
      <div
        className={cn(
          'fixed inset-0 z-50 flex items-start justify-center p-4 pt-6 transition-opacity duration-200',
          editModalOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
      >
        <div className="absolute inset-0 bg-black/50" onClick={handleEditDiscard} />
        <div className="relative w-full max-w-5xl max-h-[calc(100vh-3rem)] flex flex-col bg-(--admin-surface) border border-(--admin-border) rounded-xl shadow-2xl">

          <div className="flex items-center justify-between px-6 py-4 border-b border-(--admin-border) shrink-0">
            <div className="min-w-0">
              <p className="text-[15px] font-semibold text-(--admin-text) truncate">{editProduct?.title ?? 'Edit product'}</p>
              {editProduct?.sku && (
                <p className="text-[11px] text-(--admin-text-muted) mt-0.5">SKU: {editProduct.sku}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => { handleEditDiscard(); setDeleteTarget([editProduct!.id]) }}
                className="flex items-center gap-1.5 h-8 px-3 text-[12px] text-(--admin-red) bg-(--admin-red-bg) border border-(--admin-red)/20 rounded-md hover:opacity-80 transition-opacity"
              >
                <BiTrash size={13} /> Delete
              </button>
              <button
                type="button"
                aria-label="Close"
                onClick={handleEditDiscard}
                className="w-8 h-8 flex items-center justify-center rounded-md text-(--admin-text-muted) hover:bg-(--admin-surface-2) hover:text-(--admin-text) transition-colors"
              >
                <BiX size={18} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6">
            {editProduct && (
              <ProductForm
                key={editFormKey}
                hideFooter
                formId="edit-product-form"
                defaultValues={editProduct}
                onSave={handleEditSave}
                onDiscard={handleEditDiscard}
              />
            )}
          </div>

          <div className="shrink-0 border-t border-(--admin-border) px-6 py-4 flex items-center justify-end gap-3">
            {editSuccess ? (
              <div className="flex items-center gap-2 text-(--admin-green)">
                <BiCheck size={16} />
                <span className="text-[13px] font-medium">Product saved</span>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleEditDiscard}
                  className="h-9 px-4 text-[12px] text-(--admin-text-soft) bg-(--admin-surface-2) border border-(--admin-border) rounded-md hover:bg-(--admin-border) transition-colors"
                >
                  Discard
                </button>
                <button
                  form="edit-product-form"
                  type="submit"
                  disabled={editSaving}
                  className="h-9 px-5 text-[12px] font-medium bg-(--admin-accent) text-(--admin-accent-text) rounded-md hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center gap-2"
                >
                  {editSaving ? (
                    <>
                      <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Saving…
                    </>
                  ) : 'Save changes'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

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
