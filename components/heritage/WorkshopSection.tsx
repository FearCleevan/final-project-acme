import PlateImage from '@/components/shared/PlateImage'
import Eyebrow from '@/components/shared/Eyebrow'

const proofPoints = [
  {
    n: '01.',
    title: 'Pressed on original dies',
    body: 'Eight of our nine brass parts come off tooling first cut between 1901 and 1908.',
  },
  {
    n: '02.',
    title: 'Tested for the night burn',
    body: 'Every lamp runs an 8-hour bench test on No. 2 wick before it earns its tag.',
  },
  {
    n: '03.',
    title: 'Plain paper invoice',
    body: 'A real receipt, a real return address, and a real person at the other end of the phone.',
  },
]

export default function WorkshopSection() {
  return (
    <section className="canvas-dark px-6 pb-24 border-t border-white/10">
      <div className="max-w-[1280px] mx-auto">

        <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-14 xl:gap-20 items-start mb-16">

          {/* Stacked plates */}
          <div className="grid grid-cols-2 gap-4 pt-12">
            <PlateImage
              alt="Pune brass furnaces"
              aspectRatio="3/5"
              dark
              label="BRASS FURNACE · PUNE"
              className="rounded-sm"
            />
            <div className="pt-10">
              <PlateImage
                alt="Lathe room, 1940s"
                aspectRatio="3/5"
                dark
                label="LATHE ROOM · 1940S"
                className="rounded-sm"
              />
            </div>
          </div>

          {/* Copy */}
          <div className="pt-16">
            <Eyebrow light className="mb-4">A catalog 125 years in the making</Eyebrow>
            <h2
              className="font-serif font-medium text-canvas-heading leading-tight mb-7"
              style={{ fontSize: 'clamp(24px, 3vw, 40px)' }}
            >
              Spun in Pune. Shipped from Adelaide. Wired for a longer century.
            </h2>
            <p className="font-sans text-[17px] text-canvas-body leading-relaxed mb-5">
              The Patel family has operated the Pune press shop since 1898, when the British Indian Lamp Co. closed
              and left the tooling behind. The dies stayed. The family bought them for one hundred and forty rupees
              and a promise.
            </p>
            <p className="font-sans text-[17px] text-canvas-body leading-relaxed mb-12">
              Distribution moved to Adelaide in 2003. The workshop did not. Every piece still leaves Press Shop 4
              with the same brass alloy, the same finish process, and the same hand-numbered tag.
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
