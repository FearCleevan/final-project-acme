import PlateImage from '@/components/shared/PlateImage'
import Eyebrow from '@/components/shared/Eyebrow'
import ParallaxLayer from '@/components/home/ParallaxLayer'

export default function HeritageHero() {
  return (
    <section className="canvas-dark pt-24 pb-20 px-6">
      <div className="max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 xl:gap-20 items-center">

        {/* Text */}
        <div>
          <Eyebrow light className="mb-5">A note from the bench</Eyebrow>
          <h1
            className="font-serif font-medium text-canvas-heading leading-[0.96] mb-8"
            style={{ fontSize: 'clamp(36px, 5.5vw, 72px)' }}
          >
            A workshop that has not changed its method in 125 years.
          </h1>
          <p className="font-sans text-[17px] text-canvas-body leading-relaxed max-w-[54ch]">
            The presses still run on the original 1901 tooling. The alloy is the same. The eight-hour bench test
            has never been shortened. What has changed is only the address on the invoice.
          </p>
        </div>

        {/* Parallax plate */}
        <ParallaxLayer offset={0.25} className="rounded-sm overflow-hidden">
          <PlateImage
            alt="Pune workshop interior, brass furnaces at the lathe"
            aspectRatio="4/5"
            dark
            label="PUNE WORKSHOP · ORIGINAL PRESS SHOP · EST. 1898"
            priority
          />
        </ParallaxLayer>

      </div>
    </section>
  )
}
