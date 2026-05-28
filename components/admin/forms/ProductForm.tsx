'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { BiGlobe, BiLayout } from 'react-icons/bi'
import { AdminProduct } from '@/lib/admin/types'
import { slugify } from '@/lib/admin/utils'
import SectionCard from '@/components/admin/shared/SectionCard'
import ImageUploader from './ImageUploader'
import CollectionSelect from './CollectionSelect'
import MetafieldFields from './MetafieldFields'
import { cn } from '@/lib/utils'

interface Props {
  defaultValues?: Partial<AdminProduct>
  onSave: (data: AdminProduct) => void
  onDiscard: () => void
  hideFooter?: boolean
  formId?: string
  saving?: boolean
}

const BLANK: Partial<AdminProduct> = {
  title: '', shortDescription: '', fullDescription: '',
  price: 0, compareAtPrice: null, sku: '', patent: '',
  stock: 0, status: 'active', collections: [], tags: [],
  vendor: 'Acme Lamp & Sign Co.', images: [],
  sellWhenOutOfStock: false, netWeight: '', material: '',
  colour: '', style: '', brand: '', vintage: '', burnerSize: '',
  fits: '', era: '', powerSource: '', productType: '',
  condition: '', edition: '', workshop: '', benchTester: '', benchTestDate: '',
}

const inputCls = 'w-full h-9 px-3 text-[13px] text-(--admin-text) bg-(--admin-surface-2) border border-(--admin-border) rounded-md focus:outline-none focus:border-(--admin-accent) focus:ring-1 focus:ring-(--admin-accent)/20 placeholder:text-(--admin-text-muted) transition-colors'
const labelCls = 'block text-[12px] font-medium text-(--admin-text) mb-1.5'
const errorCls = 'text-[11px] text-(--admin-red) mt-1'

