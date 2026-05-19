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
        q: 'Do you restock pieces once they are sold?',
        a: "No. Each crate is fifty pieces. When a piece is gone, it is gone. We do not restock individual items — the next crate will have different pieces sourced from a different lot. If you want something you see in the catalog, the honest advice is to order it now.",
      },
      {
        q: 'Can I order by phone?',
        a: "Yes. Call Adelaide House during business hours and someone will take your order directly. We prefer it, honestly. It gives us a chance to confirm fitment before you pay.",
      },
      {
        q: 'Do you offer wholesale pricing?',
        a: "For dealers and restorers purchasing six or more pieces, contact us before placing your order. We can discuss pricing and ensure you receive pieces suited to your trade use.",
      },
    ],
  },
  {
    category: 'Products',
    questions: [
      {
        q: 'Are these reproductions or originals?',
        a: "Both, depending on the piece. Our brass lamp hardware is pressed on original tooling and uses period alloys — the dies are original, the metal is new. Our glass is mouth-blown to original specifications. Our porcelain signs are triple-fired reproductions. Original pieces are identified explicitly in their listings.",
      },
      {
        q: 'What does "bench-tested" mean?',
        a: "Every lamp that leaves our workshop has been assembled, filled with clean kerosene, and run for a minimum of eight hours on the bench before being listed for sale. If it does not burn cleanly for eight hours, it does not go into the catalog. The bench test date is noted on the label.",
      },
      {
        q: 'Can I use modern lamp oil instead of kerosene?',
        a: "Paraffin lamp oil burns cleanly in most of our lamps and produces less odour than kerosene. It is a reasonable substitute for indoor use. It is not suitable for high-output lamps or for any lamp intended for outdoor use in cold temperatures — paraffin oil thickens below 10°C and will not wick properly.",
      },
      {
        q: 'What if a part does not fit my lamp?',
        a: "Contact us with the make and model of your lamp and we will advise you. If you purchased a part from us that does not fit, we will exchange it at no cost. If you are sourcing a part for a lamp we did not sell, call us — we know most of the common lamp bodies and can usually identify the correct fitment.",
      },
    ],
  },
  {
    category: 'Delivery & Returns',
    questions: [
      {
        q: 'How long does delivery take?',
        a: "Australian orders: 3–6 business days standard, 1–3 express. International: 6–18 business days depending on destination. See the Shipping & Freight page for full zone details.",
      },
      {
        q: 'My chimney arrived cracked. What do I do?',
        a: "Photograph it in the packaging before you remove it, then write to us. We will send a replacement at no charge. We have never disputed a legitimate transit breakage claim.",
      },
      {
        q: 'Can I return a piece I simply changed my mind about?',
        a: "Yes, within 30 days of delivery, as long as the piece is in its original condition. You cover return postage; we refund the purchase price less original freight. If the piece arrived damaged or was misdescribed, we pay return postage and refund in full.",
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
          <Button href="/contact" variant="brass">Contact a person</Button>
        </div>

      </div>
    </div>
  )
}
