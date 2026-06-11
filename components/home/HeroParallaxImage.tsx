'use client'

import { motion } from 'framer-motion'
import { useParallax } from '@/hooks/useParallax'
import PlateImage from '@/components/shared/PlateImage'

interface Props {
  src: string
  alt: string
}

export default function HeroParallaxImage({ src, alt }: Props) {
  const { ref, y } = useParallax(0.2)

  return (
    <div ref={ref} className="relative order-1 lg:order-2 overflow-hidden flex justify-center lg:justify-end">
      <motion.div
        style={{ y, willChange: 'transform' }}
        className="w-full max-w-150"
      >
        <PlateImage
          src={src}
          alt={alt}
          aspectRatio="4/5"
          dark={false}
          objectFit="cover"
          className="w-full h-auto"
          priority
        />
      </motion.div>
    </div>
  )
}
