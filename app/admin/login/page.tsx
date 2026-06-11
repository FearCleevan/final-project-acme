'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { BiLockAlt, BiEnvelope } from 'react-icons/bi'
import Link from 'next/link'

export default function AdminLoginPage() {
  const router = useRouter()

  // ── Password step ──────────────────────────────────────────────────────────
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  // ── OTP step ───────────────────────────────────────────────────────────────
  const [step,            setStep]            = useState<'password' | 'otp'>('password')
  const [otp,             setOtp]             = useState('')
  const [pendingToken,    setPendingToken]     = useState('')
  const [maskedEmail,     setMaskedEmail]      = useState('')
  const [resendCountdown, setResendCountdown]  = useState(0)
  const otpInputRef = useRef<HTMLInputElement>(null)

  // Auto-submit when 6 digits entered
  useEffect(() => {
    if (otp.length === 6) void handleOtpSubmit()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp])

  // Resend countdown timer
  useEffect(() => {
    if (resendCountdown <= 0) return
    const id = setInterval(() => setResendCountdown(c => c - 1), 1000)
    return () => clearInterval(id)
  }, [resendCountdown])

  // Focus OTP input on step transition
  useEffect(() => {
    if (step === 'otp') otpInputRef.current?.focus()
  }, [step])

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!password.trim()) { setError('Password is required.'); return }

    setLoading(true)
    setError('')

    const res  = await fetch('/api/admin/auth', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ password }),
    })
    const data = await res.json().catch(() => ({}))

    if (res.ok) {
      setPendingToken(data.pendingToken)
      setMaskedEmail(data.maskedEmail)
      setResendCountdown(60)
      setPassword('')   // clear password from memory
      setStep('otp')
    } else {
      setError(data.error ?? 'Something went wrong.')
    }
    setLoading(false)
  }

  async function handleOtpSubmit() {
    if (otp.length !== 6 || loading) return
    setLoading(true)
    setError('')

    const res  = await fetch('/api/admin/auth/otp', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ pendingToken, code: otp }),
    })
    const data = await res.json().catch(() => ({}))

    if (res.ok) {
      setLoading(false)
      router.push('/admin/overview')
    } else {
      setError(data.error ?? 'Something went wrong.')
      setOtp('')
      setLoading(false)
    }
  }

  async function handleResend() {
    if (resendCountdown > 0 || loading) return
    setError('')
    setLoading(true)

    const res  = await fetch('/api/admin/auth/otp/resend', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ pendingToken }),
    })
    const data = await res.json().catch(() => ({}))

    if (res.ok) {
      setResendCountdown(60)
      setOtp('')
    } else {
      setError(data.error ?? 'Could not resend code.')
    }
    setLoading(false)
  }

  function handleBack() {
    setStep('password')
    setOtp('')
    setError('')
    setPendingToken('')
    setMaskedEmail('')
    setResendCountdown(0)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-(--admin-bg)">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-10 h-10 rounded-md bg-(--admin-accent) flex items-center justify-center mb-3">
            <span className="text-(--admin-accent-text) text-[14px] font-bold">A</span>
          </div>
          <h1 className="text-[18px] font-semibold text-(--admin-text)">Acme Vintage Supply</h1>
          <p className="text-[12px] uppercase tracking-widest text-(--admin-text-muted) mt-0.5">Admin Dashboard</p>
        </div>

        {step === 'password' ? (
          /* ── Password form ── */
          <form onSubmit={handlePasswordSubmit} className="bg-(--admin-surface) border border-(--admin-border) rounded-lg p-6 space-y-4">
            <div>
              <label htmlFor="password" className="block text-[12px] font-medium text-(--admin-text) mb-1.5">
                Password
              </label>
              <div className="relative">
                <BiLockAlt size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-(--admin-text-muted) pointer-events-none" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError('') }}
                  placeholder="Enter admin password"
                  autoComplete="current-password"
                  disabled={loading}
                  className="w-full h-9 pl-8 pr-3 bg-(--admin-surface-2) border border-(--admin-border) rounded-md text-[13px] text-(--admin-text) placeholder:text-(--admin-text-muted) focus:outline-none focus:border-(--admin-accent) focus:ring-1 focus:ring-(--admin-accent)/20 transition-colors disabled:opacity-60"
                />
              </div>
              {error && <p className="text-[11px] text-(--admin-red) mt-1.5">{error}</p>}
              <div className="text-right mt-1">
                <Link href="/admin/forgot-password" className="text-[11px] text-(--admin-text-muted) hover:text-(--admin-accent) transition-colors">
                  Forgot password?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-9 bg-(--admin-accent) text-(--admin-accent-text) rounded-md text-[13px] font-medium hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading && <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
              {loading ? 'Sending code…' : 'Continue'}
            </button>
          </form>
        ) : (
          /* ── OTP form ── */
          <div className="bg-(--admin-surface) border border-(--admin-border) rounded-lg p-6 space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <BiEnvelope size={15} className="text-(--admin-text-muted) shrink-0" />
                <p className="text-[12px] text-(--admin-text-muted)">
                  Code sent to{' '}
                  <span className="text-(--admin-text) font-medium">{maskedEmail}</span>
                </p>
              </div>

              <label htmlFor="otp" className="block text-[12px] font-medium text-(--admin-text) mb-1.5">
                Verification code
              </label>
              <input
                ref={otpInputRef}
                id="otp"
                type="text"
                inputMode="numeric"
                maxLength={6}
                pattern="[0-9]{6}"
                value={otp}
                onChange={e => { setOtp(e.target.value.replace(/\D/g, '')); setError('') }}
                placeholder="000000"
                disabled={loading}
                autoComplete="one-time-code"
                className="w-full h-10 px-3 bg-(--admin-surface-2) border border-(--admin-border) rounded-md text-[22px] text-(--admin-text) text-center tracking-[0.4em] placeholder:text-(--admin-text-muted) placeholder:tracking-normal focus:outline-none focus:border-(--admin-accent) focus:ring-1 focus:ring-(--admin-accent)/20 transition-colors disabled:opacity-60"
              />
              {error && <p className="text-[11px] text-(--admin-red) mt-1.5">{error}</p>}
            </div>

            <button
              type="button"
              onClick={handleResend}
              disabled={resendCountdown > 0 || loading}
              className="w-full h-9 bg-(--admin-surface-2) border border-(--admin-border) text-(--admin-text-muted) rounded-md text-[12px] hover:text-(--admin-text) transition-colors disabled:opacity-50"
            >
              {resendCountdown > 0 ? `Resend code in ${resendCountdown}s` : 'Resend code'}
            </button>

            <button
              type="button"
              onClick={handleBack}
              disabled={loading}
              className="w-full text-[11px] text-(--admin-text-muted) hover:text-(--admin-accent) transition-colors disabled:opacity-50 py-1"
            >
              ← Back to password
            </button>
          </div>
        )}

        <p className="text-center text-[11px] text-(--admin-text-muted) mt-4">
          Acme Vintage Supply Co. — Admin access only
        </p>
      </div>
    </div>
  )
}
