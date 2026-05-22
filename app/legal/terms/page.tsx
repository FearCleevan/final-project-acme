import { Metadata } from 'next'
import Breadcrumb from '@/components/shared/Breadcrumb'
import Eyebrow from '@/components/shared/Eyebrow'

export const metadata: Metadata = {
  title: 'Terms & Conditions — Acme Lamp & Sign Co.',
  description: 'Terms and conditions governing use of the Acme Lamp & Sign website and purchases.',
}

const EFFECTIVE_DATE = 'May 23, 2026'

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
              <strong>acmelampandsign.com</strong> and any purchase you make from Acme Lamp &amp; Sign Co.
              ("we", "us", "our"), a business based in Nova Scotia, Canada.
            </p>
            <p>
              By placing an order or using this site you agree to these Terms in full.
              If you do not agree, please do not use the site.
            </p>
          </Section>

          <Section title="2. Orders and pricing">
            <p>
              All prices are shown in Canadian dollars (CAD) and include applicable taxes where
              required by law. We reserve the right to correct pricing errors; if an error affects
              your order we will contact you before processing payment.
            </p>
            <p>
              Submitting an order constitutes an offer to purchase. Your order is accepted
              — and a contract formed — when we send you a dispatch confirmation email.
              We may decline orders at our discretion (for example, if a product is discontinued
              or a pricing error is identified).
            </p>
          </Section>

          <Section title="3. Payment">
            <p>
              Payment is taken at the time of order. We accept major credit and debit cards
              via Shopify Payments. We do not store card details; all payment data is handled
              by Shopify Inc. under PCI DSS compliance.
            </p>
          </Section>

          <Section title="4. Shipping">
            <p>
              We ship primarily within Canada and the continental United States. Estimated
              dispatch times are shown on each product page. We use Canada Post and
              contracted couriers. Shipping costs are calculated at checkout based on
              weight and destination.
            </p>
            <p>
              Title and risk of loss pass to you when the carrier takes possession of
              the parcel. We are not responsible for delays caused by the carrier or
              customs authorities.
            </p>
          </Section>

          <Section title="5. Returns and refunds">
            <p>
              You may return most items within 30 days of delivery provided they are
              unused and in original packaging. To initiate a return, email{' '}
              <a href="mailto:hello@acmelampandsign.com">hello@acmelampandsign.com</a>{' '}
              with your order number and reason.
            </p>
            <p>The following items cannot be returned:</p>
            <ul>
              <li>Custom or made-to-order items</li>
              <li>Items damaged by misuse or improper installation</li>
              <li>Items returned without prior authorisation</li>
            </ul>
            <p>
              Refunds are issued to the original payment method within 10 business days
              of receiving the returned item.
            </p>
          </Section>

          <Section title="6. Product descriptions">
            <p>
              We make every effort to accurately describe our products, including
              dimensions, materials, and compatibility. Glass and hand-finished items
              may show natural variation; this is not a defect.
            </p>
            <p>
              If a product does not match its description materially, please contact us
              within 14 days of delivery and we will arrange a replacement or refund.
            </p>
          </Section>

          <Section title="7. Intellectual property">
            <p>
              All content on this site — including text, product photography, illustrations,
              and trade marks — is the property of Acme Lamp &amp; Sign Co. or its licensors.
              You may not reproduce, distribute, or create derivative works without our
              written permission.
            </p>
          </Section>

          <Section title="8. Limitation of liability">
            <p>
              To the maximum extent permitted by Canadian law, our total liability for
              any claim arising from a purchase or use of this site is limited to the
              amount you paid for the relevant order.
            </p>
            <p>
              We are not liable for indirect, consequential, or incidental losses,
              including loss of profit, data, or business opportunity.
            </p>
          </Section>

          <Section title="9. Governing law">
            <p>
              These Terms are governed by the laws of Nova Scotia and the federal laws
              of Canada applicable therein. Any disputes shall be resolved in the courts
              of Nova Scotia, Canada.
            </p>
          </Section>

          <Section title="10. Changes to these Terms">
            <p>
              We may update these Terms from time to time. The effective date at the top
              of this page will reflect the latest revision. Continued use of the site
              after changes constitutes acceptance of the revised Terms.
            </p>
          </Section>

          <Section title="11. Contact">
            <p>
              Questions about these Terms:{' '}
              <a href="mailto:hello@acmelampandsign.com">hello@acmelampandsign.com</a>
              <br />
              Acme Lamp &amp; Sign Co. · Nova Scotia, Canada
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
