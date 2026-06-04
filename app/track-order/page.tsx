'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Breadcrumb from '@/components/shared/Breadcrumb'
import Eyebrow from '@/components/shared/Eyebrow'
import type { TrackOrderResult } from '@/app/api/track-order/route'

const FULFILLMENT_STATUS_LABEL: Record<string, string> = {
  FULFILLED:          'Delivered',
  UNFULFILLED:        'Processing',
  PARTIALLY_FULFILLED:'Partially Shipped',
  IN_PROGRESS:        'In Progress',
  ON_HOLD:            'On Hold',
  SCHEDULED:          'Scheduled',
}

const STATUS_COLOR: Record<string, string> = {
  Delivered:           'text-green-brand',
  'Partially Shipped': 'text-brass-deep',
  'In Progress':       'text-brass-deep',
  Processing:          'text-ink-soft',
  'On Hold':           'text-ink-soft',
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-CA', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

function TrackOrderContent() {
  const searchParams = useSearchParams()
  const initialOrder = searchParams.get('order') ?? ''
  const initialEmail = searchParams.get('email') ?? ''

  const [orderName, setOrderName] = useState(initialOrder)
  const [email,     setEmail]     = useState(initialEmail)
  const [loading,   setLoading]   = useState(false)
  const [result,    setResult]    = useState<TrackOrderResult | 'not-found' | null>(null)
  const [apiError,  setApiError]  = useState<string | null>(null)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!orderName.trim() || !email.trim()) return
    setLoading(true)
    setResult(null)
    setApiError(null)

    try {
      const res = await fetch('/api/track-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderName: orderName.trim(), email: email.trim() }),
      })
      if (res.status === 404) {
        setResult('not-found')
      } else if (!res.ok) {
        const data = await res.json()
        setApiError(data.error ?? 'Something went wrong. Please try again.')
      } else {
        const data: TrackOrderResult = await res.json()
        setResult(data)
      }
    } catch {
      setApiError('Could not reach the server. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const statusLabel = result && result !== 'not-found'
    ? (FULFILLMENT_STATUS_LABEL[result.fulfillmentStatus] ?? result.fulfillmentStatus)
    : ''

  const latestFulfillment = result && result !== 'not-found'
    ? result.fulfillments[result.fulfillments.length - 1] ?? null
    : null

  const trackingNumber = latestFulfillment?.trackingInfo[0]?.number ?? null
  const trackingUrl    = latestFulfillment?.trackingInfo[0]?.url ?? null
  const carrier        = latestFulfillment?.trackingInfo[0]?.company ?? null

  return (
    <div className="bg-parchment min-h-screen">
      <div className="max-w-215 mx-auto px-6 py-14">

        <Breadcrumb
          crumbs={[
            { label: 'Storefront', href: '/' },
            { label: 'Track your order' },
          ]}
          className="mb-10"
        />

        <Eyebrow className="mb-4">Order tracking</Eyebrow>
        <h1
          className="font-serif font-medium text-ink-charcoal leading-tight mb-10"
          style={{ fontSize: 'clamp(28px, 4vw, 52px)' }}
        >
          Where is my order?
        </h1>

        {/* Search form */}
        <form onSubmit={handleSearch} className="space-y-3 mb-12 max-w-140">
          <div className="flex gap-3">
            <input
              type="text"
              value={orderName}
              onChange={e => setOrderName(e.target.value)}
              placeholder="#1001"
              required
              className="flex-1 h-13 px-4 bg-parchment-2 border border-ink-rule rounded-sm text-[15px] font-mono text-ink-iron placeholder:text-ink-soft/50 focus:outline-none focus:border-brass-deep focus:ring-1 focus:ring-brass/20 transition-colors uppercase"
              aria-label="Order number"
            />
          </div>
          <div className="flex gap-3">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Email used at checkout"
              required
              className="flex-1 h-13 px-4 bg-parchment-2 border border-ink-rule rounded-sm text-[15px] font-sans text-ink-iron placeholder:text-ink-soft/50 focus:outline-none focus:border-brass-deep focus:ring-1 focus:ring-brass/20 transition-colors"
              aria-label="Email address"
            />
            <button
              type="submit"
              disabled={loading}
              className="min-h-13 px-7 bg-green-brand text-[#F5F1E6] rounded-btn font-sans text-[14px] font-semibold hover:bg-green-deep hover:shadow-cta-hover transition-all duration-200 shrink-0 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Searching…' : 'Track →'}
            </button>
          </div>
        </form>

        {/* API error */}
        {apiError && (
          <div className="border border-red-200 bg-red-50 rounded-sm px-5 py-4 mb-8 max-w-140">
            <p className="font-sans text-[14px] text-red-700">{apiError}</p>
          </div>
        )}

        {/* Not found */}
        {result === 'not-found' && (
          <div className="border border-ink-rule rounded-sm p-8 text-center max-w-140">
            <p className="font-serif italic text-[18px] text-ink-soft mb-2">
              No order found for those details.
            </p>
            <p className="font-sans text-[14px] text-ink-soft">
              Make sure you&rsquo;re using the order number from your confirmation email and the same email address used at checkout. Or{' '}
              <a href="/contact" className="text-brass-deep hover:text-brass transition-colors border-b border-brass-deep/40 pb-px">
                contact us directly
              </a>.
            </p>
          </div>
        )}

        {/* Results */}
        {result && result !== 'not-found' && (
          <div className="space-y-8 max-w-160">

            {/* Summary card */}
            <div className="bg-parchment-2 border border-ink-rule rounded-sm p-6 md:p-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-eyebrow text-ink-soft mb-1">Order</p>
                <p className="font-mono text-[16px] text-ink-charcoal tracking-[0.06em]">{result.name}</p>
              </div>
              <div>
                <p className="text-[10px] font-mono uppercase tracking-eyebrow text-ink-soft mb-1">Status</p>
                <p className={`font-mono text-[13px] uppercase tracking-eyebrow font-medium ${STATUS_COLOR[statusLabel] ?? 'text-ink-iron'}`}>
                  {statusLabel}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-mono uppercase tracking-eyebrow text-ink-soft mb-1">Order date</p>
                <p className="font-sans text-[13px] text-ink-iron">{formatDate(result.processedAt)}</p>
              </div>
              {result.shippingAddress && (
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-eyebrow text-ink-soft mb-1">Destination</p>
                  <p className="font-sans text-[13px] text-ink-iron">
                    {result.shippingAddress.city}, {result.shippingAddress.province}
                  </p>
                </div>
              )}
              {carrier && (
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-eyebrow text-ink-soft mb-1">Carrier</p>
                  <p className="font-sans text-[13px] text-ink-iron">{carrier}</p>
                </div>
              )}
              {trackingNumber && (
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-eyebrow text-ink-soft mb-1">Tracking number</p>
                  {trackingUrl ? (
                    <a
                      href={trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-[13px] text-brass-deep hover:text-brass transition-colors border-b border-brass-deep/40 pb-px"
                    >
                      {trackingNumber}
                    </a>
                  ) : (
                    <p className="font-mono text-[13px] text-ink-iron">{trackingNumber}</p>
                  )}
                </div>
              )}
            </div>

            {/* Items */}
            <div>
              <Eyebrow className="mb-4">Items in this order</Eyebrow>
              <div className="border border-ink-rule rounded-sm divide-y divide-ink-rule">
                {result.lineItems.map((item, i) => (
                  <div key={i} className="flex items-center justify-between gap-4 px-5 py-3.5">
                    <p className="font-sans text-[14px] text-ink-iron">{item.title}</p>
                    <p className="font-mono text-[12px] text-ink-soft shrink-0">× {item.quantity}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Fulfillment timeline */}
            {result.fulfillments.length > 0 && (() => {
              const EVENT_LABEL: Record<string, string> = {
                CONFIRMED:        'Order confirmed',
                LABEL_PRINTED:    'Label printed',
                IN_TRANSIT:       'Shipped',
                OUT_FOR_DELIVERY: 'Out for delivery',
                DELIVERED:        'Delivered',
                FAILURE:          'Delivery failed',
                ATTEMPTED_DELIVERY: 'Delivery attempted',
              }
              const f = result.fulfillments[result.fulfillments.length - 1]
              const events = f.events ?? []
              const tracking = f.trackingInfo[0]

              return (
                <div>
                  <Eyebrow className="mb-6">Shipment timeline</Eyebrow>
                  <ol className="relative border-l border-ink-rule ml-3 space-y-0">
                    {events.length > 0 ? events.map((ev, i) => {
                      const isLast = i === events.length - 1
                      return (
                        <li key={i} className="mb-8 ml-6 last:mb-0">
                          <span className={`absolute -left-2.25 w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center ${isLast ? 'bg-green-brand border-green-brand' : 'bg-parchment border-ink-rule'}`}>
                            {isLast && (
                              <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                                <path d="M1.5 4l2 2 3-3" stroke="#F5F1E6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </span>
                          <div className="pt-0.5">
                            <p className="font-serif text-[16px] font-medium text-ink-charcoal leading-snug mb-0.5">
                              {EVENT_LABEL[ev.status] ?? ev.status}
                            </p>
                            <time className="font-mono text-[10px] uppercase tracking-eyebrow text-ink-soft/70">
                              {formatDate(ev.happenedAt)}
                            </time>
                            {ev.status === 'IN_TRANSIT' && tracking?.number && (
                              <p className="font-mono text-[11px] text-ink-soft/70 mt-1">
                                {tracking.company ? `${tracking.company} · ` : ''}{tracking.number}
                              </p>
                            )}
                          </div>
                        </li>
                      )
                    }) : (
                      <li className="mb-8 ml-6">
                        <span className="absolute -left-2.25 w-4.5 h-4.5 rounded-full border-2 bg-green-brand border-green-brand flex items-center justify-center">
                          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                            <path d="M1.5 4l2 2 3-3" stroke="#F5F1E6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                        <div className="pt-0.5">
                          <p className="font-serif text-[16px] font-medium text-ink-charcoal leading-snug mb-0.5">Shipped</p>
                          <time className="font-mono text-[10px] uppercase tracking-eyebrow text-ink-soft/70">
                            {formatDate(f.updatedAt)}
                          </time>
                          {tracking?.number && (
                            <p className="font-mono text-[11px] text-ink-soft/70 mt-1">
                              {tracking.company ? `${tracking.company} · ` : ''}{tracking.number}
                            </p>
                          )}
                        </div>
                      </li>
                    )}
                  </ol>
                </div>
              )
            })()}

            {/* No fulfillment yet */}
            {result.fulfillments.length === 0 && (
              <div className="border border-ink-rule rounded-sm p-6">
                <p className="font-serif italic text-[16px] text-ink-soft">
                  Your order is confirmed and being prepared. Tracking information will appear here once your order ships.
                </p>
              </div>
            )}

          </div>
        )}

        {/* Helper text when no search yet */}
        {!result && !apiError && (
          <div className="border-t border-ink-rule pt-8 max-w-140">
            <p className="font-sans text-[14px] text-ink-soft leading-relaxed">
              Your order number is in your confirmation email.
              It looks like <span className="font-mono text-ink-iron">#1001</span>.
              Can&rsquo;t find it?{' '}
              <a href="/contact" className="text-brass-deep hover:text-brass transition-colors border-b border-brass-deep/40 pb-px">
                Write to us.
              </a>
            </p>
          </div>
        )}

      </div>
    </div>
  )
}

export default function TrackOrderPage() {
  return (
    <Suspense>
      <TrackOrderContent />
    </Suspense>
  )
}
