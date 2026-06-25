function PulseBox({ className }: { className: string }) {
  return <div className={`animate-pulse bg-(--admin-border) rounded-lg ${className}`} />
}

function PulseRow({ className = 'h-9' }: { className?: string }) {
  return <div className={`animate-pulse bg-(--admin-border) rounded-md ${className}`} />
}

export function StatCardsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[0, 1, 2, 3].map(i => <PulseBox key={i} className="h-24" />)}
    </div>
  )
}

export function ChartsSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <PulseBox className="lg:col-span-2 h-56" />
      <PulseBox className="h-56" />
    </div>
  )
}

export function RecentOrdersSkeleton() {
  return (
    <div className="rounded-xl border border-(--admin-border) bg-(--admin-surface) overflow-hidden">
      <div className="px-5 py-4 border-b border-(--admin-border)">
        <PulseRow className="h-4 w-32" />
      </div>
      <div className="divide-y divide-(--admin-border)">
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i} className="flex items-center justify-between px-5 py-3 gap-4">
            <div className="flex-1 space-y-1.5">
              <PulseRow className="h-3 w-40" />
              <PulseRow className="h-3 w-28" />
            </div>
            <PulseRow className="h-4 w-16 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function PendingItemsSkeleton() {
  return (
    <div className="rounded-xl border border-(--admin-border) bg-(--admin-surface) overflow-hidden">
      <div className="px-4 py-3.5 border-b border-(--admin-border)">
        <PulseRow className="h-4 w-28" />
      </div>
      <div className="divide-y divide-(--admin-border)">
        {[0, 1].map(i => (
          <div key={i} className="flex items-center justify-between px-4 py-3">
            <PulseRow className="h-3 w-32" />
            <PulseRow className="h-5 w-8" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function LowStockSkeleton() {
  return (
    <div className="rounded-xl border border-(--admin-border) bg-(--admin-surface) overflow-hidden">
      <div className="px-4 py-3.5 border-b border-(--admin-border)">
        <PulseRow className="h-4 w-20" />
      </div>
      <div className="divide-y divide-(--admin-border)">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="flex items-center justify-between px-4 py-3">
            <PulseRow className="h-3 w-36" />
            <PulseRow className="h-3 w-10" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function TopProductsSkeleton() {
  return (
    <div className="rounded-xl border border-(--admin-border) bg-(--admin-surface) p-4 space-y-2">
      <PulseRow className="h-4 w-24 mb-3" />
      {[0, 1, 2, 3, 4].map(i => (
        <div key={i} className="flex items-center justify-between">
          <PulseRow className="h-3 w-32" />
          <PulseRow className="h-3 w-14" />
        </div>
      ))}
    </div>
  )
}

export function AllTimeSummarySkeleton() {
  return (
    <div className="rounded-xl border border-(--admin-border) bg-(--admin-surface) overflow-hidden">
      <div className="px-4 py-3.5 border-b border-(--admin-border)">
        <PulseRow className="h-4 w-28" />
      </div>
      <div className="divide-y divide-(--admin-border)">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="flex items-center justify-between px-4 py-3">
            <PulseRow className="h-3 w-28" />
            <PulseRow className="h-3 w-16" />
          </div>
        ))}
      </div>
    </div>
  )
}
