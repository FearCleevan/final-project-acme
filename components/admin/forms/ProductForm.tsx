'use client'

import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { BiGlobe, BiLayout } from 'react-icons/bi'
import { AdminProduct } from '@/lib/admin/types'
import { slugify } from '@/lib/admin/utils'
import SectionCard from '@/components/admin/shared/SectionCard'
import ImageUploader from './ImageUploader'
import CollectionSelect from './CollectionSelect'
import CategorySelect from './CategorySelect'
import MetafieldFields from './MetafieldFields'
import { cn } from '@/lib/utils'

interface Props {
  defaultValues?: Partial<AdminProduct>
  onSave: (data: AdminProduct) => void
  onDiscard: () => void
  hideFooter?: boolean
  formId?: string
  saving?: boolean
  draftKey?: string
}

const BLANK: Partial<AdminProduct> = {
  title: '', shortDescription: '', fullDescription: '',
  price: 0, compareAtPrice: null, sku: '', patent: '',
  stock: 0, status: 'active', collections: [], tags: [],
  vendor: 'Acme Vintage Supply', images: [], category: null,
  sellWhenOutOfStock: false, netWeight: '', material: '',
  colour: '', style: '', brand: '', vintage: '', burnerSize: '',
  fits: '', era: '', powerSource: '', productType: '',
  condition: '', edition: '', workshop: '', benchTester: '', benchTestDate: '',
  hasVariants: false, variants: [],
}

interface ColourVariantRow {
  colour: string
}

const PRESET_COLOURS: { name: string; hex: string }[] = [
  { name: 'Red',         hex: '#D50000' },
  { name: 'Orange',      hex: '#FF6D00' },
  { name: 'Yellow',      hex: '#FFD600' },
  { name: 'Green',       hex: '#00C853' },
  { name: 'Blue',        hex: '#2962FF' },
  { name: 'Powder Blue', hex: '#8AB4C6' },
  { name: 'Pink',        hex: '#F48FB1' },
  { name: 'Peach',       hex: '#FFAB91' },
  { name: 'Magenta',     hex: '#CC00CC' },
  { name: 'Brown',       hex: '#795548' },
  { name: 'Gold',        hex: '#FFC107' },
  { name: 'Silver',      hex: '#9E9E9E' },
  { name: 'Amber',       hex: '#FF8F00' },
  { name: 'Clear',       hex: '#E8E8E8' },
  { name: 'White',       hex: '#FFFFFF' },
  { name: 'Black',       hex: '#1A1A1A' },
]

const inputCls = 'w-full h-9 px-3 text-[13px] text-(--admin-text) bg-(--admin-surface-2) border border-(--admin-border) rounded-md focus:outline-none focus:border-(--admin-accent) focus:ring-1 focus:ring-(--admin-accent)/20 placeholder:text-(--admin-text-muted) transition-colors'
const labelCls = 'block text-[12px] font-medium text-(--admin-text) mb-1.5'
const errorCls = 'text-[11px] text-(--admin-red) mt-1'

