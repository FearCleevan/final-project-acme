'use client'

import Link from 'next/link'
import Image from 'next/image'
import Eyebrow from '@/components/shared/Eyebrow'

function ImageTile({
  label,
  sub,
  href,
  src,
  className = '',
}: {
  label: string
  sub: string
  href: string
  src: string
  className?: string
}) {
  return (
    <Link
      href={href}
      className={`group relative overflow-hidden rounded-sm ${className}`}
    >
      <Image
        src={src}
        alt={label}
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
      />
      <div className="absolute inset-0 bg-linear-to-t from-ink-charcoal/85 via-ink-charcoal/20 to-transparent" />
      <div className="absolute inset-0 flex flex-col justify-end p-4 sm:p-5">
        <p className="font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.14em] text-brass mb-1 sm:mb-1.5">
          {sub}
        </p>
        <h3 className="font-serif text-[16px] sm:text-[20px] font-medium text-parchment leading-tight mb-2 sm:mb-3">
          {label}
        </h3>
        <span className="inline-block font-mono text-[10px] sm:text-[11px] uppercase tracking-widest text-brass/80 border-b border-brass/30 group-hover:border-brass group-hover:text-brass transition-colors w-fit pb-px">
          Browse →
        </span>
      </div>
    </Link>
  )
}

export default function CategoryGrid() {
  return (
    <section className="bg-parchment px-4 sm:px-6 py-10 sm:py-14">
      <div className="max-w-[1280px] mx-auto">
        <div className="mb-6 sm:mb-8">
          <Eyebrow className="mb-3">The catalog</Eyebrow>
          <h2
            className="font-serif font-medium text-ink-charcoal leading-tight"
            style={{ fontSize: 'clamp(24px, 3vw, 42px)' }}
          >
            A small catalog,<br />chosen with care.
          </h2>
        </div>

        {/*
          Mobile  (< sm):  2-col grid, 3 rows × 200px
            Row 1: Lighting (col-span-2, full width)
            Row 2: Glass | Burners
            Row 3: Signs (col-span-2, full width)
            CTA hidden

          Tablet  (sm–lg): 2-col grid, 3 rows × 260px
            Same layout as mobile

          Desktop (≥ lg):  3-col grid, 2 rows × 350px
            Row 1: Lighting (col-span-2) | Glass
            Row 2: Burners | Signs | CTA
        */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 grid-rows-[200px_200px_200px] sm:grid-rows-[260px_260px_260px] lg:grid-rows-[350px_350px]">

          {/* Lighting Fixtures — wide on all sizes */}
          <ImageTile
            label="Lighting Fixtures"
            sub="01 / Complete Lamps"
            href="/catalog?category=lighting"
            src="/assets/01-antique-brass-oil-lamps.png"
            className="col-span-2"
          />

          {/* Glass Shades & Chimneys */}
          <ImageTile
            label="Glass Shades & Chimneys"
            sub="02 / Replacement Glass"
            href="/catalog?category=glass-chimneys"
            src="/assets/02-green-etched-glass-oil-lamp-shade.png"
          />

          {/* Burners & Wicks */}
          <ImageTile
            label="Burners & Wicks"
            sub="03 / Hardware"
            href="/catalog?category=hardware"
            src="/assets/03-brass-antique-lamp-burner.png"
          />

          {/* Reproduction Signs — wide on mobile/tablet, normal on desktop */}
          <ImageTile
            label="Reproduction Signs"
            sub="04 / Enamel & Tin"
            href="/catalog?category=signs"
            src="/assets/04-vintage-enamel-signs-collection.png"
            className="col-span-2 lg:col-span-1"
          />

          {/* CTA tile — desktop only */}
          <Link
            href="/catalog"
            className="hidden lg:flex group relative overflow-hidden rounded-sm flex-col items-center justify-center gap-4 text-center px-6"
          >
            <Image
              src="/assets/05-50+See-all-catalog.png"
              alt="Browse full catalog"
              fill
              sizes="33vw"
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
            />
            <div className="absolute inset-0 bg-ink-charcoal/50 group-hover:bg-ink-charcoal/40 transition-colors duration-300" />
            <div className="relative flex flex-col items-center gap-4">
              <p className="font-mono text-[10px] uppercase tracking-widest text-parchment/70">
                Full collection
              </p>
              <p
                className="font-serif text-parchment leading-none font-medium"
                style={{ fontSize: 'clamp(36px, 4vw, 56px)' }}
              >
                Full<br />Catalog
              </p>
              <span className="font-mono text-[11px] uppercase tracking-widest text-parchment/80 border border-parchment/40 group-hover:border-parchment/70 rounded-sm px-4 py-2 transition-colors">
                Shop now →
              </span>
            </div>
          </Link>

        </div>

        {/* Mobile/tablet — "Browse all" link below grid */}
        <div className="mt-5 lg:hidden text-center">
          <Link
            href="/catalog"
            className="font-sans text-[14px] text-brass-deep border-b border-brass-deep/40 pb-px"
          >
            Browse the full catalog →
          </Link>
        </div>
      </div>
    </section>
  )
}
