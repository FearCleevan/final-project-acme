'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { formatCurrency, formatDate } from '@/lib/admin/utils'
import { AdminCustomer, AdminOrder } from '@/lib/admin/types'
import PageHeader from '@/components/admin/shared/PageHeader'
import SectionCard from '@/components/admin/shared/SectionCard'
import Badge, { orderStatusVariant, paymentStatusVariant } from '@/components/admin/shared/Badge'
import { BiArrowBack, BiEnvelope, BiPhone, BiMap } from 'react-icons/bi'

export default function CustomerDetailPage() {
  const { id }  = useParams<{ id: string }>()
  const router  = useRouter()

  const [customer, setCustomer] = useState<AdminCustomer | null>(null)
  const [orders,   setOrders]   = useState<AdminOrder[]>([])
  const [loading,  setLoading]  = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    fetch(`/api/admin/customers/${id}`)
      .then(r => {
        if (r.status === 404) { setNotFound(true); setLoading(false); return null }
        return r.json()
      })
      .then(d => {
        if (!d) return
        setCustomer(d.customer)
        setOrders(d.orders ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div>
        <PageHeader title="Customer" subtitle="Loading…" />
        <div className="animate-pulse space-y-4">
          <div className="h-48 rounded-lg bg-(--admin-surface-2)" />
          <div className="h-64 rounded-lg bg-(--admin-surface-2)" />
        </div>
      </div>
    )
  }

  if (notFound || !customer) {
    return (
      <div className="text-center py-24">
        <p className="text-[14px] text-(--admin-text-soft)">Customer not found.</p>
        <button
          onClick={() => router.push('/admin/customers')}
          className="mt-4 text-[12px] text-(--admin-text-muted) hover:text-(--admin-text) transition-colors"
        >
          ← Back to customers
        </button>
      </div>
    )
  }

  const avgOrder = orders.length > 0 ? customer.totalSpent / orders.length : 0

  return (
    <div>
      <PageHeader
        title={customer.name}
        subtitle={customer.email}
        actions={
          <button
            onClick={() => router.push('/admin/customers')}
            className="flex items-center gap-1.5 h-8 px-3 text-[12px] text-(--admin-text-soft) bg-(--admin-surface-2) border border-(--admin-border) rounded-md hover:bg-(--admin-border) transition-colors"
          >
            <BiArrowBack size={14} /> Back
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* ── Left column ── */}
        <div className="space-y-4">

          {/* Contact */}
          <SectionCard>
            <p className="text-[12px] font-semibold text-(--admin-text) mb-4">Contact</p>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <BiEnvelope size={14} className="text-(--admin-text-muted) mt-0.5 shrink-0" />
                <div>
                  <p className="text-[11px] text-(--admin-text-muted) mb-0.5">Email</p>
                  <a
                    href={`mailto:${customer.email}`}
                    className="text-[13px] text-(--admin-text) hover:text-(--admin-accent) transition-colors"
                  >
                    {customer.email}
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <BiPhone size={14} className="text-(--admin-text-muted) mt-0.5 shrink-0" />
                <div>
                  <p className="text-[11px] text-(--admin-text-muted) mb-0.5">Phone</p>
                  <p className="text-[13px] text-(--admin-text)">{customer.phone || '—'}</p>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Address */}
          <SectionCard>
            <div className="flex items-center gap-2 mb-4">
              <BiMap size={13} className="text-(--admin-text-muted)" />
              <p className="text-[12px] font-semibold text-(--admin-text)">Default Address</p>
            </div>
            <address className="not-italic space-y-0.5">
              <p className="text-[13px] text-(--admin-text)">{customer.name}</p>
              <p className="text-[13px] text-(--admin-text-soft)">{customer.address || '—'}</p>
              <p className="text-[13px] text-(--admin-text-soft)">{customer.city}{customer.province ? `, ${customer.province}` : ''}</p>
              <p className="text-[13px] text-(--admin-text-soft)">{customer.country}</p>
            </address>
          </SectionCard>

          {/* Account */}
          <SectionCard>
            <p className="text-[12px] font-semibold text-(--admin-text) mb-4">Account</p>
            <div className="space-y-3">
              {[
                { label: 'Customer ID',  value: customer.id },
                { label: 'Member since', value: formatDate(customer.joined) },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between">
                  <span className="text-[12px] text-(--admin-text-muted)">{row.label}</span>
                  <span className="text-[12px] text-(--admin-text)">{row.value}</span>
                </div>
              ))}
            </div>
          </SectionCard>

        </div>

        {/* ── Right column (2/3) ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Orders',         value: customer.orders },
              { label: 'Lifetime Value', value: customer.totalSpent > 0 ? formatCurrency(customer.totalSpent) : '—' },
              { label: 'Avg. Order',     value: avgOrder > 0 ? formatCurrency(avgOrder) : '—' },
            ].map(stat => (
              <SectionCard key={stat.label} className="py-3 px-4">
                <p className="text-[11px] font-medium uppercase tracking-wider text-(--admin-text-muted) mb-1">{stat.label}</p>
                <p className="text-[22px] font-semibold text-(--admin-text) leading-none">{stat.value}</p>
              </SectionCard>
            ))}
          </div>

          {/* Order history */}
          <SectionCard noPadding>
            <div className="px-5 py-4 border-b border-(--admin-border)">
              <p className="text-[13px] font-semibold text-(--admin-text)">
                Order History
                <span className="ml-2 text-[11px] font-normal text-(--admin-text-muted)">
                  {orders.length} order{orders.length !== 1 ? 's' : ''}
                </span>
              </p>
            </div>

            {orders.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-[13px] text-(--admin-text-soft)">No orders yet</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-(--admin-border)">
                    {['Order', 'Date', 'Items', 'Total', 'Payment', 'Fulfillment'].map(h => (
                      <th key={h} className="px-5 py-3 text-[11px] font-medium uppercase tracking-wider text-(--admin-text-muted) whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => (
                    <tr
                      key={order.id}
                      onClick={() => router.push(`/admin/orders/${order.id.replace('#', '')}`)}
                      className="border-b border-(--admin-border) last:border-0 hover:bg-(--admin-surface-2) cursor-pointer transition-colors"
                    >
                      <td className="px-5 py-3">
                        <span className="text-[12px] font-medium text-(--admin-text)">{order.id}</span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-[12px] text-(--admin-text-soft)">{formatDate(order.date)}</span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-[12px] text-(--admin-text-soft)">{order.items.length}</span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-[13px] font-semibold text-(--admin-text)">{formatCurrency(order.total)}</span>
                      </td>
                      <td className="px-5 py-3">
                        <Badge label={order.paymentStatus} variant={paymentStatusVariant(order.paymentStatus)} />
                      </td>
                      <td className="px-5 py-3">
                        <Badge label={order.fulfillmentStatus} variant={orderStatusVariant(order.fulfillmentStatus)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </SectionCard>

        </div>
      </div>
    </div>
  )
}
