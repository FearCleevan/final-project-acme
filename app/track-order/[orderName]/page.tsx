'use client'

import { useState, useEffect, Suspense } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Breadcrumb from '@/components/shared/Breadcrumb'
import Eyebrow from '@/components/shared/Eyebrow'
import OrderTrackingResult from '@/components/track-order/OrderTrackingResult'
import type { TrackOrderResult } from '@/app/api/track-order/route'

function OrderTrackingPage(): React.ReactElement {
  const params       = useParams<{ orderName: string }>()
  const searchParams = useSearchParams()

  const orderName  = decodeURIComponent(params.orderName ?? '')
  const emailParam = searchParams.get('email') ?? ''

  const [email,    setEmail]    = useState(emailParam)
  const [result,   setResult]   = useState<TrackOrderResult | 'not-found' | null>(null)
  const [loading,  setLoading]  = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  async function fetchOrder(em: string): Promise<void> {
    if (!orderName || !em.trim()) return
    setLoading(true)
    setResult(null)
    setApiError(null)

    try {
      const res = await fetch('/api/track-order', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ orderName, email: em.trim() }),
      })
      if (res.status === 404) {
        setResult('not-found')
      } else if (!res.ok) {
        const data = await res.json() as { error?: string }
        setApiError(data.error ?? 'Something went wrong. Please try again.')
      } else {
        const data = await res.json() as TrackOrderResult
        setResult(data)
      }
    } catch {
      setApiError('Could not reach the server. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  // Auto-fetch when email param is present (arriving from email link)
  useEffect(() => {
    if (emailParam) {
      void fetchOrder(emailParam)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleEmailSubmit(e: React.FormEvent): void {
    e.preventDefault()
    void fetchOrder(email)
  }

  return (
    <div className="bg-parchment min-h-screen">
      <div className="max-w-215 mx-auto px-6 py-14">

        <Breadcrumb
          crumbs={[
            { label: 'Storefront', href: '/' },
            { label: 'Track your order', href: '/track-order' },
            { label: orderName },
          ]}
          className="mb-10"
        />

        <Eyebrow className="mb-4">Order tracking</Eyebrow>
        <h1
          className="font-serif font-medium text-ink-charcoal leading-tight mb-10"
          style={{ fontSize: 'clamp(28px, 4vw, 52px)' }}
        >
          {orderName}
        </h1>

        {/* Email gate — shown only when no email param (direct bookmark/navigation) */}
        {!emailParam && !result && !loading && (
          <form onSubmit={handleEmailSubmit} className="space-y-3 mb-12 max-w-140">
            <p className="font-sans text-[14px] text-ink-soft mb-4">
              Enter the email address used at checkout to view this order.
            </p>
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
                {loading ? 'Loading…' : 'View order →'}
              </button>
            </div>
          </form>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="max-w-160 space-y-6">
            <div className="h-40 rounded-sm bg-parchment-2 border border-ink-rule animate-pulse" />
            <div className="h-32 rounded-sm bg-parchment-2 border border-ink-rule animate-pulse" />
            <div className="h-20 rounded-sm bg-parchment-2 border border-ink-rule animate-pulse" />
          </div>
        )}

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
              Check that you&rsquo;re using the same email address used at checkout, or{' '}
              <a href="/contact" className="text-brass-deep hover:text-brass transition-colors border-b border-brass-deep/40 pb-px">
                contact us
              </a>.
            </p>
          </div>
        )}

        {/* Result */}
        {result && result !== 'not-found' && (
          <div className="max-w-160">
            <OrderTrackingResult result={result} />
          </div>
        )}

      </div>
    </div>
  )
}

export default function Page(): React.ReactElement {
  return (
    <Suspense>
      <OrderTrackingPage />
    </Suspense>
  )
}
