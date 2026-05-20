import HeroSection from '@/components/home/HeroSection'
import ProvenanceSection from '@/components/home/ProvenanceSection'
import CategoryGrid from '@/components/home/CategoryGrid'
import PickedOffTheBench from '@/components/home/PickedOffTheBench'
import TestimonialsCarousel from '@/components/home/TestimonialsCarousel'

const MARQUEE_TEXT =
  'Cattaraugus Patent 1873 · Tested for the Night Burn · Bench-Numbered · Hand-Finished · Pune Workshop · Now Available in North America · Pressed on Original Dies · Plain Paper Invoice · '

export default function Home() {
  return (
    <>
      <HeroSection />

      {/* Provenance marquee strip — pure CSS, no JS */}
      <div
        className="canvas-dark py-4 overflow-hidden border-y border-white/10"
        aria-hidden="true"
      >
        <div className="marquee-track">
          {/* Duplicate the string so the loop looks seamless */}
          {[0, 1].map(i => (
            <span
              key={i}
              className="whitespace-nowrap pr-8 text-[11px] font-mono uppercase tracking-eyebrow text-brass"
            >
              {MARQUEE_TEXT}
            </span>
          ))}
        </div>
      </div>

      <ProvenanceSection />
      <CategoryGrid />
      <PickedOffTheBench />
      <TestimonialsCarousel />
    </>
  )
}
