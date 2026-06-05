'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { useCustomerStore } from '@/store/customerStore'
import Breadcrumb from '@/components/shared/Breadcrumb'
import Eyebrow from '@/components/shared/Eyebrow'

type Mode = 'login' | 'register'

function Spinner() {
  return (
    <span className="w-4 h-4 rounded-full border-2 border-current/30 border-t-current animate-spin" />
  )
}

function LoginContent() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const redirect     = searchParams.get('redirect') ?? '/account'
  const authError    = searchParams.get('error')

  const isLoggedIn = useCustomerStore(s => s.isLoggedIn)
  const [loading, setLoading] = useState<Mode | null>(null)

  useEffect(() => {
    if (isLoggedIn) router.replace(redirect)
  }, [isLoggedIn, redirect, router])

  function handleAuth(mode: Mode) {
    setLoading(mode)
    window.location.href =
      `/api/auth/authorize?redirectTo=${encodeURIComponent(redirect)}&mode=${mode}`
  }

  const inputClass =
    'w-full min-h-12 rounded-btn font-sans text-[15px] font-semibold transition-colors disabled:opacity-60 flex items-center justify-center gap-2'

  return (
    <div className="bg-parchment min-h-screen">
      <div className="max-w-120 mx-auto px-6 py-14">

        <Breadcrumb
          crumbs={[
            { label: 'Storefront', href: '/' },
            { label: 'My account' },
          ]}
          className="mb-10"
        />

        <Eyebrow className="mb-4">My account</Eyebrow>

        {authError && (
          <div className="mb-6 px-4 py-3 border border-red-200 bg-red-50 rounded-sm">
            <p className="font-sans text-[13px] text-red-700">
              Something went wrong — please try again.
            </p>
          </div>
        )}

        {/* ── Returning customer ── */}
        <div className="mb-10">
          <h1
            className="font-serif font-medium text-ink-charcoal mb-2"
            style={{ fontSize: 'clamp(22px, 3vw, 34px)' }}
          >
            Already have an account?
          </h1>
          <p className="font-sans text-[14px] text-ink-soft leading-relaxed mb-5">
            Sign in to track orders, manage addresses, and access your crate.
            A one-time code will be sent to your email — no password needed.
          </p>
          <button
            onClick={() => handleAuth('login')}
            disabled={loading !== null}
            className={`${inputClass} bg-green-brand text-[#F5F1E6] hover:bg-green-deep`}
          >
            {loading === 'login' && <Spinner />}
            {loading === 'login' ? 'Redirecting…' : 'Sign in →'}
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-10">
          <div className="flex-1 h-px bg-ink-rule" />
          <span className="font-mono text-[10px] uppercase tracking-eyebrow text-ink-soft">or</span>
          <div className="flex-1 h-px bg-ink-rule" />
        </div>

        {/* ── New customer ── */}
        <div>
          <h2
            className="font-serif font-medium text-ink-charcoal mb-2"
            style={{ fontSize: 'clamp(22px, 3vw, 34px)' }}
          >
            New to Acme?
          </h2>
          <p className="font-sans text-[14px] text-ink-soft leading-relaxed mb-5">
            Create an account to save addresses, track orders, and check out faster.
            It only takes your email address.
          </p>
          <button
            onClick={() => handleAuth('register')}
            disabled={loading !== null}
            className={`${inputClass} border-2 border-ink-iron text-ink-iron hover:bg-parchment-2`}
          >
            {loading === 'register' && <Spinner />}
            {loading === 'register' ? 'Redirecting…' : 'Create account →'}
          </button>
        </div>

        <p className="mt-8 font-sans text-[11px] text-ink-soft/60 text-center leading-relaxed">
          You&rsquo;ll be taken to a secure Shopify-hosted page to verify your email.
        </p>

      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  )
}
