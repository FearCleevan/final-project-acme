// components/admin/shared/TrendChip.tsx
'use client'

import { BiTrendingUp, BiTrendingDown, BiMinus } from 'react-icons/bi'

interface Props {
  change: number
}

export default function TrendChip({ change }: Props) {
  if (change === 0) return (
    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[11px] text-(--admin-text-muted)">
      <BiMinus size={11} /> 0%
    </span>
  )
  const up = change > 0
  return (
    <span
      className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[11px] font-medium"
      style={{
        background: up ? 'var(--admin-chip-green-bg)' : 'var(--admin-chip-red-bg)',
        color:      up ? 'var(--admin-chip-green-text)' : 'var(--admin-chip-red-text)',
      }}
    >
      {up ? <BiTrendingUp size={11} /> : <BiTrendingDown size={11} />}
      {up ? '+' : ''}{change}%
    </span>
  )
}
