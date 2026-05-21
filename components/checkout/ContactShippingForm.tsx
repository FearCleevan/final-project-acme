'use client'

import { useState, useEffect } from 'react'
import { useAuthStore, SavedAddress } from '@/store/authStore'
import AuthModal from '@/components/shared/AuthModal'

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
  'w-full h-12 px-4 bg-parchment border border-ink-rule rounded-sm text-[15px] font-sans text-ink-iron placeholder:text-ink-soft/50 focus:outline-none focus:border-brass-deep focus:ring-1 focus:ring-brass/20 transition-colors'
const errorInputClass =
  'w-full h-12 px-4 bg-parchment border border-error rounded-sm text-[15px] font-sans text-ink-iron placeholder:text-ink-soft/50 focus:outline-none focus:border-error transition-colors'

const fieldLabel = (text: string, htmlFor: string, optional?: boolean) => (
  <label htmlFor={htmlFor} className="block text-[11px] font-mono uppercase tracking-eyebrow text-ink-soft mb-1.5">
    {text}{optional && <span className="normal-case tracking-normal text-ink-soft/60 ml-1">(optional)</span>}
  </label>
)

const requiredFields: FieldKey[] = ['fullName', 'email', 'phone', 'street', 'city', 'state', 'zip', 'country']

const empty: ShippingData = {
  fullName: '', email: '', phone: '', street: '', apt: '',
  city: '', state: '', zip: '', country: '', notes: '',
}

function addressToShipping(a: SavedAddress): ShippingData {
  return { fullName: a.fullName, email: a.email, phone: a.phone, street: a.street, apt: a.apt, city: a.city, state: a.state, zip: a.zip, country: a.country, notes: '' }
}

export default function ContactShippingForm({ onComplete }: ContactShippingFormProps) {
  const { isAuthenticated, savedAddress, setSavedAddress } = useAuthStore()
  const [data, setData] = useState<ShippingData>(empty)
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({})
  const [saveAddr, setSaveAddr] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)

  /* Pre-fill from saved address when user is authenticated */
  useEffect(() => {
    if (isAuthenticated && savedAddress) {
      setData(addressToShipping(savedAddress))
      setSaveAddr(true)
    }
  }, [isAuthenticated, savedAddress])

  function set(field: FieldKey, value: string) {
    setData(d => ({ ...d, [field]: value }))
    if (errors[field]) setErrors(e => ({ ...e, [field]: undefined }))
  }

  function handleSaveToggle() {
    if (!isAuthenticated) {
      setAuthModalOpen(true)
    } else {
      setSaveAddr(v => !v)
    }
  }

  /* Called after successful sign-in from AuthModal */
  function handleAuthSuccess() {
    setSaveAddr(true)
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

    if (isAuthenticated && saveAddr) {
      setSavedAddress({
        fullName: data.fullName, email: data.email, phone: data.phone,
        street: data.street, apt: data.apt, city: data.city,
        state: data.state, zip: data.zip, country: data.country,
      })
    }

    onComplete(data)
  }

  const field = (id: string, key: FieldKey, placeholder: string, type = 'text') => (
    <div>
      <input id={id} type={type} value={data[key]} autoComplete={id}
        onChange={e => set(key, e.target.value)} placeholder={placeholder}
        className={errors[key] ? errorInputClass : inputClass} />
      {errors[key] && <p className="mt-1 text-[11px] font-sans text-error">{errors[key]}</p>}
    </div>
  )

  return (
    <>
      <form onSubmit={handleSubmit} noValidate className="space-y-5">

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            {fieldLabel('Full name', 'name')}
            {field('name', 'fullName', 'Margaret H.')}
          </div>
          <div>
            {fieldLabel('Email', 'email')}
            {field('email', 'email', 'you@example.com', 'email')}
          </div>
        </div>

        <div>
          {fieldLabel('Phone (for freight)', 'tel')}
          {field('tel', 'phone', '+1 555 000 1873', 'tel')}
        </div>

        <div>
          {fieldLabel('Street address', 'street-address')}
          {field('street-address', 'street', '14 Pirie Street')}
        </div>

        <div>
          {fieldLabel('Apt / Suite / Homestead', 'address-line2', true)}
          {field('address-line2', 'apt', 'Unit 2 or Station Name')}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="sm:col-span-1">
            {fieldLabel('City / Town', 'city')}
            {field('city', 'city', 'Halifax')}
          </div>
          <div>
            {fieldLabel('State / Region', 'region')}
            {field('region', 'state', 'SA')}
          </div>
          <div>
            {fieldLabel('ZIP / Postal', 'postal-code')}
            {field('postal-code', 'zip', '5000')}
          </div>
        </div>

        <div>
          {fieldLabel('Country', 'country-name')}
          <div className="relative">
            <select id="country-name" value={data.country} onChange={e => set('country', e.target.value)}
              className={`appearance-none pr-8 ${errors.country ? errorInputClass : inputClass}`}>
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
          {fieldLabel('Notes for the packer', 'notes', true)}
          <textarea id="notes" rows={3} value={data.notes} onChange={e => set('notes', e.target.value)}
            className={`${inputClass} h-auto min-h-20 py-3 resize-none`}
            placeholder="Fragile front step — please leave on porch. Or: wrap the chimney separately." />
        </div>

        {/* Save address toggle */}
        <div className="border border-ink-rule rounded-sm px-4 py-3.5 flex items-start gap-3">
          <button
            type="button"
            role="checkbox"
            aria-checked={saveAddr}
            onClick={handleSaveToggle}
            className={`mt-0.5 w-5 h-5 rounded-sm border-2 flex items-center justify-center shrink-0 transition-colors ${
              saveAddr ? 'bg-green-brand border-green-brand' : 'border-ink-rule hover:border-ink-iron'
            }`}
          >
            {saveAddr && (
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true">
                <path d="M1.5 5.5l3 3 5-6" stroke="#F5F1E6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
          <div className="flex-1">
            <p className="font-sans text-[14px] text-ink-iron font-medium leading-snug">
              Save this address for next time
            </p>
            {!isAuthenticated ? (
              <p className="font-sans text-[12px] text-ink-soft mt-0.5">
                <button type="button" onClick={() => setAuthModalOpen(true)} className="text-brass-deep hover:text-brass underline transition-colors">
                  Sign in or create an account
                </button>
                {' '}to save your billing address.
              </p>
            ) : (
              <p className="font-sans text-[12px] text-ink-soft mt-0.5">
                {savedAddress ? 'Your address is saved — update it by submitting this form.' : 'Your address will be saved to your account.'}
              </p>
            )}
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button type="submit"
            className="min-h-13 px-8 bg-green-brand text-[#F5F1E6] rounded-btn font-sans text-[15px] font-semibold hover:bg-green-deep hover:shadow-cta-hover hover:-translate-y-px active:translate-y-0 transition-all duration-200">
            Continue to payment →
          </button>
        </div>

      </form>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
        hint="Sign in to save your billing address"
      />
    </>
  )
}
