'use client'

import { useEffect, useRef } from 'react'
import { useScrollLock } from '@/hooks/useScrollLock'
import { AnimatePresence, motion } from 'framer-motion'
import { BiX } from 'react-icons/bi'
import { useCrateStore } from '@/store/crateStore'
import CrateItem from './CrateItem'
import CrateSummary from './CrateSummary'
import Button from '@/components/shared/Button'
import { groupCartItems, getColourHex } from '@/lib/cartGrouping'
import { useCurrencyStore } from '@/store/currencyStore'
import { formatCurrencyPrice } from '@/lib/currency'
import PlateImage from '@/components/shared/PlateImage'
import { CrateItem as CrateItemType } from '@/lib/types'

export default function CrateDrawer() {
  const { isOpen, closeCrate, items } = useCrateStore()
  const itemCount = useCrateStore(s => s.itemCount())
  const { currency, rates } = useCurrencyStore()
  const fmt = (amount: number) => formatCurrencyPrice(amount, currency, rates)
  const closeRef = useRef<HTMLButtonElement>(null)

  /* Focus trap — move focus into drawer on open */
  useEffect(() => {
    if (isOpen) closeRef.current?.focus()
  }, [isOpen])

  /* Close on Escape */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) closeCrate()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, closeCrate])

  useScrollLock(isOpen)

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Scrim */}
          <motion.div
            key="scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-40 bg-ink-charcoal/40"
            onClick={closeCrate}
            aria-hidden="true"
          />

          {/* Drawer */}
          <motion.aside
            key="drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Your crate"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.32, ease: [0.32, 0, 0.08, 1] }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full sm:w-90 bg-parchment shadow-search-overlay flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-ink-rule">
              <div>
                <h2 className="font-serif text-[22px] font-medium text-ink-charcoal">
                  Your crate
                </h2>
                <p className="text-[10px] font-mono uppercase tracking-eyebrow text-brass-deep mt-0.5">
                  {itemCount} {itemCount === 1 ? 'piece' : 'pieces'} selected
                </p>
              </div>
              <button
                ref={closeRef}
                onClick={closeCrate}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-parchment-2 transition-colors text-ink-iron"
                aria-label="Close crate"
              >
                <BiX size={22} />
              </button>
            </div>

            {/* Items */}
            {items.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-5">
                <div className="w-16 h-16 rounded-full border-2 border-ink-rule flex items-center justify-center">
                  <span className="text-[24px] text-ink-soft font-mono">Ø</span>
                </div>
                <p className="font-serif italic text-[15px] text-ink-soft leading-relaxed max-w-[26ch]">
                  Your crate is empty. Come back with something worth lighting tonight.
                </p>
                <Button variant="ghost" size="small" onClick={closeCrate}>
                  Continue browsing
                </Button>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto px-6">
                  {groupCartItems(items).map((entry) =>
                    entry.isGroup
                      ? <DrawerVariantGroup key={entry.name} name={entry.name} image={entry.image} items={entry.items} />
                      : <CrateItem key={entry.item.product.id} item={entry.item} />
                  )}
                </div>
                <CrateSummary onClose={closeCrate} />
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

function DrawerVariantGroup({ name, image, items }: { name: string; image: string; items: CrateItemType[] }) {
  const removeItem     = useCrateStore(s => s.removeItem)
  const updateQuantity = useCrateStore(s => s.updateQuantity)
  const groupQty   = items.reduce((s, i) => s + i.quantity, 0)
  const groupTotal = items.reduce((s, i) => s + i.product.price * i.quantity, 0)

  return (
    <div className="py-4 border-b border-ink-rule">
      {/* Group header */}
      <div className="flex gap-3 mb-3">
        <div className="shrink-0 w-15">
          <PlateImage src={image} alt={name} aspectRatio="4/5" label={undefined} />
        </div>
        <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
          <p className="font-serif text-[14px] font-medium text-ink-iron leading-snug line-clamp-2">{name}</p>
          <p className="text-[11px] font-mono text-brass-deep">
            {groupQty} {groupQty === 1 ? 'item' : 'items'} · {fmt(groupTotal)}
          </p>
        </div>
      </div>

      {/* Per-colour rows */}
      {items.map(item => {
        const hex = getColourHex(item.selectedColour)
        return (
          <div key={item.product.id} className="flex items-center gap-2 pl-[72px] py-1.5 border-t border-ink-rule/50">
            <span
              className="w-2 h-2 rounded-full shrink-0 border border-black/10"
              style={{ background: hex }}
            />
            <span className="text-[12px] font-sans text-ink-iron flex-1 truncate">{item.selectedColour}</span>
            <div className="flex items-center gap-0 border border-ink-rule rounded-sm">
              <button
                onClick={() => {
                  if (item.quantity <= 1) removeItem(item.product.id)
                  else updateQuantity(item.product.id, item.quantity - 1)
                }}
                className="w-6 h-6 flex items-center justify-center text-ink-iron hover:bg-parchment-2 text-[12px] font-mono border-r border-ink-rule transition-colors"
                aria-label={`Decrease ${item.selectedColour} quantity`}
              >−</button>
              <span className="w-6 text-center text-[11px] font-mono text-ink-iron tabular-nums">{item.quantity}</span>
              <button
                onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                disabled={item.quantity >= item.product.stockQuantity}
                className="w-6 h-6 flex items-center justify-center text-ink-iron hover:bg-parchment-2 text-[12px] font-mono border-l border-ink-rule transition-colors disabled:opacity-30 disabled:pointer-events-none"
                aria-label={`Increase ${item.selectedColour} quantity`}
              >+</button>
            </div>
            <button
              onClick={() => removeItem(item.product.id)}
              className="text-[11px] font-mono text-ink-soft hover:text-error transition-colors ml-1"
              aria-label={`Remove ${item.selectedColour}`}
            >×</button>
          </div>
        )
      })}
    </div>
  )
}
