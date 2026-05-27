'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Breadcrumb from '@/components/shared/Breadcrumb'
import Eyebrow from '@/components/shared/Eyebrow'
import { mockOrders, getOrderByTrackingRef } from '@/lib/admin/mockData'
import {
  FULFILLMENT_STAGE_ORDER,
  FULFILLMENT_STAGE_CONFIG,
  formatTrackingDate,
} from '@/lib/admin/utils'
import { AdminOrder, FulfillmentEventStatus } from '@/lib/admin/types'

interface TrackingStage {
  label: string
  detail: string
  date: string
  trackingInfo?: string
  done: boolean
  current: boolean
}

interface TrackingResult {
  ref: string
  status: string
  estimatedDelivery: string
  carrier: string
  destination: string
  stages: TrackingStage[]
}

const STATUS_LABEL: Partial<Record<FulfillmentEventStatus, string>> = {
  delivered:          'Delivered',
  out_for_delivery:   'Out for Delivery',
  in_transit:         'Shipped',
  label_printed:      'Packed',
  confirmed:          'Confirmed',
  attempted_delivery: 'Attempted',
  failure:            'Issue',
}

function orderToTrackingResult(order: AdminOrder): TrackingResult {
  const lastEvent    = order.fulfillmentEvents[order.fulfillmentEvents.length - 1]
  const doneSet      = new Set(order.fulfillmentEvents.map(e => e.status))
  const transitEvent = order.fulfillmentEvents.find(e => e.status === 'in_transit')

  const stages: TrackingStage[] = FULFILLMENT_STAGE_ORDER.map(status => {
    const event  = order.fulfillmentEvents.find(e => e.status === status)
    const config = FULFILLMENT_STAGE_CONFIG[status]
    const done   = doneSet.has(status)
    const current = status === lastEvent?.status

    return {
      label:        config.label,
      detail:       event?.message ?? config.defaultDetail,
      date:         event ? formatTrackingDate(event.happenedAt) : '',
      trackingInfo: event?.trackingNumber
        ? `${event.carrier ? event.carrier + ' · ' : ''}${event.trackingNumber}`
        : undefined,
      done,
      current,
    }
  })

  return {
    ref:               order.trackingRef,
    status:            STATUS_LABEL[lastEvent?.status] ?? 'Confirmed',
    estimatedDelivery: order.estimatedDelivery ?? '—',
    carrier:           transitEvent?.carrier ?? '—',
    destination:       `${order.customer.city}, ${order.customer.province}`,
    stages,
  }
}

const DEMO_REFS = mockOrders
  .filter(o => o.fulfillmentEvents.length > 0)
  .slice(0, 4)
  .map(o => o.trackingRef)

const statusColor: Record<string, string> = {
  Delivered:          'text-green-brand',
  Shipped:            'text-brass-deep',
  Packed:             'text-ink-iron',
  Confirmed:          'text-ink-soft',
  Attempted:          'text-brass-deep',
  Issue:              'text-red-600',
  'Out for Delivery': 'text-brass-deep',
}

