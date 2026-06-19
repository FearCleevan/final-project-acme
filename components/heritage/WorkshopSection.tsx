import PlateImage from '@/components/shared/PlateImage'
import Eyebrow from '@/components/shared/Eyebrow'
import type { HeritageProofPoint } from '@/lib/types/content'

export default function WorkshopSection({
  heading,
  body1,
  body2,
  proofPoints,
  pressImageUrl,
  glasswareImageUrl,
}: {
  heading:           string
  body1:             string
  body2:             string
  proofPoints:       HeritageProofPoint[]
  pressImageUrl?:    string
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
              className="rounded-sm"
            />
            <div className="pt-10">
              <PlateImage
                src={glasswareImageUrl || undefined}
                alt="Borosilicate glass shades, India production"
                aspectRatio="3/5"
                dark
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
              {heading}
            </h2>
            <p className="font-sans text-[17px] text-canvas-body leading-relaxed mb-5">
              {body1}
            </p>
            <p className="font-sans text-[17px] text-canvas-body leading-relaxed mb-12">
              {body2}
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
