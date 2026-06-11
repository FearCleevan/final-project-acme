'use client'

import { useState } from 'react'
import Eyebrow from '@/components/shared/Eyebrow'

interface FaqQuestion {
  q: string
  a: string
}

interface FaqCategory {
  category: string
  questions: FaqQuestion[]
}

function FAQItem({ q, a, id }: FaqQuestion & { id: string }) {
  const [open, setOpen] = useState(false)
  const panelId = `faq-panel-${id}`
  return (
    <div className="border-b border-ink-rule">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-start justify-between gap-4 py-5 text-left"
        aria-expanded={open}
        aria-controls={panelId}
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
      <div
        id={panelId}
        role="region"
        hidden={!open}
        className="font-sans text-[15px] text-ink-soft leading-relaxed pb-6 pr-8"
      >
        <p>{a}</p>
      </div>
    </div>
  )
}

export default function FaqAccordion({ faqs }: { faqs: FaqCategory[] }) {
  return (
    <div className="space-y-12">
      {faqs.map(({ category, questions }, catIdx) => (
        <section key={category}>
          <Eyebrow className="mb-1">{category}</Eyebrow>
          <div className="border-t border-ink-rule mt-4">
            {questions.map((item, qIdx) => (
              <FAQItem key={item.q} id={`${catIdx}-${qIdx}`} {...item} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
