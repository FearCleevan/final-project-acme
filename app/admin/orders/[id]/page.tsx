'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { BiArrowBack, BiCheck, BiPackage, BiPlus, BiPrinter } from 'react-icons/bi'
import { formatCurrency, formatDate, getNextFulfillmentStage } from '@/lib/admin/utils'
import PageHeader from '@/components/admin/shared/PageHeader'
import SectionCard from '@/components/admin/shared/SectionCard'
import Badge, { orderStatusVariant, paymentStatusVariant } from '@/components/admin/shared/Badge'
import FulfillmentTimeline from '@/components/admin/orders/FulfillmentTimeline'
import AddFulfillmentEventModal from '@/components/admin/orders/AddFulfillmentEventModal'
import OrderTimeline from '@/components/admin/orders/OrderTimeline'
import { AdminOrder, FulfillmentEvent } from '@/lib/admin/types'

export default function OrderDetailPage() {
  const { id }   = useParams<{ id: string }>()
  const router   = useRouter()

  const [order,         setOrder]         = useState<AdminOrder | null | undefined>(undefined)
  const [events,        setEvents]        = useState<FulfillmentEvent[]>([])
  const [fulfillmentId, setFulfillmentId] = useState<string | null>(null)
  const [showModal,     setShowModal]     = useState(false)
  const [printMode,     setPrintMode]     = useState<'invoice' | 'label' | null>(null)

  useEffect(() => {
    fetch(`/api/admin/orders/${encodeURIComponent(id)}`)
      .then(r => r.ok ? r.json() : null)
      .then((data: AdminOrder | null) => {
        setOrder(data)
        setEvents(data?.fulfillmentEvents ?? [])
        setFulfillmentId(data?.shopifyFulfillmentId ?? null)
      })
  }, [id])

  // Loading
  if (order === undefined) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-48 bg-(--admin-border) rounded" />
        <div className="h-4 w-32 bg-(--admin-border) rounded" />
        <div className="h-64 bg-(--admin-border) rounded-xl mt-6" />
      </div>
    )
  }

  // Not found
  if (order === null) {
    return (
      <div className="text-center py-24">
        <p className="text-[14px] text-(--admin-text-soft)">Order not found.</p>
        <button
          onClick={() => router.push('/admin/orders')}
          className="mt-4 text-[12px] text-(--admin-text-muted) hover:text-(--admin-text) transition-colors"
        >
          ← Back to orders
        </button>
      </div>
    )
  }

  const lastEvent       = events[events.length - 1]
  const isDelivered     = lastEvent?.status === 'delivered'
  const isCancelled     = order.fulfillmentStatus === 'cancelled'
  const canAddStage     = !isCancelled && !isDelivered && getNextFulfillmentStage(events.map(e => e.status)) !== null

  const currentFulfillment = isDelivered
    ? 'fulfilled'
    : isCancelled
    ? 'cancelled'
    : order.fulfillmentStatus

  function handleAddEvent(event: FulfillmentEvent, newFulfillmentId?: string) {
    setEvents(prev => [...prev, event])
    if (newFulfillmentId) setFulfillmentId(newFulfillmentId)
  }

  function triggerPrint(mode: 'invoice' | 'label') {
    setPrintMode(mode)
    setTimeout(() => {
      window.print()
      setTimeout(() => setPrintMode(null), 500)
    }, 150)
  }

  return (
    <div>
      <PageHeader
        title={order.id}
        subtitle={`Placed ${formatDate(order.date)}`}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => triggerPrint('label')}
              className="flex items-center gap-1.5 h-8 px-3 text-[12px] text-(--admin-text-soft) bg-(--admin-surface-2) border border-(--admin-border) rounded-md hover:bg-(--admin-border) transition-colors"
            >
              <BiPrinter size={14} /> Shipping Label
            </button>
            <button
              onClick={() => triggerPrint('invoice')}
              className="flex items-center gap-1.5 h-8 px-3 text-[12px] text-(--admin-text-soft) bg-(--admin-surface-2) border border-(--admin-border) rounded-md hover:bg-(--admin-border) transition-colors"
            >
              <BiPrinter size={14} /> Invoice
            </button>
            <button
              onClick={() => router.push('/admin/orders')}
              className="flex items-center gap-1.5 h-8 px-3 text-[12px] text-(--admin-text-soft) bg-(--admin-surface-2) border border-(--admin-border) rounded-md hover:bg-(--admin-border) transition-colors"
            >
              <BiArrowBack size={14} /> Back
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Left — line items + totals */}
        <div className="lg:col-span-2 space-y-4">
          <SectionCard noPadding>
            <div className="px-5 py-4 border-b border-(--admin-border)">
              <p className="text-[13px] font-semibold text-(--admin-text)">Line Items</p>
            </div>
            <div className="divide-y divide-(--admin-border)">
              {order.items.map(item => (
                <div key={item.id} className="flex items-center gap-4 px-5 py-3.5">
                  <div className="w-10 h-10 rounded-md bg-(--admin-surface-2) border border-(--admin-border) shrink-0 flex items-center justify-center overflow-hidden">
                    {item.image
                      ? <img src={item.image} alt="" className="w-full h-full object-cover" />
                      : <BiPackage size={16} className="text-(--admin-text-muted)" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-(--admin-text) truncate">{item.title}</p>
                    <p className="text-[11px] text-(--admin-text-muted) mt-0.5">
                      {item.sku ? `SKU: ${item.sku} · ` : ''}Qty: {item.quantity}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[13px] font-semibold text-(--admin-text)">{formatCurrency(item.unitPrice * item.quantity)}</p>
                    <p className="text-[11px] text-(--admin-text-muted) mt-0.5">{formatCurrency(item.unitPrice)} each</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="px-5 py-4 border-t border-(--admin-border) space-y-2">
              {[
                { label: 'Subtotal', value: order.subtotal },
                { label: 'Shipping', value: order.shipping },
                { label: 'Tax',      value: order.tax },
              ].map(row => (
                <div key={row.label} className="flex justify-between text-[13px]">
                  <span className="text-(--admin-text-soft)">{row.label}</span>
                  <span className="text-(--admin-text)">{formatCurrency(row.value)}</span>
                </div>
              ))}
              <div className="flex justify-between text-[14px] font-semibold pt-2 border-t border-(--admin-border)">
                <span className="text-(--admin-text)">Total</span>
                <span className="text-(--admin-text)">{formatCurrency(order.total)}</span>
              </div>
            </div>
          </SectionCard>

          {/* Order Timeline */}
          <SectionCard>
            <p className="text-[12px] font-semibold text-(--admin-text) mb-4">Timeline</p>
            <OrderTimeline order={order} events={events} />
          </SectionCard>
        </div>

        {/* Right column */}
        <div className="space-y-4">

          {/* Status */}
          <SectionCard>
            <p className="text-[12px] font-semibold text-(--admin-text) mb-3">Order Status</p>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-(--admin-text-soft)">Payment</span>
                <Badge label={order.paymentStatus} variant={paymentStatusVariant(order.paymentStatus)} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-(--admin-text-soft)">Fulfillment</span>
                <Badge label={currentFulfillment} variant={orderStatusVariant(currentFulfillment)} />
              </div>
              {order.trackingRef && (
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-(--admin-text-soft)">Tracking</span>
                  <span className="text-[11px] text-(--admin-text-muted)">{order.trackingRef}</span>
                </div>
              )}
            </div>
            {isDelivered && (
              <div className="mt-4 flex items-center gap-2 text-[12px] text-(--admin-green)">
                <BiCheck size={14} />
                <span>Delivered</span>
              </div>
            )}
          </SectionCard>

          {/* Fulfillment Timeline */}
          <SectionCard>
            <div className="flex items-center justify-between mb-4">
              <p className="text-[12px] font-semibold text-(--admin-text)">Shipment Timeline</p>
              {canAddStage && (
                <button
                  onClick={() => setShowModal(true)}
                  className="flex items-center gap-1 h-7 px-2.5 text-[11px] text-(--admin-text-soft) bg-(--admin-surface-2) border border-(--admin-border) rounded-md hover:bg-(--admin-border) transition-colors"
                >
                  <BiPlus size={12} /> Add stage
                </button>
              )}
            </div>
            <FulfillmentTimeline events={events} fulfillmentStatus={order.fulfillmentStatus} />
            {order.estimatedDelivery && !isDelivered && !isCancelled && (
              <p className="text-[10px] text-(--admin-text-muted) mt-4 pt-3 border-t border-(--admin-border)">
                Est. delivery: {formatDate(order.estimatedDelivery)}
              </p>
            )}
          </SectionCard>

          {/* Customer */}
          <SectionCard>
            <p className="text-[12px] font-semibold text-(--admin-text) mb-3">Customer</p>
            <div className="space-y-1.5">
              <p className="text-[13px] font-medium text-(--admin-text)">{order.customer.name}</p>
              <p className="text-[12px] text-(--admin-text-soft)">{order.customer.email}</p>
              {order.customer.phone && (
                <p className="text-[12px] text-(--admin-text-soft)">{order.customer.phone}</p>
              )}
            </div>
          </SectionCard>

          {/* Shipping Address */}
          <SectionCard>
            <p className="text-[12px] font-semibold text-(--admin-text) mb-3">Shipping Address</p>
            <div className="text-[12px] text-(--admin-text-soft) space-y-0.5">
              <p>{order.customer.name}</p>
              {order.customer.address && <p>{order.customer.address}</p>}
              <p>{[order.customer.city, order.customer.province].filter(Boolean).join(', ')}</p>
              <p>{order.customer.country}</p>
            </div>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                [order.customer.address, order.customer.city, order.customer.province, order.customer.country]
                  .filter(Boolean).join(', ')
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-2 text-[11px] transition-opacity hover:opacity-70"
              style={{ color: 'var(--admin-accent)' }}
            >
              View map
            </a>
          </SectionCard>

          {/* Summary */}
          <SectionCard>
            <p className="text-[12px] font-semibold text-(--admin-text) mb-3">Summary</p>
            <div className="space-y-1.5 text-[12px]">
              <div className="flex justify-between">
                <span className="text-(--admin-text-soft)">Items</span>
                <span className="text-(--admin-text)">{order.items.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-(--admin-text-soft)">Total</span>
                <span className="font-semibold text-(--admin-text)">{formatCurrency(order.total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-(--admin-text-soft)">Date</span>
                <span className="text-(--admin-text)">{formatDate(order.date)}</span>
              </div>
            </div>
          </SectionCard>

        </div>
      </div>

      {showModal && (
        <AddFulfillmentEventModal
          order={order}
          events={events}
          fulfillmentId={fulfillmentId}
          onAdd={handleAddEvent}
          onClose={() => setShowModal(false)}
        />
      )}

      {/* ── Print layouts (hidden on screen, visible only when printing) ── */}
      {printMode === 'label' && (
        <div className="hidden print:block fixed inset-0 bg-white p-10 z-9999" style={{ fontFamily: 'Georgia, serif' }}>
          {/* FROM */}
          <div style={{ fontSize: 13, color: '#555', marginBottom: 32 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#000', marginBottom: 4 }}>ACME VINTAGE SUPPLY</div>
            <div>25 Raddall Ave</div>
            <div>Dartmouth, NS  B3B 1L4</div>
            <div>Canada</div>
          </div>

          <div style={{ borderTop: '2px solid #000', marginBottom: 32 }} />

          {/* SHIP TO */}
          <div style={{ marginBottom: 40 }}>
            <div style={{ fontSize: 11, letterSpacing: 2, color: '#555', marginBottom: 10 }}>SHIP TO:</div>
            <div style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.2, textTransform: 'uppercase' }}>
              {order.customer.name}
            </div>
            {order.customer.address && (
              <div style={{ fontSize: 22, marginTop: 6 }}>{order.customer.address}</div>
            )}
            <div style={{ fontSize: 22 }}>
              {[order.customer.city, order.customer.province].filter(Boolean).join(', ')}
              {order.customer.country ? ` — ${order.customer.country}` : ''}
            </div>
          </div>

          <div style={{ borderTop: '2px solid #000', marginBottom: 24 }} />

          {/* Order info + fragile notice */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <div style={{ fontSize: 13, color: '#555' }}>ORDER</div>
              <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: 1 }}>{order.id}</div>
              <div style={{ fontSize: 13, color: '#555', marginTop: 4 }}>
                {order.items.length} {order.items.length === 1 ? 'ITEM' : 'ITEMS'}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 14, fontWeight: 700, border: '2px solid #000', padding: '6px 14px', letterSpacing: 1 }}>
                ⚠ FRAGILE — STRAW-PACKED CRATE
              </div>
            </div>
          </div>
        </div>
      )}

      {printMode === 'invoice' && (
        <div className="hidden print:block fixed inset-0 bg-white p-10 z-9999" style={{ fontFamily: 'Georgia, serif', fontSize: 13 }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>ACME VINTAGE SUPPLY</div>
              <div style={{ color: '#555', marginTop: 4 }}>25 Raddall Ave, Dartmouth, NS  B3B 1L4</div>
              <div style={{ color: '#555' }}>hello@acmevintagesupply.ca</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>INVOICE</div>
              <div style={{ color: '#555', marginTop: 4 }}>{order.id}</div>
              <div style={{ color: '#555' }}>{formatDate(order.date)}</div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid #ccc', marginBottom: 24 }} />

          {/* Bill to */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 10, letterSpacing: 2, color: '#888', marginBottom: 6 }}>BILL TO / SHIP TO</div>
            <div style={{ fontWeight: 600 }}>{order.customer.name}</div>
            {order.customer.address && <div>{order.customer.address}</div>}
            <div>{[order.customer.city, order.customer.province].filter(Boolean).join(', ')}</div>
            <div>{order.customer.country}</div>
            {order.customer.email && <div style={{ color: '#555', marginTop: 4 }}>{order.customer.email}</div>}
          </div>

          {/* Line items table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #000' }}>
                <th style={{ textAlign: 'left', padding: '6px 0', fontSize: 10, letterSpacing: 1, color: '#888' }}>ITEM</th>
                <th style={{ textAlign: 'center', padding: '6px 0', fontSize: 10, letterSpacing: 1, color: '#888' }}>QTY</th>
                <th style={{ textAlign: 'right', padding: '6px 0', fontSize: 10, letterSpacing: 1, color: '#888' }}>UNIT PRICE</th>
                <th style={{ textAlign: 'right', padding: '6px 0', fontSize: 10, letterSpacing: 1, color: '#888' }}>TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map(item => (
                <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '10px 0' }}>
                    <div>{item.title}</div>
                    {item.sku && <div style={{ fontSize: 11, color: '#888' }}>SKU: {item.sku}</div>}
                  </td>
                  <td style={{ textAlign: 'center', padding: '10px 0' }}>{item.quantity}</td>
                  <td style={{ textAlign: 'right', padding: '10px 0' }}>{formatCurrency(item.unitPrice)}</td>
                  <td style={{ textAlign: 'right', padding: '10px 0' }}>{formatCurrency(item.unitPrice * item.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ width: 260 }}>
              {[
                { label: 'Subtotal', value: order.subtotal },
                { label: 'Shipping', value: order.shipping },
                { label: 'Tax',      value: order.tax },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#555' }}>
                  <span>{row.label}</span>
                  <span>{formatCurrency(row.value)}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '2px solid #000', fontWeight: 700, fontSize: 15, marginTop: 4 }}>
                <span>TOTAL</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
              <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>
                Payment: {order.paymentStatus.toUpperCase()}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ borderTop: '1px solid #ccc', marginTop: 48, paddingTop: 16, fontSize: 11, color: '#888', textAlign: 'center' }}>
            Thank you for your order. For returns or questions, contact hello@acmevintagesupply.ca · 30-day returns on whole pieces.
          </div>
        </div>
      )}
    </div>
  )
}
