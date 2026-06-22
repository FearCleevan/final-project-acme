'use client'

import { useState } from 'react'

interface Props {
  productHandle: string
  productTitle:  string
}

export default function NotifyMeForm({ productHandle, productTitle }: Props): React.ReactElement {
  const [email,  setEmail]  = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'already' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault()
    if (!email.trim()) return
    setStatus('loading')

    try {
      const res = await fetch('/api/notify-me', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: email.trim(), productHandle, productTitle }),
      })
      const data = await res.json() as { result?: string }
      if (!res.ok) { setStatus('error'); return }
      setStatus(data.result === 'already_registered' ? 'already' : 'done')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'done') {
    return (
      <div className="border border-ink-rule rounded-sm px-5 py-4 bg-parchment-2">
        <p className="font-serif text-[16px] text-ink-charcoal mb-0.5">You&apos;re on the list.</p>
        <p className="font-sans text-[13px] text-ink-soft">
          We&apos;ll email you at <span className="text-ink-iron font-medium">{email}</span> the moment this is back in stock.
        </p>
      </div>
    )
  }

  if (status === 'already') {
    return (
      <div className="border border-ink-rule rounded-sm px-5 py-4 bg-parchment-2">
        <p className="font-sans text-[13px] text-ink-soft">
          You&apos;re already registered for restock notifications on this item.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="border border-ink-rule rounded-sm px-4 py-3 bg-parchment-2">
        <p className="font-sans text-[12px] text-ink-soft uppercase tracking-eyebrow mb-0.5">Out of stock</p>
        <p className="font-sans text-[13px] text-ink-iron">
          Get an email the moment this piece is back on the bench.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Your email"
          required
          disabled={status === 'loading'}
          className="flex-1 h-12 px-4 bg-parchment-2 border border-ink-rule rounded-sm text-[14px] font-sans text-ink-iron placeholder:text-ink-soft/50 focus:outline-none focus:border-brass-deep focus:ring-1 focus:ring-brass/20 transition-colors disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="h-12 px-5 bg-green-brand text-[#F5F1E6] rounded-btn font-sans text-[13px] font-semibold hover:bg-green-deep transition-colors shrink-0 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {status === 'loading' ? 'Saving…' : 'Notify me'}
        </button>
      </form>

      {status === 'error' && (
        <p className="font-sans text-[12px] text-red-600">
          Something went wrong. Please try again.
        </p>
      )}
    </div>
  )
}