export default function ProductForm({ defaultValues, onSave, onDiscard, hideFooter, formId = 'product-form', saving: externalSaving, draftKey }: Props) {
  const merged = { ...BLANK, ...defaultValues }

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AdminProduct>({ defaultValues: merged as AdminProduct })

  const [images,        setImages]        = useState<string[]>(defaultValues?.images ?? [])
  const [collections,   setCollections]   = useState<string[]>(defaultValues?.collections ?? [])
  const [category,      setCategory]      = useState<{ id: string; name: string } | null>(defaultValues?.category ?? null)
  const [tagsInput,     setTagsInput]     = useState((defaultValues?.tags ?? []).join(', '))
  const [seoHandle,     setSeoHandle]     = useState(slugify(defaultValues?.title ?? ''))
  const [handleLocked,  setHandleLocked]  = useState(false)
  const [internalSaving, setInternalSaving] = useState(false)
  const saving = externalSaving ?? internalSaving

  const [hasVariants,     setHasVariants]     = useState(defaultValues?.hasVariants ?? false)
  const [selectedColours, setSelectedColours] = useState<{ colour: string; price: number; stock: number }[]>(
    defaultValues?.variants?.length
      ? defaultValues.variants
          .map(v => ({ colour: v.colour, price: v.price ?? defaultValues?.price ?? 0, stock: v.stock ?? 0 }))
          .filter(v => v.colour)
      : []
  )
  const [pickerOpen,    setPickerOpen]    = useState(false)
  const [customColour,  setCustomColour]  = useState('')
  const pickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false)
      }
    }
    if (pickerOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [pickerOpen])

  function currentPrice() { return parseFloat(String(watch('price'))) || 0 }

  function togglePreset(name: string) {
    setSelectedColours(prev =>
      prev.some(c => c.colour === name)
        ? prev.filter(c => c.colour !== name)
        : [...prev, { colour: name, price: currentPrice(), stock: 0 }]
    )
  }
  function addCustomColour() {
    const trimmed = customColour.trim()
    if (!trimmed || selectedColours.some(c => c.colour === trimmed)) { setCustomColour(''); return }
    setSelectedColours(prev => [...prev, { colour: trimmed, price: currentPrice(), stock: 0 }])
    setCustomColour('')
  }
  function removeColour(name: string) {
    setSelectedColours(prev => prev.filter(c => c.colour !== name))
  }
  function updateColourStock(name: string, stock: number) {
    setSelectedColours(prev => prev.map(c => c.colour === name ? { ...c, stock } : c))
  }
  function updateColourPrice(name: string, price: number) {
    setSelectedColours(prev => prev.map(c => c.colour === name ? { ...c, price } : c))
  }

  // Derive colorVariants for onSubmit compat
  const colorVariants = selectedColours

  const title  = watch('title')
  const status = watch('status')

  useEffect(() => {
    if (!handleLocked) setSeoHandle(slugify(title ?? ''))
  }, [title, handleLocked])

  // ── Draft persistence ────────────────────────────────────────────────────────
  const draftTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load draft on mount — only for new products (no id in defaultValues)
  useEffect(() => {
    if (!draftKey || defaultValues?.id) return
    try {
      const raw = localStorage.getItem(draftKey)
      if (!raw) return
      const draft = JSON.parse(raw) as Record<string, unknown>
      const skip = new Set(['images', 'collections', 'category', 'tagsInput'])
      Object.entries(draft).forEach(([k, v]) => {
        if (!skip.has(k)) setValue(k as keyof AdminProduct, v as never)
      })
      if (Array.isArray(draft.images))      setImages(draft.images as string[])
      if (Array.isArray(draft.collections)) setCollections(draft.collections as string[])
      if ('category' in draft)              setCategory(draft.category as typeof category)
      if (typeof draft.tagsInput === 'string') setTagsInput(draft.tagsInput)
    } catch { /* corrupt draft — ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftKey])

  // Save draft 800 ms after any change
  const allValues = watch()
  useEffect(() => {
    if (!draftKey) return
    if (draftTimer.current) clearTimeout(draftTimer.current)
    draftTimer.current = setTimeout(() => {
      localStorage.setItem(draftKey, JSON.stringify({ ...allValues, images, collections, category, tagsInput }))
    }, 800)
    return () => { if (draftTimer.current) clearTimeout(draftTimer.current) }
  }, [allValues, images, collections, category, tagsInput, draftKey])

  function onSubmit(data: AdminProduct) {
    setInternalSaving(true)
    const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean)
    onSave({
      ...data,
      id: defaultValues?.id ?? `prod-${Date.now()}`,
      images,
      collections,
      category,
      tags,
      compareAtPrice: data.compareAtPrice || null,
      hasVariants,
      variants: hasVariants
        ? colorVariants
            .filter(r => r.colour.trim())
            .map(r => ({
              colour:         r.colour.trim(),
              price:          r.price ?? data.price ?? 0,
              compareAtPrice: data.compareAtPrice || null,
              stock:          r.stock ?? 0,
            }))
        : [],
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

          {/* Colour Variants */}
          <SectionCard>
            <div className="flex items-center justify-between mb-1">
              <div>
                <p className="text-[13px] font-semibold text-(--admin-text)">Colour Variants</p>
                <p className="text-[11px] text-(--admin-text-muted) mt-0.5">
                  Enable when this product comes in multiple colours (e.g. Clear, Green, Red).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setHasVariants(v => !v)}
                className={cn(
                  'relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors cursor-pointer',
                  hasVariants ? 'bg-(--admin-accent)' : 'bg-(--admin-border)'
                )}
                role="switch"
                aria-checked={hasVariants}
              >
                <span
                  className={cn(
                    'pointer-events-none block h-4 w-4 rounded-full bg-white shadow ring-0 transition-transform',
                    hasVariants ? 'translate-x-4' : 'translate-x-0'
                  )}
                />
              </button>
            </div>

            {hasVariants && (
              <div className="mt-4 space-y-2">
                <p className="text-[10px] uppercase tracking-wide text-(--admin-text-muted) px-1">Colour</p>

                {/* Selected colours with stock inputs */}
                {selectedColours.length > 0 && (
                  <div className="space-y-1.5">
                    {selectedColours.map(({ colour, price, stock }) => {
                      const preset = PRESET_COLOURS.find(p => p.name === colour)
                      return (
                        <div key={colour} className="flex items-center gap-2">
                          {/* Colour swatch + name */}
                          <div className="flex items-center gap-1.5 min-w-20 flex-1">
                            <span
                              className="w-3 h-3 rounded-full border border-black/10 shrink-0"
                              style={{ background: preset?.hex ?? '#ccc' }}
                            />
                            <span className="text-[13px] text-(--admin-text) truncate">{colour}</span>
                          </div>
                          {/* Price input */}
                          <div className="flex items-center gap-1 shrink-0">
                            <label className="text-[11px] text-(--admin-text-muted) whitespace-nowrap">$</label>
                            <input
                              type="number"
                              min={0}
                              step={0.01}
                              value={price}
                              onChange={e => updateColourPrice(colour, parseFloat(e.target.value) || 0)}
                              className="w-20 h-7 px-2 text-[12px] text-center bg-(--admin-surface-2) border border-(--admin-border) rounded focus:outline-none focus:border-(--admin-accent)"
                            />
                          </div>
                          {/* Stock input */}
                          <div className="flex items-center gap-1 shrink-0">
                            <label className="text-[11px] text-(--admin-text-muted) whitespace-nowrap">Qty</label>
                            <input
                              type="number"
                              min={0}
                              value={stock}
                              onChange={e => updateColourStock(colour, Math.max(0, parseInt(e.target.value) || 0))}
                              className="w-16 h-7 px-2 text-[12px] text-center bg-(--admin-surface-2) border border-(--admin-border) rounded focus:outline-none focus:border-(--admin-accent)"
                            />
                          </div>
                          {/* Remove */}
                          <button
                            type="button"
                            onClick={() => removeColour(colour)}
                            className="flex items-center justify-center w-6 h-6 rounded text-(--admin-text-muted) hover:text-(--admin-red) hover:bg-(--admin-red-bg) transition-colors shrink-0"
                          >×</button>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Picker dropdown */}
                <div className="relative" ref={pickerRef}>
                  <button
                    type="button"
                    onClick={() => setPickerOpen(o => !o)}
                    className="text-[12px] text-(--admin-accent) hover:opacity-80 transition-opacity"
                  >
                    + Add colour
                  </button>

                  {pickerOpen && (
                    <div className="absolute z-50 left-0 mt-1 w-64 bg-(--admin-surface) border border-(--admin-border) rounded-lg shadow-lg overflow-hidden">
                      <div className="max-h-52 overflow-y-auto py-1">
                        {PRESET_COLOURS.map(({ name, hex }) => (
                          <label
                            key={name}
                            className="flex items-center gap-2.5 px-3 py-1.5 cursor-pointer hover:bg-(--admin-surface-2) transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={selectedColours.some(c => c.colour === name)}
                              onChange={() => togglePreset(name)}
                              className="w-3.5 h-3.5 rounded accent-(--admin-accent)"
                            />
                            <span
                              className="w-4 h-4 rounded-full border border-black/10 shrink-0"
                              style={{ background: hex }}
                            />
                            <span className="text-[13px] text-(--admin-text)">{name}</span>
                          </label>
                        ))}
                      </div>
                      <div className="border-t border-(--admin-border) px-3 py-2 flex gap-2">
                        <input
                          value={customColour}
                          onChange={e => setCustomColour(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustomColour())}
                          placeholder="Add custom colour…"
                          className="flex-1 h-7 px-2 text-[12px] bg-(--admin-surface-2) border border-(--admin-border) rounded focus:outline-none focus:border-(--admin-accent)"
                        />
                        <button
                          type="button"
                          onClick={addCustomColour}
                          className="h-7 px-3 text-[12px] bg-(--admin-accent) text-white rounded hover:opacity-90 transition-opacity"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </SectionCard>

          {/* acme.* Metafields */}
          <MetafieldFields register={register} hasVariants={hasVariants} />

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
                <label className={labelCls}>Category</label>
                <CategorySelect value={category} onChange={setCategory} />
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
