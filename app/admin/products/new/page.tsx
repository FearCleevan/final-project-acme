'use client'

import { useState } from 'react'
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

export default function NewProductPage() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const from         = searchParams.get('from') ?? ''
  const backHref     = `/admin/products${from}`

  const [saving,  setSaving]  = useState(false)
  const [success, setSuccess] = useState(false)
  const [toast,   setToast]   = useState<{ message: string; type: ToastType } | null>(null)

  async function handleSave(data: AdminProduct) {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/products', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(data),
      })
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
      {/* ── Sticky topbar ── */}
      <div
        className="sticky z-30 flex items-center justify-between px-4 sm:px-5 lg:px-6 py-3 border-b border-(--admin-border) bg-(--admin-surface) -mx-4 sm:-mx-5 lg:-mx-6 -mt-4 sm:-mt-5 lg:-mt-6 mb-6"
        style={{ top: 'var(--admin-topbar-h)' }}
      >
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-[13px]">
          <Link
            href={backHref}
            className="text-(--admin-text-muted) hover:text-(--admin-text) transition-colors"
          >
            Products
          </Link>
          <BiChevronRight size={14} className="text-(--admin-text-muted)" />
          <span className="text-(--admin-text) font-medium">New Product</span>
        </nav>

        {/* Actions */}
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

      {/* ── Form ── */}
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
