'use client'

import { useState } from 'react'
import Link from 'next/link'
import { BiCopy, BiCheck } from 'react-icons/bi'
import Eyebrow from '@/components/shared/Eyebrow'
import PageTransition from '@/components/shared/PageTransition'

function generateOrderNumber() {
  const n = Math.floor(1000 + Math.random() * 9000)
  const y = new Date().getFullYear().toString().slice(-2)
  return `ACME-${y}${n}-SP`
}

export default function OrderConfirmedPage() {
  const [orderNumber] = useState(generateOrderNumber)
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(orderNumber).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <PageTransition>
    <div className="min-h-screen flex flex-col">

      {/* Dark canvas hero */}
      <section className="canvas-dark flex-1 flex items-center px-6 py-28">
        <div className="max-w-[760px] mx-auto w-full">

          {/* Check mark */}
          <div className="w-14 h-14 rounded-full bg-green-brand flex items-center justify-center mb-10">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M4 12l5.5 6L20 6" stroke="#F5F1E6" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <Eyebrow light className="mb-5">Order confirmed</Eyebrow>
          <h1
            className="font-serif font-medium text-canvas-heading leading-tight mb-6"
            style={{ fontSize: 'clamp(36px, 5vw, 68px)' }}
          >
            Order confirmed.
          </h1>
          <p className="font-sans text-[18px] text-canvas-body leading-relaxed mb-10 max-w-[52ch]">
            We&rsquo;ll have it straw-packed and on its way within two business days. A plain-paper invoice
            is already in your email. A real person packed this one.
          </p>

          {/* Order reference + copy */}
          <div className="border border-white/20 rounded-sm px-6 py-4 inline-flex items-center gap-5 mb-6">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-eyebrow text-canvas-dim mb-1.5">
                Order reference
              </p>
              <p className="font-mono text-[22px] text-brass tracking-[0.08em]">
                {orderNumber}
              </p>
            </div>
            <button
              onClick={handleCopy}
              className="flex items-center justify-center w-9 h-9 rounded-sm border border-white/20 text-canvas-dim hover:text-canvas-heading hover:border-white/40 transition-colors shrink-0"
              aria-label="Copy order reference"
              title="Copy order reference"
            >
              {copied
                ? <BiCheck size={18} className="text-green-brand" />
                : <BiCopy size={18} />
              }
            </button>
          </div>

          {copied && (
            <p className="block text-[11px] font-mono uppercase tracking-eyebrow text-green-brand mb-8">
              ✓ Copied to clipboard
            </p>
          )}

          {/* CTAs */}
          <div className="flex flex-wrap gap-4 mt-6">
            <Link
              href={`/track-order?ref=${orderNumber}`}
              className="inline-flex items-center justify-center min-h-[52px] px-7 bg-brass text-ink-charcoal rounded-btn font-sans text-[15px] font-semibold hover:bg-brass-deep hover:text-canvas-heading transition-all duration-200"
            >
              Track my order →
            </Link>
            <Link
              href="/catalog"
              className="inline-flex items-center justify-center min-h-[52px] px-7 bg-green-brand text-[#F5F1E6] rounded-btn font-sans text-[15px] font-semibold hover:bg-green-deep hover:shadow-cta-hover hover:-translate-y-px transition-all duration-200"
            >
              Walk the catalog again →
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center min-h-[52px] px-7 bg-transparent border border-white/30 text-canvas-heading rounded-btn font-sans text-[15px] font-semibold hover:bg-white/10 transition-all duration-200"
            >
              Back to storefront
            </Link>
          </div>

        </div>
      </section>

      {/* Light footer note */}
      <div className="bg-parchment-2 border-t border-ink-rule px-6 py-8">
        <div className="max-w-[760px] mx-auto">
          <p className="text-[12px] font-mono uppercase tracking-eyebrow text-ink-soft leading-relaxed">
            Questions about your order? Call Adelaide House directly at{' '}
            <a href="tel:+61870001873" className="text-brass-deep hover:text-brass transition-colors">
              +61 8 7000 1873
            </a>
            {' '}— Mon–Fri, 9:00–17:00 ACST.
          </p>
        </div>
      </div>

    </div>
    </PageTransition>
  )
}
