export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 60)  return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

export function formatChange(change: number): string {
  return change >= 0 ? `+${change}%` : `${change}%`
}

export function isPositiveChange(change: number): boolean {
  return change >= 0
}

export function formatTrackingDate(iso: string): string {
  const d = new Date(iso)
  const day = d.getDate()
  const month = d.toLocaleString('en-CA', { month: 'short' }).toUpperCase()
  const year = d.getFullYear()
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  return `${day} ${month} ${year} · ${h}:${m}`
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

import type { FulfillmentEventStatus } from './types'

export const FULFILLMENT_STAGE_ORDER: FulfillmentEventStatus[] = [
  'confirmed',
  'label_printed',
  'in_transit',
  'out_for_delivery',
  'delivered',
]

export const FULFILLMENT_STAGE_CONFIG: Record<
  FulfillmentEventStatus,
  { label: string; defaultDetail: string }
> = {
  confirmed:          { label: 'Order confirmed',      defaultDetail: 'Payment verified, packing begins.' },
  label_printed:      { label: 'Packed at workshop',   defaultDetail: 'Straw-packed and hand-numbered by our bench team.' },
  in_transit:         { label: 'Shipped',              defaultDetail: 'Collected by carrier.' },
  out_for_delivery:   { label: 'Out for delivery',     defaultDetail: 'Package is with the delivery driver.' },
  delivered:          { label: 'Delivered',            defaultDetail: 'Package delivered.' },
  attempted_delivery: { label: 'Delivery attempted',   defaultDetail: 'Delivery was attempted — redelivery arranged.' },
  failure:            { label: 'Delivery issue',       defaultDetail: 'There was an issue with delivery. Contact us for assistance.' },
}

export function getNextFulfillmentStage(
  currentStatuses: FulfillmentEventStatus[]
): FulfillmentEventStatus | null {
  const lastDone = [...currentStatuses].reverse().find(s => FULFILLMENT_STAGE_ORDER.includes(s))
  if (!lastDone) return FULFILLMENT_STAGE_ORDER[0]
  const idx = FULFILLMENT_STAGE_ORDER.indexOf(lastDone)
  return idx < FULFILLMENT_STAGE_ORDER.length - 1 ? FULFILLMENT_STAGE_ORDER[idx + 1] : null
}

export function collectionLabel(handle: string): string {
  const map: Record<string, string> = {
    'oil-lamp-chimneys':       'Chimneys',
    'oil-lamp-shades':         'Shades',
    'oil-lamp-pressure-lamps': 'Pressure Lamps',
    'oil-lamp-books':          'Books',
    'oil-lamp-spreaders':      'Spreaders',
    'oil-lamp-wicks':          'Wicks',
  }
  return map[handle] ?? handle
}
