'use client'

import { useCrateStore } from '@/store/crateStore'
import { useCustomerStore } from '@/store/customerStore'
import { formatPrice } from '@/lib/utils'
import Button from '@/components/shared/Button'

interface CrateSummaryProps {
  onClose: () => void
}

export default function CrateSummary({ onClose }: CrateSummaryProps) {
  const total          = useCrateStore(s => s.total())
  const itemCount      = useCrateStore(s => s.itemCount())
  const checkoutUrl    = useCrateStore(s => s.checkoutUrl)
  const checkout       = useCrateStore(s => s.checkout)
  const cartCreating   = useCrateStore(s => s._cartCreating)
  const isLoggedIn     = useCustomerStore(s => s.isLoggedIn)

  const fullCrateHref  = isLoggedIn ? '/account?tab=crate' : '/crate'

  // Cart is still being created — wait for Shopify to return the checkoutUrl
  const preparing = cartCreating || (!checkoutUrl && itemCount > 0)

  function handleCheckout() {
    onClose()
    checkout()
  }

  return (
    <div className="sticky bottom-0 border-t border-ink-rule bg-parchment pt-4 pb-6 px-6 space-y-3">
      <div className="flex justify-between text-[13px] text-ink-soft">
        <span className="font-sans">Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})</span>
        <span className="font-serif text-ink-iron">{formatPrice(total)}</span>
      </div>
      <div className="flex justify-between text-[13px] text-ink-soft">
        <span className="font-sans">Freight (straw-packed crate)</span>
        <span className="font-mono text-[11px] uppercase tracking-eyebrow">Free</span>
      </div>
      <div className="flex justify-between items-baseline border-t border-ink-rule pt-3">
        <span className="font-sans text-[13px] text-ink-iron font-semibold">Total · USD</span>
        <span className="font-serif text-[22px] text-brass-deep">{formatPrice(total)}</span>
      </div>

      <p className="text-[10px] font-mono uppercase tracking-eyebrow text-green-brand">
        ✓ Qualifies for free freight
      </p>

      <Button
        variant="primary"
        size="block"
        disabled={preparing}
        onClick={handleCheckout}
      >
        {preparing ? 'Preparing…' : 'Proceed to checkout →'}
      </Button>
      <Button variant="ghost" size="block" href={fullCrateHref} onClick={onClose}>
        View full crate →
      </Button>
      <button
        onClick={onClose}
        className="w-full text-center text-[11px] font-mono uppercase tracking-eyebrow text-ink-soft hover:text-ink-iron transition-colors pt-1"
      >
        + Continue browsing the catalog
      </button>
    </div>
  )
}
