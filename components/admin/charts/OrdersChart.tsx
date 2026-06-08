'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { mockChartData } from '@/lib/admin/mockData'
import type { ChartDataPoint } from '@/lib/admin/types'

interface TooltipPayload {
  payload?: { orders: number; date: string }
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  if (!d) return null
  return (
    <div className="bg-(--admin-surface) border border-(--admin-border) rounded-md px-3 py-2 shadow-lg">
      <p className="text-[11px] text-(--admin-text-muted) mb-1">{d.date}</p>
      <p className="text-[13px] font-semibold text-(--admin-text)">{d.orders} {d.orders === 1 ? 'order' : 'orders'}</p>
    </div>
  )
}

export default function OrdersChart({ data: allData }: { data?: ChartDataPoint[] }) {
  const data = (allData ?? mockChartData).slice(-30)

  return (
    <div>
      <p className="text-[11px] uppercase tracking-widest text-(--admin-text-muted) mb-4">
        Orders — Last 30 days
      </p>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--admin-border)"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fontFamily: 'var(--sans)', fill: 'var(--admin-text-muted)' }}
            tickLine={false}
            axisLine={false}
            interval={4}
          />
          <YAxis
            tick={{ fontSize: 10, fontFamily: 'var(--sans)', fill: 'var(--admin-text-muted)' }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--admin-surface-2)' }} />
          <Bar
            dataKey="orders"
            fill="var(--admin-chart)"
            radius={[2, 2, 0, 0]}
            maxBarSize={20}
            opacity={0.75}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
