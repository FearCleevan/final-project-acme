// components/admin/charts/SalesBreakdownCard.tsx
'use client'

import { formatCurrency } from '@/lib/admin/utils'
import SectionCard from '@/components/admin/shared/SectionCard'

interface Props {
  grossSales: number
  discounts:  number
  returns:    number
  shipping:   number
  taxes:      number
}

export default function SalesBreakdownCard({ grossSales, discounts, returns, shipping, taxes }: Props) {
  const netSales   = grossSales - discounts - returns
  const totalSales = netSales + shipping + taxes

  const rows: { label: string; value: number; negative?: boolean }[] = [
    { label: 'Gross Sales', value: grossSales },
    { label: 'Discounts',   value: discounts,  negative: true },
    { label: 'Returns',     value: returns,    negative: true },
    { label: 'Net Sales',   value: netSales },
    { label: 'Shipping',    value: shipping },
    { label: 'Taxes',       value: taxes },
  ]

  return (
    <SectionCard className="h-full flex flex-col">
      <p className="text-[11px] uppercase tracking-widest text-(--admin-text-muted) mb-4">
        Sales Breakdown
      </p>
      <div className="flex-1 space-y-2.5">
        {rows.map(row => (
          <div key={row.label} className="flex items-center justify-between">
            <span className="text-[12px] text-(--admin-text-muted)">{row.label}</span>
            <span className={`text-[13px] ${row.negative && row.value > 0 ? 'text-(--admin-red)' : 'text-(--admin-text)'}`}>
              {row.value === 0
                ? '—'
                : `${row.negative ? '-' : ''}${formatCurrency(row.value)}`}
            </span>
          </div>
        ))}
      </div>
      <div className="pt-3 mt-3 border-t border-(--admin-border) flex items-center justify-between">
        <span className="text-[13px] font-semibold text-(--admin-text)">Total Sales</span>
        <span className="text-[15px] font-semibold text-(--admin-text)">{formatCurrency(totalSales)}</span>
      </div>
    </SectionCard>
  )
}
