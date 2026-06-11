import Button from '@/components/shared/Button'
import Eyebrow from '@/components/shared/Eyebrow'
import HeroParallaxImage from '@/components/home/HeroParallaxImage'
import { getContent } from '@/lib/content'
import type { HeroContent } from '@/lib/types/content'

const FALLBACK: HeroContent = {
  eyebrow:      'No. 01 · Spring · Fifty/Fifty',
  headline:     'Authentic light from a forgotten era.',
  italicWord:   'forgotten',
  subtext:      'Fifty pieces of precision-reproduced antique oil lamp parts, hand-blown chimneys, and porcelain advertising signs — crafted at a Pune press shop running original dies since 1898, and now available in North America for the first time.',
  ctaPrimary:   { label: 'Enter the Catalog', href: '/catalog' },
  ctaSecondary: { label: 'Read the Story',    href: '/our-story' },
  imageUrl:     '/assets/HeroSampleImage0.webp',
}

const STATS = [
  '50 Pieces · First Release',
  'Bench-Tested · Numbered',
  'Pune → North America',
]

function renderHeadline(headline: string, italicWord: string) {
  if (!italicWord || !headline.includes(italicWord)) return headline
  const parts = headline.split(italicWord)
  return (
    <>
      {parts[0]}
      <em className="italic text-brass-deep">{italicWord}</em>
      {parts[1]}
    </>
  )
}

export default async function HeroSection() {
  const content = (await getContent<HeroContent>('hero')) ?? FALLBACK

  return (
    <section className="relative min-h-[70vh] sm:min-h-[90vh] flex items-center bg-parchment px-4 sm:px-6 py-12 sm:py-20 overflow-hidden">
      <div className="max-w-[1280px] mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

        {/* Left — editorial text */}
        <div className="max-w-[56ch] order-2 lg:order-1">
          <Eyebrow className="mb-6">{content.eyebrow}</Eyebrow>

          <h1
            className="font-serif font-medium text-ink-charcoal leading-[0.96] mb-8"
            style={{ fontSize: 'clamp(48px, 8vw, 96px)' }}
          >
            {renderHeadline(content.headline, content.italicWord)}
          </h1>

          <p className="font-sans text-[19px] text-ink-soft leading-relaxed mb-10 max-w-[56ch]">
            {content.subtext}
          </p>

          <div className="flex flex-wrap gap-4 mb-10">
            <Button variant="primary" href={content.ctaPrimary.href}>
              {content.ctaPrimary.label}
            </Button>
            <Button variant="ghost" href={content.ctaSecondary.href}>
              {content.ctaSecondary.label}
            </Button>
          </div>

          {/* Stats row */}
          <div className="flex flex-wrap items-center gap-0 border-t border-ink-rule pt-6">
            {STATS.map((stat, i) => (
              <span key={stat} className="flex items-center">
                {i > 0 && (
                  <span className="mx-4 text-ink-rule select-none font-mono text-[11px]">|</span>
                )}
                <span className="text-[10px] font-mono uppercase tracking-eyebrow text-ink-soft">
                  {stat}
                </span>
              </span>
            ))}
          </div>
        </div>

        {/* Right — parallax image */}
        <HeroParallaxImage
          src={content.imageUrl}
          alt="An authentic, realistic reproduction antique brass oil lamp with a hand-blown glass chimney."
        />

      </div>
    </section>
  )
}
