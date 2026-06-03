import { Metadata } from 'next'
import Breadcrumb from '@/components/shared/Breadcrumb'
import Eyebrow from '@/components/shared/Eyebrow'

export const metadata: Metadata = {
  title: 'Terms & Conditions — Acme Vintage Supply',
  description: 'Terms and conditions governing use of the Acme Vintage Supply website and purchases.',
}

const EFFECTIVE_DATE = 'June 4, 2026'

export default function TermsPage() {
  return (
    <div className="bg-parchment min-h-screen">
      <div className="max-w-[760px] mx-auto px-6 py-14">

        <Breadcrumb
          crumbs={[{ label: 'Storefront', href: '/' }, { label: 'Terms & Conditions' }]}
          className="mb-10"
        />

        <Eyebrow className="mb-4">Legal &amp; Compliance</Eyebrow>
        <h1
          className="font-serif font-medium text-ink-charcoal leading-tight mb-4"
          style={{ fontSize: 'clamp(28px, 4vw, 48px)' }}
        >
          Terms &amp; Conditions
        </h1>
        <p className="font-sans text-[15px] text-ink-soft mb-12">
          Effective date: {EFFECTIVE_DATE}
        </p>

        <div className="prose-legal">

          <Section title="1. About us">
            <p>
              These Terms &amp; Conditions ("Terms") govern your use of the website at{' '}
              <strong>acmevintagesupply.com</strong> and any purchase you make from Acme Vintage Supply
              ("we", "us", "our"), a business based in Dartmouth, Nova Scotia, Canada.
            </p>
            <p>
              By placing an order or using this site you agree to these Terms in full.
              If you do not agree, please do not use the site.
            </p>
          </Section>

          <Section title="2. Who may purchase">
            <p>
              Our store is open to anyone worldwide. By placing an order you confirm that you
              are legally permitted to enter into a binding purchase contract in your jurisdiction.
              Prices are displayed in your local currency where supported; all transactions are
              settled in the currency shown at checkout.
            </p>
          </Section>

          <Section title="3. Orders and pricing">
            <p>
              Submitting an order constitutes an offer to purchase. Your order is accepted
              — and a contract formed — when we send you an order confirmation email.
              We reserve the right to cancel or refuse any order at our discretion, including
              but not limited to cases of pricing errors, suspected fraud, or stock discrepancies.
              If we cancel your order after payment has been taken, a full refund will be issued
              promptly to your original payment method.
            </p>
            <p>
              We reserve the right to correct pricing errors at any time. If an error affects
              your order we will contact you before processing.
            </p>
          </Section>

          <Section title="4. Payment">
            <p>
              Payment is taken at the time of order. We accept major credit and debit cards
              via Shopify Payments. We do not store card details; all payment data is handled
              by Shopify Inc. under PCI DSS compliance.
            </p>
          </Section>

          <Section title="5. Shipping">
            <p>
              We ship worldwide. Free shipping is available on orders over $150 CAD (or the
              equivalent in your local currency). Orders are dispatched within 2–4 business
              days from Dartmouth, Nova Scotia, Canada. We use Canada Post for domestic
              shipments and DHL Express for international deliveries.
            </p>
            <p>
              Title and risk of loss pass to you when the carrier takes possession of the parcel.
              We are not responsible for delays caused by the carrier or customs authorities.
              Any damage that occurs in transit must be claimed directly with the freight carrier.
            </p>
            <p>
              Import duties and taxes are the responsibility of the buyer. We declare all items
              at their full invoice value and do not falsify customs declarations.
            </p>
          </Section>

          <Section title="6. Returns and refunds">
            <p>
              Due to the specialty and fragile nature of our products — including antique glass,
              vintage porcelain, and reproduction lamp components — all sales are considered
              final unless the item arrives damaged or materially misdescribed.
            </p>
            <p>
              If your order arrives damaged or does not match its description, please contact us
              at <a href="mailto:acmesign01@gmail.com">acmesign01@gmail.com</a> within 14 days
              of delivery with your order number and photographs. We will review each case
              individually and work with you to find a fair resolution.
            </p>
            <p>
              Damage claims caused by carrier mishandling must be filed directly with the
              freight company. We will provide any documentation required to support your claim.
            </p>
          </Section>

          <Section title="7. Product descriptions">
            <p>
              We make every effort to accurately describe our products, including dimensions,
              materials, and compatibility. Glass and hand-finished items may show natural
              variation in colour, texture, and finish — this is not a defect and is characteristic
              of handcrafted vintage and reproduction pieces.
            </p>
            <p>
              If a product does not match its description materially, please contact us within
              14 days of delivery.
            </p>
          </Section>

          <Section title="8. Intellectual property">
            <p>
              All content on this site — including text, product photography, and trade marks —
              is the property of Acme Vintage Supply or its licensors. You may not reproduce,
              distribute, or create derivative works without our written permission.
            </p>
          </Section>

          <Section title="9. Limitation of liability">
            <p>
              To the maximum extent permitted by Canadian law, our total liability for any claim
              arising from a purchase or use of this site is limited to the amount you paid for
              the relevant order.
            </p>
            <p>
              We are not liable for indirect, consequential, or incidental losses, including
              loss of profit, data, or business opportunity.
            </p>
          </Section>

          <Section title="10. Governing law">
            <p>
              These Terms are governed by the laws of Nova Scotia and the federal laws of Canada
              applicable therein. Any disputes shall be resolved in the courts of Nova Scotia, Canada.
            </p>
          </Section>

          <Section title="11. Changes to these Terms">
            <p>
              We may update these Terms from time to time. The effective date at the top of this
              page will reflect the latest revision. Continued use of the site after changes
              constitutes acceptance of the revised Terms.
            </p>
          </Section>

          <Section title="12. Contact">
            <p>
              Questions about these Terms:{' '}
              <a href="mailto:acmesign01@gmail.com">acmesign01@gmail.com</a>
              <br />
              Acme Vintage Supply · Dartmouth, Nova Scotia, Canada
            </p>
          </Section>

        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="font-serif text-[22px] font-medium text-ink-charcoal mb-4 pb-2 border-b border-ink-rule">
        {title}
      </h2>
      <div className="space-y-3 font-sans text-[15px] text-ink-soft leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_a]:text-brass-deep [&_a]:underline [&_a]:underline-offset-2 [&_strong]:text-ink-iron">
        {children}
      </div>
    </section>
  )
}
