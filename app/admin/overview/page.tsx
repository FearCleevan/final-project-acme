import Link from 'next/link'
import {
  BiDollar,
  BiCart,
  BiTrendingUp,
  BiPulse,
  BiPackage,
  BiLinkExternal,
} from 'react-icons/bi'
import { getAdminAnalytics, getAdminOrders, getAdminProducts } from '@/lib/admin/shopifyAdmin'
import { formatCurrency, formatDate } from '@/lib/admin/utils'
import StatCard from '@/components/admin/shared/StatCard'
import SectionCard from '@/components/admin/shared/SectionCard'
import Badge, { orderStatusVariant, paymentStatusVariant } from '@/components/admin/shared/Badge'
import PageHeader from '@/components/admin/shared/PageHeader'
import RevenueChart from '@/components/admin/charts/RevenueChart'
import OrdersChart from '@/components/admin/charts/OrdersChart'
import TopProductsTable from '@/components/admin/charts/TopProductsTable'

export default async function OverviewPage() {
  const [analytics, recentOrders, products] = await Promise.all([
    getAdminAnalytics(),
    getAdminOrders(8),
    getAdminProducts(),
  ])

  const lowStockItems = products
    .filter(p => p.stock <= 3)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 6)

  const dateLabel = new Date().toLocaleDateString('en-CA', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <div>
      <PageHeader
        title="Overview"
        subtitle={`${dateLabel} — Live Data`}
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Revenue"
          value={formatCurrency(analytics.revenue.month)}
          change={analytics.revenue.monthChange}
          period="Last 30 days"
          icon={<BiDollar size={16} />}
        />
        <StatCard
          label="Orders"
          value={String(analytics.orderCount.month)}
          change={0}
          period="Last 30 days"
          icon={<BiCart size={16} />}
        />
        <StatCard
          label="Customers"
          value={String(analytics.customers.total)}
          change={analytics.customers.returningRate}
          period={`${analytics.customers.repeat} repeat`}
          icon={<BiTrendingUp size={16} />}
        />
        <StatCard
          label="Avg. Order"
          value={formatCurrency(analytics.avgOrderValue)}
          change={0}
          period="All time"
          icon={<BiPulse size={16} />}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <SectionCard className="lg:col-span-2">
          <RevenueChart data={analytics.chartData} />
        </SectionCard>
        <SectionCard>
          <OrdersChart data={analytics.chartData} />
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
            {recentOrders.length === 0 ? (
              <p className="px-5 py-4 text-[12px] text-(--admin-text-soft)">No orders yet.</p>
            ) : recentOrders.map(order => (
              <Link
                key={order.id}
                href={`/admin/orders/${order.id}`}
                className="flex items-center gap-4 px-5 py-3 hover:bg-(--admin-surface-2) transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[12px] font-medium text-(--admin-text)"> Order Number: {order.id}</p>
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
            {lowStockItems.length === 0 ? (
              <p className="px-4 py-4 text-[12px] text-(--admin-text-soft)">All items in stock.</p>
            ) : (
              <div className="divide-y divide-(--admin-border)">
                {lowStockItems.map(p => (
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
            <TopProductsTable products={analytics.topProducts} />
          </SectionCard>

          {/* Summary Stats */}
          <SectionCard noPadding>
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-(--admin-border)">
              <p className="text-[13px] font-semibold text-(--admin-text)">All-Time Summary</p>
              <BiPackage size={15} className="text-(--admin-text-muted)" />
            </div>
            <div className="divide-y divide-(--admin-border)">
              {[
                { label: 'Total Orders',    value: String(analytics.totalOrders) },
                { label: 'Total Revenue',   value: formatCurrency(analytics.revenue.month > 0 ? analytics.totalOrders * analytics.avgOrderValue : 0) },
                { label: 'Fulfilled',       value: String(analytics.fulfilledOrders) },
                { label: 'Repeat Customers', value: `${analytics.customers.returningRate}%` },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between px-4 py-3">
                  <p className="text-[12px] text-(--admin-text-soft)">{row.label}</p>
                  <p className="text-[12px] font-semibold text-(--admin-text)">{row.value}</p>
                </div>
              ))}
            </div>
          </SectionCard>

        </div>
      </div>
    </div>
  )
}
