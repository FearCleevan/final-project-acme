'use client'

import { useState } from 'react'
import Eyebrow from '@/components/shared/Eyebrow'

const cards = [
  {
    n: '01',
    eyebrow: 'Adelaide House · Distribution',
    address: ['14 Pirie Street, Crate Row 14', 'Adelaide, SA 5000 — Australia'],
    phone: '+61 8 7000 1873',
    email: 'hello@acmelamp.co',
    hours: 'Mon–Fri · 9:00–17:00 ACST',
  },
  {
    n: '02',
    eyebrow: 'Pune Workshop · Press Shop 4',
    address: ['Press Shop 4, Shivaji Nagar Industrial Estate', 'Pune, Maharashtra 411 005 — India'],
    phone: '+91 20 6600 1873',
    email: 'workshop@acmelamp.co',
    hours: 'Mon–Sat · 8:00–18:00 IST',
  },
]

export default function AddressCards() {
  const [trackingNo, setTrackingNo] = useState('')

  return (
    <div className="space-y-5">
      {/* Address cards */}
      {cards.map(card => (
        <div
          key={card.n}
          className="bg-parchment-2 border border-ink-rule rounded-sm p-6 md:p-8"
        >
          <div className="flex items-start justify-between gap-4 mb-5">
            <Eyebrow>{card.eyebrow}</Eyebrow>
            <span className="font-serif text-[28px] text-brass-deep leading-none tabular-nums shrink-0">
              {card.n}
            </span>
          </div>

          <address className="not-italic space-y-3">
            <div>
              {card.address.map((line, i) => (
                <p key={i} className="font-sans text-[14px] text-ink-iron leading-relaxed">{line}</p>
              ))}
            </div>
            <div className="space-y-1 pt-1">
              <p className="text-[11px] font-mono uppercase tracking-eyebrow text-ink-soft">
                Phone:{' '}
                <a
                  href={`tel:${card.phone.replace(/\s/g, '')}`}
                  className="text-brass-deep hover:text-brass transition-colors normal-case tracking-normal text-[13px] font-sans"
                >
                  {card.phone}
                </a>
              </p>
              <p className="text-[11px] font-mono uppercase tracking-eyebrow text-ink-soft">
                Email:{' '}
                <a
                  href={`mailto:${card.email}`}
                  className="text-brass-deep hover:text-brass transition-colors normal-case tracking-normal text-[13px] font-sans"
                >
                  {card.email}
                </a>
              </p>
              <p className="text-[11px] font-mono uppercase tracking-eyebrow text-ink-soft">
                Hours:{' '}
                <span className="text-ink-iron normal-case tracking-normal text-[13px] font-sans">{card.hours}</span>
              </p>
            </div>
          </address>
        </div>
      ))}

      {/* Order tracking card */}
      <div className="canvas-dark rounded-sm p-6 md:p-8">
        <p className="font-sans text-[16px] font-semibold text-canvas-heading mb-1">
          Already placed an order?
        </p>
        <p className="font-sans text-[14px] text-canvas-muted mb-5 leading-relaxed">
          Use the tracking number from your invoice to skip the queue.
        </p>
        <form
          onSubmit={e => e.preventDefault()}
          className="flex gap-2"
        >
          <input
            type="text"
            value={trackingNo}
            onChange={e => setTrackingNo(e.target.value)}
            placeholder="ACME-0014-XXXX"
            className="flex-1 h-[48px] px-4 bg-white/10 border border-white/20 rounded-sm text-[14px] font-mono text-canvas-heading placeholder:text-canvas-dim focus:outline-none focus:border-brass/60 transition-colors"
            aria-label="Order tracking number"
          />
          <button
            type="submit"
            className="h-[48px] px-5 bg-brass text-ink-charcoal rounded-sm font-mono text-[13px] font-medium hover:bg-brass-deep hover:text-canvas-heading transition-colors shrink-0"
            aria-label="Track order"
          >
            →
          </button>
        </form>
      </div>
    </div>
  )
}
