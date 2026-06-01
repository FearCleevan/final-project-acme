// components/admin/shared/StatCard.tsx
import SectionCard from './SectionCard'
import TrendChip from './TrendChip'

interface StatCardProps {
  label:  string
  value:  string
  change: number
  period: string
  icon:   React.ReactNode
}

export default function StatCard({ label, value, change, period, icon }: StatCardProps) {
  return (
    <SectionCard className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-widest text-(--admin-text-muted)">
          {label}
        </p>
        <span className="text-(--admin-text-muted)">{icon}</span>
      </div>

      <p className="text-[26px] font-semibold text-(--admin-text) leading-none tracking-tight">
        {value}
      </p>

      <div className="flex items-center justify-between">
        <TrendChip change={change} />
        <p className="text-[11px] text-(--admin-text-muted)">{period}</p>
      </div>
    </SectionCard>
  )
}
