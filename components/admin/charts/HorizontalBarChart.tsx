// components/admin/charts/HorizontalBarChart.tsx
'use client'

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'
import { formatCurrency } from '@/lib/admin/utils'
import SectionCard from '@/components/admin/shared/SectionCard'

export interface HBarItem {
  label: string
  value: number
}

interface Props {
  title:        string
  data:         HBarItem[]
  formatValue?: (v: number) => string
}

export default function HorizontalBarChart({ title, data, formatValue = formatCurrency }: Props) {
  const chartData = data.map(d => ({ name: d.label, value: d.value }))

  return (
    <SectionCard className="h-full">
      <p className="text-[11px] uppercase tracking-widest text-(--admin-text-muted) mb-3">{title}</p>

      <ResponsiveContainer width="100%" height={Math.max(120, data.length * 32)}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
        >
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="name"
            width={88}
            tick={{ fontSize: 11, fill: 'var(--admin-text-soft)' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={v => v.length > 13 ? `${v.slice(0, 13)}…` : v}
          />
          <Tooltip
            formatter={(v) => [formatValue(typeof v === 'number' ? v : 0), '']}
            contentStyle={{
              background:   'var(--admin-surface)',
              border:       '1px solid var(--admin-border)',
              borderRadius: 6,
              fontSize:     11,
              color:        'var(--admin-text)',
            }}
          />
          <Bar
            dataKey="value"
            fill="var(--admin-chart)"
            radius={[0, 3, 3, 0]}
            maxBarSize={12}
          />
        </BarChart>
      </ResponsiveContainer>
    </SectionCard>
  )
}
