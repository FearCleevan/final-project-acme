'use client'

import { useState } from 'react'
import Eyebrow from './Eyebrow'
import Button from './Button'

export default function BenchNotesCTA() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return

    setStatus('loading')
    setErrorMessage('')

    try {
      // Simulate real workshop database roundtrip latency delay
      await new Promise((resolve) => setTimeout(resolve, 1500))

      setStatus('success')
      setEmail('')
    } catch (error) {
      setStatus('error')
      setErrorMessage('Something went wrong. Please try again.')
    }
  }

  return (
    <section className="bg-parchment py-20 px-6">
      <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row items-start md:items-end justify-between gap-8">
        <div className="max-w-[44ch]">
          <Eyebrow className="mb-3">A letter, not a marketing list</Eyebrow>
          <h2 className="font-serif text-[clamp(24px,3vw,36px)] font-medium text-ink-charcoal leading-tight mb-4">
            Bench notes, once a month.
          </h2>
          <p className="font-sans text-[15px] text-ink-soft leading-relaxed">
            One letter each season, plus a head-start on the next crate of fifty.
            Real writing from the workshop. No promo codes shouted in all caps.
          </p>
        </div>

        <div className="w-full md:w-auto flex flex-col items-start md:items-end">
          <form
            onSubmit={handleSubscribe}
            className="flex gap-3 w-full md:w-auto"
            aria-label="Newsletter subscription"
          >
            <label htmlFor="bench-email" className="sr-only">Email address</label>
            <input
              id="bench-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder={status === 'success' ? "Thank you!" : "your@email.com"}
              required
              disabled={status === 'loading' || status === 'success'}
              className="flex-1 md:w-64 h-13 px-4 bg-parchment-2 border border-ink-rule rounded-btn text-[15px] font-sans text-ink-iron placeholder:text-ink-soft/60 focus:outline-none focus:border-brass-deep focus:ring-1 focus:ring-brass/20 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            />
            <Button 
              variant="brass" 
              type="submit"
              disabled={status === 'loading' || status === 'success'}
              className="min-w-35 h-13 relative flex items-center justify-center transition-all"
            >
              {status === 'loading' && (
                <span className="inline-block w-4 h-4 border-2 border-parchment border-t-transparent rounded-full animate-spin mr-2" />
              )}
              {status === 'loading' && 'Sending...'}
              {status === 'success' && 'Subscribed!'}
              {status === 'idle' && 'Subscribe →'}
              {status === 'error' && 'Retry'}
            </Button>
          </form>

          {/* Status Messages */}
          {status === 'success' && (
            <p className="text-[12px] font-sans text-emerald-700 mt-2 self-start animate-fade-in">
              ✓ You are on the workshop dispatch list.
            </p>
          )}
          {status === 'error' && (
            <p className="text-[12px] font-sans text-rose-700 mt-2 self-start animate-fade-in">
              ✕ {errorMessage}
            </p>
          )}
        </div>
      </div>
    </section>
  )
}