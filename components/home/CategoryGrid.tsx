'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import PlateImage from '@/components/shared/PlateImage'
import Eyebrow from '@/components/shared/Eyebrow'
import ParallaxLayer from './ParallaxLayer'

const categories = [
  {
    label: 'Complete Lighting Fixtures',
    href: '/catalog?category=lighting',
    description: 'Center-draft, flat-wick, mantle, and hanging lamps — reproduced on original dies.',
    src: '/assets/Oil Lamp Books.webp',
    width: 411,
    height: 1385,
    aspectRatio: '3/5' as const,
    dark: false,
    span: 'lg:col-span-1 lg:row-span-2',
  },
  {
    label: 'Replacement Glass Shades & Chimneys',
    href: '/catalog?category=glass-chimneys',
    description: 'Mouth-blown borosilicate chimneys and hand-pressed shades for every burner pattern.',
    src: 'https://i.ebayimg.com/images/g/T-MAAOSwEjFXfF-6/s-l1600.webp',
    width: 411,
    height: 684,
    aspectRatio: '3/5' as const,
    dark: false,
    span: 'lg:col-span-1',
  },
  {
    label: 'Burners, Wicks & Operational Hardware',
    href: '/catalog?category=hardware',
    description: 'Replacement burners, cotton wicks, font caps, and trimming tools.',
    src: 'https://i.ebayimg.com/images/g/UCEAAOSwCypWmw8r/s-l1600.webp',
    width: 411,
    height: 684,
    aspectRatio: '3/5' as const,
    dark: false,
    span: 'lg:col-span-1',
  },
  {
    label: 'Vintage Reproduction Signs',
    href: '/catalog?category=signs',
    description: 'Triple-fired porcelain signs from the 1873–1967 petroleum and lamp trade.',
    src: '/assets/HeroSampleImage6.webp',
    width: 845,
    height: 676,
    aspectRatio: '5/4' as const, // Wide presentation layout matching 845x676 layout bounds
    dark: true,
    span: 'lg:col-span-2',
  },
]

export default function CategoryGrid() {
  return (
    <section className="bg-parchment px-6 py-24">
      <div className="max-w-[1280px] mx-auto">
        <div className="flex items-end justify-between mb-10">
          <div>
            <Eyebrow className="mb-3">The catalog</Eyebrow>
            <h2
              className="font-serif font-medium text-ink-charcoal leading-tight"
              style={{ fontSize: 'clamp(28px, 3.5vw, 48px)' }}
            >
              A small catalog,
              <br />chosen with care.
            </h2>
          </div>
          <Link
            href="/catalog"
            className="hidden md:inline-block font-sans text-[14px] text-brass-deep hover:text-brass transition-colors border-b border-brass-deep/40 hover:border-brass pb-px"
          >
            Browse all 50 pieces →
          </Link>
        </div>

        {/* Bento grid */}
        <ParallaxLayer offset={0.2} className="w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 auto-rows-auto">
            {categories.map((cat) => (
              <Link
                key={cat.href}
                href={cat.href}
                className={`group relative overflow-hidden rounded-sm transition-all duration-300 hover:-translate-y-0.75 hover:shadow-card-hover ${cat.span}`}
              >
                <PlateImage
                  src={cat.src}
                  alt={cat.label}
                  aspectRatio={cat.aspectRatio}
                  dark={cat.dark}
                  className="w-full h-full object-cover"
                />

                {/* Overlay caption */}
                <div className="absolute inset-0 flex flex-col justify-end p-5 bg-linear-to-t from-ink-charcoal/80 via-ink-charcoal/30 to-transparent">
                  <h3 className="font-serif text-[20px] font-medium text-canvas-heading leading-tight mb-1">
                    {cat.label}
                  </h3>
                  <p className="font-sans text-[13px] text-canvas-muted leading-snug mb-3 line-clamp-2">
                    {cat.description}
                  </p>
                  <span className="inline-block text-[12px] font-sans text-brass transition-all duration-200 border-b border-brass/40 group-hover:border-brass w-fit">
                    Browse the collection →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </ParallaxLayer>

        <div className="mt-6 md:hidden text-center">
          <Link
            href="/catalog"
            className="font-sans text-[14px] text-brass-deep border-b border-brass-deep/40 pb-px"
          >
            Browse all 50 pieces →
          </Link>
        </div>
      </div>
    </section>
  )
}