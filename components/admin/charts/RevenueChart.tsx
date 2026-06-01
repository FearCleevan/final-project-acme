'use client'

import { useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { mockChartData } from '@/lib/admin/mockData'
import { formatCurrency } from '@/lib/admin/utils'
import { cn } from '@/lib/utils'

const PERIODS = [
  { label: '7 days',  days: 7  },
  { label: '30 days', days: 30 },
  { label: '90 days', days: 90 },
]

interface TooltipPayload {
  payload?: { revenue: number; orders: number; date: string }
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  if (!d) return null
  return (
    <div className="bg-(--admin-surface) border border-(--admin-border) rounded-md px-3 py-2 shadow-lg">
      <p className="text-[11px] text-(--admin-text-muted) mb-1">{d.date}</p>
      <p className="text-[13px] font-semibold text-(--admin-text)">{formatCurrency(d.revenue)}</p>
      <p className="text-[11px] text-(--admin-text-soft) mt-0.5">{d.orders} {d.orders === 1 ? 'order' : 'orders'}</p>
    </div>
  )
}

export default function RevenueChart() {
  const [period, setPeriod] = useState(30)
  const data = mockChartData.slice(-period)

  const total    = data.reduce((s, d) => s + d.revenue, 0)
  const maxEvery = period === 7 ? 1 : period === 30 ? 5 : 15

  return (
    <div>
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-(--admin-text-muted)">Revenue</p>
          <p className="text-[22px] font-semibold text-(--admin-text) leading-tight mt-0.5">
            {formatCurrency(total)}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {PERIODS.map(p => (
            <button
              key={p.days}
              onClick={() => setPeriod(p.days)}
              className={cn(
                'px-2.5 py-1 rounded-md text-[11px] transition-colors',
                period === p.days
                  ? 'bg-(--admin-accent) text-(--admin-accent-text)'
                  : 'text-(--admin-text-soft) hover:bg-(--admin-surface-2) hover:text-(--admin-text)'
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
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
            interval={maxEvery - 1}
          />
          <YAxis
            tick={{ fontSize: 10, fontFamily: 'var(--sans)', fill: 'var(--admin-text-muted)' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={v => `$${v}`}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--admin-border)', strokeWidth: 1 }} />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="var(--admin-chart)"
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 4, fill: 'var(--admin-chart)', strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
