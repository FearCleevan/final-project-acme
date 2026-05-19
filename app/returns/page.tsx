import Breadcrumb from '@/components/shared/Breadcrumb'
import Eyebrow from '@/components/shared/Eyebrow'
import Button from '@/components/shared/Button'

export default function ReturnsPage() {
  return (
    <div className="bg-parchment min-h-screen">
      <div className="max-w-[860px] mx-auto px-6 py-14">

        <Breadcrumb
          crumbs={[{ label: 'Storefront', href: '/' }, { label: '30-Day Returns' }]}
          className="mb-10"
        />

        <Eyebrow className="mb-4">The policy, plainly</Eyebrow>
        <h1
          className="font-serif font-medium text-ink-charcoal leading-tight mb-4"
          style={{ fontSize: 'clamp(28px, 4vw, 52px)' }}
        >
          30-day returns.
        </h1>

        {/* The one-sentence policy */}
        <div className="border-l-4 border-brass-deep pl-6 py-2 my-10">
          <p className="font-serif italic text-[20px] text-ink-charcoal leading-relaxed">
            If it arrives less than whole, send it back — on us — within thirty days, and we will
            replace it or refund it in full. No questions on whole pieces.
          </p>
        </div>

        <div className="space-y-10 mb-14">
          {[
            {
              title: 'What qualifies',
              body: "Any piece that arrives damaged, incorrectly described, or not as photographed qualifies for a full return. We will pay the return postage. If you simply change your mind on a whole, undamaged piece, we accept returns within 30 days — you cover the return postage and we refund the purchase price less original freight.",
            },
            {
              title: 'What does not qualify',
              body: "Pieces that have been modified, repaired, or used in a way that has altered their condition do not qualify for return. If you fitted a burner and stripped a thread, that is not a return. If a chimney cracked because it was placed on a hot burner from cold, that is not a return. We will tell you this upfront if you contact us.",
            },
            {
              title: 'How to start a return',
              body: "Write to us at hello@acmelamp.co with your order reference and a brief description of the issue. We will respond within one business day with a prepaid label if applicable, or return instructions. We do not have an online returns portal. We have a person.",
            },
            {
              title: 'Refund timing',
              body: "Refunds are processed within two business days of the item arriving back at Adelaide House and passing inspection. They are issued to the original payment method. We will send you a plain-text confirmation when it is done.",
            },
          ].map(({ title, body }) => (
            <div key={title} className="border-t border-ink-rule pt-8">
              <h2 className="font-serif text-[20px] font-medium text-ink-charcoal mb-3 leading-snug">{title}</h2>
              <p className="font-sans text-[15px] text-ink-soft leading-relaxed">{body}</p>
            </div>
          ))}
        </div>

        <div className="bg-parchment-2 border border-ink-rule rounded-sm p-6 mb-10">
          <p className="font-sans text-[14px] text-ink-soft leading-relaxed">
            <span className="font-semibold text-ink-iron">Adelaide House</span> · 14 Pirie Street, Adelaide SA 5000{' '}
            <span className="text-ink-rule mx-2">·</span>{' '}
            <a href="tel:+61870001873" className="text-brass-deep hover:text-brass transition-colors">
              +61 8 7000 1873
            </a>{' '}
            <span className="text-ink-rule mx-2">·</span>{' '}
            <a href="mailto:hello@acmelamp.co" className="text-brass-deep hover:text-brass transition-colors">
              hello@acmelamp.co
            </a>
          </p>
        </div>

        <Button href="/contact" variant="primary">Start a return</Button>

      </div>
    </div>
  )
}
