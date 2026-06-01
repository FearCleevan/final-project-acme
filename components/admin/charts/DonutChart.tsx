// components/admin/charts/DonutChart.tsx
'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import SectionCard from '@/components/admin/shared/SectionCard'

export interface DonutSlice {
  label: string
  value: number
  color: string
}

interface Props {
  title: string
  data:  DonutSlice[]
}

export default function DonutChart({ title, data }: Props) {
  const total = data.reduce((s, d) => s + d.value, 0)

  return (
    <SectionCard className="h-full">
      <p className="text-[11px] uppercase tracking-widest text-(--admin-text-muted) mb-3">{title}</p>

      <ResponsiveContainer width="100%" height={130}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={42}
            outerRadius={60}
            paddingAngle={2}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(v) => {
              const value = typeof v === 'number' ? v : 0
              return [`${Math.round((value / total) * 100)}%`, '']
            }}
            contentStyle={{
              background:   'var(--admin-surface)',
              border:       '1px solid var(--admin-border)',
              borderRadius: 6,
              fontSize:     11,
              color:        'var(--admin-text)',
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      <div className="space-y-2 mt-1">
        {data.map(d => (
          <div key={d.label} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />
              <span className="text-[12px] text-(--admin-text-soft)">{d.label}</span>
            </div>
            <span className="text-[12px] font-medium text-(--admin-text)">
              {Math.round((d.value / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </SectionCard>
  )
}
