'use client'

import { useState } from 'react'
import Eyebrow from '@/components/shared/Eyebrow'

interface FormState {
  name: string
  email: string
  subject: string
  message: string
}

interface FormErrors {
  name?: string
  email?: string
  subject?: string
  message?: string
}

const subjectOptions = [
  { value: '', label: 'What\'s this about?' },
  { value: 'general', label: 'General question' },
  { value: 'compatibility', label: 'Part compatibility' },
  { value: 'order', label: 'Order issue' },
  { value: 'wholesale', label: 'Wholesale inquiry' },
  { value: 'other', label: 'Other' },
]

const inputClass =
  'w-full h-[48px] px-4 bg-parchment border border-ink-rule rounded-sm text-[15px] font-sans text-ink-iron placeholder:text-ink-soft/50 focus:outline-none focus:border-brass-deep focus:ring-1 focus:ring-brass/20 transition-colors'

const errorInputClass =
  'w-full h-[48px] px-4 bg-parchment border border-error rounded-sm text-[15px] font-sans text-ink-iron placeholder:text-ink-soft/50 focus:outline-none focus:border-error focus:ring-1 focus:ring-error/20 transition-colors'

export default function ContactForm() {
  const [form, setForm] = useState<FormState>({ name: '', email: '', subject: '', message: '' })
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitted, setSubmitted] = useState(false)

  function validate(): FormErrors {
    const e: FormErrors = {}
    if (!form.name.trim()) e.name = 'Your name is required.'
    if (!form.email.trim()) e.email = 'An email address is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'That doesn\'t look like a valid email.'
    if (!form.subject) e.subject = 'Please choose a subject.'
    if (!form.message.trim()) e.message = 'A message is required.'
    else if (form.message.trim().length < 10) e.message = 'Please say a little more — at least 10 characters.'
    return e
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setErrors({})
    setSubmitted(true)
  }

  function handleChange(field: keyof FormState, value: string) {
    setForm(f => ({ ...f, [field]: value }))
    if (errors[field]) setErrors(e => ({ ...e, [field]: undefined }))
  }

  if (submitted) {
    return (
      <div className="bg-parchment-2 border border-ink-rule rounded-sm p-8 md:p-10 flex flex-col items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-green-brand flex items-center justify-center shrink-0">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <path d="M3 9l4 4 8-8" stroke="#F5F1E6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div>
          <h3 className="font-serif text-[20px] text-ink-charcoal font-medium mb-2">Note received.</h3>
          <p className="font-sans text-[15px] text-ink-soft leading-relaxed max-w-[48ch]">
            We read every message ourselves and usually reply within one business day. No autoresponder will
            contact you. If it&apos;s urgent, call the Adelaide line directly.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-parchment-2 border border-ink-rule rounded-sm p-8 md:p-10">
      <Eyebrow className="mb-3">Write to the workshop</Eyebrow>
      <h2 className="font-serif text-[26px] text-ink-charcoal font-medium mb-8 leading-snug">
        Send us a note.
      </h2>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">

        {/* Name */}
        <div>
          <label htmlFor="contact-name" className="block text-[11px] font-mono uppercase tracking-eyebrow text-ink-soft mb-2">
            Your name
          </label>
          <input
            id="contact-name"
            type="text"
            autoComplete="name"
            value={form.name}
            onChange={e => handleChange('name', e.target.value)}
            className={errors.name ? errorInputClass : inputClass}
            placeholder="Margaret H."
          />
          {errors.name && (
            <p className="mt-1.5 text-[12px] font-sans text-error">{errors.name}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="contact-email" className="block text-[11px] font-mono uppercase tracking-eyebrow text-ink-soft mb-2">
            Email
          </label>
          <input
            id="contact-email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={e => handleChange('email', e.target.value)}
            className={errors.email ? errorInputClass : inputClass}
            placeholder="you@example.com"
          />
          {errors.email && (
            <p className="mt-1.5 text-[12px] font-sans text-error">{errors.email}</p>
          )}
        </div>

        {/* Subject */}
        <div>
          <label htmlFor="contact-subject" className="block text-[11px] font-mono uppercase tracking-eyebrow text-ink-soft mb-2">
            What&apos;s this about?
          </label>
          <div className="relative">
            <select
              id="contact-subject"
              value={form.subject}
              onChange={e => handleChange('subject', e.target.value)}
              className={`appearance-none pr-8 ${errors.subject ? errorInputClass : inputClass}`}
            >
              {subjectOptions.map(o => (
                <option key={o.value} value={o.value} disabled={o.value === ''}>
                  {o.label}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft text-[11px]">▾</span>
          </div>
          {errors.subject && (
            <p className="mt-1.5 text-[12px] font-sans text-error">{errors.subject}</p>
          )}
        </div>

        {/* Message */}
        <div>
          <label htmlFor="contact-message" className="block text-[11px] font-mono uppercase tracking-eyebrow text-ink-soft mb-2">
            Your message
          </label>
          <textarea
            id="contact-message"
            rows={5}
            value={form.message}
            onChange={e => handleChange('message', e.target.value)}
            className={`resize-none py-3 h-auto ${errors.message ? errorInputClass : inputClass}`}
            style={{ height: 'auto', minHeight: '120px' }}
            placeholder="Tell us what you're trying to light — or what's gone dark."
          />
          {errors.message && (
            <p className="mt-1.5 text-[12px] font-sans text-error">{errors.message}</p>
          )}
        </div>

        {/* Submit */}
        <div className="pt-2">
          <button
            type="submit"
            className="w-full min-h-[56px] bg-green-brand text-[#F5F1E6] rounded-btn font-sans text-[16px] font-semibold hover:bg-green-deep hover:shadow-cta-hover hover:-translate-y-px active:translate-y-0 transition-all duration-200"
          >
            Send the note →
          </button>
          <p className="mt-3 text-[10px] font-mono uppercase tracking-eyebrow text-ink-soft leading-relaxed">
            We answer every message ourselves. No marketing list. No resale. No autoreplies.
          </p>
        </div>

      </form>
    </div>
  )
}
