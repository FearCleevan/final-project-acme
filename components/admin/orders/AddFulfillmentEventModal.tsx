'use client'

import { useEffect, useRef, useState } from 'react'
import { BiX, BiPackage } from 'react-icons/bi'
import { AdminOrder, FulfillmentEvent, FulfillmentEventStatus } from '@/lib/admin/types'
import { FULFILLMENT_STAGE_CONFIG, getNextFulfillmentStage } from '@/lib/admin/utils'
import { CARRIERS } from '@/lib/admin/carriers'

interface Props {
  order: AdminOrder
  events: FulfillmentEvent[]
  fulfillmentId: string | null
  onAdd: (event: FulfillmentEvent, newFulfillmentId?: string) => void
  onClose: () => void
}

export default function AddFulfillmentEventModal({ order, events, fulfillmentId, onAdd, onClose }: Props) {
  const currentStatuses = events.map(e => e.status)
  const nextStage = getNextFulfillmentStage(currentStatuses)
  const config = nextStage ? FULFILLMENT_STAGE_CONFIG[nextStage] : null

  const [message, setMessage]               = useState(config?.defaultDetail ?? '')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [carrier, setCarrier]               = useState('Canada Post')
  const [notifyCustomer, setNotifyCustomer] = useState(true)
  const [loading, setLoading]               = useState(false)
  const [error, setError]                   = useState<string | null>(null)

  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    cancelRef.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!nextStage || !config) return null

  const needsTracking = nextStage === 'in_transit'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nextStage) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(
        `/api/admin/orders/${encodeURIComponent(order.id)}/fulfill`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            stage: nextStage,
            trackingNumber: needsTracking ? trackingNumber.trim() : undefined,
            carrier: needsTracking ? carrier : undefined,
            notifyCustomer,
            fulfillmentId: fulfillmentId ?? undefined,
          }),
        }
      )

      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Something went wrong')
        return
      }

      onAdd(json.event as FulfillmentEvent, json.fulfillmentId ?? undefined)
      onClose()
    } catch {
      setError('Network error — please try again')
    } finally {
      setLoading(false)
    }
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
          {/* Stage (read-only) */}
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

          {/* Tracking number + carrier dropdown (in_transit only) */}
          {needsTracking && (
            <>
              <div>
                <label
                  htmlFor="carrier"
                  className="block text-[11px] uppercase tracking-wide mb-1.5"
                  style={{ color: 'var(--admin-text-muted)' }}
                >
                  Shipping carrier
                </label>
                <select
                  id="carrier"
                  value={carrier}
                  onChange={e => setCarrier(e.target.value)}
                  className="w-full h-9 px-3 text-[13px] rounded-md border focus:outline-none transition-colors appearance-none"
                  style={{
                    background: 'var(--admin-surface-2)',
                    borderColor: 'var(--admin-border)',
                    color: 'var(--admin-text)',
                  }}
                >
                  {CARRIERS.map(c => (
                    <option key={c.shopifyCode} value={c.shopifyCode}>
                      {c.name}
                    </option>
                  ))}
                </select>
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

          {/* Note */}
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

          {/* Notify customer */}
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={notifyCustomer}
              onChange={e => setNotifyCustomer(e.target.checked)}
              className="rounded"
            />
            <span className="text-[12px]" style={{ color: 'var(--admin-text-soft)' }}>
              Notify customer by email
            </span>
          </label>

          {/* Error */}
          {error && (
            <p className="text-[12px] text-red-500">{error}</p>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="h-9 px-4 text-[12px] rounded-md border transition-colors hover:bg-(--admin-surface-2) disabled:opacity-50"
              style={{ borderColor: 'var(--admin-border)', color: 'var(--admin-text-soft)' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="h-9 px-4 text-[12px] font-medium rounded-md transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ background: 'var(--admin-accent)', color: 'var(--admin-accent-text)' }}
            >
              {loading ? 'Saving…' : `Add — ${config.label}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
