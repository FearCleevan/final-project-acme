export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import HeritageHero from '@/components/heritage/HeritageHero'
import WorkshopSection from '@/components/heritage/WorkshopSection'
import Timeline from '@/components/heritage/Timeline'
import Eyebrow from '@/components/shared/Eyebrow'
import Button from '@/components/shared/Button'
import { getContent } from '@/lib/content'
import type { HeritageContent } from '@/lib/types/content'
import fallbackData from '@/data/heritage.json'

export const metadata: Metadata = {
  title: 'Heritage Timeline — Acme Vintage Supply',
  description: 'From Victorian Birmingham tooling to a Melbourne workshop to your door in North America — the full heritage timeline of Acme Vintage Supply.',
  alternates: { canonical: '/heritage' },
}

const DEFAULTS: HeritageContent = {
  heroHeadline:    'A craft that has not changed its method in over a century.',
  heroBody:        'The Duplex presses run on original Birmingham tooling. The borosilicate glass formula has not changed. The brass alloy has not been reformulated. What has changed is only the address on the invoice.',
  heroImageUrl:    '',
  workshopHeading: 'Made in Melbourne & India. Collected for decades. Now in North America.',
  workshopBody1:   "What began as a collector's obsession became a manufacturing operation. When the components that made antique oil lamps worth restoring disappeared from the market, the only answer was to make them again — on the original tooling, with the original materials.",
  workshopBody2:   'Original 100-year-old Duplex presses were sourced from Birmingham and put back into production in Melbourne. Shades, fonts, chimneys, and glassware are manufactured in India using moulds owned outright — over two decades of uninterrupted production. For years these pieces supplied collectors in Australia. Now, for the first time, the same catalog is available in North America.',
  pressImageUrl:     '',
  glasswareImageUrl: '',
  proofPoints: [
    { n: '01.', title: 'Pressed on original dies',        body: 'Our Duplex burners run off the original Birmingham tooling — over a century old and still in production.' },
    { n: '02.', title: 'Owned moulds, not licensed',      body: 'Every mould and tool used in India is owned outright. Nothing is contracted out to a third-party die shop.' },
    { n: '03.', title: 'Borosilicate, not substitute glass', body: 'Shades, chimneys, and fonts are produced in borosilicate glass to the original period specification.' },
  ],
  entries: fallbackData as HeritageContent['entries'],
}

export default async function HeritagePage() {
  const raw = await getContent<HeritageContent>('heritage')

  // Merge CMS data over defaults — handles old array format, images-only format, and full format
  const content: HeritageContent = Array.isArray(raw)
    ? { ...DEFAULTS, entries: raw as unknown as HeritageContent['entries'] }
    : raw ? { ...DEFAULTS, ...raw, entries: raw.entries ?? DEFAULTS.entries } : DEFAULTS

  return (
    <div className="min-h-screen">

      <HeritageHero
        headline={content.heroHeadline}
        body={content.heroBody}
        imageUrl={content.heroImageUrl}
      />

      <WorkshopSection
        heading={content.workshopHeading}
        body1={content.workshopBody1}
        body2={content.workshopBody2}
        proofPoints={content.proofPoints}
        pressImageUrl={content.pressImageUrl}
        glasswareImageUrl={content.glasswareImageUrl}
      />

      <Timeline entries={content.entries} />

      {/* CTA */}
      <section className="bg-parchment-2 border-t border-ink-rule px-6 py-24">
        <div className="max-w-[1280px] mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
          <div>
            <Eyebrow className="mb-3">Begin where the light is</Eyebrow>
            <h2
              className="font-serif font-medium text-ink-charcoal leading-tight"
              style={{ fontSize: 'clamp(24px, 3vw, 42px)' }}
            >
              Walk the catalog. Light the parlor.
            </h2>
          </div>
          <div className="flex flex-wrap gap-4">
            <Button href="/catalog" variant="primary">Enter the Catalog</Button>
            <Button href="/" variant="ghost">Back to storefront</Button>
          </div>
        </div>
      </section>

    </div>
  )
}
