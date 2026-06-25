import { Suspense } from 'react'

export const dynamic = 'force-dynamic'
import PageHeader from '@/components/admin/shared/PageHeader'
import QuickActions from '@/components/admin/overview/QuickActions'
import StatCards from '@/components/admin/overview/StatCards'
import ChartsRow from '@/components/admin/overview/ChartsRow'
import RecentOrders from '@/components/admin/overview/RecentOrders'
import LowStock from '@/components/admin/overview/LowStock'
import TopProducts from '@/components/admin/overview/TopProducts'
import AllTimeSummary from '@/components/admin/overview/AllTimeSummary'
import PendingItems from '@/components/admin/overview/PendingItems'
import {
  StatCardsSkeleton,
  ChartsSkeleton,
  RecentOrdersSkeleton,
  PendingItemsSkeleton,
  LowStockSkeleton,
  TopProductsSkeleton,
  AllTimeSummarySkeleton,
} from '@/components/admin/overview/skeletons'

export default function OverviewPage() {
  const dateLabel = new Date().toLocaleDateString('en-CA', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <div>
      <PageHeader title="Overview" subtitle={`${dateLabel} — Live Data`} />

      <QuickActions />

      <Suspense fallback={<StatCardsSkeleton />}>
        <StatCards />
      </Suspense>

      <Suspense fallback={<ChartsSkeleton />}>
        <ChartsRow />
      </Suspense>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Suspense fallback={<RecentOrdersSkeleton />}>
          <RecentOrders />
        </Suspense>

        <div className="space-y-4">
          <Suspense fallback={<PendingItemsSkeleton />}>
            <PendingItems />
          </Suspense>

          <Suspense fallback={<LowStockSkeleton />}>
            <LowStock />
          </Suspense>

          <Suspense fallback={<TopProductsSkeleton />}>
            <TopProducts />
          </Suspense>

          <Suspense fallback={<AllTimeSummarySkeleton />}>
            <AllTimeSummary />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
