'use client'

import { useRef } from 'react'
import { useScroll, useTransform, MotionValue } from 'framer-motion'

export function useParallax(offset: number = 0.3): {
  ref: React.RefObject<HTMLDivElement | null>
  y: MotionValue<string>
} {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })
  const y = useTransform(
    scrollYProgress,
    [0, 1],
    [`-${offset * 100}px`, `${offset * 100}px`]
  )
  return { ref, y }
}
