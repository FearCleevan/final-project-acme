// app/admin/analytics/page.tsx
'use client'

import {
  mockRevenueStats,
  mockOrderCount,
  mockSessionCount,
  mockConversionRate,
  mockTopProducts,
  mockCustomers,
  mockOrders,
  mockChartData,
} from '@/lib/admin/mockData'
import { formatCurrency } from '@/lib/admin/utils'
import { BiTrendingUp, BiTrendingDown, BiMinus } from 'react-icons/bi'
import PageHeader         from '@/components/admin/shared/PageHeader'
import SectionCard        from '@/components/admin/shared/SectionCard'
import RevenueChart       from '@/components/admin/charts/RevenueChart'
import SalesBreakdownCard from '@/components/admin/charts/SalesBreakdownCard'
import DonutChart         from '@/components/admin/charts/DonutChart'
import HorizontalBarChart from '@/components/admin/charts/HorizontalBarChart'
import MiniLineChart      from '@/components/admin/charts/MiniLineChart'
import ConversionFunnel   from '@/components/admin/charts/ConversionFunnel'

// ─── Derived values ───────────────────────────────────────────────────────────

const totalShipping    = mockOrders.reduce((s, o) => s + o.shipping, 0)
const totalTaxes       = mockOrders.reduce((s, o) => s + o.tax, 0)
const repeatCustomers  = mockCustomers.filter(c => c.orders > 1).length
const returningRate    = Math.round((repeatCustomers / mockCustomers.length) * 100)
const fulfilledOrders  = mockOrders.filter(o => o.fulfillmentStatus === 'fulfilled').length
const avgOrderValue    = mockRevenueStats.month / mockOrderCount.month

// ─── Mini chart data ──────────────────────────────────────────────────────────

const aovData = mockChartData.map(d => ({
  date:  d.date,
  value: d.orders > 0 ? Math.round(d.revenue / d.orders) : 0,
}))

const sessionsData = mockChartData.map(d => ({
  date:  d.date,
  value: d.orders * 25,
}))

const conversionData = mockChartData.map(d => ({
  date:  d.date,
  value: d.orders > 0 ? parseFloat(((1 / 25) * 100).toFixed(1)) : 0,
}))

// ─── Donut data ───────────────────────────────────────────────────────────────

const deviceData = [
  { label: 'Desktop', value: 813, color: 'var(--admin-text)'      },
  { label: 'Mobile',  value: 347, color: 'var(--admin-text-soft)' },
  { label: 'Tablet',  value: 80,  color: 'var(--admin-border)'    },
]

const channelData = [
  { label: 'Online Store', value: 100, color: 'var(--admin-text)' },
]

// ─── Funnel data ──────────────────────────────────────────────────────────────

const sessions     = mockSessionCount.week
const addedToCart  = Math.round(sessions * 0.15)
const reachedCheck = Math.round(sessions * 0.059)
const purchased    = mockOrderCount.week

const funnelStages = [
  { label: 'Sessions',          count: sessions,     total: sessions },
  { label: 'Added to Cart',     count: addedToCart,  total: sessions },
  { label: 'Reached Checkout',  count: reachedCheck, total: sessions },
  { label: 'Purchased',         count: purchased,    total: sessions },
]

// ─── Top products for horizontal bar ─────────────────────────────────────────

const topProductsBar = mockTopProducts.slice(0, 5).map(p => ({
  label: p.title.split('—')[0].trim(),
  value: p.revenue,
}))

// ─── Stat card trend chip ─────────────────────────────────────────────────────

function TrendChip({ change }: { change: number }) {
  if (change === 0) return (
    <span className="inline-flex items-center gap-0.5 text-[11px] text-(--admin-text-muted)">
      <BiMinus size={11} /> 0%
    </span>
  )
  const up = change > 0
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] ${up ? 'text-(--admin-green)' : 'text-(--admin-red)'}`}>
      {up ? <BiTrendingUp size={12} /> : <BiTrendingDown size={12} />}
      {up ? '+' : ''}{change}%
    </span>
  )
}

// ─── Top stat cards ───────────────────────────────────────────────────────────

const topCards = [
  {
    label:  'Gross Sales',
    value:  formatCurrency(mockRevenueStats.month),
    change: mockRevenueStats.monthChange,
    sub:    'This month',
  },
  {
    label:  'Returning Customer Rate',
    value:  `${returningRate}%`,
    change: 0,
    sub:    `${repeatCustomers} of ${mockCustomers.length} customers`,
  },
  {
    label:  'Orders Fulfilled',
    value:  String(fulfilledOrders),
    change: 0,
    sub:    `of ${mockOrders.length} total orders`,
  },
  {
    label:  'Total Orders',
    value:  String(mockOrderCount.month),
    change: 5,
    sub:    'This month',
  },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  return (
    <div>
      <PageHeader
        title="Analytics"
        subtitle="Store performance overview — demo data"
      />

      {/* ── Row 1: 4 small stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {topCards.map(card => (
          <SectionCard key={card.label} className="py-3 px-4">
            <p className="text-[11px] uppercase tracking-wider text-(--admin-text-muted) mb-1 leading-tight">
              {card.label}
            </p>
            <p className="text-[20px] font-semibold text-(--admin-text) leading-none mb-1.5">
              {card.value}
            </p>
            <div className="flex items-center gap-2">
              <TrendChip change={card.change} />
              <span className="text-[10px] text-(--admin-text-muted) truncate">{card.sub}</span>
            </div>
          </SectionCard>
        ))}
      </div>

      {/* ── Row 2: Revenue chart (8/12) + Sales breakdown (4/12) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="lg:col-span-2">
          <SectionCard className="h-full">
            <RevenueChart />
          </SectionCard>
        </div>
        <div>
          <SalesBreakdownCard
            grossSales={mockRevenueStats.month}
            discounts={0}
            returns={0}
            shipping={totalShipping * 6}
            taxes={totalTaxes * 6}
          />
        </div>
      </div>

      {/* ── Row 3: AOV / Sessions / Conversion mini line charts ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <MiniLineChart
          title="Avg. Order Value"
          value={formatCurrency(avgOrderValue)}
          change={+3}
          data={aovData}
        />
        <MiniLineChart
          title="Sessions over time"
          value={mockSessionCount.week.toLocaleString()}
          change={mockSessionCount.weekChange}
          data={sessionsData}
        />
        <MiniLineChart
          title="Conversion Rate"
          value={`${mockConversionRate.value}%`}
          change={mockConversionRate.change}
          data={conversionData}
        />
      </div>

      {/* ── Row 4: Device donut / Top products bar / Channel donut ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <DonutChart title="Sessions by Device" data={deviceData} />
        <HorizontalBarChart title="Top Products by Revenue" data={topProductsBar} />
        <DonutChart title="Sales by Channel" data={channelData} />
      </div>

      {/* ── Row 5: Conversion funnel (full width) ── */}
      <ConversionFunnel stages={funnelStages} />
    </div>
  )
}
