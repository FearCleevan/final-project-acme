import PlateImage from '@/components/shared/PlateImage'
import Eyebrow from '@/components/shared/Eyebrow'

const proofPoints = [
  {
    n: '01.',
    title: 'Pressed on original dies',
    body: 'Our Duplex burners run off the original Birmingham tooling — over a century old and still in production.',
  },
  {
    n: '02.',
    title: 'Owned moulds, not licensed',
    body: 'Every mould and tool used in India is owned outright. Nothing is contracted out to a third-party die shop.',
  },
  {
    n: '03.',
    title: 'Borosilicate, not substitute glass',
    body: 'Shades, chimneys, and fonts are produced in borosilicate glass to the original period specification.',
  },
]

export default function WorkshopSection({
  pressImageUrl,
  glasswareImageUrl,
}: {
  pressImageUrl?:     string
  glasswareImageUrl?: string
}) {
  return (
    <section className="canvas-dark px-6 pb-24 border-t border-white/10">
      <div className="max-w-[1280px] mx-auto">

        <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-14 xl:gap-20 items-start mb-16">

          {/* Stacked plates */}
          <div className="grid grid-cols-2 gap-4 pt-12">
            <PlateImage
              src={pressImageUrl || undefined}
              alt="Original Birmingham presses on the workshop floor"
              aspectRatio="3/5"
              dark
              label="ORIGINAL BIRMINGHAM PRESS · MELBOURNE"
              className="rounded-sm"
            />
            <div className="pt-10">
              <PlateImage
                src={glasswareImageUrl || undefined}
                alt="Borosilicate glass shades, India production"
                aspectRatio="3/5"
                dark
                label="GLASSWARE · INDIA"
                className="rounded-sm"
              />
            </div>
          </div>

          {/* Copy */}
          <div className="pt-16">
            <Eyebrow light className="mb-4">A catalog built over decades</Eyebrow>
            <h2
              className="font-serif font-medium text-canvas-heading leading-tight mb-7"
              style={{ fontSize: 'clamp(24px, 3vw, 40px)' }}
            >
              Made in Melbourne &amp; India. Collected for decades. Now in North America.
            </h2>
            <p className="font-sans text-[17px] text-canvas-body leading-relaxed mb-5">
              What began as a collector's obsession became a manufacturing operation. When the components
              that made antique oil lamps worth restoring disappeared from the market, the only answer was
              to make them again — on the original tooling, with the original materials.
            </p>
            <p className="font-sans text-[17px] text-canvas-body leading-relaxed mb-12">
              Original 100-year-old Duplex presses were sourced from Birmingham and put back into production
              in Melbourne. Shades, fonts, chimneys, and glassware are manufactured in India using moulds
              owned outright — over two decades of uninterrupted production. For years these pieces supplied
              collectors in Australia. Now, for the first time, the same catalog is available in North America.
            </p>

            {/* Proof points */}
            <div className="space-y-7">
              {proofPoints.map(({ n, title, body }) => (
                <div key={n} className="flex gap-5 items-start">
                  <span className="font-mono text-[11px] text-brass tracking-eyebrow pt-1 shrink-0">{n}</span>
                  <div>
                    <p className="font-serif text-[16px] text-canvas-heading font-medium mb-1">{title}</p>
                    <p className="font-sans text-[14px] text-canvas-body leading-relaxed">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}
