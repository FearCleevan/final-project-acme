// components/admin/charts/ConversionFunnel.tsx
'use client'

import SectionCard from '@/components/admin/shared/SectionCard'

export interface FunnelStage {
  label: string
  count: number
  total: number
}

interface Props {
  stages: FunnelStage[]
}

export default function ConversionFunnel({ stages }: Props) {
  return (
    <SectionCard>
      <p className="text-[11px] uppercase tracking-widest text-(--admin-text-muted) mb-4">
        Conversion Funnel
      </p>
      <div className="grid grid-cols-2 gap-2 sm:flex sm:items-stretch sm:gap-2">
        {stages.map((stage, i) => {
          const pct  = ((stage.count / stage.total) * 100).toFixed(1)
          const last = i === stages.length - 1
          return (
            <div key={stage.label} className="flex items-center min-w-0 sm:flex-1">
              <div className="w-full rounded-lg bg-(--admin-surface-2) border border-(--admin-border) px-3 py-4 text-center">
                <p className="text-[20px] sm:text-[22px] font-semibold text-(--admin-text) leading-none mb-1">
                  {stage.count.toLocaleString()}
                </p>
                <p className="text-[10px] sm:text-[11px] text-(--admin-text-soft) leading-tight mb-1.5">
                  {stage.label}
                </p>
                <p className="text-[11px] font-medium text-(--admin-text-muted)">{pct}%</p>
              </div>
              {!last && (
                <div className="hidden sm:flex px-1 shrink-0 text-(--admin-border)">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path
                      d="M2 7h10M8 3l4 4-4 4"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </SectionCard>
  )
}
