'use client'

import { useState, useEffect, useCallback } from 'react'
import { BiPackage, BiStar, BiEditAlt, BiCart, BiHistory } from 'react-icons/bi'
import type { ActivityLogEntry, ActivityEntityType } from '@/lib/admin/activityLog'

type Filter = ActivityEntityType | 'all'

const ENTITY_ICONS: Record<ActivityEntityType, React.ElementType> = {
  product: BiPackage,
  review:  BiStar,
  content: BiEditAlt,
  order:   BiCart,
}

const ACTION_LABELS: Record<string, string> = {
  'review.approve':      'Approved a review',
  'review.deactivate':   'Deactivated a review',
  'review.activate':     'Re-activated a review',
  'review.reject':       'Rejected a review',
  'review.delete':       'Deleted a review',
  'content.save':        'Saved content',
  'product.import':      'Bulk imported products',
  'product.bulk-status': 'Changed product status',
}

function timeAgo(iso: string): string {
  const diff  = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  if (mins < 1)   return 'just now'
  if (mins < 60)  return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const FILTERS: { label: string; value: Filter }[] = [
  { label: 'All',      value: 'all'     },
  { label: 'Products', value: 'product' },
  { label: 'Reviews',  value: 'review'  },
  { label: 'Content',  value: 'content' },
  { label: 'Orders',   value: 'order'   },
]

const PAGE = 30

export default function AdminActivityPage() {
  const [filter,  setFilter]  = useState<Filter>('all')
  const [entries, setEntries] = useState<ActivityLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [offset,  setOffset]  = useState(0)
  const [hasMore, setHasMore] = useState(true)

  const load = useCallback(async (f: Filter, o: number, append = false) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: String(PAGE), offset: String(o) })
      if (f !== 'all') params.set('entityType', f)
      const res = await fetch(`/api/admin/activity?${params}`)
      if (!res.ok) return
      const data: ActivityLogEntry[] = await res.json()
      setEntries(prev => append ? [...prev, ...data] : data)
      setHasMore(data.length === PAGE)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    setOffset(0)
    setEntries([])
    load(filter, 0)
  }, [filter, load])

  function loadMore() {
    const next = offset + PAGE
    setOffset(next)
    load(filter, next, true)
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-[20px] font-semibold text-(--admin-text)">Activity Log</h1>
          <p className="text-[13px] text-(--admin-text-muted) mt-0.5">All admin actions — most recent first</p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-(--admin-surface-2) rounded-lg">
          {FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 text-[12px] font-medium rounded-md transition-colors ${
                filter === f.value
                  ? 'bg-(--admin-surface) text-(--admin-text) shadow-sm'
                  : 'text-(--admin-text-muted) hover:text-(--admin-text)'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading && entries.length === 0 ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-14 rounded-lg bg-(--admin-surface-2) animate-pulse" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-(--admin-text-muted)">
          <BiHistory size={36} className="mb-3 opacity-30" />
          <p className="text-[14px]">No activity yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map(entry => {
            const Icon  = ENTITY_ICONS[entry.entityType] ?? BiHistory
            const label = ACTION_LABELS[entry.action] ?? entry.action
            return (
              <div
                key={entry.id}
                className="flex items-start gap-3 bg-(--admin-surface) border border-(--admin-border) rounded-lg px-4 py-3"
              >
                <div className="w-7 h-7 rounded-md bg-(--admin-surface-2) flex items-center justify-center shrink-0 mt-0.5">
                  <Icon size={13} className="text-(--admin-text-muted)" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-(--admin-text) font-medium">{label}</p>
                  {entry.entityLabel && (
                    <p className="text-[11px] font-mono text-(--admin-text-muted) truncate mt-0.5">{entry.entityLabel}</p>
                  )}
                </div>
                <span className="text-[11px] font-mono text-(--admin-text-muted) shrink-0 mt-0.5">
                  {timeAgo(entry.createdAt)}
                </span>
              </div>
            )
          })}

          {hasMore && (
            <button
              onClick={loadMore}
              disabled={loading}
              className="w-full py-2.5 text-[13px] text-(--admin-text-muted) hover:text-(--admin-text) border border-(--admin-border) rounded-lg transition-colors disabled:opacity-40"
            >
              {loading ? 'Loading…' : 'Load more'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
