'use client'

import type { Testimonial } from '@/lib/types/content'

function StarIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="#AA9077" aria-hidden="true">
      <path d="M8 0l2.47 4.93L16 5.73l-4 3.85.95 5.42L8 12.47 3.05 15l.95-5.42-4-3.85 5.53-.8z" />
    </svg>
  )
}

interface Props {
  testimonials: Testimonial[]
}

export default function TestimonialsCarousel({ testimonials }: Props) {
  return (
    <section
      className="relative bg-ink-charcoal py-16 sm:py-24 overflow-hidden"
      style={{ backgroundImage: 'url(/assets/TestimonialImage.webp)', backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      <div className="absolute inset-0 bg-ink-charcoal/85" />
      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <div className="text-center mb-14">
          <span className="eyebrow text-brass mb-3 block">
            From the workshop floor
          </span>
          <h2 className="font-serif font-medium text-canvas-heading leading-tight text-fluid-heading">
            What they said when the lamp held.
          </h2>
        </div>

        <div className="marquee-container overflow-hidden mask-[linear-gradient(to_right,transparent,black_5%,black_95%,transparent)]">
          <div className="marquee-track flex">
            {[...testimonials, ...testimonials].map((t, i) => (
              <div
                key={i}
                className="shrink-0 min-w-87.5 max-w-100 rounded-xl p-6 border border-parchment-3/20 mx-3 bg-white/4"
              >
                <span className="block text-center font-serif text-[48px] leading-none text-canvas-heading/20 mb-2" aria-hidden="true">&ldquo;</span>
                <p className="font-serif italic leading-relaxed text-center text-canvas-heading text-[16px] subpixel-antialiased">
                  {t.quote}
                </p>
                <div className="flex items-center justify-center gap-1 mb-3" aria-label="5 stars">
                  {Array.from({ length: 5 }).map((_, idx) => <StarIcon key={idx} />)}
                </div>
                <p className="font-body text-center">
                  <span className="font-mono text-[9px] uppercase tracking-eyebrow text-canvas-muted">
                    {t.name}
                  </span>
                  <span className="font-mono text-[9px] uppercase tracking-eyebrow text-brass ml-2">
                    {t.location}
                  </span>
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        .marquee-track {
          animation: scroll-x 50s linear infinite;
        }
        .marquee-container:hover .marquee-track {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  )
}
