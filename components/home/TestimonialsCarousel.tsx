'use client'

function StarIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="#AA9077" aria-hidden="true">
      <path d="M8 0l2.47 4.93L16 5.73l-4 3.85.95 5.42L8 12.47 3.05 15l.95-5.42-4-3.85 5.53-.8z" />
    </svg>
  )
}


const testimonials = [
  { name: 'Sarah M.', location: 'Baltimore', quote: 'Finally — a supplier who knows a No. 2 chimney is not the same as a No. 3.' },
  { name: 'James R.', location: 'Annapolis', quote: 'Our charcuterie board was a perfect wedding gift. They even engraved the couple’s initials.' },
  { name: 'Maria & Tom L.', location: 'Columbia', quote: 'The live edge coffee table is the centerpiece of our living room. Worth every penny.' },
  { name: 'Denise K.', location: 'Bethesda', quote: 'Michael walked us through every step of the design process. We felt heard and the final piece exceeded every expectation.' },
  { name: 'Chris P.', location: 'Washington, DC', quote: 'Incredible craftsmanship and attention to detail. Our charcuterie board is both beautiful and functional.' },
  { name: 'Robert & Anne W.', location: 'Frederick', quote: 'The river table we commissioned is a true heirloom. We’ll be passing it down for generations.' },
]

export default function TestimonialsCarousel() {
  return (
    <section
      className="relative bg-ink-charcoal py-16 sm:py-24 overflow-hidden"
      style={{ backgroundImage: 'url(/assets/HeroSampleImage3.webp)', backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      <div className="absolute inset-0 bg-ink-charcoal/85" />
      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <div className="text-center mb-14">
          <span className="eyebrow text-brass mb-3 block">
            From the workshop floor
          </span>
          {/* Note: Kept the clamp as it relies on specific fluid logic, not theme vars */}
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
              // aria-hidden={i >= testimonials.length}
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