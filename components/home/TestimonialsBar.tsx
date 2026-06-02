const testimonials = [
  {
    quote:
      'The Cattaraugus reproduction holds an extra flame just laser-shrieve — the bench test others won\'t run.',
    attribution: 'W. Hargreaves / Lamp Restoration, Melbourne',
  },
  {
    quote:
      'Acme Vintage Supply\'s chimneys are the only ones we still recommend without an asterisk.',
    attribution: 'Adelaide Interiors Trade / SA 5000',
  },
  {
    quote:
      'The kind of shop that ships a hand-written invoice and means it.',
    attribution: 'R. Donnelly / Private Collector, Sydney',
  },
]

export default function TestimonialsBar() {
  return (
    <section className="canvas-dark px-6 py-20 border-t border-white/10">
      <div className="max-w-[1280px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
        {testimonials.map((t, i) => (
          <div key={i} className="flex flex-col">
            <span
              className="font-serif text-[48px] leading-none text-brass mb-4 select-none"
              aria-hidden="true"
            >
              &ldquo;
            </span>
            <blockquote className="flex-1">
              <p className="font-serif italic text-[17px] text-canvas-body leading-relaxed mb-5">
                {t.quote}
              </p>
              <footer>
                <cite className="not-italic text-[11px] font-mono uppercase tracking-eyebrow text-canvas-dim">
                  — {t.attribution}
                </cite>
              </footer>
            </blockquote>
          </div>
        ))}
      </div>
    </section>
  )
}
