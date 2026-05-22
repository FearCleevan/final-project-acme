import { Metadata } from 'next'
import Breadcrumb from '@/components/shared/Breadcrumb'
import Eyebrow from '@/components/shared/Eyebrow'

export const metadata: Metadata = {
  title: 'Privacy Policy — Acme Lamp & Sign Co.',
  description: 'How Acme Lamp & Sign collects, uses, and protects your personal information.',
}

const EFFECTIVE_DATE = 'May 23, 2026'

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-parchment min-h-screen">
      <div className="max-w-[760px] mx-auto px-6 py-14">

        <Breadcrumb
          crumbs={[{ label: 'Storefront', href: '/' }, { label: 'Privacy Policy' }]}
          className="mb-10"
        />

        <Eyebrow className="mb-4">Legal &amp; Compliance</Eyebrow>
        <h1
          className="font-serif font-medium text-ink-charcoal leading-tight mb-4"
          style={{ fontSize: 'clamp(28px, 4vw, 48px)' }}
        >
          Privacy Policy
        </h1>
        <p className="font-sans text-[15px] text-ink-soft mb-12">
          Effective date: {EFFECTIVE_DATE}
        </p>

        <div className="prose-legal">

          <Section title="1. Who we are">
            <p>
              Acme Lamp &amp; Sign Co. ("we", "us", "our") operates the e-commerce store at{' '}
              <strong>acmelampandsign.com</strong> and <strong>acme-lamp-and-sign.myshopify.com</strong>.
              Our primary place of business is Nova Scotia, Canada.
            </p>
            <p>
              We are committed to protecting your personal information and your right to privacy
              in accordance with Canada's <em>Personal Information Protection and Electronic
              Documents Act</em> (PIPEDA) and applicable provincial privacy laws.
            </p>
          </Section>

          <Section title="2. Information we collect">
            <p>We collect information you provide directly to us when you:</p>
            <ul>
              <li>Place an order (name, shipping address, email, phone number)</li>
              <li>Create an account (email address, password hash)</li>
              <li>Subscribe to our newsletter (email address only)</li>
              <li>Contact us (name, email, message content)</li>
            </ul>
            <p>We also collect limited technical data automatically:</p>
            <ul>
              <li>IP address and general location (country/region)</li>
              <li>Browser type and device type</li>
              <li>Pages visited and time spent on site (via Vercel Analytics — anonymised)</li>
              <li>Referring URL</li>
            </ul>
            <p>
              We do <strong>not</strong> collect or store payment card numbers. All payments are
              processed by Shopify Payments or a third-party gateway; we receive only an order
              confirmation and partial card details (last four digits, card type) for your records.
            </p>
          </Section>

          <Section title="3. How we use your information">
            <p>We use the information we collect to:</p>
            <ul>
              <li>Process and fulfil your orders, and send order confirmations and dispatch notifications</li>
              <li>Respond to customer service enquiries</li>
              <li>Send our seasonal newsletter (only with your explicit consent)</li>
              <li>Detect and prevent fraudulent transactions</li>
              <li>Improve site performance and product listings</li>
              <li>Comply with legal and tax obligations</li>
            </ul>
            <p>
              We do not sell, rent, or trade your personal information to third parties for
              marketing purposes.
            </p>
          </Section>

          <Section title="4. Third-party services">
            <p>
              We use the following third-party services, each of which processes personal data
              under their own privacy policies:
            </p>
            <table>
              <thead>
                <tr><th>Service</th><th>Purpose</th><th>Data shared</th></tr>
              </thead>
              <tbody>
                <tr><td>Shopify Inc.</td><td>E-commerce platform, checkout, payment processing</td><td>Order and customer data</td></tr>
                <tr><td>Vercel Inc.</td><td>Hosting and analytics</td><td>Anonymised usage data</td></tr>
                <tr><td>Sanity.io</td><td>Content management</td><td>None (editorial content only)</td></tr>
                <tr><td>Canada Post / Courier</td><td>Shipping fulfilment</td><td>Name and shipping address</td></tr>
              </tbody>
            </table>
          </Section>

          <Section title="5. Cookies">
            <p>
              We use only essential cookies required for the shopping cart and checkout session.
              We do not use advertising or cross-site tracking cookies. You may disable cookies
              in your browser settings; however, the cart and checkout will not function without
              session cookies enabled.
            </p>
          </Section>

          <Section title="6. Data retention">
            <p>
              Order records are retained for seven years to meet Canada Revenue Agency requirements.
              Newsletter subscriber records are retained until you unsubscribe. Account data is
              retained until you request deletion (see Section 7).
            </p>
          </Section>

          <Section title="7. Your rights">
            <p>Under PIPEDA you have the right to:</p>
            <ul>
              <li>Access the personal information we hold about you</li>
              <li>Correct inaccurate information</li>
              <li>Withdraw consent to marketing communications at any time</li>
              <li>Request deletion of your account and associated personal data (subject to legal retention requirements)</li>
            </ul>
            <p>
              To exercise any of these rights, write to us at{' '}
              <a href="mailto:hello@acmelampandsign.com">hello@acmelampandsign.com</a>{' '}
              with the subject line <strong>"Privacy Request"</strong>. We will respond within
              30 days.
            </p>
          </Section>

          <Section title="8. Security">
            <p>
              Our site is served over HTTPS. Shopify maintains PCI DSS compliance for all
              payment data. We restrict access to customer data to personnel who require it
              to fulfil orders or provide customer service.
            </p>
          </Section>

          <Section title="9. Changes to this policy">
            <p>
              We may update this Privacy Policy from time to time. The effective date at the
              top of this page will be updated accordingly. Continued use of the site after
              changes constitutes acceptance of the revised policy.
            </p>
          </Section>

          <Section title="10. Contact">
            <p>
              Privacy questions or requests:{' '}
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
      <div className="space-y-3 font-sans text-[15px] text-ink-soft leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_a]:text-brass-deep [&_a]:underline [&_a]:underline-offset-2 [&_strong]:text-ink-iron [&_table]:w-full [&_table]:text-[13px] [&_th]:text-left [&_th]:font-mono [&_th]:uppercase [&_th]:tracking-wide [&_th]:text-[10px] [&_th]:pb-2 [&_td]:py-1.5 [&_td]:pr-4 [&_td]:border-b [&_td]:border-ink-rule/50">
        {children}
      </div>
    </section>
  )
}
