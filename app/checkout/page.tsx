'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCrateStore } from '@/store/crateStore'
import { useCurrencyStore } from '@/store/currencyStore'
import { formatCurrencyPrice } from '@/lib/currency'
import CurrencyPrice from '@/components/shared/CurrencyPrice'
import Breadcrumb from '@/components/shared/Breadcrumb'
import Eyebrow from '@/components/shared/Eyebrow'
import CheckoutSteps from '@/components/checkout/CheckoutSteps'
import ContactShippingForm, { ShippingData } from '@/components/checkout/ContactShippingForm'
import PaymentForm from '@/components/checkout/PaymentForm'
import OrderSummary from '@/components/checkout/OrderSummary'

type Step = 1 | 2 | 3

export default function CheckoutPage() {
  const { currency, rates } = useCurrencyStore()
  const fmt = (amount: number) => formatCurrencyPrice(amount, currency, rates)
  const router = useRouter()
  const items = useCrateStore(s => s.items)
  const clearCrate = useCrateStore(s => s.clearCrate)
  const [step, setStep] = useState<Step>(1)
  const [mounted, setMounted] = useState(false)
  const [shippingData, setShippingData] = useState<ShippingData | null>(null)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (mounted && items.length === 0 && step === 1) {
      router.replace('/catalog')
    }
  }, [mounted, items.length, step, router])

  if (!mounted) return null

  function handleShippingComplete(data: ShippingData) { setShippingData(data); setStep(2) }

  function handlePaymentComplete() { setStep(3) }

  function handlePlaceOrder() {
    clearCrate()
    router.push('/checkout/confirmed')
  }

  const accordionPanel = (
    n: Step,
    title: string,
    children: React.ReactNode
  ) => {
    const open = step === n
    const done = step > n
    const locked = step < n

    return (
      <div className={`border rounded-sm transition-colors ${open ? 'border-brass-deep' : 'border-ink-rule'}`}>
        {/* Header */}
        <div className={`flex items-center gap-4 px-6 py-5 ${locked ? 'opacity-50' : ''}`}>
          <div
            className={[
              'w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-mono font-medium shrink-0',
              done  ? 'bg-green-brand text-[#F5F1E6]' : '',
              open  ? 'bg-brass-deep text-[#F5F1E6]' : '',
              locked ? 'border-2 border-ink-rule text-ink-soft' : '',
            ].join(' ')}
          >
            {done ? (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M2 7l3.5 3.5 6.5-7" stroke="#F5F1E6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : n}
          </div>
          <h2 className={`font-serif text-[20px] font-medium ${open ? 'text-ink-charcoal' : 'text-ink-soft'}`}>
            {title}
          </h2>
          {done && (
            <button
              className="ml-auto text-[11px] font-mono uppercase tracking-eyebrow text-brass-deep hover:text-brass transition-colors"
              onClick={() => setStep(n)}
            >
              Edit
            </button>
          )}
        </div>

        {/* Body */}
        {open && (
          <div className="px-6 pb-8 border-t border-ink-rule">
            <div className="pt-6">{children}</div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="bg-parchment min-h-screen">
      <div className="max-w-[1280px] mx-auto px-6 py-12">

        <Breadcrumb
          crumbs={[
            { label: 'Storefront', href: '/' },
            { label: 'Your Crate', href: '/crate' },
            { label: 'Checkout' },
          ]}
          className="mb-8"
        />

        <Eyebrow className="mb-3">
          {step === 1 ? 'Step 1 of 3' : step === 2 ? 'Step 2 of 3 · Details & Payment' : 'Step 3 of 3 · Review'}
        </Eyebrow>
        <h1
          className="font-serif font-medium text-ink-charcoal mb-10"
          style={{ fontSize: 'clamp(28px, 3.5vw, 48px)' }}
        >
          Checkout.
        </h1>

        <CheckoutSteps currentStep={step} />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10 xl:gap-16 items-start">

          {/* Accordion panels */}
          <div className="space-y-4">

            {accordionPanel(1, 'Contact & shipping', (
              <ContactShippingForm onComplete={handleShippingComplete} />
            ))}

            {accordionPanel(2, 'Payment', (
              <PaymentForm onComplete={handlePaymentComplete} />
            ))}

            {accordionPanel(3, 'Review & place order', (
              <div className="space-y-6">

                {/* Shipping address review */}
                {shippingData && (
                  <div className="border border-ink-rule rounded-sm p-4">
                    <p className="text-[10px] font-mono uppercase tracking-eyebrow text-ink-soft mb-3">
                      Shipping to
                    </p>
                    <p className="font-sans text-[14px] text-ink-iron font-medium leading-snug">
                      {shippingData.fullName}
                    </p>
                    <p className="font-sans text-[13px] text-ink-soft mt-0.5">
                      {shippingData.street}{shippingData.apt ? `, ${shippingData.apt}` : ''}
                    </p>
                    <p className="font-sans text-[13px] text-ink-soft">
                      {shippingData.city}, {shippingData.state} {shippingData.zip}
                    </p>
                    <p className="font-sans text-[13px] text-ink-soft">{shippingData.country}</p>
                    <p className="font-sans text-[12px] text-ink-soft mt-1.5">
                      {shippingData.email} · {shippingData.phone}
                    </p>
                    {shippingData.notes && (
                      <p className="font-sans text-[12px] text-ink-soft italic mt-1.5">
                        &ldquo;{shippingData.notes}&rdquo;
                      </p>
                    )}
                  </div>
                )}

                <p className="font-sans text-[15px] text-ink-soft leading-relaxed">
                  Review your order summary on the right. When everything looks right, place your order —
                  we'll have it straw-packed and on its way within two business days.
                </p>

                {/* Mobile summary */}
                <div className="lg:hidden">
                  <OrderSummary />
                </div>

                <div className="pt-2">
                  <button
                    onClick={handlePlaceOrder}
                    className="w-full min-h-[60px] bg-green-brand text-[#F5F1E6] rounded-btn font-sans text-[17px] font-semibold hover:bg-green-deep hover:shadow-cta-hover hover:-translate-y-px active:translate-y-0 transition-all duration-200"
                  >
                    Place order →
                  </button>
                  <p className="mt-3 text-[10px] font-mono uppercase tracking-eyebrow text-ink-soft text-center">
                    No charge until your order ships · 30-day returns on whole pieces
                  </p>
                </div>
              </div>
            ))}

          </div>

          {/* Sticky sidebar */}
          <div className="hidden lg:block lg:sticky lg:top-24">
            <OrderSummary />
          </div>

        </div>
      </div>
    </div>
  )
}
