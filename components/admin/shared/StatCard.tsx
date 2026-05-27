import { BiTrendingUp, BiTrendingDown } from 'react-icons/bi'
import { cn } from '@/lib/utils'
import SectionCard from './SectionCard'

interface StatCardProps {
  label: string
  value: string
  change: number
  period: string
  icon: React.ReactNode
}

export default function StatCard({ label, value, change, period, icon }: StatCardProps) {
  const positive = change >= 0

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
        <div className={cn(
          'flex items-center gap-1 text-[11px]',
          positive ? 'text-(--admin-green)' : 'text-(--admin-red)'
        )}>
          {positive
            ? <BiTrendingUp size={13} />
            : <BiTrendingDown size={13} />
          }
          <span>{positive ? '+' : ''}{change}%</span>
        </div>
        <p className="text-[11px] text-(--admin-text-muted)">{period}</p>
      </div>
    </SectionCard>
  )
}
