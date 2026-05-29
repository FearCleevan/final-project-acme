'use client'

import { useSyncExternalStore } from 'react'
import Link from 'next/link'
import { useCrateStore } from '@/store/crateStore'
import { formatPrice } from '@/lib/utils'
import Breadcrumb from '@/components/shared/Breadcrumb'
import Eyebrow from '@/components/shared/Eyebrow'
import CrateItem from '@/components/crate/CrateItem'
import Button from '@/components/shared/Button'
import PlateImage from '@/components/shared/PlateImage'

const FREIGHT_THRESHOLD = 150

export default function CratePage() {
  const items = useCrateStore(s => s.items)
  const total = useCrateStore(s => s.total())
  const clearCrate = useCrateStore(s => s.clearCrate)
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false)

  if (!mounted) return null

  const freeFreight = total >= FREIGHT_THRESHOLD
  const freight = freeFreight ? 0 : 18
  const orderTotal = total + freight
  const itemCount = items.reduce((s, i) => s + i.quantity, 0)

  if (items.length === 0) {
    return (
      <div className="bg-parchment min-h-screen px-6 py-20">
        <div className="max-w-170 mx-auto text-center">
          <div className="w-20 h-20 rounded-full border-2 border-ink-rule flex items-center justify-center mx-auto mb-8">
            <span className="text-[32px] text-ink-soft font-mono">Ø</span>
          </div>
          <h1 className="font-serif text-[32px] text-ink-charcoal font-medium mb-4">
            Your crate is empty.
          </h1>
          <p className="font-serif italic text-[17px] text-ink-soft mb-10 leading-relaxed">
            Come back with something worth lighting tonight.
          </p>
          <Button href="/catalog" variant="primary">Walk the catalog →</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-parchment min-h-screen">
      <div className="max-w-[1280px] mx-auto px-6 py-12">

        <Breadcrumb
          crumbs={[
            { label: 'Storefront', href: '/' },
            { label: 'Your Crate' },
          ]}
          className="mb-8"
        />

        <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
          <div>
            <Eyebrow className="mb-2">
              {itemCount} {itemCount === 1 ? 'piece' : 'pieces'} selected
            </Eyebrow>
            <h1
              className="font-serif font-medium text-ink-charcoal leading-tight"
              style={{ fontSize: 'clamp(28px, 4vw, 52px)' }}
            >
              Your crate.
            </h1>
          </div>
          <button
            onClick={clearCrate}
            className="text-[11px] font-mono uppercase tracking-eyebrow text-ink-soft hover:text-error transition-colors"
          >
            Clear crate
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-12 xl:gap-16 items-start">

          {/* Item list — full detail */}
          <div>
            <div className="border-t border-ink-rule">
              {items.map(item => (
                <div key={item.product.id} className="py-6 border-b border-ink-rule grid grid-cols-[80px_1fr] sm:grid-cols-[100px_1fr] gap-5 sm:gap-7">
                  {/* Thumbnail */}
                  <Link href={`/catalog/${item.product.slug}`} className="shrink-0">
                    <PlateImage
                      src={item.product.images[0]}
                      alt={item.product.name}
                      aspectRatio="4/5"
                      dark={(item.product.category as string) === 'signs'}
                      className="rounded-sm hover:opacity-90 transition-opacity"
                    />
                  </Link>

                  {/* Details */}
                  <div className="flex flex-col gap-2 min-w-0">
                    <div>
                      <p className="text-[10px] font-mono uppercase tracking-eyebrow text-brass-deep mb-1">
                        {item.product.sku} · {item.product.patent}
                      </p>
                      <Link href={`/catalog/${item.product.slug}`}>
                        <h2 className="font-serif text-[18px] sm:text-[20px] font-medium text-ink-charcoal leading-snug hover:text-brass-deep transition-colors">
                          {item.product.name}
                        </h2>
                      </Link>
                      {item.selectedFinish && (
                        <p className="text-[12px] font-sans text-ink-soft mt-1">
                          Finish: {item.selectedFinish}
                        </p>
                      )}
                      {item.selectedBurnerSize && (
                        <p className="text-[12px] font-sans text-ink-soft">
                          Burner: {item.selectedBurnerSize}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between flex-wrap gap-4 mt-auto">
                      {/* Qty stepper */}
                      <div className="flex items-center gap-0 border border-ink-rule rounded-sm w-fit">
                        <CrateItemStepper item={item} />
                      </div>

                      {/* Price */}
                      <div className="text-right">
                        <p className="font-serif text-[22px] text-brass-deep leading-none">
                          {formatPrice(item.product.price * item.quantity)}
                        </p>
                        {item.quantity > 1 && (
                          <p className="text-[11px] font-mono text-ink-soft mt-0.5">
                            {formatPrice(item.product.price)} each
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <Link
                href="/catalog"
                className="text-[13px] font-mono uppercase tracking-eyebrow text-brass-deep hover:text-brass transition-colors border-b border-brass-deep/40 hover:border-brass pb-px"
              >
                ← Continue browsing the catalog
              </Link>
            </div>
          </div>

          {/* Order summary */}
          <div className="lg:sticky lg:top-24 bg-parchment-2 border border-ink-rule rounded-sm p-6 md:p-8 space-y-4">
            <Eyebrow className="mb-4">Order summary</Eyebrow>

            <div className="space-y-2.5">
              <div className="flex justify-between items-baseline">
                <span className="font-sans text-[14px] text-ink-soft">
                  Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})
                </span>
                <span className="font-sans text-[15px] text-ink-iron">{formatPrice(total)}</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="font-sans text-[14px] text-ink-soft">Freight (straw-packed crate)</span>
                <span className={`font-sans text-[15px] ${freeFreight ? 'text-green-brand' : 'text-ink-iron'}`}>
                  {freeFreight ? 'Free' : formatPrice(freight)}
                </span>
              </div>
            </div>

            <div className="border-t border-ink-rule pt-4 flex justify-between items-baseline">
              <span className="font-sans text-[14px] font-semibold text-ink-charcoal">Total · USD</span>
              <span className="font-serif text-[28px] text-brass-deep leading-none">
                {formatPrice(orderTotal)}
              </span>
            </div>

            {freeFreight ? (
              <p className="text-[10px] font-mono uppercase tracking-eyebrow text-green-brand">
                ✓ Qualifies for free freight
              </p>
            ) : (
              <p className="text-[10px] font-mono uppercase tracking-eyebrow text-ink-soft">
                Free freight on orders over {formatPrice(FREIGHT_THRESHOLD)}
              </p>
            )}

            <div className="pt-2 space-y-3">
              <Button href="/checkout" variant="primary" size="block">
                Proceed to checkout →
              </Button>
            </div>

            <div className="pt-2 space-y-1.5">
              {[
                '30-day returns on whole pieces',
                'Straw-packed, insured freight',
                'Plain paper invoice, real return address',
              ].map(line => (
                <div key={line} className="flex items-start gap-2">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="mt-0.5 shrink-0" aria-hidden="true">
                    <path d="M2 6l2.5 2.5L10 3.5" stroke="#2E4A3F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="text-[11px] font-sans text-ink-soft">{line}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

/* Inline stepper to avoid a separate file */
function CrateItemStepper({ item }: { item: ReturnType<typeof useCrateStore.getState>['items'][number] }) {
  const removeItem = useCrateStore(s => s.removeItem)
  const updateQuantity = useCrateStore(s => s.updateQuantity)

  return (
    <>
      <button
        onClick={() => {
          if (item.quantity <= 1) removeItem(item.product.id)
          else updateQuantity(item.product.id, item.quantity - 1)
        }}
        className="w-10 h-10 flex items-center justify-center text-ink-iron hover:bg-parchment-2 transition-colors text-[17px] font-mono border-r border-ink-rule"
        aria-label="Decrease quantity"
      >
        −
      </button>
      <span className="w-11 text-center text-[14px] font-mono text-ink-iron tabular-nums">
        {item.quantity}
      </span>
      <button
        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
        disabled={item.quantity >= item.product.stockQuantity}
        className="w-10 h-10 flex items-center justify-center text-ink-iron hover:bg-parchment-2 transition-colors text-[17px] font-mono border-l border-ink-rule disabled:opacity-30 disabled:pointer-events-none"
        aria-label="Increase quantity"
      >
        +
      </button>
    </>
  )
}
