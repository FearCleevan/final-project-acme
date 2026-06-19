'use client'

import { useState } from 'react'

interface ReviewFormProps {
  product: { id: string; handle: string; name: string }
  defaultName: string
  onSuccess: () => void
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0)
  const display = hover || value

  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n !== 1 ? 's' : ''}`}
          className="p-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brass/40 rounded"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
        >
          <svg width={24} height={24} viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path
              d="M7 1l1.545 3.13L12 4.635l-2.5 2.435.59 3.44L7 8.885l-3.09 1.625L4.5 7.07 2 4.635l3.455-.505L7 1z"
              fill={n <= display ? '#C29B47' : 'none'}
              stroke={n <= display ? '#C29B47' : '#B8AD9A'}
              strokeWidth="1"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      ))}
    </div>
  )
}

const labelClass = 'block text-[12px] font-mono uppercase tracking-eyebrow text-ink-soft mb-1.5'
const inputClass = 'w-full h-[44px] px-3 bg-parchment-2 border border-ink-rule rounded-sm text-[14px] font-sans text-ink-charcoal focus:outline-none focus:border-brass-deep focus:ring-1 focus:ring-brass/20 transition-colors'
const textareaClass = 'w-full px-3 py-2.5 bg-parchment-2 border border-ink-rule rounded-sm text-[14px] font-sans text-ink-charcoal focus:outline-none focus:border-brass-deep focus:ring-1 focus:ring-brass/20 transition-colors resize-none'

export default function ReviewForm({ product, defaultName, onSuccess }: ReviewFormProps) {
  const [rating,     setRating]     = useState(0)
  const [name,       setName]       = useState(defaultName)
  const [title,      setTitle]      = useState('')
  const [body,       setBody]       = useState('')
  const [error,      setError]      = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (rating === 0)          { setError('Please select a star rating.'); return }
    if (!name.trim())          { setError('Please enter your name.'); return }
    if (!title.trim())         { setError('Please enter a review title.'); return }
    if (body.trim().length < 20) { setError('Review must be at least 20 characters.'); return }

    setSubmitting(true)
    try {
      const res = await fetch('/api/reviews', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          handle:       product.handle,
          productId:    product.id,
          customerName: name.trim(),
          rating,
          title:        title.trim(),
          body:         body.trim(),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.error === 'already_reviewed') {
          setError('You have already submitted a review for this product.')
        } else if (data.error === 'not_authenticated') {
          setError('Please sign in to submit a review.')
        } else {
          setError('Something went wrong. Please try again.')
        }
        return
      }

      onSuccess()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-lg">
      <div>
        <label className={labelClass}>Overall rating</label>
        <StarPicker value={rating} onChange={setRating} />
      </div>

      <div>
        <label htmlFor="review-name" className={labelClass}>Your name</label>
        <input
          id="review-name"
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Margaret H."
          maxLength={60}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="review-title" className={labelClass}>Review title</label>
        <input
          id="review-title"
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Exactly as described — arrived in perfect condition."
          maxLength={100}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="review-body" className={labelClass}>
          Your review{' '}
          <span className="text-ink-muted normal-case tracking-normal">(min 20 characters)</span>
        </label>
        <textarea
          id="review-body"
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="Share your experience with this product..."
          maxLength={2000}
          rows={5}
          className={textareaClass}
        />
        <p className="text-[11px] font-mono text-ink-muted mt-1 text-right">{body.length}/2000</p>
      </div>

      {error && (
        <p className="text-[13px] font-sans text-red-600 bg-red-50 border border-red-200 rounded-sm px-4 py-2.5">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="h-[44px] px-7 bg-ink-charcoal text-parchment font-sans text-[13px] tracking-wide rounded-sm hover:bg-ink-iron transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? 'Submitting…' : 'Submit review'}
      </button>
    </form>
  )
}
