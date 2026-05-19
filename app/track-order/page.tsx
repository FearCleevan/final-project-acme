'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Breadcrumb from '@/components/shared/Breadcrumb'
import Eyebrow from '@/components/shared/Eyebrow'

interface TrackingStage {
  label: string
  detail: string
  date: string
  done: boolean
  current: boolean
}

interface TrackingResult {
  ref: string
  status: 'Delivered' | 'Shipped' | 'Packed' | 'Confirmed'
  estimatedDelivery: string
  carrier: string
  destination: string
  stages: TrackingStage[]
}

const mockTracking: Record<string, TrackingResult> = {
  'ACME-2614-SP': {
    ref: 'ACME-2614-SP',
    status: 'Delivered',
    estimatedDelivery: '14 Feb 2026',
    carrier: 'Australia Post — Express',
    destination: 'Adelaide, SA 5000',
    stages: [
      { label: 'Order confirmed', detail: 'Payment verified, packing begins.', date: '10 Feb 2026 · 09:14', done: true, current: false },
      { label: 'Packed at workshop', detail: 'Straw-packed and hand-numbered by our bench team.', date: '11 Feb 2026 · 14:32', done: true, current: false },
      { label: 'Shipped', detail: 'Collected by Australia Post Express freight.', date: '12 Feb 2026 · 08:55', done: true, current: false },
      { label: 'Delivered', detail: 'Left with resident. Signed for by M. H.', date: '14 Feb 2026 · 11:20', done: true, current: true },
    ],
  },
  'ACME-2591-SP': {
    ref: 'ACME-2591-SP',
    status: 'Delivered',
    estimatedDelivery: '4 Dec 2025',
    carrier: 'Australia Post — Express',
    destination: 'Adelaide, SA 5000',
    stages: [
      { label: 'Order confirmed', detail: 'Payment verified, packing begins.', date: '30 Nov 2025 · 11:02', done: true, current: false },
      { label: 'Packed at workshop', detail: 'Straw-packed and hand-numbered by our bench team.', date: '1 Dec 2025 · 15:44', done: true, current: false },
      { label: 'Shipped', detail: 'Collected by Australia Post Express freight.', date: '2 Dec 2025 · 09:10', done: true, current: false },
      { label: 'Delivered', detail: 'Left at front door. Photo on file.', date: '4 Dec 2025 · 13:05', done: true, current: true },
    ],
  },
  'ACME-2540-SP': {
    ref: 'ACME-2540-SP',
    status: 'Delivered',
    estimatedDelivery: '12 Sep 2025',
    carrier: 'Sendle — Standard',
    destination: 'Adelaide, SA 5000',
    stages: [
      { label: 'Order confirmed', detail: 'Payment verified, packing begins.', date: '8 Sep 2025 · 10:30', done: true, current: false },
      { label: 'Packed at workshop', detail: 'Straw-packed and hand-numbered by our bench team.', date: '9 Sep 2025 · 16:00', done: true, current: false },
      { label: 'Shipped', detail: 'Collected by Sendle standard freight.', date: '10 Sep 2025 · 08:40', done: true, current: false },
      { label: 'Delivered', detail: 'Delivered to mailbox.', date: '12 Sep 2025 · 12:15', done: true, current: true },
    ],
  },
}

function TrackOrderContent() {
  const searchParams = useSearchParams()
  const [ref, setRef] = useState(searchParams.get('ref') ?? '')
  const [query, setQuery] = useState(searchParams.get('ref') ?? '')
  const [result, setResult] = useState<TrackingResult | 'not-found' | null>(
    searchParams.get('ref') ? (mockTracking[searchParams.get('ref')!] ?? 'not-found') : null
  )

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = query.trim().toUpperCase()
    setRef(trimmed)
    setResult(mockTracking[trimmed] ?? 'not-found')
  }

  const statusColor: Record<string, string> = {
    Delivered: 'text-green-brand',
    Shipped: 'text-brass-deep',
    Packed: 'text-ink-iron',
    Confirmed: 'text-ink-soft',
  }

  return (
    <div className="bg-parchment min-h-screen">
        <div className="max-w-[860px] mx-auto px-6 py-14">

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
            {Object.keys(mockTracking).map(key => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setQuery(key)
                  setRef(key)
                  setResult(mockTracking[key])
                }}
                className="font-mono text-[11px] text-brass-deep hover:text-brass border border-brass-deep/30 hover:border-brass/60 rounded-sm px-2.5 py-1 transition-colors"
              >
                {key}
              </button>
            ))}
          </div>

          {/* Search form */}
          <form onSubmit={handleSearch} className="flex gap-3 mb-12">
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="ACME-2614-SP"
              className="flex-1 h-[52px] px-4 bg-parchment-2 border border-ink-rule rounded-sm text-[15px] font-mono text-ink-iron placeholder:text-ink-soft/50 focus:outline-none focus:border-brass-deep focus:ring-1 focus:ring-brass/20 transition-colors uppercase"
              aria-label="Order reference number"
            />
            <button
              type="submit"
              className="min-h-[52px] px-7 bg-green-brand text-[#F5F1E6] rounded-btn font-sans text-[14px] font-semibold hover:bg-green-deep hover:shadow-cta-hover transition-all duration-200 shrink-0"
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
                  <p className={`font-mono text-[13px] uppercase tracking-eyebrow font-medium ${statusColor[result.status]}`}>
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
                          'absolute -left-[9px] w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center',
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
                        <p className={`font-serif text-[16px] font-medium leading-snug mb-0.5 ${stage.current ? 'text-ink-charcoal' : stage.done ? 'text-ink-iron' : 'text-ink-soft'}`}>
                          {stage.label}
                        </p>
                        <p className="font-sans text-[13px] text-ink-soft mb-1">{stage.detail}</p>
                        <time className="font-mono text-[10px] uppercase tracking-eyebrow text-ink-soft/70">
                          {stage.date}
                        </time>
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
                It starts with <span className="font-mono text-ink-iron">ACME-</span> and ends with <span className="font-mono text-ink-iron">-SP</span>.
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
