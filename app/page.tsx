export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import HeroSection from '@/components/home/HeroSection'
import CategoryGrid from '@/components/home/CategoryGrid'
import PickedOffTheBench from '@/components/home/PickedOffTheBench'
import CategoryRows from '@/components/home/CategoryRows'
import TestimonialsWrapper from '@/components/home/TestimonialsWrapper'

export const metadata: Metadata = {
  title: 'Oil Lamp Chimneys, Shades & Enamel Signs — Acme Vintage Supply',
  description: 'Buy oil lamp chimneys, shades, pressure lamp glass, and Victorian enamel advertising signs. Bench-tested antique lamp parts shipped across Canada and North America from Dartmouth, Nova Scotia.',
  alternates: { canonical: '/' },
}

export default function Home() {
  return (
    <>
      <HeroSection />
      <CategoryGrid />
      <PickedOffTheBench />
      <CategoryRows />
      <TestimonialsWrapper />
    </>
  )
}
