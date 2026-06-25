import Link from 'next/link'
import { BiLinkExternal } from 'react-icons/bi'
import SectionCard from '@/components/admin/shared/SectionCard'
import Badge, { orderStatusVariant, paymentStatusVariant } from '@/components/admin/shared/Badge'
import { getAdminOrders } from '@/lib/admin/shopifyAdmin'
import { formatCurrency, formatDate } from '@/lib/admin/utils'

export default async function RecentOrders() {
  const orders = await getAdminOrders(8)

  return (
    <SectionCard noPadding className="lg:col-span-2">
      <div className="flex items-center justify-between px-5 py-4 border-b border-(--admin-border)">
        <p className="text-[13px] font-semibold text-(--admin-text)">Recent Orders</p>
        <Link
          href="/admin/orders"
          className="flex items-center gap-1 text-[11px] text-(--admin-text-muted) hover:text-(--admin-text) transition-colors"
        >
          View all <BiLinkExternal size={11} />
        </Link>
      </div>
      <div className="divide-y divide-(--admin-border)">
        {orders.length === 0 ? (
          <p className="px-5 py-4 text-[12px] text-(--admin-text-soft)">No orders yet.</p>
        ) : orders.map(order => (
          <Link
            key={order.id}
            href={`/admin/orders/${order.id}`}
            className="flex items-center gap-4 px-5 py-3 hover:bg-(--admin-surface-2) transition-colors"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-[12px] font-medium text-(--admin-text)">{order.id}</p>
                <Badge label={order.fulfillmentStatus} variant={orderStatusVariant(order.fulfillmentStatus)} />
              </div>
              <p className="text-[11px] text-(--admin-text-soft) mt-0.5 truncate">
                {order.customer.name} · {formatDate(order.date)}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[12px] font-semibold text-(--admin-text)">{formatCurrency(order.total)}</p>
              <Badge label={order.paymentStatus} variant={paymentStatusVariant(order.paymentStatus)} className="mt-0.5" />
            </div>
          </Link>
        ))}
      </div>
    </SectionCard>
  )
}
