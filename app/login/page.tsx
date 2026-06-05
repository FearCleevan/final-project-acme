'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { useCustomerStore } from '@/store/customerStore'
import Breadcrumb from '@/components/shared/Breadcrumb'
import Eyebrow from '@/components/shared/Eyebrow'

function LoginContent() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const redirect     = searchParams.get('redirect') ?? '/account'
  const authError    = searchParams.get('error')

  const isLoggedIn = useCustomerStore(s => s.isLoggedIn)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isLoggedIn) router.replace(redirect)
  }, [isLoggedIn, redirect, router])

  function handleSignIn() {
    setLoading(true)
    window.location.href = `/api/auth/authorize?redirectTo=${encodeURIComponent(redirect)}`
  }

  return (
    <div className="bg-parchment min-h-screen">
      <div className="max-w-120 mx-auto px-6 py-14">

        <Breadcrumb
          crumbs={[
            { label: 'Storefront', href: '/' },
            { label: 'Sign in' },
          ]}
          className="mb-10"
        />

        <Eyebrow className="mb-4">My account</Eyebrow>
        <h1
          className="font-serif font-medium text-ink-charcoal mb-3"
          style={{ fontSize: 'clamp(24px, 3.5vw, 38px)' }}
        >
          Welcome back.
        </h1>
        <p className="font-sans text-[15px] text-ink-soft leading-relaxed mb-10 max-w-[42ch]">
          Sign in to track orders, manage addresses, and access your crate.
          New customers can create an account in the same step.
        </p>

        {authError && (
          <div className="mb-6 px-4 py-3 border border-red-200 bg-red-50 rounded-sm">
            <p className="font-sans text-[13px] text-red-700">
              Sign-in failed — please try again.
            </p>
          </div>
        )}

        <button
          onClick={handleSignIn}
          disabled={loading}
          className="w-full min-h-12 bg-green-brand text-[#F5F1E6] rounded-btn font-sans text-[15px] font-semibold hover:bg-green-deep transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading && (
            <span className="w-4 h-4 rounded-full border-2 border-[#F5F1E6]/30 border-t-[#F5F1E6] animate-spin" />
          )}
          {loading ? 'Redirecting…' : 'Sign in / Create account →'}
        </button>

        <p className="mt-5 font-sans text-[12px] text-ink-soft/70 text-center leading-relaxed">
          You&rsquo;ll be taken to a secure Shopify-hosted page to verify your email.
          No password required.
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
