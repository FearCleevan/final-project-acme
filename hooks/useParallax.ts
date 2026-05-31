'use client'

import { useRef } from 'react'
import { useScroll, useTransform, useSpring, MotionValue } from 'framer-motion'

export function useParallax(offset: number = 0.2): {
  ref: React.RefObject<HTMLDivElement | null>
  y: MotionValue<string>
} {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })

  const raw = useTransform(
    scrollYProgress,
    [0, 1],
    [`-${offset * 100}px`, `${offset * 100}px`]
  )

  // Spring damping makes the parallax lag slightly behind scroll —
  // much smoother and cheaper to render than raw linear tracking.
  const y = useSpring(raw, { stiffness: 60, damping: 20, mass: 0.4 }) as MotionValue<string>

  return { ref, y }
}
