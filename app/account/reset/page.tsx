'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { BiArrowBack, BiCheck } from 'react-icons/bi'
import { useCustomerStore } from '@/store/customerStore'
import Breadcrumb from '@/components/shared/Breadcrumb'
import Eyebrow from '@/components/shared/Eyebrow'

function ResetContent() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const resetUrl     = searchParams.get('url') ?? ''

  const { hydrate } = useCustomerStore()

  const [password,  setPassword]  = useState('')
  const [confirm,   setConfirm]   = useState('')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [done,      setDone]      = useState(false)

  // If no reset URL in query string the link is invalid
  const invalidLink = !resetUrl

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const res  = await fetch('/api/auth/reset', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ resetUrl, password }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Could not reset your password. The link may have expired.')
        setLoading(false)
        return
      }

      // Re-hydrate to pick up the new session (same flow as after login)
      await hydrate()
      setDone(true)
      setLoading(false)

      // Redirect to account after a brief moment so the success state is visible
      setTimeout(() => router.replace('/account'), 2000)
    } catch {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  const inputClass    = 'w-full h-12 px-4 bg-parchment border border-ink-rule rounded-sm text-[14px] font-sans text-ink-iron placeholder:text-ink-soft/50 focus:outline-none focus:border-brass-deep focus:ring-1 focus:ring-brass/20 transition-colors disabled:opacity-60'
  const labelClass    = 'block text-[10px] font-mono uppercase tracking-eyebrow text-ink-soft mb-1.5'

  return (
    <div className="bg-parchment min-h-screen">
      <div className="max-w-120 mx-auto px-6 py-14">

        <Breadcrumb
          crumbs={[
            { label: 'Storefront', href: '/' },
            { label: 'Reset password' },
          ]}
          className="mb-10"
        />

        <Eyebrow className="mb-4">My account</Eyebrow>
        <h1 className="font-serif font-medium text-ink-charcoal mb-8" style={{ fontSize: 'clamp(24px, 3.5vw, 38px)' }}>
          Set a new password.
        </h1>

        {/* ── Invalid / missing link ── */}
        {invalidLink && (
          <div className="space-y-5">
            <div className="px-5 py-4 border border-red-200 bg-red-50 rounded-sm">
              <p className="font-mono text-[10px] uppercase tracking-eyebrow text-red-600 mb-1">
                Link invalid
              </p>
              <p className="font-sans text-[14px] text-red-700 leading-relaxed">
                This password reset link is missing required information. It may have been truncated
                by your email client.
              </p>
            </div>
            <p className="font-sans text-[13px] text-ink-soft leading-relaxed">
              Please go back to the login page and request a new reset link.
            </p>
            <Link
              href="/login"
              className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-eyebrow text-brass-deep hover:text-brass transition-colors"
            >
              <BiArrowBack size={13} /> Back to sign in
            </Link>
          </div>
        )}

        {/* ── Success ── */}
        {!invalidLink && done && (
          <div className="space-y-5">
            <div className="flex items-start gap-4 px-5 py-4 border border-ink-rule bg-parchment-2 rounded-sm">
              <div className="w-8 h-8 rounded-full bg-green-brand/10 flex items-center justify-center shrink-0 mt-0.5">
                <BiCheck size={18} className="text-green-brand" />
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-eyebrow text-green-brand mb-1">
                  Password updated
                </p>
                <p className="font-sans text-[14px] text-ink-iron leading-relaxed">
                  Your password has been changed. Redirecting you to your account…
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Reset form ── */}
        {!invalidLink && !done && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <p className="font-sans text-[14px] text-ink-soft leading-relaxed -mt-3">
              Choose a strong password — at least 8 characters.
            </p>

            {error && (
              <div className="px-4 py-3 border border-red-200 bg-red-50 rounded-sm">
                <p className="font-sans text-[13px] text-red-700">{error}</p>
              </div>
            )}

            <div>
              <label className={labelClass}>New password</label>
              <input
                type="password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(null) }}
                placeholder="At least 8 characters"
                required
                autoComplete="new-password"
                disabled={loading}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Confirm new password</label>
              <input
                type="password"
                value={confirm}
                onChange={e => { setConfirm(e.target.value); setError(null) }}
                placeholder="••••••••"
                required
                autoComplete="new-password"
                disabled={loading}
                className={inputClass}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-12 bg-green-brand text-[#F5F1E6] rounded-btn font-sans text-[15px] font-semibold hover:bg-green-deep transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading && (
                <span className="w-4 h-4 rounded-full border-2 border-[#F5F1E6]/30 border-t-[#F5F1E6] animate-spin" />
              )}
              {loading ? 'Updating password…' : 'Set new password →'}
            </button>

            <Link
              href="/login"
              className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-eyebrow text-ink-soft hover:text-ink-iron transition-colors"
            >
              <BiArrowBack size={13} /> Back to sign in
            </Link>
          </form>
        )}

      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetContent />
    </Suspense>
  )
}
