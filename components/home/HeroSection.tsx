'use client'

import { motion } from 'framer-motion'
import { useParallax } from '@/hooks/useParallax'
import Button from '@/components/shared/Button'
import Eyebrow from '@/components/shared/Eyebrow'
import PlateImage from '@/components/shared/PlateImage'

export default function HeroSection() {
  const { ref, y } = useParallax(0.4)

  return (
    <section className="relative min-h-[90vh] flex items-center bg-parchment px-6 py-20 overflow-hidden">
      <div className="max-w-[1280px] mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

        {/* Left — editorial text */}
        <div className="max-w-[56ch] order-2 lg:order-1">
          <Eyebrow className="mb-6">No. 01 · Spring · Fifty/Fifty</Eyebrow>

          <h1
            className="font-serif font-medium text-ink-charcoal leading-[0.96] mb-8"
            style={{ fontSize: 'clamp(48px, 8vw, 96px)' }}
          >
            Authentic light from a{' '}
            <em className="italic text-brass-deep">forgotten</em> era.
          </h1>

          <p className="font-sans text-[19px] text-ink-soft leading-relaxed mb-10 max-w-[56ch]">
            Fifty crates of precision-reproduced antique oil lamp parts, hand-blown chimneys,
            and porcelain advertising signs — sourced from a 4-cycle vulcan workshop,
            distributed out of Adelaide, and offered here for the first time.
          </p>

          <div className="flex flex-wrap gap-4 mb-10">
            <Button variant="primary" href="/catalog">Enter the Catalog</Button>
            <Button variant="ghost" href="/our-story">Read the Story</Button>
          </div>

          {/* Stats row */}
          <div className="flex flex-wrap items-center gap-0 border-t border-ink-rule pt-6">
            {[
              '50 In Suits',
              '101 (98+1/1)',
              'Pune → Adelaide',
            ].map((stat, i) => (
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

        {/* Right — parallax image plate */}
        <div ref={ref} className="relative order-1 lg:order-2 overflow-hidden">
          <motion.div style={{ y, willChange: 'transform' }}>
            <PlateImage
              alt="Archive photo — original 1898 die set, Pune press shop"
              aspectRatio="4/5"
              dark
              label="Archive Photo · Original 1898 Die Set, Pune Press Shop"
              className="w-full"
              priority
            />
          </motion.div>
        </div>

      </div>
    </section>
  )
}
