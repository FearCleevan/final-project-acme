import HeritageHero from '@/components/heritage/HeritageHero'
import WorkshopSection from '@/components/heritage/WorkshopSection'
import Timeline from '@/components/heritage/Timeline'
import Eyebrow from '@/components/shared/Eyebrow'
import Button from '@/components/shared/Button'

export default function HeritagePage() {
  return (
    <div className="min-h-screen">

      <HeritageHero />

      <WorkshopSection />

      <Timeline />

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
