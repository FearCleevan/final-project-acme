'use client'

import Link from 'next/link'
import { memo, useState } from 'react'
import { BiPackage } from 'react-icons/bi'
import { Product } from '@/lib/types'
import { formatPrice } from '@/lib/utils'
import { useCrateStore } from '@/store/crateStore'
import PlateImage from '@/components/shared/PlateImage'

interface ProductCardProps {
  product: Product
  aspectRatio?: '4/5' | '5/4' | '3/5' | '1/1'
  large?: boolean
}

const ProductCard = memo(function ProductCard({
  product,
  aspectRatio = '4/5',
  large = false,
}: ProductCardProps) {
  const addItem = useCrateStore(s => s.addItem)
  const [added, setAdded] = useState(false)

  const isDark = (product.category as string) === 'signs'

  function handleAddToCrate(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    addItem(
      product,
      product.finish[0] ?? '',
      product.burnerSize ?? ''
    )
    setAdded(true)
    setTimeout(() => setAdded(false), 1800)
  }

  return (
    <div className="group flex flex-col">
      {/* ── Image ─────────────────────────────────────────────── */}
      <Link
        href={`/catalog/${product.slug}`}
        className="relative block overflow-hidden rounded-sm aspect-square sm:aspect-auto"
        tabIndex={-1}
        aria-hidden="true"
      >
        <PlateImage
          src={product.images[0]}
          alt={product.name}
          aspectRatio={aspectRatio}
          dark={isDark}
          className="transition-transform duration-500 ease-out group-hover:scale-[1.04]"
        />
        {/* Hover brightness overlay — visible even on placeholder */}
        {/* <div className="absolute inset-0 bg-brass/0 transition-colors duration-300 pointer-events-none rounded-sm" /> */}
        {/* Second-image hint: darkens edges on hover to suggest depth */}
        {/* <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, transparent 55%, rgba(30,32,34,0.18) 100%)',
          }}
        /> */}
        {/* Stock badges */}
        {!product.inStock && (
          <div className="absolute top-2.5 left-2.5 px-2.5 py-1 bg-ink-charcoal/80 backdrop-blur-sm rounded-pill text-[9px] font-mono uppercase tracking-eyebrow text-canvas-dim pointer-events-none">
            Sold Out
          </div>
        )}
        {product.inStock && product.stockQuantity <= 3 && (
          <div className="absolute top-1 left-1 px-2.5 py-1 bg-brass-deep/90 backdrop-blur-sm rounded-pill text-[9px] font-mono uppercase tracking-eyebrow text-[#F5F1E6] pointer-events-none">
            Only {product.stockQuantity} left
          </div>
        )}
        {product.soldCount > 0 && (
          <div className="absolute bottom-1 left-1 px-2.5 py-1 bg-green-brand/90 backdrop-blur-sm rounded-pill text-[9px] font-mono uppercase tracking-eyebrow text-[#F5F1E6] pointer-events-none">
            {product.soldCount} sold
          </div>
        )}
      </Link>

      {/* ── Meta ──────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 pt-2 sm:pt-3">
        {/* SKU row — hidden on mobile to save vertical space */}
        {/* <div className="hidden sm:flex items-center justify-between mb-2">
          <span className="text-[10px] font-mono uppercase tracking-eyebrow text-ink-iron">
            {product.sku}
          </span>
          <span className="text-[10px] font-mono uppercase tracking-eyebrow text-ink-soft">
            {product.patent}
          </span>
        </div> */}

        {/* Product name */}
        <Link href={`/catalog/${product.slug}`}>
          <h3
            className={`font-serif font-bold text-ink-iron group-hover:text-brass-deep transition-colors leading-snug mb-1 sm:mb-2 line-clamp-2 ${
              large ? 'text-[14px] sm:text-[22px]' : 'text-[12px] sm:text-[18px]'
            }`}
          >
            {product.name}
          </h3>
        </Link>

        {/* Short description — hidden on mobile */}
        {/* <p className="hidden sm:block font-sans font-medium text-[13px] text-ink-iron leading-snug mb-3 border-l-2 border-brass-deep pl-3 line-clamp-2">
          {product.shortDescription.split('—')[0].trim()}
        </p> */}

        {/* Divider */}
        <div className="border-t border-ink-rule mt-auto pt-2 sm:pt-3" />

        {/* Price + action */}
        <div className="flex items-center justify-between mb-1 sm:mb-2">
          <span className="font-serif text-[14px] sm:text-[22px] text-brass-deep leading-none">
            {formatPrice(product.price)}
          </span>

          {/* Desktop: navigate to product */}
          <Link
            href={`/catalog/${product.slug}`}
            className="hidden sm:flex h-9 px-4 items-center justify-center bg-green-brand text-[#F5F1E6] rounded-btn font-sans text-[13px] font-semibold hover:bg-green-deep hover:shadow-cta-hover transition-all duration-200"
          >
            View details →
          </Link>

          {/* Mobile: add to crate inline */}
          <button
            type="button"
            onClick={handleAddToCrate}
            className="sm:hidden h-6.5 px-2.5 flex items-center gap-1 border border-ink-rule rounded-btn font-sans text-[10px] font-semibold uppercase tracking-[0.04em] text-ink-iron hover:border-green-brand hover:bg-green-brand hover:text-[#F5F1E6] active:bg-green-brand active:text-[#F5F1E6] transition-all duration-150"
            aria-label={`Add ${product.name} to crate`}
          >
            <BiPackage size={11} />
            {added ? '✓' : '+ Crate'}
          </button>
        </div>

        {/* Add to Crate — desktop full button */}
        <button
          onClick={handleAddToCrate}
          className="hidden sm:flex w-full h-10 items-center justify-center gap-2 border border-ink-rule rounded-btn font-sans text-[12px] font-semibold uppercase tracking-[0.06em] text-ink-iron hover:border-green-brand hover:bg-green-brand hover:text-[#F5F1E6] transition-all duration-200 mt-1"
          aria-label={`Add ${product.name} to crate`}
        >
          <BiPackage size={15} />
          {added ? '✓ Added to Crate' : '+ Add to Crate'}
        </button>
      </div>
    </div>
  )
})

export default ProductCard
