'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { BiLockAlt, BiCheck } from 'react-icons/bi'

function ResetPasswordForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const token        = searchParams.get('token') ?? ''

  const [password,  setPassword]  = useState('')
  const [confirm,   setConfirm]   = useState('')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [success,   setSuccess]   = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (password !== confirm)  { setError('Passwords do not match.'); return }
    if (!token)                { setError('Invalid or missing reset token.'); return }

    setLoading(true)
    const res  = await fetch('/api/admin/auth/reset', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ token, password }),
    })
    const data = await res.json().catch(() => ({}))

    if (res.ok) {
      setSuccess(true)
    } else {
      setError(data.error ?? 'Something went wrong.')
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <p className="text-[13px] text-(--admin-red) text-center">
        Invalid reset link. Please request a new one.
      </p>
    )
  }

  if (success) {
    return (
      <div className="text-center space-y-4">
        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mx-auto">
          <BiCheck size={22} className="text-green-600" />
        </div>
        <p className="text-[14px] font-medium text-(--admin-text)">Password reset successfully.</p>
        <p className="text-[12px] text-(--admin-text-muted)">
          Copy the new <code>ADMIN_PASSWORD_HASH</code> from the server logs and update your Vercel environment variables.
        </p>
        <button
          onClick={() => router.push('/admin/login')}
          className="w-full h-9 bg-(--admin-accent) text-(--admin-accent-text) rounded-md text-[13px] font-medium hover:opacity-90 transition-opacity"
        >
          Back to login
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-[12px] font-medium text-(--admin-text) mb-1.5">
          New Password
        </label>
        <div className="relative">
          <BiLockAlt size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-(--admin-text-muted) pointer-events-none" />
          <input
            type="password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError('') }}
            placeholder="At least 8 characters"
            disabled={loading}
            className="w-full h-9 pl-8 pr-3 bg-(--admin-surface-2) border border-(--admin-border) rounded-md text-[13px] text-(--admin-text) placeholder:text-(--admin-text-muted) focus:outline-none focus:border-(--admin-accent) focus:ring-1 focus:ring-(--admin-accent)/20 transition-colors disabled:opacity-60"
          />
        </div>
      </div>

      <div>
        <label className="block text-[12px] font-medium text-(--admin-text) mb-1.5">
          Confirm Password
        </label>
        <div className="relative">
          <BiLockAlt size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-(--admin-text-muted) pointer-events-none" />
          <input
            type="password"
            value={confirm}
            onChange={e => { setConfirm(e.target.value); setError('') }}
            placeholder="Repeat new password"
            disabled={loading}
            className="w-full h-9 pl-8 pr-3 bg-(--admin-surface-2) border border-(--admin-border) rounded-md text-[13px] text-(--admin-text) placeholder:text-(--admin-text-muted) focus:outline-none focus:border-(--admin-accent) focus:ring-1 focus:ring-(--admin-accent)/20 transition-colors disabled:opacity-60"
          />
        </div>
        {error && <p className="text-[11px] text-(--admin-red) mt-1.5">{error}</p>}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full h-9 bg-(--admin-accent) text-(--admin-accent-text) rounded-md text-[13px] font-medium hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {loading && <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
        {loading ? 'Resetting…' : 'Reset password'}
      </button>
    </form>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-(--admin-bg)">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-10 h-10 rounded-md bg-(--admin-accent) flex items-center justify-center mb-3">
            <span className="text-(--admin-accent-text) text-[14px] font-bold">A</span>
          </div>
          <h1 className="text-[18px] font-semibold text-(--admin-text)">Reset Password</h1>
          <p className="text-[12px] uppercase tracking-widest text-(--admin-text-muted) mt-0.5">Acme Vintage Supply</p>
        </div>
        <div className="bg-(--admin-surface) border border-(--admin-border) rounded-lg p-6">
          <Suspense fallback={<p className="text-[13px] text-(--admin-text-muted) text-center">Loading…</p>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
