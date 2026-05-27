'use client'

import { useRouter } from 'next/navigation'
import PageHeader from '@/components/admin/shared/PageHeader'
import ProductForm from '@/components/admin/forms/ProductForm'
import { BiArrowBack } from 'react-icons/bi'

export default function NewProductPage() {
  const router = useRouter()

  return (
    <div>
      <PageHeader
        title="New Product"
        subtitle="Create a new product listing"
        actions={
          <button
            onClick={() => router.push('/admin/products')}
            className="flex items-center gap-1.5 h-8 px-3 text-[12px] text-(--admin-text-soft) bg-(--admin-surface-2) border border-(--admin-border) rounded-md hover:bg-(--admin-border) transition-colors"
          >
            <BiArrowBack size={14} /> Back
          </button>
        }
      />
      <ProductForm
        onSave={() => {
          // Plan 1: no real persistence — navigate back after save
          router.push('/admin/products')
        }}
        onDiscard={() => router.push('/admin/products')}
      />
    </div>
  )
}
