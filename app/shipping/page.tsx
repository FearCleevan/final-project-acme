import Breadcrumb from '@/components/shared/Breadcrumb'
import Eyebrow from '@/components/shared/Eyebrow'
import Button from '@/components/shared/Button'

const rows = [
  { zone: 'Australia — standard', method: 'Australia Post Parcel', time: '3–6 business days', rate: 'Free over $150 · $12 under' },
  { zone: 'Australia — express', method: 'Australia Post Express', time: '1–3 business days', rate: '$18 flat' },
  { zone: 'New Zealand', method: 'Australia Post International', time: '5–10 business days', rate: '$24 flat' },
  { zone: 'United Kingdom & Europe', method: 'DHL Express', time: '6–12 business days', rate: '$38 flat' },
  { zone: 'United States & Canada', method: 'DHL Express', time: '7–14 business days', rate: '$42 flat' },
  { zone: 'Rest of world', method: 'DHL Express or Sendle', time: '10–18 business days', rate: 'Quoted at checkout' },
]

export default function ShippingPage() {
  return (
    <div className="bg-parchment min-h-screen">
      <div className="max-w-[900px] mx-auto px-6 py-14">

        <Breadcrumb
          crumbs={[{ label: 'Storefront', href: '/' }, { label: 'Shipping & Freight' }]}
          className="mb-10"
        />

        <Eyebrow className="mb-4">Dispatch from Adelaide</Eyebrow>
        <h1
          className="font-serif font-medium text-ink-charcoal leading-tight mb-4"
          style={{ fontSize: 'clamp(28px, 4vw, 52px)' }}
        >
          Shipping & freight.
        </h1>
        <p className="font-sans text-[17px] text-ink-soft leading-relaxed mb-14 max-w-[58ch]">
          Every order is straw-packed by hand at Adelaide House. Fragile pieces are individually wrapped
          before packing. We do not use automated fulfilment.
        </p>

        {/* Rate table */}
        <div className="border border-ink-rule rounded-sm overflow-hidden mb-14">
          <div className="grid grid-cols-4 bg-ink-charcoal text-canvas-heading px-5 py-3">
            {['Zone', 'Method', 'Timeframe', 'Rate'].map(h => (
              <span key={h} className="text-[10px] font-mono uppercase tracking-eyebrow text-canvas-dim">{h}</span>
            ))}
          </div>
          {rows.map((row, i) => (
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
          {[
            {
              title: 'Packing method',
              body: 'All orders are packed in straw, the same method used since 1983. Glass chimneys receive an additional inner wrap of acid-free tissue. Porcelain signs travel flat in a reinforced cardboard sleeve. We have never had a breakage that was attributable to packing.',
            },
            {
              title: 'Dispatch timing',
              body: 'Orders placed before 12:00 ACST on a business day are dispatched the same afternoon. Orders placed after 12:00 or on weekends are dispatched the following business day. You will receive a plain-text email with your tracking number when the parcel is collected.',
            },
            {
              title: 'International customs',
              body: 'We declare all items at their full invoice value. We do not falsify customs declarations. Import duties and taxes are the responsibility of the buyer. For most countries, antique items over 100 years old attract a reduced duty rate — we will note the age of each piece on the declaration.',
            },
          ].map(({ title, body }) => (
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
