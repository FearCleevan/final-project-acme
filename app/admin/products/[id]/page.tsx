'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { BiArrowBack, BiTrash } from 'react-icons/bi'
import { mockAdminProducts } from '@/lib/admin/mockData'
import PageHeader from '@/components/admin/shared/PageHeader'
import ProductForm from '@/components/admin/forms/ProductForm'
import ConfirmModal from '@/components/admin/shared/ConfirmModal'
import { AdminProduct } from '@/lib/admin/types'

export default function EditProductPage() {
  const { id }   = useParams<{ id: string }>()
  const router   = useRouter()
  const product  = mockAdminProducts.find(p => p.id === id) as AdminProduct | undefined

  const [showDelete, setShowDelete] = useState(false)

  if (!product) {
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
        defaultValues={product}
        onSave={() => {
          // Plan 1: no real persistence — navigate back after save
          router.push('/admin/products')
        }}
        onDiscard={() => router.push('/admin/products')}
      />

      {showDelete && (
        <ConfirmModal
          isOpen
          title="Delete product?"
          message={`"${product.title}" will be removed. This cannot be undone. In Plan 1 this only affects your current session.`}
          confirmLabel="Delete"
          dangerous
          onConfirm={() => router.push('/admin/products')}
          onCancel={() => setShowDelete(false)}
        />
      )}
    </div>
  )
}
