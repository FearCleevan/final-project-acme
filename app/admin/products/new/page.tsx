'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { BiChevronRight, BiCheck } from 'react-icons/bi'
import Link from 'next/link'
import ProductForm from '@/components/admin/forms/ProductForm'
import Toast, { ToastType } from '@/components/admin/shared/Toast'
import { AdminProduct } from '@/lib/admin/types'
import Spinner from '@/components/admin/shared/Spinner'

const DRAFT_KEY = 'draft:product:new'

function clearDraft() {
  try { localStorage.removeItem(DRAFT_KEY) } catch { /* ignore */ }
}

function NewProductInner() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const from         = searchParams.get('from') ?? ''
  const backHref     = `/admin/products${from}`

  const [saving,   setSaving]   = useState(false)
  const [success,  setSuccess]  = useState(false)
  const [toast,    setToast]    = useState<{ message: string; type: ToastType } | null>(null)
  const [duplicate, setDuplicate] = useState<{ id: string; title: string; pending: AdminProduct } | null>(null)

  async function handleSave(data: AdminProduct, force = false) {
    setSaving(true)
    setDuplicate(null)
    try {
      const res = await fetch('/api/admin/products', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ ...data, force }),
      })

      if (res.status === 409) {
        const json = await res.json()
        setDuplicate({ id: json.existing.id, title: json.existing.title, pending: data })
        return
      }

      if (!res.ok) throw new Error(await res.text())
      clearDraft()
      setSuccess(true)
      setToast({ message: 'Product added to Shopify.', type: 'success' })
      setTimeout(() => router.push(backHref), 1200)
    } catch (err) {
      console.error('Failed to save product:', err)
      setToast({ message: 'Failed to add product. Please try again.', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  function handleDiscard() {
    clearDraft()
    router.push(backHref)
  }

  return (
    <div>
      <div
        className="sticky z-30 flex items-center justify-between px-4 sm:px-5 lg:px-6 py-3 border-b border-(--admin-border) bg-(--admin-surface) -mx-4 sm:-mx-5 lg:-mx-6 -mt-4 sm:-mt-5 lg:-mt-6 mb-6"
        style={{ top: 'var(--admin-topbar-h)' }}
      >
        <nav className="flex items-center gap-1 text-[13px]">
          <Link href={backHref} className="text-(--admin-text-muted) hover:text-(--admin-text) transition-colors">
            Products
          </Link>
          <BiChevronRight size={14} className="text-(--admin-text-muted)" />
          <span className="text-(--admin-text) font-medium">New Product</span>
        </nav>

        <div className="flex items-center gap-2">
          {success && (
            <span className="flex items-center gap-1.5 text-[12px] text-(--admin-green) font-medium">
              <BiCheck size={15} /> Saved
            </span>
          )}
          <button
            type="button"
            onClick={handleDiscard}
            className="h-8 px-4 text-[12px] text-(--admin-text-soft) bg-(--admin-surface-2) border border-(--admin-border) rounded-md hover:bg-(--admin-border) transition-colors"
          >
            Discard
          </button>
          <button
            form="new-product-form"
            type="submit"
            disabled={saving || success}
            className="h-8 px-4 text-[12px] font-medium bg-(--admin-accent) text-(--admin-accent-text) rounded-md hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center gap-2"
          >
            {saving ? <><Spinner className="w-3 h-3 border-white/30 border-t-white" /> Saving…</> : 'Save product'}
          </button>
        </div>
      </div>

      {duplicate && (
        <div className="mb-5 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1 text-[13px] text-amber-900">
            <span className="font-semibold">Duplicate detected.</span>{' '}
            A product named &ldquo;{duplicate.title}&rdquo; already exists in Shopify.
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={`/admin/products/${duplicate.id}`}
              className="h-8 px-3 text-[12px] font-medium border border-amber-400 text-amber-800 rounded-md hover:bg-amber-100 transition-colors flex items-center"
            >
              View existing
            </Link>
            <button
              type="button"
              onClick={() => handleSave(duplicate.pending, true)}
              disabled={saving}
              className="h-8 px-3 text-[12px] font-medium bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors disabled:opacity-60"
            >
              Save as new anyway
            </button>
            <button
              type="button"
              onClick={() => setDuplicate(null)}
              className="h-8 px-3 text-[12px] text-amber-700 hover:text-amber-900 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div>
        <ProductForm
          formId="new-product-form"
          hideFooter
          draftKey={DRAFT_KEY}
          saving={saving}
          onSave={handleSave}
          onDiscard={handleDiscard}
        />
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}

export default function NewProductPage() {
  return (
    <Suspense>
      <NewProductInner />
    </Suspense>
  )
}
