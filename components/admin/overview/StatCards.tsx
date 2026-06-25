import { BiDollar, BiCart, BiTrendingUp, BiPackage } from 'react-icons/bi'
import StatCard from '@/components/admin/shared/StatCard'
import { getCachedAnalytics } from '@/lib/admin/overviewCache'
import { formatCurrency } from '@/lib/admin/utils'

export default async function StatCards() {
  const analytics = await getCachedAnalytics()

  const unfulfilled = analytics.totalOrders - analytics.fulfilledOrders

  return (
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
      <div className="relative">
        <StatCard
          label="Unfulfilled"
          value={String(unfulfilled)}
          change={0}
          period="Needs fulfillment"
          icon={<BiPackage size={16} />}
        />
        {unfulfilled > 0 && (
          <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-(--admin-red)" />
        )}
      </div>
    </div>
  )
}
