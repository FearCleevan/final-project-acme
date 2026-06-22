'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Breadcrumb from '@/components/shared/Breadcrumb'
import Eyebrow from '@/components/shared/Eyebrow'
import type { TrackOrderResult } from '@/app/api/track-order/route'
import OrderTrackingResult from '@/components/track-order/OrderTrackingResult'

function TrackOrderContent() {
  const searchParams = useSearchParams()
  const initialOrder = searchParams.get('order') ?? ''
  const initialEmail = searchParams.get('email') ?? ''

  const [orderName, setOrderName] = useState(initialOrder)
  const [email,     setEmail]     = useState(initialEmail)
  const [loading,   setLoading]   = useState(false)
  const [result,    setResult]    = useState<TrackOrderResult | 'not-found' | null>(null)
  const [apiError,  setApiError]  = useState<string | null>(null)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!orderName.trim() || !email.trim()) return
    setLoading(true)
    setResult(null)
    setApiError(null)

    try {
      const res = await fetch('/api/track-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderName: orderName.trim(), email: email.trim() }),
      })
      if (res.status === 404) {
        setResult('not-found')
      } else if (!res.ok) {
        const data = await res.json()
        setApiError(data.error ?? 'Something went wrong. Please try again.')
      } else {
        const data: TrackOrderResult = await res.json()
        setResult(data)
      }
    } catch {
      setApiError('Could not reach the server. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-parchment min-h-screen">
      <div className="max-w-215 mx-auto px-6 py-14">

        <Breadcrumb
          crumbs={[
            { label: 'Storefront', href: '/' },
            { label: 'Track your order' },
          ]}
          className="mb-10"
        />

        <Eyebrow className="mb-4">Order tracking</Eyebrow>
        <h1
          className="font-serif font-medium text-ink-charcoal leading-tight mb-10"
          style={{ fontSize: 'clamp(28px, 4vw, 52px)' }}
        >
          Where is my order?
        </h1>

        {/* Search form */}
        <form onSubmit={handleSearch} className="space-y-3 mb-12 max-w-140">
          <div className="flex gap-3">
            <input
              type="text"
              value={orderName}
              onChange={e => setOrderName(e.target.value)}
              placeholder="#1001"
              required
              className="flex-1 h-13 px-4 bg-parchment-2 border border-ink-rule rounded-sm text-[15px] font-mono text-ink-iron placeholder:text-ink-soft/50 focus:outline-none focus:border-brass-deep focus:ring-1 focus:ring-brass/20 transition-colors uppercase"
              aria-label="Order number"
            />
          </div>
          <div className="flex gap-3">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Email used at checkout"
              required
              className="flex-1 h-13 px-4 bg-parchment-2 border border-ink-rule rounded-sm text-[15px] font-sans text-ink-iron placeholder:text-ink-soft/50 focus:outline-none focus:border-brass-deep focus:ring-1 focus:ring-brass/20 transition-colors"
              aria-label="Email address"
            />
            <button
              type="submit"
              disabled={loading}
              className="min-h-13 px-7 bg-green-brand text-[#F5F1E6] rounded-btn font-sans text-[14px] font-semibold hover:bg-green-deep hover:shadow-cta-hover transition-all duration-200 shrink-0 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Searching…' : 'Track →'}
            </button>
          </div>
        </form>

        {/* API error */}
        {apiError && (
          <div className="border border-red-200 bg-red-50 rounded-sm px-5 py-4 mb-8 max-w-140">
            <p className="font-sans text-[14px] text-red-700">{apiError}</p>
          </div>
        )}

        {/* Not found */}
        {result === 'not-found' && (
          <div className="border border-ink-rule rounded-sm p-8 text-center max-w-140">
            <p className="font-serif italic text-[18px] text-ink-soft mb-2">
              No order found for those details.
            </p>
            <p className="font-sans text-[14px] text-ink-soft">
              Make sure you&rsquo;re using the order number from your confirmation email and the same email address used at checkout. Or{' '}
              <a href="/contact" className="text-brass-deep hover:text-brass transition-colors border-b border-brass-deep/40 pb-px">
                contact us directly
              </a>.
            </p>
          </div>
        )}

        {/* Results */}
        {result && result !== 'not-found' && (
          <div className="max-w-160">
            <OrderTrackingResult result={result} />
          </div>
        )}

        {/* Helper text when no search yet */}
        {!result && !apiError && (
          <div className="border-t border-ink-rule pt-8 max-w-140">
            <p className="font-sans text-[14px] text-ink-soft leading-relaxed">
              Your order number is in your confirmation email.
              It looks like <span className="font-mono text-ink-iron">#1001</span>.
              Can&rsquo;t find it?{' '}
              <a href="/contact" className="text-brass-deep hover:text-brass transition-colors border-b border-brass-deep/40 pb-px">
                Write to us.
              </a>
            </p>
          </div>
        )}

      </div>
    </div>
  )
}

export default function TrackOrderPage() {
  return (
    <Suspense>
      <TrackOrderContent />
    </Suspense>
  )
}