export default function ProductForm({ defaultValues, onSave, onDiscard, hideFooter, formId = 'product-form', saving: externalSaving }: Props) {
  const merged = { ...BLANK, ...defaultValues }

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AdminProduct>({ defaultValues: merged as AdminProduct })

  const [images,       setImages]       = useState<string[]>(defaultValues?.images ?? [])
  const [collections,  setCollections]  = useState<string[]>(defaultValues?.collections ?? [])
  const [tagsInput,    setTagsInput]    = useState((defaultValues?.tags ?? []).join(', '))
  const [seoHandle,    setSeoHandle]    = useState(slugify(defaultValues?.title ?? ''))
  const [handleLocked, setHandleLocked] = useState(false)
  const [internalSaving, setInternalSaving] = useState(false)
  const saving = externalSaving ?? internalSaving

  const title  = watch('title')
  const status = watch('status')

  useEffect(() => {
    if (!handleLocked) setSeoHandle(slugify(title ?? ''))
  }, [title, handleLocked])

  function onSubmit(data: AdminProduct) {
    setInternalSaving(true)
    const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean)
    onSave({
      ...data,
      id: defaultValues?.id ?? `prod-${Date.now()}`,
      images,
      collections,
      tags,
      compareAtPrice: data.compareAtPrice || null,
    })
  }

  return (
    <form id={formId} onSubmit={handleSubmit(onSubmit)} className={hideFooter ? '' : 'pb-20'}>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* ── Left column — main content ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Title + Description */}
          <SectionCard>
            <div className="space-y-4">
              <div>
                <label className={labelCls}>
                  Title <span className="text-(--admin-red)">*</span>
                </label>
                <input
                  {...register('title', { required: 'Title is required' })}
                  className={inputCls}
                  placeholder={`Embossed Satin Glass Shade — Powder Blue 5 1/4"`}
                />
                {errors.title && <p className={errorCls}>{errors.title.message}</p>}
              </div>

              <div>
                <label className={labelCls}>Short Description</label>
                <textarea
                  {...register('shortDescription')}
                  rows={2}
                  className="w-full px-3 py-2 text-[13px] text-(--admin-text) bg-(--admin-surface-2) border border-(--admin-border) rounded-md resize-none focus:outline-none focus:border-(--admin-accent) focus:ring-1 focus:ring-(--admin-accent)/20 placeholder:text-(--admin-text-muted) transition-colors"
                  placeholder="A brief summary shown on product cards…"
                />
              </div>
            </div>
          </SectionCard>

          {/* Pricing */}
          <SectionCard>
            <p className="text-[13px] font-semibold text-(--admin-text) mb-4">Pricing</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>
                  Price (CAD) <span className="text-(--admin-red)">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-(--admin-text-muted)">$</span>
                  <input
                    {...register('price', {
                      required: 'Price is required',
                      valueAsNumber: true,
                      min: { value: 0, message: 'Must be ≥ 0' },
                    })}
                    type="number"
                    step="0.01"
                    className={cn(inputCls, 'pl-6')}
                    placeholder="175.00"
                  />
                </div>
                {errors.price && <p className={errorCls}>{errors.price.message}</p>}
              </div>
              <div>
                <label className={labelCls}>Compare-at Price</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-(--admin-text-muted)">$</span>
                  <input
                    {...register('compareAtPrice', { valueAsNumber: true })}
                    type="number"
                    step="0.01"
                    className={cn(inputCls, 'pl-6')}
                    placeholder="—"
                  />
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Media */}
          <SectionCard>
            <p className="text-[13px] font-semibold text-(--admin-text) mb-4">Media</p>
            <ImageUploader images={images} onChange={setImages} />
          </SectionCard>

          {/* Inventory */}
          <SectionCard>
            <p className="text-[13px] font-semibold text-(--admin-text) mb-4">Inventory</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>SKU</label>
                <input {...register('sku')} className={inputCls} placeholder="ACM-001" />
              </div>
              <div>
                <label className={labelCls}>Stock quantity</label>
                <input
                  {...register('stock', { valueAsNumber: true })}
                  type="number"
                  min="0"
                  className={inputCls}
                />
              </div>
            </div>
            <label className="flex items-center gap-2.5 mt-4 cursor-pointer">
              <input
                {...register('sellWhenOutOfStock')}
                type="checkbox"
                className="w-3.5 h-3.5 rounded border-(--admin-border) accent-(--admin-accent) cursor-pointer"
              />
              <span className="text-[13px] text-(--admin-text-soft)">Continue selling when out of stock</span>
            </label>
          </SectionCard>

          {/* Shipping */}
          <SectionCard>
            <p className="text-[13px] font-semibold text-(--admin-text) mb-4">Shipping</p>
            <div className="max-w-xs">
              <label className={labelCls}>Net weight (kg)</label>
              <input {...register('netWeight')} className={inputCls} placeholder="0.40" />
            </div>
          </SectionCard>

          {/* acme.* Metafields */}
          <MetafieldFields register={register} />

          {/* SEO */}
          <SectionCard>
            <p className="text-[13px] font-semibold text-(--admin-text) mb-1">Search Engine Listing</p>
            <p className="text-[11px] text-(--admin-text-muted) mb-4">
              Auto-generated from title. Edit to customise the URL.
            </p>
            <div>
              <label className={labelCls}>URL handle</label>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-(--admin-text-muted) shrink-0 whitespace-nowrap">
                  /products/
                </span>
                <input
                  value={seoHandle}
                  onChange={e => { setSeoHandle(e.target.value); setHandleLocked(true) }}
                  className={cn(inputCls, '')}
                  placeholder="embossed-satin-glass-shade"
                />
              </div>
            </div>
          </SectionCard>

        </div>

        {/* ── Right sidebar ── */}
        <div className="space-y-4">

          {/* Status */}
          <SectionCard>
            <p className="text-[12px] font-semibold text-(--admin-text) mb-3">Status</p>
            <div className="flex rounded-md border border-(--admin-border) overflow-hidden w-full">
              {(['active', 'draft'] as const).map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setValue('status', s)}
                  className={cn(
                    'flex-1 py-2 text-[12px] capitalize transition-colors',
                    status === s
                      ? 'bg-(--admin-accent) text-(--admin-accent-text)'
                      : 'text-(--admin-text-soft) hover:bg-(--admin-surface-2)'
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </SectionCard>

          {/* Publishing */}
          <SectionCard>
            <p className="text-[12px] font-semibold text-(--admin-text) mb-3">Publishing</p>
            <div className="flex items-center gap-2.5 p-3 rounded-md bg-(--admin-surface-2) border border-(--admin-border)">
              <BiGlobe size={14} className="text-(--admin-text-muted) shrink-0" />
              <div>
                <p className="text-[12px] font-medium text-(--admin-text)">All channels</p>
                <p className="text-[10px] text-(--admin-text-muted)">Online Store</p>
              </div>
            </div>
            <p className="text-[10px] text-(--admin-text-muted) mt-2">
              Channel management wired in Plan 2.
            </p>
          </SectionCard>

          {/* Product Organization */}
          <SectionCard>
            <p className="text-[12px] font-semibold text-(--admin-text) mb-4">Product Organization</p>
            <div className="space-y-4">

              <div>
                <label className={labelCls}>Type</label>
                <input
                  {...register('productType')}
                  className={inputCls}
                  placeholder="Shade / Chimney / Burner"
                />
              </div>

              <div>
                <label className={labelCls}>Vendor</label>
                <input {...register('vendor')} className={inputCls} />
              </div>

              <div>
                <label className={labelCls}>Collections</label>
                <CollectionSelect value={collections} onChange={setCollections} />
              </div>

              <div>
                <label className={labelCls}>Tags</label>
                <input
                  value={tagsInput}
                  onChange={e => setTagsInput(e.target.value)}
                  className={inputCls}
                  placeholder="featured, antique, gift"
                />
                <p className="text-[10px] text-(--admin-text-muted) mt-1">
                  Comma-separated. Add <span className="font-semibold">featured</span> to show on homepage.
                </p>
              </div>

            </div>
          </SectionCard>

          {/* Theme Template */}
          <SectionCard>
            <div className="flex items-center gap-2 mb-3">
              <BiLayout size={13} className="text-(--admin-text-muted)" />
              <p className="text-[12px] font-semibold text-(--admin-text)">Theme Template</p>
            </div>
            <select
              disabled
              className="w-full h-9 px-3 text-[13px] text-(--admin-text-soft) bg-(--admin-surface-2) border border-(--admin-border) rounded-md opacity-60 cursor-not-allowed"
            >
              <option>Default product</option>
            </select>
            <p className="text-[10px] text-(--admin-text-muted) mt-2">
              Custom templates available in Plan 2.
            </p>
          </SectionCard>

        </div>
      </div>

      {/* Sticky footer — only when not inside a modal */}
      {!hideFooter && (
        <div
          className="fixed bottom-16 lg:bottom-0 left-0 right-0 lg:left-(--admin-sidebar-w) z-10 border-t px-6 py-3 flex items-center justify-end gap-3"
          style={{
            background:  'var(--admin-surface)',
            borderColor: 'var(--admin-border)',
          }}
        >
          <button
            type="button"
            onClick={onDiscard}
            className="h-9 px-4 text-[12px] text-(--admin-text-soft) bg-(--admin-surface-2) border border-(--admin-border) rounded-md hover:bg-(--admin-border) transition-colors"
          >
            Discard
          </button>
          <button
            type="submit"
            disabled={saving}
            className="h-9 px-5 text-[12px] font-medium bg-(--admin-accent) text-(--admin-accent-text) rounded-md hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      )}
    </form>
  )
}
