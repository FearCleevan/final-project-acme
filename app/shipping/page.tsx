export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Breadcrumb from '@/components/shared/Breadcrumb'
import Eyebrow from '@/components/shared/Eyebrow'
import Button from '@/components/shared/Button'
import { getContent } from '@/lib/content'
import type { ShippingContent } from '@/lib/types/content'

export const metadata: Metadata = {
  title: 'Shipping Information — Canada, US & Worldwide',
  description: 'Free shipping over $150 CAD. Canada Post and DHL Express to Canada, USA, UK, Europe and worldwide. Ships from Dartmouth, Nova Scotia.',
  alternates: { canonical: '/shipping' },
}

const FALLBACK: ShippingContent = {
  rows: [
    { zone: 'Canada', method: 'Canada Post', time: '3–7 business days', rate: 'Free over $150 CAD · rate at checkout under' },
    { zone: 'United States', method: 'Canada Post / DHL Express', time: '5–10 business days', rate: 'Free over $150 CAD equivalent · rate at checkout under' },
    { zone: 'United Kingdom & Europe', method: 'DHL Express', time: '6–12 business days', rate: 'Free over local currency equivalent of $150 CAD' },
    { zone: 'Rest of world', method: 'DHL Express', time: '8–18 business days', rate: 'Free over local currency equivalent of $150 CAD' },
  ],
  notes: [
    { title: 'Free shipping threshold', body: 'Free shipping applies to all orders over $150 CAD, or the equivalent in your local currency. When you visit our store, prices are displayed in your local currency — the free shipping threshold adjusts accordingly. Orders under the threshold will see shipping calculated at checkout based on destination and weight.' },
    { title: 'Packaging', body: 'All orders are carefully packaged by hand. Glass chimneys, shades, and other fragile items receive extra protective care due to their delicate nature. While we take every precaution, fragile items can be susceptible to damage in transit. Any damage that occurs must be claimed directly with the freight carrier — we will provide any documentation needed to support your claim.' },
    { title: 'Dispatch timing', body: 'Orders are dispatched within 2–4 business days of payment confirmation. You will receive a tracking number by email when your parcel is collected by the carrier. Dispatch times may be slightly longer during peak periods.' },
    { title: 'International customs & duties', body: 'We declare all items at their full invoice value. We do not falsify customs declarations. Import duties and taxes are the responsibility of the buyer. These are not collected by us at checkout and vary by country — please check your local customs rules before ordering.' },
    { title: 'Damaged in transit', body: 'If your order arrives damaged, please photograph it in the packaging before removing the item, then contact us at acmesign01@gmail.com. Transit damage claims must be made directly with the freight carrier. We will provide any invoices, photos, or documentation required to support your claim.' },
  ],
}

export default async function ShippingPage() {
  const shipping = (await getContent<ShippingContent>('shipping')) ?? FALLBACK

  return (
    <div className="bg-parchment min-h-screen">
      <div className="max-w-225 mx-auto px-6 py-14">

        <Breadcrumb
          crumbs={[{ label: 'Storefront', href: '/' }, { label: 'Shipping & Freight' }]}
          className="mb-10"
        />

        <Eyebrow className="mb-4">Dispatch from Dartmouth, Nova Scotia</Eyebrow>
        <h1
          className="font-serif font-medium text-ink-charcoal leading-tight mb-4"
          style={{ fontSize: 'clamp(28px, 4vw, 52px)' }}
        >
          Shipping &amp; freight.
        </h1>
        <p className="font-sans text-[17px] text-ink-soft leading-relaxed mb-14 max-w-[58ch]">
          Every order is carefully packaged by hand in Dartmouth, Nova Scotia.
          All glass and fragile items receive extra protective care before dispatch.
          We ship worldwide.
        </p>

        {/* Rate table */}
        <div className="border border-ink-rule rounded-sm overflow-hidden mb-14">
          <div className="grid grid-cols-4 bg-ink-charcoal text-canvas-heading px-5 py-3">
            {['Zone', 'Carrier', 'Timeframe', 'Rate'].map(h => (
              <span key={h} className="text-[10px] font-mono uppercase tracking-eyebrow text-canvas-dim">{h}</span>
            ))}
          </div>
          {shipping.rows.map((row, i) => (
            <div
              key={i}
              className={`grid grid-cols-4 gap-2 px-5 py-4 border-t border-ink-rule ${i % 2 === 1 ? 'bg-parchment-2' : 'bg-parchment'}`}
            >
              <span className="font-sans text-[13px] text-ink-iron leading-snug">{row.zone}</span>
              <span className="font-sans text-[13px] text-ink-soft leading-snug">{row.method}</span>
              <span className="font-sans text-[13px] text-ink-soft">{row.time}</span>
              <span className="font-mono text-[12px] text-brass-deep">{row.rate}</span>
            </div>
          ))}
        </div>

        {/* Notes */}
        <div className="space-y-8 mb-14">
          {shipping.notes.map(({ title, body }) => (
            <div key={title} className="border-t border-ink-rule pt-6">
              <h2 className="font-serif text-[18px] font-medium text-ink-charcoal mb-3">{title}</h2>
              <p className="font-sans text-[15px] text-ink-soft leading-relaxed">{body}</p>
            </div>
          ))}
        </div>

        <Button href="/contact" variant="brass">Questions about your shipment</Button>

      </div>
    </div>
  )
}
