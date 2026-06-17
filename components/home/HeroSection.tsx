import Button from '@/components/shared/Button'
import Eyebrow from '@/components/shared/Eyebrow'
import Image from 'next/image'
import { getContent } from '@/lib/content'
import type { HeroContent } from '@/lib/types/content'

const FALLBACK: HeroContent = {
  eyebrow:      'Handcrafted · Original Tooling · North America',
  headline:     'Old world craftsmanship. Every detail, period-correct.',
  italicWord:   'craftsmanship',
  subtext:      'Hand-blown glass shades, precision Duplex burners, and borosilicate chimneys — made on century-old tooling by the Oil Lamp Company in Melbourne, now available in North America for the first time.',
  ctaPrimary:   { label: 'Shop the Collection', href: '/catalog' },
  ctaSecondary: { label: 'Our Story',            href: '/our-story' },
  imageUrl:     '/assets/HeroSampleImage0.webp',
}

const STATS = [
  'Original Tooling · Melbourne',
  'Bench-Tested · Period Correct',
  'Now in North America',
]

const SHADE_MOSAIC = [
  { src: '/assets/hero-assets/ice-valentine-etched-oil-lamp-shade.png',                 alt: 'Ice Valentine etched oil lamp shade',            tall: true  },
  { src: '/assets/hero-assets/oil-lamp-shade-beehive.png',                              alt: 'Beehive oil lamp shade',                         tall: false },
  { src: '/assets/hero-assets/oil-lamp-shade-closed-tulip-etched-shade-red-variant.png', alt: 'Closed tulip etched shade in red',              tall: false },
  { src: '/assets/hero-assets/oil-lamp-shade-open-tulip-magenta-pure-white-background.png', alt: 'Open tulip magenta oil lamp shade',          tall: true  },
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
      <div className="max-w-[1280px] mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

        {/* Left — editorial text */}
        <div className="max-w-[52ch] order-2 lg:order-1">
          <Eyebrow className="mb-6">{content.eyebrow}</Eyebrow>

          <h1
            className="font-serif font-medium text-ink-charcoal leading-[0.96] mb-8"
            style={{ fontSize: 'clamp(40px, 6vw, 80px)' }}
          >
            {renderHeadline(content.headline, content.italicWord)}
          </h1>

          <p className="font-sans text-[18px] text-ink-soft leading-relaxed mb-10 max-w-[52ch]">
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

        {/* Right — 2×2 shade mosaic */}
        <div className="order-1 lg:order-2 grid grid-cols-2 gap-3 sm:gap-4">
          {SHADE_MOSAIC.map((img) => (
            <div
              key={img.src}
              className={`relative overflow-hidden rounded-sm ${img.tall ? 'aspect-[3/4]' : 'aspect-square'}`}
            >
              <Image
                src={img.src}
                alt={img.alt}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 50vw, 25vw"
                priority
                style={{ filter: 'sepia(18%) saturate(85%) brightness(0.97)' }}
              />
              <div className="absolute inset-0 rounded-sm pointer-events-none" style={{ boxShadow: 'inset 0 0 40px rgba(120, 85, 40, 0.28)', background: 'rgba(180, 150, 100, 0.06)' }} />
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
