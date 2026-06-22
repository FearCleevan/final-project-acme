'use client'

import { useEffect, useState } from 'react'
import { BiMobile, BiDesktop, BiTable, BiTrendingUp, BiTime } from 'react-icons/bi'
import type { AnalyticsSummary, PageViewRow } from '@/lib/analytics'

interface TrafficData {
  summary:     AnalyticsSummary
  topProducts: { handle: string; views: number }[]
  topPages:    { path: string; views: number }[]
  devices:     { mobile: number; tablet: number; desktop: number }
  recent:      PageViewRow[]
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-(--admin-surface) border border-(--admin-border) rounded-lg p-4">
      <p className="text-[10px] font-mono uppercase tracking-wider text-(--admin-text-muted) mb-1.5">{label}</p>
      <p className="text-[24px] font-semibold text-(--admin-text) leading-none">{value.toLocaleString()}</p>
    </div>
  )
}

function DeviceBar({ label, count, total, icon: Icon }: {
  label: string; count: number; total: number; icon: React.ElementType
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <Icon size={13} className="text-(--admin-text-muted) shrink-0" />
      <div className="flex-1">
        <div className="flex justify-between mb-1">
          <span className="text-[12px] text-(--admin-text)">{label}</span>
          <span className="text-[11px] font-mono text-(--admin-text-muted)">{count.toLocaleString()} · {pct}%</span>
        </div>
        <div className="h-1.5 bg-(--admin-surface-2) rounded-full overflow-hidden">
          <div className="h-full bg-(--admin-accent) rounded-full" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  )
}

function timeAgo(iso: string): string {
  const diff  = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  if (mins < 1)   return 'just now'
  if (mins < 60)  return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export default function TrafficSection() {
  const [data,    setData]    = useState<TrafficData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/traffic')
      .then(r => r.ok ? r.json() : null)
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="mt-8 space-y-3">
        <div className="h-5 w-32 rounded bg-(--admin-surface-2) animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 rounded-lg bg-(--admin-surface-2) animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (!data) return null

  const { summary, topProducts, topPages, devices, recent } = data
  const totalDevices = devices.mobile + devices.tablet + devices.desktop

  return (
    <div className="mt-8">
      <div className="mb-4">
        <h2 className="text-[15px] font-semibold text-(--admin-text)">Storefront Traffic</h2>
        <p className="text-[12px] text-(--admin-text-muted) mt-0.5">Page views tracked from your website visitors — last 30 days</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Today"    value={summary.today}   />
        <StatCard label="7 days"   value={summary.week}    />
        <StatCard label="30 days"  value={summary.month}   />
        <StatCard label="All time" value={summary.allTime} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">

        {/* Top products */}
        <div className="bg-(--admin-surface) border border-(--admin-border) rounded-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <BiTrendingUp size={13} className="text-(--admin-text-muted)" />
            <p className="text-[13px] font-semibold text-(--admin-text)">Top Products (30 days)</p>
          </div>
          {topProducts.length === 0 ? (
            <p className="text-[12px] text-(--admin-text-muted)">No product views yet.</p>
          ) : (
            <div className="space-y-2">
              {topProducts.map((p, i) => (
                <div key={p.handle} className="flex items-center gap-3">
                  <span className="text-[10px] font-mono text-(--admin-text-muted) w-4 text-right shrink-0">{i + 1}</span>
                  <span className="flex-1 text-[12px] font-mono text-(--admin-text) truncate">{p.handle}</span>
                  <span className="text-[12px] font-mono text-(--admin-text-muted) shrink-0">{p.views.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top pages */}
        <div className="bg-(--admin-surface) border border-(--admin-border) rounded-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <BiTrendingUp size={13} className="text-(--admin-text-muted)" />
            <p className="text-[13px] font-semibold text-(--admin-text)">Top Pages (30 days)</p>
          </div>
          {topPages.length === 0 ? (
            <p className="text-[12px] text-(--admin-text-muted)">No page views yet.</p>
          ) : (
            <div className="space-y-2">
              {topPages.map((p, i) => (
                <div key={p.path} className="flex items-center gap-3">
                  <span className="text-[10px] font-mono text-(--admin-text-muted) w-4 text-right shrink-0">{i + 1}</span>
                  <span className="flex-1 text-[12px] font-mono text-(--admin-text) truncate">{p.path}</span>
                  <span className="text-[12px] font-mono text-(--admin-text-muted) shrink-0">{p.views.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Device breakdown */}
        <div className="bg-(--admin-surface) border border-(--admin-border) rounded-lg p-5">
          <p className="text-[13px] font-semibold text-(--admin-text) mb-4">Visitors by Device (30 days)</p>
          <div className="space-y-4">
            <DeviceBar label="Mobile"  count={devices.mobile}  total={totalDevices} icon={BiMobile}  />
            <DeviceBar label="Desktop" count={devices.desktop} total={totalDevices} icon={BiDesktop} />
            <DeviceBar label="Tablet"  count={devices.tablet}  total={totalDevices} icon={BiTable}   />
          </div>
        </div>

        {/* Recent visitors */}
        <div className="bg-(--admin-surface) border border-(--admin-border) rounded-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <BiTime size={13} className="text-(--admin-text-muted)" />
            <p className="text-[13px] font-semibold text-(--admin-text)">Recent Visitors</p>
          </div>
          {recent.length === 0 ? (
            <p className="text-[12px] text-(--admin-text-muted)">No visitors yet.</p>
          ) : (
            <div className="space-y-1.5">
              {recent.map((v, i) => (
                <div key={i} className="flex items-center gap-2 text-[11px] font-mono">
                  <span className="text-(--admin-text) truncate flex-1">{v.path}</span>
                  <span className="text-(--admin-text-muted) shrink-0">{v.device}</span>
                  {v.country && <span className="text-(--admin-text-muted) shrink-0">{v.country}</span>}
                  <span className="text-(--admin-text-muted) shrink-0">{timeAgo(v.createdAt)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
