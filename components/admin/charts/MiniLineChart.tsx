// components/admin/charts/MiniLineChart.tsx
'use client'

import { LineChart, Line, XAxis, ResponsiveContainer, Tooltip } from 'recharts'
import { BiTrendingUp, BiTrendingDown, BiMinus } from 'react-icons/bi'
import SectionCard from '@/components/admin/shared/SectionCard'

export interface MiniChartPoint {
  date:  string
  value: number
}

interface Props {
  title:  string
  value:  string
  change: number
  data:   MiniChartPoint[]
  color?: string
}

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

export default function MiniLineChart({ title, value, change, data, color = 'var(--admin-accent)' }: Props) {
  return (
    <SectionCard className="h-full">
      <p className="text-[11px] uppercase tracking-widest text-(--admin-text-muted) mb-1">{title}</p>
      <div className="flex items-end gap-2 mb-3">
        <span className="text-[22px] font-semibold text-(--admin-text) leading-none">{value}</span>
        <TrendChip change={change} />
      </div>
      <ResponsiveContainer width="100%" height={72}>
        <LineChart data={data} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
          <XAxis dataKey="date" hide />
          <Tooltip
            formatter={(v) => [v, '']}
            contentStyle={{
              background:   'var(--admin-surface)',
              border:       '1px solid var(--admin-border)',
              borderRadius: 6,
              fontSize:     11,
              color:        'var(--admin-text)',
            }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 3, strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </SectionCard>
  )
}
