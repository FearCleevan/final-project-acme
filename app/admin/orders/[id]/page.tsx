'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { BiArrowBack, BiCheck, BiPackage, BiPlus } from 'react-icons/bi'
import { formatCurrency, formatDate, getNextFulfillmentStage } from '@/lib/admin/utils'
import PageHeader from '@/components/admin/shared/PageHeader'
import SectionCard from '@/components/admin/shared/SectionCard'
import Badge, { orderStatusVariant, paymentStatusVariant } from '@/components/admin/shared/Badge'
import FulfillmentTimeline from '@/components/admin/orders/FulfillmentTimeline'
import AddFulfillmentEventModal from '@/components/admin/orders/AddFulfillmentEventModal'
import { AdminOrder, FulfillmentEvent } from '@/lib/admin/types'

export default function OrderDetailPage() {
  const { id }   = useParams<{ id: string }>()
  const router   = useRouter()

  const [order,       setOrder]       = useState<AdminOrder | null | undefined>(undefined)
  const [events,      setEvents]      = useState<FulfillmentEvent[]>([])
  const [notes,       setNotes]       = useState('')
  const [showModal,   setShowModal]   = useState(false)

  useEffect(() => {
    fetch(`/api/admin/orders/${encodeURIComponent(id)}`)
      .then(r => r.ok ? r.json() : null)
      .then((data: AdminOrder | null) => {
        setOrder(data)
        setEvents(data?.fulfillmentEvents ?? [])
        setNotes(data?.notes ?? '')
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

  function handleAddEvent(event: FulfillmentEvent) {
    setEvents(prev => [...prev, event])
  }

  return (
    <div>
      <PageHeader
        title={order.id}
        subtitle={`Placed ${formatDate(order.date)}`}
        actions={
          <button
            onClick={() => router.push('/admin/orders')}
            className="flex items-center gap-1.5 h-8 px-3 text-[12px] text-(--admin-text-soft) bg-(--admin-surface-2) border border-(--admin-border) rounded-md hover:bg-(--admin-border) transition-colors"
          >
            <BiArrowBack size={14} /> Back
          </button>
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

          {/* Internal Notes */}
          <SectionCard>
            <p className="text-[12px] font-semibold text-(--admin-text) mb-2">Internal Notes</p>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              placeholder="Add a note visible only to you…"
              className="w-full px-3 py-2 text-[12px] text-(--admin-text) bg-(--admin-surface-2) border border-(--admin-border) rounded-md resize-none focus:outline-none focus:border-(--admin-accent) focus:ring-1 focus:ring-(--admin-accent)/20 placeholder:text-(--admin-text-muted) transition-colors"
            />
            <p className="text-[10px] text-(--admin-text-muted) mt-1.5">Notes are local to this session — syncing to Shopify order notes coming in a future sprint.</p>
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
          onAdd={handleAddEvent}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}
