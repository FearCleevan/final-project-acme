'use client'

import { useState } from 'react'
import Breadcrumb from '@/components/shared/Breadcrumb'
import Eyebrow from '@/components/shared/Eyebrow'
import Button from '@/components/shared/Button'

const faqs = [
  {
    category: 'Ordering',
    questions: [
      {
        q: 'How do I know if a lamp part will fit my lamp?',
        a: 'Check the product description carefully before placing your order — we include dimensions, thread sizes, and compatibility notes on each listing. If you are still unsure, contact us before ordering and we will help you confirm the correct fitment.',
      },
      {
        q: 'Can I request a specific piece that is not listed?',
        a: 'Yes — please make an inquiry. Write to us at acmesign01@gmail.com with a description or photo of what you are looking for. We source from a wide range of vintage and reproduction suppliers and may be able to help.',
      },
      {
        q: 'Do you offer bulk or trade pricing?',
        a: 'We are actively looking for distributors worldwide. If you are interested in carrying our products or purchasing in volume, please contact us directly at acmesign01@gmail.com to discuss terms.',
      },
    ],
  },
  {
    category: 'Products',
    questions: [
      {
        q: 'Do you offer restoration or reproduction services?',
        a: 'Yes. We offer reproduction services with minimum quantities. If you have a piece you would like reproduced or a restoration project in mind, contact us to discuss your requirements.',
      },
      {
        q: 'How are fragile items packaged?',
        a: 'All orders are carefully packaged by hand with protective materials. Glass and fragile items receive extra care. While we take every precaution, we recommend inspecting your parcel on arrival and photographing any damage before removing the item.',
      },
      {
        q: 'Are these reproductions or originals?',
        a: 'Both, depending on the piece. Original and reproduction items are clearly identified in their individual listings. If you have any questions about the provenance of a specific piece, contact us before purchasing.',
      },
    ],
  },
  {
    category: 'Delivery & Returns',
    questions: [
      {
        q: 'How long does delivery take?',
        a: 'Orders are dispatched within 2–4 business days from Dartmouth, Nova Scotia. Delivery times after dispatch vary by destination: Canada typically 3–7 business days via Canada Post, United States 5–10 business days, and international orders 6–18 business days via DHL Express.',
      },
      {
        q: 'My item arrived damaged. What do I do?',
        a: 'Photograph the item in its packaging before removing it, then contact us at acmesign01@gmail.com with your order number and photos. Damage caused in transit must be claimed directly with the freight carrier. We will provide all invoices and documentation needed to support your claim.',
      },
      {
        q: 'Can I return a specialty or fragile item?',
        a: 'Due to the specialty nature of our products — including antique glass, vintage porcelain, and reproduction lamp parts — all sales are generally final. If your item arrived damaged or does not match its description, contact us within 14 days and we will work with you to find a fair resolution.',
      },
    ],
  },
]

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-ink-rule">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-start justify-between gap-4 py-5 text-left"
        aria-expanded={open}
      >
        <span className="font-serif text-[17px] text-ink-charcoal font-medium leading-snug pr-2">
          {q}
        </span>
        <span
          className={`font-mono text-[18px] text-ink-soft shrink-0 transition-transform duration-200 mt-0.5 ${open ? 'rotate-45' : ''}`}
          aria-hidden="true"
        >
          +
        </span>
      </button>
      {open && (
        <p className="font-sans text-[15px] text-ink-soft leading-relaxed pb-6 pr-8">
          {a}
        </p>
      )}
    </div>
  )
}

export default function FAQPage() {
  return (
    <div className="bg-parchment min-h-screen">
      <div className="max-w-[860px] mx-auto px-6 py-14">

        <Breadcrumb
          crumbs={[{ label: 'Storefront', href: '/' }, { label: 'FAQ' }]}
          className="mb-10"
        />

        <Eyebrow className="mb-4">Common questions</Eyebrow>
        <h1
          className="font-serif font-medium text-ink-charcoal leading-tight mb-14"
          style={{ fontSize: 'clamp(28px, 4vw, 52px)' }}
        >
          Frequently asked.
        </h1>

        <div className="space-y-12">
          {faqs.map(({ category, questions }) => (
            <section key={category}>
              <Eyebrow className="mb-1">{category}</Eyebrow>
              <div className="border-t border-ink-rule mt-4">
                {questions.map(item => (
                  <FAQItem key={item.q} {...item} />
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="border-t border-ink-rule mt-16 pt-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <p className="font-serif text-[18px] text-ink-charcoal font-medium mb-1">
              Not answered here?
            </p>
            <p className="font-sans text-[14px] text-ink-soft">
              Write or call. We answer every message ourselves.
            </p>
          </div>
          <Button href="/contact" variant="brass">Contact us directly</Button>
        </div>

      </div>
    </div>
  )
}
