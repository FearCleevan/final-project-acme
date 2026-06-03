'use client'

import { useState } from 'react'
import {
  BiEnvelope, BiPackage, BiCreditCard, BiStore,
  BiCheck, BiMessageDetail, BiUser,
} from 'react-icons/bi'
import type { AdminOrder, FulfillmentEvent } from '@/lib/admin/types'
import { formatTrackingDate } from '@/lib/admin/utils'

interface TimelineEntry {
  id: string
  type: 'email' | 'fulfillment' | 'order' | 'payment' | 'comment' | 'packed'
  lines: string[]
  timestamp: string
}

interface Props {
  order: AdminOrder
  events: FulfillmentEvent[]
}

const ICON: Record<TimelineEntry['type'], React.ReactNode> = {
  email:       <BiEnvelope size={13} />,
  fulfillment: <BiPackage size={13} />,
  order:       <BiStore size={13} />,
  payment:     <BiCreditCard size={13} />,
  comment:     <BiUser size={13} />,
  packed:      <BiPackage size={13} />,
}

export default function OrderTimeline({ order, events }: Props) {
  const [draft, setDraft]       = useState('')
  const [comments, setComments] = useState<{ id: string; text: string; at: string }[]>([])

  function post() {
    if (!draft.trim()) return
    setComments(prev => [{ id: String(Date.now()), text: draft.trim(), at: new Date().toISOString() }, ...prev])
    setDraft('')
  }

  // Build automatic entries from fulfillment events (newest first)
  const auto: TimelineEntry[] = []

  const reversed = [...events].reverse()
  for (const ev of reversed) {
    switch (ev.status) {
      case 'delivered':
        auto.push({
          id: `${ev.id}-email`,
          type: 'email',
          lines: [`Acme Vintage Supply sent a shipment delivered email to ${order.customer.name} (${order.customer.email}).`],
          timestamp: ev.happenedAt,
        })
        break
      case 'out_for_delivery':
        auto.push({
          id: `${ev.id}-email`,
          type: 'email',
          lines: [`Acme Vintage Supply sent a shipment out for delivery email to ${order.customer.name} (${order.customer.email}).`],
          timestamp: ev.happenedAt,
        })
        break
      case 'in_transit':
        auto.push({
          id: `${ev.id}-email`,
          type: 'email',
          lines: [`Acme Vintage Supply sent a shipping confirmation email to ${order.customer.name} (${order.customer.email}).`],
          timestamp: ev.happenedAt,
        })
        auto.push({
          id: `${ev.id}-fulfill`,
          type: 'fulfillment',
          lines: [
            `Acme Vintage Supply marked ${order.items.length} item(s) as fulfilled.`,
            ...(ev.trackingNumber ? [`${ev.carrier ?? 'Carrier'} · ${ev.trackingNumber}`] : []),
          ],
          timestamp: ev.happenedAt,
        })
        break
      case 'label_printed':
        auto.push({
          id: `${ev.id}-packed`,
          type: 'packed',
          lines: ['Order packed at workshop — straw-packed and hand-numbered.'],
          timestamp: ev.happenedAt,
        })
        break
      case 'confirmed':
        auto.push({
          id: `${ev.id}-confirm-email`,
          type: 'email',
          lines: [`Order confirmation email was sent to ${order.customer.name} (${order.customer.email}).`],
          timestamp: ev.happenedAt,
        })
        auto.push({
          id: `${ev.id}-payment`,
          type: 'payment',
          lines: [`A $${order.total.toFixed(2)} CAD payment was processed.`],
          timestamp: ev.happenedAt,
        })
        auto.push({
          id: `${ev.id}-placed`,
          type: 'order',
          lines: [`${order.customer.name} placed this order on My Store Headless.`],
          timestamp: ev.happenedAt,
        })
        break
    }
  }

  // Merge comments (already newest first) with auto entries
  const commentEntries: TimelineEntry[] = comments.map(c => ({
    id: c.id,
    type: 'comment',
    lines: [c.text],
    timestamp: c.at,
  }))

  // Interleave: comments newest first, then auto entries
  const all: TimelineEntry[] = [...commentEntries, ...auto]

  return (
    <div>
      {/* Comment input */}
      <div
        className="rounded-lg border mb-5"
        style={{ borderColor: 'var(--admin-border)', background: 'var(--admin-surface)' }}
      >
        <div className="flex items-start gap-3 px-4 pt-3 pb-2">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold"
            style={{ background: 'var(--admin-accent)', color: 'var(--admin-accent-text)' }}
          >
            SF
          </div>
          <textarea
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) post() }}
            rows={2}
            placeholder="Leave a comment…"
            className="flex-1 resize-none text-[12px] bg-transparent focus:outline-none placeholder:text-(--admin-text-muted)"
            style={{ color: 'var(--admin-text)' }}
          />
        </div>
        <div
          className="flex items-center justify-between px-4 py-2 border-t"
          style={{ borderColor: 'var(--admin-border)' }}
        >
          <div className="flex items-center gap-1">
            <BiMessageDetail size={14} style={{ color: 'var(--admin-text-muted)' }} />
          </div>
          <button
            onClick={post}
            disabled={!draft.trim()}
            className="h-7 px-3 text-[11px] font-medium rounded-md transition-opacity disabled:opacity-40"
            style={{ background: 'var(--admin-accent)', color: 'var(--admin-accent-text)' }}
          >
            Post
          </button>
        </div>
      </div>

      {/* Timeline entries */}
      <div className="relative">
        {/* Vertical line */}
        <div
          className="absolute left-[13px] top-0 bottom-0 w-px"
          style={{ background: 'var(--admin-border)' }}
        />

        <div className="space-y-4">
          {all.map(entry => (
            <div key={entry.id} className="flex gap-3 relative">
              {/* Dot */}
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 border"
                style={{
                  background:  'var(--admin-surface)',
                  borderColor: 'var(--admin-border)',
                  color:       'var(--admin-text-muted)',
                }}
              >
                {ICON[entry.type]}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pt-0.5">
                {entry.lines.map((line, i) => (
                  <p
                    key={i}
                    className="text-[12px] leading-relaxed"
                    style={{ color: i === 0 ? 'var(--admin-text-soft)' : 'var(--admin-text-muted)' }}
                  >
                    {line}
                  </p>
                ))}
                <p className="text-[10px] mt-0.5" style={{ color: 'var(--admin-text-muted)' }}>
                  {formatTrackingDate(entry.timestamp)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
