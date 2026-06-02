import Eyebrow from '@/components/shared/Eyebrow'
import entries from '@/data/heritage.json'

export default function Timeline() {
  return (
    <section className="bg-parchment px-6 py-24">
      <div className="max-w-215 mx-auto">

        <Eyebrow className="mb-4">A working timeline</Eyebrow>
        <h2
          className="font-serif font-medium text-ink-charcoal leading-tight mb-16"
          style={{ fontSize: 'clamp(24px, 3vw, 42px)' }}
        >
          One hundred and fifty years, one method.
        </h2>

        <div className="relative">
          {/* Vertical rule */}
          <div
            className="absolute left-27 top-3 bottom-3 w-px bg-ink-rule hidden sm:block"
            aria-hidden="true"
          />

          <ol className="space-y-12">
            {entries.map(({ year, title, body }, i) => (
              <li key={year} className="flex flex-col sm:flex-row gap-4 sm:gap-8 items-start">

                {/* Year */}
                <div className="sm:w-24 shrink-0 flex sm:flex-col items-center sm:items-end gap-3 sm:gap-2">
                  <span className="font-serif text-[28px] sm:text-[32px] text-brass-deep leading-none tabular-nums">
                    {year}
                  </span>
                </div>

                {/* Dot + content */}
                <div className="flex gap-5 items-start w-full">
                  {/* Dot */}
                  <div className="relative hidden sm:flex shrink-0 w-6 items-center justify-center mt-2">
                    <div className={`w-2 h-2 rounded-full border-2 ${i === entries.length - 1 ? 'bg-brass-deep border-brass-deep' : 'bg-parchment border-ink-iron'}`} />
                  </div>

                  <div className="flex-1 pt-0.5">
                    <h3 className="font-serif text-[18px] text-ink-charcoal font-medium mb-1 leading-snug">
                      {title}
                    </h3>
                    <p className="font-sans text-[14px] text-ink-soft leading-relaxed">{body}</p>
                  </div>
                </div>

              </li>
            ))}
          </ol>
        </div>

      </div>
    </section>
  )
}
