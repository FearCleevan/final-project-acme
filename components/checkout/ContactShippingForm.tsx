'use client'

import { useState } from 'react'

interface ShippingData {
  fullName: string
  email: string
  phone: string
  street: string
  apt: string
  city: string
  state: string
  zip: string
  country: string
  notes: string
}

interface ContactShippingFormProps {
  onComplete: (data: ShippingData) => void
}

type FieldKey = keyof ShippingData

const inputClass =
  'w-full h-[48px] px-4 bg-parchment border border-ink-rule rounded-sm text-[15px] font-sans text-ink-iron placeholder:text-ink-soft/50 focus:outline-none focus:border-brass-deep focus:ring-1 focus:ring-brass/20 transition-colors'

const errorInputClass =
  'w-full h-[48px] px-4 bg-parchment border border-error rounded-sm text-[15px] font-sans text-ink-iron placeholder:text-ink-soft/50 focus:outline-none focus:border-error transition-colors'

const label = (text: string, htmlFor: string, optional?: boolean) => (
  <label htmlFor={htmlFor} className="block text-[11px] font-mono uppercase tracking-eyebrow text-ink-soft mb-1.5">
    {text}{optional && <span className="normal-case tracking-normal text-ink-soft/60 ml-1">(optional)</span>}
  </label>
)

const requiredFields: FieldKey[] = ['fullName', 'email', 'phone', 'street', 'city', 'state', 'zip', 'country']

export default function ContactShippingForm({ onComplete }: ContactShippingFormProps) {
  const [data, setData] = useState<ShippingData>({
    fullName: '', email: '', phone: '', street: '', apt: '',
    city: '', state: '', zip: '', country: '', notes: '',
  })
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({})

  function set(field: FieldKey, value: string) {
    setData(d => ({ ...d, [field]: value }))
    if (errors[field]) setErrors(e => ({ ...e, [field]: undefined }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs: Partial<Record<FieldKey, string>> = {}
    requiredFields.forEach(f => {
      if (!data[f].trim()) errs[f] = 'Required'
    })
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errs.email = 'Invalid email address'
    }
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    onComplete(data)
  }

  const field = (id: string, key: FieldKey, placeholder: string, type = 'text') => (
    <div>
      <input
        id={id} type={type} value={data[key]} autoComplete={id}
        onChange={e => set(key, e.target.value)}
        placeholder={placeholder}
        className={errors[key] ? errorInputClass : inputClass}
      />
      {errors[key] && <p className="mt-1 text-[11px] font-sans text-error">{errors[key]}</p>}
    </div>
  )

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          {label('Full name', 'name')}
          {field('name', 'fullName', 'Margaret H.')}
        </div>
        <div>
          {label('Email', 'email')}
          {field('email', 'email', 'you@example.com', 'email')}
        </div>
      </div>

      <div>
        {label('Phone (for freight)', 'tel')}
        {field('tel', 'phone', '+1 555 000 1873', 'tel')}
      </div>

      <div>
        {label('Street address', 'street-address')}
        {field('street-address', 'street', '14 Pirie Street')}
      </div>

      <div>
        {label('Apt / Suite / Homestead', 'address-line2', true)}
        {field('address-line2', 'apt', 'Unit 2 or Station Name')}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="sm:col-span-1">
          {label('City / Town', 'city')}
          {field('city', 'city', 'Adelaide')}
        </div>
        <div>
          {label('State / Region', 'region')}
          {field('region', 'state', 'SA')}
        </div>
        <div>
          {label('ZIP / Postal', 'postal-code')}
          {field('postal-code', 'zip', '5000')}
        </div>
      </div>

      <div>
        {label('Country', 'country-name')}
        <div className="relative">
          <select
            id="country-name"
            value={data.country}
            onChange={e => set('country', e.target.value)}
            className={`appearance-none pr-8 ${errors.country ? errorInputClass : inputClass}`}
          >
            <option value="" disabled>Select a country</option>
            {['Australia', 'United States', 'United Kingdom', 'Canada', 'New Zealand', 'India', 'Other'].map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft text-[11px]">▾</span>
        </div>
        {errors.country && <p className="mt-1 text-[11px] font-sans text-error">{errors.country}</p>}
      </div>

      <div>
        {label('Notes for the packer', 'notes', true)}
        <textarea
          id="notes" rows={3} value={data.notes}
          onChange={e => set('notes', e.target.value)}
          className={`${inputClass} h-auto min-h-[80px] py-3 resize-none`}
          placeholder="Fragile front step — please leave on porch. Or: wrap the chimney separately."
        />
      </div>

      <div className="pt-2 flex justify-end">
        <button
          type="submit"
          className="min-h-[52px] px-8 bg-green-brand text-[#F5F1E6] rounded-btn font-sans text-[15px] font-semibold hover:bg-green-deep hover:shadow-cta-hover hover:-translate-y-px active:translate-y-0 transition-all duration-200"
        >
          Continue to payment →
        </button>
      </div>

    </form>
  )
}
