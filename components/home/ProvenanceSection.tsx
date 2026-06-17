import PlateImage from '@/components/shared/PlateImage'
import Eyebrow from '@/components/shared/Eyebrow'

const proofPoints = [
  {
    num: '01.',
    title: 'Pressed on original dies',
    body: 'Eight of our nine brass parts come off tooling first cut between 1901 and 1908.',
  },
  {
    num: '02.',
    title: 'Tested for the night burn',
    body: 'Every lamp runs an 8-hour bench test on No. 2 wick before it earns its tag.',
  },
  {
    num: '03.',
    title: 'Plain paper invoice',
    body: 'A real receipt, a real return address, and a real person at the other end of the phone.',
  },
]

export default function ProvenanceSection() {
  return (
    <section className="canvas-dark px-6 py-24">
      <div className="max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

        {/* Left — two plates arranged side-by-side with the second pushed down */}
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: '3fr 2fr', alignItems: 'start' }}
        >
          {/* Large plate — Workshop Interior 1940s (355x592 dimension profile) */}
          <PlateImage
            src="/assets/HeroSampleImage1.1.webp"
            alt="Original Birmingham tooling on the Melbourne workshop floor"
            aspectRatio="3/5"
            dark
          />

          {/* Smaller plate — Workshop detail */}
          <div className="pt-12">
            <PlateImage
              src="/assets/HeroSampleImage2.1.webp"
              alt="OLC press and lathe, Melbourne workshop"
              aspectRatio="4/5"
              dark
            />
          </div>
        </div>

        {/* Right — editorial copy */}
        <div>
          <Eyebrow light className="mb-5">
            A catalog 125 years in the making
          </Eyebrow>
          <h2
            className="font-serif font-medium text-canvas-heading leading-tight mb-6"
            style={{ fontSize: 'clamp(28px, 3.5vw, 48px)' }}
          >
            Made in Melbourne. On tooling that has not changed in over a century.
          </h2>
          <p className="font-sans text-[17px] text-canvas-body leading-relaxed mb-4">
            The Oil Lamp Company acquired the original 100-year-old Duplex Burner tooling —
            presses, dies, and lathes — from Birmingham, England, and shipped them to Melbourne.
            Nothing was recut. Every brass fitting in this catalog is pressed on that same original
            tooling, hand-fitted, and bench-tested before it leaves the floor.
          </p>
          <p className="font-sans text-[17px] text-canvas-body leading-relaxed mb-12">
            OLC owns the moulds and tooling for everything they manufacture — shades, fonts,
            chimneys, glassware, brassware. These pieces have supplied Australian collectors for
            over two decades. This is the first time they have crossed into North America.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {proofPoints.map(p => (
              <div key={p.num}>
                <p className="font-mono text-[11px] uppercase tracking-eyebrow text-brass mb-2">
                  {p.num}
                </p>
                <p className="font-serif text-[16px] font-medium text-canvas-heading mb-1">
                  {p.title}
                </p>
                <p className="font-sans text-[13px] text-canvas-muted leading-relaxed">
                  {p.body}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  )
}