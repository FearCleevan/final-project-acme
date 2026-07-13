'use client'

import { useState } from 'react'

interface Props {
  productHandle: string
  productTitle:  string
}

export default function ProductInquiryForm({ productHandle, productTitle }: Props): React.ReactElement {
  const [open,    setOpen]    = useState(false)
  const [name,    setName]    = useState('')
  const [email,   setEmail]   = useState('')
  const [message, setMessage] = useState('')
  const [status,  setStatus]  = useState<'idle' | 'loading' | 'done' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !message.trim()) return
    setStatus('loading')

    try {
      const res = await fetch('/api/contact', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:    name.trim(),
          email:   email.trim(),
          subject: `Product inquiry: ${productTitle}`,
          message: message.trim(),
          product_handle: productHandle,
          product_title:  productTitle,
        }),
      })
      const data = await res.json() as { success?: boolean }
      if (!res.ok || !data.success) { setStatus('error'); return }
      setStatus('done')
    } catch {
      setStatus('error')
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="font-sans text-[13px] text-brass-deep hover:text-brass underline underline-offset-2 transition-colors"
      >
        Inquire about this item
      </button>
    )
  }

  if (status === 'done') {
    return (
      <div className="border border-ink-rule rounded-sm px-5 py-4 bg-parchment-2">
        <p className="font-serif text-[16px] text-ink-charcoal mb-0.5">Thanks — question sent.</p>
        <p className="font-sans text-[13px] text-ink-soft">
          We&apos;ll reply to <span className="text-ink-iron font-medium">{email}</span> shortly.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="border border-ink-rule rounded-sm px-4 py-3 bg-parchment-2">
        <p className="font-sans text-[12px] text-ink-soft uppercase tracking-eyebrow mb-0.5">
          Ask about this item
        </p>
        <p className="font-sans text-[13px] text-ink-iron">
          We&apos;ll reply by email.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-2">
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Your name"
          required
          disabled={status === 'loading'}
          className="w-full h-11 px-4 bg-parchment-2 border border-ink-rule rounded-sm text-[14px] font-sans text-ink-iron placeholder:text-ink-soft/50 focus:outline-none focus:border-brass-deep focus:ring-1 focus:ring-brass/20 transition-colors disabled:opacity-60"
        />
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Your email"
          required
          disabled={status === 'loading'}
          className="w-full h-11 px-4 bg-parchment-2 border border-ink-rule rounded-sm text-[14px] font-sans text-ink-iron placeholder:text-ink-soft/50 focus:outline-none focus:border-brass-deep focus:ring-1 focus:ring-brass/20 transition-colors disabled:opacity-60"
        />
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Your question…"
          required
          rows={3}
          disabled={status === 'loading'}
          className="w-full px-4 py-3 bg-parchment-2 border border-ink-rule rounded-sm text-[14px] font-sans text-ink-iron placeholder:text-ink-soft/50 focus:outline-none focus:border-brass-deep focus:ring-1 focus:ring-brass/20 transition-colors disabled:opacity-60 resize-y"
        />
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={status === 'loading'}
            className="h-11 px-5 bg-green-brand text-[#F5F1E6] rounded-btn font-sans text-[13px] font-semibold hover:bg-green-deep transition-colors shrink-0 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {status === 'loading' ? 'Sending…' : 'Send Inquiry'}
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            disabled={status === 'loading'}
            className="font-sans text-[13px] text-ink-soft hover:text-ink-iron transition-colors disabled:opacity-60"
          >
            Cancel
          </button>
        </div>
      </form>

      {status === 'error' && (
        <p className="font-sans text-[12px] text-red-600">
          Something went wrong. Please try again.
        </p>
      )}
    </div>
  )
}
