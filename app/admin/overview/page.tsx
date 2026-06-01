import Link from 'next/link'
import {
  BiDollar,
  BiCart,
  BiTrendingUp,
  BiPulse,
  BiPackage,
  BiLinkExternal,
} from 'react-icons/bi'
import {
  mockRevenueStats,
  mockOrderCount,
  mockSessionCount,
  mockConversionRate,
  mockOrders,
  mockInventoryAlerts,
  mockAbandonedCheckouts,
} from '@/lib/admin/mockData'
import { formatCurrency, formatDate, formatRelativeTime } from '@/lib/admin/utils'
import StatCard from '@/components/admin/shared/StatCard'
import SectionCard from '@/components/admin/shared/SectionCard'
import Badge, { orderStatusVariant, paymentStatusVariant } from '@/components/admin/shared/Badge'
import PageHeader from '@/components/admin/shared/PageHeader'
import RevenueChart from '@/components/admin/charts/RevenueChart'
import OrdersChart from '@/components/admin/charts/OrdersChart'
import TopProductsTable from '@/components/admin/charts/TopProductsTable'

const recentOrders = mockOrders.slice(0, 8)

export default function OverviewPage() {
  return (
    <div>
      <PageHeader
        title="Overview"
        subtitle={`${new Date().toLocaleDateString('en-CA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} - Demo Data`}
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Revenue"
          value={formatCurrency(mockRevenueStats.month)}
          change={mockRevenueStats.monthChange}
          period="Last 30 days"
          icon={<BiDollar size={16} />}
        />
        <StatCard
          label="Orders"
          value={String(mockOrderCount.month)}
          change={5}
          period="Last 30 days"
          icon={<BiCart size={16} />}
        />
        <StatCard
          label="Sessions"
          value={mockSessionCount.week.toLocaleString()}
          change={mockSessionCount.weekChange}
          period="Last 7 days"
          icon={<BiTrendingUp size={16} />}
        />
        <StatCard
          label="Conversion"
          value={`${mockConversionRate.value}%`}
          change={mockConversionRate.change}
          period="Last 30 days"
          icon={<BiPulse size={16} />}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <SectionCard className="lg:col-span-2">
          <RevenueChart />
        </SectionCard>
        <SectionCard>
          <OrdersChart />
        </SectionCard>
      </div>

      {/* Bottom row: recent orders + right column */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Recent Orders */}
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
            {recentOrders.map(order => (
              <Link
                key={order.id}
                href={`/admin/orders/${order.id}`}
                className="flex items-center gap-4 px-5 py-3 hover:bg-(--admin-surface-2) transition-colors group"
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

        {/* Right column */}
        <div className="space-y-4">

          {/* Low Stock */}
          <SectionCard noPadding>
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-(--admin-border)">
              <p className="text-[13px] font-semibold text-(--admin-text)">Low Stock</p>
              <Link
                href="/admin/inventory"
                className="text-[11px] text-(--admin-text-muted) hover:text-(--admin-text) transition-colors"
              >
                Manage
              </Link>
            </div>
            {mockInventoryAlerts.length === 0 ? (
              <p className="px-4 py-4 text-[12px] text-(--admin-text-soft)">All items in stock.</p>
            ) : (
              <div className="divide-y divide-(--admin-border)">
                {mockInventoryAlerts.map(p => (
                  <Link
                    key={p.id}
                    href={`/admin/products/${p.id}`}
                    className="flex items-center justify-between px-4 py-3 hover:bg-(--admin-surface-2) transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] text-(--admin-text) truncate">{p.title}</p>
                      <p className="text-[10px] text-(--admin-text-muted) mt-0.5">{p.sku}</p>
                    </div>
                    <span className={`ml-3 shrink-0 text-[11px] font-semibold ${p.stock === 0 ? 'text-(--admin-red)' : 'text-(--admin-amber)'}`}>
                      {p.stock === 0 ? 'Out' : `${p.stock} left`}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </SectionCard>

          {/* Top Products */}
          <SectionCard>
            <TopProductsTable />
          </SectionCard>

          {/* Abandoned Checkouts */}
          <SectionCard noPadding>
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-(--admin-border)">
              <div>
                <p className="text-[13px] font-semibold text-(--admin-text)">Abandoned Checkouts</p>
                <p className="text-[10px] text-(--admin-text-muted) mt-0.5">
                  {mockAbandonedCheckouts.length} pending
                </p>
              </div>
              <BiPackage size={15} className="text-(--admin-text-muted)" />
            </div>
            <div className="divide-y divide-(--admin-border)">
              {mockAbandonedCheckouts.map(a => (
                <div key={a.id} className="flex items-center justify-between px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] text-(--admin-text) truncate">
                      {a.customer}{a.email ? ` — ${a.email}` : ''}
                    </p>
                    <p className="text-[10px] text-(--admin-text-muted) mt-0.5">
                      {formatRelativeTime(a.abandonedAt)} · {a.items} {a.items === 1 ? 'item' : 'items'}
                    </p>
                  </div>
                  <span className="ml-3 shrink-0 text-[12px] font-semibold text-(--admin-text)">
                    {formatCurrency(a.value)}
                  </span>
                </div>
              ))}
            </div>
          </SectionCard>

        </div>
      </div>
    </div>
  )
}
