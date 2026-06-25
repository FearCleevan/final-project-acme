import SectionCard from '@/components/admin/shared/SectionCard'
import RevenueChart from '@/components/admin/charts/RevenueChart'
import OrdersChart from '@/components/admin/charts/OrdersChart'
import { getCachedAnalytics } from '@/lib/admin/overviewCache'

export default async function ChartsRow() {
  const analytics = await getCachedAnalytics()

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
      <SectionCard className="lg:col-span-2">
        <RevenueChart data={analytics.chartData} />
      </SectionCard>
      <SectionCard>
        <OrdersChart data={analytics.chartData} />
      </SectionCard>
    </div>
  )
}
