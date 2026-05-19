'use client'

import { useState } from 'react'

interface PaymentFormProps {
  onComplete: () => void
}

const inputClass =
  'w-full h-[48px] px-4 bg-parchment border border-ink-rule rounded-sm text-[15px] font-sans text-ink-iron placeholder:text-ink-soft/50 focus:outline-none focus:border-brass-deep focus:ring-1 focus:ring-brass/20 transition-colors'

const errorInputClass =
  'w-full h-[48px] px-4 bg-parchment border border-error rounded-sm text-[15px] font-sans text-ink-iron placeholder:text-ink-soft/50 focus:outline-none focus:border-error transition-colors'

const label = (text: string, htmlFor: string) => (
  <label htmlFor={htmlFor} className="block text-[11px] font-mono uppercase tracking-eyebrow text-ink-soft mb-1.5">
    {text}
  </label>
)

function formatCardNumber(v: string) {
  return v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()
}

function formatExpiry(v: string) {
  const digits = v.replace(/\D/g, '').slice(0, 4)
  return digits.length > 2 ? `${digits.slice(0, 2)} / ${digits.slice(2)}` : digits
}

export default function PaymentForm({ onComplete }: PaymentFormProps) {
  const [card, setCard] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')
  const [name, setName] = useState('')
  const [errors, setErrors] = useState<{ card?: string; expiry?: string; cvv?: string; name?: string }>({})

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs: typeof errors = {}
    if (card.replace(/\s/g, '').length < 16) errs.card = 'Enter a 16-digit card number'
    if (expiry.replace(/\s/g, '').replace('/', '').length < 4) errs.expiry = 'Enter a valid expiry date'
    if (cvv.length < 3) errs.cvv = 'Enter a 3 or 4 digit CVV'
    if (!name.trim()) errs.name = 'Name on card is required'
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    onComplete()
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">

      <div className="bg-parchment-2 border border-ink-rule rounded-sm px-4 py-3 flex items-center gap-3 mb-2">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
          <rect x="1" y="4" width="16" height="11" rx="1.5" stroke="#9C7A2E" strokeWidth="1.4" />
          <path d="M1 7.5h16" stroke="#9C7A2E" strokeWidth="1.4" />
          <rect x="3.5" y="10" width="4" height="2" rx="0.5" fill="#9C7A2E" />
        </svg>
        <p className="text-[12px] font-mono uppercase tracking-eyebrow text-ink-soft">
          Mock payment — no real charge will be made
        </p>
      </div>

      <div>
        {label('Card number', 'card-number')}
        <input
          id="card-number"
          type="text"
          inputMode="numeric"
          value={card}
          onChange={e => {
            setCard(formatCardNumber(e.target.value))
            if (errors.card) setErrors(x => ({ ...x, card: undefined }))
          }}
          placeholder="1234 5678 9012 3456"
          maxLength={19}
          className={errors.card ? errorInputClass : inputClass}
        />
        {errors.card && <p className="mt-1 text-[11px] font-sans text-error">{errors.card}</p>}
      </div>

      <div>
        {label('Name on card', 'card-name')}
        <input
          id="card-name"
          type="text"
          autoComplete="cc-name"
          value={name}
          onChange={e => {
            setName(e.target.value)
            if (errors.name) setErrors(x => ({ ...x, name: undefined }))
          }}
          placeholder="Margaret H."
          className={errors.name ? errorInputClass : inputClass}
        />
        {errors.name && <p className="mt-1 text-[11px] font-sans text-error">{errors.name}</p>}
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div>
          {label('Expiry', 'cc-exp')}
          <input
            id="cc-exp"
            type="text"
            inputMode="numeric"
            value={expiry}
            onChange={e => {
              setExpiry(formatExpiry(e.target.value))
              if (errors.expiry) setErrors(x => ({ ...x, expiry: undefined }))
            }}
            placeholder="MM / YY"
            maxLength={7}
            className={errors.expiry ? errorInputClass : inputClass}
          />
          {errors.expiry && <p className="mt-1 text-[11px] font-sans text-error">{errors.expiry}</p>}
        </div>
        <div>
          {label('CVV', 'cc-csc')}
          <input
            id="cc-csc"
            type="text"
            inputMode="numeric"
            value={cvv}
            onChange={e => {
              setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))
              if (errors.cvv) setErrors(x => ({ ...x, cvv: undefined }))
            }}
            placeholder="123"
            maxLength={4}
            className={errors.cvv ? errorInputClass : inputClass}
          />
          {errors.cvv && <p className="mt-1 text-[11px] font-sans text-error">{errors.cvv}</p>}
        </div>
      </div>

      <div className="pt-2 flex justify-end">
        <button
          type="submit"
          className="min-h-[52px] px-8 bg-green-brand text-[#F5F1E6] rounded-btn font-sans text-[15px] font-semibold hover:bg-green-deep hover:shadow-cta-hover hover:-translate-y-px active:translate-y-0 transition-all duration-200"
        >
          Review order →
        </button>
      </div>

    </form>
  )
}
