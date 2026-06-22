'use client'

import { Suspense, useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { BiChevronRight, BiTrash, BiCheck, BiEnvelope } from 'react-icons/bi'
import Link from 'next/link'
import ProductForm from '@/components/admin/forms/ProductForm'
import ConfirmModal from '@/components/admin/shared/ConfirmModal'
import Toast, { ToastType } from '@/components/admin/shared/Toast'
import Spinner from '@/components/admin/shared/Spinner'
import { AdminProduct } from '@/lib/admin/types'

function EditProductInner() {
  const { id }       = useParams<{ id: string }>()
  const router       = useRouter()
  const searchParams = useSearchParams()
  const from         = searchParams.get('from') ?? ''
  const backHref     = `/admin/products${from}`

  const [product,       setProduct]       = useState<AdminProduct | null | undefined>(undefined)
  const [saving,        setSaving]        = useState(false)
  const [success,       setSuccess]       = useState(false)
  const [showDelete,    setShowDelete]    = useState(false)
  const [deleting,      setDeleting]      = useState(false)
  const [toast,         setToast]         = useState<{ message: string; type: ToastType } | null>(null)
  const [waitlistCount, setWaitlistCount] = useState(0)
  const [notifying,     setNotifying]     = useState(false)

  useEffect(() => {
    fetch(`/api/admin/products/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(setProduct)
  }, [id])

  useEffect(() => {
    if (!product?.handle) return
    fetch(`/api/admin/products/notify-restock?handle=${encodeURIComponent(product.handle)}`)
      .then(r => r.ok ? r.json() : null)
      .then((data: { count: number } | null) => {
        if (data) setWaitlistCount(data.count)
      })
  }, [product?.handle])

  async function handleNotifyWaitlist(): Promise<void> {
    if (!product?.handle || waitlistCount === 0 || notifying) return
    setNotifying(true)
    try {
      const res = await fetch('/api/admin/products/notify-restock', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ productHandle: product.handle }),
      })
      const data = (await res.json()) as { ok: boolean; sent: number }
      if (res.ok && data.ok) {
        setWaitlistCount(0)
        setToast({ message: `Notified ${data.sent} customer${data.sent === 1 ? '' : 's'}.`, type: 'success' })
      } else {
        setToast({ message: 'Failed to send notifications. Please try again.', type: 'error' })
      }
    } catch {
      setToast({ message: 'Failed to send notifications. Please try again.', type: 'error' })
    } finally {
      setNotifying(false)
    }
  }

  async function handleSave(data: AdminProduct) {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(data),
      })
      if (!res.ok) throw new Error(await res.text())
      const updated = await res.json()
      setProduct(updated)
      setSuccess(true)
      setToast({ message: 'Product saved successfully.', type: 'success' })
      setTimeout(() => router.push(backHref), 1200)
    } catch (err) {
      console.error('Failed to update product:', err)
      setToast({ message: 'Failed to save product. Please try again.', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      router.push(backHref)
    } catch {
      setToast({ message: 'Failed to delete product. Please try again.', type: 'error' })
      setDeleting(false)
    }
  }

  if (product === undefined) {
    return (
      <div className="space-y-4 animate-pulse px-4 sm:px-5 lg:px-6 py-6">
        <div className="h-4 w-48 bg-(--admin-border) rounded" />
        <div className="h-64 bg-(--admin-border) rounded-xl mt-4" />
      </div>
    )
  }

  if (product === null) {
    return (
      <div className="text-center py-24">
        <p className="text-[14px] text-(--admin-text-soft)">Product not found.</p>
        <Link href={backHref} className="mt-4 inline-block text-[12px] text-(--admin-text-muted) hover:text-(--admin-text) transition-colors">
          ← Back to products
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div
        className="sticky z-30 flex items-center justify-between px-4 sm:px-5 lg:px-6 py-3 border-b border-(--admin-border) bg-(--admin-surface) -mx-4 sm:-mx-5 lg:-mx-6 -mt-4 sm:-mt-5 lg:-mt-6 mb-6"
        style={{ top: 'var(--admin-topbar-h)' }}
      >
        <nav className="flex items-center gap-1 text-[13px] min-w-0">
          <Link href={backHref} className="text-(--admin-text-muted) hover:text-(--admin-text) transition-colors shrink-0">
            Products
          </Link>
          <BiChevronRight size={14} className="text-(--admin-text-muted) shrink-0" />
          <span className="text-(--admin-text) font-medium truncate">{product.title}</span>
        </nav>

        <div className="flex items-center gap-2 shrink-0 ml-4">
          {success && (
            <span className="flex items-center gap-1.5 text-[12px] text-(--admin-green) font-medium">
              <BiCheck size={15} /> Saved
            </span>
          )}
          <button
            type="button"
            onClick={handleNotifyWaitlist}
            disabled={waitlistCount === 0 || notifying}
            className="flex items-center gap-1.5 h-8 px-3 text-[12px] text-(--admin-text-soft) bg-(--admin-surface-2) border border-(--admin-border) rounded-md hover:bg-(--admin-border) transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <BiEnvelope size={13} />
            {notifying ? 'Sending…' : `Notify ${waitlistCount} waiting`}
          </button>
          <button
            type="button"
            onClick={() => setShowDelete(true)}
            className="flex items-center gap-1.5 h-8 px-3 text-[12px] text-(--admin-red) bg-(--admin-red-bg) border border-(--admin-red)/20 rounded-md hover:opacity-80 transition-opacity"
          >
            <BiTrash size={13} /> Delete
          </button>
          <Link
            href={backHref}
            className="h-8 px-4 text-[12px] text-(--admin-text-soft) bg-(--admin-surface-2) border border-(--admin-border) rounded-md hover:bg-(--admin-border) transition-colors flex items-center"
          >
            Discard
          </Link>
          <button
            form="edit-product-form"
            type="submit"
            disabled={saving || success}
            className="h-8 px-4 text-[12px] font-medium bg-(--admin-accent) text-(--admin-accent-text) rounded-md hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center gap-2"
          >
            {saving ? <><Spinner className="w-3 h-3 border-white/30 border-t-white" /> Saving…</> : 'Save changes'}
          </button>
        </div>
      </div>

      <div>
        <ProductForm
          key={product.id}
          formId="edit-product-form"
          hideFooter
          defaultValues={product}
          saving={saving}
          onSave={handleSave}
          onDiscard={() => router.push(backHref)}
        />
      </div>

      {showDelete && (
        <ConfirmModal
          isOpen
          title="Delete product?"
          message={`"${product.title}" will be permanently deleted from Shopify. This cannot be undone.`}
          confirmLabel={deleting ? 'Deleting…' : 'Delete'}
          dangerous
          onConfirm={handleDelete}
          onCancel={() => setShowDelete(false)}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}

export default function EditProductPage() {
  return (
    <Suspense>
      <EditProductInner />
    </Suspense>
  )
}
