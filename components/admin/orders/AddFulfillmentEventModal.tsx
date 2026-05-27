'use client'

import { useEffect, useRef, useState } from 'react'
import { BiX, BiPackage } from 'react-icons/bi'
import { AdminOrder, FulfillmentEvent, FulfillmentEventStatus } from '@/lib/admin/types'
import {
  FULFILLMENT_STAGE_CONFIG,
  getNextFulfillmentStage,
} from '@/lib/admin/utils'

interface Props {
  order: AdminOrder
  events: FulfillmentEvent[]
  onAdd: (event: FulfillmentEvent) => void
  onClose: () => void
}

export default function AddFulfillmentEventModal({ order, events, onAdd, onClose }: Props) {
  const currentStatuses = events.map(e => e.status)
  const nextStage = getNextFulfillmentStage(currentStatuses)
  const config = nextStage ? FULFILLMENT_STAGE_CONFIG[nextStage] : null

  const [message, setMessage]               = useState(config?.defaultDetail ?? '')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [carrier, setCarrier]               = useState('Canada Post — Express')

  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    cancelRef.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!nextStage || !config) return null

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nextStage) return
    const newEvent: FulfillmentEvent = {
      id: `fe-${order.id}-${Date.now()}`,
      status: nextStage as FulfillmentEventStatus,
      message: message.trim() || config!.defaultDetail,
      happenedAt: new Date().toISOString(),
      ...(nextStage === 'in_transit' && trackingNumber.trim()
        ? { trackingNumber: trackingNumber.trim(), carrier: carrier.trim() }
        : {}),
    }
    onAdd(newEvent)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Add fulfillment stage"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.4)' }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className="relative w-full max-w-md rounded-lg shadow-xl border"
        style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: 'var(--admin-border)' }}
        >
          <div className="flex items-center gap-2">
            <BiPackage size={16} style={{ color: 'var(--admin-text-muted)' }} />
            <p className="text-[13px] font-semibold" style={{ color: 'var(--admin-text)' }}>
              Add next stage
            </p>
          </div>
          <button
            ref={cancelRef}
            onClick={onClose}
            className="p-1 rounded-md transition-colors hover:bg-(--admin-surface-2)"
            aria-label="Close"
          >
            <BiX size={18} style={{ color: 'var(--admin-text-muted)' }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          {/* Stage (read-only — always the next in sequence) */}
          <div>
            <p className="text-[11px] uppercase tracking-wide mb-1.5" style={{ color: 'var(--admin-text-muted)' }}>
              Stage
            </p>
            <div
              className="h-9 px-3 flex items-center rounded-md border text-[13px] font-medium"
              style={{
                background: 'var(--admin-surface-2)',
                borderColor: 'var(--admin-border)',
                color: 'var(--admin-text)',
              }}
            >
              {config.label}
            </div>
          </div>

          {/* Tracking number + carrier (in_transit only) */}
          {nextStage === 'in_transit' && (
            <>
              <div>
                <label
                  htmlFor="carrier"
                  className="block text-[11px] uppercase tracking-wide mb-1.5"
                  style={{ color: 'var(--admin-text-muted)' }}
                >
                  Carrier
                </label>
                <input
                  id="carrier"
                  type="text"
                  value={carrier}
                  onChange={e => setCarrier(e.target.value)}
                  placeholder="Canada Post — Express"
                  className="w-full h-9 px-3 text-[13px] rounded-md border focus:outline-none transition-colors"
                  style={{
                    background: 'var(--admin-surface-2)',
                    borderColor: 'var(--admin-border)',
                    color: 'var(--admin-text)',
                  }}
                />
              </div>
              <div>
                <label
                  htmlFor="tracking"
                  className="block text-[11px] uppercase tracking-wide mb-1.5"
                  style={{ color: 'var(--admin-text-muted)' }}
                >
                  Tracking number
                </label>
                <input
                  id="tracking"
                  type="text"
                  value={trackingNumber}
                  onChange={e => setTrackingNumber(e.target.value)}
                  placeholder="CA123456789CA"
                  className="w-full h-9 px-3 text-[13px] rounded-md border focus:outline-none transition-colors"
                  style={{
                    background: 'var(--admin-surface-2)',
                    borderColor: 'var(--admin-border)',
                    color: 'var(--admin-text)',
                  }}
                />
              </div>
            </>
          )}

          {/* Message */}
          <div>
            <label
              htmlFor="message"
              className="block text-[11px] uppercase tracking-wide mb-1.5"
              style={{ color: 'var(--admin-text-muted)' }}
            >
              Note (optional)
            </label>
            <textarea
              id="message"
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 text-[12px] rounded-md border resize-none focus:outline-none transition-colors"
              style={{
                background: 'var(--admin-surface-2)',
                borderColor: 'var(--admin-border)',
                color: 'var(--admin-text)',
              }}
            />
          </div>

          {/* Notify customer (Plan 2) */}
          <label className="flex items-center gap-2.5 cursor-not-allowed opacity-50 select-none">
            <input type="checkbox" disabled className="rounded" />
            <span className="text-[12px]" style={{ color: 'var(--admin-text-soft)' }}>
              Notify customer by email
              <span className="ml-1.5 text-[10px] uppercase tracking-wide" style={{ color: 'var(--admin-text-muted)' }}>
                — Plan 2
              </span>
            </span>
          </label>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 text-[12px] rounded-md border transition-colors hover:bg-(--admin-surface-2)"
              style={{
                borderColor: 'var(--admin-border)',
                color: 'var(--admin-text-soft)',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-9 px-4 text-[12px] font-medium rounded-md transition-opacity hover:opacity-90"
              style={{
                background: 'var(--admin-accent)',
                color: 'var(--admin-accent-text)',
              }}
            >
              Add — {config.label}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
