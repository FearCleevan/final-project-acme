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

            {/* Shipment progress stepper */}
            {(() => {
              const STAGES = [
                { status: 'CONFIRMED',        label: 'Order\nconfirmed'    },
                { status: 'LABEL_PRINTED',    label: 'Packed at\nworkshop' },
                { status: 'IN_TRANSIT',       label: 'Shipped'             },
                { status: 'OUT_FOR_DELIVERY', label: 'Out for\ndelivery'   },
                { status: 'DELIVERED',        label: 'Delivered'           },
              ]

              const allEvents = result.fulfillments.flatMap(f => f.events)
              const eventByStatus: Record<string, { status: string; happenedAt: string }> = {}
              allEvents.forEach(e => { eventByStatus[e.status] = e })

              const lastCompletedIndex = STAGES.reduce(
                (acc, s, i) => (eventByStatus[s.status] ? i : acc), -1
              )

              return (
                <div>
                  <Eyebrow className="mb-6">Shipment progress</Eyebrow>

                  {/* Stepper row */}
                  <div className="flex items-start">
                    {STAGES.map((stage, i) => {
                      const isDone  = !!eventByStatus[stage.status]
                      const isNext  = i === lastCompletedIndex + 1
                      const ev      = eventByStatus[stage.status]

                      return (
                        <div key={stage.status} className="relative flex-1 flex flex-col items-center">

                          {/* Left connector */}
                          {i > 0 && (
                            <div className={`absolute left-0 right-1/2 top-4 h-px -translate-y-1/2 ${i <= lastCompletedIndex ? 'bg-green-brand' : 'bg-ink-rule'}`} />
                          )}
                          {/* Right connector */}
                          {i < STAGES.length - 1 && (
                            <div className={`absolute left-1/2 right-0 top-4 h-px -translate-y-1/2 ${i < lastCompletedIndex ? 'bg-green-brand' : 'bg-ink-rule'}`} />
                          )}

                          {/* Circle */}
                          <div className={`relative z-10 w-8 h-8 rounded-full border-2 flex items-center justify-center mb-3 transition-colors duration-300 ${
                            isDone
                              ? 'bg-green-brand border-green-brand'
                              : isNext
                                ? 'bg-parchment border-brass-deep'
                                : 'bg-parchment border-ink-rule'
                          }`}>
                            {isDone ? (
                              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                <path d="M2.5 6l2.5 2.5 4.5-4.5" stroke="#F5F1E6" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            ) : isNext ? (
                              <span className="w-2 h-2 rounded-full bg-brass-deep" />
                            ) : null}
                          </div>

                          {/* Label */}
                          <p className={`font-sans text-center text-[11px] sm:text-[12px] leading-tight whitespace-pre-line px-1 ${
                            isDone ? 'text-ink-charcoal font-semibold' : 'text-ink-soft'
                          }`}>
                            {stage.label}
                          </p>

                          {/* Date */}
                          {ev && (
                            <time className="font-mono text-[9px] sm:text-[10px] uppercase tracking-eyebrow text-ink-soft/60 text-center mt-1 leading-tight block px-1">
                              {formatDate(ev.happenedAt)}
                            </time>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {/* Status note when nothing done yet */}
                  {lastCompletedIndex === -1 && (
                    <p className="font-serif italic text-[14px] text-ink-soft mt-6">
                      Your order is being prepared. Progress will update here as it moves through each stage.
                    </p>
                  )}
                </div>
              )
            })()}

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
