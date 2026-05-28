'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { BiArrowBack, BiTrash, BiCheck } from 'react-icons/bi'
import PageHeader from '@/components/admin/shared/PageHeader'
import ProductForm from '@/components/admin/forms/ProductForm'
import ConfirmModal from '@/components/admin/shared/ConfirmModal'
import { AdminProduct } from '@/lib/admin/types'
import Toast, { ToastType } from '@/components/admin/shared/Toast'

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>()
  const router  = useRouter()

  const [product,     setProduct]     = useState<AdminProduct | null | undefined>(undefined)
  const [saving,      setSaving]      = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [showDelete,  setShowDelete]  = useState(false)
  const [deleting,    setDeleting]    = useState(false)
  const [toast,       setToast]       = useState<{ message: string; type: ToastType } | null>(null)

  useEffect(() => {
    fetch(`/api/admin/products/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(setProduct)
  }, [id])

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
      setSaveSuccess(true)
      setToast({ message: 'Product saved successfully.', type: 'success' })
      setTimeout(() => setSaveSuccess(false), 2000)
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
      router.push('/admin/products')
    } catch {
      setToast({ message: 'Failed to delete product. Please try again.', type: 'error' })
      setDeleting(false)
    }
  }

  // Loading state
  if (product === undefined) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-64 bg-(--admin-border) rounded" />
        <div className="h-4 w-32 bg-(--admin-border) rounded" />
        <div className="h-64 bg-(--admin-border) rounded-xl mt-6" />
      </div>
    )
  }

  // Not found
  if (product === null) {
    return (
      <div className="text-center py-24">
        <p className="text-[14px] text-(--admin-text-soft)">Product not found.</p>
        <button
          onClick={() => router.push('/admin/products')}
          className="mt-4 text-[12px] text-(--admin-text-muted) hover:text-(--admin-text) transition-colors"
        >
          ← Back to products
        </button>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title={product.title}
        subtitle={`SKU: ${product.sku}`}
        actions={
          <div className="flex items-center gap-2">
            {saveSuccess && (
              <div className="flex items-center gap-1.5 text-(--admin-green) text-[12px] font-medium">
                <BiCheck size={15} /> Saved
              </div>
            )}
            <button
              onClick={() => setShowDelete(true)}
              className="flex items-center gap-1.5 h-8 px-3 text-[12px] text-(--admin-red) bg-(--admin-red-bg) border border-(--admin-red)/20 rounded-md hover:opacity-80 transition-opacity"
            >
              <BiTrash size={13} /> Delete
            </button>
            <button
              onClick={() => router.push('/admin/products')}
              className="flex items-center gap-1.5 h-8 px-3 text-[12px] text-(--admin-text-soft) bg-(--admin-surface-2) border border-(--admin-border) rounded-md hover:bg-(--admin-border) transition-colors"
            >
              <BiArrowBack size={14} /> Back
            </button>
          </div>
        }
      />

      <ProductForm
        key={product.id}
        defaultValues={product}
        saving={saving}
        onSave={handleSave}
        onDiscard={() => router.push('/admin/products')}
      />

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
