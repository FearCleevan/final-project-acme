'use client'

import { useCrateStore } from '@/store/crateStore'
import { formatPrice } from '@/lib/utils'
import PlateImage from '@/components/shared/PlateImage'
import Eyebrow from '@/components/shared/Eyebrow'

const FREIGHT_THRESHOLD = 150

export default function OrderSummary() {
  const items = useCrateStore(s => s.items)
  const total = useCrateStore(s => s.total)()
  const freeFreight = total >= FREIGHT_THRESHOLD

  return (
    <div className="bg-parchment-2 border border-ink-rule rounded-sm p-6">
      <Eyebrow className="mb-5">Order summary</Eyebrow>

      {/* Line items */}
      {items.length === 0 ? (
        <p className="font-sans text-[14px] text-ink-soft italic">Your crate is empty.</p>
      ) : (
        <ul className="space-y-4 mb-6">
          {items.map(item => (
            <li key={item.product.id} className="flex gap-4 items-start">
              <div className="w-12 shrink-0">
                <PlateImage
                  src={item.product.images[0]}
                  alt={item.product.name}
                  aspectRatio="4/5"
                  dark={item.product.category === 'signs'}
                  className="rounded-sm"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-mono uppercase tracking-eyebrow text-ink-soft mb-0.5">
                  {item.product.sku}
                </p>
                <p className="font-serif text-[13px] text-ink-charcoal font-medium leading-snug line-clamp-2">
                  {item.product.name}
                </p>
                {item.selectedFinish && (
                  <p className="text-[11px] font-sans text-ink-soft mt-0.5">{item.selectedFinish}</p>
                )}
                <p className="text-[11px] font-mono text-ink-soft mt-1">Qty: {item.quantity}</p>
              </div>
              <p className="font-serif text-[14px] text-brass-deep shrink-0">
                {formatPrice(item.product.price * item.quantity)}
              </p>
            </li>
          ))}
        </ul>
      )}

      {/* Totals */}
      <div className="border-t border-ink-rule pt-4 space-y-2">
        <div className="flex justify-between items-baseline">
          <span className="text-[12px] font-mono uppercase tracking-eyebrow text-ink-soft">Subtotal</span>
          <span className="font-sans text-[14px] text-ink-iron">{formatPrice(total)}</span>
        </div>
        <div className="flex justify-between items-baseline">
          <span className="text-[12px] font-mono uppercase tracking-eyebrow text-ink-soft">
            Freight (straw-packed)
          </span>
          <span className={`font-sans text-[14px] ${freeFreight ? 'text-green-brand' : 'text-ink-iron'}`}>
            {freeFreight ? 'Free' : formatPrice(18)}
          </span>
        </div>
        <div className="flex justify-between items-baseline pt-3 border-t border-ink-rule">
          <span className="text-[13px] font-mono uppercase tracking-eyebrow text-ink-charcoal font-medium">
            Total · USD
          </span>
          <span className="font-serif text-[22px] text-brass-deep leading-none">
            {formatPrice(freeFreight ? total : total + 18)}
          </span>
        </div>
      </div>

      {freeFreight && (
        <p className="mt-3 text-[10px] font-mono uppercase tracking-eyebrow text-green-brand">
          ✓ Qualifies for free freight
        </p>
      )}
    </div>
  )
}
