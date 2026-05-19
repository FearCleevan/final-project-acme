'use client'

import { useState } from 'react'
import Eyebrow from './Eyebrow'
import Button from './Button'

export default function BenchNotesCTA() {
  const [email, setEmail] = useState('')

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

        <form
          onSubmit={e => { e.preventDefault(); setEmail('') }}
          className="flex gap-3 w-full md:w-auto"
          aria-label="Newsletter subscription"
        >
          <label htmlFor="bench-email" className="sr-only">Email address</label>
          <input
            id="bench-email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            className="flex-1 md:w-64 h-[52px] px-4 bg-parchment-2 border border-ink-rule rounded-btn text-[15px] font-sans text-ink-iron placeholder:text-ink-soft/60 focus:outline-none focus:border-brass-deep focus:ring-1 focus:ring-brass/20 transition-colors"
          />
          <Button variant="brass" type="submit">
            Subscribe →
          </Button>
        </form>
      </div>
    </section>
  )
}
