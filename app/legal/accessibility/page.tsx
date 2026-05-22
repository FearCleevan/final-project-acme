import { Metadata } from 'next'
import Breadcrumb from '@/components/shared/Breadcrumb'
import Eyebrow from '@/components/shared/Eyebrow'

export const metadata: Metadata = {
  title: 'Accessibility Statement — Acme Lamp & Sign Co.',
  description: 'Our commitment to making acmelampandsign.com accessible to all visitors.',
}

const EFFECTIVE_DATE = 'May 23, 2026'

export default function AccessibilityPage() {
  return (
    <div className="bg-parchment min-h-screen">
      <div className="max-w-[760px] mx-auto px-6 py-14">

        <Breadcrumb
          crumbs={[{ label: 'Storefront', href: '/' }, { label: 'Accessibility' }]}
          className="mb-10"
        />

        <Eyebrow className="mb-4">Legal &amp; Compliance</Eyebrow>
        <h1
          className="font-serif font-medium text-ink-charcoal leading-tight mb-4"
          style={{ fontSize: 'clamp(28px, 4vw, 48px)' }}
        >
          Accessibility Statement
        </h1>
        <p className="font-sans text-[15px] text-ink-soft mb-12">
          Last reviewed: {EFFECTIVE_DATE}
        </p>

        <div className="prose-legal">

          <Section title="Our commitment">
            <p>
              Acme Lamp &amp; Sign Co. is committed to ensuring that{' '}
              <strong>acmelampandsign.com</strong> is accessible to all visitors, including
              those with disabilities. We aim to conform to the{' '}
              <em>Web Content Accessibility Guidelines (WCAG) 2.1</em> at Level AA, as well
              as the applicable requirements of the{' '}
              <em>Accessible Canada Act</em>.
            </p>
          </Section>

          <Section title="What we have done">
            <p>
              In building and maintaining this site, we have taken the following measures
              to improve accessibility:
            </p>
            <ul>
              <li>Semantic HTML5 landmarks (header, nav, main, footer) to support screen reader navigation</li>
              <li>All images include descriptive <code>alt</code> text; decorative images are marked with an empty <code>alt</code> attribute</li>
              <li>Colour contrast ratios meet WCAG 2.1 AA minimums throughout the site</li>
              <li>Interactive elements (buttons, links, form fields) are keyboard-navigable and include visible focus indicators</li>
              <li>Form inputs are associated with descriptive labels; error messages identify the affected field</li>
              <li>Text can be resized up to 200 % without loss of content or functionality</li>
              <li>No content flashes more than three times per second</li>
            </ul>
          </Section>

          <Section title="Known limitations">
            <p>
              We are aware of the following areas that may not yet fully meet our accessibility
              targets:
            </p>
            <ul>
              <li>
                Some older product images sourced from third-party suppliers may have incomplete
                or generic alt text. We are updating these progressively as products are reviewed.
              </li>
              <li>
                PDF documents linked from the site (e.g. care guides) may not be fully tagged
                for screen readers. Accessible versions are available on request.
              </li>
            </ul>
            <p>
              We are actively working to address these limitations and expect to resolve them
              in future site updates.
            </p>
          </Section>

          <Section title="Technical information">
            <p>
              This site is built with Next.js and rendered as semantic HTML. It is tested
              with the following assistive technologies:
            </p>
            <ul>
              <li>NVDA + Chrome (Windows)</li>
              <li>VoiceOver + Safari (macOS and iOS)</li>
              <li>Keyboard-only navigation (Windows and macOS)</li>
            </ul>
          </Section>

          <Section title="Feedback and contact">
            <p>
              We welcome your feedback on the accessibility of this site. If you experience
              a barrier, or if you need content in an alternative format, please contact us:
            </p>
            <ul>
              <li>
                <strong>Email:</strong>{' '}
                <a href="mailto:hello@acmelampandsign.com">hello@acmelampandsign.com</a>
                {' '}— use the subject line <strong>"Accessibility"</strong>
              </li>
              <li>
                <strong>Response time:</strong> We aim to respond within 5 business days.
              </li>
            </ul>
            <p>
              If you are not satisfied with our response, you may contact the{' '}
              <em>Accessibility Commissioner of Canada</em> via the{' '}
              <a
                href="https://www.canada.ca/en/accessibility-commissioner.html"
                target="_blank"
                rel="noopener noreferrer"
              >
                Office of the Accessibility Commissioner
              </a>.
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
      <div className="space-y-3 font-sans text-[15px] text-ink-soft leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_a]:text-brass-deep [&_a]:underline [&_a]:underline-offset-2 [&_strong]:text-ink-iron [&_code]:font-mono [&_code]:text-[13px] [&_code]:bg-parchment-2 [&_code]:px-1 [&_code]:rounded">
        {children}
      </div>
    </section>
  )
}
