'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'
import { useCustomerStore } from '@/store/customerStore'
import { customerRecover } from '@/lib/shopifyCustomer'
import Breadcrumb from '@/components/shared/Breadcrumb'
import Eyebrow from '@/components/shared/Eyebrow'

type Tab = 'signin' | 'register'

function LoginContent() {
  const router      = useRouter()
  const searchParams = useSearchParams()
  const redirect    = searchParams.get('redirect') ?? '/account'

  const { login, register, isLoggedIn, loading, error, clearError } = useCustomerStore()

  const [tab,              setTab]              = useState<Tab>('signin')
  const [firstName,        setFirstName]        = useState('')
  const [lastName,         setLastName]         = useState('')
  const [email,            setEmail]            = useState('')
  const [password,         setPassword]         = useState('')
  const [confirmPassword,  setConfirmPassword]  = useState('')
  const [localError,       setLocalError]       = useState<string | null>(null)
  const [forgotMode,       setForgotMode]       = useState(false)
  const [forgotEmail,      setForgotEmail]      = useState('')
  const [forgotSent,       setForgotSent]       = useState(false)
  const [forgotLoading,    setForgotLoading]    = useState(false)

  // Redirect if already logged in
  useEffect(() => {
    if (isLoggedIn) router.replace(redirect)
  }, [isLoggedIn, redirect, router])

  function handleTabChange(t: Tab) {
    setTab(t)
    setLocalError(null)
    clearError()
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    setLocalError(null)
    clearError()
    const err = await login(email, password)
    if (!err) router.replace(redirect)
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLocalError(null)
    clearError()
    if (password !== confirmPassword) {
      setLocalError('Passwords do not match.')
      return
    }
    if (password.length < 8) {
      setLocalError('Password must be at least 8 characters.')
      return
    }
    const err = await register(firstName, lastName, email, password)
    if (!err) router.replace(redirect)
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault()
    setForgotLoading(true)
    await customerRecover(forgotEmail)
    setForgotLoading(false)
    setForgotSent(true)
  }

  const displayError = localError ?? error

  const inputClass = 'w-full h-12 px-4 bg-parchment border border-ink-rule rounded-sm text-[14px] font-sans text-ink-iron placeholder:text-ink-soft/50 focus:outline-none focus:border-brass-deep focus:ring-1 focus:ring-brass/20 transition-colors'
  const labelClass = 'block text-[10px] font-mono uppercase tracking-eyebrow text-ink-soft mb-1.5'

  return (
    <div className="bg-parchment min-h-screen">
      <div className="max-w-[480px] mx-auto px-6 py-14">

        <Breadcrumb
          crumbs={[
            { label: 'Storefront', href: '/' },
            { label: forgotMode ? 'Reset password' : tab === 'signin' ? 'Sign in' : 'Create account' },
          ]}
          className="mb-10"
        />

        {/* ── Forgot password flow ── */}
        {forgotMode ? (
          <>
            <Eyebrow className="mb-4">Reset password</Eyebrow>
            <h1 className="font-serif font-medium text-ink-charcoal mb-8" style={{ fontSize: 'clamp(24px, 3.5vw, 38px)' }}>
              Forgot your password?
            </h1>

            {forgotSent ? (
              <div className="border border-ink-rule rounded-sm p-6 text-center space-y-3">
                <p className="font-serif italic text-[18px] text-green-brand">Email sent.</p>
                <p className="font-sans text-[14px] text-ink-soft leading-relaxed">
                  If an account exists for <span className="font-mono text-ink-iron">{forgotEmail}</span>, you&rsquo;ll receive a reset link shortly.
                </p>
                <button
                  onClick={() => { setForgotMode(false); setForgotSent(false); setForgotEmail('') }}
                  className="font-mono text-[11px] uppercase tracking-eyebrow text-brass-deep hover:text-brass transition-colors mt-2"
                >
                  ← Back to sign in
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-5">
                <p className="font-sans text-[14px] text-ink-soft leading-relaxed">
                  Enter the email address on your account and we&rsquo;ll send you a reset link.
                </p>
                <div>
                  <label className={labelClass}>Email address</label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={e => setForgotEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className={inputClass}
                  />
                </div>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full min-h-12 bg-green-brand text-[#F5F1E6] rounded-btn font-sans text-[15px] font-semibold hover:bg-green-deep transition-colors disabled:opacity-60"
                >
                  {forgotLoading ? 'Sending…' : 'Send reset link →'}
                </button>
                <button
                  type="button"
                  onClick={() => setForgotMode(false)}
                  className="w-full font-mono text-[11px] uppercase tracking-eyebrow text-ink-soft hover:text-ink-iron transition-colors pt-1"
                >
                  ← Back to sign in
                </button>
              </form>
            )}
          </>
        ) : (
          <>
            <Eyebrow className="mb-4">My account</Eyebrow>
            <h1 className="font-serif font-medium text-ink-charcoal mb-8" style={{ fontSize: 'clamp(24px, 3.5vw, 38px)' }}>
              {tab === 'signin' ? 'Welcome back.' : 'Create an account.'}
            </h1>

            {/* Tabs */}
            <div className="flex gap-0 border-b border-ink-rule mb-8">
              {(['signin', 'register'] as Tab[]).map(t => (
                <button
                  key={t}
                  onClick={() => handleTabChange(t)}
                  className={[
                    'px-1 pb-3 mr-6 text-[12px] font-mono uppercase tracking-eyebrow border-b-2 transition-colors',
                    tab === t
                      ? 'text-ink-charcoal border-brass-deep'
                      : 'text-ink-soft border-transparent hover:text-ink-iron',
                  ].join(' ')}
                >
                  {t === 'signin' ? 'Sign in' : 'Create account'}
                </button>
              ))}
            </div>

            {/* Error */}
            {displayError && (
              <div className="mb-5 px-4 py-3 border border-red-200 bg-red-50 rounded-sm">
                <p className="font-sans text-[13px] text-red-700">{displayError}</p>
              </div>
            )}

            {/* ── Sign In ── */}
            {tab === 'signin' && (
              <form onSubmit={handleSignIn} className="space-y-5">
                <div>
                  <label className={labelClass}>Email address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                    className={inputClass}
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className={labelClass} style={{ marginBottom: 0 }}>Password</label>
                    <button
                      type="button"
                      onClick={() => { setForgotMode(true); setForgotEmail(email) }}
                      className="text-[10px] font-mono uppercase tracking-eyebrow text-brass-deep hover:text-brass transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    className={inputClass}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full min-h-12 bg-green-brand text-[#F5F1E6] rounded-btn font-sans text-[15px] font-semibold hover:bg-green-deep transition-colors disabled:opacity-60"
                >
                  {loading ? 'Signing in…' : 'Sign in →'}
                </button>
                <p className="text-center font-sans text-[13px] text-ink-soft pt-1">
                  No account?{' '}
                  <button
                    type="button"
                    onClick={() => handleTabChange('register')}
                    className="text-brass-deep hover:text-brass transition-colors"
                  >
                    Create one here
                  </button>
                </p>
              </form>
            )}

            {/* ── Register ── */}
            {tab === 'register' && (
              <form onSubmit={handleRegister} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>First name</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      placeholder="Jane"
                      required
                      autoComplete="given-name"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Last name</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                      placeholder="Smith"
                      required
                      autoComplete="family-name"
                      className={inputClass}
                    />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Email address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    required
                    autoComplete="new-password"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Confirm password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="new-password"
                    className={inputClass}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full min-h-12 bg-green-brand text-[#F5F1E6] rounded-btn font-sans text-[15px] font-semibold hover:bg-green-deep transition-colors disabled:opacity-60"
                >
                  {loading ? 'Creating account…' : 'Create account →'}
                </button>
                <p className="text-[11px] font-sans text-ink-soft/70 text-center leading-relaxed">
                  By creating an account you agree to our{' '}
                  <Link href="/legal/terms" className="text-brass-deep hover:text-brass transition-colors">Terms</Link>
                  {' '}and{' '}
                  <Link href="/legal/privacy-policy" className="text-brass-deep hover:text-brass transition-colors">Privacy Policy</Link>.
                </p>
                <p className="text-center font-sans text-[13px] text-ink-soft pt-1">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => handleTabChange('signin')}
                    className="text-brass-deep hover:text-brass transition-colors"
                  >
                    Sign in here
                  </button>
                </p>
              </form>
            )}
          </>
        )}

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
