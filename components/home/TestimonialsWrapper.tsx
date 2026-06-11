import TestimonialsCarousel from '@/components/home/TestimonialsCarousel'
import { getContent } from '@/lib/content'
import type { Testimonial } from '@/lib/types/content'
import fallbackData from '@/data/testimonials.json'

export default async function TestimonialsWrapper() {
  const testimonials =
    (await getContent<Testimonial[]>('testimonials')) ??
    (fallbackData as Testimonial[])

  return <TestimonialsCarousel testimonials={testimonials} />
}