function TrackOrderContent() {
  const searchParams = useSearchParams()
  const initialRef   = searchParams.get('ref') ?? ''

  const [query,  setQuery]  = useState(initialRef)
  const [ref,    setRef]    = useState(initialRef)
  const [result, setResult] = useState<TrackingResult | 'not-found' | null>(() => {
    if (!initialRef) return null
    const order = getOrderByTrackingRef(initialRef.toUpperCase())
    return order ? orderToTrackingResult(order) : 'not-found'
  })

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = query.trim().toUpperCase()
    setRef(trimmed)
    const order = getOrderByTrackingRef(trimmed)
    setResult(order ? orderToTrackingResult(order) : 'not-found')
  }

  function selectDemo(demoRef: string) {
    setQuery(demoRef)
    setRef(demoRef)
    const order = getOrderByTrackingRef(demoRef)
    setResult(order ? orderToTrackingResult(order) : 'not-found')
  }

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

        {/* Demo hint */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-mono uppercase tracking-eyebrow text-ink-soft">
            Try a demo reference:
          </span>
          {DEMO_REFS.map(demoRef => (
            <button
              key={demoRef}
              type="button"
              onClick={() => selectDemo(demoRef)}
              className="font-mono text-[11px] text-brass-deep hover:text-brass border border-brass-deep/30 hover:border-brass/60 rounded-sm px-2.5 py-1 transition-colors"
            >
              {demoRef}
            </button>
          ))}
        </div>

        {/* Search form */}
        <form onSubmit={handleSearch} className="flex gap-3 mb-12">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="ACME-1001-NS"
            className="flex-1 h-13 px-4 bg-parchment-2 border border-ink-rule rounded-sm text-[15px] font-mono text-ink-iron placeholder:text-ink-soft/50 focus:outline-none focus:border-brass-deep focus:ring-1 focus:ring-brass/20 transition-colors uppercase"
            aria-label="Order reference number"
          />
          <button
            type="submit"
            className="min-h-13 px-7 bg-green-brand text-[#F5F1E6] rounded-btn font-sans text-[14px] font-semibold hover:bg-green-deep hover:shadow-cta-hover transition-all duration-200 shrink-0"
          >
            Track →
          </button>
        </form>

        {/* Results */}
        {result === 'not-found' && (
          <div className="border border-ink-rule rounded-sm p-8 text-center">
            <p className="font-serif italic text-[18px] text-ink-soft mb-2">
              No order found for <span className="font-mono not-italic text-ink-iron">{ref}</span>.
            </p>
            <p className="font-sans text-[14px] text-ink-soft">
              Check the reference on your plain-paper invoice, or{' '}
              <a href="/contact" className="text-brass-deep hover:text-brass transition-colors border-b border-brass-deep/40 pb-px">
                contact us directly
              </a>.
            </p>
          </div>
        )}

        {result && result !== 'not-found' && (
          <div className="space-y-8">

            {/* Summary card */}
            <div className="bg-parchment-2 border border-ink-rule rounded-sm p-6 md:p-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-eyebrow text-ink-soft mb-1">Reference</p>
                <p className="font-mono text-[16px] text-ink-charcoal tracking-[0.06em]">{result.ref}</p>
              </div>
              <div>
                <p className="text-[10px] font-mono uppercase tracking-eyebrow text-ink-soft mb-1">Status</p>
                <p className={`font-mono text-[13px] uppercase tracking-eyebrow font-medium ${statusColor[result.status] ?? 'text-ink-iron'}`}>
                  {result.status}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-mono uppercase tracking-eyebrow text-ink-soft mb-1">Carrier</p>
                <p className="font-sans text-[13px] text-ink-iron">{result.carrier}</p>
              </div>
              <div>
                <p className="text-[10px] font-mono uppercase tracking-eyebrow text-ink-soft mb-1">Destination</p>
                <p className="font-sans text-[13px] text-ink-iron">{result.destination}</p>
              </div>
              {result.estimatedDelivery !== '—' && result.status !== 'Delivered' && (
                <div className="sm:col-span-2">
                  <p className="text-[10px] font-mono uppercase tracking-eyebrow text-ink-soft mb-1">Estimated delivery</p>
                  <p className="font-sans text-[13px] text-ink-iron">{result.estimatedDelivery}</p>
                </div>
              )}
            </div>

            {/* Timeline */}
            <div>
              <Eyebrow className="mb-6">Shipment timeline</Eyebrow>
              <ol className="relative border-l border-ink-rule ml-3 space-y-0">
                {result.stages.map((stage, i) => (
                  <li key={i} className="mb-8 ml-6 last:mb-0">
                    {/* Dot */}
                    <span
                      className={[
                        'absolute -left-2.25 w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center',
                        stage.current
                          ? 'bg-green-brand border-green-brand'
                          : stage.done
                          ? 'bg-parchment border-green-brand'
                          : 'bg-parchment border-ink-rule',
                      ].join(' ')}
                      aria-hidden="true"
                    >
                      {stage.current && (
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                          <path d="M1.5 4l2 2 3-3" stroke="#F5F1E6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                      {stage.done && !stage.current && (
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                          <path d="M1.5 4l2 2 3-3" stroke="#2E4A3F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </span>

                    <div className="pt-0.5">
                      <p className={`font-serif text-[16px] font-medium leading-snug mb-0.5 ${
                        stage.current ? 'text-ink-charcoal' : stage.done ? 'text-ink-iron' : 'text-ink-soft/40'
                      }`}>
                        {stage.label}
                      </p>
                      {stage.done && (
                        <>
                          <p className="font-sans text-[13px] text-ink-soft mb-1">{stage.detail}</p>
                          {stage.trackingInfo && (
                            <p className="font-mono text-[11px] text-ink-soft/70 mb-1">{stage.trackingInfo}</p>
                          )}
                          {stage.date && (
                            <time className="font-mono text-[10px] uppercase tracking-eyebrow text-ink-soft/70">
                              {stage.date}
                            </time>
                          )}
                        </>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </div>

          </div>
        )}

        {!result && (
          <div className="border-t border-ink-rule pt-8">
            <p className="font-sans text-[14px] text-ink-soft leading-relaxed">
              Your order reference is printed on your plain-paper invoice.
              It starts with <span className="font-mono text-ink-iron">ACME-</span>.
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
