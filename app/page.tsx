import HeroSection from '@/components/home/HeroSection'
import CategoryGrid from '@/components/home/CategoryGrid'
import PickedOffTheBench from '@/components/home/PickedOffTheBench'
import TestimonialsCarousel from '@/components/home/TestimonialsCarousel'

export default function Home() {
  return (
    <>
      <HeroSection />
      <CategoryGrid />
      <PickedOffTheBench />
      <TestimonialsCarousel />
    </>
  )
}
