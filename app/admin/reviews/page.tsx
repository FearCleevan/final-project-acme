'use client'

import { useState, useEffect, useCallback } from 'react'
import { BiCheck, BiX, BiStar } from 'react-icons/bi'
import type { Review } from '@/lib/reviews'

type Filter = 'all' | 'pending' | 'approved'

function StarRow({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-[2px]">
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

export default function AdminReviewsPage() {
  const [filter,  setFilter]  = useState<Filter>('pending')
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [acting,  setActing]  = useState<string | null>(null)

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

  async function handleAction(id: string, action: 'approve' | 'reject') {
    setActing(id)
    try {
      await fetch(`/api/admin/reviews/${id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ action }),
      })
      setReviews(prev => prev.filter(r => r.id !== id))
    } finally {
      setActing(null)
    }
  }

  const FILTERS: { label: string; value: Filter }[] = [
    { label: 'Pending',  value: 'pending'  },
    { label: 'Approved', value: 'approved' },
    { label: 'All',      value: 'all'      },
  ]

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[20px] font-semibold text-(--admin-text)">Reviews</h1>
          <p className="text-[13px] text-(--admin-text-muted) mt-0.5">
            Approve or reject customer submissions before they go live
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
              className="bg-(--admin-surface) border border-(--admin-border) rounded-lg p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <StarRow rating={review.rating} />
                    <span className="text-[12px] font-mono text-(--admin-text-muted)">
                      {review.productHandle}
                    </span>
                    {review.verifiedPurchase && (
                      <span className="text-[10px] font-mono text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                        Verified purchase
                      </span>
                    )}
                    {review.approved && (
                      <span className="text-[10px] font-mono text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                        Live
                      </span>
                    )}
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
                  </div>
                </div>

                {!review.approved && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleAction(review.id, 'reject')}
                      disabled={acting === review.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-(--admin-red) bg-(--admin-red-bg) hover:opacity-80 rounded-md transition-opacity disabled:opacity-40"
                    >
                      <BiX size={14} />
                      Reject
                    </button>
                    <button
                      onClick={() => handleAction(review.id, 'approve')}
                      disabled={acting === review.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium bg-(--admin-accent) text-(--admin-accent-text) hover:opacity-90 rounded-md transition-opacity disabled:opacity-40"
                    >
                      <BiCheck size={14} />
                      Approve
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
