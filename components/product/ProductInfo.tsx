'use client'

import { useState } from 'react'
import { BiCheck, BiRevision, BiTag, BiEnvelope } from 'react-icons/bi'
import { Product } from '@/lib/types'
import { formatPrice } from '@/lib/utils'
import { useCrateStore } from '@/store/crateStore'
import FitmentBox from './FitmentBox'
import { getReviewsForProduct, getAggregateRating } from '@/lib/mockReviews'

interface ProductInfoProps {
  product: Product
}

const selectClass =
  'w-full h-[44px] pl-3 pr-8 bg-parchment-2 border border-ink-rule rounded-sm text-[14px] font-sans text-ink-iron appearance-none focus:outline-none focus:border-brass-deep focus:ring-1 focus:ring-brass/20 transition-colors cursor-pointer'

export default function ProductInfo({ product }: ProductInfoProps) {
  const addItem = useCrateStore(s => s.addItem)

  const [selectedFinish, setSelectedFinish]     = useState(product.finish[0] ?? '')
  const [selectedBurner, setSelectedBurner]     = useState(product.burnerSize ?? '')
  const [qty, setQty]                           = useState(1)
  const [added, setAdded]                       = useState(false)

  const reviews = getReviewsForProduct(product.id, product.category)
  const { average, count } = getAggregateRating(reviews)

  const lineTotal = product.price * qty

  function handleAdd() {
    for (let i = 0; i < qty; i++) {
      addItem(product, selectedFinish, selectedBurner)
    }
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Badges */}
      <div className="flex flex-wrap gap-2">
        <span className="px-3 py-1 rounded-pill bg-ink-iron text-canvas-heading text-[10px] font-mono uppercase tracking-eyebrow">
          {product.sku}
        </span>
        {product.patent && (
          <span className="px-3 py-1 rounded-pill border border-ink-rule text-ink-soft text-[10px] font-mono uppercase tracking-eyebrow">
            {product.patent}
          </span>
        )}
        {!product.inStock && (
          <span className="px-3 py-1 rounded-pill bg-error/10 text-error text-[10px] font-mono uppercase tracking-eyebrow">
            Out of stock
          </span>
        )}
        {product.inStock && product.stockQuantity <= 3 && (
          <span className="px-3 py-1 rounded-pill bg-brass/10 text-brass-deep text-[10px] font-mono uppercase tracking-eyebrow">
            Only {product.stockQuantity} left
          </span>
        )}
      </div>

      {/* Name */}
      <h1
        className="font-serif font-medium text-ink-charcoal leading-tight"
        style={{ fontSize: 'clamp(28px, 3vw, 48px)' }}
      >
        {product.name}
      </h1>

      <p className="font-sans text-[17px] text-ink-soft leading-relaxed">
        {product.shortDescription}
      </p>

      {/* Star aggregate */}
      {count > 0 && (
        <a href="#reviews" className="flex items-center gap-2 w-fit group">
          <span className="flex items-center gap-0.5" aria-label={`${average} out of 5 stars`}>
            {[1, 2, 3, 4, 5].map(n => (
              <svg key={n} width={13} height={13} viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path
                  d="M7 1l1.545 3.13L12 4.635l-2.5 2.435.59 3.44L7 8.885l-3.09 1.625L4.5 7.07 2 4.635l3.455-.505L7 1z"
                  fill={n <= Math.round(average) ? '#C29B47' : 'none'}
                  stroke={n <= Math.round(average) ? '#C29B47' : '#B8AD9A'}
                  strokeWidth="1"
                  strokeLinejoin="round"
                />
              </svg>
            ))}
          </span>
          <span className="text-[12px] font-mono text-brass-deep group-hover:text-brass transition-colors">
            {average.toFixed(1)} · {count} {count === 1 ? 'review' : 'reviews'}
          </span>
        </a>
      )}

      {/* Price */}
      <div className="flex items-baseline gap-3 pb-4 border-b border-ink-rule">
        <span className="font-serif text-[28px] text-brass-deep leading-none">
          {formatPrice(product.price)}
        </span>
        <span className="text-[11px] font-mono uppercase tracking-eyebrow text-ink-soft">
          USD · Free freight over $150
        </span>
      </div>

      {/* Fitment box */}
      <FitmentBox product={product} />

      {/* Variant selectors */}
      {product.finish.length > 0 && (
        <div>
          <label htmlFor="finish-select" className="block text-[11px] font-mono uppercase tracking-eyebrow text-ink-soft mb-2">
            Finish
          </label>
          <div className="relative">
            <select
              id="finish-select"
              value={selectedFinish}
              onChange={e => setSelectedFinish(e.target.value)}
              className={selectClass}
            >
              {product.finish.map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft text-[11px]">▾</span>
          </div>
        </div>
      )}

      {product.burnerSize && (
        <div>
          <label htmlFor="burner-select" className="block text-[11px] font-mono uppercase tracking-eyebrow text-ink-soft mb-2">
            Burner Size
          </label>
          <div className="relative">
            <select
              id="burner-select"
              value={selectedBurner}
              onChange={e => setSelectedBurner(e.target.value)}
              className={selectClass}
            >
              {['No. 1', 'No. 2', 'No. 3', 'Universal']
                .filter(b => b === product.burnerSize)
                .map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft text-[11px]">▾</span>
          </div>
        </div>
      )}

      {/* Quantity stepper */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[11px] font-mono uppercase tracking-eyebrow text-ink-soft">Quantity</p>
          {product.inStock && product.stockQuantity <= 10 && (
            <p className="text-[11px] font-mono text-brass-deep">
              {product.stockQuantity} in stock
            </p>
          )}
        </div>
        <div className="flex items-center gap-0 border border-ink-rule rounded-sm w-fit">
          <button
            onClick={() => setQty(q => Math.max(1, q - 1))}
            className="w-11 h-11 flex items-center justify-center text-ink-iron hover:bg-parchment-2 transition-colors text-[18px] font-mono border-r border-ink-rule"
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span className="w-12 text-center text-[15px] font-mono text-ink-iron tabular-nums" aria-live="polite">
            {qty}
          </span>
          <button
            onClick={() => setQty(q => Math.min(product.stockQuantity, q + 1))}
            disabled={qty >= product.stockQuantity}
            className="w-11 h-11 flex items-center justify-center text-ink-iron hover:bg-parchment-2 transition-colors text-[18px] font-mono border-l border-ink-rule disabled:opacity-30 disabled:pointer-events-none"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
      </div>

      {/* Add to crate CTA */}
      <button
        onClick={handleAdd}
        disabled={!product.inStock}
        className="w-full min-h-15 flex items-center justify-center gap-2 bg-green-brand text-[#F5F1E6] rounded-btn font-sans text-[17px] font-semibold hover:bg-green-deep hover:shadow-cta-hover hover:-translate-y-px active:translate-y-0 transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none"
      >
        {added
          ? '✓ Added to your crate'
          : `Add to crate — ${formatPrice(lineTotal)}`}
      </button>

      {/* Trust signals */}
      <div className="space-y-2.5 pt-1">
        {[
          { icon: BiRevision,  text: '30-day return — no questions on whole pieces' },
          { icon: BiTag,       text: 'Hand-numbered — every piece leaves with a tag' },
          { icon: BiEnvelope,  text: 'Real receipt — plain paper, real return address' },
        ].map(({ icon: Icon, text }) => (
          <div key={text} className="flex items-center gap-3">
            <Icon size={16} className="text-ink-soft shrink-0" aria-hidden="true" />
            <p className="text-[12px] font-sans text-ink-soft">{text}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
