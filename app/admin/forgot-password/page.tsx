'use client'

import { useState } from 'react'
import Link from 'next/link'
import { BiEnvelope, BiArrowBack, BiCheck } from 'react-icons/bi'

export default function ForgotPasswordPage() {
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [sent,    setSent]    = useState(false)
  const [error,   setError]   = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) { setError('Email is required.'); return }
    setLoading(true)
    setError('')

    await fetch('/api/admin/auth/forgot', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email }),
    })

    // Always show success — never reveal if email exists
    setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-(--admin-bg)">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-10 h-10 rounded-md bg-(--admin-accent) flex items-center justify-center mb-3">
            <span className="text-(--admin-accent-text) text-[14px] font-bold">A</span>
          </div>
          <h1 className="text-[18px] font-semibold text-(--admin-text)">Forgot Password</h1>
          <p className="text-[12px] uppercase tracking-widest text-(--admin-text-muted) mt-0.5">Acme Lamp &amp; Sign</p>
        </div>

        <div className="bg-(--admin-surface) border border-(--admin-border) rounded-lg p-6">
          {sent ? (
            <div className="text-center space-y-4">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <BiCheck size={22} className="text-green-600" />
              </div>
              <p className="text-[14px] font-medium text-(--admin-text)">Check your email</p>
              <p className="text-[12px] text-(--admin-text-muted) leading-relaxed">
                If that email matches the admin account, you'll receive a reset link within a minute. The link expires in 15 minutes.
              </p>
              <Link
                href="/admin/login"
                className="flex items-center justify-center gap-1.5 text-[12px] text-(--admin-accent) hover:opacity-80 transition-opacity"
              >
                <BiArrowBack size={13} /> Back to login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-[12px] text-(--admin-text-muted) leading-relaxed">
                Enter the email address associated with your admin account and we'll send you a reset link.
              </p>
              <div>
                <label className="block text-[12px] font-medium text-(--admin-text) mb-1.5">
                  Email address
                </label>
                <div className="relative">
                  <BiEnvelope size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-(--admin-text-muted) pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError('') }}
                    placeholder="acmesign01@gmail.com"
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
                {loading ? 'Sending…' : 'Send reset link'}
              </button>

              <Link
                href="/admin/login"
                className="flex items-center justify-center gap-1.5 text-[12px] text-(--admin-text-muted) hover:text-(--admin-text) transition-colors"
              >
                <BiArrowBack size={13} /> Back to login
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
