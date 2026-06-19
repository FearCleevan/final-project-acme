'use client'

import { useState, useEffect, useCallback } from 'react'
import { BiCheck, BiX, BiStar, BiPause, BiPlay, BiTrash } from 'react-icons/bi'
import type { Review } from '@/lib/reviews'

type Filter = 'pending' | 'approved' | 'deactivated' | 'all'

function StarRow({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <svg key={n} width={12} height={12} viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path
            d="M7 1l1.545 3.13L12 4.635l-2.5 2.435.59 3.44L7 8.885l-3.09 1.625L4.5 7.07 2 4.635l3.455-.505L7 1z"
            fill={n <= rating ? '#C29B47' : 'none'}
            stroke={n <= rating ? '#C29B47' : '#B8AD9A'}
            strokeWidth="1"
            strokeLinejoin="round"
          />
        </svg>
      ))}
    </span>
  )
}

function StatusBadge({ status }: { status: Review['status'] }) {
  const map = {
    approved:    { label: 'Live',        cls: 'text-green-700 bg-green-50 border-green-200'   },
    pending:     { label: 'Pending',     cls: 'text-amber-700 bg-amber-50 border-amber-200'   },
    deactivated: { label: 'Deactivated', cls: 'text-(--admin-text-muted) bg-(--admin-surface-2) border-(--admin-border)' },
  }
  const { label, cls } = map[status]
  return (
    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${cls}`}>
      {label}
    </span>
  )
}

export default function AdminReviewsPage() {
  const [filter,     setFilter]     = useState<Filter>('pending')
  const [reviews,    setReviews]    = useState<Review[]>([])
  const [loading,    setLoading]    = useState(true)
  const [acting,     setActing]     = useState<string | null>(null)
  const [confirmDel, setConfirmDel] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/reviews?filter=${filter}`)
      if (res.ok) setReviews(await res.json())
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => { load() }, [load])

  async function handleAction(id: string, action: 'approve' | 'reject' | 'deactivate' | 'activate') {
    setActing(id)
    try {
      await fetch(`/api/admin/reviews/${id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ action }),
      })
      setReviews(prev => {
        if (filter === 'all') {
          // update status inline so it stays visible with new state
          const statusMap: Record<string, Review['status']> = {
            approve:    'approved',
            deactivate: 'deactivated',
            activate:   'approved',
            reject:     'pending',
          }
          return prev.map(r => r.id === id ? { ...r, status: statusMap[action] } : r)
        }
        return prev.filter(r => r.id !== id)
      })
    } finally {
      setActing(null)
    }
  }

  async function handleDelete(id: string) {
    setActing(id)
    try {
      await fetch(`/api/admin/reviews/${id}`, { method: 'DELETE' })
      setReviews(prev => prev.filter(r => r.id !== id))
    } finally {
      setActing(null)
      setConfirmDel(null)
    }
  }

  const FILTERS: { label: string; value: Filter }[] = [
    { label: 'Pending',     value: 'pending'     },
    { label: 'Live',        value: 'approved'    },
    { label: 'Deactivated', value: 'deactivated' },
    { label: 'All',         value: 'all'         },
  ]

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-[20px] font-semibold text-(--admin-text)">Reviews</h1>
          <p className="text-[13px] text-(--admin-text-muted) mt-0.5">
            Full control over what customers see on product pages
          </p>
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

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 rounded-lg bg-(--admin-surface-2) animate-pulse" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-(--admin-text-muted)">
          <BiStar size={36} className="mb-3 opacity-30" />
          <p className="text-[14px]">No {filter === 'all' ? '' : filter} reviews</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map(review => (
            <div
              key={review.id}
              className={`bg-(--admin-surface) border border-(--admin-border) rounded-lg p-4 transition-opacity ${
                review.status === 'deactivated' ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <StarRow rating={review.rating} />
                    <span className="text-[12px] font-mono text-(--admin-text-muted)">
                      {review.productHandle}
                    </span>
                    {review.verifiedPurchase && (
                      <span className="text-[10px] font-mono text-green-600 bg-green-50 px-1.5 py-0.5 rounded border border-green-200">
                        Verified purchase
                      </span>
                    )}
                    {filter === 'all' && <StatusBadge status={review.status} />}
                  </div>

                  <p className="text-[14px] font-medium text-(--admin-text) mb-1">{review.title}</p>
                  <p className="text-[13px] text-(--admin-text-soft) line-clamp-2 mb-2">{review.body}</p>

                  <div className="flex items-center gap-3 text-[11px] font-mono text-(--admin-text-muted) flex-wrap">
                    <span>{review.customerName}</span>
                    <span>·</span>
                    <span>{review.customerEmail}</span>
                    <span>·</span>
                    <span>
                      {new Date(review.createdAt).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })}
                    </span>
                    {review.helpfulCount > 0 && (
                      <>
                        <span>·</span>
                        <span>{review.helpfulCount} helpful</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Action buttons — contextual by status */}
                <div className="flex items-center gap-2 shrink-0">
                  {(review.status === 'pending') && (
                    <button
                      onClick={() => handleAction(review.id, 'approve')}
                      disabled={acting === review.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium bg-(--admin-accent) text-(--admin-accent-text) hover:opacity-90 rounded-md transition-opacity disabled:opacity-40"
                    >
                      <BiCheck size={14} />
                      Approve
                    </button>
                  )}

                  {(review.status === 'approved') && (
                    <button
                      onClick={() => handleAction(review.id, 'deactivate')}
                      disabled={acting === review.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-amber-700 bg-amber-50 border border-amber-200 hover:opacity-80 rounded-md transition-opacity disabled:opacity-40"
                    >
                      <BiPause size={14} />
                      Deactivate
                    </button>
                  )}

                  {(review.status === 'deactivated') && (
                    <button
                      onClick={() => handleAction(review.id, 'activate')}
                      disabled={acting === review.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium bg-(--admin-accent) text-(--admin-accent-text) hover:opacity-90 rounded-md transition-opacity disabled:opacity-40"
                    >
                      <BiPlay size={14} />
                      Activate
                    </button>
                  )}

                  {/* Delete — always available, with confirmation */}
                  {confirmDel === review.id ? (
                    <>
                      <span className="text-[11px] font-mono text-(--admin-text-muted)">Sure?</span>
                      <button
                        onClick={() => handleDelete(review.id)}
                        disabled={acting === review.id}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-[12px] font-medium text-(--admin-red) bg-(--admin-red-bg) hover:opacity-80 rounded-md transition-opacity disabled:opacity-40"
                      >
                        Yes, delete
                      </button>
                      <button
                        onClick={() => setConfirmDel(null)}
                        className="text-[11px] font-mono text-(--admin-text-muted) hover:text-(--admin-text) transition-colors"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setConfirmDel(review.id)}
                      disabled={acting === review.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-(--admin-red) bg-(--admin-red-bg) hover:opacity-80 rounded-md transition-opacity disabled:opacity-40"
                    >
                      <BiTrash size={14} />
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
