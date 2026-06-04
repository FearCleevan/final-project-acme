'use client'

import { useEffect, useState } from 'react'
import type { AnalyticsData } from '@/lib/admin/shopifyAdmin'
import { formatCurrency } from '@/lib/admin/utils'
import PageHeader         from '@/components/admin/shared/PageHeader'
import SectionCard        from '@/components/admin/shared/SectionCard'
import RevenueChart       from '@/components/admin/charts/RevenueChart'
import SalesBreakdownCard from '@/components/admin/charts/SalesBreakdownCard'
import DonutChart         from '@/components/admin/charts/DonutChart'
import HorizontalBarChart from '@/components/admin/charts/HorizontalBarChart'
import MiniLineChart      from '@/components/admin/charts/MiniLineChart'
import ConversionFunnel   from '@/components/admin/charts/ConversionFunnel'
import TrendChip          from '@/components/admin/shared/TrendChip'

// Sessions / device / conversion are not available from Shopify Admin API
// without the Analytics API (Shopify Plus plan). These remain estimated.
const deviceData = [
  { label: 'Desktop', value: 60, color: 'var(--admin-text)'      },
  { label: 'Mobile',  value: 35, color: 'var(--admin-text-soft)' },
  { label: 'Tablet',  value: 5,  color: 'var(--admin-border)'    },
]
const channelData = [
  { label: 'Online Store', value: 100, color: 'var(--admin-text)' },
]

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    fetch('/api/admin/analytics')
      .then(r => r.json())
      .then(d => { setAnalytics(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div>
        <PageHeader title="Analytics" subtitle="Loading…" />
        <div className="animate-pulse space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 rounded-lg bg-(--admin-surface-2)" />
            ))}
          </div>
          <div className="h-64 rounded-lg bg-(--admin-surface-2)" />
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div>
        <PageHeader title="Analytics" subtitle="Failed to load data" />
        <p className="text-[13px] text-(--admin-text-muted)">Could not connect to Shopify. Check your admin token.</p>
      </div>
    )
  }

  const { revenue, orderCount, fulfilledOrders, totalOrders, avgOrderValue,
    totalShipping, totalTaxes, customers, topProducts, chartData } = analytics

  const topCards = [
    {
      label:  'Gross Sales',
      value:  formatCurrency(revenue.month),
      change: revenue.monthChange,
      sub:    'This month',
    },
    {
      label:  'Returning Customer Rate',
      value:  `${customers.returningRate}%`,
      change: 0,
      sub:    `${customers.repeat} of ${customers.total} customers`,
    },
    {
      label:  'Orders Fulfilled',
      value:  String(fulfilledOrders),
      change: 0,
      sub:    `of ${totalOrders} total orders`,
    },
    {
      label:  'Total Orders',
      value:  String(orderCount.month),
      change: 0,
      sub:    'This month',
    },
  ]

  const topProductsBar = topProducts.map(p => ({
    label: p.title.split('—')[0].trim(),
    value: p.revenue,
  }))

  // Mini chart data derived from real chart data
  const aovData = chartData.map(d => ({
    date:  d.date,
    value: d.orders > 0 ? Math.round(d.revenue / d.orders) : 0,
  }))

  // Funnel — sessions estimated (not in Admin API without Plus plan)
  const estimatedSessions = Math.max(orderCount.week * 25, 100)
  const funnelStages = [
    { label: 'Sessions',         count: estimatedSessions,                            total: estimatedSessions },
    { label: 'Added to Cart',    count: Math.round(estimatedSessions * 0.15),         total: estimatedSessions },
    { label: 'Reached Checkout', count: Math.round(estimatedSessions * 0.06),         total: estimatedSessions },
    { label: 'Purchased',        count: orderCount.week,                              total: estimatedSessions },
  ]

  return (
    <div>
      <PageHeader
        title="Analytics"
        subtitle="Store performance — live Shopify data"
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
            <RevenueChart data={chartData} />
          </SectionCard>
        </div>
        <div>
          <SalesBreakdownCard
            grossSales={revenue.month}
            discounts={0}
            returns={0}
            shipping={totalShipping}
            taxes={totalTaxes}
          />
        </div>
      </div>

      {/* ── Row 3: AOV / Sessions (estimated) / Conversion (estimated) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <MiniLineChart
          title="Avg. Order Value"
          value={formatCurrency(avgOrderValue)}
          change={0}
          data={aovData}
        />
        <MiniLineChart
          title="Sessions (estimated)"
          value={estimatedSessions.toLocaleString()}
          change={0}
          data={chartData.map(d => ({ date: d.date, value: d.orders * 25 }))}
        />
        <MiniLineChart
          title="Conversion Rate (est.)"
          value={orderCount.week > 0 ? `${((orderCount.week / estimatedSessions) * 100).toFixed(1)}%` : '0%'}
          change={0}
          data={chartData.map(d => ({ date: d.date, value: d.orders > 0 ? parseFloat(((1 / 25) * 100).toFixed(1)) : 0 }))}
        />
      </div>

      {/* ── Row 4: Device donut / Top products bar / Channel donut ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <DonutChart title="Sessions by Device (est.)" data={deviceData} />
        <HorizontalBarChart title="Top Products by Revenue" data={topProductsBar} />
        <DonutChart title="Sales by Channel" data={channelData} />
      </div>

      {/* ── Row 5: Conversion funnel (full width) ── */}
      <ConversionFunnel stages={funnelStages} />
    </div>
  )
}
