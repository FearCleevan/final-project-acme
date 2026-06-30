'use client'

import { BiCheck } from 'react-icons/bi'
import { FulfillmentEvent, FulfillmentEventStatus, OrderStatus } from '@/lib/admin/types'
import {
  FULFILLMENT_STAGE_ORDER,
  FULFILLMENT_STAGE_CONFIG,
  formatTrackingDate,
} from '@/lib/admin/utils'

interface Props {
  events: FulfillmentEvent[]
  fulfillmentStatus: OrderStatus
}

export default function FulfillmentTimeline({ events, fulfillmentStatus }: Props) {
  const doneStatuses = new Set(events.map(e => e.status))
  const lastDone = events.length > 0 ? events[events.length - 1].status : null

  const isCancelled = fulfillmentStatus === 'cancelled'

  const stages = isCancelled
    ? events.map(e => e.status)
    : FULFILLMENT_STAGE_ORDER

  const getEvent = (status: FulfillmentEventStatus) =>
    events.find(e => e.status === status)

  return (
    <ol className="relative ml-2 space-y-0">
      {stages.map((status, i) => {
        const done    = doneStatuses.has(status)
        const current = status === lastDone
        const event   = getEvent(status)
        const config  = FULFILLMENT_STAGE_CONFIG[status]
        const isLast  = i === stages.length - 1

        return (
          <li key={status} className="relative pl-7 pb-5 last:pb-0">
            {/* Vertical connector line */}
            {!isLast && (
              <span
                className="absolute left-2.25 top-4.5 bottom-0 w-px"
                style={{ background: done ? 'var(--admin-accent)' : 'var(--admin-border)' }}
                aria-hidden="true"
              />
            )}

            {/* Dot */}
            <span
              className="absolute left-0 top-0.5 w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center shrink-0"
              style={{
                background:   current ? 'var(--admin-accent)' : done ? 'var(--admin-surface)' : 'var(--admin-surface-2)',
                borderColor:  done    ? 'var(--admin-accent)' : 'var(--admin-border)',
              }}
              aria-hidden="true"
            >
              {done && (
                <BiCheck
                  size={10}
                  style={{ color: current ? 'var(--admin-accent-text)' : 'var(--admin-accent)' }}
                />
              )}
            </span>

            {/* Content */}
            <div>
              <p
                className="text-[13px] font-medium leading-snug"
                style={{ color: done ? 'var(--admin-text)' : 'var(--admin-text-muted)' }}
              >
                {config.label}
              </p>

              {event ? (
                <>
                  <p className="text-[12px] mt-0.5" style={{ color: 'var(--admin-text-soft)' }}>
                    {event.message || config.defaultDetail}
                  </p>
                  {event.trackingNumber && (
                    <p className="text-[11px] mt-0.5" style={{ color: 'var(--admin-text-muted)' }}>
                      {event.carrier && <>{event.carrier} · </>}
                      {event.trackingNumber}
                    </p>
                  )}
                  <time
                    className="text-[10px] uppercase tracking-wide mt-0.5 block"
                    style={{ color: 'var(--admin-text-muted)' }}
                  >
                    {formatTrackingDate(event.happenedAt)}
                  </time>
                </>
              ) : (
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--admin-text-muted)' }}>
                  Pending
                </p>
              )}
            </div>
          </li>
        )
      })}

      {isCancelled && (
        <li className="pl-7 pt-1">
          <p className="text-[11px]" style={{ color: 'var(--admin-red)' }}>
            Order cancelled — no further stages.
          </p>
        </li>
      )}
    </ol>
  )
}
