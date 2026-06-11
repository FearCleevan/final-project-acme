import type { Metadata } from 'next'
import Breadcrumb from '@/components/shared/Breadcrumb'
import Eyebrow from '@/components/shared/Eyebrow'
import Button from '@/components/shared/Button'
import { getContent } from '@/lib/content'
import type { ReturnsContent } from '@/lib/types/content'

export const metadata: Metadata = {
  title: 'Returns & Refunds — Acme Vintage Supply',
  description: 'All sales are final on specialty vintage items. Contact us before ordering if you have fitment questions. We resolve damaged or misdescribed items within 14 days.',
  alternates: { canonical: '/returns' },
}

const FALLBACK: ReturnsContent = {
  lead: 'Due to the specialty and fragile nature of our pieces, all sales are generally final. If something arrives damaged or is not as described, contact us — we will make it right.',
  sections: [
    { title: 'Damaged or misdescribed items', body: 'If your order arrives damaged in transit, or the item does not match its description, contact us at acmesign01@gmail.com within 14 days of delivery. Include your order number and photographs of the item and packaging. We will review each case individually and work with you toward a fair resolution. Damage caused by carrier mishandling must be claimed directly with the freight company — we will provide any documentation needed to support your claim.' },
    { title: 'Specialty and fragile items', body: 'We carry antique glass, vintage porcelain, and reproduction lamp components — all of which are delicate specialty items. Because of their nature, we are not always able to accept change-of-mind returns. If you are unsure whether a piece is right for your lamp, please contact us before purchasing. We are happy to assist with fitment questions.' },
    { title: 'How to contact us about an issue', body: 'Write to us at acmesign01@gmail.com with your order reference and a brief description of the issue. We respond to every message personally. We do not have an automated returns portal — you will hear from a person.' },
    { title: 'Refund timing', body: 'When a refund is approved, it is issued to your original payment method. We will send you a confirmation when it has been processed. Timing depends on your bank or card provider, but typically appears within 3–5 business days.' },
  ],
}

export default async function ReturnsPage() {
  const returns = (await getContent<ReturnsContent>('returns')) ?? FALLBACK

  return (
    <div className="bg-parchment min-h-screen">
      <div className="max-w-[860px] mx-auto px-6 py-14">

        <Breadcrumb
          crumbs={[{ label: 'Storefront', href: '/' }, { label: 'Returns & Refunds' }]}
          className="mb-10"
        />

        <Eyebrow className="mb-4">The policy, plainly</Eyebrow>
        <h1
          className="font-serif font-medium text-ink-charcoal leading-tight mb-4"
          style={{ fontSize: 'clamp(28px, 4vw, 52px)' }}
        >
          Returns &amp; refunds.
        </h1>

        {/* Lead statement */}
        <div className="border-l-4 border-brass-deep pl-6 py-2 my-10">
          <p className="font-serif italic text-[20px] text-ink-charcoal leading-relaxed">
            {returns.lead}
          </p>
        </div>

        <div className="space-y-10 mb-14">
          {returns.sections.map(({ title, body }) => (
            <div key={title} className="border-t border-ink-rule pt-8">
              <h2 className="font-serif text-[20px] font-medium text-ink-charcoal mb-3 leading-snug">{title}</h2>
              <p className="font-sans text-[15px] text-ink-soft leading-relaxed">{body}</p>
            </div>
          ))}
        </div>

        <div className="bg-parchment-2 border border-ink-rule rounded-sm p-6 mb-10">
          <p className="font-sans text-[14px] text-ink-soft leading-relaxed">
            <span className="font-semibold text-ink-iron">Acme Vintage Supply</span>{' '}
            · Dartmouth, Nova Scotia, Canada{' '}
            <span className="text-ink-rule mx-2">·</span>{' '}
            <a href="tel:+19024811007" className="text-brass-deep hover:text-brass transition-colors">
              (902) 481-1007
            </a>{' '}
            <span className="text-ink-rule mx-2">·</span>{' '}
            <a href="mailto:acmesign01@gmail.com" className="text-brass-deep hover:text-brass transition-colors">
              acmesign01@gmail.com
            </a>
          </p>
        </div>

        <Button href="/contact" variant="primary">Contact us about an order</Button>

      </div>
    </div>
  )
}
