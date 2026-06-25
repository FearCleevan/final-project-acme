import { BiPackage } from 'react-icons/bi'
import SectionCard from '@/components/admin/shared/SectionCard'
import { getCachedAnalytics } from '@/lib/admin/overviewCache'
import { formatCurrency } from '@/lib/admin/utils'

export default async function AllTimeSummary() {
  const analytics = await getCachedAnalytics()

  const rows = [
    { label: 'Total Orders',     value: String(analytics.totalOrders) },
    { label: 'Total Revenue',    value: formatCurrency(analytics.totalRevenue) },
    { label: 'Fulfilled',        value: String(analytics.fulfilledOrders) },
    { label: 'Repeat Customers', value: `${analytics.customers.returningRate}%` },
  ]

  return (
    <SectionCard noPadding>
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-(--admin-border)">
        <p className="text-[13px] font-semibold text-(--admin-text)">All-Time Summary</p>
        <BiPackage size={15} className="text-(--admin-text-muted)" />
      </div>
      <div className="divide-y divide-(--admin-border)">
        {rows.map(row => (
          <div key={row.label} className="flex items-center justify-between px-4 py-3">
            <p className="text-[12px] text-(--admin-text-soft)">{row.label}</p>
            <p className="text-[12px] font-semibold text-(--admin-text)">{row.value}</p>
          </div>
        ))}
      </div>
    </SectionCard>
  )
}
