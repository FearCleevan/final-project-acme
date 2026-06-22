'use client'

import Eyebrow from '@/components/shared/Eyebrow'
import type { TrackOrderResult } from '@/app/api/track-order/route'

const FULFILLMENT_STATUS_LABEL: Record<string, string> = {
  FULFILLED:           'Delivered',
  UNFULFILLED:         'Processing',
  PARTIALLY_FULFILLED: 'Partially Shipped',
  IN_PROGRESS:         'In Progress',
  ON_HOLD:             'On Hold',
  SCHEDULED:           'Scheduled',
}

const STATUS_COLOR: Record<string, string> = {
  Delivered:           'text-green-brand',
  'Partially Shipped': 'text-brass-deep',
  'In Progress':       'text-brass-deep',
  Processing:          'text-ink-soft',
  'On Hold':           'text-ink-soft',
}

const STAGES = [
  { status: 'CONFIRMED',        label: 'Order\nconfirmed'    },
  { status: 'LABEL_PRINTED',    label: 'Packed at\nworkshop' },
  { status: 'IN_TRANSIT',       label: 'Shipped'             },
  { status: 'OUT_FOR_DELIVERY', label: 'Out for\ndelivery'   },
  { status: 'DELIVERED',        label: 'Delivered'           },
]

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-CA', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

export default function OrderTrackingResult({ result }: { result: TrackOrderResult }): React.ReactElement {
  const statusLabel      = FULFILLMENT_STATUS_LABEL[result.fulfillmentStatus] ?? result.fulfillmentStatus
  const latestFulfillment = result.fulfillments[result.fulfillments.length - 1] ?? null
  const trackingNumber   = latestFulfillment?.trackingInfo[0]?.number ?? null
  const trackingUrl      = latestFulfillment?.trackingInfo[0]?.url    ?? null
  const carrier          = latestFulfillment?.trackingInfo[0]?.company ?? null

  const allEvents = result.fulfillments.flatMap(f => f.events)
  const eventByStatus: Record<string, { status: string; happenedAt: string }> = {}
  allEvents.forEach(e => { eventByStatus[e.status] = e })
  const lastCompletedIndex = STAGES.reduce(
    (acc, s, i) => (eventByStatus[s.status] ? i : acc), -1
  )

  return (
    <div className="space-y-8">

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
      <div>
        <Eyebrow className="mb-6">Shipment progress</Eyebrow>
        <div className="flex items-start">
          {STAGES.map((stage, i) => {
            const isDone = !!eventByStatus[stage.status]
            const isNext = i === lastCompletedIndex + 1
            const ev     = eventByStatus[stage.status]

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

        {lastCompletedIndex === -1 && (
          <p className="font-serif italic text-[14px] text-ink-soft mt-6">
            Your order is being prepared. Progress will update here as it moves through each stage.
          </p>
        )}
      </div>

    </div>
  )
}
