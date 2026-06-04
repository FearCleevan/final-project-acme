'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'
import { useCustomerStore } from '@/store/customerStore'
import Breadcrumb from '@/components/shared/Breadcrumb'
import Eyebrow from '@/components/shared/Eyebrow'

type Tab = 'signin' | 'register'

function LoginContent() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const redirect     = searchParams.get('redirect') ?? '/account'

  const { login, register, isLoggedIn, loading, error, clearError } = useCustomerStore()

  const [tab,             setTab]             = useState<Tab>('signin')
  const [email,           setEmail]           = useState('')
  const [password,        setPassword]        = useState('')
  const [firstName,       setFirstName]       = useState('')
  const [lastName,        setLastName]        = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [localError,      setLocalError]      = useState<string | null>(null)

  useEffect(() => {
    if (isLoggedIn) router.replace(redirect)
  }, [isLoggedIn, redirect, router])

  function handleTabChange(t: Tab) {
    setTab(t)
    setLocalError(null)
    clearError()
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLocalError(null)
    clearError()
    await login(email, password)
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
    await register(firstName, lastName, email, password)
  }

  const displayError = localError ?? error

  const inputClass = 'w-full h-12 px-4 bg-parchment border border-ink-rule rounded-sm text-[14px] font-sans text-ink-iron placeholder:text-ink-soft/50 focus:outline-none focus:border-brass-deep focus:ring-1 focus:ring-brass/20 transition-colors'
  const labelClass = 'block text-[10px] font-mono uppercase tracking-eyebrow text-ink-soft mb-1.5'

  return (
    <div className="bg-parchment min-h-screen">
      <div className="max-w-120 mx-auto px-6 py-14">

        <Breadcrumb
          crumbs={[
            { label: 'Storefront', href: '/' },
            { label: tab === 'signin' ? 'Sign in' : 'Create account' },
          ]}
          className="mb-10"
        />

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
          <form onSubmit={handleLogin} className="space-y-5">
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
