export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import HeroSection from '@/components/home/HeroSection'
import CategoryGrid from '@/components/home/CategoryGrid'
import PickedOffTheBench from '@/components/home/PickedOffTheBench'
import CategoryRows from '@/components/home/CategoryRows'
import TestimonialsWrapper from '@/components/home/TestimonialsWrapper'

export const metadata: Metadata = {
  title: 'Oil Lamp Chimneys, Shades & Enamel Signs — Acme Vintage Supply',
  description: 'Shop authentic oil lamp chimneys, shades, pressure lamp glass, and vintage enamel signs. Bench-tested antique lamp parts shipped across Canada & North America.',
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
