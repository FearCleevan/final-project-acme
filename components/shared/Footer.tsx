'use client'

import { useState } from 'react'
import Link from 'next/link'
import Eyebrow from './Eyebrow'
import Button from './Button'

const catalogLinks = [
  { label: 'Lighting Fixtures', href: '/catalog?category=lighting' },
  { label: 'Glass & Chimneys', href: '/catalog?category=glass-chimneys' },
  { label: 'Burners & Wicks', href: '/catalog?category=hardware' },
  { label: 'Signs', href: '/catalog?category=signs' },
  { label: 'The Full Catalog →', href: '/catalog' },
]

const workshopLinks = [
  { label: 'Our Story', href: '/our-story' },
  { label: 'Heritage Timeline', href: '/heritage' },
  { label: 'Bench Notes (Journal)', href: '/journal' },
  { label: 'Lamp-Lighting Guide', href: '/guides' },
  { label: 'Restoration Services', href: '/restoration' },
]

const serviceLinks = [
  { label: 'Track your order', href: '/track-order' },
  { label: 'Contact a person', href: '/contact' },
  { label: 'Shipping & Freight', href: '/shipping' },
  { label: '30-Day Returns', href: '/returns' },
  { label: 'FAQ', href: '/faq' },
]

export default function Footer() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return

    setStatus('loading')
    setErrorMessage('')

    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const json = await res.json()
      if (json.success) {
        setStatus('success')
        setEmail('')
      } else {
        setStatus('error')
        setErrorMessage('Something went wrong. Please try again.')
      }
    } catch {
      setStatus('error')
      setErrorMessage('Something went wrong. Please try again.')
    }
  }

  return (
    <footer aria-label="Site footer">
      {/* Newsletter strip */}
      <div className="bg-parchment-2 border-t border-ink-rule py-14 px-6">
        <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="max-w-[40ch]">
            <Eyebrow className="mb-2">A letter, not a marketing list</Eyebrow>
            <h3 className="font-serif text-[24px] font-medium text-ink-charcoal mb-2">
              Bench notes, once a month.
            </h3>
            <p className="text-[14px] text-ink-soft leading-relaxed">
              One letter each season, plus a head-start on new arrivals.
              Real writing from the workshop. No promo codes shouted in all caps.
            </p>
          </div>

          <div className="w-full md:w-auto flex flex-col items-start md:items-end">
            <form
              onSubmit={handleSubscribe}
              className="flex gap-2 w-full md:w-auto self-center md:self-auto"
            >
              <label htmlFor="footer-email" className="sr-only">Email address</label>
              <input
                id="footer-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={status === 'success' ? "Thank you!" : "your@email.com"}
                required
                disabled={status === 'loading' || status === 'success'}
                className="flex-1 md:w-56 h-13 px-4 bg-parchment border border-ink-rule rounded-btn text-[15px] text-ink-iron placeholder:text-ink-soft/60 focus:outline-none focus:border-brass-deep transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              />
              <Button 
                variant={status === 'success' ? 'brass' : 'brass'} 
                type="submit"
                disabled={status === 'loading' || status === 'success'}
                className="min-w-30 relative flex items-center justify-center transition-all"
              >
                {status === 'loading' && (
                  <span className="inline-block w-4 h-4 border-2 border-parchment border-t-transparent rounded-full animate-spin mr-2" />
                )}
                {status === 'loading' && 'Sending...'}
                {status === 'success' && 'Subscribed!'}
                {status === 'idle' && 'Subscribe'}
                {status === 'error' && 'Retry'}
              </Button>
            </form>

            {/* Status Messages */}
            {status === 'success' && (
              <p className="text-[12px] font-sans text-emerald-700 mt-2 self-center md:self-start animate-fade-in">
                ✓ You are on the workshop dispatch list.
              </p>
            )}
            {status === 'error' && (
              <p className="text-[12px] font-sans text-rose-700 mt-2 self-center md:self-start animate-fade-in">
                ✕ {errorMessage}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Dark canvas footer */}
      <div className="canvas-dark px-6 py-14">
        <div className="max-w-[1280px] mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            {/* Col 1 — Brand */}
            <div>
              <p className="font-serif text-[20px] font-bold text-canvas-heading mb-2">
                Acme Vintage Supply
              </p>
              <p className="text-[13px] text-canvas-muted leading-relaxed mb-5">
                Precision-reproduced antique oil lamp parts, hand-blown glass, and
                reproduction porcelain signs — made on original OLC tooling in Melbourne,
                now available across North America for the first time.
              </p>
              <Eyebrow light className="mb-2">North America · Distribution</Eyebrow>
              <address className="not-italic text-[13px] text-canvas-muted leading-relaxed">
                Nova Scotia, Canada<br />
                <a
                  href="tel:+19025551873"
                  className="text-brass hover:text-brass-deep transition-colors"
                >
                  +1 (902) 555-1873
                </a>
              </address>
            </div>

            {/* Col 2 — Catalog */}
            <div>
              <Eyebrow light className="mb-4">Catalog</Eyebrow>
              <ul className="space-y-2">
                {catalogLinks.map(l => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-[14px] text-canvas-muted hover:text-canvas-body transition-colors"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 3 — Workshop */}
            <div>
              <Eyebrow light className="mb-4">The Workshop</Eyebrow>
              <ul className="space-y-2">
                {workshopLinks.map(l => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-[14px] text-canvas-muted hover:text-canvas-body transition-colors"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 4 — Service */}
            <div>
              <Eyebrow light className="mb-4">Service</Eyebrow>
              <ul className="space-y-2">
                {serviceLinks.map(l => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-[14px] text-canvas-muted hover:text-canvas-body transition-colors"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom micro-bar */}
          <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <p className="text-[11px] font-mono uppercase tracking-eyebrow text-canvas-dim">
              © 1873–2026 · Acme Vintage Supply · All marks honoured.
            </p>
            <nav aria-label="Legal links" className="flex flex-wrap gap-x-4 gap-y-1">
              {[
                { label: 'Privacy Policy', href: '/legal/privacy-policy' },
                { label: 'Terms & Conditions', href: '/legal/terms' },
                { label: 'Accessibility', href: '/legal/accessibility' },
              ].map(l => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="text-[11px] font-mono uppercase tracking-eyebrow text-canvas-dim hover:text-canvas-muted transition-colors"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </footer>
  )
}