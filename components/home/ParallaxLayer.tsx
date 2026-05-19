'use client'

import { motion } from 'framer-motion'
import { useParallax } from '@/hooks/useParallax'
import { cn } from '@/lib/utils'

interface ParallaxLayerProps {
  children: React.ReactNode
  offset?: number
  className?: string
}

export default function ParallaxLayer({ children, offset = 0.3, className }: ParallaxLayerProps) {
  const { ref, y } = useParallax(offset)
  return (
    <div ref={ref} className={cn('relative overflow-hidden', className)}>
      <motion.div style={{ y, willChange: 'transform' }}>
        {children}
      </motion.div>
    </div>
  )
}
